import React, { useState } from 'react'
import { BookOpen, GraduationCap, Brain, TrendingUp, CheckCircle2, AlertTriangle, Search, Clock, BarChart3, ChevronRight, ArrowLeft, Users, Play, Eye, EyeOff, Filter, Zap, Star, Download, Send, Shield, Calendar, BookMarked, Library, Wrench, User, ShieldCheck, FileText } from 'lucide-react'
import { Tag, Button, Tabs, Select, Progress, Input, Slider, Switch, message, Modal, Checkbox, Pagination } from 'antd'

/* ═══ 课程中心 ═══ */
const CATEGORIES = ['全部','人员合规','环境合规','物料合规','设备合规','操作合规','合规台账']
const CAT_COLORS:Record<string,string> = {'人员合规':'blue','环境合规':'green','物料合规':'orange','设备合规':'purple','操作合规':'red','合规台账':'cyan'}
const STORE_LIST = ['IFS国金中心','太平街店','德思勤店','梅溪湖步步高店','湖滨银泰店','广州天河城店','深圳万象天地','成都太古里店']

function genCourses() {
  const items: { cat:string; title:string; type:string; dur:number; desc:string; violations:string[]; errDesc:string; stdDesc:string; consq:string; rects:string[] }[] = [
    {cat:'人员合规',title:'健康证管理规范',type:'必修',dur:8,desc:'从业人员健康证办理、有效期管理、公示要求',violations:['健康证过期','未公示健康证'],errDesc:'员工健康证已过期3天未更换，仍在前厅区域从事直接入口食品操作',stdDesc:'所有从业人员健康证在有效期内并公示在食品安全信息栏，上岗前由店长逐一核验',consq:'违反《食品安全法》第四十五条，面临5000-50000元罚款；发生食品安全事故将追究刑事责任',rects:['建立健康证到期预警台账，提前30天提醒','每日岗前由值班经理核查健康证公示情况']},
    {cat:'人员合规',title:'岗前晨检标准',type:'必修',dur:5,desc:'每日上岗前体温、手部伤口、呼吸道症状检查',violations:['未进行岗前晨检','晨检记录缺失'],errDesc:'后厨员工带伤手指套未更换，直接接触食材，存在交叉污染风险',stdDesc:'每日上岗前逐一测温、检查手部及呼吸道症状，有伤口需佩戴蓝色防脱落指套并填写晨检表',consq:'食品污染导致顾客投诉、舆情风险，食药监可责令停业整顿',rects:['配备晨检一体机自动测温+记录','晨检数据接入食安管理平台留痕']},
    {cat:'人员合规',title:'工作服穿戴规范',type:'必修',dur:4,desc:'厨师帽、口罩、围裙、防滑鞋穿戴标准',violations:['未戴厨师帽','口罩佩戴不规范'],errDesc:'后厨员工未戴厨师帽作业，头发暴露于食材上方；前厅服务员口罩滑至下巴',stdDesc:'后厨全员佩戴防脱厨师帽+口罩完全覆盖口鼻；前厅口罩每4h更换一次',consq:'异物混入导致客诉，严重时触发食安舆情，罚款5000起',rects:['更衣室张贴穿戴标准图示','AI摄像头自动检测未戴帽/未戴口罩并告警']},
    {cat:'环境合规',title:'操作区清洁标准',type:'必修',dur:6,desc:'地面、台面、墙面、排烟罩清洁频次与标准',violations:['后厨地面油污','操作台未及时清理'],errDesc:'后厨地面有明显油垢堆积，防滑垫发黑未更换，排烟罩油滴下坠',stdDesc:'每2h清洁地面1次，每班次结束后全面清洗台面+地面，每周彻底清洁排烟罩',consq:'油污积聚引发火灾隐患，食药监检查不合格整改，影响评级',rects:['建立清洁排班签到表，每2h签到','排烟罩安装集油盒并每周清理']},
    {cat:'环境合规',title:'仓储分区存放规范',type:'必修',dur:5,desc:'食材、包材、清洁用品分区存放，标识清晰',violations:['食材与清洁剂混放','未离墙离地'],errDesc:'仓库角落洗洁精与食用油堆放在同一货架，纸箱直接置于地面未垫板',stdDesc:'食材与化学品严格分区独立货架存放，所有物品离墙≥10cm离地≥15cm',consq:'化学品污染食材可致中毒，承担民事赔偿+行政处罚',rects:['划分红黄绿三区标识线','安装货架标识牌+库存卡']},
    {cat:'环境合规',title:'消杀流程与频次',type:'选修',dur:7,desc:'灭蝇灯、粘鼠板、消毒液使用规范与频次',violations:['灭蝇灯未开启','消毒频次不足'],errDesc:'后厨灭蝇灯关闭状态，垃圾桶旁苍蝇聚集；消毒液配比随意未使用量杯',stdDesc:'灭蝇灯24h开启，每月清洁灯管；消毒液按1:200比例配制，每日记录消毒台账',consq:'虫鼠害引发食品安全事故，吊销许可证',rects:['灭蝇灯接入电路监控确保24h通电','配置自动配比消毒液分配器']},
    {cat:'物料合规',title:'食材进货查验标准',type:'必修',dur:10,desc:'索证索票、感官检查、温度测量进货标准',violations:['未索取检疫证明','冷链食品温度超标'],errDesc:'肉类供应商未提供检疫合格证明即入库；冷链车到货时温度计显示8°C',stdDesc:'每批食材需查验并留存供应商许可证+检疫证明+出厂检验报告，冷链食材到货温度≤4°C',consq:'使用未检疫肉类可构成生产销售不符合安全标准食品罪',rects:['建立供应商证照电子档案+到期预警','配置红外测温枪到货即测、超温拒收']},
    {cat:'物料合规',title:'保质期与临期管理',type:'必修',dur:5,desc:'保质期台账、临期标识、过期处置流程',violations:['临期食材未标识','过期食材未隔离'],errDesc:'冷藏柜内沙拉酱已过期2天未下架，临期3天内的食材无任何标识',stdDesc:'食材到期前7天贴黄色临期标、到期前1天贴红色标识并移至待处置区，到期当天立即销毁并记录',consq:'使用过期食材将面临5-10万元罚款+停业整顿',rects:['引入效期管理系统自动提醒临期','每日开店前由食安员逐一核对效期']},
    {cat:'物料合规',title:'冷链储存规范',type:'选修',dur:6,desc:'冷藏0-8°C、冷冻≤-18°C，温度记录与异常处理',violations:['冷链设备温度不达标','温度记录缺失'],errDesc:'冷藏展示柜温度显示12°C未及时处理，温度记录表连续3天空白',stdDesc:'冷藏设备每日3次测温并记录，温度异常短信告警，30分钟内响应处理',consq:'冷链断裂导致食材变质，引发群体性食源性疾病',rects:['安装物联网温度传感器实时监控','温度异常时自动切断售卖+推送告警']},
    {cat:'设备合规',title:'冷藏冷冻设备运维',type:'必修',dur:8,desc:'设备日常巡检、除霜、故障报修流程',violations:['设备结霜严重','制冷效率下降'],errDesc:'冷冻柜结霜厚度超5mm未除霜，压缩机持续高负荷运转噪音增大',stdDesc:'每周除霜1次，每月清洗冷凝器散热片，设备异常2h内报修并启用备用设备',consq:'设备故障导致大量食材报废，直接经济损失数千元',rects:['建立设备维保台账+保养周期日历','配置备用移动冷柜应对突发故障']},
    {cat:'设备合规',title:'消毒柜使用规范',type:'必修',dur:4,desc:'餐具消毒温度/时间标准、消毒记录、设备维护',violations:['消毒温度不达标','消毒记录缺失'],errDesc:'消毒柜内餐具堆放过密影响热风循环，实测中心温度仅65°C',stdDesc:'餐具稀疏摆放确保热风流通，温度≥120°C持续≥30分钟，每餐记录消毒温度+时间',consq:'餐具消毒不彻底导致交叉污染，引发顾客腹泻投诉',rects:['消毒柜安装温度记录仪自动记录','张贴消毒操作SOP+容量限制标识']},
    {cat:'设备合规',title:'设备异常自查与上报',type:'选修',dur:5,desc:'设备日常点检项目、异常判定标准、上报流程',violations:['设备点检流于形式','异常未及时上报'],errDesc:'绞肉机刀片钝化未更换导致出肉粗细不均，员工自行调快转速勉强使用',stdDesc:'每日开机前按点检表逐项检查，异常设备挂红牌停用并扫码上报维修',consq:'设备带病运行影响出品质量，电机过载可引发火灾',rects:['配置设备点检二维码扫码签到','异常报修工单自动派发+超时升级']},
    {cat:'操作合规',title:'生熟分开操作规范',type:'必修',dur:6,desc:'生熟砧板/刀具/容器分开使用，标识清晰',violations:['生熟混用砧板','生熟容器混放'],errDesc:'同一砧板先后处理生鸡和熟牛肉，红色生食刀与黄色熟食刀混插刀架',stdDesc:'红砧/红刀仅用于生肉，黄砧/黄刀仅用于熟食，容器分色管理，使用后立即清洗消毒',consq:'生熟交叉污染导致沙门氏菌食物中毒，承担医疗费+赔偿+行政处罚',rects:['采购6色分类砧板+刀具套装','后厨张贴生熟分区示意图']},
    {cat:'操作合规',title:'食品留样标准操作',type:'必修',dur:5,desc:'留样量≥125g、留样时间≥48h、标签与记录',violations:['留样量不足','留样标签缺失'],errDesc:'留样盒内菜品仅约80g远低于标准125g，标签上未填写留样人和留样时间',stdDesc:'每餐每种菜品留样≥125g，标注菜名+日期+餐次+留样人，存专用留样柜保存≥48h',consq:'发生食安事件无留样可追溯，无法自证清白，承担全部责任',rects:['配置定量留样盒+电子秤','留样标签统一模板打印张贴']},
    {cat:'操作合规',title:'餐用具清洗消毒流程',type:'选修',dur:7,desc:'一刮二洗三冲四消五保洁五步法',violations:['消毒液浓度不达标','餐具保洁不当'],errDesc:'洗碗间消毒池内消毒液已使用4h未更换浓度不足，洗净碗盘叠放导致积水滋生细菌',stdDesc:'刮净残渣→洗涤剂清洗→清水冲洗→100ppm消毒液浸泡≥5min→沥干后存放保洁柜',consq:'餐具不洁导致食安抽检不合格，轻则警告重则罚款+评级降档',rects:['配置消毒液浓度试纸每日检测','保洁柜加装紫外线消毒灯']},
    {cat:'合规台账',title:'日管控台账填报规范',type:'必修',dur:8,desc:'日管控检查表逐项填写、签字、归档要求',violations:['台账填写不规范','签字确认缺失'],errDesc:'日管控台账多个检查项直接勾选合格但实际未巡检，自查人签名栏为空',stdDesc:'按检查表逐项真实记录巡检结果，不合格项备注具体问题并拍照留证，当日责任人签字确认上传系统',consq:'台账造假被查实构成虚假记录，食药监可吊销许可证',rects:['使用电子台账系统强制逐项填报+拍照','系统自动校验签字完整性']},
    {cat:'合规台账',title:'周排查隐患登记要求',type:'必修',dur:6,desc:'周排查记录、隐患分类登记、整改闭环跟踪',violations:['隐患登记遗漏','整改闭环未跟踪'],errDesc:'周排查发现冷藏柜温度异常仅口头告知未登记台账，一周后仍未修复也未跟踪',stdDesc:'每项隐患登记问题描述+等级+责任人+整改期限，整改完成后拍照验证并上传系统闭环',consq:'隐患未闭环导致食安事故发生时无法证明履职，承担管理责任',rects:['隐患台账关联整改工单自动跟踪','超期未闭环自动升级告警至区域经理']},
    {cat:'合规台账',title:'月调度资料整理标准',type:'选修',dur:5,desc:'月度汇总报表、数据分析、改善方案制定',violations:['月报数据不完整','缺少改善方案'],errDesc:'月调度会议仅简单通报问题数量和罚款金额，未进行根因分析也未制定下月改善计划',stdDesc:'按月汇总日/周数据形成趋势分析图表，标注TOP3问题并制定针对性改善方案，会议纪要+签到表+照片存档',consq:'月调度流于形式无法向上级和监管部门证明管理成效',rects:['系统自动生成月度汇总报表','会议纪要模板标准化+改善计划跟踪表']},
  ]
  return items.map((it,i) => ({
    id:'C'+String(i+1).padStart(3,'0'),
    ...it,
    learners:20+Math.floor(Math.random()*44),
    progress:Math.floor(Math.random()*100),
    assignedStores:STORE_LIST.slice(0,3+Math.floor(Math.random()*5)),
  }))
}

