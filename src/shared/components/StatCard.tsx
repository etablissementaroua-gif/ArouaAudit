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
        return {
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          iconBg: 'bg-emerald-100/70 text-emerald-700',
          valColor: 'text-emerald-700',
        };
      case 'expense':
        return {
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
          iconBg: 'bg-rose-100/70 text-rose-700',
          valColor: 'text-rose-700',
        };
      case 'pending':
        return {
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          iconBg: 'bg-amber-100/70 text-amber-700',
          valColor: 'text-amber-700',
        };
      default:
        return {
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          iconBg: 'bg-emerald-50 text-emerald-800 border border-emerald-200/60',
          valColor: 'text-slate-900',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500">{title}</span>
        <div className={`p-2 rounded-xl border border-slate-200/60 shadow-2xs ${styles.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <h3 className={`text-2xl font-black tracking-tight font-mono ${styles.valColor}`}>{value}</h3>
      </div>
      {(subtitle || trend) && (
        <div className="mt-2.5 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-400 font-medium text-[11px]">{subtitle}</span>}
          {trend && (
            <span
              className={`font-bold px-2 py-0.5 rounded-full text-[10px] border ${
                trend.isPositive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
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
