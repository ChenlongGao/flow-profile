import React, { useState, useEffect } from 'react'
import { Input, Button, Tag, message, Tabs } from 'antd'
import { Link, CheckCircle2, Shield, Key, RefreshCw } from 'lucide-react'

/* ═══ OAuth2.0 默认端点 ═══ */
const getDefaultEndpoints = (platform: 'meituan' | 'qimai') => ({
  authorizeUrl: platform === 'meituan' ? 'https://waimaiopen.meituan.com/oauth/authorize' : 'https://open.qimai.cn/oauth/authorize',
  tokenUrl: platform === 'meituan' ? 'https://waimaiopen.meituan.com/oauth/token' : 'https://open.qimai.cn/oauth/token',
  refreshUrl: platform === 'meituan' ? 'https://waimaiopen.meituan.com/oauth/refresh' : 'https://open.qimai.cn/oauth/refresh',
  revokeUrl: platform === 'meituan' ? 'https://waimaiopen.meituan.com/oauth/revoke' : 'https://open.qimai.cn/oauth/revoke',
})

interface OAuthConfigData {
  platform: string
  clientId: string
  clientSecret: string
  redirectUri: string
  authorizeUrl: string
  tokenUrl: string
  refreshUrl: string
  revokeUrl: string
  scopes: string
  state: string
  grantType: string
  tokenInfo: string
}

const STORAGE_KEY = 'merchant-oauth-config'

const loadConfig = (platform: string): OAuthConfigData | null => {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return all[platform] || null
  } catch { return null }
}

