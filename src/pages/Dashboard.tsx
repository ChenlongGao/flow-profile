import React, { useEffect, useState, useCallback } from 'react'
import { dashboardApi, DashboardOverview } from '../api/client'
import { api } from '../api/client'
import { Select, DatePicker, Pagination, Cascader } from 'antd'
import { BaseChart } from '../components/echarts/BaseChart'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
type TimePreset = 'today'|'yesterday'|'7d'|'30d'|'day'|'week'|'month'|'quarter'|'year'|'custom'
const TIME_PRESETS = [{label:'今日',value:'today'},{label:'昨日',value:'yesterday'},{label:'近7天',value:'7d'},{label:'近30天',value:'30d'},{label:'按天',value:'day'},{label:'按周',value:'week'},{label:'按月',value:'month'},{label:'按季',value:'quarter'},{label:'按年',value:'year'},{label:'自定义',value:'custom'}]
function getPresetRange(p:TimePreset):[dayjs.Dayjs,dayjs.Dayjs]|null{const n=dayjs();switch(p){case'today':return[n,n];case'yesterday':return[n.subtract(1,'day'),n.subtract(1,'day')];case'7d':return[n.subtract(6,'day'),n];case'30d':return[n.subtract(29,'day'),n];default:return null}}
function fd(d:dayjs.Dayjs):string{return d.format('YYYY-MM-DD')}

