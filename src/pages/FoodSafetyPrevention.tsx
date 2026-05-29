import React, { useState } from 'react'
import { Shield, TrendingUp, AlertTriangle, CheckCircle, Calendar, BarChart3, Thermometer, Archive, Store, UserCheck, ClipboardCheck, Eye, Award, Zap, Target, Search, TrendingDown } from 'lucide-react'
import { Tag, Button, Select } from 'antd'

const periods=[
  {key:'2026-05',label:'2026年5月',stats:{checks:28,avgScore:88,pct:93.3,issues:45,highRisk:8,midRisk:20,lowRisk:17,rectified:42,pending:3,rate:93.3}},
  {key:'2026-04',label:'2026年4月',stats:{checks:26,avgScore:86,pct:91.5,issues:52,highRisk:12,midRisk:25,lowRisk:15,rectified:48,pending:4,rate:92.3}},
  {key:'2026-03',label:'2026年3月',stats:{checks:30,avgScore:83,pct:88.7,issues:68,highRisk:18,midRisk:32,lowRisk:18,rectified:62,pending:6,rate:91.2}},
]

const complianceCategories=[
  {name:'证照合规',passed:14,total:16,color:'#3B82F6',items:['食品经营许可证','健康证有效期','排污许可','证照公示']},
  {name:'人员合规',passed:12,total:16,color:'#8B5CF6',items:['健康证核查','岗前晨检','穿戴规范','手部消毒']},
  {name:'环境合规',passed:13,total:16,color:'#10B981',items:['操作区卫生','垃圾分类','消杀记录','仓储规范']},
  {name:'物料合规',passed:11,total:16,color:'#F59E0B',items:['食材保质期','索证索票','冷链记录','进货查验']},
  {name:'设备合规',passed:12,total:16,color:'#EF4444',items:['消毒柜运行','冷库温度','加工设备','维护记录']},
  {name:'操作合规',passed:10,total:16,color:'#EC4899',items:['生熟分开','留样规范','添加剂','加工流程']},
]

const trendMonths=[{m:'1月',score:81,issues:72},{m:'2月',score:83,issues:65},{m:'3月',score:83,issues:68},{m:'4月',score:86,issues:52},{m:'5月',score:88,issues:45}]

const storeRisks=[
  {name:'成都武侯区店',score:68,issues:23,risk:'高风险',focus:'后厨卫生·人员穿戴·消防通道',trend:'持续偏高'},
  {name:'重庆解放碑店',score:72,issues:18,risk:'高风险',focus:'食材存放·垃圾桶管理·收银规范',trend:'近2月持平'},
  {name:'西安钟楼店',score:75,issues:15,risk:'中风险',focus:'留样规范·索证索票·员工培训',trend:'缓慢下降'},
  {name:'武汉楚河汉街店',score:76,issues:14,risk:'中风险',focus:'消杀记录·设备维护·地面清洁',trend:'本月反弹'},
  {name:'青岛万象城店',score:78,issues:12,risk:'中风险',focus:'操作间整洁·垃圾清运·通道畅通',trend:'稳步改善'},
  {name:'开福万达店',score:82,issues:10,risk:'低风险',focus:'细节完善·用品归位·价签核对',trend:'已达标'},
]

const problemTypes=[
  {name:'人员规范',count:12,color:'#3B82F6',trend:'↑',prev:10,items:'健康证·穿戴·晨检'},
  {name:'环境卫生',count:9,color:'#10B981',trend:'↓',prev:12,items:'消杀·清洁·垃圾'},
  {name:'物料采购',count:8,color:'#F59E0B',trend:'→',prev:8,items:'索证·保质期·冷链'},
  {name:'设备设施',count:7,color:'#EF4444',trend:'↓',prev:9,items:'消毒柜·冷库·排烟'},
  {name:'加工操作',count:5,color:'#8B5CF6',trend:'↓',prev:7,items:'生熟分开·留样·添加剂'},
  {name:'仓储管理',count:4,color:'#EC4899',trend:'→',prev:4,items:'离墙离地·温湿度·防鼠'},
]

const coreMetrics=[
  {l:'食品经营许可证',v:'16/16',s:'100%',c:'#10B981'},
  {l:'健康证有效',v:'158/160',s:'98.8%',c:'#F59E0B'},
  {l:'消杀记录完整',v:'24/28',s:'85.7%',c:'#F59E0B'},
  {l:'索证索票齐全',v:'14/16',s:'87.5%',c:'#EF4444'},
  {l:'冷链温度合规',v:'28/30',s:'93.3%',c:'#F59E0B'},
  {l:'留样规范达标',v:'13/16',s:'81.3%',c:'#EF4444'},
  {l:'食品添加剂合规',v:'15/16',s:'93.8%',c:'#F59E0B'},
  {l:'餐厨垃圾规范',v:'14/16',s:'87.5%',c:'#F59E0B'},
]

