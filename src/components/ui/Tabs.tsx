import React, { useState, cloneElement, isValidElement } from 'react';

export interface TabItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
  content?: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultActiveKey?: string;
  activeKey?: string;
  onChange?: (key: string) => void;
  variant?: 'line' | 'card' | 'pill';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-5 py-2.5',
};

export const Tabs: React.FC<TabsProps> = ({
  items,
  defaultActiveKey,
  activeKey: controlledKey,
  onChange,
  variant = 'line',
  size = 'md',
  className = '',
}) => {
  const [internalKey, setInternalKey] = useState(defaultActiveKey ?? items[0]?.key);
  const activeKey = controlledKey ?? internalKey;

  const handleClick = (key: string, disabled?: boolean) => {
    if (disabled) return;
    setInternalKey(key);
    onChange?.(key);
  };

  const activeContent = items.find((t) => t.key === activeKey)?.content;

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Header */}
      <div
        className={`
          flex items-center gap-1
          ${variant === 'line' ? 'border-b border-[var(--border-subtle)]' : ''}
          ${variant === 'card' ? 'bg-[var(--bg-secondary)] p-1 rounded-xl' : ''}
          ${variant === 'pill' ? 'bg-[var(--bg-secondary)] p-1 rounded-full' : ''}
        `}
      >
        {items.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              type="button"
              disabled={tab.disabled}
              onClick={() => handleClick(tab.key, tab.disabled)}
              className={`
                relative inline-flex items-center gap-1.5 font-medium transition-all cursor-pointer
                ${sizeMap[size]}
                ${tab.disabled ? 'opacity-40 cursor-not-allowed' : ''}
                ${variant === 'line'
                  ? isActive
                    ? 'text-[var(--ai-blue-400)] border-b-2 border-[var(--ai-blue-400)] -mb-px'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  : ''
                }
                ${variant === 'card'
                  ? isActive
                    ? 'bg-[var(--bg-primary)] text-[var(--ai-blue-400)] rounded-lg shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] rounded-lg'
                  : ''
                }
                ${variant === 'pill'
                  ? isActive
                    ? 'bg-[var(--ai-blue-500)] text-white rounded-full shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] rounded-full'
                  : ''
                }
              `}
            >
              {tab.icon && isValidElement(tab.icon) && cloneElement(tab.icon as any, {
                className: `${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} ${(tab.icon.props as any)?.className || ''}`
              })}
              <span>{tab.label}</span>
              {tab.badge != null && (
                <span className={`
                  inline-flex items-center justify-center min-w-[16px] h-4 px-1
                  text-[10px] font-bold rounded-full
                  ${isActive && variant === 'pill' ? 'bg-white/30 text-white' : 'bg-[var(--func-danger)] text-white'}
                `}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeContent && (
        <div className="mt-4">
          {activeContent}
        </div>
      )}
    </div>
  );
};
