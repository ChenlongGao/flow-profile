import React, { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronRight, Camera, Wifi, WifiOff, Globe, MapPin, Building2, Store, Home, Layers, Filter, RefreshCw, Settings, Power, Trash2, Plus, MoreVertical, HardDrive, Cpu } from 'lucide-react'
import { Input, Button, Tag as AntTag, Select, Segmented, Dropdown, message, Tooltip, Slider, Progress } from 'antd'
import { STORE_TREE, StoreNode, getAllStores, getCameraCount, walkTree } from '../data/storeTree'

/* ═══ 设备模拟数据 ═══ */
interface Device { id:string; name:string; store:string; zone:string; deviceType:'camera'|'nvr'|'ai-box'; model:string; status:'online'|'offline'|'warning'; ip:string; resolution:string; labels:string[]; lastSeen:string; channel:string }
interface DeviceNode { id:string; name:string; type:string; children?:DeviceNode[]; devices?:Device[] }

const TYPE_CONFIG:Record<string,{label:string;icon:React.FC<{className?:string}>;color:string}> = {
  'camera':{label:'摄像头',icon:Camera,color:'#3B82F6'},
  'nvr':{label:'NVR',icon:HardDrive,color:'#10B981'},
  'ai-box':{label:'AI盒子',icon:Cpu,color:'#8B5CF6'},
}

const genDevices = (storeId: string, count: number): Device[] => {
  const prefix = storeId.replace('s','ST')
  const zones = ['前厅','后厨','收银台','出入口','仓库','外卖打包','就餐区','备料间']
  const cameraModels = ['DS-2CD2T47G2-L','DS-2CD2347G2-LU','DS-2DE4425IW-DE','DS-2CD2087G2-LU','DS-2CD2343G2-IU']
  const nvrModels = ['DS-7608NXI-K2','DS-7716NXI-K4','DS-9632NI-I8']
  const aiModels = ['YT-AIBOX-08','YT-AIBOX-16','YT-AIBOX-32']
  // 前 70% 是摄像头，中间 20% 是 NVR，最后 10% 是 AI 盒子
  return Array.from({length:count},(_,i)=>{
    const tIdx = i/count
    const deviceType:Device['deviceType'] = tIdx<0.7?'camera':tIdx<0.9?'nvr':'ai-box'
    const models = deviceType==='camera'?cameraModels:deviceType==='nvr'?nvrModels:aiModels
    const tp = TYPE_CONFIG[deviceType]
    return {
      id:`${prefix}-D${String(i+1).padStart(3,'0')}`,
      name:`${storeId}-${deviceType==='camera'?'摄像头':deviceType==='nvr'?'NVR':'AI盒子'}-${String(i+1).padStart(2,'0')}`,
      store:storeId, zone:deviceType==='camera'?zones[i%zones.length]:deviceType==='nvr'?'机房':'中控', deviceType,
      model:models[i%models.length],
      status: i%20===0?'offline':i%12===0?'warning':'online' as const,
      ip:`192.168.${i%255}.${(i*7)%255}`,
      resolution:deviceType==='camera'?['1080P','4MP','5MP','2K'][i%4]:deviceType==='nvr'?'4路/8路':'16T',
      labels:deviceType==='camera'?['重点','AI识别','夜视','360°','红外','拾音'].sort(()=>Math.random()-0.5).slice(0,1+Math.floor(Math.random()*2)):
             deviceType==='nvr'?['录像存储','H.265','智能回放'].slice(0,1+Math.floor(Math.random()*2)):
             ['AI分析','违规识别','客流统计'].slice(0,1+Math.floor(Math.random()*2)),
      lastSeen:i%20===0?'2小时前':'刚刚',
      channel:deviceType==='nvr'?`CH1-CH${4+Math.floor(Math.random()*8)}`:deviceType==='ai-box'?'全通道':`CH${i%16+1}`,
    }
  })
}

// 基于共享 STORE_TREE 构建设备树
const buildDeviceTree = (node: StoreNode): DeviceNode => {
  const n: DeviceNode = { id: node.id, name: node.name, type: node.type }
  if (node.type === 'store' && node.storeData?.cameraCount) {
    n.devices = genDevices(node.id, node.storeData.cameraCount)
  } else if (node.children) {
    n.children = node.children.map(buildDeviceTree)
  }
  return n
}
const DEVICE_TREE = buildDeviceTree(STORE_TREE)

