import React, { useState } from 'react'
import { TrendingUp, Target, DollarSign, Clock, MapPin, Building2 } from 'lucide-react'
import { Progress, Select, Tag } from 'antd'

const STATS = [
  { label:'在途商机总数', value:24, sub:'个', icon:Target, color:'#10B981' },
  { label:'预计总投资', value:3350, sub:'万元', icon:DollarSign, color:'#F59E0B' },
  { label:'本月新增', value:6, sub:'个', icon:TrendingUp, color:'#3B82F6' },
  { label:'平均转化周期', value:45, sub:'天', icon:Clock, color:'#8B5CF6' },
]

const REGION_DATA = [
  { region:'华中区', target:30, done:22, pipeline:8, invest:780 },
  { region:'华东区', target:25, done:18, pipeline:6, invest:690 },
  { region:'华南区', target:20, done:13, pipeline:5, invest:620 },
  { region:'西南区', target:18, done:14, pipeline:5, invest:530 },
  { region:'华北区', target:15, done:10, pipeline:4, invest:470 },
  { region:'西北区', target:12, done:5, pipeline:3, invest:260 },
]

const STAGE_BREAKDOWN = [
  { stage:'初步接触', count:8, pct:33, color:'red' as const },
  { stage:'深度谈判', count:7, pct:29, color:'orange' as const },
  { stage:'即将签约', count:6, pct:25, color:'purple' as const },
  { stage:'已签约', count:3, pct:13, color:'green' as const },
]

const FUNNEL = [
  { stage:'初步接触', count:8, rate:'100%' },
  { stage:'深度谈判', count:7, rate:'88%' },
  { stage:'即将签约', count:6, rate:'75%' },
  { stage:'已签约', count:3, rate:'38%' },
]

const MONTHLY_STATS = [
  { month:'1月', new:2, converted:1, lost:0 },
  { month:'2月', new:1, converted:0, lost:1 },
  { month:'3月', new:3, converted:2, lost:0 },
  { month:'4月', new:2, converted:1, lost:1 },
  { month:'5月', new:3, converted:2, lost:0 },
  { month:'6月', new:2, converted:1, lost:0 },
]

export const OpportunityData: React.FC = () => {
  const [region, setRegion] = useState('全部')

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">商机数据</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">商机统计报表 · 转化漏斗 · 月度趋势</p>
      </div>

      {/* 统计指标卡 */}
      <div className="grid grid-cols-4 gap-3">
        {STATS.map((s,i) => {
          const Icon = s.icon
          return <div key={i} className="card-level-1 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{backgroundColor:`${s.color}15`}}>
                <Icon className="w-3.5 h-3.5" style={{color:s.color}}/>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">{s.label}</span>
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{s.value}<span className="text-xs text-[var(--text-muted)] ml-1">{s.sub}</span></div>
          </div>
        })}
      </div>

      {/* 区域 + 漏斗 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-level-1 overflow-hidden" style={{padding:0}}>
          <div className="card-header px-5">
            <span className="card-header-title"><MapPin className="w-3.5 h-3.5 mr-1.5"/>区域商机数据</span>
            <Select size="small" value={region} onChange={setRegion} style={{width:100}}
              options={['全部','华中区','华东区','华南区','西南区','华北区','西北区'].map(r=>({value:r,label:r}))} />
          </div>
          <table className="w-full text-xs">
            <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <tr>
                <th className="px-4 py-2 text-left text-[var(--text-muted)] font-medium">区域</th>
                <th className="px-3 py-2 text-center text-[var(--text-muted)] font-medium">目标</th>
                <th className="px-3 py-2 text-center text-[var(--text-muted)] font-medium">已完成</th>
                <th className="px-3 py-2 text-center text-[var(--text-muted)] font-medium">达成率</th>
                <th className="px-3 py-2 text-center text-[var(--text-muted)] font-medium">在途</th>
                <th className="px-3 py-2 text-right text-[var(--text-muted)] font-medium">投资(万)</th>
              </tr>
            </thead>
            <tbody>
              {REGION_DATA.map(r=><tr key={r.region} className="border-b border-[var(--border-subtle)]">
                <td className="px-4 py-2 text-[var(--text-primary)]">{r.region}</td>
                <td className="px-3 py-2 text-center text-[var(--text-secondary)]">{r.target}</td>
                <td className="px-3 py-2 text-center text-[var(--text-secondary)]">{r.done}</td>
                <td className="px-3 py-2 text-center">
                  <Progress percent={Math.round(r.done/r.target*100)} size="small" showInfo={false}
                    strokeColor={r.done/r.target>=0.7?'#10B981':r.done/r.target>=0.5?'#F59E0B':'#EF4444'}/>
                </td>
                <td className="px-3 py-2 text-center text-[var(--text-secondary)]">{r.pipeline}</td>
                <td className="px-3 py-2 text-right text-[var(--text-primary)]">¥{r.invest}</td>
              </tr>)}
            </tbody>
          </table>
        </div>

        <div className="card-level-1 p-4 space-y-3">
          <div className="chart-title"><TrendingUp className="w-3.5 h-3.5 inline mr-1"/>转化漏斗</div>
          {FUNNEL.map((f,i) => {
            const w = 100 - i*18
            return <div key={f.stage} className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-secondary)] w-16 shrink-0">{f.stage}</span>
              <div className="flex-1 h-6 rounded flex items-center px-2" style={{background:STAGE_BREAKDOWN[i].color==='green'?'rgba(16,185,129,0.15)':STAGE_BREAKDOWN[i].color==='purple'?'rgba(139,92,246,0.15)':STAGE_BREAKDOWN[i].color==='orange'?'rgba(245,158,11,0.15)':'rgba(239,68,68,0.15)',width:`${w}%`}}>
                <span className="text-xs font-medium text-[var(--text-primary)]">{f.count}个</span>
                <span className="ml-auto text-[10px] text-[var(--text-muted)]">{f.rate}</span>
              </div>
            </div>
          })}
        </div>
      </div>

      {/* 月度趋势 + 阶段分布 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-level-1 p-4 space-y-3">
          <div className="chart-title"><TrendingUp className="w-3.5 h-3.5 inline mr-1"/>月度新增/转化趋势</div>
          <div className="flex items-end gap-1" style={{height:120}}>
            {MONTHLY_STATS.map(m => (
              <div key={m.month} className="flex-1 flex flex-col items-center justify-end" style={{height:'100%'}}>
                <div className="w-full flex flex-col gap-0.5 items-center">
                  <div className="w-full rounded-t-sm" style={{height:`${m.new*20}px`,background:'#3B82F6',opacity:0.7}}/>
                  <div className="w-full rounded-t-sm" style={{height:`${m.converted*20}px`,background:'#10B981',opacity:0.8}}/>
                </div>
                <span className="text-[9px] text-[var(--text-muted)] mt-1">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{background:'#3B82F6',opacity:0.7}}/>新增</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{background:'#10B981',opacity:0.8}}/>转化</span>
          </div>
        </div>

        <div className="card-level-1 p-4 space-y-3">
          <div className="chart-title"><Building2 className="w-3.5 h-3.5 inline mr-1"/>阶段分布</div>
          <div className="space-y-2">
            {STAGE_BREAKDOWN.map(s => (
              <div key={s.stage} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">{s.stage}</span>
                  <span className="text-[var(--text-primary)]">{s.count}个 / {s.pct}%</span>
                </div>
                <Progress percent={s.pct} size="small" showInfo={false}
                  strokeColor={s.color==='green'?'#10B981':s.color==='purple'?'#8B5CF6':s.color==='orange'?'#F59E0B':'#EF4444'}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
