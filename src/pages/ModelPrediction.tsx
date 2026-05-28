import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Modal, Input, Select, InputNumber, Switch, Popconfirm, message, Tag, Button, Checkbox } from 'antd'
import { Plus, Trash2, Edit3, Brain, Cloud, Wind, TreePine, CalendarDays, TrendingUp, AlertTriangle, ShieldAlert } from 'lucide-react'
import { COLORS } from '../config/echarts-theme'

/* ═══ 类型 ═══ */
interface FeatureConfig { weather: boolean; aqi: boolean; holiday: boolean; weekend: boolean; mall_flow: boolean }
interface PredictionModel { id: number; name: string; target_fields: string[]; feature_config: FeatureConfig; prophet_params: any; xgboost_params: any; prediction_horizon: number; is_enabled: number; description: string }
interface WarningModel { id: number; name: string; method: string; target_fields: string[]; feature_config: FeatureConfig; anomaly_threshold: number; lookback_days: number; sensitivity: string; is_enabled: number; description: string }

/* ═══ 常量 ═══ */
const TARGET_OPTIONS = [{value:'enter_count',label:'进店人次'},{value:'pass_by_count',label:'过店人次'},{value:'passerby_count',label:'过店人次'},{value:'entry_rate',label:'进店率'}]
const HORIZON_OPTIONS = [1,3,5,7,14,30]
const SENSITIVITY_OPTIONS = [{value:'low',label:'低 (减少误报)',color:'#10B981'},{value:'medium',label:'中 (平衡)',color:'#F59E0B'},{value:'high',label:'高 (灵敏捕获)',color:'#EF4444'}]
const METHOD_OPTIONS = [
  {value:'isolation_forest',label:'孤立森林异常检测',desc:'无监督异常检测，适合高维数据'},
  {value:'zscore',label:'Z-Score统计检测',desc:'3-sigma原则，适合正态分布指标'},
  {value:'sarima_residual',label:'SARIMA残差检测',desc:'时间序列残差异常检测'},
  {value:'prophet_residual',label:'Prophet预测偏差',desc:'基于Prophet预测偏差的异常判定'},
]
const parseModel = (m: any) => ({
  ...m,
  target_fields: typeof m.target_fields==='string'?JSON.parse(m.target_fields):(m.target_fields||[]),
  feature_config: typeof m.feature_config==='string'?JSON.parse(m.feature_config):(m.feature_config||{}),
  prophet_params: typeof m.prophet_params==='string'?JSON.parse(m.prophet_params):(m.prophet_params||{}),
  xgboost_params: typeof m.xgboost_params==='string'?JSON.parse(m.xgboost_params):(m.xgboost_params||{}),
})

type TabKey = 'prediction' | 'warning'

/* ═══ 特征开关组件（复用） ═══ */
const FeatureSwitches: React.FC<{fc:FeatureConfig; onChange:(k:string,v:boolean)=>void; showAqi?:boolean}> = ({fc,onChange,showAqi=true}) => {
  const items = [
    {k:'weather',i:Cloud,l:'天气 (气温/降水/风速/类型)'},
    ...(showAqi?[{k:'aqi',i:Wind,l:'AQI 空气质量 (AQI/PM2.5/PM10/O3/NO2)'}]:[]),
    {k:'holiday',i:CalendarDays,l:'假日 (法定假日/类型)'},
    {k:'weekend',i:CalendarDays,l:'周末标记'},
    {k:'mall_flow',i:TrendingUp,l:'商场客流 (mall_total_flow)'},
  ]
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map(f=>(<div key={f.k} className="flex items-center gap-2"><Switch size="small" checked={!!(fc as any)[f.k]} onChange={v=>onChange(f.k,v)}/><f.i className="w-3 h-3 text-[var(--text-muted)]"/><span className="text-[10px] text-[var(--text-secondary)]">{f.l}</span></div>))}
    </div>
  )
}

/* ═══════════════════════════════════════════
   主页面
   ═══════════════════════════════════════════ */
