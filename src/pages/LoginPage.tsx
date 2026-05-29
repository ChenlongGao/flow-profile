import React, { useState, useEffect } from 'react'
import { Input } from 'antd'
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import { BellRing, Sun, Moon } from 'lucide-react'

interface Props {
  onLogin: (token: string, displayName: string, permissions: string[]) => void
}

const PW_RULES = [
  { test: (v:string) => v.length >= 8, msg: '至少8位字符' },
  { test: (v:string) => /[A-Z]/.test(v), msg: '包含大写字母' },
  { test: (v:string) => /[a-z]/.test(v), msg: '包含小写字母' },
  { test: (v:string) => /\d/.test(v), msg: '包含数字' },
  { test: (v:string) => /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(v), msg: '包含特殊字符' },
]

export const LoginPage: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [theme, setTheme] = useState<'dark'|'light'>(() => {
    const s = localStorage.getItem('flow-profile-theme')
    return (s==='dark'||s==='light') ? s : 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('flow-profile-theme', theme)
  }, [theme])

  const validate = (pw: string): string => {
    for (const r of PW_RULES) { if (!r.test(pw)) return r.msg }
    return ''
  }

  const doLogin = async () => {
    if (!username.trim()) { setError('请输入账号'); return }
    const pwErr = validate(password)
    if (pwErr) { setError(pwErr); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || '登录失败'); return }
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_name', data.display_name)
      localStorage.setItem('auth_perms', JSON.stringify(data.permissions||[]))
      onLogin(data.token, data.display_name, data.permissions||[])
    } catch {
      setError('网络错误')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex relative" style={{background:theme==='dark'?'#151d30':'var(--bg-primary)'}}>
      {/* 主题切换 */}
      <button onClick={() => setTheme(t => t==='dark'?'light':'dark')}
        className="absolute top-4 right-4 z-20 p-2 rounded-lg transition-colors"
        style={{background:'var(--bg-tertiary)',color:'var(--text-muted)'}}>
        {theme==='dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* ─── 左侧品牌区 ─── */}
      <div className="hidden lg:flex w-[440px] shrink-0 flex-col justify-between p-10 relative overflow-hidden" style={{background:'var(--bg-secondary)',borderRight:'1px solid var(--border-subtle)'}}>
        <div className="absolute inset-0 opacity-[0.08]">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[160px] bg-red-500" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-[160px] bg-orange-500" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <BellRing className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-wide" style={{color:'var(--text-primary)'}}>智慧餐饮平台</span>
          </div>
          <h2 className="text-[26px] font-bold leading-snug mb-4" style={{color:'var(--text-primary)'}}>
            餐饮门店 × 智慧经营<br/>全景监测与智能决策平台
          </h2>
          <p className="text-sm leading-relaxed" style={{color:'var(--text-secondary)'}}>
            实时追踪餐饮经营全链路数据<br/>
            AI 预测经营趋势 · 智能识别运营风险
          </p>
        </div>

        {/* 特性 */}
        <div className="relative z-10 space-y-4">
          {[
            { title: 'AI 融合预测引擎', desc: '基于 Prophet+XGBoost 双模型架构，融合天气/假日/促销活动多维度特征，1-7 天营收客流预测准确率≥90%' },
            { title: '动态智能预警体系', desc: '为每家门店建立专属经营行为基准，动态置信区间异常检测，彻底解决静态阈值"天天报警"痛点，误报率<10%' },
            { title: '多维经营健康评估', desc: 'TGI 门店吸引力对标 + ABC 规模分级分析，达成全量门店精准排名，营收/客流/增长/稳定多维评分，经营质量分层管理' },
          ].map((f, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
              <div>
                <p className="text-sm font-medium mb-0.5" style={{color:'var(--text-primary)'}}>{f.title}</p>
                <p className="text-xs leading-relaxed" style={{color:'var(--text-muted)'}}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="relative z-10 text-[10px]" style={{color:'var(--text-muted)'}}>© 2026 云盯 Yunding360</p>
      </div>

      {/* ─── 右侧登录表单 ─── */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden" style={{background:theme==='dark'?'#151d30':'var(--bg-primary)'}}>
        {/* 流动粒子和光带背景 */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="lg1"><stop offset="0%" stopColor={theme==='dark'?'rgba(59,130,246,0.1)':'rgba(59,130,246,0.05)'}/><stop offset="100%" stopColor="transparent"/></radialGradient>
            <radialGradient id="lg2"><stop offset="0%" stopColor={theme==='dark'?'rgba(139,92,246,0.08)':'rgba(139,92,246,0.04)'}/><stop offset="100%" stopColor="transparent"/></radialGradient>
            <radialGradient id="lg3"><stop offset="0%" stopColor={theme==='dark'?'rgba(16,185,129,0.06)':'rgba(16,185,129,0.03)'}/><stop offset="100%" stopColor="transparent"/></radialGradient>
            <linearGradient id="lgA" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={theme==='dark'?'rgba(59,130,246,0)':'rgba(59,130,246,0)'}/><stop offset="50%" stopColor={theme==='dark'?'rgba(59,130,246,0.35)':'rgba(59,130,246,0.12)'}/><stop offset="100%" stopColor={theme==='dark'?'rgba(59,130,246,0)':'rgba(59,130,246,0)'}/></linearGradient>
            <linearGradient id="lgB" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={theme==='dark'?'rgba(139,92,246,0)':'rgba(139,92,246,0)'}/><stop offset="50%" stopColor={theme==='dark'?'rgba(139,92,246,0.3)':'rgba(139,92,246,0.1)'}/><stop offset="100%" stopColor={theme==='dark'?'rgba(139,92,246,0)':'rgba(139,92,246,0)'}/></linearGradient>
            <linearGradient id="lgC" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor={theme==='dark'?'rgba(16,185,129,0)':'rgba(16,185,129,0)'}/><stop offset="50%" stopColor={theme==='dark'?'rgba(16,185,129,0.25)':'rgba(16,185,129,0.08)'}/><stop offset="100%" stopColor={theme==='dark'?'rgba(16,185,129,0)':'rgba(16,185,129,0)'}/></linearGradient>
            <filter id="bf"><feGaussianBlur stdDeviation="2.5"/></filter>
          </defs>
          <circle cx="15%" cy="20%" r="200" fill="url(#lg1)"><animateTransform attributeName="transform" type="translate" values="0,0;25,-15;0,0" dur="12s" repeatCount="indefinite"/></circle>
          <circle cx="85%" cy="75%" r="180" fill="url(#lg2)"><animateTransform attributeName="transform" type="translate" values="0,0;-20,10;0,0" dur="14s" repeatCount="indefinite"/></circle>
          <circle cx="55%" cy="15%" r="150" fill="url(#lg3)"><animateTransform attributeName="transform" type="translate" values="0,0;10,15;0,0" dur="11s" repeatCount="indefinite"/></circle>
          <circle cx="30%" cy="55%" r="160" fill="url(#lg1)"><animateTransform attributeName="transform" type="translate" values="0,0;-15,10;0,0" dur="13s" repeatCount="indefinite"/></circle>
          <circle cx="70%" cy="85%" r="140" fill="url(#lg2)"><animateTransform attributeName="transform" type="translate" values="0,0;20,-10;0,0" dur="15s" repeatCount="indefinite"/></circle>
          {/* 细光带 */}
          <g filter="url(#bf)">
            <path d="M-10,200 Q300,100 500,300 T1000,150" fill="none" stroke="url(#lgA)" strokeWidth="1"><animateTransform attributeName="transform" type="translate" values="0,0;20,15;0,0" dur="18s" repeatCount="indefinite"/></path>
            <path d="M-10,350 Q200,500 400,250 T1000,400" fill="none" stroke="url(#lgB)" strokeWidth="0.8"><animateTransform attributeName="transform" type="translate" values="0,0;-18,10;0,0" dur="22s" repeatCount="indefinite"/></path>
            <path d="M-10,550 Q350,400 550,650 T1000,480" fill="none" stroke="url(#lgC)" strokeWidth="0.8"><animateTransform attributeName="transform" type="translate" values="0,0;15,-18;0,0" dur="20s" repeatCount="indefinite"/></path>
            <path d="M100,-10 Q250,300 450,150 T1000,350" fill="none" stroke="url(#lgA)" strokeWidth="0.6"><animateTransform attributeName="transform" type="translate" values="0,0;-10,22;0,0" dur="24s" repeatCount="indefinite"/></path>
            <path d="M-10,650 Q400,550 600,450 T1000,650" fill="none" stroke="url(#lgB)" strokeWidth="0.7"><animateTransform attributeName="transform" type="translate" values="0,0;18,-8;0,0" dur="21s" repeatCount="indefinite"/></path>
            <path d="M200,700 Q500,600 700,400 T1000,550" fill="none" stroke="url(#lgA)" strokeWidth="0.5"><animateTransform attributeName="transform" type="translate" values="0,0;-12,12;0,0" dur="26s" repeatCount="indefinite"/></path>
          </g>
          {/* 流动粒子 - 随机速度 */}
          {Array.from({length:18},(_,i)=>{const d=['M0,200 Q300,50 600,300 T1200,150','M1200,100 Q800,400 500,150 T0,350','M0,600 Q400,300 700,600 T1200,500','M1200,600 Q700,400 400,550 T0,400','M400,0 Q450,350 600,200 T1000,450','M-50,700 Q300,400 600,550 T1050,650','M1050,700 Q600,550 300,650 T-50,500','M100,400 Q400,600 700,350 T1050,550'][i%8];const dur=18+Math.random()*35;const f=theme==='dark'?['rgba(59,130,246,0.4)','rgba(139,92,246,0.35)','rgba(16,185,129,0.3)','rgba(59,130,246,0.3)','rgba(139,92,246,0.4)','rgba(16,185,129,0.25)','rgba(59,130,246,0.35)','rgba(139,92,246,0.3)'][i%8]:['rgba(59,130,246,0.16)','rgba(139,92,246,0.14)','rgba(16,185,129,0.12)','rgba(59,130,246,0.11)','rgba(139,92,246,0.14)','rgba(16,185,129,0.1)','rgba(59,130,246,0.13)','rgba(139,92,246,0.11)'][i%8];return <circle key={'p'+i} r={1+i%2.5} fill={f} opacity="0.7"><animateMotion dur={dur+'s'} repeatCount="indefinite" path={d}/></circle>})}
          {/* 碰撞粒子对 */}
          <g>
            <circle cx="0" cy="0" r="2" fill={theme==='dark'?'rgba(59,130,246,0.7)':'rgba(59,130,246,0.3)'}>
              <animateMotion dur="8s" repeatCount="indefinite" path="M300,150 Q400,250 500,350 Q600,250 700,150"/>
            </circle>
            <circle cx="0" cy="0" r="2" fill={theme==='dark'?'rgba(139,92,246,0.7)':'rgba(139,92,246,0.3)'}>
              <animateMotion dur="8s" repeatCount="indefinite" path="M700,150 Q600,250 500,350 Q400,250 300,150"/>
            </circle>
          </g>
          <g>
            <circle cx="0" cy="0" r="1.8" fill={theme==='dark'?'rgba(16,185,129,0.6)':'rgba(16,185,129,0.25)'}>
              <animateMotion dur="11s" repeatCount="indefinite" path="M150,550 Q300,450 450,550 Q600,650 750,550"/>
            </circle>
            <circle cx="0" cy="0" r="1.8" fill={theme==='dark'?'rgba(59,130,246,0.6)':'rgba(59,130,246,0.25)'}>
              <animateMotion dur="11s" repeatCount="indefinite" path="M750,550 Q600,650 450,550 Q300,450 150,550"/>
            </circle>
          </g>
          {/* 分裂粒子 */}
          <circle cx="500" cy="350" r="3" fill={theme==='dark'?'rgba(139,92,246,0.8)':'rgba(139,92,246,0.35)'}>
            <animate attributeName="r" values="3;0.5;3" dur="6s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="1;0.2;1" dur="6s" repeatCount="indefinite"/>
          </circle>
          {Array.from({length:4},(_,i)=><circle key={'sp'+i} cx="500" cy="350" r="0.8" fill={theme==='dark'?'rgba(139,92,246,0.5)':'rgba(139,92,246,0.2)'}>
            <animate attributeName="cx" values="500;{500+[-60,-30,30,60][i]};500" dur="6s" repeatCount="indefinite"/>
            <animate attributeName="cy" values="350;{350+[-40,50,-50,40][i]};350" dur="6s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0;0.8;0" dur="6s" repeatCount="indefinite"/>
          </circle>)}
          <circle cx="250" cy="250" r="2.5" fill={theme==='dark'?'rgba(16,185,129,0.7)':'rgba(16,185,129,0.3)'}>
            <animate attributeName="r" values="2.5;0.3;2.5" dur="7s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="1;0.15;1" dur="7s" repeatCount="indefinite"/>
          </circle>
          {Array.from({length:3},(_,i)=><circle key={'sp2'+i} cx="250" cy="250" r="0.7" fill={theme==='dark'?'rgba(16,185,129,0.4)':'rgba(16,185,129,0.16)'}>
            <animate attributeName="cx" values="250;{250+[-30,35,0][i]};250" dur="7s" repeatCount="indefinite"/>
            <animate attributeName="cy" values="250;{250+[-25,-20,40][i]};250" dur="7s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0;0.7;0" dur="7s" repeatCount="indefinite"/>
          </circle>)}
          {/* 扫描线 */}
          <g opacity={theme==='dark'?0.4:0.2}>
            {[1,2,3,4,5,6,7].map(i=><line key={'v'+i} x1={8+i*12+'%'} y1="-5%" x2={8+i*12+'%'} y2="105%" stroke={i%2?'rgba(59,130,246,0.25)':'rgba(139,92,246,0.2)'} strokeWidth="0.3"><animate attributeName="y1" values="-5%;105%" dur={25+i*5+'s'} repeatCount="indefinite"/><animate attributeName="y2" values="0%;110%" dur={25+i*5+'s'} repeatCount="indefinite"/></line>)}
            {[1,2,3,4,5,6,7].map(i=><line key={'h'+i} x1="-5%" y1={5+i*12+'%'} x2="105%" y2={5+i*12+'%'} stroke={i%2?'rgba(16,185,129,0.2)':'rgba(59,130,246,0.15)'} strokeWidth="0.3"><animate attributeName="x1" values="-5%;105%" dur={28+i*5+'s'} repeatCount="indefinite"/><animate attributeName="x2" values="0%;110%" dur={28+i*5+'s'} repeatCount="indefinite"/></line>)}
          </g>
          {/* 虚线弧 */}
          <path d="M0,120 Q200,80 400,120 T800,120 T1200,120" fill="none" stroke={theme==='dark'?'rgba(59,130,246,0.12)':'rgba(59,130,246,0.05)'} strokeWidth="0.8" strokeDasharray="10,8"><animate attributeName="stroke-dashoffset" values="0;-36" dur="7s" repeatCount="indefinite"/></path>
          <path d="M0,400 Q200,440 400,400 T800,400 T1200,400" fill="none" stroke={theme==='dark'?'rgba(139,92,246,0.1)':'rgba(139,92,246,0.04)'} strokeWidth="0.8" strokeDasharray="8,10"><animate attributeName="stroke-dashoffset" values="0;-36" dur="8s" repeatCount="indefinite"/></path>
          <path d="M0,550 Q200,500 400,550 T800,550 T1200,550" fill="none" stroke={theme==='dark'?'rgba(16,185,129,0.08)':'rgba(16,185,129,0.03)'} strokeWidth="0.6" strokeDasharray="6,12"><animate attributeName="stroke-dashoffset" values="0;-36" dur="9s" repeatCount="indefinite"/></path>
          <path d="M0,650 Q250,620 500,650 T1000,650 T1200,650" fill="none" stroke={theme==='dark'?'rgba(59,130,246,0.07)':'rgba(59,130,246,0.025)'} strokeWidth="0.5" strokeDasharray="5,10"><animate attributeName="stroke-dashoffset" values="0;-30" dur="10s" repeatCount="indefinite"/></path>
        </svg>
        {/* 表单内容 */}
        <div className="w-full max-w-[380px] relative z-10">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
              <BellRing className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold" style={{color:'var(--text-primary)'}}>智慧餐饮平台</span>
          </div>

          <h3 className="text-xl font-bold mb-1" style={{color:'var(--text-primary)'}}>欢迎回来</h3>
          <p className="text-xs mb-8" style={{color:'var(--text-muted)'}}>请登录您的账户</p>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium mb-2" style={{color:'var(--text-secondary)'}}>账号</label>
              <Input value={username} onChange={e => { setUsername(e.target.value); setError('') }}
                onPressEnter={doLogin} placeholder="请输入账号" autoFocus
                style={{ height: 44, fontSize: 14, borderRadius: 10 }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2" style={{color:'var(--text-secondary)'}}>密码</label>
              <Input type={showPw ? 'text' : 'password'} value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onPressEnter={doLogin} placeholder="请输入密码"
                suffix={<span onClick={() => setShowPw(!showPw)} className="cursor-pointer" style={{color:'var(--text-muted)'}}>
                  {showPw ? <EyeInvisibleOutlined /> : <EyeOutlined />}</span>}
                style={{ height: 44, fontSize: 14, borderRadius: 10 }} />
            </div>

            {error && <div className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2.5">{error}</div>}

            <button onClick={doLogin} disabled={loading || !username || !password}
              className="w-full h-[44px] rounded-[10px] text-white text-sm font-medium transition-all"
              style={{
                background: 'linear-gradient(135deg, #EF4444, #F97316)',
                boxShadow: (loading||!username||!password) ? 'none' : '0 4px 16px rgba(239,68,68,0.35)',
                cursor: (loading||!username||!password) ? 'not-allowed' : 'pointer',
                opacity: (loading||!username||!password) ? 0.5 : 1
              }}>
              {loading ? '登录中...' : '登 录'}
            </button>

            <p className="text-[11px] text-center" style={{color:'var(--text-muted)'}}>登录有效期 1 天 · 仅支持账号密码登录</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export const checkToken = async (): Promise<{valid:boolean,name?:string,perms?:string[]}> => {
  const token = localStorage.getItem('auth_token')
  if (!token) return { valid: false }
  try {
    const res = await fetch(`/api/auth/me?token=${token}`)
    if (!res.ok) { localStorage.removeItem('auth_token'); return { valid: false } }
    const d = await res.json()
    return { valid: true, name: d.display_name, perms: d.permissions }
  } catch { return { valid: false } }
}
