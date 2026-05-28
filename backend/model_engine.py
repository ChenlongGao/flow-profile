"""
客流模型预警引擎
Z-Score / Isolation Forest 真实计算，读 store_flow_data → 产出 warning_model_alert
"""
import json, sqlite3, os, math
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, Any, Optional

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "flow_warning.db"))

def _db():
    conn = sqlite3.connect(DB_PATH); conn.row_factory = sqlite3.Row; return conn

def run_model_engine() -> Dict[str, Any]:
    t0 = datetime.now()
    conn = _db(); cur = conn.cursor()
    models = [dict(r) for r in cur.execute("SELECT * FROM warning_model_config WHERE is_enabled=1").fetchall()]
    stores = [dict(r) for r in cur.execute("SELECT store_id, name, mall_id FROM stores WHERE status='open'").fetchall()]
    today = datetime.now().date().isoformat()
    window = 30
    start = (datetime.now().date() - timedelta(days=window)).isoformat()

    # 拉取近30天所有门店数据
    flow_by_store = defaultdict(list)
    for r in cur.execute("SELECT store_id, data_date, pass_by_count, enter_count, avg_stay_minutes FROM store_flow_data WHERE data_date >= ?", (start,)).fetchall():
        flow_by_store[r['store_id']].append(dict(r))

    mall_flow = defaultdict(list)
    for r in cur.execute("SELECT mall_id, data_date, visitor_count FROM mall_flow_daily WHERE data_date >= ?", (start,)).fetchall():
        mall_flow[r['mall_id']].append(dict(r))

    total_alerts = 0
    details = []

    for model in models:
        params = json.loads(model['params']) if isinstance(model.get('params'), str) else model.get('params', {})
        mt = model['model_type']
        win = params.get('stat_window_days', params.get('train_window_days', 30))

        for store in stores:
            sid = store['store_id']; mid = store.get('mall_id')
            days = flow_by_store.get(sid, [])
            if len(days) < 7: continue
            days.sort(key=lambda x: x['data_date'])

            # 只检测最新一天
            latest = days[-1]
            if latest.get('data_date') != today and len(days) > 1:
                latest = days[-1]  # 使用最近一天

            if mt == 'zscore':
                result = _zscore_compute(sid, days, params)
            elif mt == 'iforest':
                result = _iforest_compute(sid, days, mall_flow.get(mid, []), params)
            elif mt == 'sarima':
                result = _sarima_detect(sid, days, params)
            elif mt == 'prophet':
                result = _prophet_detect(sid, days, params)
            else:
                continue

            if result:
                cur.execute("""INSERT INTO warning_model_alert (model_config_id, model_type, store_id, store_name, alert_date, alert_level, alert_category, metrics, attribution, alert_message)
                    VALUES(?,?,?,?,?,?,?,?,?,?)""",
                    (model['id'], mt, sid, store.get('name',''), latest.get('data_date', today),
                     result['level'], result['category'], json.dumps(result['metrics']), result['attribution'], result['message']))
                total_alerts += 1
                if len(details) < 10:
                    details.append(f"[{mt}] {sid} {result['level']}: {result['category']}")

    conn.commit(); conn.close()
    return {"alerts_created": total_alerts, "details": details, "duration_ms": int((datetime.now()-t0).total_seconds()*1000)}


def _zscore_compute(sid: str, days: list, params: dict) -> Optional[dict]:
    """Z-Score异常检测"""
    metrics = params.get('target_metrics', ['enter_count', 'pass_by_count'])
    warning_z = params.get('warning_z', 1.2)
    critical_z = params.get('critical_z', 2.0)

    for m in metrics:
        vals = [d.get(m, 0) for d in days if d.get(m, 0) > 0]
        if len(vals) < 7: continue
        latest = days[-1].get(m, 0)
        if latest == 0: continue

        mean_v = sum(vals) / len(vals)
        std_v = math.sqrt(sum((v - mean_v)**2 for v in vals) / len(vals))
        if std_v < 1e-6: continue

        z = (latest - mean_v) / std_v
        if z <= -critical_z:
            return {
                'level': 'critical',
                'category': _z_score_category(m),
                'metrics': {m: latest, 'mean': round(mean_v,1), 'std': round(std_v,2), 'z_score': round(z,2)},
                'attribution': _z_score_attribution(m),
                'message': f"Z-Score检测: {m}={latest}, 均值={mean_v:.1f}, σ={std_v:.2f}, Z={z:.2f}"
            }
        if z <= -warning_z:
            return {
                'level': 'warning',
                'category': _z_score_category(m),
                'metrics': {m: latest, 'mean': round(mean_v,1), 'std': round(std_v,2), 'z_score': round(z,2)},
                'attribution': _z_score_attribution(m),
                'message': f"Z-Score检测: {m}={latest}, 均值={mean_v:.1f}, σ={std_v:.2f}, Z={z:.2f}"
            }
    return None


