import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { api } from '../api/client'
import { BaseChart } from '../components/echarts/BaseChart'
import { COLORS } from '../config/echarts-theme'
import { FilterSelect, SearchInput } from '../components/ui/FilterBar'
import { formatNumber } from '../utils/format'
import { Users, ShoppingBag, BarChart3, Activity, Eye, TrendingUp, Clock } from 'lucide-react'
import { DatePicker, Select, Cascader, Pagination } from 'antd'
import dayjs from 'dayjs'


/* ═══════════════════════════════════════════════════════════════
   Sparkline - 迷你趋势线（底部左下，悬停显示数值，无坐标轴填充）
   ═══════════════════════════════════════════════════════════════ */
const Sparkline: React.FC<{ data: number[]; color: string; height?: number }> = ({ data, color, height = 32 }) => {
  const [tip, setTip] = useState<{x:number;v:number;sv:string}|null>(null)
  if (!data || data.length === 0) return <div style={{height, width:60}} />;
  const max = Math.max(...data); const min = Math.min(...data); const range = max - min || 1
  const w = data.length * 8; const h = height
  const points = data.map((v,i) => `${(i/(data.length-1||1))*w},${h-((v-min)/range)*(h-4)-2}`).join(' ')
  const toSvgX = (e:React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return e.clientX - rect.left
  }
  const handleMove = (e:React.MouseEvent) => {
    const x = toSvgX(e); const i = Math.round((x/w)*(data.length-1)); const idx = Math.max(0,Math.min(data.length-1,i))
    const v = data[idx]
    setTip({x, v, sv: typeof v === 'number' && v >= 1000 ? formatNumber(v) : String(v)})
  }
  return (
    <div style={{height, width: Math.max(w,60), position:'relative'}} onMouseMove={handleMove} onMouseLeave={()=>setTip(null)}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{display:'block'}}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {tip && (
          <g>
            <line x1={tip.x} y1={0} x2={tip.x} y2={h} stroke={color} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.4" />
            <circle cx={tip.x} cy={h-((tip.v-min)/range)*(h-4)-2} r="3" fill={color} />
          </g>
        )}
      </svg>
      {tip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 rounded text-[9px] bg-gray-800 text-white whitespace-nowrap pointer-events-none" style={{zIndex:10}}>
          {tip.sv}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   TableCard - 数据表格组件
   ═══════════════════════════════════════════════════════════════ */
const TableCard: React.FC<{
  title: string;
  cols: string[];
  rows: any[][];
  onHeaderClick?: (index: number) => void;
}> = ({ title, cols, rows, onHeaderClick }) => (
  <div className="card-level-1 p-3 overflow-x-auto">
    <div className="chart-title mb-2">{title}</div>
    <table className="w-full text-xs text-left">
      <thead>
        <tr className="border-b border-[var(--border-subtle)]">
          {cols.map((c, i) => (
            <th
              key={i}
              className={`py-1.5 px-2 font-medium text-[var(--text-muted)] ${onHeaderClick ? 'cursor-pointer hover:text-[var(--text-primary)]' : ''}`}
              onClick={() => onHeaderClick?.(i)}
            >
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



const TIME_OPTS = [
  { label: '今日', value: 'today' }, { label: '昨日', value: 'yesterday' },
  { label: '近7天', value: '7d' }, { label: '近14天', value: '14d' }, { label: '近30天', value: '30d' },
  { label: '本周', value: 'week' }, { label: '本月', value: 'month' },
  { label: '本季', value: 'quarter' }, { label: '本年', value: 'year' },
  { label: '自定义(100天)', value: 'custom' },
]

function getDateRange(opt: string): { start: string; end: string } {
  const now = new Date(); const fmt = (d: Date) => d.toISOString().slice(0, 10); const t = new Date(now)
  switch (opt) {
    case 'today': return { start: fmt(t), end: fmt(t) }
    case 'yesterday': t.setDate(t.getDate()-1); return { start: fmt(t), end: fmt(t) }
    case '7d': t.setDate(t.getDate()-6); return { start: fmt(t), end: fmt(now) }
    case '14d': t.setDate(t.getDate()-13); return { start: fmt(t), end: fmt(now) }
    case '30d': t.setDate(t.getDate()-29); return { start: fmt(t), end: fmt(now) }
    case 'week': { const d=now.getDay()||7; t.setDate(now.getDate()-d+1); return {start:fmt(t),end:fmt(now)} }
    case 'month': t.setDate(1); return { start: fmt(t), end: fmt(now) }
    default: t.setDate(t.getDate()-6); return { start: fmt(t), end: fmt(now) }
  }
}

type TabKey = 'flow' | 'profile' | 'ranking' | 'detail' | 'order' | 'orderDetail'

const { RangePicker } = DatePicker

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

export const StoreFlow: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('flow')
  const [timePreset, setTimePreset] = useState<TimePreset>('7d')
  const [dateValue, setDateValue] = useState<any>(null)
  const [filterProvince, setFilterProvince] = useState('')
  const [cascaderValue, setCascaderValue] = useState<string[]>([])
  const [cascaderOptions, setCascaderOptions] = useState<any[]>([])
  const [tagCascaderValue, setTagCascaderValue] = useState<string[]>([])
  const [tagCascaderOptions, setTagCascaderOptions] = useState<any[]>([])
  const [filterTag, setFilterTag] = useState('')
  const [tagOptions, setTagOptions] = useState<{label:string;value:string}[]>([])
  const [provinceOptions, setProvinceOptions] = useState<{label:string;value:string}[]>([])
  const [profileDimTab, setProfileDimTab] = useState<'age' | 'gender'>('age')
  const [storeSearchVal, setStoreSearchVal] = useState('')
  const [storeSearchList, setStoreSearchList] = useState<{label:string;value:string}[]>([])

  const [appliedStart, setAppliedStart] = useState(dayjs().subtract(6,'day').format('YYYY-MM-DD'))
  const [appliedEnd, setAppliedEnd] = useState(dayjs().format('YYYY-MM-DD'))
  const [appliedProvince, setAppliedProvince] = useState('')
  const [appliedTag, setAppliedTag] = useState('')

  const filterQs = useMemo(() => {
    let qs = `?start_date=${appliedStart}&end_date=${appliedEnd}`
    if (appliedTag) qs += `&tag=${encodeURIComponent(appliedTag)}`
    if (appliedProvince) qs += `&province=${encodeURIComponent(appliedProvince)}`
    if (storeSearchVal) qs += `&store_ids=${encodeURIComponent(storeSearchVal)}`
    return qs
  }, [appliedStart, appliedEnd, appliedTag, appliedProvince, storeSearchVal])

  const handleStoreSearch = (v: string) => {
    setStoreSearchVal(v)
    if (v.length < 1) { setStoreSearchList([]); return }
    api.get<any>(`/stores?search=${encodeURIComponent(v)}&page_size=20`).then(res => {
      setStoreSearchList((res.items||[]).map((s:any) => ({
        label: `${s.store_id} - ${s.name}`, value: s.store_id
      })))
    }).catch(() => setStoreSearchList([]))
  }

  const handlePresetChange = (val: string) => {
    const preset = val as TimePreset
    setTimePreset(preset)
    const range = getPresetRange(preset)
    if (range) { setDateValue(range); return }
    // 按天/周/月/季/年/自定义 → 重置日期
    setDateValue(preset === 'day' ? dayjs() : null)
  }

  const doQuery = () => {
    let start: string, end: string
    const preset = timePreset
    if (['today','yesterday','7d','30d'].includes(preset)) {
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
    setAppliedProvince(cascaderValue.length > 0 ? cascaderValue[cascaderValue.length-1] : '')
    setAppliedTag(tagCascaderValue.length > 0 ? tagCascaderValue[tagCascaderValue.length-1] : '')
  }

  const doReset = () => {
    setTimePreset('7d')
    setDateValue(getPresetRange('7d'))
    setCascaderValue([])
    setTagCascaderValue([])
    setFilterProvince(''); setFilterTag('')
    setStoreSearchVal(''); setStoreSearchList([])
    setAppliedStart(dayjs().subtract(6,'day').format('YYYY-MM-DD'))
    setAppliedEnd(dayjs().format('YYYY-MM-DD'))
    setAppliedProvince(''); setAppliedTag('')
  }

  useEffect(() => {
    // 标签级联：标签组 → 标签
    Promise.all([
      api.get<any[]>('/config/tag-groups'),
      api.get<any[]>('/config/tags'),
    ]).then(([groups, tags]) => {
      setTagCascaderOptions(groups.map((g:any) => ({
        label: g.name, value: g.id,
        children: tags.filter((t:any) => t.group_id === g.id).map((t:any) => ({
          label: t.name, value: t.name,
        })),
      })))
    }).catch(() => {})
    // 门店架构级联
    api.get<any>('/store-tree').then(d => {
      const toCascader = (node: any): any => {
        if (node.type === 'store' || node.store_id) {
          // 门店作为叶子节点保留
          return { label: node.name, value: node.store_id || node.id }
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
    <div className="p-4 pb-12 space-y-3">
      {/* 筛选栏 */}
      <div className="flex items-center gap-3 flex-wrap pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">门店</span>
          <Select
            showSearch
            value={storeSearchVal || undefined}
            onSearch={handleStoreSearch}
            onChange={(v) => { setStoreSearchVal(v); doQuery() }}
            options={storeSearchList}
            placeholder="编码/名称搜索"
            allowClear
            filterOption={false}
            notFoundContent={null}
            style={{ height: 32, width: 200, fontSize: 12 }}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">时间</span>
        <Select value={timePreset} onChange={handlePresetChange} style={{height:32, width: 100}}
          options={TIME_PRESETS.map(t => ({ label: t.label, value: t.value }))} />
        {/* 动态时间选择器 */}
        {['today','yesterday','7d','30d'].includes(timePreset) ? (
          <RangePicker value={getPresetRange(timePreset) as any} disabled style={{height:32, width: 260}} />
        ) : timePreset === 'day' ? (
          <DatePicker value={dateValue} onChange={setDateValue} style={{height:32, width: 160}} />
        ) : timePreset === 'week' ? (
          <RangePicker value={dateValue} onChange={setDateValue} picker="week" style={{height:32, width: 260}} />
        ) : timePreset === 'month' ? (
          <DatePicker value={dateValue} onChange={setDateValue} picker="month" style={{height:32, width: 160}} />
        ) : timePreset === 'quarter' ? (
          <DatePicker value={dateValue} onChange={setDateValue} picker="quarter" style={{height:32, width: 160}} />
        ) : timePreset === 'year' ? (
          <DatePicker value={dateValue} onChange={setDateValue} picker="year" style={{height:32, width: 120}} />
        ) : (
          <RangePicker value={dateValue} onChange={setDateValue} style={{height:32, width: 260}}
            disabledDate={current => {
              if (!current || !dateValue) return false
              const start = Array.isArray(dateValue) ? dateValue[0] : dateValue
              if (start) { const diff = Math.abs(current.diff(start, 'day')); return diff > 99 }
              return false
            }} />
        )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">架构</span>
          <Cascader
            value={cascaderValue}
            onChange={(val) => setCascaderValue(val as string[])}
            options={cascaderOptions}
            placeholder="门店架构筛选"
            allowClear
            changeOnSelect
            style={{ height: 32, width: 200, fontSize: 12 }}
          />
        </div>
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
        <button onClick={doQuery} className="filter-btn-primary">查询</button>
        <button onClick={doReset} className="filter-btn-secondary">重置</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-subtle)]">
        {[
          {k:'flow' as const,l:'客流数据'},
          {k:'order' as const,l:'订单数据'},
          {k:'orderDetail' as const,l:'订单明细'},
          {k:'profile' as const,l:'画像数据'},
          {k:'ranking' as const,l:'客流排行'},
          {k:'detail' as const,l:'客流明细'},
        ].map(t => (
          <button key={t.k} onClick={()=>{setTab(t.k); if(t.k==='profile') setProfileDimTab('age')}}
            className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px ${tab===t.k?'border-[var(--ai-blue-500)] text-[var(--ai-blue-500)]':'border-transparent text-[var(--text-muted)]'}`}>{t.l}</button>
        ))}
      </div>

      {tab === 'flow' && <FlowTab qs={filterQs} />}
      {tab === 'order' && <OrderTab qs={filterQs} />}
      {tab === 'orderDetail' && <OrderDetailTab qs={filterQs} />}
      {tab === 'profile' && <ProfileTab qs={filterQs} cascaderValue={cascaderValue} />}
      {tab === 'ranking' && <RankingTab qs={filterQs} />}
      {tab === 'detail' && <DetailTab qs={filterQs} />}
    </div>
  )
}

/* ═══ 订单数据 Tab ═══ */
const OrderTab: React.FC<{qs:string}> = ({qs}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-4">
      {[
        {label:'今日订单',value:'--',change:'+0%',icon:'📦'},
        {label:'今日营收',value:'--',change:'+0%',icon:'💰'},
        {label:'客单价',value:'--',change:'+0%',icon:'🧾'},
        {label:'订单转化率',value:'--',change:'+0%',icon:'📊'},
      ].map((m,i)=>(
        <div key={i} className="card-level-1 p-4">
          <div className="text-[11px] text-[var(--text-muted)] mb-1">{m.label}</div>
          <div className="text-xl font-bold text-[var(--text-primary)]">{m.value}</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">{m.change}</div>
        </div>
      ))}
    </div>
    <div className="card-level-1 p-8 text-center text-sm text-[var(--text-muted)]">
      订单数据模块开发中，敬请期待
    </div>
  </div>
)

/* ═══ 订单明细 Tab ═══ */
const OrderDetailTab: React.FC<{qs:string}> = ({qs}) => (
  <div className="space-y-4">
    <div className="card-level-1 p-4 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--text-muted)]">订单日期</span>
        <DatePicker size="small" defaultValue={dayjs()} style={{width:130}} />
      </div>
      <FilterSelect label="订单状态" value="全部" options={['全部','已完成','处理中','已取消']} onChange={()=>{}} />
      <FilterSelect label="支付方式" value="全部" options={['全部','微信支付','支付宝','现金','会员卡']} onChange={()=>{}} />
    </div>
    <div className="card-level-1 p-8 text-center text-sm text-[var(--text-muted)]">
      订单明细数据模块开发中，敬请期待
    </div>
  </div>
)

/* ═══ MetricCard 指标卡组件 ═══ */
const MetricCard: React.FC<{
  label: string;
  value: string | number;
  yoy: number;
  wow: number;
  color: string;
  sparkData: number[];
}> = ({ label, value, yoy, wow, color, sparkData }) => {
  const fmt = (v:number):{c:string;t:string} => {
    if (v > 0) return {c:'#EF4444', t: `同比+${v.toFixed(1)}%`}  // 红涨
    if (v < 0) return {c:'#10B981', t: `同比${v.toFixed(1)}%`}   // 绿跌
    return {c:'#9CA3AF', t:'同比持平'}                             // 灰持
  }
  const yo = fmt(yoy)
  const wo = (()=>{if(wow>0)return{c:'#EF4444',t:`环比+${wow.toFixed(1)}%`};if(wow<0)return{c:'#10B981',t:`环比${wow.toFixed(1)}%`};return{c:'#9CA3AF',t:'环比持平'}})()
  return (
    <div className="card-level-1 p-3 flex flex-col" style={{minHeight:104}}>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[11px] text-[var(--text-muted)]">{label}</span>
      </div>
      <div className="text-lg font-semibold text-number mb-1" style={{color}}
        title={typeof value === 'number' ? formatNumber(value) : String(value)}>
        {typeof value === 'number' ? formatNumber(value) : value}
      </div>
      <div className="mt-auto flex items-end justify-between gap-1">
        <div className="flex items-center gap-1.5 text-[9px] shrink-0">
          <span style={{color:yo.c}}>{yo.t}</span>
          <span style={{color:wo.c}}>{wo.t}</span>
        </div>
        <Sparkline data={sparkData} color={color} height={28} />
      </div>
    </div>
  )
}

/* ═══ 画像 Tab ═══ */
const AGE_GROUPS = [
  { label:'0-12岁', ratio:1.5, desc:'儿童，多使用家长共享设备/iPad，学习娱乐为主', color:'#8B5CF6' },
  { label:'13-17岁', ratio:3.5, desc:'青少年，社交需求强，苹果品牌忠诚度极高', color:'#A78BFA' },
  { label:'18-24岁', ratio:20, desc:'学生/Gen Z，社交娱乐为主，品牌忠诚度96%', color:COLORS.primary },
  { label:'25-34岁', ratio:23, desc:'年轻专业/千禧一代，最大群体，全生态消费主力', color:'#38BDF8' },
  { label:'35-44岁', ratio:20, desc:'职场力量，重视生产力与家庭共享功能', color:COLORS.amber },
  { label:'45-54岁', ratio:16, desc:'成熟用户，重视隐私、稳定性与易用性', color:'#10B981' },
  { label:'55岁以上', ratio:21, desc:'增长最快群体，偏好大屏与无障碍功能', color:'#EC4899' },
]

const ProfileTab: React.FC<{qs:string; cascaderValue:string[]}> = ({qs, cascaderValue}) => {
  const [loading, setLoading] = useState(true)
  const [regionData, setRegionData] = useState<any>(null)
  const [regionLoading, setRegionLoading] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(t)
  }, [qs])

  // 根据 cascaderValue 推断层级，加载区域对比数据
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
      else parentLevel = 'root' // 门店级别或无法识别时回退
    }
    api.get<any>(`/flow/region-profile-compare?parent_level=${parentLevel}&parent_id=${encodeURIComponent(parentId)}`)
      .then(d => setRegionData(d))
      .catch(() => setRegionData(null))
      .finally(() => setRegionLoading(false))
  }, [cascaderValue])

  if (loading) return <Skeleton />

  const genderData = [
    { label:'男性', ratio:52, color:COLORS.primary },
    { label:'女性', ratio:48, color:COLORS.pink },
  ]

  // 层级名称映射
  const levelNameMap: Record<string, string> = {
    root: '大区', region_group: '省份', province: '城市', city: '商圈', district: '门店'
  }
  const childLevelName = regionData ? (levelNameMap[regionData.parent_level] || '区域') : '区域'
  const children = regionData?.children || []

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* 年龄段分布 */}
        <div className="card-level-1 p-3" style={{aspectRatio:'16/9'}}>
          <div className="chart-title">年龄段分布</div>
          <BaseChart option={{
            grid: { top:'8%', left:'2%', right:'2%', bottom:'8%' },
            tooltip: {
              trigger: 'axis',
              formatter: (p:any) => { const g = AGE_GROUPS[p[0].dataIndex]; return `${g.label}<br/>占比: ${g.ratio}%<br/>${g.desc}` }
            },
            xAxis: { type:'category', data:AGE_GROUPS.map(g=>g.label), axisLabel:{fontSize:10,rotate:30} },
            yAxis: { type:'value', name:'占比%', axisLabel:{fontSize:10}, max:30 },
            series: [{
              type:'bar', barMaxWidth:36,
              data: AGE_GROUPS.map(g=>({value:g.ratio, itemStyle:{color:g.color, borderRadius:[4,4,0,0]}, label:{show:true, position:'top', fontSize:10, textBorderWidth:0, color:g.color, formatter:`${g.ratio}%`}}))
            }]
          }} height="100%" />
        </div>

        {/* 性别分布 */}
        <div className="card-level-1 p-3" style={{aspectRatio:'16/9'}}>
          <div className="chart-title">性别分布</div>
          <BaseChart option={{
            grid: { top:'8%', left:'2%', right:'2%', bottom:'8%' },
            tooltip: { trigger:'item', formatter:'{b}: {c}%' },
            legend: { bottom:0, textStyle:{fontSize:11} },
            series: [{
              type:'pie', radius:['40%','70%'], center:['50%','45%'],
              itemStyle: { borderRadius:6, borderColor:'transparent', borderWidth:2 },
              label: { show:true, fontSize:11, formatter:'{b}\n{d}%' },
              data: genderData.map(d=>({name:d.label, value:d.ratio, itemStyle:{color:d.color}, label:{color:d.color}}))
            }]
          }} height="100%" />
        </div>
      </div>

      {/* 年龄×性别交叉分析 */}
      <div className="card-level-1 p-3" style={{aspectRatio:'21/9'}}>
        <div className="chart-title">年龄×性别交叉分析</div>
        <BaseChart option={{
          grid: { top:'10%', left:'3%', right:'3%', bottom:'12%' },
          tooltip: { trigger:'axis', axisPointer:{type:'shadow'}, formatter:(p:any)=>{const age=AGE_GROUPS[p[0].dataIndex];const m=p.find((s:any)=>s.seriesName==='男性');const f=p.find((s:any)=>s.seriesName==='女性');return `${age.label}<br/>男性: ${m?.value??0}%<br/>女性: ${f?.value??0}%<br/>${age.desc}`} },
          legend: { top:0, textStyle:{fontSize:11}, itemWidth:12, itemHeight:8 },
          xAxis: { type:'category', data:AGE_GROUPS.map(g=>g.label), axisLabel:{fontSize:10,rotate:30} },
          yAxis: { type:'value', name:'占比%', axisLabel:{fontSize:10} },
          series: [
            {
              name:'男性', type:'bar', stack:'gender', barMaxWidth:36,
              itemStyle:{color:COLORS.primary, borderRadius:[0,0,0,0]},
              data: AGE_GROUPS.map(g=>+(g.ratio*0.52).toFixed(1)),
              label:{show:true, position:'inside', fontSize:9, color:'#fff', formatter:(p:any)=>p.value>3?`${p.value}%`:''}
            },
            {
              name:'女性', type:'bar', stack:'gender', barMaxWidth:36,
              itemStyle:{color:COLORS.pink, borderRadius:[4,4,0,0]},
              data: AGE_GROUPS.map(g=>+(g.ratio*0.48).toFixed(1)),
              label:{show:true, position:'inside', fontSize:9, color:'#fff', formatter:(p:any)=>p.value>3?`${p.value}%`:''}
            }
          ]
        }} height="100%" />
      </div>

      {/* 区域对比图表 */}
      {children.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {/* 各{childLevelName}性别分布对比 */}
          <div className="card-level-1 p-3" style={{minHeight:280}}>
            <div className="chart-title">各{childLevelName}性别分布对比</div>
            {regionLoading ? <Skeleton /> : (
              <BaseChart option={{
                grid: { top:60, left:50, right:20, bottom:40 },
                tooltip: { trigger:'axis', axisPointer:{type:'shadow'} },
                legend: { top:0, textStyle:{fontSize:11}, itemWidth:12, itemHeight:8 },
                xAxis: { type:'category', data:children.map((c:any)=>c.name), axisLabel:{fontSize:10,rotate:children.length>6?30:0, interval:0} },
                yAxis: { type:'value', name:'占比%', axisLabel:{fontSize:10} },
                series: [
                  {
                    name:'男性', type:'bar', stack:'gender', barMaxWidth:32,
                    itemStyle:{color:COLORS.primary},
                    data: children.map((c:any)=>{const m=c.gender?.find((g:any)=>g.label==='男性');return m?m.ratio:52}),
                    label:{show:false}
                  },
                  {
                    name:'女性', type:'bar', stack:'gender', barMaxWidth:32,
                    itemStyle:{color:COLORS.pink, borderRadius:[4,4,0,0]},
                    data: children.map((c:any)=>{const f=c.gender?.find((g:any)=>g.label==='女性');return f?f.ratio:48}),
                    label:{show:false}
                  }
                ]
              }} height="100%" />
            )}
          </div>

          {/* 各{childLevelName}年龄段分布对比 */}
          <div className="card-level-1 p-3" style={{minHeight:280}}>
            <div className="chart-title">各{childLevelName}年龄段分布对比</div>
            {regionLoading ? <Skeleton /> : (
              <BaseChart option={{
                grid: { top:60, left:50, right:20, bottom:40 },
                tooltip: { trigger:'axis', axisPointer:{type:'shadow'} },
                legend: { top:0, textStyle:{fontSize:9}, itemWidth:10, itemHeight:7 },
                xAxis: { type:'category', data:children.map((c:any)=>c.name), axisLabel:{fontSize:10,rotate:children.length>6?30:0, interval:0} },
                yAxis: { type:'value', name:'占比%', axisLabel:{fontSize:10} },
                series: AGE_GROUPS.map((ag:any,idx:number)=>({
                  name:ag.label, type:'bar', stack:'age', barMaxWidth:32,
                  itemStyle:{color:ag.color, borderRadius:idx===AGE_GROUPS.length-1?[4,4,0,0]:[0,0,0,0]},
                  data: children.map((c:any)=>{const a=c.age?.find((x:any)=>x.label===ag.label);return a?a.ratio:0}),
                  label:{show:false}
                }))
              }} height="100%" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══ 排行 Tab ═══ */
const RANK_PAGE_SIZE = 50
const RankingTab: React.FC<{qs:string}> = ({qs}) => {
  const [data, setData]   = useState<any[]>([])
  const [total, setTotal]  = useState(0)
  const [page, setPage]    = useState(1)
  const [sort, setSort]    = useState<string|null>(null)
  const [order, setOrder]  = useState<'asc'|'desc'|null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    const p = new URLSearchParams(qs.replace(/^\?/, ''))
    p.set('page', String(page))
    p.set('page_size', String(RANK_PAGE_SIZE))
    api.get<any>(`/flow/stores-aggregate?${p.toString()}`)
      .then(d => {
        const items = d.items || d || []
        let sorted = [...items]
        if (sort && order) {
          sorted = [...items].sort((a:any,b:any)=>{
            if(sort==='entry_rate'){
              const ra=a.pass_by_people?a.enter_count/a.pass_by_people:0
              const rb=b.pass_by_people?b.enter_count/b.pass_by_people:0
              return order==='desc'?rb-ra:ra-rb
            }
            return order==='desc'?(b[sort]||0)-(a[sort]||0):(a[sort]||0)-(b[sort]||0)
          })
        }
        setData(sorted)
        setTotal(d.total || items.length)
        setLoading(false)
      })
      .catch(()=>setLoading(false))
  }, [qs, sort, order, page])

  useEffect(()=>{ load() }, [load])
  // 三态切换：除第一次desc→第二次asc→第三次取消(默认)
  const toggleSort=(k:string)=>{
    if(sort===k){
      if(order==='desc') setOrder('asc')
      else if(order==='asc') { setSort(null); setOrder(null) }
    }else{ setSort(k); setOrder('desc') }
  }
  const sortArrow=(k:string)=>sort===k ? (order==='desc'?' ▼':' ▲') : ' ⇅'

  const colKeys = ['', 'store_id', 'store_name', 'pass_by_count', 'pass_by_people', 'enter_count', 'enter_people', 'deep_browse_count', 'entry_rate', 'avg_stay', 'daily_avg_enter']
  const colLabels = ['#','门店ID','门店名称','过店人次','过店人数','进店人次','进店人数','深逛人数','进店率','停留','日均进店']

  if(loading) return <Skeleton/>
  return (
    <div>
      <TableCard
        title={`门店客流排行 (共${total}家)`}
        cols={colLabels.map((l,i)=>(i>0&&colKeys[i])?l+sortArrow(colKeys[i]):l)}
        rows={data.map((r:any,i)=>[
          String((page-1)*RANK_PAGE_SIZE + i + 1),
          r.store_id,
          r.store_name || '',
          formatNumber(r.pass_by_count),
          formatNumber(r.pass_by_people),
          formatNumber(r.enter_count),
          formatNumber(r.enter_people),
          formatNumber(r.deep_browse_count||0),
          `${r.entry_rate||0}%`,
          `${r.avg_stay||0}min`,
          formatNumber(r.daily_avg_enter)
        ])}
        onHeaderClick={(i)=>{if(colKeys[i])toggleSort(colKeys[i])}}
      />
      <div style={{display:'flex', justifyContent:'flex-end', marginTop:16, paddingRight:8}}>
        <Pagination
          current={page}
          pageSize={RANK_PAGE_SIZE}
          total={total}
          onChange={p=>setPage(p)}
          showQuickJumper
          showSizeChanger={false}
          showTotal={t=>`共 ${t} 条`}
          size="small"
        />
      </div>
    </div>
  )
}

/* ═══ 明细 Tab ═══ */
const DETAIL_PAGE_SIZE = 50
const DetailTab: React.FC<{qs:string}> = ({qs}) => {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage]   = useState(1)
  const [loading, setLoading] = useState(true)
  const [dateWarning, setDateWarning] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(qs.replace(/^\?/, ''))
    params.set('page', String(page))
    params.set('page_size', String(DETAIL_PAGE_SIZE))

    // 校验日期范围不超过7天
    const sd = params.get('start_date')
    const ed = params.get('end_date')
    if (sd && ed) {
      const diff = dayjs(ed).diff(dayjs(sd), 'day')
      if (diff > 6) {
        setDateWarning(`查询范围最多7天，当前选择了${diff + 1}天，已自动截取最近7天`)
      } else {
        setDateWarning('')
      }
    } else {
      setDateWarning('')
    }

    setLoading(true)
    api.get<any>(`/flow/store-detail-list?${params.toString()}`)
      .then(d => { setItems(d.items || d || []); setTotal(d.total || (d.items||d).length) })
      .finally(() => setLoading(false))
  }, [qs, page])

  if (loading) return <Skeleton/>
  return (
    <div>
      {dateWarning && (
        <div style={{padding:'6px 12px', marginBottom:8, borderRadius:6, background:'rgba(245,158,11,0.12)', color:'#F59E0B', fontSize:12}}>
          ⚠️ {dateWarning}
        </div>
      )}
      <TableCard
        title={`客流明细（共 ${total} 条）`}
        cols={['#','日期','星期','工作日/周末','门店编码','门店名称','当地天气','过店人次','过店人数','进店人次','进店人数','深逛人数','进店率','停留(min)']}
        rows={items.map((d:any,i) => {
          const dt = d.data_date ? dayjs(d.data_date) : null
          const weekdayNames = ['周日','周一','周二','周三','周四','周五','周六']
          return [
            String((page-1)*DETAIL_PAGE_SIZE + i + 1),
            d.data_date || '',
            dt ? weekdayNames[dt.day()] : '',
            dt ? (dt.day() === 0 || dt.day() === 6 ? '周末' : '工作日') : '',
            d.store_id,
            d.store_name || '',
            d.weather ? `${d.weather} ${d.temp_high||''}°/${d.temp_low||''}°` : '-',
            formatNumber(d.pass_by_count),
            formatNumber(d.pass_by_people),
            formatNumber(d.enter_count),
            formatNumber(d.enter_people),
            formatNumber(d.deep_browse_count||0),
            `${d.entry_rate||0}%`,
            d.avg_stay_minutes ? d.avg_stay_minutes.toFixed(1) : '0',
          ]
        })}
      />
      <div style={{display:'flex', justifyContent:'flex-end', marginTop:16, paddingRight:8}}>
        <Pagination
          current={page}
          pageSize={DETAIL_PAGE_SIZE}
          total={total}
          onChange={p=>setPage(p)}
          showQuickJumper
          showSizeChanger={false}
          showTotal={t=>`共 ${t} 条`}
          size="small"
        />
      </div>
    </div>
  )
}

/* ═══ 客流数据 Tab ═══ */
const FlowTab: React.FC<{qs:string}> = ({qs}) => {
  const [data, setData] = useState<any[]>([])
  const [trend, setTrend] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [rankMetric, setRankMetric] = useState('enter_people')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get<any>(`/flow/stores-aggregate${qs}`),
      api.get<any[]>(`/flow/daily-trends${qs}`)
    ]).then(([d, t]) => {
      setData(d.items || d || [])
      setTrend(t || [])
    }).finally(() => setLoading(false))
  }, [qs])

  if (loading) return <Skeleton />

  // 计算8个核心指标
  const totalPassByCount = data.reduce((s:number,d:any)=>s+(d.pass_by_count||0),0)
  const totalPassByPeople = data.reduce((s:number,d:any)=>s+(d.pass_by_people||0),0)
  const totalEnterCount = data.reduce((s:number,d:any)=>s+(d.enter_count||0),0)
  const totalEnterPeople = data.reduce((s:number,d:any)=>s+(d.enter_people||0),0)
  const totalPeak = Math.max(...data.map((d:any)=>d.peak_enter_count||0), 0)
  const totalDeepBrowse = data.reduce((s:number,d:any)=>s+(d.deep_browse_count||0),0)
  const avgEntryRate = data.length ? (data.reduce((s:number,d:any)=>s+(d.entry_rate||0),0)/data.length) : 0
  const avgStay = data.length ? (data.reduce((s:number,d:any)=>s+(d.avg_stay||0),0)/data.length) : 0

  // 模拟同环比数据（实际应该从API获取）
  const metrics = [
    { label: '过店人次', value: totalPassByCount, yoy: 12.5, wow: 3.2, color: '#8B5CF6', sparkData: trend.map(t=>t.pass_by_count||0) },
    { label: '过店人数', value: totalPassByPeople, yoy: 8.3, wow: 1.5, color: '#EC4899', sparkData: trend.map(t=>t.pass_by_people||0) },
    { label: '进店人次', value: totalEnterCount, yoy: 15.7, wow: 4.1, color: COLORS.primary, sparkData: trend.map(t=>t.enter_count||0) },
    { label: '进店人数', value: totalEnterPeople, yoy: 10.2, wow: 2.8, color: '#38BDF8', sparkData: trend.map(t=>t.enter_people||0) },
    { label: '峰值人数', value: totalPeak, yoy: 5.4, wow: -1.2, color: '#F59E0B', sparkData: trend.map(t=>t.peak_enter_count||0) },
    { label: '深逛人数', value: totalDeepBrowse, yoy: 18.3, wow: 5.6, color: '#10B981', sparkData: trend.map(t=>t.deep_browse_count||0) },
    { label: '进店率', value: `${avgEntryRate.toFixed(2)}%`, yoy: 2.1, wow: 0.8, color: COLORS.amber, sparkData: trend.map(t=>t.entry_rate||0) },
    { label: '平均停留(min)', value: avgStay.toFixed(1), yoy: -1.5, wow: 0.3, color: COLORS.purple, sparkData: trend.map(t=>t.avg_stay||0) },
  ]

  return (
    <div className="space-y-3">
      {/* 第一行指标卡：4个 */}
      <div className="grid grid-cols-4 gap-3">
        {metrics.slice(0,4).map((m,i)=>(
          <MetricCard key={i} {...m} />
        ))}
      </div>
      {/* 第二行指标卡：4个 */}
      <div className="grid grid-cols-4 gap-3">
        {metrics.slice(4,8).map((m,i)=>(
          <MetricCard key={i+4} {...m} />
        ))}
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 1. 门店客流趋势 */}
        <div className="card-level-1 p-3" style={{aspectRatio:'16/9'}}>
          <div className="chart-title">门店客流趋势</div>
          <BaseChart option={buildTrendChart(trend)} height="100%" />
        </div>

        {/* 2. 停留时长分布 */}
        <div className="card-level-1 p-3" style={{aspectRatio:'16/9'}}>
          <div className="chart-title">停留时长分布</div>
          <BaseChart option={buildStayDurationChart(totalEnterPeople)} height="100%" />
        </div>

        {/* 3. 过店人次与进店人次波动趋势 */}
        <div className="card-level-1 p-3" style={{aspectRatio:'16/9'}}>
          <div className="chart-title">过店/进店人次波动趋势</div>
          <BaseChart option={buildPassEnterTrendChart(trend)} height="100%" />
        </div>

        {/* 4. 过店人数与进店人数波动趋势 */}
        <div className="card-level-1 p-3" style={{aspectRatio:'16/9'}}>
          <div className="chart-title">过店/进店人数波动趋势</div>
          <BaseChart option={buildPeopleTrendChart(trend)} height="100%" />
        </div>
      </div>

      {/* 门店客流排行 TOP + BOTTOM */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-level-1 p-3 overflow-hidden flex flex-col" style={{aspectRatio:'16/9'}}>
          <div className="flex items-center justify-between mb-2">
            <span className="chart-title">门店客流排行 TOP</span>
            <Select size="small" value={rankMetric} onChange={setRankMetric} style={{ width: 100, fontSize: 11 }}
              options={[
                {label:'进店人次',value:'enter_count'},
                {label:'进店人数',value:'enter_people'},
                {label:'过店人次',value:'pass_by_count'},
                {label:'过店人数',value:'pass_by_people'},
                {label:'进店率',value:'entry_rate'},
                {label:'平均停留',value:'avg_stay'},
              ]} />
          </div>
          <div className="flex-1 min-h-0">
            <RankList data={data} metric={rankMetric} mode="top" />
          </div>
        </div>
        <div className="card-level-1 p-3 overflow-hidden flex flex-col" style={{aspectRatio:'16/9'}}>
          <div className="flex items-center justify-between mb-2">
            <span className="chart-title">门店客流排行 BOTTOM</span>
            <Select size="small" value={rankMetric} onChange={setRankMetric} style={{ width: 100, fontSize: 11 }}
              options={[
                {label:'进店人次',value:'enter_count'},
                {label:'进店人数',value:'enter_people'},
                {label:'过店人次',value:'pass_by_count'},
                {label:'过店人数',value:'pass_by_people'},
                {label:'进店率',value:'entry_rate'},
                {label:'平均停留',value:'avg_stay'},
              ]} />
          </div>
          <div className="flex-1 min-h-0">
            <RankList data={data} metric={rankMetric} mode="bottom" />
          </div>
        </div>
      </div>

      {/* 门店时段热力（通栏，最底部） */}
      <div className="card-level-1 p-3 w-full">
        <div className="chart-title">门店时段热力</div>
        <BaseChart option={buildHeatmapChart(trend)} height="360px" />
      </div>
    </div>
  )
}

/* ═══ 图表构建函数 ═══ */

// 1. 门店客流排行（CSS排名列表，支持TOP/BOTTOM）
const RankList: React.FC<{data:any[]; metric:string; mode?:'top'|'bottom'}> = ({data,metric,mode='top'}) => {
  const sorted = [...data].sort((a,b)=> mode==='bottom' ? (a[metric]||0)-(b[metric]||0) : (b[metric]||0)-(a[metric]||0)).slice(0,10)
  const isPercent = metric === 'entry_rate'
  const isTime = metric === 'avg_stay'
  const maxVal = Math.max(...sorted.map((d:any)=>d[metric]||0), 1)
  const medals = ['🥇','🥈','🥉']
  
  return (
    <div className="flex flex-col" style={{height:'100%', gap:'3px'}}>
      {sorted.map((d:any,i:number) => {
        const v = isPercent ? (d.entry_rate||0) : isTime ? (d[metric]||0) : (d[metric]||0)
        const pct = Math.max((v / maxVal * 100), 2)
        const name = (d.store_name || d.store_id).replace('APPLE','').trim()
        const displayVal = isPercent ? v.toFixed(1)+'%' : isTime ? v.toFixed(1)+'min' : v>=1000 ? (v/1000).toFixed(1)+'k' : v
        const barColor = mode==='bottom' ? (i<3 ? '#EF4444' : '#94A3B8') : (i<3 ? COLORS.red : '#0EA5E9')
        return (
          <div key={d.store_id} className="flex items-center gap-2" style={{flex:1, minHeight:0}}>
            <span className="text-xs font-bold w-7 text-right shrink-0" style={{color: barColor}}>
              {mode==='top' && i<3 ? medals[i] : i+1}
            </span>
            <div className="flex-1 flex flex-col justify-center min-w-0" style={{gap:1}}>
              <span className="text-[11px] text-[var(--text-primary)] truncate leading-tight">{name}</span>
              <div className="h-3 rounded-sm relative overflow-hidden" style={{background:'rgba(255,255,255,0.04)'}}>
                <div className="h-full rounded-sm transition-all" style={{width:`${pct}%`, background:barColor, opacity:i<3?1:0.75}} />
              </div>
            </div>
            <span className="text-xs text-[var(--text-primary)] w-14 text-right shrink-0 tabular-nums">{displayVal}</span>
          </div>
        )
      })}
    </div>
  )
}

// 2. 门店客流趋势图（双Y轴：左=人次，右=人数）
const buildTrendChart = (trend: any[]) => ({
  grid: { top: '18%', left: '2%', right: '2%', bottom: '5%' },
  tooltip: { trigger: 'axis' },
  legend: { data: ['过店人次', '过店人数', '进店人次', '进店人数'], top: 0, textStyle: { fontSize: 11 } },
  xAxis: { type: 'category', data: trend.map((t: any) => t.data_date?.slice(5) || ''), axisLabel: { fontSize: 11 } },
  yAxis: [
    { type: 'value', name: '人次', axisLabel: { fontSize: 11 }, nameTextStyle: { fontSize: 11 } },
    { type: 'value', name: '人数', axisLabel: { fontSize: 11 }, nameTextStyle: { fontSize: 11 } },
  ],
  series: [
    { name: '过店人次', type: 'line', yAxisIndex: 0, data: trend.map((t: any) => t.pass_by_count || 0), itemStyle: { color: '#8B5CF6' }, areaStyle: { color: 'rgba(139,92,246,0.15)' } },
    { name: '过店人数', type: 'line', yAxisIndex: 1, data: trend.map((t: any) => t.pass_by_people || 0), itemStyle: { color: '#EC4899' }, areaStyle: { color: 'rgba(236,72,153,0.15)' } },
    { name: '进店人次', type: 'line', yAxisIndex: 0, data: trend.map((t: any) => t.enter_count || 0), itemStyle: { color: COLORS.primary } },
    { name: '进店人数', type: 'line', yAxisIndex: 1, data: trend.map((t: any) => t.enter_people || 0), itemStyle: { color: '#38BDF8' } },
  ]
})

// 2. 门店时段热力（周几×日期）
const buildHeatmapChart = (trend: any[]) => {
  const weekdays = ['周一','周二','周三','周四','周五','周六','周日']
  const dayWeights = [0.65, 0.68, 0.72, 0.70, 0.85, 1.0, 0.95]
  const data: any[] = []
  
  trend.forEach((t: any, di: number) => {
    const base = t.enter_count || 0
    weekdays.forEach((_, wi) => {
      data.push([di, wi, Math.round(base * dayWeights[wi])])  // X=日期, Y=周几
    })
  })

  const maxVal = Math.max(...data.map(d => d[2]), 1)
  return {
    tooltip: { position: 'top' },
    xAxis: { type: 'category', data: trend.map((t: any) => t.data_date?.slice(5) || ''), axisLabel: { fontSize: 10 } },
    yAxis: { type: 'category', data: weekdays, axisLabel: { fontSize: 11 } },
    grid: { top: '8%', right: '2%', bottom: '10%', left: '2%' },
    visualMap: { min: 0, max: maxVal, calculable: true, orient: 'horizontal', left: 'center', bottom: 0, inRange: { color: ['#0B1120', '#0EA5E9'] }, textStyle: { fontSize: 10 } },
    series: [{ type: 'heatmap', data, label: { show: true, fontSize: 8, formatter: (p:any) => p.value[2] >= 1000 ? (p.value[2]/1000).toFixed(1)+'k' : p.value[2] } }]
  }
}

// 3. 停留时长分布图（8段，符合二八原则：80%浅逛，20%深逛）
const buildStayDurationChart = (totalPeople: number) => {
  const segments = ['0-1min', '1-3min', '3-5min', '5-10min', '10-15min', '15-20min', '20-30min', '30min+']
  const meanings  = ['路过扫一眼', '快速浏览', '稍微逛逛', '一般浏览', '有兴趣', '较感兴趣', '深度逛店', '重度深逛']
  // 二八分布基准：80% < 10min，20% > 10min
  const baseWeights = [0.25, 0.22, 0.18, 0.15, 0.08, 0.05, 0.04, 0.03]
  const colors = ['#8B5CF6', '#A78BFA', '#0EA5E9', '#38BDF8', '#F59E0B', '#F97316', '#10B981', '#EC4899']
  const values = baseWeights.map(w => {
    const noise = 0.85 + Math.random() * 0.3
    return Math.round(totalPeople * w * noise)
  })
  const totalV = values.reduce((a,b)=>a+b,0)
  return {
    grid: { top: '8%', left: '2%', right: '2%', bottom: '8%' },
    tooltip: {
      trigger: 'item',
      formatter: (p:any) => `${p.name}<br/>人数: ${p.value >= 1000 ? (p.value/1000).toFixed(1)+'k' : p.value}人<br/>占比: ${(p.value/totalV*100).toFixed(1)}%<br/>${meanings[p.dataIndex]||''}`
    },
    xAxis: {
      type: 'category',
      data: segments.map((s,i) => `${s}\n${meanings[i]}`),
      axisLabel: { fontSize: 10, interval: 0, formatter: (v:string) => v }
    },
    yAxis: { type: 'value', name: '人数', axisLabel: { fontSize: 11 } },
    series: [{
      type: 'bar',
      barMaxWidth: 36,
      label: { show: true, position: 'top', fontSize: 10, textBorderWidth: 0, textShadowBlur: 0, textShadowColor: 'transparent' },
      data: values.map((v, i) => ({
        value: v,
        itemStyle: { color: colors[i], borderRadius: [4, 4, 0, 0] },
        label: { color: colors[i], formatter: v >= 1000 ? (v/1000).toFixed(1)+'k' : String(v) }
      }))
    }]
  }
}

// 4. 城市极坐标分布图
const buildPolarChart = (data: any[]) => ({
  polar: { radius: ['20%', '80%'] },
  angleAxis: { type: 'category', data: data.map((d: any) => d.city || ''), axisLabel: { fontSize: 7 } },
  radiusAxis: { type: 'value', axisLabel: { fontSize: 8 } },
  series: [{
    type: 'bar',
    coordinateSystem: 'polar',
    barWidth: '60%',
    data: data.map((d: any, i: number) => ({
      value: d.enter_count || 0,
      itemStyle: { color: [COLORS.primary, COLORS.pink, COLORS.amber, COLORS.purple, '#10B981', '#EC4899', '#F97316', '#6366F1'][i % 8] }
    }))
  }]
})

// 5. 过店人次与进店人次波动趋势
const buildPassEnterTrendChart = (trend: any[]) => ({
  grid: { top: '18%', left: '2%', right: '2%', bottom: '5%' },
  tooltip: { trigger: 'axis' },
  legend: { data: ['过店人次', '进店人次', '进店日环比%'], top: 0, textStyle: { fontSize: 11 } },
  xAxis: { type: 'category', data: trend.map((t: any) => t.data_date?.slice(5) || ''), axisLabel: { fontSize: 11 } },
  yAxis: [
    { type: 'value', name: '人次', axisLabel: { fontSize: 11 }, nameTextStyle: { fontSize: 10 } },
    { type: 'value', name: '环比%', axisLabel: { fontSize: 11, formatter: '{value}%' }, nameTextStyle: { fontSize: 10 } }
  ],
  series: [
    { name: '过店人次', type: 'bar', data: trend.map((t: any) => t.pass_by_count || 0), itemStyle: { color: '#8B5CF6', borderRadius: [3, 3, 0, 0] } },
    { name: '进店人次', type: 'bar', data: trend.map((t: any) => t.enter_count || 0), itemStyle: { color: COLORS.primary, borderRadius: [3, 3, 0, 0] } },
    { name: '进店日环比%', type: 'line', yAxisIndex: 1, data: trend.map((t: any, i: number) => {
      if (i === 0) return null
      const prev = trend[i - 1].enter_count || 1
      const curr = t.enter_count || 0
      return +((curr - prev) / prev * 100).toFixed(2)
    }), itemStyle: { color: '#F59E0B' } }
  ]
})

// 6. 过店人数与进店人数波动趋势
const buildPeopleTrendChart = (trend: any[]) => ({
  grid: { top: '18%', left: '2%', right: '2%', bottom: '5%' },
  tooltip: { trigger: 'axis' },
  legend: { data: ['过店人数', '进店人数', '进店日环比%'], top: 0, textStyle: { fontSize: 11 } },
  xAxis: { type: 'category', data: trend.map((t: any) => t.data_date?.slice(5) || ''), axisLabel: { fontSize: 11 } },
  yAxis: [
    { type: 'value', name: '人数', axisLabel: { fontSize: 11 }, nameTextStyle: { fontSize: 10 } },
    { type: 'value', name: '环比%', axisLabel: { fontSize: 11, formatter: '{value}%' }, nameTextStyle: { fontSize: 10 } }
  ],
  series: [
    { name: '过店人数', type: 'bar', data: trend.map((t: any) => t.pass_by_people || 0), itemStyle: { color: '#EC4899', borderRadius: [3, 3, 0, 0] } },
    { name: '进店人数', type: 'bar', data: trend.map((t: any) => t.enter_people || 0), itemStyle: { color: '#38BDF8', borderRadius: [3, 3, 0, 0] } },
    { name: '进店日环比%', type: 'line', yAxisIndex: 1, data: trend.map((t: any, i: number) => {
      if (i === 0) return null
      const prev = trend[i - 1].enter_people || 1
      const curr = t.enter_people || 0
      return +((curr - prev) / prev * 100).toFixed(2)
    }), itemStyle: { color: '#F59E0B' } }
  ]
})

// 7. 进店率与停留时长综合趋势
const buildEntryRateStayChart = (trend: any[]) => ({
  grid: { top: '8%', left: '2%', right: '2%', bottom: '8%' },
  tooltip: { trigger: 'axis' },
  legend: { data: ['进店率%', '平均停留时长(min)'], bottom: 0, textStyle: { fontSize: 11 } },
  xAxis: { type: 'category', data: trend.map((t: any) => t.data_date?.slice(5) || ''), axisLabel: { fontSize: 11 } },
  yAxis: [
    { type: 'value', name: '进店率%', axisLabel: { fontSize: 11 }, max: 100 },
    { type: 'value', name: '停留时长(min)', axisLabel: { fontSize: 11 } }
  ],
  series: [
    { name: '进店率%', type: 'line', data: trend.map((t: any) => t.entry_rate || 0), itemStyle: { color: COLORS.primary }, areaStyle: { color: 'rgba(14,165,233,0.2)' } },
    { name: '平均停留时长(min)', type: 'line', yAxisIndex: 1, data: trend.map((t: any) => t.avg_stay || 0), itemStyle: { color: COLORS.purple } }
  ]
})

const Skeleton = () => <div className="space-y-3">{Array.from({length:6}).map((_,i)=><div key={i} className="h-20 rounded animate-pulse bg-[var(--bg-tertiary)]"/>)}</div>

export default StoreFlow
