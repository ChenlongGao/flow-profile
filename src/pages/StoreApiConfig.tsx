import React, { useState } from 'react'
import { Tabs } from 'antd'
import { Building2, Store } from 'lucide-react'
import { StoreApiForm } from './StoreApiForm'

export const StoreApiConfig: React.FC = () => {
  const [activeTab, setActiveTab] = useState('store')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h3 className="text-sm font-semibold text-[var(--text-primary)]">门店数据接入</h3><p className="text-xs text-[var(--text-muted)] mt-1">对接门店系统API，获取门店列表、详情与营业状态</p></div>
      </div>
      <Tabs size="small" activeKey={activeTab} onChange={setActiveTab} items={[
        { key: 'store', label: <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />门店API</span>, children: <StoreApiForm apiType="store" title="门店API" /> },
        { key: 'meituan_store', label: <span className="flex items-center gap-1"><Store className="w-3 h-3" />美团API</span>, children: <StoreApiForm apiType="meituan_store" title="美团门店API" /> },
        { key: 'qimai_store', label: <span className="flex items-center gap-1"><Store className="w-3 h-3" />企迈API</span>, children: <StoreApiForm apiType="qimai_store" title="企迈门店API" /> },
      ]} />
    </div>
  )
}
