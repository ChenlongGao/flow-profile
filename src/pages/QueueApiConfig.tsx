import React, { useState } from 'react'
import { Tabs } from 'antd'
import { ListOrdered, Store } from 'lucide-react'
import { QueueApiForm } from './QueueApiForm'

export const QueueApiConfig: React.FC = () => {
  const [activeTab, setActiveTab] = useState('queue')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h3 className="text-sm font-semibold text-[var(--text-primary)]">排队数据接入</h3><p className="text-xs text-[var(--text-muted)] mt-1">对接排队系统API，配置后可拉取排队数据</p></div>
      </div>
      <Tabs size="small" activeKey={activeTab} onChange={setActiveTab} items={[
        { key: 'queue', label: <span className="flex items-center gap-1"><ListOrdered className="w-3 h-3" />排队API</span>, children: <QueueApiForm apiType="queue" title="排队API" /> },
        { key: 'meituan_queue', label: <span className="flex items-center gap-1"><Store className="w-3 h-3" />美团API</span>, children: <QueueApiForm apiType="meituan_queue" title="美团排队API" /> },
        { key: 'qimai_queue', label: <span className="flex items-center gap-1"><Store className="w-3 h-3" />企迈API</span>, children: <QueueApiForm apiType="qimai_queue" title="企迈排队API" /> },
      ]} />
    </div>
  )
}
