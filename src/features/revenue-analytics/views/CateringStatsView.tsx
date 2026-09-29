import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Plus, 
  Calendar, 
  ArrowDownLeft, 
  CheckCircle2, 
  ShieldCheck, 
  X, 
  Tag, 
  UserCheck 
} from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { revenueAnalyticsService } from '../services/revenueAnalytics.service';
import { CaisseAlimentation } from '../models/revenue.types';

export const CateringStatsView: React.FC = () => {
  const [alimentations, setAlimentations] = useState<CaisseAlimentation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formAmount, setFormAmount] = useState<number>(20000);
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formSource, setFormSource] = useState<string>('apport_personnel');
  const [formAgent, setFormAgent] = useState<string>('المسير العام');
  const [formMotif, setFormMotif] = useState<string>('تغذية سيولة الصندوق المركزية');
  const [formRef, setFormRef] = useState<string>('');
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadAlimentations();
  }, []);

  const loadAlimentations = async () => {
    setLoading(true);
    try {
      const data = await revenueAnalyticsService.getAlimentationsList();
      setAlimentations(data);
    } catch (err) {
      console.error('Error loading alimentations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlimentation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      await revenueAnalyticsService.recordAlimentation({
        amount: Number(formAmount) || 0,
        alimentation_date: formDate,
        source: formSource,
        agent_name: formAgent,
        motif: formMotif,
        destination_account: 'caisse_centrale',
        receipt_reference: formRef || undefined,
        academic_year: '2026/2027'
      });

      setIsModalOpen(false);
      await loadAlimentations();
      showToast(`تم إيداع تغذية بقيمة ${formAmount} MAD وتقييد مدخول فوري بالصندوق والخزينة`);
    } catch (err) {
      console.error('Record alimentation error:', err);
      alert('حدث خطأ أثناء تسجيل التغذية');
    } finally {
      setFormSubmitting(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const totalInjected = alimentations.reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ArrowDownLeft className="w-6 h-6 text-emerald-700" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">تغذية الصندوق ورأس المال التشغيلي (Alimentations de Caisse)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              المرحلة 4: ضخ السيولة المالية
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            سجل عمليات تزويد وضخ السيولة النقدية والبنكية في حسابات وصناديق المؤسسة مع المشغل التلقائي للصندوق.
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setFormAmount(20000);
            setFormMotif('تغذية سيولة الصندوق المركزية');
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          إيداع تغذية جديدة بالصندوق
        </button>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700/60 hover:text-emerald-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          title="إجمالي التغذيات المالية" 
          value={`${totalInjected.toLocaleString()} MAD`} 
          subtitle="سيولة مضافة إلى الصناديق" 
          icon={DollarSign} 
          variant="income" 
        />
        <StatCard 
          title="عدد عمليات التزويد" 
          value={`${alimentations.length} عمليات`} 
          subtitle="موثقة بسجلات التغذية" 
          icon={CheckCircle2} 
          variant="default" 
        />
        <StatCard 
          title="المشغل التلقائي للصندوق" 
          value="نشط ومربوط" 
          subtitle="تقييد Encaissement تلقائي" 
          icon={ShieldCheck} 
          variant="income" 
        />
      </div>

      {/* Alimentations Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden backdrop-blur-md">
        <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">سجل عمليات تزويد وتغذية الصندوق</h2>
          <span className="text-xs font-mono text-slate-500">سنة 2026/2027</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase">
              <tr>
                <th className="py-4 px-4">التاريخ والمرجع</th>
                <th className="py-4 px-3">مصدر التغذية</th>
                <th className="py-4 px-3">المودع / المسؤول</th>
                <th className="py-4 px-3">مبرر العملية (Motif)</th>
                <th className="py-4 px-4 text-center font-bold text-emerald-700">المبلغ المودع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-mono">
                    جاري تحميل سجل التغذيات...
                  </td>
                </tr>
              ) : (
                alimentations.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-slate-900">{a.alimentation_date}</div>
                      <div className="text-[10px] text-emerald-700">{a.receipt_reference || a.id.slice(0, 8)}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] border border-indigo-500/20 font-medium">
                        {a.source === 'apport_personnel' ? 'مساهمة شخصية (Apport)' :
                         a.source === 'virement_bancaire' ? 'تحويل بنكي' :
                         a.source === 'recouvrement' ? 'استرداد مالي' : a.source}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-slate-700 font-medium">
                      {a.agent_name}
                    </td>

                    <td className="py-3.5 px-3 text-white">
                      {a.motif}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-sm text-emerald-700">
                      +{a.amount.toLocaleString()} MAD
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Alimentation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">إيداع تغذية جديدة بالصندوق</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlimentation} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  مبلغ التغذية (MAD) *
                </label>
                <input 
                  type="number"
                  step="500"
                  min="500"
                  value={formAmount}
                  onChange={(e) => setFormAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs font-mono font-bold text-sm focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    تاريخ العملية
                  </label>
                  <input 
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs font-mono focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    مصدر التمويل
                  </label>
                  <select
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="apport_personnel">مساهمة شخصية (Apport)</option>
                    <option value="virement_bancaire">تحويل بنكي</option>
                    <option value="recouvrement">استرداد مالي</option>
                    <option value="autre">مصدر آخر</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  المودع / المسؤول
                </label>
                <input 
                  type="text"
                  value={formAgent}
                  onChange={(e) => setFormAgent(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  مبرر التغذية (Motif) *
                </label>
                <input 
                  type="text"
                  placeholder="مثال: تغذية الصندوق لمصاريف الانطلاق..."
                  value={formMotif}
                  onChange={(e) => setFormMotif(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  رقم المرجع أو الوصل (اختياري)
                </label>
                <input 
                  type="text"
                  placeholder="ALIM-..."
                  value={formRef}
                  onChange={(e) => setFormRef(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 text-[11px]">
                سيتم إضافة مدخول نقدي (Encaissement) فوراً في يومية الصندوق بمجرد الحفظ.
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/30 transition cursor-pointer"
                >
                  {formSubmitting ? 'جاري الإيداع...' : 'تأكيد وإيداع التغذية'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
