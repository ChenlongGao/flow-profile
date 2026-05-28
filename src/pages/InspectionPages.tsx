import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Search, ChevronRight, ChevronDown, Camera, Globe, MapPin, Home, Store, Building2, Wifi, WifiOff, Play, Pause, SkipBack, SkipForward, Maximize2, Tag, Clock, Radio, GitBranch, GitMerge, Circle, CameraOff, Volume2, Expand } from 'lucide-react'
import { Input, Button, Segmented, Pagination, Tooltip, Select, Slider, Dropdown } from 'antd'
import { VideoPlayback } from './VideoPlayback'
import { VideoDevice } from './VideoDevice'
import { STORE_TREE, StoreNode, getCameraCount } from '../data/storeTree'

const ZONES = ['前厅','后厨','收银台','出入口','仓库','外围','洗碗间','备料间','传菜口','就餐区','外卖打包','员工通道','垃圾房']
const CAM_LABELS = ['重点监控','高清设备','AI识别','夜视','360°云台','红外']
interface Cam { id:string; zone:string; status:string; fps:number; resolution:string; labels:string[] }
interface TreeNode { id:string; name:string; type:string; children?:TreeNode[]; online?:number; total?:number; cams?:Cam[] }
interface TimelineState { progress:number; playing:boolean; mode:'live'|'record' }
const PAGESIZE = 8

const genCams = (p:string, n:number): Cam[] =>
  Array.from({length:n},(_,i)=>({id:`${p}-${String(i+1).padStart(2,'0')}`,zone:ZONES[i%ZONES.length],status:'online',fps:15+Math.floor(Math.random()*16),resolution:['1080P','4MP','5MP','2K'][i%4],labels:CAM_LABELS.sort(()=>Math.random()-0.5).slice(0,1+Math.floor(Math.random()*2))}))

// 基于共享 STORE_TREE 构建视频监控树（适配本页面 TreeNode 格式）
const STORE_ID_PREFIX: Record<string, string> = {
  s1:'IFS',s2:'TPJ',s3:'DSQ',s4:'YHT',s5:'MXH',s6:'YF',s7:'KFWD',
  s8:'WH',s9:'HZ',s10:'NJ',s11:'GZ',s12:'SZ',
  s13:'CD',s14:'CQ',s15:'QD',s16:'XA',
}

const buildVideoTree = (node: StoreNode): TreeNode => {
  const typeMap: Record<string,string> = { brand:'总部', region:'区域', province:'省', city:'城市', district:'区县', store:'门店' }
  const n: TreeNode = { id: node.id, name: node.name, type: typeMap[node.type] || node.type }
  if (node.type === 'store') {
    const count = node.storeData?.cameraCount || 15
    n.cams = genCams(STORE_ID_PREFIX[node.id] || node.id, count)
  } else if (node.children) {
    n.children = node.children.map(buildVideoTree)
  }
  return n
}
const TREE: TreeNode = buildVideoTree(STORE_TREE)

const calcStats=(n:TreeNode)=>{if(n.cams){n.online=n.cams.filter(c=>c.status==='online').length;n.total=n.cams.length}else if(n.children){let o=0,t=0;n.children.forEach(c=>{calcStats(c);o+=c.online??0;t+=c.total??0});n.online=o;n.total=t}}
calcStats(TREE)
const collectCams=(n:TreeNode):Cam[]=>{if(n.cams)return n.cams;let a:any[]=[];n.children?.forEach(c=>a.push(...collectCams(c)));return a}
const TAG_GROUPS:Record<string,Cam[]>={}
const initTags=(n:TreeNode)=>{if(n.cams)n.cams.forEach(c=>c.labels.forEach(l=>{if(!TAG_GROUPS[l])TAG_GROUPS[l]=[];TAG_GROUPS[l].push(c)}));n.children?.forEach(initTags)}
TREE.children?.forEach(initTags)

