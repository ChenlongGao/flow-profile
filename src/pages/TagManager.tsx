import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { ActionButton } from '../components/ui/FilterBar'
import { FolderPlus, Plus, Trash2, X, Check, Pencil } from 'lucide-react'

interface TagGroup { id: number; name: string; color: string; sort_order: number }
interface TagItem { id: number; name: string; group_id: number; color: string; sort_order: number; group_name?: string; group_color?: string }

export const TagManager: React.FC = () => {
  const [groups, setGroups] = useState<TagGroup[]>([])
  const [tagsByGroup, setTagsByGroup] = useState<Record<number, TagItem[]>>({})
  const [allTags, setAllTags] = useState<TagItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  // Drawer states
  const [groupDrawer, setGroupDrawer] = useState(false)
  const [editGroup, setEditGroup] = useState<TagGroup | null>(null)
  const [gf, setGf] = useState({name:'',color:'#64748B',sort_order:'0'})

  const [tagDrawer, setTagDrawer] = useState(false)
  const [editTag, setEditTag] = useState<TagItem | null>(null)
  const [tf, setTf] = useState({name:'',group_id:0,color:'#64748B',sort_order:'0'})
  const [tagDrawerGroupId, setTagDrawerGroupId] = useState(0)

  const load = () => {
    Promise.all([api.get<TagGroup[]>('/config/tag-groups'), api.get<TagItem[]>('/config/tags')])
      .then(([gs, ts]) => {
        setGroups(gs)
        setAllTags(ts)
        const map: Record<number, TagItem[]> = {}
        gs.forEach(g => { map[g.id] = ts.filter(t => t.group_id === g.id) })
        setTagsByGroup(map)
        setLoading(false)
      }).catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [refreshKey])

  // ═══ Group CRUD ═══
  const openGroupForm = (g?: TagGroup) => {
    setEditGroup(g || null)
    setGf(g ? {name:g.name,color:g.color,sort_order:String(g.sort_order)} : {name:'',color:'#64748B',sort_order:'0'})
    setGroupDrawer(true)
  }
  const saveGroup = async () => {
    if (!gf.name) return
    try {
      if (editGroup) await api.put(`/config/tag-groups/${editGroup.id}`, gf)
      else await api.post('/config/tag-groups', gf)
      setGroupDrawer(false); setRefreshKey(k => k+1)
    } catch {}
  }
  const deleteGroup = async (id: number) => {
    if (!confirm('删除标签组将同时删除组内所有标签，确定？')) return
    await api.delete(`/config/tag-groups/${id}`)
    setRefreshKey(k => k+1)
  }

  // ═══ Tag CRUD ═══
  const openTagForm = (groupId: number, t?: TagItem) => {
    setTagDrawerGroupId(groupId)
    setEditTag(t || null)
    setTf(t ? {name:t.name,group_id:t.group_id,color:t.color,sort_order:String(t.sort_order)} : {name:'',group_id:groupId,color:groups.find(g=>g.id===groupId)?.color||'#64748B',sort_order:'0'})
    setTagDrawer(true)
  }
  const saveTag = async () => {
    if (!tf.name || !tf.group_id) return
    try {
      const cnt = tagsByGroup[tf.group_id]?.length || 0
      if (!editTag && cnt >= 20) { alert('该标签组已达上限（20个标签）'); return }
      if (editTag) await api.put(`/config/tags/${editTag.id}`, tf)
      else await api.post('/config/tags', tf)
      setTagDrawer(false); setRefreshKey(k => k+1)
    } catch {}
  }
  const deleteTag = async (id: number) => {
    if (!confirm('确定删除？')) return
    await api.delete(`/config/tags/${id}`)
    setRefreshKey(k => k+1)
  }

  if (loading) return <div className="p-6 space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="h-16 rounded animate-pulse bg-[var(--bg-tertiary)]"/>)}</div>

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="title-section">标签管理</h2><p className="text-xs text-[var(--text-muted)] mt-1">标签组 + 标签两级管理，每组最多 20 个标签</p></div>
        <ActionButton variant="primary" icon={<FolderPlus className="w-3.5 h-3.5" />} onClick={() => openGroupForm()}>新增标签组</ActionButton>
      </div>

      {groups.map(g => {
        const tags = tagsByGroup[g.id] || []
        return (
          <div key={g.id} className="card-level-1 p-4 group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded" style={{backgroundColor:g.color}}/>
                <span className="text-sm font-medium text-[var(--text-primary)]">{g.name}</span>
                <span className="text-[10px] text-[var(--text-muted)]">{tags.length}/20 个标签</span>
              </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openTagForm(g.id)} className="px-2 py-1 text-[10px] text-[var(--ai-blue-500)] hover:bg-[var(--bg-tertiary)] rounded flex items-center gap-0.5"><Plus className="w-2.5 h-2.5" />添加</button>
                <button onClick={() => openGroupForm(g)} className="px-2 py-1 text-[10px] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded flex items-center gap-0.5"><Pencil className="w-2.5 h-2.5" />编辑</button>
                <button onClick={() => deleteGroup(g.id)} className="px-2 py-1 text-[10px] text-red-400 hover:bg-red-500/10 rounded flex items-center gap-0.5"><Trash2 className="w-2.5 h-2.5" />删除</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map(t => (
                <span key={t.id} className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] cursor-pointer hover:opacity-80 transition-opacity group"
                  style={{backgroundColor:g.color+'20',color:g.color}} onClick={() => openTagForm(g.id, t)}>
                  {t.name}
                  <button onClick={e => {e.stopPropagation(); deleteTag(t.id)}} className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 text-[10px]">
                    <X className="w-2.5 h-2.5" />删除
                  </button>
                </span>
              ))}
              {tags.length === 0 && <span className="text-[10px] text-[var(--text-muted)]">暂无标签，点击"添加标签"</span>}
            </div>
          </div>
        )
      })}

      {/* ═══ Group Drawer ═══ */}
      {groupDrawer && <Drawer title={editGroup?'编辑标签组':'新增标签组'} onClose={()=>setGroupDrawer(false)}>
        <Field l="名称"><input value={gf.name} onChange={e=>setGf(f=>({...f,name:e.target.value}))} className="input-ai w-full h-9 text-xs px-3"/></Field>
        <Field l="颜色"><div className="flex items-center gap-2"><input type="color" value={gf.color} onChange={e=>setGf(f=>({...f,color:e.target.value}))} className="w-9 h-9 rounded border"/><span className="text-xs text-[var(--text-secondary)]">{gf.color}</span></div></Field>
        <Field l="排序"><input type="number" value={gf.sort_order} onChange={e=>setGf(f=>({...f,sort_order:e.target.value}))} className="input-ai w-full h-9 text-xs px-3"/></Field>
        <BtnRow onSave={saveGroup} onCancel={()=>setGroupDrawer(false)}/>
      </Drawer>}

      {/* ═══ Tag Drawer ═══ */}
      {tagDrawer && <Drawer title={editTag?'编辑标签':'新增标签'} onClose={()=>setTagDrawer(false)}>
        <Field l="标签组"><select value={tf.group_id} onChange={e=>setTf(f=>({...f,group_id:Number(e.target.value)}))} className="input-ai w-full h-9 text-xs px-3">{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>
        <Field l="名称"><input value={tf.name} onChange={e=>setTf(f=>({...f,name:e.target.value}))} className="input-ai w-full h-9 text-xs px-3"/></Field>
        <Field l="颜色"><div className="flex items-center gap-2"><input type="color" value={tf.color} onChange={e=>setTf(f=>({...f,color:e.target.value}))} className="w-9 h-9 rounded border"/><span className="text-xs text-[var(--text-secondary)]">{tf.color}</span></div></Field>
        <Field l="排序"><input type="number" value={tf.sort_order} onChange={e=>setTf(f=>({...f,sort_order:e.target.value}))} className="input-ai w-full h-9 text-xs px-3"/></Field>
        <BtnRow onSave={saveTag} onCancel={()=>setTagDrawer(false)}/>
      </Drawer>}
    </div>
  )
}

