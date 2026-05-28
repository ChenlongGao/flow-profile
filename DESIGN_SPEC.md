# 客流诊断与预警系统 — 设计规范

> 版本：v1.0 / 日期：2026-05-12 / 状态：持续完善中
>
> **使用说明**：开发过程中发现规范不足或需要补充，直接在对应章节追加，无需新建文档。新增图表类型、新增语义色、新增动画场景，都在本文档内增量更新。

---

## 一、设计哲学

本系统延续「云盯360设计系统」的核心理念，叠加客流诊断场景的**预警语义**：

| 原则 | 说明 |
|------|------|
| **深空科技暗色基底** | 默认暗色模式，`#0B1120` 底色，深蓝灰层级推进 |
| **红橙预警语义** | `#EF4444` 严重 / `#F59E0B` 警告 / `#10B981` 正常，贯穿全系统 |
| **指数化视觉** | 客流数据以指数（100 基线）展示，不展示原始绝对值，防跨商圈误读 |
| **波动可感知** | 异常波动用呼吸动画 + 脉冲光晕，正常状态静态，一目了然 |
| **图表即诊断** | 每个图表承载一个诊断结论，不是数据堆砌，有异常必标注 |

---

## 二、色彩系统

### 2.1 主题双模式 Token

亮色/暗色通过 `[data-theme="dark"]` 自动切换，所有开发使用 CSS 变量，**禁止硬编码颜色值**。

| Token | 亮色值 | 暗色值 | 用途 |
|-------|--------|--------|------|
| `--bg-primary` | `#F8FAFC` | `#0B1120` | 页面底色 |
| `--bg-secondary` | `#FFFFFF` | `#0F172A` | 卡片底色 |
| `--bg-tertiary` | `#F1F5F9` | `#1E293B` | 输入框/面板底色 |
| `--bg-elevated` | `#E2E8F0` | `#334155` | 悬停态底色 |
| `--text-primary` | `#0F172A` | `#F1F5F9` | 主文字 |
| `--text-secondary` | `#475569` | `#CBD5E1` | 次要文字 |
| `--text-muted` | `#94A3B8` | `#64748B` | 辅助/占位文字 |
| `--border-subtle` | `rgba(148,163,184,0.2)` | `rgba(148,163,184,0.1)` | 微边框 |
| `--border-default` | `rgba(148,163,184,0.3)` | `rgba(148,163,184,0.2)` | 默认边框 |
| `--ai-blue-400` | `#0284C7` | `#38BDF8` | 蓝色强调（亮） |
| `--ai-blue-500` | `#0EA5E9` | `#0EA5E9` | 品牌蓝 |
| `--ai-blue-600` | `#0369A1` | `#0284C7` | 蓝色强调（深） |
| `--radius-card` | `12px` | `12px` | 卡片圆角 |
| `--radius-card-sm` | `8px` | `8px` | 小卡片圆角 |

### 2.2 诊断语义色（功能色）

**贯穿全系统的诊断语义**，用于预警等级、状态标签、数据高亮：

| 语义 | 色值 | Tailwind | 用途 |
|------|------|----------|------|
| 🔴 严重/Critical | `#EF4444` | `text-red-400` / `bg-red-500/10` | 严重预警、背离度 < -30、指数跌破 60 |
| 🟡 警告/Warning | `#F59E0B` | `text-amber-400` / `bg-amber-500/10` | 警告、背离度 < -15、指数跌破 80 |
| 🟢 正常/Normal | `#10B981` | `text-emerald-400` / `bg-emerald-500/10` | 正常门店、背离度 > -15 |
| 🔵 信息/Info | `#6366F1` | `text-indigo-400` / `bg-indigo-500/10` | 超额捕获、正背离 > +15 |
| ⚪ 中性/Neutral | `#94A3B8` | `text-slate-400` | 已停业、无数据 |

### 2.3 ECharts 图表色板与明暗模式标准

#### 图表配色（10 色）

