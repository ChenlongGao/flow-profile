import React, { useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, Calendar, Shield, FileText, Plus, Search, GraduationCap, BookOpen, Brain, TrendingUp, Filter, BarChart3, Download, ClipboardList, Upload, MessageSquare, Camera, ArrowLeft, ChevronRight, MapPin, Building2, Store } from 'lucide-react'
import { Tag, Button, Tabs, Select, Progress, Input, Timeline, DatePicker, Modal, Drawer, message, Checkbox, Pagination } from 'antd'

/* ═══ 巡检任务 ═══ */

export const InspectionSchedule: React.FC = () => (
  <div className="p-6 space-y-4 overflow-y-auto h-full">
    <div className="flex items-center justify-between"><div><h2 className="text-base font-semibold text-[var(--text-primary)]">计划巡检</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">日常定时自动巡检·就餐全流程时序</p></div><Button size="small" type="primary" icon={<Plus className="w-3 h-3"/>}>新增计划</Button></div>
    <div className="card-level-1 p-4 space-y-3">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400"/><span className="text-sm font-medium text-[var(--text-primary)]">日常全流程巡检</span><Tag color="green" style={{fontSize:12}}>运行中</Tag></div><Button size="small" type="link" style={{fontSize:12}}>编辑</Button></div>
      <div className="grid grid-cols-6 gap-2">{['进店迎宾','点餐','出餐','上菜','巡台','收台'].map((s,i)=><div key={s} className="p-2 rounded bg-[var(--bg-tertiary)] text-center text-[10px]"><div className="text-[var(--text-muted)]">{i+1}.{s}</div><div className="text-[var(--text-primary)] mt-0.5">10:00-22:00</div></div>)}</div>
      <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)]"><span>频率: 每2小时</span><span>门店: 全部8家</span><span>下次: 14:00</span></div></div>
    <div className="card-level-1 p-4 space-y-2"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[var(--ai-blue-500)]"/><span className="text-sm font-medium text-[var(--text-primary)]">后厨食安专项</span><Tag color="blue" style={{fontSize:12}}>定时</Tag></div><div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)]"><span>频率: 每日3次 (11:00,14:00,20:00)</span><span>门店: 全部8家</span></div></div>
  </div>
)

export const InspectionSpot: React.FC = () => (
  <div className="p-6 space-y-4 overflow-y-auto h-full"><div><h2 className="text-base font-semibold text-[var(--text-primary)]">临时抽检</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">手动发起突击巡检·现场抓拍AI识别</p></div>
    <div className="card-level-1 p-4 space-y-3 flex items-center gap-4"><Select size="small" defaultValue="IFS国金中心" style={{width:150}} options={[{value:'IFS国金中心',label:'IFS国金中心'}]}/>
    <Select size="small" defaultValue="前厅" style={{width:120}} options={['前厅','后厨','仓库','外围'].map(v=>({value:v,label:v}))}/>
    <Select size="small" defaultValue="全流程" style={{width:150}} options={['全流程','环境卫生','人员规范','后厨食安'].map(v=>({value:v,label:v}))}/>
    <Button size="small" type="primary" icon={<Search className="w-3 h-3"/>}>发起临时抽检</Button></div>
    <div className="card-level-1 p-8 text-center text-sm text-[var(--text-muted)] aspect-video flex items-center justify-center bg-[#0f172a]"><Camera className="w-8 h-8 text-gray-600 mr-3"/>未发起抽检，点击上方按钮开始</div>
  </div>
)

export const InspectionStandard: React.FC = () => {
  const groups = [
    { zone:'门店外围', items:['门头招牌整洁','外围地面清洁','门口无障碍物','招牌灯正常'] },
    { zone:'前厅服务', items:['迎宾站姿规范','服务员着装标准','口罩佩戴检查','桌面清洁度','餐具摆放标准','地面无水渍油渍'] },
    { zone:'后厨食安', items:['厨师帽佩戴','口罩佩戴','操作台清洁','生熟分区','垃圾桶加盖','食材保鲜期限','灭蝇灯运行','洗手池清洁'] },
    { zone:'仓库仓储', items:['物品分类存放','离墙离地','防鼠防虫','温湿度达标','先进先出标签','无过期品'] },
  ]
  return (<div className="p-6 space-y-4 overflow-y-auto h-full"><div><h2 className="text-base font-semibold text-[var(--text-primary)]">巡检标准</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">巡检类目库维护·自定义模板·同步知识库</p></div>
    <div className="grid grid-cols-2 gap-3">{groups.map(g=><div key={g.zone} className="card-level-1 p-4"><div className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-[var(--ai-blue-500)]"/>{g.zone}</div><div className="space-y-1">{g.items.map((t,i)=><div key={i} className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] py-0.5"><Checkbox defaultChecked/><span>{t}</span><Tag style={{fontSize:12}}>扣2分</Tag></div>)}</div></div>)}</div>
  </div>)
}

/* ═══ 违规管理 ═══ */