const Drawer: React.FC<{title:string; onClose:()=>void; children:React.ReactNode}> = ({title,onClose,children}) => (
  <>
    <div className="fixed inset-0 z-30 bg-black/40" onClick={onClose}/>
    <div className="fixed right-0 top-0 bottom-0 w-[380px] bg-[var(--bg-secondary)] border-l border-[var(--border-default)] z-40 overflow-y-auto shadow-2xl" style={{animation:'slideInRight 0.2s ease-out'}}>
      <div className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] px-5 py-3 flex items-center justify-between"><span className="text-sm font-semibold text-[var(--text-primary)]">{title}</span><button onClick={onClose}><X /></button></div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  </>
)
const Field: React.FC<{l:string; children:React.ReactNode}> = ({l,children}) => (
  <div><label className="text-xs text-[var(--text-muted)] mb-1.5 block">{l}</label>{children}</div>
)
const BtnRow: React.FC<{onSave:()=>void; onCancel:()=>void}> = ({onSave,onCancel}) => (
  <div className="flex gap-2 pt-2">
    <button onClick={onSave} className="btn-primary flex-1 h-9 text-xs rounded flex items-center justify-center gap-1"><Check className="w-3 h-3"/>保存</button>
    <button onClick={onCancel} className="flex-1 h-9 text-xs rounded border border-[var(--border-default)] text-[var(--text-muted)]">取消</button>
  </div>
)

export function parseTagsInfo(tagsInfo: string | null): {name:string;color:string}[] {
  if (!tagsInfo) return []
  return tagsInfo.split('||').map(s => { const [n,c] = s.split('|'); return {name:n,color:c||'#64748B'} })
}
