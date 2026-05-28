import React from 'react';

export type TagVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'ai';

interface TagProps {
  children: React.ReactNode;
  variant?: TagVariant;
  className?: string;
}

const tagStyles: Record<TagVariant, string> = {
  default: 'bg-[rgba(148,163,184,0.15)] text-[var(--text-secondary)] border-[rgba(148,163,184,0.2)]',
  success: 'bg-[rgba(16,185,129,0.15)] text-[var(--func-success)] border-[rgba(16,185,129,0.2)]',
  warning: 'bg-[rgba(245,158,11,0.15)] text-[var(--func-warning)] border-[rgba(245,158,11,0.2)]',
  danger: 'bg-[rgba(239,68,68,0.15)] text-[var(--func-danger)] border-[rgba(239,68,68,0.2)]',
  info: 'bg-[rgba(99,102,241,0.15)] text-[var(--func-info)] border-[rgba(99,102,241,0.2)]',
  ai: 'bg-[rgba(14,165,233,0.15)] text-[var(--ai-blue-400)] border-[rgba(56,189,248,0.2)]',
};

export const Tag: React.FC<TagProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full border ${tagStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
