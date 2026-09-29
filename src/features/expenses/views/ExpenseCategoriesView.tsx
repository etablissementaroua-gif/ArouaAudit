import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  RefreshCw,
  TrendingDown,
  DollarSign,
  PieChart,
  CheckCircle2,
  AlertCircle,
  Tag,
  ShieldCheck,
  X,
} from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { ExpenseCategory, NewCategoryFormData } from '../models/expenses.types';
import { expensesService } from '../services/expenses.service';

export const ExpenseCategoriesView: React.FC = () => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // New Category Form State
  const [formData, setFormData] = useState<NewCategoryFormData>({
    code: '',
    name_ar: '',
    name_fr: '',
    charge_type: 'variable',
    budget_allocation: 50000,
    color_hex: '#6366f1',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await expensesService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalBudgetAllocated = categories.reduce((sum, c) => sum + (c.budget_allocation || 0), 0);
  const totalActualSpent = categories.reduce((sum, c) => sum + (c.spent_amount || 0), 0);
  const remainingTotal = Math.max(0, totalBudgetAllocated - totalActualSpent);
  const overallRate = totalBudgetAllocated > 0 ? (totalActualSpent / totalBudgetAllocated) * 100 : 0;

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name_ar) return;

    setSubmitting(true);
    try {
      await expensesService.addCategory(formData);
      setIsModalOpen(false);
      setFormData({
        code: '',
        name_ar: '',
        name_fr: '',
        charge_type: 'variable',
        budget_allocation: 50000,
        color_hex: '#6366f1',
      });
      await loadData();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ الباب الجديد');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-700" />
            <span>أبواب وتصنيفات النفقات ومخصصات الميزانية (Rubriques Budgétaires)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تبويب مراكز التكلفة المدرسية، مراقبة الميزانيات التقديرية، وتتبع نسب الاستهلاك الفعلي
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
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-700/20 active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة باب نفقة جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الميزانية المرصودة"
          value={formatMAD(totalBudgetAllocated)}
          subtitle="سقف النفقات السنوي المعتمد"
          icon={DollarSign}
          variant="default"
        />
        <StatCard
          title="إجمالي المصروف الفعلي"
          value={formatMAD(totalActualSpent)}
          subtitle={`المستهلك حتى الآن (${categories.length} أبواب)`}
          icon={TrendingDown}
          variant="expense"
        />
        <StatCard
          title="الرصيد المالي المتبقي"
          value={formatMAD(remainingTotal)}
          subtitle="هامش الأمان المالي السنوي"
          icon={ShieldCheck}
          variant="income"
        />
        <StatCard
          title="معدل استهلاك الميزانية"
          value={`${overallRate.toFixed(1)}%`}
          subtitle="نسبة الإنجاز المحاسبي"
          icon={PieChart}
          variant={overallRate > 80 ? 'expense' : overallRate > 60 ? 'pending' : 'income'}
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const rate = cat.consumption_rate || 0;
          const isHigh = rate >= 85;
          const isMid = rate >= 60 && rate < 85;

          return (
            <div
              key={cat.id}
              className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${cat.color_hex}15`,
                      color: cat.color_hex,
                      border: `1px solid ${cat.color_hex}30`,
                    }}
                  >
                    {cat.code}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      cat.charge_type === 'fixe'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-cyan-500/10 text-emerald-800 border border-cyan-500/20'
                    }`}
                  >
                    {cat.charge_type === 'fixe' ? 'تكلفة ثابتة (Fixe)' : 'تكلفة متغيرة (Variable)'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-0.5">{cat.name_ar}</h3>
                <p className="text-[11px] text-slate-500 mb-4">{cat.name_fr}</p>

                {/* Numbers */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 border border-slate-200/80 text-xs mb-4">
                  <div>
                    <span className="text-slate-500 block text-[10px]">الميزانية المرصودة:</span>
                    <span className="font-mono font-bold text-slate-800">{formatMAD(cat.budget_allocation)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">المصروف الفعلي:</span>
                    <span className="font-mono font-bold text-rose-600">{formatMAD(cat.spent_amount || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Status */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1.5 font-mono">
                  <span className="text-slate-500">نسبة الاستهلاك:</span>
                  <span className={`font-bold ${isHigh ? 'text-rose-600' : isMid ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {rate}%
                  </span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHigh ? 'bg-rose-500' : isMid ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, rate)}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                  <span>المتبقي: {formatMAD(cat.remaining_budget || 0)}</span>
                  {isHigh && (
                    <span className="text-rose-600 flex items-center gap-1 font-sans">
                      <AlertCircle className="w-3 h-3" /> تجاوز 85%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl p-6 text-slate-900 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold">إضافة باب نفقة وميزانية تقديرية جديدة</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1">رمز الباب (Code Unique)*</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: PEDAGOGIE"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">طبيعة التكلفة*</label>
                  <select
                    value={formData.charge_type}
                    onChange={(e) => setFormData({ ...formData, charge_type: e.target.value as 'fixe' | 'variable' })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="variable">تكلفة متغيرة (Charge Variable)</option>
                    <option value="fixe">تكلفة قارة/ثابتة (Charge Fixe)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">اسم الباب بالعربية*</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الأنشطة الموازية والرحلات التربوية"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">اسم الباب بالفرنسية (Libellé FR)</label>
                <input
                  type="text"
                  placeholder="ex: Activités parascolaires & sorties"
                  value={formData.name_fr}
                  onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1">الميزانية السنوية المرصودة (MAD)*</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={formData.budget_allocation}
                    onChange={(e) => setFormData({ ...formData, budget_allocation: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">لون التمييز (Color Code)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color_hex}
                      onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                      className="w-10 h-9 p-0.5 rounded-lg bg-white border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color_hex}
                      onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>
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
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-700/20 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'جاري الحفظ...' : 'حفظ الباب في الميزانية'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
