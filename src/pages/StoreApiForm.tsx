import React, { useState } from 'react'
import { Input, Button, Tag, message, Tabs } from 'antd'
import { Link, CheckCircle2, Database } from 'lucide-react'

/* ═══ 门店字段表 ═══ */
const STORE_FIELDS = [
  { field: 'store_id', label: '门店ID', type: 'string', required: true, desc: '唯一门店标识' },
  { field: 'store_name', label: '门店名称', type: 'string', required: true, desc: '门店名称' },
  { field: 'brand_name', label: '品牌名称', type: 'string', required: false, desc: '所属品牌' },
  { field: 'store_status', label: '门店状态', type: 'enum', required: true, desc: 'open/closed/suspended/renovating' },
  { field: 'store_type', label: '门店类型', type: 'enum', required: false, desc: 'flagship/standard/express/cloud' },
  { field: 'province', label: '省份', type: 'string', required: true, desc: '所在省份' },
  { field: 'city', label: '城市', type: 'string', required: true, desc: '所在城市' },
  { field: 'district', label: '区县', type: 'string', required: false, desc: '所在区县' },
  { field: 'address', label: '详细地址', type: 'string', required: true, desc: '门店详细地址' },
  { field: 'longitude', label: '经度', type: 'decimal', required: false, desc: '门店经度坐标' },
  { field: 'latitude', label: '纬度', type: 'decimal', required: false, desc: '门店纬度坐标' },
  { field: 'phone', label: '联系电话', type: 'string', required: false, desc: '门店电话' },
  { field: 'business_hours', label: '营业时间', type: 'string', required: false, desc: '如 09:00-22:00' },
  { field: 'seats', label: '座位数', type: 'int', required: false, desc: '门店座位数' },
  { field: 'create_time', label: '创建时间', type: 'datetime', required: false, desc: '门店创建时间' },
]

interface ApiEndpoint {
  name: string
  url: string
  method: string
  desc: string
}

const defaultEndpoints: ApiEndpoint[] = [
  { name: '查询门店列表', url: '', method: 'GET', desc: '获取品牌/商户下所有门店列表，支持分页和筛选' },
  { name: '查询门店详情', url: '', method: 'GET', desc: '根据门店ID查询门店完整信息' },
  { name: '查询门店状态', url: '', method: 'GET', desc: '查询门店营业状态（营业中/休息/停业）' },
]

interface Props {
  apiType: 'store' | 'meituan_store' | 'qimai_store'
  title: string
}

