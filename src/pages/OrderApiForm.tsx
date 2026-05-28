import React, { useState } from 'react'
import { Input, Button, Tag, message, Tabs } from 'antd'
import { Link, CheckCircle2, Database } from 'lucide-react'

/* ═══ 茶颜悦色 模拟订单数据 ═══ */
const DEMO_ORDERS = [
  { order_id:'CY-D250518001', store_id:'CS-TPJ-001', customer_name:'张小姐', customer_phone:'138****6789', order_status:'completed', total_amount:'48.00', discount_amount:'5.00', actual_amount:'43.00', payment_method:'wechat', order_time:'2026-05-18T10:23:15', complete_time:'2026-05-18T10:38:42', items:'[{"name":"幽兰拿铁","qty":2,"price":18},{"name":"声声乌龙","qty":1,"price":12}]', remark:'少冰', table_no:'A06', dine_type:'dine_in' },
  { order_id:'CY-D250518002', store_id:'CS-TPJ-001', customer_name:'李先生', customer_phone:'139****4521', order_status:'completed', total_amount:'72.00', discount_amount:'8.00', actual_amount:'64.00', payment_method:'alipay', order_time:'2026-05-18T10:45:30', complete_time:'2026-05-18T11:02:15', items:'[{"name":"桂花弄","qty":2,"price":16},{"name":"抹茶菩提","qty":2,"price":20}]', remark:'', table_no:'B03', dine_type:'dine_in' },
  { order_id:'CY-D250518003', store_id:'CS-HXL-002', customer_name:'王女士', customer_phone:'137****8901', order_status:'processing', total_amount:'36.00', discount_amount:'0', actual_amount:'36.00', payment_method:'wechat', order_time:'2026-05-18T11:12:08', complete_time:'', items:'[{"name":"凤栖绿桂","qty":2,"price":18}]', remark:'去奶油', table_no:'', dine_type:'takeout' },
  { order_id:'CY-D250518004', store_id:'CS-IFS-003', customer_name:'赵先生', customer_phone:'186****3456', order_status:'completed', total_amount:'156.00', discount_amount:'20.00', actual_amount:'136.00', payment_method:'member_card', order_time:'2026-05-18T11:30:22', complete_time:'2026-05-18T11:55:10', items:'[{"name":"幽兰拿铁","qty":3,"price":18},{"name":"素颜锡兰","qty":2,"price":16},{"name":"芊芊马卡龙","qty":2,"price":22},{"name":"芝士奶盖","qty":1,"price":12}]', remark:'热饮', table_no:'C12', dine_type:'dine_in' },
  { order_id:'CY-D250518005', store_id:'CS-YLS-004', customer_name:'陈小姐', customer_phone:'158****7890', order_status:'completed', total_amount:'28.00', discount_amount:'3.00', actual_amount:'25.00', payment_method:'alipay', order_time:'2026-05-18T12:05:40', complete_time:'2026-05-18T12:18:55', items:'[{"name":"抹茶菩提","qty":1,"price":20},{"name":"桂花弄","qty":1,"price":16}]', remark:'加波霸', table_no:'', dine_type:'takeout' },
  { order_id:'CY-D250518006', store_id:'CS-WYGC-005', customer_name:'刘先生', customer_phone:'185****2345', order_status:'cancelled', total_amount:'54.00', discount_amount:'0', actual_amount:'0', payment_method:'', order_time:'2026-05-18T12:15:30', complete_time:'', items:'[{"name":"幽兰拿铁","qty":3,"price":18}]', remark:'', table_no:'D02', dine_type:'dine_in' },
  { order_id:'CY-D250518007', store_id:'CS-WJL-006', customer_name:'周女士', customer_phone:'133****5678', order_status:'pending', total_amount:'64.00', discount_amount:'0', actual_amount:'64.00', payment_method:'', order_time:'2026-05-18T12:28:00', complete_time:'', items:'[{"name":"声声乌龙","qty":2,"price":12},{"name":"幽兰拿铁","qty":2,"price":18}]', remark:'打包', table_no:'', dine_type:'delivery' },
  { order_id:'CY-D250518008', store_id:'CS-MZL-008', customer_name:'吴先生', customer_phone:'177****9012', order_status:'completed', total_amount:'40.00', discount_amount:'0', actual_amount:'40.00', payment_method:'wechat', order_time:'2026-05-18T12:35:15', complete_time:'2026-05-18T12:50:30', items:'[{"name":"凤栖绿桂","qty":1,"price":18},{"name":"抹茶菩提","qty":1,"price":20},{"name":"桂花弄","qty":1,"price":16}]', remark:'正常糖', table_no:'A03', dine_type:'dine_in' },
]

