import React, { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client'
import { Select, DatePicker, Pagination } from 'antd'
import { CheckCheck } from 'lucide-react'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const LEVEL_OPTS = [{value:'',label:'全部'},{value:'critical',label:'紧急'},{value:'important',label:'重要'},{value:'normal',label:'一般'}]
const READ_OPTS = [{value:'',label:'全部'},{value:'0',label:'未读'},{value:'1',label:'已读'}]
const PAGE_SIZE = 15

export const AlertMessages: React.FC = () => {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [level, setLevel] = useState('')
  const [readStatus, setReadStatus] = useState('')
  const [timeRange, setTimeRange] = useState<[dayjs.Dayjs|null,dayjs.Dayjs|null]|null>(null)
  const [storeId, setStoreId] = useState('')
  const [storeList, setStoreList] = useState<any[]>([])

  useEffect(()=>{ api.get<any[]>('/meta/stores').then(d=>setStoreList(d||[])).catch(()=>{}) },[])

  const load = useCallback(() => {
    setLoading(true)
    const p = new URLSearchParams()
    p.set('limit', String(PAGE_SIZE))
    p.set('offset', String((page-1)*PAGE_SIZE))
    if(level) p.set('level', level)
    if(readStatus) p.set('is_read', readStatus)
    if(storeId) p.set('store_id', storeId)
    if(timeRange?.[0]) p.set('date_from', timeRange[0].format('YYYY-MM-DD'))
    if(timeRange?.[1]) p.set('date_to', timeRange[1].format('YYYY-MM-DD'))
    api.get<any>(`/notifications?${p.toString()}`).then(d=>{
      setItems(d.items||[])
      setTotal(d.total||0)
    }).finally(()=>setLoading(false))
  },[level,readStatus,storeId,timeRange,page])
  useEffect(()=>{load()},[load])

  const markRead = (id:number) => api.put(`/notifications/${id}/read`,{}).then(()=>{
    setItems(prev=>prev.map(i=>i.id===id?{...i,is_read:1}:i))
    setTotal(prev=>prev-1)
  })
  const markAllRead = () => api.put('/notifications/read-all',{}).then(()=>{load()})

  const doReset = () => { setLevel(''); setReadStatus(''); setStoreId(''); setTimeRange(null); setPage(1) }

  const levelTag = (l:string) => l==='critical'
    ? <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400">紧急</span>
    : l==='important'
    ? <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400">重要</span>
    : <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400">一般</span>

  return (
    <div className="flex flex-col" style={{height:'calc(100vh - 48px)'}}>
      <div className="px-6 pt-6 pb-0 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">预警消息</h2>
          <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--ai-blue-500)] transition-colors">
            <CheckCheck className="w-3.5 h-3.5"/>全部已读
          </button>
        </div>
      </div>
      <div className="px-6 pb-3 shrink-0">
        <div className="flex items-center gap-3 flex-wrap pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2"><span className="text-xs text-[var(--text-muted)]">等级</span><Select value={level||undefined} onChange={v=>{setLevel(v||'');setPage(1);load()}} allowClear placeholder="全部" style={{height:32,width:90}} options={LEVEL_OPTS}/></div>
          <div className="flex items-center gap-2"><span className="text-xs text-[var(--text-muted)]">状态</span><Select value={readStatus||undefined} onChange={v=>{setReadStatus(v||'');setPage(1);load()}} allowClear placeholder="全部" style={{height:32,width:80}} options={READ_OPTS}/></div>
          <button onClick={()=>{setPage(1);load()}} className="filter-btn-primary">查询</button>
          <button onClick={doReset} className="filter-btn-secondary">重置</button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-6 pb-3">
        {loading ? <div className="p-8 text-center text-xs text-[var(--text-muted)]">加载中...</div> :
        items.length===0 ? <div className="p-12 text-center text-xs text-[var(--text-muted)]">暂无消息</div> :
        <div className="space-y-2">
          {items.map((m:any) => (
            <div key={m.id} className={`p-4 rounded-lg border border-[var(--border-subtle)] border-l-2 ${m.is_read?'bg-[var(--bg-secondary)] border-l-[var(--border-subtle)]':'bg-[var(--bg-primary)]'} hover:shadow-sm transition-shadow ${
              m.level==='critical'?'border-l-red-500':m.level==='important'?'border-l-amber-500':'border-l-blue-500'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 pl-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    {levelTag(m.level)}
                    <span className="text-xs text-[var(--text-muted)]">{m.category==='flow_warning'?'客流预警':'系统通知'}</span>
                    <span className="text-xs text-[var(--text-muted)]">{m.store_id}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    {!m.is_read && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5"/>}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] mb-1">{m.title}</p>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{m.message}</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-2">{m.created_at?.slice(0,16)}</p>
                    </div>
                  </div>
                </div>
                {!m.is_read && (
                  <button onClick={()=>markRead(m.id)} className="text-xs text-[var(--ai-blue-500)] hover:text-[var(--ai-blue-600)] shrink-0 transition-colors">
                    标为已读
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        }
      </div>

      <div className="shrink-0" style={{display:'flex',justifyContent:'flex-end',padding:'8px 24px',background:'var(--bg-secondary)',borderTop:'1px solid var(--border-subtle)'}}>
        <Pagination current={page} pageSize={PAGE_SIZE} total={total} onChange={p=>setPage(p)} showQuickJumper showSizeChanger={false} showTotal={t=>`共 ${t} 条`} size="small"/>
      </div>
    </div>
  )
}
