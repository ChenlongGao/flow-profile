import React, { useState } from 'react'
import { Target, TrendingUp, BriefcaseBusiness, Clock, MapPin, AlertTriangle, ChevronRight } from 'lucide-react'
import { Tag, Progress, Segmented } from 'antd'

/* ─── 模拟数据 ─── */
const KPI_CARDS = [
  { label:'年度目标完成率', value:'68%', sub:'目标120家 / 已完成82家', icon:Target, color:'#10B981', trend:'+12% vs 去年同期' },
  { label:'本月计划开店', value:'8家', sub:'已开5家 / 待开3家', icon:TrendingUp, color:'#F59E0B', trend:'本月截止5月31日' },
  { label:'在途商机数', value:'24个', sub:'深度谈判6 / 初步接触14 / 即将签约4', icon:BriefcaseBusiness, color:'#3B82F6', trend:'5个本周需跟进' },
  { label:'待处理任务', value:'18项', sub:'已逾期2 / 3日内到期5', icon:Clock, color:'#EF4444', trend:'点击查看详情' },
]

const HOT_PROJECTS = [
  { name:'茶颜悦色·武汉江汉路旗舰店', stage:'即将签约', person:'张拓', date:'2026-06-15', invest:280, priority:'高' },
  { name:'茶颜悦色·成都太古里店', stage:'深度谈判', person:'李建', date:'2026-07-01', invest:350, priority:'高' },
  { name:'茶颜悦色·广州天河城店', stage:'初步接触', person:'王敏', date:'2026-08-01', invest:220, priority:'中' },
  { name:'茶颜悦色·杭州湖滨银泰店', stage:'深度谈判', person:'陈丽', date:'2026-07-15', invest:300, priority:'高' },
  { name:'茶颜悦色·南京新街口店', stage:'初步接触', person:'赵强', date:'2026-09-01', invest:200, priority:'中' },
  { name:'茶颜悦色·西安钟楼店', stage:'即将签约', person:'吴婷', date:'2026-06-30', invest:260, priority:'高' },
]

const ALERTS = [
  { type:'逾期', content:'武汉江汉路旗舰店 - 合同审批逾期3天', level:'urgent' },
  { type:'停滞', content:'广州天河城店 - 商机停滞9天未跟进', level:'warning' },
  { type:'落后', content:'华南区域 - 年度目标完成率仅45%, 落后计划15%', level:'warning' },
  { type:'逾期', content:'杭州湖滨银泰店 - 调研报告提交逾期1天', level:'urgent' },
]

const REGION_PROGRESS = [
  { region:'华中', target:30, done:22, pct:73 },
  { region:'华东', target:25, done:18, pct:72 },
  { region:'华南', target:20, done:13, pct:65 },
  { region:'西南', target:18, done:14, pct:78 },
  { region:'华北', target:15, done:10, pct:67 },
  { region:'西北', target:12, done:5, pct:42 },
]

const stageColor:Record<string,string> = { '即将签约':'green','深度谈判':'blue','初步接触':'orange' }

/* ═══ 目标达成趋势 ─── 月 / 季 / 年 日历视图 ═══ */
type TrendGranularity = 'month' | 'quarter' | 'year'

interface CalendarDay { day: number; plan: number; actual: number }
interface CalendarMonth { name: string; year: number; month: number; startDay: number; days: CalendarDay[] }

const WEEKDAYS = ['一','二','三','四','五','六','日']

// 获取某年某月第一天是星期几 (0=周日 → 转换为 0=周一)
const getFirstWeekday = (year: number, month: number): number => {
  const d = new Date(year, month-1, 1).getDay()
  return d === 0 ? 6 : d-1  // 0=周一
}

// 生成日历月数据
const genCalendarMonth = (year: number, month: number, dayCount: number): CalendarMonth => ({
  name: `${month}月`,
  year,
  month,
  startDay: getFirstWeekday(year, month),
  days: Array.from({length: dayCount}, (_,i) => ({
    day: i+1,
    plan: 7 + Math.floor(Math.random()*5),
    actual: 4 + Math.floor(Math.random()*8),
  })),
})

