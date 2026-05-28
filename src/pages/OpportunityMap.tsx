import React, { useState } from 'react'
import { MapPin, Target, BriefcaseBusiness, ChevronRight } from 'lucide-react'
import { Tag, Select, Button } from 'antd'

const PIPELINE = [
  { name:'武汉江汉路旗舰店', city:'武汉', region:'华中区', lng:114.30, lat:30.59, stage:'即将签约', area:80, invest:280, person:'张拓', expectSign:'2026-06-15' },
  { name:'成都太古里店', city:'成都', region:'西南区', lng:104.08, lat:30.65, stage:'深度谈判', area:100, invest:350, person:'李建', expectSign:'2026-07-01' },
  { name:'广州天河城店', city:'广州', region:'华南区', lng:113.32, lat:23.12, stage:'初步接触', area:70, invest:220, person:'王敏', expectSign:'2026-08-01' },
  { name:'南京新街口店', city:'南京', region:'华东区', lng:118.78, lat:32.04, stage:'初步接触', area:65, invest:200, person:'赵强', expectSign:'2026-09-01' },
  { name:'西安钟楼店', city:'西安', region:'西北区', lng:108.94, lat:34.26, stage:'即将签约', area:75, invest:260, person:'吴婷', expectSign:'2026-06-30' },
  { name:'深圳万象天地', city:'深圳', region:'华南区', lng:113.95, lat:22.52, stage:'已签约', area:120, invest:400, person:'张拓', expectSign:'2026-05-20' },
  { name:'重庆解放碑店', city:'重庆', region:'西南区', lng:106.57, lat:29.56, stage:'深度谈判', area:70, invest:220, person:'李建', expectSign:'-' },
  { name:'沈阳中街店', city:'沈阳', region:'华北区', lng:123.46, lat:41.80, stage:'初步接触', area:60, invest:180, person:'陈丽', expectSign:'2026-10-01' },
  { name:'厦门中山路店', city:'厦门', region:'华东区', lng:118.09, lat:24.45, stage:'深度谈判', area:90, invest:320, person:'王敏', expectSign:'2026-08-15' },
  { name:'郑州大卫城店', city:'郑州', region:'华中区', lng:113.66, lat:34.76, stage:'即将签约', area:80, invest:250, person:'赵强', expectSign:'2026-07-15' },
  { name:'昆明恒隆广场店', city:'昆明', region:'西南区', lng:102.72, lat:25.04, stage:'初步接触', area:75, invest:210, person:'吴婷', expectSign:'2026-11-01' },
  { name:'青岛万象城店', city:'青岛', region:'华北区', lng:120.36, lat:36.07, stage:'深度谈判', area:85, invest:290, person:'陈丽', expectSign:'2026-09-15' },
]

const stageColor:Record<string,string> = {'已签约':'#10B981','即将签约':'#8B5CF6','深度谈判':'#F59E0B','初步接触':'#EF4444','已流失':'#6B7280'}

const mapToCanvas = (lng:number, lat:number, w:number, h:number) => {
  const x = ((lng - 100) / (126 - 100)) * (w * 0.82) + w * 0.12
  const y = ((42 - lat) / (42 - 22)) * (h * 0.78) + h * 0.1
  return {x,y}
}

export const OpportunityMap: React.FC = () => {
  const [filter, setFilter] = useState('全部')

  const filtered = filter==='全部'?PIPELINE:PIPELINE.filter(p=>p.stage===filter||p.region===filter)

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">商机地图</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">在途商机地理分布 · 标签着色</p>
      </div>

      <div className="flex items-center gap-3">
        <Select size="middle" value={filter} onChange={setFilter} style={{width:140}}
          options={['全部','华中区','华东区','华南区','西南区','华北区','西北区','即将签约','深度谈判','初步接触'].map(r=>({value:r,label:r}))} />
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          {Object.entries(stageColor).map(([k,v])=><span key={k} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{background:v}}/>{k}</span>)}
        </div>
      </div>

      <div className="card-level-1 relative" style={{padding:0, aspectRatio:'16/9', overflow:'hidden', background:'#0f172a'}}>
        <svg viewBox="0 0 800 500" className="w-full h-full">
          <rect width="800" height="500" fill="#0f172a"/>

          {['北京','上海','广州','成都','武汉','长沙','杭州','西安','重庆','深圳','南京','沈阳','厦门','郑州','昆明','青岛'].map(c => {
            const lng = {'北京':116.4,'上海':121.5,'广州':113.3,'成都':104.1,'武汉':114.3,'长沙':113.0,'杭州':120.2,'西安':108.9,'重庆':106.6,'深圳':114.0,'南京':118.8,'沈阳':123.5,'厦门':118.1,'郑州':113.7,'昆明':102.7,'青岛':120.4}[c]||0
            const lat = {'北京':39.9,'上海':31.2,'广州':23.1,'成都':30.6,'武汉':30.6,'长沙':28.2,'杭州':30.3,'西安':34.3,'重庆':29.6,'深圳':22.5,'南京':32.1,'沈阳':41.8,'厦门':24.5,'郑州':34.8,'昆明':25.0,'青岛':36.1}[c]||0
            const {x,y} = mapToCanvas(lng,lat,800,500)
            return <text key={c} x={x} y={y} fontSize="8" fill="rgba(148,163,184,0.25)" textAnchor="middle">{c}</text>
          })}

          {filtered.map(p => {
            const {x,y} = mapToCanvas(p.lng,p.lat,800,500)
            const sc = stageColor[p.stage]
            return <g key={p.name}>
              <line x1={x} y1={y} x2={x} y2={y-18} stroke={sc} strokeWidth="0.5" opacity="0.4"/>
              <rect x={x-30} y={y-30} width="60" height="12" rx="2" fill="rgba(15,23,42,0.9)"/>
              <text x={x} y={y-21} fontSize="6" fill={sc} textAnchor="middle">{p.name.includes('·')?p.name.split('·')[1]:p.name}</text>
              <circle cx={x} cy={y} r="6" fill={sc} opacity="0.8"/>
              <text x={x} y={y+3} fontSize="6" fill="#fff" textAnchor="middle" fontWeight="bold">¥{p.invest}w</text>
            </g>
          })}
        </svg>
      </div>

      {/* 商机卡片 */}
      <div className="grid grid-cols-3 gap-3">
        {filtered.map(p => {
          const sc = stageColor[p.stage]
          return <div key={p.name} className="card-level-1 p-3 space-y-1.5">
            <div className="flex items-center gap-2"><Tag color={p.stage==='已签约'?'green':p.stage==='即将签约'?'purple':p.stage==='深度谈判'?'orange':'red'} style={{fontSize:9}}>{p.stage}</Tag><span className="text-xs font-medium text-[var(--text-primary)] truncate">{p.name}</span></div>
            <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
              <span>{p.city}</span><span>{p.area}㎡</span><span>¥{p.invest}万</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
              <span>{p.person}负责</span><span>预计{p.expectSign}</span>
            </div>
          </div>
        })}
      </div>
    </div>
  )
}
