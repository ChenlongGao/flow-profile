import React, { useState } from 'react'
import { Shield, Camera, UserCheck, AlertTriangle, ClipboardCheck, Thermometer, Archive, Plus, Search, Store, Clock, FileText, BarChart3, TrendingUp, Download, Eye } from 'lucide-react'
import { Tabs, Tag, Button, Input, Select, Pagination, message, Drawer, Progress } from 'antd'

const STORES = ['IFS国金中心','太平街店','德思勤店','悦方ID店','梅溪湖步步高店','开福万达店','湖滨银泰店','广州天河城店','深圳万象天地','成都太古里店','南京新街口店','重庆解放碑店','青岛万象城店','西安钟楼店','武汉江汉路旗舰店','雨花亭店']
const PERIODS = ['班前自查','班中自查','班后自查']

const CATEGORIES = [
  {key:'personnel', label:'人员合规', icon:UserCheck, color:'#3B82F6', items:['健康证有效期核查','穿戴规范检查','岗前晨检记录','手部清洗消毒确认']},
  {key:'environment', label:'环境合规', icon:Store, color:'#10B981', items:['操作区卫生清洁','仓储区域整洁规范','垃圾分类投放','消杀落实记录核查']},
  {key:'material', label:'物料合规', icon:Archive, color:'#8B5CF6', items:['食材保质期抽查','索证索票核验','进货查验记录','冷链温度记录核查']},
  {key:'equipment', label:'设备合规', icon:Thermometer, color:'#F59E0B', items:['消毒柜运行状态','冷藏冷冻设备温度','加工设备运行状态','设备维护记录']},
  {key:'operation', label:'操作合规', icon:ClipboardCheck, color:'#EC4899', items:['食品生熟分开执行','留样规范核查','添加剂使用合规','加工流程规范']},
]

const genDaily = () => {
  const res: any[] = []
  for (let i = 0; i < 30; i++) {
    const store = STORES[i % STORES.length]
    const period = PERIODS[i % 3]
    const total = 20; const passed = 16 + (i % 5); const failed = total - passed
    res.push({
      id:'FS'+String(i+1).padStart(3,'0'),store,period,date:'2026-05-'+(15+Math.floor(i/3)),
      location:i%3===0?'门店':i%3===1?'车间':'仓库',totalItems:total,passedItems:passed,failedItems:failed,
      score:Math.round(passed/total*100),photos:1+Math.floor(Math.random()*5),
      signee:['张拓','李建','王鹏','陈静'][i%4],status:i%5===0?'待签字':'已归档',
      hasIssue:failed>0,issues:failed>0?['发现违规项']:[],
    })
  }
  return res
}
const genWeekly = () => {
  const res: any[] = []
  for (let i = 0; i < 16; i++) {
    const store = STORES[i]
    const riskLevels = ['一般','较大','重大','一般','一般']
    const statuses = ['整改中','已完成','复查中','已完成','逾期']
    res.push({
      id:'WK'+String(i+1).padStart(3,'0'),store,week:'第'+(3+Math.floor(i/4))+'周',
      date:'2026-05-'+(18+i),inspector:['陈静','刘洋','赵敏'][i%3],
      riskLevel:riskLevels[i%5],issueCount:1+Math.floor(Math.random()*8),
      status:statuses[i%5],rectifier:['张师傅','李建','王鹏'][i%3],
      deadline:'2026-05-'+(20+i),closed:statuses[i%5]==='已完成',
      area:['后厨','仓库','前厅','外卖区'][i%4],
      items:[
        {name:'健康证有效期核查',passed:true},{name:'冷链温度记录核查',passed:i%3!==0},
        {name:'消杀落实记录',passed:true},{name:'食材保质期抽查',passed:i%4!==0},
        {name:'食品生熟分开',passed:true},{name:'留样规范核查',passed:true},
        {name:'加工设备运行状态',passed:i%2!==0},{name:'索证索票核验',passed:true},
      ],
    })
  }
  return res
}

const DAILY = genDaily()
const WEEKLY = genWeekly()

