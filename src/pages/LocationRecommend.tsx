import React, { useState, useRef, useEffect } from 'react'
import { MapPin, Filter, Search, Building2, Users, DollarSign, ShoppingBag, Layers, Target, ChevronRight, ChevronDown, Star, Crosshair, ZoomIn, ZoomOut, Square, Circle as CircleIcon } from 'lucide-react'
import { Select, Slider, Button, Tag } from 'antd'

declare global { interface Window { AMap: any } }

const CITY_CENTER: Record<string, [number, number]> = {
  '长沙':[112.9388,28.2282],'武汉':[114.3055,30.5928],'成都':[104.0668,30.5728],
  '广州':[113.2644,23.1291],'杭州':[120.1551,30.2741],'南京':[118.7969,32.0603],
  '西安':[108.9398,34.2608],'深圳':[114.0579,22.5431],'重庆':[106.5516,29.5630],
  '北京':[116.4074,39.9042],'上海':[121.4737,31.2304],
}

const MALL_TIERS = ['高端综合体','中端综合商场','社区型商场','亲子主题商场']
const FLOORS = ['负一楼美食层','1楼沿街铺','2-3楼餐饮专区','高楼层']
const POSITIONS = ['电梯口旁','中庭流量位','主通道','次通道','边角铺']
const CATEGORIES = ['快餐简餐','茶饮小吃','正餐聚餐','火锅烤肉','特色小吃','烘焙甜品']
const MODELS = ['档口快取','堂食为主','轻堂食+外卖']
const CROWDS = ['年轻潮流群体','家庭亲子群体','上班族通勤群体']
const SPEND = ['大众平价','中端休闲','中高端聚餐']

const RESULTS = [
  { id:1, mall:'长沙IFS国金中心', tier:'高端综合体', score:9.5, match:{flow:9.5,crowd:9.0,comp:8.5,fit:9.5,cost:7.0}, floor:'B1美食层', position:'主通道', crowd:'年轻潮流', rent:'¥280/㎡', dailyFlow:'8.5万', suggest:'人气旺·茶饮品类匹配度高·建议B1中庭位' },
  { id:2, mall:'长沙步步高梅溪新天地', tier:'中端综合商场', score:8.8, match:{flow:8.5,crowd:9.0,comp:9.0,fit:8.5,cost:9.0}, floor:'L1', position:'中庭流量位', crowd:'家庭亲子', rent:'¥180/㎡', dailyFlow:'5.2万', suggest:'亲子客群匹配·烘焙甜品/小吃适配·性价比高' },
  { id:3, mall:'长沙德思勤城市广场', tier:'中端综合商场', score:8.3, match:{flow:8.0,crowd:8.5,comp:8.0,fit:8.5,cost:8.5}, floor:'L3餐饮区', position:'电梯口旁', crowd:'上班族通勤', rent:'¥200/㎡', dailyFlow:'4.8万', suggest:'办公客群午市刚需·快餐简餐适配·建议临电梯位' },
  { id:4, mall:'长沙悦方ID MALL', tier:'社区型商场', score:8.0, match:{flow:7.5,crowd:8.5,comp:9.0,fit:8.0,cost:9.5}, floor:'B1美食层', position:'边角铺', crowd:'年轻潮流', rent:'¥150/㎡', dailyFlow:'3.5万', suggest:'社区刚需·小吃档口适配·低租金高性价比' },
]