export const ModelPrediction: React.FC<{defaultTab?: TabKey; hideTabs?: boolean}> = ({defaultTab, hideTabs}) => {
  const [tab, setTab] = useState<TabKey>(defaultTab||'prediction')

  const [predModels, setPredModels] = useState<PredictionModel[]>([]); const [predLoading, setPredLoading] = useState(true)
  const [warnModels, setWarnModels] = useState<WarningModel[]>([]); const [warnLoading, setWarnLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false); const [editing, setEditing] = useState<any>({}); const [isEdit, setIsEdit] = useState(false)

  const loadPred = ()=>{setPredLoading(true);api.get<any[]>('/config/prediction-models').then(d=>setPredModels((d||[]).map(parseModel))).finally(()=>setPredLoading(false))}
  const loadWarn = ()=>{setWarnLoading(true);api.get<any[]>('/config/warning-models').then(d=>setWarnModels((d||[]).map(parseModel))).finally(()=>setWarnLoading(false))}
  useEffect(()=>{loadPred();loadWarn()},[])

  const isPred = tab === 'prediction'
  const models = isPred ? predModels : warnModels
  const loading = isPred ? predLoading : warnLoading

  const emptyPred = (): any => ({name:'',target_fields:['enter_count','pass_by_count'],feature_config:{weather:true,aqi:true,holiday:true,weekend:true,mall_flow:true},prophet_params:{seasonality_mode:'multiplicative',yearly_seasonality:true,weekly_seasonality:true,daily_seasonality:false,changepoint_prior_scale:0.05,holidays_prior_scale:10},xgboost_params:{n_estimators:300,max_depth:6,learning_rate:0.05,subsample:0.8,colsample_bytree:0.8,reg_alpha:0.1,reg_lambda:1},prediction_horizon:7,is_enabled:0,description:''})
  const emptyWarn = (): any => ({name:'',method:'isolation_forest',target_fields:['enter_count','pass_by_count'],feature_config:{weather:true,holiday:true,weekend:true,mall_flow:true,aqi:true},anomaly_threshold:0.05,lookback_days:30,sensitivity:'medium',is_enabled:0,description:''})

  const save = async () => {
    const ep = isPred ? '/config/prediction-models' : '/config/warning-models'
    try {
      if(isEdit&&editing.id){await api.put(`${ep}/${editing.id}`,editing);message.success('已更新')}
      else{await api.post(ep,editing);message.success('已创建')}
      setModalOpen(false); isPred ? loadPred() : loadWarn()
    }catch{message.error('保存失败')}
  }
  const del = async (id:number)=>{const ep=isPred?'/config/prediction-models':'/config/warning-models';await api.delete(`${ep}/${id}`).then(()=>{message.success('已删除');isPred?loadPred():loadWarn()}).catch(()=>message.error('删除失败'))}

  const openCreate = ()=>{setEditing(isPred?emptyPred():emptyWarn());setIsEdit(false);setModalOpen(true)}
  const openEdit = (m:any)=>{setEditing({...m});setIsEdit(true);setModalOpen(true)}

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">{defaultTab==='prediction'?'模型预测':'模型预警'}</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {isPred ? 'Prophet + XGBoost 融合模型 · 前端配置可行，后端预测服务待搭建' : '异常检测模型 · 双层检测自动标记异常客流日'}
          </p>
        </div>
        <button onClick={openCreate} className="filter-btn-primary flex items-center gap-1.5"><Plus className="w-3.5 h-3.5"/>新增模型</button>
      </div>

      {/* Tab */}
      {!hideTabs && (
      <div className="flex gap-1 border-b border-[var(--border-subtle)]">
        {[
          {k:'prediction' as const,l:'客流预测模型',i:TrendingUp,desc:'Prophet + XGBoost 融合预测'},
          {k:'warning' as const,l:'客流预警模型',i:AlertTriangle,desc:'异常检测 + 自动预警'},
        ].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)}
            className={`px-4 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${tab===t.k?'border-b-2 border-[var(--ai-blue-500)] text-[var(--ai-blue-500)]':'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
            <t.i className="w-3.5 h-3.5"/>{t.l}
          </button>
        ))}
      </div>
      )}

      {/* ═══ 预测 Tab 专属：可行性卡 ═══ */}
      {isPred && (
        <div className="grid grid-cols-2 gap-3">
          {[
            {icon:TrendingUp,title:'Prophet',items:['自动处理周/月/年季节性','节假日效应自动建模','缺失值/异常值鲁棒','开箱即用无需复杂调参'],color:COLORS.primary},
            {icon:Brain,title:'XGBoost',items:['捕捉天气/活动等外部特征','非线性关系建模精度高','特征重要性可解释性强','弥补Prophet对外部特征拟合不足'],color:'#8B5CF6'},
          ].map(m=>(<div key={m.title} className="card-level-1 p-3"><div className="flex items-center gap-2 mb-2"><m.icon className="w-4 h-4" style={{color:m.color}}/><span className="text-xs font-semibold" style={{color:m.color}}>{m.title}</span></div><ul className="space-y-1">{m.items.map((item,i)=>(<li key={i} className="text-[11px] text-[var(--text-secondary)] flex items-start gap-1"><span className="text-[10px] mt-0.5" style={{color:m.color}}>•</span>{item}</li>))}</ul></div>))}
        </div>
      )}

      {/* ═══ 预警 Tab 专属：方法卡 ═══ */}
      {!isPred && (
        <div className="grid grid-cols-2 gap-3">
          {METHOD_OPTIONS.slice(0,4).map(m=>(
            <div key={m.value} className="card-level-1 p-3 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" style={{color:COLORS.amber}}/>
              <div>
                <span className="text-xs font-semibold text-[var(--text-primary)]">{m.label}</span>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ 模型列表 ═══ */}
      {loading ? (
        <div className="card-level-1 p-8 text-center text-xs text-[var(--text-muted)]">加载中...</div>
      ) : models.length===0 ? (
        <div className="card-level-1 p-12 text-center">
          <Brain className="w-8 h-8 mx-auto mb-3 text-[var(--text-muted)]"/>
          <p className="text-sm text-[var(--text-muted)] mb-3">暂无{isPred?'预测':'预警'}模型配置</p>
          <button onClick={openCreate} className="filter-btn-primary text-xs">创建{isPred?'预测':'预警'}模型</button>
        </div>
      ) : (
        <div className="card-level-1 overflow-hidden" style={{padding:0}}>
          <div className="chart-title px-3 pt-3 pb-2">{isPred?'客流预测':'客流预警'}模型列表</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-t border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                <tr>
                  {(isPred
                    ? ['模型名称','预测目标','数据特征','Prophet','XGBoost','预测天数','状态','操作']
                    : ['模型名称','检测方法','检测指标','数据特征','阈值','回溯','灵敏度','状态','操作']
                  ).map(h=><th key={h} className={`px-4 py-2 font-medium text-[var(--text-secondary)] whitespace-nowrap ${h==='状态'?'text-center':'text-left'}`}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {models.map((m:any)=>{
                  const fc = m.feature_config||{}
                  const ft: string[] = []
                  if(fc.weather)ft.push('天气'); if(fc.aqi)ft.push('AQI'); if(fc.holiday)ft.push('假日'); if(fc.weekend)ft.push('周末'); if(fc.mall_flow)ft.push('商场客流')
                  return (<tr key={m.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                    <td className="px-4 py-2 font-medium text-[var(--text-primary)]">{m.name}</td>
                    {isPred ? <>
                      <td className="px-4 py-2">{m.target_fields?.map((f:string)=>TARGET_OPTIONS.find(t=>t.value===f)?.label||f).join(', ')}</td>
                      <td className="px-4 py-2">{ft.map(f=><Tag key={f} style={{margin:'0 2px 2px 0',fontSize:10}}>{f}</Tag>)}</td>
                      <td className="px-4 py-2 text-[var(--text-muted)] text-[10px]">{Object.entries(m.prophet_params||{}).slice(0,2).map(([k,v]:any)=>`${v}`).join('/')}</td>
                      <td className="px-4 py-2 text-[var(--text-muted)] text-[10px]">{Object.entries(m.xgboost_params||{}).slice(0,2).map(([k,v]:any)=>`${v}`).join('/')}</td>
                      <td className="px-4 py-2 text-number">{m.prediction_horizon}天</td>
                    </> : <>
                      <td className="px-4 py-2"><Tag color={COLORS.amber} style={{margin:0}}>{METHOD_OPTIONS.find(x=>x.value===m.method)?.label||m.method}</Tag></td>
                      <td className="px-4 py-2">{m.target_fields?.map((f:string)=>TARGET_OPTIONS.find(t=>t.value===f)?.label||f).join(', ')}</td>
                      <td className="px-4 py-2">{ft.map(f=><Tag key={f} style={{margin:'0 2px 2px 0',fontSize:10}}>{f}</Tag>)}</td>
                      <td className="px-4 py-2 text-number">{m.anomaly_threshold}</td>
                      <td className="px-4 py-2 text-number">{m.lookback_days}天</td>
                      <td className="px-4 py-2"><Tag color={SENSITIVITY_OPTIONS.find(x=>x.value===m.sensitivity)?.color} style={{margin:0}}>{SENSITIVITY_OPTIONS.find(x=>x.value===m.sensitivity)?.label||m.sensitivity}</Tag></td>
                    </>}
                    <td className="px-4 py-2" style={{textAlign:'center'}}><span className={`inline-block w-2 h-2 rounded-full ${m.is_enabled?'bg-emerald-400':'bg-gray-400'}`}/></td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <Button size="small" type="text" icon={<Edit3 className="w-3 h-3"/>} onClick={()=>openEdit(m)}/>
                        <Popconfirm title="确认删除" onConfirm={()=>del(m.id)} okText="确认" cancelText="取消"><Button size="small" type="text" danger icon={<Trash2 className="w-3 h-3"/>}/></Popconfirm>
                      </div>
                    </td>
                  </tr>)
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ 数据字段预览（按来源分组表格） ═══ */}
      <div className="card-level-1 overflow-hidden" style={{padding:0}}>
        <div className="chart-title px-3 pt-3 pb-2">核心数据集结构 (按天+门店粒度)</div>
        <table className="w-full text-xs">
          <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            <tr>
              {['字段名','中文名称','数据来源','必选'].map(h=><th key={h} className="text-left px-3 py-1.5 font-medium text-[var(--text-secondary)]">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              {src:'系统/数据库',color:'#64748B',items:[
                {k:'date',l:'日期',r:true},{k:'store_id',l:'门店ID',r:true},{k:'mall_id',l:'所属商场ID',r:true},
              ]},
              {src:'商场基础数据',color:COLORS.amber,items:[
                {k:'mall_name',l:'商场名称',r:false},{k:'developer',l:'开发商',r:false},{k:'commercial_area',l:'商业面积 (万㎡)',r:false},{k:'mall_grade',l:'商场等级 (S/A/B/C/D)',r:false},{k:'floor_count',l:'楼层数',r:false},{k:'consumption_level',l:'消费定位',r:false},{k:'building_type',l:'建筑形态',r:false},{k:'parking_spaces',l:'停车位数',r:false},
              ]},
              {src:'商场客流数据',color:'#38BDF8',items:[
                {k:'mall_total_flow',l:'商场当日总客流人次',r:false},{k:'mall_weekday_flow',l:'商场工作日客流',r:false},{k:'mall_weekend_flow',l:'商场周末客流',r:false},{k:'mall_peak_flow',l:'商场峰值客流',r:false},
              ]},
              {src:'门店基础数据',color:'#EC4899',items:[
                {k:'store_name',l:'门店名称',r:false},{k:'floor_position',l:'门店所在楼层',r:false},{k:'store_area_sqm',l:'门店面积 (m²)',r:false},
              ]},
              {src:'门店客流数据',color:COLORS.primary,items:[
                {k:'passerby_count',l:'过店人次 (预测目标1)',r:false},{k:'passerby_people',l:'门店过店人数',r:false},{k:'enter_count',l:'进店人次 (预测目标2)',r:false},{k:'enter_people',l:'进店人数',r:false},{k:'deep_browse_count',l:'深逛人数',r:false},{k:'entry_rate',l:'进店率 (%)',r:false},{k:'avg_stay_minutes',l:'停留时长 (分钟)',r:false},{k:'store_weekday_flow',l:'门店工作日客流',r:false},{k:'store_weekend_flow',l:'门店周末客流',r:false},{k:'store_peak_flow',l:'门店峰值客流',r:false},
              ]},
              {src:'天气API',color:'#38BDF8',items:[
                {k:'temperature',l:'平均气温',r:false},{k:'precipitation',l:'降水量',r:false},{k:'wind_speed',l:'风速',r:false},{k:'weather_type',l:'天气类型 (晴/阴/雨/雪)',r:false},
              ]},
              {src:'AQI API',color:'#10B981',items:[
                {k:'aqi',l:'AQI 空气质量指数 (0-500)',r:false},{k:'aqi_level',l:'空气质量等级 (1-6)',r:false},{k:'pm25',l:'PM2.5 浓度 (μg/m³)',r:false},{k:'pm10',l:'PM10 浓度 (μg/m³)',r:false},{k:'o3',l:'臭氧浓度 (μg/m³)',r:false},{k:'no2',l:'二氧化氮浓度 (μg/m³)',r:false},
              ]},
              {src:'假日API',color:'#F59E0B',items:[
                {k:'is_holiday',l:'是否法定节假日 (0/1)',r:false},{k:'is_holiday_adjacent',l:'是否节假日前后 (0/1)',r:false},{k:'holiday_type',l:'节假日类型 (独热编码)',r:false},
              ]},
              {src:'系统标记',color:'#8B5CF6',items:[
                {k:'is_weekend',l:'是否周末 (0/1)',r:false},{k:'day_of_week',l:'星期几 (0-6)',r:false},{k:'day_of_month',l:'月中第几天 (1-31)',r:false},{k:'month',l:'月份 (1-12)',r:false},
              ]},
            ].map(group => (
              <React.Fragment key={group.src}>
                <tr className="bg-[var(--bg-tertiary)]">
                  <td colSpan={4} className="px-3 py-1.5 text-[11px] font-medium" style={{color:group.color}}>
                    {group.src}
                  </td>
                </tr>
                {group.items.map(f => (
                  <tr key={f.k} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                    <td className="px-3 py-1.5 font-mono text-[var(--text-primary)]">{f.k}</td>
                    <td className="px-3 py-1.5 text-[var(--text-secondary)]">{f.l}</td>
                    <td className="px-3 py-1.5"><Tag color={group.color} style={{margin:0,fontSize:10}}>{group.src}</Tag></td>
                    <td className="px-3 py-1.5">{f.r ? <Tag color="red" style={{margin:0,fontSize:10}}>必选</Tag> : <span className="text-[var(--text-muted)]">可选</span>}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══ 弹窗 ═══ */}
      <Modal title={isEdit?'编辑模型配置':'新增模型配置'} open={modalOpen} onCancel={()=>setModalOpen(false)} onOk={save} okText="保存" cancelText="取消" width={700} destroyOnClose>
        {editing && (<div className="grid grid-cols-2 gap-4 mt-4">
          <div className="col-span-2"><label className="text-xs text-[var(--text-secondary)] block mb-1">模型名称 <span className="text-red-400">*</span></label><Input size="small" value={editing.name||''} onChange={e=>setEditing({...editing,name:e.target.value})} placeholder="如：北京区域客流预测模型"/></div>

          <div className="col-span-2"><label className="text-xs text-[var(--text-secondary)] block mb-1">{isPred?'预测目标':'检测指标'} <span className="text-red-400">*</span></label><Checkbox.Group options={TARGET_OPTIONS} value={editing.target_fields||[]} onChange={v=>setEditing({...editing,target_fields:v as string[]})}/></div>

          {isPred && (<><div><label className="text-xs text-[var(--text-secondary)] block mb-1">预测天数</label><Select size="small" value={editing.prediction_horizon} onChange={v=>setEditing({...editing,prediction_horizon:v})} options={HORIZON_OPTIONS.map(h=>({value:h,label:`未来 ${h} 天`}))} style={{width:'100%'}}/></div><div className="flex items-end pb-0.5"><Switch size="small" checked={!!editing.is_enabled} onChange={v=>setEditing({...editing,is_enabled:v?1:0})}/><span className="text-xs text-[var(--text-secondary)] ml-2">启用</span></div></>)}

          {!isPred && (<>
            <div><label className="text-xs text-[var(--text-secondary)] block mb-1">检测方法</label><Select size="small" value={editing.method} onChange={v=>setEditing({...editing,method:v})} options={METHOD_OPTIONS.map(m=>({value:m.value,label:m.label}))} style={{width:'100%'}}/></div>
            <div><label className="text-xs text-[var(--text-secondary)] block mb-1">灵敏度</label><Select size="small" value={editing.sensitivity} onChange={v=>setEditing({...editing,sensitivity:v})} options={SENSITIVITY_OPTIONS.map(s=>({value:s.value,label:s.label}))} style={{width:'100%'}}/></div>
            <div><label className="text-xs text-[var(--text-secondary)] block mb-1">异常阈值</label><InputNumber size="small" value={editing.anomaly_threshold} onChange={v=>setEditing({...editing,anomaly_threshold:v})} min={0.001} max={0.5} step={0.01} style={{width:'100%'}}/></div>
            <div><label className="text-xs text-[var(--text-secondary)] block mb-1">回溯天数</label><Select size="small" value={editing.lookback_days} onChange={v=>setEditing({...editing,lookback_days:v})} options={[7,14,30,60,90].map(d=>({value:d,label:`${d} 天`}))} style={{width:'100%'}}/></div>
            <div className="flex items-end pb-0.5"><Switch size="small" checked={!!editing.is_enabled} onChange={v=>setEditing({...editing,is_enabled:v?1:0})}/><span className="text-xs text-[var(--text-secondary)] ml-2">启用</span></div>
          </>)}

          <div className="col-span-2 p-3 rounded bg-[var(--bg-tertiary)]"><span className="text-xs text-[var(--text-secondary)] block mb-2">数据特征配置</span><FeatureSwitches fc={editing.feature_config||{}} onChange={(k,v)=>setEditing({...editing,feature_config:{...(editing.feature_config||{}),[k]:v}})} showAqi={isPred}/></div>

          {isPred && (<>
            <div className="col-span-2 p-3 rounded bg-[var(--bg-tertiary)]">
              <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-3.5 h-3.5" style={{color:COLORS.primary}}/><span className="text-xs font-medium" style={{color:COLORS.primary}}>Prophet 参数</span></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-[10px] text-[var(--text-muted)] block mb-0.5">季节性模式</label><Select size="small" value={(editing.prophet_params||{}).seasonality_mode||'multiplicative'} onChange={v=>setEditing({...editing,prophet_params:{...(editing.prophet_params||{}),seasonality_mode:v}})} options={[{value:'multiplicative',label:'乘法'},{value:'additive',label:'加法'}]} style={{width:'100%'}}/></div>
                <div><label className="text-[10px] text-[var(--text-muted)] block mb-0.5">变点先验</label><InputNumber size="small" value={(editing.prophet_params||{}).changepoint_prior_scale||0.05} onChange={v=>setEditing({...editing,prophet_params:{...(editing.prophet_params||{}),changepoint_prior_scale:v}})} min={0.001} max={0.5} step={0.01} style={{width:'100%'}}/></div>
                <div><label className="text-[10px] text-[var(--text-muted)] block mb-0.5">假日先验</label><InputNumber size="small" value={(editing.prophet_params||{}).holidays_prior_scale||10} onChange={v=>setEditing({...editing,prophet_params:{...(editing.prophet_params||{}),holidays_prior_scale:v}})} min={0.1} max={100} step={1} style={{width:'100%'}}/></div>
                {['yearly_seasonality','weekly_seasonality','daily_seasonality'].map(k=>(<div key={k}><label className="text-[10px] text-[var(--text-muted)] block mb-0.5">{k.replace('_',' ')}</label><Switch size="small" checked={!!(editing.prophet_params||{})[k]} onChange={v=>setEditing({...editing,prophet_params:{...(editing.prophet_params||{}),[k]:v}})}/></div>))}
              </div>
            </div>
            <div className="col-span-2 p-3 rounded bg-[var(--bg-tertiary)]">
              <div className="flex items-center gap-2 mb-2"><Brain className="w-3.5 h-3.5" style={{color:'#8B5CF6'}}/><span className="text-xs font-medium" style={{color:'#8B5CF6'}}>XGBoost 参数</span></div>
              <div className="grid grid-cols-3 gap-3">
                {([{k:'n_estimators',l:'树数量',min:50,max:1000,step:10},{k:'max_depth',l:'最大深度',min:2,max:12,step:1},{k:'learning_rate',l:'学习率',min:0.01,max:0.3,step:0.01},{k:'subsample',l:'样本比例',min:0.5,max:1.0,step:0.1},{k:'colsample_bytree',l:'特征比例',min:0.5,max:1.0,step:0.1},{k:'reg_alpha',l:'L1正则',min:0,max:10,step:0.1},{k:'reg_lambda',l:'L2正则',min:0,max:10,step:0.1}] as const).map(p=>(<div key={p.k}><label className="text-[10px] text-[var(--text-muted)] block mb-0.5">{p.l}</label><InputNumber size="small" value={(editing.xgboost_params||{})[p.k]} onChange={v=>setEditing({...editing,xgboost_params:{...(editing.xgboost_params||{}),[p.k]:v}})} min={p.min} max={p.max} step={p.step} style={{width:'100%'}}/></div>))}
              </div>
            </div>
          </>)}

          <div className="col-span-2"><label className="text-xs text-[var(--text-secondary)] block mb-1">说明</label><Input.TextArea size="small" value={editing.description||''} onChange={e=>setEditing({...editing,description:e.target.value})} rows={2} placeholder="模型用途描述"/></div>
        </div>)}
      </Modal>
    </div>
  )
}
