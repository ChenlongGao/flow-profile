import React, { useState } from 'react'
import { Shield, TrendingUp, AlertTriangle, CheckCircle, Calendar, BarChart3, Clock, Thermometer, Archive, Store, UserCheck, ClipboardCheck } from 'lucide-react'
import { Tag, Button, Select } from 'antd'

const monthStats = {
  month:'2026年5月',totalChecks:28,avgScore:88,completedRate:93.3,issueTotal:45,
  highRisk:8,midRisk:20,lowRisk:17,rectified:42,pending:3,rectifyRate:93.3,
  nextPlan:['冷链设备全面检修','人员健康证集中换证','消杀流程专项培训','食品留样规范强化'],
  topIssues:[
    {name:'健康证临期',count:12,trend:'up'},
    {name:'冷链温度超标',count:8,trend:'down'},
    {name:'消杀记录缺失',count:6,trend:'up'},
  ],
  riskStores:[{name:'IFS国金中心',score:78,issues:15},{name:'德思勤店',score:82,issues:12},{name:'开福万达店',score:85,issues:10}],
  areaRisk:[{area:'后厨',count:28,level:'高风险'},{area:'仓库',count:12,level:'中风险'},{area:'前厅',count:8,level:'低风险'},{area:'外卖区',count:5,level:'低风险'}],
  nextMonthTasks:[
    {task:'冷链设备全面检修',deadline:'2026-06-05',owner:'张拓',progress:0},
    {task:'人员健康证集中换证',deadline:'2026-06-10',owner:'李建',progress:0},
    {task:'消杀流程专项培训',deadline:'2026-06-15',owner:'陈静',progress:0},
    {task:'食品留样规范强化',deadline:'2026-06-20',owner:'刘洋',progress:0},
  ],
}

