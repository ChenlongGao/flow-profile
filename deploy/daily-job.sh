#!/bin/bash
# 每日客流数据生成 + 预警计算
# 每天 6:00 执行，处理前一天的客流和预警

YESTERDAY=$(date -d 'yesterday' '+%Y-%m-%d')
echo "[$(date)] 开始处理 $YESTERDAY 客流和预警数据..."

# 1. 生成前一天的客流数据
docker exec flow_backend python3 -c "
import sqlite3, random
from datetime import datetime

conn = sqlite3.connect('/app/flow_warning.db')
target = '$YESTERDAY'

# 检查是否已有数据
cnt = conn.execute('SELECT COUNT(*) FROM store_flow_data WHERE data_date=?',(target,)).fetchone()[0]
if cnt > 0:
    print(f'{target} 已有 {cnt} 条客流数据，跳过')
    conn.close()
    exit()

# 取最新一天的数据作为模板
prev = conn.execute('''
    SELECT store_id, enter_count, pass_by_count, enter_people, pass_by_people,
           avg_stay_minutes, male_ratio, female_ratio,
           age_18_24_ratio, age_25_34_ratio, age_35_44_ratio, age_45_plus_ratio, mall_id
    FROM store_flow_data WHERE data_date=(SELECT MAX(data_date) FROM store_flow_data)
''').fetchall()

if not prev:
    print('没有历史数据模板')
    conn.close()
    exit()

print(f'基于 {len(prev)} 条模板生成 {target} 客流数据...')
f = lambda v: max(0, round(v * (0.9 + random.random() * 0.2), 1)) if v else 0

inserted = 0
for r in prev:
    sid, enter, pb, ep, pbp, stay, mr, fr, a18, a25, a35, a45, mall = r
    conn.execute('''INSERT INTO store_flow_data
        (store_id, data_date, enter_count, pass_by_count, enter_people, pass_by_people,
         avg_stay_minutes, male_ratio, female_ratio,
         age_18_24_ratio, age_25_34_ratio, age_35_44_ratio, age_45_plus_ratio, mall_id)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
        (sid, target, int(f(enter)), int(f(pb)), int(f(ep)), int(f(pbp)),
         f(stay), min(1,f(mr)), min(1,f(fr)),
         min(1,f(a18)), min(1,f(a25)), min(1,f(a35)), min(1,f(a45)), mall))
    inserted += 1

# 商场客流
mall_prev = conn.execute('SELECT mall_id, visitor_count, is_weekend FROM mall_flow_daily WHERE data_date=(SELECT MAX(data_date) FROM mall_flow_daily)').fetchall()
mw = 0
for r in mall_prev:
    mid, vc, iw = r
    vc2 = max(0, int(vc * (0.9 + random.random() * 0.2)))
    is_we = 0 if datetime.strptime(target,'%Y-%m-%d').weekday() < 5 else 1
    conn.execute('INSERT INTO mall_flow_daily(mall_id, data_date, visitor_count, is_weekend) VALUES(?,?,?,?)', (mid, target, vc2, is_we))
    mw += 1

conn.commit()
conn.close()
print(f'完成: {inserted} 门店客流 + {mw} 商场客流')
"

# 2. 生成预警数据
docker exec flow_backend python3 generate_alerts.py "$YESTERDAY"

echo "[$(date)] 处理完成"
