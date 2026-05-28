import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Modal, Input, Select, Switch, Popconfirm, message, Tag, Button, InputNumber, Radio } from 'antd'
import { Plus, Edit3, Trash2, Send, CheckCircle2, Brain, MessageSquare, RadioTower } from 'lucide-react'

const CHANNEL_INFO: Record<string,{label:string;color:string}> = {
  dingtalk: {label:'钉钉',color:'#0089FF'}, wechat_work: {label:'企业微信',color:'#07C160'},
  feishu: {label:'飞书',color:'#3370FF'}, email: {label:'邮件',color:'#EA4335'},
}

/* ═══════════════════════════════════════════════
   Tab1: 消息配置
   ═══════════════════════════════════════════════ */
const MsgTemplateTab: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([])
  const [aiModels, setAiModels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>({name:'',template_type:'text',content:'',use_ai:0,ai_model_id:null,ai_prompt:'',is_enabled:1})
  const [isEdit, setIsEdit] = useState(false)

  const load = () => {setLoading(true);Promise.all([api.get<any[]>('/config/message-templates'),api.get<any[]>('/config/ai-models')]).then(([t,m])=>{setTemplates(t||[]);setAiModels(m||[])}).finally(()=>setLoading(false))}
  useEffect(()=>{load()},[])

  const save = async()=>{
    try{if(isEdit){await api.put(`/config/message-templates/${editing.id}`,editing);message.success('已更新')}else{await api.post('/config/message-templates',editing);message.success('已创建')};setModalOpen(false);load()}catch{message.error('保存失败')}
  }
  const del = async(id:number)=>{await api.delete(`/config/message-templates/${id}`);message.success('已删除');load()}

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><p className="text-xs text-[var(--text-muted)]">配置预警消息格式模板，支持文本/Markdown，可选AI大模型生成内容</p></div>
        <button onClick={()=>{setEditing({name:'',template_type:'text',content:'',use_ai:0,ai_model_id:null,ai_prompt:'',is_enabled:1});setIsEdit(false);setModalOpen(true)}} className="filter-btn-primary flex items-center gap-1.5"><Plus className="w-3.5 h-3.5"/>新增模板</button>
      </div>
      {loading?<div className="p-8 text-center text-xs text-[var(--text-muted)]">加载中...</div>:templates.length===0?<div className="card-level-1 p-12 text-center text-sm text-[var(--text-muted)]">暂无消息模板</div>:
       templates.map(t=>(<div key={t.id} className="card-level-1 p-4" style={{borderLeft:'3px solid var(--ai-blue-500)'}}>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2"><span className="text-sm font-semibold text-[var(--text-primary)]">{t.name}</span><Tag color={t.template_type==='markdown'?'purple':'blue'}>{t.template_type==='markdown'?'Markdown':'纯文本'}</Tag><span className={`inline-block w-2 h-2 rounded-full ${t.is_enabled?'bg-emerald-400':'bg-gray-400'}`}/></div>
            {t.content&&<div className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg-tertiary)] p-2 rounded truncate">{t.content}</div>}
            <div className="flex items-center gap-3 text-[11px]">
              {t.use_ai?<><Tag color="purple"><Brain className="w-3 h-3 inline mr-0.5"/>AI生成</Tag><span className="text-[var(--text-muted)]">{aiModels.find(m=>m.id===t.ai_model_id)?.name||'未选模型'}</span></>:<span className="text-[var(--text-muted)]">固定模板</span>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="small" type="text" icon={<Edit3 className="w-3 h-3"/>} onClick={()=>{setEditing({...t});setIsEdit(true);setModalOpen(true)}}/>
            <Popconfirm title="确认删除" onConfirm={()=>del(t.id)} okText="确认" cancelText="取消"><Button size="small" type="text" danger icon={<Trash2 className="w-3 h-3"/>}/></Popconfirm>
          </div>
        </div>
      </div>))}

      <Modal title={isEdit?'编辑消息模板':'新增消息模板'} open={modalOpen} onCancel={()=>setModalOpen(false)} onOk={save} okText="保存" cancelText="取消" width={600} destroyOnClose>
        {editing&&<div className="space-y-4 mt-4">
          <div className="grid gap-3" style={{gridTemplateColumns:'1fr 120px'}}>
            <Input size="small" value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})} placeholder="模板名称"/>
            <Select size="small" value={editing.template_type} onChange={v=>setEditing({...editing,template_type:v})} options={[{value:'text',label:'纯文本'},{value:'markdown',label:'Markdown'}]}/>
          </div>
          <div className="p-3 rounded-lg border border-[var(--border-default)] space-y-3">
            <div className="flex items-center justify-between"><span className="text-xs font-medium text-[var(--text-primary)]">消息内容</span><div className="flex items-center gap-2"><span className="text-[10px] text-[var(--text-muted)]">支持变量：</span>{['{store_name}','{metric_name}','{current_value}','{threshold}','{date}'].map(v=><button key={v} onClick={()=>setEditing({...editing,content:(editing.content||'')+v})} className="text-[9px] px-1 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--ai-blue-500)] hover:bg-[var(--ai-blue-500)] hover:text-white">{v}</button>)}</div></div>
            <Input.TextArea size="small" value={editing.content} onChange={e=>setEditing({...editing,content:e.target.value})} rows={4} placeholder="【客流预警】{store_name} {metric_name}达到{threshold}，当前值{current_value}，请及时关注。"/>
          </div>
          <div className="p-3 rounded-lg border border-[var(--border-default)] space-y-3">
            <div className="flex items-center justify-between"><span className="text-xs font-medium text-[var(--text-primary)]">AI 增强</span><Switch size="small" checked={!!editing.use_ai} onChange={v=>setEditing({...editing,use_ai:v?1:0})}/></div>
            {!!editing.use_ai&&<>
              <Select size="small" value={editing.ai_model_id} onChange={v=>setEditing({...editing,ai_model_id:v})} allowClear placeholder="选择AI模型" options={aiModels.map((m:any)=>({value:m.id,label:`${m.name} (${m.provider})`}))} style={{width:'100%'}}/>
              <div><label className="text-[10px] text-[var(--text-muted)] block mb-1">AI提示词</label><Input.TextArea size="small" value={editing.ai_prompt} onChange={e=>setEditing({...editing,ai_prompt:e.target.value})} rows={2} placeholder="请基于以下预警数据分析门店异常原因并给出运营建议..."/></div>
            </>}
          </div>
          <div className="flex items-center gap-2"><Switch size="small" checked={!!editing.is_enabled} onChange={v=>setEditing({...editing,is_enabled:v?1:0})}/><span className="text-xs text-[var(--text-secondary)]">启用</span></div>
        </div>}
      </Modal>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Tab2: 通道配置
   ═══════════════════════════════════════════════ */