function CourseCard({ c, onClick }: { c: any; onClick: () => void }) {
  const catEmoji:Record<string,string> = {'人员合规':'👨‍🍳','环境合规':'🧹','物料合规':'📦','设备合规':'🔧','操作合规':'⚙️','合规台账':'📋'}
  return (
    <div className="card-level-1 p-4 cursor-pointer space-y-3 hover:shadow-md transition-shadow" onClick={onClick}>
      <div className="flex items-start gap-3">
        <div className="w-14 h-10 rounded bg-[var(--bg-tertiary)] flex items-center justify-center text-xl shrink-0">{catEmoji[c.cat] || '📚'}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5"><span className="text-sm font-medium text-[var(--text-primary)] truncate">{c.title}</span>
            <Tag color={c.type==='必修'?'blue':'default'} style={{fontSize:10}}>{c.type}</Tag></div>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-2">{c.desc}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
        <Tag color={CAT_COLORS[c.cat]} style={{fontSize:10}}>{c.cat}</Tag>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{c.dur}分钟</span>
        <span className="flex items-center gap-1"><Users className="w-3 h-3"/>{c.learners}人已学</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {c.violations.slice(0,2).map(function(v:string){ return <Tag key={v} color="red" style={{fontSize:9}}>{v}</Tag> })}
        {c.violations.length>2 && <span className="text-[9px] text-[var(--text-muted)]">+{c.violations.length-2}</span>}
      </div>
    </div>
  )
}

export const TrainingCourse: React.FC = () => {
  const [view, setView] = useState<'list'|'detail'>('list')
  const [detailC, setDetailC] = useState<any>(null)
  const [showAssign, setShowAssign] = useState(false)
  const [catTab, setCatTab] = useState('全部')
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [checkedStores, setCheckedStores] = useState<string[]>([])
  const ps = 9

  const allCourses = React.useMemo(() => genCourses(), [])
  let filtered = allCourses.filter(function(c){
    if (catTab !== '全部' && c.cat !== catTab) return false
    if (searchText && !c.title.includes(searchText)) return false
    return true
  })

  const stats = { total: allCourses.length, required: allCourses.filter(function(c){return c.type==='必修'}).length, learning: allCourses.filter(function(c){return c.progress>0&&c.progress<100}).length, done: Math.round(allCourses.reduce(function(a,c){return a+c.progress},0)/allCourses.length) }

  // ═══ DETAIL VIEW ═══
  if (view === 'detail' && detailC) {
    const c = detailC
    return (
      <div className="p-6 h-full flex flex-col overflow-hidden">
        <div className="shrink-0 flex items-center gap-2 mb-3">
          <Button size="small" type="text" icon={<ArrowLeft className="w-3.5 h-3.5"/>} onClick={function(){setView('list');setDetailC(null)}} style={{fontSize:12}}>返回课程列表</Button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* video player */}
          <div className="card-level-1 overflow-hidden" style={{padding:0}}>
            <div className="aspect-video bg-gray-900 flex items-center justify-center relative cursor-pointer">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                <Play className="w-6 h-6 text-white ml-0.5"/>
              </div>
              <span className="absolute bottom-3 left-3 text-[10px] text-white/60">{c.dur}分钟</span>
              <span className="absolute bottom-3 right-3 text-[10px] text-white/60">{c.title}</span>
            </div>
          </div>
          {/* course info */}
          <div className="card-level-1 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag color={c.type==='必修'?'blue':'default'} style={{fontSize:12}}>{c.type}</Tag>
              <Tag color={CAT_COLORS[c.cat]} style={{fontSize:12}}>{c.cat}</Tag>
              <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1"><Users className="w-3 h-3"/>{c.learners}人已学习</span>
            </div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">{c.title}</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">{c.desc}</p>
          </div>
          {/* error vs standard */}
          <div className="card-level-1 p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400"/>错误示范 vs 标准操作</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/10">
                <div className="flex items-center gap-1.5 mb-2"><EyeOff className="w-3.5 h-3.5 text-red-400"/><span className="text-xs font-medium text-red-400">❌ 错误操作</span></div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{c.errDesc}</p>
              </div>
              <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10">
                <div className="flex items-center gap-1.5 mb-2"><Eye className="w-3.5 h-3.5 text-emerald-400"/><span className="text-xs font-medium text-emerald-400">✅ 标准操作</span></div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{c.stdDesc}</p>
              </div>
            </div>
          </div>
          {/* consequences */}
          <div className="card-level-1 p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-orange-400"/>违规后果</h3>
            <div className="bg-orange-500/5 rounded-lg p-3 border border-orange-500/10">
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{c.consq}</p>
            </div>
          </div>
          {/* rectification */}
          <div className="card-level-1 p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400"/>整改要求</h3>
            <div className="space-y-2">
              {c.rects.map(function(rc:string,i:number){
                return <div key={i} className="flex items-start gap-2 bg-[var(--bg-tertiary)] rounded p-2.5">
                  <span className="text-[10px] text-emerald-400 mt-0.5">▶</span>
                  <span className="text-[11px] text-[var(--text-secondary)]">{rc}</span>
                </div>
              })}
            </div>
          </div>
          {/* assigned stores */}
          <div className="card-level-1 p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2"><BookMarked className="w-4 h-4"/>已下发门店</h3>
            <div className="flex flex-wrap gap-1.5">
              {c.assignedStores.map(function(s:string){ return <Tag key={s} style={{fontSize:11}}>{s}</Tag> })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ═══ LIST VIEW ═══
  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <div className="shrink-0 space-y-3">
        <div><h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2"><BookOpen className="w-4 h-4"/>课程中心</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">场景化合规知识库 · 巡检发现什么问题，对应学到什么知识</p></div>
        {/* stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            {label:'课程总数',value:stats.total+'门',icon:<BookOpen className="w-4 h-4"/>,color:'#3B82F6'},
            {label:'必修课',value:stats.required+'门',icon:<Shield className="w-4 h-4"/>,color:'#10B981'},
            {label:'学习中',value:stats.learning+'门',icon:<Play className="w-4 h-4"/>,color:'#F59E0B'},
            {label:'平均完成率',value:stats.done+'%',icon:<Star className="w-4 h-4"/>,color:'#8B5CF6'},
          ].map(function(s,i){ return (
            <div key={i} className="card-level-1 p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{background:s.color+'15'}}>{React.cloneElement(s.icon as any,{className:'w-4 h-4',style:{color:s.color}})}</div>
              <div><div className="text-xs font-semibold text-[var(--text-primary)]">{s.value}</div><div className="text-[10px] text-[var(--text-muted)]">{s.label}</div></div>
            </div>
          )})}
        </div>
        {/* category tabs */}
        <Tabs activeKey={catTab} onChange={function(k){setCatTab(k);setPage(1)}} size="small"
          items={CATEGORIES.map(function(d){ return {key:d,label:d} })} />
        {/* search + actions */}
        <div className="flex items-center gap-3">
          <Input size="middle" prefix={<Search className="w-3.5 h-3.5"/>} placeholder="搜索课程名称" value={searchText} onChange={function(e){setSearchText(e.target.value);setPage(1)}} style={{width:200}} allowClear/>
          <div className="flex-1"/>
          <Button size="middle" icon={<Send className="w-3.5 h-3.5"/>} onClick={function(){setShowAssign(true)}}>批量下发课程</Button>
        </div>
      </div>
      {/* course grid */}
      <div className="flex-1 overflow-y-auto mt-3">
        <div className="grid grid-cols-3 gap-3">
          {filtered.slice((page-1)*ps,page*ps).map(function(c){ return <CourseCard key={c.id} c={c} onClick={function(){setDetailC(c);setView('detail')}}/> })}
        </div>
        {filtered.length===0 && <div className="text-center py-12 text-xs text-[var(--text-muted)]">暂无匹配课程</div>}
      </div>
      {/* pagination */}
      <div className="shrink-0 flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
        <span className="text-[10px] text-[var(--text-muted)]">共 {filtered.length} 门课程</span>
        <Pagination current={page} pageSize={ps} total={filtered.length} onChange={setPage} size="small" showSizeChanger={false}/>
      </div>
      {/* assign modal */}
      <Modal title="批量下发课程" open={showAssign} onCancel={function(){setShowAssign(false)}} onOk={function(){message.success('已下发课程至所选门店');setShowAssign(false)}} okText="确认下发" cancelText="取消" width={480}>
        <div className="space-y-3 py-2">
          <div className="text-xs text-[var(--text-secondary)] mb-2">选择目标门店：</div>
          <div className="max-h-48 overflow-y-auto space-y-1.5 bg-[var(--bg-tertiary)] rounded p-3">
            {STORE_LIST.map(function(s){
              return <div key={s} className="flex items-center gap-2">
                <Checkbox checked={checkedStores.includes(s)} onChange={function(e){
                  if(e.target.checked){setCheckedStores([...checkedStores,s])}
                  else{setCheckedStores(checkedStores.filter(function(x){return x!==s}))}
                }}/><span className="text-xs">{s}</span>
              </div>
            })}
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">当前筛选结果下 {filtered.length} 门课程将统一下发至所选门店</div>
        </div>
      </Modal>
    </div>
  )
}

/* ═══ 课程学习 ═══ */
export const TrainingLearn: React.FC = () => (
  <div className="p-6 space-y-4 overflow-y-auto h-full"><div><h2 className="text-base font-semibold text-[var(--text-primary)] inline-flex items-center gap-2"><GraduationCap className="w-4 h-4"/>课程学习</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">按岗位匹配必学课程·违规强制推送·自主选修</p></div>
  <div className="grid grid-cols-2 gap-3">{[{title:'后厨食安操作规范',type:'必修',store:'后厨全员',progress:85,from:'岗位匹配'},
  {title:'前厅服务流程标准',type:'必修',store:'前厅全员',progress:60,from:'岗位匹配'},
  {title:'未戴厨师帽专项学习',type:'强制',store:'张师傅·IFS国金中心',progress:100,from:'违规推送'},
  {title:'仓库管理规范入门',type:'选修',store:'仓储人员',progress:0,from:'自主选修'}].map((c,i)=><div key={i} className="card-level-1 p-4 space-y-2"><div className="flex items-center justify-between"><span className="text-sm font-medium text-[var(--text-primary)]">{c.title}</span>
    <Tag color={c.type==='强制'?'red':c.type==='必修'?'blue':'default'} style={{fontSize:9}}>{c.type}</Tag></div>
  <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]"><span>{c.store}</span><span>{c.from}</span></div>
  <Progress percent={c.progress} size="small" showInfo={false} strokeColor={c.progress===100?'#10B981':'#3B82F6'}/>
  <Button size="small" block style={{fontSize:10}}>{c.progress===100?'已完成':c.progress>0?'继续学习':'开始学习'}</Button></div>)}</div>
  </div>
)

