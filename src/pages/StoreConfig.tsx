import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Tabs, Popconfirm, message } from 'antd'
import { X, Plus } from 'lucide-react'

interface ConfigItem { id: number; code: string; name: string; description: string; sort_order: number; color?: string; official_type?: string; radiation_range?: string; typical_size?: string; annual_sales_range?: string; typical_count?: string }

/* ═══ 页面配置定义 ═══ */
const MALL_TABS = [
  { key: 'official', label: '商场类型', endpoint: '/config/mall-types', columns: [
    { key: 'sort_order', label: '排序', type: 'number' },
    { key: 'code', label: '编码' },
    { key: 'name', label: '名称' },
    { key: 'official_type', label: '官方分类' },
    { key: 'radiation_range', label: '辐射范围' },
    { key: 'typical_size', label: '典型体量' },
    { key: 'description', label: '说明' },
  ]},
  { key: 'market', label: '消费定位', endpoint: '/config/market-positions', columns: [
    { key: 'sort_order', label: '排序', type: 'number' },
    { key: 'code', label: '编码' },
    { key: 'name', label: '名称' },
    { key: 'description', label: '说明' },
  ]},
  { key: 'sales', label: '销售层级', endpoint: '/config/sales-tiers', columns: [
    { key: 'sort_order', label: '排序', type: 'number' },
    { key: 'code', label: '编码' },
    { key: 'name', label: '名称' },
    { key: 'description', label: '说明' },
  ]},
]

const STORE_TABS = [
  { key: 'store_types', label: '门店类型', endpoint: '/config/store-types', columns: [
    { key: 'sort_order', label: '排序', type: 'number' },
    { key: 'code', label: '编码' },
    { key: 'name', label: '名称' },
    { key: 'description', label: '说明' },
  ]},
  { key: 'lifecycles', label: '开闭店状态', endpoint: '/config/store-lifecycles', columns: [
    { key: 'sort_order', label: '排序', type: 'number' },
    { key: 'code', label: '编码' },
    { key: 'name', label: '名称' },
    { key: 'description', label: '说明' },
    { key: 'color', label: '颜色', type: 'color' },
  ]},
]

