import React, { useState } from 'react'
import { AlertTriangle, FileText, GraduationCap, ClipboardCheck, Clock } from 'lucide-react'
import { Tag, Button, Tabs, Progress } from 'antd'

const TODOS = [
  { id:'T001', type:'人工复核', title:'后厨未戴厨师帽', store:'茶颜悦色·IFS国金中心', time:'10:23', status:'pending', desc:'AI抓拍疑似违规，需人工复核确认' },
  { id:'T002', type:'整改任务', title:'前厅地面清洁整改', store:'茶颜悦色·万家丽店', time:'昨日17:30', status:'overdue', desc:'逾期2天未提交整改凭证', deadline:'5月16日' },
  { id:'T003', type:'AI考试', title:'后厨食安专项考试', store:'茶颜悦色·德思勤店', time:'今日截止', status:'pending', desc:'3名后厨人员未完成考试', person:'张师傅、李师傅、王师傅' },
  { id:'T004', type:'学习任务', title:'仓库管理规范学习', store:'茶颜悦色·开福万达店', time:'今日截止', status:'pending', desc:'2名仓储人员未完成学习', person:'赵姐、刘姐' },
  { id:'T005', type:'人工复核', title:'收台不及时', store:'茶颜悦色·太平街店', time:'11:05', status:'pending', desc:'AI抓拍3次同一时段违规' },
  { id:'T006', type:'整改任务', title:'后厨垃圾桶未加盖', store:'茶颜悦色·悦方ID店', time:'昨日14:00', status:'doing', desc:'己提交整改照片待核验', deadline:'5月18日' },
  { id:'T007', type:'AI考试', title:'前厅服务规范补考', store:'茶颜悦色·梅溪湖店', time:'今日截止', status:'overdue', desc:'1名员工补考逾期', person:'小明' },
]

const typeCfg:Record<string,{color:string;icon:React.ElementType}> = {
  '人工复核':{color:'blue',icon:AlertTriangle},'整改任务':{color:'orange',icon:FileText},
  'AI考试':{color:'purple',icon:GraduationCap},'学习任务':{color:'green',icon:ClipboardCheck}
}

export const InspectionTodo: React.FC = () => {
  const [tab, setTab] = useState('全部')
  const filtered = tab==='全部'?TODOS:TODOS.filter(t=>t.type===tab)

  return (<div className="p-6 space-y-4 overflow-y-auto h-full">
    <div><h2 className="text-base font-semibold text-[var(--text-primary)]">待办中心</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">待复核违规、待整改任务、待学课程、待完成考试</p></div>
    <Tabs size="small" activeKey={tab} onChange={setTab} items={['全部','人工复核','整改任务','学习任务','AI考试'].map(k=>({key:k,label:k}))}/>
    <div className="space-y-2">{filtered.map(t=>{const cfg=typeCfg[t.type];const Icon=cfg.icon
      return <div key={t.id} className="card-level-1 p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{backgroundColor:`${cfg.color}15`}}><Icon className="w-4 h-4" style={{color:cfg.color}}/></div>
        <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><Tag color={cfg.color} style={{fontSize:9}}>{t.type}</Tag><span className="text-sm font-medium text-[var(--text-primary)]">{t.title}</span>{t.status==='overdue'&&<Tag color="red" style={{fontSize:9}}>逾期</Tag>}</div>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-[var(--text-muted)]"><span>{t.store}</span><span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5"/>{t.time}</span>{t.deadline&&<span>截止{t.deadline}</span>}{t.person&&<span>人员:{t.person}</span>}</div>
          <div className="text-[10px] text-[var(--text-secondary)] mt-1">{t.desc}</div></div>
        <Button size="small" type="primary" style={{fontSize:10}}>{t.type==='人工复核'?'复核判定':t.type==='整改任务'?'立即整改':'去处理'}</Button>
      </div>
    })}</div>
  </div>)
}
