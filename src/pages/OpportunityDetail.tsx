import React, { useState } from 'react'
import { Phone, Mail, MapPin, Clock, Calendar, DollarSign, Building2, User, Paperclip, CheckCircle2, TrendingUp } from 'lucide-react'
import { Tag, Button, Tabs, Progress, Timeline } from 'antd'

const FOLLOW_RECORDS = [
  { date:'2026-05-28 09:30', type:'面谈', person:'张拓', content:'合同条款最终确认，双方就装修期、营业时间限制、排他性条款达成一致。法务已出具终版合同，等待双方盖章。', attachment:'租赁合同终版.pdf' },
  { date:'2026-05-22 15:00', type:'邮件', person:'张拓', content:'发送合同修订意见至房东方，主要争议点：装修免租期从30天争取至45天，物业费包含项目明细确认。' },
  { date:'2026-05-15 14:30', type:'面谈', person:'张拓', content:'与房东就租金进行了第二轮谈判，房东同意降租3%，初步达成意向。需在5月20日前提交合同审批。', attachment:'谈判纪要V2.pdf' },
  { date:'2026-05-08 10:00', type:'电话', person:'张拓', content:'与李先生电话沟通，确认了租赁面积和免租期等基础条件。对方表示有其他品牌也在洽谈，需要尽快推进。' },
  { date:'2026-04-28 11:00', type:'实地考察', person:'张拓', content:'二次实地考察，重点评估周边竞品分布和客流时段特征。工作日午间客流峰值约280人次/小时，周末可达420人次/小时。拍摄现场照片32张。', attachment:'实地考察报告V2.pdf' },
  { date:'2026-04-20 16:00', type:'邮件', person:'张拓', content:'发送了品牌介绍资料和初步合作方案，等待对方回复。附品牌手册和标准店型效果图。', attachment:'品牌介绍手册.pdf' },
  { date:'2026-04-05 11:00', type:'面谈', person:'张拓', content:'首次实地考察选址，与物业负责人初步接触。位置优越，人流可观，符合品牌定位。物业方表示有多家品牌在谈，建议尽快推进。' },
  { date:'2026-03-22 09:00', type:'系统', person:'AI选址引擎', content:'AI模型完成该点位综合评分：商圈匹配度92分、客流潜力85分、竞品密度适中、租金坪效预测1:3.2。综合推荐指数：A级（强烈推荐）。', attachment:'AI选址评估报告.pdf' },
  { date:'2026-03-18 14:00', type:'电话', person:'张拓', content:'初步电话联系物业方，了解商铺基本情况：面积80㎡、临街一层、租金报价¥290/㎡、3年起租。预约4月5日实地看铺。' },
  { date:'2026-03-10 10:30', type:'系统', person:'AI选址引擎', content:'根据品牌拓店策略（华中区域·A类商圈·80-120㎡·临街一层），系统自动筛选出江汉路3个候选点位，该点位综合得分排名第1。', attachment:'候选点位对比分析.pdf' },
  { date:'2026-02-25 16:00', type:'会议', person:'拓店团队', content:'Q1拓店策略会：确定武汉为华中区域重点拓展城市，江汉路商圈为首选目标商圈。年度目标：武汉新开3-5家门店。', attachment:'Q1拓店策略会议纪要.pdf' },
  { date:'2026-02-10 09:00', type:'系统', person:'AI选址引擎', content:'年度拓店计划启动，AI模型基于城市GDP、商圈客流、竞品布局、消费画像等12个维度，输出全国TOP50城市推荐排名。武汉排名第8，江汉路商圈排名武汉第1。' },
]

const OPP_DETAIL = {
  name:'茶颜悦色·武汉江汉路旗舰店', city:'武汉市', district:'江汉区',
  address:'江汉路步行街88号', area:80, rent:280, invest:280,
  contact:'李先生', phone:'138****6789', email:'li@example.com',
  landlord:'武汉江汉路商业运营有限公司', lease:'3年起租，免租期45天',
  stage:'即将签约', progress:85, person:'张拓', expectSign:'2026-06-15',
}

