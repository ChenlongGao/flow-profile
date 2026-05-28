"""
客流API接入 - 同步引擎
功能：从外部API拉取数据 → 字段映射 → 写入DB
"""
import json, urllib.request, urllib.parse, time, sqlite3, os
from datetime import datetime
from typing import Dict, Any, List

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "flow_warning.db"))

# 门店客流表字段
STORE_FLOW_FIELDS = ['store_id','data_date','pass_by_count','pass_by_people','enter_count','enter_people','avg_stay_minutes','male_ratio','female_ratio','age_18_24_ratio','age_25_34_ratio','age_35_44_ratio','age_45_plus_ratio']

# 商场客流表字段
MALL_FLOW_FIELDS = ['mall_id','data_date','visitor_count','is_weekend']

def _db():
    conn = sqlite3.connect(DB_PATH); conn.row_factory = sqlite3.Row; return conn

def _log_sync(config_id, name, status, fetched, inserted, updated, skipped, error, duration):
    conn = _db()
    conn.execute("INSERT INTO flow_api_sync_log (api_config_id,api_config_name,status,records_fetched,records_inserted,records_updated,records_skipped,error_message,duration_ms) VALUES(?,?,?,?,?,?,?,?,?)",
        (config_id, name, status, fetched, inserted, updated, skipped, error[:500] if error else '', duration))
    conn.commit()
    conn.execute("UPDATE flow_api_config SET last_sync_at=CURRENT_TIMESTAMP, last_sync_status=? WHERE id=?",(status,config_id))
    conn.commit(); conn.close()

def _fetch_from_api(config: dict) -> List[dict]:
    """从外部API拉取原始数据"""
    url = config['base_url']
    if not url: return []
    headers = {"Content-Type": "application/json"}
    # 自定义头部
    if config.get('headers_json'):
        try: extra = json.loads(config['headers_json']); headers.update(extra)
        except: pass
    # 认证
    if config.get('auth_type') == 'api_key' and config.get('api_key'):
        hdr = config.get('auth_header','Authorization')
        headers[hdr] = config['api_key']
    elif config.get('auth_type') == 'bearer' and config.get('api_key'):
        headers['Authorization'] = f"Bearer {config['api_key']}"

    method = config.get('request_method','GET').upper()
    req_body = None
    if method == 'POST' and config.get('request_body'):
        try: req_body = json.dumps(json.loads(config['request_body'])).encode('utf-8')
        except: req_body = config['request_body'].encode('utf-8')

    req = urllib.request.Request(url, data=req_body, headers=headers, method=method)
    resp = urllib.request.urlopen(req, timeout=30)
    raw = json.loads(resp.read())

    # 兼容多种返回结构: 直接数组 / {data:[...]} / {list:[...]} / {results:[...]}
    if isinstance(raw, list): return raw
    for k in ('data','list','results','items','records'):
        if isinstance(raw.get(k), list): return raw[k]
    return [raw] if raw else []

def _map_record(record: dict, mapping: dict) -> dict:
    """字段映射: {api_field: db_field}"""
    if not mapping: return record
    mapped = {}
    for api_key, db_key in mapping.items():
        mapped[db_key] = record.get(api_key)
    return mapped

def sync_flow_api(config_id: int) -> Dict[str, Any]:
    """执行一次数据同步"""
    t0 = time.time()
    conn = _db()
    row = conn.execute("SELECT * FROM flow_api_config WHERE id=?",(config_id,)).fetchone()
    if not row: conn.close(); return {"success":False,"message":"配置不存在"}
    cfg = dict(row)
    if not cfg['is_enabled']: conn.close(); return {"success":False,"message":"配置已禁用"}
    conn.close()

    try:
        # 1) 拉取
        mapping = json.loads(cfg.get('field_mapping','') or '{}')
        records = _fetch_from_api(cfg)

        if not records:
            _log_sync(config_id, cfg['name'], 'success', 0,0,0,0, '', int((time.time()-t0)*1000))
            return {"success":True,"message":"API返回空数据","fetched":0}

        # 2) 映射 + 写入
        api_type = cfg['api_type']
        target_fields = STORE_FLOW_FIELDS if api_type == 'store_flow' else MALL_FLOW_FIELDS
        table = 'store_flow_data' if api_type == 'store_flow' else 'mall_flow_daily'
        id_col = 'store_id' if api_type == 'store_flow' else 'mall_id'

        conn = _db(); cur = conn.cursor()
        inserted, updated, skipped = 0, 0, 0

        for rec in records:
            mapped = _map_record(rec, mapping) if mapping else rec
            mapped_id = mapped.get(id_col) or rec.get(id_col)
            mapped_date = mapped.get('data_date') or rec.get('data_date')
            if not mapped_id or not mapped_date:
                skipped += 1; continue

            # 只取目标表字段
            clean = {f: mapped.get(f) for f in target_fields if f in mapped or f in rec}
            clean[id_col] = mapped_id; clean['data_date'] = mapped_date

            existing = cur.execute(f"SELECT 1 FROM {table} WHERE {id_col}=? AND data_date=?",
                                   (mapped_id, mapped_date)).fetchone()
            if existing:
                sets = [f"{k}=?" for k in clean if k not in (id_col,'data_date')]
                vals = [clean[k] for k in clean if k not in (id_col,'data_date')]
                if sets:
                    cur.execute(f"UPDATE {table} SET {','.join(sets)} WHERE {id_col}=? AND data_date=?", (*vals, mapped_id, mapped_date))
                    updated += 1
                else: skipped += 1
            else:
                cur.execute(f"INSERT INTO {table} ({','.join(clean.keys())}) VALUES({','.join('?'*len(clean))})", tuple(clean.values()))
                inserted += 1

        conn.commit(); conn.close()
        dur = int((time.time()-t0)*1000)
        _log_sync(config_id, cfg['name'], 'success', len(records), inserted, updated, skipped, '', dur)
        return {"success":True,"fetched":len(records),"inserted":inserted,"updated":updated,"skipped":skipped,"duration_ms":dur}
    except Exception as e:
        _log_sync(config_id, cfg['name'], 'failed', 0,0,0,0, str(e), int((time.time()-t0)*1000))
        return {"success":False,"message":str(e)}
