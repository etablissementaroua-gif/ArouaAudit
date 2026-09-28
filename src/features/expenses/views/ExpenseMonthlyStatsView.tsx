import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  BarChart3,
  Calendar,
  Layers,
  PieChart,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  Building,
  Zap,
} from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { ExpenseMonthlyStatItem, ExpenseBudgetSummary } from '../models/expenses.types';
import { expensesService } from '../services/expenses.service';

export const ExpenseMonthlyStatsView: React.FC = () => {
  const [monthlyStats, setMonthlyStats] = useState<ExpenseMonthlyStatItem[]>([]);
  const [budgetOverview, setBudgetOverview] = useState<ExpenseBudgetSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stats, overview] = await Promise.all([
        expensesService.getMonthlyExpenseStats(),
        expensesService.getBudgetConsumptionOverview(),
      ]);
      setMonthlyStats(stats);
      setBudgetOverview(overview);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalSpent = budgetOverview?.total_spent || 0;
  const fixedTotal = budgetOverview?.fixed_total || 0;
  const variableTotal = budgetOverview?.variable_total || 0;
  const fixedPercentage = totalSpent > 0 ? (fixedTotal / totalSpent) * 100 : 0;
  const variablePercentage = totalSpent > 0 ? (variableTotal / totalSpent) * 100 : 0;

  // Max month total for scale
  const maxMonthlyTotal = Math.max(...monthlyStats.map((s) => s.total_charges), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span>التحليل الإحصائي والشهري للنفقات (Analyse Mensuelle des Charges)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            رصد تدفقات النفقات، مقارنة التكاليف القارة والمتغيرة، وتفكيك بنية التكاليف التشغيلية للمؤسسة
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all disabled:opacity-50"
          title="تحديث الإحصائيات"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي النفقات التراكمية"
          value={formatMAD(totalSpent)}
          subtitle="الموسم الدراسي 2026/2027"
          icon={TrendingDown}
          variant="expense"
        />
        <StatCard
          title="التكاليف القارة (Charges Fixes)"
          value={formatMAD(fixedTotal)}
          subtitle={`${fixedPercentage.toFixed(1)}% من مجموع النفقات`}
          icon={Building}
          variant="default"
        />
        <StatCard
          title="التكاليف المتغيرة (Charges Variables)"
          value={formatMAD(variableTotal)}
          subtitle={`${variablePercentage.toFixed(1)}% من مجموع النفقات`}
          icon={Zap}
          variant="pending"
        />
        <StatCard
          title="معدل استهلاك الميزانية"
          value={`${budgetOverview?.consumption_rate || 0}%`}
          subtitle={`المتبقي: ${formatMAD(budgetOverview?.remaining_budget || 0)}`}
          icon={PieChart}
          variant="income"
        />
      </div>

      {/* Visual Chart / Progress Breakdown */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-sm font-bold text-white">تطور النفقات عبر أشهر الموسم الدراسي</h3>
            <p className="text-xs text-slate-400">توزيع المصاريف الثابتة والمتغيرة شهرياً</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-purple-500" />
              <span className="text-slate-300">تكاليف قارة (Fixes)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-cyan-500" />
              <span className="text-slate-300">تكاليف متغيرة (Variables)</span>
            </div>
          </div>
        </div>

        {/* Bars Container */}
        <div className="space-y-4">
          {monthlyStats.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">لا توجد بيانات نفقات مسجلة بالأشهر الحالية</div>
          ) : (
            monthlyStats.map((item) => {
              const fixedPercent = item.total_charges > 0 ? (item.fixed_charges / item.total_charges) * 100 : 0;
              const variablePercent = 100 - fixedPercent;
              const barWidthPercent = (item.total_charges / maxMonthlyTotal) * 100;

              return (
                <div key={item.month_key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{item.month_label}</span>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-purple-400">ثابتة: {formatMAD(item.fixed_charges)}</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-cyan-400">متغيرة: {formatMAD(item.variable_charges)}</span>
                      <span className="text-slate-600">|</span>
                      <span className="font-bold text-white">الإجمالي: {formatMAD(item.total_charges)}</span>
                    </div>
                  </div>

                  {/* Dual Segment Progress Bar */}
                  <div className="w-full h-3 rounded-full bg-slate-950/80 p-0.5 border border-slate-800 flex overflow-hidden">
                    <div
                      className="h-full rounded-full flex overflow-hidden transition-all duration-700"
                      style={{ width: `${Math.max(10, barWidthPercent)}%` }}
                    >
                      <div
                        className="h-full bg-purple-500 hover:opacity-90 transition-opacity"
                        style={{ width: `${fixedPercent}%` }}
                        title={`تكاليف قارة: ${fixedPercent.toFixed(1)}%`}
                      />
                      <div
                        className="h-full bg-cyan-500 hover:opacity-90 transition-opacity"
                        style={{ width: `${variablePercent}%` }}
                        title={`تكاليف متغيرة: ${variablePercent.toFixed(1)}%`}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Monthly Detailed Breakdown Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">جدول التفصيل المحاسبي الشهري</h3>
          <span className="text-xs text-slate-400 font-mono">سنة مالية: 2026/2027</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-medium border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">الشهر المحاسبي</th>
                <th className="py-3 px-4 text-center">عدد العمليات</th>
                <th className="py-3 px-4 text-left">التكاليف القارة (Fixes)</th>
                <th className="py-3 px-4 text-left">التكاليف المتغيرة (Variables)</th>
                <th className="py-3 px-4 text-left">إجمالي الشهر</th>
                <th className="py-3 px-4 text-center">النسبة من إجمالي النفقات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {monthlyStats.map((item) => {
                const shareOfTotal = totalSpent > 0 ? (item.total_charges / totalSpent) * 100 : 0;
                return (
                  <tr key={item.month_key} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-sans font-bold text-white">{item.month_label}</td>
                    <td className="py-3 px-4 text-center text-slate-400">{item.count} سندات</td>
                    <td className="py-3 px-4 text-left text-purple-400">{formatMAD(item.fixed_charges)}</td>
                    <td className="py-3 px-4 text-left text-cyan-400">{formatMAD(item.variable_charges)}</td>
                    <td className="py-3 px-4 text-left font-bold text-rose-400">{formatMAD(item.total_charges)}</td>
                    <td className="py-3 px-4 text-center text-slate-300">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-bold">
                        {shareOfTotal.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
