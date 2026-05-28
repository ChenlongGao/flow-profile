import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Modal, Input, Select, InputNumber, Switch, message, Tag, Button, Checkbox, Tabs, Table } from 'antd'
import { Edit3, Copy } from 'lucide-react'

/* ═══ 模型元信息 ═══ */
const MODEL_META: Record<string,{label:string;color:string;tag:string;icon:string}> = {
  zscore:    {label:'Z-Score 统计检测', color:'#0EA5E9', tag:'基础筛查', icon:'🔍'},
  iforest:   {label:'Isolation Forest 孤立森林', color:'#8B5CF6', tag:'复合检测', icon:'🌲'},
  sarima:    {label:'SARIMA 残差检测', color:'#F59E0B', tag:'时序结构', icon:'📈'},
  prophet:   {label:'Prophet 预测偏差', color:'#10B981', tag:'高精度预测', icon:'🔮'},
}

/* ═══ 核心数据集 (只读) ═══ */
const CORE_DATASET_FIELDS = [
  {group:'基础客流',fields:['pass_by_count(过店人次)','enter_count(进店人次)','pass_by_people(过店人数)','enter_people(进店人数)','avg_stay_minutes(停留时长)']},
  {group:'画像数据',fields:['male_ratio(男性占比)','female_ratio(女性占比)','age_18_24_ratio','age_25_34_ratio','age_35_44_ratio','age_45_plus_ratio']},
  {group:'衍生指标',fields:['entry_rate(进店率=进店/过店)','pass_ratio(过店占比=门店过店/商场客流)','enter_ratio(进店占比=门店进店/商场客流)']},
  {group:'时间维度',fields:['data_date(数据日期)','weekday(星期几)','month(月份)','season(季节)','is_holiday(是否节假日)']},
]

/* ═══ 门店客流指标 ═══ */
const TARGET_METRICS = [
  {v:'enter_count',l:'进店人次'},{v:'pass_by_count',l:'过店人次'},{v:'entry_rate',l:'进店率'},
]

interface WarningModel {
  id:number; name:string; model_type:string; params:any; is_enabled:number; description:string;
  last_trained_at?:string; training_status?:string;
}
interface ModelAlert{
  id:number; model_type:string; store_id:string; store_name:string; alert_date:string;
  alert_level:string; alert_category:string; metrics:any; attribution:string; alert_message:string;
  is_acknowledged:number; is_false_alarm:number;
}