export const ViolationRectify: React.FC = () => {
  const rectifications = Array.from({length:25},(_,i)=>{
    const stores = ['IFS国金中心','太平街店','德思勤店','悦方ID店','梅溪湖步步高店','开福万达店','湖滨银泰店','广州天河城店','深圳万象天地','成都太古里店','南京新街口店','重庆解放碑店']
    const names = ['后厨未戴厨师帽','前厅地面清洁','垃圾桶未加盖','收台不及时','厨具未归位','消防通道堵塞','未佩戴口罩','冷藏温度超标']
    const modes = ['实时巡检','组合巡检','流程巡检','临时抽检']
    const statuses = ['整改中','逾期','已完成','整改中','整改中']
    const managers = ['张拓','李建','王鹏','陈静','刘洋','赵敏']
    return {id:`R${String(i+1).padStart(3,'0')}`,name:`${names[i%names.length]}`,store:stores[i%stores.length],manager:managers[i%managers.length],deadline:`2026-05-${17+Math.floor(i/3)} 18:00:00`,startTime:`2026-05-${15+i} ${String(8+i%12).padStart(2,'0')}:${String(i*7%60).padStart(2,'0')}:${String(i*13%60).padStart(2,'0')}`,reviewTime:`2026-05-${16+i} ${String(10+i%12).padStart(2,'0')}:${String(i*11%60).padStart(2,'0')}:${String(i*17%60).padStart(2,'0')}`,reviewMethod:'AI模型',status:statuses[i%statuses.length],mode:modes[i%4],rectifier:managers[i%managers.length]}
  })
  const [page,setPage]=useState(1);const [search,setSearch]=useState('');const [storeFilter,setStoreFilter]=useState('全部');const [statusFilter,setStatusFilter]=useState('全部');const ps=12
  const filtered=rectifications.filter(r=>{
    if(search&&!r.store.includes(search)&&!r.name.includes(search))return false
    if(storeFilter!=='全部'&&r.store!==storeFilter)return false
    if(statusFilter!=='全部'&&r.status!==statusFilter)return false
    return true
  })
  const storeOptions=[...new Set(rectifications.map(r=>r.store))]
  return (<div className="p-6 h-full flex flex-col overflow-hidden"><div className="shrink-0 space-y-3"><div><h2 className="text-base font-semibold text-[var(--text-primary)]">整改复核</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">全部门店 · 整改进度 · AI模型复核 · 来源巡检任务</p></div>
  <div className="flex items-center gap-3 flex-wrap">
    <Input size="middle" prefix={<Search className="w-3 h-3"/>} value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="搜索门店/整改项..." style={{width:180}} allowClear/>
    <Select size="middle" value={storeFilter} onChange={v=>{setStoreFilter(v);setPage(1)}} style={{width:140}} options={[{value:'全部',label:'全部门店'},...storeOptions.map(s=>({value:s,label:s}))]}/>
    <Select size="middle" value={statusFilter} onChange={v=>{setStatusFilter(v);setPage(1)}} style={{width:100}} options={[{value:'全部',label:'全部状态'},{value:'整改中',label:'整改中'},{value:'逾期',label:'逾期'},{value:'已完成',label:'已完成'}]}/>
    <div className="flex-1"/>
    <span className="text-[10px] text-[var(--text-muted)]">共 {filtered.length} 条</span>
  </div></div>
  <div className="flex-1 overflow-y-auto mt-2"><div className="card-level-1 overflow-hidden" style={{padding:0}}><table className="w-full text-xs"><thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] sticky top-0"><tr>
    <th className="px-3 py-2.5 text-center w-10">#</th><th className="px-3 py-2.5 text-center whitespace-nowrap" style={{width:64}}>抓拍图片</th><th className="px-3 py-2.5 text-left">整改项</th><th className="px-3 py-2.5 text-left">门店</th><th className="px-3 py-2.5 text-center whitespace-nowrap" style={{width:60}}>参考图例</th><th className="px-3 py-2.5 text-left">门店规范</th><th className="px-3 py-2.5 text-left">店长</th><th className="px-3 py-2.5 text-left">整改人</th><th className="px-3 py-2.5 text-center">状态</th><th className="px-3 py-2.5 text-left">巡检模式</th><th className="px-3 py-2.5 text-left">开始日期</th><th className="px-3 py-2.5 text-left">截止日期</th><th className="px-3 py-2.5 text-left">复核方式</th><th className="px-3 py-2.5 text-left">复核时间</th><th className="px-3 py-2.5 text-right">操作</th>
  </tr></thead><tbody>{filtered.slice((page-1)*ps,page*ps).map((r,i)=>(<tr key={r.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
    <td className="px-3 py-2.5 text-center text-[var(--text-muted)]">{(page-1)*ps+i+1}</td>
    <td className="px-3 py-2.5 text-center">
      <div className="w-10 h-10 rounded bg-black/60 mx-auto flex items-center justify-center cursor-pointer">
        <Camera className="w-3.5 h-3.5 text-white/15"/>
      </div>
    </td>
    <td className="px-3 py-2.5 font-medium text-[var(--text-primary)]">{r.name}</td>
    <td className="px-3 py-2.5 font-medium text-[var(--text-primary)]">{r.store}</td>
    <td className="px-3 py-2.5 text-center">
      <div className="w-10 h-10 rounded bg-black/60 mx-auto flex items-center justify-center cursor-pointer">
        <Camera className="w-3.5 h-3.5 text-white/15"/>
      </div>
    </td>
    <td className="px-3 py-2.5 text-[var(--text-secondary)]">《门店巡检规范》整改条款</td>
    <td className="px-3 py-2.5 text-[var(--text-secondary)]">{r.manager}</td>
    <td className="px-3 py-2.5 text-[var(--text-secondary)]">{r.rectifier}</td>
    <td className="px-3 py-2.5 text-center"><Tag color={r.status==='逾期'?'red':r.status==='已完成'?'green':'orange'} style={{fontSize:12}}>{r.status}</Tag></td>
    <td className="px-3 py-2.5"><Tag color="blue" style={{fontSize:12}}>{r.mode}</Tag></td>
    <td className="px-3 py-2.5 text-[var(--text-secondary)]">{r.startTime}</td>
    <td className="px-3 py-2.5 text-[var(--text-secondary)]">{r.deadline}</td>
    <td className="px-3 py-2.5 text-[var(--text-secondary)]">{r.reviewMethod}</td>
    <td className="px-3 py-2.5 text-[var(--text-secondary)]">{r.reviewTime}</td>
    <td className="px-3 py-2.5 text-right">
      <div className="flex items-center justify-end gap-1">
        <Button size="small" danger={r.status==='逾期'} type={r.status==='逾期'?'primary':r.status==='已完成'?'default':'primary'} style={{fontSize:12}} onClick={()=>{
          if(r.status==='逾期') message.warning('已发送催办通知')
          else if(r.status==='已完成') message.info('复核通过，无需二次整改')
          else message.info('打开整改上传')
        }}>{r.status==='逾期'?'催办':r.status==='已完成'?'查看':'整改'}</Button>
      </div>
    </td>
  </tr>))}</tbody></table></div></div>
  <div className="shrink-0 flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
    <span className="text-[10px] text-[var(--text-muted)]">共 {filtered.length} 条，第 {page}/{Math.ceil(filtered.length/ps)} 页</span>
    <Pagination current={page} pageSize={ps} total={filtered.length} onChange={setPage} size="small" showSizeChanger={false}/>
  </div></div>)
}

