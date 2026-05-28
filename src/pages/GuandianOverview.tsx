import React from 'react'
import { TrendingUp, Users, DollarSign, ShoppingCart, Eye, BarChart3, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'
import { Tag } from 'antd'

/* ═══ 客流管店 · 经营总览 ═══ */
const kpis = [
  { label: '日客流总量', value: '16.4万', sub: '环比 +3%', color: '#8B5CF6', icon: <Users className="w-5 h-5"/> },
  { label: '转化率', value: '31%', sub: '较上周 +2pp', color: '#10B981', icon: <Activity className="w-5 h-5"/> },
  { label: '日销售额', value: '¥468万', sub: '环比 +5%', color: '#F59E0B', icon: <DollarSign className="w-5 h-5"/> },
  { label: '客单价', value: '¥28.5', sub: '较上月 +¥1.7', color: '#3B82F6', icon: <ShoppingCart className="w-5 h-5"/> },
]

const regionFlow = [
  { region: '华东', avg: '2.8万', trend: '↑', pct: 8, stores: 32 },
  { region: '西南', avg: '2.4万', trend: '↑', pct: 5, stores: 28 },
  { region: '华北', avg: '2.1万', trend: '→', pct: 0, stores: 22 },
  { region: '华南', avg: '1.9万', trend: '↓', pct: 3, stores: 18 },
  { region: '华中', avg: '1.6万', trend: '↓', pct: 6, stores: 16 },
  { region: '西北', avg: '1.2万', trend: '→', pct: 1, stores: 12 },
]

export const GuandianOverview: React.FC = () => (
  <div className="h-full overflow-y-auto p-6 space-y-5">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2"><Eye className="w-4 h-4"/>经营总览</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">客流 · 转化 · 销售 · 经营指标全景</p>
      </div>
      <span className="text-[11px] text-[var(--text-muted)]">数据更新：实时</span>
    </div>

    {/* KPI 卡 */}
    <div className="grid grid-cols-4 gap-3">
      {kpis.map((k, i) => (
        <div key={i} className="card-level-1 p-4 flex flex-col gap-2 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-2">
            <span style={{ color: k.color }}>{k.icon}</span>
            <span className="text-xs text-[var(--text-muted)]">{k.label}</span>
          </div>
          <div className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</div>
          <div className="text-[10px] text-[var(--text-muted)]">{k.sub}</div>
        </div>
      ))}
    </div>

    {/* 客流趋势 + 转化漏斗 */}
    <div className="grid grid-cols-2 gap-4">
      <div className="card-level-1 p-4">
        <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-3">客流趋势（近7天）</h4>
        <svg viewBox="0 0 360 120" className="w-full" style={{ height: 120 }}>
          {[0,30,60,90].map(y => <line key={y} x1={10} y1={y+10} x2={350} y2={y+10} stroke="var(--border-subtle)" strokeWidth="0.5"/>)}
          <polygon points="10,70 60,62 110,55 160,50 210,45 260,38 310,32 350,25 350,70" fill="#8B5CF610"/>
          <polyline points="10,70 60,62 110,55 160,50 210,45 260,38 310,32 350,25" fill="none" stroke="#8B5CF6" strokeWidth="2"/>
          {[[60,62],[160,50],[260,38],[350,25]].map((p,i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#8B5CF6"/>)}
          {['周一','周三','周五','周日'].map((d,i) => <text key={d} x={60+i*100} y={110} fontSize="8" textAnchor="middle" fill="var(--text-muted)">{d}</text>)}
        </svg>
      </div>
      <div className="card-level-1 p-4">
        <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-3">转化漏斗</h4>
        <div className="space-y-3">
          {[{l:'过店客流',v:'52万/天',pct:100,c:'#8B5CF6'},{l:'进店率',v:'72%',pct:72,c:'#3B82F6'},{l:'选购率',v:'68%',pct:68*0.72,c:'#10B981'},{l:'成交率',v:'31%',pct:31*0.72,c:'#F59E0B'}].map((f,i) => (
            <div key={f.l} className="space-y-1">
              <div className="flex justify-between text-[10px]"><span className="text-[var(--text-muted)]">{f.l}</span><span className="font-medium" style={{color:f.c}}>{f.v}</span></div>
              <div className="h-2.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{width:(Math.max(15,f.pct))+'%',background:`linear-gradient(90deg,${f.c},${f.c}88)`}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* 区域客流 + 销售排行 */}
    <div className="grid grid-cols-2 gap-4">
      <div className="card-level-1 p-4">
        <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-3">区域客流概览</h4>
        <div className="space-y-2">
          {regionFlow.map((r, i) => (
            <div key={r.region} className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--text-muted)] w-8">{r.region}</span>
              <div className="flex-1 h-2.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{width:(parseFloat(r.avg)*15)+'%',background:'#8B5CF6'}}/>
              </div>
              <span className="text-[10px] font-medium w-12 text-right" style={{color:r.trend==='↑'?'#10B981':r.trend==='↓'?'#ef4444':'var(--text-muted)'}}>
                {r.trend} {r.pct}%
              </span>
              <span className="text-[10px] text-[var(--text-muted)] w-8 text-right">{r.stores}店</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card-level-1 p-4">
        <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-3">门店销售排行 Top 8</h4>
        {[
          { name: '成都春熙路店', value: '¥8.6万', up: true },
          { name: '北京国贸店', value: '¥8.2万', up: true },
          { name: '上海南京路店', value: '¥7.8万', up: true },
          { name: '广州天河城店', value: '¥7.2万', up: false },
          { name: '杭州西湖店', value: '¥6.8万', up: true },
          { name: '重庆解放碑店', value: '¥6.4万', up: false },
          { name: '深圳华强北店', value: '¥6.1万', up: true },
          { name: '武汉光谷店', value: '¥5.8万', up: false },
        ].map((s, i) => (
          <div key={s.name} className="flex items-center gap-2 py-0.5">
            <span className={`w-5 text-center text-[10px] font-bold ${i<3?'text-[#F59E0B]':'text-[var(--text-muted)]'}`}>{i+1}</span>
            <span className="text-[11px] text-[var(--text-primary)] flex-1">{s.name}</span>
            <span className="text-[11px] font-medium text-[var(--text-primary)]">{s.value}</span>
            {s.up ? <ArrowUpRight className="w-3 h-3 text-green-400"/> : <ArrowDownRight className="w-3 h-3 text-red-400"/>}
          </div>
        ))}
      </div>
    </div>

    {/* 新老客 + 时段 */}
    <div className="grid grid-cols-2 gap-4">
      <div className="card-level-1 p-4">
        <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-3">新老客结构</h4>
        <div className="flex items-center justify-center gap-8">
          <svg viewBox="0 0 100 100" width="100" height="100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--bg-tertiary)" strokeWidth="12"/>
            <circle cx="50" cy="50" r="40" fill="none" stroke="#3B82F6" strokeWidth="12" strokeLinecap="round"
              strokeDasharray={2*Math.PI*40} strokeDashoffset={2*Math.PI*40*0.72} transform="rotate(-90 50 50)"/>
            <text x="50" y="46" textAnchor="middle" fill="#3B82F6" fontSize="16" fontWeight="bold">28%</text>
            <text x="50" y="60" textAnchor="middle" fill="var(--text-muted)" fontSize="9">新客</text>
          </svg>
          <div className="space-y-3 text-xs">
            <div><span className="text-[var(--text-muted)]">老客占比</span><div className="text-lg font-bold text-[#10B981]">72%</div></div>
            <div><span className="text-[var(--text-muted)]">会员活跃率</span><div className="text-lg font-bold text-[#F59E0B]">62%</div></div>
            <div><span className="text-[var(--text-muted)]">复购率</span><div className="text-lg font-bold text-[#3B82F6]">41%</div></div>
          </div>
        </div>
      </div>
      <div className="card-level-1 p-4">
        <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-3">时段客流分布</h4>
        <div className="space-y-2">
          {[{t:'10-12点',v:280,c:'#8B5CF6'},{t:'12-14点',v:420,c:'#3B82F6'},{t:'14-18点',v:320,c:'#10B981'},{t:'18-22点',v:260,c:'#F59E0B'}].map((h,i) => (
            <div key={h.t} className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--text-muted)] w-14">{h.t}</span>
              <div className="flex-1 h-2.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{width:(h.v/500*100)+'%',background:h.c}}/>
              </div>
              <span className="text-[10px] font-medium w-8 text-right" style={{color:h.c}}>{h.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)
