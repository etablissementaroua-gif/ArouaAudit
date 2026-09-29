import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Layers, 
  Calendar, 
  ArrowUpRight, 
  Percent, 
  AlertCircle, 
  CheckCircle2, 
  PieChart, 
  BookOpen, 
  Bus, 
  Utensils 
} from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { revenueAnalyticsService } from '../services/revenueAnalytics.service';
import { MonthlyTheoreticalCA, RevenueComparison } from '../models/revenue.types';

export const MonthlyCAView: React.FC = () => {
  const [academicYear, setAcademicYear] = useState<string>('2026/2027');
  const [levelCA, setLevelCA] = useState<MonthlyTheoreticalCA[]>([]);
  const [comparison, setComparison] = useState<RevenueComparison | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData(academicYear);
  }, [academicYear]);

  const loadData = async (year: string) => {
    setLoading(true);
    try {
      const [list, comp] = await Promise.all([
        revenueAnalyticsService.getMonthlyTheoreticalCA(year),
        revenueAnalyticsService.getRevenueComparison(year)
      ]);
      setLevelCA(list);
      setComparison(comp);
    } catch (err) {
      console.error('Error loading monthly CA:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = levelCA.reduce((acc, c) => acc + c.students_count, 0);
  const totalTuition = levelCA.reduce((acc, c) => acc + c.tuition_subtotal, 0);
  const totalTransport = levelCA.reduce((acc, c) => acc + c.transport_subtotal, 0);
  const totalCanteen = levelCA.reduce((acc, c) => acc + c.canteen_subtotal, 0);
  const totalMonthlyTheoretical = levelCA.reduce((acc, c) => acc + c.monthly_total, 0);

  return (
    <div className="page-container animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="page-header-card">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-700" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">رقم المعاملات الشهري (Chiffre d'Affaires Mensuel)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              المرحلة 4: محرك الإيرادات
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            احتساب رقم المعاملات الشهري النظري المقدر بناءً على رسوم المستويات والخدمات ومقارنته بالمحصل الفعلي.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
          <Calendar className="w-4 h-4 text-emerald-700" />
          <span className="text-xs text-slate-500">السنة الدراسية:</span>
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="bg-transparent text-slate-800 text-xs font-mono font-bold focus:outline-none cursor-pointer"
          >
            <option value="2026/2027" className="bg-white text-slate-900">2026/2027 (النشطة)</option>
            <option value="2025/2026" className="bg-white text-slate-900">2025/2026</option>
            <option value="2027/2028" className="bg-white text-slate-900">2027/2028</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="رقم المعاملات الشهري النظري" 
          value={`${totalMonthlyTheoretical.toLocaleString()} MAD`} 
          subtitle="المستحق شهرياً لكافة المستويات والخدمات" 
          icon={TrendingUp} 
          variant="income" 
        />
        <StatCard 
          title="المحصل الفعلي بالصندوق" 
          value={`${(comparison?.actual_collected_monthly || 0).toLocaleString()} MAD`} 
          subtitle="مجموع المقبوضات المقيدة" 
          icon={DollarSign} 
          variant="default" 
        />
        <StatCard 
          title="نسبة التحصيل المحققة" 
          value={`${comparison?.collection_rate || 0}%`} 
          subtitle="معدل استخلاص الأقساط" 
          icon={Percent} 
          variant={comparison && comparison.collection_rate >= 80 ? 'income' : 'pending'} 
        />
        <StatCard 
          title="الذمم والمتأخرات العالقة" 
          value={`${(comparison?.total_reliquat || 0).toLocaleString()} MAD`} 
          subtitle="فارق التحصيل قيد المتابعة" 
          icon={AlertCircle} 
          variant="expense" 
        />
      </div>

      {/* Service Distribution Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500">واجبات التمدرس (Scolarité)</div>
              <div className="text-sm font-bold font-mono text-white">{totalTuition.toLocaleString()} MAD</div>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            {comparison?.service_breakdown.tuition_share || 70}%
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500">خدمات النقل المدرسي (Transport)</div>
              <div className="text-sm font-bold font-mono text-white">{totalTransport.toLocaleString()} MAD</div>
            </div>
          </div>
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
            {comparison?.service_breakdown.transport_share || 18}%
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500">المطعم المدرسي (Cantine)</div>
              <div className="text-sm font-bold font-mono text-white">{totalCanteen.toLocaleString()} MAD</div>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300">
            {comparison?.service_breakdown.canteen_share || 12}%
          </span>
        </div>
      </div>

      {/* Level by Level Matrix */}
      <div className="standard-table-wrapper">
        <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-700" />
            <h2 className="text-sm font-bold text-slate-900">تفصيل رقم المعاملات الشهري النظري حسب المستويات</h2>
          </div>
          <span className="text-xs font-mono text-slate-500">
            إجمالي التلاميذ: {totalStudents} تلميذاً
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-4 px-4">المستوى الدراسي</th>
                <th className="py-4 px-3 text-center">التلاميذ المسجلون</th>
                <th className="py-4 px-3 text-center">مجموع التمدرس (Tuition)</th>
                <th className="py-4 px-3 text-center">مجموع النقل (Transport)</th>
                <th className="py-4 px-3 text-center">مجموع المطعم (Cantine)</th>
                <th className="py-4 px-4 text-center font-bold text-indigo-300">الإجمالي الشهري (Total CA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                    جاري احتساب رقم المعاملات النظري...
                  </td>
                </tr>
              ) : (
                levelCA.map((lvl) => (
                  <tr key={lvl.academic_level} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold text-xs border border-indigo-500/20">
                          {lvl.academic_level}
                        </span>
                        <span className="font-bold text-slate-900">{lvl.level_name_ar}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-mono">
                      {lvl.students_count}
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-slate-800">
                      {lvl.tuition_subtotal.toLocaleString()} MAD
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-amber-300">
                      {lvl.transport_subtotal.toLocaleString()} MAD
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-slate-800">
                      {lvl.canteen_subtotal.toLocaleString()} MAD
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-sm text-emerald-700">
                      {lvl.monthly_total.toLocaleString()} MAD
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-white">
              <tr>
                <td className="py-3.5 px-4">المجموع العام الشهري</td>
                <td className="py-3.5 px-3 text-center font-mono text-emerald-700">{totalStudents}</td>
                <td className="py-3.5 px-3 text-center font-mono">{totalTuition.toLocaleString()} MAD</td>
                <td className="py-3.5 px-3 text-center font-mono text-amber-300">{totalTransport.toLocaleString()} MAD</td>
                <td className="py-3.5 px-3 text-center font-mono">{totalCanteen.toLocaleString()} MAD</td>
                <td className="py-3.5 px-4 text-center font-mono text-sm text-emerald-700">{totalMonthlyTheoretical.toLocaleString()} MAD</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
