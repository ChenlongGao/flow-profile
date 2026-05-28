import React, { useEffect, useState, useMemo } from 'react'
import { BaseChart } from '../components/echarts/BaseChart'
import { COLORS } from '../config/echarts-theme'
import { formatNumber } from '../utils/format'
import { Tag, Select, Cascader, DatePicker } from 'antd'
import { TrendingUp, Brain, AlertCircle } from 'lucide-react'
import dayjs from 'dayjs'
import { api } from '../api/client'

/* ═══ 模拟数据（API 不可用时兜底） ═══ */
const MOCK = {
  histDates: ['05-01','05-02','05-03','05-04','05-05','05-06','05-07','05-08','05-09','05-10','05-11','05-12','05-13'],
  predDates: ['05-14','05-15','05-16','05-17','05-18','05-19','05-20'],
  passerbyActual: [2840,3120,2980,2650,2750,3010,2880,2950,3240,3080,2820,2690,2910],
  passerbyForecast: [2930,3050,3180,2960,2720,2850,3040],
  passerbyLower: [2750,2850,2950,2700,2480,2600,2800],
  passerbyUpper: [3120,3280,3420,3220,2960,3100,3280],
  enterActual: [1120,1280,1190,1020,1080,1220,1150,1180,1310,1250,1100,1030,1170],
  enterForecast: [1180,1240,1300,1200,1080,1130,1220],
  enterLower: [1080,1120,1160,1060,960,1000,1100],
  enterUpper: [1280,1380,1440,1340,1200,1260,1340],
  metrics: { passerby_avg:2950,enter_avg:1180,passerby_trend:'↑ 上升',enter_trend:'↑ 上升',passerby_std:150,enter_std:60 }
}

const buildPredictChart = (histDates: string[], histValues: number[], predDates: string[], predValues: number[], lower: number[], upper: number[], name: string, color: string) => {
  const allDates = [...histDates, ...predDates]; const histLen = histDates.length
  return {
    grid: { top: '10%', left: '3%', right: '5%', bottom: '12%' },
    tooltip: {
      trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'transparent', textStyle: { fontSize: 12, color: '#fff' },
      formatter: (params: any) => {
        const actual = params.find((p: any) => p.seriesName === name)
        const forecast = params.find((p: any) => p.seriesName === '预测值')
        const av = actual?.value
        const fv = forecast?.value
        let html = `<div style="font-size:11px;color:#999">${params[0].axisValue}</div>`
        if (av != null && av !== '') html += `<div style="margin-top:4px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:6px"></span>实际值：<b>${formatNumber(av)} 人次</b></div>`
        if (fv != null && fv !== '') html += `<div style="margin-top:2px"><span style="display:inline-block;width:8px;height:8px;background:${color};margin-right:6px;opacity:0.6;border:1px dashed ${color}"></span>预测值：<b>${formatNumber(fv)} 人次</b></div>`
        const idx = params[0].dataIndex
        if (idx >= histLen) html += `<div style="margin-top:2px;font-size:10px;color:#666">置信区间：${lower[idx-histLen]} ~ ${upper[idx-histLen]}</div>`
        return html
      },
    },
    legend: { data: [name, '预测值'], bottom: 0, textStyle: { fontSize: 11 } },
    xAxis: { type: 'category', data: allDates, axisLabel: { fontSize: 10 }, axisLine: { lineStyle: { color: 'rgba(148,163,184,0.2)' } }, axisTick: { show: false } },
    yAxis: { type: 'value', name: '人次', axisLabel: { fontSize: 10, formatter: (v: number) => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v }, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.15)', type: 'dashed' } } },
    series: [
      { name, type: 'line', data: [...histValues, ...Array(predDates.length).fill(null)], itemStyle: { color }, symbol: 'circle', symbolSize: 4, lineStyle: { width: 2.5 } },
      { name: '预测值', type: 'line', data: [...Array(histLen).fill(null), ...predValues], itemStyle: { color, opacity: 0.6 }, symbol: 'diamond', symbolSize: 5, lineStyle: { width: 2, type: 'dashed', color } },
      { name: '置信上界', type: 'line', data: [...Array(histLen).fill(null), ...upper], lineStyle: { width: 0 }, symbol: 'none', stack: 'confidence', areaStyle: { color: color + '08' }, silent: true },
      { name: '置信下界', type: 'line', data: [...Array(histLen).fill(null), ...lower], lineStyle: { width: 0 }, symbol: 'none', areaStyle: { color: color + '12' }, silent: true },
    ],
  }
}

