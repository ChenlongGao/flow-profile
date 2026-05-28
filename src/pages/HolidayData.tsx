import React, { useEffect, useState } from 'react'
import { Tag, Spin } from 'antd'
import { CalendarDays, AlertCircle } from 'lucide-react'

interface HolidayInfo {
  date: string; name: string; holiday: boolean;
  wage: number; rest: number; isFirst: boolean; blockDays: number;
}

export const HolidayData: React.FC = () => {
  const [year, setYear] = useState(2026)
  const [holidays, setHolidays] = useState<HolidayInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  const load = (y: number) => {
    setLoading(true); setError('')
    fetch(`https://timor.tech/api/holiday/year/${y}`)
      .then(r => r.json())
      .then(data => {
        if (data.code === 0 && data.holiday) {
          const raw: { date: string; name: string; holiday: boolean; wage: number; rest: number }[] =
            Object.entries(data.holiday)
              .filter(([_, v]: [string, any]) => v.holiday)
              .map(([date, v]: [string, any]) => ({
                date, name: v.name, holiday: v.holiday,
                wage: v.wage ?? 0, rest: v.rest ?? 1,
              }))
              .sort((a, b) => a.date.localeCompare(b.date))

          // 计算每个假日区块的连休天数
          // rest=1 表示和前一日连续，rest>1 表示新区块开始
          const blocks: number[] = []
          let currentBlock = 1
          for (let i = raw.length - 1; i >= 0; i--) {
            if (i < raw.length - 1 && raw[i + 1].rest === 1) {
              currentBlock++
            } else {
              currentBlock = 1
            }
            blocks[i] = currentBlock
          }
          // 用 block 开头日期的 rest 覆盖天数（rest=距上次天数，第一天rest才是真实的）
          for (let i = 0; i < raw.length; i++) {
            if (i === 0 || raw[i].rest !== 1) {
              // 新区块开始，用后续连续天数覆盖
              let j = i
              let cnt = 1
              while (j + 1 < raw.length && raw[j + 1].rest === 1) { j++; cnt++ }
              for (let k = i; k <= j; k++) blocks[k] = cnt
            }
          }

          const list: HolidayInfo[] = raw.map((r, i) => ({
            ...r,
            isFirst: i === 0 || r.rest !== 1,
            blockDays: blocks[i],
          }))

          setHolidays(list)
        } else {
          setError('节假日数据获取失败')
        }
      })
      .catch(() => setError('API 请求失败，请检查网络'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(year) }, [year])

  const getWeekLabel = (dateStr: string) => {
    const d = new Date(dateStr)
    return weekdayNames[d.getDay()]
  }

  const totalDays = holidays.length
  const wage3xDays = holidays.filter(h => h.wage === 3).length
  const wage2xDays = holidays.filter(h => h.wage === 2).length

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">假日数据</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">中国法定节假日，数据来源：Timor 节假日 API</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setYear(y => y - 1)} className="filter-btn-secondary text-xs px-2 py-1">◀</button>
          <span className="text-sm font-semibold text-[var(--text-primary)]">{year}年</span>
          <button onClick={() => setYear(y => y + 1)} className="filter-btn-secondary text-xs px-2 py-1">▶</button>
        </div>
      </div>

      {/* 统计卡 */}
      {!loading && !error && holidays.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '节假日天数', value: `${totalDays} 天`, color: '#EC4899' },
            { label: '三倍工资日', value: `${wage3xDays} 天`, color: '#EF4444' },
            { label: '双倍工资日', value: `${wage2xDays} 天`, color: '#F59E0B' },
          ].map(m => (
            <div key={m.label} className="card-level-1 p-3">
              <div className="text-[10px] text-[var(--text-muted)]">{m.label}</div>
              <div className="text-lg font-semibold mt-0.5" style={{ color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* 表格 */}
      <div className="card-level-1 overflow-hidden" style={{ padding: 0 }}>
        {loading ? (
          <div className="p-12 text-center"><Spin size="small" /><span className="ml-2 text-xs text-[var(--text-muted)]">加载假期数据...</span></div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-amber-400" />
            <p className="text-sm text-[var(--text-muted)]">{error}</p>
            <button onClick={() => load(year)} className="filter-btn-secondary text-xs mt-3">重试</button>
          </div>
        ) : holidays.length === 0 ? (
          <div className="p-12 text-center text-sm text-[var(--text-muted)]">暂无{year}年节假日数据</div>
        ) : (
          <table className="w-full text-xs">
            <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <tr>
                {['#','日期','星期','节日名称','连休天数','薪资倍数'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holidays.map((h, i) => (
                <tr key={h.date} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                  <td className="px-4 py-2.5 text-[var(--text-muted)]">{i + 1}</td>
                  <td className="px-4 py-2.5 text-[var(--text-primary)] font-medium">{h.date}</td>
                  <td className="px-4 py-2.5 text-[var(--text-secondary)]">{getWeekLabel(h.date)}</td>
                  <td className="px-4 py-2.5">
                    <Tag color="pink">{h.name}</Tag>
                    {h.isFirst && h.blockDays > 1 && (
                      <span className="text-[10px] text-[var(--text-muted)] ml-1">共{h.blockDays}天</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-number text-[var(--text-primary)]">{h.blockDays} 天</td>
                  <td className="px-4 py-2.5">
                    {h.wage === 3 ? <Tag color="red">3倍工资</Tag> : h.wage === 2 ? <Tag color="orange">2倍工资</Tag> : <span className="text-[var(--text-muted)]">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && !error && holidays.length > 0 && (
        <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
          <CalendarDays className="w-3 h-3" />
          数据来源：Timor 免费节假日 API · 连休天数自动计算 · 薪资倍数依据劳动法
        </div>
      )}
    </div>
  )
}
