/**
 * 数字分级表达规范
 *  0-999            → 无单位，0 位小数    例: 86 人、452 次
 *  1,000-999,999    → K（千），2 位小数  例: 12.34K
 *  1,000,000-999,999,999 → M（百万），2 位小数 例: 5.63M
 *  1,000,000,000+   → B（十亿），2 位小数 例: 1.23B
 */
export function formatNumber(value: number | undefined | null): string {
  if (value == null || isNaN(value)) return '--'
  const abs = Math.abs(value)
  if (abs < 1_000) return String(Math.round(value))
  if (abs < 1_000_000) return (value / 1_000).toFixed(2) + 'K'
  if (abs < 1_000_000_000) return (value / 1_000_000).toFixed(2) + 'M'
  return (value / 1_000_000_000).toFixed(2) + 'B'
}

/**
 * 格式化%进店率
 */
export function formatRate(numerator: number, denominator: number): string {
  if (!denominator) return '0%'
  return (numerator / denominator * 100).toFixed(1) + '%'
}
