import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Modal, Input, Select, Popconfirm, message, Button, Tag } from 'antd'
import { Plus, Trash2, Edit3, User as UserIcon, Building2, ChevronDown, ChevronRight, MapPin, Store, Shield, Stethoscope, Users, BriefcaseBusiness, Search } from 'lucide-react'
import { STORE_TREE, StoreNode, getRegionStats } from '../data/storeTree'

/* ═══ 部门 & 角色数据 ═══ */
const DEPARTMENTS = [
  { key:'store-ops', name:'门店运营', icon:Store, color:'#10B981' },
  { key:'site-select', name:'选址拓店', icon:MapPin, color:'#3B82F6' },
  { key:'flow-mgmt', name:'客流管店', icon:Users, color:'#F59E0B' },
  { key:'inspection', name:'巡检治店', icon:Shield, color:'#8B5CF6' },
  { key:'model-diag', name:'模型诊店', icon:Stethoscope, color:'#EC4899' },
]

const STAFF: Record<string, string[]> = {
  '华中区': ['张拓(总监)','李婷(门店运营)','王鹏(选址拓店)','陈静(客流管店)','刘洋(巡检治店)','赵敏(模型诊店)'],
  '华东区': ['李建(总监)','王婷(门店运营)','张伟(选址拓店)','陈娟(客流管店)','刘刚(巡检治店)'],
  '华南区': ['王敏(总监)','赵丽(门店运营)','李强(客流管店)','孙伟(巡检治店)'],
  '西南区': ['陈丽(总监)','刘芳(门店运营)','张明(选址拓店)','王芳(模型诊店)'],
  '华北区': ['赵强(总监)','李娜(门店运营)','王磊(选址拓店)'],
  '西北区': ['吴婷(总监)','陈伟(门店运营)','刘丽(客流管店)'],
}

const ICON_MAP: Record<string, React.ReactNode> = {
  brand: <Building2 className="w-3 h-3 text-red-400"/>,
  region: <MapPin className="w-3 h-3 text-blue-400"/>,
  province: <Building2 className="w-3 h-3 text-[var(--text-muted)]"/>,
  city: <Building2 className="w-2.5 h-2.5 text-[var(--text-muted)]"/>,
  district: <span className="w-2 h-2 rounded-full bg-[var(--bg-tertiary)]"/>,
  store: <Store className="w-2.5 h-2.5 text-emerald-400/40"/>,
}

/* ═══ 左侧组织架构树 ═══ */
const OrgTreePanel: React.FC<{ selectedRegion: string; onSelectRegion: (r: string) => void }> = ({ selectedRegion, onSelectRegion }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['茶颜悦色']))
  const toggle = (key: string) => {
    const next = new Set(expanded)
    next.has(key) ? next.delete(key) : next.add(key)
    setExpanded(next)
  }

  const renderNode = (node: StoreNode, depth: number) => {
    const key = `${node.type}-${node.name}`
    const isExpanded = expanded.has(key)
    const hasChildren = node.children && node.children.length > 0
    const isRegion = node.type === 'region'
    const isSelected = selectedRegion === node.name

    return (
      <div key={key}>
        <button
          onClick={() => {
            if (hasChildren) toggle(key)
            if (isRegion) onSelectRegion(node.name)
          }}
          className={`w-full flex items-center gap-1 py-1 text-left rounded transition-colors hover:bg-[var(--bg-tertiary)] ${isSelected ? 'bg-[rgba(59,130,246,0.1)]' : ''}`}
          style={{paddingLeft: `${depth*14+8}px`, paddingRight: 8}}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="w-3 h-3 text-[var(--text-muted)] shrink-0"/> : <ChevronRight className="w-3 h-3 text-[var(--text-muted)] shrink-0"/>
          ) : <span className="w-3 shrink-0"/>}
          {ICON_MAP[node.type] || null}
          <span className={`truncate flex-1 text-left ${node.type==='region'?'text-[11px] font-medium text-[var(--text-primary)]':node.type==='brand'?'text-xs font-semibold text-[var(--text-primary)]':'text-[10px] text-[var(--text-secondary)]'}`}>
            {node.name}
          </span>
          {node.type === 'region' && <Tag color="blue" style={{fontSize:8,lineHeight:'14px',padding:'0 4px'}}>{STAFF[node.name]?.length||0}人</Tag>}
        </button>
        {isExpanded && hasChildren && (
          <div>{node.children!.map(c => renderNode(c, depth+1))}</div>
        )}
      </div>
    )
  }

  return (
    <div className="py-1">
      {renderNode(STORE_TREE, 0)}
    </div>
  )
}