export const LocationRecommend: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const mouseTool = useRef<any>(null)
  const [mapReady, setMapReady] = useState(false)
  const [currentCity, setCurrentCity] = useState('长沙')
  const [drawMode, setDrawMode] = useState<string>('none')
  const [showResults, setShowResults] = useState(true)
  const [results] = useState(RESULTS)

  // 精简筛选参数
  const [radius, setRadius] = useState(3)
  const [mallTiers, setMallTiers] = useState<string[]>([])
  const [floors, setFloors] = useState<string[]>([])
  const [positions, setPositions] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [models, setModels] = useState<string[]>([])
  const [crowds, setCrowds] = useState<string[]>([])
  const [spend, setSpend] = useState<string[]>([])
  const [rentRange, setRentRange] = useState<[number,number]>([100, 500])

  // 地图初始化
  useEffect(() => {
    const check = () => {
      if (window.AMap && mapRef.current && !mapInstance.current) {
        const map = new window.AMap.Map(mapRef.current, {
          zoom: 13, center: CITY_CENTER[currentCity] as [number,number], resizeEnable: true, viewMode:'3D',
        })
        mapInstance.current = map
        mouseTool.current = new window.AMap.MouseTool(map)
        setMapReady(true); return
      }
      setTimeout(check, 300)
    }
    check()
  }, [])

  useEffect(() => {
    if (!mapInstance.current) return
    mapInstance.current.setZoomAndCenter(13, CITY_CENTER[currentCity] as [number,number])
  }, [currentCity])

  const switchDraw = (m: string) => {
    if (!mouseTool.current) return
    if (m === drawMode) { mouseTool.current.close(); setDrawMode('none'); return }
    setDrawMode(m)
    mouseTool.current[m === 'rect' ? 'rectangle' : 'circle']({
      fillColor: 'rgba(59,130,246,0.12)',
      strokeColor: '#3B82F6', strokeWeight: 2, strokeDasharray: [8,4]
    })
  }

  const S = ({label,opts,v,set}:{label:string;opts:string[];v:string[];set:(a:string[])=>void}) => (
    <div><label className="text-[9px] text-[var(--text-muted)] block mb-1">{label}</label>
    <Select size="small" mode="multiple" value={v} onChange={set} style={{width:'100%'}} maxTagCount={1} placeholder="不限"
      options={opts.map(o=>({value:o,label:o}))} /></div>
  )

  return (
    <div className="flex h-full overflow-hidden">
      {/* ─── 左侧筛选 ─── */}
      <div className="w-60 shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 space-y-3 overflow-y-auto">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-[var(--ai-blue-500)]" />选址条件
        </h3>

        <div className="space-y-1.5"><h4 className="text-[10px] font-semibold text-[var(--text-muted)]">商圈基础</h4>
          <div><label className="text-[9px] text-[var(--text-muted)] block mb-1">辐射范围</label>
          <Select size="small" value={radius} onChange={setRadius} style={{width:'100%'}}
            options={[1,2,3].map(v=>({value:v,label:`${v}km`}))} /></div>
          <S label="商场档次" opts={MALL_TIERS} v={mallTiers} set={setMallTiers} />
        </div>

        <div className="space-y-1.5"><h4 className="text-[10px] font-semibold text-[var(--text-muted)]">场内位置</h4>
          <S label="楼层" opts={FLOORS} v={floors} set={setFloors} />
          <S label="动线位置" opts={POSITIONS} v={positions} set={setPositions} />
        </div>

        <div className="space-y-1.5"><h4 className="text-[10px] font-semibold text-[var(--text-muted)]">业态经营</h4>
          <S label="品类" opts={CATEGORIES} v={categories} set={setCategories} />
          <S label="模式" opts={MODELS} v={models} set={setModels} />
        </div>

        <div className="space-y-1.5"><h4 className="text-[10px] font-semibold text-[var(--text-muted)]">客流人群</h4>
          <S label="主力客群" opts={CROWDS} v={crowds} set={setCrowds} />
          <S label="消费层级" opts={SPEND} v={spend} set={setSpend} />
        </div>

        <div className="space-y-1.5"><h4 className="text-[10px] font-semibold text-[var(--text-muted)]">成本预算</h4>
          <div><label className="text-[9px] text-[var(--text-muted)] block mb-1">月租 ¥{rentRange[0]}-¥{rentRange[1]}/㎡</label>
          <Slider range min={50} max={800} value={rentRange} onChange={v=>setRentRange(v as [number,number])} /></div>
        </div>

        <Button block size="small" type="primary" icon={<Search className="w-3 h-3" />}>智能匹配</Button>
      </div>

      {/* ─── 中间高德地图 ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-10 flex items-center px-3 gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] shrink-0">
          <Select size="small" value={currentCity} onChange={setCurrentCity} style={{width:90}}
            options={Object.keys(CITY_CENTER).map(c=>({value:c,label:c}))} />
          <Button size="small" type="text" icon={<ZoomIn className="w-3 h-3"/>} onClick={()=>mapInstance.current?.zoomIn()}/>
          <Button size="small" type="text" icon={<ZoomOut className="w-3 h-3"/>} onClick={()=>mapInstance.current?.zoomOut()}/>
          <div className="w-px h-4 bg-[var(--border-subtle)] mx-1"/>
          <Button size="small" type={drawMode==='rect'?'primary':'text'} icon={<Square className="w-3 h-3"/>} onClick={()=>switchDraw('rect')}>框选</Button>
          <Button size="small" type={drawMode==='circle'?'primary':'text'} icon={<CircleIcon className="w-3 h-3"/>} onClick={()=>switchDraw('circle')}>圈选</Button>
          <Button size="small" type="text" icon={<Crosshair className="w-3 h-3"/>} onClick={()=>{mouseTool.current?.close();setDrawMode('none')}}>重置</Button>
          <div className="ml-auto">
            <Button size="small" type="text" onClick={()=>setShowResults(!showResults)}>
              {showResults?'收起结果':'结果'} <ChevronRight className={`w-3 h-3 inline transition-transform ${showResults?'rotate-90':''}`}/>
            </Button>
          </div>
        </div>
        <div ref={mapRef} className="flex-1" style={{background:'#0f172a'}}/>
      </div>

      {/* ─── 右侧结果 ─── */}
      {showResults && (
        <div className="w-72 shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 space-y-3 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">推荐结果</h3>
            <Tag color="red" style={{fontSize:10}}>{results.length}条</Tag>
          </div>
          {results.map(r => (
            <div key={r.id} className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-[var(--ai-blue-500)]"/>{r.mall}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5"><Tag style={{fontSize:8}}>{r.tier}</Tag>{r.floor}·{r.position}</div>
                </div>
                <div className="text-center"><div className="text-lg font-bold text-red-400">{r.score}</div><div className="text-[8px] text-[var(--text-muted)]">评分</div></div>
              </div>
              <div className="grid grid-cols-5 gap-1 text-center">
                {[{k:'flow',l:'客流'},{k:'crowd',l:'客群'},{k:'comp',l:'竞品'},{k:'fit',l:'业态'},{k:'cost',l:'成本'}].map(d=>(
                  <div key={d.k}><div className="text-[8px] text-[var(--text-muted)]">{d.l}</div><div className="text-[10px] font-bold" style={{color:(r.match as any)[d.k]>=9?'#10B981':(r.match as any)[d.k]>=8?'#F59E0B':'#EF4444'}}>{(r.match as any)[d.k]}</div></div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px]">
                <div><span className="text-[var(--text-muted)]">客群 </span><span className="text-[var(--text-primary)]">{r.crowd}</span></div>
                <div><span className="text-[var(--text-muted)]">月租 </span><span className="text-amber-400">{r.rent}</span></div>
                <div><span className="text-[var(--text-muted)]">日客流 </span><span className="text-[var(--text-primary)]">{r.dailyFlow}</span></div>
                <div className="col-span-2 text-emerald-400 text-[9px]">💡 {r.suggest}</div>
              </div>
              <Button size="small" block style={{fontSize:10}} icon={<Star className="w-3 h-3"/>}>加入清单</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
