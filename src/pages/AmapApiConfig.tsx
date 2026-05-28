import React, { useState } from 'react'
import { Lock, Key, Server, Globe, Shield, RefreshCw, Search, Map, ChevronRight, Copy, Check } from 'lucide-react'
import { Input, Button, Tag, message, Tabs, Tree, Spin } from 'antd'

/* ─── AMap Key 配置存储 ─── */
const STORAGE_KEY = 'amap-api-config'

const loadConfig = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}
const saveConfig = (data: any) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data))

/* ─── 行政区划数据 ─── */
interface DistrictNode {
  name: string; adcode: string; level: string; children?: DistrictNode[]
}

export const AmapApiConfig: React.FC = () => {
  const [apiKey, setApiKey] = useState('')
  const [securityKey, setSecurityKey] = useState('')
  const [keyName, setKeyName] = useState('餐饮找店')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState('')
  const [districtLoading, setDistrictLoading] = useState(false)
  const [districtData, setDistrictData] = useState<DistrictNode[]>([])
  const [districtSearch, setDistrictSearch] = useState('')
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])

  React.useEffect(() => {
    const cfg = loadConfig()
    if (cfg.apiKey) { setApiKey(cfg.apiKey); setSaved(true) }
    if (cfg.securityKey) setSecurityKey(cfg.securityKey)
    if (cfg.keyName) setKeyName(cfg.keyName)
  }, [])

  const handleSave = () => {
    const cfg = { apiKey, securityKey, keyName }
    saveConfig(cfg)
    message.success('AMap API 配置已保存')
    setSaved(true)
  }

  const handleCopy = (val: string, label: string) => {
    navigator.clipboard.writeText(val).then(() => { setCopied(label); setTimeout(()=>setCopied(''), 2000) })
  }

  // 调用高德行政区划API
  const fetchDistricts = async () => {
    if (!apiKey) { message.warning('请先配置 API Key'); return }
    setDistrictLoading(true)
    try {
      const url = `https://restapi.amap.com/v3/config/district?key=${apiKey}&keywords=中国&subdistrict=3&extensions=base`
      const res = await fetch(url)
      const data = await res.json()
      if (data.status === '1' && data.districts?.length) {
        const tree = buildTree(data.districts[0].districts || [])
        setDistrictData(tree)
        message.success(`已加载全国行政区划，共 ${data.districts[0].districts.length} 个省级行政区`)
      } else {
        message.error('获取行政区划失败: ' + (data.info || '未知错误'))
      }
    } catch (e: any) {
      message.error('网络请求失败: ' + e.message)
    }
    setDistrictLoading(false)
  }

  const buildTree = (nodes: any[]): DistrictNode[] => {
    return nodes.map((n: any) => ({
      name: n.name,
      adcode: n.adcode,
      level: n.level,
      children: n.districts?.length ? buildTree(n.districts) : undefined,
    }))
  }

  const treeData = React.useMemo(() => {
    const filter = (nodes: DistrictNode[]): any[] =>
      nodes.map(n => ({
        title: <span className="text-xs">{n.name} <span className="text-[10px] text-[var(--text-muted)] ml-1">{n.adcode}</span></span>,
        key: n.adcode,
        children: n.children ? filter(n.children) : undefined,
      }))
    return filter(districtData)
  }, [districtData])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h3 className="text-sm font-semibold text-[var(--text-primary)]">高德地图 API 配置</h3>
        <p className="text-xs text-[var(--text-muted)] mt-1">配置高德地图 Key，用于选址推荐地图、行政区划数据获取</p></div>
      </div>

      <Tabs size="small" items={[
        {
          key: 'key', label: <span className="flex items-center gap-1"><Key className="w-3 h-3" />API Key 管理</span>,
          children: <div className="space-y-4">
            {/* Key 配置卡片 */}
            <div className="card-level-1 p-4 space-y-3" style={{ borderLeft: '3px solid #3B82F6' }}>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[var(--ai-blue-500)]" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">Key 配置</span>
                {saved && <Tag color="green" style={{fontSize:10}}>已保存</Tag>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[var(--text-muted)] block mb-1.5">Key 名称</label>
                  <Input size="small" value={keyName} onChange={e => setKeyName(e.target.value)} placeholder="如：餐饮找店" />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--text-muted)] block mb-1.5">绑定服务</label>
                  <Input size="small" value="Web端" disabled />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-[var(--text-muted)] block mb-1.5">API Key (Key) <span className="text-red-400">*</span></label>
                  <div className="flex items-center gap-2">
                    <Input.Password size="small" value={apiKey} onChange={e => setApiKey(e.target.value)}
                      placeholder="d4faa84d1382a2b8197e9be5d0e1afa0" className="flex-1" />
                    <Button size="small" type="text" onClick={() => handleCopy(apiKey, 'key')}
                      icon={copied === 'key' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-[var(--text-muted)] block mb-1.5">
                    安全密钥 (Security Key)
                    <span className="text-[var(--ai-blue-500)] cursor-pointer ml-1 hover:underline">使用说明</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Input.Password size="small" value={securityKey} onChange={e => setSecurityKey(e.target.value)}
                      placeholder="25240d5d1e3666231019a6346473b2cc" className="flex-1" />
                    <Button size="small" type="text" onClick={() => handleCopy(securityKey, 'sk')}
                      icon={copied === 'sk' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button size="small" type="primary" onClick={handleSave}>保存配置</Button>
                <Button size="small" onClick={() => { setApiKey(''); setSecurityKey(''); setKeyName(''); setSaved(false) }}>重置</Button>
              </div>

              {/* Key 信息展示 */}
              {saved && (
                <div className="mt-3 p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                    <div><span className="text-[var(--text-muted)]">Key名称：</span><span className="text-[var(--text-primary)]">{keyName}</span></div>
                    <div><span className="text-[var(--text-muted)]">商用说明：</span><span className="text-emerald-400">已启用</span></div>
                    <div><span className="text-[var(--text-muted)]">绑定服务：</span><Tag color="blue" style={{fontSize:9}}>Web端</Tag></div>
                    <div><span className="text-[var(--text-muted)]">Key状态：</span><Tag color="green" style={{fontSize:9}}>正常</Tag></div>
                    <div className="col-span-2"><span className="text-[var(--text-muted)]">API Key：</span><span className="text-[var(--text-primary)] font-mono text-[10px]">{apiKey.slice(0,8)}...{apiKey.slice(-4)}</span></div>
                    <div className="col-span-2"><span className="text-[var(--text-muted)]">安全密钥：</span><span className="text-[var(--text-primary)] font-mono text-[10px]">{securityKey.slice(0,8)}...{securityKey.slice(-4)}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        },
        {
          key: 'district', label: <span className="flex items-center gap-1"><Globe className="w-3 h-3" />全国行政区划</span>,
          children: <div className="space-y-4">
            <div className="card-level-1 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Map className="w-4 h-4 text-[var(--ai-blue-500)]" />
                  <span className="text-sm font-semibold text-[var(--text-primary)]">国家行政区域数据</span>
                </div>
                <Button size="small" type="primary" icon={<RefreshCw className={`w-3 h-3 ${districtLoading?'animate-spin':''}`} />}
                  onClick={fetchDistricts} loading={districtLoading}>
                  获取行政区划
                </Button>
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">
                调用高德地图行政区划API (restapi.amap.com/v3/config/district)，获取全国省/市/区三级行政区划数据
              </p>
            </div>

            {districtData.length > 0 && (
              <div className="card-level-1 p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Input size="small" prefix={<Search className="w-3 h-3" />} value={districtSearch}
                    onChange={e => setDistrictSearch(e.target.value)} placeholder="搜索省/市/区..." style={{width:200}} />
                  <Button size="small" onClick={() => setExpandedKeys(districtData.map(d => d.adcode))}>展开全部</Button>
                  <Button size="small" onClick={() => setExpandedKeys([])}>收起全部</Button>
                </div>
                <Tree
                  treeData={treeData}
                  defaultExpandedKeys={[]}
                  expandedKeys={expandedKeys}
                  onExpand={keys => setExpandedKeys(keys as string[])}
                  showLine={{ showLeafIcon: false }}
                  style={{ fontSize: 12, background: 'transparent', color: 'var(--text-primary)' }}
                />
              </div>
            )}
          </div>
        },
      ]} />
    </div>
  )
}
