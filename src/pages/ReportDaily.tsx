import React, { useEffect, useState } from 'react'
import { Input, Select, Switch, message, Modal, Popconfirm, Tag, Button, Checkbox, Radio } from 'antd'
import { api } from '../api/client'
import { Plus, Edit3, Trash2, Brain } from 'lucide-react'

const PERIOD_LABELS: Record<string,string> = {daily:'日报',weekly:'周报',monthly:'月报'}
const PERIOD_COLORS: Record<string,string> = {daily:'#0EA5E9',weekly:'#8B5CF6',monthly:'#EC4899'}
const PLATFORMS = [{value:'wechat_work',label:'企业微信'},{value:'dingtalk',label:'钉钉'},{value:'feishu',label:'飞书'}]
const METHODS = [{value:'webhook',label:'Webhook'},{value:'bot',label:'机器人'}]
const DATA_OPTIONS = [
  {g:'门店客流',items:[{v:'passerby',l:'过店人次'},{v:'enter',l:'进店人次'},{v:'passerby_people',l:'过店人数'},{v:'enter_people',l:'进店人数'},{v:'deep_browse',l:'深逛人数'},{v:'rate',l:'进店率'},{v:'stay',l:'停留时长'}]},
  {g:'商场客流',items:[{v:'mall_total',l:'商场总客流'},{v:'mall_weekday',l:'工作日客流'},{v:'mall_weekend',l:'周末客流'},{v:'mall_peak',l:'峰值客流'}]},
  {g:'对比指标',items:[{v:'yoy',l:'同比变化'},{v:'mom',l:'环比变化'}]},
]
const CHART_TYPES = [
  {v:'trend_pass_enter',l:'过店&进店趋势',desc:'14天折线+柱状组合图'},
  {v:'flow_index',l:'客流指数趋势',desc:'指数+同比双Y轴'},
  {v:'weekday_weekend',l:'工作日VS周末',desc:'工作日/周末客流对比'},
  {v:'heatmap',l:'时段热力',desc:'周几×日期热力图'},
  {v:'enter_rate',l:'进店率趋势',desc:'进店率折线图'},
  {v:'stay_trend',l:'停留时长趋势',desc:'平均停留时长折线图'},
]

interface ReportConfig {
  id?:number; name:string; period:string; data_fields:string[];
  push_platform:string; push_method:string; push_url:string; push_time:string;
  recipients:string; ai_model_id:number|null; ai_interpretation:number;
  push_mode:string; chart_type:string; ai_system_prompt:string; ai_prompt_template:string;
  is_enabled:number; description:string;
}

