import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { TreeView } from '../components/ui/TreeView'
import { SearchInput, FilterSelect } from '../components/ui/FilterBar'
import { X, List, Map } from 'lucide-react'
import type { TreeNode } from '../components/ui/TreeView'

export const MallStructure: React.FC = () => {
  const [treeData, setTreeData] = useState<TreeNode | null>(null)
  const [editingMall, setEditingMall] = useState<TreeNode | null>(null)
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)

  // 递归收集某节点下的所有商场
  const [search, setSearch] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [filterConsumption, setFilterConsumption] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')

  const collectMalls = (node: TreeNode): TreeNode[] => {
    if (node.type === 'mall') return [node]
    const malls: TreeNode[] = []
    if (node.children) {
      for (const child of node.children) {
        malls.push(...collectMalls(child))
      }
    }
    return malls
  }

  const mallsUnderSelection = selectedNode ? collectMalls(selectedNode) : []

  // 加载商场架构树（从 API，含 LBS 画像）+ 默认选中根节点显示全部
  useEffect(() => {
    api.get<any>('/malls/tree').then(d => {
      const normalizeTree = (node: any): any => ({
        ...node,
        id: node.mall_id ? node.mall_id : node.id,
        type: node.mall_id ? 'mall' : (node.type || 'root'),
        children: node.children ? node.children.map(normalizeTree) : undefined,
      })
      const root = normalizeTree(d)
      setTreeData(root)
      setSelectedNode(root)  // 默认选中根节点，显示全部
    }).catch(() => setTreeData(null))
  }, [])

  const [mallPage, setMallPage] = useState(1)
  const mallPageSize = 20

  const filteredMalls = mallsUnderSelection.filter((m: any) => {
    if (search && !m.name?.includes(search) && !m.id?.includes(search)) return false
    if (filterGrade && m.mall_grade !== filterGrade) return false
    if (filterConsumption && m.consumption_level !== filterConsumption) return false
    return true
  })
  const pagedMalls = filteredMalls.slice((mallPage-1)*mallPageSize, mallPage*mallPageSize)

  const handleNodeSelect = (node: TreeNode) => {
    setSelectedNode(node)
    setMallPage(1)
    setSearch(''); setFilterGrade(''); setFilterConsumption('')
    if (node.type === 'mall') setEditingMall(node)
  }

  return (
    <div className="p-6 h-full flex gap-4">
      {/* 左侧树 */}
      <div className="w-72 shrink-0 card-level-1 flex flex-col overflow-hidden" style={{padding: 0}}>
        <div className="card-header" style={{justifyContent: 'flex-start'}}>
          <span className="card-header-title">商场架构</span>
        </div>
        <div className="flex-1 overflow-y-auto" style={{padding: 'var(--card-padding)'}}>
        {treeData && <TreeView data={treeData} onSelect={handleNodeSelect} />}
        </div>
      </div>

      {/* 右侧商场列表 */}
      <div className="flex-1 card-level-1 overflow-hidden flex flex-col" style={{padding: 0}}>
        {!selectedNode ? (
          <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
            <span className="text-sm">请在左侧选择大区/省份/城市/区域查看商场列表</span>
          </div>
        ) : mallsUnderSelection.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
            <span className="text-sm">该节点下暂无商场数据</span>
          </div>
        ) : (
          <>
            <div className="card-header">
              <span className="card-header-title">{selectedNode.name}</span>
              <div className="flex items-center gap-2">
                <span className="card-header-meta">共 {filteredMalls.length} 家商场</span>
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
            <div className="px-5 py-2.5 border-b border-[var(--border-subtle)] flex items-center gap-2 flex-wrap shrink-0">
              <SearchInput value={search} onChange={(v) => { setSearch(v); setMallPage(1) }} placeholder="搜索商场名称/ID" />
              <FilterSelect value={filterGrade} onChange={(v) => { setFilterGrade(String(v)); setMallPage(1) }} placeholder="全部级别"
                options={['S','A','B','C','D'].map(v=>({label:`${v}级`,value:v}))} />
              <FilterSelect value={filterConsumption} onChange={(v) => { setFilterConsumption(String(v)); setMallPage(1) }} placeholder="全部消费定位"
                options={['顶奢/重奢','轻奢/高端','中端大众','社区便民','特色主题'].map(v=>({label:v,value:v}))} />
              <button onClick={() => setMallPage(1)} className="filter-btn-primary">查询</button>
              <button onClick={() => { setSearch(''); setFilterGrade(''); setFilterConsumption(''); setMallPage(1) }} className="filter-btn-secondary">重置</button>
            </div>
            <div className="card-body">
              {viewMode === 'map' ? (
                <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">地图模式（接入高德/百度地图后可启用）</div>
              ) : (
              <table className="w-full text-xs">
                <thead className="sticky top-0 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                  <tr>
                    {['商场ID','商场名称','开发商','面积(万㎡)','年销售(亿)','日均客流(万)','坪效租金','空置率','停车位','地铁','消费定位','级别'].map(h => (
                      <th key={h} className="text-left px-5 py-2 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedMalls.map((mall: TreeNode) => {
                    const d = mall as any
                    return (
                      <tr key={mall.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)] cursor-pointer" onClick={() => handleNodeSelect(mall)}>
                        <td className="px-5 py-2 text-number text-[var(--text-muted)]">{d.id}</td>
                        <td className="px-5 py-2 text-[var(--text-primary)] font-medium">{d.name}</td>
                        <td className="px-5 py-2 text-[var(--text-secondary)]">{d.developer || '-'}</td>
                        <td className="px-5 py-2 text-number">{d.commercial_area || '-'}</td>
                        <td className="px-5 py-2 text-number">{d.annual_sales || '-'}</td>
                        <td className="px-5 py-2 text-number">{d.daily_flow || '-'}</td>
                        <td className="px-5 py-2 text-number text-amber-400">{d.avg_rent ? '¥'+d.avg_rent : '-'}</td>
                        <td className="px-5 py-2">
                          {d.vacancy_rate != null ? (
                            <span className={`px-1 py-0.5 rounded text-[10px] ${d.vacancy_rate > 10 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{d.vacancy_rate}%</span>
                          ) : '-'}
                        </td>
                        <td className="px-5 py-2 text-number">{d.parking_spaces || '-'}</td>
                        <td className="px-5 py-2 text-[var(--text-secondary)]">{d.metro_lines || '-'}</td>
                        <td className="px-5 py-2 text-[var(--text-secondary)]">{d.consumption_level || '-'}</td>
                        <td className="px-5 py-2">
                          <span className={`font-bold ${d.mall_grade==='S'?'text-pink-500':d.mall_grade==='A'?'text-blue-500':'text-gray-400'}`}>{d.mall_grade || '-'}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              )}
            </div>
          </>
        )}
        {filteredMalls.length > mallPageSize && (
          <div className="px-5 py-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)] shrink-0">
            <span>共 <span className="text-[var(--text-primary)] font-medium">{filteredMalls.length}</span> 家商场</span>
            <div className="flex items-center gap-1">
            <button disabled={mallPage<=1} onClick={() => setMallPage(p=>p-1)}
              className="px-2 py-1 rounded border border-[var(--border-default)] disabled:opacity-30 hover:bg-[var(--bg-tertiary)]">上一页</button>
            <span className="px-2">{mallPage} / {Math.ceil(filteredMalls.length/mallPageSize)}</span>
            <button disabled={mallPage>=Math.ceil(filteredMalls.length/mallPageSize)} onClick={() => setMallPage(p=>p+1)}
              className="px-2 py-1 rounded border border-[var(--border-default)] disabled:opacity-30 hover:bg-[var(--bg-tertiary)]">下一页</button>
            </div>
          </div>
        )}
      </div>

      {/* 商场详情面板 */}
      {editingMall && (() => {
        const m = editingMall as any
        return (
          <>
            <div className="fixed inset-0 z-30 bg-black/40" onClick={() => setEditingMall(null)} />
            <div className="fixed right-0 top-0 bottom-0 w-[600px] bg-[var(--bg-secondary)] border-l border-[var(--border-default)] z-40 overflow-y-auto shadow-2xl"
              style={{ animation: 'slideInRight 0.3s ease-out' }}>
              <div className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] px-5 py-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--text-primary)]">{m.name}</span>
                <button onClick={() => setEditingMall(null)} className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-5">
                <div className="mb-6">
                  <h3 className="text-xs font-medium text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">基础标识</h3>
                  <div className="space-y-2.5 text-xs">
                    {[['商场ID', m.id], ['商场名称', m.name], ['开发商', m.developer], ['级别', m.mall_grade], ['状态', m.status]].map(([l,v]) => (
                      <div key={l} className="flex justify-between"><span className="text-[var(--text-muted)]">{l}</span><span className="text-[var(--text-primary)]">{v || '-'}</span></div>
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-xs font-medium text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">地理区位</h3>
                  <div className="space-y-2.5 text-xs">
                    {[['详细地址', m.address], ['地铁线路', m.metro_lines], ['停车位', m.parking_spaces]].map(([l,v]) => (
                      <div key={l} className="flex justify-between"><span className="text-[var(--text-muted)]">{l}</span><span className="text-[var(--text-primary)]">{v || '-'}</span></div>
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-xs font-medium text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">商业分级</h3>
                  <div className="space-y-2.5 text-xs">
                    {[['消费定位', m.consumption_level], ['销售梯队', m.sales_tier], ['建筑形态', m.building_type], ['建筑面积(万㎡)', m.commercial_area], ['楼层数', m.floor_count], ['餐饮楼层', m.dining_floors]].map(([l,v]) => (
                      <div key={l} className="flex justify-between"><span className="text-[var(--text-muted)]">{l}</span><span className="text-[var(--text-primary)]">{v || '-'}</span></div>
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-xs font-medium text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">核心运营指标</h3>
                  <div className="space-y-2.5 text-xs">
                    {[['年销售额(亿元)', m.annual_sales], ['日均客流(万人次)', m.daily_flow], ['坪效租金(元/㎡/天)', m.avg_rent ? '¥' + m.avg_rent : '-'], ['空置率', m.vacancy_rate != null ? m.vacancy_rate + '%' : '-']].map(([l,v]) => (
                      <div key={l} className="flex justify-between"><span className="text-[var(--text-muted)]">{l}</span><span className={`${String(l) === '空置率' && Number(m.vacancy_rate) > 10 ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>{v || '-'}</span></div>
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-xs font-medium text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">经营指标</h3>
                  <div className="space-y-2.5 text-xs">
                    {[['零售占比', m.retail_ratio ? m.retail_ratio + '%' : '-'], ['餐饮占比', m.catering_ratio ? m.catering_ratio + '%' : '-'], ['体验占比', m.experience_ratio ? m.experience_ratio + '%' : '-'], ['开业日期', m.opening_date], ['联系电话', m.phone]].map(([l,v]) => (
                      <div key={l} className="flex justify-between"><span className="text-[var(--text-muted)]">{l}</span><span className="text-[var(--text-primary)]">{v || '-'}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      })()}
    </div>
  )
}
