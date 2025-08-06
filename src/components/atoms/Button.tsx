import { LucideIcon } from "lucide-react";
import React from "react";

interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "ghost"
    | "success"
    | "warning"
    | "danger";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  iconSize?: number;
  className?: string;
  title?: string;
}

const styles = {
  variant: {
    primary:
      "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700",
    secondary:
      "bg-slate-600/50 hover:bg-slate-500/50 text-slate-300 hover:text-white",
    ghost:
      "bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white",
    success:
      "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30",
    warning:
      "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30",
    danger:
      "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30",
  },
  size: {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3",
    lg: "px-6 py-4 font-semibold",
  },
};

export const Button: React.FC<ButtonProps> = ({
  onClick,
  disabled = false,
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconSize = 16,
  className = "",
  title,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={[
      "rounded-lg transition-all duration-200 flex items-center justify-center space-x-2",
      styles.variant[variant],
      styles.size[size],
      disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
      className,
    ].join(" ")}
  >
    {Icon && <Icon size={iconSize} />}
    <span>{children}</span>
  </button>
);