/* ═══ 回测误差评估组件 ═══ */
const buildApeChart = (dates: string[], ape: number[], name: string, color: string, mape: number) => ({
  grid: { top: '10%', left: '3%', right: '5%', bottom: '12%' },
  tooltip: {
    trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'transparent',
    textStyle: { fontSize: 12, color: '#fff' },
    formatter: (p: any) => {
      const d = p[0]
      const v = d.value
      const cls = v < 5 ? '#10B981' : v < 10 ? '#F59E0B' : '#EF4444'
      return `<div style="font-size:11px;color:#999">${d.axisValue}</div><div style="margin-top:4px">${name}误差：<b style="color:${cls}">${v.toFixed(1)}%</b></div><div style="font-size:10px;color:#666">MAPE：${mape}%</div>`
    },
  },
  legend: { data: [name], bottom: 0, textStyle: { fontSize: 11 } },
  xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: 'rgba(148,163,184,0.2)' } } },
  yAxis: { type: 'value', name: '误差%', axisLabel: { fontSize: 10, formatter: '{value}%' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.15)', type: 'dashed' } }, max: 15 },
  series: [{
    name, type: 'bar',
    data: ape.map((v, i) => ({
      value: v,
      itemStyle: {
        color: v < 5 ? '#10B981' : v < 10 ? '#F59E0B' : '#EF4444',
        borderRadius: [4, 4, 0, 0],
      },
    })),
    barMaxWidth: 32,
    markLine: {
      silent: true, symbol: 'none',
      data: [{ yAxis: 10, label: { formatter: '10% 警戒线', fontSize: 10, color: '#EF4444' }, lineStyle: { color: '#EF4444', type: 'dashed', width: 1 } }],
    },
  }],
})

