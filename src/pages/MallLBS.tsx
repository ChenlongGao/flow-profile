import React, { useEffect, useState, useMemo } from 'react'
import { api } from '../api/client'
import { BaseChart } from '../components/echarts/BaseChart'
import { COLORS } from '../config/echarts-theme'
import { formatNumber } from '../utils/format'
import { DatePicker, Select, Cascader, Pagination } from 'antd'
import dayjs from 'dayjs'

/* ═══════════════════════════════════════════════════════════════
   Sparkline - 迷你趋势线（复用门店客流组件）
   ═══════════════════════════════════════════════════════════════ */
const Sparkline: React.FC<{ data: number[]; color: string; height?: number }> = ({ data, color, height = 32 }) => {
  const [tip, setTip] = useState<{ x: number; v: number; sv: string } | null>(null)
  if (!data || data.length === 0) return <div style={{ height, width: 60 }} />;
  const max = Math.max(...data); const min = Math.min(...data); const range = max - min || 1
  const w = data.length * 8; const h = height
  const points = data.map((v, i) => `${(i / (data.length - 1 || 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ')
  const handleMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left; const i = Math.round((x / w) * (data.length - 1))
    const idx = Math.max(0, Math.min(data.length - 1, i))
    const v = data[idx]
    setTip({ x, v, sv: typeof v === 'number' && v >= 1000 ? formatNumber(v) : String(v) })
  }
  return (
    <div style={{ height, width: Math.max(w, 60), position: 'relative' }} onMouseMove={handleMove} onMouseLeave={() => setTip(null)}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {tip && (
          <g>
            <line x1={tip.x} y1={0} x2={tip.x} y2={h} stroke={color} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.4" />
            <circle cx={tip.x} cy={h - ((tip.v - min) / range) * (h - 4) - 2} r="3" fill={color} />
          </g>
        )}
      </svg>
      {tip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 rounded text-[9px] bg-gray-800 text-white whitespace-nowrap pointer-events-none" style={{ zIndex: 10 }}>
          {tip.sv}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MetricCard 指标卡组件（复用门店客流逻辑）
   ═══════════════════════════════════════════════════════════════ */
const MetricCard: React.FC<{
  label: string; value: string | number; yoy: number; wow: number;
  color: string; sparkData: number[];
}> = ({ label, value, yoy, wow, color, sparkData }) => {
  const fmt = (v: number): { c: string; t: string } => {
    if (v > 0) return { c: '#EF4444', t: `同比+${v.toFixed(1)}%` }
    if (v < 0) return { c: '#10B981', t: `同比${v.toFixed(1)}%` }
    return { c: '#9CA3AF', t: '同比持平' }
  }
  const yo = fmt(yoy)
  const wo = (() => {
    if (wow > 0) return { c: '#EF4444', t: `环比+${wow.toFixed(1)}%` }
    if (wow < 0) return { c: '#10B981', t: `环比${wow.toFixed(1)}%` }
    return { c: '#9CA3AF', t: '环比持平' }
  })()
  return (
    <div className="card-level-1 p-3 flex flex-col" style={{ minHeight: 104 }}>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
      </div>
      <div className="text-lg font-semibold text-number mb-1" style={{ color }}
        title={typeof value === 'number' ? formatNumber(value) : String(value)}>
        {typeof value === 'number' ? formatNumber(value) : value}
      </div>
      <div className="mt-auto flex items-end justify-between gap-1">
        <div className="flex items-center gap-1.5 text-[9px] shrink-0">
          <span style={{ color: yo.c }}>{yo.t}</span>
          <span style={{ color: wo.c }}>{wo.t}</span>
        </div>
        <Sparkline data={sparkData} color={color} height={28} />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TableCard 数据表格组件
   ═══════════════════════════════════════════════════════════════ */
const TableCard: React.FC<{
  title: string; cols: string[]; rows: any[][];
  onHeaderClick?: (index: number) => void;
}> = ({ title, cols, rows, onHeaderClick }) => (
  <div className="card-level-1 p-3 overflow-x-auto">
    <div className="chart-title mb-2">{title}</div>
    <table className="w-full text-xs text-left">
      <thead>
        <tr className="border-b border-[var(--border-subtle)]">
          {cols.map((c, i) => (
            <th key={i}
              className={`py-1.5 px-2 font-medium text-[var(--text-muted)] ${onHeaderClick ? 'cursor-pointer hover:text-[var(--text-primary)]' : ''}`}
              onClick={() => onHeaderClick?.(i)}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
            {row.map((cell, ci) => (
              <td key={ci} className="py-1.5 px-2 text-[var(--text-secondary)]">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   RankList 排行列表组件（商场版）
   ═══════════════════════════════════════════════════════════════ */
const RankList: React.FC<{ data: any[]; metric: string }> = ({ data, metric }) => {
  const sorted = [...data].sort((a, b) => (b[metric] || 0) - (a[metric] || 0)).slice(0, 10)
  const maxVal = Math.max(...sorted.map((d: any) => d[metric] || 0), 1)
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="flex flex-col" style={{ height: '100%', gap: '3px' }}>
      {sorted.map((d: any, i: number) => {
        const v = d[metric] || 0
        const pct = Math.max((v / maxVal * 100), 2)
        const name = (d.mall_name || d.mall_id).replace('APPLE', '').trim()
        const displayVal = v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v
        const barColor = i < 3 ? COLORS.red : '#0EA5E9'
        return (
          <div key={d.mall_id} className="flex items-center gap-2" style={{ flex: 1, minHeight: 0 }}>
            <span className="text-xs font-bold w-7 text-right shrink-0" style={{ color: barColor }}>
              {i < 3 ? medals[i] : i + 1}
            </span>
            <div className="flex-1 flex flex-col justify-center min-w-0" style={{ gap: 1 }}>
              <span className="text-[11px] text-[var(--text-primary)] truncate leading-tight">{name}</span>
              <div className="h-3 rounded-sm relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="h-full rounded-sm transition-all" style={{ width: `${pct}%`, background: barColor, opacity: i < 3 ? 1 : 0.75 }} />
              </div>
            </div>
            <span className="text-xs text-[var(--text-primary)] w-14 text-right shrink-0 tabular-nums">{displayVal}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Skeleton 加载骨架屏
   ═══════════════════════════════════════════════════════════════ */
const Skeleton = () => <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 rounded animate-pulse bg-[var(--bg-tertiary)]" />)}</div>

/* ═══════════════════════════════════════════════════════════════
   时间预设 & 工具函数（复用门店客流体系）
   ═══════════════════════════════════════════════════════════════ */
type TimePreset = 'today' | 'yesterday' | '7d' | '30d' | 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom'

const TIME_PRESETS: { label: string; value: TimePreset }[] = [
  { label: '今日', value: 'today' }, { label: '昨日', value: 'yesterday' },
  { label: '近7天', value: '7d' }, { label: '近30天', value: '30d' },
  { label: '按天', value: 'day' }, { label: '按周', value: 'week' },
  { label: '按月', value: 'month' }, { label: '按季', value: 'quarter' },
  { label: '按年', value: 'year' }, { label: '自定义', value: 'custom' },
]

function getPresetRange(preset: TimePreset): [dayjs.Dayjs, dayjs.Dayjs] | null {
  const now = dayjs()
  switch (preset) {
    case 'today': return [now, now]
    case 'yesterday': return [now.subtract(1, 'day'), now.subtract(1, 'day')]
    case '7d': return [now.subtract(6, 'day'), now]
    case '30d': return [now.subtract(29, 'day'), now]
    default: return null
  }
}

function formatDate(d: dayjs.Dayjs): string { return d.format('YYYY-MM-DD') }

const { RangePicker } = DatePicker

/* ═══════════════════════════════════════════════════════════════
   画像常量（商场版）
   ═══════════════════════════════════════════════════════════════ */
const AGE_GROUPS = [
  { label: '0-12岁', ratio: 1.5, desc: '儿童，家庭出行为主', color: '#8B5CF6' },
  { label: '13-17岁', ratio: 3.5, desc: '青少年，社交娱乐需求强', color: '#A78BFA' },
  { label: '18-24岁', ratio: 20, desc: '学生/Gen Z，社交娱乐消费', color: COLORS.primary },
  { label: '25-34岁', ratio: 23, desc: '年轻家庭/千禧一代，最大消费群体', color: '#38BDF8' },
  { label: '35-44岁', ratio: 20, desc: '中年主力，亲子消费突出', color: COLORS.amber },
  { label: '45-54岁', ratio: 16, desc: '成熟消费群，品质消费为主', color: '#10B981' },
  { label: '55岁以上', ratio: 16, desc: '银发群体，休闲养生需求增长', color: '#EC4899' },
]

type TabKey = 'flow' | 'profile' | 'ranking' | 'detail'

/* ═══════════════════════════════════════════════════════════════
   MallLBS - 商场客流页面（含Tab页签）
   ═══════════════════════════════════════════════════════════════ */
export const MallLBS: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('flow')

  // ─── 筛选状态 ───
  const [timePreset, setTimePreset] = useState<TimePreset>('7d')
  const [dateValue, setDateValue] = useState<any>(getPresetRange('7d'))

  // 商场搜索
  const [mallSearchVal, setMallSearchVal] = useState('')
  const [mallSearchList, setMallSearchList] = useState<{ label: string; value: string }[]>([])

  // 商场架构级联
  const [cascaderValue, setCascaderValue] = useState<string[]>([])
  const [cascaderOptions, setCascaderOptions] = useState<any[]>([])

  // 标签级联
  const [tagCascaderValue, setTagCascaderValue] = useState<string[]>([])
  const [tagCascaderOptions, setTagCascaderOptions] = useState<any[]>([])

  // 实际生效的查询参数
  const [appliedStart, setAppliedStart] = useState(dayjs().subtract(6, 'day').format('YYYY-MM-DD'))
  const [appliedEnd, setAppliedEnd] = useState(dayjs().format('YYYY-MM-DD'))
  const [appliedRegion, setAppliedRegion] = useState('')
  const [appliedTag, setAppliedTag] = useState('')

  // 查询参数构建
  const filterQs = useMemo(() => {
    let qs = `?start_date=${appliedStart}&end_date=${appliedEnd}`
    if (appliedTag) qs += `&tag=${encodeURIComponent(appliedTag)}`
    if (appliedRegion) qs += `&region=${encodeURIComponent(appliedRegion)}`
    if (mallSearchVal) qs += `&mall_ids=${encodeURIComponent(mallSearchVal)}`
    return qs
  }, [appliedStart, appliedEnd, appliedTag, appliedRegion, mallSearchVal])

  // ─── 商场搜索 ───
  const handleMallSearch = (v: string) => {
    if (v.length < 1) { setMallSearchList([]); return }
    api.get<any>(`/malls?search=${encodeURIComponent(v)}`).then(res => {
      const list = Array.isArray(res) ? res : (res.items || [])
      setMallSearchList(list.map((m: any) => ({
        label: `${m.mall_id} - ${m.name}`, value: m.mall_id
      })))
    }).catch(() => setMallSearchList([]))
  }

  // ─── 时间预设切换 ───
  const handlePresetChange = (val: string) => {
    const preset = val as TimePreset
    setTimePreset(preset)
    const range = getPresetRange(preset)
    if (range) { setDateValue(range); return }
    setDateValue(preset === 'day' ? dayjs() : null)
  }

  // ─── 查询 ───
  const doQuery = () => {
    let start: string, end: string
    const preset = timePreset
    if (['today', 'yesterday', '7d', '30d'].includes(preset)) {
      const range = getPresetRange(preset)!
      start = formatDate(range[0]); end = formatDate(range[1])
    } else if (preset === 'custom') {
      if (!dateValue || !dateValue[0] || !dateValue[1]) return
      start = formatDate(dateValue[0]); end = formatDate(dateValue[1])
    } else if (preset === 'day' && dateValue) {
      start = formatDate(dateValue); end = formatDate(dateValue)
    } else if (preset === 'week' && dateValue) {
      start = formatDate(dateValue[0]); end = formatDate(dateValue[1])
    } else if (preset === 'month' && dateValue) {
      start = formatDate(dateValue.startOf('month')); end = formatDate(dateValue.endOf('month'))
    } else if (preset === 'quarter' && dateValue) {
      start = formatDate(dateValue.startOf('quarter')); end = formatDate(dateValue.endOf('quarter'))
    } else if (preset === 'year' && dateValue) {
      start = formatDate(dateValue.startOf('year')); end = formatDate(dateValue.endOf('year'))
    } else { return }
    setAppliedStart(start); setAppliedEnd(end)
    setAppliedRegion(cascaderValue.length > 0 ? cascaderValue[cascaderValue.length - 1] : '')
    setAppliedTag(tagCascaderValue.length > 0 ? tagCascaderValue[tagCascaderValue.length - 1] : '')
  }

  // ─── 重置 ───
  const doReset = () => {
    setTimePreset('7d')
    setDateValue(getPresetRange('7d'))
    setCascaderValue([])
    setTagCascaderValue([])
    setMallSearchVal(''); setMallSearchList([])
    setAppliedStart(dayjs().subtract(6, 'day').format('YYYY-MM-DD'))
    setAppliedEnd(dayjs().format('YYYY-MM-DD'))
    setAppliedRegion(''); setAppliedTag('')
  }

  // ─── 初始化：加载商场架构 + 标签 ───
  useEffect(() => {
    Promise.all([
      api.get<any[]>('/config/tag-groups'),
      api.get<any[]>('/config/tags'),
    ]).then(([groups, tags]) => {
      setTagCascaderOptions(groups.map((g: any) => ({
        label: g.name, value: g.id,
        children: tags.filter((t: any) => t.group_id === g.id).map((t: any) => ({
          label: t.name, value: t.name,
        })),
      })))
    }).catch(() => {})

    api.get<any>('/malls/tree').then(d => {
      const toCascader = (node: any): any => {
        if (node.type === 'mall' || node.mall_id) {
          return { label: node.name, value: node.mall_id || node.id }
        }
        const item: any = { label: node.name, value: node.id || node.name }
        if (node.children && node.children.length > 0) {
          const children = node.children.map(toCascader).filter(Boolean)
          if (children.length > 0) item.children = children
        }
        return item
      }
      if (d.children) setCascaderOptions(d.children.map(toCascader).filter(Boolean))
    }).catch(() => {})
  }, [])

  return (
    <div className="p-4 space-y-3">
      {/* 筛选栏 */}
      <div className="flex items-center gap-3 flex-wrap pb-3 border-b border-[var(--border-subtle)]">
        {/* 1. 商场搜索 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">商场</span>
          <Select
            showSearch
            value={mallSearchVal || undefined}
            onSearch={handleMallSearch}
            onChange={(v) => { setMallSearchVal(v) }}
            options={mallSearchList}
            placeholder="编码/名称搜索"
            allowClear
            filterOption={false}
            notFoundContent={null}
            style={{ height: 32, width: 200, fontSize: 12 }}
          />
        </div>

        {/* 2. 时间选择器 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">时间</span>
          <Select value={timePreset} onChange={handlePresetChange} style={{height:32,width:100}}
            options={TIME_PRESETS.map(t => ({ label: t.label, value: t.value }))} />
          {['today', 'yesterday', '7d', '30d'].includes(timePreset) ? (
            <RangePicker value={getPresetRange(timePreset) as any} disabled style={{height:32}} />
          ) : timePreset === 'day' ? (
            <DatePicker value={dateValue} onChange={setDateValue} style={{height:32,width:160}} />
          ) : timePreset === 'week' ? (
            <RangePicker value={dateValue} onChange={setDateValue} picker="week" style={{height:32}} />
          ) : timePreset === 'month' ? (
            <DatePicker value={dateValue} onChange={setDateValue} picker="month" style={{height:32,width:160}} />
          ) : timePreset === 'quarter' ? (
            <DatePicker value={dateValue} onChange={setDateValue} picker="quarter" style={{height:32,width:160}} />
          ) : timePreset === 'year' ? (
            <DatePicker value={dateValue} onChange={setDateValue} picker="year" style={{height:32,width:120}} />
          ) : (
            <RangePicker value={dateValue} onChange={setDateValue} style={{height:32}} />
          )}
        </div>

        {/* 3. 商场架构级联选择器 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">架构</span>
          <Cascader
            value={cascaderValue}
            onChange={(val) => setCascaderValue(val as string[])}
            options={cascaderOptions}
            placeholder="商场架构筛选"
            allowClear
            changeOnSelect
            style={{ height: 32, width: 200, fontSize: 12 }}
          />
        </div>

        {/* 4. 标签级联选择器 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">标签</span>
          <Cascader
            value={tagCascaderValue}
            onChange={(val) => setTagCascaderValue(val as string[])}
            options={tagCascaderOptions}
            placeholder="标签筛选"
            allowClear
            changeOnSelect
            style={{ height: 32, width: 200, fontSize: 12 }}
          />
        </div>

        {/* 5. 查询/重置按钮 */}
        <button onClick={doQuery} className="filter-btn-primary">查询</button>
        <button onClick={doReset} className="filter-btn-secondary">重置</button>
      </div>

      {/* Tab 页签 */}
      <div className="flex gap-1 border-b border-[var(--border-subtle)]">
        {[
          { k: 'flow' as const, l: '商场数据' },
          { k: 'profile' as const, l: '画像数据' },
          { k: 'ranking' as const, l: '客流排行' },
          { k: 'detail' as const, l: '客流明细' },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px ${tab === t.k ? 'border-[var(--ai-blue-500)] text-[var(--ai-blue-500)]' : 'border-transparent text-[var(--text-muted)]'}`}>{t.l}</button>
        ))}
      </div>

      {tab === 'flow' && <MallFlowTab qs={filterQs} />}
      {tab === 'profile' && <MallProfileTab qs={filterQs} cascaderValue={cascaderValue} />}
      {tab === 'ranking' && <MallRankingTab qs={filterQs} />}
      {tab === 'detail' && <MallDetailTab qs={filterQs} />}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   核心指标趋势图表卡构建函数
   ═══════════════════════════════════════════════════════════════ */