| 编号 | 色值 | 用途 |
|------|------|------|
| 1 | `#0EA5E9` | 品牌蓝，主序列 |
| 2 | `#8B5CF6` | 紫色，对比序列 1 |
| 3 | `#22D3EE` | 青色，对比序列 2 |
| 4 | `#EC4899` | 粉色，对比序列 3 |
| 5 | `#10B981` | 绿色，正常/达标 |
| 6 | `#F59E0B` | 琥珀，警告线 |
| 7 | `#EF4444` | 红色，严重线/预警点 |
| 8 | `#6366F1` | 靛蓝，商圈平均线 |
| 9 | `#14B8A6` | 蓝绿，商场客流 |
| 10 | `#F97316` | 橙色，节假日标记 |

**深色模式（默认）使用 `CHART_COLORS` 数组，浅色模式使用 `STANDARD_COLORS`（企业标准六色）。

#### ⚠️ 明暗模式强制标准（禁止违反）

| 项目 | 深色模式 | 浅色模式 | 说明 |
|------|----------|----------|------|
| **文字描边** | `textOutline: 'none'` | `textOutline: 'none'` | ⚠️ **强制禁用**，防止暗色模式下出现白色描边 |
| **标签颜色** | `#94A3B8` | `#4E5969` | 动态通过 `isDark` 参数传入 |
| **坐标轴文字** | `#64748B` | `#4E5969` | `axisLabel.color` |
| ** tooltip 背景** | `rgba(15,23,42,0.96)` | `rgba(255,255,255,0.96)` | 见 `DARK_THEME` / `LIGHT_THEME` |
| **网格线** | `rgba(148,163,184,0.08)` | `#E5E6EB` | `splitLine.lineStyle.color` |

#### 使用规范

1. **所有图表必须用 `BaseChart` 组件**，禁止直接 `import echarts.init`
2. **工厂函数必须传 `isDark` 参数**：
   ```typescript
   // ✅ 正确：显式传 isDark
   createVerticalBar({ ..., isDark: true })
   createDoughnut({ ..., isDark: false })
   
   // ❌ 错误：不传 isDark，标签颜色会硬编码
   createVerticalBar({ ... })
   ```
3. **`mergeChartOption(option, isDark)` 第二个参数必须传**：
   ```typescript
   // ✅ 正确
   mergeChartOption(option, true)   // 深色模式
   mergeChartOption(option, false)  // 浅色模式
   ```

#### 主题配置文件

- **深色主题**：`DARK_THEME`（默认）
- **浅色主题**：`LIGHT_THEME`
- **自动获取**：`getChartTheme(isDark)` → 返回完整主题配置
- **BaseChart 组件**：自动读取 `document.documentElement.getAttribute('data-theme')` 切换

#### 常见错误

| 错误 | 正确做法 |
|------|----------|
| 标签出现白色描边 | 检查是否设置了 `textOutline: 'none'`（已在 `DARK_THEME` / `LIGHT_THEME` 全局设置） |
| 浅色模式标签看不见 | 确认 `isDark` 参数传了 `false`，标签颜色应为 `#4E5969` |
| 坐标轴文字颜色不生效 | 使用工厂函数时传 `isDark`，或手动在 `axisLabel` 中设置 `textOutline: 'none'` |

---

## 三、字体层级

### 3.1 字体栈

