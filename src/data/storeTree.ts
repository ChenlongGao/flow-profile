/* ═══ 共享：品牌门店组织架构树 ═══
 * 所有模块统一引用此数据源，避免多套重复定义
 */

export interface StoreNode {
  id: string
  name: string
  type: 'brand' | 'region' | 'province' | 'city' | 'district' | 'store'
  children?: StoreNode[]
  // 门店级扩展数据（仅 store 节点有值）
  storeData?: {
    city: string
    region: string
    area?: number
    since?: string
    cameraCount?: number
  }
}

/** 茶颜悦色 品牌组织架构树 */
export const STORE_TREE: StoreNode = {
  id: 'root', name: '茶颜悦色', type: 'brand',
  children: [
    {
      id: 'r1', name: '华中区', type: 'region', children: [
        {
          id: 'p1', name: '湖南省', type: 'province', children: [
            {
              id: 'c1', name: '长沙市', type: 'city', children: [
                {
                  id: 'd1', name: '芙蓉区', type: 'district', children: [
                    { id: 's1', name: 'IFS国金中心', type: 'store', storeData: { city: '长沙', region: '华中区', area: 80, since: '2024-03', cameraCount: 18 } },
                    { id: 's2', name: '太平街店', type: 'store', storeData: { city: '长沙', region: '华中区', area: 50, since: '2024-06', cameraCount: 19 } },
                  ],
                },
                {
                  id: 'd2', name: '雨花区', type: 'district', children: [
                    { id: 's3', name: '德思勤店', type: 'store', storeData: { city: '长沙', region: '华中区', area: 65, since: '2024-09', cameraCount: 16 } },
                    { id: 's4', name: '雨花亭店', type: 'store', storeData: { city: '长沙', region: '华中区', area: 55, since: '2025-01', cameraCount: 18 } },
                  ],
                },
                {
                  id: 'd3', name: '岳麓区', type: 'district', children: [
                    { id: 's5', name: '梅溪湖步步高店', type: 'store', storeData: { city: '长沙', region: '华中区', area: 70, since: '2025-03', cameraCount: 20 } },
                  ],
                },
                {
                  id: 'd4', name: '天心区', type: 'district', children: [
                    { id: 's6', name: '悦方ID店', type: 'store', storeData: { city: '长沙', region: '华中区', area: 60, since: '2025-05', cameraCount: 15 } },
                  ],
                },
                {
                  id: 'd5', name: '开福区', type: 'district', children: [
                    { id: 's7', name: '开福万达店', type: 'store', storeData: { city: '长沙', region: '华中区', area: 75, since: '2025-07', cameraCount: 17 } },
                  ],
                },
              ],
            },
            {
              id: 'c2', name: '武汉市', type: 'city', children: [
                { id: 'd6', name: '江汉区', type: 'district', children: [
                  { id: 's8', name: '武汉江汉路旗舰店', type: 'store', storeData: { city: '武汉', region: '华中区', area: 80, since: '2025-11', cameraCount: 14 } },
                ]},
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'r2', name: '华东区', type: 'region', children: [
        {
          id: 'p2', name: '浙江省', type: 'province', children: [
            { id: 'c3', name: '杭州市', type: 'city', children: [
              { id: 'd7', name: '上城区', type: 'district', children: [
                { id: 's9', name: '湖滨银泰店', type: 'store', storeData: { city: '杭州', region: '华东区', area: 85, since: '2025-09', cameraCount: 17 } },
              ]},
            ]},
          ],
        },
        {
          id: 'p3', name: '江苏省', type: 'province', children: [
            { id: 'c4', name: '南京市', type: 'city', children: [
              { id: 'd8', name: '秦淮区', type: 'district', children: [
                { id: 's10', name: '南京新街口店', type: 'store', storeData: { city: '南京', region: '华东区', area: 65, since: '2026-01', cameraCount: 12 } },
              ]},
            ]},
          ],
        },
      ],
    },
    {
      id: 'r3', name: '华南区', type: 'region', children: [
        {
          id: 'p4', name: '广东省', type: 'province', children: [
            { id: 'c5', name: '广州市', type: 'city', children: [
              { id: 'd9', name: '天河区', type: 'district', children: [
                { id: 's11', name: '广州天河城店', type: 'store', storeData: { city: '广州', region: '华南区', area: 70, since: '2026-03', cameraCount: 18 } },
              ]},
            ]},
            { id: 'c6', name: '深圳市', type: 'city', children: [
              { id: 'd10', name: '南山区', type: 'district', children: [
                { id: 's12', name: '深圳万象天地', type: 'store', storeData: { city: '深圳', region: '华南区', area: 120, since: '2026-02', cameraCount: 20 } },
              ]},
            ]},
          ],
        },
      ],
    },
    {
      id: 'r4', name: '西南区', type: 'region', children: [
        {
          id: 'p5', name: '四川省', type: 'province', children: [
            { id: 'c7', name: '成都市', type: 'city', children: [
              { id: 'd11', name: '锦江区', type: 'district', children: [
                { id: 's13', name: '成都太古里店', type: 'store', storeData: { city: '成都', region: '西南区', area: 100, since: '2026-04', cameraCount: 20 } },
              ]},
            ]},
          ],
        },
        {
          id: 'p6', name: '重庆市', type: 'province', children: [
            { id: 'c8', name: '重庆市', type: 'city', children: [
              { id: 'd12', name: '渝中区', type: 'district', children: [
                { id: 's14', name: '重庆解放碑店', type: 'store', storeData: { city: '重庆', region: '西南区', area: 70, since: '2026-05', cameraCount: 16 } },
              ]},
            ]},
          ],
        },
      ],
    },
    {
      id: 'r5', name: '华北区', type: 'region', children: [
        {
          id: 'p7', name: '山东省', type: 'province', children: [
            { id: 'c9', name: '青岛市', type: 'city', children: [
              { id: 'd13', name: '市南区', type: 'district', children: [
                { id: 's15', name: '青岛万象城店', type: 'store', storeData: { city: '青岛', region: '华北区', area: 85, since: '2026-03', cameraCount: 14 } },
              ]},
            ]},
          ],
        },
      ],
    },
    {
      id: 'r6', name: '西北区', type: 'region', children: [
        {
          id: 'p8', name: '陕西省', type: 'province', children: [
            { id: 'c10', name: '西安市', type: 'city', children: [
              { id: 'd14', name: '雁塔区', type: 'district', children: [
                { id: 's16', name: '西安钟楼店', type: 'store', storeData: { city: '西安', region: '西北区', area: 75, since: '2026-02', cameraCount: 15 } },
              ]},
            ]},
          ],
        },
      ],
    },
  ],
}

/** 递归遍历树节点 */
export const walkTree = (node: StoreNode, fn: (n: StoreNode) => void) => {
  fn(node)
  node.children?.forEach(c => walkTree(c, fn))
}

/** 获取所有门店节点 */
export const getAllStores = (): StoreNode[] => {
  const stores: StoreNode[] = []
  walkTree(STORE_TREE, n => { if (n.type === 'store') stores.push(n) })
  return stores
}

/** 获取所有区域节点 */
export const getAllRegions = (): StoreNode[] => {
  const regions: StoreNode[] = []
  walkTree(STORE_TREE, n => { if (n.type === 'region') regions.push(n) })
  return regions
}

/** 统计门店数量 */
export const getStoreCount = (): number => getAllStores().length

/** 统计摄像头总数 */
export const getCameraCount = (): number =>
  getAllStores().reduce((sum, s) => sum + (s.storeData?.cameraCount || 0), 0)

/** 按区域统计门店 */
export const getRegionStats = (): { name: string; stores: StoreNode[]; cameraCount: number }[] =>
  getAllRegions().map(r => {
    const stores: StoreNode[] = []
    walkTree(r, n => { if (n.type === 'store') stores.push(n) })
    return { name: r.name, stores, cameraCount: stores.reduce((s, st) => s + (st.storeData?.cameraCount || 0), 0) }
  })
