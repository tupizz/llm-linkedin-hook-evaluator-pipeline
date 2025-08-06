import React from 'react';
import { ChevronRight, LucideIcon } from 'lucide-react';

interface NavigationButtonProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onClick: () => void;
  iconColor?: string;
}

export const NavigationButton: React.FC<NavigationButtonProps> = ({
  icon: Icon,
  title,
  subtitle,
  onClick,
  iconColor = 'text-blue-400',
}) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between p-3 rounded-lg border border-slate-600/30 hover:border-slate-500/50 hover:bg-slate-700/30 transition-all text-left group w-full"
    >
      <div className="flex items-center space-x-3">
        <Icon size={16} className={iconColor} />
        <div>
          <span className="text-white font-medium text-sm">{title}</span>
          <p className="text-slate-400 text-xs">{subtitle}</p>
        </div>
      </div>
      <ChevronRight
        size={16}
        className="text-slate-400 group-hover:text-white transition-colors"
      />
    </button>
  );
};