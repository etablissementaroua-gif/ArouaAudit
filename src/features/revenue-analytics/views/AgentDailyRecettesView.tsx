import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Printer, 
  Search, 
  Banknote, 
  Receipt, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  X 
} from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { revenueAnalyticsService } from '../services/revenueAnalytics.service';
import { RecetteDailyRecord } from '../models/revenue.types';

export const AgentDailyRecettesView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<RecetteDailyRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showClosingModal, setShowClosingModal] = useState<boolean>(false);

  useEffect(() => {
    loadDailyRecettes(selectedDate);
  }, [selectedDate]);

  const loadDailyRecettes = async (date: string) => {
    setLoading(true);
    try {
      const data = await revenueAnalyticsService.getDailyRecettes(date, 'agent');
      setRecords(data);
    } catch (err) {
      console.error('Error loading agent daily recettes:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
  const cashOnly = records.filter(r => r.payment_method === 'especes').reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">مداخيل وكلاء الصندوق (Recettes des Régisseurs)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              المرحلة 4: شبابيك الأداء اليومية
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            متابعة المقبوضات النقدية الصغيرة والوصولات المستلمة عبر أعوان وموظفي الصندوق وإجراء إغلاق الصندوق اليومي.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-slate-400">تاريخ اليومية:</span>
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white text-xs font-mono font-bold focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => setShowClosingModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            محضر إغلاق الصندوق (Clôture)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          title="إجمالي مقبوضات اليوم" 
          value={`${totalAmount.toLocaleString()} MAD`} 
          subtitle={`المستلم بتاريخ ${selectedDate}`} 
          icon={Banknote} 
          variant="income" 
        />
        <StatCard 
          title="المقبوضات النقدية (Espèces)" 
          value={`${cashOnly.toLocaleString()} MAD`} 
          subtitle="السيولة الجاهزة بالصندوق" 
          icon={Receipt} 
          variant="default" 
        />
        <StatCard 
          title="عدد الوصولات المسلمة" 
          value={`${records.length} وصولات`} 
          subtitle="معاملات مقيدة بنجاح" 
          icon={CheckCircle2} 
          variant="pending" 
        />
      </div>

      {/* Receipts Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">سجل المقبوضات اليومية لوكلاء الصندوق</h2>
          <span className="text-xs font-mono text-slate-400">بتاريخ: {selectedDate}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase">
              <tr>
                <th className="py-4 px-4">رقم الوصل والمرجع</th>
                <th className="py-4 px-3">البيان وطبيعة المدخول</th>
                <th className="py-4 px-3">عون / وكيل الصندوق</th>
                <th className="py-4 px-3 text-center">طريقة السداد</th>
                <th className="py-4 px-4 text-center font-bold text-emerald-400">المبلغ المستخلص</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-mono">
                    جاري تحميل يومية مقبوضات الوكلاء...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    لا توجد أي مقبوضات مسجلة لوكلاء الصندوق بتاريخ {selectedDate}.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                      {r.reference_number || r.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{r.description}</div>
                      <div className="text-[10px] text-slate-400">{r.category}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-medium">
                      {r.author_name}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                        {r.payment_method === 'especes' ? 'نقداً (Espèces)' : r.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-sm text-emerald-400">
                      {r.amount.toLocaleString()} MAD
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cloture de Caisse Modal */}
      {showClosingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">محضر إغلاق الصندوق اليومي (Procès-verbal de Clôture)</h3>
              </div>
              <button onClick={() => setShowClosingModal(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>المؤسسة:</span>
                  <span className="font-bold text-white">مجموعة مدارس أروى (ArouaAudit)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>تاريخ اليومية:</span>
                  <span className="font-mono text-white">{selectedDate}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>عدد العمليات المنجزة:</span>
                  <span className="font-mono text-white">{records.length} عمليات</span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-slate-800/80 pt-2 font-bold">
                  <span className="text-white">السيولة النقدية المستخلصة:</span>
                  <span className="font-mono text-emerald-400 text-sm">{cashOnly.toLocaleString()} MAD</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-center">
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 h-24 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400">توقيع وكيل الصندوق (Régisseur)</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 h-24 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400">تأشيرة المراقبة والتدقيق المالي</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowClosingModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  طباعة المحضر
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
