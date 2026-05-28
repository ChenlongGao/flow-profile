import React from 'react'
import { TrendingUp, TrendingDown, Users, Store, DollarSign, Activity, ShieldAlert, MapPin, BarChart3, ChevronRight, AlertTriangle, Zap, Building2 } from 'lucide-react'
import { Tag } from 'antd'

/* ═══ 老板视角 · 全景总览 ═══ */
const kpis = [
  { icon: <Store className="w-5 h-5"/>, label: '全部门店', value: '128', sub: '↑3家 本月新开', subColor: '#10B981', color: '#3B82F6' },
  { icon: <Users className="w-5 h-5"/>, label: '日客流总量', value: '16.4万', sub: '环比 +3%', subColor: '#10B981', color: '#8B5CF6' },
  { icon: <DollarSign className="w-5 h-5"/>, label: '日销售额', value: '¥ 468万', sub: '环比 +5%', subColor: '#10B981', color: '#F59E0B' },
  { icon: <Activity className="w-5 h-5"/>, label: '品牌健康均分', value: '86 分', sub: '较上月 +2', subColor: '#10B981', color: '#10B981' },
  { icon: <MapPin className="w-5 h-5"/>, label: '选址兑现率', value: '92%', sub: '↑7pp 达标', subColor: '#10B981', color: '#3B82F6' },
  { icon: <ShieldAlert className="w-5 h-5"/>, label: '风险门店', value: '12 家', sub: '↓3家 较上周', subColor: '#ef4444', color: '#ef4444' },
]

const trendData = {
  days: ['5/1','5/5','5/10','5/15','5/20','5/25'],
  traffic: [15.2, 15.8, 14.5, 16.8, 17.2, 16.4],
  revenue: [420, 438, 410, 468, 482, 468],
}

const regionHealth = [
  { name: '华东', score: 88, stores: 32, color: '#10B981' },
  { name: '西南', score: 84, stores: 28, color: '#3B82F6' },
  { name: '华北', score: 82, stores: 22, color: '#3B82F6' },
  { name: '华南', score: 78, stores: 18, color: '#F59E0B' },
  { name: '华中', score: 75, stores: 16, color: '#F59E0B' },
  { name: '西北', score: 68, stores: 12, color: '#f97316' },
]

const models = [
  {
    title: '选址健康度', icon: <MapPin className="w-6 h-6"/>, color: '#3B82F6', bg: '#3B82F615',
    metrics: [
      { label: '客流兑现率', value: '92%', trend: '↑7pp', up: true },
      { label: 'A级商圈占比', value: '68%', trend: '↑2pp', up: true },
      { label: '竞品密度', value: '2.8家/店', trend: '可控', up: true },
      { label: 'ROI达标率', value: '78%', trend: '↑5pp', up: true },
    ],
    insight: '选址质量持续提升，A级商圈占比增长至68%。全国ROI达标率78%，12家门店回报周期超预期需重点关注。'
  },
  {
    title: '客流健康度', icon: <TrendingUp className="w-6 h-6"/>, color: '#8B5CF6', bg: '#8B5CF615',
    metrics: [
      { label: '日均客流', value: '16.4万', trend: '+3%', up: true },
      { label: '转化率', value: '31%', trend: '+2pp', up: true },
      { label: '客单价', value: '¥28.5', trend: '+¥1.7', up: true },
      { label: '复购率', value: '41%', trend: '+2pp', up: true },
    ],
    insight: '客流与转化双增长。周末客流表现强劲（+5%），工作日略降。客单价稳步提升得益于加价购策略推广。'
  },
  {
    title: '巡检健康度', icon: <ShieldAlert className="w-6 h-6"/>, color: '#10B981', bg: '#10B98115',
    metrics: [
      { label: '品牌均分', value: '86分', trend: '+2', up: true },
      { label: '整改闭环率', value: '89%', trend: '+7pp', up: true },
      { label: '今日问题数', value: '47项', trend: '↓12', up: false },
      { label: '高风险项', value: '0', trend: '零风险', up: true },
    ],
    insight: '巡检质量稳步提升，闭环率89%创新高。商品陈列连续3周居首，已纳入本周专项治理。零高风险门店。'
  },
]