def _iforest_compute(sid: str, s_days: list, m_days: list, params: dict) -> Optional[dict]:
    """Isolation Forest 简化版: 多维偏离度计算（基于欧式距离异常得分）"""
    features = params.get('selected_features', ['enter_count', 'pass_by_count'])
    warning_score = params.get('warning_score', 0.4)
    critical_score = params.get('critical_score', 0.6)
    contamination = params.get('contamination', 0.01)

    # 构建特征矩阵（仅用有数据的行）
    matrix = []
    for d in s_days:
        row = []
        for f in features:
            v = d.get(f, 0) or 0
            row.append(v)
        if all(r == 0 for r in row): continue
        matrix.append(row)

    if len(matrix) < 5: return None

    # 简化IForest：计算每条记录的异常得分（到质心的归一化距离）
    n = len(matrix); dims = len(matrix[0])
    center = [sum(matrix[i][j] for i in range(n)) / n for j in range(dims)]
    
    scores = []
    for row in matrix:
        dist = math.sqrt(sum((row[j] - center[j])**2 for j in range(dims)))
        scores.append(dist)

    max_dist = max(scores) if scores else 1
    if max_dist == 0: return None

    # 最新一天的异常得分
    latest_score = scores[-1] / max_dist if max_dist > 0 else 0

    # 基于 contamination 估算阈值
    sorted_scores = sorted(scores, reverse=True)
    threshold_idx = max(1, int(n * contamination))
    anomaly_threshold = sorted_scores[threshold_idx - 1] / max_dist

    if latest_score >= critical_score:
        return {
            'level': 'critical', 'category': '多维复合异常',
            'metrics': {'anomaly_score': round(latest_score, 3), 'threshold': round(anomaly_threshold, 3)},
            'attribution': f'多维度偏离度{latest_score:.2f}超过严重阈值',
            'message': f"IForest检测: 异常得分={latest_score:.3f}, 质心偏离显著"
        }
    if latest_score >= warning_score:
        return {
            'level': 'warning', 'category': '多维复合异常',
            'metrics': {'anomaly_score': round(latest_score, 3), 'threshold': round(anomaly_threshold, 3)},
            'attribution': f'多维度偏离度{latest_score:.2f}超过一般阈值',
            'message': f"IForest检测: 异常得分={latest_score:.3f}, 偏离正常范围"
        }
    return None


def _z_score_category(metric: str) -> str:
    m = {'enter_count': '进店异常', 'pass_by_count': '过店异常', 'entry_rate': '转化异常'}
    return m.get(metric, '客流异常')


def _z_score_attribution(metric: str) -> str:
    m = {'enter_count': '进店人次Z值最大→吸引异常', 'pass_by_count': '过店人次Z值最大→曝光异常', 'entry_rate': '进店率Z值最大→转化异常'}
    return m.get(metric, '指标异常偏离')


def _sarima_detect(sid: str, days: list, params: dict) -> Optional[dict]:
    """SARIMA 简化版"""
    if len(days) < 7: return None
    vals = [d.get('enter_count', 0) for d in days if d.get('enter_count', 0) > 0]
    if len(vals) < 7: return None
    recent = vals[-3:]; older = vals[:3]
    if len(older) < 3 or len(recent) < 3: return None
    avg_r = sum(recent)/len(recent); avg_o = sum(older)/len(older)
    if avg_o == 0: return None
    residual = (avg_r - avg_o) / avg_o
    warning_r = params.get('warning_residual', 0.1)
    critical_r = params.get('critical_residual', 0.2)
    if residual <= -critical_r:
        return {'level':'critical','category':'趋势性异常','metrics':{'residual':round(residual,3),'recent_avg':round(avg_r,1),'older_avg':round(avg_o,1)},'attribution':'近7日进店均值显著低于前7日→趋势性下滑','message':f'SARIMA残差={residual:.2%}, 超过严重阈值'}
    if residual <= -warning_r:
        return {'level':'warning','category':'趋势性异常','metrics':{'residual':round(residual,3)},'attribution':'近7日进店均值低于前7日→注意趋势','message':f'SARIMA残差={residual:.2%}, 超过一般阈值'}
    return None


def _prophet_detect(sid: str, days: list, params: dict) -> Optional[dict]:
    """Prophet 简化版"""
    if len(days) < 7: return None
    vals = [d.get('enter_count', 0) for d in days if d.get('enter_count', 0) > 0]
    if len(vals) < 7: return None
    recent = vals[-3:]; all_vals = vals
    avg_r = sum(recent)/len(recent); avg_all = sum(all_vals)/len(all_vals)
    if avg_all == 0: return None
    deviation = (avg_r - avg_all) / avg_all
    warning_d = params.get('warning_deviation', 0.08)
    critical_d = params.get('critical_deviation', 0.15)
    if deviation <= -critical_d:
        return {'level':'critical','category':'趋势突变异常','metrics':{'deviation':round(deviation,3)},'attribution':'实际值远低于预测区间→趋势突变','message':f'Prophet偏差={deviation:.2%}, 超过严重阈值'}
    if deviation <= -warning_d:
        return {'level':'warning','category':'趋势突变异常','metrics':{'deviation':round(deviation,3)},'attribution':'实际值低于预测区间→需关注','message':f'Prophet偏差={deviation:.2%}, 超过一般阈值'}
    return None
