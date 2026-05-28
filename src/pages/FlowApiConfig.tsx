import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Modal, Input, Select, Switch, Popconfirm, message, Tag, Button, Tabs } from 'antd'
import { Plus, Edit3, Trash2, Play, Database, Clock, Link } from 'lucide-react'

interface FlowApiConf {
  id?:number; name:string; api_type:string; base_url:string; auth_type:string;
  api_key:string; field_mapping:Record<string,string>; is_enabled:number; description:string;
  last_sync_at?:string; last_sync_status?:string;
}

const API_TYPES = [
  {v:'store_flow',l:'门店客流API',t:'store_flow_data',fields:['store_id','data_date','pass_by_count','pass_by_people','enter_count','enter_people','avg_stay_minutes','male_ratio','female_ratio','age_18_24_ratio','age_25_34_ratio','age_35_44_ratio','age_45_plus_ratio']},
  {v:'mall_flow',l:'商场客流API',t:'mall_flow_daily',fields:['mall_id','data_date','visitor_count','is_weekend']},
]

export const FlowApiConfig: React.FC = () => {
  const [configs, setConfigs] = useState<FlowApiConf[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FlowApiConf>({name:'',api_type:'store_flow',base_url:'',auth_type:'none',api_key:'',field_mapping:{},is_enabled:1,description:''})
  const [isEdit, setIsEdit] = useState(false)
  const [syncing, setSyncing] = useState<number|null>(null)
  const [activeTab, setActiveTab] = useState('config')

  const loadConfigs = () => {setLoading(true);api.get<any[]>('/flow-api/configs').then(d=>setConfigs(d||[])).finally(()=>setLoading(false))}
  const loadLogs = () => api.get<any[]>('/flow-api/logs?limit=30').then(d=>setLogs(d||[]))
  useEffect(()=>{loadConfigs();loadLogs()},[])

  const save = async()=>{
    try {
      const payload = {...editing, field_mapping: JSON.stringify(editing.field_mapping||{}), auth_header: '', request_method: 'GET', headers_json: '{}', sync_frequency: 'manual', request_body: ''}
      if(isEdit&&editing.id){await api.put(`/flow-api/configs/${editing.id}`,payload);message.success('已更新')}
      else{await api.post('/flow-api/configs',payload);message.success('已创建')}
      setModalOpen(false);loadConfigs()
    }catch{message.error('保存失败')}
  }
  const del = async(id:number)=>{await api.delete(`/flow-api/configs/${id}`);message.success('已删除');loadConfigs()}
  const doSync = async(id:number)=>{
    setSyncing(id)
    try {const r=await api.post<any>(`/flow-api/sync/${id}`);message.success(`同步完成: 抓取${r.fetched||0}条`);loadLogs();loadConfigs()}
    catch{message.error('同步失败（请检查API URL和字段映射）')}
    finally{setSyncing(null)}
  }

  const targetFields = API_TYPES.find(t=>t.v===editing.api_type)?.fields||[]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h3 className="text-sm font-semibold text-[var(--text-primary)]">客流API接入</h3><p className="text-xs text-[var(--text-muted)] mt-1">对接第三方客流API，填URL + 字段映射即可同步</p></div>
        <button onClick={()=>{setEditing({name:'',api_type:'store_flow',base_url:'',auth_type:'none',api_key:'',field_mapping:{},is_enabled:1,description:''});setIsEdit(false);setModalOpen(true)}} className="filter-btn-primary flex items-center gap-1.5"><Plus className="w-3.5 h-3.5"/>新增API</button>
      </div>

      <Tabs size="small" activeKey={activeTab} onChange={setActiveTab} items={[
        {key:'config',label:<span className="flex items-center gap-1"><Database className="w-3 h-3"/>API配置</span>,children:
          loading?<div className="p-8 text-center text-xs">加载中...</div>:
          configs.length===0?<div className="card-level-1 p-12 text-center text-sm">暂无API配置，点击右上角新增</div>:
          <div className="space-y-3">
            {configs.map(c=>{
              const t=API_TYPES.find(t=>t.v===c.api_type)
              const mapping=typeof c.field_mapping==='string'?JSON.parse(c.field_mapping||'{}'):(c.field_mapping||{})
              const mappedCount = Object.keys(mapping).length
              return(<div key={c.id} className="card-level-1 p-4" style={{borderLeft:'3px solid var(--ai-blue-500)'}}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{c.name}</span>
                      <Tag color="blue">{t?.l}</Tag>
                      <span className={`inline-block w-2 h-2 rounded-full ${c.is_enabled?'bg-emerald-400':'bg-gray-400'}`}/>
                    </div>
                    <div className="text-[11px] flex items-center gap-1"><Link className="w-3 h-3 text-[var(--text-muted)]"/><span className="text-[var(--text-secondary)] truncate">{c.base_url||'未配置API地址'}</span></div>
                    <div className="text-[11px] text-[var(--text-muted)]">已映射 {mappedCount}/{t?.fields?.length||0} 个字段</div>
                    {c.last_sync_at&&<div className="text-[10px] text-[var(--text-muted)]">上次同步: {c.last_sync_at.slice(0,16)} {c.last_sync_status==='success'?<Tag color="green" style={{fontSize:10,margin:0}}>成功</Tag>:<Tag color="red" style={{fontSize:10,margin:0}}>失败</Tag>}</div>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <Button size="small" type="primary" loading={syncing===c.id} onClick={()=>doSync(c.id!)} icon={<Play className="w-3 h-3"/>}>同步</Button>
                    <Button size="small" type="text" icon={<Edit3 className="w-3 h-3"/>} onClick={()=>{setEditing({...c,field_mapping:typeof c.field_mapping==='string'?JSON.parse(c.field_mapping||'{}'):(c.field_mapping||{})});setIsEdit(true);setModalOpen(true)}}/>
                    <Popconfirm title="确认删除" onConfirm={()=>del(c.id!)} okText="确认" cancelText="取消"><Button size="small" type="text" danger icon={<Trash2 className="w-3 h-3"/>}/></Popconfirm>
                  </div>
                </div>
              </div>)
            })}
          </div>
        },
        {key:'logs',label:<span className="flex items-center gap-1"><Clock className="w-3 h-3"/>同步日志</span>,children:
          logs.length===0?<div className="card-level-1 p-8 text-center text-sm">暂无同步记录</div>:
          <div className="space-y-1.5">{logs.map(l=>(<div key={l.id} className="card-level-1 p-2.5 text-[11px] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Tag color={l.status==='success'?'green':'red'}>{l.status==='success'?'成功':'失败'}</Tag>
              <span className="font-medium">{l.api_config_name}</span>
              <span className="text-[var(--text-muted)]">{l.created_at?.slice(0,16)}</span>
            </div>
            <div className="flex items-center gap-3 text-[var(--text-muted)]">{l.status==='success'?<><span>抓取{l.records_fetched}</span><span>新增{l.records_inserted}</span><span>更新{l.records_updated}</span><span>{l.duration_ms}ms</span></>:<span className="text-red-400 truncate max-w-xs">{l.error_message}</span>}</div>
          </div>))}</div>
        },
      ]}/>

      <Modal title={isEdit?'编辑API':'新增API'} open={modalOpen} onCancel={()=>setModalOpen(false)} onOk={save} okText="保存" cancelText="取消" width={640} destroyOnClose>
        {editing&&<div className="space-y-4 mt-4">
          <div className="grid gap-3" style={{gridTemplateColumns:'1fr 140px'}}>
            <Input size="small" value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})} placeholder="API名称（如：苹果门店客流API）"/>
            <Select size="small" value={editing.api_type} onChange={v=>setEditing({...editing,api_type:v})} options={API_TYPES.map(t=>({value:t.v,label:t.l}))}/>
          </div>

          <div className="p-3 rounded-lg border border-[var(--border-default)] space-y-3">
            <span className="text-xs font-medium text-[var(--text-primary)]">API 地址</span>
            <Input size="small" value={editing.base_url} onChange={e=>setEditing({...editing,base_url:e.target.value})} placeholder="https://api.example.com/v1/flow/data"/>
            <div className="grid grid-cols-2 gap-3">
              <Select size="small" value={editing.auth_type} onChange={v=>setEditing({...editing,auth_type:v})} options={[{v:'none',l:'无需认证'},{v:'api_key',l:'API Key 认证'}]}/>
              {editing.auth_type!=='none'&&<Input size="small" value={editing.api_key} onChange={e=>setEditing({...editing,api_key:e.target.value})} placeholder="API Key"/>}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-[var(--border-default)] space-y-2">
            <span className="text-xs font-medium text-[var(--text-primary)]">字段映射</span>
            <div className="text-[10px] text-[var(--text-muted)]">左侧填API返回的JSON字段名，右侧为数据库表 {API_TYPES.find(t=>t.v===editing.api_type)?.t||''}</div>
            {targetFields.map(f=>{const mk=Object.entries(editing.field_mapping||{}).find(([,v])=>v===f)?.[0]||''
              return(<div key={f} className="flex items-center gap-2"><span className="text-[11px] w-10 shrink-0 text-right text-[var(--text-muted)]">← {f}</span><Input size="small" className="flex-1" value={mk} onChange={e=>{const m={...(editing.field_mapping||{})};if(e.target.value){m[e.target.value]=f}else{Object.keys(m).forEach(k=>{if(m[k]===f)delete m[k]})};setEditing({...editing,field_mapping:m})}} placeholder="API返回字段名"/></div>)})}
          </div>

          <div className="flex items-center gap-2"><Switch size="small" checked={!!editing.is_enabled} onChange={v=>setEditing({...editing,is_enabled:v?1:0})}/><span className="text-xs">启用</span></div>
        </div>}
      </Modal>
    </div>
  )
}
