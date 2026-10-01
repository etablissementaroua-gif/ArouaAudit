import React, { useState, useEffect } from 'react';
import { 
  TrendingUp,
  RotateCcw, 
  Target, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  BookOpen, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { revenueAnalyticsService } from '../services/revenueAnalytics.service';
import { AnnualCASummary } from '../models/revenue.types';

export const AnnualCAView: React.FC = () => {
  const [academicYear, setAcademicYear] = useState<string>('2026/2027');
  const [summary, setSummary] = useState<AnnualCASummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAnnualData(academicYear);
  }, [academicYear]);

  const [resettingTarget, setResettingTarget] = useState(false);
  const handleResetTarget = async () => {
    
    setResettingTarget(true);
    await revenueAnalyticsService.resetAnnualTarget(academicYear);
    await loadAnnualData(academicYear);
    setResettingTarget(false);
  };

  const loadAnnualData = async (year: string) => {
    setLoading(true);
    try {
      const data = await revenueAnalyticsService.getAnnualEstimatedCA(year);
      setSummary(data);
    } catch (err) {
      console.error('Error loading annual CA:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="page-header-card">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-amber-700" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">رقم المعاملات السنوي والهدف المالي (Chiffre d'Affaires Annuel)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              المرحلة 4: استهدافات الميزانية
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            مقارنة التقديرات السنوية الشاملة بالهدف المالي السنوي المعتمد بإعدادات المنظومة (Target CA).
          </p>
        </div>

        <button
            onClick={handleResetTarget}
            disabled={resettingTarget}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl font-bold text-xs transition shadow-xs cursor-pointer"
            title="تصفير الهدف المالي السنوي إلى 0,00 MAD"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-rose-600 ${resettingTarget ? 'animate-spin' : ''}`} />
            <span>تصفير الهدف (0 MAD)</span>
          </button>
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
          title="الهدف السنوي المقرر (Target CA)" 
          value={`${(summary?.target_annual_ca || 0).toLocaleString()} MAD`} 
          subtitle="الهدف المالي المسجل بإعدادات المنظومة" 
          icon={Target} 
          variant="pending" 
        />
        <StatCard 
          title="رقم المعاملات السنوي المتوقع" 
          value={`${(summary?.annual_theoretical_ca || 0).toLocaleString()} MAD`} 
          subtitle="أقساط 10 أشهر + رسوم التسجيل واللوازم" 
          icon={TrendingUp} 
          variant="income" 
        />
        <StatCard 
          title="المداخيل المحصلة حتى اليوم" 
          value={`${(summary?.actual_collected_ca || 0).toLocaleString()} MAD`} 
          subtitle="مجموع المقبوضات الفعلية بالخزينة" 
          icon={DollarSign} 
          variant="default" 
        />
        <StatCard 
          title="نسبة بلوغ الهدف السنوي" 
          value={`${summary?.achievement_rate || 0}%`} 
          subtitle={`المتبقي للتحقيق: ${(summary?.reliquat_total || 0).toLocaleString()} MAD`} 
          icon={Sparkles} 
          variant="income" 
        />
      </div>

      {/* Progress Achievement Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            مؤشر الإنجاز نحو الهدف المالي السنوي ({academicYear})
          </span>
          <span className="font-mono text-emerald-700 font-bold">{summary?.achievement_rate || 0}% منجز</span>
        </div>

        <div className="w-full h-3 rounded-full bg-white border border-slate-200 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, summary?.achievement_rate || 0)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
          <span>0 MAD</span>
          <span>المحصل: {(summary?.actual_collected_ca || 0).toLocaleString()} MAD</span>
          <span>الهدف: {(summary?.target_annual_ca || 0).toLocaleString()} MAD</span>
        </div>
      </div>

      {/* Annual Breakdown Matrix */}
      <div className="standard-table-wrapper">
        <div className="p-4 px-6 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">تفصيل مكونات رقم المعاملات السنوي التقديري (10 أشهر)</h2>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/80">
            <span className="font-medium text-slate-800">1. مجموع أقساط التمدرس السنوية (Tuition × 10 mois)</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{(summary?.monthly_tuition_x10 || 0).toLocaleString()} MAD</span>
          </div>
          <div className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/80">
            <span className="font-medium text-slate-800">2. مجموع اشتراكات النقل المدرسي السنوية (Transport × 10 mois)</span>
            <span className="font-mono font-bold text-amber-300 text-sm">{(summary?.monthly_transport_x10 || 0).toLocaleString()} MAD</span>
          </div>
          <div className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/80">
            <span className="font-medium text-slate-800">3. مجموع اشتراكات المطعم المدرسي السنوية (Cantine × 10 mois)</span>
            <span className="font-mono font-bold text-slate-800 text-sm">{(summary?.monthly_canteen_x10 || 0).toLocaleString()} MAD</span>
          </div>
          <div className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/80">
            <span className="font-medium text-slate-800">4. رسوم التسجيل وإعادة التسجيل (Frais d'inscription et réinscription)</span>
            <span className="font-mono font-bold text-emerald-700 text-sm">{(summary?.total_registration_fees || 0).toLocaleString()} MAD</span>
          </div>
          <div className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/80">
            <span className="font-medium text-slate-800">5. واجبات المحفظة واللوازم (Frais des fournitures scolaires)</span>
            <span className="font-mono font-bold text-slate-700 text-sm">{(summary?.total_supplies_fees || 0).toLocaleString()} MAD</span>
          </div>
          <div className="p-4 px-6 flex items-center justify-between bg-slate-50 font-bold border-t border-slate-200">
            <span className="text-white">الإجمالي السنوي التقديري الشامل</span>
            <span className="font-mono font-bold text-base text-emerald-700">{(summary?.annual_theoretical_ca || 0).toLocaleString()} MAD</span>
          </div>
        </div>
      </div>
    </div>
  );
};
