import React, { useState, useRef, useEffect } from 'react';
import { DownOne, Check, Close, Search } from '@icon-park/react';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string | number | (string | number)[];
  onChange?: (value: string | number | (string | number)[]) => void;
  multiple?: boolean;
  clearable?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-7 text-xs px-2.5',
  md: 'h-9 text-sm px-3',
  lg: 'h-11 text-base px-4',
};

export const Select: React.FC<SelectProps> = ({
  label,
  placeholder = '请选择',
  options,
  value,
  onChange,
  multiple = false,
  clearable = false,
  searchable = false,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // normalize value
  const selected = multiple
    ? (Array.isArray(value) ? value : value != null ? [value] : [])
    : value;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isSelected = (v: string | number) =>
    multiple ? (selected as (string | number)[]).includes(v) : selected === v;

  const getLabel = () => {
    if (multiple) {
      const arr = selected as (string | number)[];
      if (!arr || arr.length === 0) return null;
      return options
        .filter((o) => arr.includes(o.value))
        .map((o) => o.label)
        .join(', ');
    } else {
      return options.find((o) => o.value === selected)?.label ?? null;
    }
  };

  const handleSelect = (opt: SelectOption) => {
    if (opt.disabled) return;
    if (multiple) {
      const arr = (selected as (string | number)[]) || [];
      const next = arr.includes(opt.value)
        ? arr.filter((v) => v !== opt.value)
        : [...arr, opt.value];
      onChange?.(next);
    } else {
      onChange?.(opt.value);
      setOpen(false);
      setSearch('');
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(multiple ? [] : ('' as any));
  };

  const filtered = searchable
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const displayLabel = getLabel();

  return (
    <div className={`w-full ${className}`} ref={ref}>
      {label && (
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((v) => !v)}
          className={`
            w-full flex items-center justify-between gap-2
            bg-[var(--bg-secondary)] border rounded-xl
            text-left transition-all cursor-pointer
            ${sizeMap[size]}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[var(--ai-blue-500)]'}
            ${open ? 'border-[var(--ai-blue-500)] ring-1 ring-[var(--ai-blue-500)]/30' : 'border-[var(--border-default)]'}
          `}
        >
          <span className={`flex-1 truncate ${displayLabel ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
            {displayLabel || placeholder}
          </span>
          <span className="flex items-center gap-1 flex-shrink-0">
            {clearable && displayLabel && (
              <Close
                className="w-3.5 h-3.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                onClick={handleClear}
              />
            )}
            <DownOne
              className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </span>
        </button>

        {open && (
          <div className="absolute z-50 w-full mt-1 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl shadow-xl overflow-hidden">
            {searchable && (
              <div className="p-2 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 px-2 py-1.5 bg-[var(--bg-primary)] rounded-lg">
                  <Search className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="搜索..."
                    className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>
            )}
            <div className="max-h-48 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-[var(--text-muted)]">暂无数据</div>
              ) : (
                filtered.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt)}
                    className={`
                      flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors
                      ${opt.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[var(--ai-blue-500)]/10'}
                      ${isSelected(opt.value) ? 'text-[var(--ai-blue-400)] bg-[var(--ai-blue-500)]/5' : 'text-[var(--text-primary)]'}
                    `}
                  >
                    <span>{opt.label}</span>
                    {isSelected(opt.value) && <Check className="w-3.5 h-3.5" />}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