/* ═══ 配置表格组件 ═══ */
const ConfigTable: React.FC<{ tab: typeof MALL_TABS[0] | typeof STORE_TABS[0]; onEdit: (item: ConfigItem) => void; onDelete: (id: number) => void; refreshKey: number }> = ({ tab, onEdit, onDelete, refreshKey }) => {
  const [items, setItems] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.get<ConfigItem[]>(tab.endpoint).then(d => { setItems(d); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [tab.endpoint, refreshKey])

  return (
    <div className="card-level-1 overflow-hidden" style={{padding: 0}}>
      <table className="w-full text-xs">
        <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <tr>
            {tab.columns.map(col => (
              <th key={col.key} className="text-left px-3 py-2.5 font-medium text-[var(--text-secondary)] whitespace-nowrap">{col.label}</th>
            ))}
            <th className="text-left px-3 py-2.5 font-medium text-[var(--text-secondary)] whitespace-nowrap w-20">操作</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={tab.columns.length + 1} className="px-3 py-16 text-center text-[var(--text-muted)]">加载中...</td></tr>
          ) : items.length === 0 ? (
            <tr><td colSpan={tab.columns.length + 1} className="px-3 py-16 text-center text-[var(--text-muted)]">暂无数据</td></tr>
          ) : items.map(item => (
            <tr key={item.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)] transition-colors">
              {tab.columns.map(col => (
                <td key={col.key} className="px-3 py-2.5 text-[var(--text-secondary)]">
                  {col.type === 'color' 
                    ? <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{backgroundColor: (item as any)[col.key] || '#64748B'}} />{(item as any)[col.key] || ''}</span>
                    : (item as any)[col.key] ?? '-'}
                </td>
              ))}
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-1">
                  <button onClick={() => onEdit(item)} className="text-xs text-[var(--ai-blue-500)] hover:underline">编辑</button>
                  <Popconfirm title="确认删除" description={`确定要删除「${item.name}」吗？`} onConfirm={() => onDelete(item.id)} okText="确认" cancelText="取消">
                    <button className="text-xs text-red-400 hover:underline">删除</button>
                  </Popconfirm>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ═══ 配置抽屉表单 ═══ */
const ConfigDrawer: React.FC<{ open: boolean; item: ConfigItem | null; tab: typeof MALL_TABS[0]; onClose: () => void; onSaved: () => void }> = ({ open, item, tab, onClose, onSaved }) => {
  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => {
    if (item) {
      const f: Record<string, string> = { code: item.code, name: item.name, description: item.description || '', sort_order: String(item.sort_order) }
      tab.columns.forEach(c => { const v = (item as any)[c.key]; if (v !== undefined && !['code', 'name', 'description', 'sort_order', 'color'].includes(c.key)) f[c.key] = String(v || '') })
      if (item.color) f.color = item.color
      setForm(f)
    } else {
      setForm(Object.fromEntries(tab.columns.map(c => [c.key, c.type === 'number' ? '0' : c.type === 'color' ? '#64748B' : ''])))
    }
  }, [item, open, tab])

  const handleSave = async () => {
    if (!form.code || !form.name) { message.warning('编码和名称不能为空'); return }
    try {
      if (item) await api.put(`${tab.endpoint}/${item.id}`, form)
      else await api.post(tab.endpoint, form)
      message.success('保存成功')
      onSaved()
      onClose()
    } catch (e) { message.error('保存失败') }
  }

  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[420px] bg-[var(--bg-secondary)] border-l border-[var(--border-default)] z-40 overflow-y-auto shadow-2xl"
        style={{ animation: 'slideInRight 0.3s ease-out' }}>
        <div className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] px-5 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--text-primary)]">{item ? '编辑' : '新增'}</span>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"><X className="w-3.5 h-3.5" /></button>
        </div>
        <div className="p-5 space-y-4">
          {tab.columns.map(col => (
            <div key={col.key} className="flex flex-col gap-1">
              <label className="text-xs text-[var(--text-muted)]">{col.label}</label>
              {col.type === 'color' ? (
                <div className="flex items-center gap-2">
                  <input type="color" value={form[col.key] || '#64748B'} onChange={e => setForm(f => ({ ...f, [col.key]: e.target.value }))} className="w-8 h-8 rounded border-0 cursor-pointer" />
                  <span className="text-xs text-[var(--text-secondary)]">{form[col.key] || '#64748B'}</span>
                </div>
              ) : (
                <input
                  type={col.type === 'number' ? 'number' : 'text'}
                  value={form[col.key] || ''}
                  onChange={e => setForm(f => ({ ...f, [col.key]: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded border border-[var(--border-default)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--ai-blue-500)]"
                />
              )}
            </div>
          ))}
        </div>
        <div className="sticky bottom-0 bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)] px-5 py-3 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1.5 text-xs rounded border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]">取消</button>
          <button onClick={handleSave} className="px-4 py-1.5 text-xs rounded bg-[var(--ai-blue-500)] text-white hover:bg-[var(--ai-blue-600)]">保存</button>
        </div>
      </div>
    </>
  )
}

/* ═══ 主配置页面组件 ═══ */
const TabbedConfigPage: React.FC<{ title: string; subtitle: string; tabs: typeof MALL_TABS }> = ({ title, subtitle, tabs }) => {
  const [activeTab, setActiveTab] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ConfigItem | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`${tabs[activeTab].endpoint}/${id}`)
      message.success('删除成功')
      setRefreshKey(k => k + 1)
    } catch (e) { message.error('删除失败') }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="title-section">{title}</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">{subtitle}</p>
        </div>
        <button onClick={() => { setEditingItem(null); setDrawerOpen(true) }} className="px-4 py-1.5 text-xs rounded bg-[var(--ai-blue-500)] text-white hover:bg-[var(--ai-blue-600)] inline-flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" />新增
        </button>
      </div>
      <Tabs activeKey={String(activeTab)} onChange={(key) => setActiveTab(Number(key))} size="small">
        {tabs.map((t, i) => <Tabs.TabPane tab={t.label} key={String(i)} />)}
      </Tabs>
      <ConfigTable
        tab={tabs[activeTab]}
        onEdit={(item) => { setEditingItem(item); setDrawerOpen(true) }}
        onDelete={handleDelete}
        refreshKey={refreshKey}
      />
      <ConfigDrawer
        open={drawerOpen}
        item={editingItem}
        tab={tabs[activeTab]}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => setRefreshKey(k => k + 1)}
      />
    </div>
  )
}

export const StoreTypeConfig: React.FC = () => <TabbedConfigPage title="门店类型配置" subtitle="管理门店类型和开闭店状态" tabs={STORE_TABS} />
export const StoreLifecycleConfig = StoreTypeConfig
export const MallClassifications: React.FC = () => <TabbedConfigPage title="商场类型配置" subtitle="管理商场多维度分类体系" tabs={MALL_TABS} />