```css
--font-sans: 'PingFang SC', 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### 3.2 五级字号规范

| Class | 字号 | 行高 | 字重 | 用途 |
|-------|------|------|------|------|
| `text-l1` | 40px | 48px | 700 | 首页大数字（客流总数、预警数），`font-mono` |
| `text-l2` | 24px | 32px | 600 | 章节标题 |
| `text-l3` | 18px | 24px | 500 | 卡片标题、指标名 |
| `text-l4` | 14px | 20px | 400 | 正文、表格内容 |
| `text-l5` | 12px | 16px | 400 | 辅助说明、图表标注、图例 |

### 3.3 组合快捷类

| Class | 等价 | 场景 |
|-------|------|------|
| `value-large` | `text-l1 + text-number + theme-primary` | 首页大数字 |
| `value-medium` | `text-l2 + text-number + theme-primary` | 卡片核心指标 |
| `value-small` | `text-l3 + text-number + theme-primary` | 列表指标 |
| `title-section` | `text-l2 + theme-primary` | 区域标题 |
| `title-card` | `text-l3 + theme-primary` | 卡片标题 |
| `label-primary` | `text-l4 + theme-secondary` | 标签文字 |
| `label-secondary` | `text-l5 + theme-tertiary` | 次级标签 |
| `caption` | `text-l5 + theme-muted` | 图表脚注 |

### 3.4 数字专用

所有客流数字、指数值、百分比，**必须**使用 `text-number` class：

```html
<span class="text-number value-medium">128,500</span>
```

> `text-number` 启用 `tabular-nums`，确保数字列对齐不抖动。

---

## 四、间距系统

| Token | 值 | 用途 |
|-------|-----|------|
| `--space-1` | 4px | 微间距、图标与文字 |
| `--space-2` | 8px | 紧凑间距 |
| `--space-3` | 12px | 标签内边距 |
| `--space-4` | 16px | 卡片内边距 |
| `--space-6` | 24px | 区块间距 |
| `--space-8` | 32px | 页面边距 |
| `--space-12` | 48px | 大区间距 |
| `--space-16` | 64px | 页面级分隔 |

---

## 五、卡片体系

### 5.1 灵动卡片基类

```css
.card-lingdong  /* 玻璃质感，hover 上浮 4px + 顶部渐变光线 */
```

### 5.2 三级卡片

| Class | 内边距 | 交互 | 场景 |
|-------|--------|------|------|
| `card-level-1` | 24px | 静态容器 | 统计卡片、图表容器 |
| `card-level-2` | 16px | 可点击 | 门店列表项、可跳转卡片 |
| `card-level-3` | 16px | 左侧色条 | 列表项、选中态、信息条目 |

### 5.3 预警状态卡片

在 `card-level-3` 基础上叠加左侧色条：

```html
<!-- 严重预警 -->
<div class="card-level-3 card-alert-critical">...</div>

<!-- 警告 -->
<div class="card-level-3 card-alert-warning">...</div>

<!-- 信息/超额捕获 -->
<div class="card-level-3 card-alert-info">...</div>
```

### 5.4 动画效果

| Class | 效果 | 场景 |
|-------|------|------|
| `breathe-danger` | 呼吸灯（2s 循环） | 严重预警中的门店 |
| `pulse-glow` | 脉冲光晕（2s） | 实时预警指示器 |
| `shimmer-border` | 顶部扫光边框 | 数据刷新中的卡片 |

---

## 六、按钮与控件

### 6.1 按钮变体

| Class | 样式 | 场景 |
|-------|------|------|
| `btn-primary` | 蓝色渐变 + 阴影 | 主操作（导出、保存） |
| `btn-glass` | 半透明蓝底 + 边框 | 次要操作、图表交互 |
| `btn-ghost` | 透明底 + 文字 | 取消、关闭 |

### 6.2 筛选栏（B端标准）

```html
<div class="filter-bar">
  <div class="filter-section">
    <select class="filter-select">...</select>
    <input class="filter-search" placeholder="搜索..." />
  </div>
  <div class="filter-divider"></div>
  <div class="filter-actions">
    <button class="filter-btn-primary">导出</button>
    <button class="filter-btn-secondary">重置</button>
  </div>
