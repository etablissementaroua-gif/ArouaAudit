import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Wallet
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">المقبوضات العامة والرزنامة الشهرية (Recettes Globales)</h1>
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold text-xs inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  الرؤية المجمعة المعتمدة
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                الرؤية المجمعة لكافة مداخيل المؤسسة اليومية على مدار الشهر مع تفصيل قنوات التحصيل.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs">
          <Calendar className="w-4 h-4 text-emerald-700" />
          <span className="text-xs text-slate-600 font-semibold">الشهر المالي:</span>
          <input 
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-slate-900 text-xs font-mono font-bold focus:outline-none cursor-pointer"
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
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-emerald-700" />
            <span>رزنامة مداخيل شهر: {selectedMonth} (تجميع يومي)</span>
          </h2>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
            {activeDays} يوم تحصيل مسجل
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-7 gap-3">
          {calendar.map((day) => {
            const hasAmount = day.total_amount > 0;
            return (
              <div 
                key={day.date}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between h-28 ${
                  hasAmount 
                    ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950 shadow-2xs hover:border-emerald-500 hover:shadow-md' 
                    : 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-mono font-bold ${hasAmount ? 'text-slate-900' : 'text-slate-500'}`}>
                    يوم {day.day_number}
                  </span>
                  {hasAmount && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm animate-pulse" />
                  )}
                </div>

                <div>
                  <div className={`font-mono font-black text-sm ${hasAmount ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {hasAmount ? `${day.total_amount.toLocaleString()} MAD` : '0 MAD'}
                  </div>
                  <div className={`text-[11px] font-mono mt-0.5 ${hasAmount ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
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

export default GlobalRecettesView;
