import React from 'react';

interface MetricCardProps {
  value: string | number;
  label: string;
  color?: 'emerald' | 'blue' | 'purple' | 'amber';
  className?: string;
}

const colorClasses = {
  emerald: 'text-emerald-400',
  blue: 'text-blue-400',
  purple: 'text-purple-400',
  amber: 'text-amber-400',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  value,
  label,
  color = 'blue',
  className = '',
}) => {
  return (
    <div className={`text-center p-3 bg-slate-700/30 rounded-lg ${className}`}>
      <div className={`font-semibold ${colorClasses[color]}`}>{value}</div>
      <div className="text-slate-400 text-xs">{label}</div>
    </div>
  );
};