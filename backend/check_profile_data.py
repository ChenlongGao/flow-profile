#!/usr/bin/env python3
"""
商场LBS画像数据质量检查与修复工具 v2
- 正确检查：每个商场每个标签的百分比之和应≈100%
- 检查TGI合理性
- 检查到访偏好标签数据格式问题
- 生成测试报告
- 自动修复可修复的问题
"""

import sqlite3
import json
from collections import defaultdict
from datetime import datetime

DB_PATH = 'flow_warning.db'

def get_db():
    return sqlite3.connect(DB_PATH)

def check_data_quality():
    """检查数据质量，返回测试报告"""
    conn = get_db()
    report = {
        "timestamp": datetime.now().isoformat(),
        "summary": {},
        "issues": [],
        "details": {}
    }

    try:
        # 1. 基础统计
        total_records = conn.execute("SELECT COUNT(*) FROM mall_profile_data").fetchone()[0]
        total_tags = conn.execute("SELECT COUNT(DISTINCT tag_id) FROM mall_profile_data").fetchone()[0]
        total_malls = conn.execute("SELECT COUNT(DISTINCT mall_id) FROM mall_profile_data").fetchone()[0]

        # 2. 检查NULL值
        null_pct = conn.execute("SELECT COUNT(*) FROM mall_profile_data WHERE percentage IS NULL").fetchone()[0]
        null_tgi = conn.execute("SELECT COUNT(*) FROM mall_profile_data WHERE tgi IS NULL").fetchone()[0]
        null_tag_value = conn.execute("SELECT COUNT(*) FROM mall_profile_data WHERE tag_value IS NULL OR tag_value = ''").fetchone()[0]

        report["summary"] = {
            "total_records": total_records,
            "total_tags": total_tags,
            "total_malls": total_malls,
            "null_percentage_count": null_pct,
            "null_tgi_count": null_tgi,
            "null_tag_value_count": null_tag_value,
        }

        # 3. 检查每个商场每个标签的百分比之和
        pct_issues = []
        
        # 获取所有tag信息
        tags = conn.execute("""
            SELECT t.id, t.tag_name, t.category, t.tag_values
            FROM mall_profile_tags t
            ORDER BY t.category, t.sort_order
        """).fetchall()

        for tag_id, tag_name, category, expected_values in tags:
            # 获取该标签下所有商场的百分比之和
            mall_sums = conn.execute("""
                SELECT mall_id, SUM(percentage) as total_pct, COUNT(*) as value_count
                FROM mall_profile_data
                WHERE tag_id = ?
                GROUP BY mall_id
                HAVING ABS(SUM(percentage) - 100) > 5
            """, (tag_id,)).fetchall()

            if mall_sums:
                pct_issues.append({
                    "tag_id": tag_id,
                    "tag_name": tag_name,
                    "category": category,
                    "affected_malls": len(mall_sums),
                    "samples": [
                        {"mall_id": r[0], "total_pct": round(r[1], 2), "value_count": r[2]}
                        for r in mall_sums[:5]  # 只显示前5个样本
                    ]
                })

        # 4. 检查TGI值是否合理（通常在0-200之间，100表示平均水平）
        tgi_issues = []
        tgi_out_of_range = conn.execute("""
            SELECT COUNT(*) FROM mall_profile_data
            WHERE tgi < 0 OR tgi > 200
        """).fetchone()[0]

        if tgi_out_of_range > 0:
            tgi_issues.append({
                "issue": "TGI值超出合理范围(0-200)",
                "count": tgi_out_of_range
            })

        # 5. 检查到访偏好标签的数据格式问题
        tag_value_issues = []
        travel_tag = conn.execute("SELECT id, tag_values FROM mall_profile_tags WHERE tag_name='到访偏好'").fetchone()
        
        if travel_tag:
            tag_id = travel_tag[0]
            # 检查是否有多值共存的问题
            multivalue_records = conn.execute("""
                SELECT COUNT(*) FROM mall_profile_data
                WHERE tag_id = ? AND tag_value LIKE '%,%'
            """, (tag_id,)).fetchone()[0]

            if multivalue_records > 0:
                tag_value_issues.append({
                    "tag_id": tag_id,
                    "tag_name": "到访偏好",
                    "issue": "tag_value包含逗号分隔的多个值",
                    "count": multivalue_records
                })

        report["issues"] = {
            "percentage_sum_not_100": pct_issues,
            "tgi_out_of_range": tgi_issues,
            "tag_value_format_error": tag_value_issues,
        }

        # 6. 详细检查每个分类
        categories = conn.execute("SELECT DISTINCT category FROM mall_profile_tags").fetchall()
        for (category,) in categories:
            tag_details = conn.execute("""
                SELECT t.id, t.tag_name, t.tag_values
                FROM mall_profile_tags t
                WHERE t.category = ?
                ORDER BY t.sort_order
            """, (category,)).fetchall()

            report["details"][category] = {
                "tag_count": len(tag_details),
                "tags": []
            }

            for tag_id, tag_name, expected_values in tag_details:
                # 统计有问题的商场数量
                bad_malls = conn.execute("""
                    SELECT COUNT(DISTINCT mall_id) FROM (
                        SELECT mall_id, ABS(SUM(percentage) - 100) as dev
                        FROM mall_profile_data
                        WHERE tag_id = ?
                        GROUP BY mall_id
                        HAVING dev > 5
                    )
                """, (tag_id,)).fetchone()[0]

                total_mall_count = conn.execute("""
                    SELECT COUNT(DISTINCT mall_id) FROM mall_profile_data WHERE tag_id = ?
                """, (tag_id,)).fetchone()[0]

                report["details"][category]["tags"].append({
                    "tag_id": tag_id,
                    "tag_name": tag_name,
                    "expected_values": expected_values.split(',') if expected_values else [],
                    "total_malls": total_mall_count,
                    "bad_malls": bad_malls,
                    "health": "✓" if bad_malls == 0 else "✗"
                })

        return report

    finally:
        conn.close()

