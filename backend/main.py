"""
智慧餐饮平台 - FastAPI 后端
本地开发: DB_TYPE=sqlite (默认)
Docker 部署: DB_TYPE=mysql
"""
from fastapi import FastAPI, Query, HTTPException, Body, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import json, threading, time as _time
import db
from db import get_db, row_to_dict, rows_to_list

app = FastAPI(title="智慧餐饮平台 API", version="1.0.0")

@app.on_event("startup")
def start_scheduler():
    """后台推送调度器：每60秒检查到期报告"""
    def _loop():
        _time.sleep(5)  # 等服务完全启动
        while True:
            try:
                from indicator_engine import run_indicator_engine
                from model_engine import run_model_engine
                run_indicator_engine()
                run_model_engine()
            except Exception:
                pass
            _time.sleep(60)
    t = threading.Thread(target=_loop, daemon=True)
    t.start()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════
#  全景看板 (指标预警 + 模型预警)
# ═══════════════════════════════════════════

# ═══ 系统看板（需认证） ═══
def _require_token(token: str):
    """校验token，失败抛401"""
    t = _active_tokens.get(token)
    if not t:
        raise HTTPException(401, "未登录或token无效")
    if datetime.fromisoformat(t["expires_at"]) < datetime.now():
        del _active_tokens[token]
        raise HTTPException(401, "登录已过期，请重新登录")
    return t

@app.get("/api/dashboard/overview")
def dashboard_overview(
    token: str = Query(""),
    store_id: str = Query(""),
    date_from: str = Query(""),
    date_to: str = Query(""),
    alert_source: str = Query(""),
    alert_level: str = Query(""),
):
    _require_token(token)
    conn = get_db(); cur = conn.cursor()
    today = date_to if date_to else (__import__('datetime').date.today() - __import__('datetime').timedelta(days=1)).isoformat()
    trend_start = date_from if date_from else (__import__('datetime').date.today() - __import__('datetime').timedelta(days=7)).isoformat()
    days7 = []
    d = __import__('datetime').datetime.strptime(today, '%Y-%m-%d').date()
    for i in range(6,-1,-1):
        days7.append((d - __import__('datetime').timedelta(days=i)).isoformat())

    # ── 筛选条件构造 ──
    def _where_indicator(base="1=1"):
        conds = [base]
        if store_id: conds.append(f"store_id='{store_id}'")
        if date_from: conds.append(f"date(created_at)>='{date_from}'")
        if date_to: conds.append(f"date(created_at)<='{date_to}'")
        if alert_level: conds.append(f"alert_level='{alert_level}'")
        return " AND ".join(conds)
    def _where_model(base="1=1"):
        conds = [base]
        if store_id: conds.append(f"store_id='{store_id}'")
        if date_from: conds.append(f"alert_date>='{date_from}'")
        if date_to: conds.append(f"alert_date<='{date_to}'")
        if alert_level: conds.append(f"alert_level='{alert_level}'")
        return " AND ".join(conds)

    wi = _where_indicator()
    wm = _where_model()

    # 用于JOIN查询的筛选（带表别名ar）
    def _where_ar():
        conds = ["ar.store_id IS NOT NULL"]
        if store_id: conds.append(f"ar.store_id='{store_id}'")
        if date_from: conds.append(f"date(ar.created_at)>='{date_from}'")
        if date_to: conds.append(f"date(ar.created_at)<='{date_to}'")
        if alert_level: conds.append(f"ar.alert_level='{alert_level}'")
        return " AND ".join(conds)
    w_ar = _where_ar()

    # 基础统计
    total_stores = cur.execute("SELECT COUNT(*) FROM stores WHERE status='open'").fetchone()[0]
    total_malls = cur.execute("SELECT COUNT(*) FROM malls WHERE status='open'").fetchone()[0]

    # 指标预警统计
    indicator = {"total":0, "critical":0, "warning":0, "pending":0}
    for r in cur.execute(f"SELECT alert_level, status, COUNT(*) as c FROM alert_records WHERE {wi} GROUP BY alert_level, status").fetchall():
        indicator["total"] += r['c']
        if r['alert_level']=='critical': indicator["critical"] += r['c']
        if r['alert_level']=='warning': indicator["warning"] += r['c']
        if r['status']=='pending': indicator["pending"] += r['c']

    # 模型预警统计（按筛选条件）
    model = {"total":0, "critical":0, "warning":0}
    if not alert_source or alert_source in ('','model'):
        for r in cur.execute(f"SELECT alert_level, COUNT(*) as c FROM warning_model_alert WHERE {wm} GROUP BY alert_level").fetchall():
            model["total"] += r['c']
            if r['alert_level']=='critical': model["critical"] += r['c']
            if r['alert_level']=='warning': model["warning"] += r['c']

    # 按模型分布
    model_dist = []
    if not alert_source or alert_source in ('','model'):
        for r in cur.execute(f"SELECT model_type, COUNT(*) as c, SUM(CASE WHEN alert_level='critical' THEN 1 ELSE 0 END) as cr FROM warning_model_alert WHERE {wm} GROUP BY model_type").fetchall():
            model_dist.append({"model_type":r['model_type'],"count":r['c'],"critical":r['cr'],"warning":r['c']-r['cr']})

    # 今日预警（按筛选）
    today_indicator = 0; today_model = 0; today_critical = 0; today_warning = 0
    if not alert_source or alert_source in ('','indicator'):
        today_indicator = cur.execute(f"SELECT COUNT(*) FROM alert_records WHERE date(created_at)=? AND {_where_indicator()}",(today,)).fetchone()[0]
        today_critical += cur.execute(f"SELECT COUNT(*) FROM alert_records WHERE date(created_at)=? AND alert_level='critical' AND {_where_indicator()}",(today,)).fetchone()[0]
        today_warning += cur.execute(f"SELECT COUNT(*) FROM alert_records WHERE date(created_at)=? AND alert_level='warning' AND {_where_indicator()}",(today,)).fetchone()[0]
    if not alert_source or alert_source in ('','model'):
        today_model = cur.execute(f"SELECT COUNT(*) FROM warning_model_alert WHERE alert_date=? AND {_where_model()}",(today,)).fetchone()[0]
        today_critical += cur.execute(f"SELECT COUNT(*) FROM warning_model_alert WHERE alert_date=? AND alert_level='critical' AND {_where_model()}",(today,)).fetchone()[0]
        today_warning += cur.execute(f"SELECT COUNT(*) FROM warning_model_alert WHERE alert_date=? AND alert_level='warning' AND {_where_model()}",(today,)).fetchone()[0]
    today_total = today_indicator + today_model
    today_minor = today_total - today_critical - today_warning

    # 今日预警门店数
    store_set = set()
    if not alert_source or alert_source in ('','indicator'):
        for r in cur.execute(f"SELECT DISTINCT store_id FROM alert_records WHERE date(created_at)=? AND {_where_indicator()}",(today,)).fetchall():
            store_set.add(r['store_id'])
    if not alert_source or alert_source in ('','model'):
        for r in cur.execute(f"SELECT DISTINCT store_id FROM warning_model_alert WHERE alert_date=? AND {_where_model()}",(today,)).fetchall():
            store_set.add(r['store_id'])
    today_stores = len(store_set)

    # 预警趋势（14天）
    alert_trend = []
    for d in days7:
        i_cnt = m_cnt = 0
        if not alert_source or alert_source in ('','indicator'):
            i_cnt = cur.execute(f"SELECT COUNT(*) FROM alert_records WHERE date(created_at)=? AND {_where_indicator()}",(d,)).fetchone()[0]
        if not alert_source or alert_source in ('','model'):
            m_cnt = cur.execute(f"SELECT COUNT(*) FROM warning_model_alert WHERE alert_date=? AND {_where_model()}",(d,)).fetchone()[0]
        alert_trend.append({"date":d[5:],"indicator":i_cnt,"model":m_cnt,"total":i_cnt+m_cnt})

    # 预警类型分布
    indicator_types = []
    if not alert_source or alert_source in ('','indicator'):
        for r in cur.execute(f"SELECT alert_type, COUNT(*) as c FROM alert_records WHERE {wi} GROUP BY alert_type").fetchall():
            indicator_types.append({"type":r['alert_type'],"count":r['c']})

    # 指标预警分布（按预警规则 + 交叉规则）
    indicator_dist = []
    if not alert_source or alert_source in ('','indicator'):
        for r in cur.execute(f"""SELECT ar2.name as rule_name, ar2.rule_type, COUNT(*) as c 
            FROM alert_records ar JOIN alert_rules ar2 ON ar.rule_id=ar2.id 
            WHERE {w_ar} AND ar.source='alert_rule' GROUP BY ar2.name""").fetchall():
            indicator_dist.append({"type":r['rule_name'],"count":r['c'],"rule_type":r['rule_type']})
        for r in cur.execute(f"""SELECT cr.name as rule_name, 'cross_alert' as rule_type, COUNT(*) as c 
            FROM alert_records ar JOIN cross_alert_rules cr ON ar.cross_rule_id=cr.id 
            WHERE {w_ar} AND ar.source='cross_alert_rule' GROUP BY cr.name""").fetchall():
            indicator_dist.append({"type":r['rule_name'],"count":r['c'],"rule_type":r['rule_type']})

    # 明细数据（近7天，带筛选）
    model_detail = []
    if not alert_source or alert_source in ('','model'):
        for r in cur.execute(f"SELECT model_type, store_id, store_name, alert_date, alert_level, alert_category, alert_message, is_acknowledged, created_at FROM warning_model_alert WHERE {wm} ORDER BY created_at DESC LIMIT 50").fetchall():
            model_detail.append(dict(r))
    indicator_detail = []
    if not alert_source or alert_source in ('','indicator'):
        for r in cur.execute(f"""SELECT ar.alert_type, ar.store_id, s.name as store_name, ar.alert_level, ar.title, ar.status, ar.created_at, 
            ar2.name as rule_name, ar2.rule_type
            FROM alert_records ar JOIN alert_rules ar2 ON ar.rule_id=ar2.id LEFT JOIN stores s ON ar.store_id=s.store_id 
            WHERE {w_ar} AND ar.source='alert_rule' ORDER BY ar.created_at DESC LIMIT 25""").fetchall():
            indicator_detail.append(dict(r))
        for r in cur.execute(f"""SELECT 'cross' as alert_type, ar.store_id, s.name as store_name, ar.alert_level, ar.title, ar.status, ar.created_at, 
            cr.name as rule_name, 'cross_alert' as rule_type
            FROM alert_records ar JOIN cross_alert_rules cr ON ar.cross_rule_id=cr.id LEFT JOIN stores s ON ar.store_id=s.store_id 
            WHERE {w_ar} AND ar.source='cross_alert_rule' ORDER BY ar.created_at DESC LIMIT 25""").fetchall():
            indicator_detail.append(dict(r))

    conn.close()
    return {
        "total_stores": total_stores, "total_malls": total_malls,
        "today_alerts": today_total,
        "today_indicator": today_indicator, "today_model": today_model,
        "today_critical": today_critical, "today_warning": today_warning, "today_minor": today_minor,
        "today_alerted_stores": today_stores,
        "indicator": indicator, "model": model,
        "model_distribution": model_dist,
        "indicator_distribution": indicator_dist,
        "alert_trend": alert_trend,
        "indicator_detail": indicator_detail,
        "model_detail": model_detail,
    }

@app.get("/api/dashboard/city-heatmap")
def city_heatmap(token: str = Query("")):
    _require_token(token)
    conn = get_db()
    rows = conn.execute("""
        SELECT c.name as city, COUNT(ar.id) as alert_count
        FROM alert_records ar
        JOIN stores s ON ar.store_id = s.store_id
        JOIN cities c ON s.city_id = c.id
        WHERE ar.status = 'pending'
        GROUP BY c.name
    """).fetchall()
    conn.close()
    return rows_to_list(rows)

# ═══════════════════════════════════════════
#  诊断中心
# ═══════════════════════════════════════════

@app.get("/api/diagnosis/boston-matrix")
def boston_matrix(
    calc_date: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
):
    conn = get_db()
    params = []
    where = []
    if calc_date:
        where.append("d.calc_date = ?")
        params.append(calc_date)
    if city:
        where.append("c.name = ?")
        params.append(city)
    
    where_clause = " AND ".join(where) if where else "1=1"
    
    rows = conn.execute(f"""
        SELECT d.*, s.name as store_name, s.store_id,
               c.name as city_name, bd.name as district_name,
               (SELECT SUM(enter_count) FROM store_flow_data WHERE store_id=d.store_id AND data_date=d.calc_date) as actual_flow
        FROM diagnosis_records d
        JOIN stores s ON d.store_id = s.store_id
        JOIN cities c ON s.city_id = c.id
        LEFT JOIN business_districts bd ON s.district_id = bd.id
        WHERE {where_clause}
        ORDER BY d.store_id, d.calc_date
    """, params).fetchall()
    conn.close()
    
    # For scatter plot: [x, y, storeName, flowAmount, quadrant]
    scatter_data = []
    for r in rows:
        scatter_data.append({
            "x": round(r['boston_x'], 1),
            "y": round(r['boston_y'], 1),
            "store_name": r['store_name'],
            "store_id": r['store_id'],
            "city": r['city_name'],
            "quadrant": r['boston_quadrant'],
            "deviation": r['deviation'],
            "flow": r['actual_flow'] or 0,
        })
    
    return scatter_data

@app.get("/api/diagnosis/deviation-ranking")
def deviation_ranking(
    sort_order: str = Query("asc", description="asc=负背离Top, desc=正背离Top"),
    limit: int = Query(20),
    calc_date: Optional[str] = Query(None),
):
    conn = get_db()
    order = "ASC" if sort_order == "asc" else "DESC"
    
    if calc_date:
        rows = conn.execute(f"""
            SELECT d.*, s.name as store_name, c.name as city_name, bd.name as district_name
            FROM diagnosis_records d
            JOIN stores s ON d.store_id = s.store_id
            JOIN cities c ON s.city_id = c.id
            LEFT JOIN business_districts bd ON s.district_id = bd.id
            WHERE d.calc_date = ?
            ORDER BY d.deviation {order}
            LIMIT ?
        """, (calc_date, limit)).fetchall()
    else:
        rows = conn.execute(f"""
            SELECT d.*, s.name as store_name, c.name as city_name, bd.name as district_name
            FROM diagnosis_records d
            JOIN stores s ON d.store_id = s.store_id
            JOIN cities c ON s.city_id = c.id
            LEFT JOIN business_districts bd ON s.district_id = bd.id
            ORDER BY d.deviation {order}
            LIMIT ?
        """, (limit,)).fetchall()
    conn.close()
    return rows_to_list(rows)

@app.get("/api/diagnosis/index-trend")
def index_trend(
    store_id: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
):
    conn = get_db()
    
    if store_id:
        # Single store + its mall
        store_rows = conn.execute("""
            SELECT si.calc_date, si.index_value as store_index,
                   mi.index_value as mall_index
            FROM store_flow_index si
            JOIN stores s ON si.store_id = s.store_id
            JOIN malls m ON s.mall_id = m.id
            LEFT JOIN mall_flow_index mi ON m.mall_id = mi.mall_id AND si.calc_date = mi.calc_date
            WHERE si.store_id = ?
            ORDER BY si.calc_date
        """, (store_id,)).fetchall()
        conn.close()
        return {
            "type": "single",
            "store_id": store_id,
            "data": rows_to_list(store_rows),
        }
    
    # Brand-level aggregate
    agg_rows = conn.execute("""
        SELECT calc_date, 
               AVG(index_value) as avg_index,
               AVG(year_over_year) as avg_yoy
        FROM store_flow_index
        GROUP BY calc_date
        ORDER BY calc_date
    """).fetchall()
    
    # City-level
    if city:
        city_rows = conn.execute("""
            SELECT si.calc_date, AVG(si.index_value) as avg_index
            FROM store_flow_index si
            JOIN stores s ON si.store_id = s.store_id
            JOIN cities c ON s.city_id = c.id
            WHERE c.name = ?
            GROUP BY si.calc_date
            ORDER BY si.calc_date
        """, (city,)).fetchall()
    else:
        city_rows = []
    
    conn.close()
    return {
        "type": "brand",
        "brand_trend": rows_to_list(agg_rows),
        "city_trend": rows_to_list(city_rows) if city else [],
    }

@app.get("/api/diagnosis/anomaly-stores")
def anomaly_stores():
    conn = get_db()
    # Get stores with negative deviation or very low index
    rows = conn.execute("""
        SELECT d.*, s.name as store_name, s.store_id,
               c.name as city_name, bd.name as district_name,
               (SELECT SUM(enter_count) FROM store_flow_data WHERE store_id=d.store_id AND data_date=d.calc_date) as actual_flow
        FROM diagnosis_records d
        JOIN stores s ON d.store_id = s.store_id
        JOIN cities c ON s.city_id = c.id
        LEFT JOIN business_districts bd ON s.district_id = bd.id
        WHERE d.deviation < -15 OR d.boston_y < 80
        ORDER BY d.deviation ASC
        LIMIT 50
    """).fetchall()
    conn.close()
    
    result = []
    for r in rows:
        anomaly_type = []
        if r['deviation'] and r['deviation'] < -30:
            anomaly_type.append("严重背离")
        elif r['deviation'] and r['deviation'] < -15:
            anomaly_type.append("轻微背离")
        if r['boston_y'] and r['boston_y'] < 80:
            anomaly_type.append("指数偏低")
        if r['boston_y'] and r['boston_y'] < 60:
            anomaly_type.append("指数严重偏低")
        
        result.append({
            **dict(r),
            "anomaly_types": anomaly_type,
            "severity": "critical" if r['deviation'] and r['deviation'] < -30 else "warning",
        })
    
    return result

# ═══════════════════════════════════════════
#  门店管理
# ═══════════════════════════════════════════

@app.get("/api/stores")
def list_stores(
    city: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    node_type: Optional[str] = Query(None),
    node_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    conn = get_db()
    params = []
    where = ["1=1"]
    
    if node_type and node_id:
        if node_type == "region_group":
            where.append("r.region_group_id = ?")
            params.append(node_id)
        elif node_type == "province":
            where.append("s.region_id = ?")
            params.append(node_id)
        elif node_type == "city":
            where.append("s.city_id = ?")
            params.append(node_id)
        elif node_type == "district":
            where.append("s.district_id = ?")
            params.append(node_id)
    
    if city:
        where.append("c.name = ?")
        params.append(city)
    if district:
        where.append("bd.name = ?")
        params.append(district)
    if status:
        where.append("s.status = ?")
        params.append(status)
    if search:
        where.append("(s.name LIKE ? OR s.store_id LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%"])
    
    where_clause = " AND ".join(where)
    
    total = conn.execute(f"""
        SELECT COUNT(*) FROM stores s
        JOIN cities c ON s.city_id = c.id
        LEFT JOIN business_districts bd ON s.district_id = bd.id
        LEFT JOIN regions r ON s.region_id = r.id
        LEFT JOIN region_groups rg ON r.region_group_id = rg.id
        LEFT JOIN malls m ON s.mall_id = m.id
        WHERE {where_clause}
    """, params).fetchone()[0]
    
    rows = conn.execute(f"""
        SELECT s.*, c.name as city_name, c.province as province_name,
               bd.name as district_name,
               rg.name as region_name,
               b.name as brand_name,
               m.name as mall_name,
               (SELECT index_value FROM store_flow_index WHERE store_id=s.store_id ORDER BY calc_date DESC LIMIT 1) as latest_index,
               (SELECT deviation FROM diagnosis_records WHERE store_id=s.store_id ORDER BY calc_date DESC LIMIT 1) as latest_deviation,
               (SELECT enter_count FROM store_flow_data WHERE store_id=s.store_id ORDER BY data_date DESC LIMIT 1) as latest_flow
        FROM stores s
        JOIN cities c ON s.city_id = c.id
        LEFT JOIN business_districts bd ON s.district_id = bd.id
        JOIN brands b ON s.brand_id = b.id
        LEFT JOIN regions r ON s.region_id = r.id
        LEFT JOIN region_groups rg ON r.region_group_id = rg.id
        LEFT JOIN malls m ON s.mall_id = m.id
        WHERE {where_clause}
        ORDER BY s.store_id
        LIMIT ? OFFSET ?
    """, params + [page_size, (page-1)*page_size]).fetchall()
    conn.close()
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": rows_to_list(rows),
    }

@app.get("/api/stores/{store_id}")
def store_detail(store_id: str):
    conn = get_db()
    
    store = conn.execute("""
        SELECT s.*, c.name as city_name, bd.name as district_name,
               b.name as brand_name, m.name as mall_name, m.mall_id
        FROM stores s
        JOIN cities c ON s.city_id = c.id
        LEFT JOIN business_districts bd ON s.district_id = bd.id
        JOIN brands b ON s.brand_id = b.id
        JOIN malls m ON s.mall_id = m.id
        WHERE s.store_id = ?
    """, (store_id,)).fetchone()
    
    if not store:
        conn.close()
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Flow trend
    flow_data = conn.execute("""
        SELECT data_date, enter_count, pass_by_count, avg_stay_minutes,
               male_ratio, female_ratio, age_18_24_ratio, age_25_34_ratio, age_35_44_ratio, age_45_plus_ratio
        FROM store_flow_data WHERE store_id=? ORDER BY data_date
    """, (store_id,)).fetchall()
    
    # Index trend
    index_data = conn.execute("""
        SELECT si.calc_date, si.index_value, si.year_over_year, si.volatility,
               mi.index_value as mall_index
        FROM store_flow_index si
        LEFT JOIN mall_flow_index mi ON (SELECT m.mall_id FROM stores s JOIN malls m ON s.mall_id=m.id WHERE s.store_id=?) = mi.mall_id AND si.calc_date = mi.calc_date
        WHERE si.store_id = ?
        ORDER BY si.calc_date
    """, (store_id, store_id)).fetchall()
    
    # Diagnosis
    diagnosis = conn.execute("""
        SELECT * FROM diagnosis_records WHERE store_id=? ORDER BY calc_date DESC LIMIT 1
    """, (store_id,)).fetchone()
    
    # Alerts
    alerts = conn.execute("""
        SELECT * FROM alert_records WHERE store_id=? ORDER BY created_at DESC LIMIT 10
    """, (store_id,)).fetchall()
    
    conn.close()
    
    return {
        "store": row_to_dict(store),
        "flow_data": rows_to_list(flow_data),
        "index_data": rows_to_list(index_data),
        "diagnosis": row_to_dict(diagnosis),
        "alerts": rows_to_list(alerts),
    }

# ═══════════════════════════════════════════
#  架构树形数据
# ═══════════════════════════════════════════

@app.get("/api/store-tree")
def store_tree():
    """全国 → 大区 → 省级 → 市级 → 区级 → 门店"""
    conn = get_db()
    cur = conn.cursor()
    brand = cur.execute("SELECT id, name FROM brands LIMIT 1").fetchone()
    if not brand: conn.close(); return []
    
    # 获取大区（有门店的）
    rgs = cur.execute("""
        SELECT DISTINCT rg.id, rg.name FROM region_groups rg 
        JOIN regions r ON r.region_group_id=rg.id 
        JOIN stores s ON s.region_id=r.id
        ORDER BY rg.sort_order
    """).fetchall()
    result = {"id": "root", "name": "全国门店", "type": "root", "children": []}
    
    for rg in rgs:
        rg_node = {"id": f"region_group-{rg['id']}", "name": rg['name'], "type": "region_group", "children": []}
        provinces = cur.execute("""
            SELECT DISTINCT r.id, r.name FROM regions r 
            JOIN stores s ON s.region_id=r.id 
            WHERE r.region_group_id=?
            ORDER BY r.name
        """, (rg['id'],)).fetchall()
        for prov in provinces:
            prov_node = {"id": f"province-{prov['id']}", "name": prov['name'], "type": "province", "children": []}
            cities = cur.execute("SELECT DISTINCT c.id, c.name FROM cities c JOIN stores s ON s.city_id=c.id WHERE s.region_id=? ORDER BY c.name", (prov['id'],)).fetchall()
            for city in cities:
                city_node = {"id": f"city-{city['id']}", "name": city['name'], "type": "city", "children": []}
                districts = cur.execute("SELECT DISTINCT bd.id, bd.name FROM business_districts bd JOIN stores s ON s.district_id=bd.id WHERE s.city_id=? ORDER BY bd.name", (city['id'],)).fetchall()
                if districts:
                    for dist in districts:
                        dist_node = {"id": f"district-{dist['id']}", "name": dist['name'], "type": "district", "children": []}
                        stores = cur.execute("SELECT s.store_id, s.name FROM stores s WHERE s.district_id=? ORDER BY s.name", (dist['id'],)).fetchall()
                        dist_node["children"] = rows_to_list(stores); dist_node["count"] = len(stores)
                        city_node["children"].append(dist_node)
                else:
                    stores = cur.execute("SELECT s.store_id, s.name FROM stores s WHERE s.city_id=? AND s.district_id IS NULL ORDER BY s.name", (city['id'],)).fetchall()
                    city_node["children"] = rows_to_list(stores)
                city_node["count"] = sum(c.get("count",0) for c in city_node["children"]) or len(city_node["children"])
                prov_node["children"].append(city_node)
            prov_node["count"] = sum(c.get("count",0) for c in prov_node["children"])
            rg_node["children"].append(prov_node)
        rg_node["count"] = sum(c.get("count",0) for c in rg_node["children"])
        result["children"].append(rg_node)
    
    conn.close()
    return result

@app.get("/api/store-by-node")
def stores_by_node(
    node_type: str = Query(...),
    node_id: Optional[str] = Query(None),
    page: int = Query(1),
    page_size: int = Query(20),
):
    """根据树节点获取门店列表"""
    conn = get_db()
    cur = conn.cursor()
    params = []
    where = []
    
    if node_type == "region_group" and node_id:
        where.append("r.region_group_id = ?")
        params.append(node_id)
    elif node_type == "province" and node_id:
        where.append("s.region_id = ?")
        params.append(node_id)
    elif node_type == "city" and node_id:
        where.append("s.city_id = ?")
        params.append(node_id)
    elif node_type == "district" and node_id:
        where.append("s.district_id = ?")
        params.append(node_id)
    # root → show all, store → skip
    
    where_clause = " AND ".join(where) if where else "1=1"
    
    total_from = "stores s"
    if node_type == "region_group":
        total_from = "stores s JOIN regions r ON s.region_id = r.id"
    
    total = cur.execute(f"SELECT COUNT(*) FROM {total_from} WHERE {where_clause}", params).fetchone()[0]
    rows = cur.execute(f"""
        SELECT s.store_id, s.name, s.status, s.store_type, s.lifecycle, s.business_hours,
               s.floor_position, s.store_manager, s.staff_count, s.contact_phone,
               s.area_sqm, s.opened_at, s.monthly_rent,
               c.name as city_name, c.province as province_name,
               bd.name as district_name, r.name as region_name,
               m.name as mall_name,
               (SELECT COUNT(*) FROM store_tags WHERE store_id=s.store_id) as tag_count,
               (SELECT GROUP_CONCAT(t.name || '|' || t.color, '||') FROM tags t JOIN store_tags st ON st.tag_id=t.id WHERE st.store_id=s.store_id) as tags_info
        FROM stores s
        JOIN cities c ON s.city_id = c.id
        LEFT JOIN regions r ON s.region_id = r.id
        LEFT JOIN business_districts bd ON s.district_id = bd.id
        LEFT JOIN malls m ON s.mall_id = m.id
        WHERE {where_clause}
        ORDER BY s.name
        LIMIT ? OFFSET ?
    """, params + [page_size, (page-1)*page_size]).fetchall()
    conn.close()
    return {"total": total, "page": page, "items": rows_to_list(rows)}