const dailyStats = {
  totalDays:30,completedDays:28,rate:93.3,totalIssues:45,
  highRisk:8,midRisk:20,lowRisk:17,
  rectified:42,pending:3,rectifyRate:93.3,
}

const monthStats = {
  month:'2026年5月',totalChecks:28,avgScore:88,
  completedRate:93.3,issueTotal:45,
  topIssues:[
    {name:'健康证临期',count:12},
    {name:'冷链温度超标',count:8},
    {name:'消杀记录缺失',count:6},
  ],
  riskStores:[
    {name:'IFS国金中心',score:78},
    {name:'德思勤店',score:82},
    {name:'开福万达店',score:85},
  ],
  nextPlan:['冷链设备全面检修','人员健康证集中换证','消杀流程专项培训'],
}

export const FoodSafetyInspection: React.FC = () => {
  const [mainTab,setMainTab]=useState('daily')
  const [periodTab,setPeriodTab]=useState('全部')
  const [storeFilter,setStoreFilter]=useState('全部')
  const [search,setSearch]=useState('')
  const [page,setPage]=useState(1);const ps=12
  const [detailItem,setDetailItem]=useState<any>(null)
  const [catTab,setCatTab]=useState('personnel')

  let dailyFiltered = DAILY.filter(r=>{
    if(periodTab!=='全部'&&r.period!==periodTab)return false
    if(storeFilter!=='全部'&&r.store!==storeFilter)return false
    if(search&&!r.store.includes(search))return false
    return true
  })

  const cat=CATEGORIES.find(c=>c.key===catTab); const CatIcon=cat?.icon

  return (
    <div className="p-4 h-full flex flex-col overflow-hidden">
      <div className="shrink-0 space-y-3">
        <div><h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-400"/>食安巡检</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">日管控 · 周排查 · 月调度 · 三级食安管控体系 · 合规迎检档案</p></div>
        <Tabs activeKey={mainTab} onChange={v=>{setMainTab(v);setPage(1)}} size="small"
          items={[
            {key:'daily',label:<span className="flex items-center gap-1.5"><ClipboardCheck className="w-3 h-3"/>日管控（自查）</span>},
            {key:'weekly',label:<span className="flex items-center gap-1.5"><Search className="w-3 h-3"/>周排查（督查）</span>},
            {key:'monthly',label:<span className="flex items-center gap-1.5"><BarChart3 className="w-3 h-3"/>月调度</span>},
          ]}/>
        {mainTab==='daily'&&(<>
          <Tabs activeKey={periodTab} onChange={v=>{setPeriodTab(v);setPage(1)}} size="small"
            items={[{key:'全部',label:'全部'},...PERIODS.map(p=>({key:p,label:p}))]}/>
          <div className="flex items-center gap-3 flex-wrap">
            <Input size="middle" prefix={<Search className="w-3 h-3"/>} value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="搜索门店..." style={{width:160}} allowClear/>
            <Select size="middle" value={storeFilter} onChange={v=>{setStoreFilter(v);setPage(1)}} style={{width:140}} options={[{value:'全部',label:'全部门店'},...STORES.map(s=>({value:s,label:s}))]}/>
            <div className="flex-1"/>
            <Button size="middle" type="primary" danger icon={<Plus className="w-3.5 h-3.5"/>}>新建自查单</Button>
          </div>
        </>)}
        {mainTab==='weekly'&&(
          <div className="flex items-center gap-3 flex-wrap">
            <Input size="middle" prefix={<Search className="w-3 h-3"/>} placeholder="搜索门店/排查人..." style={{width:180}} allowClear/>
            <Select size="middle" defaultValue="全部" style={{width:140}} options={[{value:'全部',label:'全部门店'},...STORES.map(s=>({value:s,label:s}))]}/>
            <div className="flex-1"/>
            <Button size="middle" type="primary" icon={<Plus className="w-3.5 h-3.5"/>}>新建排查</Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto mt-3">
        {/* === 日管控 === */}
        {mainTab==='daily'&&(
          <div className="card-level-1 overflow-hidden" style={{padding:0}}>
            <table className="w-full text-xs"><thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] sticky top-0"><tr>
              <th className="px-4 py-2.5 text-left">门店</th><th className="px-3 py-2.5 text-left">点位</th><th className="px-3 py-2.5 text-left">日期</th>
              <th className="px-3 py-2.5 text-center">时段</th><th className="px-3 py-2.5 text-center">巡检项</th><th className="px-3 py-2.5 text-center">通过</th>
              <th className="px-3 py-2.5 text-center">未通过</th><th className="px-3 py-2.5 text-center">得分</th><th className="px-3 py-2.5 text-center">拍照</th>
              <th className="px-3 py-2.5 text-left">签字人</th><th className="px-3 py-2.5 text-center">状态</th><th className="px-3 py-2.5 text-center">操作</th>
            </tr></thead><tbody>{dailyFiltered.slice((page-1)*ps,page*ps).map(r=>(
              <tr key={r.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                <td className="px-4 py-2.5 font-medium text-[var(--text-primary)]">{r.store}</td><td className="px-3 py-2.5 text-[var(--text-secondary)]">{r.location}</td>
                <td className="px-3 py-2.5 text-[var(--text-secondary)]">{r.date}</td><td className="px-3 py-2.5 text-center"><Tag color="blue" style={{fontSize:12}}>{r.period}</Tag></td>
                <td className="px-3 py-2.5 text-center text-[var(--text-secondary)]">{r.totalItems}</td><td className="px-3 py-2.5 text-center text-emerald-400">{r.passedItems}</td>
                <td className="px-3 py-2.5 text-center text-red-400">{r.failedItems}</td>
                <td className="px-3 py-2.5 text-center"><span className="font-medium" style={{color:r.score>=90?'#10B981':'#F59E0B'}}>{r.score}</span></td>
                <td className="px-3 py-2.5 text-center text-[var(--text-secondary)]">{r.photos}张</td>
                <td className="px-3 py-2.5 text-[var(--text-secondary)]">{r.signee}</td>
                <td className="px-3 py-2.5 text-center"><Tag color={r.status==='已归档'?'green':'orange'} style={{fontSize:12}}>{r.status}</Tag></td>
                <td className="px-3 py-2.5 text-center"><Button size="small" type="link" style={{fontSize:12}} onClick={()=>setDetailItem(r)}>详情</Button></td>
              </tr>))}</tbody></table>
          </div>
        )}

        {/* === 周排查 === */}
        {mainTab==='weekly'&&(
          <div className="card-level-1 overflow-hidden" style={{padding:0}}>
            <table className="w-full text-xs"><thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] sticky top-0"><tr>
              <th className="px-4 py-2.5 text-left">门店</th><th className="px-3 py-2.5 text-left">排查区域</th><th className="px-3 py-2.5 text-left">排查周期</th>
              <th className="px-3 py-2.5 text-left">排查日期</th><th className="px-3 py-2.5 text-left">排查人</th><th className="px-3 py-2.5 text-center">隐患等级</th>
              <th className="px-3 py-2.5 text-center">问题数</th><th className="px-3 py-2.5 text-center">状态</th><th className="px-3 py-2.5 text-left">整改人</th>
              <th className="px-3 py-2.5 text-left">截止日期</th><th className="px-3 py-2.5 text-center">操作</th>
            </tr></thead><tbody>{WEEKLY.slice(0,ps).map(w=>{
              const riskColor=w.riskLevel==='重大'?'red':w.riskLevel==='较大'?'orange':'blue'
              const statusColor=w.status==='已完成'?'green':w.status==='逾期'?'red':w.status==='复查中'?'blue':'orange'
              return (<tr key={w.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                <td className="px-4 py-2.5 font-medium text-[var(--text-primary)]">{w.store}</td><td className="px-3 py-2.5 text-[var(--text-secondary)]">{w.area}</td>
                <td className="px-3 py-2.5 text-[var(--text-secondary)]">{w.week}</td><td className="px-3 py-2.5 text-[var(--text-secondary)]">{w.date}</td>
                <td className="px-3 py-2.5 text-[var(--text-secondary)]">{w.inspector}</td>
                <td className="px-3 py-2.5 text-center"><Tag color={riskColor} style={{fontSize:12}}>{w.riskLevel}</Tag></td>
                <td className="px-3 py-2.5 text-center text-[var(--text-secondary)]">{w.issueCount}个</td>
                <td className="px-3 py-2.5 text-center"><Tag color={statusColor} style={{fontSize:12}}>{w.status}</Tag></td>
                <td className="px-3 py-2.5 text-[var(--text-secondary)]">{w.rectifier}</td>
                <td className="px-3 py-2.5 text-[var(--text-secondary)]">{w.deadline}</td>
                <td className="px-3 py-2.5 text-center"><Button size="small" type="link" style={{fontSize:12}} onClick={()=>setDetailItem(w)}>详情</Button></td>
              </tr>)
            })}</tbody></table>
          </div>
        )}

        {/* === 月调度 === */}
        {mainTab==='monthly'&&(
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="card-level-1 p-3"><div className="text-[10px] text-[var(--text-muted)]">月自查天数</div><div className="text-xl font-bold" style={{color:'#3B82F6'}}>{dailyStats.completedDays}<span className="text-xs text-[var(--text-muted)]">/{dailyStats.totalDays}天</span></div></div>
              <div className="card-level-1 p-3"><div className="text-[10px] text-[var(--text-muted)]">完成率</div><div className="text-xl font-bold text-emerald-400">{dailyStats.rate}%</div></div>
              <div className="card-level-1 p-3"><div className="text-[10px] text-[var(--text-muted)]">月发现问题</div><div className="text-xl font-bold text-amber-400">{dailyStats.totalIssues}<span className="text-xs text-[var(--text-muted)]">个</span></div></div>
              <div className="card-level-1 p-3"><div className="text-[10px] text-[var(--text-muted)]">整改完成率</div><div className="text-xl font-bold text-emerald-400">{dailyStats.rectifyRate}%</div></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="card-level-1 p-3" style={{minHeight:200}}>
                <div className="text-xs font-medium text-[var(--text-primary)] mb-3">高频问题TOP3</div>
                {monthStats.topIssues.map((t,i)=>(
                  <div key={t.name} className="flex items-center gap-2 text-[11px] mb-2">
                    <span className="w-4 text-[var(--text-muted)]">{i+1}</span><span className="flex-1 text-[var(--text-secondary)]">{t.name}</span>
                    <span className="font-medium text-[var(--text-primary)]">{t.count}次</span>
                  </div>
                ))}
              </div>
              <div className="card-level-1 p-3" style={{minHeight:200}}>
                <div className="text-xs font-medium text-[var(--text-primary)] mb-3">风险门店 TOP3</div>
                {monthStats.riskStores.map((s,i)=>(
                  <div key={s.name} className="flex items-center gap-2 text-[11px] mb-2">
                    <span className="w-4 text-[var(--text-muted)]">{i+1}</span><span className="flex-1 text-[var(--text-secondary)]">{s.name}</span>
                    <span className="font-medium" style={{color:s.score>=85?'#10B981':'#F59E0B'}}>{s.score}分</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card-level-1 p-3">
              <div className="text-xs font-medium text-[var(--text-primary)] mb-2">下月重点防控计划</div>
              {monthStats.nextPlan.map((p,i)=><div key={i} className="text-[11px] text-[var(--text-secondary)] mb-1">{i+1}. {p}</div>)}
            </div>
          </div>
        )}

        {/* === 台账&报告 === */}
        {mainTab==='archive'&&(
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="card-level-1 p-4 text-center space-y-2 cursor-pointer hover:border-blue-400" onClick={()=>message.info('导出日管控台账(Excel)')}>
                <FileText className="w-8 h-8 text-blue-400 mx-auto"/><div className="text-sm font-medium text-[var(--text-primary)]">日管控台账</div>
                <div className="text-[10px] text-[var(--text-muted)]">30份 · 自动归档 · Excel/PDF导出</div><Button size="small" icon={<Download className="w-3 h-3"/>}>导出</Button>
              </div>
              <div className="card-level-1 p-4 text-center space-y-2 cursor-pointer hover:border-blue-400" onClick={()=>message.info('导出周排查台账(Excel)')}>
                <ClipboardCheck className="w-8 h-8 text-purple-400 mx-auto"/><div className="text-sm font-medium text-[var(--text-primary)]">周排查台账</div>
                <div className="text-[10px] text-[var(--text-muted)]">4周 · 闭环轨迹 · 全程溯源</div><Button size="small" icon={<Download className="w-3 h-3"/>}>导出</Button>
              </div>
              <div className="card-level-1 p-4 text-center space-y-2 cursor-pointer hover:border-blue-400" onClick={()=>message.info('导出月度合规报告(PDF)')}>
                <BarChart3 className="w-8 h-8 text-emerald-400 mx-auto"/><div className="text-sm font-medium text-[var(--text-primary)]">月度合规报告</div>
                <div className="text-[10px] text-[var(--text-muted)]">2026年5月 · 迎检专用 · PDF格式</div><Button size="small" icon={<Download className="w-3 h-3"/>}>导出</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {(mainTab==='daily'||mainTab==='weekly')&&(
        <div className="shrink-0 flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
          <span className="text-[10px] text-[var(--text-muted)]">共 {mainTab==='daily'?dailyFiltered.length:WEEKLY.length} 条</span>
          <Pagination current={page} pageSize={ps} total={mainTab==='daily'?dailyFiltered.length:WEEKLY.length} onChange={setPage} size="small" showSizeChanger={false}/>
        </div>
      )}

      <Drawer title={detailItem?`${detailItem.store} · ${detailItem.date} ${detailItem.period}`:'详情'} open={!!detailItem} onClose={()=>setDetailItem(null)} width={680}
        styles={{header:{background:'var(--bg-secondary)',borderBottom:'1px solid var(--border-subtle)'},body:{background:'var(--bg-primary)',padding:0}}}>
        {detailItem&&(<div className="flex flex-col h-full"><div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-xs bg-[var(--bg-tertiary)] rounded p-3">
            <div><span className="text-[var(--text-muted)]">点位：</span>{detailItem.location}</div>
            <div><span className="text-[var(--text-muted)]">得分：</span><span className="font-medium" style={{color:detailItem.score>=90?'#10B981':'#F59E0B'}}>{detailItem.score}分</span></div>
            <div><span className="text-[var(--text-muted)]">签字人：</span>{detailItem.signee}</div>
            <div><span className="text-[var(--text-muted)]">通过：</span><span className="text-emerald-400">{detailItem.passedItems}</span></div>
            <div><span className="text-[var(--text-muted)]">未通过：</span><span className="text-red-400">{detailItem.failedItems}</span></div>
            <div><span className="text-[var(--text-muted)]">拍照：</span>{detailItem.photos}张</div>
          </div>
          <Tabs activeKey={catTab} onChange={setCatTab} size="small"
            items={CATEGORIES.map(c=>{const Icon=c.icon;return{key:c.key,label:<span className="flex items-center gap-1.5"><Icon className="w-3 h-3" style={{color:c.color}}/>{c.label}</span>}})}/>
          <div className="space-y-1.5">{cat&&cat.items.map((item,i)=>{
            const passed=(i+detailItem.passedItems)%5<3
            return(<div key={i} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded bg-[var(--bg-tertiary)]">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0" style={{background:cat.color+'15',color:cat.color}}>{i+1}</span>
              <span className="flex-1 text-[var(--text-primary)]">{item}</span>
              <Tag color={passed?'success':'error'} style={{fontSize:12}}>{passed?'通过':'未通过'}</Tag>
            </div>)
          })}</div></div></div>)}
      </Drawer>
    </div>
  )
}