const PushChannelTab: React.FC = () => {
  const [channels, setChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>({name:'',channel:'wechat_work',webhook_url:'',bot_key:'',smtp_host:'',smtp_port:465,smtp_user:'',smtp_pass:'',recipients:'',is_enabled:1,is_default:0})
  const [isEdit, setIsEdit] = useState(false)
  const [testing, setTesting] = useState<number|null>(null)
  const [testMsg, setTestMsg] = useState<Record<number,string>>({})

  const load=()=>{setLoading(true);api.get<any[]>('/config/push-channels').then(d=>setChannels(d||[])).finally(()=>setLoading(false))}
  useEffect(()=>{load()},[])

  const save = async()=>{
    try{if(isEdit){await api.put(`/config/push-channels/${editing.id}`,editing);message.success('已更新')}else{await api.post('/config/push-channels',editing);message.success('已创建')};setModalOpen(false);load()}catch{message.error('保存失败')}
  }
  const del = async(id:number)=>{await api.delete(`/config/push-channels/${id}`);message.success('已删除');load()}
  const testPush = async(id:number)=>{setTesting(id);try{const r=await api.post<any>(`/config/push-channels/${id}/test`,{});setTestMsg({...testMsg,[id]:r.message})}catch{setTestMsg({...testMsg,[id]:'请求失败'})}finally{setTesting(null)}}

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-muted)]">配置预警消息推送通道：企微/飞书/钉钉/邮件/站内信</p>
        <button onClick={()=>{setEditing({name:'',channel:'wechat_work',webhook_url:'',bot_key:'',smtp_host:'',smtp_port:465,smtp_user:'',smtp_pass:'',recipients:'',is_enabled:1,is_default:0});setIsEdit(false);setModalOpen(true)}} className="filter-btn-primary flex items-center gap-1.5"><Plus className="w-3.5 h-3.5"/>新增通道</button>
      </div>
      {loading?<div className="p-8 text-center text-xs text-[var(--text-muted)]">加载中...</div>:channels.length===0?<div className="card-level-1 p-12 text-center text-sm text-[var(--text-muted)]">暂无推送通道</div>:
       channels.map(c=>{
         const info=CHANNEL_INFO[c.channel]||{label:c.channel,color:'#64748B'}
         const isEmail=c.channel==='email'
         return(<div key={c.id} className="card-level-1 p-4" style={{borderLeft:`3px solid ${info.color}`}}>
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2"><span className="text-sm font-semibold text-[var(--text-primary)]">{c.name}</span><Tag color={info.color}>{info.label}</Tag>{!!c.is_default&&<CheckCircle2 className="w-3.5 h-3.5 text-amber-400"/>}<span className={`inline-block w-2 h-2 rounded-full ${c.is_enabled?'bg-emerald-400':'bg-gray-400'}`}/></div>
              {isEmail?<div className="text-[11px] space-y-1"><div><span className="text-[var(--text-muted)]">SMTP：</span>{c.smtp_host||'未配置'}:{c.smtp_port}</div><div><span className="text-[var(--text-muted)]">发件：</span>{c.smtp_user||'未配置'}</div></div>:
              <div className="text-[11px]"><span className="text-[var(--text-muted)]">Webhook：</span><span className={c.webhook_url?'text-emerald-400':'text-[var(--text-muted)]'}>{c.webhook_url?'✓ 已配置':'✗ 未配置'}</span></div>}
              {testMsg[c.id]&&<div className={`text-[10px] ${testMsg[c.id].includes('✓')?'text-emerald-400':'text-red-400'}`}>{testMsg[c.id]}</div>}
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-3">
              <Button size="small" type="text" loading={testing===c.id} onClick={()=>testPush(c.id)} icon={<Send className="w-3 h-3"/>} title="测试"/>
              <Button size="small" type="text" icon={<Edit3 className="w-3 h-3"/>} onClick={()=>{setEditing({...c});setIsEdit(true);setModalOpen(true)}}/>
              <Popconfirm title="确认删除" onConfirm={()=>del(c.id)} okText="确认" cancelText="取消"><Button size="small" type="text" danger icon={<Trash2 className="w-3 h-3"/>}/></Popconfirm>
            </div>
          </div>
        </div>)
      })}

      <Modal title={isEdit?'编辑通道':'新增通道'} open={modalOpen} onCancel={()=>setModalOpen(false)} onOk={save} okText="保存" cancelText="取消" width={580} destroyOnClose>
        {editing&&<div className="space-y-4 mt-4">
          <div className="grid gap-3" style={{gridTemplateColumns:'1fr 160px'}}>
            <Input size="small" value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})} placeholder="通道名称"/>
            <Select size="small" value={editing.channel} onChange={v=>setEditing({...editing,channel:v})} options={Object.entries(CHANNEL_INFO).map(([k,v])=>({value:k,label:v.label}))}/>
          </div>
          {editing.channel==='email'?<>
            <div className="grid grid-cols-2 gap-3"><Input size="small" value={editing.smtp_host} onChange={e=>setEditing({...editing,smtp_host:e.target.value})} placeholder="SMTP服务器"/><InputNumber size="small" value={editing.smtp_port} onChange={v=>setEditing({...editing,smtp_port:v||465})} style={{width:'100%'}} placeholder="端口"/></div>
            <div className="grid grid-cols-2 gap-3"><Input size="small" value={editing.smtp_user} onChange={e=>setEditing({...editing,smtp_user:e.target.value})} placeholder="发件账号"/><Input.Password size="small" value={editing.smtp_pass} onChange={e=>setEditing({...editing,smtp_pass:e.target.value})} placeholder="SMTP授权码"/></div>
          </>:<Input size="small" value={editing.webhook_url} onChange={e=>setEditing({...editing,webhook_url:e.target.value})} placeholder="Webhook URL"/>}
          {editing.channel!=='email'&&<Input size="small" value={editing.bot_key} onChange={e=>setEditing({...editing,bot_key:e.target.value})} placeholder="密钥（钉钉加签/企微secret）"/>}
          <Input size="small" value={editing.recipients} onChange={e=>setEditing({...editing,recipients:e.target.value})} placeholder="默认接收人，多个用,分隔"/>
          <div className="flex items-center gap-4"><div className="flex items-center gap-1.5"><Switch size="small" checked={!!editing.is_enabled} onChange={v=>setEditing({...editing,is_enabled:v?1:0})}/><span className="text-xs">启用</span></div><div className="flex items-center gap-1.5"><Switch size="small" checked={!!editing.is_default} onChange={v=>setEditing({...editing,is_default:v?1:0})}/><span className="text-xs">默认通道</span></div></div>
        </div>}
      </Modal>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   主页面：消息配置 + 通道配置 双 Tab
   ═══════════════════════════════════════════════ */
export const PushConfig: React.FC = () => {
  const [tab, setTab] = useState<'msg'|'channel'>('msg')
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-base font-semibold text-[var(--text-primary)]">消息推送</h2>
      <div className="flex gap-1 border-b border-[var(--border-subtle)]">
        {[{k:'msg',l:'消息配置',icon:MessageSquare},{k:'channel',l:'通道配置',icon:RadioTower}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k as any)} className={`px-4 py-2 text-xs font-medium flex items-center gap-1.5 transition-colors ${tab===t.k?'border-b-2 border-[var(--ai-blue-500)] text-[var(--ai-blue-500)]':'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}><t.icon className="w-3.5 h-3.5"/>{t.l}</button>
        ))}
      </div>
      {tab==='msg'?<MsgTemplateTab/>:<PushChannelTab/>}
    </div>
  )
}