const riskStores = [
  { name: '成都武侯区店', score: 52, level: '危险', issues: '客流不足 + 陈列不合格 + 卫生不达标', color: '#ef4444' },
  { name: '重庆解放碑店', score: 58, level: '危险', issues: '客流不足 + 收银超时频发', color: '#ef4444' },
  { name: '西安钟楼店', score: 61, level: '预警', issues: '工作日客流持续下滑', color: '#f97316' },
  { name: '北京朝阳店', score: 63, level: '预警', issues: '卫生清洁连续2次不达标', color: '#f97316' },
  { name: '上海南京路店', score: 65, level: '预警', issues: '商品陈列未按标准执行', color: '#eab308' },
]

const pipeline = [
  { stage: '在谈', count: 8, color: '#8B5CF6' },
  { stage: '签约', count: 3, color: '#3B82F6' },
  { stage: '装修中', count: 5, color: '#F59E0B' },
  { stage: '即将开业', count: 2, color: '#10B981' },
]

export const OverviewPage: React.FC = () => (
  <div className="h-full overflow-y-auto" style={{ padding: '24px 32px' }}>
    {/* ═══ 标题栏 ═══ */}
    <div className="flex items-center justify-between mb-5">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Building2 className="w-6 h-6 text-[var(--ai-blue-500)]"/>全景总览
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">全品牌运营数据看板 · 选址拓店 → 客流管店 → 巡检治店 三模型联动决策</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <span>数据更新：刚刚</span>
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
      </div>
    </div>

    {/* ═══ 6 KPI 概览卡 ═══ */}
    <div className="grid grid-cols-6 gap-3 mb-5">
      {kpis.map((k, i) => (
        <div key={i} className="card-level-1 p-4 flex flex-col gap-2 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-2">
            <span style={{ color: k.color }}>{k.icon}</span>
            <span className="text-xs text-[var(--text-muted)]">{k.label}</span>
          </div>
          <div className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</div>
          <div className="text-[10px]" style={{ color: k.subColor }}>{k.sub}</div>
        </div>
      ))}
    </div>

    {/* ═══ 图表区：趋势 + 区域 ═══ */}
    <div className="grid grid-cols-2 gap-4 mb-5">
      {/* 客流 & 销售趋势 */}
      <div className="card-level-1 p-4">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4">客流 & 销售额趋势（近30天）</h4>
        <svg viewBox="0 0 420 160" className="w-full" style={{ height: 160 }}>
          {/* grid lines */}
          {[0, 40, 80, 120].map(y => <line key={y} x1={40} y1={y+20} x2={400} y2={y+20} stroke="var(--border-subtle)" strokeWidth="0.5"/>)}
          {/* traffic area */}
          <polygon points="40,140 90,134 140,147 190,124 240,120 290,128 400,80 400,140" fill="#8B5CF620"/>
          <polyline points="40,140 90,134 140,147 190,124 240,120 290,128 400,80" fill="none" stroke="#8B5CF6" strokeWidth="2"/>
          {/* dots */}
          {[[40,140],[90,134],[140,147],[190,124],[240,120],[290,128]].map((p,i) => <circle key={'t'+i} cx={p[0]} cy={p[1]} r="3" fill="#8B5CF6"/>)}
          {/* revenue line */}
          <polyline points="40,100 90,96 140,110 190,85 240,78 290,90 400,60" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4,3"/>
          {[[40,100],[90,96],[140,110],[190,85],[240,78],[290,90]].map((p,i) => <circle key={'r'+i} cx={p[0]} cy={p[1]} r="3" fill="#F59E0B"/>)}
          {/* labels */}
          <text x={400} y={86} fontSize="9" fill="#8B5CF6">客流</text>
          <text x={400} y={66} fontSize="9" fill="#F59E0B">销售</text>
          {trendData.days.map((d, i) => <text key={d} x={40 + i * 50} y={155} fontSize="8" textAnchor="middle" fill="var(--text-muted)">{d}</text>)}
        </svg>
      </div>
      {/* 区域健康度 */}
      <div className="card-level-1 p-4">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4">区域健康度排名</h4>
        <div className="space-y-2">
          {regionHealth.map((r, i) => (
            <div key={r.name} className="flex items-center gap-3">
              <span className="text-[10px] text-[var(--text-muted)] w-8 text-right">#{i+1}</span>
              <span className="text-xs w-10 font-medium text-[var(--text-primary)]">{r.name}</span>
              <div className="flex-1 h-3 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                <div className="h-full rounded-full flex items-center justify-end pr-1.5" style={{ width: r.score + '%', background: `linear-gradient(90deg, ${r.color}, ${r.color}88)` }}>
                  <span className="text-[8px] text-white font-medium">{r.score}</span>
                </div>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] w-10">{r.stores}店</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* ═══ 三模型健康度 ═══ */}
    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">模型诊店 · 三模型健康度</h4>
    <div className="grid grid-cols-3 gap-4 mb-5">
      {models.map((m, i) => (
        <div key={i} className="card-level-1 overflow-hidden" style={{ padding: 0 }}>
          <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] flex items-center gap-2" style={{ background: m.bg }}>
            <span style={{ color: m.color }}>{m.icon}</span>
            <span className="text-xs font-semibold" style={{ color: m.color }}>{m.title}</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {m.metrics.map((mt, j) => (
                <div key={j} className="bg-[var(--bg-tertiary)] rounded p-2 text-center">
                  <div className="text-[9px] text-[var(--text-muted)]">{mt.label}</div>
                  <div className="text-sm font-bold mt-0.5" style={{ color: m.color }}>{mt.value}</div>
                  <div className={`text-[8px] mt-0.5 ${mt.up ? 'text-green-400' : 'text-red-400'}`}>{mt.trend}</div>
                </div>
              ))}
            </div>
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-2.5 text-[10px] text-[var(--text-secondary)] leading-relaxed flex items-start gap-1.5">
              <Zap className="w-3 h-3 text-blue-400 shrink-0 mt-0.5"/>
              <span>{m.insight}</span>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* ═══ 门店排行榜 + 动态标签 ═══ */}
    <div className="grid grid-cols-2 gap-4 mb-5">
      {/* 销售额 TOP 10 */}
      <div className="card-level-1 p-4">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#F59E0B]"/>门店销售额 TOP 10
        </h4>
        <div className="space-y-1.5">
          {[
            { name: '成都春熙路店', val: '¥ 8.6万', pct: 100 },
            { name: '北京国贸店', val: '¥ 8.2万', pct: 95 },
            { name: '上海南京路店', val: '¥ 7.8万', pct: 91 },
            { name: '广州天河城店', val: '¥ 7.2万', pct: 84 },
            { name: '杭州西湖店', val: '¥ 6.8万', pct: 79 },
            { name: '重庆解放碑店', val: '¥ 6.4万', pct: 74 },
            { name: '深圳华强北店', val: '¥ 6.1万', pct: 71 },
            { name: '武汉光谷店', val: '¥ 5.8万', pct: 67 },
            { name: '成都天府店', val: '¥ 5.5万', pct: 64 },
            { name: '南京鼓楼店', val: '¥ 5.2万', pct: 60 },
          ].map((s, i) => (
            <div key={s.name} className="flex items-center gap-2">
              <span className={`w-5 text-center text-[10px] font-bold ${i < 3 ? 'text-[#F59E0B]' : 'text-[var(--text-muted)]'}`}>{i + 1}</span>
              <span className="text-[10px] text-[var(--text-primary)] w-24 truncate">{s.name}</span>
              <div className="flex-1 h-2.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: s.pct + '%', background: 'linear-gradient(90deg, #F59E0B, #fbbf24)' }}/>
              </div>
              <span className="text-[10px] font-medium text-[var(--text-primary)] w-14 text-right">{s.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 巡检评分 TOP 10 */}
      <div className="card-level-1 p-4">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#10B981]"/>巡检合规 TOP 10
        </h4>
        <div className="space-y-1.5">
          {[
            { name: '北京朝阳店', val: '96分', pct: 100, trend: '↑' },
            { name: '上海浦东店', val: '94分', pct: 98, trend: '↑' },
            { name: '深圳南山店', val: '93分', pct: 97, trend: '→' },
            { name: '杭州钱江店', val: '92分', pct: 96, trend: '↑' },
            { name: '成都IFS店', val: '91分', pct: 95, trend: '→' },
            { name: '广州珠江新城店', val: '90分', pct: 94, trend: '↑' },
            { name: '武汉汉口店', val: '89分', pct: 93, trend: '↓' },
            { name: '南京新街口店', val: '88分', pct: 92, trend: '→' },
            { name: '重庆观音桥店', val: '87分', pct: 91, trend: '↑' },
            { name: '西安钟楼店', val: '86分', pct: 90, trend: '→' },
          ].map((s, i) => (
            <div key={s.name} className="flex items-center gap-2">
              <span className={`w-5 text-center text-[10px] font-bold ${i < 3 ? 'text-[#10B981]' : 'text-[var(--text-muted)]'}`}>{i + 1}</span>
              <span className="text-[10px] text-[var(--text-primary)] w-24 truncate">{s.name}</span>
              <div className="flex-1 h-2.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: s.pct + '%', background: 'linear-gradient(90deg, #10B981, #34d399)' }}/>
              </div>
              <span className="text-[10px] font-medium text-[var(--text-primary)] w-10 text-right">{s.val}</span>
              <span className={`text-[10px] w-4 text-center ${
                s.trend === '↑' ? 'text-green-400' : s.trend === '↓' ? 'text-red-400' : 'text-[var(--text-muted)]'
              }`}>{s.trend}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 门店动态标签 */}
      <div className="card-level-1 p-4">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#8B5CF6]"/>门店动态标签
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--bg-tertiary)] rounded-lg p-3 text-center">
            <div className="text-[10px] text-[var(--text-muted)]">客流趋势</div>
            <div className="flex justify-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-400/10 text-green-400">↑ 上升 42店</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-secondary)] text-[var(--text-muted)]">→ 持平 68店</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-400/10 text-red-400">↓ 下降 18店</span>
            </div>
          </div>
          <div className="bg-[var(--bg-tertiary)] rounded-lg p-3 text-center">
            <div className="text-[10px] text-[var(--text-muted)]">门店阶段</div>
            <div className="flex justify-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-400/10 text-[#3B82F6]">新店 8</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-400/10 text-green-400">成长期 34</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-400/10 text-[#8B5CF6]">成熟期 72</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-orange-400/10 text-orange-400">衰退期 14</span>
            </div>
          </div>
          <div className="bg-[var(--bg-tertiary)] rounded-lg p-3 text-center">
            <div className="text-[10px] text-[var(--text-muted)]">巡检标签</div>
            <div className="flex justify-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-400/10 text-green-400">优秀 56</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-400/10 text-yellow-600">待改进 22</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-400/10 text-red-400">不达标 8</span>
            </div>
          </div>
          <div className="bg-[var(--bg-tertiary)] rounded-lg p-3 text-center">
            <div className="text-[10px] text-[var(--text-muted)]">竞品预警</div>
            <div className="flex justify-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-400/10 text-red-400">受冲击 12</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-400/10 text-yellow-600">需关注 18</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-400/10 text-green-400">稳定 98</span>
            </div>
          </div>
        </div>
      </div>

      {/* 门店健康度分布 */}
      <div className="card-level-1 p-4">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#3B82F6]"/>门店健康度分布
        </h4>
        <div className="space-y-2">
          {[{ label: '优秀 (≥90)', count: 18, pct: 14, color: '#10B981' },
            { label: '良好 (80-89)', count: 42, pct: 33, color: '#3B82F6' },
            { label: '一般 (70-79)', count: 38, pct: 30, color: '#F59E0B' },
            { label: '预警 (60-69)', count: 18, pct: 14, color: '#f97316' },
            { label: '危险 (<60)', count: 12, pct: 9, color: '#ef4444' },
          ].map((b, i) => (
            <div key={b.label} className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--text-muted)] w-24">{b.label}</span>
              <div className="flex-1 h-3 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                <div className="h-full rounded-full flex items-center justify-end pr-1.5" style={{ width: b.pct * 1.2 + '%', background: b.color + '30', borderRight: '2px solid ' + b.color }}>
                  <span className="text-[9px] font-medium" style={{ color: b.color }}>{b.count}店</span>
                </div>
              </div>
              <span className="text-[10px] font-medium" style={{ color: b.color, width: 30, textAlign: 'right' }}>{b.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* ═══ 底部：风险预警 + 进度 ═══ */}
    <div className="grid grid-cols-2 gap-4 mb-5">
      {/* 风险预警 TOP 5 */}
      <div className="card-level-1 overflow-hidden" style={{ padding: 0 }}>
        <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400"/>风险预警 TOP 5
          </span>
          <span className="text-[10px] text-[var(--ai-blue-500)] cursor-pointer flex items-center gap-1">查看全部 <ChevronRight className="w-3 h-3"/></span>
        </div>
        <table className="w-full text-xs">
          <thead className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
            <tr>
              <td className="px-4 py-1.5">门店</td>
              <td className="px-3 py-1.5 text-center">健康度</td>
              <td className="px-3 py-1.5 w-12 text-center">等级</td>
              <td className="px-4 py-1.5">主要问题</td>
            </tr>
          </thead>
          <tbody>
            {riskStores.map((r, i) => (
              <tr key={i} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                <td className="px-4 py-2 font-medium text-[var(--text-primary)]">{r.name}</td>
                <td className="px-3 py-2 text-center font-bold" style={{ color: r.color }}>{r.score}</td>
                <td className="px-3 py-2 text-center"><Tag color={r.level === '危险' ? 'red' : r.level === '预警' ? 'orange' : 'gold'} style={{ fontSize: 10 }}>{r.level}</Tag></td>
                <td className="px-4 py-2 text-[var(--text-secondary)]" style={{ fontSize: 10 }}>{r.issues}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 拓店 & 整改进度 */}
      <div className="space-y-4">
        <div className="card-level-1 p-4">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">选址拓店 Pipeline</h4>
          <div className="flex items-center gap-0">
            {pipeline.map((p, i) => (
              <React.Fragment key={p.stage}>
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold" style={{ color: p.color }}>{p.count}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-1">{p.stage}</div>
                </div>
                {i < pipeline.length - 1 && (
                  <div className="flex items-center px-1">
                    <svg width="24" height="12" className="text-[var(--border-subtle)]"><line x1="0" y1="6" x2="20" y2="6" stroke="var(--border-subtle)" strokeWidth="1"/><polygon points="20,3 24,6 20,9" fill="var(--border-subtle)"/></svg>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="card-level-1 p-4">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">巡检整改闭环</h4>
          <div className="flex items-center gap-6">
            <svg viewBox="0 0 80 80" width="80" height="80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="var(--bg-tertiary)" strokeWidth="8"/>
              <circle cx="40" cy="40" r="34" fill="none" stroke="#10B981" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 34} strokeDashoffset={2 * Math.PI * 34 * 0.11} transform="rotate(-90 40 40)"/>
              <text x="40" y="38" textAnchor="middle" fill="var(--text-primary)" fontSize="16" fontWeight="bold">89%</text>
              <text x="40" y="52" textAnchor="middle" fill="var(--text-muted)" fontSize="8">闭环率</text>
            </svg>
            <div className="flex-1 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">即时整改</span><span className="text-green-400 font-medium">78%</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">24h内闭环</span><span className="text-[var(--text-primary)]">11%</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">超3天未闭环</span><span className="text-orange-400 font-medium">8%</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">超7天未闭环</span><span className="text-red-400 font-medium">3%</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* ═══ 模块快捷入口 ═══ */}
    <div className="card-level-1 p-4 bg-gradient-to-r from-blue-500/3 via-purple-500/3 to-emerald-500/3 border border-[var(--border-subtle)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--text-primary)]">快捷跳转</span>
        <span className="text-[10px] text-[var(--text-muted)]">点击进入各模块详情</span>
      </div>
      <div className="grid grid-cols-5 gap-3 mt-3">
        {[
          { label: '诊店总览', desc: '全品牌健康度', icon: <Activity className="w-5 h-5" />, color: '#3B82F6', hash: 'zhendian-overview-main' },
          { label: '单店诊断', desc: '深度剖析单店', icon: <BarChart3 className="w-5 h-5" />, color: '#8B5CF6', hash: 'zhendian-store-diag' },
          { label: '客流管店', desc: '客流·转化·销售', icon: <TrendingUp className="w-5 h-5" />, color: '#10B981', hash: 'zhendian-overview-main' },
          { label: '巡检治店', desc: '合规·质量·安全', icon: <ShieldAlert className="w-5 h-5" />, color: '#F59E0B', hash: 'inspection-overview' },
          { label: '选址拓店', desc: '商圈·兑现·ROI', icon: <MapPin className="w-5 h-5" />, color: '#ef4444', hash: 'location-dashboard-overview' },
        ].map((item, i) => (
          <div key={i} className="bg-[var(--bg-secondary)] rounded-lg p-3 cursor-pointer hover:shadow-md transition-all border border-[var(--border-subtle)] hover:border-[var(--ai-blue-500)] text-center"
            onClick={() => window.location.hash = '#' + item.hash}>
            <div className="flex justify-center mb-1.5" style={{ color: item.color }}>{item.icon}</div>
            <div className="text-xs font-medium text-[var(--text-primary)]">{item.label}</div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="text-center py-6 text-[10px] text-[var(--text-muted)]">
      云盯科技 · 智慧餐饮平台 · 品牌级数据智能决策系统 v1.0
    </div>
  </div>
)
