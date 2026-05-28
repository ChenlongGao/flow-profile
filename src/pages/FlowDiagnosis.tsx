import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Select, DatePicker, Pagination, Cascader } from 'antd'
import { BaseChart } from '../components/echarts/BaseChart'
import { COLORS } from '../config/echarts-theme'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

type TimePreset = 'today'|'yesterday'|'7d'|'30d'|'day'|'week'|'month'|'quarter'|'year'|'custom'
const TIME_PRESETS = [
  {label:'今日',value:'today'},{label:'昨日',value:'yesterday'},
  {label:'近7天',value:'7d'},{label:'近30天',value:'30d'},
  {label:'按天',value:'day'},{label:'按周',value:'week'},
  {label:'按月',value:'month'},{label:'按季',value:'quarter'},
  {label:'按年',value:'year'},{label:'自定义',value:'custom'},
]
function getPresetRange(p:TimePreset):[dayjs.Dayjs,dayjs.Dayjs]|null{
  const n=dayjs()
  switch(p){case'today':return[n,n];case'yesterday':return[n.subtract(1,'day'),n.subtract(1,'day')];case'7d':return[n.subtract(7,'day'),n.subtract(1,'day')];case'30d':return[n.subtract(30,'day'),n.subtract(1,'day')];default:return null}
}
function fd(d:dayjs.Dayjs):string{return d.format('YYYY-MM-DD')}
const PAGE_SIZE=15
type TabKey='bcg'|'abc'