const saveConfig = (platform: string, data: OAuthConfigData) => {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  all[platform] = data
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

interface Props {
  platform: 'meituan' | 'qimai'
  title: string
}

export const OAuthConfig: React.FC<Props> = ({ platform, title }) => {
  const defaults = getDefaultEndpoints(platform)
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [redirectUri, setRedirectUri] = useState('')
  const [authorizeUrl, setAuthorizeUrl] = useState(defaults.authorizeUrl)
  const [tokenUrl, setTokenUrl] = useState(defaults.tokenUrl)
  const [refreshUrl, setRefreshUrl] = useState(defaults.refreshUrl)
  const [revokeUrl, setRevokeUrl] = useState(defaults.revokeUrl)
  const [scopes, setScopes] = useState('')
  const [state, setState] = useState('')
  const [grantType, setGrantType] = useState('authorization_code')
  const [tokenInfo, setTokenInfo] = useState('')
  const [saved, setSaved] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState('')

  useEffect(() => {
    const cfg = loadConfig(platform)
    if (cfg) {
      setClientId(cfg.clientId || '')
      setClientSecret(cfg.clientSecret || '')
      setRedirectUri(cfg.redirectUri || '')
      setAuthorizeUrl(cfg.authorizeUrl || defaults.authorizeUrl)
      setTokenUrl(cfg.tokenUrl || defaults.tokenUrl)
      setRefreshUrl(cfg.refreshUrl || defaults.refreshUrl)
      setRevokeUrl(cfg.revokeUrl || defaults.revokeUrl)
      setScopes(cfg.scopes || '')
      setState(cfg.state || '')
      setGrantType(cfg.grantType || 'authorization_code')
      setTokenInfo(cfg.tokenInfo || '')
      setSaved(true)
    }
  }, [platform])

  const handleSave = () => {
    const data: OAuthConfigData = { platform, clientId, clientSecret, redirectUri, authorizeUrl, tokenUrl, refreshUrl, revokeUrl, scopes, state, grantType, tokenInfo }
    saveConfig(platform, data)
    message.success(`${title} OAuth2.0 配置已保存`)
    setSaved(true)
  }

  const handleGenerateUrl = () => {
    if (!clientId || !redirectUri) { message.warning('请先填写 Client ID 和 Redirect URI'); return }
    const url = `${authorizeUrl}?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes || '')}&state=${encodeURIComponent(state || Math.random().toString(36).slice(2))}`
    setGeneratedUrl(url)
  }

  const handleTokenInfoSave = () => {
    const data: OAuthConfigData = { platform, clientId, clientSecret, redirectUri, authorizeUrl, tokenUrl, refreshUrl, revokeUrl, scopes, state, grantType, tokenInfo }
    saveConfig(platform, data)
    message.success('Token 信息已保存')
  }

  return (
    <div className="space-y-4">
      {/* ─── OAuth2.0 流程说明 ─── */}
      <div className="card-level-1 p-4 space-y-2" style={{ borderLeft: '3px solid var(--ai-blue-500)' }}>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[var(--ai-blue-500)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">OAuth2.0 授权流程</span>
        </div>
        <div className="grid grid-cols-4 gap-3 text-[10px] mt-2">
          {[
            { step: '1', title: '获取授权码', desc: '引导商户跳转授权页，用户确认后回调 redirect_uri 携带 code' },
            { step: '2', title: '换取 Token', desc: '用 code 调用 token 端点，获取 access_token + refresh_token' },
            { step: '3', title: '调用 API', desc: 'Bearer Token 访问商户数据 API' },
            { step: '4', title: '刷新 Token', desc: 'access_token 过期后用 refresh_token 续期' },
          ].map(s => (
            <div key={s.step} className="p-2 rounded bg-[var(--bg-tertiary)]">
              <div className="w-5 h-5 rounded-full bg-[var(--ai-blue-500)] text-white text-[9px] flex items-center justify-center mb-1 font-bold">{s.step}</div>
              <div className="font-medium text-[var(--text-primary)] mb-0.5">{s.title}</div>
              <div className="text-[var(--text-muted)] leading-relaxed">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── OAuth2.0 端点配置 ─── */}
      <div className="card-level-1 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Key className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="text-xs font-medium text-[var(--text-primary)]">OAuth2.0 端点配置</span>
          {saved && <Tag color="green" style={{ fontSize: 10 }}>已配置</Tag>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-[var(--text-muted)] block mb-1">Client ID <span className="text-red-400">*</span></label>
            <Input size="small" value={clientId} onChange={e => setClientId(e.target.value)} placeholder="应用 App Key / Client ID" />
          </div>
          <div>
            <label className="text-[10px] text-[var(--text-muted)] block mb-1">Client Secret <span className="text-red-400">*</span></label>
            <Input.Password size="small" value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="应用 Secret" />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] text-[var(--text-muted)] block mb-1">Redirect URI <span className="text-red-400">*</span></label>
            <Input size="small" value={redirectUri} onChange={e => setRedirectUri(e.target.value)} placeholder="https://your-domain.com/oauth/callback" />
          </div>
          <div>
            <label className="text-[10px] text-[var(--text-muted)] block mb-1">授权端点 (Authorize URL)</label>
            <Input size="small" value={authorizeUrl} onChange={e => setAuthorizeUrl(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] text-[var(--text-muted)] block mb-1">令牌端点 (Token URL)</label>
            <Input size="small" value={tokenUrl} onChange={e => setTokenUrl(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] text-[var(--text-muted)] block mb-1">刷新令牌端点 (Refresh URL)</label>
            <Input size="small" value={refreshUrl} onChange={e => setRefreshUrl(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] text-[var(--text-muted)] block mb-1">撤销令牌端点 (Revoke URL)</label>
            <Input size="small" value={revokeUrl} onChange={e => setRevokeUrl(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] text-[var(--text-muted)] block mb-1">授权范围 (Scope)</label>
            <Input size="small" value={scopes} onChange={e => setScopes(e.target.value)}
              placeholder={platform === 'meituan' ? 'order.read store.read product.read' : 'order:read store:read product:read account:read'} />
          </div>
          <div>
            <label className="text-[10px] text-[var(--text-muted)] block mb-1">State (防CSRF)</label>
            <Input size="small" value={state} onChange={e => setState(e.target.value)} placeholder="随机字符串" />
          </div>
          <div>
            <label className="text-[10px] text-[var(--text-muted)] block mb-1">授权模式 (Grant Type)</label>
            <Input size="small" value={grantType} disabled />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Button size="small" type="primary" onClick={handleSave} icon={<CheckCircle2 className="w-3 h-3" />}>保存配置</Button>
          <Button size="small" onClick={handleGenerateUrl} icon={<Link className="w-3 h-3" />}>生成授权链接</Button>
          <Button size="small" onClick={() => { setClientId(''); setClientSecret(''); setRedirectUri(''); setScopes(''); setGeneratedUrl('') }}>重置</Button>
        </div>
        {generatedUrl && (
          <div className="mt-3 p-3 rounded bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
            <div className="text-[10px] text-[var(--text-muted)] mb-1">授权链接（引导商户点击完成授权）</div>
            <div className="text-[10px] text-[var(--ai-blue-500)] break-all font-mono">{generatedUrl}</div>
          </div>
        )}
      </div>

      {/* ─── Token 管理 ─── */}
      <div className="card-level-1 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="text-xs font-medium text-[var(--text-primary)]">Token 管理</span>
        </div>
        <div>
          <label className="text-[10px] text-[var(--text-muted)] block mb-1">Access Token / Refresh Token (JSON)</label>
          <Input.TextArea size="small" value={tokenInfo} onChange={e => setTokenInfo(e.target.value)} rows={4}
            placeholder={`{"access_token":"xxx","refresh_token":"xxx","expires_in":7200,"token_type":"Bearer","scope":"order.read"}`} />
        </div>
        <Button size="small" onClick={handleTokenInfoSave} icon={<CheckCircle2 className="w-3 h-3" />}>保存 Token</Button>
      </div>
    </div>
  )
}
