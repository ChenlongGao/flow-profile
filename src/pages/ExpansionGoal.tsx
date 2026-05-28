import React, { useState, useMemo } from 'react'
import { Target, TrendingUp, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { Segmented, Button, Tooltip, Select } from 'antd'

const YEAR_TARGET = { total:120, done:82, pct:68 }
const REGIONS_DATA:Record<string,{target:number;done:number;trend:number[];lead:string}> = {
  '华中区':{target:30,done:22,trend:[5,8,10,12,8,10,12,14,10,12,10,15],lead:'张拓'},
  '华东区':{target:25,done:18,trend:[4,6,8,10,7,8,11,13,9,10,12,14],lead:'李建'},
  '华南区':{target:20,done:13,trend:[3,5,7,9,6,7,9,11,8,9,11,12],lead:'王敏'},
  '西南区':{target:18,done:14,trend:[6,9,12,14,10,12,15,16,12,13,14,16],lead:'陈丽'},
  '华北区':{target:15,done:10,trend:[2,4,6,8,5,6,8,10,7,8,9,10],lead:'赵强'},
  '西北区':{target:12,done:5,trend:[0,1,3,5,4,5,7,8,5,6,7,8],lead:'吴婷'},
}
const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
const REGION_LIST = Object.keys(REGIONS_DATA)

// 生成日历热力图数据（按月）
const genMonthDays = (yyyy:number, mm:number) => {
  const days: {day:number; value:number; weekday:number}[] = []
  const first = new Date(yyyy, mm, 1).getDay()
  const total = new Date(yyyy, mm+1, 0).getDate()
  for (let i=0;i<first;i++) days.push({day:0,value:-1,weekday:i})
  for (let d=1;d<=total;d++){
    const wd = new Date(yyyy, mm, d).getDay()
    days.push({day:d, value:Math.floor(Math.random()*10)+1, weekday:wd})
  }
  return days
}

// 生成周热力图
const genYearWeeks = () => Array.from({length:52},(_,i)=>({week:i+1,value:Math.floor(Math.random()*10)+1}))

const HeatCell: React.FC<{value:number;label?:string;empty?:boolean}> = ({value,label,empty}) => {
  if(empty) return <div className="aspect-square"/>
  const bg = value<0?'transparent':value<=2?'#1a2e1a':value<=4?'#1a4a1a':value<=6?'#1a6a1a':value<=8?'#1a8a1a':'#0a5'
  return <Tooltip title={label?`${label}: ${value>0?value+'家':''}`:''}>
    <div className="aspect-square rounded-sm flex items-center justify-center text-[8px] cursor-default" style={{background:bg,color:value>0?'#4ade80':'#333'}}>
      {label && <span className="leading-none">{label}</span>}
    </div>
  </Tooltip>
}

export const ExpansionGoal: React.FC = () => {
  const [viewMode, setViewMode] = useState<'周'|'月'|'季'|'年'>('周')
  const [curMonth, setCurMonth] = useState(4) // 0-indexed, 5月
  const [curYear, setCurYear] = useState(2026)
  const [selectedRegion, setSelectedRegion] = useState('华中区')

  const monthDays = useMemo(()=>genMonthDays(curYear, curMonth), [curYear, curMonth])
  const yearWeeks = useMemo(()=>genYearWeeks(), [])
  const yearData = MONTHS.map(m=>REGIONS_DATA[selectedRegion]?.trend[MONTHS.indexOf(m)]||0)

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      {/* 标题 + 副标题 */}
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">拓店目标</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">目标达成热力看板·趋势分析</p>
      </div>

      {/* 时间筛选 + 区域筛选（左） | 视图切换（右） */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)] shrink-0">时间</span>
            <Select size="middle" value={curYear} onChange={setCurYear} style={{width:100}}
              options={[2024,2025,2026].map(y=>({value:y,label:`${y}年`}))} />
            {viewMode==='月' && (
              <Select size="middle" value={curMonth} onChange={setCurMonth} style={{width:90}}
                options={MONTHS.map((m,i)=>({value:i,label:m}))} />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)] shrink-0">区域</span>
            <Select size="middle" value={selectedRegion} onChange={setSelectedRegion} style={{width:120}}
              options={REGION_LIST.map(r=>({value:r,label:r}))} />
          </div>
        </div>
        <div className="flex-1" />
        <Segmented size="middle" value={viewMode} onChange={v=>setViewMode(v as '周'|'月'|'季'|'年')}
          options={['周','月','季','年'].map(v=>({value:v,label:v}))}/>
      </div>

      {/* 双栏图表卡 */}
      <div className="grid grid-cols-2 gap-3">
      <div className="card-level-1 p-4 space-y-3">
        <div className="chart-title flex items-center justify-between">
          <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/>目标达成热力图 · {selectedRegion}<span className="text-[10px] text-[var(--text-muted)] ml-1">（{REGIONS_DATA[selectedRegion].done}/{REGIONS_DATA[selectedRegion].target}家·{REGIONS_DATA[selectedRegion].lead}负责）</span></div>
          {viewMode==='月' && <div className="flex items-center gap-1">
            <Button size="small" type="text" icon={<ChevronLeft className="w-3 h-3"/>} onClick={()=>setCurMonth(curMonth===0?11:(curMonth-1)%12)}/>
            <span className="text-xs font-medium text-[var(--text-primary)]">{curYear}年{MONTHS[curMonth]}</span>
            <Button size="small" type="text" icon={<ChevronRight className="w-3 h-3"/>} onClick={()=>setCurMonth((curMonth+1)%12)}/>
          </div>}
        </div>
        <div className="relative w-full" style={{paddingBottom:'56.25%'}}>
          <div className="absolute inset-0">
            {viewMode==='月' && (
              <div className="h-full flex flex-col">
                <div className="grid grid-cols-7 text-[9px] text-[var(--text-muted)] mb-0.5">
                  {['日','一','二','三','四','五','六'].map(d=><div key={d} className="text-center">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-0.5 flex-1">
                  {monthDays.map((d,i)=><HeatCell key={i} value={d.value} label={d.day>0?String(d.day):undefined} empty={d.day===0}/>)}
                </div>
              </div>
            )}
            {viewMode==='周' && (
              <div className="h-full flex flex-col">
                <div className="text-[9px] text-[var(--text-muted)] mb-0.5 text-center">{curYear}年 每周达标统计</div>
                <div className="flex gap-0.5 flex-1 overflow-x-auto">
                  {yearWeeks.map(w=><div key={w.week} className="flex-1 min-w-[8px] flex flex-col justify-end"><div className="rounded-sm" style={{background:w.value<=2?'#1a2e1a':w.value<=4?'#1a4a1a':w.value<=6?'#1a6a1a':w.value<=8?'#1a8a1a':'#0a5',height:`${w.value*10}%`,minHeight:w.value>0?4:0}} title={`第${w.week}周: ${w.value}家`}/></div>)}
                </div>
              </div>
            )}
            {viewMode==='季' && (
              <div className="h-full flex flex-col">
                <div className="text-[9px] text-[var(--text-muted)] mb-0.5 text-center">{curYear}年 季度达标统计</div>
                <div className="flex-1 flex gap-1">
                  {['Q1','Q2','Q3','Q4'].map((q,qi)=>{
                    const qData = yearData.slice(qi*3,qi*3+3)
                    return <div key={q} className="flex-1 flex flex-col items-center">
                      <span className="text-[8px] text-[var(--text-muted)]">{q}</span>
                      <div className="flex-1 flex items-end gap-0.5 w-full pt-1">
                        {qData.map((v,i)=><div key={i} className="flex-1 flex flex-col items-center justify-end h-full" style={{paddingBottom:2}}>
                          <div className="w-full rounded-t-sm" style={{background:`hsl(${120-v*2},60%,${20+v*2}%)`,height:`${Math.max(8,v/20*100)}%`,minHeight:8}}/>
                          <span className="text-[7px] text-[var(--text-muted)] mt-0.5">{['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'][qi*3+i].replace('月','')}</span>
                        </div>)}
                      </div>
                    </div>
                  })}
                </div>
              </div>
            )}
            {viewMode==='年' && (
              <div className="h-full flex flex-col">
                <div className="text-[9px] text-[var(--text-muted)] mb-0.5 text-center">{curYear}年 月度达标统计</div>
                <div className="flex-1 grid grid-cols-3 gap-1">
                  {MONTHS.map((m,i)=>(<div key={m} className="flex flex-col items-center justify-end pb-1">
                    <span className="text-[9px] text-[var(--text-muted)]">{m}</span>
                    <div className="w-full rounded-sm" style={{background:`hsl(${120-yearData[i]*2},60%,${20+yearData[i]*2}%)`,height:`${Math.max(8,yearData[i]/20*100)}%`,minHeight:8}}/>
                  </div>))}
                </div>
              </div>
            )}
            {/* 色阶图例 */}
            <div className="absolute bottom-1 right-1 flex items-center gap-0.5 text-[8px] text-[var(--text-muted)]">
              <span>少</span>{[1,3,5,7,9].map(v=><div key={v} className="w-3 h-3 rounded-sm" style={{background:v<=3?'#1a4a1a':v<=5?'#1a6a1a':v<=7?'#1a8a1a':'#0a5'}}/>)}<span>多</span>
            </div>
          </div>
        </div>
      </div>

      {/* 16:9 趋势看板 */}
      <div className="card-level-1 p-4 space-y-3">
        <div className="chart-title flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5"/>目标达成趋势 · 近12月 <span className="text-[10px] text-[var(--text-muted)] ml-1">（{selectedRegion}）</span></div>
        <div className="relative w-full" style={{paddingBottom:'56.25%'}}>
          <div className="absolute inset-0 flex">
            <div className="w-8 flex flex-col justify-between text-[9px] text-[var(--text-muted)] py-1">
              {[20,15,10,5,0].map(v=><span key={v}>{v}</span>)}
            </div>
            <div className="flex-1 flex items-end gap-0.5">
              {yearData.map((v,i)=>(<div key={i} className="flex-1 flex flex-col items-center justify-end h-full" style={{paddingBottom:2}}>
                <div className="w-full rounded-t-sm transition-all" style={{
                  background:`linear-gradient(to top, ${v>=14?'#10B981':v>=10?'#3B82F6':v>=6?'#F59E0B':'#6B7280'}, ${v>=14?'#34d399':v>=10?'#60a5fa':v>=6?'#fbbf24':'#9ca3af'})`,
                  height:`${v/20*100}%`, minWidth:4
                }}/>
                <span className="text-[8px] text-[var(--text-muted)] mt-0.5">{MONTHS[i].replace('月','')}</span>
              </div>))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
