import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Switch, Input } from 'antd'
import { BellRing, Mail, MessageSquare, Smartphone, Clock } from 'lucide-react'

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  wechat_push: <MessageSquare className="w-5 h-5 text-green-500"/>,
  sms_push: <Smartphone className="w-5 h-5 text-blue-500"/>,
  email_push: <Mail className="w-5 h-5 text-amber-500"/>,
  in_app: <BellRing className="w-5 h-5 text-red-500"/>,
  push_frequency: <Clock className="w-5 h-5 text-purple-500"/>,
}

export const MessageConfig: React.FC = () => {
  const [configs, setConfigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<any[]>('/config/notification-config').then(d => {
      setConfigs(d||[])
    }).finally(()=>setLoading(false))
  }, [])

  const toggle = (id: number, val: boolean) => {
    api.put(`/config/notification-config/${id}`, { is_enabled: val?1:0 }).then(() => {
      setConfigs(prev => prev.map(c => c.id===id?{...c,is_enabled:val?1:0}:c))
    })
  }

  const updateFreq = (id: number, val: string) => {
    api.put(`/config/notification-config/${id}`, { config_value: val }).then(() => {
      setConfigs(prev => prev.map(c => c.id===id?{...c,config_value:val}:c))
    })
  }

  const channels = configs.filter(c => ['wechat_push','sms_push','email_push','in_app'].includes(c.config_key))
  const other = configs.filter(c => !['wechat_push','sms_push','email_push','in_app'].includes(c.config_key))

  if (loading) return <div className="p-8 text-center text-xs text-[var(--text-muted)]">加载中...</div>

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-base font-semibold text-[var(--text-primary)]">消息配置</h2>

      {/* 推送渠道 */}
      <div className="card-level-1 p-4">
        <div className="chart-title mb-3">推送渠道</div>
        <div className="grid grid-cols-4 gap-3">
          {channels.map(c => (
            <div key={c.id} className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-3 mb-3">
                {CHANNEL_ICONS[c.config_key] || <BellRing className="w-5 h-5"/>}
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{c.config_value}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{c.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch size="small" checked={c.is_enabled===1} onChange={v=>toggle(c.id,v)}/>
                <span className={`text-xs ${c.is_enabled ? 'text-green-400' : 'text-[var(--text-muted)]'}`}>{c.is_enabled?'已开启':'已关闭'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 高级设置 */}
      <div className="card-level-1 p-4">
        <div className="chart-title mb-3">高级设置</div>
        <div className="space-y-3">
          {other.map(c => (
            <div key={c.id} className="flex items-center gap-4 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 w-40 shrink-0">
                {CHANNEL_ICONS[c.config_key] || <Clock className="w-4 h-4 text-[var(--text-muted)]"/>}
                <span className="text-sm text-[var(--text-primary)]">{c.description}</span>
              </div>
              <div className="flex-1 flex items-center gap-3">
                {c.config_key === 'push_frequency' ? (
                  <div className="flex items-center gap-2">
                    {['realtime','hourly','daily'].map(f => (
                      <button key={f} onClick={()=>updateFreq(c.id,f)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          c.config_value===f ? 'bg-[var(--ai-blue-500)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-subtle)]'
                        }`}>
                        {f==='realtime'?'实时':f==='hourly'?'每小时':'每天'}
                      </button>
                    ))}
                  </div>
                ) : c.config_key === 'quiet_hours' ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-secondary)]">{c.config_value}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">（编辑功能开发中）</span>
                  </div>
                ) : (
                  <Input size="small" defaultValue={c.config_value} style={{height:28,width:200,fontSize:12}}/>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch size="small" checked={c.is_enabled===1} onChange={v=>toggle(c.id,v)}/>
                <span className={`text-xs ${c.is_enabled ? 'text-green-400' : 'text-[var(--text-muted)]'}`}>{c.is_enabled?'启用':'禁用'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
