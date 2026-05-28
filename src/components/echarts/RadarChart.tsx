import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../../context/ThemeContext';

export const RadarChart: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const option = {
    backgroundColor: 'transparent',
    tooltip: {},
    legend: {
      data: ['深圳万象城', '广州天河城', '行业平均'],
      bottom: 0,
      textStyle: { color: isDark ? '#64748B' : '#94A3B8', fontSize: 11 },
      itemWidth: 12,
      itemHeight: 12,
    },
    radar: {
      indicator: [
        { name: '客流量', max: 100 },
        { name: '转化率', max: 100 },
        { name: '停留时长', max: 100 },
        { name: '复购率', max: 100 },
        { name: '客单价', max: 100 },
        { name: '满意度', max: 100 },
      ],
      center: ['50%', '48%'],
      radius: '60%',
      axisName: {
        color: isDark ? '#CBD5E1' : '#475569',
        fontSize: 11,
      },
      splitArea: {
        areaStyle: {
          color: isDark
            ? ['rgba(14,165,233,0.02)', 'rgba(14,165,233,0.05)', 'rgba(14,165,233,0.08)', 'rgba(14,165,233,0.11)']
            : ['rgba(14,165,233,0.02)', 'rgba(14,165,233,0.04)', 'rgba(14,165,233,0.06)', 'rgba(14,165,233,0.08)'],
        },
      },
      axisLine: { lineStyle: { color: isDark ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.3)' } },
      splitLine: { lineStyle: { color: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(148,163,184,0.2)' } },
    },
    series: [
      {
        name: '门店综合评估',
        type: 'radar',
        data: [
          {
            value: [95, 88, 82, 76, 90, 85],
            name: '深圳万象城',
            areaStyle: { color: 'rgba(14,165,233,0.2)' },
            lineStyle: { color: '#0EA5E9', width: 2 },
            itemStyle: { color: '#0EA5E9' },
          },
          {
            value: [78, 72, 85, 68, 75, 80],
            name: '广州天河城',
            areaStyle: { color: 'rgba(99,102,241,0.15)' },
            lineStyle: { color: '#6366F1', width: 2 },
            itemStyle: { color: '#6366F1' },
          },
          {
            value: [60, 65, 60, 55, 62, 65],
            name: '行业平均',
            lineStyle: { color: isDark ? '#475569' : '#94A3B8', width: 1, type: 'dashed' },
            itemStyle: { color: isDark ? '#475569' : '#94A3B8' },
            areaStyle: { color: 'transparent' },
          },
        ],
      },
    ],
  };

  return (
    <div className="card-level-1">
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">门店多维雷达评估</h3>
      <ReactECharts option={option} style={{ height: 340 }} opts={{ renderer: 'svg' }} />
    </div>
  );
};
