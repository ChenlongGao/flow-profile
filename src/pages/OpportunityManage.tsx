import React, { useState } from 'react'
import { BriefcaseBusiness, Search, ChevronRight, MapPin, Phone, User, Calendar, GripVertical } from 'lucide-react'
import { Tag, Button, Tabs, Input, Progress, Drawer, Select, message, Form, InputNumber, Pagination } from 'antd'
import { OpportunityDetail } from './OpportunityDetail'

interface Props { setActivePage: (page: string) => void }

const OPPORTUNITIES = [
  { id:'OPP001', name:'茶颜悦色·武汉江汉路旗舰店', city:'武汉市', district:'江汉区', stage:'即将签约', person:'张拓', follows:8, invest:280, area:80, since:'2026-03-20', expectSign:'2026-06-15', contact:'李先生', phone:'138****0001', progress:85 },
  { id:'OPP002', name:'茶颜悦色·成都太古里店', city:'成都市', district:'锦江区', stage:'深度谈判', person:'李建', follows:6, invest:350, area:100, since:'2026-04-01', expectSign:'2026-07-01', contact:'王女士', phone:'139****0002', progress:65 },
  { id:'OPP003', name:'茶颜悦色·广州天河城店', city:'广州市', district:'天河区', stage:'初步接触', person:'王敏', follows:3, invest:220, area:70, since:'2026-05-01', expectSign:'2026-08-01', contact:'陈先生', phone:'185****0003', progress:20 },
  { id:'OPP004', name:'茶颜悦色·杭州湖滨银泰店', city:'杭州市', district:'上城区', stage:'深度谈判', person:'陈丽', follows:5, invest:300, area:85, since:'2026-04-10', expectSign:'2026-07-15', contact:'赵女士', phone:'177****0004', progress:60 },
  { id:'OPP005', name:'茶颜悦色·南京新街口店', city:'南京市', district:'秦淮区', stage:'初步接触', person:'赵强', follows:2, invest:200, area:65, since:'2026-05-08', expectSign:'2026-09-01', contact:'刘先生', phone:'186****0005', progress:15 },
  { id:'OPP006', name:'茶颜悦色·西安钟楼店', city:'西安市', district:'雁塔区', stage:'即将签约', person:'吴婷', follows:7, invest:260, area:75, since:'2026-03-15', expectSign:'2026-06-30', contact:'周先生', phone:'133****0006', progress:80 },
  { id:'OPP007', name:'茶颜悦色·深圳万象天地店', city:'深圳市', district:'南山区', stage:'已签约', person:'张拓', follows:10, invest:400, area:120, since:'2026-02-10', expectSign:'2026-05-20', contact:'黄先生', phone:'158****0007', progress:100 },
  { id:'OPP008', name:'茶颜悦色·重庆解放碑店', city:'重庆市', district:'渝中区', stage:'已流失', person:'李建', follows:4, invest:220, area:70, since:'2026-03-01', expectSign:'-', contact:'何先生', phone:'180****0008', progress:0 },
]

const stageCfg:Record<string,{color:string;order:number}> = {
  '初步接触':{color:'blue',order:1},'深度谈判':{color:'orange',order:2},'即将签约':{color:'purple',order:3},'已签约':{color:'green',order:4},'已流失':{color:'default',order:5}
}

