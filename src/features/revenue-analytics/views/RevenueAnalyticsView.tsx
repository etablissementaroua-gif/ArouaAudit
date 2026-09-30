import React from 'react';
import { useRevenueAnalytics } from '../controllers/useRevenueAnalytics';
import { StatCard } from '../../../shared/components/StatCard';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { TrendingUp, BarChart3, PieChart, ShieldCheck } from 'lucide-react';

export const RevenueAnalyticsView: React.FC = () => {
  const { comparison, monthlyCA, annualCA, loading } = useRevenueAnalytics();

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-500">جاري التحميل...</div>;
  }

  const totalRevenue = annualCA?.actual_collected_ca || 0;
  const totalExpenses = Math.round(totalRevenue * 0.55);
  const netSurplus = totalRevenue - totalExpenses;
  const collectionRate = comparison?.collection_rate || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">التحليلات والمؤشرات الاقتصادية (Financial Analytics)</h2>
          <p className="text-xs text-slate-500 mt-1">مؤشرات النمو، هامش الفائض التشغيلي، ومقارنة الإيرادات النظرية والفعلية</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي المداخيل السنوية" value={formatMAD(totalRevenue)} subtitle="مجموع المحصل الفعلي" icon={TrendingUp} variant="income" />
        <StatCard title="إجمالي النفقات التشغيلية" value={formatMAD(totalExpenses)} subtitle="الأجور والمستلزمات" icon={BarChart3} variant="expense" />
        <StatCard title="صافي الفائض التشغيلي" value={formatMAD(netSurplus)} subtitle="نتيجة المنظومة المالية" icon={PieChart} variant="default" />
        <StatCard title="نسبة التحصيل الإجمالية" value={collectionRate + "%"} subtitle="Taux de Recouvrement" icon={ShieldCheck} variant="income" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/60 backdrop-blur-md">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-50 text-xs text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-right">المستوى الدراسي</th>
              <th className="px-4 py-3 text-right">عدد التلاميذ</th>
              <th className="px-4 py-3 text-right">واجبات التمدرس</th>
              <th className="px-4 py-3 text-right">واجبات النقل</th>
              <th className="px-4 py-3 text-right">رسوم الاطعام</th>
              <th className="px-4 py-3 text-right">الإجمالي الشهري</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {monthlyCA.map((m: typeof monthlyCA[0], idx: number) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3 text-slate-900 font-bold">{m.level_name_ar}</td>
                <td className="px-4 py-3 font-mono text-slate-700">{m.students_count}</td>
                <td className="px-4 py-3 font-mono text-emerald-700 font-bold">{formatMAD(m.tuition_subtotal)}</td>
                <td className="px-4 py-3 font-mono text-sky-600 font-bold">{formatMAD(m.transport_subtotal)}</td>
                <td className="px-4 py-3 font-mono text-amber-600 font-bold">{formatMAD(m.canteen_subtotal)}</td>
                <td className="px-4 py-3 font-mono text-slate-900 font-black">{formatMAD(m.monthly_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
