import React from 'react'
import { AlertTriangle, CheckCircle2, Clock, Camera, TrendingUp, Building2, Shield } from 'lucide-react'
import { Tag, Progress } from 'antd'

const KPIS = [
  { label:'巡检完成率', value:'94.2%', icon:CheckCircle2, color:'#10B981', sub:'本月128/136次' },
  { label:'今日违规数量', value:'23条', icon:AlertTriangle, color:'#EF4444', sub:'AI识别18条·人工5条' },
  { label:'整改完成率', value:'87.5%', icon:Clock, color:'#F59E0B', sub:'待整改5条·逾期2条' },
  { label:'摄像头在线率', value:'98.3%', icon:Camera, color:'#3B82F6', sub:'在线118/离线2台' },
]

const TOP_ISSUES = [
  { name:'后厨未戴厨师帽', count:45, pct:35 },
  { name:'前厅服务未戴口罩', count:28, pct:22 },
  { name:'收台不及时', count:18, pct:14 },
  { name:'地面清洁不到位', count:15, pct:12 },
  { name:'仓库物品未归位', count:12, pct:9 },
  { name:'其他违规', count:8, pct:8 },
]

const REGION_RANK = [
  { name:'华中区', score:92, compliance:95, rectify:88 },
  { name:'华东区', score:89, compliance:91, rectify:85 },
  { name:'西南区', score:85, compliance:87, rectify:82 },
  { name:'华南区', score:82, compliance:83, rectify:78 },
  { name:'华北区', score:78, compliance:79, rectify:75 },
  { name:'西北区', score:72, compliance:74, rectify:68 },
]

export const InspectionOverview: React.FC = () => (
  <div className="p-6 space-y-4 overflow-y-auto h-full">
    <div className="flex items-center justify-between">
      <div><h2 className="text-base font-semibold text-[var(--text-primary)]">数据总览</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">巡检整体指标、违规数据、整改率、设备在线统计</p></div>
      <span className="text-[10px] text-[var(--text-muted)]">最后更新: {new Date().toLocaleString('zh-CN')}</span>
    </div>
    <div className="grid grid-cols-4 gap-3">
      {KPIS.map(k=>{const Icon=k.icon;return <div key={k.label} className="card-level-1 p-4 space-y-2">
        <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{backgroundColor:`${k.color}15`}}><Icon className="w-3.5 h-3.5" style={{color:k.color}}/></div><span className="text-[11px] text-[var(--text-muted)]">{k.label}</span></div>
        <div className="text-2xl font-bold text-[var(--text-primary)]">{k.value}</div><div className="text-[10px] text-[var(--text-muted)]">{k.sub}</div></div>
      })}</div>
    <div className="grid grid-cols-2 gap-3">
      <div className="card-level-1 p-4 space-y-3"><div className="chart-title">违规类型分布</div>
        {TOP_ISSUES.map((t,i)=><div key={i} className="flex items-center gap-3"><span className="text-xs text-[var(--text-primary)] w-32 truncate">{t.name}</span><div className="flex-1"><Progress percent={t.pct} size="small" showInfo={false} strokeColor={i===0?'#EF4444':i===1?'#F59E0B':i===2?'#3B82F6':'#6B7280'}/></div><span className="text-[10px] text-[var(--text-muted)] w-10 text-right">{t.count}次</span></div>)}</div>
      <div className="card-level-1 p-4 space-y-3"><div className="chart-title flex items-center gap-1"><Shield className="w-3.5 h-3.5"/>区域巡检质量排行</div>
        {REGION_RANK.map((r,i)=><div key={i} className="flex items-center gap-3 py-1.5 border-b last:border-0"><div className="w-5 h-5 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[10px] font-bold" style={{color:i<3?'#F59E0B':'var(--text-muted)'}}>{i+1}</div><div className="flex-1"><div className="text-xs font-medium text-[var(--text-primary)]">{r.name}</div><div className="flex items-center gap-3 text-[9px] text-[var(--text-muted)] mt-0.5"><span>得分{r.score}</span><span>合规{r.compliance}%</span><span>整改{r.rectify}%</span></div></div><Tag color={r.score>=90?'green':r.score>=80?'blue':'orange'} style={{fontSize:10}}>{r.score}分</Tag></div>)}</div>
    </div>
  </div>
)
