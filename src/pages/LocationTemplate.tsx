import React, { useState } from 'react'
import { Play, Check, Coffee, Utensils, Baby, Zap, Plus, Building2, MapPin, Users, DollarSign, ShoppingBag, ChevronRight, Save, RotateCcw, Trash2, GripVertical, Eye, EyeOff, ChevronUp, ChevronDown, Globe } from 'lucide-react'
import { Tag, Button, message, Select, Slider, Drawer, Tabs, Input, InputNumber, Switch, Modal } from 'antd'

/* ─── 模板数据 ─── */
const MALL_TIER_OPTS = ['高端综合体','中端综合商场','社区型商场','亲子主题商场']
const FLOOR_OPTS = ['负一楼美食层','1楼沿街铺','2-3楼餐饮专区','高楼层']
const POS_OPTS = ['电梯口旁','中庭流量位','主通道','次通道','边角铺']
const CAT_OPTS = ['快餐简餐','茶饮小吃','正餐聚餐','火锅烤肉','特色小吃','烘焙甜品']
const MODEL_OPTS = ['档口快取','堂食为主','轻堂食+外卖']
const CROWD_OPTS = ['年轻潮流群体','家庭亲子群体','上班族通勤群体']
const SPEND_OPTS = ['大众平价','中端休闲','中高端聚餐']

interface Template {
  id:string; name:string; desc:string; icon:React.ElementType; color:string
  radius:number; mallTiers:string[]; floors:string[]; positions:string[]
  categories:string[]; models:string[]; crowds:string[]; spend:string[]
  rentRange:[number,number]; area:number
}

const INITIAL_TEMPLATES: Template[] = [
  { id:'tpl-b1', name:'负一楼美食城小吃', icon:Coffee, color:'#F59E0B', desc:'茶饮/小吃·B1美食层·档口快取',
    radius:3, mallTiers:['中端综合商场','高端综合体'], floors:['负一楼美食层'], positions:['主通道','中庭流量位'],
    categories:['茶饮小吃','特色小吃','烘焙甜品'], models:['档口快取','轻堂食+外卖'],
    crowds:['年轻潮流群体','上班族通勤群体'], spend:['大众平价'], rentRange:[100,300], area:30 },
  { id:'tpl-l1', name:'一楼流量茶饮', icon:Coffee, color:'#EC4899', desc:'茶饮旗舰·一楼沿街·高曝光',
    radius:1, mallTiers:['高端综合体','中端综合商场'], floors:['1楼沿街铺'], positions:['电梯口旁','主通道'],
    categories:['茶饮小吃'], models:['档口快取'], crowds:['年轻潮流群体'], spend:['中端休闲'], rentRange:[200,500], area:20 },
  { id:'tpl-mf', name:'中楼层正餐聚餐', icon:Utensils, color:'#10B981', desc:'火锅烤肉·中餐正餐·堂食为主',
    radius:3, mallTiers:['高端综合体','中端综合商场'], floors:['2-3楼餐饮专区'], positions:['电梯口旁','中庭流量位'],
    categories:['正餐聚餐','火锅烤肉'], models:['堂食为主'],
    crowds:['家庭亲子群体','上班族通勤群体'], spend:['中高端聚餐','中端休闲'], rentRange:[150,400], area:100 },
  { id:'tpl-kids', name:'亲子儿童餐饮', icon:Baby, color:'#8B5CF6', desc:'亲子主题·轻堂食+外卖·家庭客群',
    radius:2, mallTiers:['亲子主题商场','社区型商场'], floors:['2-3楼餐饮专区','负一楼美食层'], positions:['次通道','边角铺'],
    categories:['快餐简餐','特色小吃','烘焙甜品'], models:['轻堂食+外卖'],
    crowds:['家庭亲子群体'], spend:['中端休闲','大众平价'], rentRange:[100,250], area:60 },
  { id:'tpl-comm', name:'社区刚需快餐', icon:Zap, color:'#3B82F6', desc:'快餐简餐·社区便民·午市刚需',
    radius:1, mallTiers:['社区型商场','亲子主题商场'], floors:['负一楼美食层','1楼沿街铺'], positions:['主通道','次通道'],
    categories:['快餐简餐'], models:['档口快取','堂食为主'],
    crowds:['上班族通勤群体'], spend:['大众平价'], rentRange:[50,200], area:50 },
]