export const StoreApiForm: React.FC<Props> = ({ apiType, title }) => {
  const [baseUrl, setBaseUrl] = useState('')
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>(
    defaultEndpoints.map(e => ({ ...e }))
  )
  const [saved, setSaved] = useState(false)

  const updateEndpoint = (idx: number, key: keyof ApiEndpoint, val: string) => {
    setEndpoints(prev => prev.map((e, i) => i === idx ? { ...e, [key]: val } : e))
  }

  const handleSave = () => {
    const config = { apiType, baseUrl, endpoints }
    localStorage.setItem(`store-api-${apiType}`, JSON.stringify(config))
    message.success(`${title} 配置已保存`)
    setSaved(true)
  }

  React.useEffect(() => {
    const saved_config = localStorage.getItem(`store-api-${apiType}`)
    if (saved_config) {
      try {
        const c = JSON.parse(saved_config)
        if (c.baseUrl) setBaseUrl(c.baseUrl)
        if (c.endpoints) setEndpoints(c.endpoints)
      } catch { /* ignore */ }
    }
  }, [apiType])

  return (
    <div className="space-y-4">
      <div className="card-level-1 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--text-primary)]">API 基础地址</span>
          {saved && <Tag color="green" style={{ fontSize: 10 }}>已配置</Tag>}
        </div>
        <div className="flex items-center gap-2">
          <Link className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
          <Input size="small" value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
            placeholder={apiType === 'meituan_store' ? 'https://waimaiopen.meituan.com/api/v1'
              : apiType === 'qimai_store' ? 'https://open.qimai.cn/api/v2'
              : 'https://api.example.com/store/v1'} />
          <Button size="small" type="primary" onClick={handleSave} icon={<CheckCircle2 className="w-3 h-3" />}>保存配置</Button>
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-xs font-medium text-[var(--text-primary)]">门店服务 API 接口</span>
        {endpoints.map((ep, idx) => (
          <div key={idx} className="card-level-1 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Tag color={idx === 0 ? 'blue' : idx === 1 ? 'orange' : 'green'} style={{ fontSize: 10 }}>
                {ep.method}
              </Tag>
              <span className="text-sm font-medium text-[var(--text-primary)]">{ep.name}</span>
              <span className="text-[10px] text-[var(--text-muted)]">{ep.desc}</span>
            </div>
            <Input size="small" value={ep.url} onChange={e => updateEndpoint(idx, 'url', e.target.value)}
              placeholder={`${baseUrl || '/api'}/store${idx === 0 ? '/list' : idx === 1 ? '/{store_id}/detail' : '/{store_id}/status'}`} />
          </div>
        ))}
      </div>

      <Tabs size="small" items={[
        {
          key: 'fields',
          label: '门店字段表',
          children: (
            <div className="card-level-1 overflow-hidden" style={{ padding: 0 }}>
              <table className="w-full text-xs">
                <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">字段名</th>
                    <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">中文名称</th>
                    <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">类型</th>
                    <th className="px-3 py-2 text-center font-medium text-[var(--text-secondary)]">必填</th>
                    <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">说明</th>
                  </tr>
                </thead>
                <tbody>
                  {STORE_FIELDS.map(f => (
                    <tr key={f.field} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                      <td className="px-3 py-1.5 font-mono text-[10px] text-[var(--ai-blue-500)]">{f.field}</td>
                      <td className="px-3 py-1.5 text-[var(--text-primary)]">{f.label}</td>
                      <td className="px-3 py-1.5">
                        <Tag color={f.type === 'string' ? 'blue' : f.type === 'int' ? 'orange' : f.type === 'decimal' ? 'orange' : f.type === 'datetime' ? 'purple' : f.type === 'enum' ? 'green' : 'default'}
                          style={{ fontSize: 10 }}>{f.type}</Tag>
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        {f.required ? <span className="text-red-400">●</span> : <span className="text-[var(--text-muted)]">○</span>}
                      </td>
                      <td className="px-3 py-1.5 text-[var(--text-muted)]">{f.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        },
      ]} />

      {/* ─── 模拟数据 ─── */}
      <div className="card-level-1 p-4 space-y-3" style={{ borderLeft: '3px solid #f59e0b' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium text-[var(--text-primary)]">模拟数据预览 · 茶颜悦色</span>
          </div>
          <Button size="small" onClick={() => {
            localStorage.setItem(`store-demo-${apiType}`, JSON.stringify(DEMO_STORES))
            message.success('已加载茶颜悦色 8 家门店模拟数据')
            // 强制刷新
            window.dispatchEvent(new Event('store-demo-updated'))
          }} icon={<Database className="w-3 h-3" />}>加载模拟数据</Button>
        </div>
        <StoreDemoTable apiType={apiType} />
      </div>
    </div>
  )
}

/* ═══ 门店模拟数据表格 ═══ */
const StoreDemoTable: React.FC<{apiType: string}> = ({apiType}) => {
  const [, forceUpdate] = useState(0)
  React.useEffect(() => {
    const handler = () => forceUpdate(n => n + 1)
    window.addEventListener('store-demo-updated', handler)
    return () => window.removeEventListener('store-demo-updated', handler)
  }, [])
  
  const raw = localStorage.getItem(`store-demo-${apiType}`)
  const stores: typeof DEMO_STORES = raw ? JSON.parse(raw) : []
  if (!stores.length) return <div className="text-[10px] text-[var(--text-muted)] py-2">点击"加载模拟数据"查看茶颜悦色门店示例</div>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px]">
        <thead className="border-b border-[var(--border-subtle)]">
          <tr>
            <th className="px-2 py-1.5 text-left text-[var(--text-muted)]">门店ID</th>
            <th className="px-2 py-1.5 text-left text-[var(--text-muted)]">门店名称</th>
            <th className="px-2 py-1.5 text-left text-[var(--text-muted)]">类型</th>
            <th className="px-2 py-1.5 text-left text-[var(--text-muted)]">状态</th>
            <th className="px-2 py-1.5 text-left text-[var(--text-muted)]">区县</th>
            <th className="px-2 py-1.5 text-left text-[var(--text-muted)]">座位</th>
            <th className="px-2 py-1.5 text-left text-[var(--text-muted)]">营业时间</th>
            <th className="px-2 py-1.5 text-left text-[var(--text-muted)]">电话</th>
          </tr>
        </thead>
        <tbody>
          {stores.map(s => (
            <tr key={s.store_id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
              <td className="px-2 py-1 text-[var(--ai-blue-500)] font-mono">{s.store_id}</td>
              <td className="px-2 py-1 font-medium text-[var(--text-primary)]">{s.store_name}</td>
              <td className="px-2 py-1"><Tag color={s.store_type==='flagship'?'red':s.store_type==='standard'?'blue':'default'} style={{fontSize:9}}>{s.store_type==='flagship'?'旗舰店':s.store_type==='standard'?'标准店':'快取店'}</Tag></td>
              <td className="px-2 py-1"><span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${s.store_status==='open'?'bg-emerald-400':'bg-red-400'}`} />{s.store_status==='open'?'营业中':'暂停营业'}</td>
              <td className="px-2 py-1 text-[var(--text-muted)]">{s.district}</td>
              <td className="px-2 py-1 text-[var(--text-muted)]">{s.seats}</td>
              <td className="px-2 py-1 text-[var(--text-muted)]">{s.business_hours}</td>
              <td className="px-2 py-1 text-[var(--text-muted)]">{s.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