const allDevices = (n:DeviceNode):Device[] => { if(n.devices)return n.devices; let a:any[]=[]; n.children?.forEach(c=>a.push(...allDevices(c))); return a }
const collectDeviceStores = (n:DeviceNode):DeviceNode[] => { if(n.type==='store')return [n]; let a:DeviceNode[]=[]; n.children?.forEach(c=>a.push(...collectDeviceStores(c))); return a }

/* ═══ 设备树 ═══ */
const ICONS:Record<string,React.ReactNode> = { brand:<Globe className="w-3 h-3"/>,region:<MapPin className="w-3 h-3"/>,city:<Building2 className="w-3 h-3"/>,store:<Store className="w-3 h-3"/> }

const DeviceTreeItem: React.FC<{node:DeviceNode;depth:number;selected:string;onSelect:(n:DeviceNode)=>void;search:string}> = ({node,depth,selected,onSelect,search}) => {
  const [open,setOpen]=useState(depth<3)
  if(search&&!node.name.includes(search)) return null
  const total = node.devices?node.devices.length:node.children?.reduce((a,c)=>a+(c.devices?.length||0),0)||0
  const online = node.devices?node.devices.filter(d=>d.status==='online').length:node.children?.reduce((a,c)=>a+(c.devices?.filter(d=>d.status==='online').length||0),0)||0
  return <div>
    <button onClick={()=>{node.children?.length&&setOpen(!open);onSelect(node)}} className={`w-full flex items-center gap-1.5 py-1.5 text-xs rounded ${selected===node.id?'bg-[rgba(59,130,246,0.12)] text-blue-400':'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`} style={{paddingLeft:depth*12+8,paddingRight:8}}>
      {node.children?.length?<ChevronDown className={`w-3 h-3 shrink-0 transition ${open?'':'-rotate-90'}`}/>:<ChevronRight className="w-3 h-3 shrink-0 opacity-0"/>}{ICONS[node.type]||null}
      <span className="truncate flex-1 text-left">{node.name}</span>
      {total>0&&<span className={`text-[10px] px-1.5 py-0.5 rounded-full ${online===total?'bg-emerald-500/10 text-emerald-400':online===0?'bg-red-500/10 text-red-400':'bg-amber-500/10 text-amber-400'}`}>{online}/{total}</span>}
    </button>
    {open&&node.children?.map(c=><DeviceTreeItem key={c.id} node={c} depth={depth+1} selected={selected} onSelect={onSelect} search={search}/>)}
  </div>
}

