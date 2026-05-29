import React, { useState, useEffect } from 'react'
import { api } from './api/client'
import { ConfigProvider, theme as antdTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { Remind, RightOne, ApplicationMenu } from '@icon-park/react'
import {
  BellRing, LayoutDashboard, Stethoscope,
  BarChart3, Store, Building2, Database, FileText,
  Wrench, Bell, TrendingUp, Shield, User, Sun, Moon, Cloud, CalendarDays, LineChart, Clock, Timer,
  MapPinned, MapPin, Target, ClipboardList, BriefcaseBusiness, SquarePlus, Video, ScanEye, Monitor, Cpu, MonitorCheck, AlertTriangle, Settings, Compass, Eye, ListChecks, Layers, Camera as CamIcon, Activity, GraduationCap, ClipboardCheck, BookOpen, ShieldCheck, Search, CheckCircle2, Brain, Zap, Library, Tags,
} from 'lucide-react'
import { StoreManagement } from './pages/StoreManagement'
import { StoreTypeConfig, StoreLifecycleConfig, MallClassifications } from './pages/StoreConfig'
import { MallStructure } from './pages/MallStructure'
import { TagManager } from './pages/TagManager'
import { StoreFlow } from './pages/StoreFlow'
import { MallLBS } from './pages/MallLBS'
import { FlowDiagnosis } from './pages/FlowDiagnosis'
import { GuandianOverview } from './pages/GuandianOverview'
import { AlertRules } from './pages/AlertRules'
import { Dashboard } from './pages/Dashboard'
import { AlgorithmModel } from './pages/AlgorithmModel'
import { DataSourcePage } from './pages/DataSourcePage'
import { HolidayData } from './pages/HolidayData'
import { ModelPrediction } from './pages/ModelPrediction'
import { UserCenter } from './pages/UserCenter'
import { RoleCenter } from './pages/RoleCenter'
import { LoginPage, checkToken } from './pages/LoginPage'
import { PermissionCenter } from './pages/PermissionCenter'
import { FlowPredict } from './pages/FlowPredict'
import { AlertDetail } from './pages/AlertDetail'
import { AlertMessages } from './pages/AlertMessages'
import { ReportDaily } from './pages/ReportDaily'
import { PushConfig } from './pages/PushConfig'
import { OverviewPage } from './pages/OverviewPage'
import { LocationDashboardOverview } from './pages/LocationDashboardOverview'
import { LocationRecommend } from './pages/LocationRecommend'
import { LocationList } from './pages/LocationList'
import { OpportunityManage } from './pages/OpportunityManage'
import { OpportunityDetail } from './pages/OpportunityDetail'
import { ExpansionTask } from './pages/ExpansionTask'
import { ExpansionGoal } from './pages/ExpansionGoal'
import { ExpansionGoalDashboard } from './pages/ExpansionGoalDashboard'
import { ExpansionMap } from './pages/ExpansionMap'
import { OpportunityMap } from './pages/OpportunityMap'
import { OpportunityData } from './pages/OpportunityData'
import { LocationTemplate } from './pages/LocationTemplate'
import { InspectionOverview } from './pages/InspectionOverview'
import { InspectionTodo } from './pages/InspectionTodo'
import { InspectionRanking } from './pages/InspectionRanking'
import { InspectionTask } from './pages/InspectionTask'
import { InspectionTaskList } from './pages/InspectionTaskList'
import { FoodSafetyInspection } from './pages/FoodSafetyInspection'
import { FoodSafetyPrevention } from './pages/FoodSafetyPrevention'
import { KitchenDisplay } from './pages/KitchenDisplay'
import { VideoLive, VideoPlayback, VideoDevice } from './pages/InspectionPages'
import { ViolationPending } from './pages/ViolationPending'
import { ViolationRectify, ViolationArchive, InspectionStoreReport, InspectionFoodSafety } from './pages/InspectionMore'
import { TrainingCourse, TrainingLearn, TrainingExam, TrainingResult, KnowledgeCenter } from './pages/TrainingPages'
import { KnowledgeHub } from './pages/KnowledgeHub'
import { ZhendianOverview, ZhendianStoreDiagnosis, ZhendianSkills, ZhendianDataConnect, ZhendianSchedule, StoreDynamicTags } from './pages/ZhendianPages'

/* ─── 导航树（对齐 PRD_PLAN.md） ─── */
interface NavChild { key: string; icon: React.ElementType; label: string }
interface NavGroup { key: string; icon: React.ElementType; label: string; children?: NavChild[] }

const navGroups: NavGroup[] = [
  // 1. 拓店看板
  {
    key: 'location-dashboard',
    icon: Compass,
    label: '拓店看板',
    children: [
      { key: 'location-dashboard-overview', icon: Eye, label: '选址总览' },
    ],
  },
  // 2. 选址中心
  {
    key: 'location-center',
    icon: MapPinned,
    label: '选址中心',
    children: [
      { key: 'location-recommend', icon: Target, label: '选址推荐' },
      { key: 'location-list', icon: ClipboardList, label: '选址清单' },
      { key: 'location-template', icon: FileText, label: '选址模板' },
    ],
  },
  // 3. 商机中心
  {
    key: 'opportunity-center',
    icon: BriefcaseBusiness,
    label: '商机中心',
    children: [
      { key: 'opportunity-data', icon: TrendingUp, label: '商机数据' },
      { key: 'opportunity-manage', icon: ListChecks, label: '商机进度' },
      { key: 'opportunity-map', icon: MapPin, label: '商机地图' },
    ],
  },
  // 4. 拓店中心
  {
    key: 'expansion-center',
    icon: SquarePlus,
    label: '拓店中心',
    children: [
      { key: 'expansion-goal', icon: TrendingUp, label: '拓店数据' },
      { key: 'expansion-map', icon: MapPin, label: '拓店地图' },
      { key: 'expansion-task', icon: ListChecks, label: '拓店进度' },
      { key: 'expansion-goal-dashboard', icon: Target, label: '目标管理' },
    ],
  },
  // 5. 巡检看板
  {
    key: 'inspection-dashboard',
    icon: LayoutDashboard,
    label: '巡检看板',
    children: [
      { key: 'inspection-overview', icon: Eye, label: '数据总览' },
      { key: 'inspection-todo', icon: ClipboardCheck, label: '待办中心' },
      { key: 'inspection-ranking', icon: ListChecks, label: '门店排名' },
    ],
  },
  // 6. 视频监控
  {
    key: 'video-center',
    icon: Video,
    label: '视频监控',
    children: [
      { key: 'video-live', icon: Monitor, label: '实时视频' },
      { key: 'video-playback', icon: ScanEye, label: '录像回放' },
      { key: 'video-device', icon: Cpu, label: '设备管理' },
    ],
  },
  // 7. 巡检任务
  {
    key: 'inspection-task',
    icon: ClipboardList,
    label: '巡检任务',
    children: [
      { key: 'inspection-task-list', icon: ClipboardCheck, label: '任务清单' },
      { key: 'inspection-realtime', icon: CamIcon, label: '实时巡检' },
      { key: 'inspection-combo', icon: Layers, label: '组合巡检' },
      { key: 'inspection-process', icon: ListChecks, label: '流程巡检' },
      { key: 'inspection-spot', icon: Search, label: '临时抽检' },
    ],
  },
  // 8. 食安任务
  {
    key: 'food-safety-center',
    icon: Shield,
    label: '食安任务',
    children: [
      { key: 'food-safety-check', icon: Shield, label: '食安巡检' },
      { key: 'food-safety-prevention', icon: Shield, label: '食安防控' },
      { key: 'inspection-food-safety', icon: ShieldCheck, label: '食安报告' },
      { key: 'kitchen-display', icon: FileText, label: '明厨亮灶' },
    ],
  },
  // 9. 违规管理
  {
    key: 'violation-center',
    icon: AlertTriangle,
    label: '违规管理',
    children: [
      { key: 'violation-pending', icon: AlertTriangle, label: '待办违规' },
      { key: 'violation-rectify', icon: CheckCircle2, label: '整改复核' },
      { key: 'violation-archive', icon: FileText, label: '违规档案' },
    ],
  },
  // 10. 巡检报告
  {
    key: 'inspection-report',
    icon: FileText,
    label: '巡检报告',
    children: [
      { key: 'inspection-store-report', icon: FileText, label: '门店巡检报告' },
    ],
  },
  // 11. 培学练考
  {
    key: 'training-center',
    icon: GraduationCap,
    label: '培学练考',
    children: [
      { key: 'training-knowledge', icon: Library, label: '知识空间' },
      { key: 'training-knowledge-hub', icon: BookOpen, label: '知识中心' },
      { key: 'training-course', icon: BookOpen, label: '课程中心' },
      { key: 'training-exam', icon: ClipboardCheck, label: '专项考试' },
      { key: 'training-result', icon: BarChart3, label: '学情考核' },
    ],
  },
  // 模型诊店 — 诊断总览
  {
    key: 'zhendian-overview',
    icon: Activity,
    label: '诊店总览',
    children: [
      { key: 'zhendian-overview-main', icon: Activity, label: '健康度诊断' },
    ],
  },
  // 模型诊店 — 单店诊断
  {
    key: 'zhendian-diagnosis',
    icon: Stethoscope,
    label: '单店诊断',
    children: [
      { key: 'zhendian-store-tags', icon: Tags, label: '门店动态标签' },
      { key: 'zhendian-store-diag', icon: Stethoscope, label: '单店深度诊断' },
    ],
  },
  // 模型诊店 — 技能广场
  {
    key: 'zhendian-skills',
    icon: Zap,
    label: '技能广场',
    children: [
      { key: 'zhendian-skills-main', icon: Zap, label: '技能广场' },
    ],
  },
  // 模型诊店 — 数据连接
  {
    key: 'zhendian-connect',
    icon: Cloud,
    label: '数据连接',
    children: [
      { key: 'zhendian-connect-main', icon: Cloud, label: '数据源管理' },
    ],
  },
  // 模型诊店 — 定时任务
  {
    key: 'zhendian-schedule',
    icon: Clock,
    label: '定时任务',
    children: [
      { key: 'zhendian-schedule-main', icon: Clock, label: '定时诊断' },
    ],
  },
  // 3. 管店看板
  {
    key: 'guandian-dashboard',
    icon: Store,
    label: '管店看板',
    children: [
      { key: 'guandian-overview', icon: Eye, label: '经营总览' },
    ],
  },
  // 4. 预警中心
  {
    key: 'alert-center',
    icon: Bell,
    label: '预警中心',
    children: [
      { key: 'alert-overview', icon: LayoutDashboard, label: '预警服务' },
      { key: 'alert-detail', icon: LayoutDashboard, label: '预警明细' },
      { key: 'alert-messages', icon: BellRing, label: '预警消息' },
    ],
  },
  // 5. 客流中心
  {
    key: 'flow-center',
    icon: BarChart3,
    label: '客流中心',
    children: [
      { key: 'flow-store', icon: Store, label: '门店客流' },
      { key: 'flow-mall', icon: Building2, label: '商场客流' },
    ],
  },
  // 6. 客流预警
  {
    key: 'flow-alert-center',
    icon: AlertTriangle,
    label: '客流预警',
    children: [
      { key: 'config-alert-rules', icon: Bell, label: '指标预警规则' },
      { key: 'alert-model-warning', icon: TrendingUp, label: '客流预警模型' },
    ],
  },
  // 7. 客流预测
  {
    key: 'model-predict-center',
    icon: TrendingUp,
    label: '客流预测',
    children: [
      { key: 'flow-predict', icon: LineChart, label: '客流预测看板' },
      { key: 'alert-model-predict', icon: TrendingUp, label: '客流预测模型' },
    ],
  },
  // 8. 客流问诊
  {
    key: 'model-diagnosis-center',
    icon: Stethoscope,
    label: '客流问诊',
    children: [
      { key: 'flow-diagnose', icon: Activity, label: '门店问诊看板' },
    ],
  },
  // 5. 数据中心
  {
    key: 'data-center',
    icon: Database,
    label: '数据中心',
    children: [
      { key: 'data-store-structure', icon: Store, label: '门店架构' },
      { key: 'data-mall-structure', icon: Building2, label: '商场架构' },
      { key: 'data-store-types', icon: FileText, label: '门店类型' },
      { key: 'data-mall-types', icon: FileText, label: '商场类型' },
      { key: 'data-tags', icon: FileText, label: '标签管理' },
      { key: 'data-holiday', icon: CalendarDays, label: '假日数据' },
    ],
  },
  // 6. 配置中心
  {
    key: 'config-center',
    icon: Wrench,
    label: '配置中心',
    children: [
      { key: 'config-push', icon: Bell, label: '消息推送' },
      { key: 'config-data-source', icon: Cloud, label: '数据接入' },
      { key: 'config-algorithm', icon: Wrench, label: 'AI大模型配置' },
    ],
  },
  // 7. 报告中心
  {
    key: 'report-center',
    icon: FileText,
    label: '报告中心',
    children: [
      { key: 'report-daily', icon: FileText, label: '日周月报' },
    ],
  },
  // 9. 系统管理
  {
    key: 'system',
    icon: Shield,
    label: '系统管理',
    children: [
      { key: 'system-users', icon: User, label: '帐户中心' },
      { key: 'system-permissions', icon: Shield, label: '权限中心' },
      { key: 'system-roles', icon: User, label: '角色中心' },
    ],
  },
]

const pageComponents: Record<string, React.FC> = {
  'alert-overview': Dashboard,
  'alert-detail': AlertDetail,
  'alert-messages': AlertMessages,
  'data-store-structure': StoreManagement,
  'data-mall-structure': MallStructure,
  'data-store-types': StoreTypeConfig,
  'data-mall-types': MallClassifications,
  'data-lifecycles': StoreLifecycleConfig,
  'data-tags': TagManager,
  'data-holiday': HolidayData,
  'flow-store': StoreFlow,
  'flow-mall': MallLBS,
  'alert-diagnose': FlowDiagnosis,
  'flow-diagnose': FlowDiagnosis,
  'flow-predict': FlowPredict,
  'report-daily': ReportDaily,
  'config-alert-rules': AlertRules,
  'config-warning': () => <ModelPrediction defaultTab="warning" />,
  'config-predict': () => <ModelPrediction defaultTab="prediction" />,
  'alert-model-warning': () => <ModelPrediction defaultTab="warning" hideTabs />,
  'alert-model-predict': () => <ModelPrediction defaultTab="prediction" hideTabs />,
  'config-algorithm': AlgorithmModel,
  'config-push': PushConfig,
  'config-data-source': DataSourcePage,
  'system-users': UserCenter,
  'system-permissions': PermissionCenter,
  'system-roles': RoleCenter,
  'location-recommend': LocationRecommend,
  'location-list': LocationList,
  'location-template': LocationTemplate,
  'location-dashboard-overview': LocationDashboardOverview,
  'opportunity-manage': (p: any) => <OpportunityManage setActivePage={p.setActivePage} />,
  'expansion-task': ExpansionTask,
  'expansion-goal': ExpansionGoal,
  'expansion-goal-dashboard': ExpansionGoalDashboard,
  'expansion-map': ExpansionMap,
  'opportunity-map': OpportunityMap,
  'opportunity-data': OpportunityData,
  'guandian-overview': GuandianOverview,
  'model-diagnosis-abnormal': () => null,
  'video-live': VideoLive,
  'video-playback': VideoPlayback,
  'video-device': VideoDevice,
  'inspection-overview': InspectionOverview,
  'inspection-todo': InspectionTodo,
  'inspection-ranking': InspectionRanking,
  'inspection-task': InspectionTask,
  'inspection-realtime': () => <InspectionTask mode="realtime" />,
  'inspection-combo': () => <InspectionTask mode="combo" />,
  'inspection-process': () => <InspectionTask mode="process" />,
  'inspection-spot': () => <InspectionTask mode="spot" />,
  'inspection-task-list': InspectionTaskList,
  'food-safety-check': FoodSafetyInspection,
  'violation-pending': ViolationPending,
  'violation-rectify': ViolationRectify,
  'violation-archive': ViolationArchive,
  'food-safety-prevention': FoodSafetyPrevention,
  'inspection-store-report': InspectionStoreReport,
  'inspection-food-safety': InspectionFoodSafety,
  'kitchen-display': KitchenDisplay,
  'training-knowledge': KnowledgeCenter,
  'training-knowledge-hub': KnowledgeHub,
  'training-course': TrainingCourse,
  'training-exam': TrainingExam,
  'training-result': TrainingResult,
  'zhendian-overview-main': ZhendianOverview,
  'zhendian-store-diag': ZhendianStoreDiagnosis,
  'zhendian-store-tags': StoreDynamicTags,
  'zhendian-skills-main': ZhendianSkills,
  'zhendian-connect-main': ZhendianDataConnect,
  'zhendian-schedule-main': ZhendianSchedule,
  'overview': OverviewPage,
}

/* ─── 顶部导航模块映射 ─── */
interface TopNavItem { key: string; label: string; desc: string; icon: React.ElementType; groups: string[] }
const topNavItems: TopNavItem[] = [
  { key: 'overview', label: '全景总览', desc: '经营总览', icon: LayoutDashboard, groups: [] },
  { key: 'tuodian', label: '选址拓店', desc: '选址拓店', icon: MapPinned, groups: ['location-dashboard', 'location-center', 'opportunity-center', 'expansion-center'] },
  { key: 'guandian', label: '客流管店', desc: '门店管理', icon: Store, groups: ['guandian-dashboard', 'alert-center', 'flow-center', 'flow-alert-center', 'model-predict-center', 'model-diagnosis-center'] },
  { key: 'zhidian', label: '巡检治店', desc: '智慧治理', icon: Shield, groups: ['inspection-dashboard', 'video-center', 'inspection-task', 'food-safety-center', 'violation-center', 'inspection-report', 'training-center'] },
  { key: 'zhendian', label: '模型诊店', desc: '诊断预警', icon: Stethoscope, groups: ['zhendian-overview','zhendian-diagnosis','zhendian-skills','zhendian-connect','zhendian-schedule'] },
  { key: 'guanli', label: '平台管理', desc: '后台管理', icon: Settings, groups: ['data-center', 'config-center', 'report-center', 'system'] },
]

const getTopNavForKey = (pageKey: string): string => {
  if (pageKey === 'overview') return 'overview'
  for (const item of topNavItems) {
    for (const g of navGroups) {
      if (item.groups.includes(g.key)) {
        if (g.key === pageKey) return item.key
        if (g.children?.some(c => c.key === pageKey)) return item.key
      }
    }
  }
  return 'overview'
}

const getFirstPageForTopNav = (navKey: string): string => {
  if (navKey === 'overview') return 'overview'
  const item = topNavItems.find(t => t.key === navKey)
  if (!item || !item.groups.length) return 'overview'
  const group = navGroups.find(g => g.key === item.groups[0])
  if (group?.children?.length) return group.children[0].key
  return group?.key || 'alert-overview'
}

export const App: React.FC = () => {
  const [auth, setAuth] = useState<{token:string,name:string,perms:string[]}|null>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('flow-profile-theme')
    return (saved === 'dark' || saved === 'light') ? saved : 'dark'
  })
  const getPageFromHash = () => {
    const h = window.location.hash.replace('#', '')
    return h && pageComponents[h] ? h : 'overview'
  }
  const [activePage, setActivePageState] = useState(getPageFromHash)
  const setActivePage = (page: string) => { 
    setActivePageState(page)
    setActiveTopNav(getTopNavForKey(page))
    window.location.hash = '#' + page 
  }

  const handleTopNavClick = (navKey: string) => {
    setActiveTopNav(navKey)
    const targetGroups = topNavItems.find(t => t.key === navKey)?.groups || []
    setExpandedGroups(new Set(targetGroups))
    const firstPage = getFirstPageForTopNav(navKey)
    setActivePageState(firstPage)
    window.location.hash = '#' + firstPage
  }
  useEffect(() => {
    const handler = () => setActivePageState(getPageFromHash())
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['alert-center','flow-center','data-center','config-center','report-center','location-center','system','location-dashboard','opportunity-center','expansion-center','guandian-dashboard','flow-alert-center','model-predict-center','model-diagnosis-center','inspection-dashboard','video-center','inspection-task','violation-center','inspection-report','training-center','zhendian-overview']))
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeTopNav, setActiveTopNav] = useState(() => getTopNavForKey(getPageFromHash()))

  // 登录态检查
  useEffect(() => {
    checkToken().then(r => {
      if (r.valid) setAuth({ token: localStorage.getItem('auth_token')!, name: r.name||'', perms: r.perms||[] })
      setAuthChecking(false)
    })
  }, [])

  const doLogin = (token: string, name: string, perms: string[]) => {
    setAuth({ token, name, perms })
  }

  const doLogout = () => {
    const t = localStorage.getItem('auth_token')
    if (t) fetch(`/api/auth/logout?token=${t}`, { method: 'POST' })
    localStorage.removeItem('auth_token'); localStorage.removeItem('auth_name'); localStorage.removeItem('auth_perms')
    setAuth(null); window.location.hash = ''
  }

  useEffect(() => {
    api.get<any>('/notifications/unread-count').then(d => setUnreadCount(d.count || 0)).catch(()=>{})
    const t = setInterval(()=>{ api.get<any>('/notifications/unread-count').then(d=>setUnreadCount(d.count||0)).catch(()=>{}) }, 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    localStorage.setItem('flow-profile-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const getPageLabel = (): string => {
    for (const group of navGroups) {
      if (group.key === activePage) return group.label
      if (group.children) {
        const child = group.children.find(c => c.key === activePage)
        if (child) return child.label
      }
    }
    return ''
  }

  // 今日日期 + 城市
  const today = new Date()
  const weekdays = ['周日','周一','周二','周三','周四','周五','周六']
  const dateStr = `${today.getFullYear()}年${today.getMonth()+1}月${today.getDate()}日 ${weekdays[today.getDay()]}`
  const [city, setCity] = useState('成都')
  const CITY_ZH_FE: Record<string,string> = {
    'beijing':'北京','shanghai':'上海','guangzhou':'广州','shenzhen':'深圳','chengdu':'成都',
    'hangzhou':'杭州','wuhan':'武汉','nanjing':'南京','chongqing':'重庆','tianjin':'天津',
    'xi\'an':'西安','xian':'西安','suzhou':'苏州','changsha':'长沙','zhengzhou':'郑州',
    'qingdao':'青岛','dalian':'大连','xiamen':'厦门','ningbo':'宁波','kunming':'昆明',
    'guiyang':'贵阳','haerbin':'哈尔滨','harbin':'哈尔滨','shenyang':'沈阳','jinan':'济南',
    'jin\'an':'济南','shijiazhuang':'石家庄','fuzhou':'福州','hefei':'合肥','nanchang':'南昌',
  }
  const [weatherText, setWeatherText] = useState('22°C 晴')
    const [weatherIcon, setWeatherIcon] = useState('☀️')

  const getParentGroup = (): string => {
    for (const group of navGroups) {
      if (group.key === activePage) return activePage
      if (group.children?.some(c => c.key === activePage)) return group.key
    }
    return ''
  }

  const PageComponent = pageComponents[activePage] || (() => {
    const label = getPageLabel()
    return (
      <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-3">
        <BarChart3 className="w-12 h-12 opacity-30" />
        <span className="text-sm">{label || '页面'}</span>
        <span className="text-xs text-[var(--text-muted)]">功能开发中，敬请期待</span>
      </div>
    )
  })

  const antdThemeConfig = {
    algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#ef4444',
      colorSuccess: '#10b981',
      colorWarning: '#f59e0b',
      colorError: '#ef4444',
      colorInfo: '#0ea5e9',
      borderRadius: 6,
      colorBgContainer: theme === 'dark' ? '#111827' : '#ffffff',
      colorBgElevated: theme === 'dark' ? '#1f2937' : '#ffffff',
      colorBorder: theme === 'dark' ? '#374151' : '#d1d5db',
      colorText: theme === 'dark' ? '#e5e7eb' : '#111827',
      colorTextSecondary: theme === 'dark' ? '#9ca3af' : '#6b7280',
    },
  }

  // 过滤菜单：权限 + 顶部导航模块
  const perms = auth?.perms || []
  const currentModuleGroups = topNavItems.find(t => t.key === activeTopNav)?.groups || []
  const filteredNavGroups = navGroups.filter(g => {
    // 总览隐藏侧栏所有菜单组
    if (activeTopNav === 'overview') return false
    // 按顶部模块过滤
    if (!currentModuleGroups.includes(g.key)) return false
    // 模型诊店 Demo：跳过权限校验，全部可见
    if (activeTopNav === 'zhendian') return true
    if (g.key === 'system') return perms.includes('system-users') || perms.includes('system-permissions') || perms.includes('system-roles')
    return g.children ? g.children.some(c => perms.includes(c.key)) : perms.includes(g.key)
  }).map(g => ({
    ...g,
    children: (activeTopNav === 'zhendian') ? g.children : (g.children ? g.children.filter(c => perms.includes(c.key)) : g.children)
  }))

  if (authChecking) return <div className="min-h-screen flex items-center justify-center bg-[#0f172a]"><span className="text-gray-400 text-sm">加载中...</span></div>
  if (!auth) return <LoginPage onLogin={doLogin} />

  return (
    <ConfigProvider theme={antdThemeConfig} locale={zhCN}>
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* ─── 左侧导航 ─── */}
      <aside className={`shrink-0 flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)] transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
        <div className="flex items-center px-5 h-[48px] border-b border-[var(--border-subtle)]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shrink-0">
            <BellRing className="w-4 h-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="ml-3 overflow-hidden">
              <span className="text-sm font-bold text-[var(--text-primary)] whitespace-nowrap">智慧餐饮平台</span>
              <span className="text-[10px] text-[var(--text-muted)] ml-1">v2.0</span>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto scrollbar-hide">
          {filteredNavGroups.map(group => {
            const Icon = group.icon
            const hasKids = group.children && group.children.length > 0
            const isActive = activePage === group.key
            const isExpanded = expandedGroups.has(group.key)
            const isParentActive = getParentGroup() === group.key && hasKids

            return (
              <div key={group.key}>
                <button
                  onClick={() => hasKids ? toggleGroup(group.key) : setActivePage(group.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive ? 'bg-[rgba(239,68,68,0.12)] text-red-400'
                    : isParentActive ? 'bg-[rgba(239,68,68,0.06)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  title={group.label}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="truncate flex-1 text-left">{group.label}</span>
                      {hasKids && <RightOne className={`w-3.5 h-3.5 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />}
                    </>
                  )}
                </button>
                {hasKids && isExpanded && !sidebarCollapsed && (
                  <div className="ml-7 mt-1 space-y-0.5">
                    {group.children!.map(child => {
                      const isChildActive = activePage === child.key
                      return (
                        <button
                          key={child.key}
                          onClick={() => setActivePage(child.key)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isChildActive ? 'bg-[rgba(239,68,68,0.12)] text-red-400' : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          <span className="truncate">{child.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="p-2 border-t border-[var(--border-subtle)] space-y-1">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center h-8 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
            title={sidebarCollapsed ? '展开' : '收起'}
          >
            <ApplicationMenu className="w-4 h-4" />
          </button>
          {!sidebarCollapsed && (
            <div className="px-2 py-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[var(--ai-blue-500)] flex items-center justify-center shrink-0 text-white text-xs font-semibold">
                  {auth?.name?.[0]||'U'}
                </div>
                <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                  <span className="text-xs font-medium text-[var(--text-primary)] truncate">{auth?.name||'管理员'}</span>
                  <button onClick={doLogout} className="text-xs text-[var(--text-muted)] hover:text-red-400 shrink-0 px-1 py-0.5 rounded hover:bg-red-500/10 transition-all" title="退出登录">
                    退出
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ─── 主内容区 ─── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 flex items-center justify-between px-5 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] shrink-0">
          <nav className="flex items-center gap-1">
            {topNavItems.map(t => {
              const Icon = t.icon
              return (
                <button
                  key={t.key}
                  onClick={() => handleTopNavClick(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium transition-all ${
                    activeTopNav === t.key
                      ? 'bg-red-500/10 text-red-400'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                  title={t.desc}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              )
            })}
          </nav>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[11px] text-[var(--text-secondary)]">{dateStr}</span>
            <span className="text-[11px] text-[var(--text-secondary)]">{city} {weatherIcon} {weatherText}</span>
            <div className="w-px h-4 bg-[var(--border-default)]" />
            <button className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] relative" onClick={()=>setActivePage('alert-messages')}>
              <BellRing className="w-4 h-4" />
              {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold px-1">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]" title={theme === 'dark' ? '切换亮色模式' : '切换深色模式'}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <PageComponent setActivePage={setActivePage} />
        </div>
      </main>
    </div>
    </ConfigProvider>
  )
}
