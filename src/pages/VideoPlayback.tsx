import React, { useState } from 'react'
import { Search, Play, Pause, SkipBack, SkipForward, Download, Scissors, Share2, Bookmark, Camera, Clock, Maximize2, Flame, AlertCircle, UserX, Construction, ChevronLeft, Filter, X } from 'lucide-react'
import { Input, Button, Select, Segmented, Tag as AntTag, Slider, Tooltip, DatePicker, message, Drawer } from 'antd'

/* ═══ 事件数据 ═══ */
interface CloudEvent {
  id:string; store:string; zone:string; eventType:string; startTime:string; endTime:string;
  duration:string; severity:'critical'|'warning'|'info'; camera:string; hasVideo:boolean
}

const EVENT_TYPES = [
  { key:'all', label:'全部事件', color:'' },
  { key:'kitchen', label:'后厨违规', color:'#EF4444' },
  { key:'leave', label:'离岗', color:'#EF4444' },
  { key:'block', label:'占道', color:'#F59E0B' },
  { key:'flow', label:'客流异常', color:'#3B82F6' },
  { key:'smoke', label:'烟火告警', color:'#EF4444' },
  { key:'intrusion', label:'入侵告警', color:'#F59E0B' },
  { key:'camera', label:'设备异常', color:'#8B5CF6' },
]

const STORES = ['IFS国金中心','太平街店','德思勤店','湖滨银泰店','南京新街口店','广州天河城店','深圳万象天地']
const ZONES = ['后厨','前厅','收银台','出入口','仓库','就餐区','外卖打包']

const EVENTS: CloudEvent[] = [
  { id:'E001',store:'IFS国金中心',zone:'后厨',eventType:'kitchen',startTime:'2026-05-21 14:32:10',endTime:'2026-05-21 14:32:45',duration:'35s',severity:'critical',camera:'IFS-D003',hasVideo:true },
  { id:'E002',store:'太平街店',zone:'后厨',eventType:'kitchen',startTime:'2026-05-21 13:15:00',endTime:'2026-05-21 13:15:28',duration:'28s',severity:'warning',camera:'TPJ-D005',hasVideo:true },
  { id:'E003',store:'德思勤店',zone:'前厅',eventType:'leave',startTime:'2026-05-21 11:40:00',endTime:'2026-05-21 11:42:15',duration:'2m15s',severity:'warning',camera:'DSQ-D001',hasVideo:true },
  { id:'E004',store:'湖滨银泰店',zone:'出入口',eventType:'flow',startTime:'2026-05-21 10:05:00',endTime:'2026-05-21 10:05:50',duration:'50s',severity:'info',camera:'HZ-D008',hasVideo:true },
  { id:'E005',store:'IFS国金中心',zone:'仓库',eventType:'smoke',startTime:'2026-05-20 22:18:00',endTime:'2026-05-20 22:19:30',duration:'1m30s',severity:'critical',camera:'IFS-D012',hasVideo:true },
  { id:'E006',store:'深圳万象天地',zone:'收银台',eventType:'intrusion',startTime:'2026-05-20 03:42:00',endTime:'2026-05-20 03:43:20',duration:'1m20s',severity:'critical',camera:'SZ-D007',hasVideo:true },
  { id:'E007',store:'广州天河城店',zone:'出入口',eventType:'block',startTime:'2026-05-19 18:30:00',endTime:'2026-05-19 18:32:40',duration:'2m40s',severity:'warning',camera:'GZ-D010',hasVideo:true },
  { id:'E008',store:'南京新街口店',zone:'就餐区',eventType:'kitchen',startTime:'2026-05-19 12:10:00',endTime:'2026-05-19 12:11:15',duration:'1m15s',severity:'warning',camera:'NJ-D004',hasVideo:true },
  { id:'E009',store:'IFS国金中心',zone:'收银台',eventType:'leave',startTime:'2026-05-19 08:30:00',endTime:'2026-05-19 08:32:00',duration:'2m',severity:'info',camera:'IFS-D007',hasVideo:true },
  { id:'E010',store:'德思勤店',zone:'后厨',eventType:'smoke',startTime:'2026-05-18 19:55:00',endTime:'2026-05-18 19:56:20',duration:'1m20s',severity:'warning',camera:'DSQ-D009',hasVideo:true },
  { id:'E011',store:'深圳万象天地',zone:'外卖打包',eventType:'block',startTime:'2026-05-18 16:20:00',endTime:'2026-05-18 16:22:10',duration:'2m10s',severity:'warning',camera:'SZ-D015',hasVideo:true },
  { id:'E012',store:'广州天河城店',zone:'出入口',eventType:'flow',startTime:'2026-05-18 12:00:00',endTime:'2026-05-18 12:01:30',duration:'1m30s',severity:'info',camera:'GZ-D003',hasVideo:true },
]

