import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Modal, Input, Select, Switch, Popconfirm, message, Tag, Button, Tabs } from 'antd'
import { Plus, Trash2, Edit3, Cloud, CloudRain, CalendarDays, CheckCircle2, Database, Clock, Play } from 'lucide-react'

/* ═══ 类型 ═══ */
interface WeatherAPI { id: number; name: string; provider: string; api_key: string; base_url: string; granularity: string; is_enabled: number; is_default: number; description: string; last_sync_at?: string; last_sync_status?: string; }
interface HolidayAPI { id: number; name: string; provider: string; api_key: string; base_url: string; is_enabled: number; is_default: number; description: string; last_sync_at?: string; last_sync_status?: string; }

/* ═══ 天气常量 ═══ */
const WEATHER_PROVIDERS = [
  { value: 'qweather', label: '和风天气', color: '#0EA5E9', baseUrl: 'https://devapi.qweather.com/v7' },
  { value: 'openweathermap', label: 'OpenWeatherMap', color: '#F59E0B', baseUrl: 'https://api.openweathermap.org/data/3.0' },
  { value: 'seniverse', label: '心知天气', color: '#10B981', baseUrl: 'https://api.seniverse.com/v3' },
  { value: 'custom', label: '自定义', color: '#64748B', baseUrl: '' },
]
const GRANULARITY_OPTIONS = [
  { value: 'hourly', label: '小时级 (Hourly)' },
  { value: 'daily', label: '天级 (Daily)' },
  { value: 'both', label: '小时 + 天级' },
]

/* ═══ 假日常量 ═══ */
const HOLIDAY_PROVIDERS = [
  { value: 'tianapi', label: '天行数据', color: '#0EA5E9' },
  { value: 'timor', label: 'Timor 免费API', color: '#10B981' },
  { value: 'juhe', label: '聚合数据', color: '#F59E0B' },
  { value: 'custom', label: '自定义', color: '#64748B' },
]

type TabKey = 'weather' | 'holiday'

const weatherHeaders = ['名称','供应商','API Key','端点','数据粒度','默认','状态','操作','连通状态']
const holidayHeaders = ['名称','供应商','API Key','端点','默认','状态','操作','连通状态']

/* ═══ 通用表单弹窗 ═══ */
const FormModal: React.FC<{
  open: boolean; onClose: () => void; onSave: () => void; title: string; editing: any; setEditing: (v: any) => void;
  mode: 'weather' | 'holiday';
}> = ({ open, onClose, onSave, title, editing, setEditing, mode }) => (
  <Modal open={open} onCancel={onClose} onOk={onSave} okText="保存" cancelText="取消" width={580} destroyOnClose title={title}>
    {editing && (
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="col-span-2">
          <label className="text-xs text-[var(--text-secondary)] block mb-1">名称 <span className="text-red-400">*</span></label>
          <Input size="small" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="如：和风天气-正式环境" />
        </div>
        <div>
          <label className="text-xs text-[var(--text-secondary)] block mb-1">供应商 <span className="text-red-400">*</span></label>
          <Select size="small" value={editing.provider} onChange={v => {
            const p = (mode === 'weather' ? WEATHER_PROVIDERS : HOLIDAY_PROVIDERS).find(x => x.value === v)
            setEditing({ ...editing, provider: v, base_url: (p as any)?.baseUrl || editing.base_url })
          }} options={(mode === 'weather' ? WEATHER_PROVIDERS : HOLIDAY_PROVIDERS).map(p => ({ value: p.value, label: p.label }))} style={{ width: '100%' }} />
        </div>
        {mode === 'weather' && (
          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">数据粒度</label>
            <Select size="small" value={editing.granularity || 'both'} onChange={v => setEditing({ ...editing, granularity: v })}
              options={GRANULARITY_OPTIONS} style={{ width: '100%' }} />
          </div>
        )}
        {mode === 'holiday' && <div />}
        <div className="col-span-2">
          <label className="text-xs text-[var(--text-secondary)] block mb-1">API Key {mode === 'holiday' && editing.provider === 'timor' ? '(免费API无需Key)' : <span className="text-red-400">*</span>}</label>
          <Input.Password size="small" value={editing.api_key || ''} onChange={e => setEditing({ ...editing, api_key: e.target.value })}
            placeholder={mode === 'holiday' && editing.provider === 'timor' ? '免费API，无需填写' : '输入 API Key'} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-[var(--text-secondary)] block mb-1">API 端点 URL</label>
          <Input size="small" value={editing.base_url || ''} onChange={e => setEditing({ ...editing, base_url: e.target.value })}
            placeholder={mode === 'weather' ? '如：https://devapi.qweather.com/v7' : '如：https://timor.tech/api/holiday'} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-[var(--text-secondary)] block mb-1">说明</label>
          <Input.TextArea size="small" value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={2} placeholder="用途或备注" />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch size="small" checked={!!editing.is_enabled} onChange={v => setEditing({ ...editing, is_enabled: v ? 1 : 0 })} />
            <span className="text-xs text-[var(--text-secondary)]">启用</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch size="small" checked={!!editing.is_default} onChange={v => setEditing({ ...editing, is_default: v ? 1 : 0 })} />
            <span className="text-xs text-[var(--text-secondary)]">设为默认</span>
          </div>
        </div>
      </div>
    )}
  </Modal>
)

