import React, { useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { mergeChartOption, CHART_HEIGHTS } from '../../config/echarts-theme';

interface BaseChartProps {
  option: Record<string, any>;
  height?: number | string;
  className?: string;
  renderer?: 'canvas' | 'svg';
  isDark?: boolean;  // 显式指定，不传则自动检测 data-theme
}

/**
 * 全项目统一图表组件
 *
 * 特性：
 * 1. 自动读取 data-theme 切换明暗主题
 * 2. 自动 merge 全局主题配置（防重叠/防截断）
 * 3. 业务代码只写数据和差异配置
 * 4. 响应式 ResizeObserver
 *
 * 使用规范：
 * - 所有图表必须用这个组件，禁止直接 import echarts.init
 * - 业务 option 只写数据、series、xAxis.data 等差异部分
 * - 不写 color、textStyle、grid、tooltip、legend 等全局样式
 */
export const BaseChart: React.FC<BaseChartProps> = ({
  option,
  height = CHART_HEIGHTS.lg,
  className = '',
  renderer = 'canvas',
  isDark: isDarkProp,
}) => {
  const chartRef = useRef<ReactECharts>(null);

  // 自动检测当前主题（从 data-theme 属性读取）
  const detectTheme = () => {
    const theme = document.documentElement.getAttribute('data-theme');
    return theme !== 'light';  // 默认 dark
  };

  const [isDark, setIsDark] = useState(() =>
    isDarkProp !== undefined ? isDarkProp : detectTheme()
  );

  // 监听 data-theme 变化
  useEffect(() => {
    if (isDarkProp !== undefined) return;  // 显式指定时不监听

    const observer = new MutationObserver(() => {
      setIsDark(detectTheme());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, [isDarkProp]);

  // 合并全局主题 + 业务配置
  const finalOption = mergeChartOption(option, isDark);

  // 响应式 resize
  useEffect(() => {
    const handleResize = () => {
      chartRef.current?.getEchartsInstance()?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  return (
    <ReactECharts
      ref={chartRef}
      option={finalOption}
      style={{ width: '100%', height: heightStyle }}
      opts={{ renderer }}
      notMerge={false}
      lazyUpdate={true}
    />
  );
};

export default BaseChart;
