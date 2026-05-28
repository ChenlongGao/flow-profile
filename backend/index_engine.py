"""
客流指数计算引擎
从 store_flow_data + mall_flow_daily → 计算 store_flow_index + mall_flow_index + diagnosis_records

基线策略: 用全部历史数据的均值作为基线 (baseline=100 体系)，不依赖去年同期数据
"""
import sqlite3, os
from datetime import datetime
from typing import Dict, Any

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "flow_warning.db"))


def _db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def classify_boston(mall_idx: float, store_idx: float) -> str:
    if mall_idx >= 100 and store_idx >= 100:
        return "star"
    elif mall_idx >= 100 and store_idx < 100:
        return "cash_cow"
    elif mall_idx < 100 and store_idx >= 100:
        return "question_mark"
    else:
        return "problem"


def run_index_engine() -> Dict[str, Any]:
    t0 = datetime.now()
    conn = _db()
    cur = conn.cursor()

    store_idx_count = 0
    mall_idx_count = 0
    diag_count = 0

    # ── 1. 门店指数 ──
    cur.execute("SELECT DISTINCT store_id FROM stores WHERE status='open'")
    stores = [r[0] for r in cur.fetchall()]

    # 预计算每个门店的历史均值作为基线
    store_baselines = {}
    for store_id in stores:
        cur.execute(
            "SELECT AVG(enter_count) FROM store_flow_data WHERE store_id=? AND enter_count > 0",
            (store_id,))
        avg_row = cur.fetchone()
        if avg_row and avg_row[0]:
            store_baselines[store_id] = float(avg_row[0])

    # 找最近7天有原始数据但缺指数的日期
    cur.execute("""
        SELECT DISTINCT s.data_date FROM store_flow_data s
        WHERE s.data_date > date('now','-7 days')
        AND EXISTS (SELECT 1 FROM store_flow_index si 
                    WHERE si.store_id = s.store_id AND si.calc_date = s.data_date)
        GROUP BY s.data_date
    """)
    has_index_dates = {r[0] for r in cur.fetchall()}

    cur.execute("""
        SELECT DISTINCT s.data_date FROM store_flow_data s
        WHERE s.data_date > date('now','-7 days')
        ORDER BY s.data_date
    """)
    all_recent_dates = [r[0] for r in cur.fetchall()]

    missing_store_dates = [d for d in all_recent_dates if d not in has_index_dates]

    for store_id in stores:
        baseline = store_baselines.get(store_id)
        if not baseline:
            continue
        for d in missing_store_dates:
            cur.execute("SELECT enter_count FROM store_flow_data WHERE store_id=? AND data_date=?",
                        (store_id, d))
            row = cur.fetchone()
            if not row or not row[0]:
                continue
            actual = row[0]
            if actual <= 0:
                continue

            index_val = round(actual / baseline * 100, 2)
            yoy = round((actual - baseline) / baseline * 100, 2)

            cur.execute("""INSERT OR REPLACE INTO store_flow_index
                (store_id, calc_date, index_value, baseline, actual_value, year_over_year, volatility)
                VALUES (?, ?, ?, ?, ?, ?, 0)""",
                        (store_id, d, index_val, baseline, actual, yoy))
            store_idx_count += 1

    # ── 2. 商场指数 ──
    cur.execute("SELECT DISTINCT mall_id FROM mall_flow_daily")
    malls = [r[0] for r in cur.fetchall()]

    # 预计算商场基线
    mall_baselines = {}
    for mall_id in malls:
        cur.execute(
            "SELECT AVG(visitor_count) FROM mall_flow_daily WHERE mall_id=? AND visitor_count > 0",
            (mall_id,))
        avg_row = cur.fetchone()
        if avg_row and avg_row[0]:
            mall_baselines[mall_id] = float(avg_row[0])

    # 找缺失指数的日期
    cur.execute("""
        SELECT DISTINCT m.data_date FROM mall_flow_daily m
        WHERE m.data_date > date('now','-7 days')
        AND EXISTS (SELECT 1 FROM mall_flow_index mi
                    WHERE mi.mall_id = m.mall_id AND mi.calc_date = m.data_date)
        GROUP BY m.data_date
    """)
    has_mall_idx_dates = {r[0] for r in cur.fetchall()}

    cur.execute("""
        SELECT DISTINCT m.data_date FROM mall_flow_daily m
        WHERE m.data_date > date('now','-7 days')
        ORDER BY m.data_date
    """)
    all_recent_mall_dates = [r[0] for r in cur.fetchall()]

    missing_mall_dates = [d for d in all_recent_mall_dates if d not in has_mall_idx_dates]

    for mall_id in malls:
        baseline = mall_baselines.get(mall_id)
        if not baseline:
            continue
        for d in missing_mall_dates:
            cur.execute("SELECT visitor_count FROM mall_flow_daily WHERE mall_id=? AND data_date=?", (mall_id, d))
            row = cur.fetchone()
            if not row or not row[0]:
                continue
            actual = row[0]
            if actual <= 0:
                continue

            index_val = round(actual / baseline * 100, 2)

            cur.execute("""INSERT OR REPLACE INTO mall_flow_index
                (mall_id, calc_date, index_value, baseline, actual_value)
                VALUES (?, ?, ?, ?, ?)""",
                        (mall_id, d, index_val, baseline, actual))
            mall_idx_count += 1

    # ── 3. 诊断记录（最近7天） ──
    for store_id in stores:
        cur.execute("SELECT calc_date, index_value FROM store_flow_index WHERE store_id=? ORDER BY calc_date DESC LIMIT 7",
                    (store_id,))
        si_map = {r[0]: r[1] for r in cur.fetchall()}

        cur.execute("SELECT m.mall_id FROM stores s JOIN malls m ON s.mall_id=m.id WHERE s.store_id=?",
                    (store_id,))
        mr = cur.fetchone()
        if not mr:
            continue
        mid = mr[0]

        cur.execute("SELECT calc_date, index_value FROM mall_flow_index WHERE mall_id=? ORDER BY calc_date DESC LIMIT 7",
                    (mid,))
        mi_map = {r[0]: r[1] for r in cur.fetchall()}

        for d, si_val in si_map.items():
            mi_val = mi_map.get(d)
            if mi_val is None:
                continue
            dev = round(si_val - mi_val, 2)
            quad = classify_boston(mi_val, si_val)

            cur.execute("SELECT 1 FROM diagnosis_records WHERE store_id=? AND calc_date=?", (store_id, d))
            if cur.fetchone():
                cur.execute(
                    "UPDATE diagnosis_records SET boston_x=?, boston_y=?, boston_quadrant=?, deviation=? WHERE store_id=? AND calc_date=?",
                    (mi_val, si_val, quad, dev, store_id, d))
            else:
                cur.execute(
                    "INSERT INTO diagnosis_records (store_id, calc_date, boston_x, boston_y, boston_quadrant, deviation) VALUES (?,?,?,?,?,?)",
                    (store_id, d, mi_val, si_val, quad, dev))
            diag_count += 1

    conn.commit()
    conn.close()

    elapsed = int((datetime.now() - t0).total_seconds() * 1000)
    return {
        "store_indices": store_idx_count,
        "mall_indices": mall_idx_count,
        "diagnosis": diag_count,
        "missing_store_dates": len(missing_store_dates),
        "missing_mall_dates": len(missing_mall_dates),
        "duration_ms": elapsed
    }