export const FoodSafetyPrevention: React.FC = () => {
  const [period,setPeriod]=useState('2026-05')
  const p=periods.find(pp=>pp.key===period)||periods[0]
  const s=p.stats
  const maxIssues=Math.max(...problemTypes.map(pt=>pt.count))

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <div className="shrink-0 space-y-3">
        <div><h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-400"/>食安防控</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">月度食安数据总览 · 问题分析 · 风险预警 · 改善计划</p></div>
        <div className="flex items-center gap-3">
          <Select size="middle" value={period} onChange={setPeriod} style={{width:130}} options={periods.map(pp=>({value:pp.key,label:pp.label}))}/>
          <span className="text-[10px] text-[var(--text-muted)]">当前展示为{p.label}数据</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto mt-3 space-y-3">
        {/* 行1: KPI(5卡) + 双列 */}
        <div className="grid grid-cols-5 gap-2">
          {[
            {l:'巡检次数',v:s.checks+'次',c:'#3B82F6',icon:Search,sub:'同比+7.7%'},
            {l:'发现问题',v:s.issues+'个',c:'#EF4444',icon:AlertTriangle,sub:`高${s.highRisk}·中${s.midRisk}·低${s.lowRisk}`},
            {l:'整改完成率',v:s.rate+'%',c:'#10B981',icon:CheckCircle,sub:`${s.rectified}完成·${s.pending}待改`},
            {l:'月均评分',v:s.avgScore+'分',c:'#F59E0B',icon:Award,sub:'环比持续改善'},
            {l:'门店合规率',v:s.pct+'%',c:'#8B5CF6',icon:Target,sub:'日管控达标率'},
          ].map((k,i)=>{const Icon=k.icon;return <div key={i} className="card-level-1 p-3 space-y-1"><div className="flex items-center gap-1.5"><div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{backgroundColor:`${k.c}15`}}><Icon className="w-3 h-3" style={{color:k.c}}/></div><span className="text-[10px] text-[var(--text-muted)]">{k.l}</span></div><div className="text-xl font-bold text-[var(--text-primary)]">{k.v}</div><div className="text-[9px] text-[var(--text-muted)]">{k.sub}</div></div>})}
        </div>

        {/* 行2: 六维合规 + 评分趋势 — 16:9双栏 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card-level-1 p-4 space-y-2.5" style={{aspectRatio:'16/9'}}>
            <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2"><Target className="w-3.5 h-3.5 text-blue-400"/>六维合规评估</div>
            <div className="flex-1 flex flex-col justify-center space-y-2">{complianceCategories.map(c=><div key={c.name} className="space-y-0.5">
              <div className="flex items-center justify-between text-[9px]"><span className="font-medium" style={{color:c.color}}>{c.name}</span><span style={{color:c.color}}>{c.passed}/{c.total} · {Math.round(c.passed/c.total*100)}%</span></div>
              <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:(c.passed/c.total*100)+'%',background:c.color}}/></div>
              <div className="text-[8px] text-[var(--text-muted)] pl-1">{c.items.join(' · ')}</div>
            </div>)}</div>
            <div className="text-[9px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">本月最薄弱：操作合规62.5%、物料合规68.8% — 作为下月重点改善方向</div>
          </div>

          <div className="card-level-1 p-4 space-y-2.5" style={{aspectRatio:'16/9'}}>
            <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 text-green-400"/>月度评分与问题趋势</div>
            <svg viewBox="0 0 300 130" className="flex-1 w-full" preserveAspectRatio="xMidYMid meet">
              {[30,60,90].map(y=><line key={y} x1="30" y1={y} x2="280" y2={y} stroke="var(--border-subtle)" strokeWidth="0.5"/>)};
              <polyline points={trendMonths.map((tm,i)=>`${40+i*50},${115-tm.score*1.05}`).join(' ')} fill="none" stroke="#10B981" strokeWidth="2"/>
              {trendMonths.map((tm,i)=><circle key={'c'+i} cx={40+i*50} cy={115-tm.score*1.05} r="3" fill="#10B981"/>)}
              {trendMonths.map((tm,i)=><rect key={'br'+i} x={35+i*50} y={115-tm.issues} width="8" height={tm.issues} fill="#EF4444" opacity="0.3" rx="1"/>)}
              {trendMonths.map((tm,i)=><text key={'tl'+i} x={40+i*50} y="128" fontSize="7" textAnchor="middle" fill="var(--text-muted)">{tm.m}</text>)}
            </svg>
            <div className="flex items-center gap-6 text-[9px] text-[var(--text-muted)]"><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400"/>评分（线·持续上升）</span><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400 opacity-30"/>问题数（柱·持续下降）</span></div>
          </div>
        </div>

        {/* 行3: 问题分类 + 风险门店 — 16:9双栏 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card-level-1 p-4 space-y-2.5" style={{aspectRatio:'16/9'}}>
            <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5 text-purple-400"/>本月问题分类</div>
            <div className="flex-1 flex flex-col justify-center space-y-2">{problemTypes.map(pt=><div key={pt.name} className="space-y-0.5">
              <div className="flex items-center gap-2"><span className="text-[9px] w-16 text-[var(--text-secondary)]">{pt.name}</span><div className="flex-1 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:(pt.count/maxIssues*100)+'%',background:pt.color}}/></div><span className="text-[9px] font-medium w-6 text-right" style={{color:pt.color}}>{pt.count}</span><span className="text-[8px] w-6 text-right" style={{color:pt.trend==='↑'?'#EF4444':pt.trend==='↓'?'#10B981':'var(--text-muted)'}}>{pt.trend} 较上月{pt.prev}</span></div>
              <div className="text-[8px] text-[var(--text-muted)] pl-16">{pt.items}</div>
            </div>)}</div>
          </div>

          <div className="card-level-1 p-4 space-y-2.5" style={{aspectRatio:'16/9'}}>
            <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5 text-red-400"/>重点关注门店</div>
            <div className="flex-1 overflow-y-auto space-y-1.5">{storeRisks.map(rs=><div key={rs.name} className="p-2 rounded bg-[var(--bg-tertiary)] space-y-1">
              <div className="flex items-center justify-between"><div className="flex items-center gap-1.5"><span className="text-[9px] font-medium text-[var(--text-primary)]">{rs.name}</span><Tag color={rs.risk==='高风险'?'red':rs.risk==='中风险'?'orange':'blue'} style={{fontSize:9,lineHeight:'14px'}}>{rs.risk}</Tag></div><span className="text-[9px] font-medium" style={{color:rs.score>=80?'#10B981':rs.score>=70?'#F59E0B':'#EF4444'}}>{rs.score}分</span></div>
              <div className="flex items-center gap-2 text-[8px] text-[var(--text-muted)]"><span className="text-red-400">{rs.issues}个问题</span><span>重点项：{rs.focus}</span></div>
              <div className="text-[8px]" style={{color:rs.trend.includes('改善')||rs.trend.includes('达标')?'#10B981':rs.trend.includes('持平')?'#F59E0B':'#EF4444'}}>趋势：{rs.trend}</div>
            </div>)}</div>
          </div>
        </div>

        {/* 行4: 核心指标 + 改善计划 — 16:9双栏 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card-level-1 p-4 space-y-2.5" style={{aspectRatio:'16/9'}}>
            <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2"><Eye className="w-3.5 h-3.5 text-orange-400"/>食安核心指标</div>
            <div className="flex-1 grid grid-cols-4 gap-2 content-center">{coreMetrics.map((m,i)=><div key={i} className="bg-[var(--bg-tertiary)] rounded p-2 text-center space-y-0.5">
              <div className="text-[8px] text-[var(--text-muted)] leading-tight">{m.l}</div>
              <div className="text-xs font-bold" style={{color:m.c}}>{m.s}</div>
              <div className="text-[8px] text-[var(--text-muted)]">{m.v}</div>
            </div>)}</div>
          </div>

          <div className="card-level-1 p-4 space-y-2.5" style={{aspectRatio:'16/9'}}>
            <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-purple-400"/>下月重点改善任务</div>
            <table className="w-full text-xs">
              <thead className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]"><tr><td className="py-1 pr-2">#</td><td className="py-1">改善项目</td><td className="py-1 pr-1 text-right">截止</td><td className="py-1">负责人</td></tr></thead>
              <tbody>{[
                {t:'冷链设备全面检修',dd:'06-05',o:'张拓',reason:'上月冷链温度超标8次'},
                {t:'健康证集中换证',dd:'06-10',o:'李建',reason:'上月健康证临期12起'},
                {t:'消杀流程专项培训',dd:'06-15',o:'陈静',reason:'上月消杀记录完整率仅85.7%'},
                {t:'索证索票专项核查',dd:'06-20',o:'王鹏',reason:'上月索证合规率87.5%未达标'},
                {t:'食品留样规范强化',dd:'06-25',o:'刘洋',reason:'上月留样达标率81.3%需提升'},
              ].map((t,i)=><tr key={i} className="border-b border-[var(--border-subtle)]">
                <td className="py-1 pr-2 text-[var(--text-muted)]">{i+1}</td>
                <td className="py-1 font-medium text-[var(--text-primary)]">{t.t}</td>
                <td className="py-1 pr-1 text-right text-[var(--text-secondary)]">{t.dd}</td>
                <td className="py-1 text-[var(--text-secondary)]">{t.o}</td>
              </tr>)}</tbody>
            </table>
            <div className="text-[9px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">每项改善任务均基于本月问题数据确定，标注了具体触发原因</div>
          </div>
        </div>

        {/* ═══ 本月巡检总结 & 下月防控目标 ═══ */}
        <div className="card-level-1 p-5 space-y-4">
          <div className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2"><Zap className="w-4 h-4 text-blue-400"/>{p.label}食安防控总结与下月目标</div>

          {/* 本月总结 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-1">本月巡检总结</h4>
            <div className="text-[10px] text-[var(--text-secondary)] leading-relaxed space-y-1.5">
              <div><span className="text-green-400 font-medium">整体评分 {s.avgScore}分 · 持续改善：</span>本月巡检完成率{s.pct}%，较上月提升{s.pct>=93?'1.8':'0.8'}个百分点。发现{s.issues}个问题中高风险{s.highRisk}个（较上月减少{periods[1].stats.highRisk-s.highRisk}个），中风险{s.midRisk}个，低风险{s.lowRisk}个。整改完成率{s.rate}%为近三月最高水平。</div>
              <div><span className="text-orange-400 font-medium">操作合规与物料管理是最大短板：</span>操作合规合规率62.5%（生熟分开执行不到位占主要），物料合规68.8%（索证索票缺失和冷链记录不全），两项远低于目标值75%。这是本月需重点突破的改善方向。</div>
              <div><span className="text-red-400 font-medium">需重点关注门店：</span>成都武侯区店（68分/23项问题，风险持续偏高）、重庆解放碑店（72分/18项，人员穿戴和食材存放问题反复发生）、西安钟楼店（75分/15项，留样规范和索证索票为顽疾）。</div>
              <div><span className="text-blue-400 font-medium">向好趋势：</span>环境卫生和设备设施问题较上月明显下降（分别-3和-2），消杀流程和冷库维护改善显著。整体评分趋势从81→88分（+7分/5个月），问题数从72→45（-37.5%）。</div>
            </div>
          </div>

          {/* 下月防控目标 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-1">下月重点防控目标</h4>
            <div className="space-y-2">
              {[
                {goal:'操作合规率从62.5%提升至≥75%',detail:'针对生熟分开、食品留样不规范两大高频问题，6月15日前完成全品牌专项培训（负责人：陈静），6月20日起每日AI巡检自动核验生熟分区。目标：操作合规率≥75%、生熟分区违规降为0。',color:'#EF4444'},
                {goal:'物料合规率从68.8%提升至≥80%',detail:'6月25日前完成全品牌索证索票专项核查（负责人：王鹏），冷链温度记录从手动改为IoT设备自动采集覆盖。目标：索证索票合规率≥90%、冷链记录完整率≥95%。',color:'#F59E0B'},
                {goal:'高风险门店降至0家',detail:'对成都武侯区店和重庆解放碑店每周不少于2次专项巡检（负责人：张拓、李建），建立"一店一策"改善计划表并每日跟踪进度。目标：6月底两店评分均提升至≥75分。',color:'#8B5CF6'},
                {goal:'整改完成率从93.3%提升至≥96%',detail:'缩短整改响应周期：轻微问题≤1天、一般问题≤2天、高风险问题≤3天闭环。每日班前会通报超期未整改项。目标：整改完成率96%以上，超期整改0条。',color:'#3B82F6'},
                {goal:'健康证合规率从98.8%提升至100%',detail:'6月10日前完成全品牌健康证集中换证（负责人：李建），建立健康证到期自动提醒机制（提前30天预警）。目标：健康证有效期合规率100%。',color:'#10B981'},
              ].map((g,i)=><div key={i} className="p-3 rounded" style={{background:`${g.color}08`,borderLeft:`3px solid ${g.color}`}}>
                <div className="text-[11px] font-semibold mb-1" style={{color:g.color}}>目标{i+1}：{g.goal}</div>
                <div className="text-[9px] text-[var(--text-secondary)] leading-relaxed">{g.detail}</div>
              </div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
