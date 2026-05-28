import React, { useState } from 'react'
import { Database, Cloud, CalendarDays, Video, ShoppingCart, ListOrdered, Shield, Building2, Map } from 'lucide-react'
import { FlowApiConfig } from './FlowApiConfig'
import { WeatherConfig } from './WeatherConfig'
import { VideoApiConfig } from './VideoApiConfig'
import { OrderApiConfig } from './OrderApiConfig'
import { QueueApiConfig } from './QueueApiConfig'
import { MerchantAuthConfig } from './MerchantAuthConfig'
import { StoreApiConfig } from './StoreApiConfig'
import { AmapApiConfig } from './AmapApiConfig'

export const DataSourcePage: React.FC = () => {
  const [tab, setTab] = useState('store')
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-base font-semibold text-[var(--text-primary)]">数据接入</h2>
      <div className="flex gap-1 border-b border-[var(--border-subtle)] flex-wrap">
        {[
          {k:'store',l:'门店数据',icon:Building2},
          {k:'flow',l:'客流数据',icon:Database},
          {k:'video',l:'视频数据',icon:Video},
          {k:'order',l:'订单数据',icon:ShoppingCart},
          {k:'queue',l:'排队数据',icon:ListOrdered},
          {k:'holiday',l:'假日数据',icon:CalendarDays},
          {k:'weather',l:'天气数据',icon:Cloud},
          {k:'amap',l:'高德地图',icon:Map},
          {k:'auth',l:'商家授权',icon:Shield},
        ].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} className={`px-4 py-2 text-xs font-medium flex items-center gap-1.5 transition-colors ${tab===t.k?'border-b-2 border-[var(--ai-blue-500)] text-[var(--ai-blue-500)]':'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}><t.icon className="w-3.5 h-3.5"/>{t.l}</button>
        ))}
      </div>
      {tab==='store' ? <StoreApiConfig/> : tab==='flow' ? <FlowApiConfig/> : tab==='video' ? <VideoApiConfig/> : tab==='order' ? <OrderApiConfig/> : tab==='queue' ? <QueueApiConfig/> : tab==='amap' ? <AmapApiConfig/> : tab==='auth' ? <MerchantAuthConfig/> : <WeatherConfig tabOverride={tab}/>}
    </div>
  )
}
