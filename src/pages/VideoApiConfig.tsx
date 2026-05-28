import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Modal, Input, Select, Switch, Popconfirm, message, Tag, Button, Tabs } from 'antd'
import { Plus, Edit3, Trash2, Play, Database, Clock, Video, Link } from 'lucide-react'

interface VideoApiConf {
  id?: number; name: string; provider: string; base_url: string;
  api_key: string; is_enabled: number; is_default: number; description: string;
  last_sync_at?: string; last_sync_status?: string;
}

const VIDEO_PROVIDERS = [
  { v: 'hikvision', l: '海康威视', color: '#0EA5E9' },
  { v: 'dahua', l: '大华', color: '#F59E0B' },
  { v: 'uniview', l: '宇视', color: '#10B981' },
  { v: 'rtsp', l: 'RTSP 直连', color: '#8B5CF6' },
  { v: 'onvif', l: 'ONVIF 协议', color: '#EC4899' },
  { v: 'custom', l: '自定义', color: '#64748B' },
]

export const VideoApiConfig: React.FC = () => {
  const [configs, setConfigs] = useState<VideoApiConf[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<VideoApiConf>({ name: '', provider: 'hikvision', base_url: '', api_key: '', is_enabled: 1, is_default: 0, description: '' })
  const [isEdit, setIsEdit] = useState(false)
  const [syncing, setSyncing] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('config')

  const loadConfigs = () => { setLoading(true); api.get<any[]>('/config/video-apis').then(d => setConfigs(d || [])).finally(() => setLoading(false)) }
  const loadLogs = () => api.get<any[]>('/config/video-apis/logs').then(d => setLogs(d || []))
  useEffect(() => { loadConfigs(); loadLogs() }, [])

  const save = async () => {
    try {
      if (isEdit && editing.id) { await api.put(`/config/video-apis/${editing.id}`, editing); message.success('已更新') }
      else { await api.post('/config/video-apis', editing); message.success('已创建') }
      setModalOpen(false); loadConfigs()
    } catch { message.error('保存失败') }
  }
  const del = async (id: number) => { await api.delete(`/config/video-apis/${id}`); message.success('已删除'); loadConfigs() }
  const doSync = async (id: number) => {
    setSyncing(id)
    try { const r = await api.post<any>(`/config/video-apis/${id}/sync`); message.success(`同步完成: ${r.fetched || 0}条`); loadLogs(); loadConfigs() }
    catch { message.error('同步失败') }
    finally { setSyncing(null) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h3 className="text-sm font-semibold text-[var(--text-primary)]">视频API接入</h3><p className="text-xs text-[var(--text-muted)] mt-1">对接视频监控平台API，配置后可拉取巡检数据</p></div>
        <button onClick={() => { setEditing({ name: '', provider: 'hikvision', base_url: '', api_key: '', is_enabled: 1, is_default: 0, description: '' }); setIsEdit(false); setModalOpen(true) }} className="filter-btn-primary flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />新增API</button>
      </div>

      <Tabs size="small" activeKey={activeTab} onChange={setActiveTab} items={[
        {
          key: 'config', label: <span className="flex items-center gap-1"><Database className="w-3 h-3" />API配置</span>, children:
            loading ? <div className="p-8 text-center text-xs">加载中...</div> :
              configs.length === 0 ? <div className="card-level-1 p-12 text-center text-sm">暂无API配置，点击右上角新增</div> :
                <div className="space-y-3">
                  {configs.map(c => {
                    const p = VIDEO_PROVIDERS.find(t => t.v === c.provider)
                    return (<div key={c.id} className="card-level-1 p-4" style={{ borderLeft: '3px solid var(--ai-blue-500)' }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[var(--text-primary)]">{c.name}</span>
                            {p && <Tag color={p.color}>{p.l}</Tag>}
                            <span className={`inline-block w-2 h-2 rounded-full ${c.is_enabled ? 'bg-emerald-400' : 'bg-gray-400'}`} />
                          </div>
                          <div className="text-[11px] flex items-center gap-1"><Link className="w-3 h-3 text-[var(--text-muted)]" /><span className="text-[var(--text-secondary)] truncate">{c.base_url || '未配置API地址'}</span></div>
                          {c.last_sync_at && <div className="text-[10px] text-[var(--text-muted)]">上次同步: {c.last_sync_at?.slice(0, 16)} {c.last_sync_status === 'success' ? <Tag color="green" style={{ fontSize: 10, margin: 0 }}>成功</Tag> : <Tag color="red" style={{ fontSize: 10, margin: 0 }}>失败</Tag>}</div>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-3">
                          <Button size="small" type="primary" loading={syncing === c.id} onClick={() => doSync(c.id!)} icon={<Play className="w-3 h-3" />}>同步</Button>
                          <Button size="small" type="text" icon={<Edit3 className="w-3 h-3" />} onClick={() => { setEditing({ ...c }); setIsEdit(true); setModalOpen(true) }} />
                          <Popconfirm title="确认删除" onConfirm={() => del(c.id!)} okText="确认" cancelText="取消"><Button size="small" type="text" danger icon={<Trash2 className="w-3 h-3" />} /></Popconfirm>
                        </div>
                      </div>
                    </div>)
                  })}
                </div>
        },
        {
          key: 'logs', label: <span className="flex items-center gap-1"><Clock className="w-3 h-3" />同步日志</span>, children:
            logs.length === 0 ? <div className="card-level-1 p-8 text-center text-sm">暂无同步记录</div> :
              <div className="space-y-1.5">{logs.map(l => (<div key={l.id} className="card-level-1 p-2.5 text-[11px] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Tag color={l.status === 'success' ? 'green' : 'red'}>{l.status === 'success' ? '成功' : '失败'}</Tag>
                  <span className="font-medium">{l.api_config_name}</span>
                  <span className="text-[var(--text-muted)]">{l.created_at?.slice(0, 16)}</span>
                </div>
                <div className="flex items-center gap-3 text-[var(--text-muted)]">{l.status === 'success' ? <><span>抓取{l.records_fetched}</span><span>新增{l.records_inserted}</span><span>更新{l.records_updated}</span><span>{l.duration_ms}ms</span></> : <span className="text-red-400 truncate max-w-xs">{l.error_message}</span>}</div>
              </div>))}</div>
        },
      ]} />

      <Modal title={isEdit ? '编辑API' : '新增API'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={save} okText="保存" cancelText="取消" width={540} destroyOnClose>
        {editing && <div className="space-y-4 mt-4">
          <Input size="small" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="API名称（如：海康NVR主控）" />
          <Select size="small" value={editing.provider} onChange={v => setEditing({ ...editing, provider: v })} options={VIDEO_PROVIDERS.map(t => ({ value: t.v, label: t.l }))} style={{ width: '100%' }} />
          <Input size="small" value={editing.base_url} onChange={e => setEditing({ ...editing, base_url: e.target.value })} placeholder="API地址（如：http://192.168.1.100:80）" />
          <Input.Password size="small" value={editing.api_key} onChange={e => setEditing({ ...editing, api_key: e.target.value })} placeholder="API Key / 认证Token" />
          <Input.TextArea size="small" value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={2} placeholder="用途或备注" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2"><Switch size="small" checked={!!editing.is_enabled} onChange={v => setEditing({ ...editing, is_enabled: v ? 1 : 0 })} /><span className="text-xs">启用</span></div>
            <div className="flex items-center gap-2"><Switch size="small" checked={!!editing.is_default} onChange={v => setEditing({ ...editing, is_default: v ? 1 : 0 })} /><span className="text-xs">设为默认</span></div>
          </div>
        </div>}
      </Modal>
    </div>
  )
}