export const WarningModels: React.FC = () => {
  const [models, setModels] = useState<WarningModel[]>([])
  const [alerts, setAlerts] = useState<ModelAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('models')
  const [configOpen, setConfigOpen] = useState(false)
  const [editing, setEditing] = useState<WarningModel|null>(null)
  const [editParams, setEditParams] = useState<any>({})
  const [storeOverrideOpen, setStoreOverrideOpen] = useState(false)
  const [storeParams, setStoreParams] = useState<any[]>([])
  const [selectedModelId, setSelectedModelId] = useState<number|null>(null)

  const load = ()=>{
    setLoading(true)
    Promise.all([
      api.get<any[]>('/warning/models'),
      api.get<any[]>('/warning/models/alerts?limit=100'),
    ]).then(([m,a])=>{
      setModels((m||[]).map(x=>({...x,params:typeof x.params==='string'?JSON.parse(x.params):(x.params||{})})))
      setAlerts(a||[])
    }).finally(()=>setLoading(false))
  }
  useEffect(()=>{load()},[])

  const saveModel = async()=>{
    if(!editing) return
    try{
      await api.put(`/warning/models/${editing.id}`,{...editing,params:editParams})
      message.success('已更新');setConfigOpen(false);load()
    }catch{message.error('保存失败')}
  }

  const loadStoreParams = async(mid:number)=>{
    const d = await api.get<any[]>(`/warning/models/${mid}/store-params`)
    setStoreParams(d||[]);setSelectedModelId(mid);setStoreOverrideOpen(true)
  }

  const saveStoreParam = async(store_id:string, params:any)=>{
    if(!selectedModelId) return
    await api.put(`/warning/models/${selectedModelId}/store-params`,{store_id,params})
    message.success('已保存');loadStoreParams(selectedModelId)
  }

  const deleteStoreParam = async(store_id:string)=>{
    if(!selectedModelId) return
    await api.delete(`/warning/models/${selectedModelId}/store-params/${store_id}`)
    message.success('已恢复默认');loadStoreParams(selectedModelId)
  }

  const alertFeedback = async(alert:ModelAlert, isFalse:boolean)=>{
    await api.post('/warning/models/alerts/feedback',{id:alert.id,is_acknowledged:1,is_false_alarm:isFalse?1:0})
    message.success(isFalse?'已标记为误报':'已确认异常');load()
  }

  /* ─── 渲染参数表单 ─── */
  const renderParamsForm = (mt:string, p:any, onChange:(k:string,v:any)=>void) => {
    switch(mt){
      case 'zscore':
        return <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><InputNumber size="small" addonBefore="统计窗口" value={p.stat_window_days} onChange={v=>onChange('stat_window_days',v)} suffix="天" min={30} max={365} style={{width:'100%'}}/></div>
            <div><InputNumber size="small" addonBefore="异常过滤σ" value={p.outlier_filter_sigma} onChange={v=>onChange('outlier_filter_sigma',v)} min={3} max={10} step={0.5} style={{width:'100%'}}/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><InputNumber size="small" addonBefore="⚠ 一般Z值" value={p.warning_z} onChange={v=>onChange('warning_z',v)} min={2} max={3} step={0.1} style={{width:'100%'}}/></div>
            <div><InputNumber size="small" addonBefore="🚨 严重Z值" value={p.critical_z} onChange={v=>onChange('critical_z',v)} min={3} max={4} step={0.1} style={{width:'100%'}}/></div>
          </div>
          <div><label className="text-[10px] text-[var(--text-muted)] mb-1 block">分层维度</label><Checkbox.Group size="small" value={p.partition_dims||[]} onChange={v=>onChange('partition_dims',v)} options={[{value:'weekday',label:'星期'},{value:'month',label:'月份'},{value:'quarter',label:'季度'}]}/></div>
          <div><label className="text-[10px] text-[var(--text-muted)] mb-1 block">检测指标</label><Checkbox.Group size="small" value={p.target_metrics||[]} onChange={v=>onChange('target_metrics',v)} options={TARGET_METRICS.map(t=>({value:t.v,label:t.l}))}/></div>
        </div>
      case 'iforest':
        return <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><InputNumber size="small" addonBefore="训练窗口" value={p.train_window_days} onChange={v=>onChange('train_window_days',v)} suffix="天" min={90} max={365} style={{width:'100%'}}/></div>
            <div><Select size="small" value={p.retrain_frequency} onChange={v=>onChange('retrain_frequency',v)} options={[{v:'daily',l:'每日'},{v:'weekly',l:'每周'},{v:'monthly',l:'每月'}]} placeholder="重训练频率"/></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><InputNumber size="small" addonBefore="异常率" value={p.contamination} onChange={v=>onChange('contamination',v)} min={0.005} max={0.05} step={0.005} style={{width:'100%'}}/></div>
            <div><InputNumber size="small" addonBefore="决策树" value={p.n_estimators} onChange={v=>onChange('n_estimators',v)} min={100} max={500} style={{width:'100%'}}/></div>
            <div/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><InputNumber size="small" addonBefore="一般得分" value={p.warning_score} onChange={v=>onChange('warning_score',v)} min={0.5} max={0.8} step={0.05} style={{width:'100%'}}/></div>
            <div><InputNumber size="small" addonBefore="严重得分" value={p.critical_score} onChange={v=>onChange('critical_score',v)} min={0.7} max={0.9} step={0.05} style={{width:'100%'}}/></div>
          </div>
          <div>
            <label className="text-[10px] text-[var(--text-muted)] mb-1 block">参与特征（全选默认）</label>
            <Checkbox.Group size="small" value={p.selected_features||[]} onChange={v=>onChange('selected_features',v)} options={[
              {value:'pass_by_count',label:'过店人次'},{value:'enter_count',label:'进店人次'},{value:'mall_enter',label:'商场客流'},
              {value:'pass_ratio',label:'过店占比'},{value:'enter_ratio',label:'进店占比'},{value:'entry_rate',label:'进店率'},
              {value:'enter_ma7',label:'进店7日均值'},{value:'enter_mom',label:'进店环比'},{value:'weekday',label:'星期'},{value:'month',label:'月份'},
            ]}/>
          </div>
        </div>
      case 'sarima':
        return <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><InputNumber size="small" addonBefore="训练窗口" value={p.train_window_days} onChange={v=>onChange('train_window_days',v)} suffix="天" min={90} max={365} style={{width:'100%'}}/></div>
            <div><Select size="small" value={p.retrain_frequency} onChange={v=>onChange('retrain_frequency',v)} options={[{v:'daily',l:'每日'},{v:'weekly',l:'每周'},{v:'monthly',l:'每月'}]}/></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><InputNumber size="small" addonBefore="主周期" value={p.primary_period} onChange={v=>onChange('primary_period',v)} min={7} style={{width:'100%'}}/></div>
            <div><InputNumber size="small" addonBefore="一般残差" value={p.warning_residual} onChange={v=>onChange('warning_residual',v)} min={0.1} max={0.3} step={0.05} style={{width:'100%'}}/></div>
            <div><InputNumber size="small" addonBefore="严重残差" value={p.critical_residual} onChange={v=>onChange('critical_residual',v)} min={0.2} max={0.4} step={0.05} style={{width:'100%'}}/></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5"><Switch size="small" checked={p.use_exog} onChange={v=>onChange('use_exog',v)}/><span className="text-[11px]">商场客流外生变量</span></div>
            <div className="flex items-center gap-1.5"><Switch size="small" checked={p.auto_arima} onChange={v=>onChange('auto_arima',v)}/><span className="text-[11px]">自动寻优p,d,q</span></div>
          </div>
        </div>
      case 'prophet':
        return <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><InputNumber size="small" addonBefore="训练窗口" value={p.train_window_days} onChange={v=>onChange('train_window_days',v)} suffix="天" min={180} max={730} style={{width:'100%'}}/></div>
            <div><Select size="small" value={p.retrain_frequency} onChange={v=>onChange('retrain_frequency',v)} options={[{v:'weekly',l:'每周'},{v:'monthly',l:'每月'},{v:'quarterly',l:'每季度'}]}/></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Select size="small" value={p.confidence_interval} onChange={v=>onChange('confidence_interval',v)} options={[{value:0.9,label:'90%'},{value:0.95,label:'95%'},{value:0.99,label:'99%'}]}/></div>
            <div><InputNumber size="small" addonBefore="一般偏差" value={p.warning_deviation} onChange={v=>onChange('warning_deviation',v)} min={0.1} max={0.2} step={0.05} style={{width:'100%'}}/></div>
            <div><InputNumber size="small" addonBefore="严重偏差" value={p.critical_deviation} onChange={v=>onChange('critical_deviation',v)} min={0.2} max={0.3} step={0.05} style={{width:'100%'}}/></div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5"><Switch size="small" checked={p.yearly_seasonality} onChange={v=>onChange('yearly_seasonality',v)}/><span className="text-[11px]">年季节性</span></div>
            <div className="flex items-center gap-1.5"><Switch size="small" checked={p.weekly_seasonality} onChange={v=>onChange('weekly_seasonality',v)}/><span className="text-[11px]">周季节性</span></div>
            <div className="flex items-center gap-1.5"><Switch size="small" checked={p.holidays_enabled} onChange={v=>onChange('holidays_enabled',v)}/><span className="text-[11px]">法定节假日</span></div>
          </div>
          {p.holidays_enabled&&<div><label className="text-[10px] text-[var(--text-muted)] mb-1 block">自定义节假日（逗号分隔，格式: 月-日,名）</label><Input size="small" value={(p.custom_holidays||[]).join(',')} onChange={e=>onChange('custom_holidays',e.target.value?e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean):[])} placeholder="06-18店庆, 06-19会员日"/></div>}
        </div>
      default: return null
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-base font-semibold text-[var(--text-primary)]">客流预警模型</h2><p className="text-xs text-[var(--text-muted)] mt-1">四层预警模型：Z-Score→Isolation Forest→SARIMA→Prophet，仅针对门店客流</p></div>
      </div>

      <Tabs size="small" activeKey={activeTab} onChange={setActiveTab} items={[
        {key:'models',label:'模型配置',children:
          loading?<div className="p-8 text-xs text-center">加载中...</div>:
          <div className="grid grid-cols-1 gap-3">
            {models.map(m=>{const meta=MODEL_META[m.model_type]||{label:m.model_type,color:'#64748B',tag:'',icon:'📋'};const p=m.params||{}
              return(<div key={m.id} className="card-level-1 p-4" style={{borderLeft:`3px solid ${meta.color}`}}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{meta.icon}</span>
                      <span className="text-sm font-semibold">{m.name}</span>
                      <Tag color={meta.color}>{meta.tag}</Tag>
                      <span className={`inline-block w-2 h-2 rounded-full ${m.is_enabled?'bg-emerald-400':'bg-gray-400'}`}/>
                    </div>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-[10px]">
                      {m.model_type==='zscore'&&<>
                        <div>⚙ 窗口:{p.stat_window_days}天 | 分层:{ (p.partition_dims||[]).join('/')||'无'}</div>
                        <div>⚠ Z≥{p.warning_z} | 🚨 Z≥{p.critical_z}</div>
                        <div>滤波σ:{p.outlier_filter_sigma} | 指标:{(p.target_metrics||['-']).join(',')}</div>
                      </>}
                      {m.model_type==='iforest'&&<>
                        <div>⚙ 窗口:{p.train_window_days}天 | 重训练:{p.retrain_frequency}</div>
                        <div>🌲 树:{p.n_estimators} | 异常率:{p.contamination}</div>
                        <div>⚠ ≥{p.warning_score} | 🚨 ≥{p.critical_score}</div>
                      </>}
                      {m.model_type==='sarima'&&<>
                        <div>⚙ 窗口:{p.train_window_days}天 | 重训练:{p.retrain_frequency}</div>
                        <div>📏 周期:{p.primary_period} | exog:{p.use_exog?'✓':'✗'} | autoARIMA:{p.auto_arima?'✓':'✗'}</div>
                        <div>⚠ ≥{p.warning_residual} | 🚨 ≥{p.critical_residual}</div>
                      </>}
                      {m.model_type==='prophet'&&<>
                        <div>⚙ 窗口:{p.train_window_days}天 | 重训练:{p.retrain_frequency}</div>
                        <div>🎯 CI:{Math.round((p.confidence_interval||0.95)*100)}% | 年:{p.yearly_seasonality?'✓':'✗'} 周:{p.weekly_seasonality?'✓':'✗'}</div>
                        <div>⚠ ≥{p.warning_deviation} | 🚨 ≥{p.critical_deviation}</div>
                      </>}
                    </div>
                    {m.last_trained_at&&<div className="text-[10px] text-[var(--text-muted)]">上次训练: {m.last_trained_at.slice(0,16)} · {m.training_status}</div>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <Switch size="small" checked={!!m.is_enabled} onChange={async v=>{await api.put(`/warning/models/${m.id}`,{is_enabled:v?1:0});load()}} title="启用/禁用"/>
                    <Button size="small" type="text" onClick={()=>{setEditing(m);setEditParams({...p});setConfigOpen(true)}} icon={<Edit3 className="w-3 h-3"/>} title="参数配置"/>
                    <Button size="small" type="text" onClick={()=>loadStoreParams(m.id)} icon={<Copy className="w-3 h-3"/>} title="门店个性化"/>
                  </div>
                </div>
              </div>)
            })}
          </div>
        },
        {key:'results',label:'预警结果',children:
          alerts.length===0?<div className="card-level-1 p-8 text-center text-sm">暂无预警记录（模型尚未执行计算）</div>:
          <Table size="small" dataSource={alerts.map((a,i)=>({...a,key:a.id||i}))} pagination={{pageSize:20}} scroll={{x:1100}} columns={[
            {title:'日期',dataIndex:'alert_date',width:100,render:v=><span className="text-[11px]">{v}</span>},
            {title:'门店',dataIndex:'store_name',width:120,render:v=><span className="text-[11px]">{v}</span>},
            {title:'模型',dataIndex:'model_type',width:90,render:v=>{const m=MODEL_META[v];return m?<Tag color={m.color}>{m.label.split(' ')[0]}</Tag>:<Tag>{v}</Tag>}},
            {title:'等级',dataIndex:'alert_level',width:80,render:v=><Tag color={v==='critical'?'red':'orange'}>{v==='critical'?'严重':'一般'}</Tag>},
            {title:'类别',dataIndex:'alert_category',width:90,render:v=><span className="text-[11px]">{v||'-'}</span>},
            {title:'归因',dataIndex:'attribution',width:180,render:v=><span className="text-[10px] text-[var(--text-secondary)]">{v||'-'}</span>},
            {title:'消息',dataIndex:'alert_message',ellipsis:true,render:v=><span className="text-[11px]">{v||'-'}</span>},
            {title:'操作',width:140,render:(_,a)=><div className="flex gap-1">
              {!a.is_acknowledged?<><Button size="small" type="link" onClick={()=>alertFeedback(a,false)} style={{fontSize:10,padding:0}}>✓确认</Button><Button size="small" type="link" danger onClick={()=>alertFeedback(a,true)} style={{fontSize:10,padding:0}}>✗误报</Button></>:<Tag color={a.is_false_alarm?'orange':'green'}>{a.is_false_alarm?'误报':'已确认'}</Tag>}
            </div>},
          ]}/>
        },
        {key:'dataset',label:'核心数据集',children:
          <div className="card-level-1 p-4 space-y-3 text-[11px]">
            <div className="flex items-center gap-2"><span className="text-xs font-medium">⚠ 只读 · 数据源: store_flow_data</span><Tag color="blue">仅门店数据</Tag></div>
            {CORE_DATASET_FIELDS.map(g=><div key={g.group} className="p-2 bg-[var(--bg-tertiary)] rounded"><span className="font-medium text-xs">{g.group}</span><div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">{g.fields.map(f=><code key={f} className="text-[10px] px-1 py-0.5 bg-[var(--bg-secondary)] rounded">{f}</code>)}</div></div>)}
          </div>
        },
      ]}/>

      {/* ── 参数配置弹窗 ── */}
      <Modal title={MODEL_META[editing?.model_type||'']?.icon+' '+editing?.name} open={configOpen} onCancel={()=>setConfigOpen(false)} onOk={saveModel} okText="保存" cancelText="取消" width={620} destroyOnClose>
        {editing&&<div className="space-y-4 mt-4 pt-3">
          <div className="p-3 rounded-lg border border-[var(--border-default)] space-y-3">
            <span className="text-xs font-medium">模型参数</span>
            {renderParamsForm(editing.model_type, editParams, (k,v)=>{setEditParams({...editParams,[k]:v})})}
          </div>
          <Input.TextArea size="small" value={editing.description} onChange={e=>setEditing({...editing,description:e.target.value})} rows={2} placeholder="备注"/>
        </div>}
      </Modal>

      {/* ── 门店个性化覆盖弹窗 ── */}
      <Modal title="门店个性化参数覆盖" open={storeOverrideOpen} onCancel={()=>setStoreOverrideOpen(false)} footer={null} width={580} destroyOnClose>
        <div className="space-y-2 mt-4 max-h-96 overflow-y-auto">
          {storeParams.map(sp=>(<div key={sp.store_id} className="flex items-center justify-between p-2 bg-[var(--bg-tertiary)] rounded text-[11px]">
            <div className="flex items-center gap-2"><Tag>{sp.store_id}</Tag><span className="text-[var(--text-muted)]">{JSON.stringify(sp.params).slice(0,60)}</span></div>
            <Button size="small" danger type="text" onClick={()=>deleteStoreParam(sp.store_id)}>恢复默认</Button>
          </div>))}
          <div className="pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-muted)] block mb-2">添加门店覆盖（输入门店ID并保存参数）</span>
            <div className="flex gap-2">
              <Input size="small" id="storeOverrideId" placeholder="门店ID" style={{width:120}}/>
              <Button size="small" onClick={()=>{const el=document.getElementById('storeOverrideId') as HTMLInputElement;if(el?.value){saveStoreParam(el.value,editParams);el.value=''}}}>添加</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