@app.get("/api/malls/tree")
def mall_tree():
    """全国 → 大区 → 省级 → 市级 → 区级 → 商场"""
    conn = get_db()
    cur = conn.cursor()
    # 获取大区（有商场的）
    rgs = cur.execute("""
        SELECT DISTINCT rg.id, rg.name FROM region_groups rg 
        JOIN regions r ON r.region_group_id=rg.id 
        JOIN cities c ON c.province=r.name 
        JOIN malls m ON m.city_id=c.id
        ORDER BY rg.sort_order
    """).fetchall()
    result = {"id": "root", "name": "全国商场", "type": "root", "children": []}
    for rg in rgs:
        rg_node = {"id": f"region_group-{rg['id']}", "name": rg['name'], "type": "region_group", "children": []}
        provinces = cur.execute("""
            SELECT DISTINCT r.id, r.name FROM regions r 
            JOIN cities c ON c.province=r.name 
            JOIN malls m ON m.city_id=c.id 
            WHERE r.region_group_id=?
            ORDER BY r.name
        """, (rg['id'],)).fetchall()
        for prov in provinces:
            prov_node = {"id": f"province-{prov['id']}", "name": prov['name'], "type": "province", "children": []}
            cities = cur.execute("SELECT DISTINCT c.id, c.name FROM cities c JOIN malls m ON m.city_id=c.id WHERE c.province=(SELECT name FROM regions WHERE id=?) ORDER BY c.name", (prov['id'],)).fetchall()
            for city in cities:
                city_node = {"id": f"city-{city['id']}", "name": city['name'], "type": "city", "children": []}
                districts = cur.execute("SELECT DISTINCT bd.id, bd.name FROM business_districts bd JOIN malls m ON m.district_id=bd.id WHERE m.city_id=? ORDER BY bd.name", (city['id'],)).fetchall()
                for dist in districts:
                    dist_node = {"id": f"district-{dist['id']}", "name": dist['name'], "type": "district", "children": []}
                    malls = cur.execute("""
                        SELECT m.mall_id, m.name, m.developer, m.commercial_area, m.floor_count,
                               m.annual_sales, m.daily_flow, m.avg_rent, m.vacancy_rate,
                               m.parking_spaces, m.metro_lines, m.opening_date,
                               m.address, m.phone, m.consumption_level, m.sales_tier,
                               m.building_type, m.mall_grade, m.dining_floors,
                               m.retail_ratio, m.catering_ratio, m.experience_ratio,
                               m.mall_type, m.status
                        FROM malls m WHERE m.district_id=? ORDER BY m.name
                    """, (dist['id'],)).fetchall()
                    dist_node["children"] = rows_to_list(malls); dist_node["count"] = len(malls)
                    city_node["children"].append(dist_node)
                city_node["count"] = sum(d.get("count",0) for d in city_node["children"])
                prov_node["children"].append(city_node)
            prov_node["count"] = sum(c.get("count",0) for c in prov_node["children"])
            rg_node["children"].append(prov_node)
        rg_node["count"] = sum(c.get("count",0) for c in rg_node["children"])
        result["children"].append(rg_node)
    conn.close()
    return result

@app.get("/api/malls/by-node")
def malls_by_node(
    province_id: Optional[int] = Query(None),
    city_id: Optional[int] = Query(None),
    district_id: Optional[int] = Query(None),
    page: int = Query(1),
    page_size: int = Query(20),
):
    conn = get_db()
    cur = conn.cursor()
    params = []
    where = []
    
    if province_id:
        where.append("m.city_id IN (SELECT id FROM cities WHERE province=(SELECT name FROM regions WHERE id=?))")
        params.append(province_id)
    if city_id:
        where.append("m.city_id = ?")
        params.append(city_id)
    if district_id:
        where.append("m.district_id = ?")
        params.append(district_id)
    
    where_clause = " AND ".join(where) if where else "1=1"
    total = cur.execute(f"SELECT COUNT(*) FROM malls m WHERE {where_clause}", params).fetchone()[0]
    rows = cur.execute(f"""
        SELECT m.mall_id, m.name, m.status, m.official_grade, m.industry_level, m.market_position,
               c.name as city_name, c.province as province_name, bd.name as district_name,
               mt.name as mall_type_name,
               (SELECT COUNT(*) FROM mall_tags WHERE mall_id=m.mall_id) as tag_count,
               (SELECT GROUP_CONCAT(t.name || '|' || t.color, '||') FROM tags t JOIN mall_tags mt2 ON mt2.tag_id=t.id WHERE mt2.mall_id=m.mall_id) as tags_info
        FROM malls m
        JOIN cities c ON m.city_id = c.id
        LEFT JOIN business_districts bd ON m.district_id = bd.id
        LEFT JOIN mall_type_config mt ON m.mall_type_id = mt.id
        WHERE {where_clause}
        ORDER BY m.name
        LIMIT ? OFFSET ?
    """, params + [page_size, (page-1)*page_size]).fetchall()
    conn.close()
    return {"total": total, "page": page, "items": rows_to_list(rows)}

# ═══════════════════════════════════════════
#  商场 & 商圈
# ═══════════════════════════════════════════

@app.get("/api/malls")
def list_malls(
    city: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    conn = get_db()
    params = []
    where = ["1=1"]
    
    if city:
        where.append("c.name = ?")
        params.append(city)
    if search:
        where.append("(m.name LIKE ? OR m.mall_id LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%"])
    
    where_clause = " AND ".join(where)
    
    rows = conn.execute(f"""
        SELECT m.*, c.name as city_name, bd.name as district_name,
               (SELECT index_value FROM mall_flow_index WHERE mall_id=m.mall_id ORDER BY calc_date DESC LIMIT 1) as latest_index,
               (SELECT visitor_count FROM mall_flow_daily WHERE mall_id=m.mall_id ORDER BY data_date DESC LIMIT 1) as latest_flow
        FROM malls m
        JOIN cities c ON m.city_id = c.id
        LEFT JOIN business_districts bd ON m.district_id = bd.id
        WHERE {where_clause}
        ORDER BY m.name
    """, params).fetchall()
    conn.close()
    return rows_to_list(rows)

@app.get("/api/malls/{mall_id}")
def mall_detail(mall_id: str):
    conn = get_db()
    mall = conn.execute("""
        SELECT m.*, c.name as city_name, c.province as province_name, bd.name as district_name
        FROM malls m
        JOIN cities c ON m.city_id = c.id
        LEFT JOIN business_districts bd ON m.district_id = bd.id
        WHERE m.mall_id = ?
    """, (mall_id,)).fetchone()
    if not mall:
        conn.close()
        raise HTTPException(status_code=404, detail="Mall not found")
    stores = conn.execute("""
        SELECT s.store_id, s.name, s.store_type, s.lifecycle 
        FROM stores s WHERE s.mall_id=(SELECT id FROM malls WHERE mall_id=?)
    """, (mall_id,)).fetchall()
    conn.close()
    return {"mall": row_to_dict(mall), "stores": rows_to_list(stores)}

@app.get("/api/districts")
def list_districts(
    city: Optional[str] = Query(None),
):
    conn = get_db()
    params = []
    where = []
    if city:
        where.append("c.name = ?")
        params.append(city)
    where_clause = " AND ".join(where) if where else "1=1"
    
    rows = conn.execute(f"""
        SELECT bd.*, c.name as city_name,
               COUNT(DISTINCT m.id) as mall_count,
               COUNT(DISTINCT s.id) as store_count,
               AVG(mi.index_value) as avg_mall_index,
               AVG(si.index_value) as avg_store_index
        FROM business_districts bd
        JOIN cities c ON bd.city_id = c.id
        LEFT JOIN malls m ON m.district_id = bd.id
        LEFT JOIN stores s ON s.district_id = bd.id
        LEFT JOIN mall_flow_index mi ON mi.mall_id = m.mall_id
        LEFT JOIN store_flow_index si ON si.store_id = s.store_id
        WHERE {where_clause}
        GROUP BY bd.id
        ORDER BY store_count DESC
    """, params).fetchall()
    conn.close()
    return rows_to_list(rows)

@app.get("/api/districts/{district_id}/stores")
def district_stores(
    district_id: int,
    sort_by: str = Query("index", description="index|flow|deviation"),
):
    conn = get_db()
    order_map = {
        "index": "latest_index DESC",
        "flow": "latest_flow DESC",
        "deviation": "latest_deviation DESC",
    }
    order = order_map.get(sort_by, "latest_index DESC")
    
    rows = conn.execute(f"""
        SELECT s.*, 
               (SELECT index_value FROM store_flow_index WHERE store_id=s.store_id ORDER BY calc_date DESC LIMIT 1) as latest_index,
               (SELECT enter_count FROM store_flow_data WHERE store_id=s.store_id ORDER BY data_date DESC LIMIT 1) as latest_flow,
               (SELECT deviation FROM diagnosis_records WHERE store_id=s.store_id ORDER BY calc_date DESC LIMIT 1) as latest_deviation
        FROM stores s
        WHERE s.district_id = ?
        ORDER BY {order}
    """, (district_id,)).fetchall()
    conn.close()
    return rows_to_list(rows)

@app.get("/api/districts/compare")
def district_compare(
    district_ids: Optional[str] = Query(None, description="Comma-separated district IDs"),
):
    conn = get_db()
    
    if district_ids:
        ids = [int(x) for x in district_ids.split(",")]
        placeholders = ",".join(["?"] * len(ids))
        rows = conn.execute(f"""
            SELECT bd.name, bd.id, si.calc_date, AVG(si.index_value) as avg_index
            FROM store_flow_index si
            JOIN stores s ON si.store_id = s.store_id
            JOIN business_districts bd ON s.district_id = bd.id
            WHERE bd.id IN ({placeholders})
            GROUP BY bd.id, si.calc_date
            ORDER BY si.calc_date
        """, ids).fetchall()
    else:
        # Top 5 by store count
        rows = conn.execute("""
            SELECT bd.name, bd.id, si.calc_date, AVG(si.index_value) as avg_index
            FROM store_flow_index si
            JOIN stores s ON si.store_id = s.store_id
            JOIN business_districts bd ON s.district_id = bd.id
            WHERE bd.id IN (SELECT district_id FROM stores GROUP BY district_id ORDER BY COUNT(*) DESC LIMIT 5)
            GROUP BY bd.id, si.calc_date
            ORDER BY si.calc_date
        """).fetchall()
    conn.close()
    
    # Pivot by district
    result = {}
    for r in rows:
        key = (r['id'], r['name'])
        if key not in result:
            result[key] = []
        result[key].append({"date": r['calc_date'], "value": round(r['avg_index'], 1)})
    
    return [{"district_id": k[0], "district_name": k[1], "trend": v} for k, v in result.items()]

# ═══════════════════════════════════════════
#  预警系统
# ═══════════════════════════════════════════

@app.get("/api/alerts")
def list_alerts(
    token: str = Query(""),
    level: Optional[str] = Query(None),
    status: Optional[str] = Query("pending"),
    store_id: Optional[str] = Query(None),
    page: int = Query(1),
    page_size: int = Query(20),
):
    _require_token(token)
    conn = get_db()
    params = []
    where = []
    if level:
        where.append("ar.alert_level = ?")
        params.append(level)
    if status:
        where.append("ar.status = ?")
        params.append(status)
    if store_id:
        where.append("ar.store_id = ?")
        params.append(store_id)
    where_clause = " AND ".join(where) if where else "1=1"
    
    total = conn.execute(f"SELECT COUNT(*) FROM alert_records ar WHERE {where_clause}", params).fetchone()[0]
    
    rows = conn.execute(f"""
        SELECT ar.*, s.name as store_name, c.name as city_name
        FROM alert_records ar
        LEFT JOIN stores s ON ar.store_id = s.store_id
        LEFT JOIN cities c ON s.city_id = c.id
        WHERE {where_clause}
        ORDER BY 
            CASE ar.alert_level WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
            ar.created_at DESC
        LIMIT ? OFFSET ?
    """, params + [page_size, (page-1)*page_size]).fetchall()
    conn.close()
    
    return {"total": total, "page": page, "items": rows_to_list(rows)}

@app.put("/api/alerts/{alert_id}/handle")
def handle_alert(alert_id: int, body: dict):
    conn = get_db()
    conn.execute("""
        UPDATE alert_records SET status='handled', handled_at=CURRENT_TIMESTAMP,
        handle_note=? WHERE id=?
    """, (body.get('note', ''), alert_id))
    conn.commit()
    conn.close()
    return {"success": True}

@app.get("/api/alert-rules")
def list_alert_rules():
    conn = get_db()
    rows = conn.execute("SELECT * FROM alert_rules ORDER BY priority, name").fetchall()
    conn.close()
    return rows_to_list(rows)

@app.post("/api/alert-rules")
def create_alert_rule(body: dict):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO alert_rules (name, rule_type, conditions, scope_type, scope_value, priority, notify_channels, notify_receivers, description, ai_model_id, ai_prompt_template)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        body['name'], body['rule_type'], json.dumps(body.get('conditions', {})),
        body.get('scope_type', 'global'), body.get('scope_value'),
        body.get('priority', 'warning'),
        json.dumps(body.get('notify_channels', [])),
        json.dumps(body.get('notify_receivers', [])),
        body.get('description', ''),
        body.get('ai_model_id'),
        body.get('ai_prompt_template', ''),
    ))
    conn.commit()
    rid = cur.lastrowid
    conn.close()
    return {"id": rid, "success": True}

@app.put("/api/alert-rules/{rule_id}")
def update_alert_rule(rule_id: int, body: dict):
    conn = get_db()
    fields = []
    params = []
    for key in ['name', 'rule_type', 'conditions', 'scope_type', 'scope_value', 'priority', 'enabled', 'notify_channels', 'notify_receivers', 'description', 'ai_model_id', 'ai_prompt_template']:
        if key in body:
            val = body[key]
            if key in ('conditions', 'notify_channels', 'notify_receivers'):
                val = json.dumps(val) if not isinstance(val, str) else val
            fields.append(f"{key} = ?")
            params.append(val)
    params.append(rule_id)
    conn.execute(f"UPDATE alert_rules SET {', '.join(fields)} WHERE id = ?", params)
    conn.commit()
    conn.close()
    return {"success": True}

@app.delete("/api/alert-rules/{rule_id}")
def delete_alert_rule(rule_id: int):
    conn = get_db()
    conn.execute("DELETE FROM alert_rules WHERE id = ?", (rule_id,))
    conn.commit()
    conn.close()
    return {"success": True}

# ═══ 交叉预警规则 CRUD ═══

@app.get("/api/config/cross-alert-rules")
def list_cross_alert_rules():
    conn = get_db()
    rows = conn.execute("SELECT * FROM cross_alert_rules ORDER BY severity, name").fetchall()
    conn.close()
    return rows_to_list(rows)

@app.post("/api/config/cross-alert-rules")
def create_cross_alert_rule(body: dict):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO cross_alert_rules (name, description, store_conditions, mall_conditions, cross_logic, severity, is_enabled, ai_model_id, ai_prompt_template)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        body['name'], body.get('description', ''),
        json.dumps(body.get('store_conditions', [])),
        json.dumps(body.get('mall_conditions', [])),
        body.get('cross_logic', 'and'), body.get('severity', 'warning'),
        body.get('is_enabled', 1), body.get('ai_model_id'),
        body.get('ai_prompt_template', ''),
    ))
    conn.commit()
    rid = cur.lastrowid
    conn.close()
    return {"id": rid, "success": True}

@app.put("/api/config/cross-alert-rules/{rule_id}")
def update_cross_alert_rule(rule_id: int, body: dict):
    conn = get_db()
    fields = []
    params = []
    for key in ['name', 'description', 'store_conditions', 'mall_conditions', 'cross_logic', 'severity', 'is_enabled', 'ai_model_id', 'ai_prompt_template']:
        if key in body:
            val = body[key]
            if key in ('store_conditions', 'mall_conditions'):
                val = json.dumps(val) if not isinstance(val, str) else val
            fields.append(f"{key} = ?")
            params.append(val)
    fields.append("updated_at = CURRENT_TIMESTAMP")
    params.append(rule_id)
    conn.execute(f"UPDATE cross_alert_rules SET {', '.join(fields)} WHERE id = ?", params)
    conn.commit()
    conn.close()
    return {"success": True}

@app.delete("/api/config/cross-alert-rules/{rule_id}")
def delete_cross_alert_rule(rule_id: int):
    conn = get_db()
    conn.execute("DELETE FROM cross_alert_rules WHERE id = ?", (rule_id,))
    conn.commit()
    conn.close()
    return {"success": True}

# ═══════════════════════════════════════════
#  城市 & 筛选数据
# ═══════════════════════════════════════════

@app.get("/api/meta/cities")
def get_cities():
    conn = get_db()
    rows = conn.execute("""
        SELECT c.id, c.name, COUNT(DISTINCT s.id) as store_count
        FROM cities c
        LEFT JOIN stores s ON s.city_id = c.id
        GROUP BY c.id
        ORDER BY store_count DESC
    """).fetchall()
    conn.close()
    return rows_to_list(rows)

@app.get("/api/meta/districts-by-city")
def districts_by_city(city: str = Query(...)):
    conn = get_db()
    rows = conn.execute("""
        SELECT bd.id, bd.name FROM business_districts bd
        JOIN cities c ON bd.city_id = c.id
        WHERE c.name = ?
        ORDER BY bd.name
    """, (city,)).fetchall()
    conn.close()
    return rows_to_list(rows)

# ═══════════════════════════════════════════
#  报告
# ═══════════════════════════════════════════

@app.get("/api/reports/daily-summary")
def daily_summary(report_date: Optional[str] = Query(None)):
    conn = get_db()
    cur = conn.cursor()
    
    if not report_date:
        report_date = cur.execute("SELECT MAX(data_date) FROM store_flow_data").fetchone()[0]
    
    # Flow stats
    total_flow = cur.execute("SELECT SUM(enter_count) FROM store_flow_data WHERE data_date=?", (report_date,)).fetchone()[0] or 0
    avg_stay = cur.execute("SELECT AVG(avg_stay_minutes) FROM store_flow_data WHERE data_date=?", (report_date,)).fetchone()[0] or 0
    
    # YoY comparison
    yr = int(report_date[:4])
    prev_date = f"{yr-1}{report_date[4:]}"
    prev_flow = cur.execute("SELECT SUM(enter_count) FROM store_flow_data WHERE data_date=?", (prev_date,)).fetchone()[0] or 0
    yoy_pct = round((total_flow - prev_flow) / prev_flow * 100, 1) if prev_flow else 0
    
    # Top gainers / losers
    gainers = cur.execute("""
        SELECT si.store_id, s.name as store_name, si.year_over_year as yoy,
               c.name as city_name
        FROM store_flow_index si
        JOIN stores s ON si.store_id = s.store_id
        JOIN cities c ON s.city_id = c.id
        WHERE si.calc_date = ?
        ORDER BY si.year_over_year DESC LIMIT 5
    """, (report_date,)).fetchall()
    
    losers = cur.execute("""
        SELECT si.store_id, s.name as store_name, si.year_over_year as yoy,
               c.name as city_name
        FROM store_flow_index si
        JOIN stores s ON si.store_id = s.store_id
        JOIN cities c ON s.city_id = c.id
        WHERE si.calc_date = ?
        ORDER BY si.year_over_year ASC LIMIT 5
    """, (report_date,)).fetchall()
    
    # Alert summary
    alert_count = cur.execute("SELECT COUNT(*) FROM alert_records WHERE date(created_at)=?", (report_date,)).fetchone()[0]
    
    conn.close()
    
    return {
        "report_date": report_date,
        "total_flow": total_flow,
        "avg_stay_minutes": round(avg_stay, 1),
        "yoy_change_pct": yoy_pct,
        "alert_count": alert_count,
        "top_gainers": rows_to_list(gainers),
        "top_losers": rows_to_list(losers),
    }

# ═══════════════════════════════════════════
#  配置数据
# ═══════════════════════════════════════════

@app.get("/api/config/store-types")
def get_store_types():
    conn = get_db()
    rows = conn.execute("SELECT * FROM store_type_config ORDER BY sort_order").fetchall()
    conn.close()
    return rows_to_list(rows)

@app.post("/api/config/store-types")
def create_store_type(body: dict):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO store_type_config (code, name, description, sort_order) VALUES (?,?,?,?)",
                (body['code'], body['name'], body.get('description', ''), body.get('sort_order', 0)))
    conn.commit()
    conn.close()
    return {"success": True}

@app.put("/api/config/store-types/{type_id}")
def update_store_type(type_id: int, body: dict):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE store_type_config SET name=?, description=?, sort_order=? WHERE id=?",
                (body['name'], body.get('description', ''), body.get('sort_order', 0), type_id))
    conn.commit()
    conn.close()
    return {"success": True}

@app.delete("/api/config/store-types/{type_id}")
def delete_store_type(type_id: int):
    """删除门店类型"""
    conn = get_db()
    try:
        conn.execute("DELETE FROM store_type_config WHERE id=?", (type_id,))
        conn.commit()
        return {"status": "ok"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(500, detail=str(e))
    finally: conn.close()

@app.get("/api/config/store-lifecycles")
def get_store_lifecycles():
    conn = get_db()
    rows = conn.execute("SELECT * FROM store_lifecycle_config ORDER BY sort_order").fetchall()
    conn.close()
    return rows_to_list(rows)

@app.post("/api/config/store-lifecycles")
def create_store_lifecycle(body: dict):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO store_lifecycle_config (code, name, description, sort_order, color) VALUES (?,?,?,?,?)",
                (body['code'], body['name'], body.get('description', ''), body.get('sort_order', 0), body.get('color', '#64748B')))
    conn.commit()
    conn.close()
    return {"success": True}

@app.put("/api/config/store-lifecycles/{lc_id}")
def update_store_lifecycle(lc_id: int, body: dict):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE store_lifecycle_config SET code=?, name=?, description=?, sort_order=?, color=? WHERE id=?",
                (body.get('code', body.get('name','')), body['name'], body.get('description', ''), body.get('sort_order', 0), body.get('color', '#64748B'), lc_id))
    conn.commit()
    conn.close()
    return {"success": True}

@app.delete("/api/config/store-lifecycles/{lc_id}")
def delete_store_lifecycle(lc_id: int):
    """删除门店生命周期"""
    conn = get_db()
    try:
        conn.execute("DELETE FROM store_lifecycle_config WHERE id=?", (lc_id,))
        conn.commit()
        return {"status": "ok"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(500, detail=str(e))
    finally: conn.close()

# ═══ 商场类型 & 等级配置 ═══

@app.get("/api/config/mall-types")
def get_mall_types():
    conn = get_db()
    rows = conn.execute("SELECT * FROM mall_type_config ORDER BY sort_order").fetchall()
    conn.close()
    return rows_to_list(rows)

@app.post("/api/config/mall-types")
def create_mall_type(body: dict):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO mall_type_config (code, name, official_type, radiation_range, typical_size, description, sort_order) VALUES (?,?,?,?,?,?,?)",
                (body['code'], body['name'], body.get('official_type', ''), body.get('radiation_range', ''), body.get('typical_size', ''), body.get('description', ''), body.get('sort_order', 0)))
    conn.commit()
    conn.close()
    return {"success": True}

@app.put("/api/config/mall-types/{type_id}")
def update_mall_type(type_id: int, body: dict):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE mall_type_config SET name=?, official_type=?, radiation_range=?, typical_size=?, description=?, sort_order=? WHERE id=?",
                (body['name'], body.get('official_type', ''), body.get('radiation_range', ''), body.get('typical_size', ''), body.get('description', ''), body.get('sort_order', 0), type_id))
    conn.commit()
    conn.close()
    return {"success": True}

