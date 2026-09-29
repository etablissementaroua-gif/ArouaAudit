import React, { useState, useEffect } from 'react';
import { checksManagementService } from '../services/checksManagement.service';
import { BankReconciliationItem } from '../models/check.types';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { 
  Scale, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Landmark, 
  RefreshCw,
  FileCheck,
  Building
} from 'lucide-react';

export const BankInvoicesView: React.FC = () => {
  const [items, setItems] = useState<BankReconciliationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [bankBalance, setBankBalance] = useState<number>(0);
  const [bookBalance, setBookBalance] = useState<number>(0);
  const [pendingAmount, setPendingAmount] = useState<number>(0);

  const loadData = async () => {
    try {
      setLoading(true);
      const summary = await checksManagementService.getBankReconciliationSummary();
      if (summary) {
        setItems(summary.items || []);
        setBankBalance(summary.bankBalance || 0);
        setBookBalance(summary.bookBalance || 0);
        setPendingAmount(summary.pendingChecksAmount || 0);
      }
    } catch (err) {
      console.error('Error loading bank reconciliation data:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const concordanceRate = bankBalance > 0 ? Math.round((bookBalance / bankBalance) * 100) : 100;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">كشوفات الحساب والمطابقة البنكية</h1>
            <p className="text-slate-600 text-sm mt-0.5">مقارنة كشوفات الحسابات البنكية مع الشيكات المصروفة وتدقيق فروقات التسوية والمقاصة (Rapprochement Bancaire)</p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 bg-white hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث المطابقة اللحظية</span>
        </button>
      </div>

      {/* KPI Reconciliation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">الرصيد الفعلي بالبنك</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 font-mono">{formatMAD(bankBalance)}</p>
          <span className="text-xs text-slate-500 font-medium">حسب الكشوفات البنكية الأخيرة</span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">الرصيد الدفتري بالمؤسسة</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{formatMAD(bookBalance)}</p>
          <span className="text-xs text-slate-500 font-medium">بعد خصم الشيكات قيد التداول</span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">شيكات قيد المقاصة والتداول</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 font-mono">{formatMAD(pendingAmount)}</p>
          <span className="text-xs text-slate-500 font-medium">فروق التوقيت البنكي (En Circulation)</span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-700">نسبة التطابق البنكي</span>
            <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-cyan-700 font-mono">{concordanceRate}%</p>
          <span className="text-xs text-slate-500 font-medium">مؤشر الانضباط والرقابة المالية</span>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl text-indigo-900 text-xs flex items-center gap-3 shadow-xs">
        <AlertCircle className="w-5 h-5 shrink-0 text-indigo-600" />
        <p className="leading-relaxed">
          المطابقة البنكية تضمن توافق كافة الشيكات المودعة بالحوافظ مع كشوفات الحساب المسلمة من الأبناك، وتبرير فروق التوقيت الناتجة عن مدة المقاصة (Délai de compensation interbancaire).
        </p>
      </div>

      {/* Reconciliation Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">جدول المقارنة اللحظية والعمليات المقاصة</h3>
          <span className="text-xs text-slate-500 font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200">شهر شتنبر 2026</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-700 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-4">تاريخ العملية</th>
                <th className="py-4 px-4">المرجع</th>
                <th className="py-4 px-4">بيان المعاملة</th>
                <th className="py-4 px-4">مدين (Débit)</th>
                <th className="py-4 px-4">دائن (Crédit)</th>
                <th className="py-4 px-4">الرصيد بعد العملية</th>
                <th className="py-4 px-4 text-center">حالة المطابقة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">جاري احتساب ومقارنة العمليات...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">لا توجد عمليات كشف بنكي مسجلة</td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-mono text-xs text-slate-600">
                      {item.date}
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-slate-900 tracking-wider">
                      {item.reference}
                    </td>

                    <td className="py-4 px-4 text-slate-700 text-xs font-medium">
                      {item.description}
                    </td>

                    <td className="py-4 px-4 font-mono text-xs font-bold text-rose-600">
                      {item.debit > 0 ? formatMAD(item.debit) : '---'}
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-emerald-600 text-xs">
                      {item.credit > 0 ? formatMAD(item.credit) : '---'}
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-slate-900 text-xs">
                      {formatMAD(item.bank_balance)}
                    </td>

                    <td className="py-4 px-4 text-center">
                      {item.is_matched ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>مطابق ومقاص</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5" />
                          <span>شيك قيد المقاصة</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BankInvoicesView;