export const ViolationArchive: React.FC = () => {
  const [dateFilter,setDateFilter]=useState('本月')
  const [storeFilter,setStoreFilter]=useState('全部')
  const stores=['IFS国金中心','太平街店','德思勤店','梅溪湖步步高店','湖滨银泰店','广州天河城店','深圳万象天地','成都太古里店']
  
  const stats=[
    {label:'任务清单',value:'1,248',sub:'本月已执行',color:'#3B82F6'},
    {label:'执行次数',value:'4,892',sub:'摄像头抓拍',color:'#10B981'},
    {label:'设备覆盖',value:'267',sub:'台在线摄像头',color:'#8B5CF6'},
    {label:'整改时效',value:'2.3h',sub:'平均复核时长',color:'#F59E0B'},
    {label:'整改数量',value:'186',sub:'已完成整改',color:'#EF4444'},
    {label:'复核通过率',value:'94.2%',sub:'AI模型复核',color:'#EC4899'},
    {label:'违规检出率',value:'14.9%',sub:'总任务占比',color:'#F97316'},
    {label:'误报率',value:'2.1%',sub:'AI精准度',color:'#6366F1'},
  ]

  const problemRank=[
    {name:'垃圾桶未加盖',count:48,emergency:12,warning:20,minor:16},
    {name:'未戴厨师帽',count:36,emergency:8,warning:18,minor:10},
    {name:'地面清洁不到位',count:32,emergency:5,warning:15,minor:12},
    {name:'收台不及时',count:28,emergency:10,warning:10,minor:8},
    {name:'厨具未归位',count:24,emergency:6,warning:12,minor:6},
    {name:'消防通道堵塞',count:22,emergency:14,warning:6,minor:2},
  ]

  const storeRank=[
    {name:'IFS国金中心',count:56,rectified:52},
    {name:'太平街店',count:48,rectified:45},
    {name:'德思勤店',count:42,rectified:38},
    {name:'悦方ID店',count:38,rectified:36},
    {name:'梅溪湖步步高店',count:35,rectified:32},
    {name:'开福万达店',count:30,rectified:28},
  ]

  // 告警分布
  const alertDist={emergency:28,warning:58,minor:100,total:186}
  
  // 整改时效分布
  const rectTimeline=[
    {period:'≤1小时',count:86,color:'#10B981',pct:'46%'},
    {period:'1-3小时',count:65,color:'#F59E0B',pct:'35%'},
    {period:'>3小时',count:35,color:'#EF4444',pct:'19%'},
  ]

  // 整改时效排行
  const rectRank=[
    {name:'IFS国金中心',avgTime:'1.2h',count:52},
    {name:'德思勤店',avgTime:'1.5h',count:38},
    {name:'太平街店',avgTime:'1.8h',count:45},
    {name:'梅溪湖步步高店',avgTime:'2.1h',count:32},
    {name:'湖滨银泰店',avgTime:'2.4h',count:28},
    {name:'悦方ID店',avgTime:'2.8h',count:36},
  ]

  

  const BarBlock: React.FC<{label:string;value:number;max:number;color:string}> = ({label,value,max,color})=>(
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-24 text-[var(--text-secondary)] truncate">{label}</span>
      <div className="flex-1 h-4 rounded relative overflow-hidden" style={{background:color+'15'}}>
        <div className="absolute inset-y-0 left-0 rounded" style={{width:`${value/max*100}%`,background:color,opacity:0.4}}/>
        <span className="absolute inset-0 flex items-center px-1.5 text-[10px] font-medium" style={{color}}>{value}</span>
      </div>
    </div>
  )

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <div className="shrink-0 space-y-3">
        <div><h2 className="text-base font-semibold text-[var(--text-primary)]">违规档案</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">任务→违规→整改→复核全流程监控 · 全链路数据驱动管理决策</p></div>
        <div className="flex items-center gap-3">
          <Select size="middle" value={dateFilter} onChange={setDateFilter} style={{width:100}}
            options={[{value:'本月',label:'本月'},{value:'上月',label:'上月'},{value:'本季',label:'本季'}]}/>
          <Select size="middle" value={storeFilter} onChange={setStoreFilter} style={{width:140}}
            options={[{value:'全部',label:'全部门店'},...stores.map(s=>({value:s,label:s}))]}/>
          <Input size="middle" prefix={<Search className="w-3 h-3"/>} placeholder="搜索..." style={{width:160}}/>
          <Button size="middle" type="primary">查询</Button>
          <Button size="middle" onClick={()=>{setDateFilter('本月');setStoreFilter('全部')}}>重置</Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto mt-3 space-y-4">
        {/* 指标卡 */}
        <div className="grid grid-cols-4 gap-3">
          {stats.map(s=>(
            <div key={s.label} className="card-level-1 p-3 space-y-1">
              <div className="text-[10px] text-[var(--text-muted)]">{s.label}</div>
              <div className="text-xl font-bold" style={{color:s.color}}>{s.value}</div>
              <div className="text-[9px] text-[var(--text-muted)]">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* 全流程 + 告警分布 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card-level-1 p-3" style={{minHeight:180}}>
            <div className="text-xs font-medium text-[var(--text-primary)] mb-3">全流程监控</div>
            <div className="space-y-2">
              <BarBlock label="任务下发" value={1248} max={1248} color="#3B82F6"/>
              <BarBlock label="AI巡检" value={1120} max={1248} color="#10B981"/>
              <BarBlock label="违规检出" value={186} max={1248} color="#EF4444"/>
              <BarBlock label="整改下发" value={186} max={1248} color="#F59E0B"/>
              <BarBlock label="复核完成" value={175} max={1248} color="#EC4899"/>
            </div>
          </div>
          <div className="card-level-1 p-3" style={{minHeight:180}}>
            <div className="text-xs font-medium text-[var(--text-primary)] mb-3">告警等级分布</div>
            <div className="flex items-center justify-center h-[calc(100%-40px)] gap-6">
              <div className="flex flex-col items-center gap-1">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{background:'#EF444420',border:'3px solid #EF4444'}}>
                  <div className="text-center"><div className="text-lg font-bold" style={{color:'#EF4444'}}>{alertDist.emergency}</div><div className="text-[9px]" style={{color:'#EF4444'}}>紧急</div></div>
                </div>
                <span className="text-[10px] text-[var(--text-muted)]">{Math.round(alertDist.emergency/alertDist.total*100)}%</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{background:'#F59E0B20',border:'3px solid #F59E0B'}}>
                  <div className="text-center"><div className="text-lg font-bold" style={{color:'#F59E0B'}}>{alertDist.warning}</div><div className="text-[9px]" style={{color:'#F59E0B'}}>告警</div></div>
                </div>
                <span className="text-[10px] text-[var(--text-muted)]">{Math.round(alertDist.warning/alertDist.total*100)}%</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{background:'#3B82F620',border:'3px solid #3B82F6'}}>
                  <div className="text-center"><div className="text-lg font-bold" style={{color:'#3B82F6'}}>{alertDist.minor}</div><div className="text-[9px]" style={{color:'#3B82F6'}}>轻微</div></div>
                </div>
                <span className="text-[10px] text-[var(--text-muted)]">{Math.round(alertDist.minor/alertDist.total*100)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* 巡检项问题排行 */}
          <div className="card-level-1 p-3" style={{minHeight:180}}>
            <div className="text-xs font-medium text-[var(--text-primary)] mb-3">巡检项问题排行</div>
            <div className="space-y-1.5">
              {problemRank.map((p,i)=>{
                const maxCnt=problemRank[0].count
                return (<div key={p.name}>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-4 text-[var(--text-muted)]">{i+1}</span>
                    <span className="flex-1 text-[var(--text-secondary)] truncate">{p.name}</span>
                    <span className="text-[var(--text-primary)] font-medium">{p.count}</span>
                  </div>
                  <div className="ml-6 mt-0.5 h-2 rounded flex overflow-hidden">
                    <div style={{width:`${p.emergency/maxCnt*100}%`,background:'#EF4444'}}/>
                    <div style={{width:`${p.warning/maxCnt*100}%`,background:'#F59E0B'}}/>
                    <div style={{width:`${p.minor/maxCnt*100}%`,background:'#3B82F6'}}/>
                  </div>
                </div>)
              })}
            </div>
            <div className="flex items-center gap-3 text-[9px] text-[var(--text-muted)] mt-2">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded" style={{background:'#EF4444'}}/>紧急</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded" style={{background:'#F59E0B'}}/>告警</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded" style={{background:'#3B82F6'}}/>轻微</span>
            </div>
          </div>

          {/* 门店问题排行 */}
          <div className="card-level-1 p-3" style={{minHeight:180}}>
            <div className="text-xs font-medium text-[var(--text-primary)] mb-3">门店问题排行</div>
            <div className="space-y-2">
              {storeRank.map((s,i)=>{
                const maxCnt=storeRank[0].count
                return (<div key={s.name}>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-4 text-[var(--text-muted)]">{i+1}</span>
                    <span className="flex-1 text-[var(--text-secondary)] truncate">{s.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{s.rectified}/{s.count}</span>
                  </div>
                  <div className="ml-6 mt-0.5 h-2 rounded flex overflow-hidden">
                    <div style={{width:`${s.rectified/maxCnt*100}%`,background:'#10B981'}}/>
                    <div style={{flex:1,background:'var(--bg-tertiary)'}}/>
                  </div>
                </div>)
              })}
            </div>
          </div>

          {/* 整改时效看板 */}
          <div className="card-level-1 p-3" style={{minHeight:180}}>
            <div className="text-xs font-medium text-[var(--text-primary)] mb-3">整改时效分布</div>
            <div className="space-y-3 mt-2">
              {rectTimeline.map(r=>{
                const maxCnt=rectTimeline[0].count
                return (<div key={r.period}>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-16 text-[var(--text-muted)]">{r.period}</span>
                    <span className="font-medium" style={{color:r.color}}>{r.count}单</span>
                    <span className="ml-auto text-[var(--text-muted)]">{r.pct}</span>
                  </div>
                  <div className="mt-1 h-4 rounded relative overflow-hidden" style={{background:r.color+'15'}}>
                    <div className="absolute inset-y-0 left-0 rounded" style={{width:`${r.count/maxCnt*100}%`,background:r.color,opacity:0.35}}/>
                  </div>
                </div>)
              })}
            </div>
          </div>

          {/* 整改时效排行 */}
          <div className="card-level-1 p-3" style={{minHeight:180}}>
            <div className="text-xs font-medium text-[var(--text-primary)] mb-3">整改时效排行</div>
            <div className="space-y-2">
              {rectRank.map((r,i)=>{
                const maxCnt=rectRank.reduce((a,b)=>a+b.count,0)
                return (<div key={r.name}>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-4 text-[var(--text-muted)]">{i+1}</span>
                    <span className="flex-1 text-[var(--text-secondary)] truncate">{r.name}</span>
                    <span className="text-[var(--text-primary)] font-medium">{r.avgTime}</span>
                    <span className="text-[var(--text-muted)]">{r.count}单</span>
                  </div>
                  <div className="ml-6 mt-0.5 h-2 rounded flex overflow-hidden">
                    <div style={{width:`${r.count/maxCnt*200}%`,background:'#10B981',opacity:0.5}}/>
                  </div>
                </div>)
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══ 巡检报告 ═══ */

export const InspectionStoreReport: React.FC = () => {
  const [modeTab,setModeTab]=useState('全部')
  const [storeFilter,setStoreFilter]=useState('全部')
  const [page,setPage]=useState(1);const ps=10

  const stores=['IFS国金中心','太平街店','德思勤店','悦方ID店','梅溪湖步步高店','开福万达店','湖滨银泰店','广州天河城店','深圳万象天地','成都太古里店','南京新街口店','重庆解放碑店']
  const modes=['实时巡检','组合巡检','流程巡检','临时抽检']

  const reports=Array.from({length:48},(_,i)=>{
    const store=stores[i%stores.length]
    const mode=modes[i%4]
    return {
      id:`RPT${String(i+1).padStart(3,'0')}`,
      store,mode,
      period:`2026-05-${10+Math.floor(i/12)}`,
      score:60+Math.floor(Math.random()*40),
      items:5+Math.floor(Math.random()*10),
      passed:3+Math.floor(Math.random()*8),
      failed:Math.floor(Math.random()*3),
      deducted:(Math.floor(Math.random()*5))*5,
      cameras:3+Math.floor(Math.random()*12),
      level:['优秀','良好','合格','待改进'][Math.floor(Math.random()*4)],
    }
  })

  let filtered=reports.filter(r=>{
    if(modeTab!=='全部'&&r.mode!==modeTab)return false
    if(storeFilter!=='全部'&&r.store!==storeFilter)return false
    return true
  })

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <div className="shrink-0 space-y-3">
        <div><h2 className="text-base font-semibold text-[var(--text-primary)]">门店巡检报告</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">每门店·每周期巡检报告 · 支持全部/实时/组合/流程/临时抽检查看 · 共{filtered.length}份</p></div>
        <Tabs activeKey={modeTab} onChange={v=>{setModeTab(v);setPage(1)}} size="small"
          items={[{key:'全部',label:'全部'},...modes.map(m=>({key:m,label:m}))]}/>
        <div className="flex items-center gap-3">
          <Select size="middle" value={storeFilter} onChange={v=>{setStoreFilter(v);setPage(1)}} style={{width:140}}
            options={[{value:'全部',label:'全部门店'},...stores.map(s=>({value:s,label:s}))]}/>
          <Input size="middle" prefix={<Search className="w-3 h-3"/>} placeholder="搜索门店..." style={{width:160}}/>
          <div className="flex-1"/>
          <Button size="middle" type="primary" icon={<Plus className="w-3.5 h-3.5"/>}>导出报告</Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto mt-2">
        <div className="card-level-1 overflow-hidden" style={{padding:0}}>
          <table className="w-full text-xs">
            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] sticky top-0"><tr>
              <th className="px-4 py-2.5 text-left">门店</th><th className="px-3 py-2.5 text-left">巡检周期</th>
              <th className="px-3 py-2.5 text-left">巡检模式</th><th className="px-3 py-2.5 text-center">巡检项</th>
              <th className="px-3 py-2.5 text-center">通过</th><th className="px-3 py-2.5 text-center">未通过</th><th className="px-3 py-2.5 text-center">扣分</th>
              <th className="px-3 py-2.5 text-center">得分</th><th className="px-3 py-2.5 text-center">等级</th>
              <th className="px-3 py-2.5 text-center">摄像头</th><th className="px-3 py-2.5 text-center">操作</th>
            </tr></thead>
            <tbody>
              {filtered.slice((page-1)*ps,page*ps).map(r=>{
                const lvlColor=r.level==='优秀'?'green':r.level==='良好'?'blue':r.level==='合格'?'orange':'red'
                return (<tr key={r.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                  <td className="px-4 py-2.5 font-medium text-[var(--text-primary)]">{r.store}</td>
                  <td className="px-3 py-2.5 text-[var(--text-secondary)]">{r.period}</td>
                  <td className="px-3 py-2.5"><Tag color="blue" style={{fontSize:12}}>{r.mode}</Tag></td>
                  <td className="px-3 py-2.5 text-center text-[var(--text-secondary)]">{r.items}</td>
                  <td className="px-3 py-2.5 text-center text-emerald-400">{r.passed}</td>
                  <td className="px-3 py-2.5 text-center text-red-400">{r.failed}</td>
                  <td className="px-3 py-2.5 text-center text-red-400">-{r.deducted}</td>
                  <td className="px-3 py-2.5 text-center"><span className="font-medium" style={{color:r.score>=80?'#10B981':r.score>=60?'#F59E0B':'#EF4444'}}>{r.score}</span></td>
                  <td className="px-3 py-2.5 text-center"><Tag color={lvlColor} style={{fontSize:12}}>{r.level}</Tag></td>
                  <td className="px-3 py-2.5 text-center text-[var(--text-muted)]">{r.cameras}</td>
                  <td className="px-3 py-2.5 text-center"><Button size="small" type="link" style={{fontSize:12}}>查看</Button></td>
                </tr>)
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="shrink-0 flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
        <span className="text-[10px] text-[var(--text-muted)]">共 {filtered.length} 份报告，第 {page}/{Math.ceil(filtered.length/ps)} 页</span>
        <Pagination current={page} pageSize={ps} total={filtered.length} onChange={setPage} size="small" showSizeChanger={false}/>
      </div>
    </div>
  )
}

const dimIcons:Record<string,React.ReactNode> = { '门店维度':<Store className="w-3.5 h-3.5"/>, '大区维度':<MapPin className="w-3.5 h-3.5"/>, '企业维度':<Building2 className="w-3.5 h-3.5"/> }

function genProblems(store:string) {
  const items = [
    { item:'后厨地面油污未及时清理', category:'环境卫生', severity:'轻微', deadline:'当日整改', status:'已整改', assignee:'张师傅' },
    { item:'冷藏柜温度显示异常', category:'设备管理', severity:'告警', deadline:'2小时内', status:'已整改', assignee:'李主管' },
    { item:'食材标签缺少进货日期', category:'食材管理', severity:'轻微', deadline:'当日整改', status:'已整改', assignee:'王厨' },
    { item:'消毒记录填写不完整', category:'卫生消毒', severity:'轻微', deadline:'当日整改', status:'待整改', assignee:'赵领班' },
    { item:'灭火器检查日期已过期', category:'消防安全', severity:'紧急', deadline:'立即整改', status:'已整改', assignee:'刘安全员' },
    { item:'员工健康证即将到期', category:'人员管理', severity:'告警', deadline:'本周内', status:'待整改', assignee:'陈人事' },
    { item:'食品留样量不足125g', category:'食安规范', severity:'轻微', deadline:'次日整改', status:'待整改', assignee:'李主厨' },
    { item:'垃圾桶未加盖密封', category:'环境卫生', severity:'轻微', deadline:'当日整改', status:'已整改', assignee:'张师傅' },
  ]
  const count = 3 + Math.floor(Math.random() * 5)
  return items.slice(0, count).map((p,i) => ({ ...p, id: 'P'+(i+1), store }))
}

function genRectifications() {
  return [
    { title:'建立后厨清洁排班制度', detail:'制定每日清洁排班表，明确各区域责任人，下班前由值班经理检查签字确认。', priority:'高', timeline:'本周内完成' },
    { title:'冷藏设备温度自动监控', detail:'为所有冷藏设备安装温度传感器并接入IoT平台，温度异常自动告警并推送至店长手机。', priority:'高', timeline:'本月内完成' },
    { title:'食材标签标准化培训', detail:'组织后厨全员进行食材标签规范填写培训，统一标签模板，进货后2小时内完成标签张贴。', priority:'中', timeline:'两周内完成' },
    { title:'电子消毒记录系统上线', detail:'引入电子消毒记录系统替代纸质表格，确保每班次按时填写，系统自动校验完整性。', priority:'中', timeline:'本月内完成' },
  ]
}

function genNextPlan() {
  return [
    { task:'全面排查消防设施有效性', scope:'全店', assignee:'刘安全员', deadline:'2026-05-28', type:'专项检查' },
    { task:'员工食安知识闭卷考试', scope:'全店员工', assignee:'陈人事', deadline:'2026-06-01', type:'培训考核' },
    { task:'供应商资质证件核验更新', scope:'全部供应商', assignee:'采购部', deadline:'2026-06-05', type:'资质审查' },
    { task:'月度虫鼠害消杀作业安排', scope:'后厨+仓库', assignee:'外包消杀', deadline:'2026-06-10', type:'例行作业' },
    { task:'新菜单品项食安风险评估', scope:'新品', assignee:'李主厨', deadline:'2026-06-15', type:'风险评估' },
  ]
}

function ScoreBar({ value, label, color }: { value: number, label: string, color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[var(--text-muted)] w-12 shrink-0">{label}</span>
      <div className="flex-1 h-3 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: value+'%', background: color }}/>
      </div>
      <span className="text-[10px] font-medium text-[var(--text-primary)] w-8 text-right">{value}%</span>
    </div>
  )
}

export const InspectionFoodSafety: React.FC = () => {
  const [page,setPage]=useState(1);const [storeFilter,setStoreFilter]=useState('全部')
  const [dimension,setDimension]=useState('门店维度')
  const [ledgerTab,setLedgerTab]=useState('日台账')
  const [viewDetail,setViewDetail]=useState<any>(null)

  const stores=['IFS国金中心','太平街店','德思勤店','梅溪湖步步高店','湖滨银泰店','广州天河城店','深圳万象天地','成都太古里店']
  const regions=['华中大区','华南大区','华东大区','西南大区']

  const ledgerTypes = ['日台账','周台账','月台账']
  
  const reports = (() => {
    if (dimension === '门店维度') {
      return Array.from({length:24},(_,i)=>{
        const store=stores[i%stores.length]
        const t=ledgerTypes[i%3]
        const months=['2026-05','2026-04','2026-03'];const month=months[Math.floor(i/8)]
        return {
          id:'RPT'+String(i+1).padStart(3,'0'),store,region:regions[i%4],type:t,month,
          date:month+'-'+String(10+Math.floor(i/3)),score:72+Math.floor(Math.random()*26),
          items:15+Math.floor(Math.random()*10),passed:12+Math.floor(Math.random()*8),
          issues:Math.floor(Math.random()*5),rectified:Math.floor(Math.random()*4),
          status:['已归档','已归档','已导签','已归档'][i%4],
          inspector:['张拓','李建','陈静'][i%3],format:t==='月台账'?'PDF':'Excel',
        }
      })
    } else if (dimension === '大区维度') {
      return regions.flatMap((region,j)=>{
        const types=ledgerTypes
        return types.map((t,k)=>{
          const idx=j*3+k
          return {
            id:'REG'+String(idx+1).padStart(3,'0'),store:region+'汇总',region,type:t,
            month:'2026-05',date:'2026-05-'+String(15+k),
            score:70+Math.floor(Math.random()*28),items:40+Math.floor(Math.random()*30),
            passed:35+Math.floor(Math.random()*20),issues:Math.floor(Math.random()*8)+1,
            rectified:Math.floor(Math.random()*5),status:'已归档',
            inspector:['陈静','李建','张拓'][j%3],format:t==='月台账'?'PDF':'Excel',
          }
        })
      })
    } else {
      return ledgerTypes.map((t,k)=>({
        id:'ENT'+String(k+1).padStart(3,'0'),store:'全品牌8店汇总',region:'企业',type:t,
        month:'2026-05',date:'2026-05-'+String(20+k),
        score:75+Math.floor(Math.random()*18),items:80+Math.floor(Math.random()*40),
        passed:70+Math.floor(Math.random()*30),issues:Math.floor(Math.random()*12)+3,
        rectified:Math.floor(Math.random()*8)+2,status:'已归档',
        inspector:'张拓',format:t==='月台账'?'PDF':'Excel',
      }))
    }
  })()

  let filtered = reports.filter(r => {
    if (storeFilter !== '全部') {
      if (dimension === '门店维度' && r.store !== storeFilter) return false
      if (dimension === '大区维度' && r.region !== storeFilter) return false
    }
    if (r.type !== ledgerTab) return false
    return true
  })
  const ps = 12

  // ═══ REPORT DETAIL VIEW ═══
  if (viewDetail) {
    const r = viewDetail
    const problems = genProblems(r.store)
    const rectifications = genRectifications()
    const nextPlan = genNextPlan()
    return (
      <div className="p-6 h-full flex flex-col overflow-hidden">
        <div className="shrink-0 flex items-center gap-2 mb-4">
          <Button size="small" type="text" icon={<ArrowLeft className="w-3.5 h-3.5"/>} onClick={() => setViewDetail(null)} style={{fontSize:12}}>返回列表</Button>
          <span className="text-[var(--text-muted)] text-xs"><ChevronRight className="w-3 h-3 inline"/> {r.store} · {r.type}</span>
        </div>

        {/* period overview */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="card-level-1 p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4"/>本周期概况</h3>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label:'综合评分', value:r.score+'分', color:r.score>=90?'#10B981':r.score>=75?'#F59E0B':'#EF4444', icon:'⭐' },
                { label:'巡检项', value:r.items+'项', color:'#3B82F6', icon:'📋' },
                { label:'发现问题', value:r.issues+'个', color:r.issues>3?'#EF4444':'#F59E0B', icon:'🔍' },
                { label:'整改闭环率', value:Math.round(r.rectified/Math.max(r.issues,1)*100)+'%', color:'#10B981', icon:'✅' },
              ].map((c,i) => (
                <div key={i} className="bg-[var(--bg-tertiary)] rounded-lg p-3 text-center">
                  <div className="text-xs text-[var(--text-muted)] mb-1">{c.label}</div>
                  <div className="text-lg font-bold" style={{color:c.color}}>{c.value}</div>
                </div>
              ))}
            </div>
            {/* score breakdown bars */}
            <div className="space-y-2">
              <ScoreBar value={r.score} label="总分" color="#3B82F6"/>
              <ScoreBar value={Math.round(r.passed/Math.max(r.items,1)*100)} label="通过率" color="#10B981"/>
              <ScoreBar value={Math.round(r.rectified/Math.max(r.issues,1)*100)} label="整改率" color="#10B981"/>
              <ScoreBar value={Math.round(r.issues/Math.max(r.items,1)*100)} label="问题率" color="#EF4444"/>
            </div>
          </div>

          {/* problem distribution chart */}
          <div className="card-level-1 p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4"/>问题分类分布</h3>
            <div className="space-y-2">
              {[
                { cat:'环境卫生', count:3, color:'#EF4444' },
                { cat:'设备管理', count:2, color:'#F59E0B' },
                { cat:'食材管理', count:2, color:'#3B82F6' },
                { cat:'卫生消毒', count:1, color:'#10B981' },
                { cat:'消防安全', count:1, color:'#8B5CF6' },
                { cat:'人员管理', count:1, color:'#EC4899' },
              ].map((c,i) => {
                const pct = Math.round(c.count / 10 * 100)
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--text-secondary)] w-16 shrink-0">{c.cat}</span>
                    <div className="flex-1 h-4 bg-[var(--bg-tertiary)] rounded-sm overflow-hidden">
                      <div className="h-full rounded-sm flex items-center justify-end pr-1 text-[9px] text-white font-medium" style={{ width: pct+'%', background: c.color }}>{c.count}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* problem list */}
          <div className="card-level-1 p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/>问题清单</h3>
            <div className="overflow-hidden" style={{padding:0}}>
              <table className="w-full text-xs">
                <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)]">
                  <tr>
                    <th className="px-3 py-2 text-left">问题项</th><th className="px-3 py-2 text-left">分类</th>
                    <th className="px-3 py-2 text-center">严重程度</th><th className="px-3 py-2 text-left">整改期限</th>
                    <th className="px-3 py-2 text-center">状态</th><th className="px-3 py-2 text-left">负责人</th>
                  </tr>
                </thead>
                <tbody>
                  {problems.map(p => {
                    const sevColor = p.severity === '紧急' ? 'red' : p.severity === '告警' ? 'orange' : 'blue'
                    return (
                      <tr key={p.id} className="border-b border-[var(--border-subtle)]">
                        <td className="px-3 py-2 text-[var(--text-primary)]">{p.item}</td>
                        <td className="px-3 py-2"><Tag style={{fontSize:11}}>{p.category}</Tag></td>
                        <td className="px-3 py-2 text-center"><Tag color={sevColor} style={{fontSize:11}}>{p.severity}</Tag></td>
                        <td className="px-3 py-2 text-[var(--text-secondary)]">{p.deadline}</td>
                        <td className="px-3 py-2 text-center"><Tag color={p.status==='已整改'?'green':'orange'} style={{fontSize:11}}>{p.status}</Tag></td>
                        <td className="px-3 py-2 text-[var(--text-secondary)]">{p.assignee}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-2">共 {problems.length} 项问题，{problems.filter(p=>p.status==='已整改').length} 项已整改</div>
          </div>

          {/* rectification suggestions */}
          <div className="card-level-1 p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><ClipboardList className="w-4 h-4"/>整改意见</h3>
            <div className="space-y-3">
              {rectifications.map((rc,i) => (
                <div key={i} className="bg-[var(--bg-tertiary)] rounded-lg p-3 border-l-[3px]" style={{borderLeftColor: rc.priority==='高'?'#EF4444':'#F59E0B'}}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-[var(--text-primary)]">{rc.title}</span>
                    <Tag color={rc.priority==='高'?'red':'orange'} style={{fontSize:10}}>{rc.priority}优</Tag>
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed mb-1.5">{rc.detail}</p>
                  <span className="text-[9px] text-[var(--text-muted)]">⏱ {rc.timeline}</span>
                </div>
              ))}
            </div>
          </div>

          {/* next period plan */}
          <div className="card-level-1 p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><Calendar className="w-4 h-4"/>下周期工作计划</h3>
            <div className="overflow-hidden" style={{padding:0}}>
              <table className="w-full text-xs">
                <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)]">
                  <tr>
                    <th className="px-3 py-2 text-left">任务</th><th className="px-3 py-2 text-left">范围</th>
                    <th className="px-3 py-2 text-left">负责人</th><th className="px-3 py-2 text-left">截止日期</th>
                    <th className="px-3 py-2 text-center">类型</th>
                  </tr>
                </thead>
                <tbody>
                  {nextPlan.map((n,i) => (
                    <tr key={i} className="border-b border-[var(--border-subtle)]">
                      <td className="px-3 py-2 text-[var(--text-primary)]">• {n.task}</td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{n.scope}</td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{n.assignee}</td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{n.deadline}</td>
                      <td className="px-3 py-2 text-center"><Tag style={{fontSize:11}}>{n.type}</Tag></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ═══ LIST VIEW ═══
  const filterOptions = dimension === '门店维度'
    ? [{value:'全部',label:'全部门店'}, ...stores.map(s=>({value:s,label:s}))]
    : dimension === '大区维度'
    ? [{value:'全部',label:'全部大区'}, ...regions.map(s=>({value:s,label:s}))]
    : [{value:'全部',label:'企业'}]

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <div className="shrink-0 space-y-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Shield className="w-4 h-4"/>食安合规报告
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">日管控·周排查·月调度合规台账 · 满足市场监管检查标准</p>
        </div>

        {/* dimension tabs */}
        <Tabs activeKey={dimension} onChange={k => { setDimension(k); setStoreFilter('全部'); setPage(1) }} size="small"
          items={['门店维度','大区维度','企业维度'].map(d => ({
            key: d, label: <span className="flex items-center gap-1">{dimIcons[d]}{d}</span>
          }))}
        />

        {/* ledger tabs + filter */}
        <div className="flex items-center gap-3">
          <Tabs activeKey={ledgerTab} onChange={k => { setLedgerTab(k); setPage(1) }} size="small"
            items={[{key:'日台账',label:'日台账'},{key:'周台账',label:'周台账'},{key:'月台账',label:'月台账'}]}
            style={{marginBottom:0}}
          />
          <Select size="middle" value={storeFilter} onChange={v => { setStoreFilter(v); setPage(1) }} style={{width:140}} options={filterOptions}/>
          <div className="flex-1"/>
          <Button size="middle" icon={<Download className="w-3.5 h-3.5"/>}>批量导出</Button>
        </div>
      </div>

      {/* table */}
      <div className="flex-1 overflow-y-auto mt-2">
        <div className="card-level-1 overflow-hidden" style={{padding:0}}>
          <table className="w-full text-xs">
            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] sticky top-0">
              <tr>
                <th className="px-4 py-2.5 text-left">{dimension==='门店维度'?'门店':dimension==='大区维度'?'大区':'范围'}</th>
                <th className="px-3 py-2.5 text-left">报告类型</th>
                <th className="px-3 py-2.5 text-left">月份</th>
                <th className="px-3 py-2.5 text-left">生成日期</th>
                <th className="px-3 py-2.5 text-center">评分</th>
                <th className="px-3 py-2.5 text-center">巡检项</th>
                <th className="px-3 py-2.5 text-left">审查人</th>
                <th className="px-3 py-2.5 text-center">状态</th>
                <th className="px-3 py-2.5 text-left">格式</th>
                <th className="px-3 py-2.5 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice((page-1)*ps, page*ps).map(r => {
                const typeColor = r.type==='日台账'?'blue':r.type==='周台账'?'purple':'green'
                return (
                  <tr key={r.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)] cursor-pointer" onClick={() => setViewDetail(r)}>
                    <td className="px-4 py-2.5 font-medium text-[var(--text-primary)]">{r.store}</td>
                    <td className="px-3 py-2.5"><Tag color={typeColor} style={{fontSize:12}}>{r.type}</Tag></td>
                    <td className="px-3 py-2.5 text-[var(--text-secondary)]">{r.month}</td>
                    <td className="px-3 py-2.5 text-[var(--text-secondary)]">{r.date}</td>
                    <td className="px-3 py-2.5 text-center"><span className="font-medium" style={{color:r.score>=90?'#10B981':'#F59E0B'}}>{r.score}</span></td>
                    <td className="px-3 py-2.5 text-center text-[var(--text-secondary)]">{r.items}项</td>
                    <td className="px-3 py-2.5 text-[var(--text-secondary)]">{r.inspector}</td>
                    <td className="px-3 py-2.5 text-center"><Tag color={r.status==='已归档'?'green':'orange'} style={{fontSize:12}}>{r.status}</Tag></td>
                    <td className="px-3 py-2.5 text-[var(--text-secondary)]">{r.format}</td>
                    <td className="px-3 py-2.5 text-center">
                      <Button size="small" type="link" style={{fontSize:12}} onClick={e => { e.stopPropagation(); setViewDetail(r) }}>查看报告</Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
        <span className="text-[10px] text-[var(--text-muted)]">共 {filtered.length} 份 {dimension}{ledgerTab}</span>
        <Pagination current={page} pageSize={ps} total={filtered.length} onChange={setPage} size="small" showSizeChanger={false}/>
      </div>
    </div>
  )
}

export const InspectionDataExport: React.FC = () => (<div className="p-6 space-y-4 overflow-y-auto h-full"><div><h2 className="text-base font-semibold text-[var(--text-primary)]">数据导出</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">巡检/违规/整改数据批量导出</p></div><div className="card-level-1 p-4 space-y-3"><div className="flex items-center gap-2"><Checkbox/><span className="text-xs">巡检数据</span></div><div className="flex items-center gap-2"><Checkbox/><span className="text-xs">违规记录</span></div><div className="flex items-center gap-2"><Checkbox/><span className="text-xs">整改数据</span></div><Button size="small" type="primary" icon={<Download className="w-3 h-3"/>} block>导出 Excel</Button></div></div>)
