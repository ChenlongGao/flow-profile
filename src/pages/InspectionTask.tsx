import React, { useState } from 'react'
import { Camera, Clock, RefreshCw, Shuffle, FileText, Plus, Search, Filter, Play, CheckCircle, Eye, User, Bell, AlertTriangle, Zap, Layers, ListChecks, Calendar, RotateCw, Globe, MapPin, Building2, Store, ChevronDown, ChevronRight } from 'lucide-react'
import { Button, Input, Select, Tabs, Tag, Progress, Segmented, Drawer, message, Tooltip, DatePicker, Modal } from 'antd'
import { STORE_TREE, StoreNode, getAllStores } from '../data/storeTree'

/* ═══ 巡检任务模拟数据 ═══ */
interface InspectionTask {
  id: string; templateName: string; mode: string; stores: string[]; storeCount: number
  status: 'waiting'|'running'|'done'|'reviewing'; progress: number
  startTime: string; assignee: string; notify: string[]; type: string
}

const TASKS: InspectionTask[] = [
  { id:'T001', templateName:'后厨卫生实时巡检', mode:'realtime', stores:['IFS国金中心','太平街店'], storeCount:2, status:'done', progress:100, startTime:'2026-05-21 10:00', assignee:'张拓', notify:['李建'], type:'后厨' },
  { id:'T002', templateName:'前厅服务实时巡检', mode:'realtime', stores:['德思勤店'], storeCount:1, status:'running', progress:45, startTime:'2026-05-21 11:30', assignee:'李婷', notify:['张拓'], type:'前厅' },
  { id:'T003', templateName:'早班组合巡检', mode:'combo', stores:['IFS国金中心','太平街店','德思勤店','雨花亭店'], storeCount:4, status:'waiting', progress:0, startTime:'2026-05-22 07:00', assignee:'系统自动', notify:['张拓','李建'], type:'综合' },
  { id:'T004', templateName:'后厨流程合规巡检', mode:'process', stores:['梅溪湖步步高店','悦方ID店','开福万达店'], storeCount:3, status:'reviewing', progress:90, startTime:'2026-05-21 08:00', assignee:'王鹏', notify:['张拓'], type:'后厨' },
  { id:'T005', templateName:'晚市营业标准流程巡检', mode:'process', stores:['IFS国金中心','湖滨银泰店'], storeCount:2, status:'running', progress:60, startTime:'2026-05-21 18:00', assignee:'陈静', notify:['李建'], type:'营业' },
  { id:'T006', templateName:'随机抽检-标签', mode:'spot', stores:['IFS国金中心','广州天河城店','深圳万象天地'], storeCount:3, status:'done', progress:100, startTime:'2026-05-20 14:00', assignee:'刘洋', notify:['张拓','李建'], type:'随机' },
  { id:'T007', templateName:'突击合规抽检', mode:'spot', stores:['成都太古里店','重庆解放碑店'], storeCount:2, status:'running', progress:30, startTime:'2026-05-21 13:00', assignee:'赵敏', notify:['陈丽'], type:'合规' },
  { id:'T008', templateName:'午市组合巡检', mode:'combo', stores:['IFS国金中心','南京新街口店','青岛万象城店','西安钟楼店'], storeCount:4, status:'waiting', progress:0, startTime:'2026-05-22 12:00', assignee:'系统自动', notify:['张拓'], type:'综合' },
]

const MODE_CFG: Record<string,{label:string;icon:React.FC<{className?:string}>;color:string;desc:string}> = {
  realtime: {label:'实时巡检',icon:Camera,color:'#3B82F6',desc:'单项巡检项 · 多选组合清单 · 摄像头抓拍关联'},
  combo: {label:'组合巡检',icon:Layers,color:'#10B981',desc:'定时巡检 · 场景项→巡检项→参考图→规则'},
  process: {label:'流程巡检',icon:ListChecks,color:'#8B5CF6',desc:'按规范流程合规巡检'},
  spot: {label:'临时抽检',icon:Shuffle,color:'#F59E0B',desc:'随机抽查/突击检查'},
}

/* ═══ 实时巡检项 ═══ */
const REALTIME_ITEMS = [
  { id:'RI001', name:'后厨卫生检查', zone:'后厨', cameras:['后厨全景','洗碗间','备料间'], checklist:'后厨卫生清单' },
  { id:'RI002', name:'垃圾桶管理', zone:'后厨', cameras:['后厨全景'], checklist:'后厨卫生清单' },
  { id:'RI003', name:'食材存放规范', zone:'后厨', cameras:['冷冻柜','冷藏柜','干货架'], checklist:'后厨卫生清单' },
  { id:'RI004', name:'前厅地面清洁', zone:'前厅', cameras:['前厅全景','就餐区'], checklist:'前厅服务清单' },
  { id:'RI005', name:'收银台整洁', zone:'收银台', cameras:['收银台近景'], checklist:'前厅服务清单' },
  { id:'RI006', name:'服务仪容规范', zone:'前厅', cameras:['前厅全景','迎宾区'], checklist:'前厅服务清单' },
  { id:'RI007', name:'外卖打包区卫生', zone:'外卖打包', cameras:['打包区全景'], checklist:'外卖卫生清单' },
  { id:'RI008', name:'出入口畅通检查', zone:'出入口', cameras:['正门','侧门'], checklist:'安全消防清单' },
  { id:'RI009', name:'仓库消防安全', zone:'仓库', cameras:['仓库全景','消防通道'], checklist:'安全消防清单' },
  { id:'RI010', name:'消毒记录核查', zone:'后厨', cameras:['消毒间'], checklist:'后厨卫生清单' },
]

const REALTIME_CHECKLISTS = [...new Set(REALTIME_ITEMS.map(i=>i.checklist))].map(name=>({
  name,
  items: REALTIME_ITEMS.filter(i=>i.checklist===name),
}))

