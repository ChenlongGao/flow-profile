import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Modal, Input, Select, InputNumber, Switch, Popconfirm, message, Tag, Button } from 'antd'
import { Plus, Trash2, Edit3, Wifi, Star, StarOff } from 'lucide-react'

interface AIModel {
  id: number
  name: string
  provider: string
  model_id: string
  endpoint_id: string
  api_endpoint: string
  api_key: string
  max_tokens: number
  temperature: number
  is_enabled: number
  is_default: number
  description: string
  sort_order: number
  created_at: string
  updated_at: string
}

const PROVIDER_OPTIONS = [
  { label: '豆包 (Doubao)', value: 'doubao' },
  { label: 'DeepSeek', value: 'deepseek' },
  { label: 'OpenAI', value: 'openai' },
  { label: '通义千问 (Qwen)', value: 'qwen' },
  { label: '文心一言 (ERNIE)', value: 'ernie' },
  { label: '智谱 (GLM)', value: 'glm' },
  { label: 'Moonshot', value: 'moonshot' },
  { label: '自定义', value: 'custom' },
]

const PROVIDER_MAP: Record<string, { label: string; color: string }> = {
  doubao: { label: '豆包', color: '#0EA5E9' },
  deepseek: { label: 'DeepSeek', color: '#8B5CF6' },
  openai: { label: 'OpenAI', color: '#10B981' },
  qwen: { label: '通义千问', color: '#F59E0B' },
  ernie: { label: '文心一言', color: '#38BDF8' },
  glm: { label: '智谱GLM', color: '#EC4899' },
  moonshot: { label: 'Moonshot', color: '#14B8A6' },
  custom: { label: '自定义', color: '#64748B' },
}

const emptyForm = (): Partial<AIModel> => ({
  name: '',
  provider: 'doubao',
  model_id: '',
  endpoint_id: '',
  api_endpoint: '',
  api_key: '',
  max_tokens: 4096,
  temperature: 0.7,
  is_enabled: 1,
  is_default: 0,
  description: '',
  sort_order: 0,
})

