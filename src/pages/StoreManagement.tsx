import React, { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client'
import { TreeView, TreeNode } from '../components/ui/TreeView'
import { SearchInput, ActionButton, FilterSelect } from '../components/ui/FilterBar'
import { List, Map, Download, X, Tag } from 'lucide-react'
import { parseTagsInfo } from './TagManager'

const STORE_TYPES: Record<string, string> = {
  'flagship': '旗舰店', 'standard': '标准店', 'compact': '紧凑店',
  'outlet': '奥特莱斯店', 'pop_up': '快闪店', 'express': 'EXPRESS店',
}
const LIFECYCLE_LABELS: Record<string, string> = {
  'planning': '筹备中', 'soft_open': '试运营', 'normal': '正常运营',
  'renovation': '装修中', 'closed': '已关闭',
}
const LIFECYCLE_COLORS: Record<string, string> = {
  'planning': 'bg-blue-500/10 text-blue-400', 'soft_open': 'bg-amber-500/10 text-amber-400',
  'normal': 'bg-emerald-500/10 text-emerald-400', 'renovation': 'bg-slate-500/10 text-slate-400',
  'closed': 'bg-red-500/10 text-red-400',
}

interface StoreItem {
  store_id: string; name: string; store_type: string; lifecycle: string;
  business_hours: string; floor_position: string; store_manager: string;
  staff_count: number; contact_phone: string; area_sqm: number | null;
  opened_at: string | null; monthly_rent: number | null;
  city_name: string; province_name: string; district_name: string; region_name: string; mall_name: string;
  tag_count?: number; tags_info?: string;
}

export const StoreManagement: React.FC = () => {
  const [tree, setTree] = useState<TreeNode | null>(null)
  const [stores, setStores] = useState<StoreItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [treeLoading, setTreeLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterLifecycle, setFilterLifecycle] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [detailStore, setDetailStore] = useState<StoreItem | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [nodeFilter, setNodeFilter] = useState<{type:string;id:string}|null>(null)

  const loadStoresPage = useCallback(async (p: number, ps: number, nf?: {type:string;id:string}|null) => {
    setLoading(true)
    try {
      let url = `/stores?page=${p}&page_size=${ps}`
      if (nf) url += `&node_type=${nf.type}&node_id=${nf.id}`
      const res = await api.get<any>(url)
      setStores(res.items || [])
      setTotal(res.total || 0)
    } catch { setStores([]); setTotal(0) }
    setLoading(false)
  }, [])

  useEffect(() => {
    api.get<any>('/store-tree').then(d => {
      const normalizeTree = (node: any): TreeNode => ({
        id: node.store_id ? node.store_id : node.id,
        name: node.name,
        type: node.store_id ? 'store' : (node.type || 'root'),
        children: node.children ? node.children.map(normalizeTree) : undefined,
        count: node.count,
        store_id: node.store_id,
      })
      setTree(normalizeTree(d))
      setTreeLoading(false)
    }).catch(() => { setTreeLoading(false) })
    loadStoresPage(1, 20)
  }, [loadStoresPage])

  const handleNodeSelect = useCallback(async (node: TreeNode) => {
    setSelectedNode(node)
    setFilterType(''); setFilterLifecycle(''); setPage(1)
    if (node.type === 'store') return
    if (node.type === 'root') {
      setNodeFilter(null)
      loadStoresPage(1, pageSize)
      return
    }
    const id = node.id.replace(/^\w+-/, '')
    const nf = { type: node.type, id }
    setNodeFilter(nf)
    loadStoresPage(1, pageSize, nf)
  }, [pageSize, loadStoresPage])

  const filtered = stores.filter(s => {
    if (search && !s.name.includes(search) && !s.store_id.includes(search)) return false
    if (filterType && s.store_type !== filterType) return false
    if (filterLifecycle && s.lifecycle !== filterLifecycle) return false
    return true
  })

  const currentLabel = selectedNode
    ? `${selectedNode.name}${selectedNode.count !== undefined ? ` (${selectedNode.count})` : ''}`
    : '全部门店'

  return (
    <div className="p-6 h-full flex gap-4">
      {/* ═══ 左侧树形卡片 ═══ */}
      <div className="w-72 shrink-0 card-level-1 flex flex-col overflow-hidden" style={{padding: 0}}>
        <div className="card-header" style={{justifyContent: 'flex-start'}}>
          <span className="card-header-title">门店架构</span>
        </div>
        <div className="flex-1 overflow-y-auto" style={{padding: 'var(--card-padding)'}}>
        {treeLoading ? (
          <div className="space-y-2">{Array.from({length:6}).map((_,i)=><div key={i} className="h-6 rounded animate-pulse bg-[var(--bg-tertiary)]"/>)}</div>
        ) : tree ? (
          <TreeView data={tree} onSelect={handleNodeSelect} selectedId={selectedNode?.id} />
        ) : null}
        </div>
      </div>

      {/* ═══ 右侧内容卡片 ═══ */}
      <div className="flex-1 card-level-1 overflow-hidden flex flex-col" style={{padding: 0}}>
        {/* 标题栏 */}
        <div className="card-header">
          <span className="card-header-title">{currentLabel}</span>
          <div className="flex items-center gap-2">
            <span className="card-header-meta">共 {total} 家门店</span>
            <div className="flex rounded border border-[var(--border-default)] overflow-hidden">
              {[{k:'list',i:<List className="w-3 h-3" />},{k:'map',i:<Map className="w-3 h-3" />}].map(m => (
                <button key={m.k} onClick={()=>setViewMode(m.k as any)}
                  className={`px-2 py-1.5 text-xs ${viewMode===m.k?'bg-[var(--ai-blue-500)] text-white':'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]'}`}>
                  {m.i}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="px-5 py-2.5 border-b border-[var(--border-subtle)] flex items-center gap-2 flex-wrap shrink-0">
          <SearchInput value={search} onChange={setSearch} placeholder="搜索名称/ID" />
          <FilterSelect value={filterType} onChange={(v) => setFilterType(String(v))} placeholder="全部类型"
            options={Object.entries(STORE_TYPES).map(([k,v]) => ({label:v,value:k}))} />
          <FilterSelect value={filterLifecycle} onChange={(v) => setFilterLifecycle(String(v))} placeholder="全部状态"
            options={Object.entries(LIFECYCLE_LABELS).map(([k,v]) => ({label:v,value:k}))} />
          <button onClick={() => loadStoresPage(1, pageSize, nodeFilter)} className="filter-btn-primary">查询</button>
          <button onClick={() => { setSearch(''); setFilterType(''); setFilterLifecycle(''); loadStoresPage(1, pageSize, nodeFilter) }} className="filter-btn-secondary">重置</button>
          <div className="flex-1" />
          <ActionButton variant="secondary" icon={<Download className="w-3.5 h-3.5" />}>导出</ActionButton>
        </div>

        {/* 列表 */}
        <div className="card-body">
          {viewMode === 'map' ? (
            <div className="p-6 flex items-center justify-center h-96 text-[var(--text-muted)] text-sm">
              地图模式（接入高德/百度地图后可启用）
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                <tr>
                  {['门店ID', '门店名称', '门店类型', '大区', '省份', '城市', '区/商圈', '商场', '楼层', '营业时间', '标签', '开闭店状态'].map(h=>(
                    <th key={h} className="text-left px-5 py-2.5 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stores.map(store => (
                  <tr key={store.store_id}
                    className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors"
                    onClick={() => setDetailStore(store)}>
                    <td className="px-5 py-2.5 text-number text-[var(--text-muted)]">{store.store_id}</td>
                    <td className="px-5 py-2.5 text-[var(--text-primary)] font-medium">{store.name}</td>
                    <td className="px-5 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">{store.store_type}</span>
                    </td>
                    <td className="px-5 py-2.5 text-[var(--text-secondary)]">{store.region_name || '-'}</td>
                    <td className="px-5 py-2.5 text-[var(--text-secondary)]">{store.province_name || '-'}</td>
                    <td className="px-5 py-2.5 text-[var(--text-secondary)]">{store.city_name}</td>
                    <td className="px-5 py-2.5 text-[var(--text-secondary)]">{store.district_name || '-'}</td>
                    <td className="px-5 py-2.5 text-[var(--text-secondary)]">{store.mall_name || '-'}</td>
                    <td className="px-5 py-2.5 text-[var(--text-secondary)]">{store.floor_position || '-'}</td>
                    <td className="px-5 py-2.5 text-[var(--text-secondary)]">{store.business_hours || '-'}</td>
                    <td className="px-5 py-2.5">
                      {(() => { const tgs = parseTagsInfo(store.tags_info||null); if (!tgs.length) return <span className="text-[var(--text-muted)]">-</span>
                        return <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 rounded text-[10px]" style={{backgroundColor:tgs[0].color+'20',color:tgs[0].color}}>{tgs[0].name}</span>
                          {tgs.length > 1 && <span className="text-[10px] text-[var(--text-muted)] cursor-pointer" onClick={e=>{e.stopPropagation();}}>+{tgs.length-1}</span>}
                        </span>
                      })()}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${LIFECYCLE_COLORS[store.lifecycle] || ''}`}>
                        {LIFECYCLE_LABELS[store.lifecycle] || store.lifecycle}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && stores.length === 0 && (
            <div className="py-16 text-center text-[var(--text-muted)] text-sm">
              {selectedNode ? '该节点下暂无门店' : '暂无门店数据'}
            </div>
          )}
        </div>

        {/* 分页 */}
        <div className="px-5 py-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)] shrink-0">
          <span>共 <span className="text-[var(--text-primary)] font-medium">{total}</span> 家</span>
          <div className="flex items-center gap-1">
            <button disabled={page<=1} onClick={() => { setPage(p=>p-1); loadStoresPage(page-1, pageSize, nodeFilter) }}
              className="px-2 py-1 rounded border border-[var(--border-default)] disabled:opacity-30 hover:bg-[var(--bg-tertiary)]">上一页</button>
            <span className="px-2">{page} / {Math.max(1, Math.ceil(total/pageSize))}</span>
            <button disabled={page>=Math.ceil(total/pageSize)} onClick={() => { setPage(p=>p+1); loadStoresPage(page+1, pageSize, nodeFilter) }}
              className="px-2 py-1 rounded border border-[var(--border-default)] disabled:opacity-30 hover:bg-[var(--bg-tertiary)]">下一页</button>
          </div>
        </div>
      </div>

      {/* ═══ 门店详情抽屉 ═══ */}
      {detailStore && (
        <>
          <div className="fixed inset-0 z-30 bg-black/40" onClick={() => setDetailStore(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-[600px] bg-[var(--bg-secondary)] border-l border-[var(--border-default)] z-40 overflow-y-auto shadow-2xl"
            style={{ animation: 'slideInRight 0.3s ease-out' }}>
            <div className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] px-5 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--text-primary)]">{detailStore.name}</span>
              <button onClick={() => setDetailStore(null)} className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-5">
              {/* 模块1：基础标识信息 */}
              <div className="mb-6">
                <h3 className="text-xs font-medium text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">基础标识</h3>
                <div className="space-y-2.5 text-xs">
                  {[
                    ['门店ID', detailStore.store_id],
                    ['门店名称', detailStore.name],
                    ['门店类型', STORE_TYPES[detailStore.store_type] || detailStore.store_type],
                    ['所属品牌', 'APPLE'],
                  ].map(([l,v]) => (
                    <div key={l} className="flex justify-between">
                      <span className="text-[var(--text-muted)]">{l}</span>
                      <span className="text-[var(--text-primary)]">{v || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 模块2：地理区位信息 */}
              <div className="mb-6">
                <h3 className="text-xs font-medium text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">地理区位</h3>
                <div className="space-y-2.5 text-xs">
                  {[
                    ['所在大区', detailStore.region_name],
                    ['所在省份', detailStore.province_name],
                    ['所在城市', detailStore.city_name],
                    ['所在区/商圈', detailStore.district_name],
                    ['所在商场', detailStore.mall_name],
                    ['楼层位置', detailStore.floor_position],
                  ].map(([l,v]) => (
                    <div key={l} className="flex justify-between">
                      <span className="text-[var(--text-muted)]">{l}</span>
                      <span className="text-[var(--text-primary)]">{v || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 模块3：运营信息 */}
              <div className="mb-6">
                <h3 className="text-xs font-medium text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">运营信息</h3>
                <div className="space-y-2.5 text-xs">
                  {[
                    ['开闭店状态', <span key="lc" className={`px-2 py-0.5 rounded-full text-[10px] ${LIFECYCLE_COLORS[detailStore.lifecycle] || ''}`}>{LIFECYCLE_LABELS[detailStore.lifecycle] || detailStore.lifecycle}</span>],
                    ['开业时间', detailStore.opened_at || '-'],
                    ['营业时间', detailStore.business_hours || '-'],
                    ['营业面积', detailStore.area_sqm ? `${detailStore.area_sqm} ㎡` : '-'],
                    ['店长/负责人', detailStore.store_manager || '-'],
                    ['联系电话', <span key="ph" className="text-number">{detailStore.contact_phone || '-'}</span>],
                    ['员工人数', detailStore.staff_count ? `${detailStore.staff_count} 人` : '-'],
                    ['月租金', detailStore.monthly_rent ? `¥${detailStore.monthly_rent.toLocaleString()}` : '-'],
                  ].map(([l,v],i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-[var(--text-muted)]">{l as string}</span>
                      <span className="text-[var(--text-primary)]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 模块4：标签管理 */}
              <StoreTagEditor storeId={detailStore.store_id} tagsInfo={detailStore.tags_info} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const StoreTagEditor: React.FC<{storeId:string; tagsInfo?:string}> = ({storeId, tagsInfo}) => {
  const [allTags, setAllTags] = useState<any[]>([])
  const [myTags, setMyTags] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  useEffect(() => { api.get<any[]>('/config/tags').then(setAllTags).catch(()=>{}) }, [])
  useEffect(() => { setMyTags(parseTagsInfo(tagsInfo||null)) }, [tagsInfo])
  const toggle = async (tag: any) => {
    const has = myTags.some(t => t.name === tag.name)
    try {
      if (has) { await api.delete(`/stores/${storeId}/tags/${tag.id}`); setMyTags(tgs => tgs.filter(t=>t.name!==tag.name)) }
      else { await api.post(`/stores/${storeId}/tags`, {tag_id:tag.id}); setMyTags(tgs => [...tgs,{name:tag.name,color:tag.color}]) }
    } catch {}
  }
  return (
    <div>
      <h3 className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
        <Tag />标签
        <button onClick={()=>setOpen(!open)} className="ml-auto text-[10px] text-[var(--ai-blue-500)] hover:underline">{open ? '收起' : '编辑'}</button>
      </h3>
      {!open ? (
        <div className="flex flex-wrap gap-1">
          {myTags.map(t => <span key={t.name} className="px-1.5 py-0.5 rounded text-[10px]" style={{backgroundColor:t.color+'20',color:t.color}}>{t.name}</span>)}
          {myTags.length === 0 && <span className="text-[10px] text-[var(--text-muted)]">暂无标签</span>}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {allTags.map(t => {
            const active = myTags.some(mt => mt.name === t.name)
            return <button key={t.id} onClick={()=>toggle(t)} className={`px-2 py-1 rounded text-[10px] transition-colors ${active ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
              style={{backgroundColor:t.color+'20',color:t.color, border: active ? `1px solid ${t.color}` : '1px solid transparent'}}>{t.name}</button>
          })}
        </div>
      )}
    </div>
  )
}
