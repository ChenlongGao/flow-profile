import React, { useState, useRef, useEffect } from 'react';
import { Search, Close, DownOne, Filter } from '@icon-park/react';

/* ═══════════════════════════════════════════════════════════════
   B端后台筛选区规范组件
   适用范围：全项目所有列表页、报表页、数据看板筛选栏
   规范来源：B端后台筛选区完整版最终规范
   ═══════════════════════════════════════════════════════════════ */

/* ─── 类型定义 ─── */
export interface FilterOption {
  label: string;
  value: string | number;
}

export type TimeRange = 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

/* ─── 常量 ─── */
const TIME_BUTTONS: { key: TimeRange; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: 'yesterday', label: '昨日' },
  { key: 'last7', label: '近7天' },
  { key: 'last30', label: '近30天' },
  { key: 'thisMonth', label: '本月' },
  { key: 'lastMonth', label: '上月' },
  { key: 'thisYear', label: '本年' },
  { key: 'custom', label: '自定义' },
];

/* ═══════════════════════════════════════════════════════════════
   1. FilterBar — 筛选栏容器
   左侧：筛选条件区 | 右侧：功能操作区（物理隔离）
   ═══════════════════════════════════════════════════════════════ */

interface FilterBarProps {
  children: React.ReactNode;
  actions?: React.ReactNode;   // 右侧操作按钮组
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({ children, actions, className = '' }) => (
  <div className={`filter-bar ${className}`}>
    <div className="filter-section">
      {children}
    </div>
    {actions && (
      <>
        <div className="filter-divider" />
        <div className="filter-actions">
          {actions}
        </div>
      </>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   2. FilterSelect — 统一下拉选择器
   高度 32px，最小宽度 120px，自带清空
   ═══════════════════════════════════════════════════════════════ */

interface FilterSelectProps {
  value: string | number;
  options: FilterOption[];
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  value, options, onChange, placeholder = '全部', className = '', style,
}) => {
  const hasValue = value !== '' && value !== 0 && value !== '0';

  return (
    <div className={`relative inline-block ${className}`} style={{ minWidth: 120, ...style }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="filter-select"
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={String(opt.value)} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {hasValue && (
        <button
          onClick={() => onChange('')}
          className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
          title="清空"
        >
          <Close className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   3. SearchInput — 关键词搜索框
   固定宽度 240px，左侧搜索图标，右侧清空，回车触发，500ms防抖
   ═══════════════════════════════════════════════════════════════ */

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  className?: string;
  width?: number;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value, onChange, onSearch, placeholder = '请输入关键词搜索', className = '', width = 240,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (v: string) => {
    setLocalValue(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(v);
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (timerRef.current) clearTimeout(timerRef.current);
      onChange(localValue);
      onSearch?.(localValue);
    }
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className={`relative inline-block ${className}`} style={{ width }}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
      <input
        value={localValue}
        onChange={e => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="filter-search"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
        >
          <Close className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   4. TimeFilter — 快捷时间按钮组
   固定顺序：今日、昨日、近7天、近30天、本月、上月、本年、自定义
   ═══════════════════════════════════════════════════════════════ */

interface TimeFilterProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  onCustom?: () => void;  // 点击自定义时的回调
  className?: string;
}

export const TimeFilter: React.FC<TimeFilterProps> = ({ value, onChange, onCustom, className = '' }) => (
  <div className={`inline-flex items-center gap-2 ${className}`}>
    {TIME_BUTTONS.map(btn => (
      <button
        key={btn.key}
        onClick={() => {
          if (btn.key === 'custom') {
            onCustom?.();
          } else {
            onChange(btn.key);
          }
        }}
        className={`filter-time-btn ${value === btn.key ? 'active' : ''}`}
      >
        {btn.label}
      </button>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   5. AdvancedFilter — 高级筛选入口按钮
   ═══════════════════════════════════════════════════════════════ */

interface AdvancedFilterProps {
  open: boolean;
  onToggle: () => void;
  count?: number;  // 已选条件数量
  className?: string;
}

export const AdvancedFilter: React.FC<AdvancedFilterProps> = ({ open, onToggle, count = 0, className = '' }) => (
  <button
    onClick={onToggle}
    className={`filter-advanced-btn ${open ? 'active' : ''} ${className}`}
  >
    <Filter className="w-3.5 h-3.5" />
    <span>高级筛选</span>
    {count > 0 && <span className="filter-advanced-badge">{count}</span>}
    <DownOne className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
  </button>
);

/* ═══════════════════════════════════════════════════════════════
   6. ActionButton — 操作区按钮（刷新/导出/新建等）
   ═══════════════════════════════════════════════════════════════ */

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant = 'secondary', icon, children, className = '', ...props
}) => {
  const variantMap = {
    primary: 'filter-btn-primary',
    secondary: 'filter-btn-secondary',
    ghost: 'filter-btn-ghost',
    danger: 'filter-btn-danger',
  };

  return (
    <button className={`${variantMap[variant]} ${className}`} {...props}>
      {icon && <span className="w-3.5 h-3.5">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

/* ═══════════════════════════════════════════════════════════════
   7. FilterDivider — 筛选区与操作区之间的竖线分隔
   ═══════════════════════════════════════════════════════════════ */

export const FilterDivider: React.FC = () => (
  <div className="filter-divider" />
);
