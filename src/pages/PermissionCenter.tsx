import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Modal, Input, Select, Popconfirm, message, Button, Tag } from 'antd'
import { Plus, Trash2, Edit3, Key } from 'lucide-react'

const MODULE_OPTIONS = [
  {value:'dashboard',label:'首页',color:'#0EA5E9'},{value:'diagnosis',label:'诊断',color:'#8B5CF6'},
  {value:'alert',label:'预警',color:'#EF4444'},{value:'district',label:'商圈',color:'#F59E0B'},
  {value:'report',label:'报告',color:'#10B981'},{value:'store',label:'门店',color:'#EC4899'},
  {value:'asset',label:'资产',color:'#38BDF8'},{value:'system',label:'系统',color:'#64748B'},
]

export const PermissionCenter: React.FC = () => {
  const [perms, setPerms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>({code:'',name:'',module:'dashboard',description:''})
  const [isEdit, setIsEdit] = useState(false)

  useEffect(()=>{setLoading(true);api.get<any[]>('/admin/permissions').then(d=>setPerms(d)).finally(()=>setLoading(false))},[])

  const save = async () => {
    try { if(isEdit){await api.put(`/admin/permissions/${editing.id}`,editing);message.success('已更新')}else{await api.post('/admin/permissions',editing);message.success('已创建')};setModalOpen(false);api.get<any[]>('/admin/permissions').then(d=>setPerms(d)) }catch{message.error('保存失败')}
  }
  const del = async(id:number)=>{await api.delete(`/admin/permissions/${id}`);message.success('已删除');api.get<any[]>('/admin/permissions').then(d=>setPerms(d))}

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-base font-semibold text-[var(--text-primary)]">权限中心</h2><p className="text-xs text-[var(--text-muted)] mt-1">RBAC 权限定义，配置系统功能权限码</p></div>
        <button onClick={()=>{setEditing({code:'',name:'',module:'dashboard',description:''});setIsEdit(false);setModalOpen(true)}} className="filter-btn-primary flex items-center gap-1.5"><Plus className="w-3.5 h-3.5"/>新增权限</button>
      </div>
      <div className="card-level-1 overflow-hidden" style={{padding:0}}>
        {loading?<div className="p-8 text-center text-xs text-[var(--text-muted)]">加载中...</div>:(
        <table className="w-full text-xs">
          <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            <tr>{['权限编码','权限名称','所属模块','说明','操作'].map(h=><th key={h} className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">{h}</th>)}</tr>
          </thead>
          <tbody>
            {perms.map((p:any)=>{const mod=MODULE_OPTIONS.find(m=>m.value===p.module)
              return (<tr key={p.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                <td className="px-4 py-2.5 font-mono text-[11px] text-[var(--text-primary)]">{p.code}</td>
                <td className="px-4 py-2.5 text-[var(--text-primary)]">{p.name}</td>
                <td className="px-4 py-2.5">{mod&&<Tag color={mod.color}>{mod.label}</Tag>}</td>
                <td className="px-4 py-2.5 text-[var(--text-muted)]">{p.description||'-'}</td>
                <td className="px-4 py-2.5"><div className="flex items-center gap-1">
                  <Button size="small" type="text" icon={<Edit3 className="w-3 h-3"/>} onClick={()=>{setEditing(p);setIsEdit(true);setModalOpen(true)}}/>
                  <Popconfirm title="确认删除" onConfirm={()=>del(p.id)} okText="确认" cancelText="取消"><Button size="small" type="text" danger icon={<Trash2 className="w-3 h-3"/>}/></Popconfirm>
                </div></td>
              </tr>)
            })}
          </tbody>
        </table>)}
      </div>
      <Modal title={isEdit?'编辑权限':'新增权限'} open={modalOpen} onCancel={()=>setModalOpen(false)} onOk={save} okText="保存" cancelText="取消" width={520} destroyOnClose>
        {editing&&<div className="grid grid-cols-2 gap-4 mt-4">
          <div><label className="text-xs text-[var(--text-secondary)] block mb-1">权限编码 *</label><Input size="small" value={editing.code||''} onChange={e=>setEditing({...editing,code:e.target.value})} disabled={isEdit} placeholder="module.action"/></div>
          <div><label className="text-xs text-[var(--text-secondary)] block mb-1">所属模块</label><Select size="small" value={editing.module} onChange={v=>setEditing({...editing,module:v})} options={MODULE_OPTIONS} style={{width:'100%'}}/></div>
          <div className="col-span-2"><label className="text-xs text-[var(--text-secondary)] block mb-1">权限名称 *</label><Input size="small" value={editing.name||''} onChange={e=>setEditing({...editing,name:e.target.value})} placeholder="如：查看首页看板"/></div>
          <div className="col-span-2"><label className="text-xs text-[var(--text-secondary)] block mb-1">说明</label><Input.TextArea size="small" value={editing.description||''} onChange={e=>setEditing({...editing,description:e.target.value})} rows={2}/></div>
        </div>}
      </Modal>
    </div>
  )
}
