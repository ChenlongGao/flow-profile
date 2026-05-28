"""
客流预警系统 - 推送引擎
负责：数据拉取、消息格式化、多渠道推送、调度检查
"""
import json, time, sqlite3, urllib.request, os
from datetime import datetime, date, timedelta
from typing import Optional, Dict, Any, List

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "flow_warning.db"))

def _get_db():
    conn = sqlite3.connect(DB_PATH); conn.row_factory = sqlite3.Row; return conn

# ═══════════════════════════════════════════════
#  推送日志记录
# ═══════════════════════════════════════════════
def init_push_log_table():
    conn = _get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS push_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_config_id INTEGER,
            report_name TEXT,
            channel TEXT,
            recipients TEXT,
            status TEXT DEFAULT 'pending',
            message TEXT,
            error TEXT,
            duration_ms INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit(); conn.close()

def log_push(config_id, name, channel, recipients, status, message="", error="", duration=0):
    conn = _get_db()
    conn.execute("INSERT INTO push_logs (report_config_id, report_name, channel, recipients, status, message, error, duration_ms) VALUES(?,?,?,?,?,?,?,?)",
        (config_id, name, channel, recipients, status, message[:500] if message else "", error[:500] if error else "", duration))
    conn.commit(); conn.close()

# ═══════════════════════════════════════════════
#  数据拉取
# ═══════════════════════════════════════════════
def fetch_report_data(config: dict) -> Dict[str, Any]:
    """根据 report_config 拉取对应数据字段"""
    conn = _get_db()
    cur = conn.cursor()
    today = date.today().isoformat()

    data_fields = config.get('data_fields', [])
    if isinstance(data_fields, str):
        try: data_fields = json.loads(data_fields)
        except: data_fields = []

    result = {"date": today, "report_name": config.get("name", "")}

    # 门店客流指标
    store_fields = [f for f in data_fields if f in ('passerby','enter','passerby_people','enter_people','rate','stay')]
    if store_fields:
        row = cur.execute("""
            SELECT SUM(pass_by_count) as pc, SUM(enter_count) as ec,
                   SUM(pass_by_people) as pp, SUM(enter_people) as ep,
                   AVG(avg_stay_minutes) as st, MAX(data_date) as latest
            FROM store_flow_data WHERE data_date = (SELECT MAX(data_date) FROM store_flow_data)
        """).fetchone()
        if row:
            ec = row['ec'] or 0; pc = row['pc'] or 0
            result['passerby'] = pc
            result['enter'] = ec
            result['passerby_people'] = row['pp'] or 0
            result['enter_people'] = row['ep'] or 0
            result['rate'] = f"{ec/pc*100:.1f}%" if pc > 0 else "0%"
            result['stay'] = f"{row['st'] or 0:.1f}分钟"

    # 昨日数据（用于对比）
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    if 'yoy' in data_fields or 'mom' in data_fields:
        ytd = cur.execute("SELECT SUM(enter_count) as ec FROM store_flow_data WHERE data_date=?",(yesterday,)).fetchone()
        today_ec = cur.execute("SELECT SUM(enter_count) as ec FROM store_flow_data WHERE data_date=?",(today,)).fetchone()
        if ytd and today_ec:
            t = today_ec['ec'] or 0; y = ytd['ec'] or 0
            result['yoy'] = f"{((t-y)/y*100):+.1f}%" if y > 0 else "0%"
            result['mom'] = result['yoy']

    # 商场客流
    if any(f in data_fields for f in ('mall_total','mall_weekday','mall_weekend','mall_peak')):
        today_row = cur.execute("SELECT SUM(visitor_count) as total FROM mall_flow_daily WHERE data_date=?",(today,)).fetchone()
        result['mall_total'] = today_row['total'] or 0 if today_row else 0

        wkday_row = cur.execute("SELECT SUM(visitor_count) as t FROM mall_flow_daily WHERE data_date=? AND is_weekend=0",(today,)).fetchone()
        wkend_row = cur.execute("SELECT SUM(visitor_count) as t FROM mall_flow_daily WHERE data_date=? AND is_weekend=1",(today,)).fetchone()
        result['mall_weekday'] = wkday_row['t'] or 0 if wkday_row else 0
        result['mall_weekend'] = wkend_row['t'] or 0 if wkend_row else 0

        peak_row = cur.execute("SELECT MAX(visitor_count) as peak FROM mall_flow_daily WHERE data_date=?",(today,)).fetchone()
        result['mall_peak'] = peak_row['peak'] or 0 if peak_row else 0

    # 门店数
    store_count = cur.execute("SELECT COUNT(*) as cnt FROM stores WHERE status='open'").fetchone()['cnt']
    mall_count = cur.execute("SELECT COUNT(*) as cnt FROM malls WHERE status='open'").fetchone()['cnt']
    result['store_count'] = store_count
    result['mall_count'] = mall_count

    conn.close()
    return result

