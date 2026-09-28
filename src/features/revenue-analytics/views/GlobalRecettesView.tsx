import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  Layers 
} from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { revenueAnalyticsService } from '../services/revenueAnalytics.service';
import { DailyCalendarRecette } from '../models/revenue.types';

export const GlobalRecettesView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [calendar, setCalendar] = useState<DailyCalendarRecette[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadCalendar(selectedMonth);
  }, [selectedMonth]);

  const loadCalendar = async (month: string) => {
    setLoading(true);
    try {
      const data = await revenueAnalyticsService.getMonthlyRecettesCalendar(month);
      setCalendar(data);
    } catch (err) {
      console.error('Error loading calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalMonth = calendar.reduce((sum, d) => sum + d.total_amount, 0);
  const totalTransactions = calendar.reduce((sum, d) => sum + d.transactions_count, 0);
  const activeDays = calendar.filter(d => d.total_amount > 0).length;

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">المقبوضات العامة والرزنامة الشهرية (Recettes Globales)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              المرحلة 4: الرؤية المجمعة
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            الرؤية المجمعة لكافة مداخيل المؤسسة اليومية على مدار الشهر مع تفصيل قنوات التحصيل.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span className="text-xs text-slate-400">الشهر المالي:</span>
          <input 
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-white text-xs font-mono font-bold focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          title="إجمالي مقبوضات الشهر" 
          value={`${totalMonth.toLocaleString()} MAD`} 
          subtitle={`شهر ${selectedMonth}`} 
          icon={TrendingUp} 
          variant="income" 
        />
        <StatCard 
          title="إجمالي العمليات المنجزة" 
          value={`${totalTransactions} عمليات`} 
          subtitle="مقبوضات مسجلة ومؤكدة" 
          icon={CheckCircle2} 
          variant="default" 
        />
        <StatCard 
          title="أيام التحصيل النشطة" 
          value={`${activeDays} يوماً`} 
          subtitle="سجل تحصيل نشط خلال الشهر" 
          icon={Calendar} 
          variant="pending" 
        />
      </div>

      {/* Monthly Interactive Calendar Grid */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          رزنامة مداخيل شهر: {selectedMonth} (تجميع يومي)
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-7 gap-3">
          {calendar.map((day) => {
            const hasAmount = day.total_amount > 0;
            return (
              <div 
                key={day.date}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between h-24 ${
                  hasAmount 
                    ? 'bg-indigo-950/20 border-indigo-500/40 hover:border-indigo-400' 
                    : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-white">يوم {day.day_number}</span>
                  {hasAmount && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
                  )}
                </div>

                <div>
                  <div className={`font-mono font-bold text-xs ${hasAmount ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {hasAmount ? `${day.total_amount.toLocaleString()} MAD` : '0 MAD'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {day.transactions_count} وصولات
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
