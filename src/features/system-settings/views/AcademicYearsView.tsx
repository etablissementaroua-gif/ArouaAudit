import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  CheckCircle2, 
  DollarSign, 
  Layers, 
  Clock, 
  Check, 
  AlertCircle, 
  Sparkles, 
  X,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { systemSettingsService } from '../services/systemSettings.service';
import { AcademicYear } from '../models/settings.types';

export const AcademicYearsView: React.FC = () => {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formCode, setFormCode] = useState<string>('');
  const [formStartDate, setFormStartDate] = useState<string>('2027-09-01');
  const [formEndDate, setFormEndDate] = useState<string>('2028-06-30');
  const [formTargetCA, setFormTargetCA] = useState<number>(5000000);
  const [formIsCurrent, setFormIsCurrent] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadYears();
  }, []);

  const loadYears = async () => {
    setLoading(true);
    try {
      const data = await systemSettingsService.getAcademicYears();
      setYears(data);
    } catch (err) {
      console.error('Error loading academic years:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (code: string) => {
    try {
      await systemSettingsService.setActiveAcademicYear(code);
      await loadYears();
      showSuccess(`تم اعتماد السنة الدراسية ${code} بنجاح كسنة محاسبية نشطة`);
    } catch (err) {
      console.error('Error setting active year:', err);
    }
  };

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) {
      setFormError('يرجى إدخال كود السنة الدراسية (مثال: 2027/2028)');
      return;
    }

    try {
      await systemSettingsService.createAcademicYear({
        code: formCode.trim(),
        start_date: formStartDate,
        end_date: formEndDate,
        target_annual_ca: Number(formTargetCA) || 0,
        is_current: formIsCurrent
      });

      setIsModalOpen(false);
      resetForm();
      await loadYears();
      showSuccess(`تم تسجيل السنة الدراسية ${formCode} وتحديث مصفوفة الفترات`);
    } catch (err) {
      console.error('Error creating academic year:', err);
      setFormError('حدث خطأ أثناء حفظ السنة الدراسية');
    }
  };

  const resetForm = () => {
    setFormCode('');
    setFormStartDate('2027-09-01');
    setFormEndDate('2028-06-30');
    setFormTargetCA(5000000);
    setFormIsCurrent(false);
    setFormError(null);
  };

  const showSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => {
      setActionSuccess(null);
    }, 4000);
  };

  const activeYear = years.find(y => y.is_current) || years[0];

  const formatMAD = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-700" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">السنوات الدراسية (Années Scolaires)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 border border-indigo-500/20">
              المرحلة 2: محرك الإعدادات
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            إدارة الفترات المحاسبية السنوية، ضبط السنة الدراسية المعتمدة واستهدافات رقم المعاملات السنوي (Target CA).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-700/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            إضافة سنة دراسية جديدة
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700/60 hover:text-emerald-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="السنة المحاسبية المعتمدة" 
          value={activeYear?.code || '2026/2027'} 
          subtitle="السنة النشطة المطبقة على الحسابات" 
          icon={Calendar} 
          variant="income" 
        />
        <StatCard 
          title="الهدف المالي السنوي (Target CA)" 
          value={formatMAD(activeYear?.target_annual_ca || 0)} 
          subtitle="رقم المعاملات المستهدف للسنة النشطة" 
          icon={TrendingUp} 
          variant="pending" 
        />
        <StatCard 
          title="مجموع السنوات المسجلة" 
          value={`${years.length} فترات`} 
          subtitle="سجل أرشيف السنوات بالمنظومة" 
          icon={Layers} 
          variant="default" 
        />
        <StatCard 
          title="حالة الربط وقاعدة البيانات" 
          value="Supabase Active" 
          subtitle="مطابقة لترحيل 20260929" 
          icon={ShieldCheck} 
          variant="income" 
        />
      </div>

      {/* Years Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden backdrop-blur-md">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-700" />
            <h2 className="text-sm font-bold text-slate-900">قائمة السنوات الدراسية والفترات المالية المعتمدة</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {years.length} سنوات دراسية مسجلة
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border border-slate-200 text-slate-500 border-b border-slate-200 font-semibold uppercase">
              <tr>
                <th className="py-3.5 px-4">كود السنة الدراسية</th>
                <th className="py-3.5 px-4">تاريخ الانطلاق</th>
                <th className="py-3.5 px-4">تاريخ الاختتام</th>
                <th className="py-3.5 px-4">الهدف السنوي لرقم المعاملات (Target CA)</th>
                <th className="py-3.5 px-4">الحالة المحاسبية</th>
                <th className="py-3.5 px-4 text-center">الإجراء المعتمد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                    جاري تحميل سجل السنوات الدراسية...
                  </td>
                </tr>
              ) : years.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    لم يتم تسجيل أي سنة دراسية حتى الآن.
                  </td>
                </tr>
              ) : (
                years.map((year) => (
                  <tr 
                    key={year.id || year.code}
                    className={`hover:bg-slate-50/80 transition-colors ${year.is_current ? 'bg-emerald-50/70' : ''}`}
                  >
                    <td className="py-4 px-4 font-mono font-bold text-sm text-slate-900 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${year.is_current ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-slate-600'}`} />
                      {year.code}
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-700">
                      {year.start_date}
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-700">
                      {year.end_date}
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-amber-700">
                      {formatMAD(year.target_annual_ca || 0)}
                    </td>
                    <td className="py-4 px-4">
                      {year.is_current ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Check className="w-3.5 h-3.5" />
                          السنة الحالية النشطة
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs text-slate-500 bg-slate-100 border border-slate-200">
                          فترة مؤرشفة / ثانوية
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {year.is_current ? (
                        <span className="text-xs text-slate-500 font-mono italic">
                          معتمدة افتراضياً
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetActive(year.code)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-medium border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          تعيين كسنة معتمدة للحسابات
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Year Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">إضافة سنة دراسية جديدة</h3>
              </div>
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateYear} className="space-y-4 mt-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  كود السنة الدراسية (Code Année) *
                </label>
                <input 
                  type="text"
                  placeholder="مثال: 2027/2028"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs text-xs font-mono focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    تاريخ الانطلاق (Début)
                  </label>
                  <input 
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs text-xs font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    تاريخ الاختتام (Fin)
                  </label>
                  <input 
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs text-xs font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  الهدف المالي السنوي لرقم المعاملات (MAD)
                </label>
                <div className="relative">
                  <input 
                    type="number"
                    step="10000"
                    placeholder="مثال: 5000000"
                    value={formTargetCA}
                    onChange={(e) => setFormTargetCA(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs text-xs font-mono focus:border-indigo-500 focus:outline-none pl-12"
                  />
                  <span className="absolute left-3 top-2.5 text-xs font-mono text-slate-500">MAD</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">يُعتمد لاحتساب نسب التحصيل وأداء رقم المعاملات السنوي.</p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox"
                  id="setCurrentCheckbox"
                  checked={formIsCurrent}
                  onChange={(e) => setFormIsCurrent(e.target.checked)}
                  className="rounded border-slate-200 bg-white text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="setCurrentCheckbox" className="text-xs text-slate-700 cursor-pointer">
                  تعيين هذه السنة كسنة دراسية نشطة فوراً للحسابات
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-700/20 active:scale-95 cursor-pointer"
                >
                  حفظ وتثبيت السنة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
