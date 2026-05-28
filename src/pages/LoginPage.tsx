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
      <div className="flex-1 flex items-center justify-center p-8" style={{background:theme==='dark'?'#151d30':'var(--bg-primary)'}}>
        <div className="w-full max-w-[380px]">
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