const ICONS:Record<string,React.ReactNode>={'总部':<Globe className="w-3 h-3"/>,'区域':<MapPin className="w-3 h-3"/>,'城市':<Building2 className="w-3 h-3"/>,'区县':<Home className="w-3 h-3"/>,'门店':<Store className="w-3 h-3"/>}

const TreeBranch: React.FC<{node:TreeNode;depth:number;selectedId:string;onSelect:(n:TreeNode)=>void;search:string;tagMode:boolean}> = ({node,depth,selectedId,onSelect,search,tagMode}) => {
  const [open,setOpen]=useState(depth<4); if(tagMode)return null
  if(search&&!node.name.includes(search)){if(!node.children?.some(c=>c.name.includes(search)))return null}
  return <div>
    <button onClick={()=>{node.children?.length&&setOpen(!open);onSelect(node)}} className={`w-full flex items-center gap-1.5 py-1.5 text-xs rounded ${selectedId===node.id?'bg-[rgba(239,68,68,0.12)] text-red-400':'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`} style={{paddingLeft:`${depth*14+8}px`,paddingRight:8}}>
      {node.children?.length?<ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${open?'':'-rotate-90'}`}/>:<ChevronRight className="w-3 h-3 shrink-0"/>}{ICONS[node.type]||null}
      <span className="truncate flex-1 text-left">{node.name}</span>
      {node.total!>0&&<span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${selectedId===node.id?'bg-red-500/20':''}`} style={{color:node.online===0?'#EF4444':node.online===node.total?'#10B981':'#F59E0B'}}>{node.online}/{node.total}</span>}
    </button>
    {open&&node.children?.map(c=><TreeBranch key={c.id} node={c} depth={depth+1} selectedId={selectedId} onSelect={onSelect} search={search} tagMode={tagMode}/>)}
  </div>
}