/* ─── 参数配置页 ─── */
const SECTIONS = [
  { key:'business', label:'商圈基础参数', icon:Building2 },
  { key:'position', label:'场内铺位参数', icon:MapPin },
  { key:'operation', label:'业态经营参数', icon:ShoppingBag },
  { key:'customer', label:'客群消费参数', icon:Users },
  { key:'cost', label:'成本预算参数', icon:DollarSign },
  { key:'datasource', label:'全局数据源配置', icon:Globe },
]

interface ParamDef { name:string; type:string; options?:string[]; defaultValue?:any; required?:boolean; rangeLabel?:string }
const PRESET_PARAMS: Record<string, ParamDef[]> = {
  business: [
    { name:'核心辐射范围', type:'select', options:['1km','2km','3km','5km'], defaultValue:'3km', required:true },
    { name:'商场档次等级', type:'select', options:['社区场','中端商圈','核心高端场'], defaultValue:'中端商圈', required:true },
    { name:'商圈成熟阶段', type:'select', options:['培育期','稳定期','饱和期'], defaultValue:'稳定期', required:true },
    { name:'周边配套属性', type:'multi', options:['办公','住宅','校园','文旅'], defaultValue:['办公','住宅'] },
  ],
  position: [
    { name:'所在楼层', type:'select', options:['B1美食层','1层临街','高层美食区'], defaultValue:'B1美食层', required:true },
    { name:'场内动线位置', type:'select', options:['扶梯口','主通道','中庭旁','边角档口'], defaultValue:'主通道', required:true },
    { name:'相邻业态', type:'multi', options:['茶饮扎堆','正餐','零食','生鲜'], defaultValue:['茶饮扎堆'] },
    { name:'距出入口距离', type:'range-select', options:['0-20m','20-50m','50m以上'], defaultValue:'0-20m' },
  ],
  operation: [
    { name:'经营品类', type:'select', options:['新式茶饮','特色小吃','卤味','冰饮','快餐简餐'], defaultValue:'新式茶饮', required:true },
    { name:'经营模式', type:'select', options:['档口快取','堂食外带','纯外卖'], defaultValue:'档口快取', required:true },
    { name:'门店面积需求', type:'range', options:['10-20㎡','20-30㎡','30-50㎡','50-80㎡'], defaultValue:'20-30㎡' },
  ],
  customer: [
    { name:'主力消费客群', type:'multi', options:['上班族','学生','社区居民','年轻客流'], defaultValue:['年轻客流','学生'] },
    { name:'客群年龄层级', type:'range-select', options:['18-25岁','25-35岁','全龄段'], defaultValue:'18-25岁' },
    { name:'整体消费层级', type:'select', options:['平价刚需','中端日常','轻奢休闲'], defaultValue:'中端日常' },
    { name:'客单价区间', type:'range-select', options:['5-10元','10-18元','18-28元','28元以上'], defaultValue:'10-18元' },
    { name:'主流消费时段', type:'multi', options:['午高峰','晚高峰','周末全天'], defaultValue:['午高峰','晚高峰'] },
  ],
  cost: [
    { name:'商铺月租单价', type:'number', defaultValue:200, rangeLabel:'元/㎡/月' },
    { name:'月度租金上限', type:'number', defaultValue:15000, rangeLabel:'元/月' },
    { name:'转让费预算', type:'range-select', options:['0-5万','5-15万','15万以上'], defaultValue:'5-15万' },
    { name:'行业毛利率', type:'range-select', options:['45%-55%','55%-65%','65%以上'], defaultValue:'55%-65%' },
    { name:'日均达标客流', type:'number', defaultValue:150, rangeLabel:'人次/日' },
  ],
}
const DATA_SOURCES = ['行业通用数据','商圈大数据','实地调研','竞品实测','人工填报','第三方接口']