/* ═══ 订单字段表 ═══ */
const ORDER_FIELDS = [
  { field: 'order_id', label: '订单ID', type: 'string', required: true, desc: '唯一订单号' },
  { field: 'store_id', label: '门店ID', type: 'string', required: true, desc: '关联门店标识' },
  { field: 'customer_name', label: '客户姓名', type: 'string', required: false, desc: '下单客户' },
  { field: 'customer_phone', label: '客户电话', type: 'string', required: false, desc: '联系电话' },
  { field: 'order_status', label: '订单状态', type: 'enum', required: true, desc: 'pending/confirmed/processing/completed/cancelled' },
  { field: 'total_amount', label: '订单金额', type: 'decimal', required: true, desc: '订单总金额(元)' },
  { field: 'discount_amount', label: '优惠金额', type: 'decimal', required: false, desc: '折扣减免(元)' },
  { field: 'actual_amount', label: '实付金额', type: 'decimal', required: true, desc: '实际支付(元)' },
  { field: 'payment_method', label: '支付方式', type: 'enum', required: false, desc: 'wechat/alipay/cash/member_card' },
  { field: 'order_time', label: '下单时间', type: 'datetime', required: true, desc: 'ISO 8601 格式' },
  { field: 'complete_time', label: '完成时间', type: 'datetime', required: false, desc: '订单完成时间' },
  { field: 'items', label: '商品明细', type: 'array', required: false, desc: 'JSON数组 [{name,qty,price}]' },
  { field: 'remark', label: '备注', type: 'string', required: false, desc: '用户备注' },
  { field: 'table_no', label: '桌号', type: 'string', required: false, desc: '堂食桌号' },
  { field: 'dine_type', label: '用餐类型', type: 'enum', required: false, desc: 'dine_in/takeout/delivery' },
]

interface ApiEndpoint {
  name: string
  url: string
  method: string
  desc: string
}

const defaultEndpoints: ApiEndpoint[] = [
  { name: '查询订单列表', url: '', method: 'GET', desc: '获取门店/用户订单列表，支持时间范围筛选' },
  { name: '查询订单状态', url: '', method: 'GET', desc: '根据订单ID查询当前状态' },
  { name: '查询订单详情', url: '', method: 'GET', desc: '查询单个订单的完整信息' },
]

interface Props {
  apiType: 'order' | 'meituan' | 'qimai'
  title: string
}

