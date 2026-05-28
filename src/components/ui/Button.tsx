import React from 'react';

export type ButtonVariant = 'primary' | 'glass' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  glass: 'btn-glass',
  ghost: 'bg-transparent border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--ai-blue-500)] hover:text-[var(--ai-blue-400)]',
  danger: 'bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] text-[var(--func-danger)] hover:bg-[rgba(239,68,68,0.25)]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium cursor-pointer transition-all ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
