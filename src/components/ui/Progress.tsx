import React from 'react';

interface ProgressProps {
  value?: number;         // 0 ~ 100
  label?: string;
  showInfo?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'ai';
  size?: 'sm' | 'md' | 'lg';
  type?: 'line' | 'circle';
  striped?: boolean;
  animated?: boolean;
  className?: string;
}

const variantColor = {
  default: 'bg-[var(--ai-blue-500)]',
  success: 'bg-[var(--func-success)]',
  warning: 'bg-[var(--func-warning)]',
  danger: 'bg-[var(--func-danger)]',
  ai: 'bg-gradient-to-r from-[var(--ai-blue-500)] to-[var(--ai-blue-400)]',
};

const variantText = {
  default: 'text-[var(--ai-blue-400)]',
  success: 'text-[var(--func-success)]',
  warning: 'text-[var(--func-warning)]',
  danger: 'text-[var(--func-danger)]',
  ai: 'text-[var(--ai-blue-400)]',
};

const trackH = { sm: 'h-1', md: 'h-2', lg: 'h-3' };

export const Progress: React.FC<ProgressProps> = ({
  value = 0,
  label,
  showInfo = true,
  variant = 'default',
  size = 'md',
  type = 'line',
  striped = false,
  animated = false,
  className = '',
}) => {
  const pct = Math.min(100, Math.max(0, value));

  if (type === 'circle') {
    const r = 40;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    const colorStroke = {
      default: 'var(--ai-blue-500)',
      success: 'var(--func-success)',
      warning: 'var(--func-warning)',
      danger: 'var(--func-danger)',
      ai: 'var(--ai-blue-400)',
    }[variant];

    return (
      <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
        {label && <span className="text-xs text-[var(--text-muted)]">{label}</span>}
        <div className="relative w-24 h-24">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              cx="50" cy="50" r={r}
              fill="none"
              stroke="var(--border-subtle)"
              strokeWidth="8"
            />
            <circle
              cx="50" cy="50" r={r}
              fill="none"
              stroke={colorStroke}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              className="transition-all duration-500"
            />
          </svg>
          {showInfo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-bold ${variantText[variant]}`}>{pct}%</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {(label || showInfo) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-[var(--text-muted)]">{label}</span>}
          {showInfo && <span className={`text-xs font-medium ${variantText[variant]}`}>{pct}%</span>}
        </div>
      )}
      <div className={`w-full rounded-full bg-[var(--border-subtle)] overflow-hidden ${trackH[size]}`}>
        <div
          className={`
            h-full rounded-full transition-all duration-500
            ${variantColor[variant]}
            ${striped ? 'bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.15)_0,rgba(255,255,255,0.15)_10px,transparent_10px,transparent_20px)]' : ''}
            ${animated ? 'animate-pulse' : ''}
          `}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
