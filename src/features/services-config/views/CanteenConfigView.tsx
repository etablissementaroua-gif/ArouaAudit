import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Plus,
  RefreshCw,
  Users,
  Calendar,
  DollarSign,
  Coffee,
  CheckCircle2,
  Clock,
  X,
  FileText,
} from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { CanteenPlan, NewCanteenPlanFormData, CanteenFrequency } from '../models/services.types';
import { servicesConfigService } from '../services/servicesConfig.service';

export const CanteenConfigView: React.FC = () => {
  const [plans, setPlans] = useState<CanteenPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<NewCanteenPlanFormData>({
    plan_code: '',
    name_ar: '',
    name_fr: '',
    frequency: 'mensuel',
    fee_amount: 450,
    daily_meal_desc: '',
    max_capacity: 120,
    academic_year: '2026/2027',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await servicesConfigService.getCanteenPlans();
      setPlans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCapacity = plans.reduce((sum, p) => sum + p.max_capacity, 0);
  const totalEnrolled = plans.reduce((sum, p) => sum + (p.enrolled_count || 0), 0);
  const monthlyRevenueEst = plans
    .filter((p) => p.is_active)
    .reduce((sum, p) => {
      const count = p.enrolled_count || 0;
      if (p.frequency === 'mensuel') return sum + count * p.fee_amount;
      if (p.frequency === 'trimestriel') return sum + (count * p.fee_amount) / 3;
      return sum + count * (p.fee_amount / 2);
    }, 0);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await servicesConfigService.updateCanteenPlan(id, { is_active: !currentStatus });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plan_code || !formData.name_ar || !formData.fee_amount) return;

    setSubmitting(true);
    try {
      await servicesConfigService.addCanteenPlan(formData);
      setIsModalOpen(false);
      setFormData({
        plan_code: '',
        name_ar: '',
        name_fr: '',
        frequency: 'mensuel',
        fee_amount: 450,
        daily_meal_desc: '',
        max_capacity: 120,
        academic_year: '2026/2027',
      });
      await loadData();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إضافة صيغة المطعم');
    } finally {
      setSubmitting(false);
    }
  };

  const getFrequencyBadge = (freq: string) => {
    switch (freq) {
      case 'mensuel':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/10 text-emerald-800 border border-cyan-500/20">
            اشتراك شهري (Mensuel)
          </span>
        );
      case 'trimestriel':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 border border-indigo-500/20">
            اشتراك فصلي (Trimestriel)
          </span>
        );
      case 'carnet_tickets':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            دفتر تذاكر مرن (Carnet)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            اشتراك سنوي كامل
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-800" />
            <span>المطعم المدرسي وصيغ الاشتراكات الغذائية (Restauration & Cantine)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إعداد الوجبات الغذائية، تتبع اشتراكات نصف الإقامة (Demi-Pension)، وإحصائيات الطاقة الاستيعابية
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs text-slate-700 hover:text-white transition-all disabled:opacity-50"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة صيغة مطعم جديدة</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="الطاقة الاستيعابية للمطعم"
          value={`${totalCapacity} مقعداً`}
          subtitle="سعة قاعات الطعام المدرسية"
          icon={Utensils}
          variant="default"
        />
        <StatCard
          title="المشتركون الفعليون"
          value={`${totalEnrolled} تلميذاً`}
          subtitle="اشتراكات نصف إقامة مؤكدة"
          icon={Users}
          variant="income"
        />
        <StatCard
          title="متوسط الوجبات اليومية"
          value={`${Math.round(totalEnrolled * 0.95)} وجبة/يوم`}
          subtitle="معدل الحضور والإطعام"
          icon={Coffee}
          variant="pending"
        />
        <StatCard
          title="العائد المالي الشهري التقديري"
          value={formatMAD(monthlyRevenueEst)}
          subtitle="مداخيل خدمة الإطعام"
          icon={DollarSign}
          variant="income"
        />
      </div>

      {/* Meal Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="p-5 rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-md hover:border-slate-700/80 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-emerald-800 border border-cyan-500/20">
                  {plan.plan_code}
                </span>

                <button
                  onClick={() => handleToggleStatus(plan.id, plan.is_active)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                    plan.is_active
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {plan.is_active ? 'صيغة مفعلة' : 'معطلة'}
                </button>
              </div>

              <h3 className="text-sm font-bold text-slate-900 mb-0.5">{plan.name_ar}</h3>
              <p className="text-[11px] text-slate-500 mb-3">{plan.name_fr}</p>

              <div className="mb-4">{getFrequencyBadge(plan.frequency)}</div>

              {plan.daily_meal_desc && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 border border-slate-200 text-xs text-slate-700 mb-4 leading-relaxed">
                  <span className="text-slate-500 text-[10px] block mb-1">وصف البرنامج الغذائي:</span>
                  {plan.daily_meal_desc}
                </div>
              )}
            </div>

            <div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between mb-3 text-xs font-mono">
                <span className="text-slate-500">التلاميذ المسجلون:</span>
                <span className="font-bold text-slate-900">
                  {plan.enrolled_count} / {plan.max_capacity} مقعد
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between font-mono">
                <span className="text-xs text-slate-500">التعريفة المعتمدة:</span>
                <span className="text-base font-black text-emerald-800">{formatMAD(plan.fee_amount)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Menu Preview */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-md">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-800" />
          نموذج البرنامج الغذائي الأسبوعي المتوازن (Menu Hebdomadaire Type)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <span className="font-bold text-emerald-800 block mb-1">الاثنين</span>
            <p className="text-slate-700">سلطة خضراء + طاجين اللحم البقري بالبرقوق + تفاح طازج + لمجة</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <span className="font-bold text-emerald-800 block mb-1">الثلاثاء</span>
            <p className="text-slate-700">حساء خضر + دجاج محمر مع أرز مبخر + ياغورت بالفواكه + لمجة</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <span className="font-bold text-emerald-800 block mb-1">الأربعاء</span>
            <p className="text-slate-700">سلطة معكرونة وتونة + كفتة مشوية بصلصة الطماطم + موز + لمجة</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <span className="font-bold text-emerald-800 block mb-1">الخميس</span>
            <p className="text-slate-700">سلطة جزر ومقبلات + طاجين سمك بالخضار + برتقال محلى + لمجة</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <span className="font-bold text-emerald-800 block mb-1">الجمعة</span>
            <p className="text-slate-700">كسكس تقليدي بالسبع خضار ولحم العجل + لبن رائب + فاكهة الموسم</p>
          </div>
        </div>
      </div>

      {/* Add Canteen Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xs shadow-2xl p-6 text-white my-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-800" />
                <h3 className="text-sm font-bold">إضافة صيغة اشتراك مطعم وإطعام جديدة</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1">رمز الصيغة (Plan Code)*</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: PLAN-AN-FULL"
                    value={formData.plan_code}
                    onChange={(e) => setFormData({ ...formData, plan_code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-900 font-mono uppercase focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">نوع الدورة (Fréquence)*</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as CanteenFrequency })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="mensuel">شهري (Mensuel)</option>
                    <option value="trimestriel">فصلي (Trimestriel)</option>
                    <option value="annuel">سنوي (Annuel)</option>
                    <option value="carnet_tickets">دفتر تذاكر (Carnet)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">اسم الصيغة بالعربية*</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: نصف إقامة سنوية كاملة"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">اسم الصيغة بالفرنسية (Libellé FR)</label>
                <input
                  type="text"
                  placeholder="Demi-Pension Annuelle Complète"
                  value={formData.name_fr}
                  onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1">التعريفة المالية (MAD)*</label>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    required
                    value={formData.fee_amount}
                    onChange={(e) => setFormData({ ...formData, fee_amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-900 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">الطاقة الاستيعابية القصوى (مقعد)*</label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    required
                    value={formData.max_capacity}
                    onChange={(e) => setFormData({ ...formData, max_capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-900 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">وصف ومكونات الوجبة اليومية</label>
                <textarea
                  rows={2}
                  placeholder="مقبلات، طبق رئيسي، فواكه الموسم، ولمجة مسائية..."
                  value={formData.daily_meal_desc}
                  onChange={(e) => setFormData({ ...formData, daily_meal_desc: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition-all disabled:opacity-50"
                >
                  {submitting ? 'جاري الحفظ...' : 'حفظ الصيغة وتفعيلها'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