export const OrderApiForm: React.FC<Props> = ({ apiType, title }) => {
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
    localStorage.setItem(`order-api-${apiType}`, JSON.stringify(config))
    message.success(`${title} 配置已保存`)
    setSaved(true)
  }

  // 加载已有配置
  React.useEffect(() => {
    const saved_config = localStorage.getItem(`order-api-${apiType}`)
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
      {/* 基础配置 */}
      <div className="card-level-1 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--text-primary)]">API 基础地址</span>
          {saved && <Tag color="green" style={{ fontSize: 10 }}>已配置</Tag>}
        </div>
        <div className="flex items-center gap-2">
          <Link className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
          <Input size="small" value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
            placeholder={apiType === 'meituan' ? 'https://waimaiopen.meituan.com/api/v1'
              : apiType === 'qimai' ? 'https://open.qimai.cn/api/v2'
              : 'https://api.example.com/order/v1'} />
          <Button size="small" type="primary" onClick={handleSave} icon={<CheckCircle2 className="w-3 h-3" />}>保存配置</Button>
        </div>
      </div>

      {/* 三个API接口 */}
      <div className="space-y-3">
        <span className="text-xs font-medium text-[var(--text-primary)]">订单服务 API 接口</span>
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
              placeholder={`${baseUrl || '/api'}/orders${idx === 0 ? '/list' : idx === 1 ? '/{order_id}/status' : '/{order_id}/detail'}`} />
          </div>
        ))}
      </div>

      {/* 订单字段表 */}
      <Tabs size="small" items={[
        {
          key: 'fields',
          label: '订单字段表',
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
                  {ORDER_FIELDS.map(f => (
                    <tr key={f.field} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                      <td className="px-3 py-1.5 font-mono text-[10px] text-[var(--ai-blue-500)]">{f.field}</td>
                      <td className="px-3 py-1.5 text-[var(--text-primary)]">{f.label}</td>
                      <td className="px-3 py-1.5">
                        <Tag color={f.type === 'string' ? 'blue' : f.type === 'decimal' ? 'orange' : f.type === 'datetime' ? 'purple' : f.type === 'enum' ? 'green' : 'default'}
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
            localStorage.setItem(`order-demo-${apiType}`, JSON.stringify(DEMO_ORDERS))
            message.success('已加载茶颜悦色 8 笔订单模拟数据')
            window.dispatchEvent(new Event('order-demo-updated'))
          }} icon={<Database className="w-3 h-3" />}>加载模拟数据</Button>
        </div>
        <OrderDemoTable apiType={apiType} />
      </div>
    </div>
  )
}

/* ═══ 订单模拟数据表格 ═══ */
const OrderDemoTable: React.FC<{apiType: string}> = ({apiType}) => {
  const [, forceUpdate] = useState(0)
  React.useEffect(() => {
    const handler = () => forceUpdate(n => n + 1)
    window.addEventListener('order-demo-updated', handler)
    return () => window.removeEventListener('order-demo-updated', handler)
  }, [])
  
  const raw = localStorage.getItem(`order-demo-${apiType}`)
  const orders: typeof DEMO_ORDERS = raw ? JSON.parse(raw) : []
  if (!orders.length) return <div className="text-[10px] text-[var(--text-muted)] py-2">点击"加载模拟数据"查看茶颜悦色订单示例</div>

  const statusColors: Record<string, string> = { completed: 'green', processing: 'blue', pending: 'orange', cancelled: 'red' }
  const statusLabels: Record<string, string> = { completed: '已完成', processing: '处理中', pending: '待支付', cancelled: '已取消' }
  const dineLabels: Record<string, string> = { dine_in: '堂食', takeout: '外带', delivery: '外卖' }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px]">
        <thead className="border-b border-[var(--border-subtle)]">
          <tr>
            <th className="px-2 py-1.5 text-left text-[var(--text-muted)]">订单ID</th>
            <th className="px-2 py-1.5 text-left text-[var(--text-muted)]">门店</th>
            <th className="px-2 py-1.5 text-left text-[var(--text-muted)]">客户</th>
            <th className="px-2 py-1.5 text-left text-[var(--text-muted)]">状态</th>
            <th className="px-2 py-1.5 text-right text-[var(--text-muted)]">金额</th>
            <th className="px-2 py-1.5 text-right text-[var(--text-muted)]">实付</th>
            <th className="px-2 py-1.5 text-left text-[var(--text-muted)]">支付</th>
            <th className="px-2 py-1.5 text-left text-[var(--text-muted)]">类型</th>
            <th className="px-2 py-1.5 text-left text-[var(--text-muted)]">商品</th>
            <th className="px-2 py-1.5 text-left text-[var(--text-muted)]">时间</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => {
            const items = JSON.parse(o.items || '[]')
            return (
              <tr key={o.order_id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                <td className="px-2 py-1 text-[var(--ai-blue-500)] font-mono">{o.order_id}</td>
                <td className="px-2 py-1 text-[var(--text-muted)]">{o.store_id.replace('CS-','').split('-')[0]}</td>
                <td className="px-2 py-1 font-medium text-[var(--text-primary)]">{o.customer_name}</td>
                <td className="px-2 py-1"><Tag color={statusColors[o.order_status]||'default'} style={{fontSize:9}}>{statusLabels[o.order_status]}</Tag></td>
                <td className="px-2 py-1 text-right text-[var(--text-primary)]">¥{o.total_amount}</td>
                <td className="px-2 py-1 text-right font-medium text-emerald-400">¥{o.actual_amount}</td>
                <td className="px-2 py-1 text-[var(--text-muted)]">{o.payment_method==='wechat'?'微信':o.payment_method==='alipay'?'支付宝':o.payment_method==='member_card'?'会员卡':'-'}</td>
                <td className="px-2 py-1"><Tag style={{fontSize:9}}>{dineLabels[o.dine_type]||o.dine_type}</Tag></td>
                <td className="px-2 py-1 text-[var(--text-muted)]">{items.map((i:any)=>i.name).join('、')}</td>
                <td className="px-2 py-1 text-[var(--text-muted)]">{o.order_time.slice(11,16)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