interface CustomParam { id:string; name:string; type:string; options?:string[]; defaultValue?:any; required:boolean; enabled:boolean; dataSource?:string }

/* ═══ 参数配置子组件 ═══ */
const ParameterConfig: React.FC<{
  paramValues:Record<string,any>; setParamValues:(f:(p:Record<string,any>)=>Record<string,any>)=>void
  customParams:Record<string,CustomParam[]>; setCustomParams:(f:(p:Record<string,CustomParam[]>)=>Record<string,CustomParam[]>)=>void
}> = ({paramValues, setParamValues, customParams, setCustomParams}) => {
  const [section, setSection] = useState('business')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const toggle = (k:string) => setCollapsed(prev=>{const n=new Set(prev); n.has(k)?n.delete(k):n.add(k); return n})
  const addCP = () => setCustomParams(prev=>({...prev,[section]:[...(prev[section]||[]),{id:`cp_${Date.now()}`,name:'新参数',type:'select',options:['选项1','选项2'],defaultValue:'',required:false,enabled:true}]}))
  const updateCP = (id:string,p:Partial<CustomParam>) => setCustomParams(prev=>({...prev,[section]:(prev[section]||[]).map(c=>c.id===id?{...c,...p}:c)}))
  const delCP = (id:string) => setCustomParams(prev=>({...prev,[section]:(prev[section]||[]).filter(c=>c.id!==id)}))
  const toggleCP = (id:string) => setCustomParams(prev=>({...prev,[section]:(prev[section]||[]).map(c=>c.id===id?{...c,enabled:!c.enabled}:c)}))

  const Icon = SECTIONS.find(s=>s.key===section)!.icon

  return (
    <div className="p-6 space-y-4 overflow-y-auto">
      <div className="flex items-center gap-1 bg-[var(--bg-secondary)] rounded-lg p-1">
        {SECTIONS.filter(s=>s.key!=='datasource').map(s=>{const Si=s.icon;const active=section===s.key
          return <button key={s.key} onClick={()=>setSection(s.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${active?'bg-[var(--bg-primary)] text-[var(--ai-blue-500)] shadow-sm':'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
            <Si className="w-3 h-3"/>{s.label}</button>
        })}
      </div>
      <div className="card-level-1 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] cursor-pointer select-none" onClick={()=>toggle(`std_${section}`)}>
          <Icon className="w-4 h-4 text-[var(--ai-blue-500)]"/><span className="text-sm font-semibold text-[var(--text-primary)]">系统标准参数</span>
          <Tag style={{fontSize:10}}>{PRESET_PARAMS[section]?.length||0}项</Tag>
          <div className="ml-auto">{collapsed.has(`std_${section}`)?<ChevronUp className="w-4 h-4 text-[var(--text-muted)]"/>:<ChevronDown className="w-4 h-4 text-[var(--text-muted)]"/>}</div>
        </div>
        {!collapsed.has(`std_${section}`)&&<div className="divide-y divide-[var(--border-subtle)]">
          {PRESET_PARAMS[section]?.map((p,i)=>(
            <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-[var(--bg-tertiary)]/30">
              <div className="w-40 shrink-0"><div className="text-xs font-medium text-[var(--text-primary)]">{p.name}</div><div className="text-[9px] text-[var(--text-muted)] mt-0.5">{p.required?'必填':'选填'}·{p.type==='number'?'数值':p.type==='multi'?'多选':'单选'}</div></div>
              <div className="flex-1">{p.type==='select'?<Select size="small" value={p.defaultValue} style={{width:'100%'}} options={p.options?.map(o=>({value:o,label:o}))}/>
                :p.type==='multi'?<Select size="small" mode="multiple" value={p.defaultValue} style={{width:'100%'}} maxTagCount={3} options={p.options?.map(o=>({value:o,label:o}))}/>
                :p.type==='range-select'||p.type==='range'?<Select size="small" value={p.defaultValue} style={{width:'100%'}} options={p.options?.map(o=>({value:o,label:o}))}/>
                :<InputNumber size="small" value={p.defaultValue} style={{width:'100%'}} addonAfter={p.rangeLabel}/>}</div>
              <div className="w-36 shrink-0"><Select size="small" value={paramValues[`${section}_${p.name}`]||undefined} onChange={v=>setParamValues(pv=>({...pv,[`${section}_${p.name}`]:v}))} style={{width:'100%'}} placeholder="数据来源" allowClear options={DATA_SOURCES.map(s=>({value:s,label:s}))}/></div>
            </div>
          ))}
        </div>}
      </div>
      <div className="card-level-1 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] cursor-pointer select-none" onClick={()=>toggle(`cp_${section}`)}>
          <GripVertical className="w-4 h-4 text-purple-400"/><span className="text-sm font-semibold text-[var(--text-primary)]">自定义参数</span>
          <Tag color="purple" style={{fontSize:10}}>{(customParams[section]||[]).length}项</Tag>
          <div className="ml-auto">{collapsed.has(`cp_${section}`)?<ChevronUp className="w-4 h-4 text-[var(--text-muted)]"/>:<ChevronDown className="w-4 h-4 text-[var(--text-muted)]"/>}</div>
        </div>
        {!collapsed.has(`cp_${section}`)&&<div className="divide-y divide-[var(--border-subtle)]">
          {(customParams[section]||[]).length===0&&<div className="px-5 py-8 text-center text-xs text-[var(--text-muted)]">暂无自定义参数</div>}
          {(customParams[section]||[]).map(cp=>(<div key={cp.id} className={`flex items-center gap-2 px-5 py-2.5 hover:bg-[var(--bg-tertiary)]/30 ${cp.enabled?'':'opacity-40'}`}>
            <GripVertical className="w-3 h-3 text-[var(--text-muted)] cursor-grab shrink-0"/>
            <Input size="small" value={cp.name} onChange={e=>updateCP(cp.id,{name:e.target.value})} style={{width:120}} bordered={false} className="font-medium"/>
            <Select size="small" value={cp.type} onChange={v=>updateCP(cp.id,{type:v})} style={{width:80}} options={[{value:'select',label:'单选'},{value:'multi',label:'多选'},{value:'number',label:'数值'},{value:'text',label:'文本'}]}/>
            {['select','multi'].includes(cp.type)&&<Input size="small" value={(cp.options||[]).join(',')} onChange={e=>updateCP(cp.id,{options:e.target.value.split(',')})} style={{flex:1}} placeholder="选项(逗号分隔)"/>}
            {cp.type==='number'&&<InputNumber size="small" value={cp.defaultValue} style={{width:80}}/>}
            <Tag color={cp.required?'red':'default'} style={{fontSize:9,cursor:'pointer'}} onClick={()=>updateCP(cp.id,{required:!cp.required})}>{cp.required?'必填':'选填'}</Tag>
            <Select size="small" value={cp.dataSource||undefined} onChange={v=>updateCP(cp.id,{dataSource:v||''})} style={{width:110}} placeholder="数据来源" allowClear options={DATA_SOURCES.map(s=>({value:s,label:s}))}/>
            <Button size="small" type="text" icon={cp.enabled?<Eye className="w-3 h-3"/>:<EyeOff className="w-3 h-3"/>} onClick={()=>toggleCP(cp.id)}/>
            <Button size="small" type="text" danger icon={<Trash2 className="w-3 h-3"/>} onClick={()=>delCP(cp.id)}/>
          </div>))}
          <div className="px-5 py-3"><Button type="dashed" block icon={<Plus className="w-3 h-3"/>} onClick={addCP} style={{fontSize:10}}>添加自定义参数</Button></div>
        </div>}
      </div>
      <div className="card-level-1 p-5 flex items-center gap-4">
        <Globe className="w-5 h-5 text-[var(--ai-blue-500)] shrink-0"/>
        <div className="flex-1"><div className="text-xs font-medium text-[var(--text-primary)]">全局数据源概览</div><div className="text-[10px] text-[var(--text-muted)] mt-0.5">已为 {Object.values(paramValues).filter(Boolean).length} 个参数配置独立数据源</div></div>
        <Button size="small" icon={<Save className="w-3 h-3"/>} type="primary" onClick={()=>message.success('参数配置已保存')}>保存配置</Button>
      </div>
    </div>
  )
}

export const LocationTemplate: React.FC = () => {
  const [tab, setTab] = useState('templates')
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES)
  const [applied, setApplied] = useState('')
  const [detailTpl, setDetailTpl] = useState<Template | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [newModalOpen, setNewModalOpen] = useState(false)
  const [newTemplate, setNewTemplate] = useState<Template>({id:'',name:'',desc:'',icon:Coffee,color:'#F59E0B',radius:3,mallTiers:[],floors:[],positions:[],categories:[],models:[],crowds:[],spend:[],rentRange:[100,500],area:30})
  const [newIconPick, setNewIconPick] = useState('Coffee')
  const iconMap:Record<string,React.ElementType> = { Coffee, Utensils, Baby, Zap }

  // 参数配置页状态
  const [paramValues, setParamValues] = useState<Record<string,any>>({})
  const [customParams, setCustomParams] = useState<Record<string,CustomParam[]>>({})

  const applyTemplate = (tpl: Template) => {
    localStorage.setItem('location-template', JSON.stringify({...tpl, paramConfig:paramValues, customParams}))
    message.success(`"${tpl.name}"已应用到选址推荐`)
    setApplied(tpl.id); setTimeout(()=>setApplied(''), 2000)
  }
  const openDetail = (tpl: Template) => { setDetailTpl(tpl); setDrawerOpen(true) }

  const handleNew = () => {
    if (!newTemplate.name) { message.warning('请输入模板名称'); return }
    const tpl = { ...newTemplate, id:`tpl_${Date.now()}`, icon:iconMap[newIconPick]||Coffee,
      color:newIconPick==='Coffee'?'#F59E0B':newIconPick==='Utensils'?'#10B981':newIconPick==='Baby'?'#8B5CF6':'#3B82F6' }
    setTemplates(prev=>[...prev, tpl])
    message.success(`模板"${tpl.name}"已创建`)
    setNewModalOpen(false)
    setNewTemplate({id:'',name:'',desc:'',icon:Coffee,color:'#F59E0B',radius:3,mallTiers:[],floors:[],positions:[],categories:[],models:[],crowds:[],spend:[],rentRange:[100,500],area:30})
  }

  const delTemplate = (id:string) => { setTemplates(prev=>prev.filter(t=>t.id!==id)); message.success('已删除') }

  const F = ({l,children}:{l:string;children:any})=>(<div><label className="text-[9px] text-[var(--text-muted)] block mb-1">{l}</label>{children}</div>)
  const S = ({l,v,set,opts}:{l:string;v:string[];set:(a:string[])=>void;opts:string[]})=>(
    <F l={l}><Select size="small" mode="multiple" value={v} onChange={set} style={{width:'100%'}} maxTagCount={2} options={opts.map(o=>({value:o,label:o}))}/></F>
  )

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Tabs size="small" activeKey={tab} onChange={setTab} className="px-4 pt-2" tabBarExtraContent={
        tab==='templates' && <Button size="small" type="primary" icon={<Plus className="w-3 h-3"/>} onClick={()=>setNewModalOpen(true)}>新增模板</Button>
      } items={[
        { key:'templates', label:'选址模板' },
        { key:'config', label:'参数配置' },
      ]}/>

      <div className="flex-1 overflow-y-auto">
        {tab === 'templates' ? (
          <div className="p-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {templates.map(t=>{
                const Icon=t.icon
                return <div key={t.id} className="card-level-1 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{backgroundColor:`${t.color}15`}}>
                      <Icon className="w-5 h-5" style={{color:t.color}}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[var(--text-primary)]">{t.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{t.desc}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="small" type="primary" ghost icon={applied===t.id?<Check className="w-3 h-3"/>:<Play className="w-3 h-3"/>}
                        onClick={(e)=>{e.stopPropagation();applyTemplate(t)}} style={{fontSize:10}}>
                        {applied===t.id?'已应用':'套用'}
                      </Button>
                      <Button size="small" type="text" danger icon={<Trash2 className="w-3 h-3"/>} onClick={(e)=>{e.stopPropagation();delTemplate(t.id)}}/>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {t.categories.slice(0,2).map(c=><Tag key={c} style={{fontSize:9}}>{c}</Tag>)}
                    {t.models.slice(0,1).map(m=><Tag key={m} color="blue" style={{fontSize:9}}>{m}</Tag>)}
                    {t.floors.slice(0,1).map(f=><Tag key={f} color="purple" style={{fontSize:9}}>{f}</Tag>)}
                    <Tag style={{fontSize:9}}>{t.area}㎡</Tag>
                  </div>
                  <Button size="small" type="link" onClick={()=>openDetail(t)} style={{fontSize:10,padding:'0 4px'}}>
                    查看详情 <ChevronRight className="w-3 h-3 inline"/>
                  </Button>
                </div>
              })}
            </div>

            {/* 详情抽屉 */}
            <Drawer title={detailTpl?.name} open={drawerOpen} onClose={()=>setDrawerOpen(false)} width={600}
              extra={detailTpl && <Button size="small" type="primary" icon={<Play className="w-3 h-3"/>} onClick={()=>applyTemplate(detailTpl)}>套用模板</Button>}>
              {detailTpl && <div className="space-y-4">
                <p className="text-xs text-[var(--text-muted)]">{detailTpl.desc}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-semibold">商圈基础</h4>
                    <F l="辐射范围"><Select size="small" value={detailTpl.radius} style={{width:'100%'}} options={[1,2,3].map(v=>({value:v,label:`${v}km`}))}/></F>
                    <F l="商场档次"><Select size="small" mode="multiple" value={detailTpl.mallTiers} style={{width:'100%'}} options={MALL_TIER_OPTS.map(v=>({value:v,label:v}))}/></F>
                    <h4 className="text-[10px] font-semibold" style={{paddingTop:8}}>场内位置</h4>
                    <F l="楼层"><Select size="small" mode="multiple" value={detailTpl.floors} style={{width:'100%'}} options={FLOOR_OPTS.map(v=>({value:v,label:v}))}/></F>
                    <F l="动线位置"><Select size="small" mode="multiple" value={detailTpl.positions} style={{width:'100%'}} options={POS_OPTS.map(v=>({value:v,label:v}))}/></F>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-semibold">业态经营</h4>
                    <F l="品类"><Select size="small" mode="multiple" value={detailTpl.categories} style={{width:'100%'}} options={CAT_OPTS.map(v=>({value:v,label:v}))}/></F>
                    <F l="模式"><Select size="small" mode="multiple" value={detailTpl.models} style={{width:'100%'}} options={MODEL_OPTS.map(v=>({value:v,label:v}))}/></F>
                    <F l="面积"><Slider range min={20} max={200} value={[Math.max(20,detailTpl.area-20),Math.min(200,detailTpl.area+20)]}/></F>
                    <h4 className="text-[10px] font-semibold" style={{paddingTop:8}}>客流人群</h4>
                    <F l="客群"><Select size="small" mode="multiple" value={detailTpl.crowds} style={{width:'100%'}} options={CROWD_OPTS.map(v=>({value:v,label:v}))}/></F>
                    <F l="消费"><Select size="small" mode="multiple" value={detailTpl.spend} style={{width:'100%'}} options={SPEND_OPTS.map(v=>({value:v,label:v}))}/></F>
                    <h4 className="text-[10px] font-semibold" style={{paddingTop:8}}>成本预算</h4>
                    <F l="月租"><Slider range min={50} max={800} value={detailTpl.rentRange}/></F>
                  </div>
                </div>
              </div>}
            </Drawer>

            {/* 新增模板弹窗 */}
            <Modal title="新增选址模板" open={newModalOpen} onCancel={()=>setNewModalOpen(false)} onOk={handleNew} okText="创建" cancelText="取消" width={640} destroyOnClose>
              <div className="space-y-3 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <F l="模板名称 *"><Input size="small" value={newTemplate.name} onChange={e=>setNewTemplate({...newTemplate,name:e.target.value})} placeholder="如：负一楼茶饮档口"/></F>
                  <F l="图标"><Select size="small" value={newIconPick} onChange={setNewIconPick} style={{width:'100%'}} options={[{value:'Coffee',label:'☕ 茶饮'},{value:'Utensils',label:'🍽 正餐'},{value:'Baby',label:'👶 亲子'},{value:'Zap',label:'⚡ 快餐'}]}/></F>
                  <F l="描述"><Input size="small" value={newTemplate.desc} onChange={e=>setNewTemplate({...newTemplate,desc:e.target.value})}/></F>
                  <F l="面积(㎡)"><InputNumber size="small" value={newTemplate.area} onChange={v=>setNewTemplate({...newTemplate,area:v||30})} style={{width:'100%'}}/></F>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <S l="经营品类" v={newTemplate.categories} set={v=>setNewTemplate({...newTemplate,categories:v})} opts={CAT_OPTS}/>
                  <S l="经营模式" v={newTemplate.models} set={v=>setNewTemplate({...newTemplate,models:v})} opts={MODEL_OPTS}/>
                  <S l="楼层" v={newTemplate.floors} set={v=>setNewTemplate({...newTemplate,floors:v})} opts={FLOOR_OPTS}/>
                  <S l="动线位置" v={newTemplate.positions} set={v=>setNewTemplate({...newTemplate,positions:v})} opts={POS_OPTS}/>
                  <S l="主力客群" v={newTemplate.crowds} set={v=>setNewTemplate({...newTemplate,crowds:v})} opts={CROWD_OPTS}/>
                  <S l="消费层级" v={newTemplate.spend} set={v=>setNewTemplate({...newTemplate,spend:v})} opts={SPEND_OPTS}/>
                  <S l="商场档次" v={newTemplate.mallTiers} set={v=>setNewTemplate({...newTemplate,mallTiers:v})} opts={MALL_TIER_OPTS}/>
                  <F l={`月租 ¥${newTemplate.rentRange[0]}-¥${newTemplate.rentRange[1]}/㎡`}>
                    <Slider range min={50} max={800} value={newTemplate.rentRange} onChange={v=>setNewTemplate({...newTemplate,rentRange:v as [number,number]})}/>
                  </F>
                </div>
              </div>
            </Modal>
          </div>
        ) : (
          /* Tab2: 参数配置 — 重构版 */
          <ParameterConfig
            paramValues={paramValues} setParamValues={setParamValues}
            customParams={customParams} setCustomParams={setCustomParams}
          />
        )}
      </div>
    </div>
  )
}