export const OpportunityDetail: React.FC = () => {
  const [tab, setTab] = useState('info')

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-start gap-3 pb-3 border-b border-[var(--border-subtle)]">
        <div className="w-10 h-10 rounded-xl bg-[var(--ai-blue-500)]/10 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-[var(--ai-blue-500)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">{OPP_DETAIL.name}</h2>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[var(--text-muted)]">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{OPP_DETAIL.city}·{OPP_DETAIL.district}·{OPP_DETAIL.address}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <Tag color="purple" style={{fontSize:9}}>{OPP_DETAIL.stage}</Tag>
            <span className="text-[10px] text-[var(--text-muted)]">跟进人: {OPP_DETAIL.person}</span>
            <span className="text-[10px] text-[var(--text-muted)]">预计签约: {OPP_DETAIL.expectSign}</span>
          </div>
        </div>
        <Progress type="circle" percent={OPP_DETAIL.progress} size={48} strokeColor="#3B82F6"/>
      </div>

      <Tabs size="small" activeKey={tab} onChange={setTab} items={[
        { key:'info', label:'基本信息', children:<div className="space-y-3 pt-1">
          <div className="card-level-1 p-4 space-y-2">
            <div className="grid grid-cols-3 gap-3 text-[11px]">
              <div><span className="text-[var(--text-muted)]">面积</span><div className="text-[var(--text-primary)] font-medium flex items-center gap-1"><Building2 className="w-3 h-3"/>{OPP_DETAIL.area}㎡</div></div>
              <div><span className="text-[var(--text-muted)]">租金</span><div className="text-[var(--text-primary)] font-medium flex items-center gap-1"><DollarSign className="w-3 h-3"/>¥{OPP_DETAIL.rent}/㎡</div></div>
              <div><span className="text-[var(--text-muted)]">投资预算</span><div className="text-[var(--text-primary)] font-medium">¥{OPP_DETAIL.invest}万</div></div>
              <div><span className="text-[var(--text-muted)]">联系人</span><div className="text-[var(--text-primary)] font-medium flex items-center gap-1"><User className="w-3 h-3"/>{OPP_DETAIL.contact}</div></div>
              <div><span className="text-[var(--text-muted)]">电话</span><div className="text-[var(--text-primary)] font-medium flex items-center gap-1"><Phone className="w-3 h-3"/>{OPP_DETAIL.phone}</div></div>
              <div><span className="text-[var(--text-muted)]">邮箱</span><div className="text-[var(--text-primary)] font-medium flex items-center gap-1"><Mail className="w-3 h-3"/>{OPP_DETAIL.email}</div></div>
              <div className="col-span-2"><span className="text-[var(--text-muted)]">物业方</span><div className="text-[var(--text-primary)] font-medium">{OPP_DETAIL.landlord}</div></div>
              <div><span className="text-[var(--text-muted)]">租赁条件</span><div className="text-[var(--text-primary)] font-medium">{OPP_DETAIL.lease}</div></div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button size="small" type="primary" icon={<CheckCircle2 className="w-3 h-3"/>}>创建拓店任务</Button>
              <Button size="small">修改信息</Button>
            </div>
          </div>
        </div>
      },{
        key:'follows', label:'跟进记录', children:<div className="space-y-3 pt-1">
          <Button size="small" type="primary" style={{fontSize:10}}>+ 新增跟进</Button>
          <Timeline items={FOLLOW_RECORDS.map(f=>({
            color:f.type==='面谈'?'blue':f.type==='电话'?'green':f.type==='系统'?'purple':f.type==='会议'?'orange':f.type==='实地考察'?'cyan':'gray',
            children:<div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                <span>{f.date}</span><Tag style={{fontSize:9}}>{f.type}</Tag><span>{f.person}</span>
              </div>
              <div className="text-[11px] text-[var(--text-secondary)]">{f.content}</div>
              {f.attachment && <div className="text-[10px] text-[var(--ai-blue-500)] flex items-center gap-1"><Paperclip className="w-2.5 h-2.5"/>{f.attachment}</div>}
            </div>
          }))}/>
        </div>
      }]}/>
    </div>
  )
}