const EmptyCell = () => <div className="w-full h-full bg-[#111827] border border-[#1e293b] flex items-center justify-center"><Camera className="w-8 h-8 text-[#1e293b]"/></div>
const VideoCell: React.FC<{cam:Cam;active:boolean;onClick:()=>void;videoSrc?:string;onTimeUpdate?:(t:number)=>void;playing?:boolean;onTogglePlay?:()=>void}> = ({cam,active,onClick,videoSrc,onTimeUpdate,playing,onTogglePlay}) => {
  const hasVideo = !!videoSrc
  const vidRef = useRef<HTMLVideoElement>(null)
  const [localPlaying, setLocalPlaying] = useState(false)
  const [stream, setStream] = useState('流畅')
  const [showVolume, setShowVolume] = useState(false)
  const [volume, setVolume] = useState(60)

  useEffect(()=>{
    if(!vidRef.current) return
    if(playing||localPlaying) vidRef.current.play().catch(()=>{})
    else vidRef.current.pause()
  },[playing,localPlaying])

  useEffect(()=>{
    if(vidRef.current) vidRef.current.volume = volume / 100
  },[volume])

  const handlePlayPause = () => {
    setLocalPlaying(!localPlaying)
    onTogglePlay?.()
  }

  return (
  <div onClick={onClick} className={`relative w-full h-full bg-black overflow-hidden cursor-pointer border-2 transition-all ${active?'border-red-400':'border-transparent hover:border-white/10'}`}>
    {cam.status==='offline'&&!hasVideo?<div className="absolute inset-0 flex flex-col items-center justify-center"><WifiOff className="w-8 h-8 text-red-400/40"/><span className="text-[10px] text-red-400/60 mt-1">设备离线</span></div>
    :hasVideo?<video ref={vidRef} src={videoSrc} className="absolute inset-0 w-full h-full object-cover" loop muted
        onTimeUpdate={e=>onTimeUpdate&&onTimeUpdate(e.currentTarget.currentTime/(e.currentTarget.duration||1)*100)}/>
    :<div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black"><Camera className="w-6 h-6 text-white/5"/></div>}
    {/* 顶部提示：状态 + 名称 + FPS */}
    <div className="absolute top-2 left-2 flex items-center gap-1">{cam.status==='online'||hasVideo?<Wifi className="w-2.5 h-2.5 text-emerald-400"/>:<WifiOff className="w-2.5 h-2.5 text-red-400"/>}<span className="text-[8px] text-white/50">{hasVideo?'本地视频':cam.status==='online'?'在线':'离线'}</span></div>
    <div className="absolute top-2 right-2 flex items-center gap-1.5"><span className="text-[9px] text-white/70">{cam.zone}</span>{!hasVideo&&<span className="text-[9px] text-white/50">{cam.fps}FPS</span>}{active&&!hasVideo&&<div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"/>}</div>
    {active && (
      <div className="absolute bottom-0 left-0 right-0" onClick={e=>e.stopPropagation()}>
        <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-6 pb-2 px-3">
          <div className="flex items-center justify-between gap-4">
            <Button size="small" type="text" icon={playing||localPlaying?<Pause className="w-4 h-4 text-white"/>:<Play className="w-4 h-4 text-white"/>} onClick={handlePlayPause} style={{color:'white'}}/>
            <div className="flex items-center gap-2 ml-auto">
              <Dropdown menu={{items:[{key:'流畅',label:'流畅'},{key:'高清',label:'高清'},{key:'超清',label:'超清'}],selectedKeys:[stream],onClick:({key})=>setStream(key)}} trigger={['click']}>
                <Button size="small" type="text" style={{color:'white',fontSize:14,minWidth:40}}>{stream}</Button>
              </Dropdown>
              <Tooltip title="录像"><Button size="small" type="text" icon={<Circle className="w-4 h-4 text-red-400"/>} style={{color:'white'}}/></Tooltip>
              <Tooltip title="抓拍"><Button size="small" type="text" icon={<Camera className="w-4 h-4 text-white/80"/>} style={{color:'white'}}/></Tooltip>
              <Tooltip title={showVolume?'收起音量':'音量'}><Button size="small" type="text" icon={<Volume2 className={`w-4 h-4 ${showVolume?'text-white':'text-white/60'}`}/>} onClick={()=>setShowVolume(!showVolume)} style={{color:'white'}}/></Tooltip>
              <Tooltip title="全屏"><Button size="small" type="text" icon={<Maximize2 className="w-4 h-4 text-white/80"/>} onClick={()=>vidRef.current?.requestFullscreen()} style={{color:'white'}}/></Tooltip>
            </div>
          </div>
          {showVolume && (
            <div className="flex items-center justify-end mt-1 pr-1" onClick={e=>e.stopPropagation()}>
              <div className="w-24"><Slider size="small" value={volume} onChange={setVolume} tooltip={{formatter:v=>`${v}%`}}/></div>
            </div>
          )}
        </div>
      </div>
    )}
  </div>)
}

/* ═══ 多级缩放时间轴 ═══ */
type ZoomLevel = 'global'|'period'|'detail'|'focus'
const ZC: Record<ZoomLevel,{label:string;tickH:number;subT:number;spanH:number}> = {
  global:{label:'全局',tickH:2,subT:4,spanH:24}, period:{label:'时段',tickH:1,subT:4,spanH:12}, detail:{label:'细节',tickH:1/6,subT:1,spanH:4}, focus:{label:'聚焦',tickH:1/3,subT:2,spanH:5},
}

const RulerTimeline: React.FC<{progress:number;playing:boolean;mode:'live'|'record';mainCam:Cam|null;storeHr:[number,number];total:number;page:number;start:number;zoom:ZoomLevel;speed:number
  onPlay:()=>void;onBack:()=>void;onFwd:()=>void;onSeek:(pct:number)=>void;onPage:(p:number)=>void;onFullscreen:()=>void
}> = ({progress,playing,mode,mainCam,storeHr,total,page,start,zoom,speed,onPlay,onBack,onFwd,onSeek,onPage,onFullscreen}) => {
  const railRef=useRef<HTMLDivElement>(null)
  const [hoverPct,setHoverPct]=useState<number|null>(null)
  const vp=useRef(0); const c=ZC[zoom]
  const dragRef=useRef(false); const dragStart=useRef({x:0,vp:0})
  const curH=progress/100*24; const spanH=c.spanH
  useEffect(()=>{if(curH<vp.current||curH>vp.current+spanH)vp.current=Math.max(0,Math.min(24-spanH,curH-spanH/2))},[curH,spanH,zoom])
  const fmt=(p:number)=>{const h=Math.floor(p/100*24);const m=Math.floor((p/100*24-h)*60);const s=Math.floor(((p/100*24-h)*60-m)*60);return`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
  const toX=(h:number)=>((h-vp.current)/spanH*100).toFixed(4)
  const nT=Math.ceil(spanH/c.tickH)+1
  const mt=Array.from({length:nT},(_,i)=>vp.current+i*c.tickH)
  const nt:number[]=[];mt.forEach((t,i)=>{if(i<mt.length-1)for(let s=1;s<c.subT;s++)nt.push(t+s*c.tickH/c.subT)})
  return <div className="w-full space-y-1">
    <div className="flex items-center justify-end w-full">
      <span className="text-[10px] font-mono text-[var(--text-primary)]">{fmt(progress)}</span>
    </div>
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-tertiary)] w-full pt-5 pb-4 px-4">
    <div ref={railRef} className="relative h-5 cursor-crosshair select-none w-full"
      onMouseDown={e=>{dragRef.current=true;dragStart.current={x:e.clientX,vp:vp.current}}}
      onMouseMove={e=>{
        if(!railRef.current)return;const r=railRef.current.getBoundingClientRect()
        setHoverPct(Math.max(0,Math.min(100,((e.clientX-r.left)/r.width*spanH+vp.current)/24*100)))
        if(dragRef.current){const dx=(e.clientX-dragStart.current.x)/r.width*spanH;vp.current=Math.max(0,Math.min(24-spanH,dragStart.current.vp-dx))}
      }}
      onMouseUp={()=>dragRef.current=false}
      onMouseLeave={()=>{setHoverPct(null);dragRef.current=false}}
      onClick={e=>{if(!dragRef.current&&railRef.current){const r=railRef.current.getBoundingClientRect();onSeek(Math.max(0,Math.min(100,((e.clientX-r.left)/r.width*spanH+vp.current)/24*100)))}}}>
      <div className="absolute top-0 left-0 h-full bg-red-400/10 pointer-events-none" style={{width:`${Math.max(0,Math.min(100,(curH-vp.current)/spanH*100))}%`}}/>
      {mainCam&&<div className="absolute top-0 bottom-0 z-10 w-0.5 bg-amber-400 pointer-events-none" style={{left:`${Math.max(0,Math.min(100,(curH-vp.current)/spanH*100))}%`}}><div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-400 rounded-full"/></div>}
      {nt.map(t=><div key={t} className="absolute top-2 bottom-0 border-l border-[var(--border-subtle)] pointer-events-none" style={{left:`${toX(t)}%`,borderLeftWidth:0.5}}/>)}
      {mt.map(h=><div key={h} className="absolute top-0 bottom-0 border-l border-[var(--border-default)] pointer-events-none" style={{left:`${toX(h)}%`,borderLeftWidth:1}}><span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] text-[var(--text-muted)] pointer-events-none whitespace-nowrap">{String(Math.floor(h)).padStart(2,'0')}:{h%1>0?String(Math.round(h%1*60)).padStart(2,'0'):'00'}</span></div>)}
      {hoverPct!==null&&mainCam&&<div className="absolute -top-7 z-30 pointer-events-none" style={{left:`${Math.min(95,Math.max(0,hoverPct))}%`}}><div className="bg-[var(--bg-primary)] border border-[var(--border-default)] rounded px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-primary)] whitespace-nowrap shadow">{fmt(hoverPct)}</div></div>}
    </div>
    </div>
  </div>
}

/* ═══ 主页面 ═══ */
export const VideoLive: React.FC = () => {
  const [search,setSearch]=useState('')
  const [selectedId,setSelectedId]=useState('')
  const [selectedNode,setSelectedNode]=useState<TreeNode|null>(null)
  const [gridMode,setGridMode]=useState(4)
  const [mainCam,setMainCam]=useState<Cam|null>(null)
  const [zoom,setZoom]=useState<ZoomLevel>('period')
  const [speed,setSpeed]=useState(1)
  const [syncMode,setSyncMode]=useState<'async'|'sync'>('async')
  const videoAreaRef=useRef<HTMLDivElement>(null)
  const [tagMode,setTagMode]=useState(false)
  const [page,setPage]=useState(1)
  const [timelines,setTimelines]=useState<Record<string,TimelineState>>({})
  const [videoSources,setVideoSources]=useState<Record<string,string>>({})
  const [sourcesLoading,setSourcesLoading]=useState(true)
  const timerRef=useRef<any>(null)

  // 自动加载所有摄像头视频源
  useEffect(()=>{
    setSourcesLoading(true)
    fetch('/api/video/camera-sources')
      .then(r=>r.json())
      .then(d=>{setVideoSources(d.sources||{});setSourcesLoading(false)})
      .catch(()=>setSourcesLoading(false))
  },[])

  const allCams=selectedNode?collectCams(selectedNode):[]
  const total=allCams.length; const start=(page-1)*PAGESIZE
  const pageCams=allCams.slice(start,start+PAGESIZE)
  const totalPages=Math.max(1,Math.ceil(total/PAGESIZE))

  // 分页切换 handler
  const handlePageChange=useCallback((p:number)=>{
    setPage(p)
    setMainCam(null)
  },[])

  const getTL=useCallback((cid:string):TimelineState=>{if(!timelines[cid]){const m=cid.charCodeAt(0)%3===0?'record':'live';const dp=10/24*100;setTimelines(p=>({...p,[cid]:{progress:dp,playing:false,mode:m}}));return{progress:dp,playing:false,mode:m}}return timelines[cid]},[timelines])
  const tl=mainCam?getTL(mainCam.id):null

  useEffect(()=>{if(mainCam&&tl?.playing){timerRef.current=setInterval(()=>setTimelines(p=>{const t=p[mainCam.id];if(!t)return p;return{...p,[mainCam.id]:{...t,progress:t.progress+0.3>=100?0:t.progress+0.3}}}),200)}else clearInterval(timerRef.current);return()=>clearInterval(timerRef.current)},[mainCam?.id,tl?.playing])

  const handleSelect=(n:TreeNode)=>{setSelectedId(n.id);setSelectedNode(n);setPage(1);setMainCam(null)}
  const storeHours:[number,number]=[8,23]

  return (<div className="flex h-full overflow-hidden p-3 gap-3">
    <div className="w-[270px] shrink-0 card-level-1 flex flex-col overflow-hidden" style={{padding:0}}>
      <div className="card-header" style={{justifyContent:'flex-start',gap:8}}><span className="card-header-title">门店架构</span><Segmented size="small" value={tagMode?'tag':'tree'} onChange={v=>setTagMode(v==='tag')} options={[{value:'tree',label:'区域'},{value:'tag',label:'标签'}]}/></div>
      <div className="p-2 border-b border-[var(--border-subtle)] shrink-0"><Input size="small" prefix={<Search className="w-3 h-3"/>} value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜索..." allowClear/></div>
      <div className="flex-1 overflow-y-auto py-1">{tagMode?<div className="space-y-1 p-2">{Object.keys(TAG_GROUPS).map(tag=>{const cs=TAG_GROUPS[tag];const s=selectedId===tag;return <button key={tag} onClick={()=>{setSelectedId(tag);setMainCam(null);setPage(1)}} className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-xs rounded ${s?'bg-[rgba(239,68,68,0.12)] text-red-400':'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}><Tag className="w-3 h-3 shrink-0"/><span className="flex-1 text-left">{tag}</span><span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${s?'bg-red-500/20':''}`}>{cs.length}</span></button>})}</div>:<TreeBranch node={TREE} depth={0} selectedId={selectedId} onSelect={handleSelect} search={search} tagMode={false}/>}</div>
      <div className="p-3 border-t border-[var(--border-subtle)] flex items-center justify-center gap-0 text-xs">
        <span className="flex items-center gap-1 px-2"><Camera className="w-3.5 h-3.5 text-[var(--text-muted)]"/><span className="text-[var(--text-muted)]">{TREE.total}台</span></span>
        <span className="w-px h-3.5 bg-[var(--border-subtle)]"/>
        <span className="flex items-center gap-1 px-2"><Wifi className="w-3.5 h-3.5 text-emerald-400"/><span className="text-emerald-400">在线 {TREE.total}</span></span>
        <span className="w-px h-3.5 bg-[var(--border-subtle)]"/>
        <span className="flex items-center gap-1 px-2"><WifiOff className="w-3.5 h-3.5 text-[var(--text-muted)]"/><span className="text-[var(--text-muted)]">离线 0</span></span>
      </div>
    </div>
    <div className="flex-1 card-level-1 overflow-hidden flex flex-col" style={{padding:0}}>
      <div className="card-header"><span className="card-header-title">{selectedNode?`${selectedNode.name}${total>0?`（${total}路）`:''}`:tagMode?`标签·${selectedId}`:'选择门店'}</span>
        <Pagination size="small" current={page} total={total} pageSize={PAGESIZE} onChange={handlePageChange} showSizeChanger={false} disabled={total===0} hideOnSinglePage={totalPages<=1} style={{fontSize:10,flexShrink:0}}/>
        <div className="flex-1"/>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1"><span className="text-[9px] text-[var(--text-muted)]">倍速</span><Segmented size="small" value={String(speed)} onChange={v=>setSpeed(Number(v))} options={[['0.5','0.5x'],['1','1x'],['2','2x'],['4','4x']].map(([v,l])=>({value:v,label:l}))}/></div>
          <div className="flex items-center gap-1"><span className="text-[9px] text-[var(--text-muted)]">同步</span><Select size="small" value={syncMode} onChange={setSyncMode} style={{width:84,fontSize:10,height:24}}
            options={[{value:'async',label:<span className="flex items-center gap-1"><GitBranch className="w-3 h-3"/>异步</span>},{value:'sync',label:<span className="flex items-center gap-1"><GitMerge className="w-3 h-3"/>同步</span>}]}/></div>
          <div className="flex items-center gap-1"><span className="text-[9px] text-[var(--text-muted)]">视图</span><Segmented size="small" value={zoom} onChange={v=>setZoom(v as ZoomLevel)} options={[['global','全局'],['period','时段'],['detail','细节'],['focus','聚焦']].map(([v,l])=>({value:v,label:l}))}/></div>
          <div className="flex items-center gap-1"><span className="text-[9px] text-[var(--text-muted)]">分屏</span><Segmented size="small" value={String(gridMode)} onChange={v=>setGridMode(Number(v))} options={[['1','1屏'],['4','4屏'],['9','9屏']].map(([v,l])=>({value:v,label:l}))}/></div>
          <Tooltip title={document.fullscreenElement?'退出全屏':'全屏'}><Button size="small" type="text" icon={<Expand className="w-3.5 h-3.5"/>} onClick={()=>document.fullscreenElement?document.exitFullscreen():videoAreaRef.current?.requestFullscreen()}/></Tooltip>
        </div></div>
      <div ref={videoAreaRef} className="flex-1 bg-[#0a0e14] relative" style={{minHeight:300}}>
        {sourcesLoading&&<div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0a0e14]/80"><div className="text-center space-y-3"><div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto"/><p className="text-xs text-[var(--text-muted)]">正在连接摄像头...</p></div></div>}
        <div key={`grid-${page}`} className="absolute inset-0 grid" style={{gridTemplateColumns:`repeat(${gridMode===1?1:gridMode===4?2:3},1fr)`,gridTemplateRows:`repeat(${gridMode===1?1:gridMode===4?2:3},1fr)`}}>
          {gridMode===1?(pageCams[0]?<VideoCell cam={pageCams[0]} active={mainCam?.id===pageCams[0].id} onClick={()=>setMainCam(pageCams[0])} videoSrc={videoSources[pageCams[0].id]} playing={timelines[pageCams[0].id]?.playing||false} onTogglePlay={()=>mainCam?.id===pageCams[0].id?setTimelines(p=>({...p,[pageCams[0].id]:{...p[pageCams[0].id]||{progress:10/24*100,playing:false,mode:'record'},playing:!p[pageCams[0].id]?.playing}})):undefined}/>:<EmptyCell/>):gridMode===4?[0,1,2,3].map(i=>pageCams[i]?<VideoCell key={pageCams[i].id} cam={pageCams[i]} active={mainCam?.id===pageCams[i].id} onClick={()=>setMainCam(pageCams[i])} videoSrc={videoSources[pageCams[i].id]} playing={timelines[pageCams[i].id]?.playing||false} onTogglePlay={()=>setTimelines(p=>({...p,[pageCams[i].id]:{...p[pageCams[i].id]||{progress:10/24*100,playing:false,mode:'record'},playing:!p[pageCams[i].id]?.playing}}))}/>:<EmptyCell key={`e${i}`}/>):[0,1,2,3,4,5,6,7,8].map(i=>pageCams[i]?<VideoCell key={pageCams[i].id} cam={pageCams[i]} active={mainCam?.id===pageCams[i].id} onClick={()=>setMainCam(pageCams[i])} videoSrc={videoSources[pageCams[i].id]} playing={timelines[pageCams[i].id]?.playing||false} onTogglePlay={()=>setTimelines(p=>({...p,[pageCams[i].id]:{...p[pageCams[i].id]||{progress:10/24*100,playing:false,mode:'record'},playing:!p[pageCams[i].id]?.playing}}))}/>:<EmptyCell key={`e${i}`}/>)}
        </div>
      </div>
      <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-2 shrink-0">
        <RulerTimeline progress={tl?.progress||0} playing={tl?.playing||false} mode={tl?.mode||'record'} mainCam={mainCam} storeHr={storeHours} total={total} page={page} start={start} zoom={zoom} speed={speed} onFullscreen={()=>videoAreaRef.current?.requestFullscreen()}
          onPlay={()=>mainCam&&setTimelines(p=>({...p,[mainCam.id]:{...p[mainCam.id]||{progress:10/24*100,playing:false,mode:'record'},playing:!p[mainCam.id]?.playing}}))}
          onBack={()=>mainCam&&setTimelines(p=>({...p,[mainCam.id]:{...p[mainCam.id]||{progress:10/24*100,playing:false,mode:'record'},progress:Math.max(0,(p[mainCam.id]?.progress||10/24*100)-1)}}))}
          onFwd={()=>mainCam&&setTimelines(p=>({...p,[mainCam.id]:{...p[mainCam.id]||{progress:10/24*100,playing:false,mode:'record'},progress:Math.min(100,(p[mainCam.id]?.progress||10/24*100)+1)}}))}
          onSeek={pct=>mainCam&&setTimelines(p=>({...p,[mainCam.id]:{...p[mainCam.id]||{progress:10/24*100,playing:false,mode:'record'},progress:pct}}))}
          onPage={(p:number)=>{setPage(p);setMainCam(null)}}/>
      </div>
    </div>
  </div>)
}
export { VideoPlayback, VideoDevice }