/* ═══ 日历格子 ═══ */
const DayCell: React.FC<{ d: CalendarDay | null; compact?: boolean }> = ({ d, compact }) => {
  if (!d) return <div className="rounded-sm" style={{background:'transparent'}} />
  const ok = d.actual >= d.plan
  const pct = Math.min(1, d.actual / Math.max(d.plan, 1))
  const bg = ok ? `rgba(16,185,129,${0.15 + pct*0.55})` : `rgba(239,68,68,${0.1 + pct*0.5})`
  const border = ok ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.35)'
  const textC = ok ? '#10B981' : '#EF4444'

  if (compact) {
    return (
      <div className="rounded-sm flex items-center justify-center" style={{background:bg, border:`1px solid ${border}`, aspectRatio:'1', fontSize:8, color:textC, fontWeight:500}}>
        {d.day}
      </div>
    )
  }

  return (
    <div className="rounded flex flex-col justify-between p-0.5" style={{background:bg, border:`1px solid ${border}`, minHeight:0}}>
      <span className="text-[9px] font-medium leading-none" style={{color:textC}}>{d.day}</span>
      <div className="flex flex-col gap-px">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:'rgba(16,185,129,0.4)'}} />
          <span className="text-[7px] text-[var(--text-muted)] leading-none">{d.plan}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:ok?'#10B981':'#EF4444'}} />
          <span className="text-[7px] font-medium leading-none" style={{color:textC}}>{d.actual}</span>
        </div>
      </div>
    </div>
  )
}

/* ═══ 单月日历 ═══ */
const CalendarGrid: React.FC<{ data: CalendarMonth; showHeader?: boolean; compact?: boolean }> = ({ data, showHeader=true, compact=false }) => {
  const totalCells = 7 * 6  // 最多6行
  const cells: (CalendarDay | null)[] = Array(totalCells).fill(null)
  data.days.forEach((d, i) => { cells[data.startDay + i] = d })

  return (
    <div className="flex flex-col" style={{flex:1, gap:compact?1:2, minWidth:0}}>
      {showHeader && <span className={`font-medium text-[var(--text-primary)] ${compact?'text-[8px]':'text-[9px]'} leading-none shrink-0`}>{data.name}</span>}
      {!compact && (
        <div className="grid grid-cols-7 gap-0.5 shrink-0">
          {WEEKDAYS.map(w => <div key={w} className="text-center text-[7px] text-[var(--text-muted)] leading-none py-0.5">{w}</div>)}
        </div>
      )}
      <div className="grid grid-cols-7 flex-1" style={{gap:compact?1:2}}>
        {cells.map((d, i) => <DayCell key={i} d={d} compact={compact} />)}
      </div>
    </div>
  )
}

