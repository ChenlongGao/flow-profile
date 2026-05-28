import React, { useState } from 'react'
import { MapPin, Plus, FileText, CheckCircle2, XCircle, Clock, Camera } from 'lucide-react'
import { Tag, Button, Tabs, Modal, Input, Select } from 'antd'
import dayjs from 'dayjs'

const MOCK = [
  { id:'LOC001', address:'武汉市江汉路步行街', city:'武汉市', area:'80㎡', rent:'280/㎡', contact:'张先生 138****6789', status:'待调研', score:9.2, notes:'人流量大，竞品少', since:'2026-05-10' },
  { id:'LOC002', address:'成都市太古里商圈', city:'成都市', area:'100㎡', rent:'350/㎡', contact:'李女士 139****8901', status:'调研中', score:9.0, notes:'已拍照，待填写报告', since:'2026-05-08' },
  { id:'LOC003', address:'广州市天河城商圈', city:'广州市', area:'70㎡', rent:'220/㎡', contact:'王先生 185****3456', status:'已评估', score:8.5, notes:'租金适中，竞争压力大', since:'2026-04-25' },
  { id:'LOC004', address:'杭州市湖滨银泰商圈', city:'杭州市', area:'85㎡', rent:'300/㎡', contact:'陈女士 177****2345', status:'已放弃', score:8.8, notes:'租金超出预算，放弃', since:'2026-04-15' },
  { id:'LOC005', address:'南京市新街口商圈', city:'南京市', area:'65㎡', rent:'200/㎡', contact:'赵先生 186****7890', status:'已评估', score:8.3, notes:'通过评估，待转化商机', since:'2026-05-05' },
  { id:'LOC006', address:'西安市钟楼商圈', city:'西安市', area:'75㎡', rent:'260/㎡', contact:'吴女士 133****5678', status:'调研中', score:8.7, notes:'人流量好，周二完成调研', since:'2026-05-12' },
]

const statusCfg:Record<string,{color:string;icon:React.ElementType}> = {
  '待调研':{color:'blue',icon:Clock},'调研中':{color:'orange',icon:Camera},'已评估':{color:'green',icon:CheckCircle2},'已放弃':{color:'default',icon:XCircle}
}

export const LocationList: React.FC = () => {
  const [tab, setTab] = useState('全部')
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = tab==='全部' ? MOCK : MOCK.filter(l=>l.status===tab)

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div><h2 className="text-base font-semibold text-[var(--text-primary)]">选址清单</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">管理所有选址点位，支持调研记录、评估审批、转化商机</p></div>
        <Button size="small" type="primary" icon={<Plus className="w-3 h-3" />} onClick={()=>setModalOpen(true)}>新增选址</Button>
      </div>

      <Tabs size="small" activeKey={tab} onChange={setTab}
        items={['全部','待调研','调研中','已评估','已放弃'].map(k=>({key:k,label:k}))} />

      <div className="space-y-2">
        {filtered.map(l => {
          const cfg = statusCfg[l.status]
          const Icon = cfg.icon
          return <div key={l.id} className="card-level-1 p-4 flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-[var(--ai-blue-500)]/10 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-[var(--ai-blue-500)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[var(--text-primary)]">{l.city} · {l.address}</div>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-[var(--text-muted)]">
                <span>{l.area} | ¥{l.rent} | {l.contact}</span>
                <span>创建于 {l.since}</span>
                <Tag color={l.score>=9?'red':'orange'} style={{fontSize:9}}>评分{l.score}</Tag>
              </div>
              {l.notes && <div className="text-[10px] text-[var(--text-secondary)] mt-1 flex items-center gap-1"><FileText className="w-3 h-3"/>{l.notes}</div>}
            </div>
            <Tag icon={<Icon className="w-2.5 h-2.5" />} color={cfg.color} style={{fontSize:10}}>{l.status}</Tag>
            <div className="flex items-center gap-1">
              <Button size="small" type="text" icon={<FileText className="w-3 h-3" />} />
              {l.status==='已评估' && <Button size="small" type="primary" style={{fontSize:10}}>转化商机</Button>}
            </div>
          </div>
        })}
      </div>

      <Modal title="新增选址" open={modalOpen} onCancel={()=>setModalOpen(false)} onOk={()=>setModalOpen(false)} okText="保存" cancelText="取消">
        <div className="space-y-3 mt-4">
          <Input size="small" placeholder="详细地址" />
          <div className="grid grid-cols-2 gap-2">
            <Select size="small" placeholder="城市" options={[{value:'武汉市',label:'武汉市'},{value:'长沙市',label:'长沙市'}]} style={{width:'100%'}} />
            <Input size="small" placeholder="面积（㎡）" />
            <Input size="small" placeholder="租金（元/㎡）" />
            <Input size="small" placeholder="联系人" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