const TEMPLATES: Record<string, {name:string;items:string[]}[]> = {
  realtime: [
    {name:'后厨卫生清单',items:REALTIME_CHECKLISTS.find(c=>c.name==='后厨卫生清单')?.items.map(i=>i.name)||[]},
    {name:'前厅服务清单',items:REALTIME_CHECKLISTS.find(c=>c.name==='前厅服务清单')?.items.map(i=>i.name)||[]},
    {name:'外卖卫生清单',items:REALTIME_CHECKLISTS.find(c=>c.name==='外卖卫生清单')?.items.map(i=>i.name)||[]},
    {name:'安全消防清单',items:REALTIME_CHECKLISTS.find(c=>c.name==='安全消防清单')?.items.map(i=>i.name)||[]},
  ],
  combo: [
    {name:'早班开店巡检',items:['前厅开门检查','后厨备料检查','收银机准备']},
    {name:'午市高峰巡检',items:['就餐区环境巡查','后厨出餐效率','外卖交接规范']},
    {name:'晚市收市巡检',items:['后厨清洁消毒','仓库盘点封存','出入口落锁']},
  ],
  process: [
    {name:'后厨流程合规巡检',items:['穿戴规范→洗手消毒→食材验收→加工操作→出餐检查→留样记录']},
    {name:'晚市营业标准流程巡检',items:['晚市备货→人员到岗→设备检查→营业规范→收市清场']},
  ],
  spot: [
    {name:'随机抽检-标签',items:['按AI识别标签抽检','按重点监控设备抽检','按夜视设备抽检']},
    {name:'突击合规抽检',items:['后厨突击','收银突击','前厅突击']},
  ],
};

/* ═══ 流程巡检数据 ═══ */
const PROCESS_FLOWS = [
  {
    id:'PF01', name:'开市巡检SOP', time:'每日 08:30-08:50', dateRange:'2026-05-21 至 2026-12-31', frequency:'1次/天',
    steps: [
      { step:1, time:'08:30-08:35', name:'检查前厅桌椅摆放整齐度', refImg:'桌椅标准照', rule:'《门店营业SOP》第2章·前厅摆台规范，桌椅须对齐地面标记线，间距统一45cm，桌面无杂物残留', cameras:['前厅全景'] },
      { step:2, time:'08:35-08:40', name:'查验前厅地面环境卫生', refImg:'地面标准照', rule:'《门店卫生标准》第1章·地面清洁要求，无积水、无油渍、无纸屑，墙角线无积灰', cameras:['前厅全景','就餐区'] },
      { step:3, time:'08:40-08:45', name:'查看后厨食材分类存放情况', refImg:'食材存放照', rule:'《食安管理条例》第3章·食材存放，生熟分离、荤素分架、标签清晰、先进先出原则执行到位', cameras:['后厨全景'] },
      { step:4, time:'08:45-08:50', name:'核查后厨人员着装规范', refImg:'着装标准照', rule:'《食安管理条例》第1章·人员卫生，工服整洁、帽子佩戴、口罩遮口鼻、围裙无破损', cameras:['后厨全景'] },
    ],
  },
  {
    id:'PF02', name:'午间巡检SOP', time:'每日 12:00-12:20', dateRange:'2026-05-21 至 2026-12-31', frequency:'1次/天',
    steps: [
      { step:1, time:'12:00-12:05', name:'检查前厅餐台即时清理状态', refImg:'餐台标准照', rule:'《门店卫生标准》第1章·翻台规范，每桌翻台2分钟内完成清洁，台面消毒液擦拭无残渣', cameras:['前厅全景','就餐区'] },
      { step:2, time:'12:05-12:10', name:'查看过道通行有无杂物遮挡', refImg:'过道标准照', rule:'《门店安全管理》第2章·通道管理，主通道宽度≥1.2米，无障碍物堆放，消防器材前无遮挡', cameras:['前厅全景'] },
      { step:3, time:'12:10-12:15', name:'核查后厨操作台面整洁度', refImg:'操作台照', rule:'《食安管理条例》第4章·加工操作，台面无油污积水，刀具砧板按色标分类归位', cameras:['后厨全景'] },
      { step:4, time:'12:15-12:20', name:'检查后厨垃圾收纳摆放', refImg:'垃圾收纳照', rule:'《食安管理条例》第9章·废弃物处理，垃圾桶加盖密闭，垃圾袋不超2/3满，分类标识清晰', cameras:['后厨全景'] },
    ],
  },
  {
    id:'PF03', name:'晚间巡检SOP', time:'每日 18:30-18:50', dateRange:'2026-05-21 至 2026-12-31', frequency:'1次/天',
    steps: [
      { step:1, time:'18:30-18:35', name:'检查前厅灯光设备运行状态', refImg:'灯光标准照', rule:'《门店营业SOP》第3章·设备管理，所有灯具正常发光无闪烁，装饰灯带完好，应急照明可正常启动', cameras:['前厅全景'] },
      { step:2, time:'18:35-18:40', name:'查看顾客区域设施完好情况', refImg:'设施标准照', rule:'《门店设备维护规范》第1章·日常巡检，桌椅稳固无晃动、空调出风正常、背景音乐清晰无杂音', cameras:['就餐区'] },
      { step:3, time:'18:40-18:45', name:'核验后厨厨具使用摆放规范', refImg:'厨具标准照', rule:'《食安管理条例》第4章·设备器具，所有厨具定位归架、表面清洁干燥、无破损残缺', cameras:['后厨全景'] },
      { step:4, time:'18:45-18:50', name:'检查店内通道畅通情况', refImg:'通道标准照', rule:'《门店安全管理》第2章·通道管理，主辅通道无堆物、疏散指示清晰、防火门关闭严密', cameras:['正门'] },
    ],
  },
  {
    id:'PF04', name:'闭市巡检SOP', time:'每日 21:10-21:30', dateRange:'2026-05-21 至 2026-12-31', frequency:'1次/天',
    steps: [
      { step:1, time:'21:10-21:15', name:'检查前厅全部桌椅归位情况', refImg:'归位标准照', rule:'《门店营业SOP》第7章·收市规范，桌椅全部归位至指定区域，靠墙叠放整齐，无遗漏零散', cameras:['前厅全景'] },
      { step:2, time:'21:15-21:20', name:'查看后厨设备关停状态', refImg:'关停标准照', rule:'《门店安全管理》第3章·闭店守则，全部烹饪设备关闭、燃气阀门拧紧、排烟系统停止运行', cameras:['后厨全景'] },
      { step:3, time:'21:20-21:25', name:'核查门店垃圾全部清运完毕', refImg:'清运标准照', rule:'《食安管理条例》第9章·废弃物处理，当日垃圾全部清运，垃圾桶清洗归位，无遗漏垃圾袋', cameras:['仓库全景'] },
      { step:4, time:'21:25-21:30', name:'检查门店门窗锁闭情况', refImg:'锁闭标准照', rule:'《门店安全管理》第3章·闭店守则，全部门窗锁闭确认，收银机清机锁好，报警系统设防', cameras:['正门','侧门'] },
    ],
  },
]

