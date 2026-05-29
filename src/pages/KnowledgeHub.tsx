import React, { useState } from 'react'
import { BookOpen, Star, FileText, Image, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Pagination } from 'antd'

/* ═══ 数据模型 ═══ */
interface KnowledgeItem {
  id: string
  title: string
  desc: string
  type: '知识卡片' | '素材'
  tag: string
  date: string
  author: string
  starred: boolean
}

interface KnowledgePackage {
  id: string
  name: string
  icon: string
  color: string
  count: number
  items: KnowledgeItem[]
}

/* ═══ 食安监管 & 餐饮SOP 知识数据 ═══ */
const KNOWLEDGE_PACKAGES: KnowledgePackage[] = [
  {
    id: 'food-safety-law',
    name: '食安法规库',
    icon: '⚖',
    color: '#EF4444',
    count: 28,
    items: [
      { id: 'FS001', title: '《食品安全法》核心条款解读', desc: '第四章 食品生产经营 — 餐饮服务提供者应当遵守的操作规范及法律责任', type: '知识卡片', tag: '法规', date: '2026-05-20', author: '法规部', starred: true },
      { id: 'FS002', title: '餐饮服务食品安全操作规范', desc: '市场监管总局2018年第12号公告，涵盖场所布局、设施设备、原料管理全流程', type: '知识卡片', tag: '规范', date: '2026-05-18', author: '法规部', starred: true },
      { id: 'FS003', title: '食品添加剂使用标准 GB2760', desc: '餐饮环节常用添加剂限量速查表，含防腐剂、着色剂、膨松剂等分类说明', type: '知识卡片', tag: '标准', date: '2026-04-25', author: '品质部', starred: true },
      { id: 'FS004', title: '餐饮具清洗消毒卫生规范', desc: '物理消毒与化学消毒的操作要点、温度/浓度要求及抽检频率', type: '知识卡片', tag: '卫生', date: '2026-04-12', author: '质检部', starred: true },
      { id: 'FS005', title: '从业人员健康管理制度', desc: '健康证的取得与更新流程、五病调离制度、晨检记录要求', type: '素材', tag: '制度', date: '2026-03-28', author: 'HR', starred: false },
      { id: 'FS006', title: '食品留样管理制度模板', desc: '留样品种、数量(≥125g)、时间(48h)、标签记录的标准模板', type: '素材', tag: '模板', date: '2026-03-15', author: '品质部', starred: false },
      { id: 'FS007', title: '食品安全事故应急预案', desc: '食物中毒事件分级响应、报告流程、留样封存、消费者沟通预案', type: '知识卡片', tag: '应急', date: '2026-03-08', author: '法规部', starred: false },
      { id: 'FS008', title: '进口冷链食品管控要求', desc: '海关检验检疫证明查验、追溯码管理、消毒证明核验流程', type: '知识卡片', tag: '冷链', date: '2026-02-20', author: '供应链', starred: false },
      { id: 'FS009', title: '食品安全自查表（月度）', desc: '12大类检查项目含评分标准，适用于门店月度自检', type: '素材', tag: '检查', date: '2026-05-01', author: '品质部', starred: false },
      { id: 'FS010', title: '餐饮企业证照清单', desc: '食品经营许可证、排污许可证、消防验收等必须公示的证照汇总', type: '素材', tag: '证照', date: '2026-01-10', author: '行政部', starred: false },
    ],
  },
  {
    id: 'sop-standard',
    name: 'SOP操作规范',
    icon: '📋',
    color: '#3B82F6',
    count: 35,
    items: [
      { id: 'SP001', title: '后厨动线设计规范SOP', desc: '从原料入口到出餐口的单向动线设计原则，生熟分离、洁污分区', type: '知识卡片', tag: '布局', date: '2026-05-22', author: '运营部', starred: true },
      { id: 'SP002', title: '食材验收标准SOP', desc: '蔬菜/肉类/水产/干货四类原料的感官检验标准和拒收红线', type: '知识卡片', tag: '验收', date: '2026-05-15', author: '供应链', starred: true },
      { id: 'SP003', title: '烹饪温度与时间控制标准', desc: '不同食材的中心温度要求(禽肉74℃/猪肉63℃)，及CCP关键控制点', type: '知识卡片', tag: 'HACCP', date: '2026-04-20', author: '品质部', starred: true },
      { id: 'SP004', title: '冷热链配送温度标准', desc: '热链≥60℃、冷链≤8℃的配送温度窗口及温度记录仪使用规范', type: '知识卡片', tag: '配送', date: '2026-04-08', author: '物流部', starred: true },
      { id: 'SP005', title: '废弃物处理SOP', desc: '厨余垃圾分类标准、油脂回收合同要求、日产日清记录表模板', type: '素材', tag: '环保', date: '2026-03-20', author: '运营部', starred: false },
      { id: 'SP006', title: '开店打烊标准操作流程', desc: '开门检查(设备/卫生/物料)+收档流程(盘点/清洁/锁门)逐项检查表', type: '素材', tag: '作息', date: '2026-03-01', author: '运营部', starred: false },
      { id: 'SP007', title: '交叉污染防控SOP', desc: '生熟砧板刀具色标管理(红/蓝/绿)、清洁消毒频次与责任人制度', type: '知识卡片', tag: '卫生', date: '2026-02-15', author: '品质部', starred: false },
      { id: 'SP008', title: '过敏原管理SOP', desc: '8大类过敏原标识、专间操作要求、顾客问询应答标准话术', type: '知识卡片', tag: '安全', date: '2026-02-01', author: '品质部', starred: false },
      { id: 'SP009', title: '设备日检周检月检表', desc: '冰箱/消毒柜/排烟系统/空调等设备的检查周期与标准表格', type: '素材', tag: '设备', date: '2026-05-10', author: '工程部', starred: false },
      { id: 'SP010', title: '外卖打包出餐SOP', desc: '封签使用规范、餐品核对流程、配送超时处理预案', type: '素材', tag: '外卖', date: '2026-01-20', author: '运营部', starred: false },
    ],
  },
  {
    id: 'daily-check',
    name: '日常检查标准',
    icon: '🔍',
    color: '#F59E0B',
    count: 22,
    items: [
      { id: 'DC001', title: '门店每日自检清单', desc: '晨检15项(人员/环境/设备)+午检8项(食材/温度)+晚检10项(清洁/收档)', type: '知识卡片', tag: '自检', date: '2026-05-25', author: '品质部', starred: true },
      { id: 'DC002', title: '害虫防治检查标准', desc: '防蝇帘/灭蝇灯/鼠饵站/蟑螂监测点布置规范及月度检查记录', type: '知识卡片', tag: '虫控', date: '2026-04-15', author: '第三方', starred: true },
      { id: 'DC003', title: '水质检测标准与频次', desc: '末梢水余氯≥0.05mg/L、菌落总数≤100CFU/mL的检测方法和第三方送检要求', type: '素材', tag: '水质', date: '2026-03-10', author: '质检部', starred: false },
      { id: 'DC004', title: '供应商审核检查表', desc: '资质审查/现场审核/产品抽样三级审核的标准表格与评分规则', type: '素材', tag: '供应商', date: '2026-02-28', author: '供应链', starred: false },
      { id: 'DC005', title: '温度记录检查规范', desc: '冷藏(0-8℃)/冷冻(≤-18℃)/热保(≥60℃)的温度记录频次及异常处理', type: '知识卡片', tag: '温控', date: '2026-05-05', author: '品质部', starred: false },
      { id: 'DC006', title: '标签标识检查标准', desc: '生产日期/保质期/储存条件/开封后使用期限的标签规范', type: '素材', tag: '标签', date: '2026-01-15', author: '法规部', starred: false },
    ],
  },
  {
    id: 'emergency-plan',
    name: '应急处置预案',
    icon: '🚨',
    color: '#8B5CF6',
    count: 16,
    items: [
      { id: 'EP001', title: '食物中毒应急处置预案', desc: '疑似病例报告(2小时内)→留样封存→配合调查→信息披露四步响应', type: '知识卡片', tag: '食安事故', date: '2026-05-10', author: '法规部', starred: true },
      { id: 'EP002', title: '媒体舆情应对预案', desc: '舆情监测→快速响应(黄金4小时)→统一口径→官方渠道发声的标准流程', type: '知识卡片', tag: '舆情', date: '2026-04-01', author: '公关部', starred: false },
      { id: 'EP003', title: '停水停电应急操作', desc: '停电后冷藏设备保温时限、应急发电设备启动流程、备选水源方案', type: '素材', tag: '应急', date: '2026-02-10', author: '运营部', starred: false },
      { id: 'EP004', title: '消防疏散应急预案', desc: '后厨灭火器配置标准、油锅起火处置、人员疏散路线图', type: '素材', tag: '消防', date: '2026-01-05', author: '行政部', starred: false },
    ],
  },
]

