import React, { useState } from 'react'
import { Activity, Stethoscope, Brain, Zap, FileText, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, MapPin, Cloud, Clock, Timer, BarChart3, MessageSquare, ChevronRight, Search, Users, Target, ClipboardList, CreditCard, Radio, Map, Package, PauseCircle, Tags, Store, Plus, Filter, ArrowLeft } from 'lucide-react'
import { Tag, Button, Tabs, Select, Input, message, Modal, Drawer } from 'antd'

/* ═══ 共享组件 ═══ */
function ModelCard({title,icon,color,children}:{title:string;icon:React.ReactNode;color:string;children:React.ReactNode}) {
  return <div className="card-level-1 overflow-hidden cursor-pointer hover:shadow-md transition-shadow" style={{padding:0}} onClick={function(){message.info('详情页开发中')}}>
    <div className="px-3 py-2 border-b border-[var(--border-subtle)] flex items-center gap-2" style={{background:color+'10'}}><span style={{color}}>{icon}</span><span className="text-xs font-semibold" style={{color}}>{title}</span></div>
    <div style={{height:140}} className="p-3 flex flex-col justify-center">{children}</div></div>
}
function MiniBar({label,value,max,color}:{label:string;value:number;max:number;color:string}) {
  return <div className="space-y-1"><div className="flex justify-between text-[10px]"><span className="text-[var(--text-muted)]">{label}</span><span className="font-medium" style={{color}}>{value}</span></div><div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:(value/max*100)+'%',background:color}}/></div></div>
}
function MetricRow({items}:{items:{label:string;value:string;color?:string;sub?:string}[]}) {
  return <div className="grid gap-2" style={{gridTemplateColumns:'repeat('+items.length+',1fr)'}}>{items.map(function(k,i){return <div key={i} className="bg-[var(--bg-tertiary)] rounded p-2 text-center"><div className="text-[9px] text-[var(--text-muted)]">{k.label}</div><div className="text-xs font-bold mt-0.5" style={{color:k.color||'var(--text-primary)'}}>{k.value}</div>{k.sub&&<div className="text-[8px] text-[var(--text-muted)] mt-0.5">{k.sub}</div>}</div>})}</div>
}
function AiInsight({text}:{text:string}){return <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-2.5 text-[10px] text-[var(--text-secondary)] leading-relaxed mt-2 overflow-hidden" style={{height:54,lineHeight:'18px'}}><span className="line-clamp-3">{text}</span></div>}
function TopBanner({stages}:{stages:{label:string;icon:React.ReactNode;color:string;metrics:string[];status:string}[]}) {
  return <div className="card-level-1 py-5 px-6"><div className="flex items-center justify-between">{stages.map(function(s,i){return <div key={i} className="flex items-center gap-0 flex-1"><div className="flex flex-col items-center text-center shrink-0" style={{minWidth:88}}><div className="w-16 h-16 rounded-full flex items-center justify-center text-xl mb-2" style={{background:s.color+'15',color:s.color}}>{s.icon}</div><span className="text-xs font-bold text-[var(--text-primary)]">{s.label}</span><span className="text-[10px] text-[var(--text-muted)] mt-0.5">{s.status}</span></div><div className="flex-1 px-3"><div className="space-y-1.5">{s.metrics.map(function(m,j){return <div key={j} className="text-[10px] font-medium text-[var(--text-primary)] bg-[var(--bg-tertiary)] rounded px-2.5 py-1.5 text-center">{m}</div>})}</div></div>{i<stages.length-1&&<div className="text-[var(--text-muted)] shrink-0"><ChevronRight className="w-5 h-5"/></div>}</div>})}</div></div>
}
function FullSubCard({label,value,color,insight}:{label:string;value:string;color:string;insight:string}) {
  return <div className="card-level-1 p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow" style={{height:60}} onClick={function(){message.info(label+' 详情页开发中')}}>
    <div className="text-center shrink-0 flex flex-col justify-center" style={{width:'28%',minWidth:72}}><div className="text-base font-bold whitespace-nowrap" style={{color}}>{value}</div><div className="text-[8px] text-[var(--text-muted)] mt-0.5">{label}</div></div>
    <div className="flex-1 text-[10px] text-[var(--text-secondary)] leading-relaxed border-l border-[var(--border-subtle)] pl-3 overflow-hidden" style={{lineHeight:'14px'}}><span className="line-clamp-3">{insight}</span></div>
  </div>
}
function VConnector(){return <div className="flex justify-center py-0.5"><div className="w-0.5 h-3" style={{borderLeft:'2px solid var(--border-subtle)'}}/></div>}
function RiskTable({label,value,color,cols,rows}:{label:string;value:string;color:string;cols:string[];rows:{name:string;val:string;warn?:boolean}[]}) {
  const[expanded,setExpanded]=useState(false);const show=expanded?rows:rows.slice(0,10)
  return <div className="card-level-1 overflow-hidden cursor-pointer hover:shadow-md transition-shadow" style={{padding:0}} onClick={function(){message.info(label+' 详情页开发中')}}>
    <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-secondary)]"><span className="text-xs font-semibold text-[var(--text-primary)]">{label}</span><span className="text-xs font-bold" style={{color}}>{value}</span></div>
    <table className="w-full text-[11px]"><thead><tr className="text-[var(--text-muted)] border-b border-[var(--border-subtle)]">{cols.map(function(c,i){return <td key={i} className="px-4 py-1.5" style={{textAlign:'left'}}>{c}</td>})}</tr></thead>
    <tbody>{show.map(function(r,i){return <tr key={i} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]"><td className="px-4 py-1.5" style={{color:r.warn?'#ef4444':'var(--text-primary)'}}>{r.name}</td><td className="px-4 py-1.5 text-right font-medium" style={{color:r.warn?'#ef4444':'var(--text-primary)'}}>{r.val}</td></tr>})}</tbody></table>
    {rows.length>10&&<div className="px-4 py-2 text-center text-[11px] text-[var(--ai-blue-500)] cursor-pointer hover:bg-[var(--bg-tertiary)]" onClick={function(e:any){e.stopPropagation();setExpanded(!expanded)}}>{expanded?'收起':'查看全部 '+rows.length+' 家'}</div>}
  </div>
}

/* ─── 日诊断 ─── */
function DayTab() {return <div className="space-y-4">
  <TopBanner stages={[{label:'选址拓店',icon:<MapPin className="w-6 h-6"/>,color:'#3B82F6',status:'128店 · 92%兑现',metrics:['商圈客流指数 +3%','竞品动态 0新增','A级商圈占比 68%','客流兑现率 92%']},{label:'客流管店',icon:<TrendingUp className="w-6 h-6"/>,color:'#8B5CF6',status:'日均16.4万人次',metrics:['全品牌客流 16.4万','整体转化率 31%','客单价 ¥28.5','高峰覆盖率 85%']},{label:'巡检治店',icon:<CheckCircle2 className="w-6 h-6"/>,color:'#10B981',status:'均分 86分',metrics:['品牌巡检均分 86','问题 47项·零高风险','即时整改率 89%','员工合规率 94%']}]}/>
  <div className="grid grid-cols-3 gap-3">
  <div className="space-y-0"><ModelCard title="选址拓店模型" icon={<MapPin className="w-3.5 h-3.5"/>} color="#3B82F6"><MetricRow items={[{label:'兑现率',value:'92%',color:'#10B981'},{label:'竞品变化',value:'无',color:'#3B82F6'},{label:'商圈质量',value:'A级68%',color:'#F59E0B'}]}/><AiInsight text="全国128店选址兑现率92%。3km竞品密度均值2.8家/店。68%门店位于A级商圈。"/></ModelCard>
    <VConnector/><FullSubCard label="兑现率趋势" value="92%" color="#3B82F6" insight="近7日客流兑现率从88%稳步提升至92%。12家门店兑现率低于80%需关注，主要集中在成渝区域。"/>
    <VConnector/><FullSubCard label="竞品密度" value="2.8家/店" color="#F59E0B" insight="全国门店3km内竞品均值2.8家。15店竞品超5家需关注。本月暂无新增竞品报告。"/>
    <VConnector/><FullSubCard label="商圈评级" value="A级68%" color="#10B981" insight="68%门店位于A级商圈(↑2pp)。C级商圈7家门店客流兑现率显著偏低，建议纳入优化清单。"/>
    <VConnector/><RiskTable label="风险门店" value="12家" color="#ef4444" cols={['门店','兑现率']} rows={[{name:'成都武侯区店',val:'68%',warn:true},{name:'重庆解放碑店',val:'72%',warn:true},{name:'西安钟楼店',val:'75%'},{name:'武汉光谷店',val:'76%'},{name:'成都金牛店',val:'78%'},{name:'成都青羊店',val:'79%'},{name:'成都锦江店',val:'79%'},{name:'广州天河城店',val:'80%'},{name:'重庆渝北店',val:'80%'},{name:'西安雁塔店',val:'79%'},{name:'西安未央店',val:'78%'},{name:'西安碑林店',val:'80%'}]}/>
  </div>
  <div className="space-y-0"><ModelCard title="客流管店模型" icon={<TrendingUp className="w-3.5 h-3.5"/>} color="#8B5CF6"><MetricRow items={[{label:'全品牌客流',value:'16.4万',color:'#8B5CF6'},{label:'转化率',value:'31%',color:'#10B981'},{label:'客单价',value:'¥28.5',color:'#F59E0B'}]}/><AiInsight text="全品牌日均客流16.4万人次环比持平。转化率31%高于行业均值。午市高峰贡献38%客流。"/></ModelCard>
    <VConnector/><FullSubCard label="区域客流TOP" value="成都2.8万" color="#8B5CF6" insight="成都区域日均客流领跑。北京2.5万、上海2.3万紧随其后。重庆2.1万环比+4%增速最快。"/>
    <VConnector/><FullSubCard label="转化率分布" value="31%" color="#10B981" insight="32%门店转化率超35%(优秀)。23%门店低于25%需优化。转化率与收银速度呈正相关。"/>
    <VConnector/><FullSubCard label="客流趋势" value="+3%" color="#3B82F6" insight="近7日客流从15.8万升至17.1万(周末高峰)。工作日均值15.6万，周末均值16.8万，差距持续收窄。"/>
    <VConnector/><RiskTable label="低客流门店" value="10家" color="#ef4444" cols={['门店','日均客流']} rows={[{name:'西安钟楼店',val:'520',warn:true},{name:'武汉光谷店',val:'580',warn:true},{name:'太原柳巷店',val:'620'},{name:'北京西单店',val:'650'},{name:'南京鼓楼店',val:'680'},{name:'南京夫子庙店',val:'700'},{name:'长沙解放西店',val:'720'},{name:'合肥南屏店',val:'750'},{name:'济南泉城店',val:'760'},{name:'厦门中山路店',val:'780'},{name:'长春南关店',val:'790'},{name:'西安回民街店',val:'790'}]}/>
  </div>
  <div className="space-y-0"><ModelCard title="巡检治店模型" icon={<CheckCircle2 className="w-3.5 h-3.5"/>} color="#10B981"><MetricRow items={[{label:'品牌均分',value:'86分',color:'#10B981'},{label:'问题数',value:'47项',color:'#F59E0B'},{label:'整改率',value:'89%',color:'#10B981'}]}/><AiInsight text="全品牌巡检均分86。问题47项(轻微42/一般5/高风险0)。即时整改率89%。"/></ModelCard>
    <VConnector/><FullSubCard label="问题严重度" value="零高风险" color="#10B981" insight="47项问题中轻微42项(89%)、一般5项(11%)、高风险0项。整体风险可控，卫生清洁类问题降幅最明显。"/>
    <VConnector/><FullSubCard label="评分趋势" value="86分" color="#10B981" insight="近7日均分84→88稳步上升。北京区域(88)领先，重庆(78)垫底。整体较上月同期+2分。"/>
    <VConnector/><FullSubCard label="高发问题" value="商品陈列" color="#F59E0B" insight="商品陈列15店为最高发问题。收银速度12店、卫生清洁8店。陈列类问题连续3周居首，建议本周专项治理。"/>
    <VConnector/><RiskTable label="低分门店" value="10家" color="#ef4444" cols={['门店','巡检分']} rows={[{name:'成都武侯区店',val:'52',warn:true},{name:'重庆解放碑店',val:'58',warn:true},{name:'西安钟楼店',val:'61'},{name:'北京朝阳店',val:'63'},{name:'上海南京路店',val:'65'},{name:'武汉光谷店',val:'67'},{name:'太原柳巷店',val:'68'},{name:'南京鼓楼店',val:'69'},{name:'长沙解放西店',val:'70'},{name:'合肥南屏店',val:'71'},{name:'济南泉城店',val:'72'},{name:'厦门中山路店',val:'73'}]}/>
  </div></div></div>}

/* ─── 周诊断 ─── */
function WeekTab() {return <div className="space-y-4">
  <TopBanner stages={[{label:'选址拓店',icon:<MapPin className="w-6 h-6"/>,color:'#3B82F6',status:'兑现率 87%',metrics:['客流兑现率 87%','销售额兑现 92%','新增竞品 3家','A级商圈 66%']},{label:'客流管店',icon:<TrendingUp className="w-6 h-6"/>,color:'#8B5CF6',status:'周115万人次',metrics:['周客流 +3%','转化率 30→32%','复购率 41%','周末客流 +5%']},{label:'巡检治店',icon:<CheckCircle2 className="w-6 h-6"/>,color:'#10B981',status:'周均分 82',metrics:['陈列 58店','收银 32店','闭环率 75%','复发率 ↓5pp']}]}/>
  <div className="grid grid-cols-3 gap-3">
  <div className="space-y-0"><ModelCard title="选址拓店模型" icon={<MapPin className="w-3.5 h-3.5"/>} color="#3B82F6"><MiniBar label="客流兑现率" value={87} max={100} color="#3B82F6"/><MiniBar label="销售额兑现率" value={92} max={100} color="#10B981"/><AiInsight text="兑现率87%。全国新增竞品3家主要在成渝。商圈人流+5%提供正向支撑。"/></ModelCard>
    <VConnector/><FullSubCard label="兑现率走势" value="87%" color="#3B82F6" insight="本周客流兑现率从86%波动至89%。周五/周六达到峰值89%。工作日均值85%明显低于周末91%。"/>
    <VConnector/><FullSubCard label="竞品动态" value="+3家" color="#ef4444" insight="全国本周新增竞品3家(成都2家/重庆1家)。预估影响8家门店分流率5-8%。建议针对性推出促销活动。"/>
    <VConnector/><FullSubCard label="兑现率TOP区域" value="北京91%" color="#10B981" insight="北京区域兑现率91%领跑全国。成都89%、上海88%紧随其后。广州85%稍低与近期竞品增加有关。"/>
    <VConnector/><RiskTable label="风险门店" value="24家" color="#ef4444" cols={['区域','门店数']} rows={[{name:'成都区域',val:'6家',warn:true},{name:'重庆区域',val:'4家',warn:true},{name:'西安区域',val:'3家'},{name:'北京区域',val:'3家'},{name:'上海区域',val:'2家'},{name:'广州区域',val:'2家'},{name:'杭州区域',val:'2家'},{name:'武汉区域',val:'2家'}]}/>
  </div>
  <div className="space-y-0"><ModelCard title="客流管店模型" icon={<TrendingUp className="w-3.5 h-3.5"/>} color="#8B5CF6"><MiniBar label="周客流(万)" value={115} max={140} color="#8B5CF6"/><MiniBar label="转化率" value={32} max={50} color="#3B82F6"/><AiInsight text="周客流115万+3%。周末+5%表现强劲。工作日略降与促销节奏有关，整体向好。"/></ModelCard>
    <VConnector/><FullSubCard label="日客流趋势" value="16.4万/日均" color="#8B5CF6" insight="周一15.8万→周日17.1万阶梯上升。周末客流高于工作日(+8%)，午市12-13点为全天峰值时段。"/>
    <VConnector/><FullSubCard label="转化率分布" value="32%" color="#10B981" insight="38%门店转化率>35%(优秀)。周五~周日转化率34%明显优于周一~周四28%。促销活动贡献约3pp提升。"/>
    <VConnector/><FullSubCard label="复购率" value="41%(+2pp)" color="#10B981" insight="全品牌复购率41%。老客复购率56%为新客(18%)的3倍。会员活跃率62%较上月提升3pp。"/>
    <VConnector/><RiskTable label="低客流门店" value="10家" color="#ef4444" cols={['门店','客流','环比']} rows={[{name:'西安钟楼店',val:'520',warn:true},{name:'武汉光谷店',val:'580',warn:true},{name:'太原柳巷店',val:'620'},{name:'北京西单店',val:'650'},{name:'南京鼓楼店',val:'680'},{name:'南京夫子庙店',val:'700'},{name:'长沙解放西店',val:'720'},{name:'合肥南屏店',val:'750'},{name:'济南泉城店',val:'760'},{name:'厦门中山路店',val:'780'},{name:'长春南关店',val:'790'},{name:'西安回民街店',val:'790'}]}/>
  </div>
  <div className="space-y-0"><ModelCard title="巡检治店模型" icon={<CheckCircle2 className="w-3.5 h-3.5"/>} color="#10B981"><MiniBar label="巡检均分" value={82} max={100} color="#10B981"/><MiniBar label="闭环率" value={75} max={100} color="#F59E0B"/><AiInsight text="陈列涉及58店为最突出问题。闭环率75%需提升。建议区域经理重点复查Top3问题门店。"/></ModelCard>
    <VConnector/><FullSubCard label="问题趋势" value="日均52项" color="#F59E0B" insight="周初52项→周末39项呈下降趋势。商品陈列(58店)和收银速度(32店)合计占问题总量68%。"/>
    <VConnector/><FullSubCard label="闭环时效" value="67%/24h" color="#10B981" insight="67%问题在24h内完成整改闭环。超3天未闭环17%、超7天16%需重点催办。闭环率较上周+5pp。"/>
    <VConnector/><FullSubCard label="区域排名" value="北京86分" color="#3B82F6" insight="北京(86)、成都(84)、上海(83)位列前三。重庆(78)垫底主因是商品陈列问题频发。广州(81)环比提升最大。"/>
    <VConnector/><RiskTable label="复发门店" value="15家" color="#ef4444" cols={['门店','次数']} rows={[{name:'成都武侯区店',val:'3次',warn:true},{name:'重庆解放碑店',val:'2次',warn:true},{name:'西安钟楼店',val:'2次'},{name:'北京朝阳店',val:'2次'},{name:'上海南京路店',val:'1次'},{name:'武汉光谷店',val:'1次'},{name:'成都天府新区店',val:'1次'},{name:'成都金牛店',val:'1次'},{name:'成都青羊店',val:'1次'},{name:'重庆渝北店',val:'1次'},{name:'西安雁塔店',val:'1次'},{name:'成都锦江店',val:'1次'},{name:'成都双流店',val:'1次'},{name:'重庆江北店',val:'1次'},{name:'重庆南岸店',val:'1次'}]}/>
  </div></div></div>}

/* ─── 月诊断 ─── */
function MonthTab() {return <div className="space-y-4">
  <TopBanner stages={[{label:'选址拓店',icon:<MapPin className="w-6 h-6"/>,color:'#3B82F6',status:'兑现率 85→92%',metrics:['客流兑现 +7pp','竞品 +2家/全国','A级商圈 66→68%','ROI达标率 78%']},{label:'客流管店',icon:<TrendingUp className="w-6 h-6"/>,color:'#8B5CF6',status:'480万人次',metrics:['环比 +3%','转化率 30→32%','客单价 ¥28.5','销售额 ¥1.38亿']},{label:'巡检治店',icon:<CheckCircle2 className="w-6 h-6"/>,color:'#10B981',status:'均分 84',metrics:['均分 +2分','闭环 85→92%','复发 23→18%','零重大事故']}]}/>
  <div className="grid grid-cols-3 gap-3">
  <div className="space-y-0"><ModelCard title="选址拓店模型" icon={<MapPin className="w-3.5 h-3.5"/>} color="#3B82F6"><MetricRow items={[{label:'兑现率',value:'85→92%',color:'#10B981',sub:'↑7pp'},{label:'竞品',value:'+2家',color:'#ef4444',sub:'全国'},{label:'商圈',value:'A级68%',color:'#3B82F6',sub:'+2pp'}]}/><AiInsight text="兑现率85→92%显著提升。新增2家竞品影响可控。A级商圈占比68%持续向好。"/></ModelCard>
    <VConnector/><FullSubCard label="兑现率走势" value="85→92%" color="#3B82F6" insight="各周兑现率85%→88%→90%→92%稳步攀升。最后两周均超90%，选址模型调优和商圈深耕策略初见成效。"/>
    <VConnector/><FullSubCard label="竞品影响评估" value="8店显著" color="#ef4444" insight="新增2家竞品中：8店受到显著影响(客流↓5-8%)，16店轻微影响，104店无影响。受影响门店集中在成渝新一线城市。"/>
    <VConnector/><FullSubCard label="商圈发展指数" value="↑12%" color="#10B981" insight="社区入住率提升6%、商业活跃度+12%。3个B级商圈晋升A级。整体商圈质量持续改善为客流增长提供长期支撑。"/>
    <VConnector/><RiskTable label="投资风险门店" value="22家" color="#ef4444" cols={['门店','ROI']} rows={[{name:'成都武侯区店',val:'65%',warn:true},{name:'重庆解放碑店',val:'72%',warn:true},{name:'西安钟楼店',val:'78%'},{name:'武汉光谷店',val:'80%'},{name:'太原柳巷店',val:'82%'},{name:'北京西单店',val:'84%'},{name:'南京鼓楼店',val:'86%'},{name:'南京夫子庙店',val:'88%'},{name:'长沙解放西店',val:'89%'},{name:'合肥南屏店',val:'90%'},{name:'济南泉城店',val:'91%'},{name:'厦门中山路店',val:'92%'},{name:'长春南关店',val:'93%'},{name:'西安回民街店',val:'94%'},{name:'武汉西北湖店',val:'95%'},{name:'武汉江汉路店',val:'96%'},{name:'成都春熙店',val:'97%'},{name:'成都峨眉店',val:'98%'},{name:'成都麓山店',val:'98%'},{name:'成都望江店',val:'99%'},{name:'成都金牛店',val:'99%'},{name:'成都青羊店',val:'99%'}]}/>
  </div>
  <div className="space-y-0"><ModelCard title="客流管店模型" icon={<TrendingUp className="w-3.5 h-3.5"/>} color="#8B5CF6"><MetricRow items={[{label:'月客流',value:'480万',color:'#8B5CF6',sub:'+3%'},{label:'转化率',value:'30→32%',color:'#10B981',sub:'↑2pp'},{label:'销售额',value:'¥1.38亿',color:'#F59E0B',sub:'+5%'}]}/><AiInsight text="月客流480万+3%。转化率32%创新高。销售额1.38亿。客单价仍有提升空间。"/></ModelCard>
    <VConnector/><FullSubCard label="月度客流趋势" value="480万" color="#8B5CF6" insight="各周客流450→460→470→480万持续增长。月末较月初+6.7%。周末客流贡献52%总量，工作日占比稳步提升。"/>
    <VConnector/><FullSubCard label="转化漏斗" value="进→购→成交" color="#3B82F6" insight="进店率72%、选购率68%、成交率32%。成交率+2pp是销售额增长核心驱动力。午市促销使选购→成交环节提升明显。"/>
    <VConnector/><FullSubCard label="客单价提升" value="¥26.8→28.5" color="#10B981" insight="月初均价¥26.8稳步升至月末¥28.5(+6.3%)。加价购策略在68家门店试点成功，贡献客单价提升约¥1.2。"/>
    <VConnector/><RiskTable label="客流下滑门店" value="15家" color="#ef4444" cols={['门店','降幅']} rows={[{name:'西安钟楼店',val:'-12%',warn:true},{name:'武汉光谷店',val:'-10%',warn:true},{name:'太原柳巷店',val:'-8%'},{name:'北京西单店',val:'-7%'},{name:'重庆解放碑店',val:'-6%'},{name:'南京鼓楼店',val:'-5%'},{name:'南京夫子庙店',val:'-5%'},{name:'长沙解放西店',val:'-5%'},{name:'成都武侯区店',val:'-4%'},{name:'合肥南屏店',val:'-4%'},{name:'济南泉城店',val:'-3%'},{name:'厦门中山路店',val:'-3%'},{name:'成都天府新区店',val:'-2%'},{name:'成都金牛店',val:'-2%'},{name:'成都青羊店',val:'-2%'}]}/>
  </div>
  <div className="space-y-0"><ModelCard title="巡检治店模型" icon={<CheckCircle2 className="w-3.5 h-3.5"/>} color="#10B981"><MetricRow items={[{label:'品牌均分',value:'84分',color:'#10B981',sub:'+2分'},{label:'闭环率',value:'92%',color:'#F59E0B',sub:'+7pp'},{label:'复发率',value:'18%',color:'#ef4444',sub:'↓5pp'}]}/><AiInsight text="均分84稳步上升。闭环率92%年度最佳。陈列复发率18%仍为最突出问题，建议纳入下月专项整治。"/></ModelCard>
    <VConnector/><FullSubCard label="评分趋势" value="80→84分" color="#10B981" insight="各周均分80→82→81→83→84稳步提升。月度环比+2分、同比+5分。北京区域连续3月评分领先全国。"/>
    <VConnector/><FullSubCard label="闭环率趋势" value="85→92%" color="#F59E0B" insight="月度闭环率从85%逐周升至92%。超期未闭环问题从月初28项降至月末9项(-68%)。区域经理催办机制效果显著。"/>
    <VConnector/><FullSubCard label="问题类型演变" value="陈列↓7店" color="#10B981" insight="商品陈列45→38店(↓7)、收银速度28→22店(↓6)、卫生清洁18→9店(↓9)。三大高发问题均显著下降。"/>
    <VConnector/><RiskTable label="复发严重门店" value="8家" color="#ef4444" cols={['门店','复发次数']} rows={[{name:'成都武侯区店',val:'3次',warn:true},{name:'重庆解放碑店',val:'2次',warn:true},{name:'西安钟楼店',val:'2次'},{name:'北京朝阳店',val:'2次'},{name:'上海南京路店',val:'1次'},{name:'武汉光谷店',val:'1次'},{name:'太原柳巷店',val:'1次'},{name:'北京西单店',val:'1次'}]}/>
  </div></div></div>}

/* ═══ 图表/对话模式切换 ═══ */
function DialogueView(){const[msgs,setMsgs]=useState<{role:string;text:string}[]>([]);const[input,setInput]=useState('');const[thinking,setThinking]=useState(false)
const[conversations,setConvs]=useState<{title:string;preview:string;time:string}[]>([{title:'全品牌日诊断',preview:'今日健康度均分86分，整体运行平稳',time:'10:30'},{title:'成渝区域分析',preview:'兑现率<85%共27店，成渝区域12家',time:'09:15'},{title:'巡检专项排查',preview:'巡检Top5问题门店均已定位',time:'昨天'}])
function send(msg:string){if(!msg.trim()||thinking)return;setMsgs(function(p:any){return[...p,{role:'user',text:msg}]});setInput('');setThinking(true);setTimeout(function(){const answers={'全品牌日诊断':'全品牌今日健康度：128店均分86分。选址兑现率92%，客流16.4万人次，巡检发现问题47项(零高风险)。整体运行平稳。','成渝区域分析':'兑现率<85%共27店：成都5店、重庆4店、西安3店、其他15店。最低为成都武侯区店(68%)。建议重点关注成渝区域。','巡检专项排查':'巡检Top5问题店：①武侯区店(52分)②解放碑店(58分)③钟楼店(61分)④朝阳店(63分)⑤南京路店(65分)。均为危险/预警等级。','周客流趋势':'本周客流趋势：日均16.4万(+3%)。周末表现强劲+5%，工作日略降-0.5%。转化率稳定31%，客单价¥28.5。','竞品影响':'本月全国新增竞品2家，主要影响成渝区域。预估分流5-8%。建议受影响的8家门店推出针对性促销活动。'};const ans=(answers as any)[msg]||'针对您的问题，我将基于选址/客流/巡检三模型数据进行综合分析…建议查看对应维度的诊断卡片获取详细数据。';setMsgs(function(p:any){return[...p,{role:'ai',text:ans}]});setThinking(false)},1200)}
function newChat(){setMsgs([]);setConvs(function(prev:any){return[{title:'新对话',preview:'',time:'刚刚'},...prev]})}
return <div className="flex-1 flex gap-3 overflow-hidden">
  <div className="w-48 shrink-0 space-y-1.5 overflow-y-auto">
    <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-medium text-[var(--text-muted)]">对话记录</span><div className="text-[10px] text-[var(--ai-blue-500)] cursor-pointer flex items-center gap-1" onClick={newChat}><span className="text-base">+</span>新建</div></div>
    {conversations.map(function(c,i){return <div key={i} className="card-level-1 p-2.5 cursor-pointer hover:shadow-sm"><div className="text-[11px] font-medium text-[var(--text-primary)]">{c.title}</div><div className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">{c.preview||'新对话'}</div><div className="text-[9px] text-[var(--text-muted)] mt-0.5">{c.time}</div></div>})}
  </div>
  <div className="flex-1 flex flex-col card-level-1 overflow-hidden" style={{padding:0}}><div className="px-3 py-2 border-b border-[var(--border-subtle)] text-xs text-[var(--text-primary)] bg-[var(--bg-secondary)] flex items-center gap-2"><Brain className="w-3.5 h-3.5 text-[var(--ai-blue-500)]"/>AI 诊断对话</div><div className="flex-1 overflow-y-auto p-4 space-y-3">{msgs.length===0?<div className="flex items-center justify-center h-full text-xs text-[var(--text-muted)]">开始新对话或选择左侧历史对话</div>:msgs.map(function(m,i){return <div key={i} className={'flex '+(m.role==='user'?'justify-end':'justify-start')}><div className={'max-w-[85%] rounded-lg px-3 py-2 text-xs '+(m.role==='user'?'bg-[var(--ai-blue-500)] text-white':'bg-[var(--bg-tertiary)] text-[var(--text-primary)]')}>{m.text}</div></div>})}{thinking&&<div className="flex justify-start"><div className="bg-[var(--bg-tertiary)] rounded-lg px-3 py-2 text-xs text-[var(--text-muted)] animate-pulse">分析中...</div></div>}</div><div className="px-3 py-2 border-t border-[var(--border-subtle)] flex gap-2 bg-[var(--bg-secondary)]"><Input size="middle" placeholder="输入诊断问题..." value={input} onChange={function(e:any){setInput(e.target.value)}} onPressEnter={function(){send(input)}} style={{flex:1}}/><Button size="middle" type="primary" onClick={function(){send(input)}} disabled={thinking}>发送</Button></div></div>
</div>}

export const ZhendianOverview:React.FC=()=>{const[period,setPeriod]=useState('day');const[mode,setMode]=useState<'chart'|'chat'>('chart')
return <div className="p-6 h-full flex flex-col overflow-hidden"><div className="shrink-0 space-y-3 mb-4"><div className="flex items-center justify-between"><div><h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2"><Activity className="w-4 h-4"/>诊店总览</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">全品牌 · 选址拓店→客流管店→巡检治店 三模型联动诊断</p></div><div className="flex items-center bg-[var(--bg-tertiary)] rounded-lg p-0.5 gap-0.5"><div className={'px-3 py-1.5 text-[11px] rounded-md cursor-pointer transition-all flex items-center gap-1.5 '+(mode==='chart'?'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm':'text-[var(--text-muted)] hover:text-[var(--text-secondary)]')} onClick={function(){setMode('chart')}}><BarChart3 className="w-3.5 h-3.5"/>图表模式</div><div className={'px-3 py-1.5 text-[11px] rounded-md cursor-pointer transition-all flex items-center gap-1.5 relative '+(mode==='chat'?'bg-[var(--ai-blue-500)] text-white shadow-md':'text-[var(--text-muted)] hover:text-[var(--text-secondary)]')} onClick={function(){setMode('chat')}}><MessageSquare className="w-3.5 h-3.5"/>对话模式{mode==='chat'&&<span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full animate-pulse"/>}</div></div></div>{mode==='chart'&&<Tabs activeKey={period} onChange={setPeriod} size="small" items={[{key:'day',label:'日诊断'},{key:'week',label:'周诊断'},{key:'month',label:'月诊断'}]}/>}</div>{mode==='chart'?<div className="flex-1 overflow-y-auto">{period==='day'&&<DayTab/>}{period==='week'&&<WeekTab/>}{period==='month'&&<MonthTab/>}</div>:<DialogueView/>}</div>}

/* ═══ 单店诊断 ═══ */
const DIAG_STORES=[{id:'cd-tfxq-001',name:'成都天府新区店',score:76.2,level:'一般',location:82,crowd:71,ops:75,address:'成都市武侯区天府大道999号',openDate:'2024-03-15',area:'280m²',manager:'张拓',tags:['成熟门店','B级商圈','客流下降预警','巡检待改进']},{id:'cd-whq-001',name:'成都武侯区店',score:52,level:'危险',location:68,crowd:42,ops:55,address:'成都市武侯区一环路88号',openDate:'2025-08-01',area:'220m²',manager:'李建',tags:['新开门店','巡检危险','客流剧降','ROI预警']},{id:'cq-jfb-001',name:'重庆解放碑店',score:58,level:'危险',location:55,crowd:60,ops:62,address:'重庆市渝中区解放碑步行街16号',openDate:'2023-11-20',area:'310m²',manager:'王鹏',tags:['巡检待改进','培训预警','转化率预警','复购率下降']},{id:'xa-zl-001',name:'西安钟楼店',score:82,level:'良好',location:88,crowd:80,ops:78,address:'西安市碑林区钟楼广场1号',openDate:'2023-06-10',area:'260m²',manager:'陈静',tags:['A级商圈','培训合格','客流稳定','成长期门店']},{id:'bj-cy-001',name:'北京朝阳店',score:88,level:'良好',location:90,crowd:86,ops:85,address:'北京市朝阳区建国路88号',openDate:'2022-01-15',area:'350m²',manager:'刘洋',tags:['成熟门店','A级商圈','巡检优秀','高客单价']},{id:'sh-njl-001',name:'上海南京路店',score:73,level:'一般',location:78,crowd:72,ops:70,address:'上海市黄浦区南京东路188号',openDate:'2023-09-01',area:'300m²',manager:'赵敏',tags:['成熟门店','客流强劲增长','巡检良好','转化率优秀']}]

function DiagBar({label,value,color,reversed}:{label:string;value:number;color:string;reversed?:boolean}){const w=reversed?Math.min(value,100):value;const barColor=reversed?(value>20?'#EF4444':value>10?'#F59E0B':color):color;return<div className="flex items-center gap-2"><span className="text-[10px] text-[var(--text-muted)] w-16 shrink-0">{label}</span><div className="flex-1 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:w+'%',background:barColor}}/></div><span className="text-[10px] font-medium w-10 text-right" style={{color:barColor}}>{value}{reversed?'次':'%'}</span></div>}

export const ZhendianStoreDiagnosis:React.FC=()=>{
  const[storeId,setStoreId]=useState('cd-tfxq-001')
  const store=DIAG_STORES.find(s=>s.id===storeId)||DIAG_STORES[0]
  const sc=store.score;const lvlColor=sc>=90?'#10B981':sc>=80?'#3B82F6':sc>=70?'#eab308':sc>=60?'#f97316':'#ef4444'

  return <div className="p-6 h-full flex flex-col overflow-hidden"><div className="shrink-0 mb-3"><h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2"><Search className="w-4 h-4"/>单店深度诊断</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">AI综合评分模型 · 选址/客流/运营/培训/巡检五维分析</p></div>
  <div className="flex-1 flex gap-4 overflow-hidden">
    {/* ═══ 左侧：门店卡片 ═══ */}
    <div className="w-60 shrink-0 space-y-3 overflow-y-auto">
      <Select size="middle" value={storeId} onChange={setStoreId} style={{width:'100%'}} options={DIAG_STORES.map(s=>({value:s.id,label:s.name}))}/>
      <div className="card-level-1 p-4 text-center space-y-3">
        <div className="text-sm font-semibold text-[var(--text-primary)]">{store.name}</div>
        <svg viewBox="0 0 100 100" className="w-24 h-24 mx-auto"><circle cx="50" cy="50" r="40" fill="none" stroke="var(--bg-tertiary)" strokeWidth="7"/><circle cx="50" cy="50" r="40" fill="none" stroke={lvlColor} strokeWidth="7" strokeLinecap="round" strokeDasharray={2*Math.PI*40} strokeDashoffset={2*Math.PI*40*(1-sc/100)} transform="rotate(-90 50 50)"/><text x="50" y="46" textAnchor="middle" fill="var(--text-primary)" fontSize="18" fontWeight="bold">{sc}</text><text x="50" y="60" textAnchor="middle" fill="var(--text-muted)" fontSize="9">分</text></svg>
        <Tag color={store.level==='良好'?'blue':store.level==='一般'?'orange':'red'} style={{fontSize:12}}>AI评分{store.level}</Tag>
      </div>
      {/* 门店基本信息 */}
      <div className="card-level-1 p-3 space-y-1.5 text-[10px]">
        <div className="text-[var(--text-muted)] flex justify-between"><span>面积</span><span className="text-[var(--text-primary)]">{store.address?.split('路')[0]||'280m²'}</span></div>
        <div className="text-[var(--text-muted)] flex justify-between"><span>开业</span><span className="text-[var(--text-primary)]">{store.openDate||'2024-03-15'}</span></div>
        <div className="text-[var(--text-muted)] flex justify-between"><span>店长</span><span className="text-[var(--text-primary)]">{store.manager||'张拓'}</span></div>
        <div className="text-[var(--text-muted)] flex justify-between"><span>地址</span><span className="text-[var(--text-primary)] text-right truncate ml-2">{store.address||'成都天府大道999号'}</span></div>
      </div>
      {/* 门店动态标签 */}
      <div className="card-level-1 p-3 space-y-1.5">
        <div className="text-[10px] font-medium text-[var(--text-primary)] mb-1">动态标签</div>
        <div className="flex flex-wrap gap-1">{store.tags.map((t,i)=><span key={i} className="text-[9px] px-1.5 py-0.5 rounded" style={{background:t.includes('优秀')||t.includes('上升')||t.includes('A级')?'rgba(16,185,129,0.1)':t.includes('危险')||t.includes('下降')||t.includes('预警')||t.includes('剧降')?'rgba(239,68,68,0.1)':'rgba(59,130,246,0.1)',color:t.includes('优秀')||t.includes('上升')||t.includes('A级')?'#10B981':t.includes('危险')||t.includes('下降')||t.includes('预警')||t.includes('剧降')?'#EF4444':'#3B82F6'}}>{t}</span>)}</div>
      </div>
    </div>
    {/* ═══ 右侧：诊断数据卡片 ═══ */}
    <div className="flex-1 overflow-y-auto space-y-3">
      {/* AI诊断结论 */}
      <div className="card-level-1 p-4 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/10">
        <div className="text-xs text-[var(--text-primary)] leading-relaxed">
          <span className="font-semibold text-sm" style={{color:lvlColor}}>AI综合诊断评分 {sc}分 · {store.level}：</span>
          {sc>=80?'该门店运营健康度良好，选址和客流量表现优异，巡检评分持续稳定。主要短板为工作日客流偏低（日均929人），建议加强工作日引流促销和货架陈列优化。AI模型建议：①工作日推出限时促销拉升客流 ②增加陈列复检频次 ③高峰时段增开收银台。'
          :sc>=70?'该门店运营基本达标但存在明显短板。选址质量中等、客流量偏低是核心问题，巡检评分近期呈下降趋势。AI模型建议：①分析商圈竞品变化优化选址策略 ②推出会员专属活动提升复购率 ③加强员工培训提升巡检合规率。'
          :'该门店运营风险较高。选址客流兑现严重不足，巡检违规频发且整改滞后，培训完成率远低于品牌均值。建议：①启动门店经营诊断专项小组 ②全面整改食安和消防问题 ③评估是否需要调整门店位置或经营策略。'}
        </div>
      </div>
      {/* 数据图表卡 - 5列得分 */}
      <div className="grid grid-cols-5 gap-2">
        {[{l:'选址得分',v:store.location,c:store.location>=85?'#10B981':store.location>=70?'#F59E0B':'#EF4444'},{l:'客流得分',v:store.crowd,c:store.crowd>=85?'#10B981':store.crowd>=70?'#F59E0B':'#EF4444'},{l:'运营得分',v:store.ops,c:store.ops>=85?'#10B981':store.ops>=70?'#F59E0B':'#EF4444'},{l:'巡检均分',v:store.ops+5,c:'#10B981'},{l:'培训得分',v:store.crowd+2,c:'#3B82F6'}].map((k,i)=><div key={i} className="card-level-1 p-2 text-center"><div className="text-[9px] text-[var(--text-muted)]">{k.l}</div><div className="text-lg font-bold mt-0.5" style={{color:k.c}}>{k.v}</div></div>)}
      </div>
      {/* 优势 + 问题 双卡 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-level-1 p-3" style={{borderLeft:'3px solid #10B981'}}>
          <div className="text-[10px] font-semibold text-green-400 mb-2">诊断优势</div>
          <div className="space-y-1">
            {[{l:'周末客流',v:'+5%',d:'高于品牌均值8个百分点'},{l:'复购率',v:'41%',d:'老客忠诚度表现良好'},{l:'后厨评级',v:'A级',d:'食安零风险满分通过'},{l:'员工出勤',v:'98%',d:'团队稳定性优于区域均值'}].map((a,i)=><div key={i} className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-green-400 shrink-0"/><span className="text-[10px] text-[var(--text-primary)]">{a.l} <span className="font-bold text-green-400">{a.v}</span></span><span className="text-[9px] text-[var(--text-muted)] ml-auto">{a.d}</span></div>)}
          </div>
        </div>
        <div className="card-level-1 p-3" style={{borderLeft:'3px solid #EF4444'}}>
          <div className="text-[10px] font-semibold text-red-400 mb-2">诊断风险</div>
          <div className="space-y-1">
            {[{l:'工作日客流',v:'↓12%',d:'周一至周四仅929人/天'},{l:'陈列扣分',v:'3次',d:'连续3周陈列不达标'},{l:'高峰收银',v:'超5分',d:'午市收银排队超品牌标准'},{l:'复购率下滑',v:'-8%',d:'近30天老客回流率下降'}].map((a,i)=><div key={i} className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-red-400 shrink-0"/><span className="text-[10px] text-[var(--text-primary)]">{a.l} <span className="font-bold text-red-400">{a.v}</span></span><span className="text-[9px] text-[var(--text-muted)] ml-auto">{a.d}</span></div>)}
          </div>
        </div>
      </div>
      {/* 客流趋势 */}
      <div className="card-level-1 p-4 space-y-2">
        <div className="text-xs font-semibold text-[var(--text-primary)]">近14日客流趋势</div>
        <div className="relative h-16"><svg viewBox="0 0 700 50" className="w-full h-full" preserveAspectRatio="none"><polyline points="5,35 55,30 105,33 155,20 205,28 255,18 305,22 355,15 405,18 455,10 505,14 555,8 605,12 655,5" fill="none" stroke="#8B5CF6" strokeWidth="1.5"/>{[155,255,355,455,555,655].map((x,i)=><circle key={i} cx={x} cy="15" r="2.5" fill="#8B5CF6"/>)}</svg></div>
        <div className="flex items-center justify-between text-[8px] text-[var(--text-muted)]">{'5/14 5/16 5/18 5/20 5/22 5/24 5/27'.split(' ').map((d,i)=><span key={i}>{d}</span>)}</div>
        <div className="flex items-center gap-4 text-[10px] mt-1"><span className="flex items-center gap-1 text-green-400">周末均值 1,520人</span><span className="flex items-center gap-1 text-orange-400">工作日均值 929人</span><span className="flex items-center gap-1 text-[var(--text-muted)]">差值 -591人</span></div>
      </div>
      {/* 时段客流 + 巡检扣分TOP */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-level-1 p-3 space-y-2">
          <div className="text-xs font-semibold text-[var(--text-primary)]">时段客流分布</div>
          {[{t:'10-12点',v:280,c:'#8B5CF6',pct:22},{t:'12-14点',v:420,c:'#3B82F6',pct:33},{t:'14-18点',v:320,c:'#10B981',pct:25},{t:'18-22点',v:260,c:'#F59E0B',pct:20}].map(h=><div key={h.t} className="flex items-center gap-2"><span className="text-[9px] text-[var(--text-muted)] w-14">{h.t}</span><div className="flex-1 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:h.pct*3+'%',background:h.c}}/></div><span className="text-[9px] font-medium w-12 text-right" style={{color:h.c}}>{h.v}人</span></div>)}
        </div>
        <div className="card-level-1 p-3 space-y-2">
          <div className="text-xs font-semibold text-[var(--text-primary)]">近30日巡检扣分TOP5</div>
          {[{n:'商品陈列',c:8,sc:15},{n:'收银效率',c:5,sc:10},{n:'后厨卫生',c:3,sc:5},{n:'员工仪容',c:2,sc:5},{n:'消防通道',c:1,sc:5}].map(is=><div key={is.n} className="flex items-center gap-2"><span className="text-[9px] text-[var(--text-muted)] w-16">{is.n}</span><div className="flex-1 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:(is.c*10)+'%',background:is.c>=5?'#EF4444':is.c>=3?'#F59E0B':'#3B82F6'}}/></div><span className="text-[8px] font-medium w-10 text-right" style={{color:is.c>=5?'#EF4444':'#F59E0B'}}>-{is.sc}分</span></div>)}
        </div>
      </div>
      {/* 近14日关键指标 */}
      <div className="card-level-1 p-3 space-y-2">
        <div className="text-xs font-semibold text-[var(--text-primary)]">近14日关键经营指标</div>
        <div className="grid grid-cols-4 gap-3 text-[10px]">
          {[{l:'日均客流',v:'1,220人',d:'较前14日 -1.8%',c:'#EF4444'},{l:'日均销售额',v:'¥27,500',d:'较前14日 +3.5%',c:'#10B981'},{l:'平均客单价',v:'¥22.5',d:'较前14日 +¥1.8',c:'#10B981'},{l:'客流转化率',v:'28.3%',d:'较前14日 -2.1pp',c:'#EF4444'}].map((m,i)=><div key={i} className="bg-[var(--bg-tertiary)] rounded p-2 text-center"><div className="text-[var(--text-muted)]">{m.l}</div><div className="text-sm font-bold mt-0.5 text-[var(--text-primary)]">{m.v}</div><div className="text-[8px] mt-0.5" style={{color:m.c}}>{m.d}</div></div>)}
        </div>
      </div>
      {/* 整体评估总结 */}
      <div className="card-level-1 p-4 bg-amber-500/5 border border-amber-500/10 space-y-2">
        <div className="text-xs font-semibold text-[var(--text-primary)]">AI诊断总结与建议</div>
        <div className="text-[10px] text-[var(--text-secondary)] leading-relaxed space-y-1">
          <div>✅ <span className="font-medium text-green-400">优势：</span>周末客流表现优异（+5%），复购率41%高于品牌均值，后厨食安评级A级零风险。</div>
          <div>⚠️ <span className="font-medium text-red-400">短板：</span>工作日客流仅为周末的61%，陈列巡检连续3周不达标，午市收银排队超5分钟。</div>
          <div>📊 <span className="font-medium text-blue-400">数据支撑：</span>基于最近30天16,800条经营数据、42次巡检记录、128项培训指标综合运算得出，模型置信度92.3%。</div>
          <div>🎯 <span className="font-medium text-purple-400">行动建议：</span>①工作日限时满减促销（预计拉升客流15-20%）②每周一/四陈列复检③12-14点增开1个收银台④定向推送会员优惠券提升复购。</div>
        </div>
      </div>
    </div>
  </div></div>}

/* ═══ 技能广场 ═══ */
export const ZhendianSkills:React.FC=()=>{const[cat,setCat]=useState('全部');const skills=[{cat:'基础分析',icon:<BarChart3 className="w-4 h-4"/>,name:'客流异常诊断',desc:'自动识别门店客流异常波动并分析可能的原因',enabled:true},{cat:'基础分析',icon:<TrendingUp className="w-4 h-4"/>,name:'销售趋势分析',desc:'基于历史数据预测门店销售趋势并识别拐点',enabled:true},{cat:'专项诊断',icon:<Search className="w-4 h-4"/>,name:'选址健康度评分',desc:'综合客流兑现率、竞品密度等指标评估选址质量',enabled:true},{cat:'专项诊断',icon:<Users className="w-4 h-4"/>,name:'服务质量评估',desc:'分析收银效率、服务态度、客诉率等指标',enabled:true},{cat:'预测预警',icon:<AlertTriangle className="w-4 h-4"/>,name:'智能风险预警',desc:'基于多维度数据提前7天预测门店风险等级变化',enabled:true},{cat:'预测预警',icon:<TrendingDown className="w-4 h-4"/>,name:'客流下滑预警',desc:'监测客流趋势并在连续下降达阈值时触发预警',enabled:true},{cat:'优化建议',icon:<Zap className="w-4 h-4"/>,name:'商品陈列优化',desc:'基于巡检数据和销售额分析提供陈列动线优化',enabled:false},{cat:'优化建议',icon:<Target className="w-4 h-4"/>,name:'精准促销推荐',desc:'根据门店客流结构和客单价推荐最优促销策略',enabled:false},{cat:'报告生成',icon:<FileText className="w-4 h-4"/>,name:'自动诊断报告',desc:'一键生成门店综合诊断报告含图表和分析建议',enabled:true},{cat:'报告生成',icon:<BarChart3 className="w-4 h-4"/>,name:'区域对比报告',desc:'生成多店对比分析报告直观展示区域差异',enabled:true}];return<div className="p-6 h-full flex flex-col overflow-hidden"><div className="shrink-0 space-y-3"><div><h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2"><Zap className="w-4 h-4"/>技能广场</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">可插拔式AI诊断能力扩展·按需启用/禁用</p></div><Tabs activeKey={cat} onChange={setCat} size="small" items={['全部','基础分析','专项诊断','预测预警','优化建议','报告生成'].map(function(c){return{key:c,label:c}})}/></div><div className="flex-1 overflow-y-auto mt-2"><div className="grid grid-cols-3 gap-3">{skills.filter(function(s){return cat==='全部'||s.cat===cat}).map(function(s,i){return<div key={i} className="card-level-1 p-4 space-y-3"><div className="flex items-start gap-3"><div>{s.icon}</div><div className="flex-1"><div className="text-sm font-medium text-[var(--text-primary)]">{s.name}</div><div className="text-[10px] text-[var(--text-muted)] mt-0.5">{s.desc}</div></div></div><div className="flex items-center justify-between"><Tag color={s.enabled?'green':'default'} style={{fontSize:10}}>{s.enabled?'已启用':'已禁用'}</Tag><Button size="small" type={s.enabled?'default':'primary'} style={{fontSize:10}}>{s.enabled?'禁用':'启用'}</Button></div></div>})}</div></div></div>}

/* ═══ 数据连接 ═══ */
export const ZhendianDataConnect:React.FC=()=>{const[tab,setTab]=useState('全部')
const sources=[{name:'门店经营数据',source:'POS/ERP系统',status:'已连接',sync:'每15分钟',mode:'API',icon:<CreditCard className="w-4 h-4"/>,desc:'RESTful API对接·JSON格式·支持实时查询和批量同步'},{name:'客流传感器',source:'IoT设备',status:'已连接',sync:'实时',mode:'MCP',icon:<Radio className="w-4 h-4"/>,desc:'MCP协议·流式数据·毫秒级延迟·支持10万+设备并发'},{name:'巡检台账',source:'食安管理平台',status:'已连接',sync:'每小时',mode:'CLI',icon:<ClipboardList className="w-4 h-4"/>,desc:'CLI命令行拉取·定时cron任务·增量同步·自动去重'},{name:'竞品情报',source:'第三方数据',status:'已连接',sync:'每日',mode:'Webhook',icon:<Search className="w-4 h-4"/>,desc:'Webhook推送·每日定时回调·结构化数据·异常重试3次'},{name:'商圈数据',source:'高德地图API',status:'已连接',sync:'每日',mode:'API',icon:<Map className="w-4 h-4"/>,desc:'RESTful API·地理围栏数据·POI信息·商圈评级指数'},{name:'供应链数据',source:'ERP系统',status:'待配置',sync:'-',mode:'SQL',icon:<Package className="w-4 h-4"/>,desc:'直连数据库·MySQL/PostgreSQL·只读权限·需配置连接串和白名单'},{name:'会员CRM',source:'CRM系统',status:'待配置',sync:'-',mode:'MCP',icon:<Users className="w-4 h-4"/>,desc:'MCP协议对接·会员画像·消费行为·标签体系·需API Key'},{name:'天气数据',source:'气象局API',status:'已连接',sync:'每小时',mode:'API',icon:<Cloud className="w-4 h-4"/>,desc:'天气实况+预报·影响客流预测模型·按城市粒度拉取'},{name:'社交媒体',source:'舆情平台',status:'待配置',sync:'-',mode:'Webhook',icon:<MessageSquare className="w-4 h-4"/>,desc:'Webhook推送·门店舆情监控·负面预警·需配置关键词'},{name:'外卖平台',source:'美团/饿了么',status:'待配置',sync:'-',mode:'SQL',icon:<TrendingUp className="w-4 h-4"/>,desc:'数据库同步·订单数据·评价数据·按门店维度汇总'}]
const filtered=tab==='全部'?sources:sources.filter(function(s){return s.mode===tab});const tabs=['全部','MCP','CLI','SQL','API','Webhook']
return<div className="p-6 h-full flex flex-col overflow-hidden"><div className="shrink-0 space-y-3"><div><h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2"><Cloud className="w-4 h-4"/>数据连接</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">对接多源数据·为AI诊断提供数据底座·支持MCP/CLI/SQL/API/Webhook多种同步模式</p></div><Tabs activeKey={tab} onChange={setTab} size="small" items={tabs.map(function(t){return{key:t,label:t}})}/></div><div className="flex-1 overflow-y-auto mt-2"><div className="space-y-2">{filtered.map(function(d,i){return<div key={i} className="card-level-1 p-4 flex items-center gap-4"><div className="shrink-0">{d.icon}</div><div className="flex-1"><div className="flex items-center gap-2"><span className="text-sm font-medium text-[var(--text-primary)]">{d.name}</span><Tag color={d.mode==='MCP'?'purple':d.mode==='CLI'?'cyan':d.mode==='SQL'?'blue':d.mode==='API'?'green':'orange'} style={{fontSize:10}}>{d.mode}</Tag></div><div className="text-[10px] text-[var(--text-muted)] mt-0.5">{d.desc}</div><div className="text-[9px] text-[var(--text-muted)] mt-0.5">来源：{d.source}·同步：{d.sync}</div></div><Tag color={d.status==='已连接'?'green':'orange'} style={{fontSize:11}}>{d.status}</Tag></div>})}</div></div></div>}

/* ═══ 定时任务 ═══ */
export const ZhendianSchedule:React.FC=()=>{
  const[showAdd,setShowAdd]=useState(false);const[newName,setNewName]=useState('');const[newCron,setNewCron]=useState('');const[newDesc,setNewDesc]=useState('')
  const[taskList,setTaskList]=useState([{id:1,name:'全品牌日健康度诊断',cron:'每天 08:00',status:'运行中',last:'2026-05-22 08:02',icon:<BarChart3 className="w-5 h-5"/>,desc:'每日自动汇总全国128店选址/客流/巡检三模型数据，生成日健康度报表并推送至运营群。'},{id:2,name:'单店周诊断报告',cron:'每周一 09:00',status:'运行中',last:'2026-05-19 09:05',icon:<Search className="w-5 h-5"/>,desc:'每周一自动生成各门店深度诊断报告，含选址兑现率/客流趋势/巡检问题三维度分析。推送至对应区域经理。'},{id:3,name:'月度合规评估',cron:'每月1日 10:00',status:'运行中',last:'2026-05-01 10:03',icon:<FileText className="w-5 h-5"/>,desc:'月初自动汇总上月巡检/整改/合规数据，生成门店合规评分及整改清单。同步至月调度台账。'},{id:4,name:'竞品影响月度分析',cron:'每月5日 14:00',status:'已暂停',last:'2026-04-05 14:01',icon:<AlertTriangle className="w-5 h-5"/>,desc:'分析全国竞品变动对门店客流的实际影响，生成竞品影响评估报告。因数据源配置调整已暂停。'},{id:5,name:'预警巡检自动触发',cron:'实时持续',status:'运行中',last:'-',icon:<Zap className="w-5 h-5"/>,desc:'监测门店数据异常，客流/巡检/选址指标触发阈值时自动发起AI诊断。支持短信/企微/App三通道告警。'},{id:6,name:'商圈动态监控',cron:'每日 22:00',status:'运行中',last:'2026-05-22 22:01',icon:<MapPin className="w-5 h-5"/>,desc:'夜间批量拉取商圈POI数据、社区入住率、交通变化，更新选址模型输入参数。'},{id:7,name:'数据质量巡检',cron:'每6小时',status:'运行中',last:'2026-05-22 20:03',icon:<CheckCircle2 className="w-5 h-5"/>,desc:'检查各数据源连接状态与数据完整性，发现中断或异常数据自动告警并尝试自动恢复。'},{id:8,name:'AI模型迭代训练',cron:'每周日 03:00',status:'已暂停',last:'2026-04-27 03:12',icon:<Brain className="w-5 h-5"/>,desc:'利用本周累积的诊断反馈数据微调AI诊断模型参数。因算力资源调整暂停，恢复后可提升诊断准确率。'}])

  function addTask(){if(!newName.trim()||!newCron.trim())return;setTaskList(function(prev:any){return[...prev,{id:Date.now(),name:newName.trim(),cron:newCron.trim(),status:'已暂停',last:'-',icon:<Timer className="w-5 h-5"/>,desc:newDesc.trim()||'新创建的定时诊断任务。'}]});setShowAdd(false);setNewName('');setNewCron('');setNewDesc('');message.success('任务已创建')}
  function toggleStatus(id:number){setTaskList(function(prev:any){return prev.map(function(t:any){return t.id===id?{...t,status:t.status==='运行中'?'已暂停':'运行中'}:t})})}

  return <div className="p-6 h-full flex flex-col overflow-hidden"><div className="shrink-0 space-y-3 mb-4"><div className="flex items-center justify-between"><div><h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2"><Timer className="w-4 h-4"/>定时任务</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">AI诊断自动化·周期性智能巡检·{taskList.length}个定时任务</p></div><Button size="middle" type="primary" icon={<FileText className="w-3.5 h-3.5"/>} onClick={function(){setShowAdd(true)}}>新增任务</Button></div></div>
  <div className="flex-1 overflow-y-auto"><div className="grid grid-cols-2 gap-3">{taskList.map(function(t,i){return<div key={t.id} className="card-level-1 p-4 space-y-3"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">{t.icon}</div><div className="flex-1"><div className="flex items-center gap-2"><span className="text-sm font-medium text-[var(--text-primary)]">{t.name}</span><Tag color={t.status==='运行中'?'green':'orange'} style={{fontSize:10}}>{t.status}</Tag></div><div className="text-[10px] text-[var(--text-secondary)] mt-1 leading-relaxed">{t.desc}</div></div></div><div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)] bg-[var(--bg-tertiary)] rounded px-3 py-1.5"><span>周期：{t.cron}</span><span>|</span><span>上次：{t.last}</span><div className="flex-1"/><Button size="small" type={t.status==='运行中'?'default':'primary'} style={{fontSize:10}} onClick={function(){toggleStatus(t.id)}}>{t.status==='运行中'?'暂停':'启动'}</Button></div></div>})}</div></div>
  <Modal title="新增定时任务" open={showAdd} onCancel={function(){setShowAdd(false)}} onOk={addTask} okText="创建" cancelText="取消" width={420}>
    <div className="space-y-3 py-2"><div><div className="text-[10px] text-[var(--text-muted)] mb-1">任务名称</div><Input size="middle" placeholder="如：周客流专项诊断" value={newName} onChange={function(e:any){setNewName(e.target.value)}}/></div><div><div className="text-[10px] text-[var(--text-muted)] mb-1">执行周期</div><Input size="middle" placeholder="如：每天 08:00 / 每周一 09:00" value={newCron} onChange={function(e:any){setNewCron(e.target.value)}}/></div><div><div className="text-[10px] text-[var(--text-muted)] mb-1">任务描述</div><Input.TextArea size="middle" placeholder="描述该任务的具体内容..." value={newDesc} onChange={function(e:any){setNewDesc(e.target.value)}} rows={3}/></div></div>
  </Modal></div>
}

/* ═══ 门店动态标签 ═══ */
const TAG_GROUPS = [
  { key:'store', label:'门店属性', color:'#3B82F6', desc:'基于门店基础信息自动生成' },
  { key:'traffic', label:'客流数据', color:'#8B5CF6', desc:'基于客流趋势和转化率自动标记' },
  { key:'inspection', label:'巡检数据', color:'#10B981', desc:'基于巡检评分和合规率自动标记' },
  { key:'training', label:'培训数据', color:'#F59E0B', desc:'基于培训完成率和考试成绩标记' },
  { key:'location', label:'选址数据', color:'#EF4444', desc:'基于选址质量和商圈评估标记' },
]

const TAGS_DATA = [
  { id:'t1', name:'客流强劲增长', group:'traffic', count:32, color:'#10B981', rule:'近7日日均客流环比增长>15%', metric:'日均客流 +18.2%', detail:'触发门店近7日客流持续走高，周末峰值达日均1.8倍', stores:['IFS国金中心','太平街店','德思勤店','悦方ID店','开福万达店','广州天河城店','深圳万象天地','成都太古里店'] },
  { id:'t2', name:'客流稳定', group:'traffic', count:68, color:'#3B82F6', rule:'近7日日均客流环比变化±5%以内', metric:'客流波动<5%', detail:'客流保持平稳，周内波动在正常范围，无需关注', stores:['IFS国金中心','德思勤店','梅溪湖步步高店','湖滨银泰店','南京新街口店','重庆解放碑店'] },
  { id:'t3', name:'客流下降预警', group:'traffic', count:18, color:'#EF4444', rule:'近7日日均客流环比下降>10%', metric:'日均客流 -13.5%', detail:'连续5个工作日客流走低，日均降幅超10%，建议排查竞品及商圈变化', stores:['成都太古里店','重庆解放碑店','西安钟楼店','青岛万象城店','武汉楚河汉街店'] },
  { id:'t4', name:'客流剧降', group:'traffic', count:5, color:'#DC2626', rule:'近7日日均客流环比下降>25%', metric:'日均客流 -31.2%', detail:'大幅下降需紧急排查：是否存在修路/围挡/竞品开业等外部因素', stores:['成都武侯区店','西安钟楼店'] },
  { id:'t5', name:'巡检优秀', group:'inspection', count:48, color:'#10B981', rule:'巡检综合评分≥90分', metric:'均分 93.5分', detail:'近3次巡检平均分93.5，全部巡检项合规率98%以上', stores:['IFS国金中心','德思勤店','悦方ID店','深圳万象天地','南京新街口店','广州天河城店'] },
  { id:'t6', name:'巡检良好', group:'inspection', count:42, color:'#3B82F6', rule:'巡检综合评分80-89分', metric:'均分 85.2分', detail:'整体表现良好，后厨卫生和消防检查偶有扣分，需关注整改闭环', stores:['太平街店','梅溪湖步步高店','开福万达店','湖滨银泰店','成都太古里店'] },
  { id:'t7', name:'巡检待改进', group:'inspection', count:18, color:'#F59E0B', rule:'巡检评分70-79分 / 连续2次下降', metric:'均分 73.1分', detail:'连续2次巡检评分下降，主要问题集中在后厨食安和员工仪容', stores:['重庆解放碑店','西安钟楼店','青岛万象城店','武汉楚河汉街店'] },
  { id:'t8', name:'巡检危险', group:'inspection', count:8, color:'#EF4444', rule:'巡检评分<70分 / 出现高风险违规', metric:'均分 58.4分', detail:'出现高风险违规项，需店长立即整改并7日内复核', stores:['成都武侯区店','重庆解放碑店'] },
  { id:'t9', name:'培训优秀', group:'training', count:38, color:'#10B981', rule:'考试均分≥85分，课程完成率=100%', metric:'均分 91.3分', detail:'参培率100%，考试平均分91.3，食品安全和消防知识满分率95%', stores:['IFS国金中心','德思勤店','广州天河城店','深圳万象天地','南京新街口店'] },
  { id:'t10', name:'培训合格', group:'training', count:52, color:'#3B82F6', rule:'考试均分60-84分，课程完成率≥90%', metric:'均分 76.8分', detail:'大部分课程已完成，但专项考试得分偏低，建议针对性补训', stores:['太平街店','梅溪湖步步高店','开福万达店','湖滨银泰店','成都太古里店'] },
  { id:'t11', name:'培训预警', group:'training', count:12, color:'#EF4444', rule:'考试均分<60分 / 课程完成率<80%', metric:'均分 48.5分', detail:'课程完成率仅65%，考试成绩偏低，需强制完成剩余课程并安排靶向补考', stores:['重庆解放碑店','西安钟楼店','青岛万象城店','武汉楚河汉街店'] },
  { id:'t12', name:'A级商圈', group:'location', count:22, color:'#10B981', rule:'商圈评级A级，客流兑现率>90%', metric:'客流兑现率 94.2%', detail:'商圈质量优异，日均自然客流超2万人次，门店选址位于核心位置', stores:['IFS国金中心','德思勤店','广州天河城店','深圳万象天地','成都太古里店','南京新街口店'] },
  { id:'t13', name:'B级商圈', group:'location', count:56, color:'#3B82F6', rule:'商圈评级B级，客流兑现率70-90%', metric:'客流兑现率 78.5%', detail:'商圈质量良好，客流兑现率中等偏上，周边竞争态势正常', stores:['太平街店','悦方ID店','梅溪湖步步高店','开福万达店','湖滨银泰店','重庆解放碑店'] },
  { id:'t14', name:'ROI达标', group:'location', count:82, color:'#10B981', rule:'选址ROI≥预期值', metric:'ROI 112.3%', detail:'选址投资回报率达预期112%，客流和销售数据均超模型预测上线', stores:['IFS国金中心','德思勤店','广州天河城店','深圳万象天地','南京新街口店','成都太古里店'] },
  { id:'t15', name:'ROI预警', group:'location', count:8, color:'#EF4444', rule:'选址ROI低于预期30%以上', metric:'ROI 58.2%', detail:'选址回报率严重低于预期，需评估是否调整运营策略或考虑搬迁', stores:['武汉楚河汉街店','西安钟楼店','成都武侯区店'] },
  { id:'t16', name:'新开门店', group:'store', count:8, color:'#3B82F6', rule:'开业<3个月', metric:'经营天数 45天', detail:'处于爬坡期，需重点关注客流动线优化和首单转化率', stores:['湖滨银泰店','青岛万象城店'] },
  { id:'t17', name:'成长期门店', group:'store', count:28, color:'#8B5CF6', rule:'开业3-12个月', metric:'经营天数 215天', detail:'进入快速成长期，复购率和客单价持续提升，需优化商品结构', stores:['太平街店','梅溪湖步步高店','开福万达店','重庆解放碑店'] },
  { id:'t18', name:'成熟门店', group:'store', count:68, color:'#10B981', rule:'开业>2年且运营稳定', metric:'经营天数 892天', detail:'运营成熟稳定，客流、销售、巡检等各项指标均在正常范围内', stores:['IFS国金中心','德思勤店','悦方ID店','广州天河城店','深圳万象天地','成都太古里店','南京新街口店'] },
  { id:'t19', name:'高客单价门店', group:'traffic', count:18, color:'#F59E0B', rule:'平均客单价>¥35', metric:'客单价 ¥42.5', detail:'客单价远高于品牌均值¥28.5，主要受商圈消费力和SKU结构影响', stores:['IFS国金中心','广州天河城店','深圳万象天地','南京新街口店'] },
  { id:'t20', name:'低客单价门店', group:'traffic', count:24, color:'#6366F1', rule:'平均客单价<¥20', metric:'客单价 ¥16.8', detail:'客单价偏低，建议分析原因：促销活动影响/商圈消费力/产品组合', stores:['重庆解放碑店','西安钟楼店','武汉楚河汉街店','青岛万象城店'] },
  { id:'t21', name:'转化率优秀', group:'traffic', count:22, color:'#10B981', rule:'客流转化率>35%', metric:'转化率 38.2%', detail:'进店客流转化率高于品牌均值31%，商品陈列和导购服务表现突出', stores:['IFS国金中心','德思勤店','广州天河城店','深圳万象天地'] },
  { id:'t22', name:'转化率预警', group:'traffic', count:14, color:'#F59E0B', rule:'客流转化率<20%', metric:'转化率 16.5%', detail:'转化率持续走低，建议排查：商品结构/价格/服务态度/店内动线', stores:['武汉楚河汉街店','青岛万象城店','成都武侯区店'] },
  { id:'t23', name:'复购率优秀', group:'traffic', count:16, color:'#10B981', rule:'月复购率>50%', metric:'月复购率 56.8%', detail:'顾客忠诚度高，会员活跃率和复购率均远超品牌均值41%', stores:['IFS国金中心','德思勤店','广州天河城店'] },
  { id:'t24', name:'复购率下降', group:'traffic', count:12, color:'#EF4444', rule:'月复购率环比下降>15%', metric:'月复购率 -18.2%', detail:'老客流失加速，需排查：产品质量/竞品活动/会员权益吸引力', stores:['重庆解放碑店','武汉楚河汉街店','成都武侯区店'] },
]

const storesAll=['IFS国金中心','太平街店','德思勤店','悦方ID店','梅溪湖步步高店','开福万达店','湖滨银泰店','广州天河城店','深圳万象天地','成都太古里店','南京新街口店','重庆解放碑店','武汉楚河汉街店','成都武侯区店','西安钟楼店','青岛万象城店']

export const StoreDynamicTags: React.FC = () => {
  const [groupFilter,setGroupFilter]=useState('全部')
  const [searchText,setSearchText]=useState('')
  const [selectedTag,setSelectedTag]=useState<any>(null)
  const [showDrawer,setShowDrawer]=useState(false)
  const [editingTag,setEditingTag]=useState<any>(null)
  const [isNew,setIsNew]=useState(false)
  const [formName,setFormName]=useState('')
  const [formGroup,setFormGroup]=useState('traffic')
  const [formRule,setFormRule]=useState('')
  const [formMetric,setFormMetric]=useState('')
  const [formDetail,setFormDetail]=useState('')
  const [formColor,setFormColor]=useState('#3B82F6')
  const [formCount,setFormCount]=useState(0)

  const openEdit=(tag:any)=>{
    setEditingTag(tag); setIsNew(false)
    setFormName(tag.name); setFormGroup(tag.group); setFormRule(tag.rule)
    setFormMetric(tag.metric||''); setFormDetail(tag.detail||''); setFormColor(tag.color)
    setFormCount(tag.count); setShowDrawer(true)
  }
  const openAdd=()=>{
    setEditingTag(null); setIsNew(true)
    setFormName(''); setFormGroup('traffic'); setFormRule('')
    setFormMetric(''); setFormDetail(''); setFormColor('#3B82F6'); setFormCount(0)
    setShowDrawer(true)
  }
  const saveTag=()=>{
    message.success(isNew?'标签已创建':'标签已更新')
    setShowDrawer(false)
  }

  let filtered=TAGS_DATA.filter(t=>{
    if(groupFilter!=='全部'&&t.group!==groupFilter)return false
    if(searchText&&!t.name.includes(searchText)&&!t.rule.includes(searchText))return false
    return true
  })

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <div className="shrink-0 space-y-3">
        <div><h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2"><Tags className="w-4 h-4"/>门店动态标签</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">基于门店属性、客流、巡检、培训、选址数据自动生成动态标签 · 支持按标签组筛选和编辑 · 共{TAGS_DATA.length}个标签</p></div>
        <div className="flex items-center gap-3">
          <Tabs activeKey={groupFilter} onChange={setGroupFilter} size="small"
            items={[{key:'全部',label:`全部 (${TAGS_DATA.length})`},...TAG_GROUPS.map(g=>({key:g.key,label:`${g.label} (${TAGS_DATA.filter(t=>t.group===g.key).length})`}))]}/>
          <div className="flex-1"/>
          <Input size="middle" prefix={<Search className="w-3 h-3"/>} placeholder="搜索标签..." style={{width:180}} value={searchText} onChange={(e:any)=>setSearchText(e.target.value)}/>
          <Button size="middle" type="primary" icon={<Plus className="w-3.5 h-3.5"/>} onClick={openAdd}>添加标签</Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto mt-2">
        <div className="grid grid-cols-3 gap-3">
          {filtered.map(t=>{
            const group=TAG_GROUPS.find(g=>g.key===t.group)
            return <div key={t.id} className="card-level-1 p-4 hover:shadow-md transition-shadow border border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{background:t.color}}/><span className="text-sm font-semibold text-[var(--text-primary)]">{t.name}</span></div>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{background:`${t.color}15`,color:t.color}}>{t.count}店</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] leading-relaxed">规则：{t.rule}</div>
              <div className="flex items-center gap-2 text-[10px]"><span className="font-medium" style={{color:t.color}}>{t.metric}</span></div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{background:`${group?.color}15`,color:group?.color}}>{group?.label}</span>
                <div className="flex items-center gap-1">
                  <Button size="small" type="link" style={{fontSize:10}} onClick={(e)=>{e.stopPropagation();setSelectedTag(t)}}>门店</Button>
                  <Button size="small" type="link" style={{fontSize:10}} onClick={(e)=>{e.stopPropagation();openEdit(t)}}>编辑</Button>
                </div>
              </div>
            </div>
          })}
        </div>
      </div>
      {/* ═══ 门店列表弹窗 ═══ */}
      {selectedTag&&<Modal title={null} open={true} onCancel={()=>setSelectedTag(null)} footer={null} width={550} styles={{body:{padding:0}}}>
        <div className="space-y-0">
          <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{background:selectedTag.color}}/><span className="text-sm font-semibold text-[var(--text-primary)]">{selectedTag.name}</span><span className="text-[10px] text-[var(--text-muted)]">({selectedTag.count}家门店)</span></div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1">触发规则：{selectedTag.rule} | {selectedTag.metric}</div>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] bg-[var(--bg-secondary)] sticky top-0"><tr><td className="px-4 py-2">序号</td><td className="px-4 py-2">门店名称</td></tr></thead>
              <tbody>{selectedTag.stores.map((s:string,i:number)=><tr key={s} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                <td className="px-4 py-2 text-[var(--text-muted)]">{i+1}</td>
                <td className="px-4 py-2 font-medium text-[var(--text-primary)] flex items-center gap-2"><Store className="w-3 h-3 text-[var(--text-muted)]"/>{s}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
      </Modal>}
      {/* ═══ 添加/编辑标签抽屉 ═══ */}
      <Drawer title={isNew?'新建动态标签':'编辑动态标签'} placement="right" width={480} open={showDrawer} onClose={()=>setShowDrawer(false)}
        extra={<div className="flex gap-2"><Button size="small" onClick={()=>setShowDrawer(false)}>取消</Button><Button size="small" type="primary" onClick={saveTag}>保存</Button></div>}>
        <div className="space-y-4" style={{marginTop:-16}}>
          <div className="grid grid-cols-2 gap-3">
            <div><div className="text-[10px] text-[var(--text-muted)] mb-1">标签名称</div><Input size="middle" value={formName} onChange={(e:any)=>setFormName(e.target.value)} placeholder="如：客流大幅下滑"/></div>
            <div><div className="text-[10px] text-[var(--text-muted)] mb-1">标签颜色</div>
              <div className="flex items-center gap-2 mt-1">{['#10B981','#3B82F6','#8B5CF6','#F59E0B','#EF4444','#6366F1'].map(c=><div key={c} className="w-6 h-6 rounded cursor-pointer border-2" style={{background:c,borderColor:formColor===c?('var(--text-primary)'):'transparent'}} onClick={()=>setFormColor(c)}/>)}</div></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><div className="text-[10px] text-[var(--text-muted)] mb-1">标签组</div>
              <Select size="middle" value={formGroup} onChange={setFormGroup} style={{width:'100%'}} options={TAG_GROUPS.map(g=>({value:g.key,label:g.label}))}/></div>
            <div><div className="text-[10px] text-[var(--text-muted)] mb-1">关联门店数</div><Input size="middle" type="number" value={formCount} onChange={(e:any)=>setFormCount(Number(e.target.value))}/></div>
          </div>
          <div><div className="text-[10px] text-[var(--text-muted)] mb-1">触发规则</div><Input.TextArea size="middle" value={formRule} onChange={(e:any)=>setFormRule(e.target.value)} rows={2} placeholder="如：近7日日均客流环比下降>10%"/></div>
          <div><div className="text-[10px] text-[var(--text-muted)] mb-1">量化指标</div><Input size="middle" value={formMetric} onChange={(e:any)=>setFormMetric(e.target.value)} placeholder="如：日均客流 -13.5%"/></div>
          <div><div className="text-[10px] text-[var(--text-muted)] mb-1">详细描述</div><Input.TextArea size="middle" value={formDetail} onChange={(e:any)=>setFormDetail(e.target.value)} rows={3} placeholder="描述该标签的触发条件、数据来源及建议措施..."/></div>
        </div>
      </Drawer>
    </div>
  )
}
