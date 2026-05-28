"""客流预测定时任务 - 每天9点为所有门店生成未来7天客流预测"""
import sqlite3, os, random, math, json
from datetime import datetime, timedelta

DB = os.path.join(os.path.dirname(__file__), 'flow_warning.db')
PREDICT_DAYS = 7

def generate_predictions():
    conn = sqlite3.connect(DB)
    today = datetime.now().strftime('%Y-%m-%d')
    print(f"[{today}] 开始客流预测...")
    
    # 获取所有活跃门店
    stores = conn.execute("SELECT store_id, name FROM stores WHERE status='open'").fetchall()
    total_stores = 0
    
    for store_id, name in stores:
        # 获取近30天实际客流数据
        start_30 = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        rows = conn.execute("""
            SELECT data_date, enter_count, pass_by_count, avg_stay_minutes
            FROM store_flow_data 
            WHERE store_id=? AND data_date BETWEEN ? AND ?
            ORDER BY data_date
        """, (store_id, start_30, today)).fetchall()
        
        if len(rows) < 14:
            continue  # 数据不足，跳过
        
        # 近7天均值作为基线
        recent = rows[-7:]
        avg_enter = sum(r[1] for r in recent) / len(recent)
        avg_pass = sum(r[2] for r in recent) / len(recent) if recent[0][2] else avg_enter * 1.3
        avg_stay = sum(r[3] for r in recent if r[3]) / max(1, sum(1 for r in recent if r[3]))
        
        # 计算趋势（近7天 vs 前7天）
        prev = rows[-14:-7] if len(rows) >= 14 else rows[:7]
        prev_avg = sum(r[1] for r in prev) / len(prev) if prev else avg_enter
        trend = (avg_enter / prev_avg - 1) if prev_avg > 0 else 0  # -1 to 1
        
        # 生成预测
        for day_offset in range(1, PREDICT_DAYS + 1):
            pred_date = (datetime.now() + timedelta(days=day_offset)).strftime('%Y-%m-%d')
            
            # 简单预测：均值 + 趋势 + 随机波动
            is_weekend = 1 if datetime.strptime(pred_date, '%Y-%m-%d').weekday() >= 5 else 0
            
            weekend_factor = 1.15 if is_weekend else 1.0
            trend_factor = 1.0 + trend * (day_offset / 7.0)  # 趋势递减
            noise = random.gauss(1.0, 0.05)
            
            pred_enter = max(0, int(avg_enter * weekend_factor * trend_factor * noise))
            pred_pass = max(0, int(avg_pass * weekend_factor * trend_factor * noise))
            pred_stay = max(0, round(avg_stay * (0.95 + random.random() * 0.1), 1))
            
            # 置信区间
            lower = max(0, int(pred_enter * 0.85))
            upper = int(pred_enter * 1.15)
            
            conn.execute("""INSERT OR REPLACE INTO store_flow_index 
                (store_id, calc_date, index_value, baseline, actual_value, year_over_year, month_over_month, volatility)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (store_id, pred_date, pred_enter, avg_enter, None, 
                 round(trend * 100, 1), round((pred_enter/avg_enter-1)*100, 1) if avg_enter > 0 else 0,
                 round(random.uniform(0.05, 0.15), 3)))
        
        total_stores += 1
    
    conn.commit()
    conn.close()
    print(f"[{today}] 客流预测完成: {total_stores} 门店, 未来{PREDICT_DAYS}天")

if __name__ == '__main__':
    generate_predictions()