export const Dashboard: React.FC<{setActivePage?: (key:string)=>void}> = ({setActivePage}) => {
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [timePreset, setTimePreset] = useState<TimePreset>('yesterday')
  const [dateValue, setDateValue] = useState<any>(getPresetRange('yesterday'))
  const [storeSearchVal, setStoreSearchVal] = useState('')
  const [storeSearchList, setStoreSearchList] = useState<{label:string;value:string}[]>([])
  const [cascaderValue, setCascaderValue] = useState<string[]>([])
  const [cascaderOptions, setCascaderOptions] = useState<any[]>([])
  const [tagCascaderValue, setTagCascaderValue] = useState<string[]>([])
  const [tagCascaderOptions, setTagCascaderOptions] = useState<any[]>([])
  const [iPage, setIPage] = useState(1)
  const [mPage, setMPage] = useState(1)

  useEffect(()=>{api.get<any>('/store-tree').then(d=>{const toCascader=(node:any):any=>{if(node.type==='store'||node.store_id){return{label:node.name,value:node.store_id||node.id}}const item:any={label:node.name,value:node.id||node.name};if(node.children&&node.children.length>0){const c=node.children.map(toCascader).filter(Boolean);if(c.length>0)item.children=c}return item};if(d.children)setCascaderOptions(d.children.map(toCascader).filter(Boolean))}).catch(()=>{})},[])
  useEffect(()=>{Promise.all([api.get<any[]>('/config/tag-groups'),api.get<any[]>('/config/tags')]).then(([g,t])=>{setTagCascaderOptions(g.map((x:any)=>({label:x.name,value:x.id,children:t.filter((y:any)=>y.group_id===x.id).map((y:any)=>({label:y.name,value:y.name}))})))}).catch(()=>{})},[])

  const handleStoreSearch=(v:string)=>{if(v.length<1){setStoreSearchList([]);return};api.get<any>(`/stores?search=${encodeURIComponent(v)}&page_size=20`).then(res=>{setStoreSearchList((res.items||[]).map((s:any)=>({label:`${s.store_id} - ${s.name}`,value:s.store_id})))}).catch(()=>setStoreSearchList([]))}
  const handlePresetChange=(val:string)=>{const p=val as TimePreset;setTimePreset(p);const r=getPresetRange(p);if(r){setDateValue(r);return};setDateValue(p==='day'?dayjs():null)}

  const doQuery = useCallback((reset=false) => {
    if(reset){setTimePreset('yesterday');setDateValue(getPresetRange('yesterday'));setCascaderValue([]);setTagCascaderValue([]);setStoreSearchVal('')}
    let start:string,end:string
    const p = reset?'7d':timePreset
    if(['today','yesterday','7d','30d'].includes(p)){const r=getPresetRange(p as TimePreset)!;start=fd(r[0]);end=fd(r[1])}
    else if(p==='custom'){if(!dateValue||!dateValue[0]||!dateValue[1])return;start=fd(dateValue[0]);end=fd(dateValue[1])}
    else if(p==='day'&&dateValue){start=fd(dateValue);end=fd(dateValue)}
    else if(p==='week'&&dateValue){start=fd(dateValue[0]);end=fd(dateValue[1])}
    else if(p==='month'&&dateValue){start=fd(dateValue.startOf('month'));end=fd(dateValue.endOf('month'))}
    else if(p==='quarter'&&dateValue){start=fd(dateValue.startOf('quarter'));end=fd(dateValue.endOf('quarter'))}
    else if(p==='year'&&dateValue){start=fd(dateValue.startOf('year'));end=fd(dateValue.endOf('year'))}
    else return
    const params = new URLSearchParams()
    params.set('date_from',start);params.set('date_to',end)
    const sv = reset?'':storeSearchVal
    if(sv)params.set('store_id',sv)
    setLoading(true)
    dashboardApi.overview(params.toString()).then(d=>{setData(d);setLoading(false)}).catch(()=>setLoading(false))
  },[timePreset,dateValue,storeSearchVal])

  useEffect(()=>{doQuery()},[])

  if (loading) return <div className="p-6 grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><div key={i} className="card-level-1 h-[104px] animate-pulse bg-[var(--bg-tertiary)]"/>)}</div>
  if (!data) return <div className="p-6 text-sm text-[var(--text-muted)]">加载失败</div>

  return (
    <div className="p-6 space-y-3">
      <div className="flex items-center gap-3 flex-wrap pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2"><span className="text-xs text-[var(--text-muted)]">门店</span>
          <Select showSearch value={storeSearchVal||undefined} onSearch={handleStoreSearch} onChange={v=>setStoreSearchVal(v||'')} options={storeSearchList} placeholder="编码/名称搜索" allowClear filterOption={false} notFoundContent={null} style={{height:32,width:200,fontSize:12}}/>
        </div>
        <div className="flex items-center gap-2"><span className="text-xs text-[var(--text-muted)]">时间</span>
          <Select value={timePreset} onChange={handlePresetChange} style={{height:32,width:100}} options={TIME_PRESETS}/>
          {['today','yesterday','7d','30d'].includes(timePreset)?(<RangePicker value={getPresetRange(timePreset)as any} disabled style={{height:32,width:260}}/>)
          :timePreset==='day'?(<DatePicker value={dateValue} onChange={setDateValue} style={{height:32,width:160}}/>)
          :timePreset==='week'?(<RangePicker value={dateValue} onChange={setDateValue} picker="week" style={{height:32,width:260}}/>)
          :(<RangePicker value={dateValue} onChange={setDateValue} style={{height:32,width:260}}/>)}
        </div>
        <div className="flex items-center gap-2"><span className="text-xs text-[var(--text-muted)]">架构</span>
          <Cascader value={cascaderValue} onChange={v=>setCascaderValue(v as string[])} options={cascaderOptions} placeholder="门店架构筛选" allowClear changeOnSelect style={{height:32,width:200,fontSize:12}}/>
        </div>
        <div className="flex items-center gap-2"><span className="text-xs text-[var(--text-muted)]">标签</span>
          <Cascader value={tagCascaderValue} onChange={v=>setTagCascaderValue(v as string[])} options={tagCascaderOptions} placeholder="标签筛选" allowClear changeOnSelect style={{height:32,width:200,fontSize:12}}/>
        </div>
        <button onClick={()=>doQuery()} className="filter-btn-primary">查询</button>
        <button onClick={()=>doQuery(true)} className="filter-btn-secondary">重置</button>
      </div>

      {/* ─── 指标卡 ─── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {l:'昨日预警',v:data.today_alerts??0,c:'#EF4444',sub:'全部预警'},
          {l:'严重预警',v:data.today_critical??0,c:'#DC2626',sub:'需立即处理'},
          {l:'一般预警',v:data.today_warning??0,c:'#F59E0B',sub:'重点关注'},
          {l:'轻微预警',v:data.today_minor??0,c:'#1890FF',sub:'常规关注'},
          {l:'预警门店',v:data.today_alerted_stores??0,c:'#8B5CF6',sub:'触发预警门店'},
          {l:'指标预警',v:data.today_indicator??0,c:'#0EA5E9',sub:'指标规则触发'},
          {l:'模型预警',v:data.today_model??0,c:'#10B981',sub:'模型检测触发'},
          {l:'门店总数',v:data.total_stores??100,c:'var(--ai-blue-500)',sub:`覆盖${data.total_malls??100}家商场`},
        ].map((m,i)=><div key={i} className="card-level-1 p-4 flex items-center gap-3"><div className="w-2 h-8 rounded-full shrink-0" style={{background:m.c}}/><div><div className="text-xs text-[var(--text-muted)]">{m.l}</div><div className="text-xl font-bold text-[var(--text-primary)]">{m.v}</div><div className="text-[10px] text-[var(--text-muted)]">{m.sub}</div></div></div>)}
      </div>

      {/* ─── 数据图表卡 ─── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-level-1 p-3" style={{aspectRatio:'16/9'}}><div className="chart-title">指标预警趋势</div><BaseChart option={indicatorTrendChart(data)} height="100%"/></div>
        <div className="card-level-1 p-3" style={{aspectRatio:'16/9'}}><div className="chart-title">模型预警趋势</div><BaseChart option={modelTrendChart(data)} height="100%"/></div>
        <div className="card-level-1 p-3" style={{aspectRatio:'16/9'}}><div className="chart-title">指标预警分布</div><BaseChart option={indicatorDistChart(data)} height="100%"/></div>
        <div className="card-level-1 p-3" style={{aspectRatio:'16/9'}}><div className="chart-title">模型预警分布</div><BaseChart option={modelDistChart(data)} height="100%"/></div>
      </div>

      {/* ─── 预警明细 ─── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-level-1 p-3 overflow-x-auto flex flex-col" style={{aspectRatio:'16/9'}}>
          <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-[var(--text-primary)]">指标预警明细</span><button onClick={()=>{localStorage.setItem('alertDetailTab','indicator');setActivePage?.('alert-detail')}} className="text-xs text-[var(--ai-blue-500)] hover:underline">详情</button></div>
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-xs text-left"><colgroup><col style={{width:'22%'}}/><col style={{width:'18%'}}/><col style={{width:'20%'}}/><col style={{width:'25%'}}/><col style={{width:'15%'}}/></colgroup>
            <thead><tr className="border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--bg-secondary)]">{['时间','门店','名称','规则','等级'].map((c,i)=><th key={i} className="py-1.5 px-2 font-medium text-[var(--text-muted)] whitespace-nowrap">{c}</th>)}</tr></thead>
            <tbody>{(data.indicator_detail||[]).slice((iPage-1)*15,iPage*15).map((d:any,i:number)=>(<tr key={i} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
              <td className="py-1.5 px-2 text-[var(--text-secondary)] whitespace-nowrap">{d.created_at?.slice(5,16)}</td>
              <td className="py-1.5 px-2 text-[var(--text-secondary)] whitespace-nowrap">{d.store_id?.slice(0,10)}</td>
              <td className="py-1.5 px-2 text-[var(--text-secondary)] max-w-[80px] truncate">{d.store_name||'-'}</td>
              <td className="py-1.5 px-2 text-[var(--text-secondary)] max-w-[100px] truncate">{d.rule_name||(d.title||'-')}</td>
              <td className="py-1.5 px-2 whitespace-nowrap">{d.alert_level==='critical'?<span style={{color:'#EF4444'}}>● 严重</span>:d.alert_level==='warning'?<span style={{color:'#F59E0B'}}>● 一般</span>:<span style={{color:'#1890FF'}}>● 轻微</span>}</td></tr>))}</tbody></table>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',marginTop:8,paddingRight:4}}><Pagination size="small" current={iPage} onChange={p=>setIPage(p)} showTotal={t=>`共${t}条`} total={data.indicator_detail?.length||0} pageSize={15}/></div>
        </div>
        <div className="card-level-1 p-3 overflow-x-auto flex flex-col" style={{aspectRatio:'16/9'}}>
          <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-[var(--text-primary)]">模型预警明细</span><button onClick={()=>{localStorage.setItem('alertDetailTab','model');setActivePage?.('alert-detail')}} className="text-xs text-[var(--ai-blue-500)] hover:underline">详情</button></div>
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-xs text-left"><colgroup><col style={{width:'20%'}}/><col style={{width:'16%'}}/><col style={{width:'18%'}}/><col style={{width:'14%'}}/><col style={{width:'16%'}}/><col style={{width:'16%'}}/></colgroup>
            <thead><tr className="border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--bg-secondary)]">{['时间','门店','名称','模型','归因','等级'].map((c,i)=><th key={i} className="py-1.5 px-2 font-medium text-[var(--text-muted)] whitespace-nowrap">{c}</th>)}</tr></thead>
            <tbody>{(data.model_detail||[]).slice((mPage-1)*15,mPage*15).map((d:any,i:number)=>(<tr key={i} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
              <td className="py-1.5 px-2 text-[var(--text-secondary)] whitespace-nowrap">{d.created_at?.slice(5,16)}</td>
              <td className="py-1.5 px-2 text-[var(--text-secondary)] whitespace-nowrap">{d.store_id?.slice(0,10)}</td>
              <td className="py-1.5 px-2 text-[var(--text-secondary)] max-w-[80px] truncate">{d.store_name||'-'}</td>
              <td className="py-1.5 px-2 text-[var(--text-secondary)]">{d.model_type||'-'}</td>
              <td className="py-1.5 px-2 text-[var(--text-secondary)] max-w-[90px] truncate">{d.alert_category||d.rule_name||'-'}</td>
              <td className="py-1.5 px-2 whitespace-nowrap">{d.alert_level==='critical'?<span style={{color:'#EF4444'}}>● 严重</span>:d.alert_level==='warning'?<span style={{color:'#F59E0B'}}>● 一般</span>:<span style={{color:'#1890FF'}}>● 轻微</span>}</td></tr>))}</tbody></table>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',marginTop:8,paddingRight:4}}><Pagination size="small" current={mPage} onChange={p=>setMPage(p)} showTotal={t=>`共${t}条`} total={data.model_detail?.length||0} pageSize={15}/></div>
        </div>
      </div>
    </div>
  )
}

const indicatorTrendChart=(data:any)=>({grid:{top:'8%',right:'2%',bottom:'12%',left:'2%'},legend:{show:false},tooltip:{trigger:'axis'},xAxis:{type:'category',data:(data.alert_trend||[]).map((d:any)=>d.date),axisLabel:{fontSize:10}},yAxis:{type:'value',axisLabel:{fontSize:10}},series:[{name:'指标预警',type:'line',data:(data.alert_trend||[]).map((d:any)=>d.indicator),itemStyle:{color:'#0EA5E9'},lineStyle:{color:'#0EA5E9'},symbol:'circle',symbolSize:4}]})
const modelTrendChart=(data:any)=>({grid:{top:'8%',right:'2%',bottom:'12%',left:'2%'},legend:{show:false},tooltip:{trigger:'axis'},xAxis:{type:'category',data:(data.alert_trend||[]).map((d:any)=>d.date),axisLabel:{fontSize:10}},yAxis:{type:'value',axisLabel:{fontSize:10}},series:[{name:'模型预警',type:'line',data:(data.alert_trend||[]).map((d:any)=>d.model),itemStyle:{color:'#10B981'},lineStyle:{color:'#10B981'},symbol:'circle',symbolSize:4,areaStyle:{color:'rgba(16,185,129,0.1)'}}]})
const indicatorDistChart=(data:any)=>({legend:{show:false},grid:{show:false,containLabel:false},tooltip:{trigger:'item'},series:[{type:'pie',radius:['40%','65%'],center:['50%','40%'],data:(data.indicator_distribution||data.indicator_types||[]).map((d:any)=>({value:d.count,name:d.type||d.name})),label:{fontSize:10,color:'var(--text-secondary)'},emphasis:{label:{fontSize:14}}}]})
const modelDistChart=(data:any)=>({legend:{show:false},grid:{show:false,containLabel:false},tooltip:{trigger:'item'},series:[{type:'pie',radius:['40%','65%'],center:['50%','40%'],data:(data.model_distribution||[]).map((d:any)=>({value:d.count,name:d.model_type})),label:{fontSize:10,color:'var(--text-secondary)'},emphasis:{label:{fontSize:14}}}]})

