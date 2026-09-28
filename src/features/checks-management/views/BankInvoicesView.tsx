import React, { useState, useEffect } from 'react';
import { checksManagementService } from '../services/checksManagement.service';
import { BankReconciliationItem } from '../models/check.types';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { 
  Scale, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Landmark, 
  RefreshCw,
  FileCheck,
  Building
} from 'lucide-react';

export const BankInvoicesView: React.FC = () => {
  const [items, setItems] = useState<BankReconciliationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankBalance, setBankBalance] = useState(0);
  const [bookBalance, setBookBalance] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);

  const loadData = async () => {
    setLoading(true);
    const summary = await checksManagementService.getBankReconciliationSummary();
    setItems(summary.items);
    setBankBalance(summary.bankBalance);
    setBookBalance(summary.bookBalance);
    setPendingAmount(summary.pendingChecksAmount);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const concordanceRate = bankBalance > 0 ? Math.round((bookBalance / bankBalance) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">كشوفات الحساب والمطابقة البنكية</h1>
            <p className="text-slate-400 text-sm">مقارنة كشوفات الحسابات البنكية مع الشيكات المصروفة وتدقيق فروقات التسوية والمقاصة (Rapprochement Bancaire)</p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>تحديث المطابقة اللحظية</span>
        </button>
      </div>

      {/* KPI Reconciliation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-emerald-500/20 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-emerald-400">الرصيد الفعلي بالبنك</span>
            <Landmark className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{formatMAD(bankBalance)}</p>
          <span className="text-xs text-slate-500">حسب الكشوفات البنكية الأخيرة</span>
        </div>

        <div className="bg-slate-900 border border-indigo-500/20 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-indigo-400">الرصيد الدفتري بالمؤسسة</span>
            <Building className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{formatMAD(bookBalance)}</p>
          <span className="text-xs text-slate-500">بعد خصم الشيكات قيد التداول</span>
        </div>

        <div className="bg-slate-900 border border-amber-500/20 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-amber-400">شيكات قيد المقاصة والتداول</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 font-mono">{formatMAD(pendingAmount)}</p>
          <span className="text-xs text-slate-500">فروق التوقيت البنكي (En Circulation)</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-slate-400">نسبة التطابق البنكي</span>
            <FileCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-cyan-400 font-mono">{concordanceRate}%</p>
          <span className="text-xs text-slate-500">مؤشر الانضباط والرقابة المالية</span>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-2xl text-indigo-300 text-xs flex items-center gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-indigo-400" />
        <p>
          المطابقة البنكية تضمن توافق كافة الشيكات المودعة بالحوافظ مع كشوفات الحساب المسلمة من الأبناك، وتبرير فروق التوقيت الناتجة عن مدة المقاصة (Délai de compensation interbancaire).
        </p>
      </div>

      {/* Reconciliation Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <h3 className="font-bold text-white text-base">جدول المقارنة اللحظية والعمليات المقاصة</h3>
          <span className="text-xs text-slate-400 font-mono">شهر شتنبر 2026</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-4">تاريخ العملية</th>
                <th className="py-4 px-4">المرجع</th>
                <th className="py-4 px-4">بيان المعاملة</th>
                <th className="py-4 px-4">مدين (Débit)</th>
                <th className="py-4 px-4">دائن (Crédit)</th>
                <th className="py-4 px-4">الرصيد بعد العملية</th>
                <th className="py-4 px-4 text-center">حالة المطابقة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">جاري احتساب ومقارنة العمليات...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">لا توجد عمليات كشف بنكي مسجلة</td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 font-mono text-xs text-slate-300">
                      {item.date}
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-white tracking-wider">
                      {item.reference}
                    </td>

                    <td className="py-4 px-4 text-slate-300 text-xs">
                      {item.description}
                    </td>

                    <td className="py-4 px-4 font-mono text-xs text-rose-400">
                      {item.debit > 0 ? formatMAD(item.debit) : '---'}
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-emerald-400 text-xs">
                      {item.credit > 0 ? formatMAD(item.credit) : '---'}
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-white text-xs">
                      {formatMAD(item.bank_balance)}
                    </td>

                    <td className="py-4 px-4 text-center">
                      {item.is_matched ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>مطابق ومقاص</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
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
