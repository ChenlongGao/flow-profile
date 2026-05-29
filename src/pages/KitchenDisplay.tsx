import React from 'react'
import { FileText, ExternalLink, CheckCircle2 } from 'lucide-react'

const POLICIES = [
  {
    title: '《餐饮服务明厨亮灶工作指导意见》',
    issuer: '国家市场监督管理总局',
    date: '2018-04',
    summary: '要求餐饮服务提供者采用透明、视频等方式向社会公众展示餐饮服务相关过程。',
    items: [
      '鼓励餐饮服务提供者实施明厨亮灶',
      '视频监控覆盖食品加工制作关键部位',
      '鼓励消费者参与食品安全监督',
    ],
  },
  {
    title: '《网络餐饮服务食品安全监督管理办法》',
    issuer: '国家食品药品监督管理总局',
    date: '2018-01',
    summary: '规范网络餐饮服务经营行为，保证餐饮食品安全。',
    items: [
      '网络餐饮服务第三方平台需对入网经营者进行实名登记',
      '入网经营者需公示营业执照和食品经营许可证',
      '鼓励实施明厨亮灶并公开展示',
    ],
  },
  {
    title: '《食品安全法》第四十二条（明厨亮灶相关）',
    issuer: '全国人民代表大会常务委员会',
    date: '2015-10',
    summary: '国家鼓励餐饮服务提供者公开加工过程，接受社会监督。',
    items: [
      '食品生产经营者应当依照法律、法规从事生产经营活动',
      '保证食品安全，接受社会监督',
      '鼓励采用信息化手段实现食品加工过程透明化',
    ],
  },
]

const STANDARDS = [
  { label: '视频监控区域', value: '食品处理区（粗加工、切配、烹饪、专间、餐饮具清洗消毒等）' },
  { label: '摄像头分辨率', value: '不低于200万像素，确保画面清晰可辨识' },
  { label: '存储时长', value: '视频数据保存不少于15天' },
  { label: '展示方式', value: '可通过显示屏、手机APP等方式向消费者实时展示' },
  { label: '覆盖要求', value: '关键环节无死角覆盖，重点监控食品加工制作过程' },
]

export const KitchenDisplay: React.FC = () => {
  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <FileText className="w-4 h-4" />
          明厨亮灶
        </h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          明厨亮灶是指餐饮服务提供者采用透明玻璃、视频等方式，向社会公众展示餐饮服务相关过程的一种形式。
          本页面汇总了明厨亮灶相关的政策法规、技术标准和实施要求。
        </p>
      </div>

      {/* 政策法规 */}
      <div>
        <h3 className="title-section mb-3">政策法规</h3>
        <div className="space-y-3">
          {POLICIES.map((p, i) => (
            <div key={i} className="card-level-1 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">{p.title}</h4>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    {p.issuer} · {p.date}
                  </p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mb-2">{p.summary}</p>
              <div className="space-y-1">
                {p.items.map((item, j) => (
                  <div key={j} className="flex items-start gap-1.5 text-[11px] text-[var(--text-secondary)]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 技术标准 */}
      <div>
        <h3 className="title-section mb-3">技术标准要求</h3>
        <div className="card-level-1 overflow-hidden" style={{ padding: 0 }}>
          <table className="w-full text-xs">
            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)]">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-[var(--text-muted)] w-32">标准项</th>
                <th className="text-left px-4 py-2 font-medium text-[var(--text-muted)]">要求</th>
              </tr>
            </thead>
            <tbody>
              {STANDARDS.map((s, i) => (
                <tr key={i} className="border-b border-[var(--border-subtle)] last:border-0">
                  <td className="px-4 py-2 font-medium text-[var(--text-primary)]">{s.label}</td>
                  <td className="px-4 py-2 text-[var(--text-secondary)]">{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