/* ═══ 页面组件 ═══ */
export const KnowledgeHub: React.FC = () => {
  const [selPkg, setSelPkg] = useState(KNOWLEDGE_PACKAGES[0].id)
  const [search, setSearch] = useState('')
  const [knowledgePage, setKnowledgePage] = useState(1)
  const [materialPage, setMaterialPage] = useState(1)
  const [showTab, setShowTab] = useState<'知识卡片'|'素材'>('知识卡片')
  const pageSize = 5

  const pkg = KNOWLEDGE_PACKAGES.find(p => p.id === selPkg) || KNOWLEDGE_PACKAGES[0]

  // 搜索过滤
  let filtered = pkg.items
  if (search.trim()) {
    const q = search.toLowerCase()
    filtered = filtered.filter(i => i.title.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q) || i.tag.toLowerCase().includes(q))
  }

  // 标星置顶 + 其余按日期降序
  const starred = filtered.filter(i => i.starred)
  const unstarred = filtered.filter(i => !i.starred).sort((a, b) => b.date.localeCompare(a.date))
  const sorted = [...starred, ...unstarred]

  // 按类型分表
  const knowledgeItems = sorted.filter(i => i.type === '知识卡片')
  const materialItems = sorted.filter(i => i.type === '素材')

  // 分页
  const kPageTotal = Math.max(1, Math.ceil(knowledgeItems.length / pageSize))
  const mPageTotal = Math.max(1, Math.ceil(materialItems.length / pageSize))
  const kPage = knowledgeItems.slice((knowledgePage - 1) * pageSize, knowledgePage * pageSize)
  const mPage = materialItems.slice((materialPage - 1) * pageSize, materialPage * pageSize)

  // 切换星标
  const [starState, setStarState] = useState<Record<string, boolean>>({})
  const toggleStar = (itemId: string) => {
    setStarState(prev => ({ ...prev, [itemId]: !prev[itemId] }))
    const item = pkg.items.find(i => i.id === itemId)
    if (item) item.starred = !item.starred
  }

  const isStarred = (itemId: string) => starState[itemId] !== undefined ? starState[itemId] : pkg.items.find(i => i.id === itemId)?.starred || false

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <div className="shrink-0 mb-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <BookOpen className="w-4 h-4" />知识中心
        </h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">食安监管 · 餐饮企业SOP管理规范知识库</p>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* ═══ 左侧：知识包导航 ═══ */}
        <div className="w-52 shrink-0 overflow-y-auto space-y-0.5">
          {KNOWLEDGE_PACKAGES.map(p => {
            const active = p.id === selPkg
            return (
              <div
                key={p.id}
                onClick={() => { setSelPkg(p.id); setSearch(''); setKnowledgePage(1); setMaterialPage(1) }}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all rounded-lg ${active ? 'bg-[var(--bg-tertiary)] border-l-2 border-l-[var(--ai-blue-500)]' : 'hover:bg-[var(--bg-tertiary)] border-l-2 border-l-transparent'}`}
              >
                <span className="text-base shrink-0">{p.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className={`text-xs font-medium truncate ${active ? 'text-[var(--ai-blue-500)]' : 'text-[var(--text-primary)]'}`}>{p.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{p.count} 项</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ═══ 右侧：知识内容 ═══ */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* 搜索 */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              className="w-full h-8 pl-9 pr-3 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--ai-blue-500)]"
              placeholder="搜索标题、描述、标签..."
              value={search}
              onChange={e => { setSearch(e.target.value); setKnowledgePage(1); setMaterialPage(1) }}
            />
          </div>

          {/* 标星知识卡片 */}
          {starred.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 mb-2">
                <Star className="w-3.5 h-3.5" style={{ color: pkg.color }} />
                标星知识 · {starred.length} 项
              </div>
              <div className="grid grid-cols-2 gap-3">
                {starred.slice(0, 4).map(item => (
                  <div key={item.id} className="p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm" style={{ borderColor: `${pkg.color}25`, background: `${pkg.color}08` }}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 min-w-0">
                        <div className="text-[11px] font-semibold text-[var(--text-primary)] truncate">{item.title}</div>
                        <div className="text-[9px] text-[var(--text-muted)] leading-relaxed line-clamp-2">{item.desc}</div>
                        <div className="flex items-center gap-2 text-[8px] text-[var(--text-muted)]">
                          <span style={{ color: pkg.color }}>{item.author}</span>
                          <span>{item.date}</span>
                          <span className="px-1 py-0.5 rounded text-[8px]" style={{ background: `${pkg.color}15`, color: pkg.color }}>{item.tag}</span>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); toggleStar(item.id) }} className="shrink-0 ml-1">
                        <Star className={`w-3.5 h-3.5 ${isStarred(item.id) ? 'text-amber-400 fill-amber-400' : 'text-[var(--text-muted)]'}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 切换：知识卡片 / 素材 */}
          <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] rounded-md p-0.5 w-fit">
            {(['知识卡片', '素材'] as const).map(t => (
              <div
                key={t}
                onClick={() => setShowTab(t)}
                className={`px-3 py-1 text-[11px] rounded cursor-pointer transition-all font-medium ${showTab === t ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
              >
                {t}
                {t === '知识卡片' ? ` (${knowledgeItems.length})` : ` (${materialItems.length})`}
              </div>
            ))}
          </div>

          {/* 表格 */}
          <div className="card-level-1 overflow-hidden" style={{ padding: 0 }}>
            <table className="w-full text-xs">
              <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-[var(--text-muted)] w-8" />
                  <th className="text-left px-3 py-2 font-medium text-[var(--text-muted)]">名称</th>
                  <th className="text-left px-3 py-2 font-medium text-[var(--text-muted)] w-20">标签</th>
                  <th className="text-left px-3 py-2 font-medium text-[var(--text-muted)] w-24">来源</th>
                  <th className="text-left px-3 py-2 font-medium text-[var(--text-muted)] w-24">更新日期</th>
                </tr>
              </thead>
              <tbody>
                {(showTab === '知识卡片' ? kPage : mPage).map(item => (
                  <tr key={item.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)] cursor-pointer">
                    <td className="px-3 py-2">
                      <button onClick={() => toggleStar(item.id)}>
                        <Star className={`w-3.5 h-3.5 ${isStarred(item.id) ? 'text-amber-400 fill-amber-400' : 'text-[var(--text-muted)]'}`} />
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-[var(--text-primary)]">{item.title}</div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-1">{item.desc}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: `${item.type === '知识卡片' ? '#3B82F6' : '#8B5CF6'}15`, color: item.type === '知识卡片' ? '#3B82F6' : '#8B5CF6' }}>{item.tag}</span>
                    </td>
                    <td className="px-3 py-2 text-[var(--text-muted)]">{item.author}</td>
                    <td className="px-3 py-2 text-[var(--text-muted)]">{item.date}</td>
                  </tr>
                ))}
                {(showTab === '知识卡片' ? kPage : mPage).length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-[var(--text-muted)]">暂无数据</td></tr>
                )}
              </tbody>
            </table>
            {(showTab === '知识卡片' ? knowledgeItems.length : materialItems.length) > pageSize && (
              <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-muted)]">
                  共 {showTab === '知识卡片' ? knowledgeItems.length : materialItems.length} 条
                </span>
                <Pagination
                  size="small"
                  current={showTab === '知识卡片' ? knowledgePage : materialPage}
                  pageSize={pageSize}
                  total={showTab === '知识卡片' ? knowledgeItems.length : materialItems.length}
                  onChange={p => showTab === '知识卡片' ? setKnowledgePage(p) : setMaterialPage(p)}
                  showSizeChanger={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