def print_report(report):
    """打印测试报告"""
    print("=" * 80)
    print("商场LBS画像数据质量测试报告 v2")
    print("=" * 80)
    print(f"生成时间: {report['timestamp']}")
    print()

    # 摘要
    s = report['summary']
    print("【摘要统计】")
    print(f"  总记录数: {s['total_records']}")
    print(f"  标签数量: {s['total_tags']}")
    print(f"  商场数量: {s['total_malls']}")
    print(f"  NULL百分比记录: {s['null_percentage_count']}")
    print(f"  NULL TGI记录: {s['null_tgi_count']}")
    print(f"  NULL tag_value记录: {s['null_tag_value_count']}")
    print()

    # 问题汇总
    issues = report['issues']
    print("【问题汇总】")
    print(f"  百分比之和≠100%的(商场×标签)组合: {len(issues['percentage_sum_not_100'])} 个标签有影响")
    print(f"  TGI超出范围的记录: {issues['tgi_out_of_range'][0]['count'] if issues['tgi_out_of_range'] else 0} 条")
    print(f"  tag_value格式错误的记录: {issues['tag_value_format_error'][0]['count'] if issues['tag_value_format_error'] else 0} 条")
    print()

    # 详细问题
    if issues['percentage_sum_not_100']:
        print("【百分比之和≠100%的标签（影响商场数）】")
        for item in issues['percentage_sum_not_100']:
            print(f"  - {item['category']} > {item['tag_name']} (ID:{item['tag_id']})")
            print(f"    受影响商场数: {item['affected_malls']}")
            if item['samples']:
                print(f"    样本（前5个）:")
                for sample in item['samples']:
                    print(f"      - mall_id: {sample['mall_id'][:20]}..., 总和: {sample['total_pct']}%, 值数量: {sample['value_count']}")
        print()

    if issues['tag_value_format_error']:
        print("【tag_value格式错误】")
        for item in issues['tag_value_format_error']:
            print(f"  - {item['tag_name']} (ID:{item['tag_id']})")
            print(f"    {item['issue']}, 影响记录数: {item['count']}")
        print()

    # 分类详情
    print("【分类详情】")
    for category, detail in report['details'].items():
        print(f"\n  ▸ {category} ({detail['tag_count']}个标签)")
        for tag in detail['tags']:
            health = tag['health']
            print(f"    {health} {tag['tag_name']}: {tag['bad_malls']}/{tag['total_malls']} 商场有问题")

    print()
    print("=" * 80)