/* ═══ 趋势图子组件 ═══ */
const TrendChart: React.FC<{ granularity: TrendGranularity }> = ({ granularity }) => {
  if (granularity === 'month') {
    // 单月日历：5月
    const data = genCalendarMonth(2026, 5, 31)
    return <CalendarGrid data={data} compact={false} />
  }

  if (granularity === 'quarter') {
    // 季度：4月+5月+6月 三列并排
    const months = [genCalendarMonth(2026, 4, 30), genCalendarMonth(2026, 5, 31), genCalendarMonth(2026, 6, 30)]
    return (
      <div className="flex gap-3" style={{flex:1, minHeight:0}}>
        {months.map(m => <CalendarGrid key={m.name} data={m} compact={false} />)}
      </div>
    )
  }

  // 年模式：Q1-Q4 四个季度，每季度3个紧凑月历
  const allMonths = [1,2,3,4,5,6,7,8,9,10,11,12].map(m => genCalendarMonth(2026, m, [1,3,5,7,8,10,12].includes(m) ? 31 : m===2 ? 28 : 30))
  const quarters = [
    { name:'Q1', months: allMonths.slice(0,3) },
    { name:'Q2', months: allMonths.slice(3,6) },
    { name:'Q3', months: allMonths.slice(6,9) },
    { name:'Q4', months: allMonths.slice(9,12) },
  ]

  return (
    <div className="flex flex-col gap-2" style={{flex:1, overflow:'hidden'}}>
      {quarters.map(q => (
        <div key={q.name} className="flex flex-col gap-0.5" style={{flex:1}}>
          <span className="text-[8px] font-medium text-[var(--text-muted)] leading-none">{q.name}</span>
          <div className="flex gap-2" style={{flex:1}}>
            {q.months.map(m => <CalendarGrid key={m.name} data={m} showHeader={true} compact={true} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

export const LocationDashboardOverview: React.FC = () => {
  const [trendGranularity, setTrendGranularity] = useState<TrendGranularity>('month')

  return (
  <div className="p-6 space-y-4 overflow-y-auto h-full">
    <div className="flex items-center justify-between">
      <h2 className="text-base font-semibold text-[var(--text-primary)]">拓店看板</h2>
      <span className="text-[11px] text-[var(--text-muted)]">最后更新：2026-05-18 11:30</span>
    </div>

    {/* KPI 指标卡 */}
    <div className="grid grid-cols-4 gap-3">
      {KPI_CARDS.map((k, i) => {
        const Icon = k.icon
        return <div key={i} className="card-level-1 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${k.color === '#10B981' ? 'bg-emerald-500/10' : k.color === '#F59E0B' ? 'bg-amber-500/10' : k.color === '#EF4444' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
              <Icon className="w-3.5 h-3.5" style={{color:k.color}} />
            </div>
            <span className="label-primary">{k.label}</span>
          </div>
          <div className="value-medium" style={{color: k.color}}>{k.value}</div>
          <div className="caption">{k.sub}</div>
          <div className="caption" style={{color:k.color}}>{k.trend}</div>
        </div>
      })}
    </div>

    {/* 区域目标进度 + 趋势图 16:9 */}
    <div className="grid grid-cols-2 gap-3">
      {/* 各区域年度目标完成进度 */}
      <div className="chart-card flex flex-col" style={{height:280,overflow:'hidden'}}>
        <div className="chart-title shrink-0">各区域年度目标完成进度</div>
        <div className="flex flex-col justify-center gap-3" style={{flex:1,paddingTop:0}}>
          {REGION_PROGRESS.map(r => (
            <div key={r.region} className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-primary)] w-10">{r.region}</span>
              <div className="flex-1">
                <Progress percent={r.pct} size="small" strokeColor={r.pct>=70?'#10B981':r.pct>=50?'#F59E0B':'#EF4444'}
                  format={()=>`${r.done}/${r.target}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 目标达成趋势（近12月）16:9 + 月/季/年切换 */}
      <div className="chart-card flex flex-col" style={{height:280,overflow:'hidden'}}>
        <div className="flex items-center justify-between shrink-0 mb-2">
          <div className="chart-title">目标达成趋势</div>
          <Segmented size="small" value={trendGranularity} onChange={v=>setTrendGranularity(v as TrendGranularity)}
            options={[
              {value:'month',label:'月'},
              {value:'quarter',label:'季'},
              {value:'year',label:'年'},
            ]}
            style={{fontSize:10}}
          />
        </div>
        <TrendChart granularity={trendGranularity} />
        <div className="flex items-center gap-3 text-[9px] text-[var(--text-muted)] pt-1 shrink-0 border-t border-[var(--border-subtle)] mt-1">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{backgroundColor:'rgba(16,185,129,0.3)'}} />计划目标</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400 opacity-90" />实际完成</span>
          <span className="ml-auto">
            {trendGranularity==='month'?'本月达成率 82%':trendGranularity==='quarter'?'本季达成率 76%':'全年达成率 68%'}
          </span>
        </div>
      </div>
    </div>

    {/* 重点项目 + 异常预警 */}
    <div className="grid grid-cols-2 gap-3">
      <div className="card-level-1 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="chart-title">重点项目跟踪</div>
          <button className="text-[10px] text-[var(--ai-blue-500)] hover:underline">全部项目 <ChevronRight className="w-3 h-3 inline" /></button>
        </div>
        {HOT_PROJECTS.map((p, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-[var(--border-subtle)] last:border-0">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-[var(--text-primary)] truncate">{p.name}</div>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[var(--text-muted)]">
                <span>{p.person}</span>
                <span>投资¥{p.invest}万</span>
              </div>
            </div>
            <Tag color={stageColor[p.stage]} style={{fontSize:10}}>{p.stage}</Tag>
            <span className="text-[10px] text-[var(--text-muted)]">{p.date}</span>
          </div>
        ))}
      </div>

      <div className="card-level-1 p-4 space-y-2">
        <div className="chart-title flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />异常预警
        </div>
        {ALERTS.map((a, i) => (
          <div key={i} className="flex items-start gap-2 py-2 border-b border-[var(--border-subtle)] last:border-0">
            <Tag color={a.level==='urgent'?'red':'orange'} style={{fontSize:9,whiteSpace:'nowrap'}}>
              {a.type}
            </Tag>
            <span className="text-xs text-[var(--text-secondary)] leading-relaxed">{a.content}</span>
            <button className="shrink-0 text-[10px] text-[var(--ai-blue-500)] hover:underline ml-auto">处理</button>
          </div>
        ))}
      </div>
    </div>
  </div>
  )
}