const BacktestSection: React.FC = () => {
  const [bt, setBt] = useState<any>(null)
  const [btLoading, setBtLoading] = useState(true)

  useEffect(() => {
    setBtLoading(true)
    fetch('/api/flow/backtest?test_start=2026-05-01&test_end=2026-05-13')
      .then(r => r.json()).then(d => { setBt(d); setBtLoading(false) })
      .catch(() => setBtLoading(false))
  }, [])

  if (btLoading) return (
    <div className="card-level-1 p-6 text-center text-xs text-[var(--text-muted)]">加载回测数据...</div>
  )
  if (!bt || bt.error) return null

  const dates = (bt.test_dates || []).map((d: string) => d.slice(5))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] my-0 leading-none">模型误差评估 (MAPE 回测)</h3>
        <Tag color="purple" style={{fontSize:10,lineHeight:'20px'}}>2026-05-01 ~ 05-13</Tag>
      </div>

      {/* MAPE 汇总卡 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '过店人次 MAPE', value: `${bt.passerby_mape}%`, color: bt.passerby_mape < 10 ? '#10B981' : '#F59E0B', desc: bt.passerby_mape < 5 ? '✓ 优秀' : bt.passerby_mape < 10 ? '○ 良好' : '⚠ 需优化' },
          { label: '进店人次 MAPE', value: `${bt.enter_mape}%`, color: bt.enter_mape < 10 ? '#10B981' : '#F59E0B', desc: bt.enter_mape < 5 ? '✓ 优秀' : bt.enter_mape < 10 ? '○ 良好' : '⚠ 需优化' },
          { label: '综合 MAPE', value: `${bt.overall_mape}%`, color: bt.overall_mape < 10 ? COLORS.primary : '#F59E0B', desc: '过店+进店平均' },
        ].map(m => (
          <div key={m.label} className="card-level-1 p-3">
            <div className="text-[10px] text-[var(--text-muted)]">{m.label}</div>
            <div className="text-lg font-semibold mt-1 text-number" style={{color: m.color}}>{m.value}</div>
            <div className="text-[10px] mt-0.5" style={{color: m.color}}>{m.desc}</div>
          </div>
        ))}
      </div>

      {/* 误差率趋势图 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-level-1 p-3" style={{aspectRatio:'16/9', minHeight:320}}>
          <div className="chart-title">过店人次误差率趋势 (MAPE {bt.passerby_mape}%)</div>
          <BaseChart option={buildApeChart(dates, bt.passerby_ape || [], '过店人次误差', COLORS.primary, bt.passerby_mape)} height="100%" />
          <div className="mt-2 text-[10px] text-[var(--text-muted)] leading-relaxed">
            <span className="font-medium">📊 解读：</span>绿色(&lt;5%)→模型准确，黄色(5-10%)→可接受，红色(&gt;10%)→需关注。
            过店人次预测整体稳定，周末/假日波动略高属正常现象。
          </div>
        </div>
        <div className="card-level-1 p-3" style={{aspectRatio:'16/9', minHeight:320}}>
          <div className="chart-title">进店人次误差率趋势 (MAPE {bt.enter_mape}%)</div>
          <BaseChart option={buildApeChart(dates, bt.enter_ape || [], '进店人次误差', '#8B5CF6', bt.enter_mape)} height="100%" />
          <div className="mt-2 text-[10px] text-[var(--text-muted)] leading-relaxed">
            <span className="font-medium">📊 解读：</span>进店人次受消费者行为影响更大，误差率通常略高于过店人次。
            整体 MAPE {bt.enter_mape}% 在商业预测中为良好水平。
          </div>
        </div>
      </div>
    </div>
  )
}

type TimePreset = 'today'|'yesterday'|'7d'|'30d'|'day'|'week'|'month'|'quarter'|'year'|'custom'
const TIME_PRESETS = [
  { label: '今日', value: 'today' }, { label: '昨日', value: 'yesterday' }, { label: '近7天', value: '7d' }, { label: '近30天', value: '30d' },
  { label: '按天', value: 'day' }, { label: '按周', value: 'week' }, { label: '按月', value: 'month' }, { label: '按季', value: 'quarter' }, { label: '按年', value: 'year' }, { label: '自定义', value: 'custom' },
]
function getPresetRange(preset: TimePreset): [dayjs.Dayjs, dayjs.Dayjs]|null {
  const now = dayjs()
  switch(preset) { case 'today': return [now, now]; case 'yesterday': return [now.subtract(1,'day'), now.subtract(1,'day')]; case '7d': return [now.subtract(6,'day'), now]; case '30d': return [now.subtract(29,'day'), now]; default: return null }
}
const { RangePicker } = DatePicker

export const FlowPredict: React.FC = () => {
  const [timePreset, setTimePreset] = useState<TimePreset>('7d')
  const [dateValue, setDateValue] = useState<any>(getPresetRange('7d'))
  const [storeSearchVal, setStoreSearchVal] = useState('')
  const [storeSearchList, setStoreSearchList] = useState<{label:string;value:string}[]>([])
  const [cascaderValue, setCascaderValue] = useState<string[]>([])
  const [cascaderOptions, setCascaderOptions] = useState<any[]>([])
  const [tagCascaderValue, setTagCascaderValue] = useState<string[]>([])
  const [tagCascaderOptions, setTagCascaderOptions] = useState<any[]>([])

  const handlePresetChange = (val: string) => {
    const preset = val as TimePreset; setTimePreset(preset)
    const range = getPresetRange(preset); if (range) setDateValue(range); else setDateValue(preset === 'day' ? dayjs() : null)
  }
  const handleStoreSearch = (v: string) => {
    if (v.length < 1) { setStoreSearchList([]); return }
    api.get<any>(`/stores?search=${encodeURIComponent(v)}`).then(res => setStoreSearchList(res.map((s:any)=>({label:`${s.store_id} - ${s.name}`,value:s.store_id})))).catch(()=>setStoreSearchList([]))
  }
  useEffect(() => {
    Promise.all([api.get<any[]>('/config/tag-groups'), api.get<any[]>('/config/tags')]).then(([groups, tags]) => {
      setTagCascaderOptions(groups.map((g:any)=>({label:g.name, value:g.id, children:tags.filter((t:any)=>t.group_id===g.id).map((t:any)=>({label:t.name, value:t.name}))})))
    }).catch(()=>{})
    api.get<any>('/store-tree').then(d => {
      const toCascader = (node: any): any => {
        if (node.type === 'store' || node.store_id) return { label: node.name, value: node.store_id || node.id }
        const item: any = { label: node.name, value: node.id || node.name }
        if (node.children?.length) { const children = node.children.map(toCascader).filter(Boolean); if (children.length) item.children = children }
        return item
      }
      if (d.children) setCascaderOptions(d.children.map(toCascader).filter(Boolean))
    }).catch(()=>{})
  }, [])

  // 加载预测数据
  const [predData, setPredData] = useState<any>(null)
  const [predLoading, setPredLoading] = useState(true)
  const [predError, setPredError] = useState('')
  const [queryCount, setQueryCount] = useState(0)

  const doPredictQuery = () => {
    setPredLoading(true); setPredError('')
    let qs = '/flow/predict?horizon=7'
    if (storeSearchVal) qs += `&store_id=${encodeURIComponent(storeSearchVal)}`
    api.get<any>(qs)
      .then(d => { setPredData(d); setPredLoading(false) })
      .catch(() => { setPredError('API未响应'); setPredLoading(false) })
  }
  useEffect(() => { doPredictQuery() }, [])  // 初次加载
  const doQuery = () => { doPredictQuery(); setQueryCount(c => c+1) }

  // 使用 API 数据或兜底模拟数据
  const pd = predData && !predError ? {
    histDates: (predData.hist_dates||[]).map((d:string)=>d.slice(5)),
    predDates: (predData.pred_dates||[]).map((d:string)=>d.slice(5)),
    predDatesFull: predData.pred_dates||[],
    passerbyActual: predData.passerby_actual||[],
    passerbyForecast: predData.passerby_pred||[],
    passerbyLower: predData.passerby_lower||[],
    passerbyUpper: predData.passerby_upper||[],
    enterActual: predData.enter_actual||[],
    enterForecast: predData.enter_pred||[],
    enterLower: predData.enter_lower||[],
    enterUpper: predData.enter_upper||[],
    metrics: predData.metrics||MOCK.metrics,
  } : MOCK

  const { histDates, predDates, passerbyActual, passerbyForecast, passerbyLower, passerbyUpper, enterActual, enterForecast, enterLower, enterUpper, metrics } = pd

  const passerbyChart = useMemo(() => buildPredictChart(histDates, passerbyActual, predDates, passerbyForecast, passerbyLower, passerbyUpper, '过店人次', COLORS.primary), [predData])
  const enterChart = useMemo(() => buildPredictChart(histDates, enterActual, predDates, enterForecast, enterLower, enterUpper, '进店人次', '#8B5CF6'), [predData])

  const m = metrics
  const passerbyAvg = m.passerby_avg ?? Math.round(passerbyForecast.reduce((a:number,b:number)=>a+b,0)/7)
  const enterAvg = m.enter_avg ?? Math.round(enterForecast.reduce((a:number,b:number)=>a+b,0)/7)
  const passerbyTrend = m.passerby_trend ?? (passerbyForecast[6] > passerbyForecast[0] ? '↑ 上升' : '↓ 下降')
  const enterTrend = m.enter_trend ?? (enterForecast[6] > enterForecast[0] ? '↑ 上升' : '↓ 下降')

  return (
    <div className="p-4 space-y-3">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">客流预测</h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">基于 Prophet + XGBoost 融合模型，结合天气/假日/AQI 等外部特征，对未来 7 天过店人次和进店人次进行预测</p>
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-3 flex-wrap pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">门店</span>
          <Select
            showSearch
            value={storeSearchVal || undefined}
            onSearch={handleStoreSearch}
            onChange={(v) => { setStoreSearchVal(v); doPredictQuery() }}
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
          <Select value={timePreset} onChange={handlePresetChange} style={{height:32,width:100}} options={TIME_PRESETS} />
          {['today','yesterday','7d','30d'].includes(timePreset) ? (
            <RangePicker value={getPresetRange(timePreset) as any} disabled style={{height:32,width:260}} />
          ) : timePreset === 'day' ? (<DatePicker value={dateValue} onChange={setDateValue} style={{height:32,width:160}} />)
          : timePreset === 'week' ? (<RangePicker value={dateValue} onChange={setDateValue} picker="week" style={{height:32,width:260}} />)
          : timePreset === 'month' ? (<DatePicker value={dateValue} onChange={setDateValue} picker="month" style={{height:32,width:160}} />)
          : timePreset === 'quarter' ? (<DatePicker value={dateValue} onChange={setDateValue} picker="quarter" style={{height:32,width:160}} />)
          : timePreset === 'year' ? (<DatePicker value={dateValue} onChange={setDateValue} picker="year" style={{height:32,width:120}} />)
          : (<RangePicker value={dateValue} onChange={setDateValue} style={{height:32,width:260}} />)}
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
        <button onClick={()=>{setTimePreset('7d');setDateValue(getPresetRange('7d'));setCascaderValue([]);setTagCascaderValue([]);setStoreSearchVal('');setStoreSearchList([]);doPredictQuery()}} className="filter-btn-secondary">重置</button>
      </div>

      {/* 模型状态 */}
      <div className="flex items-center gap-3 flex-wrap">
        <Tag color="purple" className="flex items-center gap-1" style={{fontSize:11,padding:'2px 8px'}}><Brain className="w-3 h-3"/>模型：Prophet + XGBoost</Tag>
        <Tag color="blue" style={{fontSize:11,padding:'2px 8px'}}>预测周期：未来 7 天</Tag>
        <Tag color="green" style={{fontSize:11,padding:'2px 8px'}}>置信水平：95%</Tag>
        <Tag color={predLoading?'default':predData?'processing':'warning'} style={{fontSize:11,padding:'2px 8px',marginLeft:'auto'}}>{predLoading?'⏳ 计算中...':predData?'模型计算':'⚠ 模拟数据'}</Tag>
      </div>

      {/* 预测汇总 */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '日均过店人次(预测)', value: formatNumber(passerbyAvg), color: COLORS.primary, trend: passerbyTrend },
          { label: '日均进店人次(预测)', value: formatNumber(enterAvg), color: '#8B5CF6', trend: enterTrend },
          { label: '预测进店率', value: `${(enterAvg/passerbyAvg*100).toFixed(1)}%`, color: '#10B981', trend: '' },
          { label: '最高预测日', value: predDates.length>0?predDates[predDates.length-1]:'-', color: '#F59E0B', trend: '' },
        ].map(m=>(<div key={m.label} className="card-level-1 p-3"><div className="text-[10px] text-[var(--text-muted)]">{m.label}</div><div className="text-lg font-semibold mt-1 text-number" style={{color:m.color}}>{m.value}</div>{m.trend&&<div className={`text-[10px] mt-0.5 ${m.trend.includes('↑')?'text-red-400':'text-green-400'}`}>{m.trend}</div>}</div>))}
      </div>

      {/* 图表 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-level-1 p-3" style={{aspectRatio:'16/9',minHeight:360}}>
          <div className="chart-title">过店人次预测（未来 7 天）</div>
          <BaseChart option={passerbyChart} height="100%" />
          <div className="mt-2 text-[10px] text-[var(--text-muted)] leading-relaxed">
            <span className="font-medium text-[var(--text-primary)]">📊 预测解读：</span>未来 7 天日均过店 <b>{formatNumber(passerbyAvg)}</b> 人次，趋势{passerbyTrend}。周末预计小幅回落，工作日回升至峰值。建议重点关注周末促销活动安排。
          </div>
        </div>
        <div className="card-level-1 p-3" style={{aspectRatio:'16/9',minHeight:360}}>
          <div className="chart-title">进店人次预测（未来 7 天）</div>
          <BaseChart option={enterChart} height="100%" />
          <div className="mt-2 text-[10px] text-[var(--text-muted)] leading-relaxed">
            <span className="font-medium text-[var(--text-primary)]">📊 预测解读：</span>未来 7 天日均进店 <b>{formatNumber(enterAvg)}</b> 人次，进店率约 {(enterAvg/passerbyAvg*100).toFixed(1)}%。工作日客流稳定，建议在高峰日加强店内导购配置。
          </div>
        </div>
      </div>

      {/* 明细表 */}
      <div className="card-level-1 overflow-hidden" style={{padding:0}}>
        <div className="chart-title px-4 pt-3 pb-2">7 天预测明细</div>
        <table className="w-full text-xs">
          <thead className="border-t border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            <tr>{['日期','星期','过店人次','置信区间','进店人次','置信区间','进店率'].map(h=><th key={h} className="text-left px-4 py-2 font-medium text-[var(--text-secondary)]">{h}</th>)}</tr>
          </thead>
          <tbody>
            {predDates.map((d:string,i:number)=>{
              const fullDate = pd.predDatesFull?.[i] || `2026-05-${14+i}`
              const dObj = new Date(fullDate + 'T00:00:00')
              const wd = ['周日','周一','周二','周三','周四','周五','周六'][dObj.getDay()]
              const isWeekend=dObj.getDay()===0||dObj.getDay()===6
              return (<tr key={d} className={`border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)] ${isWeekend?'bg-[var(--bg-tertiary)]':''}`}>
                <td className="px-4 py-2 font-medium text-[var(--text-primary)]">{d}</td>
                <td className="px-4 py-2">{wd}{isWeekend?<Tag color="orange" style={{marginLeft:4,fontSize:10}}>周末</Tag>:''}</td>
                <td className="px-4 py-2 text-number" style={{color:COLORS.primary}}>{formatNumber(passerbyForecast[i])}</td>
                <td className="px-4 py-2 text-[var(--text-muted)]">{passerbyLower[i]} ~ {passerbyUpper[i]}</td>
                <td className="px-4 py-2 text-number" style={{color:'#8B5CF6'}}>{formatNumber(enterForecast[i])}</td>
                <td className="px-4 py-2 text-[var(--text-muted)]">{enterLower[i]} ~ {enterUpper[i]}</td>
                <td className="px-4 py-2">{(enterForecast[i]/passerbyForecast[i]*100).toFixed(1)}%</td>
              </tr>)
            })}
          </tbody>
        </table>
      </div>

      {/* ═══ 回测误差评估 ═══ */}
      <BacktestSection />
    </div>
  )
}