def sync_notifications() -> int:
    """将 alert_records 和 warning_model_alert 同步到 notifications 表"""
    conn = _db()
    cur = conn.cursor()
    count = 0

    # 指标预警 → 通知
    for r in cur.execute("""
        SELECT a.id, a.store_id, a.title, a.alert_level, a.created_at
        FROM alert_records a
        WHERE a.created_at > datetime('now', '-2 hours')
        AND a.status='pending'
    """).fetchall():
        existing = cur.execute(
            "SELECT 1 FROM notifications WHERE title=? AND created_at >= datetime('now', '-2 hours')",
            (r['title'],)
        ).fetchone()
        if not existing:
            level = 'critical' if r['alert_level'] == 'critical' else ('important' if r['alert_level'] == 'warning' else 'normal')
            cur.execute(
                "INSERT INTO notifications (store_id, title, message, level, category) VALUES (?,?,?,?,?)",
                (r['store_id'] or '', r['title'] or '', f"指标预警触发: {r['title']}", level, 'flow_warning'))
            count += 1

    # 模型预警 → 通知
    for r in cur.execute("""
        SELECT w.id, w.store_id, w.model_type, w.alert_level, w.alert_date
        FROM warning_model_alert w
        WHERE w.alert_date >= date('now', '-2 days')
        ORDER BY w.id DESC LIMIT 50
    """).fetchall():
        title = f"{r['model_type']}模型预警" if r['model_type'] else "模型预警"
        existing = cur.execute(
            "SELECT 1 FROM notifications WHERE title=? AND created_at >= datetime('now', '-2 hours')",
            (title,)
        ).fetchone()
        if not existing:
            level = 'critical' if r['alert_level'] == 'critical' else 'important'
            cur.execute(
                "INSERT INTO notifications (store_id, title, message, level, category) VALUES (?,?,?,?,?)",
                (r['store_id'] or '', title, f"模型{r['model_type']}触发{r['alert_level']}预警", level, 'flow_warning'))
            count += 1

    conn.commit()
    conn.close()
    return count


if __name__ == "__main__":
    result = run_index_engine()
    print(f"Index engine: {result}")
    n = sync_notifications()
    print(f"Synced: {n}")
