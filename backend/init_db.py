"""
客流诊断与预警系统 - 数据库初始化 & 数据导入
SQLite 开发版，生产可迁移至 PostgreSQL
"""
import sqlite3
import json
import os
import sys
from pathlib import Path
from datetime import date, timedelta
import statistics

# Add pandas import at top level
try:
    import pandas as pd
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pandas", "openpyxl", "-q"])
    import pandas as pd

DB_PATH = Path(__file__).parent / "flow_warning.db"
EXCEL_PATH = "/Users/paocai/Downloads/apple门店和商场客流数据/APPLE客流预警系统_2025_2026.xlsx"

def create_schema(conn):
    cur = conn.cursor()
    
    # ─── 组织架构 ───
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS brands (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            code TEXT NOT NULL UNIQUE,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS cities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            province TEXT DEFAULT '',
            UNIQUE(name, province)
        );
        
        CREATE TABLE IF NOT EXISTS business_districts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            city_id INTEGER NOT NULL REFERENCES cities(id),
            area_name TEXT DEFAULT '',
            UNIQUE(name, city_id)
        );
        
        CREATE TABLE IF NOT EXISTS malls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mall_id TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            city_id INTEGER NOT NULL REFERENCES cities(id),
            district_id INTEGER REFERENCES business_districts(id),
            status TEXT DEFAULT 'open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS stores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            store_id TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            brand_id INTEGER NOT NULL REFERENCES brands(id),
            mall_id INTEGER NOT NULL REFERENCES malls(id),
            city_id INTEGER NOT NULL REFERENCES cities(id),
            district_id INTEGER REFERENCES business_districts(id),
            status TEXT DEFAULT 'open',
            opened_at TEXT,
            area_sqm REAL,
            business_type TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- ─── 商场客流（日客流人次为核心指标） ───
        CREATE TABLE IF NOT EXISTS mall_flow_daily (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mall_id TEXT NOT NULL,
            data_date DATE NOT NULL,
            visitor_count INTEGER NOT NULL DEFAULT 0,
            is_weekend INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(mall_id, data_date),
            FOREIGN KEY (mall_id) REFERENCES malls(mall_id)
        );
        
        CREATE TABLE IF NOT EXISTS store_flow_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            store_id TEXT NOT NULL,
            data_date DATE NOT NULL,
            pass_by_count INTEGER NOT NULL DEFAULT 0,
            pass_by_people INTEGER NOT NULL DEFAULT 0,
            enter_count INTEGER NOT NULL DEFAULT 0,
            enter_people INTEGER NOT NULL DEFAULT 0,
            avg_stay_minutes REAL DEFAULT 0,
            male_ratio REAL DEFAULT 0,
            female_ratio REAL DEFAULT 0,
            age_18_24_ratio REAL DEFAULT 0,
            age_25_34_ratio REAL DEFAULT 0,
            age_35_44_ratio REAL DEFAULT 0,
            age_45_plus_ratio REAL DEFAULT 0,
            mall_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(store_id, data_date),
            FOREIGN KEY (store_id) REFERENCES stores(store_id),
            FOREIGN KEY (mall_id) REFERENCES malls(mall_id)
        );
        
        -- ─── 客流指数（派生数据，可定时计算） ───
        CREATE TABLE IF NOT EXISTS store_flow_index (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            store_id TEXT NOT NULL,
            calc_date DATE NOT NULL,
            index_value REAL NOT NULL DEFAULT 100,
            baseline REAL NOT NULL DEFAULT 0,
            actual_value REAL NOT NULL DEFAULT 0,
            year_over_year REAL,
            month_over_month REAL,
            volatility REAL DEFAULT 0,
            computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(store_id, calc_date),
            FOREIGN KEY (store_id) REFERENCES stores(store_id)
        );
        
        CREATE TABLE IF NOT EXISTS mall_flow_index (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mall_id TEXT NOT NULL,
            calc_date DATE NOT NULL,
            index_value REAL NOT NULL DEFAULT 100,
            baseline REAL NOT NULL DEFAULT 0,
            actual_value REAL NOT NULL DEFAULT 0,
            year_over_year REAL,
            month_over_month REAL,
            volatility REAL DEFAULT 0,
            computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(mall_id, calc_date),
            FOREIGN KEY (mall_id) REFERENCES malls(mall_id)
        );
        
        -- ─── 系统管理 ───
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            display_name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            role_id INTEGER,
            status TEXT DEFAULT 'active',
            last_login_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT DEFAULT '',
            data_scope TEXT DEFAULT 'all',
            permissions TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            module TEXT NOT NULL,
            description TEXT DEFAULT ''
        );
        
        -- ─── 预警系统 ───
        CREATE TABLE IF NOT EXISTS alert_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            rule_type TEXT NOT NULL,
            conditions TEXT NOT NULL,
            scope_type TEXT DEFAULT 'global',
            scope_value TEXT,
            priority TEXT DEFAULT 'warning',
            enabled INTEGER DEFAULT 1,
            notify_channels TEXT DEFAULT '[]',
            notify_receivers TEXT DEFAULT '[]',
            cooldown_minutes INTEGER DEFAULT 60,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS alert_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            store_id TEXT,
            mall_id TEXT,
            rule_id INTEGER REFERENCES alert_rules(id),
            alert_type TEXT NOT NULL,
            alert_level TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            metric_value REAL,
            threshold_value REAL,
            status TEXT DEFAULT 'pending',
            handled_by INTEGER,
            handled_at TIMESTAMP,
            handle_note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS diagnosis_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            store_id TEXT NOT NULL,
            calc_date DATE NOT NULL,
            boston_x REAL,
            boston_y REAL,
            boston_quadrant TEXT,
            deviation REAL,
            diagnosis_summary TEXT DEFAULT '',
            ai_suggestion TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (store_id) REFERENCES stores(store_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_mall_flow_daily_mall_date ON mall_flow_daily(mall_id, data_date);
        CREATE INDEX IF NOT EXISTS idx_mall_flow_daily_date ON mall_flow_daily(data_date);
        CREATE INDEX IF NOT EXISTS idx_store_flow_store_date ON store_flow_data(store_id, data_date);
        CREATE INDEX IF NOT EXISTS idx_store_flow_date ON store_flow_data(data_date);
        CREATE INDEX IF NOT EXISTS idx_store_index_store_date ON store_flow_index(store_id, calc_date);
        CREATE INDEX IF NOT EXISTS idx_mall_index_mall_date ON mall_flow_index(mall_id, calc_date);
        CREATE INDEX IF NOT EXISTS idx_alert_store ON alert_records(store_id, created_at);
        CREATE INDEX IF NOT EXISTS idx_alert_status ON alert_records(status);
    """)
    conn.commit()

def import_data(conn):
    print("Reading Excel...")
    xls = pd.ExcelFile(EXCEL_PATH)
    
    # Sheet 1: 门店客流统计
    df_store = pd.read_excel(xls, '门店客流统计')
    # Sheet 2: 商场客流统计
    df_mall = pd.read_excel(xls, '商场客流统计')
    # Sheet 3: 门店商场映射
    df_map = pd.read_excel(xls, '门店商场映射')
    
    cur = conn.cursor()
    
    # ─── 导入品牌 ───
    brand_name = "APPLE"
    cur.execute("INSERT OR IGNORE INTO brands (name, code) VALUES (?, ?)", (brand_name, "APPLE"))
    brand_id = cur.execute("SELECT id FROM brands WHERE code = ?", (brand_name,)).fetchone()[0]
    print(f"Brand: {brand_name} (id={brand_id})")
    
    # ─── 导入城市 & 商圈 ───
    cities = df_map[['商场城市']].drop_duplicates()
    city_map = {}
    for _, row in cities.iterrows():
        city_name = row['商场城市']
        cur.execute("INSERT OR IGNORE INTO cities (name) VALUES (?)", (city_name,))
        cid = cur.execute("SELECT id FROM cities WHERE name = ?", (city_name,)).fetchone()[0]
        city_map[city_name] = cid
    
    # 商圈
    districts_data = df_map[['商场城市', '商场商圈']].drop_duplicates()
    district_map = {}
    for _, row in districts_data.iterrows():
        city_name = row['商场城市']
        dist_name = row['商场商圈']
        city_id = city_map[city_name]
        cur.execute("INSERT OR IGNORE INTO business_districts (name, city_id, area_name) VALUES (?, ?, ?)",
                     (dist_name, city_id, dist_name))
        did = cur.execute("SELECT id FROM business_districts WHERE name = ? AND city_id = ?",
                          (dist_name, city_id)).fetchone()[0]
        district_map[(city_name, dist_name)] = did
    
    # ─── 导入商场 ───
    malls_unique = df_map[['商场ID', '商场名称', '商场城市', '商场商圈']].drop_duplicates()
    mall_id_map = {}
    for _, row in malls_unique.iterrows():
        mall_id = row['商场ID']
        mall_name = row['商场名称']
        city_name = row['商场城市']
        dist_name = row['商场商圈']
        cid = city_map[city_name]
        did = district_map.get((city_name, dist_name))
        cur.execute("INSERT OR IGNORE INTO malls (mall_id, name, city_id, district_id) VALUES (?, ?, ?, ?)",
                     (mall_id, mall_name, cid, did))
        mall_id_map[mall_id] = cur.lastrowid
    
    # ─── 导入门店 ───
    stores_unique = df_map[['门店ID', '门店名称', '商场ID', '商场城市', '商场商圈']].drop_duplicates()
    store_id_map = {}
    for _, row in stores_unique.iterrows():
        store_id = row['门店ID']
        store_name = row['门店名称']
        mall_id_str = row['商场ID']
        city_name = row['商场城市']
        dist_name = row['商场商圈']
        cid = city_map[city_name]
        did = district_map.get((city_name, dist_name))
        
        mall_row = cur.execute("SELECT id FROM malls WHERE mall_id = ?", (mall_id_str,)).fetchone()
        if not mall_row:
            continue
        mall_pk = mall_row[0]
        
        cur.execute("INSERT OR IGNORE INTO stores (store_id, name, brand_id, mall_id, city_id, district_id, status) VALUES (?, ?, ?, ?, ?, ?, 'open')",
                     (store_id, store_name, brand_id, mall_pk, cid, did))
        store_id_map[store_id] = cur.lastrowid
    
    conn.commit()
    print(f"Imported: {len(city_map)} cities, {len(district_map)} districts, {len(mall_id_map)} malls, {len(store_id_map)} stores")
    
    # ─── 导入商场客流数据（只取日客流人次，并模拟近30天） ───
    import random
    import numpy as np
    random.seed(42)
    np.random.seed(42)

    # 先从 Excel 读取商场基础日客流（取2026年的数据作为种子）
    mall_base_flow = {}
    for _, row in df_mall.iterrows():
        mall_id = str(row['商场ID'])
        data_date = str(row['数据日期'])[:10] if pd.notna(row['数据日期']) else None
        if data_date and data_date.startswith('2026'):
            mall_base_flow[mall_id] = int(row['商场顾客人次'])

    # 如果 Excel 没有2026年数据，取所有日期的均值
    if not mall_base_flow:
        for _, row in df_mall.iterrows():
            mall_id = str(row['商场ID'])
            vc = int(row['商场顾客人次'])
            if mall_id in mall_base_flow:
                mall_base_flow[mall_id] = (mall_base_flow[mall_id] + vc) / 2
            else:
                mall_base_flow[mall_id] = vc

    # 生成近30天数据：2026-04-14 ~ 2026-05-13
    from datetime import datetime, timedelta
    start_date = date(2026, 4, 14)
    end_date = date(2026, 5, 13)
    dates_30 = []
    d = start_date
    while d <= end_date:
        dates_30.append(d)
        d += timedelta(days=1)

    mall_count = 0
    for mall_id, base_flow in mall_base_flow.items():
        for d in dates_30:
            is_weekend = 1 if d.weekday() >= 5 else 0

            # 模拟日客流：工作日=基准×0.8~1.1，周末=基准×1.2~1.6
            if is_weekend:
                multiplier = np.random.uniform(1.2, 1.6)
            else:
                multiplier = np.random.uniform(0.8, 1.1)

            # 加入日间波动 ±15%
            daily_noise = np.random.uniform(0.85, 1.15)
            visitor_count = int(base_flow * multiplier * daily_noise)

            cur.execute("""INSERT OR IGNORE INTO mall_flow_daily
                (mall_id, data_date, visitor_count, is_weekend)
                VALUES (?, ?, ?, ?)""",
                (mall_id, d.isoformat(), visitor_count, is_weekend))
            mall_count += 1

    conn.commit()
    print(f"Generated {mall_count} mall flow daily records ({len(mall_base_flow)} malls × {len(dates_30)} days)")
    
    # ─── 导入门店客流数据 ───
    store_count = 0
    for _, row in df_store.iterrows():
        store_id = str(row['门店ID'])
        mall_id = str(row['商场ID'])
        data_date = str(row['日期'])[:10] if pd.notna(row['日期']) else None
        if not data_date:
            continue
        try:
            cur.execute("""INSERT OR IGNORE INTO store_flow_data 
                (store_id, data_date, pass_by_count, pass_by_people, enter_count, enter_people,
                 avg_stay_minutes, male_ratio, female_ratio, age_18_24_ratio, age_25_34_ratio, 
                 age_35_44_ratio, age_45_plus_ratio, mall_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (store_id, data_date,
                 int(row['过店顾客人次']), int(row['过店顾客人数']),
                 int(row['进店顾客人次']), int(row['进店顾客人数']),
                 float(row['顾客平均停留时长(分钟)']),
                 float(row['男性顾客占比(%)']), float(row['女性顾客占比(%)']),
                 float(row['18-24岁顾客占比(%)']), float(row['25-34岁顾客占比(%)']),
                 float(row['35-44岁顾客占比(%)']), float(row['45岁以上顾客占比(%)']),
                 mall_id))
            store_count += 1
        except Exception as e:
            print(f"  Skip store flow: {store_id} {data_date} - {e}")
    conn.commit()
    print(f"Imported {store_count} store flow records")
    
    # ─── 计算客流指数 ───
    compute_indices(conn, cur)
    
    # ─── 预设角色和权限 ───
    seed_auth_data(conn, cur)
    
    # ─── 生成默认预警规则 ───
    seed_alert_rules(conn, cur)
    
    conn.commit()
    print("\nDatabase initialization complete!")

def compute_indices(conn, cur):
    """计算门店和商场客流指数（基线=同期均值）"""
    print("\nComputing flow indices...")
    
    cur.execute("SELECT DISTINCT data_date FROM store_flow_data ORDER BY data_date")
    dates = [r[0] for r in cur.fetchall()]
    if not dates:
        return
    
    store_idx_count = 0
    # 门店指数：每门店每天，基线是对应 YoY 日期
    cur.execute("SELECT DISTINCT store_id FROM store_flow_data")
    stores = [r[0] for r in cur.fetchall()]
    
    for store_id in stores:
        for d in dates:
            yr = int(d[:4])
            prev_yr_date = f"{yr-1}{d[4:]}"
            
            cur.execute("SELECT enter_count FROM store_flow_data WHERE store_id=? AND data_date=?", (store_id, d))
            row = cur.fetchone()
            if not row or row[0] is None:
                continue
            actual = row[0]
            
            cur.execute("SELECT enter_count FROM store_flow_data WHERE store_id=? AND data_date=?", (store_id, prev_yr_date))
            baseline_row = cur.fetchone()
            if not baseline_row or baseline_row[0] is None or baseline_row[0] == 0:
                continue
            baseline = baseline_row[0]
            
            index_val = round(actual / baseline * 100, 2)
            
            # YoY
            yoy = round((actual - baseline) / baseline * 100, 2)
            
            # Volatility: compute from available data
            cur.execute("SELECT enter_count FROM store_flow_data WHERE store_id=? ORDER BY data_date", (store_id,))
            all_vals = [r[0] for r in cur.fetchall() if r[0] is not None and r[0] > 0]
            vol = 0.0
            if len(all_vals) >= 2:
                mean_v = statistics.mean(all_vals)
                std_v = statistics.stdev(all_vals) if len(all_vals) >= 2 else 0
                vol = round(std_v / mean_v, 4) if mean_v > 0 else 0
            
            cur.execute("""INSERT OR REPLACE INTO store_flow_index 
                (store_id, calc_date, index_value, baseline, actual_value, year_over_year, volatility)
                VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (store_id, d, index_val, baseline, actual, yoy, vol))
            store_idx_count += 1
    
    conn.commit()
    print(f"  Store indices: {store_idx_count}")
    
    # 商场指数：baseline 用近7日移动均值（因无去年同期数据）
    mall_idx_count = 0
    cur.execute("SELECT DISTINCT mall_id FROM mall_flow_daily")
    malls = [r[0] for r in cur.fetchall()]
    cur.execute("SELECT DISTINCT data_date FROM mall_flow_daily ORDER BY data_date")
    mall_dates = [r[0] for r in cur.fetchall()]
    
    for mall_id in malls:
        # 取该商场全部日客流数据
        cur.execute("SELECT data_date, visitor_count FROM mall_flow_daily WHERE mall_id=? ORDER BY data_date", (mall_id,))
        rows = cur.fetchall()
        if not rows:
            continue
        
        date_values = {r[0]: r[1] for r in rows}
        sorted_dates = sorted(date_values.keys())
        
        for i, d in enumerate(sorted_dates):
            actual = date_values[d]
            
            # 近7日移动均值作为 baseline（不包含当天）
            window_dates = sorted_dates[max(0, i-7):i]
            if len(window_dates) < 2:
                continue
            baseline = round(statistics.mean([date_values[wd] for wd in window_dates]))
            
            index_val = round(actual / baseline * 100, 2)
            
            # 环比: (today - yesterday) / yesterday * 100
            mom = None
            if i > 0:
                prev_val = date_values[sorted_dates[i-1]]
                if prev_val > 0:
                    mom = round((actual - prev_val) / prev_val * 100, 2)
            
            # 波动系数: 近7日 std/mean
            vol = 0.0
            recent_vals = [date_values[sorted_dates[j]] for j in range(max(0, i-6), i+1) if date_values[sorted_dates[j]] > 0]
            if len(recent_vals) >= 3:
                mean_v = statistics.mean(recent_vals)
                std_v = statistics.stdev(recent_vals)
                vol = round(std_v / mean_v, 4) if mean_v > 0 else 0
            
            cur.execute("""INSERT OR REPLACE INTO mall_flow_index 
                (mall_id, calc_date, index_value, baseline, actual_value, month_over_month, volatility)
                VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (mall_id, d, index_val, baseline, actual, mom, vol))
            mall_idx_count += 1
    
    conn.commit()
    print(f"  Mall indices: {mall_idx_count}")
    
    # 背离度诊断
    diag_count = 0
    for store_id in stores:
        cur.execute("SELECT calc_date, index_value FROM store_flow_index WHERE store_id=? ORDER BY calc_date", (store_id,))
        store_indices = {r[0]: r[1] for r in cur.fetchall()}
        
        # Get mall for this store
        cur.execute("SELECT m.mall_id FROM stores s JOIN malls m ON s.mall_id=m.id WHERE s.store_id=?", (store_id,))
        mall_row = cur.fetchone()
        if not mall_row:
            continue
        mall_id_str = mall_row[0]
        
        cur.execute("SELECT calc_date, index_value FROM mall_flow_index WHERE mall_id=? ORDER BY calc_date", (mall_id_str,))
        mall_indices = {r[0]: r[1] for r in cur.fetchall()}
        
        for d, store_idx in store_indices.items():
            mall_idx = mall_indices.get(d)
            if mall_idx is None:
                continue
            deviation = round(store_idx - mall_idx, 2)
            boston_quadrant = classify_boston(mall_idx, store_idx)
            
            cur.execute("""INSERT OR REPLACE INTO diagnosis_records
                (store_id, calc_date, boston_x, boston_y, boston_quadrant, deviation)
                VALUES (?, ?, ?, ?, ?, ?)""",
                (store_id, d, mall_idx, store_idx, boston_quadrant, deviation))
            diag_count += 1
    
    conn.commit()
    print(f"  Diagnosis records: {diag_count}")

def classify_boston(mall_idx, store_idx):
    """波士顿矩阵四象限分类"""
    if mall_idx >= 100 and store_idx >= 100:
        return 'star'
    elif mall_idx >= 100 and store_idx < 100:
        return 'cash_cow'
    elif mall_idx < 100 and store_idx >= 100:
        return 'question_mark'
    else:
        return 'problem'

def seed_auth_data(conn, cur):
    """预设角色和权限数据"""
    permissions = [
        ('dashboard.view', '查看首页看板', 'dashboard'),
        ('diagnosis.view', '查看诊断中心', 'diagnosis'),
        ('diagnosis.export', '导出诊断数据', 'diagnosis'),
        ('alert.view', '查看实时预警', 'alert'),
        ('alert.rule_manage', '管理预警规则', 'alert'),
        ('alert.handle', '处理预警', 'alert'),
        ('district.compare', '商圈对比分析', 'district'),
        ('report.view', '查看报告', 'report'),
        ('report.export', '导出报告', 'report'),
        ('store.detail', '查看门店详情', 'store'),
        ('asset.manage', '管理资产配置', 'asset'),
        ('asset.import', '导入数据', 'asset'),
        ('system.user_manage', '管理账号', 'system'),
        ('system.role_manage', '管理角色', 'system'),
        ('system.log_view', '查看操作日志', 'system'),
        ('system.config', '系统配置', 'system'),
    ]
    for code, name, mod in permissions:
        cur.execute("INSERT OR IGNORE INTO permissions (code, name, module) VALUES (?, ?, ?)", (code, name, mod))
    
    roles = [
        ('super_admin', '超级管理员', 'all', json.dumps([p[0] for p in permissions])),
        ('brand_director', '品牌总监', 'brand', json.dumps([p[0] for p in permissions if p[2] != 'system'])),
        ('regional_manager', '区域经理', 'region', json.dumps(['dashboard.view', 'diagnosis.view', 'alert.view', 'alert.handle', 'district.compare', 'report.view', 'store.detail'])),
        ('city_manager', '城市经理', 'city', json.dumps(['dashboard.view', 'diagnosis.view', 'alert.view', 'alert.handle', 'report.view', 'store.detail'])),
        ('store_manager', '门店店长', 'store', json.dumps(['store.detail', 'alert.view', 'alert.handle'])),
        ('analyst', '数据分析员', 'brand', json.dumps(['dashboard.view', 'diagnosis.view', 'diagnosis.export', 'district.compare', 'report.view', 'report.export'])),
        ('viewer', '只读用户', 'brand', json.dumps(['dashboard.view', 'diagnosis.view', 'report.view'])),
    ]
    for name, display, scope, perms in roles:
        cur.execute("INSERT OR IGNORE INTO roles (name, description, data_scope, permissions) VALUES (?, ?, ?, ?)",
                     (name, display, scope, perms))
    
    # Default admin user (password: admin123)
    import hashlib
    pwd_hash = hashlib.sha256("admin123".encode()).hexdigest()
    cur.execute("SELECT id FROM roles WHERE name='super_admin'")
    admin_role = cur.fetchone()
    if admin_role:
        cur.execute("INSERT OR IGNORE INTO users (username, password_hash, display_name, role_id) VALUES (?, ?, ?, ?)",
                     ("admin", pwd_hash, "系统管理员", admin_role[0]))

def seed_alert_rules(conn, cur):
    """预设默认预警规则"""
    rules = [
        ('门店指数严重下跌', 'store_index_drop', 
         json.dumps({"field": "index_value", "operator": "lt", "threshold": 80}),
         'global', 'critical'),
        ('门店指数警告下跌', 'store_index_drop',
         json.dumps({"field": "index_value", "operator": "lt", "threshold": 90}),
         'global', 'warning'),
        ('背离度严重负向', 'deviation_negative',
         json.dumps({"field": "deviation", "operator": "lt", "threshold": -30}),
         'global', 'critical'),
        ('背离度警告负向', 'deviation_negative',
         json.dumps({"field": "deviation", "operator": "lt", "threshold": -15}),
         'global', 'warning'),
        ('严重环比下降', 'mom_drop',
         json.dumps({"field": "index_value", "operator": "drop_pct", "threshold": -20}),
         'global', 'warning'),
    ]
    for name, rtype, conditions, scope, priority in rules:
        cur.execute("""INSERT OR IGNORE INTO alert_rules 
            (name, rule_type, conditions, scope_type, priority)
            VALUES (?, ?, ?, ?, ?)""",
            (name, rtype, conditions, scope, priority))

if __name__ == "__main__":
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print(f"Removed existing DB: {DB_PATH}")
    
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    
    create_schema(conn)
    import_data(conn)
    
    # Verify
    cur = conn.cursor()
    tables = ['brands', 'cities', 'business_districts', 'malls', 'stores', 
              'mall_flow_daily', 'store_flow_data', 'store_flow_index', 'mall_flow_index',
              'diagnosis_records', 'users', 'roles', 'permissions', 'alert_rules']
    for t in tables:
        cur.execute(f"SELECT COUNT(*) FROM {t}")
        print(f"  {t}: {cur.fetchone()[0]} rows")
    
    print(f"\nDB file: {DB_PATH} ({os.path.getsize(DB_PATH)/1024:.1f} KB)")
    conn.close()
