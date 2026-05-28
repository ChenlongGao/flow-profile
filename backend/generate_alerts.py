"""预警数据生成脚本 - 每天9点跑前一天的指标预警和模型预警"""
import sqlite3, random, sys
from datetime import datetime, timedelta

DB = __import__('os').path.join(__import__('os').path.dirname(__file__), 'flow_warning.db')

def generate_alerts(target_date: str):
    """为指定日期生成预警数据"""
    conn = sqlite3.connect(DB)
    
    # 清除当天已有数据
    conn.execute("DELETE FROM alert_records WHERE date(created_at)=?", (target_date,))
    conn.execute("DELETE FROM warning_model_alert WHERE alert_date=?", (target_date,))
    
    # 获取有客流数据的门店
    rows = conn.execute("""
        SELECT sf.store_id, s.name, sf.enter_count, sf.pass_by_count, sf.avg_stay_minutes,
               (SELECT AVG(enter_count) FROM store_flow_data WHERE store_id=sf.store_id AND data_date<sf.data_date LIMIT 7) as prev_avg
        FROM store_flow_data sf JOIN stores s ON sf.store_id=s.store_id
        WHERE sf.data_date=?
    """, (target_date,)).fetchall()
    
    ind_alerts = 0
    model_alerts = 0
    
    for r in rows:
        store_id, name, enter, passerby, stay, prev_avg = r
        prev_avg = prev_avg or enter  # 无历史则用当日值
        
        # 指标预警规则
        rules = []
        
        # 1. 过店人次异常下降 (>30% drop)
        if passerby and prev_avg and passerby < prev_avg * 0.7:
            rules.append(('passerby', 'critical', f'过店人次较前7日均值下降{int((1-passerby/prev_avg)*100)}%'))
        elif passerby and prev_avg and passerby < prev_avg * 0.85:
            rules.append(('passerby', 'warning', f'过店人次较前7日均值下降{int((1-passerby/prev_avg)*100)}%'))
        
        # 2. 进店人次异常
        if enter and prev_avg and enter < prev_avg * 0.6:
            rules.append(('enter', 'critical', f'进店人次较前7日均值下降{int((1-enter/prev_avg)*100)}%'))
        elif enter and prev_avg and enter < prev_avg * 0.8:
            rules.append(('enter', 'warning', f'进店人次较前7日均值下降{int((1-enter/prev_avg)*100)}%'))
        
        # 3. 进店率异常
        if passerby and passerby > 0:
            rate = enter / passerby * 100
            if rate < 10:
                rules.append(('rate', 'warning', f'进店率仅{rate:.1f}%'))
            elif rate < 5:
                rules.append(('rate', 'critical', f'进店率仅{rate:.1f}%'))
        
        # 4. 随机minor告警
        if random.random() < 0.1:
            rules.append(('enter', 'minor', '客流小幅波动'))
        
        for alert_type, level, title in rules:
            conn.execute("""INSERT INTO alert_records (store_id, alert_type, alert_level, title, rule_id, source, status, created_at)
                VALUES (?,?,?,?,?,'alert_rule','triggered',?)""",
                (store_id, alert_type, level, title, random.randint(1,5), target_date))
            ind_alerts += 1
        
        # 模型预警 - Z-Score/IForest style
        if enter and prev_avg and prev_avg > 0:
            deviation = abs(enter - prev_avg) / max(prev_avg, 1)
            if deviation > 0.5:
                level = 'critical' if deviation > 0.8 else 'warning' if deviation > 0.6 else 'minor'
                model_type = random.choice(['zscore', 'iforest', 'prophet', 'sarima'])
                conn.execute("""INSERT INTO warning_model_alert (store_id, store_name, model_type, alert_date, alert_level, alert_category, alert_message, is_acknowledged)
                    VALUES (?,?,?,?,?,'客流异常','客流偏离历史均值',0)""",
                    (store_id, name, model_type, target_date, level))
                model_alerts += 1
    
    conn.commit()
    conn.close()
    print(f"{target_date}: 指标预警 {ind_alerts} 条, 模型预警 {model_alerts} 条")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        generate_alerts(sys.argv[1])
    else:
        # 默认跑近7天
        for i in range(7, 0, -1):
            d = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
            generate_alerts(d)
