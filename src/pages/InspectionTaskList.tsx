import React, { useState, useMemo } from 'react'
import { Camera, Layers, ListChecks, Shuffle, Store, Clock, User, Eye } from 'lucide-react'
import { Tabs, Tag, Button, Progress, Tooltip, Drawer, Pagination } from 'antd'

const MODES = [
  { key:'realtime', label:'实时巡检', icon:Camera, color:'#3B82F6' },
  { key:'combo', label:'组合巡检', icon:Layers, color:'#10B981' },
  { key:'process', label:'流程巡检', icon:ListChecks, color:'#8B5CF6' },
  { key:'spot', label:'临时抽检', icon:Shuffle, color:'#F59E0B' },
]

const STORES = ['IFS国金中心','太平街店','德思勤店','雨花亭店','梅溪湖步步高店','悦方ID店','开福万达店','湖滨银泰店','南京新街口店','广州天河城店','深圳万象天地','成都太古里店','重庆解放碑店','青岛万象城店','西安钟楼店','武汉江汉路旗舰店']
const MANAGERS = ['张拓','李建','王鹏','陈静','刘洋','赵敏','陈丽','周明','吴磊','孙悦']
const REAL_TEMPLATES = ['后厨卫生清单','前厅服务清单','外卖卫生清单','安全消防清单']
const COMBO_TEMPLATES = ['早班开店巡检','午市高峰巡检','晚市收市巡检']
const PROC_TEMPLATES = ['开市巡检SOP','午间巡检SOP','晚间巡检SOP','闭市巡检SOP']
const SPOT_TEMPLATES = ['随机抽检-标签','突击合规抽检']
const CAM_IDS = ['D001','D003','D005','D007','D008','D010','D012','D015','D018','D020','D022']

interface Task {
  id:string; template:string; mode:string; store:string; manager:string; camera:string
  status:'running'|'done'|'pending'; progress:number; time:string; cameras:string[]
}

/* ═══ 生成每个模式各40条 ═══ */
const generateTasks = (): Task[] => {
  const all: Task[] = []
  let n = 0
  const modes: {mode:string;templates:string[]}[] = [
    {mode:'realtime',templates:REAL_TEMPLATES},
    {mode:'combo',templates:COMBO_TEMPLATES},
    {mode:'process',templates:PROC_TEMPLATES},
    {mode:'spot',templates:SPOT_TEMPLATES},
  ]
  modes.forEach(({mode,templates}) => {
    for (let i=0;i<40;i++) {
      n++
      const store = STORES[i%STORES.length]
      const prefix = mode.slice(0,2).toUpperCase()
      const camCount = 1+Math.floor(Math.random()*3)
      const cameras = Array.from({length:camCount},(_,ci)=>`${store.slice(0,2)}-${CAM_IDS[(i+ci)%CAM_IDS.length]}`)
        const status = i%5===0?'pending':i%3===0?'done':'running'
        const progress = status==='done'?100:status==='pending'?0:Math.floor(20+Math.random()*80)
      const hour = 6+Math.floor(Math.random()*15)
      const min = Math.floor(Math.random()*60)
      all.push({
        id:`TK${String(n).padStart(3,'0')}`,
        template:templates[i%templates.length],
        mode, store,
        manager:MANAGERS[i%MANAGERS.length],
        camera:cameras[0],
        cameras,
        status:status as Task['status'],
        progress,
        time:`2026-05-22 ${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`,
      })
    }
  })
  return all
}

const ALL_TASKS = generateTasks()
const PAGE_SIZE = 15

const statusMap:Record<string,{label:string;color:string}> = {
  running:{label:'执行中',color:'processing'},
  done:{label:'已完成',color:'success'},
  pending:{label:'待执行',color:'default'},
}

