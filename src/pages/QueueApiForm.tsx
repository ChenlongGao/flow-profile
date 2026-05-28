import React, { useState } from 'react'
import { Input, Button, Tag, message, Tabs } from 'antd'
import { Link, CheckCircle2 } from 'lucide-react'

/* ═══ 排队字段表 ═══ */
const QUEUE_FIELDS = [
  { field: 'queue_id', label: '排队ID', type: 'string', required: true, desc: '唯一排队号' },
  { field: 'store_id', label: '门店ID', type: 'string', required: true, desc: '关联门店标识' },
  { field: 'queue_no', label: '排队号', type: 'string', required: true, desc: '顾客排队号码(A001)' },
  { field: 'customer_name', label: '客户姓名', type: 'string', required: false, desc: '排队客户' },
  { field: 'customer_phone', label: '客户电话', type: 'string', required: false, desc: '联系电话' },
  { field: 'queue_status', label: '排队状态', type: 'enum', required: true, desc: 'waiting/called/seated/cancelled/overtime' },
  { field: 'people_count', label: '用餐人数', type: 'int', required: true, desc: '排队人数' },
  { field: 'table_type', label: '桌型需求', type: 'enum', required: false, desc: 'small/medium/large/booth' },
  { field: 'wait_time', label: '等待时长', type: 'int', required: false, desc: '已等待分钟数' },
  { field: 'estimate_wait', label: '预计等待', type: 'int', required: false, desc: '预计还需等待分钟' },
  { field: 'queue_time', label: '排队时间', type: 'datetime', required: true, desc: '开始排队时间' },
  { field: 'call_time', label: '叫号时间', type: 'datetime', required: false, desc: '叫号时间' },
  { field: 'seat_time', label: '入座时间', type: 'datetime', required: false, desc: '实际入座时间' },
  { field: 'before_count', label: '前方等位数', type: 'int', required: false, desc: '前方还有多少桌' },
  { field: 'remark', label: '备注', type: 'string', required: false, desc: '排队备注' },
]

interface ApiEndpoint {
  name: string
  url: string
  method: string
  desc: string
}

const defaultEndpoints: ApiEndpoint[] = [
  { name: '查询门店排队进度', url: '', method: 'GET', desc: '获取门店当前排队概况，等待桌数/平均等时' },
  { name: '查询订单排队进度', url: '', method: 'GET', desc: '查询订单/顾客的当前排队状态与预计等待' },
  { name: '查询门店排队叫号列表', url: '', method: 'GET', desc: '获取门店当日叫号记录，含状态变更时间线' },
]

interface Props {
  apiType: 'queue' | 'meituan_queue' | 'qimai_queue'
  title: string
}

export const QueueApiForm: React.FC<Props> = ({ apiType, title }) => {
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
    localStorage.setItem(`queue-api-${apiType}`, JSON.stringify(config))
    message.success(`${title} 配置已保存`)
    setSaved(true)
  }

  React.useEffect(() => {
    const saved_config = localStorage.getItem(`queue-api-${apiType}`)
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
            placeholder={apiType === 'meituan_queue' ? 'https://waimaiopen.meituan.com/api/v1/queue'
              : apiType === 'qimai_queue' ? 'https://open.qimai.cn/api/v2/queue'
              : 'https://api.example.com/queue/v1'} />
          <Button size="small" type="primary" onClick={handleSave} icon={<CheckCircle2 className="w-3 h-3" />}>保存配置</Button>
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-xs font-medium text-[var(--text-primary)]">排队服务 API 接口</span>
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
              placeholder={`${baseUrl || '/api'}/queue${idx === 0 ? '/store/progress' : idx === 1 ? '/order/progress' : '/store/call-list'}`} />
          </div>
        ))}
      </div>

      <Tabs size="small" items={[
        {
          key: 'fields',
          label: '排队字段表',
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
                  {QUEUE_FIELDS.map(f => (
                    <tr key={f.field} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                      <td className="px-3 py-1.5 font-mono text-[10px] text-[var(--ai-blue-500)]">{f.field}</td>
                      <td className="px-3 py-1.5 text-[var(--text-primary)]">{f.label}</td>
                      <td className="px-3 py-1.5">
                        <Tag color={f.type === 'string' ? 'blue' : f.type === 'int' ? 'orange' : f.type === 'datetime' ? 'purple' : f.type === 'enum' ? 'green' : 'default'}
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
    </div>
  )
}