/* ═══ 组合巡检场景数据 ═══ */
const COMBO_SCENES = [
  {
    id:'CS01', name:'早班开店巡检', time:'每日 06:30', dateRange:'2026-05-21 至 2026-12-31', frequency:'1次/天',
    items: [
      { name:'前厅开门检查', refImgs:['开门正面','灯光状态','迎宾区'], rule:'根据《门店营业SOP》第2章第1节规定，开门前须完成灯光系统检查、收银机启动、迎宾区布置及地面清洁，确保早班营业环境符合标准，由当班店长确认后签字归档', cameras:['正门','前厅全景'] },
      { name:'后厨备料检查', refImgs:['备料台','冷藏温度'], rule:'按照《食品安全管理条例》第3章第2节规范，所有食材须按先进先出原则摆放，冷藏温度≤4°C冷冻≤-18°C，备料台面及器具须经消毒后方可使用', cameras:['备料间','后厨全景'] },
      { name:'收银机准备', refImgs:['收银台开机','价目核对'], rule:'依据《门店营业SOP》第4章第1节要求，收银机须在营业前30分钟完成开机自检，核对当日促销价目，确认扫码枪及打印机正常，备用金2000元盘点无误', cameras:['收银台近景'] },
    ],
  },
  {
    id:'CS02', name:'午市高峰巡检', time:'每日 12:00', dateRange:'2026-05-21 至 2026-12-31', frequency:'2次/天',
    items: [
      { name:'就餐区环境巡查', refImgs:['就餐区全景','桌面整洁'], rule:'执行《门店卫生标准》第1章就餐区规范，每桌翻台后须在2分钟内完成清洁，地面每15分钟拖扫一次，空调温度26°C±1，背景音乐音量不高于55分贝', cameras:['就餐区'] },
      { name:'后厨出餐效率', refImgs:['出餐台','出餐记录屏'], rule:'《门店营业SOP》第5章第3节规定午市高峰出餐时限：小吃类≤3分钟、主食类≤5分钟、套餐≤8分钟，出餐口须有专人核单，杜绝漏单错单，每一小时上报出餐数据', cameras:['出餐口','后厨全景'] },
      { name:'外卖交接规范', refImgs:['打包台','封签特写','骑手核验'], rule:'执行《外卖管理规范》第2章第1条，外卖打包须使用标准封装袋并粘贴封签，骑手取餐时核验订单号及餐品完整度，交接台区域须保持干燥整洁并设独立监控', cameras:['外卖打包区'] },
    ],
  },
  {
    id:'CS03', name:'晚市收市巡检', time:'每日 21:30', dateRange:'2026-05-21 至 2026-12-31', frequency:'1次/天',
    items: [
      { name:'后厨清洁消毒', refImgs:['消毒柜','地面消杀'], rule:'按《食品安全管理条例》第6章清洁消毒规范执行，所有厨具须经高温消毒柜120°C处理30分钟，地面用食品级消毒液全面消杀，排水沟冲洗至无食物残渣残留', cameras:['洗碗间','后厨全景'] },
      { name:'仓库盘点封存', refImgs:['盘点清单','封存柜'], rule:'《门店营业SOP》第7章收市流程要求日结盘点：确认当日食材消耗量、录入次日采购清单、贵重食材封存上锁，门窗关闭后由店长与值班经理共同签字确认', cameras:['仓库全景'] },
      { name:'出入口落锁', refImgs:['正门锁闭','侧门锁闭','报警系统'], rule:'依据《门店安全管理》第3章闭店守则，逐一检查所有出入口锁闭状态、消防通道畅通无阻、报警系统设防启动，闭店记录拍照上传至巡店系统存档备查', cameras:['正门','侧门'] },
    ],
  },
]

const STORES = getAllStores().map(s => s.name)

