import React from 'react';
import { useRevenueAnalytics } from '../controllers/useRevenueAnalytics';
import { StatCard } from '../../../shared/components/StatCard';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { TrendingUp, BarChart3, PieChart, ShieldCheck } from 'lucide-react';

export const RevenueAnalyticsView: React.FC = () => {
  const { metrics } = useRevenueAnalytics();
  const current = metrics[metrics.length - 1] || { income: 0, expense: 0, margin: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">التحليلات والمؤشرات الاقتصادية (Financial Analytics & KPIs)</h2>
          <p className="text-xs text-slate-500 mt-1">قراءة مؤشرات النمو، هامش الربح التشغيلي، ومقارنة الإيرادات والنفقات</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إيرادات الشهر الجاري" value={formatMAD(current.income)} subtitle="نمو التدفقات" icon={TrendingUp} variant="income" />
        <StatCard title="المصاريف التشغيلية" value={formatMAD(current.expense)} subtitle="الأجور والمستلزمات" icon={BarChart3} variant="expense" />
        <StatCard title="الفائض الصافي (Marge)" value={formatMAD(current.margin)} subtitle="صافي الأداء المالي" icon={PieChart} variant="default" />
        <StatCard title="معدل الملاءمة المالية" value="98.4%" subtitle="سلامة التدقيق والسيولة" icon={ShieldCheck} variant="income" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/60 backdrop-blur-md">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-50 text-xs text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-right">الفترة المحاسبية</th>
              <th className="px-4 py-3 text-right">المداخيل (Revenus)</th>
              <th className="px-4 py-3 text-right">المصاريف (Dépenses)</th>
              <th className="px-4 py-3 text-right">الفائض التشغيلي (Marge Nette)</th>
              <th className="px-4 py-3 text-left">مؤشر الربحية</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {metrics.map((m, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3 text-slate-900 font-bold">{m.period}</td>
                <td className="px-4 py-3 font-mono text-emerald-700 font-bold">{formatMAD(m.income)}</td>
                <td className="px-4 py-3 font-mono text-rose-600 font-bold">{formatMAD(m.expense)}</td>
                <td className="px-4 py-3 font-mono text-sky-400 font-bold">{formatMAD(m.margin)}</td>
                <td className="px-4 py-3 text-left font-mono text-xs text-slate-700">
                  {Math.round((m.margin / m.income) * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
