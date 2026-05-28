// ECharts 统一主题配置（明暗双模式）
// 所有图表共用此配置，确保视觉一致
// ═══════════════════════════════════════════════════════════════

/* ─── 颜色系统 ─── */
export const COLORS = {
  primary: '#0EA5E9',
  purple: '#8B5CF6',
  cyan: '#22D3EE',
  pink: '#EC4899',
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
  indigo: '#6366F1',
  teal: '#14B8A6',
  orange: '#F97316',
} as const;

export const CHART_COLORS = Object.values(COLORS);

/* ═══════════════════════════════════════════════════════════════
   明暗双主题完整配置（新增）
   ═══════════════════════════════════════════════════════════════ */

/** 标准企业色（明暗模式共用，干净高级） */
export const STANDARD_COLORS = [
  '#165DFF', '#00B42A', '#FF7D00', '#F53F3F', '#86909C', '#0FC6C2',
];

/** 深色模式完整主题 */
export const DARK_THEME = {
  color: CHART_COLORS,
  backgroundColor: 'transparent' as const,
  textStyle: {
    fontFamily: 'PingFang SC, Inter, system-ui, sans-serif',
    fontSize: 11,
    color: '#94A3B8',
    textOutline: 'none',  // ⚠️ 关键：禁用文字描边
  },
  title: {
    textStyle: { color: '#F1F5F9', fontSize: 12, fontWeight: 600 },
    subtextStyle: { color: '#64748B', fontSize: 10 },
  },
  grid: {
    top: 36,
    left: 44,
    right: 16,
    bottom: 32,
    containLabel: true,          // 防标签截断【核心】
  },
  tooltip: {
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderColor: 'rgba(148, 163, 184, 0.15)',
    textStyle: { color: '#F1F5F9', fontSize: 11 },
    extraCssText: 'border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); padding: 8px 12px;',
  },
  legend: {
    textStyle: { color: '#94A3B8', fontSize: 10 },
    itemWidth: 10,
    itemHeight: 6,
    type: 'scroll' as const,
    pageIconColor: '#86909C',
  },
  xAxis: {
    axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.15)' } },
    splitLine: { show: false },
    axisLabel: { color: '#64748B', fontSize: 10, textOutline: 'none' },
    axisTick: { show: false },
  },
  yAxis: {
    axisLine: { show: false },
    splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.08)', type: 'dashed' as const } },
    axisLabel: { color: '#64748B', fontSize: 10, textOutline: 'none' },
    axisTick: { show: false },
  },
};

/** 浅色模式完整主题 */
export const LIGHT_THEME = {
  color: STANDARD_COLORS,
  backgroundColor: 'transparent' as const,
  textStyle: {
    fontFamily: 'PingFang SC, Inter, system-ui, sans-serif',
    fontSize: 11,
    color: '#4E5969',
    textOutline: 'none',  // ⚠️ 关键：禁用文字描边
  },
  title: {
    textStyle: { color: '#1D2129', fontSize: 12, fontWeight: 600 },
    subtextStyle: { color: '#86909C', fontSize: 10 },
  },
  grid: {
    top: 36,
    left: 44,
    right: 16,
    bottom: 32,
    containLabel: true,          // 防标签截断【核心】
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderColor: '#E5E6EB',
    textStyle: { color: '#1D2129', fontSize: 11 },
    extraCssText: 'border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 8px 12px;',
  },
  legend: {
    textStyle: { color: '#4E5969', fontSize: 10 },
    itemWidth: 10,
    itemHeight: 6,
    type: 'scroll' as const,
    pageIconColor: '#86909C',
  },
  xAxis: {
    axisLine: { lineStyle: { color: '#E5E6EB' } },
    splitLine: { show: false },
    axisLabel: { color: '#4E5969', fontSize: 10, textOutline: 'none' },
    axisTick: { show: false },
  },
  yAxis: {
    axisLine: { show: false },
    splitLine: { lineStyle: { color: '#E5E6EB', type: 'dashed' as const } },
    axisLabel: { color: '#4E5969', fontSize: 10, textOutline: 'none' },
    axisTick: { show: false },
  },
};

/** 自动获取当前完整主题 */
export function getChartTheme(isDark: boolean = true) {
  return isDark ? DARK_THEME : LIGHT_THEME;
}

/* ─── 共享主题基底（向后兼容：暗色基线）─── */
export const themeBase = DARK_THEME;

/* ─── 浅色主题基底（新增）─── */
export const lightThemeBase = LIGHT_THEME;

/* ─── 获取主题基底（自动切换明暗）─── */
export function getThemeBase(isDark: boolean = true) {
  return isDark ? themeBase : lightThemeBase;
}