/* ═══ AI 智能考试 ═══ */
/* ═══ 专项考试 ═══ */
const EXAM_TYPES = ['岗前准入','周期统考','靶向补考','台账专项']
const EXAM_TYPE_COLORS:Record<string,string> = {'岗前准入':'green','周期统考':'blue','靶向补考':'red','台账专项':'purple'}

function genExams() {
  const base = [
    {id:'E001',title:'2026年5月新员工岗前食安准入考试',type:'岗前准入',qCount:30,duration:45,passLine:80,status:'进行中',participants:12,avgScore:76,source:'人员合规知识库+环境合规知识库',desc:'新员工上岗必考，涵盖健康证管理、岗前晨检、穿戴规范、后厨清洁标准等核心内容'},
    {id:'E002',title:'2026年4月新员工岗前准入补考',type:'岗前准入',qCount:25,duration:40,passLine:80,status:'已结束',participants:5,avgScore:88,source:'人员合规知识库',desc:'针对4月入职未通过首考员工的补考'},
    {id:'E003',title:'2026年5月全员食安规范周期统考',type:'周期统考',qCount:40,duration:60,passLine:75,status:'进行中',participants:58,avgScore:82,source:'全知识库AI综合组卷',desc:'月度全员覆盖统考，随机从6大知识库抽题组卷，防止刷题'},
    {id:'E004',title:'2026年4月全员周期统考',type:'周期统考',qCount:40,duration:60,passLine:75,status:'已结束',participants:62,avgScore:79,source:'全知识库AI综合组卷',desc:'上月统考，平均分偏低，5月加强卫生消毒类考题权重'},
    {id:'E005',title:'未戴厨师帽违规专项靶向补考',type:'靶向补考',qCount:15,duration:30,passLine:90,status:'进行中',participants:3,avgScore:65,source:'人员合规知识库·穿戴规范课程',desc:'近期巡检发现张师傅、李师傅存在未戴厨师帽违规，定向推题只考穿戴规范'},
    {id:'E006',title:'后厨地面积油违规靶向补考',type:'靶向补考',qCount:12,duration:25,passLine:85,status:'待开始',participants:0,avgScore:0,source:'环境合规知识库·操作区清洁课程',desc:'IFS国金中心后厨地面油污巡检不合格，自动触发生成靶向试卷'},
    {id:'E007',title:'5月食安管理员台账合规专项考',type:'台账专项',qCount:20,duration:40,passLine:85,status:'进行中',participants:8,avgScore:90,source:'合规台账知识库',desc:'针对各门店食安管理员/值班经理的专业考核，含日报表填报、隐患闭环、月调度复盘'},
    {id:'E008',title:'4月台账合规专项考',type:'台账专项',qCount:18,duration:35,passLine:85,status:'已结束',participants:8,avgScore:87,source:'合规台账知识库',desc:'上月台账合规考试，全员通过，本月增加场景实操题比例'},
  ]
  return base
}

// 模拟从知识库抽取的考题
function genQuestions(examId:string) {
  const qBank = [
    {id:'Q1',type:'单选',stem:'根据《食品安全法》，从业人员健康证的有效期为多久？',options:['6个月','1年','2年','3年'],answer:1,course:'健康证管理规范',explain:'健康证有效期为1年，到期前30天需重新办理体检。逾期未更换继续从事食品操作将面临处罚。'},
    {id:'Q2',type:'单选',stem:'冷链食材到货时，冷藏品的接收温度应不超过多少？',options:['8°C','4°C','0°C','10°C'],answer:1,course:'食材进货查验标准',explain:'冷链食材接收温度应≤4°C，超温需当场拒收并记录。冷冻品则应≤-18°C。'},
    {id:'Q3',type:'多选',stem:'以下哪些属于后厨人员上岗前必须执行的晨检项目？',options:['测量体温','检查手部伤口','检查工服穿戴','背诵菜单'],answer:[0,1,2],course:'岗前晨检标准',explain:'晨检包括体温测量、手部伤口检查、呼吸道症状观察、工服穿戴核验。不包含背诵菜单。'},
    {id:'Q4',type:'判断',stem:'食材可以与洗洁精、消毒液存放在同一货架上，只要密封好就可以。',options:['正确','错误'],answer:1,course:'仓储分区存放规范',explain:'食材与化学品必须严格分区存放，即使密封也不得混放，存在交叉污染风险。'},
    {id:'Q5',type:'场景实操',stem:'巡检中你发现冷藏柜温度显示12°C（标准要求0-8°C），此时你应该最先做什么？',options:['记录在台账中，明天报修','立即将食材转移至备用冷柜，同步报修','调整温控器到最低档继续使用','关掉冷藏柜等待维修'],answer:1,course:'冷链储存规范',explain:'温度异常时第一时间转移食材避免变质，然后同步报修，最后记录台账。顺序不可颠倒。'},
    {id:'Q6',type:'单选',stem:'食品留样的标准留样量不少于多少克？',options:['80g','100g','125g','150g'],answer:2,course:'食品留样标准操作',explain:'每餐每种菜品留样量不少于125g，留样时间不少于48小时，标签需注明菜名、日期、餐次、留样人。'},
    {id:'Q7',type:'判断',stem:'消毒柜中的餐具堆叠紧密有利于提高消毒效率。',options:['正确','错误'],answer:1,course:'消毒柜使用规范',explain:'餐具稀疏摆放才能保证热风流通。堆叠会导致中心温度不达标，消毒不彻底。'},
    {id:'Q8',type:'多选',stem:'生熟分开操作中，以下哪些做法是正确的？',options:['红砧板切生肉、黄砧板切熟食','生食和熟食共用同一把刀但先切熟再切生','生肉和熟菜使用不同颜色的容器','切完生肉的砧板冲洗一下即可切熟食'],answer:[0,2],course:'生熟分开操作规范',explain:'刀具砧板容器必须严格分色管理。红砧/红刀仅用于生肉，黄砧/黄刀仅用于熟食，不可混用。冲洗不消毒不能切熟食。'},
    {id:'Q9',type:'单选',stem:'消杀灭蝇灯的正确使用要求是？',options:['营业时间开启','24小时常开','看见苍蝇时开启','晚上营业结束后开启'],answer:1,course:'消杀流程与频次',explain:'灭蝇灯需24小时常开，每月清洁灯管一次。关闭期间苍蝇可能进入后厨。'},
    {id:'Q10',type:'场景实操',stem:'供应商送来一批冷冻鸡肉，但你发现运输车温度记录显示途中曾升至-10°C持续30分钟，你该怎么做？',options:['签收但备注温度异常','拒收并记录在供应商评价中','签收后立即使用这批鸡肉','要求供应商降价后签收'],answer:1,course:'食材进货查验标准',explain:'冷链食品运输温度异常必须拒收，不可签收后"立即使用"或"降价签收"，违反进货查验义务。'},
    {id:'Q11',type:'单选',stem:'日管控台账应由谁签字确认后归档？',options:['区域经理','当日值班负责人','总部食安总监','任何在场员工'],answer:1,course:'日管控台账填报规范',explain:'日管控台账须由当日值班负责人逐项核实后签字确认，不得代签或漏签。'},
    {id:'Q12',type:'多选',stem:'以下哪些情况应触发问题靶向补考？',options:['巡检发现未戴厨师帽','冷藏柜温度持续偏高','台账连续3天未签字','员工主动申请'],answer:[0,1,2],course:'合规台账知识库综合',explain:'巡检发现违规问题后系统自动触发定向补考。主动申请不属于强制触发范围。'},
    {id:'Q13',type:'判断',stem:'过期食材只要没有异味，可以降价在内部员工食堂使用。',options:['正确','错误'],answer:1,course:'保质期与临期管理',explain:'过期食材必须立即销毁并记录，不得以任何形式使用或转让。内部食堂使用同样违法。'},
    {id:'Q14',type:'单选',stem:'周排查中发现的隐患登记应包含哪些要素？',options:['问题描述和发现日期','问题描述、等级、责任人、整改期限','只需记录严重问题','口头告知店长即可'],answer:1,course:'周排查隐患登记要求',explain:'每项隐患须完整登记：问题描述、严重等级、责任人和整改期限。整改完成后需拍照验证闭环。'},
    {id:'Q15',type:'场景实操',stem:'月调度会议上，你发现某门店连续3个月冷藏温度异常问题反复出现，最合理的改善方案是？',options:['增加巡检频次','安装物联网温度传感器实现实时监控+自动告警','对责任人罚款','更换所有冷藏设备'],answer:1,course:'月调度资料整理标准',explain:'针对反复出现的系统性问题，应从技术手段根因解决（如安装IoT传感器），而非简单增加人工巡检或处罚。'},
  ]
  // 根据考试类型返回不同数量题目
  const exam = genExams().find(function(e){return e.id===examId})
  const count = exam ? exam.qCount : 10
  return qBank.slice(0, Math.min(count, qBank.length))
}

