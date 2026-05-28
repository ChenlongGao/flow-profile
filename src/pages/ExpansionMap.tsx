import React, { useState } from 'react'
import { MapPin, Target, Building2, ChevronRight } from 'lucide-react'
import { Tag, Select, Button } from 'antd'

/* ─── 门店分布数据 ─── */
const STORES = [
  { name:'IFS国金中心', city:'长沙', region:'华中区', lng:112.98, lat:28.19, status:'已开', area:80, since:'2024-03' },
  { name:'太平街店', city:'长沙', region:'华中区', lng:112.97, lat:28.19, status:'已开', area:50, since:'2024-06' },
  { name:'德思勤店', city:'长沙', region:'华中区', lng:113.01, lat:28.13, status:'已开', area:65, since:'2024-09' },
  { name:'雨花亭店', city:'长沙', region:'华中区', lng:112.99, lat:28.15, status:'已开', area:55, since:'2025-01' },
  { name:'梅溪湖步步高', city:'长沙', region:'华中区', lng:112.92, lat:28.18, status:'已开', area:70, since:'2025-03' },
  { name:'悦方ID', city:'长沙', region:'华中区', lng:112.97, lat:28.19, status:'已开', area:60, since:'2025-05' },
  { name:'开福万达', city:'长沙', region:'华中区', lng:112.98, lat:28.22, status:'已开', area:75, since:'2025-07' },
  { name:'湖滨银泰', city:'杭州', region:'华东区', lng:120.16, lat:30.24, status:'已开', area:85, since:'2025-09' },
]

const PIPELINE = [
  { name:'武汉江汉路旗舰店', city:'武汉', region:'华中区', lng:114.30, lat:30.59, stage:'即将签约', area:80 },
  { name:'成都太古里店', city:'成都', region:'西南区', lng:104.08, lat:30.65, stage:'深度谈判', area:100 },
  { name:'广州天河城店', city:'广州', region:'华南区', lng:113.32, lat:23.12, stage:'初步接触', area:70 },
  { name:'南京新街口店', city:'南京', region:'华东区', lng:118.78, lat:32.04, stage:'初步接触', area:65 },
  { name:'西安钟楼店', city:'西安', region:'西北区', lng:108.94, lat:34.26, stage:'即将签约', area:75 },
  { name:'深圳万象天地', city:'深圳', region:'华南区', lng:113.95, lat:22.52, stage:'已签约', area:120 },
  { name:'重庆解放碑店', city:'重庆', region:'西南区', lng:106.57, lat:29.56, stage:'深度谈判', area:70 },
  { name:'沈阳中街店', city:'沈阳', region:'华北区', lng:123.46, lat:41.80, stage:'初步接触', area:60 },
]

const stageCfg:Record<string,string> = {'已开':'#10B981','已签约':'#3B82F6','即将签约':'#8B5CF6','深度谈判':'#F59E0B','初步接触':'#EF4444'}

const mapToCanvas = (lng:number, lat:number, w:number, h:number) => {
  const x = ((lng - 104) / (124 - 104)) * (w * 0.85) + w * 0.1
  const y = ((41 - lat) / (41 - 22)) * (h * 0.8) + h * 0.1
  return {x,y}
}

