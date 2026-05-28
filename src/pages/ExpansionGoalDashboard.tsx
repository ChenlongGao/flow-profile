import React, { useState } from 'react'
import { Target, TrendingUp, ChevronDown, ChevronRight, MapPin, Building2, Edit3 } from 'lucide-react'
import { Progress, Tag, Button, Select, Drawer, InputNumber, message } from 'antd'

/* ═══ 年度目标数据 ═══ */
const YEAR_TARGET = { year:2026, total:120, done:82 }

interface QTarget { name: string; target: number; done: number }
interface MTarget extends QTarget { months: { name: string; target: number; done: number }[] }

const QUARTERS: QTarget[] = [
  { name:'Q1', target:25, done:22 },
  { name:'Q2', target:30, done:18 },
  { name:'Q3', target:35, done:14 },
  { name:'Q4', target:30, done:28 },
]

const REGIONS = ['华中区','华东区','华南区','西南区','华北区','西北区']

const MONTH_DECOMPOSE: MTarget[] = QUARTERS.map(q => ({
  ...q,
  months: [
    { name:`${q.name==='Q1'?'1':q.name==='Q2'?'4':q.name==='Q3'?'7':'10'}月`, target:Math.round(q.target/3), done:Math.round(q.done/3) },
    { name:`${q.name==='Q1'?'2':q.name==='Q2'?'5':q.name==='Q3'?'8':'11'}月`, target:Math.round(q.target/3), done:Math.round(q.done/3) },
    { name:`${q.name==='Q1'?'3':q.name==='Q2'?'6':q.name==='Q3'?'9':'12'}月`, target:Math.round(q.target/3), done:Math.round(q.done/3) },
  ],
}))

// 区域月度分解（可编辑行列）
const initRegionMonthly = () => {
  const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
  const defaults = [
    [4,3,5,5,4,5,5,4,4,4,4,5],
    [3,3,4,4,3,4,4,3,3,3,3,4],
    [2,2,3,3,2,3,3,2,2,3,2,3],
    [3,3,4,4,3,4,4,3,3,3,3,4],
    [2,2,3,3,2,3,3,2,2,2,2,3],
    [1,1,2,2,1,2,2,1,1,1,1,2],
  ]
  return REGIONS.map((r,i)=> ({
    region: r,
    months: months.map((m,j)=> ({ month:m, target:defaults[i][j], done:Math.max(0,defaults[i][j]-Math.floor(Math.random()*2)) }))
  }))
}