# ═══════════════════════════════════════════════
#  消息格式化
# ═══════════════════════════════════════════════
def format_message(config: dict, data: Dict[str, Any], template: Optional[dict] = None) -> str:
    """将数据填入模板生成推送消息"""
    template_type = (template or {}).get('template_type', 'text')
    content = (template or {}).get('content', '')

    if not content:
        # 默认模板
        lines = [f"【{config.get('name', '客流报告')}】{data.get('date', '')}"]
        for k, v in data.items():
            if k not in ('date','report_name','store_count','mall_count'):
                lines.append(f"  {k}: {v}")
        content = "\n".join(lines)

    # 变量替换
    content = content.replace('{date}', str(data.get('date', '')))
    content = content.replace('{store_name}', str(data.get('report_name', '')))
    for k, v in data.items():
        if k not in ('date','report_name'):
            content = content.replace(f'{{{k}}}', str(v))

    return content

# ═══════════════════════════════════════════════
#  渠道推送
# ═══════════════════════════════════════════════
def push_to_channel(channel_config: dict, message: str, template_type: str = 'text') -> Dict[str, Any]:
    """向指定通道推送消息，返回 {success, message}"""
    ch = channel_config['channel']
    headers = {"Content-Type": "application/json"}
    try:
        if ch == 'wechat_work':
            if not channel_config.get('webhook_url'): return {"success": False, "message": "未配置Webhook"}
            msg_type = "markdown" if template_type == 'markdown' else "text"
            payload = {"msgtype": msg_type, msg_type: {"content": message}}
            req = urllib.request.Request(channel_config['webhook_url'], data=json.dumps(payload, ensure_ascii=False).encode('utf-8'), headers=headers, method="POST")
            resp = urllib.request.urlopen(req, timeout=10)
            r = json.loads(resp.read())
            if r.get('errcode') == 0: return {"success": True, "message": "✓ 企业微信发送成功"}
            return {"success": False, "message": f"企微错误: {r.get('errmsg','')}"}

        elif ch == 'feishu':
            if not channel_config.get('webhook_url'): return {"success": False, "message": "未配置Webhook"}
            msg_type = "interactive" if template_type == 'markdown' else "text"
            payload = {"msg_type": "text", "content": {"text": message}}
            req = urllib.request.Request(channel_config['webhook_url'], data=json.dumps(payload, ensure_ascii=False).encode('utf-8'), headers=headers, method="POST")
            resp = urllib.request.urlopen(req, timeout=10)
            r = json.loads(resp.read())
            if r.get('code') == 0: return {"success": True, "message": "✓ 飞书发送成功"}
            return {"success": False, "message": f"飞书错误: {r.get('msg','')}"}

        elif ch == 'dingtalk':
            if not channel_config.get('webhook_url'): return {"success": False, "message": "未配置Webhook"}
            if template_type == 'markdown':
                payload = {"msgtype": "markdown", "markdown": {"title": "客流预警报告", "text": message}}
            else:
                payload = {"msgtype": "text", "text": {"content": message}}
            req = urllib.request.Request(channel_config['webhook_url'], data=json.dumps(payload, ensure_ascii=False).encode('utf-8'), headers=headers, method="POST")
            resp = urllib.request.urlopen(req, timeout=10)
            r = json.loads(resp.read())
            if r.get('errcode') == 0: return {"success": True, "message": "✓ 钉钉发送成功"}
            return {"success": False, "message": f"钉钉错误: {r.get('errmsg','')}"}

        elif ch == 'email':
            host = channel_config.get('smtp_host','')
            if not host: return {"success": False, "message": "未配置SMTP"}
            # SMTP 发送（同步简化版，生产环境用 Celery 异步）
            try:
                import smtplib
                from email.mime.text import MIMEText
                msg = MIMEText(message, 'html' if template_type=='markdown' else 'plain', 'utf-8')
                msg['Subject'] = f"客流预警报告 - {datetime.now().strftime('%Y-%m-%d')}"
                msg['From'] = channel_config.get('smtp_user', '')
                recipients = channel_config.get('recipients', '').split(',')
                msg['To'] = ', '.join(recipients)

                port = channel_config.get('smtp_port', 465)
                with smtplib.SMTP_SSL(host, port, timeout=10) as s:
                    if channel_config.get('smtp_user'):
                        s.login(channel_config['smtp_user'], channel_config.get('smtp_pass', ''))
                    s.send_message(msg)
                return {"success": True, "message": f"✓ 邮件发送成功 → {len(recipients)}位收件人"}
            except Exception as e:
                return {"success": False, "message": f"SMTP失败: {str(e)}"}

        elif ch == 'in_app':
            # 站内信：写入通知表
            conn = _get_db()
            conn.execute("INSERT INTO push_logs (report_config_id, report_name, channel, recipients, status, message) VALUES(?,?,?,?,?,?)",
                (None, "站内信推送", "in_app", channel_config.get('recipients',''), 'sent', message[:500]))
            conn.commit(); conn.close()
            return {"success": True, "message": "✓ 站内信已发送"}

        return {"success": False, "message": f"未知通道: {ch}"}
    except Exception as e:
        return {"success": False, "message": f"推送异常: {str(e)}"}