export const FoodSafetyPrevention: React.FC = () => {
  const [period,setPeriod]=useState('2026-05')

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <div className="shrink-0 space-y-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400"/>食安防控
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">月度调度 · 风险分析 · 下月防控计划 · 任务跟踪闭环</p>
        </div>
        <Select size="middle" value={period} onChange={setPeriod} style={{width:120}}
          options={[{value:'2026-05',label:'2026年5月'},{value:'2026-04',label:'2026年4月'},{value:'2026-03',label:'2026年3月'}]}/>
      </div>
      <div className="flex-1 overflow-y-auto mt-3 space-y-4">
        {/* 风险指标 */}
        <div className="grid grid-cols-4 gap-3">
          <div className="card-level-1 p-3 space-y-1"><div className="text-[10px] text-[var(--text-muted)]">月发现问题</div><div className="text-xl font-bold text-amber-400">{monthStats.issueTotal}<span className="text-xs text-[var(--text-muted)] ml-1">个</span></div><div className="text-[9px] text-[var(--text-muted)]">高风险{monthStats.highRisk} · 中风险{monthStats.midRisk} · 低风险{monthStats.lowRisk}</div></div>
          <div className="card-level-1 p-3 space-y-1"><div className="text-[10px] text-[var(--text-muted)]">整改完成率</div><div className="text-xl font-bold text-emerald-400">{monthStats.rectifyRate}%</div><div className="text-[9px] text-[var(--text-muted)]">{monthStats.rectified}已整改 · {monthStats.pending}待整改</div></div>
          <div className="card-level-1 p-3 space-y-1"><div className="text-[10px] text-[var(--text-muted)]">月度评分</div><div className="text-xl font-bold" style={{color:'#3B82F6'}}>{monthStats.avgScore}<span className="text-xs text-[var(--text-muted)] ml-1">分</span></div><div className="text-[9px] text-[var(--text-muted)]">自查完成率{monthStats.completedRate}%</div></div>
          <div className="card-level-1 p-3 space-y-1"><div className="text-[10px] text-[var(--text-muted)]">下月防控任务</div><div className="text-xl font-bold" style={{color:'#EC4899'}}>{monthStats.nextMonthTasks.length}<span className="text-xs text-[var(--text-muted)] ml-1">项</span></div><div className="text-[9px] text-[var(--text-muted)]">待启动执行</div></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* 高频问题TOP3 */}
          <div className="card-level-1 p-3" style={{minHeight:200}}>
            <div className="text-xs font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 text-red-400"/>高频问题TOP3 · {monthStats.month}</div>
            {monthStats.topIssues.map((t,i)=>(
              <div key={t.name} className="flex items-center gap-2 text-[11px] mb-2">
                <span className="w-4 text-[var(--text-muted)]">{i+1}</span><span className="flex-1 text-[var(--text-secondary)]">{t.name}</span>
                <span className="font-medium text-[var(--text-primary)]">{t.count}次</span>
                <span className="text-[10px]" style={{color:t.trend==='up'?'#EF4444':'#10B981'}}>{t.trend==='up'?'↑':'↓'}</span>
              </div>
            ))}
          </div>
          {/* 区域风险分布 */}
          <div className="card-level-1 p-3" style={{minHeight:200}}>
            <div className="text-xs font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2"><Thermometer className="w-3.5 h-3.5 text-amber-400"/>区域风险分布</div>
            {monthStats.areaRisk.map(a=>{
              const max=monthStats.areaRisk[0].count
              return (<div key={a.area} className="mb-2">
                <div className="flex items-center gap-2 text-[11px]"><span className="w-12 text-[var(--text-secondary)]">{a.area}</span>
                  <span className="font-medium text-[var(--text-primary)]">{a.count}</span>
                  <Tag color={a.level==='高风险'?'red':a.level==='中风险'?'orange':'blue'} style={{fontSize:12,margin:0,marginLeft:'auto'}}>{a.level}</Tag>
                </div>
                <div className="h-2 rounded mt-0.5 overflow-hidden" style={{background:'var(--bg-tertiary)'}}>
                  <div style={{width:`${a.count/max*100}%`,height:'100%',background:a.level==='高风险'?'#EF4444':a.level==='中风险'?'#F59E0B':'#3B82F6',opacity:0.5}}/>
                </div>
              </div>)
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* 风险门店 */}
          <div className="card-level-1 p-3" style={{minHeight:200}}>
            <div className="text-xs font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5 text-red-400"/>风险门店 · {monthStats.month}</div>
            {monthStats.riskStores.map((s,i)=>(
              <div key={s.name} className="flex items-center gap-2 text-[11px] mb-2">
                <span className="w-4 text-[var(--text-muted)]">{i+1}</span><span className="flex-1 text-[var(--text-secondary)]">{s.name}</span>
                <span className="font-medium" style={{color:s.score>=85?'#10B981':'#F59E0B'}}>{s.score}分</span>
                <span className="text-red-400">{s.issues}个问题</span>
              </div>
            ))}
          </div>
          {/* 下月防控重点 */}
          <div className="card-level-1 p-3" style={{minHeight:200}}>
            <div className="text-xs font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-purple-400"/>下月防控重点 · 2026年6月</div>
            {monthStats.nextPlan.map((p,i)=>(
              <div key={i} className="text-[11px] text-[var(--text-secondary)] mb-1.5 pl-4 relative">
                <span className="absolute left-0 top-1 w-1.5 h-1.5 rounded-full" style={{background:['#EF4444','#F59E0B','#3B82F6','#10B981'][i]}}/>
                {p}
              </div>
            ))}
          </div>
        </div>

        {/* 下月防控任务跟踪 */}
        <div className="card-level-1 p-3">
          <div className="text-xs font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400"/>下月防控任务跟踪</div>
          <table className="w-full text-xs">
            <thead className="border-b border-[var(--border-subtle)]">
              <tr><th className="px-3 py-2 text-left text-[var(--text-muted)]">防控任务</th><th className="px-3 py-2 text-left text-[var(--text-muted)]">截止日期</th>
              <th className="px-3 py-2 text-left text-[var(--text-muted)]">负责人</th><th className="px-3 py-2 text-center text-[var(--text-muted)]">状态</th></tr></thead>
            <tbody>{monthStats.nextMonthTasks.map(t=>(
              <tr key={t.task} className="border-b border-[var(--border-subtle)]">
                <td className="px-3 py-2.5 font-medium text-[var(--text-primary)]">{t.task}</td>
                <td className="px-3 py-2.5 text-[var(--text-secondary)]">{t.deadline}</td>
                <td className="px-3 py-2.5 text-[var(--text-secondary)]">{t.owner}</td>
                <td className="px-3 py-2.5 text-center"><Tag color="default" style={{fontSize:12}}>待启动</Tag></td>
              </tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