export const AlgorithmModel: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<AIModel>>(emptyForm())
  const [isEdit, setIsEdit] = useState(false)
  const [testing, setTesting] = useState<number | null>(null)
  const [testResult, setTestResult] = useState<{ id: number; ok: boolean; msg: string } | null>(null)

  const load = () => {
    setLoading(true)
    api.get<AIModel[]>('/config/ai-models')
      .then(d => setModels(d || []))
      .catch(() => setModels([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    const body = { ...editing }
    try {
      if (isEdit && editing.id) {
        await api.put(`/config/ai-models/${editing.id}`, body)
        message.success('模型配置已更新')
      } else {
        await api.post('/config/ai-models', body)
        message.success('模型配置已创建')
      }
      setModalOpen(false)
      load()
    } catch (e: any) {
      message.error(e?.message || '保存失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/config/ai-models/${id}`)
      message.success('已删除')
      load()
    } catch (e: any) {
      message.error(e?.message || '删除失败')
    }
  }

  const handleSetDefault = async (model: AIModel) => {
    try {
      await api.put(`/config/ai-models/${model.id}`, { ...model, is_default: 1 })
      message.success(`已将「${model.name}」设为默认模型`)
      load()
    } catch (e: any) {
      message.error(e?.message || '设置失败')
    }
  }

  const handleTest = async (id: number) => {
    setTesting(id)
    setTestResult(null)
    try {
      const res = await api.post<{ success: boolean; message: string }>(`/config/ai-models/${id}/test`, {})
      setTestResult({ id, ok: res.success, msg: res.message })
    } catch {
      setTestResult({ id, ok: false, msg: '请求失败' })
    } finally {
      setTesting(null)
    }
  }

  const openCreate = () => {
    setEditing(emptyForm())
    setIsEdit(false)
    setModalOpen(true)
  }

  const openEdit = (model: AIModel) => {
    setEditing({ ...model })
    setIsEdit(true)
    setModalOpen(true)
  }

  return (
    <div className="p-6 space-y-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">算法模型配置</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">配置大语言模型接入参数，支持多个模型切换与默认模型设置</p>
        </div>
        <button onClick={openCreate} className="filter-btn-primary flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          新增模型
        </button>
      </div>

      {/* 模型列表 */}
      <div className="card-level-1 overflow-hidden" style={{ padding: 0 }}>
        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)]">加载中...</div>
        ) : models.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-[var(--text-muted)] mb-3">暂无算法模型配置</p>
            <button onClick={openCreate} className="filter-btn-primary text-xs">新增第一个模型</button>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <tr>
                <th className="text-left px-3 py-2.5 font-medium text-[var(--text-secondary)] w-10">#</th>
                <th className="text-left px-3 py-2.5 font-medium text-[var(--text-secondary)]">模型名称</th>
                <th className="text-left px-3 py-2.5 font-medium text-[var(--text-secondary)]">供应商</th>
                <th className="text-left px-3 py-2.5 font-medium text-[var(--text-secondary)]">模型 ID</th>
                <th className="text-left px-3 py-2.5 font-medium text-[var(--text-secondary)]">API 端点</th>
                <th className="text-left px-3 py-2.5 font-medium text-[var(--text-secondary)]">最大 Token</th>
                <th className="text-left px-3 py-2.5 font-medium text-[var(--text-secondary)]">温度</th>
                <th className="text-center px-3 py-2.5 font-medium text-[var(--text-secondary)] w-16">状态</th>
                <th className="text-center px-3 py-2.5 font-medium text-[var(--text-secondary)] w-16">默认</th>
                <th className="text-left px-3 py-2.5 font-medium text-[var(--text-secondary)] w-36">操作</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m, i) => {
                const prov = PROVIDER_MAP[m.provider] || { label: m.provider, color: '#64748B' }
                return (
                  <tr key={m.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                    <td className="px-3 py-2.5 text-[var(--text-muted)]">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-[var(--text-primary)]">{m.name}</div>
                      {m.description && <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{m.description}</div>}
                    </td>
                    <td className="px-3 py-2.5">
                      <Tag color={prov.color} style={{ margin: 0 }}>{prov.label}</Tag>
                    </td>
                    <td className="px-3 py-2.5 text-number text-[var(--text-secondary)]">{m.model_id}</td>
                    <td className="px-3 py-2.5 text-[var(--text-muted)] max-w-[200px] truncate" title={m.api_endpoint}>
                      {m.api_endpoint || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-number text-[var(--text-secondary)]">
                      {m.max_tokens >= 1000 ? `${(m.max_tokens / 1000).toFixed(0)}K` : m.max_tokens}
                    </td>
                    <td className="px-3 py-2.5 text-number text-[var(--text-secondary)]">{m.temperature?.toFixed(1)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${m.is_enabled ? 'bg-emerald-400' : 'bg-gray-400'}`} />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {m.is_default ? (
                        <Star className="w-3.5 h-3.5 text-amber-400 inline" />
                      ) : (
                        <StarOff className="w-3.5 h-3.5 text-[var(--text-muted)] inline" />
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <Button
                          size="small"
                          type="text"
                          loading={testing === m.id}
                          icon={<Wifi className="w-3 h-3" />}
                          onClick={() => handleTest(m.id)}
                          title="测试连接"
                        />
                        {testResult?.id === m.id && (
                          <span className={`text-[10px] ${testResult.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                            {testResult.ok ? '✓' : '✗'}
                          </span>
                        )}
                        <Button
                          size="small"
                          type="text"
                          icon={<Edit3 className="w-3 h-3" />}
                          onClick={() => openEdit(m)}
                          title="编辑"
                        />
                        {!m.is_default && (
                          <Button
                            size="small"
                            type="text"
                            icon={<Star className="w-3 h-3" />}
                            onClick={() => handleSetDefault(m)}
                            title="设为默认"
                          />
                        )}
                        <Popconfirm
                          title="确认删除"
                          description="删除后不可恢复"
                          onConfirm={() => handleDelete(m.id)}
                          okText="确认"
                          cancelText="取消"
                        >
                          <Button
                            size="small"
                            type="text"
                            danger
                            icon={<Trash2 className="w-3 h-3" />}
                            title="删除"
                          />
                        </Popconfirm>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={isEdit ? '编辑模型配置' : '新增模型配置'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText="保存"
        cancelText="取消"
        width={640}
        destroyOnClose
      >
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="col-span-2">
            <label className="text-xs text-[var(--text-secondary)] block mb-1">模型名称 <span className="text-red-400">*</span></label>
            <Input size="small" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}
              placeholder="如：豆包 Pro" />
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">供应商 <span className="text-red-400">*</span></label>
            <Select size="small" value={editing.provider} onChange={v => setEditing({ ...editing, provider: v })}
              options={PROVIDER_OPTIONS} style={{ width: '100%' }} />
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">模型 ID <span className="text-red-400">*</span></label>
            <Input size="small" value={editing.model_id} onChange={e => setEditing({ ...editing, model_id: e.target.value })}
              placeholder="如：doubao-pro-32k" />
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">Endpoint ID</label>
            <Input size="small" value={editing.endpoint_id} onChange={e => setEditing({ ...editing, endpoint_id: e.target.value })}
              placeholder="如：ep-20250101000000-xxxxx (豆包接入点ID)" />
          </div>

          <div className="col-span-2">
            <label className="text-xs text-[var(--text-secondary)] block mb-1">API 端点</label>
            <Input size="small" value={editing.api_endpoint} onChange={e => setEditing({ ...editing, api_endpoint: e.target.value })}
              placeholder="如：https://ark.cn-beijing.volces.com/api/v3" />
          </div>

          <div className="col-span-2">
            <label className="text-xs text-[var(--text-secondary)] block mb-1">API Key</label>
            <Input.Password size="small" value={editing.api_key} onChange={e => setEditing({ ...editing, api_key: e.target.value })}
              placeholder="输入 API Key" />
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">最大 Token</label>
            <InputNumber size="small" value={editing.max_tokens} onChange={v => setEditing({ ...editing, max_tokens: v || 4096 })}
              min={1} max={128000} style={{ width: '100%' }} />
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">温度 (Temperature)</label>
            <InputNumber size="small" value={editing.temperature} onChange={v => setEditing({ ...editing, temperature: v || 0.7 })}
              min={0} max={2} step={0.1} style={{ width: '100%' }} />
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">排序</label>
            <InputNumber size="small" value={editing.sort_order} onChange={v => setEditing({ ...editing, sort_order: v || 0 })}
              min={0} style={{ width: '100%' }} />
          </div>

          <div className="flex items-end gap-4 pb-1">
            <div className="flex items-center gap-2">
              <Switch size="small" checked={!!editing.is_enabled} onChange={v => setEditing({ ...editing, is_enabled: v ? 1 : 0 })} />
              <span className="text-xs text-[var(--text-secondary)]">启用</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch size="small" checked={!!editing.is_default} onChange={v => setEditing({ ...editing, is_default: v ? 1 : 0 })} />
              <span className="text-xs text-[var(--text-secondary)]">默认模型</span>
            </div>
          </div>

          <div className="col-span-2">
            <label className="text-xs text-[var(--text-secondary)] block mb-1">说明</label>
            <Input.TextArea size="small" value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })}
              placeholder="模型用途或备注" rows={2} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