const buildSummaryTrendChart = (
  dates: string[], values: number[], color: string, unit: string, name: string,
  markLine?: any
) => {
  // 确保颜色为纯 hex，用于 rgba 构建
  const c = color.startsWith('#') ? color : '#0EA5E9'
  const r = parseInt(c.slice(1,3),16), g = parseInt(c.slice(3,5),16), b = parseInt(c.slice(5,7),16)
  return {
  grid: { top: '12%', left: '3%', right: '3%', bottom: '15%' },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderColor: 'transparent',
    textStyle: { fontSize: 12, color: '#fff' },
    formatter: (p: any) => {
      const d = p[0]
      return `<div style="font-size:11px;color:#999">${d.axisValue}</div>
              <div style="margin-top:4px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};margin-right:6px"></span>${name}：<b style="color:${c}">${formatNumber(d.value)}</b> ${unit}</div>`
    },
  },
  xAxis: {
    type: 'category', data: dates,
    axisLabel: { fontSize: 11 },
    axisLine: { lineStyle: { color: 'rgba(148,163,184,0.2)' } },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    axisLabel: { fontSize: 11, formatter: (v: number) => v >= 10000 ? (v / 10000).toFixed(0) + '万' : v >= 1000 ? (v / 1000).toFixed(0) + 'k' : String(v) },
    splitLine: { lineStyle: { color: 'rgba(148,163,184,0.15)', type: 'dashed' } },
  },
  series: [{
    name, type: 'line', data: values, smooth: true, symbol: 'circle', symbolSize: 4,
    lineStyle: { width: 2.5, color: c },
    itemStyle: { color: c, borderWidth: 2 },
    areaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: `rgba(${r},${g},${b},0.20)` },
          { offset: 0.5, color: `rgba(${r},${g},${b},0.08)` },
          { offset: 1, color: `rgba(${r},${g},${b},0.01)` },
        ],
      },
    },
    markLine: markLine ? { silent: true, data: [markLine], label: { fontSize: 10 } } : undefined,
  }],
}
}

