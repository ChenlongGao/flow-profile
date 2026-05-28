import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Modal, Input, Select, InputNumber, Switch, Popconfirm, message, Tag, Button } from 'antd'
import { Plus, Trash2, Edit3, AlertTriangle, AlertCircle, Info } from 'lucide-react'

/* ═══ 类型定义 ═══ */
interface Condition { metric: string; metric_label: string; operator: string; threshold: number; unit: string }
interface AlertRule {
  id: number; name: string; rule_type: string; conditions: string | Condition[];
  description: string; priority: string; enabled: number;
  ai_model_id: number | null; ai_prompt_template: string;
}
interface CrossAlertRule {
  id: number; name: string; description: string;
  store_conditions: string | Condition[]; mall_conditions: string | Condition[];
  cross_logic: string; severity: string; is_enabled: number;
  ai_model_id: number | null; ai_prompt_template: string;
}
interface AIModel { id: number; name: string; provider: string; }

/* ═══ 常量 ═══ */
const STORE_METRICS = [
  { value: 'enter_count', label: '进店人次', unit: '人次' },
  { value: 'enter_people', label: '进店人数', unit: '人' },
  { value: 'pass_by_count', label: '过店人次', unit: '人次' },
  { value: 'pass_by_people', label: '过店人数', unit: '人' },
  { value: 'entry_rate', label: '进店率', unit: '%' },
  { value: 'avg_stay_minutes', label: '停留时长', unit: '分钟' },
  { value: 'deep_browse_count', label: '深逛人数', unit: '人' },
]
const MALL_METRICS = [
  { value: 'visitor_count', label: '商场客流', unit: '人次' },
  { value: 'weekday_count', label: '工作日客流', unit: '人次' },
  { value: 'weekend_count', label: '周末客流', unit: '人次' },
  { value: 'peak_visitor_count', label: '峰值客流', unit: '人次' },
  { value: 'daily_avg_visitor', label: '日均客流', unit: '人次' },
]
const OPERATORS = [
  { value: 'lt', label: '小于 <' },
  { value: 'lte', label: '小于等于 ≤' },
  { value: 'gt', label: '大于 >' },
  { value: 'gte', label: '大于等于 ≥' },
]
const SEVERITY_OPTIONS = [
  { value: 'critical', label: '严重', color: '#EF4444', icon: AlertTriangle },
  { value: 'warning', label: '警告', color: '#F59E0B', icon: AlertCircle },
  { value: 'info', label: '提示', color: '#0EA5E9', icon: Info },
]
const LOGIC_OPTIONS = [
  { value: 'and', label: '且 (AND) — 门店和商场条件同时满足' },
  { value: 'or', label: '或 (OR) — 任一条件满足' },
]
const RULE_TYPES = [
  { value: 'store_index_drop', label: '单指标预警' },
  { value: 'multi_metric', label: '多指标混合预警' },
  { value: 'deviation_negative', label: '背离预警' },
]
const PROMPT_VARS_STORE = ['store_name', 'store_id', 'enter_count', 'entry_rate', 'avg_stay_minutes', 'pass_by_count', 'deep_browse_count']
const PROMPT_VARS_CROSS = ['store_name', 'mall_name', 'enter_count', 'entry_rate', 'avg_stay_minutes', 'visitor_count', 'weekend_count']

function parseJSON(v: any, fallback: any = []): any {
  if (typeof v === 'string') { try { return JSON.parse(v) } catch { return fallback } }
  return Array.isArray(v) ? v : fallback
}

// 旧字段名 → 新格式映射
const OLD_FIELD_MAP: Record<string, { label: string; unit: string }> = {
  index_value: { label: '客流指数', unit: '' },
  deviation: { label: '背离度', unit: '' },
}

function normalizeConditions(conditions: any): Condition[] {
  const parsed = typeof conditions === 'string' ? (() => { try { return JSON.parse(conditions) } catch { return [] } })() : conditions
  if (Array.isArray(parsed)) return parsed
  // 旧格式：单对象 {field, operator, threshold} → 转为新数组格式
  if (parsed && typeof parsed === 'object' && parsed.field) {
    const meta = OLD_FIELD_MAP[parsed.field] || { label: parsed.field, unit: '' }
    return [{ metric: parsed.field, metric_label: meta.label, operator: parsed.operator || 'lt', threshold: parsed.threshold ?? 0, unit: meta.unit }]
  }
  return []
}

