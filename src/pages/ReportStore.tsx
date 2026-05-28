import React, { useState } from 'react'
import { formatNumber } from '../utils/format'
import { Tag, Select } from 'antd'
import { api } from '../api/client'
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react'

export const ReportStore: React.FC = () => {
  const [storeSearch, setStoreSearch] = useState('')
  const [storeList, setStoreList] = useState<{label:string;value:string}[]>([])
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const search = (v:string) => {
    if(v.length<1){setStoreList([]);return}
    api.get<any>(`/stores?search=${encodeURIComponent(v)}`).then(r=>setStoreList((Array.isArray(r)?r:r.items||[]).map((s:any)=>({label:`${s.store_id} - ${s.name}`,value:s.store_id})))).catch(()=>setStoreList([]))
  }
  const load = (sid?:string) => {
    if(!sid && !storeSearch) return
    setLoading(true)
    api.get<any>(`/report/store-diagnosis?store_id=${encodeURIComponent(sid||storeSearch)}`).then(d=>setData(d)).finally(()=>setLoading(false))
  }

  if(!data) return (
    <div className="p-6 space-y-4">
      <div><h2 className="text-base font-semibold text-[var(--text-primary)]">门店诊断报告</h2><p className="text-xs text-[var(--text-muted)] mt-1">近14天门店客流诊断分析 · 报告内容用于推送</p></div>
      <div className="flex items-center gap-2">
        <Select showSearch value={storeSearch||undefined} onSearch={search} onChange={v=>{setStoreSearch(v);load(v)}} options={storeList} placeholder="搜索门店编码/名称" allowClear filterOption={false} notFoundContent={null} style={{width:300,fontSize:12}}/>
        <button onClick={()=>load()} className="filter-btn-primary text-xs">查询</button>
      </div>
      <div className="card-level-1 p-12 text-center text-[var(--text-muted)] text-sm">请选择门店查看诊断报告</div>
    </div>
  )

  const trendIcon = data.trend === '↑' ? <TrendingUp className="w-4 h-4 text-red-400"/> : <TrendingDown className="w-4 h-4 text-green-400"/>

  // 诊断判定逻辑
  const entryRateLevel = data.avg_entry_rate > 25 ? 1 : data.avg_entry_rate > 12 ? 2 : 3
  const stayLevel = data.avg_stay > 15 ? 1 : data.avg_stay > 8 ? 2 : 3
  const levelLabels: Record<number,{icon:JSX.Element,label:string,color:string}> = {
    1: {icon:<CheckCircle2 className="w-4 h-4 text-emerald-400"/>,label:'优秀',color:'#10B981'},
    2: {icon:<HelpCircle className="w-4 h-4 text-amber-400"/>,label:'正常',color:'#F59E0B'},
    3: {icon:<AlertCircle className="w-4 h-4 text-red-400"/>,label:'需关注',color:'#EF4444'},
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-base font-semibold text-[var(--text-primary)]">门店诊断报告</h2><p className="text-xs text-[var(--text-muted)] mt-1">{data.store_id} · 近14天数据 · 用于企微/钉钉/飞书/邮件推送</p></div>
        <div className="flex items-center gap-2">
          <Select showSearch value={storeSearch||undefined} onSearch={search} onChange={v=>{setStoreSearch(v);load(v)}} options={storeList} placeholder="切换门店" allowClear filterOption={false} notFoundContent={null} style={{width:240,fontSize:12}}/>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {l:'日均进店',v:formatNumber(data.avg_enter),c:'#0EA5E9'},
          {l:'日均过店',v:formatNumber(data.avg_pass),c:'#38BDF8'},
          {l:'进店率',v:`${data.avg_entry_rate}%`,c:levelLabels[entryRateLevel].color},
          {l:'平均停留',v:`${data.avg_stay}min`,c:levelLabels[stayLevel].color},
        ].map(m=><div key={m.l} className="card-level-1 p-3"><div className="text-[10px] text-[var(--text-muted)]">{m.l}</div><div className="text-lg font-semibold mt-1 text-number flex items-center gap-1" style={{color:m.c}}>{m.v}</div></div>)}
      </div>

      {/* 诊断评分卡 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {label:'客流趋势',value:data.trend==='↑'?'上升':'下降',icon:trendIcon},
          {label:'进店率评级',icon:levelLabels[entryRateLevel].icon,value:levelLabels[entryRateLevel].label,color:levelLabels[entryRateLevel].color},
          {label:'停留评级',icon:levelLabels[stayLevel].icon,value:levelLabels[stayLevel].label,color:levelLabels[stayLevel].color},
        ].map(m=><div key={m.label} className="card-level-1 p-3 flex items-center gap-3"><div className="shrink-0">{m.icon}</div><div><div className="text-[10px] text-[var(--text-muted)]">{m.label}</div><div className="text-sm font-semibold mt-0.5" style={{color:m.color||'var(--text-primary)'}}>{m.value}</div></div></div>)}
      </div>

      {/* 推送消息预览 */}
      <div className="card-level-1 p-4 space-y-3" style={{maxWidth:480,borderLeft:'3px solid var(--ai-blue-500)'}}>
        <div className="flex items-center gap-2"><span className="text-xs font-semibold text-[var(--text-primary)]">🔍 {data.store_id} 诊断报告</span><Tag color="blue" style={{fontSize:10}}>近14天</Tag></div>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
          {[{l:'客流趋势',v:`${data.trend}日均进店${formatNumber(data.avg_enter)}`},{l:'进店率',v:`${data.avg_entry_rate}% (${levelLabels[entryRateLevel].label})`},{l:'停留时长',v:`${data.avg_stay}min (${levelLabels[stayLevel].label})`},{l:'商场客流',v:`约${formatNumber(data.mall_avg_flow)}人次`}].map(x=><div key={x.l} className="flex justify-between"><span className="text-[var(--text-muted)]">{x.l}</span><span className="font-medium text-[var(--text-primary)] text-right">{x.v}</span></div>)}
        </div>
        <div className="text-[10px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
          {entryRateLevel===3||stayLevel===3?'⚠️ 该门店存在需关注的指标，建议查看详细数据并及时调整运营策略。':'✓ 门店运营指标正常，继续保持。'}
        </div>
      </div>

      {/* 14天数据表 */}
      <div className="card-level-1 overflow-hidden" style={{padding:0}}>
        <div className="px-4 pt-3 pb-2 text-xs font-medium text-[var(--text-secondary)]">近14天数据明细</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-t border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <tr>{['日期','过店人次','进店人次','进店率','停留(min)'].map(h=><th key={h} className="text-left px-4 py-2 font-medium text-[var(--text-secondary)]">{h}</th>)}</tr>
            </thead>
            <tbody>
              {(data.dates||[]).map((d:string,i:number)=><tr key={d} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]"><td className="px-4 py-2">{d}</td><td className="px-4 py-2 text-number">{formatNumber(data.passerby[i])}</td><td className="px-4 py-2 text-number">{formatNumber(data.enter[i])}</td><td className="px-4 py-2">{data.entry_rate[i]}%</td><td className="px-4 py-2">{data.stay[i]||'-'}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