/* ═══ 统计指标卡 ═══ */
const StatCards: React.FC<{mode: string}> = ({mode}) => {
  const mt = TASKS.filter(t => t.mode === mode)
  const done = mt.filter(t => t.status === 'done').length
  const running = mt.filter(t => t.status === 'running').length
  const waiting = mt.filter(t => t.status === 'waiting').length
  const mcfg = MODE_CFG[mode]
  const Icon = mcfg.icon
  return (
    <div className="grid grid-cols-4 gap-3">
      <div className="card-level-1 p-3 space-y-1"><div className="text-[10px] text-[var(--text-muted)]">总任务</div><div className="text-xl font-bold text-[var(--text-primary)]">{mt.length}<span className="text-xs font-normal text-[var(--text-muted)] ml-1">个</span></div></div>
      <div className="card-level-1 p-3 space-y-1"><div className="text-[10px] text-[var(--text-muted)]">进行中</div><div className="text-xl font-bold text-amber-400">{running}<span className="text-xs font-normal text-[var(--text-muted)] ml-1">个</span></div></div>
      <div className="card-level-1 p-3 space-y-1"><div className="text-[10px] text-[var(--text-muted)]">已完成</div><div className="text-xl font-bold text-emerald-400">{done}<span className="text-xs font-normal text-[var(--text-muted)] ml-1">个</span></div></div>
      <div className="card-level-1 p-3 space-y-1"><div className="text-[10px] text-[var(--text-muted)]">待执行</div><div className="text-xl font-bold text-blue-400">{waiting}<span className="text-xs font-normal text-[var(--text-muted)] ml-1">个</span></div></div>
    </div>
  )
}

/* ═══ 实时巡检视图（左侧设备树 + 右侧巡检项/绑定摄像头） ═══ */
const BINDINGS: Record<string, {store:string;camera:string;cameraId:string}[]> = {
  'RI001':[{store:'IFS国金中心',camera:'后厨全景',cameraId:'IFS-D003'},{store:'太平街店',camera:'后厨全景',cameraId:'TPJ-D005'},{store:'德思勤店',camera:'后厨全景',cameraId:'DSQ-D003'}],
  'RI002':[{store:'IFS国金中心',camera:'后厨全景',cameraId:'IFS-D001'},{store:'太平街店',camera:'后厨全景',cameraId:'TPJ-D001'}],
  'RI003':[{store:'IFS国金中心',camera:'冷冻柜',cameraId:'IFS-D008'},{store:'梅溪湖步步高店',camera:'冷藏柜',cameraId:'MXH-D012'}],
  'RI004':[{store:'IFS国金中心',camera:'前厅全景',cameraId:'IFS-D010'},{store:'德思勤店',camera:'就餐区',cameraId:'DSQ-D007'}],
  'RI005':[{store:'IFS国金中心',camera:'收银台近景',cameraId:'IFS-D015'},{store:'太平街店',camera:'收银台近景',cameraId:'TPJ-D010'}],
  'RI006':[{store:'IFS国金中心',camera:'前厅全景',cameraId:'IFS-D010'},{store:'湖滨银泰店',camera:'前厅全景',cameraId:'HZ-D002'}],
  'RI007':[{store:'IFS国金中心',camera:'打包区全景',cameraId:'IFS-D018'},{store:'开福万达店',camera:'打包区全景',cameraId:'KFWD-D014'}],
  'RI008':[{store:'IFS国金中心',camera:'正门',cameraId:'IFS-D020'},{store:'悦方ID店',camera:'正门',cameraId:'YF-D003'}],
  'RI009':[{store:'梅溪湖步步高店',camera:'仓库全景',cameraId:'MXH-D016'},{store:'德思勤店',camera:'仓库全景',cameraId:'DSQ-D015'}],
  'RI010':[{store:'IFS国金中心',camera:'消毒间',cameraId:'IFS-D022'},{store:'太平街店',camera:'消毒间',cameraId:'TPJ-D008'}],
}

