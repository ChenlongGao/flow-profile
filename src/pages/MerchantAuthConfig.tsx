import React, { useState } from 'react'
import { Tabs } from 'antd'
import { Shield, Store } from 'lucide-react'
import { OAuthConfig } from './OAuthConfig'

export const MerchantAuthConfig: React.FC = () => {
  const [activeTab, setActiveTab] = useState('meituan')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h3 className="text-sm font-semibold text-[var(--text-primary)]">商家授权</h3><p className="text-xs text-[var(--text-muted)] mt-1">OAuth2.0 标准协议 · 商户身份验证与授权，获取商户数据访问令牌</p></div>
      </div>
      <Tabs size="small" activeKey={activeTab} onChange={setActiveTab} items={[
        { key: 'meituan', label: <span className="flex items-center gap-1"><Store className="w-3 h-3" />美团授权</span>, children: <OAuthConfig platform="meituan" title="美团" /> },
        { key: 'qimai', label: <span className="flex items-center gap-1"><Store className="w-3 h-3" />企迈授权</span>, children: <OAuthConfig platform="qimai" title="企迈" /> },
      ]} />
    </div>
  )
}