export const ExpansionMap: React.FC = () => {
  const [filter, setFilter] = useState('全部')
  const [showPipeline, setShowPipeline] = useState(true)

  const stores = filter==='全部'?STORES:STORES.filter(s=>s.region===filter)
  const pipelines = showPipeline?PIPELINE:[]

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">拓店地图</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">门店分布 · 商机管线地理视图</p>
      </div>

      <div className="flex items-center gap-3">
        <Select size="middle" value={filter} onChange={setFilter} style={{width:120}}
          options={['全部','华中区','华东区','华南区','西南区','华北区','西北区'].map(r=>({value:r,label:r}))} />
        <div className="flex-1" />
        <Button size="middle" type={showPipeline?'primary':'default'} onClick={()=>setShowPipeline(!showPipeline)}>
          {showPipeline?'隐藏':'显示'}商机管线
        </Button>
      </div>

      <div className="card-level-1 relative" style={{padding:0, aspectRatio:'16/9', overflow:'hidden', background:'#0f172a'}}>
        <svg viewBox="0 0 800 500" className="w-full h-full">
          {/* 简化中国地图轮廓 */}
          <rect x="0" y="0" width="800" height="500" fill="#0f172a" />
          <ellipse cx="560" cy="240" rx="200" ry="180" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="0.5"/>
          <ellipse cx="560" cy="240" rx="160" ry="140" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="0.3"/>
          <ellipse cx="560" cy="240" rx="120" ry="100" fill="none" stroke="rgba(148,163,184,0.05)" strokeWidth="0.3"/>

          {/* 城市标注 */}
          {['北京','上海','广州','成都','武汉','长沙','杭州','西安','重庆','深圳','南京','沈阳'].map((c,i) => {
            const lng = {'北京':116.4,'上海':121.5,'广州':113.3,'成都':104.1,'武汉':114.3,'长沙':113.0,'杭州':120.2,'西安':108.9,'重庆':106.6,'深圳':114.0,'南京':118.8,'沈阳':123.5}[c]||0
            const lat = {'北京':39.9,'上海':31.2,'广州':23.1,'成都':30.6,'武汉':30.6,'长沙':28.2,'杭州':30.3,'西安':34.3,'重庆':29.6,'深圳':22.5,'南京':32.1,'沈阳':41.8}[c]||0
            const {x,y} = mapToCanvas(lng,lat,800,500)
            return <text key={c} x={x} y={y} fontSize="8" fill="rgba(148,163,184,0.3)" textAnchor="middle">{c}</text>
          })}

          {/* 门店标注 */}
          {stores.map(s => {
            const {x,y} = mapToCanvas(s.lng,s.lat,800,500)
            return <g key={s.name}>
              <circle cx={x} cy={y} r="5" fill={stageCfg[s.status]} opacity="0.9"/>
              <circle cx={x} cy={y} r="5" fill={stageCfg[s.status]} opacity="0.3">
                <animate attributeName="r" from="5" to="12" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite"/>
              </circle>
              <text x={x} y={y-8} fontSize="7" fill="rgba(255,255,255,0.7)" textAnchor="middle">{s.name}</text>
            </g>
          })}

          {/* 商机管线 */}
          {pipelines.map(p => {
            const {x,y} = mapToCanvas(p.lng,p.lat,800,500)
            return <g key={p.name}>
              <circle cx={x} cy={y} r="4" fill="none" stroke={stageCfg[p.stage]} strokeWidth="1.5" strokeDasharray="3,2">
                <animate attributeName="stroke-dashoffset" from="0" to="5" dur="1s" repeatCount="indefinite"/>
              </circle>
              <text x={x} y={y-7} fontSize="6" fill={stageCfg[p.stage]} textAnchor="middle">{p.name.includes('·')?p.name.split('·')[1]:p.name}</text>
            </g>
          })}

          {/* 图例 */}
          <g transform="translate(12,460)">
            {Object.entries(stageCfg).map(([k,v],i)=><g key={k} transform={`translate(${i*100},0)`}>
              <circle cx="0" cy="0" r="3" fill={v}/>
              <text x="7" y="3" fontSize="7" fill="rgba(255,255,255,0.5)">{k}</text>
            </g>)}
          </g>
        </svg>
      </div>

      {/* 门店列表 + 商机列表 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-level-1 p-4 space-y-2">
          <div className="chart-title"><Building2 className="w-3.5 h-3.5 inline mr-1"/>已开门店</div>
          {STORES.map(s=><div key={s.name} className="flex items-center gap-3 text-xs border-b border-[var(--border-subtle)] pb-2 last:border-0 last:pb-0">
            <Tag color="green" style={{fontSize:9}}>{s.status}</Tag>
            <span className="flex-1 text-[var(--text-primary)]">{s.name}</span>
            <span className="text-[var(--text-muted)]">{s.city}</span>
            <span className="text-[var(--text-muted)]">{s.area}㎡</span>
            <span className="text-[var(--text-muted)]">{s.since}</span>
          </div>)}
        </div>
        <div className="card-level-1 p-4 space-y-2">
          <div className="chart-title"><Target className="w-3.5 h-3.5 inline mr-1"/>在途商机</div>
          {PIPELINE.map(p=><div key={p.name} className="flex items-center gap-3 text-xs border-b border-[var(--border-subtle)] pb-2 last:border-0 last:pb-0">
            <Tag color={Object.entries(stageCfg).find(([k])=>k===p.stage)?.[1]==='#10B981'?'green':Object.entries(stageCfg).find(([k])=>k===p.stage)?.[1]==='#3B82F6'?'blue':Object.entries(stageCfg).find(([k])=>k===p.stage)?.[1]==='#8B5CF6'?'purple':Object.entries(stageCfg).find(([k])=>k===p.stage)?.[1]==='#F59E0B'?'orange':'red'} style={{fontSize:9}}>{p.stage}</Tag>
            <span className="flex-1 text-[var(--text-primary)]">{p.name}</span>
            <span className="text-[var(--text-muted)]">{p.city}</span>
            <span className="text-[var(--text-muted)]">{p.area}㎡</span>
          </div>)}
        </div>
      </div>
    </div>
  )
}