/* ─── 坐标轴样式 ─── */
export const axisStyle = {
  categoryAxis: {
    axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.15)' } },
    axisTick: { show: false },
    axisLabel: { color: '#64748B', fontSize: 10 },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#64748B', fontSize: 10 },
    splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.08)', type: 'dashed' as const } },
  },
} as const;

/* ─── 统一图表高度规范（px）─── */
export const CHART_HEIGHTS = {
  xs: 80,      // 迷你图：交通信息、性别分布
  sm: 120,     // 小图：批次分布、游逛时长
  md: 160,     // 中图：详情面板内图表
  lg: 200,     // 大图：主趋势图、饼图、年龄段
  xl: 280,     // 超大图：热力图、复杂组合
} as const;

/* ═══════════════════════════════════════════════════════════════
   深度合并：业务配置 + 全局主题（明暗双模式）
   ═══════════════════════════════════════════════════════════════ */

export function mergeChartOption(
  businessOption: Record<string, any>,
  isDark?: boolean,  // 可选，不传则使用暗色主题（兼容旧代码）
) {
  const base = isDark === false ? LIGHT_THEME : DARK_THEME;

  // 深度合并数组型 xAxis / yAxis
  const mergeAxis = (themeAxis: any, customAxis: any) => {
    if (!customAxis) return themeAxis;
    if (Array.isArray(customAxis)) {
      return customAxis.map((item: any) => ({ ...themeAxis, ...item }));
    }
    return { ...themeAxis, ...customAxis };
  };

  return {
    ...base,
    ...businessOption,
    // 深度合并，防止业务配置意外覆盖全局防重叠规则
    grid: { ...base.grid, ...businessOption.grid },
    legend: businessOption.legend === false ? false : { ...base.legend, ...businessOption.legend },
    tooltip: { ...base.tooltip, ...businessOption.tooltip },
    textStyle: { ...base.textStyle, ...businessOption.textStyle },
    title: businessOption.title ? { ...base.title, ...businessOption.title } : base.title,
    xAxis: mergeAxis(base.xAxis, businessOption.xAxis),
    yAxis: mergeAxis(base.yAxis, businessOption.yAxis),
  };
}

/* ─── 自动应用坐标轴样式 ─── */
export function applyAxisStyle(option: Record<string, any>, xType: 'category' | 'value' = 'category', yType: 'category' | 'value' = 'value') {
  return {
    ...option,
    xAxis: {
      ...(xType === 'category' ? axisStyle.categoryAxis : axisStyle.valueAxis),
      ...option.xAxis,
    },
    yAxis: {
      ...(yType === 'category' ? axisStyle.categoryAxis : axisStyle.valueAxis),
      ...option.yAxis,
    },
  };
}

/* ─── 圆角工具提示 ─── */
export const tooltipItem = DARK_THEME.tooltip;

/* ─── 工具函数 ─── */
export function formatNum(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B'
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(2) + 'K'
  return String(Math.round(n))
}

export function formatCurrency(n: number): string {
  if (n >= 10000) return `¥${(n / 10000).toFixed(1)}万`;
  return `¥${n.toLocaleString()}`;
}

/* ─── 常用图表类型工厂 ─── */
export function lineSeries(name: string, data: number[], color: string) {
  return {
    name,
    type: 'line' as const,
    data,
    smooth: true,
    symbol: 'none' as const,
    lineStyle: { width: 2, color },
    areaStyle: {
      color: {
        type: 'linear' as const,
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: color.replace(')', ',0.18)').replace('rgb', 'rgba') },
          { offset: 1, color: color.replace(')', ',0.01)').replace('rgb', 'rgba') },
        ],
      },
    },
  };
}

export function barSeries(name: string, data: any[], color: string) {
  return {
    name,
    type: 'bar' as const,
    data,
    barMaxWidth: 16,
    itemStyle: { color, borderRadius: [3, 3, 0, 0] },
  };
}

export function pieData(values: { name: string; value: number; color: string }[]) {
  return values.map((v) => ({
    ...v,
    itemStyle: { color: v.color },
  }));
}

/* ─── 标准化图表工厂（AI只准填数据，不准改样式）─── */

interface BarItem { value: number; color: string; }
type PieItem = { name: string; value: number; color: string; };
type LineSeries = { data: number[]; color: string; };

