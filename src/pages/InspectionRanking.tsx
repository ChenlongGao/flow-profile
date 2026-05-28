import React from 'react'
import { Trophy, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Tag, Progress } from 'antd'

const RANKING = [
  { rank:1, store:'茶颜悦色·IFS国金中心', score:96, compliance:98, rectify:95, issues:2, trend:'up' },
  { rank:2, store:'茶颜悦色·太平街店', score:94, compliance:96, rectify:92, issues:4, trend:'up' },
  { rank:3, store:'茶颜悦色·悦方ID店', score:91, compliance:93, rectify:90, issues:5, trend:'stable' },
  { rank:4, store:'茶颜悦色·德思勤店', score:88, compliance:89, rectify:87, issues:6, trend:'stable' },
  { rank:5, store:'茶颜悦色·开福万达店', score:85, compliance:86, rectify:84, issues:8, trend:'down' },
  { rank:6, store:'茶颜悦色·万家丽店', score:82, compliance:83, rectify:80, issues:9, trend:'down' },
  { rank:7, store:'茶颜悦色·梅溪湖步步高店', score:78, compliance:79, rectify:75, issues:12, trend:'down' },
  { rank:8, store:'茶颜悦色·雨花亭店', score:65, compliance:68, rectify:62, issues:18, trend:'down' },
]

export const InspectionRanking: React.FC = () => (
  <div className="p-6 space-y-4 overflow-y-auto h-full">
    <div><h2 className="text-base font-semibold text-[var(--text-primary)]">门店排行</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">巡检评分排行、合规排行、问题高发门店</p></div>
    <div className="grid grid-cols-3 gap-3 mb-4">
      {[{l:'🥇 综合得分最高',s:'IFS国金中心',v:'96分'},{l:'✅ 合规率最高',s:'IFS国金中心',v:'98%'},{l:'⚠️ 问题最多',s:'雨花亭店',v:'18条'}].map(k=><div key={k.l} className="card-level-1 p-4 text-center"><div className="text-[10px] text-[var(--text-muted)]">{k.l}</div><div className="text-lg font-bold text-[var(--text-primary)] mt-1">{k.v}</div><div className="text-[10px] text-[var(--text-muted)]">{k.s}</div></div>)}</div>
    <div className="card-level-1 overflow-hidden" style={{padding:0}}>
      <table className="w-full text-xs"><thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]"><tr>
        <th className="px-3 py-2.5 text-center">排名</th><th className="px-3 py-2.5 text-left">门店</th><th className="px-3 py-2.5 text-center">综合得分</th><th className="px-3 py-2.5 text-center">合规率</th><th className="px-3 py-2.5 text-center">整改率</th><th className="px-3 py-2.5 text-center">问题数</th><th className="px-3 py-2.5 text-center">趋势</th></tr></thead>
        <tbody>{RANKING.map(r=><tr key={r.rank} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
          <td className="px-3 py-2.5 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold" style={{background:r.rank<=3?'#F59E0B20':'',color:r.rank<=3?'#F59E0B':'var(--text-muted)'}}>{r.rank}</span></td>
          <td className="px-3 py-2.5 font-medium text-[var(--text-primary)]">{r.store}</td>
          <td className="px-3 py-2.5 text-center"><Tag color={r.score>=90?'green':r.score>=80?'blue':'orange'}>{r.score}</Tag></td>
          <td className="px-3 py-2.5 text-center"><Progress percent={r.compliance} size="small" showInfo={false} strokeColor={r.compliance>=90?'#10B981':'#F59E0B'}/><span className="text-[10px] ml-1">{r.compliance}%</span></td>
          <td className="px-3 py-2.5 text-center">{r.rectify}%</td>
          <td className="px-3 py-2.5 text-center"><span style={{color:r.issues>=10?'#EF4444':'var(--text-secondary)'}}>{r.issues}</span></td>
          <td className="px-3 py-2.5 text-center">{r.trend==='up'?'📈':r.trend==='down'?'📉':'➡️'}</td>
        </tr>)}</tbody></table></div>
  </div>
)