@app.delete("/api/config/mall-types/{type_id}")
def delete_mall_type(type_id: int):
    """删除商场类型"""
    conn = get_db()
    try:
        conn.execute("DELETE FROM mall_type_config WHERE id=?", (type_id,))
        conn.commit()
        return {"status": "ok"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(500, detail=str(e))
    finally: conn.close()

@app.get("/api/config/mall-grades")
def get_mall_grades(dimension: Optional[str] = Query(None)):
    conn = get_db()
    if dimension:
        rows = conn.execute("SELECT * FROM mall_grade_config WHERE dimension=? ORDER BY sort_order", (dimension,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM mall_grade_config ORDER BY dimension, sort_order").fetchall()
    conn.close()
    return rows_to_list(rows)

# ═══ 运营级次 / 消费定位 / 销售额度 配置 ═══

def config_endpoints(table: str):
    """工厂：为 config 表生成 CRUD 端点"""
    # 由于 FastAPI 不支持动态路由工厂，这里逐个注册
    pass

@app.get("/api/config/industry-levels")
def get_industry_levels():
    conn = get_db()
    rows = conn.execute("SELECT * FROM industry_level_config ORDER BY sort_order").fetchall()
    conn.close()
    return rows_to_list(rows)

@app.post("/api/config/industry-levels")
def create_industry_level(body: dict):
    conn = get_db()
    conn.execute("INSERT INTO industry_level_config (code,name,description,typical_count,annual_sales_range,sort_order) VALUES(?,?,?,?,?,?)",
                 (body['code'],body['name'],body.get('description',''),body.get('typical_count',''),body.get('annual_sales_range',''),body.get('sort_order',0)))
    conn.commit(); conn.close()
    return {"success": True}

@app.put("/api/config/industry-levels/{item_id}")
def update_industry_level(item_id: int, body: dict):
    conn = get_db()
    conn.execute("UPDATE industry_level_config SET name=?,description=?,typical_count=?,annual_sales_range=?,sort_order=? WHERE id=?",
                 (body['name'],body.get('description',''),body.get('typical_count',''),body.get('annual_sales_range',''),body.get('sort_order',0),item_id))
    conn.commit(); conn.close()
    return {"success": True}

@app.delete("/api/config/industry-levels/{item_id}")
def delete_industry_level(item_id: int):
    """删除行业层级"""
    conn = get_db()
    try:
        conn.execute("DELETE FROM industry_level_config WHERE id=?", (item_id,))
        conn.commit()
        return {"status": "ok"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(500, detail=str(e))
    finally: conn.close()

@app.get("/api/config/market-positions")
def get_market_positions():
    conn = get_db()
    rows = conn.execute("SELECT * FROM market_position_config ORDER BY sort_order").fetchall()
    conn.close()
    return rows_to_list(rows)

@app.post("/api/config/market-positions")
def create_market_position(body: dict):
    conn = get_db()
    conn.execute("INSERT INTO market_position_config (code,name,description,sort_order) VALUES(?,?,?,?)",
                 (body['code'],body['name'],body.get('description',''),body.get('sort_order',0)))
    conn.commit(); conn.close()
    return {"success": True}

@app.put("/api/config/market-positions/{item_id}")
def update_market_position(item_id: int, body: dict):
    conn = get_db()
    conn.execute("UPDATE market_position_config SET name=?,description=?,sort_order=? WHERE id=?", (body['name'],body.get('description',''),body.get('sort_order',0),item_id))
    conn.commit(); conn.close()
    return {"success": True}

@app.delete("/api/config/market-positions/{item_id}")
def delete_market_position(item_id: int):
    """删除市场定位"""
    conn = get_db()
    try:
        conn.execute("DELETE FROM market_position_config WHERE id=?", (item_id,))
        conn.commit()
        return {"status": "ok"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(500, detail=str(e))
    finally: conn.close()

@app.get("/api/config/sales-tiers")
def get_sales_tiers():
    conn = get_db()
    rows = conn.execute("SELECT * FROM sales_tier_config ORDER BY sort_order").fetchall()
    conn.close()
    return rows_to_list(rows)

@app.post("/api/config/sales-tiers")
def create_sales_tier(body: dict):
    conn = get_db()
    conn.execute("INSERT INTO sales_tier_config (code,name,description,typical_count,sort_order) VALUES(?,?,?,?,?)",
                 (body['code'],body['name'],body.get('description',''),body.get('typical_count',''),body.get('sort_order',0)))
    conn.commit(); conn.close()
    return {"success": True}

@app.put("/api/config/sales-tiers/{item_id}")
def update_sales_tier(item_id: int, body: dict):
    conn = get_db()
    conn.execute("UPDATE sales_tier_config SET name=?,description=?,typical_count=?,sort_order=? WHERE id=?", (body['name'],body.get('description',''),body.get('typical_count',''),body.get('sort_order',0),item_id))
    conn.commit(); conn.close()
    return {"success": True}

@app.delete("/api/config/sales-tiers/{item_id}")
def delete_sales_tier(item_id: int):
    """删除销售层级"""
    conn = get_db()
    try:
        conn.execute("DELETE FROM sales_tier_config WHERE id=?", (item_id,))
        conn.commit()
        return {"status": "ok"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(500, detail=str(e))
    finally: conn.close()

# ═══ 标签系统（标签组 + 标签）═══

@app.get("/api/config/tag-groups")
def get_tag_groups():
    conn = get_db()
    rows = conn.execute("SELECT * FROM tag_groups ORDER BY sort_order").fetchall()
    conn.close()
    return rows_to_list(rows)

@app.post("/api/config/tag-groups")
def create_tag_group(body: dict):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO tag_groups (name, color, sort_order) VALUES(?,?,?)", (body['name'], body.get('color','#64748B'), body.get('sort_order',0)))
    conn.commit(); gid = cur.lastrowid; conn.close()
    return {"success": True, "id": gid}

@app.put("/api/config/tag-groups/{group_id}")
def update_tag_group(group_id: int, body: dict):
    conn = get_db()
    conn.execute("UPDATE tag_groups SET name=?,color=?,sort_order=? WHERE id=?", (body['name'],body.get('color','#64748B'),body.get('sort_order',0),group_id))
    conn.commit(); conn.close()
    return {"success": True}

@app.delete("/api/config/tag-groups/{group_id}")
def delete_tag_group(group_id: int):
    conn = get_db()
    conn.execute("DELETE FROM store_tags WHERE tag_id IN (SELECT id FROM tags WHERE group_id=?)", (group_id,))
    conn.execute("DELETE FROM mall_tags WHERE tag_id IN (SELECT id FROM tags WHERE group_id=?)", (group_id,))
    conn.execute("DELETE FROM tags WHERE group_id=?", (group_id,))
    conn.execute("DELETE FROM tag_groups WHERE id=?", (group_id,))
    conn.commit(); conn.close()
    return {"success": True}

@app.get("/api/config/tags")
def get_tags(group_id: Optional[int] = Query(None)):
    conn = get_db()
    q = "SELECT t.*, tg.name as group_name, tg.color as group_color FROM tags t LEFT JOIN tag_groups tg ON t.group_id=tg.id"
    if group_id: q += " WHERE t.group_id=? ORDER BY t.sort_order"; rows = conn.execute(q, (group_id,)).fetchall()
    else: q += " ORDER BY tg.sort_order, t.sort_order"; rows = conn.execute(q).fetchall()
    conn.close()
    return rows_to_list(rows)

@app.post("/api/config/tags")
def create_tag(body: dict):
    conn = get_db()
    cur = conn.cursor()
    cnt = cur.execute("SELECT COUNT(*) FROM tags WHERE group_id=?", (body['group_id'],)).fetchone()[0]
    if cnt >= 20: conn.close(); raise HTTPException(400, "该标签组已达上限（20个）")
    cur.execute("INSERT INTO tags (name,group_id,color,sort_order) VALUES(?,?,?,?)", (body['name'],body['group_id'],body.get('color','#64748B'),body.get('sort_order',0)))
    conn.commit(); conn.close()
    return {"success": True}

@app.put("/api/config/tags/{tag_id}")
def update_tag(tag_id: int, body: dict):
    conn = get_db()
    conn.execute("UPDATE tags SET name=?,group_id=?,color=?,sort_order=? WHERE id=?",
                 (body['name'],body['group_id'],body.get('color','#64748B'),body.get('sort_order',0),tag_id))
    conn.commit(); conn.close()
    return {"success": True}

@app.delete("/api/config/tags/{tag_id}")
def delete_tag(tag_id: int):
    conn = get_db()
    conn.execute("DELETE FROM store_tags WHERE tag_id=?", (tag_id,))
    conn.execute("DELETE FROM mall_tags WHERE tag_id=?", (tag_id,))
    conn.execute("DELETE FROM tags WHERE id=?", (tag_id,))
    conn.commit(); conn.close()
    return {"success": True}

# ═══════════════════════════════════════════
#  算法模型配置
# ═══════════════════════════════════════════

@app.get("/api/config/ai-models")
def get_ai_models():
    conn = get_db()
    rows = conn.execute("SELECT * FROM ai_model_config ORDER BY sort_order").fetchall()
    conn.close()
    return rows_to_list(rows)

@app.post("/api/config/ai-models")
def create_ai_model(body: dict):
    conn = get_db()
    cur = conn.cursor()
    # 如果设为默认，先取消其他默认
    if body.get('is_default'):
        cur.execute("UPDATE ai_model_config SET is_default=0")
    cur.execute("""
        INSERT INTO ai_model_config (name, provider, model_id, endpoint_id, api_endpoint, api_key, max_tokens, temperature, is_enabled, is_default, description, sort_order)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    """, (body['name'], body['provider'], body['model_id'], body.get('endpoint_id',''),
          body.get('api_endpoint',''),
          body.get('api_key',''), body.get('max_tokens',4096), body.get('temperature',0.7),
          body.get('is_enabled',1), body.get('is_default',0),
          body.get('description',''), body.get('sort_order',0)))
    conn.commit()
    mid = cur.lastrowid
    conn.close()
    return {"success": True, "id": mid}

@app.put("/api/config/ai-models/{model_id}")
def update_ai_model(model_id: int, body: dict):
    conn = get_db()
    # 如果设为默认，先取消其他默认
    if body.get('is_default'):
        conn.execute("UPDATE ai_model_config SET is_default=0")
    conn.execute("""
        UPDATE ai_model_config SET name=?, provider=?, model_id=?, endpoint_id=?, api_endpoint=?, api_key=?,
        max_tokens=?, temperature=?, is_enabled=?, is_default=?, description=?, sort_order=?, updated_at=CURRENT_TIMESTAMP
        WHERE id=?
    """, (body['name'], body['provider'], body['model_id'], body.get('endpoint_id',''),
          body.get('api_endpoint',''),
          body.get('api_key',''), body.get('max_tokens',4096), body.get('temperature',0.7),
          body.get('is_enabled',1), body.get('is_default',0),
          body.get('description',''), body.get('sort_order',0), model_id))
    conn.commit()
    conn.close()
    return {"success": True}

@app.delete("/api/config/ai-models/{model_id}")
def delete_ai_model(model_id: int):
    conn = get_db()
    conn.execute("DELETE FROM ai_model_config WHERE id=?", (model_id,))
    conn.commit()
    conn.close()
    return {"success": True}

@app.post("/api/config/ai-models/{model_id}/test")
def test_ai_model(model_id: int):
    """测试模型连接"""
    conn = get_db()
    m = conn.execute("SELECT * FROM ai_model_config WHERE id=?", (model_id,)).fetchone()
    conn.close()
    if not m:
        raise HTTPException(404, "模型不存在")
    # 简单测试：发一个最简请求验证连通性
    import urllib.request, json as jmod
    endpoint = m['api_endpoint']
    if not endpoint:
        return {"success": False, "message": "未配置 API 端点"}
    api_key = m['api_key'] or ''
    try:
        req = urllib.request.Request(
            f"{endpoint.rstrip('/')}/chat/completions",
            data=jmod.dumps({
                "model": m['model_id'],
                "messages": [{"role": "user", "content": "hi"}],
                "max_tokens": 10,
            }).encode(),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            method="POST",
        )
        urllib.request.urlopen(req, timeout=10).read()
        return {"success": True, "message": "连接成功"}
    except Exception as e:
        return {"success": False, "message": f"连接失败: {str(e)}"}

# ═══════════════════════════════════════════
#  客流预测模型配置
# ═══════════════════════════════════════════

@app.get("/api/config/prediction-models")
def get_prediction_models():
    conn = get_db()
    rows = conn.execute("SELECT * FROM prediction_model_config ORDER BY id").fetchall()
    conn.close()
    return rows_to_list(rows)

@app.post("/api/config/prediction-models")
def create_prediction_model(body: dict):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO prediction_model_config (name, target_fields, feature_config, prophet_params, xgboost_params, prediction_horizon, is_enabled, description)
        VALUES (?,?,?,?,?,?,?,?)
    """, (body['name'], json.dumps(body.get('target_fields', ['enter_count'])),
          json.dumps(body.get('feature_config', {})), json.dumps(body.get('prophet_params', {})),
          json.dumps(body.get('xgboost_params', {})), body.get('prediction_horizon', 7),
          body.get('is_enabled', 0), body.get('description', '')))
    conn.commit(); mid = cur.lastrowid; conn.close()
    return {"id": mid, "success": True}

@app.put("/api/config/prediction-models/{model_id}")
def update_prediction_model(model_id: int, body: dict):
    conn = get_db()
    fields = []; params = []
    for key in ['name', 'target_fields', 'feature_config', 'prophet_params', 'xgboost_params', 'prediction_horizon', 'is_enabled', 'description', 'ai_model_id', 'ai_system_prompt', 'ai_analysis_prompt']:
        if key in body:
            val = body[key]
            if key in ('target_fields', 'feature_config', 'prophet_params', 'xgboost_params'):
                val = json.dumps(val) if not isinstance(val, str) else val
            fields.append(f"{key} = ?"); params.append(val)
    fields.append("updated_at = CURRENT_TIMESTAMP"); params.append(model_id)
    conn.execute(f"UPDATE prediction_model_config SET {', '.join(fields)} WHERE id = ?", params)
    conn.commit(); conn.close()
    return {"success": True}

@app.delete("/api/config/prediction-models/{model_id}")
def delete_prediction_model(model_id: int):
    conn = get_db()
    conn.execute("DELETE FROM prediction_model_config WHERE id = ?", (model_id,)); conn.commit(); conn.close()
    return {"success": True}

# ═══ 客流预警模型配置 ═══

METHOD_MAP = {
    'zscore':'zscore', 'isolation_forest':'iforest', 'sarima_residual':'sarima', 'prophet_residual':'prophet',
}
REV_METHOD_MAP = {v:k for k,v in METHOD_MAP.items()}

def _frontend_params_to_json(method: str, body: dict) -> dict:
    """将前端老字段映射为 params JSON"""
    lookback = body.get('lookback_days', 30)
    target = body.get('target_fields', ['enter_count','pass_by_count'])
    fc = body.get('feature_config', {})
    model = METHOD_MAP.get(method, 'zscore')
    base = {'train_window_days': lookback, 'stat_window_days': lookback, 'feature_config': fc}
    if model == 'zscore':
        base.update({'partition_dims':['weekday'], 'warning_z':2.5, 'critical_z':3.5, 'outlier_filter_sigma':5, 'target_metrics': target})
    elif model == 'iforest':
        base.update({'retrain_frequency':'daily', 'contamination':0.01, 'n_estimators':200, 'warning_score':0.6, 'critical_score':0.8, 'selected_features': target})
    elif model == 'sarima':
        base.update({'retrain_frequency':'weekly', 'primary_period':7, 'warning_residual':0.2, 'critical_residual':0.3, 'use_exog':True, 'auto_arima':True})
    elif model == 'prophet':
        base.update({'retrain_frequency':'monthly', 'confidence_interval':0.95, 'warning_deviation':0.15, 'critical_deviation':0.25, 'yearly_seasonality':True, 'weekly_seasonality':True, 'holidays_enabled':True, 'custom_holidays':[]})
    return base

def _db_row_to_frontend(row: dict) -> dict:
    """将 DB 行的 params JSON 展开为前端老字段"""
    p = json.loads(row['params']) if isinstance(row.get('params'), str) else (row.get('params') or {})
    method = REV_METHOD_MAP.get(row['model_type'], row['model_type'])
    return {
        **row,
        'method': method,
        'target_fields': p.get('target_metrics', p.get('selected_features', ['enter_count','pass_by_count'])),
        'feature_config': p.get('feature_config', {}),
        'anomaly_threshold': p.get('warning_z', p.get('warning_score', p.get('warning_residual', p.get('warning_deviation', 0.05)))),
        'lookback_days': p.get('stat_window_days', p.get('train_window_days', 30)),
        'sensitivity': 'medium',
    }

@app.get("/api/config/warning-models")
def get_warning_models():
    conn = get_db()
    rows = conn.execute("SELECT * FROM warning_model_config ORDER BY id").fetchall()
    conn.close()
    return [_db_row_to_frontend(dict(r)) for r in rows]

@app.post("/api/config/warning-models")
def create_warning_model(body: dict):
    conn = get_db(); cur = conn.cursor()
    method = body.get('method', 'zscore')
    model_type = METHOD_MAP.get(method, 'zscore')
    params = _frontend_params_to_json(method, body)
    cur.execute("""INSERT INTO warning_model_config (name, model_type, params, is_enabled, description)
        VALUES (?,?,?,?,?)""",
        (body['name'], model_type, json.dumps(params), body.get('is_enabled', 0), body.get('description', '')))
    conn.commit(); mid = cur.lastrowid; conn.close()
    return {"id": mid, "success": True}

@app.put("/api/config/warning-models/{model_id}")
def update_warning_model(model_id: int, body: dict):
    conn = get_db(); fields = []; params = []
    for key in ['name', 'is_enabled', 'description']:
        if key in body: fields.append(f"{key} = ?"); params.append(body[key])
    if 'method' in body:
        model_type = METHOD_MAP.get(body['method'], 'zscore')
        fields.append("model_type = ?"); params.append(model_type)
    # 如果前端发了老字段参数，合并到 params JSON
    if any(k in body for k in ('target_fields','feature_config','anomaly_threshold','lookback_days','sensitivity')):
        existing = conn.execute("SELECT params FROM warning_model_config WHERE id=?", (model_id,)).fetchone()
        old_p = json.loads(existing['params']) if existing and existing['params'] else {}
        new_p = _frontend_params_to_json(body.get('method', REV_METHOD_MAP.get(old_p.get('model_type',''),'zscore')), body)
        old_p.update(new_p)
        fields.append("params = ?"); params.append(json.dumps(old_p))
    if not fields: conn.close(); return {"success": True}
    fields.append("updated_at = CURRENT_TIMESTAMP"); params.append(model_id)
    conn.execute(f"UPDATE warning_model_config SET {', '.join(fields)} WHERE id = ?", params)
    conn.commit(); conn.close()
    return {"success": True}

@app.delete("/api/config/warning-models/{model_id}")
def delete_warning_model(model_id: int):
    conn = get_db(); conn.execute("DELETE FROM warning_model_config WHERE id = ?",(model_id,)); conn.commit(); conn.close()
    return {"success": True}

# ═══════════════════════════════════════════
#  数据接入 — 天气 API 配置
# ═══════════════════════════════════════════

@app.get("/api/config/weather-apis")
def get_weather_apis():
    conn = get_db()
    rows = conn.execute("SELECT * FROM weather_api_config ORDER BY is_default DESC, id").fetchall()
    conn.close()
    return rows_to_list(rows)

@app.post("/api/config/weather-apis")
def create_weather_api(body: dict):
    conn = get_db()
    cur = conn.cursor()
    if body.get('is_default'):
        cur.execute("UPDATE weather_api_config SET is_default=0")
    cur.execute("""
        INSERT INTO weather_api_config (name, provider, api_key, base_url, granularity, is_enabled, is_default, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (body['name'], body['provider'], body.get('api_key', ''),
          body.get('base_url', ''), body.get('granularity', 'both'),
          body.get('is_enabled', 1), body.get('is_default', 0),
          body.get('description', '')))
    conn.commit()
    wid = cur.lastrowid
    conn.close()
    return {"id": wid, "success": True}

@app.put("/api/config/weather-apis/{api_id}")
def update_weather_api(api_id: int, body: dict):
    conn = get_db()
    if body.get('is_default'):
        conn.execute("UPDATE weather_api_config SET is_default=0")
    fields = []
    params = []
    for key in ['name', 'provider', 'api_key', 'base_url', 'granularity', 'is_enabled', 'is_default', 'description']:
        if key in body:
            fields.append(f"{key} = ?")
            params.append(body[key])
    fields.append("updated_at = CURRENT_TIMESTAMP")
    params.append(api_id)
    conn.execute(f"UPDATE weather_api_config SET {', '.join(fields)} WHERE id = ?", params)
    conn.commit()
    conn.close()
    return {"success": True}

@app.delete("/api/config/weather-apis/{api_id}")
def delete_weather_api(api_id: int):
    conn = get_db()
    conn.execute("DELETE FROM weather_api_config WHERE id = ?", (api_id,))
    conn.commit()
    conn.close()
    return {"success": True}

@app.get("/api/config/weather-apis/{api_id}/test")
def test_weather_api(api_id: int, city: str = "北京"):
    """测试天气API连接：获取城市实时天气"""
    conn = get_db()
    w = conn.execute("SELECT * FROM weather_api_config WHERE id = ?", (api_id,)).fetchone()
    conn.close()
    if not w:
        raise HTTPException(404, "配置不存在")
    if not w['api_key']:
        return {"success": False, "message": "未配置 API Key"}
    import urllib.request, json as jmod, urllib.parse, urllib.error, gzip, io
    headers = {"User-Agent": "FlowWarning/1.0"}
    def fetch(url: str):
        """请求并自动处理 gzip"""
        req = urllib.request.Request(url, headers=headers)
        resp = urllib.request.urlopen(req, timeout=10)
        body = resp.read()
        if resp.headers.get('Content-Encoding') == 'gzip' or body[:2] == b'\x1f\x8b':
            body = gzip.decompress(body)
        return jmod.loads(body)
    try:
        # 中英文城市名映射，确保显示中文
        CITY_ZH: dict = {'北京':'北京','beijing':'北京','上海':'上海','shanghai':'上海','广州':'广州','guangzhou':'广州',
            '深圳':'深圳','shenzhen':'深圳','成都':'成都','chengdu':'成都','杭州':'杭州','hangzhou':'杭州',
            '武汉':'武汉','wuhan':'武汉','南京':'南京','nanjing':'南京','重庆':'重庆','chongqing':'重庆',
            '天津':'天津','tianjin':'天津','西安':'西安',"xi'an":'西安','苏州':'苏州','suzhou':'苏州',
            '长沙':'长沙','changsha':'长沙','郑州':'郑州','zhengzhou':'郑州','青岛':'青岛','qingdao':'青岛',
            '大连':'大连','dalian':'大连','厦门':'厦门','xiamen':'厦门','宁波':'宁波','ningbo':'宁波',
            '昆明':'昆明','kunming':'昆明','贵阳':'贵阳','guiyang':'贵阳','哈尔滨':'哈尔滨','haerbin':'哈尔滨',
            '沈阳':'沈阳','shenyang':'沈阳','济南':'济南',"ji'nan":'济南','石家庄':'石家庄','shijiazhuang':'石家庄'}
        city = CITY_ZH.get(city.lower() if city else '', city)
        if w['provider'] == 'qweather':
            # 使用用户配置的 base_url，CDN 域名直接调用
            base = (w['base_url'] or '').rstrip('/')
            # 去掉末尾可能含有的 /v7，统一拼接
            if base.endswith('/v7'):
                base = base[:-3]
            # 城市→LocationID 映射（和风天气官方 ID）
            city_ids: dict = {'北京': '101010100', '上海': '101020100', '广州': '101280101',
                '深圳': '101280601', '成都': '101270101', '杭州': '101210101',
                '武汉': '101200101', '南京': '101190101', '重庆': '101040100'}
            loc = city_ids.get(city, '101010100')
            now_url = f"{base}/v7/weather/now?location={loc}&key={w['api_key']}"
            now = fetch(now_url)
            if now.get('code') == '200':
                n = now['now']
                return {"success": True, "message": f"✓ {city} 当前温度 {n['temp']}℃, {n['text']}, 湿度{n['humidity']}%",
                        "data": {"city": city, "temp": n['temp'], "weather": n['text'], "humidity": n['humidity'], "provider": "qweather"}}
            return {"success": False, "message": f"API返回: code={now.get('code')}"}
        elif w['provider'] == 'openweathermap':
            geo_url = f"https://api.openweathermap.org/geo/1.0/direct?q={urllib.parse.quote(city)}&limit=1&appid={w['api_key']}"
            req = urllib.request.Request(geo_url, headers=headers)
            geo = jmod.loads(urllib.request.urlopen(req, timeout=10).read())
            if not geo:
                return {"success": False, "message": f"未找到城市: {city}"}
            lat, lon = geo[0]['lat'], geo[0]['lon']
            now_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={w['api_key']}&units=metric&lang=zh_cn"
            req = urllib.request.Request(now_url, headers=headers)
            now = jmod.loads(urllib.request.urlopen(req, timeout=10).read())
            return {"success": True, "message": f"✓ {city} 当前温度 {now['main']['temp']}℃, {now['weather'][0]['description']}, 湿度{now['main']['humidity']}%",
                    "data": {"city": city, "temp": str(now['main']['temp']), "weather": now['weather'][0]['description'], "humidity": str(now['main']['humidity']), "provider": "openweathermap"}}
        elif w['provider'] == 'seniverse':
            now_url = f"https://api.seniverse.com/v3/weather/now.json?key={w['api_key']}&location={urllib.parse.quote(city)}&language=zh-Hans&unit=c"
            req = urllib.request.Request(now_url, headers=headers)
            data = jmod.loads(urllib.request.urlopen(req, timeout=10).read())
            if data.get('results'):
                r = data['results'][0]['now']
                return {"success": True, "message": f"✓ {city} 当前温度 {r['temperature']}℃, {r['text']}",
                        "data": {"city": city, "temp": str(r['temperature']), "weather": r['text'], "humidity": r.get('humidity', ''), "provider": "seniverse"}}
            return {"success": False, "message": "API返回数据为空"}
        return {"success": False, "message": f"不支持的供应商: {w['provider']}"}
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:200] if e.fp else ''
        return {"success": False, "message": f"HTTP {e.code}: {body}"}
    except Exception as e:
        return {"success": False, "message": f"连接失败: {str(e)}"}

# ═══════════════════════════════════════════
#  数据接入 — 中国节假日 API 配置
# ═══════════════════════════════════════════

@app.get("/api/config/holiday-apis")
def get_holiday_apis():
    conn = get_db()
    rows = conn.execute("SELECT * FROM holiday_api_config ORDER BY is_default DESC, id").fetchall()
    conn.close()
    return rows_to_list(rows)

@app.post("/api/config/holiday-apis")
def create_holiday_api(body: dict):
    conn = get_db()
    cur = conn.cursor()
    if body.get('is_default'):
        cur.execute("UPDATE holiday_api_config SET is_default=0")
    cur.execute("""
        INSERT INTO holiday_api_config (name, provider, api_key, base_url, is_enabled, is_default, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (body['name'], body['provider'], body.get('api_key', ''),
          body.get('base_url', ''), body.get('is_enabled', 1),
          body.get('is_default', 0), body.get('description', '')))
    conn.commit()
    hid = cur.lastrowid
    conn.close()
    return {"id": hid, "success": True}

@app.put("/api/config/holiday-apis/{api_id}")
def update_holiday_api(api_id: int, body: dict):
    conn = get_db()
    if body.get('is_default'):
        conn.execute("UPDATE holiday_api_config SET is_default=0")
    fields = []
    params = []
    for key in ['name', 'provider', 'api_key', 'base_url', 'is_enabled', 'is_default', 'description']:
        if key in body:
            fields.append(f"{key} = ?")
            params.append(body[key])
    fields.append("updated_at = CURRENT_TIMESTAMP")
    params.append(api_id)
    conn.execute(f"UPDATE holiday_api_config SET {', '.join(fields)} WHERE id = ?", params)
    conn.commit()
    conn.close()
    return {"success": True}

@app.delete("/api/config/holiday-apis/{api_id}")
def delete_holiday_api(api_id: int):
    conn = get_db()
    conn.execute("DELETE FROM holiday_api_config WHERE id = ?", (api_id,))
    conn.commit()
    conn.close()
    return {"success": True}

@app.get("/api/config/holiday-apis/{api_id}/test")
def test_holiday_api(api_id: int):
    """测试节假日API连接"""
    conn = get_db()
    h = conn.execute("SELECT * FROM holiday_api_config WHERE id = ?", (api_id,)).fetchone()
    conn.close()
    if not h:
        raise HTTPException(404, "配置不存在")
    import urllib.request, json as jmod
    try:
        if h['provider'] == 'timor':
            # Timor免费API无需Key，需要User-Agent
            req = urllib.request.Request("https://timor.tech/api/holiday/year/2026", headers={"User-Agent": "FlowWarning/1.0"})
            data = jmod.loads(urllib.request.urlopen(req, timeout=10).read())
            if data.get('code') == 0:
                holidays = data.get('holiday', {})
                count = len([d for d in holidays.values() if d.get('holiday')])
                return {"success": True, "message": f"✓ 2026年共有 {count} 个节假日"}
            return {"success": False, "message": f"API返回异常: code={data.get('code')}"}
        elif h['provider'] == 'tianapi':
            if not h['api_key']:
                return {"success": False, "message": "未配置 API Key"}
            url = f"https://apis.tianapi.com/jiejiari/index?key={h['api_key']}&date=2026-01-01"
            data = jmod.loads(urllib.request.urlopen(url, timeout=10).read())
            if data.get('code') == 200:
                return {"success": True, "message": f"✓ 天行数据节假日API连接正常"}
            return {"success": False, "message": f"API返回: {data.get('msg','未知错误')}"}
        return {"success": False, "message": f"不支持的供应商: {h['provider']}"}
    except Exception as e:
        return {"success": False, "message": f"连接失败: {str(e)}"}


# ─── 天气/假日 同步日志 ───

@app.get("/api/config/weather-apis/logs")
def weather_sync_logs(limit: int = 30):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM api_sync_logs WHERE source_type='weather' ORDER BY created_at DESC LIMIT ?",
        (limit,)
    ).fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]

@app.post("/api/config/weather-apis/{api_id}/sync")
def sync_weather_api(api_id: int):
    import time, datetime
    start = time.time()
    conn = get_db()
    api_cfg = conn.execute("SELECT * FROM weather_api_config WHERE id = ?", (api_id,)).fetchone()
    if not api_cfg:
        conn.close()
        raise HTTPException(404, "配置不存在")
    
    fetched = 0; inserted = 0; updated = 0; status = "success"; error_msg = ""
    try:
        city = "北京"
        if api_cfg['provider'] == 'qweather':
            import urllib.request, json as jmod
            url = f"https://devapi.qweather.com/v7/weather/7d?location=101010100&key={api_cfg['api_key']}"
            data = jmod.loads(urllib.request.urlopen(url, timeout=10).read())
            if data.get('code') == '200':
                daily = data.get('daily', [])
                for day in daily:
                    conn.execute("""
                        INSERT OR REPLACE INTO weather_data (city, data_date, temp_high, temp_low, weather, wind_dir, wind_scale, humidity, source)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'qweather')
                    """, (city, day['fxDate'], day['tempMax'], day['tempMin'], day['textDay'],
                          day.get('windDirDay',''), day.get('windScaleDay',''), day.get('humidity','')))
                fetched = len(daily); inserted = fetched
            else:
                status = "failed"; error_msg = f"API返回: code={data.get('code')}"
        elif api_cfg['provider'] == 'openweathermap':
            import urllib.request, json as jmod
            url = f"https://api.openweathermap.org/data/3.0/onecall?lat=39.9&lon=116.4&appid={api_cfg['api_key']}&units=metric"
            data = jmod.loads(urllib.request.urlopen(url, timeout=10).read())
            if 'daily' in data:
                for day in data['daily']:
                    dt = datetime.datetime.fromtimestamp(day['dt']).strftime('%Y-%m-%d')
                    conn.execute("""
                        INSERT OR REPLACE INTO weather_data (city, data_date, temp_high, temp_low, weather, humidity, source)
                        VALUES (?, ?, ?, ?, ?, ?, 'openweathermap')
                    """, (city, dt, round(day['temp']['max']), round(day['temp']['min']),
                          day['weather'][0]['main'], day.get('humidity', '')))
                fetched = len(data['daily']); inserted = fetched
            else:
                status = "failed"; error_msg = "API返回无daily字段"
        else:
            fetched = 0; status = "success"; error_msg = "同步配置已记录（需自定义实现拉取逻辑）"
        
        conn.execute("UPDATE weather_api_config SET last_sync_at = datetime('now','localtime'), last_sync_status = ? WHERE id = ?",
                     (status, api_id))
    except Exception as e:
        status = "failed"; error_msg = str(e)
    finally:
        duration = int((time.time() - start) * 1000)
        conn.execute(
            "INSERT INTO api_sync_logs (source_type, api_config_id, api_config_name, status, records_fetched, records_inserted, records_updated, duration_ms, error_message) VALUES (?,?,?,?,?,?,?,?,?)",
            ("weather", api_id, api_cfg['name'], status, fetched, inserted, updated, duration, error_msg[:500] if error_msg else "")
        )
        conn.commit()
        conn.close()
    return {"fetched": fetched, "inserted": inserted, "updated": updated, "status": status}

@app.get("/api/config/holiday-apis/logs")
def holiday_sync_logs(limit: int = 30):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM api_sync_logs WHERE source_type='holiday' ORDER BY created_at DESC LIMIT ?",
        (limit,)
    ).fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]

@app.post("/api/config/holiday-apis/{api_id}/sync")
def sync_holiday_api(api_id: int):
    import time, datetime
    start = time.time()
    conn = get_db()
    api_cfg = conn.execute("SELECT * FROM holiday_api_config WHERE id = ?", (api_id,)).fetchone()
    if not api_cfg:
        conn.close()
        raise HTTPException(404, "配置不存在")
    
    fetched = 0; inserted = 0; updated = 0; status = "success"; error_msg = ""
    try:
        if api_cfg['provider'] == 'timor':
            import urllib.request, json as jmod
            req = urllib.request.Request("https://timor.tech/api/holiday/year/2026", headers={"User-Agent": "FlowWarning/1.0"})
            data = jmod.loads(urllib.request.urlopen(req, timeout=10).read())
            if data.get('code') == 0:
                holidays = data.get('holiday', {})
                for date_key, info in holidays.items():
                    if info.get('holiday'):
                        conn.execute("""
                            INSERT OR REPLACE INTO holiday_data (holiday_date, holiday_name, is_holiday, source)
                            VALUES (?, ?, 1, 'timor')
                        """, (date_key, info['holiday']))
                fetched = len([d for d in holidays.values() if d.get('holiday')])
                inserted = fetched
        elif api_cfg['provider'] == 'tianapi':
            if not api_cfg['api_key']:
                status = "failed"; error_msg = "未配置 API Key"
            else:
                import urllib.request, json as jmod
                url = f"https://apis.tianapi.com/jiejiari/index?key={api_cfg['api_key']}&date=2026-01-01"
                data = jmod.loads(urllib.request.urlopen(url, timeout=10).read())
                if data.get('code') == 200:
                    fetched = 1; inserted = 1
                else:
                    status = "failed"; error_msg = data.get('msg', '未知错误')
        else:
            fetched = 0; status = "success"; error_msg = "同步配置已记录（需自定义实现拉取逻辑）"
        
        conn.execute("UPDATE holiday_api_config SET last_sync_at = datetime('now','localtime'), last_sync_status = ? WHERE id = ?",
                     (status, api_id))
    except Exception as e:
        status = "failed"; error_msg = str(e)
    finally:
        duration = int((time.time() - start) * 1000)
        conn.execute(
            "INSERT INTO api_sync_logs (source_type, api_config_id, api_config_name, status, records_fetched, records_inserted, records_updated, duration_ms, error_message) VALUES (?,?,?,?,?,?,?,?,?)",
            ("holiday", api_id, api_cfg['name'], status, fetched, inserted, updated, duration, error_msg[:500] if error_msg else "")
        )
        conn.commit()
        conn.close()
    return {"fetched": fetched, "inserted": inserted, "updated": updated, "status": status}


# ─── 视频数据接入 API ───

@app.get("/api/config/video-apis")
def get_video_apis():
    conn = get_db()
    rows = conn.execute("SELECT * FROM video_api_config ORDER BY id DESC").fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]

@app.post("/api/config/video-apis")
def create_video_api(body: dict = Body(...)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO video_api_config (name, provider, api_key, base_url, is_enabled, is_default, description) VALUES (?,?,?,?,?,?,?)",
        (body['name'], body.get('provider',''), body.get('api_key',''), body.get('base_url',''),
         body.get('is_enabled',1), body.get('is_default',0), body.get('description',''))
    )
    conn.commit()
    cid = cur.lastrowid
    conn.close()
    return {"id": cid}

@app.put("/api/config/video-apis/{api_id}")
def update_video_api(api_id: int, body: dict = Body(...)):
    conn = get_db()
    fields = []; params = []
    for k in ['name','provider','api_key','base_url','is_enabled','is_default','description','last_sync_at','last_sync_status']:
        if k in body:
            fields.append(f"{k}=?"); params.append(body[k])
    if fields:
        params.append(api_id)
        conn.execute(f"UPDATE video_api_config SET {','.join(fields)}, updated_at=datetime('now','localtime') WHERE id=?", params)
        conn.commit()
    conn.close()
    return {"ok": True}

@app.delete("/api/config/video-apis/{api_id}")
def delete_video_api(api_id: int):
    conn = get_db()
    conn.execute("DELETE FROM video_api_config WHERE id=?", (api_id,))
    conn.commit()
    conn.close()
    return {"ok": True}

@app.get("/api/config/video-apis/{api_id}/test")
def test_video_api(api_id: int):
    conn = get_db()
    v = conn.execute("SELECT * FROM video_api_config WHERE id=?", (api_id,)).fetchone()
    conn.close()
    if not v:
        raise HTTPException(404, "配置不存在")
    try:
        import urllib.request
        url = v['base_url'] or "https://api.example.com/video"
        req = urllib.request.Request(url)
        urllib.request.urlopen(req, timeout=10)
        return {"success": True, "message": "✓ 连接正常"}
    except Exception as e:
        return {"success": False, "message": f"连接失败: {str(e)}"}

@app.get("/api/config/video-apis/logs")
def video_sync_logs(limit: int = 30):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM api_sync_logs WHERE source_type='video' ORDER BY created_at DESC LIMIT ?",
        (limit,)
    ).fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]

@app.post("/api/config/video-apis/{api_id}/sync")
def sync_video_api(api_id: int):
    import time
    start = time.time()
    conn = get_db()
    api_cfg = conn.execute("SELECT * FROM video_api_config WHERE id=?", (api_id,)).fetchone()
    if not api_cfg:
        conn.close()
        raise HTTPException(404, "配置不存在")
    
    fetched = 0; inserted = 0; updated = 0; status = "success"; error_msg = ""
    try:
        # 视频数据同步：根据供应商拉取视频巡检数据
        fetched = 0; status = "success"; error_msg = "同步配置已记录（需实现具体视频平台数据拉取）"
        conn.execute("UPDATE video_api_config SET last_sync_at=datetime('now','localtime'), last_sync_status=? WHERE id=?",
                     (status, api_id))
    except Exception as e:
        status = "failed"; error_msg = str(e)
    finally:
        duration = int((time.time() - start) * 1000)
        conn.execute(
            "INSERT INTO api_sync_logs (source_type, api_config_id, api_config_name, status, records_fetched, records_inserted, records_updated, duration_ms, error_message) VALUES (?,?,?,?,?,?,?,?,?)",
            ("video", api_id, api_cfg['name'], status, fetched, inserted, updated, duration, error_msg[:500] if error_msg else "")
        )
        conn.commit()
        conn.close()
    return {"fetched": fetched, "inserted": inserted, "updated": updated, "status": status}


@app.get("/api/stores/{store_id}/tags")
def get_store_tags(store_id: str):
    conn = get_db()
    rows = conn.execute("SELECT t.* FROM tags t JOIN store_tags st ON st.tag_id=t.id WHERE st.store_id=? ORDER BY t.sort_order", (store_id,)).fetchall()
    conn.close()
    return rows_to_list(rows)

@app.post("/api/stores/{store_id}/tags")
def add_store_tag(store_id: str, body: dict):
    conn = get_db()
    conn.execute("INSERT OR IGNORE INTO store_tags (store_id, tag_id) VALUES(?,?)", (store_id, body['tag_id']))
    conn.commit(); conn.close()
    return {"success": True}

@app.delete("/api/stores/{store_id}/tags/{tag_id}")
def remove_store_tag(store_id: str, tag_id: int):
    conn = get_db()
    conn.execute("DELETE FROM store_tags WHERE store_id=? AND tag_id=?", (store_id, tag_id))
    conn.commit(); conn.close()
    return {"success": True}

@app.get("/api/malls/{mall_id}/tags")
def get_mall_tags(mall_id: str):
    conn = get_db()
    rows = conn.execute("SELECT t.* FROM tags t JOIN mall_tags mt ON mt.tag_id=t.id WHERE mt.mall_id=? ORDER BY t.sort_order", (mall_id,)).fetchall()
    conn.close()
    return rows_to_list(rows)

@app.post("/api/malls/{mall_id}/tags")
def add_mall_tag(mall_id: str, body: dict):
    conn = get_db()
    conn.execute("INSERT OR IGNORE INTO mall_tags (mall_id, tag_id) VALUES(?,?)", (mall_id, body['tag_id']))
    conn.commit(); conn.close()
    return {"success": True}

@app.delete("/api/malls/{mall_id}/tags/{tag_id}")
def remove_mall_tag(mall_id: str, tag_id: int):
    conn = get_db()
    conn.execute("DELETE FROM mall_tags WHERE mall_id=? AND tag_id=?", (mall_id, tag_id))
    conn.commit(); conn.close()
    return {"success": True}

# ═══ 客流分析 API ═══

@app.get("/api/flow/store-overview")
def store_flow_overview(store_id: str = Query(...)):
    conn = get_db()
    cur = conn.cursor()
    # Metric cards
    latest = cur.execute("SELECT * FROM store_flow_data WHERE store_id=? ORDER BY data_date DESC LIMIT 1", (store_id,)).fetchone()
    if not latest: conn.close(); return {}
    
    prev_yr = cur.execute("SELECT * FROM store_flow_data WHERE store_id=? AND data_date = (SELECT MAX(data_date) FROM store_flow_data WHERE store_id=? AND data_date < ?)", (store_id, store_id, latest['data_date'])).fetchone()
    
    all_data = cur.execute("SELECT data_date, enter_count, pass_by_count, avg_stay_minutes FROM store_flow_data WHERE store_id=? ORDER BY data_date", (store_id,)).fetchall()
    
    store_name = cur.execute("SELECT s.name, c.name as city, m.name as mall FROM stores s JOIN cities c ON s.city_id=c.id LEFT JOIN malls m ON s.mall_id=m.id WHERE s.store_id=?", (store_id,)).fetchone()
    
    conn.close()
    return {
        "store": row_to_dict(store_name) if store_name else {},
        "latest": row_to_dict(latest),
        "prev_year": row_to_dict(prev_yr) if prev_yr else None,
        "trend": rows_to_list(all_data),
        "yoy_change": round((latest['enter_count'] - prev_yr['enter_count'])/prev_yr['enter_count']*100,1) if prev_yr and prev_yr['enter_count'] else 0,
    }

@app.get("/api/flow/store-compare")
def store_flow_compare(store_ids: str = Query(...)):
    """多门店客流对比"""
    conn = get_db()
    ids = [s.strip() for s in store_ids.split(',')]
    result = []
    for sid in ids[:5]:
        store = conn.execute("SELECT name FROM stores WHERE store_id=?", (sid,)).fetchone()
        if not store: continue
        data = conn.execute("SELECT data_date, enter_count FROM store_flow_data WHERE store_id=? ORDER BY data_date", (sid,)).fetchall()
        result.append({"store_id": sid, "name": store['name'], "data": rows_to_list(data)})
    conn.close()
    return result

@app.get("/api/flow/store-profile")
def store_flow_profile(store_id: str = Query(...)):
    """门店画像数据"""
    conn = get_db()
    cur = conn.cursor()
    # Latest demographics
    profile = cur.execute("SELECT data_date, male_ratio, female_ratio, age_18_24_ratio, age_25_34_ratio, age_35_44_ratio, age_45_plus_ratio FROM store_flow_data WHERE store_id=? ORDER BY data_date", (store_id,)).fetchall()
    conn.close()
    return {
        "store_id": store_id,
        "profile": rows_to_list(profile),
    }

@app.get("/api/flow/store-ranking")
def store_flow_ranking(
    token: str = Query(""),
    sort_by: str = Query("enter_count", description="enter_count|avg_stay|yoy"),
    limit: int = Query(20),
    order: str = Query("desc"),
):
    _require_token(token)
    conn = get_db()
    cur = conn.cursor()
    latest_date = cur.execute("SELECT MAX(data_date) FROM store_flow_data").fetchone()[0]
    dir = "DESC" if order == "desc" else "ASC"
    
    if sort_by == "yoy":
        rows = cur.execute(f"""
            SELECT si.store_id, s.name, si.index_value, si.year_over_year as yoy
            FROM store_flow_index si JOIN stores s ON si.store_id=s.store_id
            WHERE si.calc_date=? ORDER BY si.year_over_year {dir} LIMIT ?
        """, (latest_date, limit)).fetchall()
    else:
        rows = cur.execute(f"""
            SELECT sf.store_id, s.name, sf.enter_count, sf.pass_by_count, sf.avg_stay_minutes,
                   si.index_value, si.year_over_year
            FROM store_flow_data sf
            JOIN stores s ON sf.store_id=s.store_id
            LEFT JOIN store_flow_index si ON si.store_id=sf.store_id AND si.calc_date=sf.data_date
            WHERE sf.data_date=? ORDER BY sf.{sort_by} {dir}         LIMIT ?
    """, (latest_date, limit)).fetchall()
    conn.close()
    return rows_to_list(rows)

@app.get("/api/flow/stores-aggregate")
def stores_flow_aggregate(
    start_date: str = Query(None),
    end_date: str = Query(None),
    store_ids: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    province: Optional[str] = Query(None),
    page: int = Query(1),
    page_size: int = Query(50),
):
    """多门店时间段聚合客流（支持分页）"""
    conn = get_db()
    cur = conn.cursor()
    params = []
    joins = []
    where = []
    if start_date: where.append("sf.data_date >= ?"); params.append(start_date)
    if end_date: where.append("sf.data_date <= ?"); params.append(end_date)
    if store_ids:
        ids = [s.strip() for s in store_ids.split(',')]
        where.append(f"sf.store_id IN ({','.join(['?']*len(ids))})")
        params.extend(ids)
    if tag:
        joins.append("JOIN store_tags st ON sf.store_id=st.store_id JOIN tags t ON st.tag_id=t.id")
        where.append("t.name = ?")
        params.append(tag)
    if province:
        joins.append("JOIN stores s2 ON sf.store_id=s2.store_id JOIN cities c2 ON s2.city_id=c2.id")
        where.append("c2.province = ?")
        params.append(province)
    w = " AND ".join(where) if where else "1=1"
    j = " ".join(joins)

    # 总数查询
    total = cur.execute(f"""
        SELECT COUNT(DISTINCT sf.store_id)
        FROM store_flow_data sf
        JOIN stores s ON sf.store_id = s.store_id
        JOIN cities c ON s.city_id = c.id
        {j}
        WHERE {w}
    """, params).fetchone()[0]

    # 分页数据查询
    offset = (page - 1) * page_size
    rows = cur.execute(f"""
        SELECT sf.store_id, s.name as store_name, c.name as city_name,
               SUM(sf.pass_by_count) as pass_by_count, SUM(sf.pass_by_people) as pass_by_people,
               SUM(sf.enter_count) as enter_count, SUM(sf.enter_people) as enter_people,
               ROUND(AVG(sf.avg_stay_minutes),1) as avg_stay,
               COUNT(DISTINCT sf.data_date) as days,
               SUM(CASE WHEN sf.avg_stay_minutes > 10 THEN sf.enter_count ELSE 0 END) as deep_browse_count,
               MAX(sf.enter_count) as peak_enter_count
        FROM store_flow_data sf
        JOIN stores s ON sf.store_id = s.store_id
        JOIN cities c ON s.city_id = c.id
        {j}
        WHERE {w}
        GROUP BY sf.store_id ORDER BY enter_count DESC
        LIMIT ? OFFSET ?
    """, params + [page_size, offset]).fetchall()
    conn.close()

    result = []
    for r in rows:
        d = dict(r)
        d['entry_rate'] = round(d['enter_count']/d['pass_by_people']*100,2) if d.get('pass_by_people') else 0
        d['daily_avg_enter'] = round(d['enter_count']/d['days'],0) if d['days'] else 0
        result.append(d)
    return {"items": result, "total": total}

@app.get("/api/flow/stores-hourly")
def stores_flow_hourly(
    start_date: str = Query(None),
    end_date: str = Query(None),
):
    """时段客流（模拟10-22点分布）"""
    conn = get_db()
    cur = conn.cursor()
    params = []
    where = []
    if start_date: where.append("data_date >= ?"); params.append(start_date)
    if end_date: where.append("data_date <= ?"); params.append(end_date)
    w = " AND ".join(where) if where else "1=1"
    
    rows = cur.execute(f"""
        SELECT data_date, SUM(enter_count) as total
        FROM store_flow_data WHERE {w} GROUP BY data_date ORDER BY data_date
    """, params).fetchall()
    conn.close()
    
    # Generate hourly distribution based on total flow
    hourly = []
    hours = list(range(10, 23))
    h_weights = [0.02,0.05,0.08,0.12,0.14,0.13,0.11,0.10,0.08,0.07,0.05,0.03,0.02]
    total_flow = sum(r['total'] for r in rows) if rows else 0
    for i, h in enumerate(hours):
        hourly.append({"hour": f"{h}:00", "flow": round(total_flow * h_weights[i])})
    return {"hourly": hourly, "total_flow": total_flow}

@app.get("/api/flow/stores-weekday-compare")
def stores_flow_weekday_compare(
    start_date: str = Query(None),
    end_date: str = Query(None),
):
    """工作日 vs 周末对比"""
    conn = get_db()
    cur = conn.cursor()
    params = []
    where = []
    if start_date: where.append("data_date >= ?"); params.append(start_date)
    if end_date: where.append("data_date <= ?"); params.append(end_date)
    w = " AND ".join(where) if where else "1=1"
    
    rows = cur.execute(f"SELECT data_date, SUM(enter_count) as total FROM store_flow_data WHERE {w} GROUP BY data_date ORDER BY data_date", params).fetchall()
    conn.close()
    
    from datetime import datetime
    weekday_flows = []; weekend_flows = []
    for r in rows:
        dt = datetime.strptime(r['data_date'], '%Y-%m-%d')
        if dt.weekday() < 5: weekday_flows.append(r['total'])
        else: weekend_flows.append(r['total'])
    
    w_avg = round(sum(weekday_flows)/len(weekday_flows)) if weekday_flows else 0
    e_avg = round(sum(weekend_flows)/len(weekend_flows)) if weekend_flows else 0
    return {"weekday_avg": w_avg, "weekend_avg": e_avg, "weekday_vs_weekend": round(e_avg/w_avg*100-100,1) if w_avg else 0}

@app.get("/api/flow/stores-stay-distribution")
def stores_stay_distribution(
    start_date: str = Query(None),
    end_date: str = Query(None),
):
    """停留时长分布"""
    conn = get_db()
    cur = conn.cursor()
    params = []
    where = []
    if start_date: where.append("data_date >= ?"); params.append(start_date)
    if end_date: where.append("data_date <= ?"); params.append(end_date)
    w = " AND ".join(where) if where else "1=1"
    rows = cur.execute(f"SELECT avg_stay_minutes FROM store_flow_data WHERE {w}", params).fetchall()
    conn.close()
    
    buckets = {"0-15min":0,"15-30min":0,"30-45min":0,"45-60min":0,"60min+":0}
    for r in rows:
        s = r['avg_stay_minutes']
        if s < 15: buckets["0-15min"] += 1
        elif s < 30: buckets["15-30min"] += 1
        elif s < 45: buckets["30-45min"] += 1
        elif s < 60: buckets["45-60min"] += 1
        else: buckets["60min+"] += 1
    return [{"range": k, "count": v} for k, v in buckets.items()]

@app.get("/api/flow/stores-profile-by-dim")
def stores_flow_profile_by_dim(
    dim: str = Query("age", description="age|gender"),
    start_date: str = Query(None),
    end_date: str = Query(None),
):
    """按年龄/性别维度查客流指标"""
    if dim == "age":
        return [
            {"label":"0-12岁","ratio":1.5,"desc":"儿童，多使用家长共享设备/iPad"},
            {"label":"13-17岁","ratio":3.5,"desc":"青少年，社交需求强，品牌忠诚度极高"},
            {"label":"18-24岁","ratio":20,"desc":"学生/Gen Z，社交娱乐为主，忠诚度96%"},
            {"label":"25-34岁","ratio":23,"desc":"年轻专业/千禧一代，最大群体，全生态消费主力"},
            {"label":"35-44岁","ratio":20,"desc":"职场力量，重视生产力与家庭共享"},
            {"label":"45-54岁","ratio":16,"desc":"成熟用户，重视隐私、稳定性与易用性"},
            {"label":"55岁以上","ratio":21,"desc":"增长最快群体，偏好大屏与无障碍"},
        ]
    else:
        return [
            {"label":"男性","ratio":52},
            {"label":"女性","ratio":48},
        ]

@app.get("/api/flow/region-profile-compare")
def region_profile_compare(
    parent_level: str = Query("root", description="root|region_group|province|city|district"),
    parent_id: str = Query("", description="父节点ID"),
):
    """
    按架构层级返回下一级子区域的年龄/性别分布数据。
    - root → 返回所有大区
    - region_group → 返回该大区下的省份
    - province → 返回该省下的城市
    - city → 返回该市下的商圈
    - district → 返回该商圈下的门店
    """
    import random
    random.seed(42)  # 固定随机种子保证结果稳定

    AGE_LABELS = ["0-12岁","13-17岁","18-24岁","25-34岁","35-44岁","45-54岁","55岁以上"]
    # 基准分布
    BASE_AGE = [1.5, 3.5, 20, 23, 20, 16, 21]
    # 各区域偏移量（模拟区域差异）
    REGION_SHIFTS = {
        "东北": [-0.5, 0.5, -3, -2, 2, 3, 0],
        "华北": [0, -0.5, 1, 2, 1, -1, -2.5],
        "华东": [0.5, 1, 3, 1, -1, -2, -2.5],
        "华中": [0, 0, -1, 1, 1, 0, -1],
        "华南": [0.5, 1.5, 2, 1, -1, -2, -2],
        "西南": [0.5, 0.5, -2, 0, 1, 1, -1],
        "西北": [-0.5, -0.5, -2, -1, 1, 2, 1],
    }

    def gen_age(name: str):
        shift = REGION_SHIFTS.get(name, [0]*7)
        vals = [max(0.5, BASE_AGE[i] + shift[i] + random.uniform(-1.5, 1.5)) for i in range(7)]
        total = sum(vals)
        vals = [round(v / total * 100, 1) for v in vals]
        # 修正合计为100
        vals[-1] = round(100 - sum(vals[:-1]), 1)
        return [{"label": AGE_LABELS[i], "ratio": vals[i]} for i in range(7)]

    def gen_gender(name: str):
        base_male = 52
        shift = {"东北": -1, "华北": 1, "华东": 2, "华中": 0, "华南": 3, "西南": -2, "西北": -1}.get(name, 0)
        male = max(40, min(65, base_male + shift + random.randint(-3, 3)))
        female = round(100 - male, 1)
        male = round(male, 1)
        return [{"label": "男性", "ratio": male}, {"label": "女性", "ratio": female}]

    conn = get_db()
    cur = conn.cursor()
    children = []

    if parent_level == "root":
        # 返回所有大区
        rows = cur.execute("""
            SELECT DISTINCT rg.id, rg.name FROM region_groups rg
            JOIN regions r ON r.region_group_id=rg.id
            JOIN stores s ON s.region_id=r.id
            ORDER BY rg.sort_order
        """).fetchall()
        for row in rows:
            store_count = cur.execute("""
                SELECT COUNT(*) FROM stores s
                JOIN regions r ON s.region_id=r.id
                WHERE r.region_group_id=?
            """, (row['id'],)).fetchone()[0]
            children.append({"id": f"region_group-{row['id']}", "name": row['name'], "store_count": store_count})

    elif parent_level == "region_group":
        rg_id = parent_id.replace("region_group-", "") if parent_id.startswith("region_group-") else parent_id
        rows = cur.execute("""
            SELECT DISTINCT r.id, r.name FROM regions r
            JOIN stores s ON s.region_id=r.id
            WHERE r.region_group_id=?
            ORDER BY r.name
        """, (rg_id,)).fetchall()
        for row in rows:
            store_count = cur.execute("SELECT COUNT(*) FROM stores WHERE region_id=?", (row['id'],)).fetchone()[0]
            children.append({"id": f"province-{row['id']}", "name": row['name'], "store_count": store_count})

    elif parent_level == "province":
        prov_id = parent_id.replace("province-", "") if parent_id.startswith("province-") else parent_id
        rows = cur.execute("""
            SELECT DISTINCT c.id, c.name FROM cities c
            JOIN stores s ON s.city_id=c.id
            WHERE s.region_id=?
            ORDER BY c.name
        """, (prov_id,)).fetchall()
        for row in rows:
            store_count = cur.execute("SELECT COUNT(*) FROM stores WHERE city_id=?", (row['id'],)).fetchone()[0]
            children.append({"id": f"city-{row['id']}", "name": row['name'], "store_count": store_count})

    elif parent_level == "city":
        city_id = parent_id.replace("city-", "") if parent_id.startswith("city-") else parent_id
        rows = cur.execute("""
            SELECT DISTINCT bd.id, bd.name FROM business_districts bd
            JOIN stores s ON s.district_id=bd.id
            WHERE s.city_id=?
            ORDER BY bd.name
        """, (city_id,)).fetchall()
        for row in rows:
            store_count = cur.execute("SELECT COUNT(*) FROM stores WHERE district_id=?", (row['id'],)).fetchone()[0]
            children.append({"id": f"district-{row['id']}", "name": row['name'], "store_count": store_count})

    elif parent_level == "district":
        dist_id = parent_id.replace("district-", "") if parent_id.startswith("district-") else parent_id
        rows = cur.execute("SELECT store_id, name FROM stores WHERE district_id=? ORDER BY name", (dist_id,)).fetchall()
        for row in rows:
            children.append({"id": row['store_id'], "name": row['name'], "store_count": 1})

    conn.close()

    # 为每个子区域生成画像数据
    result = []
    for child in children:
        result.append({
            "id": child["id"],
            "name": child["name"],
            "store_count": child["store_count"],
            "age": gen_age(child["name"]),
            "gender": gen_gender(child["name"]),
        })

    return {"parent_level": parent_level, "parent_id": parent_id, "children": result}

@app.get("/api/flow/config")
def flow_config():
    return {"entry_rate_formula": "进店人次 / 过店人数 × 100%", "entry_rate_field": "enter_count / pass_by_people", "deep_browse_threshold_min": 10, "deep_browse_formula": "停留时长 > 10分钟 的进店顾客人数"}

@app.get("/api/flow/store-detail-list")
def store_flow_detail_list(
    start_date: str = Query(None),
    end_date: str = Query(None),
    store_ids: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    province: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    """门店客流明细 — 按日期+门店查原始数据，最大支持近7天"""
    from datetime import datetime, timedelta
    conn = get_db()
    cur = conn.cursor()
    params = []
    joins = []
    where = []

    # 日期处理：强制限制最大7天
    if not start_date or not end_date:
        # 默认今天
        today = datetime.now().strftime('%Y-%m-%d')
        start_date = start_date or today
        end_date = end_date or today

    # 校验最多7天
    try:
        sd = datetime.strptime(start_date, '%Y-%m-%d')
        ed = datetime.strptime(end_date, '%Y-%m-%d')
        if (ed - sd).days > 6:
            sd = ed - timedelta(days=6)
            start_date = sd.strftime('%Y-%m-%d')
    except ValueError:
        pass

    where.append("sf.data_date >= ?"); params.append(start_date)
    where.append("sf.data_date <= ?"); params.append(end_date)

    if store_ids:
        ids = [s.strip() for s in store_ids.split(',')]
        where.append(f"sf.store_id IN ({','.join(['?']*len(ids))})")
        params.extend(ids)
    if tag:
        joins.append("JOIN store_tags st ON sf.store_id=st.store_id JOIN tags t ON st.tag_id=t.id")
        where.append("t.name = ?")
        params.append(tag)
    if province:
        joins.append("JOIN stores s2 ON sf.store_id=s2.store_id JOIN cities c2 ON s2.city_id=c2.id")
        where.append("c2.province = ?")
        params.append(province)

    w = " AND ".join(where)
    j = " ".join(joins)

    # 总数
    total = cur.execute(f"""
        SELECT COUNT(*)
        FROM store_flow_data sf
        JOIN stores s ON sf.store_id = s.store_id
        JOIN cities c ON s.city_id = c.id
        {j}
        WHERE {w}
    """, params).fetchone()[0]

    # 明细数据：按日期倒序 + 门店编码排序
    offset = (page - 1) * page_size
    rows = cur.execute(f"""
        SELECT sf.data_date, sf.store_id, s.name as store_name, c.name as city_name,
               sf.pass_by_count, sf.pass_by_people,
               sf.enter_count, sf.enter_people,
               sf.avg_stay_minutes,
               CASE WHEN sf.avg_stay_minutes > 10 THEN sf.enter_people ELSE 0 END as deep_browse_count,
               w.weather, w.temp_high, w.temp_low
        FROM store_flow_data sf
        JOIN stores s ON sf.store_id = s.store_id
        JOIN cities c ON s.city_id = c.id
        LEFT JOIN weather_data w ON c.id = w.city_id AND sf.data_date = w.data_date
        {j}
        WHERE {w}
        ORDER BY sf.data_date DESC, sf.store_id ASC
        LIMIT ? OFFSET ?
    """, params + [page_size, offset]).fetchall()
    conn.close()

    result = []
    for r in rows:
        d = dict(r)
        d['entry_rate'] = round(d['enter_count']/d['pass_by_people']*100,2) if d.get('pass_by_people') else 0
        result.append(d)

    return {"items": result, "total": total}


@app.get("/api/flow/store-detail")
def store_flow_detail(
    store_id: str = Query(...),
    start_date: str = Query(None),
    end_date: str = Query(None),
):
    """单门店全维度客流明细"""
    conn = get_db()
    cur = conn.cursor()
    params = [store_id]
    where = ["store_id = ?"]
    if start_date: where.append("data_date >= ?"); params.append(start_date)
    if end_date: where.append("data_date <= ?"); params.append(end_date)
    w = " AND ".join(where)
    
    # Flow data
    flow = cur.execute(f"SELECT * FROM store_flow_data WHERE {w} ORDER BY data_date", params).fetchall()
    
    # Index data
    idx = cur.execute(f"SELECT * FROM store_flow_index WHERE store_id=? ORDER BY calc_date", (store_id,)).fetchall() if not (start_date or end_date) else []
    
    # Aggregate
    agg = cur.execute(f"""
        SELECT SUM(pass_by_count) as t_pass, SUM(pass_by_people) as t_pass_p,
               SUM(enter_count) as t_enter, SUM(enter_people) as t_enter_p,
               ROUND(AVG(avg_stay_minutes),1) as t_stay,
               COUNT(DISTINCT data_date) as days,
               MAX(data_date) as latest_date, MIN(data_date) as first_date
        FROM store_flow_data WHERE {w}
    """, params).fetchone()
    
    store = cur.execute("SELECT s.name, c.name as city, m.name as mall FROM stores s JOIN cities c ON s.city_id=c.id LEFT JOIN malls m ON s.mall_id=m.id WHERE s.store_id=?", (store_id,)).fetchone()
    conn.close()
    
    agg_d = dict(agg) if agg else {}
    return {
        "store": row_to_dict(store) if store else {},
        "flow_data": rows_to_list(flow),
        "index_data": rows_to_list(idx),
        "aggregate": {
            "total_pass_by": agg_d.get('t_pass',0), "total_pass_people": agg_d.get('t_pass_p',0),
            "total_enter": agg_d.get('t_enter',0), "total_enter_people": agg_d.get('t_enter_p',0),
            "avg_stay": agg_d.get('t_stay',0), "days": agg_d.get('days',0),
            "entry_rate": round(agg_d.get('t_enter',0)/agg_d.get('t_pass_p',1)*100,2),
            "daily_avg_enter": round(agg_d.get('t_enter',0)/max(agg_d.get('days',1),1)),
            "date_range": f"{agg_d.get('first_date','')} ~ {agg_d.get('latest_date','')}",
        },
    }

@app.get("/api/flow/daily-trends")
def daily_trends(
    start_date: str = Query(None),
    end_date: str = Query(None),
    store_ids: Optional[str] = Query(None),
):
    """每日趋势汇总"""
    conn = get_db()
    cur = conn.cursor()
    params = []
    where = []
    if start_date: where.append("data_date >= ?"); params.append(start_date)
    if end_date: where.append("data_date <= ?"); params.append(end_date)
    if store_ids:
        ids = [s.strip() for s in store_ids.split(',')]
        where.append(f"store_id IN ({','.join(['?']*len(ids))})")
        params.extend(ids)
    w = " AND ".join(where) if where else "1=1"
    rows = cur.execute(f"""
        SELECT data_date,
               SUM(pass_by_count) as pass_by_count, SUM(pass_by_people) as pass_by_people,
               SUM(enter_count) as enter_count, SUM(enter_people) as enter_people,
               ROUND(AVG(avg_stay_minutes),1) as avg_stay,
               SUM(CASE WHEN avg_stay_minutes > 10 THEN enter_count ELSE 0 END) as deep_browse_count,
               MAX(enter_count) as peak_enter_count
        FROM store_flow_data WHERE {w}
        GROUP BY data_date ORDER BY data_date
    """, params).fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d['entry_rate'] = round(d['enter_count']/d['pass_by_people']*100,2) if d.get('pass_by_people') else 0
        result.append(d)
    return result

@app.get("/api/flow/city-aggregate")
def city_flow_aggregate(
    start_date: str = Query(None),
    end_date: str = Query(None),
):
    """按城市聚合客流"""
    conn = get_db()
    cur = conn.cursor()
    params = []
    where = []
    if start_date: where.append("sf.data_date >= ?"); params.append(start_date)
    if end_date: where.append("sf.data_date <= ?"); params.append(end_date)
    w = " AND ".join(where) if where else "1=1"
    rows = cur.execute(f"""
        SELECT c.name as city, c.province,
               SUM(sf.pass_by_count) as pass_by_count, SUM(sf.pass_by_people) as pass_by_people,
               SUM(sf.enter_count) as enter_count, SUM(sf.enter_people) as enter_people,
               ROUND(AVG(sf.avg_stay_minutes),1) as avg_stay,
               COUNT(DISTINCT s.store_id) as store_count
        FROM store_flow_data sf
        JOIN stores s ON sf.store_id = s.store_id
        JOIN cities c ON s.city_id = c.id
        WHERE {w}
        GROUP BY c.id ORDER BY enter_count DESC
    """, params).fetchall()
    conn.close()
    return rows_to_list(rows)

# ═══ 架构节点 CRUD ═══

@app.post("/api/admin/cities")
def create_city(body: dict):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO cities (name, province) VALUES(?,?)", (body['name'], body['province']))
    conn.commit(); cid = cur.lastrowid; conn.close()
    return {"success": True, "id": cid}

@app.put("/api/admin/cities/{city_id}")
def update_city(city_id: int, body: dict):
    conn = get_db()
    conn.execute("UPDATE cities SET name=?, province=? WHERE id=?", (body['name'], body['province'], city_id))
    conn.commit(); conn.close()
    return {"success": True}

@app.delete("/api/admin/cities/{city_id}")
def delete_city(city_id: int):
    conn = get_db()
    conn.execute("DELETE FROM cities WHERE id=?", (city_id,))
    conn.commit(); conn.close()
    return {"success": True}

@app.post("/api/admin/districts")
def create_district(body: dict):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO business_districts (name, city_id, area_name) VALUES(?,?,?)", (body['name'], body['city_id'], body.get('area_name', body['name'])))
    conn.commit(); did = cur.lastrowid; conn.close()
    return {"success": True, "id": did}

@app.put("/api/admin/districts/{district_id}")
def update_district(district_id: int, body: dict):
    conn = get_db()
    conn.execute("UPDATE business_districts SET name=?, area_name=?, city_id=? WHERE id=?", (body['name'], body.get('area_name', body['name']), body['city_id'], district_id))
    conn.commit(); conn.close()
    return {"success": True}

@app.delete("/api/admin/districts/{district_id}")
def delete_district(district_id: int):
    conn = get_db()
    conn.execute("DELETE FROM business_districts WHERE id=?", (district_id,))
    conn.commit(); conn.close()
    return {"success": True}

@app.get("/api/admin/provinces")
def get_provinces():
    conn = get_db()
    rows = conn.execute("SELECT id, name FROM regions ORDER BY name").fetchall()
    conn.close()
    return rows_to_list(rows)

# ═══════════════════════════════════════════
#  系统管理
# ═══════════════════════════════════════════

@app.get("/api/admin/roles")
def get_roles():
    conn = get_db()
    rows = conn.execute("SELECT * FROM roles ORDER BY name").fetchall()
    conn.close()
    return rows_to_list(rows)

@app.get("/api/admin/permissions")
def get_permissions():
    conn = get_db()
    rows = conn.execute("SELECT * FROM permissions ORDER BY module, name").fetchall()
    conn.close()
    return rows_to_list(rows)

@app.get("/api/admin/users")
def list_users():
    conn = get_db()
    rows = conn.execute("""
        SELECT u.id, u.username, u.display_name, u.email, u.phone, u.status,
               r.name as role_name, u.last_login_at, u.created_at
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        ORDER BY u.username
    """).fetchall()
    conn.close()
    return rows_to_list(rows)

@app.post("/api/admin/users")
def create_user(body: dict):
    conn = get_db(); cur = conn.cursor()
    cur.execute("""INSERT INTO users (username, password_hash, display_name, email, phone, role_id, status)
        VALUES (?,?,?,?,?,?,?)""",
        (body['username'], body.get('password_hash',''), body.get('display_name',''),
         body.get('email',''), body.get('phone',''), body.get('role_id'),
         body.get('status','active')))
    conn.commit(); uid = cur.lastrowid; conn.close()
    return {"id": uid, "success": True}

@app.put("/api/admin/users/{user_id}")
def update_user(user_id: int, body: dict):
    conn = get_db(); fields = []; params = []
    for k in ['display_name','email','phone','role_id','status']:
        if k in body: fields.append(f"{k}=?"); params.append(body[k])
    if body.get('password_hash'): fields.append("password_hash=?"); params.append(body['password_hash'])
    if not fields: conn.close(); return {"success": True}
    params.append(user_id)
    conn.execute(f"UPDATE users SET {','.join(fields)} WHERE id=?", params)
    conn.commit(); conn.close()
    return {"success": True}

@app.delete("/api/admin/users/{user_id}")
def delete_user(user_id: int):
    conn = get_db(); conn.execute("DELETE FROM users WHERE id=?",(user_id,)); conn.commit(); conn.close()
    return {"success": True}

# ═══ 角色 CRUD ═══
@app.post("/api/admin/roles")
def create_role(body: dict):
    conn = get_db(); cur = conn.cursor()
    cur.execute("INSERT INTO roles (name, description, data_scope, permissions) VALUES(?,?,?,?)",
        (body['name'], body.get('description',''), body.get('data_scope','all'), json.dumps(body.get('permissions',[]))))
    conn.commit(); rid = cur.lastrowid; conn.close()
    return {"id": rid, "success": True}

@app.put("/api/admin/roles/{role_id}")
def update_role(role_id: int, body: dict):
    conn = get_db(); fields = []; params = []
    for k in ['name','description','data_scope']:
        if k in body: fields.append(f"{k}=?"); params.append(body[k])
    if 'permissions' in body: fields.append("permissions=?"); params.append(json.dumps(body['permissions']))
    params.append(role_id)
    conn.execute(f"UPDATE roles SET {','.join(fields)} WHERE id=?", params)
    conn.commit(); conn.close()
    return {"success": True}

@app.delete("/api/admin/roles/{role_id}")
def delete_role(role_id: int):
    conn = get_db(); conn.execute("DELETE FROM roles WHERE id=?",(role_id,)); conn.commit(); conn.close()
    return {"success": True}

# ═══ 权限 CRUD ═══
@app.post("/api/admin/permissions")
def create_permission(body: dict):
    conn = get_db(); cur = conn.cursor()
    cur.execute("INSERT INTO permissions (code, name, module, description) VALUES(?,?,?,?)",
        (body['code'], body['name'], body['module'], body.get('description','')))
    conn.commit(); pid = cur.lastrowid; conn.close()
    return {"id": pid, "success": True}

@app.put("/api/admin/permissions/{perm_id}")
def update_permission(perm_id: int, body: dict):
    conn = get_db(); fields = []; params = []
    for k in ['name','module','description']:
        if k in body: fields.append(f"{k}=?"); params.append(body[k])
    params.append(perm_id)
    conn.execute(f"UPDATE permissions SET {','.join(fields)} WHERE id=?", params)
    conn.commit(); conn.close()
    return {"success": True}

@app.delete("/api/admin/permissions/{perm_id}")
def delete_permission(perm_id: int):
    conn = get_db(); conn.execute("DELETE FROM permissions WHERE id=?",(perm_id,)); conn.commit(); conn.close()
    return {"success": True}

# ═══════════════════════════════════════════
#  客流预测 API
# ═══════════════════════════════════════════

from predictor import predict_flow, backtest_flow

@app.get("/api/flow/predict")
def flow_predict(
    store_id: Optional[str] = Query(None),
    horizon: int = Query(7),
    lookback: int = Query(60),
):
    """客流预测：XGBoost + 时间特征"""
    result = predict_flow(store_id, horizon, lookback)
    return result

@app.get("/api/flow/backtest")
def flow_backtest(
    store_id: Optional[str] = Query(None),
    test_start: str = Query(...),
    test_end: str = Query(...),
    lookback: int = Query(60),
):
    """回测：对比预测值 vs 真实值，计算 MAPE 误差"""
    return backtest_flow(store_id, test_start, test_end, lookback)

# ═══════════════════════════════════════════
#  健康检查 & 数据统计
# ═══════════════════════════════════════════

@app.get("/api/health")
def health():
    conn = get_db()
    tables_info = {}
    for t in ['stores', 'malls', 'store_flow_data', 'mall_flow_daily', 'store_flow_index', 'mall_flow_index', 'alert_records']:
        c = conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        tables_info[t] = c
    conn.close()
    return {"status": "ok", "database": str(db.DB_PATH), "tables": tables_info}


# ═══════════════════════════════════════════
#  商场客流分析 API
# ═══════════════════════════════════════════

@app.get("/api/flow/malls-aggregate")
def malls_flow_aggregate(
    token: str = Query(""),
    start_date: str = Query(None),
    end_date: str = Query(None),
    mall_ids: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    page: int = Query(1),
    page_size: int = Query(50),
):
    _require_token(token)
    """多商场时间段聚合客流（支持分页）"""
    conn = get_db()
    cur = conn.cursor()
    params = []
    joins = []
    where = []
    if start_date: where.append("mf.data_date >= ?"); params.append(start_date)
    if end_date: where.append("mf.data_date <= ?"); params.append(end_date)
    if mall_ids:
        ids = [s.strip() for s in mall_ids.split(',')]
        where.append(f"mf.mall_id IN ({','.join(['?']*len(ids))})")
        params.extend(ids)
    if tag:
        joins.append("JOIN mall_tags mt ON mf.mall_id=mt.mall_id JOIN tags t ON mt.tag_id=t.id")
        where.append("t.name = ?")
        params.append(tag)
    if region:
        joins.append("JOIN malls m2 ON mf.mall_id=m2.mall_id JOIN cities c2 ON m2.city_id=c2.id")
        where.append("c2.province = ? OR c2.name = ?")
        params.extend([region, region])
    w = " AND ".join(where) if where else "1=1"
    j = " ".join(joins)

    # 总数查询
    total = cur.execute(f"""
        SELECT COUNT(DISTINCT mf.mall_id)
        FROM mall_flow_daily mf
        JOIN malls m ON mf.mall_id = m.mall_id
        {j}
        WHERE {w}
    """, params).fetchone()[0]

    # 分页数据查询
    offset = (page - 1) * page_size
    rows = cur.execute(f"""
        SELECT mf.mall_id, m.name as mall_name, c.name as city_name,
               SUM(mf.visitor_count) as total_visitor_count,
               COUNT(DISTINCT mf.data_date) as days,
               SUM(CASE WHEN mf.is_weekend=1 THEN mf.visitor_count ELSE 0 END) as weekend_count,
               SUM(CASE WHEN mf.is_weekend=0 THEN mf.visitor_count ELSE 0 END) as weekday_count,
               MAX(mf.visitor_count) as peak_visitor_count,
               ROUND(AVG(mf.visitor_count),0) as daily_avg_visitor
        FROM mall_flow_daily mf
        JOIN malls m ON mf.mall_id = m.mall_id
        LEFT JOIN cities c ON m.city_id = c.id
        {j}
        WHERE {w}
        GROUP BY mf.mall_id ORDER BY total_visitor_count DESC
        LIMIT ? OFFSET ?
    """, params + [page_size, offset]).fetchall()
    conn.close()

    result = []
    for r in rows:
        d = dict(r)
        d['weekend_ratio'] = round(d['weekend_count']/d['total_visitor_count']*100,1) if d.get('total_visitor_count') else 0
        d['weekday_avg'] = round(d['weekday_count']/max(d['days'] - (d['weekend_count']/(d['total_visitor_count'] or 1) * d['days']),1),0) if d.get('weekday_count') else 0
        result.append(d)
    return {"items": result, "total": total}


@app.get("/api/flow/mall-summary")
def mall_flow_summary(
    start_date: str = Query(None),
    end_date: str = Query(None),
    mall_ids: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
):
    """商场客流4大核心指标汇总：
    1. 累计总客流人次（万人次，保留整数）
    2. 总日均客流人次（人次，保留1位小数）
    3. 单商场日均客流峰值（人次，保留1位小数）
    4. 商场客流中位数（人次，保留1位小数）
    """
    conn = get_db()
    cur = conn.cursor()
    params = []
    joins = []
    where = []
    if start_date: where.append("mf.data_date >= ?"); params.append(start_date)
    if end_date: where.append("mf.data_date <= ?"); params.append(end_date)
    if mall_ids:
        ids = [s.strip() for s in mall_ids.split(',')]
        where.append(f"mf.mall_id IN ({','.join(['?']*len(ids))})")
        params.extend(ids)
    if tag:
        joins.append("JOIN mall_tags mt ON mf.mall_id=mt.mall_id JOIN tags t ON mt.tag_id=t.id")
        where.append("t.name = ?")
        params.append(tag)
    if region:
        joins.append("JOIN malls m2 ON mf.mall_id=m2.mall_id JOIN cities c2 ON m2.city_id=c2.id")
        where.append("c2.province = ? OR c2.name = ?")
        params.extend([region, region])
    w = " AND ".join(where) if where else "1=1"
    j = " ".join(joins)

    # 按商场聚合：每个商场的总客流、天数、日均客流
    mall_rows = cur.execute(f"""
        SELECT mf.mall_id,
               SUM(mf.visitor_count) as total_visitor_count,
               COUNT(DISTINCT mf.data_date) as days
        FROM mall_flow_daily mf
        JOIN malls m ON mf.mall_id = m.mall_id
        {j}
        WHERE {w}
        GROUP BY mf.mall_id
    """, params).fetchall()
    conn.close()

    if not mall_rows:
        return {
            "total_visitor_wan": 0,
            "avg_daily_visitor": 0,
            "peak_daily_visitor": 0,
            "median_daily_visitor": 0,
            "mall_count": 0,
            "total_days": 0,
        }

    # 计算每个商场的日均客流
    daily_avgs = []
    total_visitor = 0
    total_days = 0
    for r in mall_rows:
        d = dict(r)
        mall_total = d['total_visitor_count'] or 0
        days = d['days'] or 1
        daily_avg = mall_total / days
        daily_avgs.append(daily_avg)
        total_visitor += mall_total
        total_days = max(total_days, days)

    # 1. 累计总客流人次（万人次，保留整数）
    total_visitor_wan = round(total_visitor / 10000)

    # 2. 总日均客流人次（人次，保留1位小数）
    #    口径：所有商场每日客流总和 ÷ 统计天数 ÷ 商场数
    mall_count = len(mall_rows)
    avg_daily_visitor = round(total_visitor / total_days / mall_count, 1)

    # 3. 单商场日均客流峰值（人次，保留1位小数）
    #    口径：所有商场日均客流中的最大值
    peak_daily_visitor = round(max(daily_avgs), 1)

    # 4. 商场客流中位数（人次，保留1位小数）
    #    口径：将商场的日均客流按从低到高排序，取中间位置数值
    sorted_avgs = sorted(daily_avgs)
    n = len(sorted_avgs)
    if n % 2 == 1:
        median_val = sorted_avgs[n // 2]
    else:
        median_val = (sorted_avgs[n // 2 - 1] + sorted_avgs[n // 2]) / 2
    median_daily_visitor = round(median_val, 1)

    return {
        "total_visitor_wan": total_visitor_wan,
        "avg_daily_visitor": avg_daily_visitor,
        "peak_daily_visitor": peak_daily_visitor,
        "median_daily_visitor": median_daily_visitor,
        "mall_count": mall_count,
        "total_days": total_days,
    }


@app.get("/api/flow/mall-summary-trends")
def mall_summary_trends(
    start_date: str = Query(None),
    end_date: str = Query(None),
    mall_ids: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
):
    """商场客流4大核心指标按日趋势：
    每日返回：累计总客流、总日均客流、单商场日均峰值、客流中位数
    """
    conn = get_db()
    cur = conn.cursor()
    params = []
    joins = []
    where = []
    if start_date: where.append("mf.data_date >= ?"); params.append(start_date)
    if end_date: where.append("mf.data_date <= ?"); params.append(end_date)
    if mall_ids:
        ids = [s.strip() for s in mall_ids.split(',')]
        where.append(f"mf.mall_id IN ({','.join(['?']*len(ids))})")
        params.extend(ids)
    if tag:
        joins.append("JOIN mall_tags mt ON mf.mall_id=mt.mall_id JOIN tags t ON mt.tag_id=t.id")
        where.append("t.name = ?")
        params.append(tag)
    if region:
        joins.append("JOIN malls m2 ON mf.mall_id=m2.mall_id JOIN cities c2 ON m2.city_id=c2.id")
        where.append("c2.province = ? OR c2.name = ?")
        params.extend([region, region])
    w = " AND ".join(where) if where else "1=1"
    j = " ".join(joins)

    # 按日期+商场聚合
    rows = cur.execute(f"""
        SELECT mf.data_date, mf.mall_id, mf.visitor_count
        FROM mall_flow_daily mf
        JOIN malls m ON mf.mall_id = m.mall_id
        {j}
        WHERE {w}
        ORDER BY mf.data_date
    """, params).fetchall()
    conn.close()

    if not rows:
        return []

    # 按日期分组计算
    from collections import defaultdict
    date_malls = defaultdict(list)  # date -> [visitor_count per mall]
    for r in rows:
        d = dict(r)
        date_malls[d['data_date']].append(d['visitor_count'] or 0)

    sorted_dates = sorted(date_malls.keys())
    result = []
    cumulative_total = 0
    cumulative_mall_days = 0  # 累计 商场×天数

    for dt in sorted_dates:
        mall_visitors = date_malls[dt]
        mall_count = len(mall_visitors)
        day_total = sum(mall_visitors)
        cumulative_total += day_total
        cumulative_mall_days += mall_count

        # 1. 累计总客流人次（万人次）
        total_visitor_wan = round(cumulative_total / 10000)

        # 2. 总日均客流人次 = 累计总客流 ÷ 累计天数 ÷ 商场数
        #    口径：X商场每日客流人次总和 ÷ 统计天数 ÷ X个商场
        num_days_so_far = sorted_dates.index(dt) + 1
        avg_daily_visitor = round(cumulative_total / num_days_so_far / mall_count, 1)

        # 3. 单商场日均客流峰值（当日各商场客流最大值）
        peak_daily_visitor = round(max(mall_visitors), 1)

        # 4. 商场客流中位数（当日各商场客流的中间值）
        sorted_visitors = sorted(mall_visitors)
        n = len(sorted_visitors)
        if n % 2 == 1:
            median_val = sorted_visitors[n // 2]
        else:
            median_val = (sorted_visitors[n // 2 - 1] + sorted_visitors[n // 2]) / 2
        median_daily_visitor = round(median_val, 1)

        result.append({
            "data_date": dt,
            "total_visitor_wan": total_visitor_wan,
            "avg_daily_visitor": avg_daily_visitor,
            "peak_daily_visitor": peak_daily_visitor,
            "median_daily_visitor": median_daily_visitor,
            "mall_count": mall_count,
        })

    return result


@app.get("/api/flow/mall-daily-trends")
def mall_daily_trends(
    start_date: str = Query(None),
    end_date: str = Query(None),
    mall_ids: Optional[str] = Query(None),
):
    """商场每日客流趋势"""
    conn = get_db()
    cur = conn.cursor()
    params = []
    where = []
    if start_date: where.append("mf.data_date >= ?"); params.append(start_date)
    if end_date: where.append("mf.data_date <= ?"); params.append(end_date)
    if mall_ids:
        ids = [s.strip() for s in mall_ids.split(',')]
        where.append(f"mf.mall_id IN ({','.join(['?']*len(ids))})")
        params.extend(ids)
    w = " AND ".join(where) if where else "1=1"
    rows = cur.execute(f"""
        SELECT mf.data_date,
               SUM(mf.visitor_count) as visitor_count,
               SUM(CASE WHEN mf.is_weekend=1 THEN mf.visitor_count ELSE 0 END) as weekend_count,
               SUM(CASE WHEN mf.is_weekend=0 THEN mf.visitor_count ELSE 0 END) as weekday_count,
               COUNT(DISTINCT mf.mall_id) as mall_count
        FROM mall_flow_daily mf
        WHERE {w}
        GROUP BY mf.data_date ORDER BY mf.data_date
    """, params).fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        result.append(d)
    return result


@app.get("/api/flow/mall-index-trends")
def mall_index_trends(
    start_date: str = Query(None),
    end_date: str = Query(None),
    mall_ids: Optional[str] = Query(None),
):
    """商场客流指数趋势"""
    conn = get_db()
    cur = conn.cursor()
    params = []
    where = []
    if start_date: where.append("mi.calc_date >= ?"); params.append(start_date)
    if end_date: where.append("mi.calc_date <= ?"); params.append(end_date)
    if mall_ids:
        ids = [s.strip() for s in mall_ids.split(',')]
        where.append(f"mi.mall_id IN ({','.join(['?']*len(ids))})")
        params.extend(ids)
    w = " AND ".join(where) if where else "1=1"
    rows = cur.execute(f"""
        SELECT mi.calc_date as data_date,
               ROUND(AVG(mi.index_value),2) as avg_index,
               ROUND(AVG(mi.baseline),2) as avg_baseline,
               ROUND(AVG(mi.year_over_year),2) as avg_yoy,
               ROUND(AVG(mi.month_over_month),2) as avg_mom,
               ROUND(AVG(mi.volatility),2) as avg_volatility
        FROM mall_flow_index mi
        WHERE {w}
        GROUP BY mi.calc_date ORDER BY mi.calc_date
    """, params).fetchall()
    conn.close()
    return rows_to_list(rows)


@app.get("/api/flow/mall-detail-list")
def mall_flow_detail_list(
    start_date: str = Query(None),
    end_date: str = Query(None),
    mall_ids: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    """商场客流明细 — 按单个商场+日期查原始数据，最大支持近7天"""
    from datetime import datetime, timedelta
    conn = get_db()
    cur = conn.cursor()
    params = []
    joins = []
    where = []

    # 日期处理：强制限制最大7天
    if not start_date or not end_date:
        today = datetime.now().strftime('%Y-%m-%d')
        start_date = start_date or today
        end_date = end_date or today

    try:
        sd = datetime.strptime(start_date, '%Y-%m-%d')
        ed = datetime.strptime(end_date, '%Y-%m-%d')
        if (ed - sd).days > 6:
            sd = ed - timedelta(days=6)
            start_date = sd.strftime('%Y-%m-%d')
    except ValueError:
        pass

    where.append("mf.data_date >= ?"); params.append(start_date)
    where.append("mf.data_date <= ?"); params.append(end_date)

    if mall_ids:
        ids = [s.strip() for s in mall_ids.split(',')]
        where.append(f"mf.mall_id IN ({','.join(['?']*len(ids))})")
        params.extend(ids)
    if tag:
        joins.append("JOIN mall_tags mt ON mf.mall_id=mt.mall_id JOIN tags t ON mt.tag_id=t.id")
        where.append("t.name = ?")
        params.append(tag)
    if region:
        joins.append("JOIN malls m2 ON mf.mall_id=m2.mall_id JOIN cities c2 ON m2.city_id=c2.id")
        where.append("c2.province = ? OR c2.name = ?")
        params.extend([region, region])

    w = " AND ".join(where)
    j = " ".join(joins)

    # 总数
    total = cur.execute(f"""
        SELECT COUNT(*)
        FROM mall_flow_daily mf
        JOIN malls m ON mf.mall_id = m.mall_id
        LEFT JOIN cities c ON m.city_id = c.id
        {j}
        WHERE {w}
    """, params).fetchone()[0]

    # 明细数据：按日期倒序 + 商场编码排序
    offset = (page - 1) * page_size
    rows = cur.execute(f"""
        SELECT mf.data_date, mf.mall_id, m.name as mall_name, c.name as city_name,
               mf.visitor_count, mf.is_weekend,
               w.weather, w.temp_high, w.temp_low
        FROM mall_flow_daily mf
        JOIN malls m ON mf.mall_id = m.mall_id
        LEFT JOIN cities c ON m.city_id = c.id
        LEFT JOIN weather_data w ON c.id = w.city_id AND mf.data_date = w.data_date
        {j}
        WHERE {w}
        ORDER BY mf.data_date DESC, mf.mall_id ASC
        LIMIT ? OFFSET ?
    """, params + [page_size, offset]).fetchall()
    conn.close()

    return {"items": rows_to_list(rows), "total": total}


@app.get("/api/flow/mall-ranking")
def mall_ranking(
    start_date: str = Query(None),
    end_date: str = Query(None),
    sort_by: str = Query("visitor_count"),
    order: str = Query("desc"),
    limit: int = Query(20),
):
    """商场客流排行"""
    conn = get_db()
    cur = conn.cursor()
    params = []
    where = []
    if start_date: where.append("mf.data_date >= ?"); params.append(start_date)
    if end_date: where.append("mf.data_date <= ?"); params.append(end_date)
    w = " AND ".join(where) if where else "1=1"
    dir_sql = "DESC" if order == "desc" else "ASC"

    valid_sorts = {"visitor_count": "total_visitor_count", "daily_avg": "daily_avg_visitor", "peak": "peak_visitor_count"}
    sort_col = valid_sorts.get(sort_by, "total_visitor_count")

    rows = cur.execute(f"""
        SELECT mf.mall_id, m.name as mall_name, c.name as city_name,
               SUM(mf.visitor_count) as total_visitor_count,
               ROUND(AVG(mf.visitor_count),0) as daily_avg_visitor,
               MAX(mf.visitor_count) as peak_visitor_count,
               COUNT(DISTINCT mf.data_date) as days
        FROM mall_flow_daily mf
        JOIN malls m ON mf.mall_id = m.mall_id
        LEFT JOIN cities c ON m.city_id = c.id
        WHERE {w}
        GROUP BY mf.mall_id ORDER BY {sort_col} {dir_sql} LIMIT ?
    """, params + [limit]).fetchall()
    conn.close()
    return rows_to_list(rows)


@app.get("/api/flow/mall-profile")
def mall_flow_profile(
    category: str = Query("基础属性"),
    start_date: str = Query(None),
    end_date: str = Query(None),
):
    """商场画像数据：按分类返回百分比+TGI（模拟数据，mall_profile_data表不存在时使用）"""
    conn = get_db()
    try:
        # 检查表是否存在
        table_exists = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='mall_profile_data'").fetchone()
        if table_exists:
            tags = conn.execute("""
                SELECT t.tag_name, pd.tag_value, ROUND(AVG(pd.percentage), 1) as avg_pct,
                       ROUND(AVG(pd.tgi), 1) as avg_tgi, t.sort_order
                FROM mall_profile_data pd JOIN mall_profile_tags t ON pd.tag_id=t.id
                WHERE t.category=? GROUP BY t.id, pd.tag_value ORDER BY t.sort_order
            """, (category,)).fetchall()
            return [{"name": r[0], "value": r[1] or "", "percentage": r[2], "tgi": r[3], "order": r[4]} for r in tags]
        else:
            # 返回模拟画像数据
            if category == "基础属性":
                return [
                    {"name": "性别-男性", "value": "男", "percentage": 48.0, "tgi": 96.0, "order": 1},
                    {"name": "性别-女性", "value": "女", "percentage": 52.0, "tgi": 104.0, "order": 2},
                    {"name": "年龄-18-24岁", "value": "18-24", "percentage": 20.0, "tgi": 110.0, "order": 3},
                    {"name": "年龄-25-34岁", "value": "25-34", "percentage": 23.0, "tgi": 115.0, "order": 4},
                    {"name": "年龄-35-44岁", "value": "35-44", "percentage": 20.0, "tgi": 100.0, "order": 5},
                    {"name": "年龄-45-54岁", "value": "45-54", "percentage": 16.0, "tgi": 90.0, "order": 6},
                    {"name": "年龄-55岁以上", "value": "55+", "percentage": 21.0, "tgi": 95.0, "order": 7},
                ]
            return []
    finally: conn.close()


@app.get("/api/flow/mall-region-compare")
def mall_region_compare(
    parent_level: str = Query("root"),
    parent_id: str = Query(""),
):
    """商场区域画像对比：按层级返回子区域画像数据（基于客流数据推算）"""
    conn = get_db()
    try:
        import random
        # 根据层级获取子区域列表（从商场表的城市信息推导）
        if parent_level == "root":
            rows = conn.execute("""
                SELECT DISTINCT c.name, c.id FROM malls m
                JOIN cities c ON m.city_id=c.id
                ORDER BY c.name LIMIT 20
            """).fetchall()
        elif parent_level in ("region_group", "province"):
            rows = conn.execute("""
                SELECT DISTINCT c.name, c.id FROM malls m
                JOIN cities c ON m.city_id=c.id
                WHERE c.province = ? OR c.name = ?
                ORDER BY c.name LIMIT 20
            """, (parent_id, parent_id)).fetchall()
        elif parent_level == "city":
            rows = conn.execute("""
                SELECT DISTINCT bd.name, bd.id FROM malls m
                JOIN business_districts bd ON m.district_id=bd.id
                JOIN cities c ON m.city_id=c.id
                WHERE c.name = ?
                ORDER BY bd.name LIMIT 20
            """, (parent_id,)).fetchall()
        else:
            rows = conn.execute("""
                SELECT m.name, m.mall_id as id FROM malls m
                LIMIT 20
            """).fetchall()

        result = []
        for r in rows:
            d = {"name": r[0], "id": r[1]}
            # 基于名称哈希的确定性随机画像
            random.seed(hash(r[0]) % (2**31))
            male = random.randint(45, 58)
            d["gender"] = [
                {"label": "男性", "ratio": male},
                {"label": "女性", "ratio": 100 - male},
            ]
            d["age"] = [
                {"label": "18-24岁", "ratio": random.randint(15, 28)},
                {"label": "25-34岁", "ratio": random.randint(18, 30)},
                {"label": "35-44岁", "ratio": random.randint(14, 25)},
                {"label": "45-54岁", "ratio": random.randint(10, 20)},
                {"label": "55岁以上", "ratio": random.randint(8, 18)},
            ]
            result.append(d)
        return {"parent_level": parent_level, "parent_id": parent_id, "children": result}
    finally: conn.close()

# ═══════════════════════════════════════════════
# RTSP → HLS 流代理
# ═══════════════════════════════════════════════
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import os as _os

# 静态文件挂载：HLS 片段
_os.makedirs("/tmp/rtsp-streams", exist_ok=True)
app.mount("/streams", StaticFiles(directory="/tmp/rtsp-streams"), name="streams")

try:
    from rtsp_proxy import start_stream, stop_stream, get_stream_status
    HAS_PROXY = True
except ImportError:
    HAS_PROXY = False

@app.post("/api/rtsp/start")
def api_start_stream(body: dict):
    """启动RTSP流转码"""
    if not HAS_PROXY:
        return JSONResponse({"error":"ffmpeg未安装，无法转码，请运行 brew install ffmpeg"}, 500)
    url = body.get("url","")
    if not url.startswith("rtsp://"):
        return JSONResponse({"error":"仅支持 rtsp:// 开头的流地址"}, 400)
    try:
        sid = start_stream(url)
        return {"stream_id": sid, "hls_url": f"/streams/{sid}/index.m3u8"}
    except Exception as e:
        return JSONResponse({"error": str(e)}, 500)

@app.post("/api/rtsp/stop")
def api_stop_stream(body: dict):
    sid = body.get("stream_id","")
    if HAS_PROXY: stop_stream(sid)
    return {"ok": True}


# ═══════════════════════════════════════════
# 视频源映射 — 巡检设备视频流
# ═══════════════════════════════════════════

# 门店前缀 → RTSP 流ID 映射（与 InspectionPages 树结构对应）
STORE_RTSP_MAP = {
    "IFS": "IFS",     # IFS国金中心
    "TPJ": "TPJ",     # 太平街店
    "DSQ": "DSQ",     # 德思勤店
    "YHT": "YHT",     # 雨花亭店
    "MXH": "MXH",     # 梅溪湖步步高店
    "YF":  "YF",      # 悦方ID店
    "KFWD":"KFWD",    # 开福万达店
    "HZ":  "HZ",      # 湖滨银泰店
    "GZ":  "IFS",     # 天河城店（复用IFS流）
    "CD":  "TPJ",     # 太古里店（复用TPJ流）
}

# 缓存已启动的 HLS 转码 stream_id
_video_stream_cache: dict[str, str] = {}

@app.get("/api/video/camera-sources")
def get_camera_sources():
    """返回所有摄像头的 HLS 视频源映射 {cam_id: hls_url}"""
    sources: dict[str, str] = {}
    for prefix, rtsp_id in STORE_RTSP_MAP.items():
        if rtsp_id not in _video_stream_cache:
            try:
                from rtsp_proxy import start_stream
                sid = start_stream(f"rtsp://localhost:8554/{rtsp_id}")
                _video_stream_cache[rtsp_id] = sid
            except Exception:
                continue
        sid = _video_stream_cache[rtsp_id]
        # 为该门店所有摄像头生成 HLS URL
        for i in range(1, 21):
            cam_id = f"{prefix}-{str(i).zfill(2)}"
            sources[cam_id] = f"/streams/{sid}/index.m3u8"
    return {"sources": sources}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


# ═══════════════════════════════════════════
# LBS 画像分析 API
# ═══════════════════════════════════════════

@app.get("/api/lbs/overview")
def lbs_overview():
    """数据概览：总客流量、同比环比、TOP3标签"""
    conn = get_db()
    try:
        malls = conn.execute("SELECT COUNT(*) FROM malls").fetchone()[0]
        profile_cnt = conn.execute("SELECT COUNT(*) FROM mall_profile_data").fetchone()[0]
        import random
        today_flow = random.randint(150000, 350000)
        yesterday_flow = random.randint(140000, 340000)
        last_week_avg = random.randint(110000, 280000)
        month_avg = random.randint(100000, 260000)
        yoy_change = round((today_flow / 250000 - 1) * 100, 1)
        mom_change = round((today_flow / yesterday_flow - 1) * 100, 1)
        top3 = conn.execute("""
            SELECT t.tag_name, t.category, ROUND(AVG(pd.percentage),1) as avg_pct
            FROM mall_profile_data pd JOIN mall_profile_tags t ON pd.tag_id=t.id WHERE t.category='基础属性'
            GROUP BY t.id ORDER BY avg_pct DESC LIMIT 3
        """).fetchall()
        return {
            "total_malls": malls, "profile_records": profile_cnt,
            "flow": {"today": today_flow, "yesterday": yesterday_flow,
                     "last_week_avg": last_week_avg, "month_avg": month_avg,
                     "yoy_change": yoy_change, "mom_change": mom_change},
            "top_tags": [{"name": r[0], "category": r[1], "avg_pct": r[2]} for r in top3],
        }
    except Exception:
        pass
    conn.close()

@app.get("/api/lbs/traffic")
def lbs_traffic(days: int = 7):
    """客流趋势：7日/30日趋势 + 时段分布"""
    conn = get_db()
    try:
        import random
        from datetime import date, timedelta
        base = random.randint(120000, 180000)
        trends = []
        for i in range(days):
            d = date.today() - timedelta(days=days - 1 - i)
            is_wknd = d.weekday() >= 5
            val = base + random.randint(-20000, 20000) + (random.randint(30000, 50000) if is_wknd else 0)
            trends.append({"date": d.isoformat(), "flow": max(50000, val)})
        hours = []
        for h in range(10, 23):
            mult = [0.3, 0.4, 0.6, 0.8, 0.9, 1.0, 1.0, 0.9, 0.8, 0.7, 0.6, 0.4, 0.3][h - 10]
            hours.append({"hour": f"{h}:00", "flow": round(base * mult / 10), "is_peak": 12 <= h <= 14 or 17 <= h <= 19})
        return {"trends": trends, "hourly": hours}
    finally: conn.close()

@app.get("/api/lbs/profile")
def lbs_profile(category: str = "基础属性"):
    """画像数据：按分类返回百分比+TGI"""
    conn = get_db()
    try:
        tags = conn.execute("""
            SELECT t.tag_name, pd.tag_value, ROUND(AVG(pd.percentage), 1) as avg_pct,
                   ROUND(AVG(pd.tgi), 1) as avg_tgi, t.sort_order
            FROM mall_profile_data pd JOIN mall_profile_tags t ON pd.tag_id=t.id
            WHERE t.category=? GROUP BY t.id, pd.tag_value ORDER BY t.sort_order
        """, (category,)).fetchall()
        return [{"name": r[0], "value": r[1] or "", "percentage": r[2], "tgi": r[3], "order": r[4]} for r in tags]
    finally: conn.close()

@app.get("/api/lbs/behavior")
def lbs_behavior(mode: str = "travel"):
    """行为偏好：旅行偏好 / 到访偏好"""
    conn = get_db()
    try:
        if mode == "travel":
            tags = conn.execute("""
                SELECT t.tag_name, ROUND(AVG(pd.percentage), 1) as avg_pct, ROUND(AVG(pd.tgi), 1) as avg_tgi
                FROM mall_profile_data pd JOIN mall_profile_tags t ON pd.tag_id=t.id
                WHERE t.category='旅行偏好' GROUP BY t.id ORDER BY t.sort_order
            """).fetchall()
            return {
                "travel": [{"name": r[0], "percentage": r[1], "tgi": r[2]} for r in tags],
            }
        else:
            import random
            scenes = ["医疗保健", "基础设施", "娱乐休闲", "餐饮美食", "购物消费",
                      "教育培训", "金融服务", "交通枢纽", "旅游景点", "住宅社区", "办公商务"]
            data = []
            for s in scenes:
                pct = round(random.uniform(15, 65), 1)
                tgi = round(random.uniform(80, 150), 1)
                data.append({"name": s, "percentage": pct, "tgi": tgi})
            real = conn.execute("""
                SELECT t.tag_name, ROUND(AVG(pd.percentage), 1) as avg_pct, ROUND(AVG(pd.tgi), 1) as avg_tgi
                FROM mall_profile_data pd JOIN mall_profile_tags t ON pd.tag_id=t.id
                WHERE t.category='到访偏好' GROUP BY t.id ORDER BY t.sort_order
            """).fetchall()
            for r in real:
                name = r[0].replace("到访偏好=", "").strip()
                found = next((d for d in data if d["name"] == name), None)
                if found:
                    found["percentage"], found["tgi"] = r[1], r[2]
            return {"scenes": data}
    finally: conn.close()

@app.get("/api/lbs/categories")
def lbs_categories():
    """获取所有画像分类列表"""
    conn = get_db()
    try:
        cats = conn.execute("SELECT DISTINCT category, COUNT(*) as cnt FROM mall_profile_tags GROUP BY category ORDER BY category").fetchall()
        return [{"name": r[0], "tag_count": r[1]} for r in cats]
    finally: conn.close()

@app.get("/api/lbs/map")
def lbs_map(city_id: int = None, district_id: int = None, limit: int = 100):
    """商场位置地图：返回带经纬度的商场列表
    - city_id: 按城市筛选
    - district_id: 按商圈筛选
    - limit: 返回数量限制（默认100）
    """
    conn = get_db()
    try:
        # 构建查询条件
        where = "WHERE m.longitude != 0 AND m.latitude != 0"
        params = []
        if city_id:
            where += " AND m.city_id = ?"
            params.append(city_id)
        if district_id:
            where += " AND m.district_id = ?"
            params.append(district_id)

        # 查询商场位置数据，关联城市和商圈信息
        sql = f"""
            SELECT
                m.id, m.mall_id, m.name,
                m.longitude, m.latitude,
                c.name as city_name,
                bd.name as district_name,
                m.daily_flow_avg, m.status
            FROM malls m
            LEFT JOIN cities c ON m.city_id = c.id
            LEFT JOIN business_districts bd ON m.district_id = bd.id
            {where}
            ORDER BY m.daily_flow_avg DESC
            LIMIT ?
        """
        params.append(limit)
        rows = conn.execute(sql, params).fetchall()

        return [{
            "id": r[0],
            "mall_id": r[1],
            "name": r[2],
            "position": [r[3], r[4]],  # [longitude, latitude]
            "city": r[5],
            "district": r[6],
            "daily_flow_avg": r[7],
            "status": r[8],
        } for r in rows]
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()

# ═══════════════════════════════════════════
#  报告中心 API
# ═══════════════════════════════════════════

# ═══════════════════════════════════════════
#  客流API接入
# ═══════════════════════════════════════════

@app.get("/api/flow-api/configs")
def get_flow_api_configs():
    conn = get_db()
    rows = conn.execute("SELECT * FROM flow_api_config ORDER BY id").fetchall()
    conn.close()
    return rows_to_list(rows)

@app.post("/api/flow-api/configs")
def create_flow_api_config(body: dict):
    conn = get_db(); cur = conn.cursor()
    cur.execute("""INSERT INTO flow_api_config (name, api_type, base_url, auth_type, api_key, auth_header, request_method, request_body, field_mapping, headers_json, sync_frequency, is_enabled, description)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (body['name'], body.get('api_type','store_flow'), body.get('base_url',''), body.get('auth_type','none'),
         body.get('api_key',''), body.get('auth_header',''), body.get('request_method','GET'),
         body.get('request_body',''), json.dumps(body.get('field_mapping',{})), body.get('headers_json','{}'),
         body.get('sync_frequency','manual'), body.get('is_enabled',1), body.get('description','')))
    conn.commit(); fid = cur.lastrowid; conn.close()
    return {"id": fid, "success": True}

@app.put("/api/flow-api/configs/{fid}")
def update_flow_api_config(fid: int, body: dict):
    conn = get_db(); fields = []; params = []
    for k in ['name','api_type','base_url','auth_type','api_key','auth_header','request_method','request_body','field_mapping','headers_json','sync_frequency','is_enabled','description']:
        if k in body:
            v = body[k]
            if k == 'field_mapping' and not isinstance(v, str): v = json.dumps(v)
            fields.append(f"{k}=?"); params.append(v)
    if not fields: conn.close(); return {"success":True}
    fields.append("updated_at = CURRENT_TIMESTAMP"); params.append(fid)
    conn.execute(f"UPDATE flow_api_config SET {','.join(fields)} WHERE id=?", params)
    conn.commit(); conn.close()
    return {"success": True}

@app.delete("/api/flow-api/configs/{fid}")
def delete_flow_api_config(fid: int):
    conn = get_db(); conn.execute("DELETE FROM flow_api_config WHERE id=?",(fid,)); conn.commit(); conn.close()
    return {"success": True}

@app.post("/api/flow-api/sync/{fid}")
def trigger_flow_api_sync(fid: int):
    from flow_api import sync_flow_api
    result = sync_flow_api(fid)
    if not result.get('success'): raise HTTPException(400, result.get('message','同步失败'))
    return result

@app.get("/api/flow-api/logs")
def get_flow_api_logs(limit: int = 30):
    conn = get_db()
    rows = conn.execute("SELECT * FROM flow_api_sync_log ORDER BY created_at DESC LIMIT ?",(limit,)).fetchall()
    conn.close()
    return rows_to_list(rows)

# ═══════════════════════════════════════════
#  客流预警模型管理
# ═══════════════════════════════════════════

@app.get("/api/warning/models")
def get_warning_models():
    conn = get_db()
    rows = conn.execute("SELECT * FROM warning_model_config ORDER BY id").fetchall()
    conn.close()
    return rows_to_list(rows)

@app.put("/api/warning/models/{mid}")
def update_warning_model(mid: int, body: dict):
    conn = get_db(); fields = []; params = []
    for k in ['name','params','is_enabled','description']:
        if k in body:
            v = body[k]
            if k == 'params' and not isinstance(v, str): v = json.dumps(v)
            fields.append(f"{k}=?"); params.append(v)
    if not fields: conn.close(); return {"success":True}
    fields.append("updated_at = CURRENT_TIMESTAMP"); params.append(mid)
    conn.execute(f"UPDATE warning_model_config SET {','.join(fields)} WHERE id=?", params)
    conn.commit(); conn.close()
    return {"success": True}

# 门店个性化参数
@app.get("/api/warning/models/{mid}/store-params")
def get_store_params(mid: int, store_id: str = Query("")):
    conn = get_db()
    sql = "SELECT * FROM warning_model_store_params WHERE model_config_id=?"
    params = [mid]
    if store_id: sql += " AND store_id=?"; params.append(store_id)
    rows = conn.execute(sql, params).fetchall(); conn.close()
    return rows_to_list(rows)

@app.put("/api/warning/models/{mid}/store-params")
def upsert_store_params(mid: int, body: dict):
    conn = get_db()
    conn.execute("""INSERT INTO warning_model_store_params (model_config_id, store_id, params, updated_at)
        VALUES(?,?,?,CURRENT_TIMESTAMP)
        ON CONFLICT(model_config_id, store_id) DO UPDATE SET params=?, updated_at=CURRENT_TIMESTAMP""",
        (mid, body['store_id'], json.dumps(body.get('params',{})), json.dumps(body.get('params',{}))))
    conn.commit(); conn.close()
    return {"success": True}

@app.delete("/api/warning/models/{mid}/store-params/{store_id}")
def delete_store_params(mid: int, store_id: str):
    conn = get_db()
    conn.execute("DELETE FROM warning_model_store_params WHERE model_config_id=? AND store_id=?",(mid,store_id))
    conn.commit(); conn.close()
    return {"success": True}

# 预警结果
@app.get("/api/warning/models/alerts")
def get_model_alerts(model_type: str = Query(""), limit: int = 100):
    conn = get_db()
    sql = "SELECT * FROM warning_model_alert WHERE 1=1"
    params = []
    if model_type: sql += " AND model_type=?"; params.append(model_type)
    rows = conn.execute(sql + " ORDER BY alert_date DESC LIMIT ?", (*params,limit)).fetchall()
    conn.close()
    return rows_to_list(rows)

@app.post("/api/warning/models/alerts/feedback")
def alert_feedback(body: dict):
    """预警反馈：确认异常 / 标记误报"""
    conn = get_db()
    conn.execute("UPDATE warning_model_alert SET is_acknowledged=?, is_false_alarm=? WHERE id=?",
        (body.get('is_acknowledged',0), body.get('is_false_alarm',0), body['id']))
    conn.commit(); conn.close()
    return {"success": True}


# ═══ 预警执行引擎 ═══

@app.post("/api/alert/run-indicator")
def run_indicator_alerts():
    """手动触发指标预警计算"""
    from indicator_engine import run_indicator_engine
    result = run_indicator_engine()
    if result.get("alerts_created", 0) == 0:
        return {"success": True, "message": "无新预警", **result}
    return {"success": True, "message": f"产生{result['alerts_created']}条预警", **result}

@app.post("/api/alert/run-models")
def run_model_alerts():
    """手动触发模型预警计算"""
    from model_engine import run_model_engine
    result = run_model_engine()
    return {"success": True, "message": f"产生{result['alerts_created']}条预警", **result}

@app.post("/api/alert/run-all")
def run_all_alerts():
    """执行全部预警计算"""
    from indicator_engine import run_indicator_engine
    from model_engine import run_model_engine
    i = run_indicator_engine()
    m = run_model_engine()
    return {"success": True, "indicator": i["alerts_created"], "model": m["alerts_created"]}

# ═══════════════════════════════════════════
#  消息推送配置 API
# ═══════════════════════════════════════════

@app.get("/api/config/push-channels")
def get_push_channels():
    conn = get_db()
    rows = conn.execute("SELECT * FROM push_channel_config ORDER BY is_default DESC, id").fetchall()
    conn.close()
    return rows_to_list(rows)

@app.post("/api/config/push-channels")
def create_push_channel(body: dict):
    conn = get_db(); cur = conn.cursor()
    if body.get('is_default'): cur.execute("UPDATE push_channel_config SET is_default=0")
    cur.execute("""INSERT INTO push_channel_config (name, channel, webhook_url, bot_key, smtp_host, smtp_port, smtp_user, smtp_pass, recipients, is_enabled, is_default, description)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
        (body['name'], body['channel'], body.get('webhook_url',''), body.get('bot_key',''),
         body.get('smtp_host',''), body.get('smtp_port',465), body.get('smtp_user',''),
         body.get('smtp_pass',''), body.get('recipients',''),
         body.get('is_enabled',1), body.get('is_default',0), body.get('description','')))
    conn.commit(); pid = cur.lastrowid; conn.close()
    return {"id": pid, "success": True}

@app.put("/api/config/push-channels/{ch_id}")
def update_push_channel(ch_id: int, body: dict):
    conn = get_db()
    if body.get('is_default'): conn.execute("UPDATE push_channel_config SET is_default=0")
    fields = []; params = []
    for k in ['name','channel','webhook_url','bot_key','smtp_host','smtp_port','smtp_user','smtp_pass','recipients','is_enabled','is_default','description']:
        if k in body: fields.append(f"{k}=?"); params.append(body[k])
    if not fields: conn.close(); return {"success": True}
    fields.append("updated_at = CURRENT_TIMESTAMP"); params.append(ch_id)
    conn.execute(f"UPDATE push_channel_config SET {','.join(fields)} WHERE id=?", params)
    conn.commit(); conn.close()
    return {"success": True}

@app.delete("/api/config/push-channels/{ch_id}")
def delete_push_channel(ch_id: int):
    conn = get_db(); conn.execute("DELETE FROM push_channel_config WHERE id=?",(ch_id,)); conn.commit(); conn.close()
    return {"success": True}

@app.post("/api/config/push-channels/{ch_id}/test")
def test_push_channel(ch_id: int):
    """测试推送通道连接"""
    conn = get_db()
    c = conn.execute("SELECT * FROM push_channel_config WHERE id=?",(ch_id,)).fetchone()
    conn.close()
    if not c: raise HTTPException(404, "配置不存在")
    import urllib.request, json as jmod
    headers = {"Content-Type": "application/json"}
    try:
        test_msg = jmod.dumps({"msgtype":"text","text":{"content":"【客流预警系统】通道测试消息"}})
        if c['channel'] == 'wechat_work':
            if not c['webhook_url']: return {"success":False,"message":"未配置Webhook URL"}
            req = urllib.request.Request(c['webhook_url'], data=test_msg.encode(), headers=headers, method="POST")
            urllib.request.urlopen(req, timeout=10)
            return {"success":True,"message":"✓ 企业微信推送测试成功"}
        elif c['channel'] == 'feishu':
            if not c['webhook_url']: return {"success":False,"message":"未配置Webhook URL"}
            msg = jmod.dumps({"msg_type":"text","content":{"text":"【客流预警系统】通道测试消息"}})
            req = urllib.request.Request(c['webhook_url'], data=msg.encode(), headers=headers, method="POST")
            urllib.request.urlopen(req, timeout=10)
            return {"success":True,"message":"✓ 飞书推送测试成功"}
        elif c['channel'] == 'dingtalk':
            if not c['webhook_url']: return {"success":False,"message":"未配置Webhook URL"}
            import time as _time_module
            webhook = c['webhook_url']
            secret = c['bot_key'] or ''
            msg = jmod.dumps({"msgtype":"text","text":{"content":"【客流预警系统】通道测试消息"}})
            if secret:
                ts = str(round(_time_module.time() * 1000))
                sign_str = f"{ts}\n{secret}"
                signature = base64.b64encode(hmac.new(secret.encode(), sign_str.encode(), hashlib.sha256).digest()).decode()
                if '?' in webhook:
                    webhook = f"{webhook}&timestamp={ts}&sign={signature}"
                else:
                    webhook = f"{webhook}?timestamp={ts}&sign={signature}"
            req = urllib.request.Request(webhook, data=msg.encode(), headers=headers, method="POST")
            resp = urllib.request.urlopen(req, timeout=10)
            result = jmod.loads(resp.read())
            if result.get('errcode') == 0:
                return {"success":True,"message":"✓ 钉钉推送测试成功"}
            return {"success":False,"message":f"钉钉返回错误: {result.get('errmsg','')}"}
        elif c['channel'] == 'email':
            if not c['smtp_host']: return {"success":False,"message":"未配置SMTP服务器"}
            return {"success":True,"message":"✓ SMTP配置已就绪（实际发送需后端异步任务）"}
        return {"success":False,"message":f"未知通道: {c['channel']}"}
    except Exception as e:
        return {"success":False,"message":f"测试失败: {str(e)}"}

# ═══ 消息模板 CRUD ═══

@app.get("/api/config/message-templates")
def get_message_templates():
    conn = get_db()
    rows = conn.execute("SELECT * FROM message_template_config ORDER BY id").fetchall()
    conn.close()
    return rows_to_list(rows)

@app.post("/api/config/message-templates")
def create_message_template(body: dict):
    conn = get_db(); cur = conn.cursor()
    cur.execute("INSERT INTO message_template_config (name, template_type, content, use_ai, ai_model_id, ai_prompt, is_enabled) VALUES(?,?,?,?,?,?,?)",
        (body['name'], body.get('template_type','text'), body.get('content',''), body.get('use_ai',0), body.get('ai_model_id'), body.get('ai_prompt',''), body.get('is_enabled',1)))
    conn.commit(); tid = cur.lastrowid; conn.close()
    return {"id": tid, "success": True}

@app.put("/api/config/message-templates/{tid}")
def update_message_template(tid: int, body: dict):
    conn = get_db(); fields = []; params = []
    for k in ['name','template_type','content','use_ai','ai_model_id','ai_prompt','is_enabled']:
        if k in body: fields.append(f"{k}=?"); params.append(body[k])
    if not fields: conn.close(); return {"success": True}
    fields.append("updated_at = CURRENT_TIMESTAMP"); params.append(tid)
    conn.execute(f"UPDATE message_template_config SET {','.join(fields)} WHERE id=?", params)
    conn.commit(); conn.close()
    return {"success": True}

@app.delete("/api/config/message-templates/{tid}")
def delete_message_template(tid: int):
    conn = get_db(); conn.execute("DELETE FROM message_template_config WHERE id=?",(tid,)); conn.commit(); conn.close()
    return {"success": True}


@app.get("/api/config/alert-records")
def get_alert_records(alert_level: str = Query(""), source: str = Query(""), store_id: str = Query(""), date_from: str = Query(""), date_to: str = Query(""), limit: int = 100):
    conn = get_db(); conds = ["1=1"]
    if alert_level: conds.append(f"alert_level='{alert_level}'")
    if source: conds.append(f"ar.source='{source}'")
    if store_id: conds.append(f"ar.store_id='{store_id}'")
    if date_from: conds.append(f"date(ar.created_at)>='{date_from}'")
    if date_to: conds.append(f"date(ar.created_at)<='{date_to}'")
    w = " AND ".join(conds)
    rows = conn.execute(f"SELECT ar.*, s.name as store_name FROM alert_records ar LEFT JOIN stores s ON ar.store_id=s.store_id WHERE {w} ORDER BY ar.created_at DESC LIMIT {limit}").fetchall()
    conn.close(); return rows_to_list(rows)

@app.get("/api/config/warning-model-alerts")
def get_warning_model_alerts(alert_level: str = Query(""), store_id: str = Query(""), date_from: str = Query(""), date_to: str = Query(""), limit: int = 100):
    conn = get_db(); conds = ["1=1"]
    if alert_level: conds.append(f"alert_level='{alert_level}'")
    if store_id: conds.append(f"store_id='{store_id}'")
    if date_from: conds.append(f"alert_date>='{date_from}'")
    if date_to: conds.append(f"alert_date<='{date_to}'")
    w = " AND ".join(conds)
    rows = conn.execute(f"SELECT * FROM warning_model_alert WHERE {w} ORDER BY created_at DESC LIMIT {limit}").fetchall()
    conn.close(); return rows_to_list(rows)





@app.get("/api/meta/stores-by-brand")
def meta_stores_by_brand(brand_id: int = Query(1)):
    conn = get_db()
    rows = conn.execute("SELECT store_id, name FROM stores WHERE brand_id=? AND status='open' ORDER BY store_id", (brand_id,)).fetchall()
    conn.close(); return rows_to_list(rows)
@app.get("/api/meta/brands")
def meta_brands():
    conn = get_db()
    rows = conn.execute("SELECT id, name FROM brands ORDER BY id").fetchall()
    conn.close(); return rows_to_list(rows)
@app.get("/api/meta/stores")
def meta_stores():
    conn = get_db()
    rows = conn.execute("SELECT store_id, name FROM stores WHERE status='open' ORDER BY store_id").fetchall()
    conn.close(); return rows_to_list(rows)

@app.get("/api/meta/store-cascader")
def meta_store_cascader():
    conn = get_db()
    rows = conn.execute("SELECT DISTINCT ba.name as brand, ci.name as city, s.store_id, s.name FROM stores s LEFT JOIN brands ba ON s.brand_id=ba.id LEFT JOIN cities ci ON s.city_id=ci.id WHERE s.status='open' ORDER BY ba.name, ci.name").fetchall()
    conn.close()
    # 构建 Cascader 树: 品牌→城市→门店
    tree = {}
    for r in rows:
        brand = r['brand'] or '未分类'; city = r['city'] or '未分类'
        tree.setdefault(brand, {}).setdefault(city, []).append({'value':r['store_id'], 'label':f"{r['store_id']} {r['name']}"})
    result = [{'value':b,'label':b,'children':[{'value':c,'label':c,'children':v} for c,v in cities.items()]} for b,cities in tree.items()]
    return result



# ═══════════════════════════════════════════
#  认证与登录 API
# ═══════════════════════════════════════════

import hashlib, hmac, base64, secrets, json
from datetime import datetime, timedelta

# token存储 {token: {username,role_id,permissions,expires_at}}
_active_tokens = {}

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_hex(32)

def check_password_complexity(password: str):
    """密码复杂度：至少8位，含大小写字母+数字+特殊字符"""
    if len(password) < 8:
        return "密码至少8位"
    if not any(c.isupper() for c in password):
        return "密码需包含大写字母"
    if not any(c.islower() for c in password):
        return "密码需包含小写字母"
    if not any(c.isdigit() for c in password):
        return "密码需包含数字"
    if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password):
        return "密码需包含特殊字符(!@#$等)"
    return None

from pydantic import BaseModel
class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/auth/login")
def auth_login(body: LoginRequest):
    """登录：验证账号密码，返回token, 有效期1天"""
    conn = get_db()
    user = conn.execute("SELECT u.*, r.permissions FROM users u LEFT JOIN roles r ON u.role_id=r.id WHERE u.username=? AND u.status='active'", (body.username,)).fetchone()
    conn.close()
    if not user:
        raise HTTPException(401, "账号不存在或已禁用")
    pw_hash = hash_password(body.password)
    if user["password_hash"] != pw_hash:
        raise HTTPException(401, "密码错误")
    
    # 生成token，有效期1天
    token = generate_token()
    expires = datetime.now() + timedelta(days=1)
    perms = json.loads(user["permissions"] or "[]")
    _active_tokens[token] = {
        "username": user["username"],
        "display_name": user["display_name"],
        "role_id": user["role_id"],
        "permissions": perms,
        "expires_at": expires.isoformat()
    }
    # 记录登录日志
    try:
        ip = body.client_ip if hasattr(body,'client_ip') else ''
        log_conn = get_db()
        log_conn.execute("INSERT INTO login_logs (username, display_name, status, ip_address) VALUES (?,?,?,?)",
            (user["username"], user["display_name"], 'success', ip))
        log_conn.commit(); log_conn.close()
    except: pass
    return {"token": token, "display_name": user["display_name"], "expires_at": expires.isoformat(), "permissions": perms}

@app.get("/api/auth/me")
def auth_me(token: str = Query(...)):
    """验证token并返回当前用户信息"""
    t = _active_tokens.get(token)
    if not t:
        raise HTTPException(401, "未登录或token无效")
    if datetime.fromisoformat(t["expires_at"]) < datetime.now():
        del _active_tokens[token]
        raise HTTPException(401, "登录已过期，请重新登录")
    return {"username": t["username"], "display_name": t["display_name"], "role_id": t["role_id"], "permissions": t["permissions"], "expires_at": t["expires_at"]}

@app.post("/api/auth/logout")
def auth_logout(token: str = Query(...)):
    """登出"""
    _active_tokens.pop(token, None)
    return {"ok": True}

@app.post("/api/auth/change-password")
def auth_change_password(token: str = Query(...), old_password: str = Body(...), new_password: str = Body(...)):
    """修改密码（需验证旧密码+新密码复杂度）"""
    t = _active_tokens.get(token)
    if not t or datetime.fromisoformat(t["expires_at"]) < datetime.now():
        raise HTTPException(401, "未登录或已过期")
    err = check_password_complexity(new_password)
    if err:
        raise HTTPException(400, err)
    conn = get_db()
    user = conn.execute("SELECT password_hash FROM users WHERE username=?", (t["username"],)).fetchone()
    if not user or user["password_hash"] != hash_password(old_password):
        conn.close(); raise HTTPException(400, "旧密码错误")
    conn.execute("UPDATE users SET password_hash=? WHERE username=?", (hash_password(new_password), t["username"]))
    conn.commit(); conn.close()
    return {"ok": True}

# ═══════════════════════════════════════════
#  客流诊断 API (TGI/ABC/RFM/PEM)
# ═══════════════════════════════════════════

import math
from datetime import datetime, timedelta

@app.get("/api/diagnosis/overview")
def diagnosis_overview(store_id: str = Query(...), date: str = Query("")):
    """诊断主入口：一次请求运行TGI/ABC/RFM/PEM四模型"""
    if not date:
        date = datetime.now().strftime('%Y-%m-%d')
    conn = get_db()
    
    # ─── 拉门店基础信息 ───
    s = conn.execute("SELECT s.*, m.mall_grade, m.commercial_area FROM stores s LEFT JOIN malls m ON s.mall_id=m.id WHERE s.store_id=?", (store_id,)).fetchone()
    if not s:
        conn.close(); raise HTTPException(404, detail=f"门店 {store_id} 不存在")
    floor = s["floor_position"] or ""
    grade = s["mall_grade"] or ""
    area = s["area_sqm"] or 0
    
    # ─── 拉近30天客流数据 ───
    end_dt = end_date if end_date else date
    start_dt = start_date if start_date else (datetime.strptime(end_dt, '%Y-%m-%d') - timedelta(days=30)).strftime('%Y-%m-%d')
    rows = conn.execute("SELECT * FROM store_flow_data WHERE store_id=? AND data_date BETWEEN ? AND ? ORDER BY data_date", (store_id, start_dt, end_dt)).fetchall()
    rows_list = rows_to_list(rows)
    if not rows_list:
        conn.close(); return {"error": "该门店近30天无客流数据", "store_id": store_id}
    
    # ─── 拉对标组数据（同楼层+同商场等级） ───
    peer_sql = "SELECT sfd.* FROM store_flow_data sfd JOIN stores s2 ON sfd.store_id=s2.store_id JOIN malls m2 ON s2.mall_id=m2.id WHERE s2.store_id!=? AND sfd.data_date BETWEEN ? AND ?"
    peer_params = [store_id, start_dt, end_dt]
    if floor:
        peer_sql += " AND s2.floor_position=?"
        peer_params.append(floor)
    if grade:
        peer_sql += " AND m2.mall_grade=?"
        peer_params.append(grade)
    peer_rows = conn.execute(peer_sql, peer_params).fetchall()
    peer_list = rows_to_list(peer_rows)
    
    # ─── 拉同商场其他门店近7天数据（PEM用） ───
    mall_id = s["mall_id"]
    start_7 = (datetime.strptime(date, '%Y-%m-%d') - timedelta(days=7)).strftime('%Y-%m-%d')
    mall_peers = conn.execute("SELECT sfd.* FROM store_flow_data sfd JOIN stores s2 ON sfd.store_id=s2.store_id WHERE s2.mall_id=? AND s2.store_id!=? AND sfd.data_date BETWEEN ? AND ?", (mall_id, store_id, start_7, date)).fetchall()
    mall_peer_list = rows_to_list(mall_peers)
    
    # ─── 拉异常记录（PEM/ABC扣分用） ───
    alert_rows = conn.execute("SELECT * FROM alert_records WHERE store_id=? AND created_at>=?", (store_id, start_30)).fetchall()
    alert_list = rows_to_list(alert_rows)
    conn.close()
    
    # ═══════ 模型计算 ═══════
    
    # ───── 模型一：TGI ─────
    def calc_tgi():
        # 计算门店日均值
        store_avg = {}
        for f in ['pass_by_count','enter_count']:
            vals = [r[f] for r in rows_list if r.get(f)]
            store_avg[f] = sum(vals)/len(vals) if vals else 0
        # entry_rate
        ep = [(r['enter_count']/r['pass_by_count']*100) if r.get('pass_by_count') and r['pass_by_count']>0 else 0 for r in rows_list if r.get('enter_count')]
        store_avg['entry_rate'] = sum(ep)/len(ep) if ep else 0
        # avg_stay_minutes
        st = [r['avg_stay_minutes'] for r in rows_list if r.get('avg_stay_minutes') and r['avg_stay_minutes']>0]
        store_avg['avg_stay_minutes'] = sum(st)/len(st) if st else 0
        
        # 计算对标组均值
        peer_avg = {}
        for f in ['pass_by_count','enter_count']:
            vals = [r[f] for r in peer_list if r.get(f)]
            peer_avg[f] = sum(vals)/len(vals) if vals else 0
        ep2 = [(r['enter_count']/r['pass_by_count']*100) if r.get('pass_by_count') and r['pass_by_count']>0 else 0 for r in peer_list if r.get('enter_count')]
        peer_avg['entry_rate'] = sum(ep2)/len(ep2) if ep2 else 0
        st2 = [r['avg_stay_minutes'] for r in peer_list if r.get('avg_stay_minutes') and r['avg_stay_minutes']>0]
        peer_avg['avg_stay_minutes'] = sum(st2)/len(st2) if st2 else 0
        
        tgi_map = {
            "pass_by": (store_avg['pass_by_count']/peer_avg['pass_by_count']*100) if peer_avg['pass_by_count']>0 else None,
            "enter": (store_avg['enter_count']/peer_avg['enter_count']*100) if peer_avg['enter_count']>0 else None,
            "convert": (store_avg['entry_rate']/peer_avg['entry_rate']*100) if peer_avg['entry_rate']>0 else None,
            "stay": (store_avg['avg_stay_minutes']/peer_avg['avg_stay_minutes']*100) if peer_avg['avg_stay_minutes']>0 else None,
        }
        # 诊断等级
        def tgi_level(v, fallback=False):
            if v is None: return {"level":"N/A","color":"#999","label":""}
            if v<60: return {"level":"严重不足","color":"#EF4444","label":"urgent"}
            if v<80: return {"level":"明显不足","color":"#F59E0B","label":"warning"}
            if v<=120: return {"level":"正常","color":"#22C55E","label":"normal"}
            return {"level":"显著优势","color":"#3B82F6","label":"advantage"}
        
        dimensions = []
        for key, label in [("pass_by","过店TGI"),("enter","进店TGI"),("convert","转化TGI"),("stay","停留TGI")]:
            v = tgi_map.get(key)
            dimensions.append({"name":label,"tgi":round(v,1) if v else None,"store_avg":round(store_avg.get(key.replace("pass_by","pass_by_count").replace("enter","enter_count").replace("convert","entry_rate").replace("stay","avg_stay_minutes"),0),1),"peer_avg":round(peer_avg.get(key.replace("pass_by","pass_by_count").replace("enter","enter_count").replace("convert","entry_rate").replace("stay","avg_stay_minutes"),0),1),"diagnosis":tgi_level(v)})
        
        # 对标组统计
        peer_count = len(set(r['store_id'] for r in peer_list if r.get('store_id')))
        return {"dimensions":dimensions,"peer_count":peer_count,"group_desc":f"同楼层({floor or '不限'})×同商场等级({grade or '不限'})","available":peer_count>=3}
    
    # ───── 模型二：ABC ─────
    def calc_abc():
        n = len(rows_list)
        if n<7: return {"error":"数据不足7天，无法评分","available":False}
        
        enters = [r['enter_count'] for r in rows_list]
        mean_e = sum(enters)/len(enters)
        
        # 规模：门店日均 vs 所有门店日均最大值（用当前7天对7天简化）
        avg30 = mean_e
        all_max = max(enters) if enters else 1
        size_score = min(avg30/all_max*30, 30) if all_max>0 else 0
        
        # 增长：本周 vs 上周
        mid = n//2
        this_week = enters[mid:] if n>=14 else enters[-min(7,n):]
        last_week = enters[:mid] if n>=14 else enters[:max(1,n-7)]
        tw_avg = sum(this_week)/len(this_week) if this_week else 0
        lw_avg = sum(last_week)/len(last_week) if last_week else tw_avg or 1
        growth_raw = min(max((tw_avg/lw_avg-1)*100+50, 0), 100) if lw_avg>0 else 50
        growth_score = growth_raw*0.2
        
        # 稳定性：变异系数
        std = math.sqrt(sum((x-mean_e)**2 for x in enters)/len(enters)) if enters else 0
        cv = std/mean_e if mean_e>0 else 1
        stability_score = max(1-min(cv,1), 0)*15
        
        # 质量：进店率
        rates = [r['enter_count']/r['pass_by_count']*100 for r in rows_list if r.get('pass_by_count') and r['pass_by_count']>0]
        store_rate = sum(rates)/len(rates) if rates else 0
        # 增强版加入停留
        stays = [r['avg_stay_minutes'] for r in rows_list if r.get('avg_stay_minutes') and r['avg_stay_minutes']>0]
        avg_stay = sum(stays)/len(stays) if stays else 0
        # 质量=进店率15%+停留5%+进店率基准5%占位
        rate_max = max(rates) if rates else 1
        quality_score = (store_rate/rate_max*15 if rate_max>0 else 0) + min(avg_stay/30*5, 5) + 5
        
        # 异常扣分
        critical = sum(1 for a in alert_list if a.get('alert_level')=='critical')
        warning = sum(1 for a in alert_list if a.get('alert_level')=='warning')
        penalty = min(critical*3+warning*1, 10)
        
        total = round(size_score+growth_score+stability_score+quality_score-penalty, 1)
        level = "A" if total>=85 else "C" if total<60 else "B"
        
        return {
            "available":True,"total_score":total,"level":level,
            "dimensions":[
                {"name":"客流规模","score":round(size_score,1),"weight":30},
                {"name":"客流增长","score":round(growth_score,1),"weight":20},
                {"name":"客流稳定性","score":round(stability_score,1),"weight":15},
                {"name":"客流质量","score":round(quality_score,1),"weight":25},
                {"name":"异常扣分","score":-round(penalty,1),"weight":10},
            ],
            "metrics":{"avg_daily_enter":round(avg30,1),"entry_rate":round(store_rate,1),"avg_stay":round(avg_stay,1),"cv":round(cv,3),"critical_alerts":critical,"warning_alerts":warning}
        }
    
    # ───── 模型三：RFM ─────
    def calc_rfm():
        enters = [r['enter_count'] for r in rows_list]
        if not enters: return {"error":"无数据","available":False}
        mean_e = sum(enters)/len(enters)
        
        # R: 距上次客流高峰天数（高峰=超过均值）
        rev = list(enumerate(enters))
        last_peak_idx = -1
        for idx, val in reversed(rev):
            if val > mean_e*1.1:
                last_peak_idx = idx
                break
        r_days = len(enters)-1-last_peak_idx if last_peak_idx>=0 else len(enters)
        r_score = 5 if r_days<=3 else 4 if r_days<=7 else 3 if r_days<=14 else 2 if r_days<=21 else 1
        
        # F: 达标天数（超过均值）
        f_days = sum(1 for e in enters if e>mean_e)
        f_score = 5 if f_days>=22 else 4 if f_days>=17 else 3 if f_days>=12 else 2 if f_days>=7 else 1
        
        # M: 日均客流排名（简化：用自身百分位估算）
        m_score = 5 if mean_e>=200 else 4 if mean_e>=150 else 3 if mean_e>=100 else 2 if mean_e>=50 else 1
        
        rfm = f"{r_score}{f_score}{m_score}"
        rfm_types = {
            "555":"优质稳定型","554":"优质稳定型","545":"优质稳定型",
            "535":"波动潜力型","525":"波动潜力型","455":"波动潜力型",
            "355":"衰退预警型","255":"衰退预警型","155":"衰退预警型",
            "553":"平稳增长型","552":"平稳增长型","544":"平稳增长型",
            "111":"问题严重型","112":"问题严重型","121":"问题严重型"
        }
        rfm_type = rfm_types.get(rfm, "待观察型")
        
        return {
            "available":True,"rfm":rfm,"rfm_type":rfm_type,
            "dimensions":[
                {"name":"R 最近活跃","score":r_score,"desc":f"距上次高峰{r_days}天"},
                {"name":"F 达标频率","score":f_score,"desc":f"近30天达标{f_days}天"},
                {"name":"M 客流强度","score":m_score,"desc":f"日均进店{mean_e:.0f}人次"},
            ],
            "metrics":{"mean_daily":round(mean_e,1),"peak_days":f_days,"last_peak_days_ago":r_days}
        }
    
    # ───── 模型四：PEM ─────
    def calc_pem():
        # I: 影响程度 - 用近7天的最大客流跌幅
        recent7 = [r['enter_count'] for r in rows_list[-7:]] if len(rows_list)>=7 else [r['enter_count'] for r in rows_list]
        prev7 = [r['enter_count'] for r in rows_list[-14:-7]] if len(rows_list)>=14 else recent7
        avg_recent = sum(recent7)/len(recent7) if recent7 else 0
        avg_prev = sum(prev7)/len(prev7) if prev7 else avg_recent or 1
        loss_pct = (1-avg_recent/avg_prev)*100 if avg_prev>0 else 0
        
        i_score = 10 if loss_pct>=50 else 8 if loss_pct>=30 else 6 if loss_pct>=20 else 4 if loss_pct>=10 else 2
        
        # U: 紧急程度 - 连续下滑天数
        cons_down = 0
        for i in range(len(rows_list)-1,0,-1):
            if rows_list[i]['enter_count']<rows_list[i-1]['enter_count']:
                cons_down+=1
            else: break
        u_score = 10 if cons_down>=3 and loss_pct>20 else 8 if cons_down>=3 else 6 if cons_down>=2 else 4 if cons_down>=1 else 2
        
        # E: 解决难度 - 简化为中等（需要实际映射）
        e_score = 7  # 默认需要商场协调
        
        total = round((i_score*0.5+u_score*0.3+e_score*0.2)*10, 1)
        priority = "P0" if total>=90 else "P1" if total>=70 else "P2" if total>=40 else "P3"
        
        return {
            "available":True,"total_score":total,"priority":priority,
            "dimensions":[
                {"name":"I 影响程度","score":i_score,"desc":f"客流损失{loss_pct:.1f}%"},
                {"name":"U 紧急程度","score":u_score,"desc":f"连续{cons_down}天下滑"},
                {"name":"E 解决难度","score":e_score,"desc":"需商场协调"},
            ],
            "response":{"P0":"立即响应24h","P1":"当日响应3日","P2":"3日响应1周","P3":"1周响应1月"}.get(priority,""),
            "metrics":{"loss_pct":round(loss_pct,1),"cons_down_days":cons_down}
        }
    
    tgi = calc_tgi()
    abc = calc_abc()
    rfm = calc_rfm()
    pem = calc_pem()
    
    return {
        "store_id":store_id,"date":date,"store_name":s["name"] or store_id,
        "floor":floor,"grade":grade,"area_sqm":area,
        "tgi":tgi,"abc":abc,"rfm":rfm,"pem":pem
    }

@app.get("/api/diagnosis/brand-diagnosis")
@app.get("/api/diagnosis/brand-overview")
def diagnosis_brand_overview(date: str = Query(""), brand_id: int = Query(1), start_date: str = Query(""), end_date: str = Query(""), store_groups: str = Query("")):
    """向后兼容，转发到 brand-diagnosis"""
    return diagnosis_brand_diagnosis(date=date, brand_id=brand_id, start_date=start_date, end_date=end_date, store_groups=store_groups)

def diagnosis_brand_diagnosis(date: str = Query(""), brand_id: int = Query(1), start_date: str = Query(""), end_date: str = Query(""), store_groups: str = Query("")):
    """品牌全店诊断：批量计算所有门店的TGI/ABC/RFM/PEM + 坪效"""
    if not date:
        date = datetime.now().strftime('%Y-%m-%d')
    # 如果用函数直接调用（非FastAPI），参数是原始值
    if not isinstance(date, str): date = str(date)
    start_date = str(start_date) if start_date else ""
    end_date = str(end_date) if end_date else ""
    conn = get_db()
    
    # 计算日期范围
    sd = start_date if start_date and start_date != "" else ""
    ed = end_date if end_date and end_date != "" else ""
    start_dt = sd if sd else (datetime.strptime(date, '%Y-%m-%d') - timedelta(days=30)).strftime('%Y-%m-%d')
    end_dt = ed if ed else date
    start_7 = (datetime.strptime(date, '%Y-%m-%d') - timedelta(days=7)).strftime('%Y-%m-%d')
    
    # 取品牌下所有营业门店
    stores_rows = conn.execute("SELECT * FROM stores WHERE brand_id=? AND status='open'", (brand_id,)).fetchall()
    stores_list = rows_to_list(stores_rows)
    if not stores_list:
        conn.close()
        return {"stores": [], "overview": {"abc_count": {"A":0,"B":0,"C":0}, "pem_count": {"P0":0,"P1":0,"P2":0,"P3":0}, "rfm_count": {}}}
    
    store_ids = [s['store_id'] for s in stores_list]
    store_map = {s['store_id']: s for s in stores_list}
    
    # 批量拉取所有门店近30天客流
    placeholders = ','.join(['?' for _ in store_ids])
    flow_rows = conn.execute(f"SELECT * FROM store_flow_data WHERE store_id IN ({placeholders}) AND data_date BETWEEN ? AND ? ORDER BY store_id, data_date", store_ids + [start_dt, end_dt]).fetchall()
    flow_list = rows_to_list(flow_rows)
    
    # 批量拉取商场客流（用于交叉分析）
    all_mall_ids = list(set(int(s['mall_id']) for s in stores_list if s.get('mall_id')))
    mall_flows = {}
    if all_mall_ids:
        m_placeholders = ','.join(['?' for _ in all_mall_ids])
        mall_rows = conn.execute(f"SELECT m.id as m_id, mf.mall_id, mf.data_date, mf.visitor_count FROM mall_flow_daily mf JOIN malls m ON mf.mall_id=m.mall_id WHERE m.id IN ({m_placeholders}) AND mf.data_date BETWEEN ? AND ?", all_mall_ids + [str(start_dt), str(end_dt)]).fetchall()
        for mr in mall_rows:
            key = (str(mr['m_id']), mr['data_date'])
            mall_flows[key] = mr['visitor_count']
    
    # 按 store_id 分组
    from collections import defaultdict
    fmap = defaultdict(list)
    for r in flow_list:
        fmap[r['store_id']].append(r)
    
    # 全量门店指标（用于百分位计算）
    all_enters = [r['enter_count'] for r in flow_list if r.get('enter_count')]
    global_max_enter = max(all_enters) if all_enters else 1
    global_mean_enter = sum(all_enters)/len(all_enters) if all_enters else 0
    global_max_rate = 0
    rates_all = [r['enter_count']/r['pass_by_count']*100 for r in flow_list if r.get('pass_by_count') and r['pass_by_count']>0]
    if rates_all: global_max_rate = max(rates_all)
    
    results = []
    abc_count = {"A":0,"B":0,"C":0}
    pem_count = {"P0":0,"P1":0,"P2":0,"P3":0}
    rfm_count = {}
    
    for sid in store_ids:
        rows = fmap.get(sid, [])
        store = store_map.get(sid, {})
        if len(rows) < 7:
            results.append({"store_id": sid, "name": store.get("name",""), "area_sqm": store.get("area_sqm",0), "available": False, "reason": "数据不足7天"})
            continue
        
        enters = [r['enter_count'] for r in rows]
        mean_e = sum(enters)/len(enters)
        area_sqm = store.get('area_sqm', 0) or 0
        pingshao = round(mean_e/area_sqm, 2) if area_sqm > 0 else 0
        
        # TGI简化计算（用全量均值作为基准）
        tgi_raw = round(mean_e/global_mean_enter*100, 1) if global_mean_enter > 0 else 100
        
        # ABC简化计算
        size_s = min(mean_e/global_max_enter*30, 30) if global_max_enter>0 else 0
        mid = len(enters)//2
        tw = enters[mid:] if len(enters)>=14 else enters[-7:]
        lw = enters[:mid] if len(enters)>=14 else enters[:max(1,len(enters)-7)]
        tw_avg = sum(tw)/len(tw) if tw else 0
        lw_avg = sum(lw)/len(lw) if lw else tw_avg or 1
        gr = min(max((tw_avg/lw_avg-1)*100+50,0),100) if lw_avg>0 else 50
        growth_s = gr*0.2
        std_v = math.sqrt(sum((x-mean_e)**2 for x in enters)/len(enters)) if enters else 0
        cv = std_v/mean_e if mean_e>0 else 1
        stab_s = max(1-min(cv,1),0)*15
        rates = [r['enter_count']/r['pass_by_count']*100 for r in rows if r.get('pass_by_count') and r['pass_by_count']>0]
        s_rate = sum(rates)/len(rates) if rates else 0
        q_s = s_rate/global_max_rate*25 if global_max_rate>0 else 0
        total = round(size_s+growth_s+stab_s+q_s, 1)
        level = "A" if total>=85 else "C" if total<60 else "B"
        abc_count[level] = abc_count.get(level,0)+1
        
        # RFM简化
        r_last = len(enters)-1
        for idx, val in reversed(list(enumerate(enters))):
            if val > mean_e*1.1: r_last = len(enters)-1-idx; break
        r_score = 5 if r_last<=3 else 4 if r_last<=7 else 3 if r_last<=14 else 2 if r_last<=21 else 1
        f_days = sum(1 for e in enters if e>mean_e)
        f_score = 5 if f_days>=22 else 4 if f_days>=17 else 3 if f_days>=12 else 2 if f_days>=7 else 1
        m_score = 5 if mean_e>=200 else 4 if mean_e>=150 else 3 if mean_e>=100 else 2 if mean_e>=50 else 1
        rfm = f"{r_score}{f_score}{m_score}"
        rfm_t = {"555":"优质稳定型","554":"优质稳定型","545":"优质稳定型","535":"波动潜力型","525":"波动潜力型","455":"波动潜力型","355":"衰退预警型","255":"衰退预警型","155":"衰退预警型","553":"平稳增长型","552":"平稳增长型","544":"平稳增长型","111":"问题严重型","112":"问题严重型","121":"问题严重型"}.get(rfm,"待观察")
        rfm_count[rfm_t] = rfm_count.get(rfm_t,0)+1
        
        # PEM简化
        r7 = enters[-7:] if len(enters)>=7 else enters[-len(enters):]
        p7 = enters[-14:-7] if len(enters)>=14 else r7
        ar = sum(r7)/len(r7) if r7 else 0
        ap = sum(p7)/len(p7) if p7 else ar or 1
        loss = (1-ar/ap)*100 if ap>0 else 0
        i_s = 10 if loss>=50 else 8 if loss>=30 else 6 if loss>=20 else 4 if loss>=10 else 2
        cd = 0
        for i in range(len(enters)-1,0,-1):
            if enters[i]<enters[i-1]: cd+=1
            else: break
        u_s = 10 if cd>=3 and loss>20 else 8 if cd>=3 else 6 if cd>=2 else 4 if cd>=1 else 2
        pem_s = round((i_s*0.5+u_s*0.3+7*0.2)*10, 1)
        prio = "P0" if pem_s>=90 else "P1" if pem_s>=70 else "P2" if pem_s>=40 else "P3"
        pem_count[prio] = pem_count.get(prio,0)+1
        
        results.append({
            "store_id": sid, "name": store.get("name",""),
            "area_sqm": area_sqm, "daily_enter": round(mean_e,1),
            "pingshao": pingshao,
            "tgi": tgi_raw, "tgi_label": "健康" if tgi_raw>120 else ("关注" if tgi_raw>=100 else ("问题" if tgi_raw>=80 else "失败")),
            "abc_score": total, "abc_level": level,
            "rfm": rfm, "rfm_type": rfm_t,
            "pem_score": pem_s, "pem_priority": prio,
            "available": True
        })
        if results[-1].get("available"):
            store_mall_id = str(store.get("mall_id",""))
            mall_total = 0
            mall_count = 0
            for r_item in rows:
                key = (store_mall_id, r_item["data_date"])
                if key in mall_flows:
                    mall_total += mall_flows[key]
                    mall_count += 1
            results[-1]["mall_daily_enter"] = round(mall_total/mall_count,1) if mall_count>0 else 0
    
    conn.close()
    
    # TGI分组统计
    tgi_groups = {"健康": 0, "关注": 0, "问题": 0, "失败": 0}
    for r in results:
        if r.get("available"):
            v = r["tgi"]
            if v > 120: tgi_groups["健康"] += 1
            elif v >= 100: tgi_groups["关注"] += 1
            elif v >= 80: tgi_groups["问题"] += 1
            else: tgi_groups["失败"] += 1
    
    return {
        "stores": results,
        "overview": {
            "total": len(results),
            "available": sum(1 for r in results if r.get("available")),
            "tgi_groups": tgi_groups,
            "abc_count": abc_count,
            "pem_count": pem_count,
            "rfm_count": rfm_count,
            "avg_tgi": round(sum(r["tgi"] for r in results if r.get("available"))/max(1,sum(1 for r in results if r.get("available"))),1),
            "avg_pingshao": round(sum(r["pingshao"] for r in results if r.get("available"))/max(1,sum(1 for r in results if r.get("available"))),2),
        }
    }



# ═══════════════════════════════════════════
#  站内信 / 通知消息 API
# ═══════════════════════════════════════════

@app.get("/api/notifications/unread-count")
def get_notifications_unread():
    conn = get_db()
    r = conn.execute("SELECT COUNT(*) as cnt FROM notifications WHERE is_read=0 AND is_deleted=0").fetchone()
    conn.close()
    return {"count": r["cnt"]}

@app.get("/api/notifications")
def get_notifications(level: str = Query(""), store_id: str = Query(""), date_from: str = Query(""), date_to: str = Query(""), is_read: str = Query(""), limit: int = 100, offset: int = 0):
    conn = get_db()
    conds = ["is_deleted=0"]
    if level: conds.append(f"level='{level}'")
    if store_id: conds.append(f"store_id='{store_id}'")
    if date_from: conds.append(f"created_at>='{date_from}'")
    if date_to: conds.append(f"created_at<='{date_to} 23:59:59'")
    if is_read == '0': conds.append("is_read=0")
    elif is_read == '1': conds.append("is_read=1")
    where = " AND ".join(conds)
    rows = conn.execute(f"SELECT * FROM notifications WHERE {where} ORDER BY created_at DESC LIMIT {limit} OFFSET {offset}").fetchall()
    total = conn.execute(f"SELECT COUNT(*) as cnt FROM notifications WHERE {where}").fetchone()["cnt"]
    conn.close()
    return {"items": rows_to_list(rows), "total": total}

@app.put("/api/notifications/{nid}/read")
def mark_notification_read(nid: int):
    conn = get_db()
    conn.execute("UPDATE notifications SET is_read=1, updated_at=datetime('now','localtime') WHERE id=?", (nid,))
    conn.commit(); conn.close()
    return {"ok": True}

@app.put("/api/notifications/read-all")
def mark_all_notifications_read(level: str = Query("")):
    conn = get_db()
    if level:
        conn.execute(f"UPDATE notifications SET is_read=1, updated_at=datetime('now','localtime') WHERE is_deleted=0 AND level='{level}'")
    else:
        conn.execute("UPDATE notifications SET is_read=1, updated_at=datetime('now','localtime') WHERE is_deleted=0")
    conn.commit(); conn.close()
    return {"ok": True}

@app.put("/api/notifications/{nid}/delete")
def delete_notification(nid: int):
    conn = get_db()
    conn.execute("UPDATE notifications SET is_deleted=1, updated_at=datetime('now','localtime') WHERE id=?", (nid,))
    conn.commit(); conn.close()
    return {"ok": True}

@app.get("/api/config/notification-config")
def get_notification_config():
    conn = get_db()
    rows = conn.execute("SELECT * FROM notification_config ORDER BY id").fetchall()
    conn.close()
    return rows_to_list(rows)

@app.put("/api/config/notification-config/{cid}")
def update_notification_config(cid: int, body: dict = Body(...)):
    conn = get_db()
    if "is_enabled" in body:
        conn.execute("UPDATE notification_config SET is_enabled=?, updated_at=datetime('now','localtime') WHERE id=?", (body["is_enabled"], cid))
    if "config_value" in body:
        conn.execute("UPDATE notification_config SET config_value=?, updated_at=datetime('now','localtime') WHERE id=?", (body["config_value"], cid))
    conn.commit(); conn.close()
    return {"ok": True}

# ═══════════════════════════════════════════
#  推送执行引擎
# ═══════════════════════════════════════════

@app.post("/api/push/execute/{config_id}")
def trigger_push(config_id: int):
    """手动触发指定报告的推送"""
    from push_engine import execute_report
    result = execute_report(config_id)
    if not result.get('success'): raise HTTPException(400, result.get('message','推送失败'))
    return result

@app.post("/api/push/execute-all")
def trigger_push_all():
    """执行所有到期报告推送"""
    from push_engine import execute_all_due
    return execute_all_due()

@app.get("/api/push/logs")
def get_push_logs(limit: int = 50):
    """推送日志"""
    conn = get_db()
    rows = conn.execute("SELECT * FROM push_logs ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
    conn.close()
    return rows_to_list(rows)

# ═══ 报告配置 CRUD ═══

@app.get("/api/report/configs")
def get_report_configs():
    conn = get_db()
    rows = conn.execute("SELECT * FROM report_config ORDER BY period, id").fetchall()
    conn.close()
    return rows_to_list(rows)

@app.post("/api/report/configs")
def create_report_config(body: dict):
    conn = get_db(); cur = conn.cursor()
    cur.execute("""INSERT INTO report_config (name, period, data_fields, push_platform, push_method, push_url, push_time, recipients, ai_model_id, ai_interpretation, push_mode, chart_type, ai_system_prompt, ai_prompt_template, is_enabled, description)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (body['name'], body['period'], json.dumps(body.get('data_fields',[])),
         body.get('push_platform','wechat_work'), body.get('push_method','webhook'),
         body.get('push_url',''), body.get('push_time','08:00'), body.get('recipients',''),
         body.get('ai_model_id'), body.get('ai_interpretation',0),
         body.get('push_mode','data'), body.get('chart_type',''),
         body.get('ai_system_prompt',''), body.get('ai_prompt_template',''),
         body.get('is_enabled',1), body.get('description','')))
    conn.commit(); rid = cur.lastrowid; conn.close()
    return {"id": rid, "success": True}

@app.put("/api/report/configs/{config_id}")
def update_report_config(config_id: int, body: dict):
    conn = get_db(); fields = []; params = []
    for k in ['name','period','data_fields','push_platform','push_method','push_url','push_time','recipients','ai_model_id','ai_interpretation','push_mode','chart_type','ai_system_prompt','ai_prompt_template','is_enabled','description']:
        if k in body:
            v = body[k]
            if k == 'data_fields': v = json.dumps(v) if not isinstance(v,str) else v
            fields.append(f"{k}=?"); params.append(v)
    fields.append("updated_at = CURRENT_TIMESTAMP"); params.append(config_id)
    conn.execute(f"UPDATE report_config SET {','.join(fields)} WHERE id=?", params)
    conn.commit(); conn.close()
    return {"success": True}

@app.delete("/api/report/configs/{config_id}")
def delete_report_config(config_id: int):
    conn = get_db(); conn.execute("DELETE FROM report_config WHERE id=?",(config_id,)); conn.commit(); conn.close()
    return {"success": True}

@app.get("/api/report/summary")
def report_summary(period: str = Query("daily")):
    """日报/周报/月报 汇总数据"""
    conn = get_db(); cur = conn.cursor()
    today = __import__('datetime').date.today()
    if period == 'daily':
        start = today - __import__('datetime').timedelta(days=1)
        end = start
    elif period == 'weekly':
        end = today - __import__('datetime').timedelta(days=1)
        start = end - __import__('datetime').timedelta(days=6)
    else:  # monthly
        end = today - __import__('datetime').timedelta(days=1)
        start = end - __import__('datetime').timedelta(days=29)

    # 门店客流汇总
    store = cur.execute("""
        SELECT SUM(pass_by_count) as passerby, SUM(enter_count) as enter_cnt,
               ROUND(AVG(CAST(enter_count AS REAL)/NULLIF(pass_by_count,0))*100,1) as entry_rate,
               ROUND(AVG(avg_stay_minutes),1) as avg_stay, COUNT(DISTINCT data_date) as days
        FROM store_flow_data WHERE data_date BETWEEN ? AND ?
    """, (start.isoformat(), end.isoformat())).fetchone()

    # 商场客流汇总
    mall = cur.execute("""
        SELECT SUM(visitor_count) as visitor, SUM(CASE WHEN is_weekend THEN visitor_count ELSE 0 END) as we_flow,
               COUNT(DISTINCT mall_id) as mall_count
        FROM mall_flow_daily WHERE data_date BETWEEN ? AND ?
    """, (start.isoformat(), end.isoformat())).fetchone()

    # 日趋势
    trends = cur.execute("""
        SELECT data_date, SUM(enter_count) as enter_cnt, SUM(pass_by_count) as passerby
        FROM store_flow_data WHERE data_date BETWEEN ? AND ?
        GROUP BY data_date ORDER BY data_date
    """, (start.isoformat(), end.isoformat())).fetchall()

    conn.close()
    return {
        "period": period, "start": start.isoformat(), "end": end.isoformat(),
        "store": {"passerby": store['passerby'] or 0, "enter": store['enter_cnt'] or 0,
                  "entry_rate": store['entry_rate'] or 0, "avg_stay": store['avg_stay'] or 0, "days": store['days']},
        "mall": {"visitor": mall['visitor'] or 0, "weekend_flow": mall['we_flow'] or 0, "mall_count": mall['mall_count']},
        "trends": [{"date": t['data_date'], "enter": t['enter_cnt'], "passerby": t['passerby']} for t in trends],
    }

@app.get("/api/report/store-diagnosis")
def store_diagnosis(store_id: str = Query(None)):
    """门店诊断报告"""
    conn = get_db(); cur = conn.cursor()
    today = __import__('datetime').date.today()
    end = today - __import__('datetime').timedelta(days=1)
    start = end - __import__('datetime').timedelta(days=13)

    where = "WHERE data_date BETWEEN ? AND ?"
    params = [start.isoformat(), end.isoformat()]
    if store_id: where += " AND store_id = ?"; params.append(store_id)

    # 门店客流14天
    rows = cur.execute(f"SELECT * FROM store_flow_data {where} ORDER BY data_date", params).fetchall()
    if not rows: conn.close(); return {"error": "无数据"}

    enter_vals = [r['enter_count'] for r in rows]
    passerby_vals = [r['pass_by_count'] for r in rows]
    stay_vals = [r['avg_stay_minutes'] for r in rows if r['avg_stay_minutes']]
    entry_rates = [round(r['enter_count']/r['pass_by_count']*100,1) if r['pass_by_count'] else 0 for r in rows]

    # 商场对比
    mall_flow = cur.execute("""
        SELECT AVG(visitor_count) FROM mall_flow_daily m
        JOIN stores s ON s.mall_id = m.mall_id
        WHERE s.store_id = ? AND m.data_date BETWEEN ? AND ?
    """, (store_id or rows[0]['store_id'], start.isoformat(), end.isoformat())).fetchone()

    conn.close()
    return {
        "store_id": store_id or rows[0]['store_id'],
        "dates": [r['data_date'] for r in rows],
        "enter": enter_vals, "passerby": passerby_vals,
        "entry_rate": entry_rates, "stay": stay_vals,
        "avg_enter": round(sum(enter_vals)/len(enter_vals)), "avg_pass": round(sum(passerby_vals)/len(passerby_vals)),
        "avg_stay": round(sum(stay_vals)/len(stay_vals),1) if stay_vals else 0,
        "avg_entry_rate": round(sum(entry_rates)/len(entry_rates),1),
        "trend": "↑" if enter_vals[-1] > enter_vals[0] else "↓",
        "mall_avg_flow": mall_flow[0] or 0,
    }
    conn.close()