/** 纵向柱状图 — 年龄/性别/品牌/等级分布，默认自动降序 */
export function createVerticalBar(chartData: { categories: string[]; bars: BarItem[]; height?: number; gridRight?: number; sortDesc?: boolean; showLabel?: boolean; isDark?: boolean }) {
  const { gridRight = 16, sortDesc = true, showLabel = true, isDark = true } = chartData;
  let categories = chartData.categories;
  let bars = chartData.bars;
  if (sortDesc) {
    const pairs = categories.map((c, i) => ({ cat: c, bar: bars[i] }));
    pairs.sort((a, b) => b.bar.value - a.bar.value);
    categories = pairs.map(p => p.cat);
    bars = pairs.map(p => p.bar);
  }
  const labelColor = isDark ? '#94A3B8' : '#4E5969';
  return {
    ...(isDark ? themeBase : lightThemeBase),
    tooltip: { trigger: 'axis' as const, ...tooltipItem },
    grid: { left: 50, right: gridRight, top: 20, bottom: 30 },
    xAxis: { type: 'category' as const, data: categories, axisLine: { lineStyle: { color: isDark ? 'rgba(148,163,184,0.2)' : '#E5E6EB' } }, axisLabel: { fontSize: 10, color: labelColor }, splitLine: { show: false } },
    yAxis: { type: 'value' as const, axisLine: { show: false }, axisLabel: { fontSize: 10, color: labelColor }, splitLine: { lineStyle: { color: isDark ? 'rgba(148,163,184,0.1)' : '#E5E6EB' } } },
    series: [{ type: 'bar' as const, barMaxWidth: 16, data: bars.map(d => ({ value: d.value, itemStyle: { color: d.color, borderRadius: [4, 4, 0, 0] } })), label: showLabel ? { show: true, position: 'top', fontSize: 10, color: labelColor } : undefined }],
  };
}

/** 横向柱状图 — 交通信息等，默认自动降序（最多在上） */
export function createHorizontalBar(chartData: { categories: string[]; bars: BarItem[]; sortDesc?: boolean; isDark?: boolean }) {
  const { sortDesc = true, isDark = true } = chartData;
  let categories = chartData.categories;
  let bars = chartData.bars;
  if (sortDesc) {
    const pairs = categories.map((c, i) => ({ cat: c, bar: bars[i] }));
    pairs.sort((a, b) => b.bar.value - a.bar.value);
    categories = pairs.map(p => p.cat);
    bars = pairs.map(p => p.bar);
  }
  const labelColor = isDark ? '#94A3B8' : '#4E5969';
  return {
    ...(isDark ? themeBase : lightThemeBase),
    tooltip: { trigger: 'axis' as const, ...tooltipItem },
    grid: { left: 70, right: 60, top: 10, bottom: 10 },
    xAxis: { type: 'value' as const, show: false },
    yAxis: { type: 'category' as const, data: categories, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontSize: 11, color: labelColor }, inverse: true },
    series: [{ type: 'bar' as const, barWidth: 16, data: bars.map(d => ({ value: d.value, itemStyle: { color: d.color, borderRadius: [0, 4, 4, 0] } })), label: { show: true, position: 'right', fontSize: 11, color: labelColor } }],
  };
}

/** 环形饼图 — 收入/等级分布 */
export function createDoughnut(chartData: { data: PieItem[]; showLegend?: boolean; centerX?: string; showLabel?: boolean; isDark?: boolean }) {
  const { showLegend = false, centerX = '50%', showLabel = false, isDark = true } = chartData;
  const labelColor = isDark ? '#94A3B8' : '#4E5969';
  return {
    ...(isDark ? themeBase : lightThemeBase),
    tooltip: { trigger: 'item' as const, ...tooltipItem },
    legend: showLegend ? { orient: 'vertical' as const, right: 10, top: 'center', textStyle: { color: labelColor, fontSize: 10 }, itemWidth: 8, itemHeight: 8 } : { show: false },
    series: [{
      type: 'pie' as const, radius: ['50%', '75%'], center: [centerX, '50%'],
      label: showLabel ? { show: true, fontSize: 9, color: labelColor, formatter: '{b}\n{d}%' } : { show: false },
      data: chartData.data.map(d => ({ value: d.value, name: d.name, itemStyle: { color: d.color } })),
    }],
  };
}

/** 折线图 — 客单价月度趋势 */
export function createLine(chartData: { categories: string[]; series: LineSeries[]; isDark?: boolean }) {
  const { isDark = true } = chartData;
  const labelColor = isDark ? '#94A3B8' : '#4E5969';
  return {
    ...(isDark ? themeBase : lightThemeBase),
    tooltip: { trigger: 'axis' as const, ...tooltipItem },
    grid: { left: 4, right: 16, top: 4, bottom: 24 },
    xAxis: { type: 'category' as const, data: chartData.categories, axisLabel: { fontSize: 8, color: labelColor } },
    yAxis: { type: 'value' as const, show: false },
    series: chartData.series.map(s => ({
      type: 'line' as const, smooth: true, symbol: 'none' as const,
      lineStyle: { color: s.color, width: 1.5 }, data: s.data,
    })),
  };
}
