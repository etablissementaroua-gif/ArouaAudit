import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'default' | 'income' | 'expense' | 'pending';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'income':
        return 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400';
      case 'expense':
        return 'border-rose-500/30 bg-rose-950/20 text-rose-400';
      case 'pending':
        return 'border-amber-500/30 bg-amber-950/20 text-amber-400';
      default:
        return 'border-slate-800 bg-slate-900/60 text-indigo-400';
    }
  };

  return (
    <div className={`p-5 rounded-2xl border backdrop-blur-md transition-all duration-200 hover:scale-[1.01] ${getVariantStyles()}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/50">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <h3 className="text-2xl font-bold tracking-tight text-white">{value}</h3>
      </div>
      {(subtitle || trend) && (
        <div className="mt-2 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-400">{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold px-2 py-0.5 rounded-full ${
                trend.isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
