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
          leftBorder: 'border-l-4 border-l-emerald-500',
          iconBg: 'bg-emerald-50 text-emerald-600',
          valColor: 'text-emerald-700',
        };
      case 'expense':
        return {
          leftBorder: 'border-l-4 border-l-rose-500',
          iconBg: 'bg-rose-50 text-rose-600',
          valColor: 'text-rose-700',
        };
      case 'pending':
        return {
          leftBorder: 'border-l-4 border-l-amber-400',
          iconBg: 'bg-amber-50 text-amber-500',
          valColor: 'text-slate-900',
        };
      default:
        return {
          leftBorder: 'border-l-4 border-l-teal-400',
          iconBg: 'bg-teal-50 text-teal-600',
          valColor: 'text-slate-900',
        };
    }
  };

  const styles = getVariantStyles();
  const hasMAD = typeof value === 'string' && value.includes('MAD');
  const cleanNumericValue = hasMAD ? value.replace(/MAD/g, '').trim() : value;

  const renderValue = () => {
    if (typeof cleanNumericValue !== 'string') {
      return (
        <span className={`text-3xl font-black tracking-tight font-mono ${styles.valColor}`}>
          {cleanNumericValue}
        </span>
      );
    }

    // Pattern 1: Number + Arabic text (e.g. "21 أطر", "12 أساتذة", "0 موظفين")
    const match = cleanNumericValue.match(/^([\d.,]+|\d+)\s+(.+)$/);
    if (match) {
      return (
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-black tracking-tight font-mono ${styles.valColor}`}>
            {match[1]}
          </span>
          <span className={`text-xl font-bold font-sans ${styles.valColor}`}>
            {match[2]}
          </span>
        </div>
      );
    }

    // Pattern 2: Pure Arabic word (e.g. "نشطة", "معطل")
    if (/[\u0600-\u06FF]/.test(cleanNumericValue)) {
      return (
        <span className={`text-2xl font-black font-sans ${styles.valColor}`}>
          {cleanNumericValue}
        </span>
      );
    }

    // Pattern 3: Pure numbers, currency, or percentages
    return (
      <span className={`text-3xl font-black tracking-tight font-mono ${styles.valColor}`}>
        {cleanNumericValue}
      </span>
    );
  };

  return (
    <div className={`p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between ${styles.leftBorder}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-500">{title}</span>
        <div className={`p-2 rounded-xl border border-slate-100 shadow-2xs ${styles.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        {hasMAD && (
          <span className="text-xs font-bold font-mono text-emerald-600 block mb-0.5">MAD</span>
        )}
        <div>
          {renderValue()}
        </div>
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