/* ═══ 主页面 ═══ */
export const VideoDevice: React.FC = () => {
  const [search,setSearch]=useState('')
  const [selected,setSelected]=useState('')
  const [selectedNode,setSelectedNode]=useState<DeviceNode|null>(null)
  const [statusFilter,setStatusFilter]=useState('全部')
  const [zoneFilter,setZoneFilter]=useState('全部')
  const [groupFilter,setGroupFilter]=useState('全部')
  const [selectedDevices,setSelectedDevices]=useState<Set<string>>(new Set())
  const [viewMode,setViewMode]=useState<'card'|'list'>('card')

  const stores = collectDeviceStores(DEVICE_TREE)
  const devices = selectedNode?.devices || (selectedNode ? allDevices(selectedNode) : [])

  let filtered = devices.filter(d => {
    if (statusFilter!=='全部' && d.status!==statusFilter) return false
    if (zoneFilter!=='全部' && d.zone!==zoneFilter) return false
    if (search && !d.name.includes(search) && !d.id.includes(search) && !d.model.includes(search)) return false
    return true
  })

  const toggleSelect = (id:string) => {
    const n = new Set(selectedDevices)
    n.has(id)?n.delete(id):n.add(id)
    setSelectedDevices(n)
  }

  const handleBatch = (action:string) => {
    if (selectedDevices.size===0) { message.warning('请先选择设备'); return }
    message.success(`已${action} ${selectedDevices.size} 台设备`)
    setSelectedDevices(new Set())
  }

  return (
    <div className="p-3 flex h-full overflow-hidden gap-3">
      {/* ═══ 左侧组织架构树 ═══ */}
      <div className="w-[260px] shrink-0 card-level-1 flex flex-col overflow-hidden" style={{padding:0}}>
        <div className="card-header"><span className="card-header-title">设备架构</span><span className="text-[10px] text-[var(--text-muted)]">{allDevices(DEVICE_TREE).length}台设备</span></div>
        <div className="p-2 border-b border-[var(--border-subtle)]"><Input size="small" prefix={<Search className="w-3 h-3"/>} value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜索门店或设备..." allowClear/></div>
        <div className="flex-1 overflow-y-auto py-1">
          <DeviceTreeItem node={DEVICE_TREE} depth={0} selected={selected} onSelect={n=>{setSelected(n.id);setSelectedNode(n)}} search={search}/>
        </div>
        {/* 门店分组 */}
        <div className="p-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] mb-2"><Layers className="w-3 h-3"/>门店分组</div>
          <Select size="small" value={groupFilter} onChange={setGroupFilter} style={{width:'100%'}}
            options={['全部','核心门店组','新店组','社区店组','商圈旗舰组'].map(g=>({value:g,label:g}))}/>
        </div>
      </div>

      {/* ═══ 右侧设备管理 ═══ */}
      <div className="flex-1 flex flex-col gap-3 overflow-hidden">
        {/* 筛选栏 */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-muted)]">状态</span>
            <Select size="small" value={statusFilter} onChange={setStatusFilter} style={{width:90}}
              options={['全部','online','offline','warning'].map(s=>({value:s,label:s==='online'?'在线':s==='offline'?'离线':s==='warning'?'警告':s}))}/>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-muted)]">位置</span>
            <Select size="small" value={zoneFilter} onChange={setZoneFilter} style={{width:100}}
              options={['全部','前厅','后厨','出入口','收银台','仓库','就餐区','外卖打包','备料间'].map(z=>({value:z,label:z}))}/>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-muted)]">型号</span>
            <Input size="small" placeholder="搜索型号..." style={{width:130}}/>
          </div>
          <div className="flex-1"/>
          <div className="flex items-center gap-2">
            <Segmented size="small" value={viewMode} onChange={v=>setViewMode(v as 'card'|'list')}
              options={[{value:'card',label:'卡片'},{value:'list',label:'列表'}]}/>
            {selectedDevices.size>0 && <>
              <Button size="small" onClick={()=>handleBatch('重启')} icon={<RefreshCw className="w-3 h-3"/>}>重启</Button>
              <Button size="small" onClick={()=>handleBatch('下线')} danger>下线 {selectedDevices.size}台</Button>
            </>}
            <Button size="small" type="primary" icon={<Plus className="w-3 h-3"/>}>添加设备</Button>
          </div>
        </div>

        {/* 设备展示区 */}
        <div className="flex-1 overflow-y-auto">
          {viewMode==='card' ? (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
            {filtered.map(d => {
              const sel = selectedDevices.has(d.id)
              return (
                <div key={d.id} className={`card-level-1 p-3 space-y-2 cursor-pointer transition-all ${sel?'ring-1 ring-blue-400':''}`}
                  onClick={()=>toggleSelect(d.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {(() => { const Icon = TYPE_CONFIG[d.deviceType].icon; return <Icon className="w-3.5 h-3.5" style={{color:TYPE_CONFIG[d.deviceType].color}}/> })()}
                      <span className="text-xs font-medium text-[var(--text-primary)]">{d.name}</span>
                    </div>
                    <span className={`flex items-center gap-1 text-[9px] ${d.status==='online'?'text-emerald-400':d.status==='warning'?'text-amber-400':'text-red-400'}`}>
                      {d.status==='online'?<Wifi className="w-2.5 h-2.5"/>:d.status==='warning'?<Wifi className="w-2.5 h-2.5"/>:<WifiOff className="w-2.5 h-2.5"/>}
                      {d.status==='online'?'在线':d.status==='warning'?'警告':'离线'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px]">
                    <span className="text-[var(--text-muted)]">门店：{d.store}</span>
                    <span className="text-[var(--text-muted)]">型号：{d.model}</span>
                    <span className="text-[var(--text-muted)]">位置：{d.zone}</span>
                    <span className="text-[var(--text-muted)]">通道：{d.channel}</span>
                    <span className="text-[var(--text-muted)]">分辨率：{d.resolution}</span>
                    <span className="text-[var(--text-muted)]">{TYPE_CONFIG[d.deviceType].label}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {d.labels.map(l=><AntTag key={l} style={{fontSize:8,lineHeight:'14px',padding:'0 4px'}}>{l}</AntTag>)}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
                    <span className="text-[8px] text-[var(--text-muted)]">{d.ip} · {d.lastSeen}</span>
                    <div className="flex items-center gap-0.5">
                      <Tooltip title="远程重启"><Button size="small" type="text" icon={<RefreshCw className="w-3 h-3"/>} style={{padding:'0 4px'}}/></Tooltip>
                      <Tooltip title="通道配置"><Button size="small" type="text" icon={<Settings className="w-3 h-3"/>} style={{padding:'0 4px'}}/></Tooltip>
                      <Dropdown menu={{items:[{key:'reboot',label:'远程重启'},{key:'config',label:'通道配置'},{key:'perm',label:'权限分配'},{type:'divider'},{key:'offline',label:'下线设备',danger:true}]}} trigger={['click']}>
                        <Button size="small" type="text" icon={<MoreVertical className="w-3 h-3"/>} style={{padding:'0 4px'}}/></Dropdown>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          ) : (
          /* 列表视图 */
          <div className="card-level-1 overflow-hidden" style={{padding:0}}>
            <table className="w-full text-xs">
              <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-[var(--text-muted)] font-medium w-8">#</th>
                  <th className="px-3 py-2 text-left text-[var(--text-muted)] font-medium">设备名称</th>
                  <th className="px-3 py-2 text-left text-[var(--text-muted)] font-medium">所属门店</th>
                  <th className="px-3 py-2 text-left text-[var(--text-muted)] font-medium">型号</th>
                  <th className="px-3 py-2 text-left text-[var(--text-muted)] font-medium">位置</th>
                  <th className="px-3 py-2 text-center text-[var(--text-muted)] font-medium">状态</th>
                  <th className="px-3 py-2 text-center text-[var(--text-muted)] font-medium">分辨率</th>
                  <th className="px-3 py-2 text-center text-[var(--text-muted)] font-medium">设备类型</th>
                  <th className="px-3 py-2 text-left text-[var(--text-muted)] font-medium">IP地址</th>
                  <th className="px-3 py-2 text-center text-[var(--text-muted)] font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d,i) => (
                  <tr key={d.id} className={`border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)] ${selectedDevices.has(d.id)?'bg-[rgba(59,130,246,0.06)]':''}`}
                    onClick={()=>toggleSelect(d.id)}>
                    <td className="px-3 py-2.5 text-center text-[var(--text-muted)]">{i+1}</td>
                    <td className="px-3 py-2.5 font-medium text-[var(--text-primary)]">
                      <div className="flex items-center gap-1.5">
                        {(() => { const Icon = TYPE_CONFIG[d.deviceType].icon; return <Icon className="w-3 h-3" style={{color:TYPE_CONFIG[d.deviceType].color}}/> })()}{d.name}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[var(--text-secondary)]">{d.store}</td>
                    <td className="px-3 py-2.5 text-[var(--text-muted)]">{d.model}</td>
                    <td className="px-3 py-2.5 text-[var(--text-secondary)]">{d.zone}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] ${d.status==='online'?'text-emerald-400':d.status==='warning'?'text-amber-400':'text-red-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${d.status==='online'?'bg-emerald-400':d.status==='warning'?'bg-amber-400':'bg-red-400'}`}/>
                        {d.status==='online'?'在线':d.status==='warning'?'警告':'离线'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center text-[var(--text-muted)]">{d.resolution}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="text-[10px] font-medium" style={{color:TYPE_CONFIG[d.deviceType].color}}>{TYPE_CONFIG[d.deviceType].label}</span>
                    </td>
                    <td className="px-3 py-2.5 text-[10px] text-[var(--text-muted)] font-mono">{d.ip}</td>
                    <td className="px-3 py-2.5 text-center">
                      <Dropdown menu={{items:[{key:'reboot',label:'远程重启'},{key:'config',label:'通道配置'},{key:'perm',label:'权限分配'},{type:'divider'},{key:'offline',label:'下线设备',danger:true}]}} trigger={['click']}>
                        <Button size="small" type="text" icon={<MoreVertical className="w-3 h-3"/>}/>
                      </Dropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>

        {/* 底部状态栏 */}
        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] py-2 border-t border-[var(--border-subtle)] shrink-0">
          <span>共 {filtered.length} 台设备 · 在线 {filtered.filter(d=>d.status==='online').length} · 离线 {filtered.filter(d=>d.status==='offline').length} · 警告 {filtered.filter(d=>d.status==='warning').length}</span>
          <span className="flex items-center gap-4">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"/>在线</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"/>警告</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"/>离线</span>
          </span>
        </div>
      </div>
    </div>
  )
}