/* ═══ 图例映射 ═══ */
const TYPE_ICON: Record<string, React.FC<{className?:string}>> = {
  kitchen: AlertCircle, leave: UserX, block: Construction, flow: Filter, smoke: Flame, intrusion: Filter, camera: Camera,
}
const severityConfig:Record<string,{bg:string;border:string;text:string;label:string}> = {
  critical:{bg:'rgba(239,68,68,0.08)',border:'rgba(239,68,68,0.3)',text:'#EF4444',label:'严重'},
  warning:{bg:'rgba(245,158,11,0.08)',border:'rgba(245,158,11,0.3)',text:'#F59E0B',label:'警告'},
  info:{bg:'rgba(59,130,246,0.05)',border:'rgba(59,130,246,0.2)',text:'#3B82F6',label:'提示'},
}

/* ═══ 时间轴线 ═══ */
const TimelineDot: React.FC<{active?:boolean;color:string}> = ({active,color}) => (
  <div className="relative flex items-center justify-center shrink-0" style={{width:24}}>
    <div className="w-2.5 h-2.5 rounded-full" style={{background:active?color:color,opacity:active?1:0.4}}/>
  </div>
)

export const VideoPlayback: React.FC = () => {
  const [eventType, setEventType] = useState('all')
  const [storeFilter, setStoreFilter] = useState('全部')
  const [severityFilter, setSeverityFilter] = useState('全部')
  const [search, setSearch] = useState('')
  const [playing, setPlaying] = useState<CloudEvent|null>(null)
  const [playerOpen, setPlayerOpen] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [progress, setProgress] = useState(0)

  // 按时间分组
  const filtered = EVENTS.filter(e => {
    if (eventType!=='all' && e.eventType!==eventType) return false
    if (storeFilter!=='全部' && e.store!==storeFilter) return false
    if (severityFilter!=='全部' && e.severity!==severityFilter) return false
    if (search && !e.store.includes(search) && !e.zone.includes(search) && !e.camera.includes(search)) return false
    return true
  })

  const groups = new Map<string, CloudEvent[]>()
  filtered.forEach(e => {
    const day = e.startTime.split(' ')[0]
    const arr = groups.get(day) || []
    arr.push(e)
    groups.set(day, arr)
  })

  const openPlayer = (ev:CloudEvent) => { setPlaying(ev); setProgress(0); setPlayerOpen(true) }

  return (
    <div className="p-4 h-full flex flex-col overflow-hidden">
      {/* ═══ 顶部筛选栏 ═══ */}
      <div className="shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">录像回放</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">云端事件录像 · 时间轴浏览 · 一键溯源</p>
          </div>
          <div className="flex items-center gap-2">
            <Input size="middle" prefix={<Search className="w-3.5 h-3.5"/>} value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="搜索门店/点位..." style={{width:200}} allowClear/>
            <Select size="middle" value={storeFilter} onChange={setStoreFilter} style={{width:140}}
              options={['全部',...STORES].map(s=>({value:s,label:s}))}/>
            <Select size="middle" value={severityFilter} onChange={setSeverityFilter} style={{width:100}}
              options={['全部','critical','warning','info'].map(s=>({value:s,label:s==='critical'?'严重':s==='warning'?'警告':'提示'}))}/>
          </div>
        </div>

        {/* 事件类型标签 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {EVENT_TYPES.map(t => (
            <button key={t.key} onClick={()=>setEventType(t.key)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${eventType===t.key?'text-white':'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
              style={{background:eventType===t.key?(t.color||'#3B82F6'):'var(--bg-tertiary)'}}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <DatePicker size="small" style={{width:120}} placeholder="开始日期"/>
          <span>至</span>
          <DatePicker size="small" style={{width:120}} placeholder="结束日期"/>
          <span className="ml-auto">共 {filtered.length} 条事件录像</span>
        </div>
      </div>

      {/* ═══ 时间轴内容区 ═══ */}
      <div className="flex-1 overflow-y-auto mt-4 pr-2">
        {[...groups.entries()].map(([day, events]) => (
          <div key={day} className="mb-4">
            {/* 日期标题 */}
            <div className="flex items-center gap-2 mb-2 sticky top-0 z-10 bg-[var(--bg-primary)] py-1">
              <span className="text-xs font-semibold text-[var(--text-primary)]">{day}</span>
              <span className="text-[10px] text-[var(--text-muted)]">{events.length} 条</span>
              <div className="flex-1 h-px bg-[var(--border-subtle)]"/>
            </div>

            {/* 事件时间轴 */}
            <div className="relative">
              {/* 时间线 */}
              <div className="absolute left-[11px] top-0 bottom-0 w-px" style={{background:'var(--border-subtle)'}}/>

              {events.map(e => {
                const sc = severityConfig[e.severity]
                const typeInfo = EVENT_TYPES.find(t=>t.key===e.eventType)
                const Icon = TYPE_ICON[e.eventType]
                return (
                  <div key={e.id} className="relative flex items-start pb-4 last:pb-0 group">
                    {/* 时间线圆点 */}
                    <TimelineDot active={false} color={typeInfo?.color||'#6B7280'}/>

                    {/* 时间标签 */}
                    <div className="shrink-0 mr-3 text-right" style={{width:48}}>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">{e.startTime.split(' ')[1]}</span>
                    </div>

                    {/* 事件卡片 */}
                    <button onClick={()=>openPlayer(e)} className="flex-1 card-level-1 p-3 text-left hover:border-[var(--border-primary)] transition-all"
                      style={{background:sc.bg, borderColor:sc.border}}>
                      <div className="flex items-start gap-3">
                        {/* 缩略图占位 */}
                        <div className="w-24 h-14 rounded bg-black flex items-center justify-center shrink-0 overflow-hidden" style={{aspectRatio:'16/9'}}>
                          <div className="text-center">
                            <Camera className="w-5 h-5 text-white/20 mx-auto"/>
                            <span className="text-[7px] text-white/30">{e.camera}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <AntTag color={e.severity==='critical'?'red':e.severity==='warning'?'orange':'blue'} style={{fontSize:9}}>{sc.label}</AntTag>
                            <AntTag color={e.eventType==='kitchen'||e.eventType==='leave'||e.eventType==='smoke'?'red':e.eventType==='block'||e.eventType==='intrusion'?'orange':'blue'} style={{fontSize:9}}>
                              {typeInfo?.label||e.eventType}
                            </AntTag>
                            <span className="text-xs font-medium text-[var(--text-primary)]">{e.store} · {e.zone}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                            <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5"/>{e.duration}</span>
                            <span>{e.startTime}</span>
                          </div>
                        </div>
                        <Play className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--ai-blue-500)] transition-colors shrink-0 mt-2"/>
                      </div>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ═══ 播放详情抽屉 ═══ */}
      <Drawer title={playing?`${playing.store} · ${playing.zone}`:'播放详情'} open={playerOpen} onClose={()=>setPlayerOpen(false)}
        width={720} destroyOnClose styles={{header:{background:'var(--bg-secondary)',borderBottom:'1px solid var(--border-subtle)'},body:{background:'var(--bg-primary)',padding:0}}}>
        {playing && (
          <div className="flex flex-col h-full">
            {/* 播放器 */}
            <div className="relative" style={{aspectRatio:'16/9',background:'#0a0e14',overflow:'hidden'}}>
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-center space-y-2">
                  <Camera className="w-16 h-16 text-white/10 mx-auto"/>
                  <p className="text-sm text-white/40">{playing.camera}</p>
                  <p className="text-xs text-white/20">{playing.startTime} → {playing.endTime}</p>
                  <p className="text-[10px] text-white/20">时长 {playing.duration}</p>
                </div>
              </div>
            </div>
            {/* 播放控制栏 */}
            <div className="p-4 space-y-3 bg-[var(--bg-secondary)] shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button size="small" icon={<Pause className="w-4 h-4"/>}/>
                  <Button size="small" icon={<SkipBack className="w-4 h-4"/>}/>
                  <Button size="small" icon={<SkipForward className="w-4 h-4"/>}/>
                  <span className="text-[10px] text-[var(--text-muted)] ml-2">0:00 / {playing.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[var(--text-muted)]">倍速</span>
                  <Segmented size="small" value={String(speed)} onChange={v=>setSpeed(Number(v))}
                    options={['0.5','1','2','4'].map(v=>({value:v,label:`${v}x`}))}/>
                  <div className="w-px h-5 bg-[var(--border-subtle)] mx-2"/>
                  <Tooltip title="截取片段"><Button size="small" type="text" icon={<Scissors className="w-4 h-4"/>}/></Tooltip>
                  <Tooltip title="云端下载"><Button size="small" type="text" icon={<Download className="w-4 h-4"/>}/></Tooltip>
                  <Tooltip title="分享"><Button size="small" type="text" icon={<Share2 className="w-4 h-4"/>}/></Tooltip>
                  <Tooltip title="标记归档"><Button size="small" type="text" icon={<Bookmark className="w-4 h-4"/>}/></Tooltip>
                  <Tooltip title="全屏"><Button size="small" type="text" icon={<Maximize2 className="w-4 h-4"/>}/></Tooltip>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-[var(--text-muted)]">0:00</span>
                <Slider size="small" value={progress} onChange={setProgress} style={{flex:1}} tooltip={{formatter:v=>`${v}%`}}/>
                <span className="text-[8px] text-[var(--text-muted)]">{playing.duration}</span>
              </div>
            </div>
            {/* 事件信息 */}
            <div className="p-4 space-y-2 flex-1 overflow-y-auto">
              <div className="text-xs font-medium text-[var(--text-primary)]">事件详情</div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-[var(--text-muted)]">门店：</span>{playing.store}</div>
                <div><span className="text-[var(--text-muted)]">点位：</span>{playing.zone}</div>
                <div><span className="text-[var(--text-muted)]">设备：</span>{playing.camera}</div>
                <div><span className="text-[var(--text-muted)]">类型：</span>{EVENT_TYPES.find(t=>t.key===playing.eventType)?.label}</div>
                <div><span className="text-[var(--text-muted)]">开始：</span>{playing.startTime}</div>
                <div><span className="text-[var(--text-muted)]">结束：</span>{playing.endTime}</div>
                <div><span className="text-[var(--text-muted)]">时长：</span>{playing.duration}</div>
                <div><span className="text-[var(--text-muted)]">级别：</span>
                  <AntTag color={severityConfig[playing.severity].text==='#EF4444'?'red':severityConfig[playing.severity].text==='#F59E0B'?'orange':'blue'} style={{fontSize:9}}>
                    {severityConfig[playing.severity].label}
                  </AntTag>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