const drawerStyles = {
  header: { background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' },
  body: { background: 'var(--bg-primary)', padding: '24px' },
}

export const OpportunityManage: React.FC<Props> = ({ setActivePage }) => {
  const [tab, setTab] = useState('全部')
  const [search, setSearch] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [configStage, setConfigStage] = useState('全部')
  const [page, setPage] = useState(1)
  const pageSize = 5

  const filtered = OPPORTUNITIES.filter(o => {
    if (tab!=='全部' && o.stage!==tab) return false
    if (search && !o.name.includes(search) && !o.city.includes(search)) return false
    return true
  })
  const paginated = filtered.slice((page-1)*pageSize, page*pageSize)

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-0 space-y-4 flex-1 overflow-y-auto">
      {/* 标题 + 副标题 */}
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">商机管理</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">全生命周期管理商机，标准化跟进流程，点击行查看详情</p>
      </div>

      {/* 搜索（左）+ 新增商机 / 商机配置（右） */}
      <div className="flex items-center gap-3">
        <Input size="middle" prefix={<Search className="w-3.5 h-3.5" />} value={search}
          onChange={e=>setSearch(e.target.value)} placeholder="搜索商机名称或城市..."
          style={{width:260}} allowClear />
        <div className="flex-1" />
        <Button size="middle" type="primary" onClick={() => setCreateOpen(true)}>新增商机</Button>
        <Button size="middle" onClick={() => setConfigOpen(true)}>商机配置</Button>
      </div>

      {/* Tabs */}
      <Tabs size="small" activeKey={tab} onChange={setTab}
        items={['全部','初步接触','深度谈判','即将签约','已签约','已流失'].map(k=>({key:k,label:k}))} />

      {/* 表格 */}
      <div className="card-level-1 overflow-hidden" style={{ padding: 0 }}>
        <table className="w-full text-xs">
          <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-[var(--text-secondary)]">商机名称</th>
              <th className="px-3 py-2.5 text-left font-medium text-[var(--text-secondary)]">所在城市</th>
              <th className="px-3 py-2.5 text-left font-medium text-[var(--text-secondary)]">当前阶段</th>
              <th className="px-3 py-2.5 text-left font-medium text-[var(--text-secondary)]">负责人</th>
              <th className="px-3 py-2.5 text-right font-medium text-[var(--text-secondary)]">投资(万)</th>
              <th className="px-3 py-2.5 text-right font-medium text-[var(--text-secondary)]">面积(㎡)</th>
              <th className="px-3 py-2.5 text-left font-medium text-[var(--text-secondary)]">预计签约</th>
              <th className="px-3 py-2.5 text-center font-medium text-[var(--text-secondary)]">跟进</th>
              <th className="px-3 py-2.5 text-left font-medium text-[var(--text-secondary)]">进度</th>
              <th className="px-3 py-2.5 text-center font-medium text-[var(--text-secondary)]">操作</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(o => {
              const st = stageCfg[o.stage]
              return (
                <tr key={o.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors"
                  onClick={() => setDetailOpen(true)}>
                  <td className="px-4 py-2.5 font-medium text-[var(--text-primary)]">
                    <div>{o.name}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[var(--text-muted)]">
                      <span className="flex items-center gap-1"><User className="w-2.5 h-2.5"/>{o.contact}</span>
                      <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5"/>{o.phone}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[var(--text-secondary)]">{o.city}·{o.district}</td>
                  <td className="px-3 py-2.5"><Tag color={st.color} style={{fontSize:10}}>{o.stage}</Tag></td>
                  <td className="px-3 py-2.5 text-[var(--text-secondary)]">{o.person}</td>
                  <td className="px-3 py-2.5 text-right text-[var(--text-primary)]">¥{o.invest}</td>
                  <td className="px-3 py-2.5 text-right text-[var(--text-secondary)]">{o.area}</td>
                  <td className="px-3 py-2.5 text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5"/>{o.expectSign}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center text-[var(--text-secondary)]">{o.follows}次</td>
                  <td className="px-3 py-2.5" style={{minWidth:80}}>
                    <Progress percent={o.progress} size="small" strokeColor={o.progress>=80?'#10B981':o.progress>=50?'#3B82F6':'#F59E0B'} showInfo={false} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Button size="small" type="link" style={{fontSize:10}} onClick={(e) => { e.stopPropagation(); setDetailOpen(true) }}>
                      详情 <ChevronRight className="w-3 h-3 inline" />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      </div>

      {/* 底部分页器 */}
      <div className="px-6 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] shrink-0 flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)]">共 {filtered.length} 条商机</span>
        <Pagination size="small" current={page} pageSize={pageSize} total={filtered.length}
          onChange={(p) => setPage(p)} showSizeChanger={false} />
      </div>

      {/* 商机详情抽屉 */}
      <Drawer title="商机详情" open={detailOpen} onClose={() => setDetailOpen(false)} width="80%" destroyOnClose styles={drawerStyles}>
        <OpportunityDetail />
      </Drawer>

      {/* 新增商机抽屉 */}
      <Drawer title="新增商机" open={createOpen} onClose={() => setCreateOpen(false)} width={560} destroyOnClose styles={drawerStyles}>
        <Form layout="vertical" size="small">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="商机名称" required><Input placeholder="如：茶颜悦色·某城市某商场店" /></Form.Item>
            <Form.Item label="所在城市" required><Input placeholder="如：武汉市" /></Form.Item>
            <Form.Item label="所在区域"><Input placeholder="如：江汉区" /></Form.Item>
            <Form.Item label="负责人" required><Input placeholder="如：张拓" /></Form.Item>
            <Form.Item label="投资金额（万）"><InputNumber placeholder="输入投资金额" style={{width:'100%'}} /></Form.Item>
            <Form.Item label="预计面积（㎡）"><InputNumber placeholder="输入预计面积" style={{width:'100%'}} /></Form.Item>
            <Form.Item label="预计签约时间"><Input placeholder="如：2026-08-01" /></Form.Item>
            <Form.Item label="当前阶段">
              <Select defaultValue="初步接触" options={['初步接触','深度谈判','即将签约'].map(s=>({value:s,label:s}))} />
            </Form.Item>
            <Form.Item label="联系人"><Input placeholder="联系人姓名" /></Form.Item>
            <Form.Item label="联系电话"><Input placeholder="联系电话" /></Form.Item>
          </div>
          <Form.Item label="备注"><Input.TextArea rows={3} placeholder="输入商机备注信息..." /></Form.Item>
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
            <Button onClick={() => setCreateOpen(false)}>取消</Button>
            <Button type="primary" onClick={() => { message.success('商机创建成功'); setCreateOpen(false) }}>确认创建</Button>
          </div>
        </Form>
      </Drawer>

      {/* 商机配置抽屉 */}
      <Drawer title="SOP 流程配置" open={configOpen} onClose={() => setConfigOpen(false)} width={700} destroyOnClose
        styles={{...drawerStyles, body:{...drawerStyles.body, padding:0, display:'flex', flexDirection:'column', overflow:'hidden'}}}>
        <div className="space-y-3 flex-1 overflow-y-auto" style={{padding:'24px'}}>
          <Tabs size="small" activeKey={configStage} onChange={setConfigStage} items={['全部','初步接触','深度谈判','即将签约','已签约','已流失'].map(k=>({key:k,label:k}))}/>
          <div className="text-xs text-[var(--text-secondary)] mb-2">配置「{configStage==='全部'?'全阶段':configStage}」的 SOP 流程步骤。SOP 步骤将在商机推进时按顺序执行。</div>
          {(['初步接触','深度谈判','即将签约','已签约','已流失'].filter(k=>configStage==='全部'||k===configStage)).map(stage=>(
            <div key={stage} className="card-level-1 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                <BriefcaseBusiness className="w-3.5 h-3.5 text-[var(--ai-blue-500)]"/>{stage}
                <Tag color="blue" style={{fontSize:9}}>3步</Tag>
              </div>
              {[1,2,3].map(step=>(
                <div key={step} className="flex items-center gap-2 text-xs bg-[var(--bg-tertiary)] p-2 rounded">
                  <GripVertical className="w-3 h-3 text-[var(--text-muted)] cursor-grab"/>
                  <span className="text-[var(--ai-blue-500)] font-mono">Step {step}</span>
                  <Input size="small" defaultValue={step===1?'信息核实与录入':step===2?'核实商场租赁条件和合同条款':'确定决策关键人及时间表'} style={{flex:1}} bordered={false}/>
                  <Select size="small" defaultValue={step===1?'必做':step===3?'选做':'必做'} style={{width:70}} options={[{value:'必做',label:'必做'},{value:'选做',label:'选做'}]}/>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] shrink-0">
          <Button size="middle">添加步骤</Button>
          <Button size="middle" type="primary" onClick={() => { message.success('SOP配置已保存'); setConfigOpen(false) }}>保存配置</Button>
        </div>
      </Drawer>
    </div>
  )
}