const RealTimeView: React.FC = () => {
  const [selectedStore, setSelectedStore] = useState('全部')
  const [selectedItem, setSelectedItem] = useState<string>(REALTIME_ITEMS[0].id)

  const [selectedCamera, setSelectedCamera] = useState<{store:string;camera:string;cameraId:string}|null>(null)

  const curItem = REALTIME_ITEMS.find(i=>i.id===selectedItem)
  const bindings = BINDINGS[selectedItem] || []
  const filteredBindings = selectedStore==='全部'?bindings:bindings.filter(b=>b.store===selectedStore)

  // 门店架构树渲染
  const [checklistTab, setChecklistTab] = useState(REALTIME_CHECKLISTS[0]?.name||'')

  // 门店架构树 - 与设备管理一致：展开/收起 + 图标
  const StoreTreeItem: React.FC<{ node: StoreNode; depth: number }> = ({ node, depth }) => {
    const [open, setOpen] = useState(depth < 3)
    const hasChildren = node.children && node.children.length > 0
    const isStore = node.type === 'store'
    const isSelected = selectedStore === node.name

    return (
      <div>
        <button
          onClick={() => { if (hasChildren) setOpen(!open); if (isStore) setSelectedStore(node.name) }}
          className={`w-full flex items-center gap-1.5 py-1.5 text-xs rounded transition-colors ${isSelected ? 'bg-[rgba(59,130,246,0.12)] text-blue-400' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
          style={{ paddingLeft: depth * 12 + 8, paddingRight: 8 }}
        >
          {hasChildren ? (
            <ChevronDown className={`w-3 h-3 shrink-0 transition ${open ? '' : '-rotate-90'}`} />
          ) : (
            <ChevronRight className="w-3 h-3 shrink-0 opacity-0" />
          )}
          {STORE_ICONS[node.type] || null}
          <span className="truncate flex-1 text-left">{node.name}</span>
        </button>
        {open && hasChildren && node.children!.map(c => <StoreTreeItem key={c.id} node={c} depth={depth + 1} />)}
      </div>
    )
  }

  const STORE_ICONS: Record<string, React.ReactNode> = {
    brand: <Globe className="w-3 h-3"/>,
    region: <MapPin className="w-3 h-3"/>,
    province: <Building2 className="w-3 h-3"/>,
    city: <Building2 className="w-3 h-3"/>,
    district: <Building2 className="w-3 h-3"/>,
    store: <Store className="w-3 h-3"/>,
  }


  return (
    <div className="flex gap-3 h-full">
      {/* ═══ 左侧：设备架构树 ═══ */}
      <div className="w-[240px] shrink-0 card-level-1 overflow-hidden flex flex-col" style={{padding:0}}>
        <div className="card-header px-3"><span className="card-header-title">门店架构</span>
        </div>
        <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
          {STORE_TREE.children?.map(n => <StoreTreeItem key={n.id} node={n} depth={1} />)}
        </div>
        <div className="p-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)]">
          {selectedStore==='全部'?'全部门店':selectedStore} · {filteredBindings.length} 个摄像头绑定
        </div>
      </div>

      {/* ═══ 右侧：巡检项 + 绑定摄像头 ═══ */}
      <div className="flex-1 flex flex-col gap-2 overflow-hidden">
        {/* 上方：双层Tab切换清单 → 巡检项 */}
        <div className="card-level-1 overflow-hidden flex flex-col" style={{padding:0}}>
          <Tabs activeKey={checklistTab} onChange={setChecklistTab} size="small" tabBarStyle={{padding:'0 12px',marginTop:7,marginBottom:0}}
            tabBarExtraContent={<Button size="small" danger icon={<Plus className="w-3 h-3"/>} style={{marginRight:8,marginTop:4,marginBottom:4}}>新建场景</Button>}
            items={REALTIME_CHECKLISTS.map(cl => {
              const activeCl = REALTIME_CHECKLISTS.find(c=>c.name===checklistTab)
              const items = cl.name===checklistTab ? activeCl?.items||[] : []
              return {
                key: cl.name,
                label: <span style={{fontSize:'0.75rem'}}>{cl.name}</span>,
                children: (
                  <div className="overflow-y-auto" style={{marginTop:4}}>
                    <div className="card-header px-3" style={{paddingTop:0,paddingBottom:4}}><span className="card-header-title">巡检项</span><span className="text-[10px] text-[var(--text-muted)]">{items.length}项</span></div>
                    <div className="divide-y divide-[var(--border-subtle)]">
                      {items.map(item => (
                        <div key={item.id}
                          onClick={()=>setSelectedItem(item.id)}
                          className={`flex items-center gap-3 px-3 py-2.5 text-xs cursor-pointer transition-colors ${selectedItem===item.id?'bg-[rgba(59,130,246,0.06)]':''}`}>
                          <span className="w-5 h-5 rounded bg-[var(--bg-tertiary)] flex items-center justify-center text-[9px] font-mono text-[var(--text-muted)] shrink-0">
                            {items.indexOf(item)+1}
                          </span>
                          <span className={`flex-1 ${selectedItem===item.id?'text-[var(--ai-blue-500)] font-medium':'text-[var(--text-primary)]'}`}>
                            {item.name}
                          </span>
                          <Camera className="w-3 h-3 text-[var(--text-muted)]"/>
                          <span className="text-[10px] text-[var(--text-muted)]">{BINDINGS[item.id]?.length||0}路</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              }
            })}/>
        </div>

        {/* 下方：绑定摄像头 */}
        <div className="flex-1 card-level-1 overflow-hidden flex flex-col" style={{padding:0}}>
          <div className="card-header px-3">
            <span className="card-header-title">绑定摄像头 · {curItem?.name||'请选择巡检项'}</span>
            <span className="text-[10px] text-[var(--text-muted)]">{filteredBindings.length}路</span>
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredBindings.length===0 ? (
              <p className="p-6 text-center text-xs text-[var(--text-muted)]">点击上方巡检项查看绑定的门店摄像头</p>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] sticky top-0">
                  <tr>
                    <th className="px-3 py-1.5 text-left text-[var(--text-muted)] font-medium">门店</th>
                    <th className="px-3 py-1.5 text-left text-[var(--text-muted)] font-medium">摄像头</th>
                    <th className="px-3 py-1.5 text-left text-[var(--text-muted)] font-medium">摄像头ID</th>
                    <th className="px-2 py-1.5 text-center text-[var(--text-muted)] font-medium whitespace-nowrap" style={{minWidth:36}}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBindings.map((b,i) => (
                    <tr key={i} className="border-b border-[var(--border-subtle)]">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Store className="w-3 h-3 text-emerald-400/60"/>
                          <span className="text-[var(--text-primary)]">{b.store}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[var(--text-secondary)]">
                        <div className="flex items-center gap-1.5">
                          <Camera className="w-3 h-3 text-[var(--text-muted)]"/>
                          {b.camera}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[var(--text-secondary)] font-mono text-[10px]">{b.cameraId}</td>
                      <td className="px-3 py-2.5 text-right">
                        <Button size="small" type="link" style={{fontSize:12,padding:0}} onClick={()=>setSelectedCamera(b)}>详情</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 摄像头详情 Drawer */}
        <Drawer title="摄像头详情" open={!!selectedCamera} onClose={()=>setSelectedCamera(null)} width={480} destroyOnClose
          styles={{header:{background:'var(--bg-secondary)',borderBottom:'1px solid var(--border-subtle)'},body:{background:'var(--bg-primary)',padding:16}}}>
          {selectedCamera && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-[var(--text-muted)]">门店：</span><span className="text-[var(--text-primary)] font-medium">{selectedCamera.store}</span></div>
                <div><span className="text-[var(--text-muted)]">摄像头：</span><span className="text-[var(--text-primary)] font-medium">{selectedCamera.camera}</span></div>
                <div><span className="text-[var(--text-muted)]">摄像头ID：</span><span className="text-[var(--text-primary)] font-mono">{selectedCamera.cameraId}</span></div>
                <div><span className="text-[var(--text-muted)]">接入方式：</span><Tag style={{fontSize:12}}>AI盒子</Tag></div>
                <div><span className="text-[var(--text-muted)]">分辨率：</span><span className="text-[var(--text-primary)]">1080P</span></div>
                <div><span className="text-[var(--text-muted)]">帧率：</span><span className="text-[var(--text-primary)]">25FPS</span></div>
                <div><span className="text-[var(--text-muted)]">绑定巡检项：</span><span className="text-[var(--text-primary)]">{curItem?.name}</span></div>
                <div><span className="text-[var(--text-muted)]">状态：</span><span className="text-emerald-400">● 在线</span></div>
              </div>
              <div className="bg-black rounded flex items-center justify-center" style={{aspectRatio:'16/9'}}>
                <Camera className="w-12 h-12 text-white/10"/>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </div>
  )
}

/* ═══ 组合巡检视图（场景项 → 巡检项 → 参考图 → 规则 → 定时抓拍） ═══ */
const ComboView: React.FC = () => {
  const [storeFilter, setStoreFilter] = useState('全部')
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set(COMBO_SCENES.map(s=>s.id)))
  const toggleScene = (id:string) => {
    const next = new Set(expandedScenes)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpandedScenes(next)
  }

  return (
    <div className="space-y-3">
      <StatCards mode="combo" />

      <div className="flex items-center gap-3">
        <Select size="middle" value={storeFilter} onChange={setStoreFilter} style={{width:140}}
          options={[{value:'全部',label:'全部门店'},...STORES.map(s=>({value:s,label:s}))]}/>
        <div className="flex-1"/>
        <Button size="middle" type="primary" icon={<Plus className="w-3.5 h-3.5"/>}>新建场景</Button>
      </div>

      {COMBO_SCENES.map(scene => (
        <div key={scene.id} className="card-level-1 overflow-hidden" style={{padding:0}}>
          <div className="card-header px-4">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-emerald-400"/>
              <span className="card-header-title">{scene.name}</span>
              <Tag color="green" style={{fontSize:12}}>{scene.time} 自动执行</Tag>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button size="small" type="text" icon={expandedScenes.has(scene.id)?<ChevronDown className="w-3.5 h-3.5"/>:<ChevronRight className="w-3.5 h-3.5"/>}
                onClick={()=>toggleScene(scene.id)}/>
            </div>
          </div>

          {expandedScenes.has(scene.id) && (
            <div className="divide-y divide-[var(--border-subtle)]">
              {scene.items.map((item, idx) => (
                <div key={idx} className="px-4 py-2.5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-medium shrink-0">
                      {idx+1}
                    </span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">{item.name}</span>
                    <Tag style={{fontSize:12}}>巡检项</Tag>
                  </div>
                  <div className="grid gap-3 ml-8" style={{gridTemplateColumns:'85px 2fr 1fr 1fr 1fr 1fr'}}>
                    {/* 参考图 */}
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] text-[var(--text-muted)] mb-0.5">参考图</span>
                      <div className="rounded overflow-hidden bg-black/50 cursor-pointer hover:opacity-80" style={{width:85,height:48}}
                        onClick={()=>message.info(`查看参考图：${item.refImgs[0]}`)}>
                        <div className="flex flex-col items-center justify-center h-full">
                          <Camera className="w-2.5 h-2.5 text-white/12"/>
                          <span className="text-[6px] text-white/25 mt-0.5">{item.refImgs[0]}</span>
                        </div>
                      </div>
                    </div>
                    {/* 门店规范 */}
                    <div className="min-w-0 flex flex-col justify-center">
                      <span className="text-[10px] text-[var(--text-muted)] mb-0.5">门店规范</span>
                      <div className="bg-[var(--bg-tertiary)] rounded px-2 flex items-center overflow-hidden" style={{height:48}}>
                        <span className="text-xs text-[var(--text-secondary)] leading-snug line-clamp-2">{item.rule}</span>
                      </div>
                    </div>
                    {/* 巡检周期 */}
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] text-[var(--text-muted)] mb-0.5">巡检周期</span>
                      <div className="bg-[var(--bg-tertiary)] rounded px-2 flex items-center" style={{height:48}}>
                        <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">{scene.dateRange}</span>
                      </div>
                    </div>
                    {/* 巡检频次 */}
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] text-[var(--text-muted)] mb-0.5">巡检频次</span>
                      <div className="bg-[var(--bg-tertiary)] rounded px-2 flex items-center" style={{height:48}}>
                        <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">{scene.frequency}</span>
                      </div>
                    </div>
                    {/* 巡检方式 */}
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] text-[var(--text-muted)] mb-0.5">巡检方式</span>
                      <div className="bg-[var(--bg-tertiary)] rounded px-2 flex items-center gap-1.5" style={{height:48}}>
                        <Clock className="w-3 h-3 text-emerald-400"/>
                        <span className="text-xs text-emerald-400 font-medium whitespace-nowrap">定时抓拍</span>
                      </div>
                    </div>
                    {/* 设备 */}
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] text-[var(--text-muted)] mb-0.5">设备</span>
                      <div className="bg-[var(--bg-tertiary)] rounded px-2 flex items-center" style={{height:48}}>
                        <Button size="small" type="link" style={{fontSize:12,padding:0,height:'auto'}}>详情</Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ═══ 流程巡检视图 ═══ */
const ProcessView: React.FC = () => {
  const [expandedFlows, setExpandedFlows] = useState<Set<string>>(new Set(PROCESS_FLOWS.map(f=>f.id)))
  const toggleFlow = (id:string) => {
    const next = new Set(expandedFlows)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpandedFlows(next)
  }

  const [storeFilter, setStoreFilter] = useState('全部')

  return (
    <div className="space-y-3">
      <StatCards mode="process" />
      <div className="flex items-center gap-3">
        <Select size="middle" value={storeFilter} onChange={setStoreFilter} style={{width:140}}
          options={[{value:'全部',label:'全部门店'},...STORES.map(s=>({value:s,label:s}))]}/>
        <div className="flex-1"/>
        <Button size="middle" danger icon={<Plus className="w-3.5 h-3.5"/>}>新建场景</Button>
      </div>
      {PROCESS_FLOWS.map(flow => (
        <div key={flow.id} className="card-level-1 overflow-hidden" style={{padding:0}}>
          <div className="card-header px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListChecks className="w-3.5 h-3.5 text-purple-400"/>
              <span className="card-header-title">{flow.name}</span>
              <Tag color="purple" style={{fontSize:12}}>{flow.time} 自动执行</Tag>
            </div>
            <Button size="small" type="text" icon={expandedFlows.has(flow.id)?<ChevronDown className="w-3.5 h-3.5"/>:<ChevronRight className="w-3.5 h-3.5"/>}
              onClick={()=>toggleFlow(flow.id)}/>
          </div>
          {expandedFlows.has(flow.id) && (
            <div className="px-4 py-3 space-y-0">
              {flow.steps.map((st, idx) => (
                <div key={st.step} className="flex items-stretch gap-3 relative">
                  <div className="flex flex-col items-center shrink-0" style={{width:28}}>
                    <span className="w-6 h-6 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center text-[10px] font-medium z-10">
                      {st.step}
                    </span>
                    {idx < flow.steps.length-1 && (
                      <div className="w-px flex-1 min-h-[20px]" style={{background:'var(--border-subtle)'}}/>
                    )}
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-mono text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">{st.time}</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">{st.name}</span>
                    </div>
                    <div className="grid gap-3" style={{gridTemplateColumns:'85px 2fr 1fr 1fr 1fr 1fr'}}>
                      {/* 参考图 */}
                      <div className="flex flex-col justify-center">
                        <span className="text-[10px] text-[var(--text-muted)] mb-0.5">参考图</span>
                        <div className="rounded overflow-hidden bg-black/50 cursor-pointer hover:opacity-80" style={{width:85,height:48}}
                          onClick={()=>message.info(`参考图：${st.refImg}`)}>
                          <div className="flex flex-col items-center justify-center h-full">
                            <Camera className="w-2.5 h-2.5 text-white/12"/>
                            <span className="text-[6px] text-white/20 mt-0.5">{st.refImg}</span>
                          </div>
                      </div>
                      </div>
                      {/* 门店规范 */}
                      <div className="min-w-0 flex flex-col justify-center">
                        <span className="text-[10px] text-[var(--text-muted)] mb-0.5">门店规范</span>
                        <div className="bg-[var(--bg-tertiary)] rounded px-2 flex items-center overflow-hidden" style={{height:48}}>
                          <span className="text-xs text-[var(--text-secondary)] leading-snug line-clamp-2">{st.rule}</span>
                        </div>
                      </div>
                      {/* 巡检周期 */}
                      <div className="flex flex-col justify-center shrink-0">
                        <span className="text-[10px] text-[var(--text-muted)] mb-0.5">巡检周期</span>
                        <div className="bg-[var(--bg-tertiary)] rounded px-2 flex items-center" style={{height:48}}>
                          <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">{flow.dateRange}</span>
                        </div>
                      </div>
                      {/* 巡检频次 */}
                      <div className="flex flex-col justify-center shrink-0">
                        <span className="text-[10px] text-[var(--text-muted)] mb-0.5">巡检频次</span>
                        <div className="bg-[var(--bg-tertiary)] rounded px-2 flex items-center" style={{height:48}}>
                          <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">{flow.frequency}</span>
                        </div>
                      </div>
                      {/* 巡检方式 */}
                      <div className="flex flex-col justify-center shrink-0">
                        <span className="text-[10px] text-[var(--text-muted)] mb-0.5">巡检方式</span>
                        <div className="bg-[var(--bg-tertiary)] rounded px-2 flex items-center gap-1.5" style={{height:48}}>
                          <Clock className="w-3 h-3 text-purple-400"/>
                          <span className="text-[10px] text-purple-400 font-medium whitespace-nowrap">定时抓拍</span>
                        </div>
                      </div>
                      {/* 设备 */}
                      <div className="flex flex-col justify-center shrink-0">
                        <span className="text-[10px] text-[var(--text-muted)] mb-0.5">设备</span>
                        <div className="bg-[var(--bg-tertiary)] rounded px-2 flex items-center gap-1" style={{height:48}}>
                          <Camera className="w-3 h-3 text-[var(--text-muted)]"/>
                          {st.cameras.map(c => <Tag key={c} color="blue" style={{fontSize:12,margin:0}}>{c}</Tag>)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ═══ 巡检任务列表页 ═══ */
const InspectionListView: React.FC<{mode: string}> = ({mode}) => {
  const [storeFilter, setStoreFilter] = useState('全部')
  const [statusFilter, setStatusFilter] = useState('全部')
  const [search, setSearch] = useState('')

  const mt = TASKS.filter(t => t.mode === mode).filter(t => {
    if (storeFilter !== '全部' && !t.stores.some(s=>s.includes(storeFilter))) return false
    if (statusFilter !== '全部' && t.status !== statusFilter) return false
    if (search && !t.templateName.includes(search) && !t.assignee.includes(search)) return false
    return true
  })

  const statusLabel:Record<string,string> = {waiting:'待执行',running:'进行中',done:'已完成',reviewing:'复核中'}
  const statusColor:Record<string,string> = {waiting:'default',running:'processing',done:'success',reviewing:'orange'}

  return (
    <div className="space-y-3">
      <StatCards mode={mode} />

      {/* 筛选区 */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input size="middle" prefix={<Search className="w-3.5 h-3.5"/>} value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="搜索模板/负责人..." style={{width:200}} allowClear/>
        <Select size="middle" value={storeFilter} onChange={setStoreFilter} style={{width:140}}
          options={[{value:'全部',label:'全部'},...STORES.map(s=>({value:s,label:s}))]}/>
        <Select size="middle" value={statusFilter} onChange={setStatusFilter} style={{width:100}}
          options={['全部','waiting','running','done','reviewing'].map(s=>({value:s,label:statusLabel[s]}))}/>
        <DatePicker size="middle" placeholder="开始日期" style={{width:130}}/>
        <div className="flex-1"/>
        <Button size="middle" type="primary" icon={<Plus className="w-3.5 h-3.5"/>}>创建任务</Button>
      </div>

      {/* 任务列表 */}
      <div className="card-level-1 overflow-hidden" style={{padding:0}}>
        <table className="w-full text-xs">
          <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)]">
            <tr>
              <th className="px-4 py-2.5 text-left text-[var(--text-muted)] font-medium">巡检模板</th>
              <th className="px-3 py-2.5 text-left text-[var(--text-muted)] font-medium">目标门店</th>
              <th className="px-3 py-2.5 text-center text-[var(--text-muted)] font-medium">状态</th>
              <th className="px-3 py-2.5 text-left text-[var(--text-muted)] font-medium">进度</th>
              <th className="px-3 py-2.5 text-left text-[var(--text-muted)] font-medium">负责人</th>
              <th className="px-3 py-2.5 text-left text-[var(--text-muted)] font-medium">开始时间</th>
              <th className="px-3 py-2.5 text-center text-[var(--text-muted)] font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {mt.map(t => (
              <tr key={t.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                <td className="px-4 py-2.5 font-medium text-[var(--text-primary)]">
                  <div className="flex items-center gap-1.5">
                    <Tag style={{fontSize:12}}>{t.type}</Tag>{t.templateName}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-[var(--text-secondary)]">
                  <span className="text-[10px]">{t.stores.slice(0,2).join('、')}{t.stores.length>2?` 等${t.storeCount}家`:''}</span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <Tag color={statusColor[t.status]} style={{fontSize:12}}>{statusLabel[t.status]}</Tag>
                </td>
                <td className="px-3 py-2.5"><Progress percent={t.progress} size="small" showInfo={false} strokeColor={t.progress===100?'#10B981':'#3B82F6'}/></td>
                <td className="px-3 py-2.5 text-[var(--text-secondary)]">
                  <div className="flex items-center gap-1"><User className="w-2.5 h-2.5"/>{t.assignee}</div>
                  {t.notify.length>0 && <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] mt-0.5"><Bell className="w-2 h-2"/>知会: {t.notify.join('、')}</div>}
                </td>
                <td className="px-3 py-2.5 text-[var(--text-muted)]">{t.startTime}</td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Tooltip title="查看详情"><Button size="small" type="text" icon={<Eye className="w-3 h-3"/>}/></Tooltip>
                    {t.status==='done' && <Tooltip title="查看报告"><Button size="small" type="text" icon={<FileText className="w-3 h-3"/>}/></Tooltip>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ═══ 巡检模板页 ═══ */
const TemplateView: React.FC = () => {
  const [tmplTab, setTmplTab] = useState('realtime')
  const tips: Record<string,string> = {
    realtime: '实时巡检模板：用于单/多门店手动即时发起巡检',
    combo: '组合巡检模板：用于定时多点位联合巡查',
    process: '流程巡检模板：按标准化流程合规巡检',
    spot: '临时抽检模板：随机抽查/突击检查（支持语音指令下发）',
  }

  return (
    <div className="space-y-3">
      <Tabs activeKey={tmplTab} onChange={setTmplTab}
        items={Object.entries(MODE_CFG).map(([k,v]) => {
          const Icon = v.icon
          return {key:k,label:<span className="flex items-center gap-1.5"><Icon className="w-3 h-3"/>{v.label}</span>}
        })}/>

      <div className="flex items-center">
        <span className="text-xs text-[var(--text-muted)]">{tips[tmplTab]}</span>
        <div className="flex-1"/>
        <Button size="middle" icon={<Plus className="w-3.5 h-3.5"/>}>新增模板</Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {TEMPLATES[tmplTab]?.map((tmpl, i) => (
          <div key={i} className="card-level-1 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--text-primary)]">{tmpl.name}</span>
                <Tag style={{fontSize:12}}>{tmpl.items.length}项</Tag>
              </div>
              <Button size="small" type="link" style={{fontSize:12}}>编辑</Button>
            </div>
            <div className="text-xs text-[var(--text-muted)]">巡检项：</div>
            <div className="space-y-1">
              {tmpl.items.map((item, j) => (
                <div key={j} className="flex items-center gap-2 text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] rounded px-2 py-1">
                  <span className="w-4 h-4 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[9px]">{j+1}</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══ 主页面 ═══ */
export const InspectionTask: React.FC<{ mode?: string }> = ({ mode: initialMode }) => {
  const [mode, setMode] = useState(initialMode || 'realtime')

  return (
    <div className="p-4 h-full flex flex-col overflow-hidden">
      <div className="shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">{mode==='template'?'巡检模板':MODE_CFG[mode]?.label||'巡检任务'}</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{mode==='template'?'管理四种巡检模式的模板配置':MODE_CFG[mode]?.desc||'创建巡检任务 → AI自动巡检 → 员工整改 → AI自动复盘'}</p>
          </div>
        </div>

      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto mt-3">
        {mode === 'template' ? <TemplateView/> : mode === 'realtime' ? <RealTimeView/> : mode === 'combo' ? <ComboView/> : mode === 'process' ? <ProcessView/> : <InspectionListView mode={mode}/>}
      </div>
    </div>
  )
}
