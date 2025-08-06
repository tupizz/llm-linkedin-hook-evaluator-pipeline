import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'border' | 'glass';
  padding?: 'sm' | 'md' | 'lg' | 'none';
  id?: string;
}

const variantClasses = {
  default: 'bg-slate-800/50 backdrop-blur-sm border border-slate-700/50',
  gradient: 'bg-gradient-to-r from-emerald-500/10 to-blue-500/10 backdrop-blur-sm border border-emerald-500/30',
  border: 'bg-slate-800/30 backdrop-blur-sm border border-slate-600/30',
  glass: 'bg-slate-700/20 backdrop-blur-sm border border-slate-600/30',
};

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  id,
}) => {
  const cardClasses = `
    rounded-2xl shadow-xl transition-all duration-300
    ${variantClasses[variant]}
    ${paddingClasses[padding]}
    ${className}
  `.trim();

  return (
    <div id={id} className={cardClasses}>
      {children}
    </div>
  );
};