</div>
```

**规范**：
- 所有筛选控件高度统一 32px
- 左侧筛选区 `filter-section`，右侧操作区 `filter-actions`，中间竖线 `filter-divider` 物理隔离
- `filter-select` 最小宽度 120px，字号 12px
- `filter-search` 搜索框含放大镜图标

### 6.3 标签 Badge

| Class | 样式 | 场景 |
|-------|------|------|
| `tag-ai` | 蓝底 AI 标签 | "AI 诊断"标记 |
| 自定义 `rounded-full px-2 py-0.5 text-xs` + 语义色 | 状态标签 | 预警等级、门店状态 |

---

## 七、预警语义体系（本系统独有）

### 7.1 指数基线

- **基线值 = 100**，代表门店/商场客流与历史同期持平
- 指数 > 100：客流好于历史同期
- 指数 < 100：客流差于历史同期
- 指数用 `text-number` 展示，整数值，不带百分号

### 7.2 背离度分级

| 背离度范围 | 语义 | 颜色 | 图标建议 |
|-----------|------|------|---------|
| ≥ +15 | 超额捕获 | 🔵 info | `TrendingUp` |
| −15 ~ +15 | 正常跟随 | 🟢 绿 | `CheckCircle2` |
| −30 ~ −15 | 转化不足（警告） | 🟡 黄 | `AlertCircle` |
| < −30 | 转化不足（严重） | 🔴 红 | `AlertTriangle` |

### 7.3 指数区间预警

| 门店指数 | 商场指数 | 语义 | 颜色 |
|---------|---------|------|------|
| ≥ 100 | ≥ 100 | 双高（明星） | 🟢 |
| < 80 | ≥ 100 | 商场好但门店差（现金牛/待激活） | 🟡 |
| ≥ 100 | < 80 | 商场差但门店好（超额捕获） | 🔵 |
| < 80 | < 80 | 双低（问题门店） | 🔴 |

### 7.4 波动性标注

| 波动系数 | 语义 | 视觉 |
|---------|------|------|
| < 0.15 | 稳定 | 无标注 |
| 0.15 ~ 0.30 | 波动 | 轻微脉冲 |
| > 0.30 | 剧烈波动 | 呼吸动画 |

---

## 八、ECharts 图表规范（核心）

> **强制规则**：所有图表**必须使用 `BaseChart` 组件**，禁止直接 `echarts.init`。图表数据由业务层传入，样式由 `mergeChartOption` 自动应用全局主题。

### 8.1 通用规范

| 属性 | 规范值 | 说明 |
|------|--------|------|
| 背景 | `transparent` | 图表背景透明，继承卡片底色 |
| 字体 | `PingFang SC` | 与全局一致 |
| 字号 | 轴标签 10px / 标题 12px | 统一较小字号，信息密度优先 |
| 网格 | `containLabel: true` | 防标签截断【强制】 |
| 网格内边距 | top: 36, left: 44, right: 16, bottom: 32 | 留白给标题和图例 |
| Tooltip | 圆角 8px + 阴影 | 深色底黑字（暗色模式）/ 白底黑字（亮色） |
| 图例 | 可滚动 `type: 'scroll'` | 图例项过多时自动滚动 |
| 坐标轴线 | 类目轴有浅线 / 数值轴无线 | 简洁风格 |
| 分割线 | 虚线 `dashed` | 数值轴 Y 方向 |

### 8.2 图表高度规范

| 级别 | 高度 | 场景 |
|------|------|------|
| `xs` | 80px | 迷你趋势图（sparkline） |
| `sm` | 120px | 小图：品牌分布、预警分布 |
| `md` | 160px | 中图：详情面板内图表 |
| `lg` | 200px | 大图：趋势图、饼图、波士顿矩阵 |
| `xl` | 280px | 超大图：热力图、复杂组合 |

### 8.3 图表容器布局

```html
<!-- 2 列布局（默认） -->
<div class="chart-row">
  <div class="chart-card">
    <div class="chart-title">客流趋势</div>
    <BaseChart option={...} height={180} />
  </div>
  <div class="chart-card">
    <div class="chart-title">预警分布</div>
    <BaseChart option={...} height={180} />
  </div>
</div>

<!-- 单列全宽 -->
<div class="chart-row">
  <div class="chart-card chart-card-full">
    <BaseChart option={...} height={280} />
  </div>
</div>

<!-- 窄面板单列 -->
<div class="chart-row-single">
  <div class="chart-card">...</div>