/* ═══════════════════════════════════════════════════════════════
   商场数据 Tab — 指标卡 + 趋势图表卡 + 图表
   ═══════════════════════════════════════════════════════════════ */
const MallFlowTab: React.FC<{ qs: string }> = ({ qs }) => {
  const [data, setData] = useState<any[]>([])
  const [trend, setTrend] = useState<any[]>([])
  const [indexTrend, setIndexTrend] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [summaryTrend, setSummaryTrend] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [rankMetric, setRankMetric] = useState('total_visitor_count')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get<any>(`/flow/malls-aggregate${qs}`),
      api.get<any[]>(`/flow/mall-daily-trends${qs}`),
      api.get<any[]>(`/flow/mall-index-trends${qs}`),
      api.get<any>(`/flow/mall-summary${qs}`),
      api.get<any[]>(`/flow/mall-summary-trends${qs}`),
    ]).then(([d, t, idx, s, st]) => {
      setData(d.items || d || [])
      setTrend(t || [])
      setIndexTrend(idx || [])
      setSummary(s || null)
      setSummaryTrend(st || [])
    }).finally(() => setLoading(false))
  }, [qs])

  if (loading) return <Skeleton />

  // 原有指标卡计算逻辑
  const totalVisitorCount = data.reduce((s: number, d: any) => s + (d.total_visitor_count || 0), 0)
  const totalWeekendCount = data.reduce((s: number, d: any) => s + (d.weekend_count || 0), 0)
  const totalWeekdayCount = data.reduce((s: number, d: any) => s + (d.weekday_count || 0), 0)
  const totalPeak = Math.max(...data.map((d: any) => d.peak_visitor_count || 0), 0)
  const avgDailyVisitor = data.length ? Math.round(data.reduce((s: number, d: any) => s + (d.daily_avg_visitor || 0), 0) / data.length) : 0
  const weekendRatio = totalVisitorCount ? (totalWeekendCount / totalVisitorCount * 100).toFixed(1) : '0'
  const avgMallCount = trend.length ? Math.round(trend.reduce((s: number, t: any) => s + (t.mall_count || 0), 0) / trend.length) : 0
  const avgIndex = indexTrend.length ? (indexTrend.reduce((s: number, t: any) => s + (t.avg_index || 0), 0) / indexTrend.length).toFixed(2) : '100.00'

  const metrics = [
    { label: '总客流量', value: totalVisitorCount, yoy: 8.5, wow: 2.3, color: COLORS.primary, sparkData: trend.map(t => t.visitor_count || 0) },
    { label: '工作日客流', value: totalWeekdayCount, yoy: 6.2, wow: 1.5, color: '#38BDF8', sparkData: trend.map(t => t.weekday_count || 0) },
    { label: '周末客流', value: totalWeekendCount, yoy: 12.1, wow: 4.8, color: '#EC4899', sparkData: trend.map(t => t.weekend_count || 0) },
    { label: '峰值客流', value: totalPeak, yoy: 3.4, wow: -1.2, color: '#F59E0B', sparkData: [] },
    { label: '日均客流', value: avgDailyVisitor, yoy: 5.7, wow: 1.9, color: '#8B5CF6', sparkData: trend.map(t => t.visitor_count ? Math.round(t.visitor_count / (t.mall_count || 1)) : 0) },
    { label: '周末占比', value: `${weekendRatio}%`, yoy: 1.2, wow: 0.5, color: '#10B981', sparkData: trend.map(t => t.visitor_count ? Math.round(t.weekend_count / t.visitor_count * 100) : 0) },
    { label: '商场数量', value: avgMallCount, yoy: 0, wow: 0, color: COLORS.amber, sparkData: trend.map(t => t.mall_count || 0) },
    { label: '客流指数', value: avgIndex, yoy: 3.2, wow: 0.8, color: COLORS.purple, sparkData: indexTrend.map(t => t.avg_index || 100) },
  ]

  // 4大核心趋势图表卡数据
  const summaryTrendDates = summaryTrend.map((t: any) => t.data_date?.slice(5) || '')
  const summaryCharts = [
    {
      title: '累计总客流人次趋势',
      unit: '万人次', color: COLORS.primary, name: '累计总客流',
      values: summaryTrend.map((t: any) => t.total_visitor_wan || 0),
      markLine: undefined,
    },
    {
      title: '总日均客流人次趋势',
      unit: '人次', color: '#8B5CF6', name: '总日均客流',
      values: summaryTrend.map((t: any) => t.avg_daily_visitor || 0),
      markLine: { yAxis: summary?.avg_daily_visitor || 0, lineStyle: { color: '#8B5CF6', type: 'dashed', width: 1 }, label: { formatter: '均值' } },
    },
    {
      title: '单商场日均客流峰值趋势',
      unit: '人次', color: '#F59E0B', name: '单商场峰值',
      values: summaryTrend.map((t: any) => t.peak_daily_visitor || 0),
      markLine: undefined,
    },
    {
      title: '商场客流中位数趋势',
      unit: '人次', color: '#10B981', name: '客流中位数',
      values: summaryTrend.map((t: any) => t.median_daily_visitor || 0),
      markLine: { yAxis: summary?.median_daily_visitor || 0, lineStyle: { color: '#10B981', type: 'dashed', width: 1 }, label: { formatter: '中位数' } },
    },
  ]

  return (
    <div className="space-y-3">
      {/* 第一行指标卡：4个 */}
      <div className="grid grid-cols-4 gap-3">
        {metrics.slice(0, 4).map((m, i) => (
          <MetricCard key={i} {...m} />
        ))}
      </div>
      {/* 第二行指标卡：4个 */}
      <div className="grid grid-cols-4 gap-3">
        {metrics.slice(4, 8).map((m, i) => (
          <MetricCard key={i + 4} {...m} />
        ))}
      </div>

      {/* 图表区域 — 原有4大图表（2×2） */}
      <div className="grid grid-cols-2 gap-3">
        {/* 1. 商场客流趋势 */}
        <div className="card-level-1 p-3" style={{ aspectRatio: '16/9' }}>
          <div className="chart-title">商场客流趋势</div>
          <BaseChart option={buildMallTrendChart(trend)} height="100%" />
        </div>

        {/* 2. 客流指数趋势 */}
        <div className="card-level-1 p-3" style={{ aspectRatio: '16/9' }}>
          <div className="chart-title">客流指数趋势</div>
          <BaseChart option={buildMallIndexChart(indexTrend)} height="100%" />
        </div>

        {/* 3. 工作日vs周末客流对比 */}
        <div className="card-level-1 p-3" style={{ aspectRatio: '16/9' }}>
          <div className="chart-title">工作日 vs 周末客流对比</div>
          <BaseChart option={buildWeekdayWeekendChart(trend)} height="100%" />
        </div>

        {/* 4. 商场客流排行 */}
        <div className="card-level-1 p-3 overflow-hidden flex flex-col" style={{ aspectRatio: '16/9' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="chart-title">商场客流排行</span>
            <Select size="small" value={rankMetric} onChange={setRankMetric} style={{ width: 120, fontSize: 11 }}
              options={[
                { label: '总客流量', value: 'total_visitor_count' },
                { label: '日均客流', value: 'daily_avg_visitor' },
                { label: '峰值客流', value: 'peak_visitor_count' },
              ]} />
          </div>
          <div className="flex-1 min-h-0">
            <RankList data={data} metric={rankMetric} />
          </div>
        </div>
      </div>

      {/* 核心指标趋势图表卡：2×2 */}
      <div className="grid grid-cols-2 gap-3">
        {summaryCharts.map((c, i) => (
          <div key={i} className="card-level-1 p-3" style={{ aspectRatio: '16/9' }}>
            <div className="chart-title">{c.title}</div>
            {c.values.length > 0 && (
              <BaseChart option={buildSummaryTrendChart(summaryTrendDates, c.values, c.color, c.unit, c.name, c.markLine)} height="100%" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   画像数据 Tab — 年龄/性别分布 + 区域对比
   ═══════════════════════════════════════════════════════════════ */
const MallProfileTab: React.FC<{ qs: string; cascaderValue: string[] }> = ({ qs, cascaderValue }) => {
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState<any[]>([])
  const [regionData, setRegionData] = useState<any>(null)
  const [regionLoading, setRegionLoading] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(t)
  }, [qs])

  // 加载画像数据
  useEffect(() => {
    api.get<any[]>('/flow/mall-profile?category=基础属性').then(d => {
      setProfileData(d || [])
    }).catch(() => setProfileData([]))
  }, [qs])

  // 根据 cascaderValue 加载区域对比数据
  useEffect(() => {
    setRegionLoading(true)
    let parentLevel = 'root'
    let parentId = ''
    if (cascaderValue.length === 0) {
      parentLevel = 'root'
    } else {
      const lastVal = cascaderValue[cascaderValue.length - 1]
      parentId = lastVal
      if (lastVal.startsWith('region_group-')) parentLevel = 'region_group'
      else if (lastVal.startsWith('province-')) parentLevel = 'province'
      else if (lastVal.startsWith('city-')) parentLevel = 'city'
      else if (lastVal.startsWith('district-')) parentLevel = 'district'
      else parentLevel = 'root'
    }
    api.get<any>(`/flow/mall-region-compare?parent_level=${parentLevel}&parent_id=${encodeURIComponent(parentId)}`)
      .then(d => setRegionData(d))
      .catch(() => setRegionData(null))
      .finally(() => setRegionLoading(false))
  }, [cascaderValue])

  if (loading) return <Skeleton />

  const genderData = [
    { label: '男性', ratio: 48, color: COLORS.primary },
    { label: '女性', ratio: 52, color: COLORS.pink },
  ]

  // 层级名称映射
  const levelNameMap: Record<string, string> = {
    root: '大区', region_group: '省份', province: '城市', city: '商圈', district: '商场'
  }
  const childLevelName = regionData ? (levelNameMap[regionData.parent_level] || '区域') : '区域'
  const children = regionData?.children || []

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* 年龄段分布 */}
        <div className="card-level-1 p-3" style={{ aspectRatio: '16/9' }}>
          <div className="chart-title">年龄段分布</div>
          <BaseChart option={{
            grid: { top: '8%', left: '2%', right: '2%', bottom: '8%' },
            tooltip: {
              trigger: 'axis',
              formatter: (p: any) => { const g = AGE_GROUPS[p[0].dataIndex]; return `${g.label}<br/>占比: ${g.ratio}%<br/>${g.desc}` }
            },
            xAxis: { type: 'category', data: AGE_GROUPS.map(g => g.label), axisLabel: { fontSize: 10, rotate: 30 } },
            yAxis: { type: 'value', name: '占比%', axisLabel: { fontSize: 10 }, max: 30 },
            series: [{
              type: 'bar', barMaxWidth: 36,
              data: AGE_GROUPS.map(g => ({
                value: g.ratio, itemStyle: { color: g.color, borderRadius: [4, 4, 0, 0] },
                label: { show: true, position: 'top', fontSize: 10, textBorderWidth: 0, color: g.color, formatter: `${g.ratio}%` }
              }))
            }]
          }} height="100%" />
        </div>

        {/* 性别分布 */}
        <div className="card-level-1 p-3" style={{ aspectRatio: '16/9' }}>
          <div className="chart-title">性别分布</div>
          <BaseChart option={{
            grid: { top: '8%', left: '2%', right: '2%', bottom: '8%' },
            tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
            series: [{
              type: 'pie', radius: ['40%', '70%'], center: ['50%', '45%'],
              itemStyle: { borderRadius: 6, borderColor: 'transparent', borderWidth: 2 },
              label: { show: true, fontSize: 11, formatter: '{b}\n{d}%' },
              data: genderData.map(d => ({ name: d.label, value: d.ratio, itemStyle: { color: d.color }, label: { color: d.color } }))
            }]
          }} height="100%" />
        </div>
      </div>

      {/* 年龄×性别交叉分析 */}
      <div className="card-level-1 p-3" style={{ aspectRatio: '21/9' }}>
        <div className="chart-title">年龄×性别交叉分析</div>
        <BaseChart option={{
          grid: { top: '10%', left: '3%', right: '3%', bottom: '12%' },
          tooltip: {
            trigger: 'axis', axisPointer: { type: 'shadow' },
            formatter: (p: any) => {
              const age = AGE_GROUPS[p[0].dataIndex]; const m = p.find((s: any) => s.seriesName === '男性'); const f = p.find((s: any) => s.seriesName === '女性')
              return `${age.label}<br/>男性: ${m?.value ?? 0}%<br/>女性: ${f?.value ?? 0}%<br/>${age.desc}`
            }
          },
          xAxis: { type: 'category', data: AGE_GROUPS.map(g => g.label), axisLabel: { fontSize: 10, rotate: 30 } },
          yAxis: { type: 'value', name: '占比%', axisLabel: { fontSize: 10 } },
          legend: { top: 0, textStyle: { fontSize: 10 }, itemWidth: 10, itemHeight: 7 },
          series: [
            {
              name: '男性', type: 'bar', stack: 'gender', barMaxWidth: 36,
              itemStyle: { color: COLORS.primary },
              data: AGE_GROUPS.map(g => +(g.ratio * 0.48).toFixed(1)),
              label: { show: true, position: 'inside', fontSize: 9, color: '#fff', formatter: (p: any) => p.value > 3 ? `${p.value}%` : '' }
            },
            {
              name: '女性', type: 'bar', stack: 'gender', barMaxWidth: 36,
              itemStyle: { color: COLORS.pink, borderRadius: [4, 4, 0, 0] },
              data: AGE_GROUPS.map(g => +(g.ratio * 0.52).toFixed(1)),
              label: { show: true, position: 'inside', fontSize: 9, color: '#fff', formatter: (p: any) => p.value > 3 ? `${p.value}%` : '' }
            }
          ]
        }} height="100%" />
      </div>

      {/* 区域对比图表 */}
      {children.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {/* 各区域性别分布对比 */}
          <div className="card-level-1 p-3" style={{ minHeight: 280 }}>
            <div className="chart-title">各{childLevelName}性别分布对比</div>
            {regionLoading ? <Skeleton /> : (
              <BaseChart option={{
                grid: { top:60, left:50, right:20, bottom:40 },
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                legend: { top: 0, textStyle: { fontSize: 11 }, itemWidth: 12, itemHeight: 8 },
                xAxis: { type: 'category', data: children.map((c: any) => c.name), axisLabel: { fontSize: 10, rotate: children.length > 6 ? 30 : 0, interval: 0 } },
                yAxis: { type: 'value', name: '占比%', axisLabel: { fontSize: 10 } },
                series: [
                  {
                    name: '男性', type: 'bar', stack: 'gender', barMaxWidth: 32,
                    itemStyle: { color: COLORS.primary },
                    data: children.map((c: any) => { const m = c.gender?.find((g: any) => g.label === '男性'); return m ? m.ratio : 48 }),
                    label: { show: false }
                  },
                  {
                    name: '女性', type: 'bar', stack: 'gender', barMaxWidth: 32,
                    itemStyle: { color: COLORS.pink, borderRadius: [4, 4, 0, 0] },
                    data: children.map((c: any) => { const f = c.gender?.find((g: any) => g.label === '女性'); return f ? f.ratio : 52 }),
                    label: { show: false }
                  }
                ]
              }} height="100%" />
            )}
          </div>

          {/* 各区域年龄段分布对比 */}
          <div className="card-level-1 p-3" style={{ minHeight: 280 }}>
            <div className="chart-title">各{childLevelName}年龄段分布对比</div>
            {regionLoading ? <Skeleton /> : (
              <BaseChart option={{
                grid: { top:60, left:50, right:20, bottom:40 },
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                legend: { top: 0, textStyle: { fontSize: 10 }, itemWidth: 10, itemHeight: 7 },
                xAxis: { type: 'category', data: children.map((c: any) => c.name), axisLabel: { fontSize: 10, rotate: children.length > 6 ? 30 : 0, interval: 0 } },
                yAxis: { type: 'value', name: '占比%', axisLabel: { fontSize: 10 } },
                series: AGE_GROUPS.map((ag: any, idx: number) => ({
                  name: ag.label, type: 'bar', stack: 'age', barMaxWidth: 32,
                  itemStyle: { color: ag.color, borderRadius: idx === AGE_GROUPS.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0] },
                  data: children.map((c: any) => { const a = c.age?.find((x: any) => x.label === ag.label); return a ? a.ratio : 0 }),
                  label: { show: false }
                }))
              }} height="100%" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   客流排行 Tab
   ═══════════════════════════════════════════════════════════════ */
const RANK_PAGE_SIZE = 50
const MallRankingTab: React.FC<{ qs: string }> = ({ qs }) => {
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('total_visitor_count')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    const p = new URLSearchParams(qs.replace(/^\?/, ''))
    p.set('page', String(page))
    p.set('page_size', String(RANK_PAGE_SIZE))
    api.get<any>(`/flow/malls-aggregate?${p.toString()}`)
      .then(d => {
        const items = d.items || d || []
        const sorted = [...items].sort((a: any, b: any) => {
          return order === 'desc' ? (b[sort] || 0) - (a[sort] || 0) : (a[sort] || 0) - (b[sort] || 0)
        })
        setData(sorted)
        setTotal(d.total || items.length)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [qs, sort, order, page])
  const toggleSort = (k: string) => { if (sort === k) setOrder(o => o === 'desc' ? 'asc' : 'desc'); else { setSort(k); setOrder('desc') } }
  const colKeys = ['', 'mall_id', 'mall_name', 'city_name', 'total_visitor_count', 'daily_avg_visitor', 'peak_visitor_count', 'days']

  if (loading) return <Skeleton />
  return (
    <div>
      <TableCard
        title={`商场客流排行 (共${total}家)`}
        cols={['#', '商场ID', '商场名称', '城市', '总客流量', '日均客流', '峰值客流', '统计天数']}
        rows={data.map((r: any, i) => [
          String((page - 1) * RANK_PAGE_SIZE + i + 1),
          r.mall_id,
          r.mall_name || '',
          r.city_name || '',
          formatNumber(r.total_visitor_count),
          formatNumber(r.daily_avg_visitor),
          formatNumber(r.peak_visitor_count),
          r.days || 0,
        ])}
        onHeaderClick={(i) => { if (colKeys[i]) toggleSort(colKeys[i]) }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, paddingRight: 8 }}>
        <Pagination
          current={page} pageSize={RANK_PAGE_SIZE} total={total}
          onChange={p => setPage(p)} showQuickJumper showSizeChanger={false}
          showTotal={t => `共 ${t} 条`} size="small"
        />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   客流明细 Tab
   ═══════════════════════════════════════════════════════════════ */
const DETAIL_PAGE_SIZE = 50
const MallDetailTab: React.FC<{ qs: string }> = ({ qs }) => {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [dateWarning, setDateWarning] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(qs.replace(/^\?/, ''))
    params.set('page', String(page))
    params.set('page_size', String(DETAIL_PAGE_SIZE))

    const sd = params.get('start_date')
    const ed = params.get('end_date')
    if (sd && ed) {
      const diff = dayjs(ed).diff(dayjs(sd), 'day')
      if (diff > 6) {
        setDateWarning(`查询范围最多7天，当前选择了${diff + 1}天，已自动截取最近7天`)
      } else {
        setDateWarning('')
      }
    }

    setLoading(true)
    api.get<any>(`/flow/mall-detail-list?${params.toString()}`)
      .then(d => {
        const rows = d.items || []
        setItems(rows)
        setTotal(d.total || rows.length)
      })
      .finally(() => setLoading(false))
  }, [qs, page])

  if (loading) return <Skeleton />
  return (
    <div>
      {dateWarning && (
        <div style={{ padding: '6px 12px', marginBottom: 8, borderRadius: 6, background: 'rgba(245,158,11,0.12)', color: '#F59E0B', fontSize: 12 }}>
          ⚠️ {dateWarning}
        </div>
      )}
      <TableCard
        title={`客流明细（共 ${total} 条）`}
        cols={['#', '日期', '星期', '工作日/周末', '商场ID', '商场名称', '当地天气', '城市', '客流量']}
        rows={items.map((d: any, i) => {
          const dt = d.data_date ? dayjs(d.data_date) : null
          const weekdayNames = ['周日','周一','周二','周三','周四','周五','周六']
          return [
            String((page - 1) * DETAIL_PAGE_SIZE + i + 1),
            d.data_date || '',
            dt ? weekdayNames[dt.day()] : '',
            dt ? (dt.day() === 0 || dt.day() === 6 ? '周末' : '工作日') : '',
            d.mall_id || '',
            d.mall_name || '',
            d.weather ? `${d.weather} ${d.temp_high||''}°/${d.temp_low||''}°` : '-',
            d.city_name || '',
            formatNumber(d.visitor_count),
          ]
        })}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, paddingRight: 8 }}>
        <Pagination
          current={page} pageSize={DETAIL_PAGE_SIZE} total={total}
          onChange={p => setPage(p)} showQuickJumper showSizeChanger={false}
          showTotal={t => `共 ${t} 条`} size="small"
        />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   图表构建函数（商场版）
   ═══════════════════════════════════════════════════════════════ */

// 1. 商场客流趋势图
const buildMallTrendChart = (trend: any[]) => ({
  grid: { top: '12%', left: '2%', right: '2%', bottom: '8%' },
  tooltip: { trigger: 'axis' },
  legend: { top: 0, textStyle: { fontSize: 11 }, itemWidth: 12, itemHeight: 8 },
  xAxis: { type: 'category', data: trend.map((t: any) => t.data_date?.slice(5) || ''), axisLabel: { fontSize: 11 } },
  yAxis: { type: 'value', name: '客流量', axisLabel: { fontSize: 11 }, nameTextStyle: { fontSize: 10 } },
  series: [
    { name: '总客流量', type: 'line', data: trend.map((t: any) => t.visitor_count || 0), itemStyle: { color: COLORS.amber }, areaStyle: { color: 'rgba(245,158,11,0.15)' } },
    { name: '工作日客流', type: 'line', data: trend.map((t: any) => t.weekday_count || 0), itemStyle: { color: COLORS.primary } },
    { name: '周末客流', type: 'bar', data: trend.map((t: any) => t.weekend_count || 0), itemStyle: { color: '#EC4899', borderRadius: [3, 3, 0, 0] } },
  ]
})

// 2. 客流指数趋势图
const buildMallIndexChart = (indexTrend: any[]) => ({
  grid: { top: '12%', left: '2%', right: '2%', bottom: '8%' },
  tooltip: { trigger: 'axis' },
  legend: { top: 0, textStyle: { fontSize: 11 }, itemWidth: 12, itemHeight: 8 },
  xAxis: { type: 'category', data: indexTrend.map((t: any) => t.data_date?.slice(5) || ''), axisLabel: { fontSize: 11 } },
  yAxis: [
    { type: 'value', name: '指数', axisLabel: { fontSize: 11 }, min: 80 },
    { type: 'value', name: '同比%', axisLabel: { fontSize: 11, formatter: '{value}%' }, nameTextStyle: { fontSize: 10 } },
  ],
  series: [
    {
      name: '客流指数', type: 'line', data: indexTrend.map((t: any) => t.avg_index || 100),
      itemStyle: { color: COLORS.primary }, areaStyle: { color: 'rgba(14,165,233,0.15)' },
      markLine: { silent: true, data: [{ yAxis: 100, lineStyle: { color: '#F59E0B', type: 'dashed', width: 1 } }] }
    },
    {
      name: '同比变化%', type: 'bar', yAxisIndex: 1, data: indexTrend.map((t: any) => t.avg_yoy || 0),
      itemStyle: { color: '#8B5CF6', borderRadius: [3, 3, 0, 0] }
    },
  ]
})

// 3. 工作日vs周末客流对比图
const buildWeekdayWeekendChart = (trend: any[]) => ({
  grid: { top: '12%', left: '2%', right: '2%', bottom: '8%' },
  tooltip: { trigger: 'axis' },
  legend: { top: 0, textStyle: { fontSize: 11 }, itemWidth: 12, itemHeight: 8 },
  xAxis: { type: 'category', data: trend.map((t: any) => t.data_date?.slice(5) || ''), axisLabel: { fontSize: 11 } },
  yAxis: [
    { type: 'value', name: '客流量', axisLabel: { fontSize: 11 }, nameTextStyle: { fontSize: 10 } },
    { type: 'value', name: '占比%', axisLabel: { fontSize: 11, formatter: '{value}%' }, nameTextStyle: { fontSize: 10 }, max: 100 },
  ],
  series: [
    { name: '工作日客流', type: 'bar', data: trend.map((t: any) => t.weekday_count || 0), itemStyle: { color: '#38BDF8', borderRadius: [3, 3, 0, 0] } },
    { name: '周末客流', type: 'bar', data: trend.map((t: any) => t.weekend_count || 0), itemStyle: { color: '#EC4899', borderRadius: [3, 3, 0, 0] } },
    {
      name: '周末占比%', type: 'line', yAxisIndex: 1,
      data: trend.map((t: any) => t.visitor_count ? Math.round(t.weekend_count / t.visitor_count * 100) : 0),
      itemStyle: { color: '#F59E0B' }
    },
  ]
})

export default MallLBS