export const TrainingExam: React.FC = () => {
  const [view, setView] = useState<'list'|'taking'|'result'|'wrongBook'>('list')
  const [examTab, setExamTab] = useState('全部')
  const [currentExam, setCurrentExam] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string,any>>({})
  const [timer, setTimer] = useState(0)
  const [timerId, setTimerId] = useState<any>(null)
  const [resultData, setResultData] = useState<any>(null)
  const [wrongList, setWrongList] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const ps = 8

  const allExams = React.useMemo(function(){return genExams()},[])
  const filtered = allExams.filter(function(e){
    if (examTab !== '全部' && e.type !== examTab) return false
    return true
  })

  function startExam(exam:any) {
    const qs = genQuestions(exam.id)
    setCurrentExam(exam)
    setQuestions(qs)
    setCurrentQ(0)
    setAnswers({})
    setView('taking')
    const id = setInterval(function(){
      setTimer(function(t:number){return t+1})
    }, 1000)
    setTimerId(id)
    setTimer(0)
  }

  function formatTimer(s:number) {
    const m = Math.floor(s/60); const sec = s%60
    return String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0')
  }

  function submitExam() {
    if (timerId) clearInterval(timerId)
    let score = 0; const wrongs:any[] = []
    questions.forEach(function(q,i){
      const userA = answers[q.id]
      const correctA = q.answer
      let isCorrect = false
      if (Array.isArray(correctA)) {
        isCorrect = Array.isArray(userA) && userA.length===correctA.length && userA.every(function(a:number){return correctA.includes(a)})
      } else {
        isCorrect = userA === correctA
      }
      if (isCorrect) score++
      else wrongs.push({...q, userAnswer:userA})
    })
    const pct = Math.round(score/questions.length*100)
    const passed = pct >= (currentExam.passLine||80)
    setResultData({score:pct, correct:score, total:questions.length, passed, passLine:currentExam.passLine, wrongs})
    setWrongList(function(prev:any[]){return [...wrongs, ...prev]})
    setView('result')
  }

  function selectAnswer(qId:string, val:any, qType:string) {
    if (qType === '多选') {
      setAnswers(function(prev:any){
        const cur = prev[qId] || []
        if (cur.includes(val)) return {...prev, [qId]: cur.filter(function(a:any){return a!==val})}
        return {...prev, [qId]: [...cur, val]}
      })
    } else {
      setAnswers(function(prev:any){return {...prev, [qId]: val}})
    }
  }

  // ═══ RESULT VIEW ═══
  if (view === 'result' && resultData) {
    const r = resultData
    return (
      <div className="p-6 h-full flex flex-col overflow-hidden">
        <div className="shrink-0 flex items-center gap-2 mb-4">
          <Button size="small" type="text" icon={<ArrowLeft className="w-3.5 h-3.5"/>} onClick={function(){setView('list');setCurrentExam(null);setResultData(null)}} style={{fontSize:12}}>返回考试列表</Button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* score */}
          <div className="card-level-1 p-6 text-center">
            <div className="text-sm text-[var(--text-muted)] mb-2">{currentExam.title}</div>
            <div className="text-5xl font-bold mb-1" style={{color:r.passed?'#10B981':'#EF4444'}}>{r.score}</div>
            <div className="text-xs text-[var(--text-muted)]">分</div>
            <div className="mt-3">
              <Tag color={r.passed?'green':'red'} style={{fontSize:12}}>{r.passed?'✅ 通过':'❌ 未通过'}</Tag>
              <span className="text-[10px] text-[var(--text-muted)] ml-2">及格线 {r.passLine} 分</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[var(--border-subtle)]">
              <div className="text-center"><div className="text-lg font-bold text-[var(--text-primary)]">{r.total}</div><div className="text-[10px] text-[var(--text-muted)]">总题数</div></div>
              <div className="text-center"><div className="text-lg font-bold text-emerald-400">{r.correct}</div><div className="text-[10px] text-[var(--text-muted)]">答对</div></div>
              <div className="text-center"><div className="text-lg font-bold text-red-400">{r.total-r.correct}</div><div className="text-[10px] text-[var(--text-muted)]">答错</div></div>
            </div>
          </div>
          {/* wrong answers */}
          {r.wrongs.length>0 && (
            <div className="card-level-1 p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400"/>错题明细</h3>
              <div className="space-y-3">
                {r.wrongs.map(function(w:any,i:number){
                  return (
                    <div key={i} className="bg-red-500/5 rounded-lg p-3 border border-red-500/10 space-y-2">
                      <div className="flex items-center gap-2">
                        <Tag color="red" style={{fontSize:10}}>{w.type}</Tag>
                        <span className="text-xs font-medium text-[var(--text-primary)]">{w.stem}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-red-400">你的答案：{Array.isArray(w.userAnswer)?(w.userAnswer.length?w.userAnswer.join('，'):'未作答'):(w.userAnswer!==undefined?w.options[w.userAnswer]:'未作答')}</span>
                        <span className="text-emerald-400">正确答案：{Array.isArray(w.answer)?w.answer.map(function(a:number){return w.options[a]}).join('，'):w.options[w.answer]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag color="blue" style={{fontSize:9}}>关联课程：{w.course}</Tag>
                        <span className="text-[9px] text-[var(--text-muted)]">{w.explain}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center gap-2">
                <Button size="small" onClick={function(){setView('list');setCurrentExam(null);setResultData(null)}}>返回列表</Button>
                {!r.passed && <Button size="small" type="primary" onClick={function(){
                  if(currentExam){startExam(currentExam)}
                }}>重新考试</Button>}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ═══ TAKING VIEW ═══
  if (view === 'taking' && currentExam) {
    const q = questions[currentQ]
    const total = questions.length
    const answeredCount = Object.keys(answers).length
    const examDur = currentExam.duration * 60
    return (
      <div className="p-6 h-full flex flex-col overflow-hidden">
        {/* header */}
        <div className="shrink-0 space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">{currentExam.title}</h2>
              <p className="text-[10px] text-[var(--text-muted)]">第 {currentQ+1}/{total} 题 · 已答 {answeredCount} 题</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right"><div className="text-[10px] text-[var(--text-muted)]">剩余时间</div>
                <div className="text-lg font-bold" style={{color:timer>examDur*0.8?'#EF4444':'#3B82F6'}}>{formatTimer(Math.max(0, examDur-timer))}</div>
              </div>
              <Button size="small" type="primary" danger onClick={submitExam} disabled={answeredCount<total}>交卷</Button>
            </div>
          </div>
          {/* progress bar */}
          <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--ai-blue-500)] rounded-full transition-all" style={{width:(currentQ+1)/total*100+'%'}}/>
          </div>
          {/* question number dots */}
          <div className="flex flex-wrap gap-1.5">
            {questions.map(function(qq:any,i:number){
              return <div key={i} className="w-6 h-6 rounded text-[10px] flex items-center justify-center cursor-pointer border"
                style={{
                  background: i===currentQ?'var(--ai-blue-500)':answers[qq.id]!==undefined?'#10B98133':'var(--bg-tertiary)',
                  color: i===currentQ?'#fff':answers[qq.id]!==undefined?'#10B981':'var(--text-secondary)',
                  borderColor: i===currentQ?'var(--ai-blue-500)':answers[qq.id]!==undefined?'#10B981':'var(--border-subtle)'
                }}
                onClick={function(){setCurrentQ(i)}}
              >{i+1}</div>
            })}
          </div>
        </div>
        {/* question */}
        <div className="flex-1 overflow-y-auto">
          <div className="card-level-1 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Tag color={q.type==='场景实操'?'orange':q.type==='多选'?'purple':q.type==='判断'?'cyan':'blue'} style={{fontSize:12}}>{q.type}</Tag>
              <Tag style={{fontSize:11}}>来源：{q.course}</Tag>
            </div>
            <div className="text-sm font-medium text-[var(--text-primary)] leading-relaxed">{currentQ+1}. {q.stem}</div>
            <div className="space-y-2 mt-3">
              {q.options.map(function(opt:string,oi:number){
                const isSelected = q.type==='多选' ? (answers[q.id]||[]).includes(oi) : answers[q.id]===oi
                return (
                  <div key={oi} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer border hover:border-[var(--ai-blue-500)] transition-colors"
                    style={{background:isSelected?'var(--ai-blue-500)/10':'var(--bg-tertiary)',borderColor:isSelected?'var(--ai-blue-500)':'var(--border-subtle)'}}
                    onClick={function(){selectAnswer(q.id, oi, q.type)}}
                  >
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={{borderColor:isSelected?'var(--ai-blue-500)':'var(--border-default)',background:isSelected?'var(--ai-blue-500)':undefined}}
                    >
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white"/>}
                    </div>
                    <span className="text-xs text-[var(--text-primary)]">{opt}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        {/* nav */}
        <div className="shrink-0 flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
          <Button size="middle" disabled={currentQ===0} onClick={function(){setCurrentQ(currentQ-1)}}>上一题</Button>
          <span className="text-[10px] text-[var(--text-muted)]">{answeredCount}/{total} 已答</span>
          {currentQ<total-1 ? (
            <Button size="middle" type="primary" onClick={function(){setCurrentQ(currentQ+1)}}>下一题</Button>
          ) : (
            <Button size="middle" type="primary" onClick={submitExam} disabled={answeredCount<total}>交卷</Button>
          )}
        </div>
      </div>
    )
  }

  // ═══ WRONG BOOK VIEW ═══
  if (view === 'wrongBook') {
    return (
      <div className="p-6 h-full flex flex-col overflow-hidden">
        <div className="shrink-0 space-y-3">
          <div className="flex items-center gap-2">
            <Button size="small" type="text" icon={<ArrowLeft className="w-3.5 h-3.5"/>} onClick={function(){setView('list')}} style={{fontSize:12}}>返回</Button>
            <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2"><BookOpen className="w-4 h-4"/>题库管理</h2>
          </div>
          <div className="flex items-center gap-3">
            <Input size="middle" prefix={<Search className="w-3.5 h-3.5"/>} placeholder="搜索错题" style={{width:200}} allowClear/>
            <div className="flex-1"/>
            <span className="text-[10px] text-[var(--text-muted)]">共 {wrongList.length} 道错题</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto mt-3 space-y-3">
          {wrongList.slice((page-1)*ps,page*ps).map(function(w:any,i:number){
            return (
              <div key={i} className="card-level-1 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Tag color={w.type==='场景实操'?'orange':'blue'} style={{fontSize:11}}>{w.type}</Tag>
                  <span className="text-xs font-medium text-[var(--text-primary)]">{w.stem}</span>
                </div>
                <div className="flex gap-4 text-[10px]">
                  <span className="text-red-400">你的答案：{Array.isArray(w.userAnswer)?w.userAnswer.map(function(a:number){return w.options[a]}).join('，'):w.options[w.userAnswer]||'未作答'}</span>
                  <span className="text-emerald-400">正确答案：{Array.isArray(w.answer)?w.answer.map(function(a:number){return w.options[a]}).join('，'):w.options[w.answer]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag color="blue" style={{fontSize:10}}>{w.course}</Tag>
                  <span className="text-[9px] text-[var(--text-muted)]">{w.explain}</span>
                </div>
              </div>
            )
          })}
          {wrongList.length===0 && <div className="text-center py-12 text-xs text-[var(--text-muted)]">暂无错题记录</div>}
        </div>
        <div className="shrink-0 flex items-center justify-end pt-3 border-t border-[var(--border-subtle)]">
          <Pagination current={page} pageSize={ps} total={wrongList.length} onChange={setPage} size="small" showSizeChanger={false}/>
        </div>
      </div>
    )
  }

  // ═══ LIST VIEW ═══
  const examTabItems = [{key:'全部',label:'全部'}].concat(EXAM_TYPES.map(function(d){return {key:d,label:d}}))
  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <div className="shrink-0 space-y-3">
        <div><h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2"><Brain className="w-4 h-4"/>专项考试</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">AI自动组卷 · 从知识库精准出题 · 四大考试类型全覆盖</p></div>
        {/* stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            {label:'进行中考试',value:allExams.filter(function(e){return e.status==='进行中'}).length+'场',color:'#3B82F6'},
            {label:'总参与人次',value:allExams.reduce(function(a,e){return a+e.participants},0)+'人次',color:'#10B981'},
            {label:'平均通过率',value:Math.round(allExams.reduce(function(a,e){return a+e.avgScore},0)/allExams.length)+'%',color:'#F59E0B'},
            {label:'错题收录',value:wrongList.length+'道',color:'#EF4444'},
          ].map(function(s,i){ return (
            <div key={i} className="card-level-1 p-3 text-center">
              <div className="text-lg font-bold" style={{color:s.color}}>{s.value}</div>
              <div className="text-[10px] text-[var(--text-muted)]">{s.label}</div>
            </div>
          )})}
        </div>
        {/* tabs + actions */}
        <div className="flex items-center gap-3">
          <Tabs activeKey={examTab} onChange={function(k){setExamTab(k);setPage(1)}} size="small"
            items={examTabItems} style={{marginBottom:0}}/>
          <div className="flex-1"/>
          <Button size="middle" icon={<BookOpen className="w-3.5 h-3.5"/>} onClick={function(){setView('wrongBook')}}>题库管理</Button>
        </div>
      </div>
      {/* exam cards */}
      <div className="flex-1 overflow-y-auto mt-2">
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(function(e){
            return (
              <div key={e.id} className="card-level-1 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-[var(--text-primary)] leading-snug">{e.title}</span>
                  <Tag color={EXAM_TYPE_COLORS[e.type]} style={{fontSize:10}}>{e.type}</Tag>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] flex-wrap">
                  <span>📝 {e.qCount}题</span><span>⏱ {e.duration}分钟</span><span>📊 及格{e.passLine}分</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3"/>{e.participants}人</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-tertiary)] rounded p-2">
                  <span className="text-[var(--ai-blue-500)]">🤖 AI出题源：</span>{e.source}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Tag color={e.status==='进行中'?'green':e.status==='已结束'?'default':'orange'} style={{fontSize:10}}>{e.status}</Tag>
                  {e.avgScore>0 && <span className="text-[10px] text-[var(--text-secondary)]">均分 {e.avgScore}</span>}
                  <div className="flex-1"/>
                  {e.status==='进行中' || e.status==='待开始' ? (
                    <Button size="small" type="primary" onClick={function(){startExam(e)}}>开始考试</Button>
                  ) : (
                    <Button size="small" onClick={function(){startExam(e)}}>查看试卷</Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ═══ 学情考核 ═══ */
const STUDENTS = [
  {id:'S01',name:'张师傅',store:'IFS国金中心',role:'后厨',requiredDone:100,studyHours:48,avgScore:92,passRate:100,fixRate:85,level:'优秀'},
  {id:'S02',name:'李师傅',store:'IFS国金中心',role:'后厨',requiredDone:85,studyHours:36,avgScore:78,passRate:67,fixRate:60,level:'预警'},
  {id:'S03',name:'王厨',store:'太平街店',role:'后厨',requiredDone:100,studyHours:52,avgScore:95,passRate:100,fixRate:90,level:'优秀'},
  {id:'S04',name:'小明',store:'太平街店',role:'前厅',requiredDone:70,studyHours:24,avgScore:82,passRate:75,fixRate:55,level:'合格'},
  {id:'S05',name:'赵领班',store:'德思勤店',role:'前厅',requiredDone:100,studyHours:40,avgScore:88,passRate:100,fixRate:80,level:'优秀'},
  {id:'S06',name:'刘安全员',store:'德思勤店',role:'管理',requiredDone:60,studyHours:18,avgScore:65,passRate:40,fixRate:35,level:'不合格'},
  {id:'S07',name:'陈人事',store:'梅溪湖步步高店',role:'管理',requiredDone:90,studyHours:32,avgScore:85,passRate:80,fixRate:70,level:'合格'},
  {id:'S08',name:'李主厨',store:'梅溪湖步步高店',role:'后厨',requiredDone:100,studyHours:55,avgScore:98,passRate:100,fixRate:95,level:'优秀'},
  {id:'S09',name:'赵姐',store:'湖滨银泰店',role:'仓储',requiredDone:100,studyHours:44,avgScore:90,passRate:100,fixRate:88,level:'优秀'},
  {id:'S10',name:'钱师傅',store:'湖滨银泰店',role:'后厨',requiredDone:45,studyHours:15,avgScore:58,passRate:33,fixRate:20,level:'不合格'},
  {id:'S11',name:'孙领班',store:'广州天河城店',role:'前厅',requiredDone:80,studyHours:30,avgScore:76,passRate:75,fixRate:65,level:'合格'},
  {id:'S12',name:'周厨',store:'广州天河城店',role:'后厨',requiredDone:100,studyHours:50,avgScore:93,passRate:100,fixRate:90,level:'优秀'},
  {id:'S13',name:'吴安全',store:'深圳万象天地',role:'管理',requiredDone:75,studyHours:28,avgScore:72,passRate:60,fixRate:50,level:'预警'},
  {id:'S14',name:'郑师傅',store:'深圳万象天地',role:'后厨',requiredDone:95,studyHours:42,avgScore:86,passRate:100,fixRate:75,level:'合格'},
  {id:'S15',name:'马姐',store:'成都太古里店',role:'仓储',requiredDone:100,studyHours:38,avgScore:91,passRate:100,fixRate:85,level:'优秀'},
  {id:'S16',name:'冯领班',store:'成都太古里店',role:'前厅',requiredDone:55,studyHours:20,avgScore:68,passRate:50,fixRate:40,level:'预警'},
]

const STORE_NAMES = ['IFS国金中心','太平街店','德思勤店','梅溪湖步步高店','湖滨银泰店','广州天河城店','深圳万象天地','成都太古里店']

function getStoreStats() {
  return STORE_NAMES.map(function(store){
    const members = STUDENTS.filter(function(s){return s.store===store})
    const coverage = Math.round(members.filter(function(s){return s.requiredDone>=80}).length/members.length*100)
    const avgHours = Math.round(members.reduce(function(a,s){return a+s.studyHours},0)/members.length)
    const passRate = Math.round(members.reduce(function(a,s){return a+s.passRate},0)/members.length)
    const failCount = members.filter(function(s){return s.level==='不合格'||s.level==='预警'}).length
    const avgScore = Math.round(members.reduce(function(a,s){return a+s.avgScore},0)/members.length)
    const recurrenceRate = Math.round(10+Math.random()*20) // 问题复发率 mock
    return {store,members:members.length,coverage,avgHours,passRate,failCount,avgScore,recurrenceRate}
  })
}

function BarRow({label,value,max,color}:{label:string;value:number;max:number;color:string}) {
  const pct = Math.round(value/max*100)
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[var(--text-secondary)] w-20 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-4 bg-[var(--bg-tertiary)] rounded-sm overflow-hidden">
        <div className="h-full rounded-sm flex items-center justify-end pr-1.5 text-[9px] text-white font-medium" style={{width:Math.max(pct,3)+'%',background:color}}>{value}</div>
      </div>
    </div>
  )
}

export const TrainingResult: React.FC = () => {
  const [tab, setTab] = useState('personal')
  const [view, setView] = useState<'list'|'detail'>('list')
  const [detailPerson, setDetailPerson] = useState<any>(null)
  const [detailStore, setDetailStore] = useState<any>(null)
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const ps = 8

  const storeStats = React.useMemo(function(){return getStoreStats()},[])

  let filteredStudents = STUDENTS.filter(function(s){
    if (searchText && !s.name.includes(searchText) && !s.store.includes(searchText)) return false
    return true
  })

  const overview = {
    total: STUDENTS.length,
    coverage: Math.round(STUDENTS.filter(function(s){return s.requiredDone>=80}).length/STUDENTS.length*100),
    passRate: Math.round(STUDENTS.reduce(function(a,s){return a+s.passRate},0)/STUDENTS.length),
    danger: STUDENTS.filter(function(s){return s.level==='不合格'||s.level==='预警'}).length,
  }

  function handlePersonClick(s:any) {
    setDetailPerson(s)
    setView('detail')
  }

  function handleStoreClick(st:any) {
    setDetailStore(st)
    setView('detail')
  }

  // ═══ DETAIL VIEW ═══
  if (view === 'detail') {
    if (detailPerson) {
      const s = detailPerson
      const levelColor = s.level==='优秀'?'#10B981':s.level==='合格'?'#3B82F6':s.level==='预警'?'#F59E0B':'#EF4444'
      const exams = [
        {name:'5月全员周期统考',score:92,passed:true,date:'2026-05-15'},
        {name:'未戴厨师帽靶向补考',score:78,passed:false,date:'2026-05-10'},
        {name:'岗前准入首考',score:95,passed:true,date:'2026-04-01'},
      ]
      return (
        <div className="p-6 h-full flex flex-col overflow-hidden">
          <div className="shrink-0 flex items-center gap-2 mb-4">
            <Button size="small" type="text" icon={<ArrowLeft className="w-3.5 h-3.5"/>} onClick={function(){setView('list');setDetailPerson(null)}} style={{fontSize:12}}>返回</Button>
            <span className="text-[var(--text-muted)] text-xs"><ChevronRight className="w-3 h-3 inline"/> {s.name} · 个人学情档案</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* header */}
            <div className="card-level-1 p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{background:levelColor}}>{s.name[0]}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2"><span className="text-base font-semibold text-[var(--text-primary)]">{s.name}</span><Tag color={s.level==='优秀'?'green':s.level==='合格'?'blue':s.level==='预警'?'orange':'red'} style={{fontSize:12}}>{s.level}</Tag></div>
                <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] mt-1"><span>{s.store}</span><span>{s.role}</span></div>
              </div>
            </div>
            {/* kpi grid */}
            <div className="grid grid-cols-4 gap-3">
              {[
                {label:'必修完成率',value:s.requiredDone+'%',color:'#10B981'},
                {label:'学习学时',value:s.studyHours+'h',color:'#3B82F6'},
                {label:'考试均分',value:s.avgScore+'分',color:'#8B5CF6'},
                {label:'通过率',value:s.passRate+'%',color:'#10B981'},
                {label:'错题整改率',value:s.fixRate+'%',color:'#F59E0B'},
                {label:'考核等级',value:s.level,color:levelColor},
              ].map(function(k,i){ return (
                <div key={i} className="card-level-1 p-3 text-center">
                  <div className="text-[10px] text-[var(--text-muted)]">{k.label}</div>
                  <div className="text-base font-bold mt-1" style={{color:k.color}}>{k.value}</div>
                </div>
              )})}
            </div>
            {/* study progress bars */}
            <div className="card-level-1 p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4"/>学习指标</h3>
              <div className="space-y-2">
                <BarRow label="必修完成率" value={s.requiredDone} max={100} color="#10B981"/>
                <BarRow label="学时达标率" value={Math.round(s.studyHours/60*100)} max={100} color="#3B82F6"/>
                <BarRow label="考试通过率" value={s.passRate} max={100} color="#8B5CF6"/>
                <BarRow label="错题整改率" value={s.fixRate} max={100} color="#F59E0B"/>
              </div>
            </div>
            {/* exam history */}
            <div className="card-level-1 p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><Brain className="w-4 h-4"/>考试记录</h3>
              <div className="overflow-hidden" style={{padding:0}}>
                <table className="w-full text-xs">
                  <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)]">
                    <tr><th className="px-3 py-2 text-left">考试名称</th><th className="px-3 py-2 text-center">成绩</th><th className="px-3 py-2 text-center">结果</th><th className="px-3 py-2 text-left">日期</th></tr>
                  </thead>
                  <tbody>
                    {exams.map(function(e,i){ return (
                      <tr key={i} className="border-b border-[var(--border-subtle)]">
                        <td className="px-3 py-2 text-[var(--text-primary)]">{e.name}</td>
                        <td className="px-3 py-2 text-center font-medium" style={{color:e.passed?'#10B981':'#EF4444'}}>{e.score}分</td>
                        <td className="px-3 py-2 text-center"><Tag color={e.passed?'green':'red'} style={{fontSize:11}}>{e.passed?'通过':'未通过'}</Tag></td>
                        <td className="px-3 py-2 text-[var(--text-secondary)]">{e.date}</td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
            {/* warning if applicable */}
            {s.level!=='优秀' && (
              <div className="card-level-1 p-4 border-l-[3px]" style={{borderLeftColor:levelColor,background:levelColor+'08'}}>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" style={{color:levelColor}}/>改进建议</h3>
                {s.level==='不合格' && <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">该学员必修课程完成率严重不足，且多次考试未通过。建议：① 强制完成剩余必修课程学习；② 安排参加靶向补考（未通过科目）；③ 由店长进行一对一辅导；④ 如本月仍未达标，暂停上岗资格。</p>}
                {s.level==='预警' && <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">该学员部分指标触及预警线。建议：① 查漏补缺未完成课程；② 重点回顾题库中的高频错题并完成整改学习；③ 下月统一考试前进行模拟练习。</p>}
                {s.level==='合格' && <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">该学员已达标但仍有提升空间。建议：① 积极参加选修课程拓展知识面；② 关注巡检中自身岗位相关违规项的对应课程；③ 争取下月考核达到优秀等级。</p>}
              </div>
            )}
          </div>
        </div>
      )
    }
    if (detailStore) {
      const st = detailStore
      const members = STUDENTS.filter(function(s){return s.store===st.store})
      const rank = storeStats.sort(function(a,b){return b.avgScore-a.avgScore}).findIndex(function(s){return s.store===st.store})+1
      return (
        <div className="p-6 h-full flex flex-col overflow-hidden">
          <div className="shrink-0 flex items-center gap-2 mb-4">
            <Button size="small" type="text" icon={<ArrowLeft className="w-3.5 h-3.5"/>} onClick={function(){setView('list');setDetailStore(null)}} style={{fontSize:12}}>返回</Button>
            <span className="text-[var(--text-muted)] text-xs"><ChevronRight className="w-3 h-3 inline"/> {st.store} · 门店学情报表</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* header */}
            <div className="card-level-1 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">{st.store}</h3>
                <Tag color={st.avgScore>=90?'green':st.avgScore>=75?'blue':st.avgScore>=60?'orange':'red'} style={{fontSize:12}}>综合排名 #{rank}</Tag>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  {label:'学员数',value:st.members+'人',color:'#3B82F6'},
                  {label:'学习覆盖率',value:st.coverage+'%',color:'#10B981'},
                  {label:'人均学时',value:st.avgHours+'h',color:'#8B5CF6'},
                  {label:'考试均分',value:st.avgScore+'分',color:'#F59E0B'},
                  {label:'通过率',value:st.passRate+'%',color:'#10B981'},
                  {label:'不达标人数',value:st.failCount+'人',color:st.failCount>0?'#EF4444':'#10B981'},
                  {label:'问题复发率',value:st.recurrenceRate+'%',color:st.recurrenceRate>20?'#EF4444':'#F59E0B'},
                  {label:'综合排名',value:'第'+rank+'名',color:'#3B82F6'},
                ].map(function(k,i){ return (
                  <div key={i} className="bg-[var(--bg-tertiary)] rounded-lg p-2.5 text-center">
                    <div className="text-[10px] text-[var(--text-muted)]">{k.label}</div>
                    <div className="text-sm font-bold mt-0.5" style={{color:k.color}}>{k.value}</div>
                  </div>
                )})}
              </div>
            </div>
            {/* member list */}
            <div className="card-level-1 p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><Users className="w-4 h-4"/>学员明细</h3>
              <div className="overflow-hidden" style={{padding:0}}>
                <table className="w-full text-xs">
                  <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)]">
                    <tr><th className="px-3 py-2 text-left">姓名</th><th className="px-3 py-2 text-left">岗位</th><th className="px-3 py-2 text-center">必修完成</th><th className="px-3 py-2 text-center">学时</th><th className="px-3 py-2 text-center">均分</th><th className="px-3 py-2 text-center">等级</th></tr>
                  </thead>
                  <tbody>
                    {members.map(function(m){ return (
                      <tr key={m.id} className="border-b border-[var(--border-subtle)]">
                        <td className="px-3 py-2 font-medium text-[var(--text-primary)]">{m.name}</td>
                        <td className="px-3 py-2 text-[var(--text-secondary)]">{m.role}</td>
                        <td className="px-3 py-2 text-center"><span style={{color:m.requiredDone>=80?'#10B981':'#EF4444'}}>{m.requiredDone}%</span></td>
                        <td className="px-3 py-2 text-center text-[var(--text-secondary)]">{m.studyHours}h</td>
                        <td className="px-3 py-2 text-center" style={{color:m.avgScore>=80?'#10B981':m.avgScore>=60?'#F59E0B':'#EF4444'}}>{m.avgScore}分</td>
                        <td className="px-3 py-2 text-center"><Tag color={m.level==='优秀'?'green':m.level==='合格'?'blue':m.level==='预警'?'orange':'red'} style={{fontSize:11}}>{m.level}</Tag></td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  // ═══ LIST VIEW ═══
  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <div className="shrink-0 space-y-3">
        <div><h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2"><BarChart3 className="w-4 h-4"/>学情考核</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">全员合规能力评价体系 · 个人/门店双层考核 · 数据驱动精准管理</p></div>
        {/* global kpi cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            {label:'总学员',value:overview.total+'人',icon:<Users className="w-4 h-4"/>,color:'#3B82F6'},
            {label:'学习覆盖率',value:overview.coverage+'%',icon:<BookOpen className="w-4 h-4"/>,color:'#10B981'},
            {label:'考试通过率',value:overview.passRate+'%',icon:<CheckCircle2 className="w-4 h-4"/>,color:'#8B5CF6'},
            {label:'预警/不合格',value:overview.danger+'人',icon:<AlertTriangle className="w-4 h-4"/>,color:'#EF4444'},
          ].map(function(s,i){ return (
            <div key={i} className="card-level-1 p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{background:s.color+'15'}}>{React.cloneElement(s.icon as any,{className:'w-4 h-4',style:{color:s.color}})}</div>
              <div><div className="text-xs font-semibold text-[var(--text-primary)]">{s.value}</div><div className="text-[10px] text-[var(--text-muted)]">{s.label}</div></div>
            </div>
          )})}
        </div>
        {/* main tabs */}
        <Tabs activeKey={tab} onChange={function(k){setTab(k);setPage(1)}} size="small"
          items={[{key:'personal',label:'个人学情'},{key:'store',label:'门店学情'}]}/>
        {/* search */}
        <div className="flex items-center gap-3">
          <Input size="middle" prefix={<Search className="w-3.5 h-3.5"/>} placeholder={tab==='personal'?'搜索学员/门店':'搜索门店'} value={searchText} onChange={function(e){setSearchText(e.target.value);setPage(1)}} style={{width:220}} allowClear/>
          <div className="flex-1"/>
          <Button size="middle" icon={<Download className="w-3.5 h-3.5"/>}>导出报表</Button>
        </div>
      </div>
      {/* content */}
      <div className="flex-1 overflow-y-auto mt-3">
        {tab === 'personal' && (
          <div className="space-y-3">
            {/* ranking bar chart */}
            <div className="card-level-1 p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4"/>学员评分排名 TOP8</h3>
              <div className="space-y-2">
                {filteredStudents.sort(function(a,b){return b.avgScore-a.avgScore}).slice(0,8).map(function(s,i){
                  const colors = ['#3B82F6','#6366F1','#8B5CF6','#A855F7','#EC4899','#F59E0B','#10B981','#06B6D4']
                  return <BarRow key={s.id} label={s.name+' · '+s.store} value={s.avgScore} max={100} color={colors[i]}/>
                })}
              </div>
            </div>
            {/* student table */}
            <div className="card-level-1 overflow-hidden" style={{padding:0}}>
              <table className="w-full text-xs">
                <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5 text-left">学员</th><th className="px-3 py-2.5 text-left">门店</th>
                    <th className="px-3 py-2.5 text-left">岗位</th><th className="px-3 py-2.5 text-center">必修完成</th>
                    <th className="px-3 py-2.5 text-center">学时</th><th className="px-3 py-2.5 text-center">均分</th>
                    <th className="px-3 py-2.5 text-center">通过率</th><th className="px-3 py-2.5 text-center">整改率</th>
                    <th className="px-3 py-2.5 text-center">等级</th><th className="px-3 py-2.5 text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.slice((page-1)*ps,page*ps).map(function(s){
                    const lvlColor = s.level==='优秀'?'green':s.level==='合格'?'blue':s.level==='预警'?'orange':'red'
                    const isDanger = s.level==='不合格'||s.level==='预警'
                    return (
                      <tr key={s.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)] cursor-pointer" onClick={function(){handlePersonClick(s)}} style={isDanger?{background:'rgba(239,68,68,0.05)'}:undefined}>
                        <td className="px-4 py-2.5 font-medium text-[var(--text-primary)] flex items-center gap-1.5">{isDanger && <AlertTriangle className="w-3 h-3 text-red-400"/>}{s.name}</td>
                        <td className="px-3 py-2.5 text-[var(--text-secondary)]">{s.store}</td>
                        <td className="px-3 py-2.5 text-[var(--text-secondary)]">{s.role}</td>
                        <td className="px-3 py-2.5 text-center"><Progress percent={s.requiredDone} size="small" showInfo={false} strokeColor={s.requiredDone>=80?'#10B981':'#EF4444'} style={{width:50,margin:'0 auto'}}/></td>
                        <td className="px-3 py-2.5 text-center text-[var(--text-secondary)]">{s.studyHours}h</td>
                        <td className="px-3 py-2.5 text-center font-medium" style={{color:s.avgScore>=80?'#10B981':s.avgScore>=60?'#F59E0B':'#EF4444'}}>{s.avgScore}</td>
                        <td className="px-3 py-2.5 text-center" style={{color:s.passRate>=80?'#10B981':'#EF4444'}}>{s.passRate}%</td>
                        <td className="px-3 py-2.5 text-center text-[var(--text-secondary)]">{s.fixRate}%</td>
                        <td className="px-3 py-2.5 text-center"><Tag color={lvlColor} style={{fontSize:11}}>{s.level}</Tag></td>
                        <td className="px-3 py-2.5 text-center"><Button size="small" type="link" style={{fontSize:11}}>详情</Button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === 'store' && (
          <div className="space-y-3">
            {/* store ranking bars */}
            <div className="card-level-1 p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4"/>门店综合排名</h3>
              <div className="space-y-2">
                {storeStats.sort(function(a,b){return b.avgScore-a.avgScore}).map(function(st,i){
                  const colors = ['#3B82F6','#6366F1','#8B5CF6','#A855F7','#EC4899','#F59E0B','#10B981','#06B6D4']
                  return <BarRow key={st.store} label={st.store} value={st.avgScore} max={100} color={colors[i]}/>
                })}
              </div>
            </div>
            {/* store table */}
            <div className="card-level-1 overflow-hidden" style={{padding:0}}>
              <table className="w-full text-xs">
                <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5 text-left">门店</th><th className="px-3 py-2.5 text-center">学员</th>
                    <th className="px-3 py-2.5 text-center">学习覆盖率</th><th className="px-3 py-2.5 text-center">人均学时</th>
                    <th className="px-3 py-2.5 text-center">考试通过率</th><th className="px-3 py-2.5 text-center">考试均分</th>
                    <th className="px-3 py-2.5 text-center">不达标</th><th className="px-3 py-2.5 text-center">复发率</th>
                    <th className="px-3 py-2.5 text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {storeStats.map(function(st){
                    const dangerColor = st.failCount>0?'#EF4444':'#10B981'
                    return (
                      <tr key={st.store} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)] cursor-pointer" onClick={function(){handleStoreClick(st)}}>
                        <td className="px-4 py-2.5 font-medium text-[var(--text-primary)]">{st.store}</td>
                        <td className="px-3 py-2.5 text-center text-[var(--text-secondary)]">{st.members}人</td>
                        <td className="px-3 py-2.5 text-center"><Progress percent={st.coverage} size="small" showInfo={false} strokeColor={st.coverage>=80?'#10B981':'#EF4444'} style={{width:50,margin:'0 auto'}}/></td>
                        <td className="px-3 py-2.5 text-center text-[var(--text-secondary)]">{st.avgHours}h</td>
                        <td className="px-3 py-2.5 text-center" style={{color:st.passRate>=80?'#10B981':'#EF4444'}}>{st.passRate}%</td>
                        <td className="px-3 py-2.5 text-center font-medium" style={{color:st.avgScore>=80?'#10B981':st.avgScore>=60?'#F59E0B':'#EF4444'}}>{st.avgScore}</td>
                        <td className="px-3 py-2.5 text-center font-medium" style={{color:dangerColor}}>{st.failCount}人</td>
                        <td className="px-3 py-2.5 text-center" style={{color:st.recurrenceRate>20?'#EF4444':'#F59E0B'}}>{st.recurrenceRate}%</td>
                        <td className="px-3 py-2.5 text-center"><Button size="small" type="link" style={{fontSize:11}}>详情</Button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {/* pagination */}
      <div className="shrink-0 flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
        <span className="text-[10px] text-[var(--text-muted)]">共 {tab==='personal'?filteredStudents.length+'名学员':storeStats.length+'家门店'}</span>
        <Pagination current={page} pageSize={ps} total={tab==='personal'?filteredStudents.length:storeStats.length} onChange={setPage} size="small" showSizeChanger={false}/>
      </div>
    </div>
  )
}

/* ═══ 知识空间 ═══ */
const SPACES=[
  {id:'s1',name:'食品安全管理',desc:'食品加工、储存、消毒全流程管理规范',icon:<ShieldCheck className="w-5 h-5"/>,color:'#10B981',count:128,pending:0,packages:[
    {id:'p1',name:'食材管理规范',desc:'食材验收、储存、加工全流程',count:32,featured:[
      {title:'食材验收标准',type:'doc',desc:'新鲜度、保质期、供应商资质核查标准',author:'食安部',date:'2026-05-15'},
      {title:'冷藏冷冻温度管理',type:'doc',desc:'不同食材最佳储存温度参考表',author:'设备部',date:'2026-04-20'},
      {title:'食材先进先出制度',type:'doc',desc:'FIFO管理流程与标签规范',author:'运营部',date:'2026-05-01'},
      {title:'食品添加剂使用规范',type:'doc',desc:'GB2760标准解读与实操指南',author:'食安部',date:'2026-03-10'},
    ],items:[
      {title:'生熟食品分区存放标准',type:'知识卡片',tag:'操作',date:'2026-05-20'},
      {title:'食材入库检验流程图',type:'素材',tag:'流程图',date:'2026-05-18'},
      {title:'干货存储温湿度要求',type:'知识卡片',tag:'仓储',date:'2026-04-15'},
      {title:'冷链物流交接规范',type:'素材',tag:'物流',date:'2026-04-12'},
      {title:'食材保质期管理表',type:'知识卡片',tag:'管理',date:'2026-03-28'},
      {title:'供应商资质审核清单',type:'素材',tag:'审核',date:'2026-03-20'},
      {title:'食材验收视觉标准',type:'知识卡片',tag:'视觉',date:'2026-02-15'},
      {title:'进口食材报关流程',type:'素材',tag:'进口',date:'2026-01-10'},
    ]},
    {id:'p2',name:'消毒与清洁规范',desc:'操作区、设备、工具消毒流程',count:24,featured:[
      {title:'后厨消毒操作手册',desc:'每日消毒液配比、操作步骤、责任人',author:'食安部',date:'2026-05-10'},
      {title:'餐具清洗消毒四步法',desc:'一冲二洗三消四保洁标准流程',author:'培训部',date:'2026-04-25'},
      {title:'突发疫情消毒预案',desc:'发现食源性疾病时的应急消毒方案',author:'食安部',date:'2026-03-15'},
      {title:'消毒柜使用与维护',desc:'不同型号消毒柜操作指南及维护周期',author:'设备部',date:'2026-02-20'},
    ],items:[
      {title:'消毒液浓度配比表',type:'知识卡片',tag:'配比',date:'2026-05-05'},
      {title:'清洁工具分区管理图',type:'素材',tag:'分区',date:'2026-04-15'},
      {title:'食品接触面消毒频率',type:'知识卡片',tag:'频率',date:'2026-03-22'},
      {title:'消毒记录表模板',type:'素材',tag:'记录',date:'2026-02-10'},
      {title:'夜间全面消杀流程',type:'知识卡片',tag:'夜间',date:'2026-01-25'},
    ]},
  ]},
  {id:'s2',name:'门店运营SOP',desc:'门店开业、营业、收市标准化操作流程',icon:<FileText className="w-5 h-5"/>,color:'#3B82F6',count:56,pending:0,packages:[
    {id:'p3',name:'开门营业流程',desc:'开店前检查、设备开启、迎宾准备',count:18,featured:[
      {title:'开门检查清单',desc:'8大项25小项开店前必检内容',author:'运营部',date:'2026-05-15'},
      {title:'收银机日初始化流程',desc:'POS开机、对账、备用金准备步骤',author:'财务部',date:'2026-05-01'},
      {title:'门店灯光系统检查',desc:'各区域灯光亮度标准与故障上报流程',author:'设备部',date:'2026-04-10'},
      {title:'迎宾区布置规范',desc:'迎宾台、展示柜、宣传物料摆放标准',author:'市场部',date:'2026-03-15'},
    ],items:[
      {title:'开店时间管理表',type:'知识卡片',tag:'时间',date:'2026-05-20'},
      {title:'开门检查拍照模板',type:'素材',tag:'拍照',date:'2026-04-18'},
      {title:'早班会议流程',type:'知识卡片',tag:'会议',date:'2026-03-25'},
      {title:'设备启动顺序图',type:'素材',tag:'设备',date:'2026-02-15'},
    ]},
    {id:'p4',name:'高峰运营管理',desc:'午晚市高峰期人员排班、出餐效率管理',count:20,featured:[
      {title:'午市高峰排班表',desc:'11:00-14:00人员安排与角色职责',author:'运营部',date:'2026-05-10'},
      {title:'收银效率提升方案',desc:'减少排队时间的5项措施与考核指标',author:'运营部',date:'2026-04-20'},
      {title:'外卖交接标准流程',desc:'打包→贴签→核单→交付四步标准',author:'外卖部',date:'2026-03-10'},
      {title:'突发客流应急方案',desc:'排队超10人时的应急增开方案',author:'运营部',date:'2026-02-25'},
    ],items:[
      {title:'高峰出餐速度标准',type:'知识卡片',tag:'速度',date:'2026-05-12'},
      {title:'外卖打包区布置图',type:'素材',tag:'布置',date:'2026-04-20'},
      {title:'收银台紧急处理流程',type:'知识卡片',tag:'紧急',date:'2026-03-15'},
    ]},
  ]},
  {id:'s3',name:'员工行为规范',desc:'仪容仪表、服务标准、岗位职责',icon:<User className="w-5 h-5"/>,color:'#8B5CF6',count:42,pending:2,packages:[
    {id:'p5',name:'仪容仪表标准',desc:'穿戴、个人卫生、礼仪规范',count:22,featured:[
      {title:'后厨着装标准',desc:'工服、帽子、口罩、围裙穿戴规范',author:'HR部',date:'2026-05-01'},
      {title:'前厅服务仪容',desc:'淡妆上岗、发型规范、饰品限制',author:'HR部',date:'2026-04-15'},
      {title:'手部卫生管理制度',desc:'洗手七步法、消毒频次要求',author:'食安部',date:'2026-03-20'},
      {title:'指甲与饰品管理规定',desc:'从业禁止佩戴饰品清单',author:'HR部',date:'2026-02-10'},
    ],items:[
      {title:'仪容仪表检查表',type:'知识卡片',tag:'检查',date:'2026-05-10'},
      {title:'标准着装示意图',type:'素材',tag:'视觉',date:'2026-04-25'},
      {title:'个人卫生考核标准',type:'知识卡片',tag:'考核',date:'2026-03-15'},
    ]},
  ]},
  {id:'s4',name:'消防安全管理',desc:'消防设施、通道、应急演练规范',icon:<AlertTriangle className="w-5 h-5"/>,color:'#EF4444',count:28,pending:3,packages:[
    {id:'p6',name:'消防设施管理',desc:'灭火器、消防栓、烟感维护标准',count:16,featured:[
      {title:'灭火器检查规范',desc:'每月检查项目、压力表读数标准',author:'安全部',date:'2026-05-05'},
      {title:'消防通道管理制度',desc:'通道宽度标准、堆物处罚规定',author:'安全部',date:'2026-04-10'},
      {title:'应急疏散演练方案',desc:'每季度演练流程、角色分工',author:'安全部',date:'2026-03-15'},
      {title:'火灾隐患排查清单',desc:'后厨/仓库/前厅23项排查点',author:'安全部',date:'2026-02-20'},
    ],items:[
      {title:'消防器材分布图',type:'素材',tag:'分布',date:'2026-05-10'},
      {title:'月度消防检查表',type:'知识卡片',tag:'检查',date:'2026-04-15'},
      {title:'火灾应急预案',type:'知识卡片',tag:'应急',date:'2026-03-01'},
      {title:'应急照明测试记录',type:'素材',tag:'测试',date:'2026-02-10'},
    ]},
  ]},
]

export const KnowledgeCenter: React.FC = () => {
  const[selSpace,setSelSpace]=useState(SPACES[0].id)
  const[selPkg,setSelPkg]=useState(SPACES[0].packages[0].id)
  const space=SPACES.find(s=>s.id===selSpace)||SPACES[0]
  const pkg=space.packages.find(p=>p.id===selPkg)||space.packages[0]
  const[listTab,setListTab]=useState('全部')
  
  let filtered=pkg.items.filter(i=>listTab==='全部'||i.type===listTab)
  
  return <div className="p-6 h-full flex flex-col overflow-hidden">
    <div className="shrink-0 mb-3"><h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2"><Library className="w-4 h-4"/>知识空间</h2></div>
    <div className="flex-1 flex gap-4 overflow-hidden">
      {/* ═══ 左侧：分类导航列表 ═══ */}
      <div className="w-52 shrink-0 overflow-y-auto">
        {SPACES.map(s=>{
          const isActive=s.id===selSpace
          return <div key={s.id} className={'flex items-center gap-3 px-3 py-3 cursor-pointer transition-all border-b border-[var(--border-subtle)] last:border-b-0 '+(isActive?'bg-red-50/60 border-r-2 border-r-red-500 ':'hover:bg-[var(--bg-tertiary)] border-r-2 border-r-transparent')} onClick={()=>{setSelSpace(s.id);setSelPkg(s.packages[0].id)}}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{background:`${s.color}15`,color:s.color}}>{s.icon}</div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-[var(--text-primary)] truncate">{s.name}</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5 flex items-center gap-2">
                <span>{s.count}篇文档</span>
                {s.pending>0&&<span className="text-red-500 font-medium">· {s.pending}项待处理</span>}
              </div>
            </div>
            {s.pending>0&&<div className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center shrink-0 font-medium">{s.pending}</div>}
          </div>
        })}
      </div>
      {/* ═══ 右侧：知识内容 ═══ */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {/* 分类标题 + 知识包标签 */}
        <div>
          <div className="text-base font-semibold text-[var(--text-primary)]">{space.name}</div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">{space.packages.map(p=><div key={p.id} className={'px-2.5 py-1 text-[11px] rounded-lg cursor-pointer transition-all font-medium '+(p.id===selPkg?'bg-red-500 text-white shadow-sm':'bg-red-50 text-red-500 hover:bg-red-100')} onClick={()=>setSelPkg(p.id)}>{p.name}({p.count})</div>)}</div>
        </div>
        {/* 重点知识卡片 */}
        <div className="card-level-1 p-4 space-y-3">
          <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-400"/>重点知识</div>
          <div className="grid grid-cols-2 gap-3">
            {pkg.featured.slice(0,4).map((f,i)=><div key={i} className="p-3 rounded-lg border border-red-500/15 bg-red-500/5 hover:border-red-500/30 transition-colors cursor-pointer space-y-1.5">
              <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"/><span className="text-[11px] font-semibold text-[var(--text-primary)]">{f.title}</span></div>
              <div className="text-[9px] text-[var(--text-muted)] leading-relaxed">{f.desc}</div>
              <div className="flex items-center gap-2 text-[8px] text-[var(--text-muted)]"><span className="text-red-400">{f.author}</span><span>{f.date}</span></div>
            </div>)}
          </div>
        </div>
        {/* 更多知识：表格 + Tab切换 */}
        <div className="card-level-1 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-[var(--text-primary)]">更多知识 · {pkg.name}</div>
            <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] rounded-md p-0.5">
              {['全部','知识卡片','素材'].map(t=><div key={t} className={'px-2.5 py-1 text-[10px] rounded cursor-pointer transition-all '+(listTab===t?'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm':'text-[var(--text-muted)]')} onClick={()=>setListTab(t)}>{t}</div>)}
            </div>
          </div>
          <div className="card-level-1 overflow-hidden" style={{padding:0}}>
            <table className="w-full text-xs">
              <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)]"><tr>
                <td className="px-4 py-2 font-medium text-[var(--text-muted)]">名称</td>
                <td className="px-3 py-2 font-medium text-[var(--text-muted)] w-16 text-center">类型</td>
                <td className="px-3 py-2 font-medium text-[var(--text-muted)] w-16 text-center">标签</td>
                <td className="px-3 py-2 font-medium text-[var(--text-muted)] w-20 text-right">更新日期</td>
              </tr></thead>
              <tbody>{filtered.map((it,i)=><tr key={i} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)] cursor-pointer">
                <td className={'px-4 py-2 '+(it.type==='知识卡片'?'text-[var(--text-primary)]':'text-[var(--text-muted)]')}>{it.title}</td>
                <td className="px-3 py-2 text-center"><span className="text-[10px] px-1.5 py-0.5 rounded" style={{background:it.type==='知识卡片'?'rgba(59,130,246,0.1)':'rgba(139,92,246,0.1)',color:it.type==='知识卡片'?'#3B82F6':'#8B5CF6'}}>{it.type}</span></td>
                <td className="px-3 py-2 text-center text-[var(--text-muted)]">{it.tag}</td>
                <td className="px-3 py-2 text-right text-[var(--text-muted)]">{it.date}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
}
