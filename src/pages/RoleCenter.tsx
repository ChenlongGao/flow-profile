import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Modal, Input, Select, Popconfirm, message, Button, Checkbox, Tag } from 'antd'
import { Plus, Trash2, Edit3, Shield } from 'lucide-react'

const PERM_MODULES = ['dashboard','diagnosis','alert','district','report','store','asset','system']
const MODULE_LABELS: Record<string,string> = { dashboard:'首页', diagnosis:'诊断', alert:'预警', district:'商圈', report:'报告', store:'门店', asset:'资产', system:'系统' }

export const RoleCenter: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>({ name:'',description:'',data_scope:'all',permissions:[] })
  const [isEdit, setIsEdit] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([api.get<any[]>('/admin/roles'), api.get<any[]>('/admin/permissions')])
      .then(([r,p]) => { setRoles(r); setPermissions(p) }).finally(()=>setLoading(false))
  }
  useEffect(()=>{load()},[])

  const save = async () => {
    try { if(isEdit){await api.put(`/admin/roles/${editing.id}`,editing);message.success('已更新')}else{await api.post('/admin/roles',editing);message.success('已创建')};setModalOpen(false);load() }catch{message.error('保存失败')}
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-base font-semibold text-[var(--text-primary)]">角色中心</h2><p className="text-xs text-[var(--text-muted)] mt-1">RBAC 角色管理，配置角色对应的权限集合</p></div>
        <button onClick={()=>{setEditing({name:'',description:'',data_scope:'all',permissions:[]});setIsEdit(false);setModalOpen(true)}} className="filter-btn-primary flex items-center gap-1.5"><Plus className="w-3.5 h-3.5"/>新增角色</button>
      </div>
      <div className="card-level-1 overflow-hidden" style={{padding:0}}>
        {loading?<div className="p-8 text-center text-xs text-[var(--text-muted)]">加载中...</div>:(
        <table className="w-full text-xs">
          <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            <tr>{['角色名称','说明','数据范围','权限数','权限列表','操作'].map(h=><th key={h} className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">{h}</th>)}</tr>
          </thead>
          <tbody>
            {roles.map((r:any)=>{ const perms: string[] = typeof r.permissions==='string'?JSON.parse(r.permissions):(r.permissions||[]); return (
              <tr key={r.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                <td className="px-4 py-2.5 font-medium text-[var(--text-primary)]">{r.name}</td>
                <td className="px-4 py-2.5 text-[var(--text-muted)]">{r.description||'-'}</td>
                <td className="px-4 py-2.5"><Tag>{r.data_scope==='all'?'全部':'按区域'}</Tag></td>
                <td className="px-4 py-2.5 text-number">{perms.length}</td>
                <td className="px-4 py-2.5 max-w-[300px]">{perms.slice(0,4).map(p=><Tag key={p} style={{margin:'0 2px 2px 0',fontSize:10}}>{p}</Tag>)}{perms.length>4&&<span className="text-[var(--text-muted)]"> +{perms.length-4}</span>}</td>
                <td className="px-4 py-2.5"><div className="flex items-center gap-1">
                  <Button size="small" type="text" icon={<Edit3 className="w-3 h-3"/>} onClick={()=>{setEditing({...r,permissions:perms});setIsEdit(true);setModalOpen(true)}}/>
                </div></td>
              </tr>
            )})}
          </tbody>
        </table>)}
      </div>
      <Modal title={isEdit?'编辑角色':'新增角色'} open={modalOpen} onCancel={()=>setModalOpen(false)} onOk={save} okText="保存" cancelText="取消" width={640} destroyOnClose>
        {editing&&<div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-[var(--text-secondary)] block mb-1">角色名称 *</label><Input size="small" value={editing.name||''} onChange={e=>setEditing({...editing,name:e.target.value})} /></div>
            <div><label className="text-xs text-[var(--text-secondary)] block mb-1">数据范围</label><Select size="small" value={editing.data_scope||'all'} onChange={v=>setEditing({...editing,data_scope:v})} options={[{value:'all',label:'全部数据'},{value:'region',label:'按区域'}]} style={{width:'100%'}}/></div>
          </div>
          <div><label className="text-xs text-[var(--text-secondary)] block mb-1">说明</label><Input size="small" value={editing.description||''} onChange={e=>setEditing({...editing,description:e.target.value})} /></div>
          <div className="p-3 rounded bg-[var(--bg-tertiary)]">
            <span className="text-xs text-[var(--text-secondary)] block mb-2">权限分配</span>
            {PERM_MODULES.map(mod=>{
              const mp = permissions.filter((p:any)=>p.module===mod)
              if(!mp.length)return null
              return (<div key={mod} className="mb-2">
                <span className="text-[10px] font-medium text-[var(--text-muted)]">{MODULE_LABELS[mod]||mod}</span>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                  {mp.map((p:any)=>(<Checkbox key={p.id} checked={(editing.permissions||[]).includes(p.code)} onChange={e=>{const next=e.target.checked?[...editing.permissions,p.code]:editing.permissions.filter((c:string)=>c!==p.code);setEditing({...editing,permissions:next})}}><span className="text-[11px]">{p.name}</span></Checkbox>))}
                </div>
              </div>)
            })}
          </div>
        </div>}
      </Modal>
    </div>
  )
}
