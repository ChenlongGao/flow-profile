import React, { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client'
import { Tabs, Select, DatePicker, Pagination, Cascader } from 'antd'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
type TimePreset = 'today'|'yesterday'|'7d'|'30d'|'day'|'week'|'month'|'quarter'|'year'|'custom'
const TIME_PRESETS = [{label:'今日',value:'today'},{label:'昨日',value:'yesterday'},{label:'近7天',value:'7d'},{label:'近30天',value:'30d'},{label:'按天',value:'day'},{label:'按周',value:'week'},{label:'按月',value:'month'},{label:'按季',value:'quarter'},{label:'按年',value:'year'},{label:'自定义',value:'custom'}]
function getPresetRange(p:TimePreset):[dayjs.Dayjs,dayjs.Dayjs]|null{const n=dayjs();switch(p){case'today':return[n,n];case'yesterday':return[n.subtract(1,'day'),n.subtract(1,'day')];case'7d':return[n.subtract(6,'day'),n];case'30d':return[n.subtract(29,'day'),n];default:return null}}
function fd(d:dayjs.Dayjs):string{return d.format('YYYY-MM-DD')}
const LEVEL_OPTS = [{value:'critical',label:'严重'},{value:'warning',label:'一般'},{value:'minor',label:'轻微'}]
const PAGE_SIZE = 20

export const AlertDetail: React.FC = () => {
  const [indicatorList, setIndicatorList] = useState<any[]>([])
  const [indicatorTotal, setIndicatorTotal] = useState(0)
  const [modelList, setModelList] = useState<any[]>([])
  const [modelTotal, setModelTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [fLevel, setFLevel] = useState('')
  const [storeSearchVal, setStoreSearchVal] = useState('')
  const [storeSearchList, setStoreSearchList] = useState<{label:string;value:string}[]>([])
  const [cascaderValue, setCascaderValue] = useState<string[]>([])
  const [cascaderOptions, setCascaderOptions] = useState<any[]>([])
  const [tagCascaderValue, setTagCascaderValue] = useState<string[]>([])
  const [tagCascaderOptions, setTagCascaderOptions] = useState<any[]>([])
  const [timePreset, setTimePreset] = useState<TimePreset>('7d')
  const [dateValue, setDateValue] = useState<any>(getPresetRange('7d'))
  const [iPage, setIPage] = useState(1)
  const [mPage, setMPage] = useState(1)
  const [tab, setTab] = useState(() => localStorage.getItem('alertDetailTab') || 'indicator')

  useEffect(()=>{api.get<any>('/store-tree').then(d=>{const toCascader=(node:any):any=>{if(node.type==='store'||node.store_id){return{label:node.name,value:node.store_id||node.id}}const item:any={label:node.name,value:node.id||node.name};if(node.children&&node.children.length>0){const c=node.children.map(toCascader).filter(Boolean);if(c.length>0)item.children=c}return item};if(d.children)setCascaderOptions(d.children.map(toCascader).filter(Boolean))}).catch(()=>{})},[])
  useEffect(()=>{Promise.all([api.get<any[]>('/config/tag-groups'),api.get<any[]>('/config/tags')]).then(([g,t])=>{setTagCascaderOptions(g.map((x:any)=>({label:x.name,value:x.id,children:t.filter((y:any)=>y.group_id===x.id).map((y:any)=>({label:y.name,value:y.name}))})))}).catch(()=>{})},[])

  const handleStoreSearch=(v:string)=>{if(v.length<1){setStoreSearchList([]);return};api.get<any>(`/stores?search=${encodeURIComponent(v)}&page_size=20`).then(res=>{setStoreSearchList((res.items||[]).map((s:any)=>({label:`${s.store_id} - ${s.name}`,value:s.store_id})))}).catch(()=>setStoreSearchList([]))}
  const handlePresetChange=(v:string)=>{const p=v as TimePreset;setTimePreset(p);const r=getPresetRange(p);if(r){setDateValue(r);return};setDateValue(p==='day'?dayjs():null)}

  const load = useCallback(() => {
    let start:string,end:string
    if(['today','yesterday','7d','30d'].includes(timePreset)){const r=getPresetRange(timePreset)!;start=fd(r[0]);end=fd(r[1])}
    else if(timePreset==='custom'){if(!dateValue||!dateValue[0]||!dateValue[1])return;start=fd(dateValue[0]);end=fd(dateValue[1])}
    else if(timePreset==='day'&&dateValue){start=fd(dateValue);end=fd(dateValue)}
    else if(timePreset==='week'&&dateValue){start=fd(dateValue[0]);end=fd(dateValue[1])}
    else if(timePreset==='month'&&dateValue){start=fd(dateValue.startOf('month'));end=fd(dateValue.endOf('month'))}
    else if(timePreset==='quarter'&&dateValue){start=fd(dateValue.startOf('quarter'));end=fd(dateValue.endOf('quarter'))}
    else if(timePreset==='year'&&dateValue){start=fd(dateValue.startOf('year'));end=fd(dateValue.endOf('year'))}
    else return
    setLoading(true)
    const params = new URLSearchParams()
    if(fLevel) params.set('alert_level', fLevel)
    if(storeSearchVal) params.set('store_id', storeSearchVal)
    params.set('date_from', start); params.set('date_to', end)
    const qs = params.toString() ? '&'+params.toString() : ''
    api.get<any[]>(`/config/alert-records?limit=200${qs}`).then(d=>{const arr=Array.isArray(d)?d:[];setIndicatorList(arr);setIndicatorTotal(arr.length)})
    api.get<any[]>(`/config/warning-model-alerts?limit=200${qs}`).then(d=>{const arr=Array.isArray(d)?d:[];setModelList(arr);setModelTotal(arr.length)}).finally(()=>setLoading(false))
  },[fLevel,storeSearchVal,timePreset,dateValue])
  useEffect(()=>{load()},[load])

  const doReset = () => { setFLevel(''); setStoreSearchVal(''); setTimePreset('7d'); setDateValue(getPresetRange('7d')); setCascaderValue([]); setTagCascaderValue([]) }
  const sliced = (arr:any[], pg:number) => arr.slice((pg-1)*PAGE_SIZE, pg*PAGE_SIZE)
  const lv = (v:string) => v==='critical'?<span style={{color:'#EF4444'}}>● 严重</span>:v==='warning'?<span style={{color:'#F59E0B'}}>● 一般</span>:<span style={{color:'#1890FF'}}>● 轻微</span>

  const currPage = tab==='indicator' ? iPage : mPage
  const currTotal = tab==='indicator' ? indicatorTotal : modelTotal
  const setCurrPage = tab==='indicator' ? setIPage : setMPage

  return (
    <div className="flex flex-col" style={{height:'calc(100vh - 48px)'}}>
      <div className="px-6 pt-6 pb-0 shrink-0">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">预警明细</h2>
      </div>
      <div className="px-6 pb-3 shrink-0">
        <div className="flex items-center gap-3 flex-wrap pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2"><span className="text-xs text-[var(--text-muted)]">门店</span><Select showSearch value={storeSearchVal||undefined} onSearch={handleStoreSearch} onChange={v=>setStoreSearchVal(v||'')} options={storeSearchList} placeholder="编码/名称搜索" allowClear filterOption={false} notFoundContent={null} style={{height:32,width:200,fontSize:12}}/></div>
          <div className="flex items-center gap-2"><span className="text-xs text-[var(--text-muted)]">时间</span><Select value={timePreset} onChange={handlePresetChange} style={{height:32,width:100}} options={TIME_PRESETS}/>{['today','yesterday','7d','30d'].includes(timePreset)?(<RangePicker value={getPresetRange(timePreset)as any} disabled style={{height:32,width:260}}/>):timePreset==='day'?(<DatePicker value={dateValue} onChange={setDateValue} style={{height:32,width:160}}/>):timePreset==='week'?(<RangePicker value={dateValue} onChange={setDateValue} picker="week" style={{height:32,width:260}}/>):(<RangePicker value={dateValue} onChange={setDateValue} style={{height:32,width:260}}/>)}</div>
          <div className="flex items-center gap-2"><span className="text-xs text-[var(--text-muted)]">架构</span><Cascader value={cascaderValue} onChange={v=>setCascaderValue(v as string[])} options={cascaderOptions} placeholder="门店架构筛选" allowClear changeOnSelect style={{height:32,width:200,fontSize:12}}/></div>
          <div className="flex items-center gap-2"><span className="text-xs text-[var(--text-muted)]">标签</span><Cascader value={tagCascaderValue} onChange={v=>setTagCascaderValue(v as string[])} options={tagCascaderOptions} placeholder="标签筛选" allowClear changeOnSelect style={{height:32,width:200,fontSize:12}}/></div>
          <div className="flex items-center gap-2"><span className="text-xs text-[var(--text-muted)]">等级</span><Select value={fLevel||undefined} onChange={v=>setFLevel(v||'')} allowClear placeholder="全部" style={{height:32,width:90}} options={LEVEL_OPTS}/></div>
          <button onClick={()=>load()} className="filter-btn-primary">查询</button>
          <button onClick={doReset} className="filter-btn-secondary">重置</button>
        </div>
      </div>
      <div className="flex-1 min-h-0 px-6 overflow-auto">
        <Tabs size="small" activeKey={tab} onChange={setTab} items={[
          {key:'indicator',label:'指标预警',children:
            indicatorList.length===0 ? <div className="p-12 text-center text-xs text-[var(--text-muted)]">暂无数据</div> :
            <table className="w-full text-xs text-left">
              <thead><tr className="border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--bg-secondary)] z-10">
                {['#','时间','门店编码','门店名称','来源','预警规则','等级','指标值','阈值'].map((c,i)=><th key={i} className="py-1.5 px-2 font-medium text-[var(--text-muted)] whitespace-nowrap">{c}</th>)}
              </tr></thead>
              <tbody>{sliced(indicatorList,iPage).map((d:any,i:number)=>(
                <tr key={i} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                  <td className="py-1.5 px-2 text-[var(--text-secondary)]">{(iPage-1)*PAGE_SIZE+i+1}</td>
                  <td className="py-1.5 px-2 text-[var(--text-secondary)] whitespace-nowrap">{d.created_at?.slice(0,16)}</td>
                  <td className="py-1.5 px-2 text-[var(--text-secondary)] whitespace-nowrap">{(d.store_id||'').slice(0,12)}</td>
                  <td className="py-1.5 px-2 text-[var(--text-secondary)] max-w-[120px] truncate">{d.store_name||'-'}</td>
                  <td className="py-1.5 px-2 text-[var(--text-secondary)]">{d.source==='cross_alert_rule'?'交叉规则':'指标规则'}</td>
                  <td className="py-1.5 px-2 text-[var(--text-secondary)] max-w-[180px] truncate">{d.title||'-'}</td>
                  <td className="py-1.5 px-2">{lv(d.alert_level)}</td>
                  <td className="py-1.5 px-2 text-[var(--text-secondary)]">{d.metric_value||'-'}</td>
                  <td className="py-1.5 px-2 text-[var(--text-secondary)]">{d.threshold_value||'-'}</td>
                </tr>))}</tbody>
            </table>
          },
          {key:'model',label:'模型预警',children:
            modelList.length===0 ? <div className="p-12 text-center text-xs text-[var(--text-muted)]">暂无数据</div> :
            <table className="w-full text-xs text-left">
              <thead><tr className="border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--bg-secondary)] z-10">
                {['#','时间','门店编码','门店名称','模型','等级','归因','预警消息'].map((c,i)=><th key={i} className="py-1.5 px-2 font-medium text-[var(--text-muted)] whitespace-nowrap">{c}</th>)}
              </tr></thead>
              <tbody>{sliced(modelList,mPage).map((d:any,i:number)=>(
                <tr key={i} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                  <td className="py-1.5 px-2 text-[var(--text-secondary)]">{(mPage-1)*PAGE_SIZE+i+1}</td>
                  <td className="py-1.5 px-2 text-[var(--text-secondary)] whitespace-nowrap">{d.created_at?.slice(0,16)}</td>
                  <td className="py-1.5 px-2 text-[var(--text-secondary)] whitespace-nowrap">{(d.store_id||'').slice(0,12)}</td>
                  <td className="py-1.5 px-2 text-[var(--text-secondary)] max-w-[120px] truncate">{d.store_name||'-'}</td>
                  <td className="py-1.5 px-2 text-[var(--text-secondary)]">{d.model_type||'-'}</td>
                  <td className="py-1.5 px-2">{lv(d.alert_level)}</td>
                  <td className="py-1.5 px-2 text-[var(--text-secondary)] max-w-[120px] truncate">{d.alert_category||'-'}</td>
                  <td className="py-1.5 px-2 text-[var(--text-secondary)] max-w-[200px] truncate">{d.alert_message||'-'}</td>
                </tr>))}</tbody>
            </table>
          },
        ]}/>
      </div>
      <div className="shrink-0" style={{display:'flex',justifyContent:'flex-end',padding:'8px 24px',background:'var(--bg-secondary)',borderTop:'1px solid var(--border-subtle)'}}>
        <Pagination current={currPage} pageSize={PAGE_SIZE} total={currTotal} onChange={p=>setCurrPage(p)} showQuickJumper showSizeChanger={false} showTotal={t=>`共 ${t} 条`} size="small"/>
      </div>
    </div>
  )
}
