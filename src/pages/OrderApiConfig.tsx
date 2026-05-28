import React, { useState } from 'react'
import { Tabs } from 'antd'
import { Database, Store } from 'lucide-react'
import { OrderApiForm } from './OrderApiForm'

export const OrderApiConfig: React.FC = () => {
  const [activeTab, setActiveTab] = useState('order')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h3 className="text-sm font-semibold text-[var(--text-primary)]">订单数据接入</h3><p className="text-xs text-[var(--text-muted)] mt-1">对接订单系统API，配置后可拉取订单数据</p></div>
      </div>
      <Tabs size="small" activeKey={activeTab} onChange={setActiveTab} items={[
        { key: 'order', label: <span className="flex items-center gap-1"><Database className="w-3 h-3" />订单API</span>, children: <OrderApiForm apiType="order" title="订单API" /> },
        { key: 'meituan', label: <span className="flex items-center gap-1"><Store className="w-3 h-3" />美团API</span>, children: <OrderApiForm apiType="meituan" title="美团API" /> },
        { key: 'qimai', label: <span className="flex items-center gap-1"><Store className="w-3 h-3" />企迈API</span>, children: <OrderApiForm apiType="qimai" title="企迈API" /> },
      ]} />
    </div>
  )
}