/* ═══════════════════════════════════════════
   主页面
   ═══════════════════════════════════════════ */
export const WeatherConfig: React.FC<{tabOverride?: string}> = ({tabOverride}) => {
  const [tab, setTab] = useState<TabKey>(tabOverride === 'holiday' ? 'holiday' : 'weather')
  const [activeTab, setActiveTab] = useState('config')

  // 同步外部tab
  useEffect(()=>{
    if(tabOverride==='weather') setTab('weather')
    if(tabOverride==='holiday') setTab('holiday')
  },[tabOverride])

  // 天气
  const [weatherApis, setWeatherApis] = useState<WeatherAPI[]>([])
  const [weatherLoading, setWeatherLoading] = useState(true)
  // 假日
  const [holidayApis, setHolidayApis] = useState<HolidayAPI[]>([])
  const [holidayLoading, setHolidayLoading] = useState(true)

  // 同步日志
  const [logs, setLogs] = useState<any[]>([])
  const [syncing, setSyncing] = useState<number | null>(null)

  // 弹窗共用
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>({})
  const [isEdit, setIsEdit] = useState(false)

  // 测试
  const [testing, setTesting] = useState<number | null>(null)
  const [testResult, setTestResult] = useState<{ id: number; ok: boolean; msg: string; data?: any } | null>(null)
  const [testResults, setTestResults] = useState<Record<number, { ok: boolean; msg: string; data?: any }>>({})
  const [testCity, setTestCity] = useState('北京')

  // 加载
  const loadWeather = () => { setWeatherLoading(true); api.get<WeatherAPI[]>('/config/weather-apis').then(d => setWeatherApis(d || [])).finally(() => setWeatherLoading(false)) }
  const loadHoliday = () => { setHolidayLoading(true); api.get<HolidayAPI[]>('/config/holiday-apis').then(d => setHolidayApis(d || [])).finally(() => setHolidayLoading(false)) }
  const loadLogs = () => {
    const ep = tab === 'weather' ? '/config/weather-apis/logs' : '/config/holiday-apis/logs'
    api.get<any[]>(ep).then(d => setLogs(d || []))
  }
  useEffect(() => { loadWeather(); loadHoliday(); loadLogs() }, [])
  useEffect(() => { loadLogs() }, [tab])

  const sourceType = tab === 'weather' ? '天气' : '假日'

  // ─── 保存 ───
  const save = async () => {
    const ep = tab === 'weather' ? '/config/weather-apis' : '/config/holiday-apis'
    try {
      if (isEdit && editing.id) { await api.put(`${ep}/${editing.id}`, editing); message.success('已更新') }
      else { await api.post(ep, editing); message.success('已创建') }
      setModalOpen(false); tab === 'weather' ? loadWeather() : loadHoliday()
    } catch { message.error('保存失败') }
  }
  const del = async (id: number) => {
    const ep = tab === 'weather' ? '/config/weather-apis' : '/config/holiday-apis'
    await api.delete(`${ep}/${id}`).then(() => { message.success('已删除'); tab === 'weather' ? loadWeather() : loadHoliday() }).catch(() => message.error('删除失败'))
  }
  const setDefault = async (api: any) => {
    const ep = tab === 'weather' ? '/config/weather-apis' : '/config/holiday-apis'
    await api.put(`${ep}/${api.id}`, { ...api, is_default: 1 }).then(() => { message.success(`已将「${api.name}」设为默认`); tab === 'weather' ? loadWeather() : loadHoliday() }).catch(() => message.error('设置失败'))
  }

  // ─── 同步 ───
  const doSync = async (id: number) => {
    setSyncing(id)
    try {
      const ep = tab === 'weather' ? `/config/weather-apis/${id}/sync` : `/config/holiday-apis/${id}/sync`
      const r = await api.post<any>(ep, {})
      message.success(`同步完成: ${r.fetched || 0}条`)
      loadLogs(); tab === 'weather' ? loadWeather() : loadHoliday()
    } catch { message.error('同步失败') }
    finally { setSyncing(null) }
  }

  // ─── 测试 ───
  const test = async (id: number) => {
    setTesting(id); setTestResult(null)
    const ep = tab === 'weather' ? `/config/weather-apis/${id}/test?city=${encodeURIComponent(testCity)}` : `/config/holiday-apis/${id}/test`
    try {
      const res = await api.get<{ success: boolean; message: string; data?: any }>(ep)
      setTestResult({ id, ok: res.success, msg: res.message, data: res.data })
      setTestResults(prev => ({ ...prev, [id]: { ok: res.success, msg: res.message, data: res.data } }))
    } catch { setTestResult({ id, ok: false, msg: '请求失败' }); setTestResults(prev => ({ ...prev, [id]: { ok: false, msg: '请求失败' } })) }
    finally { setTesting(null) }
  }

  // ─── 打开弹窗 ───
  const openCreate = () => {
    const isW = tab === 'weather'
    const base: any = { name: '', provider: isW ? 'qweather' : 'tianapi', api_key: '', base_url: isW ? WEATHER_PROVIDERS[0].baseUrl : '', is_enabled: 1, is_default: 0, description: '' }
    if (isW) base.granularity = 'both'
    setEditing(base); setIsEdit(false); setModalOpen(true)
  }
  const openEdit = (api: any) => { setEditing({ ...api }); setIsEdit(true); setModalOpen(true) }

  const apis = tab === 'weather' ? weatherApis : holidayApis
  const loading = tab === 'weather' ? weatherLoading : holidayLoading
  const providers = tab === 'weather' ? WEATHER_PROVIDERS : HOLIDAY_PROVIDERS

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">{sourceType}数据接入</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">管理{sourceType} API 接入与同步</p>
        </div>
        <button onClick={openCreate} className="filter-btn-primary flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />新增 API
        </button>
      </div>

      <Tabs size="small" activeKey={activeTab} onChange={setActiveTab} items={[
        {
          key: 'config', label: <span className="flex items-center gap-1"><Database className="w-3 h-3" />API配置</span>,
          children: (
            loading ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">加载中...</div>
            ) : apis.length === 0 ? (
              <div className="card-level-1 p-12 text-center">
                <Cloud className="w-8 h-8 mx-auto mb-3 text-[var(--text-muted)]" />
                <p className="text-sm text-[var(--text-muted)] mb-3">暂无{sourceType} API 配置</p>
                <button onClick={openCreate} className="filter-btn-primary text-xs">添加{sourceType} API</button>
              </div>
            ) : (
              <div className="card-level-1 overflow-hidden" style={{ padding: 0 }}>
                <table className="w-full text-xs">
                  <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                    <tr>
                      {(tab === 'weather' ? weatherHeaders : holidayHeaders).map(h => <th key={h} className={`px-3 py-2.5 font-medium text-[var(--text-secondary)] whitespace-nowrap ${(h === '默认' || h === '状态') ? 'text-center' : 'text-left'}`}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {apis.map((a: any) => {
                      const prov = providers.find(x => x.value === a.provider)
                      return (
                        <tr key={a.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                          <td className="px-3 py-2.5">
                            <div className="font-medium text-[var(--text-primary)]">{a.name}</div>
                            {a.description && <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{a.description}</div>}
                            {a.last_sync_at && <div className="text-[10px] text-[var(--text-muted)] mt-0.5">上次同步: {a.last_sync_at?.slice(0,16)} {a.last_sync_status==='success' ? <Tag color="green" style={{fontSize:10,margin:0}}>成功</Tag> : <Tag color="red" style={{fontSize:10,margin:0}}>失败</Tag>}</div>}
                          </td>
                          <td className="px-3 py-2.5">{prov ? <Tag color={prov.color}>{prov.label}</Tag> : a.provider}</td>
                          <td className="px-3 py-2.5 text-[var(--text-muted)] max-w-[140px] truncate" title={a.api_key}>
                            {a.api_key ? `${a.api_key.slice(0, 8)}...${a.api_key.slice(-4)}` : <span className="text-red-400">未配置</span>}
                          </td>
                          <td className="px-3 py-2.5 text-[var(--text-muted)] max-w-[180px] truncate" title={a.base_url}>{a.base_url || '-'}</td>
                          {tab === 'weather' && (
                            <td className="px-3 py-2.5">
                              <Tag color={a.granularity === 'both' ? '#0EA5E9' : a.granularity === 'hourly' ? '#8B5CF6' : '#10B981'}>
                                {GRANULARITY_OPTIONS.find(x => x.value === a.granularity)?.label || a.granularity}
                              </Tag>
                            </td>
                          )}
                          <td className="px-3 py-2.5 text-center">
                            {a.is_default ? <CheckCircle2 className="w-4 h-4 text-amber-400 inline" /> : <span className="text-[var(--text-muted)]">-</span>}
                          </td>
                          <td className="px-3 py-2.5 text-center"><span className={`inline-block w-2 h-2 rounded-full ${a.is_enabled ? 'bg-emerald-400' : 'bg-gray-400'}`} /></td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1">
                              <Button size="small" type="primary" loading={syncing === a.id} onClick={() => doSync(a.id!)} icon={<Play className="w-3 h-3" />}>同步</Button>
                              <Button size="small" type="text" onClick={() => test(a.id)} loading={testing === a.id}
                                icon={tab === 'weather' ? <CloudRain className="w-3 h-3" /> : <CalendarDays className="w-3 h-3" />} title="测试连接" />
                              <Button size="small" type="text" icon={<Edit3 className="w-3 h-3" />} onClick={() => openEdit(a)} title="编辑" />
                              {!a.is_default && (
                                <Button size="small" type="text" onClick={() => setDefault(a)} icon={<CheckCircle2 className="w-3 h-3" />} title="设为默认" />
                              )}
                              <Popconfirm title="确认删除" onConfirm={() => del(a.id)} okText="确认" cancelText="取消">
                                <Button size="small" type="text" danger icon={<Trash2 className="w-3 h-3" />} />
                              </Popconfirm>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            {testResults[a.id] ? (
                              testResults[a.id].ok && testResults[a.id].data ? (
                                <span className="text-[11px] text-emerald-400" title={testResults[a.id].msg}>
                                  {testResults[a.id].data.city} {testResults[a.id].data.temp}℃ {testResults[a.id].data.weather}
                                  {testResults[a.id].data.humidity ? ` 💧${testResults[a.id].data.humidity}%` : ''}
                                </span>
                              ) : (
                                <span className={`text-[11px] truncate block max-w-[160px] ${testResults[a.id].ok ? 'text-emerald-400' : 'text-red-400'}`}
                                  title={testResults[a.id].msg}>
                                  {testResults[a.id].ok ? '✓ 连接正常' : '✗ ' + testResults[a.id].msg}
                                </span>
                              )
                            ) : (
                              <span className="text-[11px] text-[var(--text-muted)]">未测试</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          )
        },
        {
          key: 'logs', label: <span className="flex items-center gap-1"><Clock className="w-3 h-3" />同步日志</span>,
          children: (
            <div className="card-level-1 overflow-hidden" style={{ padding: 0 }}>
              {logs.length === 0 ? (
                <div className="p-8 text-center text-sm text-[var(--text-muted)]">暂无同步记录</div>
              ) : (
                <div className="divide-y divide-[var(--border-subtle)]">
                  {logs.map((l: any) => (
                    <div key={l.id} className="p-2.5 text-[11px] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Tag color={l.status === 'success' ? 'green' : 'red'}>{l.status === 'success' ? '成功' : '失败'}</Tag>
                        <span className="font-medium">{l.api_config_name}</span>
                        <span className="text-[var(--text-muted)]">{l.created_at?.slice(0,16)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[var(--text-muted)]">
                        {l.status === 'success' ? (
                          <><span>抓取 {l.records_fetched}</span><span>新增 {l.records_inserted}</span><span>更新 {l.records_updated}</span><span>{l.duration_ms}ms</span></>
                        ) : (
                          <span className="text-red-400 truncate max-w-xs">{l.error_message}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        },
      ]} />

      {/* 测试栏（天气Tab专用） */}
      {tab === 'weather' && apis.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <CloudRain className="w-3 h-3" />
          <span>测试城市：</span>
          <Input size="small" value={testCity} onChange={e => setTestCity(e.target.value)} style={{ width: 100 }} />
          <span className="text-[10px]">点击测试按钮验证连接</span>
          <Button size="small" type="primary" onClick={() => {
            const api = apis.find((a: any) => a.is_default) || apis[0]
            if (api) test(api.id)
          }} icon={<CloudRain className="w-3 h-3" />}>测试连接</Button>
        </div>
      )}

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={save}
        title={isEdit ? '编辑 API 配置' : '新增 API 配置'} editing={editing} setEditing={setEditing} mode={tab} />
    </div>
  )
}