/* ═══ 主页面 ═══ */
export const UserCenter: React.FC = () => {
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>({})
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState('华中区')
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get<any[]>('/admin/users'), api.get<any[]>('/admin/roles')
    ]).then(([u,r]) => { setUsers(u); setRoles(r) }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    try {
      if (isEdit) { await api.put(`/admin/users/${editing.id}`, editing); message.success('已更新') }
      else { await api.post('/admin/users', editing); message.success('已创建') }
      setModalOpen(false); load()
    } catch { message.error('保存失败') }
  }
  const del = async (id: number) => { await api.delete(`/admin/users/${id}`); message.success('已删除'); load() }

  const regionStaff = STAFF[selectedRegion] || []

  return (
    <div className="p-4 space-y-3 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">帐户中心</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">品牌组织架构 · 用户管理 · 角色分配</p>
        </div>
        <button onClick={() => { setEditing({ username: '', display_name: '', password_hash: '', email: '', phone: '', role_id: roles[0]?.id, status: 'active' }); setIsEdit(false); setModalOpen(true) }} className="filter-btn-primary flex items-center gap-1.5"><Plus className="w-3.5 h-3.5"/>新增用户</button>
      </div>

      <div className="flex-1 flex gap-3 overflow-hidden">
        {/* ═══ 左侧：组织架构树 ═══ */}
        <div className="w-60 shrink-0 card-level-1 overflow-hidden flex flex-col" style={{padding:0}}>
          <div className="card-header px-4">
            <span className="card-header-title"><Building2 className="w-3.5 h-3.5 mr-1.5"/>组织架构</span>
          </div>
          <div className="flex-1 overflow-y-auto px-2">
            <OrgTreePanel selectedRegion={selectedRegion} onSelectRegion={setSelectedRegion} />
          </div>
          <div className="p-3 border-t border-[var(--border-subtle)]">
            <div className="text-[10px] font-medium text-[var(--text-primary)] mb-2">{selectedRegion} · 五大部门</div>
            <div className="space-y-1">
              {DEPARTMENTS.map(d => {
                const Icon = d.icon
                return (
                  <div key={d.key} className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] py-0.5" style={{borderLeft:`2px solid ${d.color}`,paddingLeft:6}}>
                    <Icon className="w-2.5 h-2.5" style={{color:d.color}}/>
                    <span>{d.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ═══ 右侧：用户管理 ═══ */}
        <div className="flex-1 flex flex-col overflow-hidden gap-3">
          {/* 区域员工总览 */}
          <div className="card-level-1 p-4 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400"/><span className="text-sm font-medium text-[var(--text-primary)]">{selectedRegion}</span>
                <Tag color="blue" style={{fontSize:10}}>{regionStaff.length}名员工</Tag>
              </div>
              <Input size="small" prefix={<Search className="w-3 h-3"/>} value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜索用户..." style={{width:180}}/>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {regionStaff.map(name => (
                <Tag key={name} style={{fontSize:10,cursor:'pointer'}}>{name}</Tag>
              ))}
            </div>
          </div>

          {/* 用户列表 */}
          <div className="card-level-1 overflow-hidden flex-1" style={{ padding: 0 }}>
            {loading ? <div className="p-8 text-center text-xs text-[var(--text-muted)]">加载中...</div> : (
              <table className="w-full text-xs">
                <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] sticky top-0">
                  <tr>{['用户名','显示名称','邮箱','手机','角色','状态','最后登录','操作'].map(h => <th key={h} className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                      <td className="px-4 py-2.5 font-medium text-[var(--text-primary)]">{u.username}</td>
                      <td className="px-4 py-2.5">{u.display_name}</td>
                      <td className="px-4 py-2.5 text-[var(--text-muted)]">{u.email || '-'}</td>
                      <td className="px-4 py-2.5 text-[var(--text-muted)]">{u.phone || '-'}</td>
                      <td className="px-4 py-2.5">{u.role_name || '-'}</td>
                      <td className="px-4 py-2.5"><span className={`inline-block w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-emerald-400' : 'bg-gray-400'}`} /></td>
                      <td className="px-4 py-2.5 text-[var(--text-muted)]">{u.last_login_at || '-'}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <Button size="small" type="text" icon={<Edit3 className="w-3 h-3" />} onClick={() => { setEditing(u); setIsEdit(true); setModalOpen(true) }} />
                          <Popconfirm title="确认删除" onConfirm={() => del(u.id)} okText="确认" cancelText="取消"><Button size="small" type="text" danger icon={<Trash2 className="w-3 h-3" />} /></Popconfirm>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <Modal title={isEdit ? '编辑用户' : '新增用户'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={save} okText="保存" cancelText="取消" width={520} destroyOnClose>
        {editing && <div className="grid grid-cols-2 gap-4 mt-4">
          <div><label className="text-xs text-[var(--text-secondary)] block mb-1">用户名 *</label><Input size="small" value={editing.username||''} onChange={e=>setEditing({...editing,username:e.target.value})} disabled={isEdit} /></div>
          <div><label className="text-xs text-[var(--text-secondary)] block mb-1">显示名称</label><Input size="small" value={editing.display_name||''} onChange={e=>setEditing({...editing,display_name:e.target.value})} /></div>
          <div className="col-span-2"><label className="text-xs text-[var(--text-secondary)] block mb-1">密码 {isEdit?'(留空不修改)':'*'}</label><Input.Password size="small" value={editing.password_hash||''} onChange={e=>setEditing({...editing,password_hash:e.target.value})} /></div>
          <div><label className="text-xs text-[var(--text-secondary)] block mb-1">邮箱</label><Input size="small" value={editing.email||''} onChange={e=>setEditing({...editing,email:e.target.value})} /></div>
          <div><label className="text-xs text-[var(--text-secondary)] block mb-1">手机</label><Input size="small" value={editing.phone||''} onChange={e=>setEditing({...editing,phone:e.target.value})} /></div>
          <div><label className="text-xs text-[var(--text-secondary)] block mb-1">角色</label><Select size="small" value={editing.role_id} onChange={v=>setEditing({...editing,role_id:v})} options={roles.map((r:any)=>({value:r.id,label:r.name}))} style={{width:'100%'}} /></div>
          <div><label className="text-xs text-[var(--text-secondary)] block mb-1">状态</label><Select size="small" value={editing.status||'active'} onChange={v=>setEditing({...editing,status:v})} options={[{value:'active',label:'启用'},{value:'disabled',label:'禁用'}]} style={{width:'100%'}} /></div>
        </div>}
      </Modal>
    </div>
  )
}
