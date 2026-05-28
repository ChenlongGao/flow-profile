"""
客流指标预警引擎
读真实 store_flow_data + mall_flow_daily → 执行 alert_rules + cross_alert_rules → 产出 alert_records
"""
import json, sqlite3, os
from datetime import datetime, timedelta
from typing import List, Dict, Any

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "flow_warning.db"))

def _db():
    conn = sqlite3.connect(DB_PATH); conn.row_factory = sqlite3.Row; return conn

def run_indicator_engine() -> Dict[str, Any]:
    """执行所有指标预警规则，返回 {alerts_created, details}"""
    t0 = datetime.now()
    conn = _db()
    cur = conn.cursor()

    # 加载启用的规则
    rules = [dict(r) for r in cur.execute("SELECT * FROM alert_rules WHERE enabled=1").fetchall()]
    cross_rules = [dict(r) for r in cur.execute("SELECT * FROM cross_alert_rules WHERE is_enabled=1").fetchall()]
    stores = [dict(r) for r in cur.execute("SELECT store_id, name, mall_id FROM stores WHERE status='open'").fetchall()]
    malls = [dict(r) for r in cur.execute("SELECT mall_id FROM malls WHERE status='open'").fetchall()]

    today = datetime.now().date().isoformat()
    ma7_start = (datetime.now().date() - timedelta(days=7)).isoformat()
    ma7_end = (datetime.now().date() - timedelta(days=1)).isoformat()

    # 预拉数据：所有门店近8天的客流
    flow_by_store = {}
    for r in cur.execute("SELECT store_id, data_date, pass_by_count, enter_count, avg_stay_minutes FROM store_flow_data WHERE data_date >= ?", (ma7_start,)).fetchall():
        sid = r['store_id']; flow_by_store.setdefault(sid, []).append(dict(r))

    # 商场客流
    mall_flow = {}
    for r in cur.execute("SELECT mall_id, data_date, visitor_count FROM mall_flow_daily WHERE data_date >= ?", (ma7_start,)).fetchall():
        mid = r['mall_id']; mall_flow.setdefault(mid, []).append(dict(r))

    alerts_created = 0
    details = []

    for rule in rules:
        cond = json.loads(rule['conditions']) if isinstance(rule.get('conditions'), str) else rule.get('conditions', {})
        metric = cond.get('metric', 'enter_count')
        compare = cond.get('compare', 'ma7')
        threshold = cond.get('threshold', -0.15)
        rule_name = rule['name']

        for store in stores:
            sid = store['store_id']
            days = flow_by_store.get(sid, [])
            if len(days) < 2: continue

            days.sort(key=lambda x: x['data_date'])
            today_data = next((d for d in days if d['data_date'] == today), None)
            if not today_data: 
                today_data = days[-1]  # fallback to latest

            actual = today_data.get(metric, 0) or 0
            if actual == 0: continue

            if compare == 'ma7':
                hist = [d.get(metric, 0) for d in days if d['data_date'] < today and d.get(metric)]
                if len(hist) < 3: continue
                baseline = sum(hist) / len(hist)
                if baseline == 0: continue
                change = (actual - baseline) / baseline
            elif compare == 'absolute':
                # entry_rate = enter_count / pass_by_count
                if metric == 'entry_rate':
                    pc = today_data.get('pass_by_count', 0)
                    actual = actual / pc if pc > 0 else 0
                change = actual  # compare against absolute threshold
                threshold = threshold  # 0.05 or 0.1
            else:
                continue

            # 判断是否触发
            triggered = False
            if compare == 'ma7' and change <= threshold:
                triggered = True
            elif compare == 'absolute' and actual <= threshold:
                triggered = True

            if triggered:
                # 检查冷却：1小时内同门店同规则不重复
                cooldown_check = cur.execute(
                    "SELECT 1 FROM alert_records WHERE store_id=? AND rule_id=? AND created_at > datetime('now','-1 hour')",
                    (sid, rule['id'])).fetchone()
                if cooldown_check: continue

                cur.execute("""INSERT INTO alert_records (store_id, rule_id, source, alert_type, alert_level, title, description, metric_value, threshold_value, status)
                    VALUES(?,?,?,?,?,?,?,?,?,?)""",
                    (sid, rule['id'], 'alert_rule', metric,
                     rule.get('priority','warning'), rule_name,
                     f"指标{metric}={actual:.1f}, 阈值={threshold}", round(actual, 1), round(threshold, 3), 'pending'))
                alerts_created += 1
                details.append(f"[{rule_name}] {sid} {metric}={actual:.1f}")

    # 交叉预警规则
    for cr in cross_rules:
        store_conds = json.loads(cr['store_conditions']) if isinstance(cr.get('store_conditions'), str) else cr.get('store_conditions', [])
        mall_conds = json.loads(cr['mall_conditions']) if isinstance(cr.get('mall_conditions'), str) else cr.get('mall_conditions', [])
        logic = cr.get('cross_logic', 'and')

        for store in stores:
            sid = store['store_id']; mid = store.get('mall_id')
            s_days = flow_by_store.get(sid, [])
            m_days = mall_flow.get(mid, [])
            if len(s_days) < 3 or len(m_days) < 3: continue
            s_days.sort(key=lambda x: x['data_date']); m_days.sort(key=lambda x: x['data_date'])
            today_s = next((d for d in s_days if d['data_date'] == today), s_days[-1])
            today_m = next((d for d in m_days if d['data_date'] == today), m_days[-1])

            store_match = _check_conditions(store_conds, today_s, s_days, metric_cols=['enter_count','pass_by_count','entry_rate'])
            mall_match = _check_conditions(mall_conds, today_m, m_days, metric_cols=['visitor_count'])

            triggered = (store_match and mall_match) if logic == 'and' else (store_match or mall_match)
            if triggered:
                cur.execute("""INSERT INTO alert_records (store_id, cross_rule_id, source, alert_type, alert_level, title, description, metric_value, threshold_value, status)
                    VALUES(?,?,?,?,?,?,?,?,?,?)""",
                    (sid, cr['id'], 'cross_alert_rule', 'cross', cr.get('severity','warning'),
                     cr['name'], cr.get('description',''), 0, 0, 'pending'))
                alerts_created += 1
                details.append(f"[交叉] {cr['name']} → {sid}")

    conn.commit(); conn.close()
    return {"alerts_created": alerts_created, "details": details[:20], "duration_ms": int((datetime.now()-t0).total_seconds()*1000)}


def _check_conditions(conds: list, today: dict, history: list, metric_cols: list) -> bool:
    """检查条件列表是否全部满足"""
    if not conds: return True
    for c in conds:
        metric = c.get('metric')
        op = c.get('op', 'lt')
        compare = c.get('compare', 'ma7')
        pct = c.get('pct', 0)
        value = c.get('value', 0)

        if metric not in metric_cols and not hasattr(today, metric):
            actual = today.get(metric, 0) or 0
        else:
            actual = today.get(metric, 0) or 0

        if compare == 'ma7':
            hist = [d.get(metric, 0) for d in history if d.get('data_date') < today.get('data_date') and d.get(metric)]
            if not hist: return False
            baseline = sum(hist)/len(hist)
            if baseline == 0: return False
            change = (actual - baseline) / baseline
            if op == 'lt' and change >= pct: return False
            if op == 'gt' and change <= pct: return False
        elif compare == 'absolute':
            if op == 'lt' and actual >= value: return False
            if op == 'gt' and actual <= value: return False
    return True
