import React, { useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, Camera, TrendingUp, Building2, Shield, BarChart3, Tag, Wrench, Eye, TrendingDown, Zap } from 'lucide-react'
import { Tag as AntTag, Progress, Tabs } from 'antd'

const PERIODS = [
  { key:'7d', label:'近7日', kpi:{done:31,total:34,rate:'91.2%',violations:23,rectify:'87.5%',online:198}},
  { key:'14d', label:'近14日', kpi:{done:62,total:68,rate:'91.2%',violations:52,rectify:'85.3%',online:196}},
  { key:'30d', label:'近30日', kpi:{done:128,total:136,rate:'94.2%',violations:98,rectify:'88.1%',online:197}},
  { key:'180d', label:'近180天', kpi:{done:756,total:816,rate:'92.6%',violations:568,rectify:'86.7%',online:195}},
]

const CHART_COLORS = ['#EF4444','#F97316','#F59E0B','#EAB308','#8B5CF6','#3B82F6','#10B981','#6366F1','#EC4899','#14B8A6','#84CC16','#06B6D4','#D946EF','#6366F1','#F43F5E']

export const InspectionOverview: React.FC = () => {
  const [period,setPeriod]=useState('30d')
  const p=PERIODS.find(pp=>pp.key===period)||PERIODS[2]

  // 模块1: KPI
  const kpis=[
    { label:'巡检完成率', value:p.kpi.rate, icon:CheckCircle2, color:'#10B981', sub:`${p.kpi.done}/${p.kpi.total}次` },
    { label:'违规数量', value:p.kpi.violations+'条', icon:AlertTriangle, color:'#EF4444', sub:`AI识别${Math.round(p.kpi.violations*0.72)}条·人工${Math.round(p.kpi.violations*0.28)}条` },
    { label:'整改完成率', value:p.kpi.rectify, icon:Clock, color:'#F59E0B', sub:`待整改${Math.round(p.kpi.violations*0.13)}条·逾期${Math.round(p.kpi.violations*0.08)}条` },
    { label:'摄像头在线率', value:(p.kpi.online/200*100).toFixed(1)+'%', icon:Camera, color:'#3B82F6', sub:`在线${p.kpi.online}台/离线${200-p.kpi.online}台` },
  ]

  // 模块2: 违规类型分布（扩展）
  const violations=[
    { name:'后厨未戴厨师帽', count:[15,35,45,268][PERIODS.indexOf(p)], pct:35, color:'#EF4444' },
    { name:'前厅服务未戴口罩', count:[12,22,28,168][PERIODS.indexOf(p)], pct:22, color:'#F97316' },
    { name:'收台不及时', count:[8,15,18,112][PERIODS.indexOf(p)], pct:18, color:'#F59E0B' },
    { name:'地面清洁不到位', count:[6,12,15,95][PERIODS.indexOf(p)], pct:15, color:'#EAB308' },
    { name:'垃圾桶未加盖', count:[5,10,14,82][PERIODS.indexOf(p)], pct:12, color:'#8B5CF6' },
    { name:'消防通道堵塞', count:[4,8,12,68][PERIODS.indexOf(p)], pct:10, color:'#3B82F6' },
    { name:'食材存放不规范', count:[3,7,10,62][PERIODS.indexOf(p)], pct:9, color:'#10B981' },
    { name:'消毒记录缺失', count:[3,6,9,55][PERIODS.indexOf(p)], pct:8, color:'#6366F1' },
    { name:'冷藏温度超标', count:[2,5,8,48][PERIODS.indexOf(p)], pct:7, color:'#EC4899' },
    { name:'餐具破损未更换', count:[2,4,7,42][PERIODS.indexOf(p)], pct:6, color:'#14B8A6' },
    { name:'排烟设备故障', count:[1,3,6,38][PERIODS.indexOf(p)], pct:5, color:'#84CC16' },
    { name:'员工仪容不规范', count:[1,3,5,35][PERIODS.indexOf(p)], pct:5, color:'#06B6D4' },
    { name:'通道积水未清理', count:[1,2,4,28][PERIODS.indexOf(p)], pct:4, color:'#D946EF' },
    { name:'灭蝇灯未运行', count:[0,2,3,22][PERIODS.indexOf(p)], pct:3, color:'#6366F1' },
    { name:'标签标识不规范', count:[0,1,3,18][PERIODS.indexOf(p)], pct:2, color:'#F43F5E' },
  ].filter(v=>v.count>0)
  const maxV=Math.max(...violations.map(v=>v.count))

  // 模块3: 标签维度门店高频问题排行
  const tagProblems=[
    { tag:'后厨卫生', color:'#EF4444', count:[8,15,23,128][PERIODS.indexOf(p)], stores:['成都武侯区店','重庆解放碑店','西安钟楼店','武汉楚河汉街店','青岛万象城店'], top:'后厨未戴厨师帽·垃圾桶未加盖·食材生熟未分离', trend:'↑12%' },
    { tag:'前厅服务', color:'#F97316', count:[6,13,22,98][PERIODS.indexOf(p)], stores:['重庆解放碑店','成都武侯区店','西安钟楼店','梅溪湖步步高店'], top:'未戴口罩·收台不及时·地面清洁不到位', trend:'↑5%' },
    { tag:'消防安全', color:'#F59E0B', count:[5,10,18,88][PERIODS.indexOf(p)], stores:['武汉楚河汉街店','青岛万象城店','成都武侯区店','开福万达店'], top:'消防通道堵塞·灭火器过期·应急灯故障', trend:'↓3%' },
    { tag:'设备管理', color:'#8B5CF6', count:[4,9,15,72][PERIODS.indexOf(p)], stores:['西安钟楼店','重庆解放碑店','成都武侯区店','太平街店'], top:'冷藏温度超标·排烟设备故障·消毒柜异常', trend:'↑8%' },
    { tag:'清洁卫生', color:'#3B82F6', count:[5,8,14,65][PERIODS.indexOf(p)], stores:['青岛万象城店','武汉楚河汉街店','开福万达店','悦方ID店'], top:'地面清洁不到位·通道积水·洗手池不洁', trend:'↓2%' },
    { tag:'人员规范', color:'#10B981', count:[3,6,10,52][PERIODS.indexOf(p)], stores:['重庆解放碑店','西安钟楼店','成都武侯区店'], top:'未穿戴工服·仪容不整·指甲过长', trend:'→0%' },
    { tag:'仓储管理', color:'#6366F1', count:[2,5,8,38][PERIODS.indexOf(p)], stores:['武汉楚河汉街店','开福万达店','德思勤店'], top:'物品未归位·离墙离地不符·温湿度超标', trend:'↑4%' },
    { tag:'食安合规', color:'#EC4899', count:[2,4,7,42][PERIODS.indexOf(p)], stores:['成都武侯区店','西安钟楼店','重庆解放碑店'], top:'消毒记录缺失·留样不规范·添加剂超标', trend:'↓6%' },
  ]

  // 模块4: 区域排行
  const regions=[
    { name:'华中区', score:[94,93,92,90][PERIODS.indexOf(p)], compliance:[96,95,95,93][PERIODS.indexOf(p)], rectify:[89,88,88,86][PERIODS.indexOf(p)], stores:18 },
    { name:'华东区', score:[90,90,89,88][PERIODS.indexOf(p)], compliance:[92,92,91,90][PERIODS.indexOf(p)], rectify:[86,85,85,83][PERIODS.indexOf(p)], stores:22 },
    { name:'西南区', score:[87,86,85,83][PERIODS.indexOf(p)], compliance:[89,88,87,85][PERIODS.indexOf(p)], rectify:[83,82,82,80][PERIODS.indexOf(p)], stores:16 },
    { name:'华南区', score:[84,83,82,81][PERIODS.indexOf(p)], compliance:[84,84,83,82][PERIODS.indexOf(p)], rectify:[79,79,78,76][PERIODS.indexOf(p)], stores:20 },
    { name:'华北区', score:[80,79,78,76][PERIODS.indexOf(p)], compliance:[80,80,79,78][PERIODS.indexOf(p)], rectify:[76,76,75,73][PERIODS.indexOf(p)], stores:14 },
    { name:'西北区', score:[74,73,72,70][PERIODS.indexOf(p)], compliance:[75,75,74,72][PERIODS.indexOf(p)], rectify:[69,69,68,66][PERIODS.indexOf(p)], stores:10 },
  ]

  // 模块5: 巡检周趋势
  const weekTrend=[{w:'W19',score:86.5,issues:18},{w:'W20',score:88.1,issues:15},{w:'W21',score:85.3,issues:22},{w:'W22',score:90.2,issues:12},{w:'W23',score:87.8,issues:19},{w:'W24',score:91.5,issues:10},{w:'W25',score:89.3,issues:14}]
  const maxScore=95,minScore=80

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div><h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2"><BarChart3 className="w-4 h-4"/>数据总览</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">巡检整体指标·违规数据·整改率·设备在线·区域排行·问题趋势</p></div>
        <div className="flex items-center gap-3">
          <Tabs activeKey={period} onChange={setPeriod} size="small" items={PERIODS.map(pp=>({key:pp.key,label:pp.label}))}/>
          <span className="text-[10px] text-[var(--text-muted)]">更新: {new Date().toLocaleString('zh-CN')}</span>
        </div>
      </div>

      {/* 模块1: KPI 卡片 */}
      <div className="grid grid-cols-4 gap-3">
        {kpis.map(k=>{const Icon=k.icon;return <div key={k.label} className="card-level-1 p-4 space-y-2">
          <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{backgroundColor:`${k.color}15`}}><Icon className="w-3.5 h-3.5" style={{color:k.color}}/></div><span className="text-[11px] text-[var(--text-muted)]">{k.label}</span></div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{k.value}</div><div className="text-[10px] text-[var(--text-muted)]">{k.sub}</div></div>})}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 模块2: 违规类型分布（扩展版） */}
        <div className="card-level-1 p-4 flex flex-col">
          <div className="chart-title flex items-center gap-2 shrink-0"><AlertTriangle className="w-3.5 h-3.5 text-red-400"/>违规类型分布</div>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2">{violations.map((t,i)=><div key={i} className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-primary)] w-28 truncate">{t.name}</span>
            <div className="flex-1 h-3 bg-[var(--bg-tertiary)] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:(t.count/maxV*100)+'%',background:t.color}}/></div>
            <span className="text-[10px] font-medium w-8 text-right" style={{color:t.color}}>{t.count}次</span>
          </div>)}</div>
        </div>

        {/* 模块3: 标签维度门店高频问题排行 */}
        <div className="card-level-1 p-4 flex flex-col">
          <div className="chart-title flex items-center gap-2 shrink-0"><Tag className="w-3.5 h-3.5 text-purple-400"/>标签维度·门店高频问题</div>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2">{tagProblems.map((t,i)=><div key={i} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium" style={{color:t.color}}>{t.tag}</span>
              <div className="flex items-center gap-2">
                <span className="text-[9px]" style={{color:t.trend.startsWith('↑')?'#EF4444':t.trend.startsWith('↓')?'#10B981':'var(--text-muted)'}}>{t.trend}</span>
                <span className="text-[10px] font-bold" style={{color:t.color}}>{t.count}次</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:(t.count/Math.max(...tagProblems.map(tp=>tp.count))*100)+'%',background:t.color}}/></div>
            </div>
            <div className="text-[9px] text-[var(--text-muted)]">高频：{t.top}</div>
          </div>)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 模块4: 区域排行 */}
        <div className="card-level-1 p-4 flex flex-col">
          <div className="chart-title flex items-center gap-2 shrink-0"><Building2 className="w-3.5 h-3.5 text-blue-400"/>区域巡检质量排行</div>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2">{regions.map((r,i)=><div key={i} className="flex items-center gap-3 py-1.5 border-b border-[var(--border-subtle)] last:border-0">
            <div className="w-5 h-5 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[10px] font-bold" style={{color:i<3?'#F59E0B':'var(--text-muted)'}}>{i+1}</div>
            <div className="flex-1"><div className="text-xs font-medium text-[var(--text-primary)]">{r.name}<span className="text-[9px] text-[var(--text-muted)] ml-1">{r.stores}店</span></div>
              <div className="flex items-center gap-3 text-[9px] text-[var(--text-muted)] mt-0.5"><span>得分{r.score}</span><span>合规{r.compliance}%</span><span>整改{r.rectify}%</span></div></div>
            <AntTag color={r.score>=90?'green':r.score>=80?'blue':'orange'} style={{fontSize:10}}>{r.score}分</AntTag>
          </div>)}</div>
        </div>

        {/* 模块5: 巡检周趋势 */}
        <div className="card-level-1 p-4 flex flex-col">
          <div className="chart-title flex items-center gap-2 shrink-0"><TrendingUp className="w-3.5 h-3.5 text-green-400"/>巡检评分周趋势</div>
          <div className="flex-1 min-h-0 relative">
            <svg viewBox="0 0 280 100" className="w-full h-full" preserveAspectRatio="none">
              {[minScore,85,90,95].map(v=><line key={v} x1="20" y1={100-(v-minScore)/(maxScore-minScore)*80} x2="270" y2={100-(v-minScore)/(maxScore-minScore)*80} stroke="var(--border-subtle)" strokeWidth="0.5"/>)}
              <polyline points={weekTrend.map((w,i)=>`${20+i*40},${100-(w.score-minScore)/(maxScore-minScore)*80}`).join(' ')} fill="none" stroke="#10B981" strokeWidth="2"/>
              {weekTrend.map((w,i)=><circle key={i} cx={20+i*40} cy={100-(w.score-minScore)/(maxScore-minScore)*80} r="3" fill="#10B981"/>)}
              {weekTrend.map((w,i)=><text key={'l'+i} x={20+i*40} y="97" fontSize="7" textAnchor="middle" fill="var(--text-muted)">{w.w}</text>)}
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-[var(--text-muted)]">{weekTrend.map((w,i)=><span key={i}>{w.score}分</span>)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 模块6: 门店问题排行 */}
        <div className="card-level-1 p-4 flex flex-col">
          <div className="chart-title flex items-center gap-2 shrink-0"><Eye className="w-3.5 h-3.5 text-orange-400"/>门店高频问题 TOP10</div>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5">
            {[{s:'成都武侯区店',c:23,sc:68},{s:'重庆解放碑店',c:18,sc:72},{s:'西安钟楼店',c:15,sc:75},{s:'武汉楚河汉街店',c:14,sc:76},{s:'青岛万象城店',c:12,sc:78},{s:'开福万达店',c:10,sc:82},{s:'太平街店',c:9,sc:84},{s:'梅溪湖步步高店',c:8,sc:85},{s:'悦方ID店',c:6,sc:88},{s:'湖滨银泰店',c:5,sc:90}].map((s,i)=><div key={i} className="flex items-center gap-2">
              <span className="w-4 text-center text-[10px] font-bold" style={{color:i<3?'#EF4444':'var(--text-muted)'}}>{i+1}</span>
              <span className="text-[10px] text-[var(--text-primary)] flex-1">{s.s}</span>
              <span className="text-[10px] text-red-400 font-medium">{s.c}项问题</span>
              <span className="text-[10px] w-10 text-right" style={{color:s.sc>=85?'#10B981':s.sc>=70?'#F59E0B':'#EF4444'}}>{s.sc}分</span>
            </div>)}
          </div>
        </div>

        {/* 模块7: 整改追踪 */}
        <div className="card-level-1 p-4 flex flex-col">
          <div className="chart-title flex items-center gap-2 shrink-0"><Wrench className="w-3.5 h-3.5 text-blue-400"/>整改追踪</div>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
            {[
              {s:'后厨未戴厨师帽',total:45,done:38,days:'1.5天'},
              {s:'前厅服务未戴口罩',total:28,done:26,days:'0.8天'},
              {s:'收台不及时',total:18,done:15,days:'2.1天'},
              {s:'地面清洁不到位',total:15,done:12,days:'1.3天'},
              {s:'消防通道堵塞',total:12,done:10,days:'2.5天'},
              {s:'垃圾桶未加盖',total:14,done:13,days:'0.6天'},
              {s:'食材存放不规范',total:10,done:7,days:'3.2天'},
            ].map((r,i)=><div key={i} className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--text-primary)] w-28 truncate">{r.s}</span>
              <div className="flex-1 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:(r.done/r.total*100)+'%',background:r.done/r.total>=0.9?'#10B981':r.done/r.total>=0.7?'#F59E0B':'#EF4444'}}/></div>
              <span className="text-[10px] font-medium w-8 text-right" style={{color:r.done/r.total>=0.9?'#10B981':r.done/r.total>=0.7?'#F59E0B':'#EF4444'}}>{Math.round(r.done/r.total*100)}%</span>
              <span className="text-[9px] text-[var(--text-muted)] w-10 text-right">{r.days}</span>
            </div>)}
          </div>
        </div>
      </div>

      {/* 模块8: 数据总结 */}
      <div className="card-level-1 p-4 bg-blue-500/5 border border-blue-500/10 space-y-2">
        <div className="chart-title flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-blue-400"/>数据总结</div>
        <div className="text-[10px] text-[var(--text-secondary)] leading-relaxed space-y-1">
          <div>📊 <span className="font-medium text-[var(--text-primary)]">{p.label}巡检概况：</span>共完成{p.kpi.done}次巡检（完成率{p.kpi.rate}），发现{p.kpi.violations}条违规，整改完成率{p.kpi.rectify}。</div>
          <div>🔴 <span className="font-medium text-[var(--text-primary)]">重点关注门店：</span>成都武侯区店（23项问题，68分）、重庆解放碑店（18项，72分）、西安钟楼店（15项，75分）需重点督导。</div>
          <div>🏷️ <span className="font-medium text-[var(--text-primary)]">最高频标签：</span>后厨卫生（23次）连续多个周期位居榜首，建议在全品牌推行后厨标准化专项整治。</div>
          <div>📈 <span className="font-medium text-[var(--text-primary)]">趋势向好：</span>巡检评分周趋势稳步上升（W19:86.5→W24:91.5），整改平均周期从3.2天缩短至1.8天。</div>
        </div>
      </div>
    </div>
  )
}