export const FlowDiagnosis:React.FC=()=>{
  const [data,setData]=useState<any>(null)
  const [loading,setLoading]=useState(false)
  const [timePreset,setTimePreset]=useState<TimePreset>('7d')
  const [dateValue,setDateValue]=useState<any>(getPresetRange('7d'))
  const [cascaderValue,setCascaderValue]=useState<string[]>([])
  const [cascaderOptions,setCascaderOptions]=useState<any[]>([])
  const [tagCascaderValue,setTagCascaderValue]=useState<string[]>([])
  const [tagCascaderOptions,setTagCascaderOptions]=useState<any[]>([])
  const [storeSearchVal,setStoreSearchVal]=useState('')
  const [storeSearchList,setStoreSearchList]=useState<{label:string;value:string}[]>([])
  const [tab,setTab]=useState<TabKey>(()=>(localStorage.getItem('diagTab')as TabKey)||'bcg')
  const [page,setPage]=useState(1)

  useEffect(()=>{api.get<any>('/store-tree').then(d=>{const toCascader=(node:any):any=>{if(node.type==='store'||node.store_id){return{label:node.name,value:node.store_id||node.id}}const item:any={label:node.name,value:node.id||node.name};if(node.children&&node.children.length>0){const children=node.children.map(toCascader).filter(Boolean);if(children.length>0)item.children=children}return item};if(d.children)setCascaderOptions(d.children.map(toCascader).filter(Boolean))}).catch(()=>{})},[])
  useEffect(()=>{Promise.all([api.get<any[]>('/config/tag-groups'),api.get<any[]>('/config/tags')]).then(([groups,tags])=>{setTagCascaderOptions(groups.map((g:any)=>({label:g.name,value:g.id,children:tags.filter((t:any)=>t.group_id===g.id).map((t:any)=>({label:t.name,value:t.name}))})))}).catch(()=>{})},[])
  useEffect(()=>{localStorage.setItem('diagTab',tab)},[tab])

  const handleStoreSearch=(v:string)=>{
    if(v.length<1){setStoreSearchList([]);return}
    api.get<any>(`/stores?search=${encodeURIComponent(v)}&page_size=20`).then(res=>{
      setStoreSearchList((res.items||[]).map((s:any)=>({label:`${s.store_id} - ${s.name}`,value:s.store_id})))
    }).catch(()=>setStoreSearchList([]))
  }
  const handlePresetChange=(val:string)=>{
    const p=val as TimePreset;setTimePreset(p)
    const r=getPresetRange(p);if(r){setDateValue(r);return}
    setDateValue(p==='day'?dayjs():null)
  }
  const doQuery=()=>{
    let start:string,end:string
    const p=timePreset
    if(['today','yesterday','7d','30d'].includes(p)){const r=getPresetRange(p)!;start=fd(r[0]);end=fd(r[1])}
    else if(p==='custom'){if(!dateValue||!dateValue[0]||!dateValue[1])return;start=fd(dateValue[0]);end=fd(dateValue[1])}
    else if(p==='day'&&dateValue){start=fd(dateValue);end=fd(dateValue)}
    else if(p==='week'&&dateValue){start=fd(dateValue[0]);end=fd(dateValue[1])}
    else if(p==='month'&&dateValue){start=fd(dateValue.startOf('month'));end=fd(dateValue.endOf('month'))}
    else if(p==='quarter'&&dateValue){start=fd(dateValue.startOf('quarter'));end=fd(dateValue.endOf('quarter'))}
    else if(p==='year'&&dateValue){start=fd(dateValue.startOf('year'));end=fd(dateValue.endOf('year'))}
    else {setLoading(false);return}
    setLoading(true);setPage(1)
    let url=`/diagnosis/brand-diagnosis?brand_id=1&start_date=${start}&end_date=${end}`
    if(cascaderValue.length>0)url+=`&store_groups=${cascaderValue.join(',')}`
    if(storeSearchVal)url+=`&store_id=${storeSearchVal}`
    if(tagCascaderValue.length>0)url+=`&tag=${tagCascaderValue[tagCascaderValue.length-1]}`
    api.get<any>(url).then(d=>{setData(d);setLoading(false)}).catch(e=>{setLoading(false)})
  }
  useEffect(()=>{doQuery()},[timePreset,dateValue,cascaderValue,storeSearchVal,tagCascaderValue])
  const doReset=()=>{setTimePreset('7d');setDateValue(getPresetRange('7d'));setCascaderValue([]);setTagCascaderValue([]);setStoreSearchVal('')}

  const stores=data?.stores||[];const overview=data?.overview||{}
  const available=stores.filter((s:any)=>s.available)
  const vals=available.map((s:any)=>s.daily_enter||0);const malls=available.map((s:any)=>s.mall_daily_enter||0)
  const medS=vals.length?[...vals].sort((a,b)=>a-b)[Math.floor(vals.length/2)]:0
  const medM=malls.length?[...malls].sort((a,b)=>a-b)[Math.floor(malls.length/2)]:0
  let bcgHealth={health:0,watch:0,problem:0,fail:0}
  available.forEach((s:any)=>{const v=s.daily_enter||0;const m=s.mall_daily_enter||0;if(v>=medS&&m>=medM)bcgHealth.health++;else if(v<medS&&m>=medM)bcgHealth.watch++;else if(v>=medS&&m<medM)bcgHealth.problem++;else bcgHealth.fail++})
  const abcA=overview.abc_count?.A||0;const abcB=overview.abc_count?.B||0;const abcC=overview.abc_count?.C||0
  const sliced=available.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE)
  const bcgLabel=(v:number,m:number)=>{if(v>=medS&&m>=medM)return'健康';if(v<medS&&m>=medM)return'关注';if(v>=medS&&m<medM)return'问题';return'失败'}

  return(
    <div className="flex flex-col" style={{height:'calc(100vh - 48px)'}}>
      <div className="px-6 pt-3 pb-0 shrink-0"/>
      <div className="px-6 pb-3 shrink-0">
        <div className="flex items-center gap-3 flex-wrap pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2"><span className="text-xs text-[var(--text-muted)]">门店</span>
            <Select showSearch value={storeSearchVal||undefined} onSearch={handleStoreSearch} onChange={v=>setStoreSearchVal(v||'')} options={storeSearchList} placeholder="编码/名称搜索" allowClear filterOption={false} notFoundContent={null} style={{height:32,width:200,fontSize:12}}/>
          </div>
          <div className="flex items-center gap-2"><span className="text-xs text-[var(--text-muted)]">时间</span>
            <Select value={timePreset} onChange={handlePresetChange} style={{height:32,width:100}} options={TIME_PRESETS}/>
            {['today','yesterday','7d','30d'].includes(timePreset)?(<RangePicker value={getPresetRange(timePreset)as any} disabled style={{height:32,width:260}}/>)
            :timePreset==='day'?(<DatePicker value={dateValue} onChange={setDateValue} style={{height:32,width:160}}/>)
            :timePreset==='week'?(<RangePicker value={dateValue} onChange={setDateValue} picker="week" style={{height:32,width:260}}/>)
            :timePreset==='month'?(<DatePicker value={dateValue} onChange={setDateValue} picker="month" style={{height:32,width:160}}/>)
            :timePreset==='quarter'?(<DatePicker value={dateValue} onChange={setDateValue} picker="quarter" style={{height:32,width:160}}/>)
            :timePreset==='year'?(<DatePicker value={dateValue} onChange={setDateValue} picker="year" style={{height:32,width:120}}/>)
            :(<RangePicker value={dateValue} onChange={setDateValue} style={{height:32,width:260}}/>)}
          </div>
          <div className="flex items-center gap-2"><span className="text-xs text-[var(--text-muted)]">架构</span>
            <Cascader value={cascaderValue} onChange={v=>setCascaderValue(v as string[])} options={cascaderOptions} placeholder="门店架构筛选" allowClear changeOnSelect style={{height:32,width:200,fontSize:12}}/>
          </div>
          <div className="flex items-center gap-2"><span className="text-xs text-[var(--text-muted)]">标签</span>
            <Cascader value={tagCascaderValue} onChange={v=>setTagCascaderValue(v as string[])} options={tagCascaderOptions} placeholder="标签筛选" allowClear changeOnSelect style={{height:32,width:200,fontSize:12}}/>
          </div>
          <button onClick={doQuery} className="filter-btn-primary">查询</button>
          <button onClick={doReset} className="filter-btn-secondary">重置</button>
        </div>
      </div>
      <div className="px-6 shrink-0 flex gap-1 border-b border-[var(--border-subtle)]">
        {[{k:'bcg' as const,l:'BCG 四象限模型'},{k:'abc' as const,l:'ABC 帕累托分析'}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px ${tab===t.k?'border-[var(--ai-blue-500)] text-[var(--ai-blue-500)]':'border-transparent text-[var(--text-muted)]'}`}>{t.l}</button>
        ))}
      </div>
      {loading&&<div className="px-6 py-8 text-center text-xs text-[var(--text-muted)]">诊断计算中...</div>}
      {data&&!loading&&(
      <div className="flex-1 min-h-0 overflow-auto px-6 pt-3 pb-3 space-y-3">
        {tab==='bcg'&&<>
          <div className="grid grid-cols-4 gap-3">
            <MetricCard color="#22C55E" label="健康门店" value={bcgHealth.health} sub="店高·场高"/>
            <MetricCard color="#3B82F6" label="关注门店" value={bcgHealth.watch} sub="店低·场高"/>
            <MetricCard color="#F59E0B" label="问题门店" value={bcgHealth.problem} sub="店高·场低"/>
            <MetricCard color="#EF4444" label="失败门店" value={bcgHealth.fail} sub="店低·场低"/>
          </div>
          <div className="card-level-1 p-4"><div className="chart-title">BCG 四象限分析（门店进店人次 × 商场进店人次）</div><BaseChart option={buildBcgScatter(available)} height="360px"/></div>
          <div className="card-level-1 p-4"><div className="chart-title mb-3">BCG 模型明细（共 {available.length} 条）</div>
            <table className="w-full text-xs text-left"><thead><tr className="border-b border-[var(--border-subtle)]">
              {['#','门店名称','进店人次','商场进店','停留(min)','健康度','ABC等级'].map((c,i)=><th key={i} className="py-1.5 px-2 font-medium text-[var(--text-muted)] whitespace-nowrap">{c}</th>)}
            </tr></thead><tbody>{sliced.map((s:any,i:number)=>{const v=s.daily_enter||0;const m=s.mall_daily_enter||0;const h=bcgLabel(v,m);return(
              <tr key={s.store_id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                <td className="py-1 px-2 text-[var(--text-secondary)]">{(page-1)*PAGE_SIZE+i+1}</td>
                <td className="py-1 px-2 text-[var(--text-primary)] max-w-[140px] truncate">{s.name}</td>
                <td className="py-1 px-2 text-[var(--text-secondary)]">{v.toFixed(0)}</td>
                <td className="py-1 px-2 text-[var(--text-secondary)]">{m||'-'}</td>
                <td className="py-1 px-2 text-[var(--text-secondary)]">{(s.daily_enter*0.02+5).toFixed(1)}</td>
                <td className="py-1 px-2">{healthTag(h)}</td><td className="py-1 px-2">{levelTag(s.abc_level)}</td></tr>
            )})}</tbody></table>
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:12}}><Pagination current={page} pageSize={PAGE_SIZE} total={available.length} onChange={p=>setPage(p)} showQuickJumper showSizeChanger={false} showTotal={t=>`共 ${t} 条`} size="small"/></div>
          </div>
        </>}
        {tab==='abc'&&<>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard color="#22C55E" label="A-头部门店" value={abcA} sub="得分 ≥ 85"/>
            <MetricCard color="#3B82F6" label="B-腰部门店" value={abcB} sub="得分 60-84"/>
            <MetricCard color="#EF4444" label="C-尾部门店" value={abcC} sub="得分 &lt; 60"/>
          </div>
          <div className="card-level-1 p-4"><div className="chart-title">ABC 帕累托分析（进店人次 × 累计占比）</div><BaseChart option={buildPareto(available)} height="360px"/></div>
          <div className="card-level-1 p-4"><div className="chart-title mb-3">ABC 门店健康分明细（共 {available.length} 条）</div>
            <table className="w-full text-xs text-left"><thead><tr className="border-b border-[var(--border-subtle)]">
              {['#','门店名称','进店人次','商场进店','得分','等级'].map((c,i)=><th key={i} className="py-1.5 px-2 font-medium text-[var(--text-muted)] whitespace-nowrap">{c}</th>)}
            </tr></thead><tbody>{sliced.map((s:any,i:number)=>(<tr key={s.store_id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
              <td className="py-1 px-2 text-[var(--text-secondary)]">{(page-1)*PAGE_SIZE+i+1}</td>
              <td className="py-1 px-2 text-[var(--text-primary)] max-w-[140px] truncate">{s.name}</td>
              <td className="py-1 px-2 text-[var(--text-secondary)]">{(s.daily_enter||0).toFixed(0)}</td>
              <td className="py-1 px-2 text-[var(--text-secondary)]">{s.mall_daily_enter||'-'}</td>
              <td className="py-1 px-2 font-medium" style={{color:s.abc_level==='A'?'#22C55E':s.abc_level==='C'?'#EF4444':'#3B82F6'}}>{s.abc_score}</td>
              <td className="py-1 px-2">{levelTag(s.abc_level)}</td>
            </tr>))}</tbody></table>
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:12}}><Pagination current={page} pageSize={PAGE_SIZE} total={available.length} onChange={p=>setPage(p)} showQuickJumper showSizeChanger={false} showTotal={t=>`共 ${t} 条`} size="small"/></div>
          </div>
        </>}
      </div>)}
    </div>
  )
}

const MetricCard:React.FC<{color:string,label:string,value:any,sub?:string}>=({color,label,value,sub})=>(
  <div className="card-level-1 p-4 flex items-center gap-3">
    <div className="w-2 h-8 rounded-full shrink-0" style={{background:color}}/>
    <div><div className="text-xs text-[var(--text-muted)]">{label}</div><div className="text-xl font-bold text-[var(--text-primary)]">{value??0}</div>{sub&&<div className="text-[10px] text-[var(--text-muted)]">{sub}</div>}</div>
  </div>
)
const healthTag=(l:string)=>{const m:Record<string,{c:string,bg:string}>={健康:{c:'#22C55E',bg:'rgba(34,197,94,0.1)'},关注:{c:'#3B82F6',bg:'rgba(59,130,246,0.1)'},问题:{c:'#F59E0B',bg:'rgba(245,158,11,0.1)'},失败:{c:'#EF4444',bg:'rgba(239,68,68,0.1)'}};const s=m[l]||{c:'#999',bg:'rgba(153,153,153,0.1)'};return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{color:s.c,background:s.bg}}>{l}</span>}
const levelTag=(l:string)=>{const m:Record<string,{c:string,bg:string}>={A:{c:'#22C55E',bg:'rgba(34,197,94,0.1)'},B:{c:'#3B82F6',bg:'rgba(59,130,246,0.1)'},C:{c:'#EF4444',bg:'rgba(239,68,68,0.1)'}};const s=m[l]||{c:'#999',bg:'rgba(153,153,153,0.1)'};return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{color:s.c,background:s.bg}}>{l}类</span>}

const buildBcgScatter=(stores:any[])=>{
  const vd=stores.filter((s:any)=>s.available);const sv=vd.map((s:any)=>s.daily_enter||0);const mv=vd.map((s:any)=>s.mall_daily_enter||0)
  const mS=sv.length?[...sv].sort((a,b)=>a-b)[Math.floor(sv.length/2)]:0;const mM=mv.length?[...mv].sort((a,b)=>a-b)[Math.floor(mv.length/2)]:0
  return{grid:{top:'8%',right:'3%',bottom:'10%',left:'8%'},tooltip:{formatter:(p:any)=>p.value?`${p.value[2]}<br/>门店:${p.value[0]} 商场:${p.value[1]}`:''},xAxis:{type:'value',name:'门店进店人次→',nameLocation:'center',nameGap:25,axisLabel:{fontSize:10}},yAxis:{type:'value',name:'商场进店人次',axisLabel:{fontSize:10}},series:[{type:'scatter',symbolSize:(val:any)=>Math.min(val[0]*0.05+6,24),data:vd.map((s:any)=>{const v=s.daily_enter||0;const ma=s.mall_daily_enter||1;const c=v>=mS&&ma>=mM?COLORS.green:v<mS&&ma>=mM?COLORS.primary:v>=mS&&ma<mM?COLORS.amber:COLORS.red;return{value:[v,ma,s.name],itemStyle:{color:c+'99'}}}),emphasis:{itemStyle:{color:COLORS.primary}}}],markLine:{silent:true,data:[{xAxis:mS,lineStyle:{color:COLORS.primary,type:'dashed',width:1.5},label:{formatter:`门店中位 ${mS.toFixed(0)}`,fontSize:9,color:COLORS.primary}},{yAxis:mM,lineStyle:{color:'#F59E0B',type:'dashed',width:1.5},label:{formatter:`商场中位 ${mM.toFixed(0)}`,fontSize:9,color:'#F59E0B'}}]}}
}
const buildPareto=(stores:any[])=>{
  const sd=[...stores].filter((s:any)=>s.available).sort((a,b)=>(b.daily_enter||0)-(a.daily_enter||0)).slice(0,30)
  const total=sd.reduce((sum,s)=>sum+(s.daily_enter||0),0);let cum=0
  return{grid:{top:'8%',right:'8%',bottom:'8%',left:'3%'},xAxis:{type:'category',data:sd.map((s:any)=>s.name?.slice(4,10)||''),axisLabel:{fontSize:9,rotate:45}},yAxis:[{type:'value',name:'进店人次',axisLabel:{fontSize:10}},{type:'value',name:'%',max:100,axisLabel:{fontSize:10,formatter:'{value}%'}}],series:[{type:'bar',barMaxWidth:20,yAxisIndex:0,name:'客流',data:sd.map((s:any)=>{const lv=s.abc_level;return{value:s.daily_enter||0,itemStyle:{color:(lv==='A'?'#22C55E':lv==='C'?'#EF4444':'#3B82F6')+'cc'},label:{show:true,position:'top',fontSize:8,color:lv==='A'?'#22C55E':lv==='C'?'#EF4444':'#3B82F6'}}}),label:{show:true,position:'top',fontSize:8}},{type:'line',yAxisIndex:1,name:'累计占比',data:sd.map((s:any)=>{cum+=s.daily_enter||0;return Math.round(cum/total*100)}),lineStyle:{color:'#EF4444',width:2},symbol:'circle',symbolSize:4,itemStyle:{color:'#EF4444'}}]}
}