/* ═══ 条件编辑器组件 ═══ */
const ConditionEditor: React.FC<{
  conditions: Condition[]; onChange: (c: Condition[]) => void;
  metrics: { value: string; label: string; unit: string }[]; label: string;
}> = ({ conditions, onChange, metrics, label }) => {
  const add = () => onChange([...conditions, { metric: metrics[0].value, metric_label: metrics[0].label, operator: 'lt', threshold: 0, unit: metrics[0].unit }])
  const update = (i: number, key: string, v: any) => {
    const next = [...conditions]
    if (key === 'metric') {
      const m = metrics.find(x => x.value === v)
      next[i] = { ...next[i], metric: v, metric_label: m?.label || '', unit: m?.unit || '' }
    } else next[i] = { ...next[i], [key]: v }
    onChange(next)
  }
  const remove = (i: number) => onChange(conditions.filter((_, j) => j !== i))
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[var(--text-secondary)]">{label}</span>
        <button type="button" onClick={add} className="text-[10px] text-[var(--ai-blue-500)] hover:underline">+ 添加条件</button>
      </div>
      {conditions.map((c, i) => (
        <div key={i} className="flex items-center gap-2 mb-2 pl-2 border-l-2 border-[var(--border-default)]">
          <Select size="small" value={c.metric} onChange={v => update(i, 'metric', v)}
            options={metrics} style={{ width: 110 }} />
          <Select size="small" value={c.operator} onChange={v => update(i, 'operator', v)}
            options={OPERATORS} style={{ width: 100 }} />
          <InputNumber size="small" value={c.threshold} onChange={v => update(i, 'threshold', v || 0)}
            style={{ width: 80 }} />
          <span className="text-[10px] text-[var(--text-muted)]">{c.unit}</span>
          {conditions.length > 1 && (
            <Button size="small" type="text" danger icon={<Trash2 className="w-3 h-3" />} onClick={() => remove(i)} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ═══ Prompt 变量提示 ═══ */
const PromptEditor: React.FC<{ value: string; onChange: (v: string) => void; variables: string[] }> = ({ value, onChange, variables }) => (
  <div>
    <label className="text-xs text-[var(--text-secondary)] block mb-1">AI 提示词模板</label>
    <div className="flex gap-1 flex-wrap mb-1.5">
      {variables.map(v => (
        <button key={v} type="button" onClick={() => onChange((value || '') + `{${v}}`)}
          className="px-1.5 py-0.5 rounded text-[9px] bg-[var(--bg-tertiary)] text-[var(--ai-blue-500)] hover:bg-[var(--ai-blue-500)] hover:text-white transition-colors">
          {'{' + v + '}'}
        </button>
      ))}
    </div>
    <Input.TextArea size="small" value={value} onChange={e => onChange(e.target.value)}
      placeholder="输入AI分析提示词，点击上方变量插入占位符" rows={4} />
  </div>
)

/* ═══════════════════════════════════════════
   主页面组件
   ═══════════════════════════════════════════ */
export const AlertRules: React.FC = () => {
  const [tab, setTab] = useState<'store' | 'cross'>('store')

  // 指标预警规则
  const [storeRules, setStoreRules] = useState<AlertRule[]>([])
  const [storeLoading, setStoreLoading] = useState(true)

  // 交叉预警规则
  const [crossRules, setCrossRules] = useState<CrossAlertRule[]>([])
  const [crossLoading, setCrossLoading] = useState(true)

  // AI 模型列表
  const [aiModels, setAiModels] = useState<AIModel[]>([])

  // 弹窗
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [isEdit, setIsEdit] = useState(false)

  // ─── 加载数据 ───
  const loadStoreRules = () => {
    setStoreLoading(true)
    api.get<AlertRule[]>('/alert-rules').then(d => setStoreRules(d || [])).catch(() => {}).finally(() => setStoreLoading(false))
  }
  const loadCrossRules = () => {
    setCrossLoading(true)
    api.get<CrossAlertRule[]>('/config/cross-alert-rules').then(d => setCrossRules(d || [])).catch(() => {}).finally(() => setCrossLoading(false))
  }
  useEffect(() => {
    loadStoreRules()
    loadCrossRules()
    api.get<AIModel[]>('/config/ai-models').then(d => setAiModels(d || [])).catch(() => setAiModels([]))
  }, [])

  // ─── 门店规则：CRUD ───
  const storeSave = async () => {
    const body = { ...editing, conditions: editing.conditions }
    try {
      if (isEdit) { await api.put(`/alert-rules/${editing.id}`, body); message.success('已更新') }
      else { await api.post('/alert-rules', body); message.success('已创建') }
      setModalOpen(false); loadStoreRules()
    } catch { message.error('保存失败') }
  }
  const storeDelete = async (id: number) => {
    await api.delete(`/alert-rules/${id}`).then(() => { message.success('已删除'); loadStoreRules() }).catch(() => message.error('删除失败'))
  }
  const storeOpenCreate = () => {
    setEditing({ name: '', rule_type: 'store_index_drop', conditions: [{ metric: 'enter_count', metric_label: '进店人次', operator: 'lt', threshold: 0, unit: '人次' }], priority: 'warning', enabled: 1, description: '', ai_model_id: null, ai_prompt_template: '' })
    setIsEdit(false); setModalOpen(true)
  }
  const storeOpenEdit = (r: AlertRule) => {
    setEditing({ ...r, conditions: normalizeConditions(r.conditions) })
    setIsEdit(true); setModalOpen(true)
  }

  // ─── 交叉规则：CRUD ───
  const crossSave = async () => {
    const body = { ...editing, store_conditions: editing.store_conditions, mall_conditions: editing.mall_conditions }
    try {
      if (isEdit) { await api.put(`/config/cross-alert-rules/${editing.id}`, body); message.success('已更新') }
      else { await api.post('/config/cross-alert-rules', body); message.success('已创建') }
      setModalOpen(false); loadCrossRules()
    } catch { message.error('保存失败') }
  }
  const crossDelete = async (id: number) => {
    await api.delete(`/config/cross-alert-rules/${id}`).then(() => { message.success('已删除'); loadCrossRules() }).catch(() => message.error('删除失败'))
  }
  const crossOpenCreate = () => {
    setEditing({ name: '', description: '', store_conditions: [{ metric: 'entry_rate', metric_label: '进店率', operator: 'lt', threshold: 0, unit: '%' }], mall_conditions: [{ metric: 'visitor_count', metric_label: '商场客流', operator: 'gt', threshold: 0, unit: '人次' }], cross_logic: 'and', severity: 'warning', is_enabled: 1, ai_model_id: null, ai_prompt_template: '' })
    setIsEdit(false); setModalOpen(true)
  }
  const crossOpenEdit = (r: CrossAlertRule) => {
    setEditing({ ...r, store_conditions: parseJSON(r.store_conditions, []), mall_conditions: parseJSON(r.mall_conditions, []) })
    setIsEdit(true); setModalOpen(true)
  }

  // ─── 共用关闭 ───
  const closeModal = () => { setModalOpen(false); setEditing(null) }

  // ─── 弹窗内容 ───
  const isStoreTab = tab === 'store'

  const severityTag = (s: string) => {
    const opt = SEVERITY_OPTIONS.find(o => o.value === s)
    return opt ? <Tag color={opt.color} style={{ margin: 0 }}>{opt.label}</Tag> : s
  }

  return (
    <div className="p-6 space-y-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">预警规则配置</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">配置门店客流预警规则与交叉分析预警规则，绑定 AI 模型进行智能解读</p>
        </div>
        <button onClick={() => tab === 'store' ? storeOpenCreate() : crossOpenCreate()} className="filter-btn-primary flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />新增规则
        </button>
      </div>

      {/* Tab 页签 */}
      <div className="flex gap-1 border-b border-[var(--border-subtle)]">
        {[
          { k: 'store' as const, l: '指标预警规则', desc: '基于门店客流指标的单/多指标预警' },
          { k: 'cross' as const, l: '交叉预警规则', desc: '门店+商场客流交叉分析预警' },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`px-4 py-2 transition-colors ${tab === t.k ? 'border-b-2 border-[var(--ai-blue-500)] text-[var(--ai-blue-500)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
            <span className="text-xs font-medium">{t.l}</span>
            <span className="block text-[10px] opacity-60">{t.desc}</span>
          </button>
        ))}
      </div>

      {/* ═══ 指标预警规则 Tab ═══ */}
      {tab === 'store' && (
        <div className="card-level-1 overflow-hidden" style={{ padding: 0 }}>
          {storeLoading ? <div className="p-8 text-center text-xs text-[var(--text-muted)]">加载中...</div> : storeRules.length === 0 ? (
            <div className="p-12 text-center"><p className="text-sm text-[var(--text-muted)] mb-3">暂无指标预警规则</p><button onClick={storeOpenCreate} className="filter-btn-primary text-xs">创建第一条规则</button></div>
          ) : (
            <table className="w-full text-xs">
              <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                <tr>
                  {['规则名称','规则类型','条件','说明','严重程度','AI模型','状态','操作'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {storeRules.map(r => {
                  const condsArr: Condition[] = normalizeConditions(r.conditions)
                  const aiModel = aiModels.find(m => m.id === r.ai_model_id)
                  return (
                    <tr key={r.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                      <td className="px-3 py-2.5 font-medium text-[var(--text-primary)]">{r.name}</td>
                      <td className="px-3 py-2.5">{RULE_TYPES.find(t => t.value === r.rule_type)?.label || r.rule_type}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          {condsArr.map((c: Condition, i: number) => (
                            <span key={i} className="text-[var(--text-secondary)]">
                              {c.metric_label} {OPERATORS.find(o => o.value === c.operator)?.label || c.operator} {c.threshold}{c.unit}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[var(--text-muted)] max-w-[160px] truncate" title={r.description}>{r.description || '-'}</td>
                      <td className="px-3 py-2.5">{severityTag(r.priority)}</td>
                      <td className="px-3 py-2.5 text-[var(--text-muted)]">{aiModel ? `${aiModel.name} (${aiModel.provider})` : '未绑定'}</td>
                      <td className="px-3 py-2.5"><span className={`inline-block w-2 h-2 rounded-full ${r.enabled ? 'bg-emerald-400' : 'bg-gray-400'}`} /></td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <Button size="small" type="text" icon={<Edit3 className="w-3 h-3" />} onClick={() => storeOpenEdit(r)} />
                          <Popconfirm title="确认删除" onConfirm={() => storeDelete(r.id)} okText="确认" cancelText="取消">
                            <Button size="small" type="text" danger icon={<Trash2 className="w-3 h-3" />} />
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
      )}

      {/* ═══ 交叉预警规则 Tab ═══ */}
      {tab === 'cross' && (
        <div className="card-level-1 overflow-hidden" style={{ padding: 0 }}>
          {crossLoading ? <div className="p-8 text-center text-xs text-[var(--text-muted)]">加载中...</div> : crossRules.length === 0 ? (
            <div className="p-12 text-center"><p className="text-sm text-[var(--text-muted)] mb-3">暂无交叉预警规则</p><button onClick={crossOpenCreate} className="filter-btn-primary text-xs">创建第一条规则</button></div>
          ) : (
            <table className="w-full text-xs">
              <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                <tr>
                  {['规则名称','门店条件','商场条件','逻辑','说明','严重程度','AI模型','状态','操作'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {crossRules.map(r => {
                  const sc: Condition[] = parseJSON(r.store_conditions, [])
                  const mc: Condition[] = parseJSON(r.mall_conditions, [])
                  const aiModel = aiModels.find(m => m.id === r.ai_model_id)
                  const logicLabel = r.cross_logic === 'and' ? '且 (AND)' : '或 (OR)'
                  return (
                    <tr key={r.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                      <td className="px-3 py-2.5 font-medium text-[var(--text-primary)]">{r.name}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          {sc.map((c: Condition, i: number) => (
                            <span key={i} className="text-[var(--text-secondary)]">{c.metric_label} {OPERATORS.find(o => o.value === c.operator)?.label} {c.threshold}{c.unit}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          {mc.map((c: Condition, i: number) => (
                            <span key={i} className="text-[var(--text-secondary)]">{c.metric_label} {OPERATORS.find(o => o.value === c.operator)?.label} {c.threshold}{c.unit}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <Tag color={r.cross_logic === 'and' ? '#0EA5E9' : '#F59E0B'} style={{ margin: 0 }}>{logicLabel}</Tag>
                      </td>
                      <td className="px-3 py-2.5 text-[var(--text-muted)] max-w-[150px] truncate" title={r.description}>{r.description || '-'}</td>
                      <td className="px-3 py-2.5">{severityTag(r.severity)}</td>
                      <td className="px-3 py-2.5 text-[var(--text-muted)]">{aiModel ? `${aiModel.name} (${aiModel.provider})` : '未绑定'}</td>
                      <td className="px-3 py-2.5"><span className={`inline-block w-2 h-2 rounded-full ${r.is_enabled ? 'bg-emerald-400' : 'bg-gray-400'}`} /></td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <Button size="small" type="text" icon={<Edit3 className="w-3 h-3" />} onClick={() => crossOpenEdit(r)} />
                          <Popconfirm title="确认删除" onConfirm={() => crossDelete(r.id)} okText="确认" cancelText="取消">
                            <Button size="small" type="text" danger icon={<Trash2 className="w-3 h-3" />} />
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
      )}

      {/* ═══ 新增/编辑弹窗 ═══ */}
      <Modal
        title={isEdit ? '编辑预警规则' : '新增预警规则'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={isStoreTab ? storeSave : crossSave}
        okText="保存" cancelText="取消"
        width={700} destroyOnClose
      >
        {editing && (
          <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {/* 名称 */}
            <div className="col-span-2">
              <label className="text-xs text-[var(--text-secondary)] block mb-1">规则名称 <span className="text-red-400">*</span></label>
              <Input size="small" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="如：门店进店率严重下滑" />
            </div>

            {/* 门店规则特有字段 */}
            {isStoreTab && (
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1">规则类型</label>
                <Select size="small" value={editing.rule_type} onChange={v => setEditing({ ...editing, rule_type: v })}
                  options={RULE_TYPES} style={{ width: '100%' }} />
              </div>
            )}
            {isStoreTab && (
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1">严重程度</label>
                <Select size="small" value={editing.priority} onChange={v => setEditing({ ...editing, priority: v })}
                  options={SEVERITY_OPTIONS} style={{ width: '100%' }} />
              </div>
            )}

            {/* 交叉规则特有字段 */}
            {!isStoreTab && (
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1">严重程度</label>
                <Select size="small" value={editing.severity} onChange={v => setEditing({ ...editing, severity: v })}
                  options={SEVERITY_OPTIONS} style={{ width: '100%' }} />
              </div>
            )}
            {!isStoreTab && (
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1">组合逻辑</label>
                <Select size="small" value={editing.cross_logic} onChange={v => setEditing({ ...editing, cross_logic: v })}
                  options={LOGIC_OPTIONS} style={{ width: '100%' }} />
              </div>
            )}

            {/* 说明 */}
            <div className="col-span-2">
              <label className="text-xs text-[var(--text-secondary)] block mb-1">规则说明</label>
              <Input size="small" value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} placeholder="描述此规则的预警逻辑" />
            </div>

            {/* 条件编辑器 */}
            <div className="col-span-2 p-3 rounded bg-[var(--bg-tertiary)]">
              {isStoreTab ? (
                <ConditionEditor
                  conditions={editing.conditions || []}
                  onChange={c => setEditing({ ...editing, conditions: c })}
                  metrics={STORE_METRICS}
                  label="预警条件（门店指标）"
                />
              ) : (
                <div className="space-y-4">
                  <ConditionEditor
                    conditions={editing.store_conditions || []}
                    onChange={c => setEditing({ ...editing, store_conditions: c })}
                    metrics={STORE_METRICS}
                    label="门店条件"
                  />
                  <div className="border-t border-[var(--border-subtle)] pt-3">
                    <ConditionEditor
                      conditions={editing.mall_conditions || []}
                      onChange={c => setEditing({ ...editing, mall_conditions: c })}
                      metrics={MALL_METRICS}
                      label="商场条件"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* AI模型绑定 */}
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">绑定 AI 模型</label>
              <Select size="small" value={editing.ai_model_id} onChange={v => setEditing({ ...editing, ai_model_id: v })}
                allowClear placeholder="不绑定"
                options={aiModels.map(m => ({ label: `${m.name} (${m.provider})`, value: m.id }))}
                style={{ width: '100%' }} />
            </div>

            {/* 启用开关 */}
            <div className="flex items-end pb-0.5">
              <div className="flex items-center gap-2">
                <Switch size="small" checked={!!(isStoreTab ? editing.enabled : editing.is_enabled)}
                  onChange={v => isStoreTab ? setEditing({ ...editing, enabled: v ? 1 : 0 }) : setEditing({ ...editing, is_enabled: v ? 1 : 0 })} />
                <span className="text-xs text-[var(--text-secondary)]">启用</span>
              </div>
            </div>

            {/* AI提示词模板 */}
            <div className="col-span-2">
              <PromptEditor
                value={editing.ai_prompt_template || ''}
                onChange={v => setEditing({ ...editing, ai_prompt_template: v })}
                variables={isStoreTab ? PROMPT_VARS_STORE : PROMPT_VARS_CROSS}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