export const ExpansionGoalDashboard: React.FC = () => {
  const [expandedQ, setExpandedQ] = useState<Set<string>>(new Set(['Q1','Q2']))
  const [expandedM, setExpandedM] = useState<Set<string>>(new Set())
  const [curYear, setCurYear] = useState(2026)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [regionData, setRegionData] = useState(initRegionMonthly)

  const toggle = (set:Set<string>, val:string, fn:React.Dispatch<React.SetStateAction<Set<string>>>) => {
    const next = new Set(set)
    next.has(val)?next.delete(val):next.add(val)
    fn(next)
  }

  const yearPct = Math.round(YEAR_TARGET.done/YEAR_TARGET.total*100)

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">目标管理</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">年度目标分解 · 逐级下钻（年 → 季 → 月 → 区域）</p>
      </div>

      {/* 年份切换 */}
      <div className="flex items-center gap-3">
        <Select size="middle" value={curYear} onChange={setCurYear} style={{width:110}}
          options={[2024,2025,2026,2027,2028].map(y=>({value:y,label:`${y}年`}))} />
        <div className="flex-1" />
        <Button size="middle" icon={<Edit3 className="w-3.5 h-3.5"/>} onClick={() => setEditDrawerOpen(true)}>编辑目标</Button>
      </div>

      {/* 年度概览卡 */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card-level-1 p-4 space-y-2 col-span-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Target className="w-5 h-5 text-emerald-400"/></div>
              <div>
                <div className="text-lg font-bold text-[var(--text-primary)]">{YEAR_TARGET.year}年 年度总目标</div>
                <div className="text-xs text-[var(--text-muted)]">全年计划新开门店 {YEAR_TARGET.total} 家</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold" style={{color:yearPct>=70?'#10B981':yearPct>=50?'#F59E0B':'#EF4444'}}>{yearPct}%</div>
              <div className="text-xs text-[var(--text-muted)]">已完成 {YEAR_TARGET.done}/{YEAR_TARGET.total}</div>
            </div>
          </div>
          <Progress percent={yearPct} strokeColor={yearPct>=70?'#10B981':yearPct>=50?'#F59E0B':'#EF4444'} size="small" />
          <div className="flex items-center gap-6 text-xs text-[var(--text-muted)]">
            <span>剩余目标：{YEAR_TARGET.total-YEAR_TARGET.done} 家</span>
            <span>月均需完成：{Math.ceil((YEAR_TARGET.total-YEAR_TARGET.done)/7)} 家</span>
            <span>已过时间：{Math.round(5/12*100)}%</span>
          </div>
        </div>
      </div>

      {/* 季度分解 */}
      <div className="card-level-1 overflow-hidden" style={{padding:0}}>
        <div className="card-header px-5">
          <span className="card-header-title"><TrendingUp className="w-3.5 h-3.5 mr-1.5"/>季度目标分解</span>
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
          {QUARTERS.map(q => (
            <div key={q.name}>
              <button className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[var(--bg-tertiary)] transition-colors text-left"
                onClick={() => toggle(expandedQ, q.name, setExpandedQ)}>
                {expandedQ.has(q.name)?<ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0"/>:<ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0"/>}
                <span className="text-sm font-medium text-[var(--text-primary)]">{q.name}</span>
                <Tag color={q.name==='Q1'?'green':q.name==='Q2'?'blue':q.name==='Q3'?'orange':'purple'} style={{fontSize:10}}>
                  {Math.round(q.done/q.target*100)}%
                </Tag>
                <div className="flex-1 max-w-[200px]"><Progress percent={Math.round(q.done/q.target*100)} size="small" showInfo={false}
                  strokeColor={Math.round(q.done/q.target*100)>=70?'#10B981':'#F59E0B'}/></div>
                <span className="text-xs text-[var(--text-muted)]">{q.done}/{q.target} 家</span>
              </button>
              {expandedQ.has(q.name) && (
                <div className="bg-[var(--bg-tertiary)] px-5 py-3 space-y-2">
                  <div className="grid grid-cols-3 gap-3 mb-2">
                    {MONTH_DECOMPOSE.find(m=>m.name===q.name)?.months.map(m => (
                      <div key={m.name} className="text-center">
                        <div className="text-xs font-medium text-[var(--text-primary)]">{m.name}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{m.done}/{m.target}</div>
                        <Progress percent={Math.round(m.done/m.target*100)} size="small" showInfo={false}
                          strokeColor={m.done>=m.target?'#10B981':'#F59E0B'} style={{marginTop:2}}/>
                      </div>
                    ))}
                  </div>
                  <button className="w-full flex items-center gap-2 text-xs text-[var(--ai-blue-500)] hover:underline"
                    onClick={(e) => {e.stopPropagation(); toggle(expandedM, q.name, setExpandedM)}}>
                    <MapPin className="w-3 h-3"/>
                    {expandedM.has(q.name)?'收起' : '展开' }区域分解
                  </button>
                  {expandedM.has(q.name) && (
                    <table className="w-full text-[10px] border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)]">
                          <th className="text-left py-1.5 px-2 text-[var(--text-muted)] font-medium">区域</th>
                          {MONTH_DECOMPOSE.find(m=>m.name===q.name)?.months.map(m=>(
                            <th key={m.name} className="text-center py-1.5 px-1 text-[var(--text-muted)] font-medium">{m.name.replace('月','')}</th>
                          ))}
                          <th className="text-center py-1.5 px-2 text-[var(--text-muted)] font-medium">合计</th>
                        </tr>
                      </thead>
                      <tbody>
                        {regionData.map(r=>{
                          const mNames = MONTH_DECOMPOSE.find(m=>m.name===q.name)?.months.map(m=>m.name)||[]
                          const relevant = r.months.filter(m=>mNames.includes(m.month))
                          const sum = relevant.reduce((a,b)=>a+b.target,0)
                          return (
                            <tr key={r.region} className="border-b border-[var(--border-subtle)] last:border-0">
                              <td className="py-1.5 px-2 text-[var(--text-primary)]">{r.region}</td>
                              {relevant.map((m,j) => (
                                <td key={m.month} className="text-center py-1.5 px-1 text-[var(--text-secondary)]">
                                  {m.target}
                                </td>
                              ))}
                              <td className="text-center py-1.5 px-2 font-medium text-[var(--text-primary)]">{sum}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 区域汇总 */}
      <div className="card-level-1 overflow-hidden" style={{padding:0}}>
        <div className="card-header px-5">
          <span className="card-header-title"><Building2 className="w-3.5 h-3.5 mr-1.5"/>区域目标汇总</span>
        </div>
        <div className="p-5 grid grid-cols-3 gap-4">
          {REGIONS.map((r,i) => {
            const rm = regionData[i]
            const total = rm.months.reduce((a,b)=>a+b.target,0)
            const totalDone = rm.months.reduce((a,b)=>a+b.done,0)
            return (
              <div key={r} className="card-level-1 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{r}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{totalDone}/{total}</span>
                </div>
                <Progress percent={Math.round(totalDone/total*100)} size="small"
                  strokeColor={totalDone/total>=0.7?'#10B981':totalDone/total>=0.5?'#F59E0B':'#EF4444'} showInfo={false}/>
                <div className="flex flex-wrap gap-1">
                  {rm.months.slice(0,6).map(m=>(
                    <div key={m.month} className="text-[9px] px-1.5 py-0.5 rounded" style={{
                      background:m.done>=m.target?'rgba(16,185,129,0.12)':'rgba(245,158,11,0.12)',
                      color:m.done>=m.target?'#10B981':'#F59E0B',
                    }}>{m.month.replace('月','')}:{m.done}/{m.target}</div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 目标编辑抽屉 */}
      <Drawer title="编辑目标" open={editDrawerOpen} onClose={() => setEditDrawerOpen(false)} width={640} destroyOnClose
        styles={{ header: { background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }, body: { background: 'var(--bg-primary)', padding: '24px' } }}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-[var(--text-primary)] mb-2">年度总目标</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">开店数量</span>
                <InputNumber size="middle" defaultValue={YEAR_TARGET.total} style={{width:100}} /> 家
              </div>
            </div>
          </div>
          <div className="text-xs font-medium text-[var(--text-primary)] mb-2 pt-2 border-t border-[var(--border-subtle)]">季度目标</div>
          {QUARTERS.map(q => (
            <div key={q.name} className="flex items-center gap-4">
              <span className="text-xs font-medium text-[var(--text-primary)] w-8">{q.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--text-muted)]">目标</span>
                <InputNumber size="small" defaultValue={q.target} style={{width:70}} />
                <span className="text-[10px] text-[var(--text-muted)]">已完成</span>
                <InputNumber size="small" defaultValue={q.done} style={{width:70}} />
              </div>
            </div>
          ))}
          <div className="text-xs font-medium text-[var(--text-primary)] mb-2 pt-2 border-t border-[var(--border-subtle)]">区域月度分解</div>
          {regionData.map((r,ri) => (
            <div key={r.region}>
              <div className="text-[10px] font-medium text-[var(--text-secondary)] mb-1">{r.region}</div>
              <div className="flex flex-wrap gap-1.5">
                {r.months.map((m,mi) => (
                  <div key={m.month} className="flex items-center gap-1">
                    <span className="text-[9px] text-[var(--text-muted)] w-6">{m.month.replace('月','')}</span>
                    <InputNumber size="small" value={m.target} onChange={v => {
                      const d = [...regionData]
                      d[ri] = {...d[ri], months: d[ri].months.map((x,i) => i===mi ? {...x, target: v||0} : x)}
                      setRegionData(d)
                    }} style={{width:55}} min={0} />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
            <Button size="middle" onClick={() => setEditDrawerOpen(false)}>取消</Button>
            <Button size="middle" type="primary" onClick={() => { message.success('目标已保存'); setEditDrawerOpen(false) }}>保存</Button>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