def fix_data():
    """修复数据问题"""
    conn = get_db()
    fixed_count = 0

    try:
        print("开始修复数据...")

        # 1. 修复到访偏好多值问题
        travel_tag = conn.execute("SELECT id FROM mall_profile_tags WHERE tag_name='到访偏好'").fetchone()

        if travel_tag:
            tag_id = travel_tag[0]
            multivalue_records = conn.execute("""
                SELECT id, mall_id, tag_value, percentage, tgi
                FROM mall_profile_data
                WHERE tag_id = ? AND tag_value LIKE '%,%'
            """, (tag_id,)).fetchall()

            if multivalue_records:
                print(f"  发现 {len(multivalue_records)} 条到访偏好多值记录，开始拆分...")

                for record in multivalue_records:
                    record_id, mall_id, tag_value, pct, tgi = record
                    values = [v.strip() for v in tag_value.split(',')]

                    # 计算每个值的平分百分比和TGI
                    per_value_pct = pct / len(values) if pct else 0
                    per_value_tgi = tgi / len(values) if tgi else 100

                    # 删除原记录
                    conn.execute("DELETE FROM mall_profile_data WHERE id = ?", (record_id,))

                    # 插入拆分后的记录
                    for val in values:
                        conn.execute("""
                            INSERT INTO mall_profile_data (mall_id, tag_id, tag_value, percentage, tgi)
                            VALUES (?, ?, ?, ?, ?)
                        """, (mall_id, tag_id, val, per_value_pct, per_value_tgi))
                        fixed_count += 1

                print(f"  拆分完成，新增 {fixed_count} 条记录")

        # 2. 修复百分比之和≠100%的问题
        # 对每个(商场×标签)组合，归一化百分比使其之和为100%
        tags = conn.execute("SELECT id FROM mall_profile_tags").fetchall()

        for (tag_id,) in tags:
            # 获取所有需要修复的商场
            bad_malls = conn.execute("""
                SELECT mall_id, SUM(percentage) as total_pct
                FROM mall_profile_data
                WHERE tag_id = ?
                GROUP BY mall_id
                HAVING ABS(SUM(percentage) - 100) > 5
            """, (tag_id,)).fetchall()

            for mall_id, total_pct in bad_malls:
                # 获取该商场该标签的所有记录
                records = conn.execute("""
                    SELECT id, percentage FROM mall_profile_data
                    WHERE mall_id = ? AND tag_id = ? AND percentage IS NOT NULL
                """, (mall_id, tag_id)).fetchall()

                if not records:
                    continue

                # 归一化
                for record_id, pct in records:
                    new_pct = (pct / total_pct) * 100
                    conn.execute("UPDATE mall_profile_data SET percentage = ? WHERE id = ?", (new_pct, record_id))
                    fixed_count += 1

        conn.commit()
        print(f"修复完成，共处理 {fixed_count} 条记录")

    except Exception as e:
        conn.rollback()
        print(f"修复失败: {e}")
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == 'fix':
        # 先检查
        report = check_data_quality()
        print_report(report)
        print("\n" + "=" * 80)
        confirm = input("是否开始修复数据？(yes/no): ")
        if confirm.lower() == 'yes':
            fix_data()
            # 修复后重新检查
            print("\n修复后重新检查...")
            report = check_data_quality()
            print_report(report)
        else:
            print("取消修复")
    else:
        # 只检查，不修复
        report = check_data_quality()
        print_report(report)
        print("\n提示: 运行 `python3 check_profile_data.py fix` 来修复数据")
