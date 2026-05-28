import React, { useState } from 'react'
import { CheckCircle2, Clock, AlertCircle, Plus, GanttChart, User } from 'lucide-react'
import { Tag, Button, Tabs, Progress, Select } from 'antd'
import dayjs from 'dayjs'

const PROJECTS = [
  { id:'EXP001', store:'茶颜悦色·武汉江汉路旗舰店', city:'武汉市', planOpen:'2026-06-15', progress:55, tasks:12, done:7, delayed:2, person:'张拓' },
  { id:'EXP002', store:'茶颜悦色·长沙岳麓大学城店', city:'长沙市', planOpen:'2026-06-01', progress:80, tasks:10, done:8, delayed:0, person:'李建' },
  { id:'EXP003', store:'茶颜悦色·成都太古里店', city:'成都市', planOpen:'2026-07-01', progress:35, tasks:12, done:4, delayed:1, person:'王敏' },
]

const TASK_TEMPLATE = [
  { phase:'设计阶段', tasks:['品牌空间设计','施工图纸审核','消防设计报审'], duration:'15天' },
  { phase:'施工阶段', tasks:['装修施工','设备安装','软装布置'], duration:'30天' },
  { phase:'证照办理', tasks:['营业执照','食品经营许可','消防验收'], duration:'20天' },
  { phase:'筹备阶段', tasks:['人员招聘培训','设备调试','开业宣传'], duration:'15天' },
  { phase:'开业验收', tasks:['试运营','问题整改','正式开业'], duration:'7天' },
]

export const ExpansionTask: React.FC = () => {
  const [selected, setSelected] = useState<string | null>('EXP001')

  const project = PROJECTS.find(p=>p.id===selected)

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div><h2 className="text-base font-semibold text-[var(--text-primary)]">拓店任务</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">标准化门店筹备流程，实时监控任务进度</p></div>
        <Button size="small" type="primary" icon={<Plus className="w-3 h-3" />}>新建任务</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {PROJECTS.map(p => (
          <div key={p.id} onClick={()=>setSelected(p.id)}
            className={`card-level-1 p-3 cursor-pointer transition-all ${selected===p.id?'ring-2 ring-[var(--ai-blue-500)]':''}`}>
            <div className="text-sm font-medium text-[var(--text-primary)] mb-1 truncate">{p.store}</div>
            <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mb-2">
              <span>{p.city}</span><span>预计{p.planOpen}开业</span>
            </div>
            <Progress percent={p.progress} size="small" />
            <div className="flex items-center justify-between mt-1 text-[10px] text-[var(--text-muted)]">
              <span>{p.done}/{p.tasks}完成</span>
              <span className="flex items-center gap-1"><User className="w-2.5 h-2.5"/>{p.person}</span>
              {p.delayed>0 && <Tag color="red" style={{fontSize:9}}>{p.delayed}个逾期</Tag>}
            </div>
          </div>
        ))}
      </div>

      {project && (
        <div className="card-level-1 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <GanttChart className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-sm font-medium text-[var(--text-primary)]">任务甘特图 · {project.store}</span>
          </div>
          <div className="space-y-2">
            {TASK_TEMPLATE.map((phase, i) => (
              <div key={i} className="border border-[var(--border-subtle)] rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[var(--text-primary)]">{phase.phase}</span>
                  <Tag style={{fontSize:10}}>{phase.duration}</Tag>
                </div>
                <div className="space-y-1.5">
                  {phase.tasks.map((t, j) => {
                    const done = Math.random() > 0.3
                    return <div key={j} className="flex items-center gap-2 text-[11px]">
                      {done ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        : <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      <span className={`flex-1 ${done?'text-[var(--text-muted)] line-through':'text-[var(--text-primary)]'}`}>
                        {t}
                      </span>
                      {!done && <Tag color="orange" style={{fontSize:9}}>进行中</Tag>}
                    </div>
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