</div>
```

### 8.4 图表类型规范

#### 8.4.1 折线图（客流趋势、指数变化）

**使用 `createLine` 工厂（推荐）** 或自定义：

```typescript
// 标准折线图：多序列对比
const option = {
  xAxis: { type: 'category', data: dates },
  yAxis: { type: 'value', show: false },
  series: [
    { type: 'line', data: [...], smooth: true, symbol: 'none',
      lineStyle: { color: '#0EA5E9', width: 1.5 },
      areaStyle: { /* 渐变填充 */ } },
    { type: 'line', data: [...], smooth: true, symbol: 'none',
      lineStyle: { color: '#8B5CF6', width: 1.5 } },
  ],
};
```

**诊断场景规范**：
- 基线（100 值）用**虚线**标注：`markLine: { yAxis: 100, lineStyle: { type: 'dashed', color: '#64748B' } }`
- YoY/MoM 对比使用双色曲线叠加
- 异常区间用 `markArea` 标注浅红色背景

#### 8.4.2 散点图（波士顿矩阵）

**核心诊断图表，必须严格遵循**：

```typescript
const bostonMatrixOption = {
  xAxis: {
    type: 'value',
    name: '商场客流指数',
    nameLocation: 'center',
    nameGap: 30,
    min: 0, max: 200,
    axisLine: { lineStyle: { color: '#94A3B8' } },
  },
  yAxis: {
    type: 'value',
    name: '门店客流指数',
    nameLocation: 'center',
    nameGap: 40,
    min: 0, max: 200,
    axisLine: { lineStyle: { color: '#94A3B8' } },
  },
  series: [{
    type: 'scatter',
    data: scatterData,  // [[x, y, storeName, ...], ...]
    symbolSize: (val) => Math.max(6, Math.min(24, val[2] / 10)),  // 气泡大小=客流值
    itemStyle: { opacity: 0.7 },
    color: '#0EA5E9',
  }],
  // 四象限分隔线
  markLine: {
    silent: true,
    symbol: 'none',
    lineStyle: { type: 'dashed', color: 'rgba(148,163,184,0.4)', width: 1 },
    data: [
      { xAxis: 100, label: { formatter: '商场基线', position: 'start' } },
      { yAxis: 100, label: { formatter: '门店基线', position: 'start' } },
    ],
  },
  // 四象限标签
  graphic: [
    { type: 'text', left: '75%', top: '15%', style: { text: '⭐ 明星', fill: '#10B981', fontSize: 10 } },
    { type: 'text', left: '80%', top: '80%', style: { text: '💰 现金牛', fill: '#F59E0B', fontSize: 10 } },
    { type: 'text', left: '10%', top: '15%', style: { text: '❓ 待转化', fill: '#6366F1', fontSize: 10 } },
    { type: 'text', left: '10%', top: '80%', style: { text: '⚠️ 问题', fill: '#EF4444', fontSize: 10 } },
  ],
};
```

**交互规范**：点击散点 → 弹出门店详情侧边栏或跳转详情页。

#### 8.4.3 柱状图（预警分布、品牌比较、排行）

使用 `createVerticalBar` / `createHorizontalBar` 工厂：

- 纵向柱状图：`barMaxWidth: 16`，圆角顶 4px，默认降序
- 横向柱状图：Y 轴反向 `inverse: true`，数值大在上
- 预警柱状图用语义色：严重红、警告黄、正常绿

#### 8.4.4 环形饼图（占比分布）

使用 `createDoughnut` 工厂：

```typescript
createDoughnut({
  data: [
    { name: '严重', value: 23, color: '#EF4444' },
    { name: '警告', value: 156, color: '#F59E0B' },
    { name: '正常', value: 9821, color: '#10B981' },
  ],
  showLegend: true,
});
```

#### 8.4.5 雷达图（波动性对比）

```typescript
const radarOption = {
  radar: {
    indicator: [
      { name: '工作日波动', max: 1 },
      { name: '周末波动', max: 1 },
      { name: '节假日波动', max: 1 },
      { name: 'YoY波动', max: 1 },
      { name: 'MoM波动', max: 1 },
    ],
    center: ['50%', '55%'],
    radius: '65%',
  },
  series: [{
    type: 'radar',
    data: [
      { value: [0.2, 0.3, 0.5, 0.4, 0.3], name: '门店波动', areaStyle: { color: 'rgba(14,165,233,0.15)' } },
      { value: [0.3, 0.4, 0.6, 0.5, 0.4], name: '商场波动', areaStyle: { color: 'rgba(139,92,246,0.1)' } },
      { value: [0.25, 0.35, 0.55, 0.45, 0.35], name: '商圈均值', lineStyle: { type: 'dashed' } },
    ],
  }],
};
```

#### 8.4.6 地图（预警地理分布）

使用 ECharts 地图 + 中国 GeoJSON：

```typescript
const mapOption = {
  series: [{
    type: 'map',
    map: 'china',
    roam: true,
    label: { show: false },
    data: cityAlertData,  // [{ name: '成都', value: 23 }, ...]
    visualMap: {
      min: 0, max: 100,
      inRange: { color: ['#10B981', '#F59E0B', '#EF4444'] },
    },
  }],
};
```

#### 8.4.7 双 Y 轴对比图（门店 vs 商场指数叠加）

```typescript
const dualAxisOption = {
  xAxis: { type: 'category', data: dates },
  yAxis: [
    { type: 'value', name: '指数' },
    { type: 'value', name: '背离度', splitLine: { show: false } },
  ],
  series: [
    { name: '商场指数', type: 'line', data: mallIndex, color: '#14B8A6' },
    { name: '门店指数', type: 'line', data: storeIndex, color: '#0EA5E9', areaStyle: { /* 渐变 */ } },
    { name: '背离度', type: 'bar', yAxisIndex: 1, data: deviation,
      itemStyle: { color: (params) => params.value > 0 ? '#10B981' : '#EF4444' } },
  ],
};
```

### 8.5 图表交互规范

| 交互 | 规范 |
|------|------|
| Tooltip | 全部图表默认开启，`trigger: 'axis'` (折线/柱状) / `trigger: 'item'` (饼图/散点) |
| 缩放 | 散点图、地图启用 `roam` |
| 图例 | 默认显示，多系列可滚动 |
| 下钻 | 散点图点击 → 门店详情 / 地图点击 → 城市列表 |
| 导出 | 每个图表卡片右上角可选导出 PNG |

### 8.6 性能规范

| 场景 | 数据量 | 策略 |
|------|--------|------|
| 散点图 | < 10000 点 | 直接渲染，`large: true` |
| 散点图 | > 10000 点 | 使用 `large: true` + `largeThreshold: 2000` |
| 折线图多序列 | < 10 条线 | 直接渲染 |
| 地图 | 全国 300+ 城市 | 降维至省级显示，点击下钻城市 |
| 定时刷新 | 60s 间隔 | 使用 `setOption` 的 `notMerge: false` 增量更新 |

---

## 九、数据格式化规范

| 数据类型 | 格式 | 示例 |
|---------|------|------|
| 客流量（大数） | `formatNum()` → 中文单位 | `132,800` → `13.3万` |
| 指数值 | 整数，无单位 | `105`、`87` |
| 背离度 | 带正负号整数 | `+12`、`-28` |
| 百分比 | 保留 1 位小数 + % | `12.5%`、`-3.2%` |
| 金额 | `formatCurrency()` + ¥ | `¥12.5万` |
| 变化率 | 带正负号 + 箭头图标 | `↑ 5.2%`、`↓ 3.1%` |
| 日期（短） | `MM/DD` | `05/12` |
| 日期（长） | `YYYY-MM-DD` | `2026-05-12` |

---

## 十、空状态 & 加载态

| 状态 | 视觉 | 规范 |
|------|------|------|
| 加载中 | 骨架屏（`animate-pulse`）+ 半透明占位块 | 图表区显示灰色占位矩形 |
| 无数据 | 居中图标 + "暂无数据" 文字 | 使用 `text-theme-muted` |
| 数据不足 | "数据不足，至少需要 N 天数据" | 诊断中心图表，样本量 < 30 天时触发 |
| 错误 | 红色提示 + 重试按钮 | API 请求失败 |

---

## 十一、响应式断点

| 断点 | 策略 |
|------|------|
| > 1440px | 双列图表 + 侧边栏展开 |
| 1024 ~ 1440px | 双列图表 + 侧边栏折叠 |
| 768 ~ 1024px | 单列图表 `chart-row-single` |
| < 768px | 移动端适配（后续迭代） |

---

## 十二、交互微动效

| 动效 | 属性 | 场景 |
|------|------|------|
| 卡片悬浮 | `translateY(-4px)` + 顶部光线 | 所有可交互卡片 |
| 按钮点击 | `scale(0.97)` 瞬间回弹 | 操作按钮 |
| 侧边栏伸缩 | `width` 过渡 300ms | 侧边栏折叠/展开 |
| 抽屉滑入 | `slideInRight` 400ms | 门店详情抽屉 |
| 数值变化 | CSS `transition` 数字颜色渐变 | 实时数据刷新 |
| 严重预警呼吸 | `breathe-danger` 2s 循环 | 严重预警中的门店行/卡片 |

---

## 十三、开发约束

1. **禁止硬编码颜色**：使用 CSS 变量或 Tailwind 语义 class
2. **禁止自定义字号**：使用 `text-l1` ~ `text-l5` 五级体系
3. **图表必须走 BaseChart**：禁止直接 `echarts.init`
4. **图表必须走 mergeChartOption**：自动应用全局主题和防截断规则
5. **筛选栏必须用 filter-bar 体系**：禁止自定义筛选控件样式
6. **数字必须用 text-number**：确保等宽对齐
7. **客流用指数不用绝对值**：跨门店/跨商圈对比时只用指数
8. **有异常必标注**：图表中指数跌破基线、背离度转负，必须视觉高亮

---

## 十四、规范更新日志

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2026-05-12 | v1.0 | 初始版本，涵盖色彩/字体/卡片/ECharts 图表/预警语义/交互 |

---

_开发过程中发现规范不足，直接在对应章节下方追加。_

---

## 五、图标规范

### 5.1 图标尺寸与文字对齐

所有 lucide-react / @icon-park/react 图标**必须显式声明尺寸**，禁止依赖父容器继承。

| 相邻文字 | Tailwind 类 | 实际尺寸 | 适用场景 |
|---|---|---|---|
| `text-xs`（12px）| `w-3 h-3` | 12×12px | 表格操作列、Tag、小按钮、TreeView 节点 |
| `text-sm`（14px）| `w-3.5 h-3.5` | 14×14px | 导航菜单、按钮、表头、Drawer 操作区 |
| `text-base`（16px）| `w-4 h-4` | 16×16px | 页面标题旁、大按钮 |
| 独立展示 | `w-12 h-12` 或更大 | 48px+ | 空状态、缺省页占位图标 |

### 5.2 组件内图标约定

| 组件 | 图标位置 | 正确尺寸 |
|---|---|---|
| TreeView | 节点前图标（TYPE_ICONS、Chevron）| `w-3 h-3`（配合 `text-xs`）|
| Select | 下拉箭头（DownOne）| `w-3.5 h-3.5`（配合 `text-sm`）|
| FilterBar | 搜索图标（Search）| `w-3.5 h-3.5` |
| FilterBar | 高级筛选图标（Filter）| `w-3.5 h-3.5` |
| FilterBar | 清空按钮（Close）| `w-3 h-3` |
| App.tsx 侧边栏 | 导航图标 | `w-3.5 h-3.5`（配合 `text-sm`）|
| Tabs | 标签页图标 | 由 Tabs 组件按 `size` 自动注入 |

### 5.3 Tabs 组件图标处理规则

Tabs 组件接收到 `icon` 属性后，**必须通过 `React.cloneElement` 注入尺寸 className**，不允许直接渲染无尺寸的图标。

- `size="sm"` → 注入 `w-3 h-3`
- `size="md"` → 注入 `w-3.5 h-3.5`
- `size="lg"` → 注入 `w-4 h-4`

### 5.4 代码规范

- lucide-react 图标：``
- @icon-park/react 图标：通过 `icon-element` prop 或 `className` 控制
- **禁止**在 JSX 中直接使用 `` 不带 `className` 尺寸
- 传入 Tabs / Select 等组件的 `icon`，必须在传入前加好尺寸（或由组件自动注入）