export const ReportDaily: React.FC = () => {
  const [configs, setConfigs] = useState<ReportConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ReportConfig>(emptyForm())
  const [isEdit, setIsEdit] = useState(false)
  const [aiModels, setAiModels] = useState<any[]>([])
  const [userList, setUserList] = useState<any[]>([])

  function emptyForm(): ReportConfig {
    return {name:'',period:'daily',data_fields:['passerby','enter','rate','stay'],push_platform:'wechat_work',push_method:'webhook',push_url:'',push_time:'08:00',recipients:'',ai_model_id:null,ai_interpretation:0,push_mode:'data',chart_type:'',ai_system_prompt:'',ai_prompt_template:'',is_enabled:1,description:''}
  }

  const load = () => {
    setLoading(true)
    Promise.all([api.get<any[]>('/report/configs'),api.get<any[]>('/config/ai-models'),api.get<any[]>('/admin/users')])
      .then(([c,m,u])=>{setConfigs(c||[]);setAiModels(m||[]);setUserList(u||[])}).finally(()=>setLoading(false))
  }
  useEffect(()=>{load()},[])

  const save = async () => {
    try {
      if(isEdit&&editing.id){await api.put(`/report/configs/${editing.id}`,editing);message.success('已更新')}
      else{await api.post('/report/configs',editing);message.success('已创建')}
      setModalOpen(false);load()
    }catch{message.error('保存失败')}
  }
  const del = async(id:number)=>{await api.delete(`/report/configs/${id}`);message.success('已删除');load()}
  const openCreate = ()=>{setEditing(emptyForm());setIsEdit(false);setModalOpen(true)}
  const openEdit = (c:ReportConfig)=>{setEditing({...c,data_fields:typeof c.data_fields==='string'?JSON.parse(c.data_fields):(c.data_fields||[])});setIsEdit(true);setModalOpen(true)}

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-base font-semibold text-[var(--text-primary)]">日周月报</h2><p className="text-xs text-[var(--text-muted)] mt-1">配置推送报告，支持企微/钉钉/飞书，可推送数据指标或数据图表，结合AI解读</p></div>
        <button onClick={openCreate} className="filter-btn-primary flex items-center gap-1.5"><Plus className="w-3.5 h-3.5"/>新增报告</button>
      </div>

      {loading?<div className="text-xs text-[var(--text-muted)] p-8 text-center">加载中...</div>:configs.length===0?<div className="card-level-1 p-12 text-center text-sm text-[var(--text-muted)]">暂无报告配置，点击右上角创建</div>:
       <div className="grid grid-cols-1 gap-3">
        {configs.map(c=>{
          const period=c.period||'daily';const platform=PLATFORMS.find(p=>p.value===c.push_platform)
          const fields=typeof c.data_fields==='string'?JSON.parse(c.data_fields):(c.data_fields||[])
          const aiModel=aiModels.find(m=>m.id===c.ai_model_id)
          return(<div key={c.id} className="card-level-1 p-4" style={{borderLeft:`3px solid ${PERIOD_COLORS[period]}`}}>
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2"><Tag color={PERIOD_COLORS[period]}>{PERIOD_LABELS[period]}</Tag><span className="text-sm font-semibold text-[var(--text-primary)]">{c.name}</span><span className={`inline-block w-2 h-2 rounded-full ${c.is_enabled?'bg-emerald-400':'bg-gray-400'}`}/></div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
                  <div><span className="text-[var(--text-muted)]">平台：</span>{platform?.label} {c.push_method}</div>
                  <div><span className="text-[var(--text-muted)]">日程：</span>{c.push_time}</div>
                  <div><span className="text-[var(--text-muted)]">模式：</span>{c.push_mode==='chart'?<Tag color="purple" style={{fontSize:10,margin:0}}>📊 {CHART_TYPES.find(t=>t.v===c.chart_type)?.l||'图表'}</Tag>:<span>{fields.length}项指标</span>}</div>
                  <div>{c.ai_interpretation?<Tag color="purple" style={{fontSize:10,margin:0}}><Brain className="w-3 h-3 inline mr-0.5"/>{aiModel?.name||'AI解读'}</Tag>:<span className="text-[var(--text-muted)]">无AI</span>}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-3">
                <Button size="small" type="text" icon={<Edit3 className="w-3 h-3"/>} onClick={()=>openEdit(c)}/>
                <Popconfirm title="确认删除" onConfirm={()=>del(c.id!)} okText="确认" cancelText="取消"><Button size="small" type="text" danger icon={<Trash2 className="w-3 h-3"/>}/></Popconfirm>
              </div>
            </div>
          </div>)
        })}
      </div>}

      <Modal title={isEdit?'编辑报告':'新增报告'} open={modalOpen} onCancel={()=>setModalOpen(false)} onOk={save} okText="保存" cancelText="取消" width={700} destroyOnClose>
        {editing&&<div className="space-y-4 mt-4">
          {/* 基本信息 */}
          <div className="p-3 rounded-lg border border-[var(--border-default)] space-y-3">
            <span className="text-xs font-medium text-[var(--text-primary)]">📋 基本信息</span>
            <div className="grid gap-3" style={{gridTemplateColumns:'1fr 100px 100px'}}>
              <Input size="small" value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})} placeholder="报告名称"/>
              <Select size="small" value={editing.period} onChange={v=>setEditing({...editing,period:v})} options={Object.entries(PERIOD_LABELS).map(([k,v])=>({value:k,label:v}))}/>
              <div className="flex items-center gap-2"><Switch size="small" checked={!!editing.is_enabled} onChange={v=>setEditing({...editing,is_enabled:v?1:0})}/><span className="text-[11px]">启用</span></div>
            </div>
          </div>

          {/* 推送内容 */}
          <div className="p-3 rounded-lg border border-[var(--border-default)] space-y-3">
            <span className="text-xs font-medium text-[var(--text-primary)]">📊 推送内容</span>
            <div className="flex items-center gap-3">
              <Radio.Group size="small" value={editing.push_mode||'data'} onChange={e=>setEditing({...editing,push_mode:e.target.value})}>
                <Radio.Button value="data">数据指标</Radio.Button>
                <Radio.Button value="chart">数据图表</Radio.Button>
              </Radio.Group>
            </div>
            {editing.push_mode==='data'?<div className="space-y-2">
              {DATA_OPTIONS.map(g=><div key={g.g}><span className="text-[10px] text-[var(--text-muted)]">{g.g}</span><div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">{g.items.map(d=><Checkbox key={d.v} checked={(editing.data_fields||[]).includes(d.v)} onChange={e=>{const f=editing.data_fields||[];setEditing({...editing,data_fields:e.target.checked?[...f,d.v]:f.filter(x=>x!==d.v)})}}><span className="text-[11px]">{d.l}</span></Checkbox>)}</div></div>)}
            </div>:<Select size="small" value={editing.chart_type} onChange={v=>setEditing({...editing,chart_type:v})} options={CHART_TYPES.map(t=>({value:t.v,label:`${t.l} - ${t.desc}`}))} style={{width:'100%'}} placeholder="选择推送的图表"/>}
          </div>

          {/* 推送配置 */}
          <div className="p-3 rounded-lg border border-[var(--border-default)] space-y-3">
            <span className="text-xs font-medium text-[var(--text-primary)]">📤 推送配置</span>
            <div className="grid grid-cols-2 gap-3">
              <Select size="small" value={editing.push_platform} onChange={v=>setEditing({...editing,push_platform:v})} options={PLATFORMS}/>
              <Select size="small" value={editing.push_method} onChange={v=>setEditing({...editing,push_method:v})} options={METHODS}/>
            </div>
            <Input size="small" value={editing.push_url} onChange={e=>setEditing({...editing,push_url:e.target.value})} placeholder={editing.push_method==='webhook'?'Webhook URL':'机器人 Key'}/>
            <div className="grid grid-cols-2 gap-3">
              <Select size="small" value={editing.push_time} onChange={v=>setEditing({...editing,push_time:v})} options={editing.period==='daily'?[{value:'08:00',label:'每日 08:00'},{value:'09:00',label:'每日 09:00'},{value:'18:00',label:'每日 18:00'}]:editing.period==='weekly'?[{value:'Mon 10:00',label:'周一 10:00'},{value:'Mon 08:00',label:'周一 08:00'}]:[{value:'01 09:00',label:'每月1号 09:00'}]}/>
              <Select size="small" mode="multiple" value={editing.recipients?editing.recipients.split(',').filter(Boolean):[]} onChange={v=>setEditing({...editing,recipients:v.join(',')})} placeholder="选择接收人" options={userList.map((u:any)=>({value:u.username,label:`${u.display_name||u.username}`}))}/>
            </div>
          </div>

          {/* AI 解读 */}
          <div className="p-3 rounded-lg border border-[var(--border-default)] space-y-3">
            <div className="flex items-center justify-between"><span className="text-xs font-medium text-[var(--text-primary)]">🤖 AI 大模型解读</span><Switch size="small" checked={!!editing.ai_interpretation} onChange={v=>setEditing({...editing,ai_interpretation:v?1:0})}/></div>
            {!!editing.ai_interpretation&&<>
              <Select size="small" value={editing.ai_model_id} onChange={v=>setEditing({...editing,ai_model_id:v})} allowClear placeholder="选择已配置的AI模型" options={aiModels.map((m:any)=>({value:m.id,label:`${m.name} (${m.provider})`}))} style={{width:'100%'}}/>
              <div><label className="text-[10px] text-[var(--text-muted)] block mb-1">系统提示词（定义AI角色）</label><Input.TextArea size="small" value={editing.ai_system_prompt||''} onChange={e=>setEditing({...editing,ai_system_prompt:e.target.value})} rows={2} placeholder="你是一个客流数据分析专家，请基于以下数据给出专业分析..."/></div>
              <div><label className="text-[10px] text-[var(--text-muted)] block mb-1">报告提示词（生成报告内容）</label><Input.TextArea size="small" value={editing.ai_prompt_template||''} onChange={e=>setEditing({...editing,ai_prompt_template:e.target.value})} rows={3} placeholder="请分析以下客流数据: {data}，给出趋势判断、异常标注、优化建议。格式: Markdown"/></div>
            </>}
          </div>

          <Input.TextArea size="small" value={editing.description} onChange={e=>setEditing({...editing,description:e.target.value})} rows={2} placeholder="备注"/>
        </div>}
      </Modal>
    </div>
  )
}
