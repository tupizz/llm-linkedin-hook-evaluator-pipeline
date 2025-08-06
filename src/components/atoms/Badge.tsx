import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'openai' | 'anthropic';
  size?: 'sm' | 'md';
  className?: string;
}

const variantClasses = {
  primary: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  secondary: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
  openai: 'bg-green-500/20 text-green-400',
  anthropic: 'bg-purple-500/20 text-purple-400',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2 py-1 text-sm',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'sm',
  className = '',
}) => {
  const badgeClasses = `
    inline-flex items-center rounded-full font-medium
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${className}
  `.trim();

  return (
    <span className={badgeClasses}>
      {children}
    </span>
  );
};