# ═══════════════════════════════════════════════
#  报告执行
# ═══════════════════════════════════════════════
def execute_report(config_id: int) -> Dict[str, Any]:
    """执行单条报告推送：拉数据→格式化→选模板→推送到所有启用通道"""
    t0 = time.time()
    conn = _get_db()

    # 1. 加载报告配置
    report = conn.execute("SELECT * FROM report_config WHERE id=?", (config_id,)).fetchone()
    if not report: conn.close(); return {"success": False, "message": "报告配置不存在"}
    report = dict(report)
    if not report['is_enabled']: conn.close(); return {"success": False, "message": "报告已禁用"}

    # 2. 加载消息模板（按 report 配置的 AI 说明或默认）
    tmpl_row = conn.execute("SELECT * FROM message_template_config WHERE is_enabled=1 ORDER BY id LIMIT 1").fetchone()
    template = dict(tmpl_row) if tmpl_row else None

    # 3. 拉取数据
    try:
        data = fetch_report_data(report)
    except Exception as e:
        conn.close(); return {"success": False, "message": f"数据拉取失败: {str(e)}"}

    # 4. 格式化消息
    if report.get('ai_interpretation') and report.get('ai_model_id'):
        # AI 生成模式：在消息末尾追加 AI 提示标记
        base_msg = format_message(report, data, template)
        message = base_msg + f"\n\n---\n🤖 AI解读: {report.get('ai_prompt_template','')[:100] if report.get('ai_prompt_template') else '待AI生成'}"
    else:
        message = format_message(report, data, template)

    # 5. 获取推送通道（默认通道 + 站内信）
    channels = conn.execute("""
        SELECT * FROM push_channel_config WHERE is_enabled=1
        ORDER BY is_default DESC, id
    """).fetchall()
    channels = [dict(ch) for ch in channels]

    if not channels:
        conn.close(); return {"success": False, "message": "没有启用的推送通道"}

    # 6. 逐通道推送
    results = []
    recipients = report.get('recipients','')
    for ch in channels:
        ch['recipients'] = recipients or ch.get('recipients','')
        r = push_to_channel(ch, message, (template or {}).get('template_type','text'))
        results.append({"channel": ch['channel'], "success": r['success'], "message": r['message']})
        # 记录日志
        log_push(config_id, report['name'], ch['channel'], recipients,
                 'sent' if r['success'] else 'failed', message if r['success'] else '',
                 '' if r['success'] else r.get('message',''),
                 int((time.time()-t0)*1000))

    conn.close()
    return {
        "success": any(r['success'] for r in results),
        "report": report['name'],
        "channels": len(results),
        "results": results,
        "duration_ms": int((time.time()-t0)*1000)
    }

def execute_all_due() -> Dict[str, Any]:
    """执行所有到期的报告推送"""
    conn = _get_db()
    now = datetime.now()
    hour_min = now.strftime('%H:%M')
    weekday = now.strftime('%a')

    # 判断需要推送的报告
    reports = conn.execute("SELECT * FROM report_config WHERE is_enabled=1").fetchall()
    conn.close()

    due_reports = []
    for row in reports:
        r = dict(row)
        push_time = r.get('push_time','')
        period = r.get('period','daily')

        should_push = False
        if period == 'daily':
            should_push = push_time == hour_min
        elif period == 'weekly':
            parts = push_time.split()
            should_push = len(parts)==2 and parts[0]==weekday and parts[1]==hour_min
        elif period == 'monthly':
            parts = push_time.split()
            today_day = now.strftime('%d')
            should_push = len(parts)==2 and parts[0]==today_day and parts[1]==hour_min

        if should_push:
            due_reports.append(r['id'])

    results = []
    for rid in due_reports:
        results.append(execute_report(rid))

    return {"executed": len(results), "results": results}

# 初始化
init_push_log_table()