export const InspectionTaskList: React.FC = () => {
  const [activeMode, setActiveMode] = useState('全部')
  const [selectedTask, setSelectedTask] = useState<Task|null>(null)
  const [page, setPage] = useState(1)

  const modeTasks = useMemo(()=>activeMode==='全部'?ALL_TASKS:ALL_TASKS.filter(t=>t.mode===activeMode),[activeMode])
  const paged = modeTasks.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)

  const counts = {全部:ALL_TASKS.length}
  MODES.forEach(m=>{counts[m.key]=ALL_TASKS.filter(t=>t.mode===m.key).length})

  return (
    <div className="p-4 h-full flex flex-col overflow-hidden">
      <div className="shrink-0 space-y-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">任务清单</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">自动化巡检任务执行情况 · 店长查看门店摄像头任务 · 共 {modeTasks.length} 条</p>
        </div>
        <Tabs activeKey={activeMode} onChange={v=>{setActiveMode(v);setPage(1)}}
          items={[
            { key:'全部', label:'全部 '+counts.全部 },
            ...MODES.map(m => {
              const Icon = m.icon
              return { key: m.key, label: (<span className="flex items-center gap-1.5"><Icon className="w-3 h-3"/>{m.label + ' ' + counts[m.key]}</span>) }
            })
          ]} />
      </div>

      <div className="flex-1 overflow-y-auto mt-2">
        <div className="card-level-1 overflow-hidden" style={{padding:0}}>
          <table className="w-full text-xs">
            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] sticky top-0">
              <tr>
                <th className="px-3 py-2.5 text-center text-[var(--text-muted)] font-medium w-10">#</th>
                <th className="px-3 py-2.5 text-left text-[var(--text-muted)] font-medium">模板名称</th>
                <th className="px-3 py-2.5 text-left text-[var(--text-muted)] font-medium">门店</th>
                <th className="px-3 py-2.5 text-left text-[var(--text-muted)] font-medium">摄像头</th>
                <th className="px-3 py-2.5 text-left text-[var(--text-muted)] font-medium">店长</th>
                <th className="px-3 py-2.5 text-center text-[var(--text-muted)] font-medium">状态</th>
                <th className="px-3 py-2.5 text-left text-[var(--text-muted)] font-medium" style={{width:100}}>进度</th>
                <th className="px-3 py-2.5 text-left text-[var(--text-muted)] font-medium">时间</th>
                <th className="px-3 py-2.5 text-center text-[var(--text-muted)] font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((t,i) => {
                const st = statusMap[t.status]
                return (
                  <tr key={t.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                    <td className="px-3 py-2.5 text-center text-[var(--text-muted)]">{(page-1)*PAGE_SIZE+i+1}</td>
                    <td className="px-3 py-2.5 font-medium text-[var(--text-primary)]">{t.template}</td>
                    <td className="px-3 py-2.5 text-[var(--text-secondary)]">{t.store}</td>
                    <td className="px-3 py-2.5"><Tag color="blue" style={{fontSize:12,margin:0}}>{t.camera}</Tag></td>
                    <td className="px-3 py-2.5 text-[var(--text-secondary)]">{t.manager}</td>
                    <td className="px-3 py-2.5 text-center"><Tag color={st.color} style={{fontSize:12}}>{st.label}</Tag></td>
                    <td className="px-3 py-2.5"><Progress percent={t.progress} size="small" showInfo={false} strokeColor={t.progress===100?'#10B981':t.progress>0?'#3B82F6':'#6B7280'}/></td>
                    <td className="px-3 py-2.5 text-[var(--text-muted)] font-mono text-[10px]">{t.time}</td>
                    <td className="px-3 py-2.5 text-center">
                      <Button size="small" type="link" style={{fontSize:12,padding:0}} onClick={()=>setSelectedTask(t)}>详情</Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 固定底部分页器 */}
      <div className="shrink-0 flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
        <span className="text-[10px] text-[var(--text-muted)]">共 {modeTasks.length} 条，第 {page}/{Math.ceil(modeTasks.length/PAGE_SIZE)} 页</span>
        <Pagination current={page} pageSize={PAGE_SIZE} total={modeTasks.length} onChange={setPage} size="small" showSizeChanger={false}/>
      </div>

      <Drawer title={selectedTask?`${selectedTask.template} · ${selectedTask.store}`:'任务详情'} open={!!selectedTask} onClose={()=>setSelectedTask(null)} width={520} destroyOnClose
        styles={{header:{background:'var(--bg-secondary)',borderBottom:'1px solid var(--border-subtle)'},body:{background:'var(--bg-primary)',padding:0}}}>
        {selectedTask && (()=>{
          const mcfg=MODES.find(m=>m.key===selectedTask.mode); const Icon=mcfg?.icon||Camera; const st=statusMap[selectedTask.status]
          return (
          <div className="flex flex-col h-full">
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                {Icon && <Icon className="w-4 h-4" style={{color:mcfg?.color}}/>}
                <Tag color="blue" style={{fontSize:12}}>{mcfg?.label}</Tag>
                <Tag color={st.color} style={{fontSize:12}}>{st.label}</Tag>
                <Progress percent={selectedTask.progress} size="small" style={{width:80,margin:0}}/>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs bg-[var(--bg-tertiary)] rounded p-3">
                <div><span className="text-[var(--text-muted)]">模板：</span><span className="text-[var(--text-primary)] font-medium">{selectedTask.template}</span></div>
                <div><span className="text-[var(--text-muted)]">门店：</span><span className="text-[var(--text-primary)] font-medium">{selectedTask.store}</span></div>
                <div><span className="text-[var(--text-muted)]">店长：</span><span className="text-[var(--text-primary)] font-medium">{selectedTask.manager}</span></div>
                <div><span className="text-[var(--text-muted)]">发起时间：</span><span className="text-[var(--text-primary)]">{selectedTask.time}</span></div>
              </div>
            </div>
            {/* 摄像头执行明细 */}
            <div className="border-t border-[var(--border-subtle)]">
              <div className="px-4 py-2 bg-[var(--bg-secondary)] text-xs font-medium text-[var(--text-primary)]">
                摄像头执行明细 · {selectedTask.cameras.length}路
              </div>
              <table className="w-full text-xs">
                <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)]">
                  <tr>
                    <th className="px-4 py-2 text-left text-[var(--text-muted)] font-medium">摄像头</th>
                    <th className="px-3 py-2 text-left text-[var(--text-muted)] font-medium">抓拍时间</th>
                    <th className="px-3 py-2 text-center text-[var(--text-muted)] font-medium">抓拍结果</th>
                    <th className="px-3 py-2 text-left text-[var(--text-muted)] font-medium">AI判定</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTask.cameras.map((cam,i) => {
                    const done = selectedTask.status==='done' || (selectedTask.status==='running' && i<Math.floor(selectedTask.cameras.length*selectedTask.progress/100))
                    const result = done?(Math.random()>0.2?'合格':'异常'):selectedTask.status==='running'&&i===Math.floor(selectedTask.cameras.length*selectedTask.progress/100)?'进行中':'待执行'
                    const ai = result==='合格'?'通过':result==='异常'?'检测到违规项':result==='进行中'?'分析中...':'-'
                    const time = done?`${selectedTask.time} → ${String(parseInt(selectedTask.time.split(':')[1])+i*2).padStart(2,'0')}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}`:selectedTask.status==='pending'?'--:--':`${selectedTask.time}`
                    return (
                      <tr key={i} className="border-b border-[var(--border-subtle)]">
                        <td className="px-4 py-2.5 font-medium text-[var(--text-primary)]">{cam}</td>
                        <td className="px-3 py-2.5 text-[var(--text-muted)] font-mono text-[10px]">{time}</td>
                        <td className="px-3 py-2.5 text-center">
                          <Tag color={result==='合格'?'success':result==='异常'?'error':result==='进行中'?'processing':'default'} style={{fontSize:12}}>{result}</Tag>
                        </td>
                        <td className="px-3 py-2.5 text-[10px] text-[var(--text-secondary)]">{ai}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )})()}
      </Drawer>
    </div>
  )
}
