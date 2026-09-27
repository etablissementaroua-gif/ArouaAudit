import React from 'react';
import { useChecks } from '../controllers/useChecks';
import { ChecksTable } from '../components/ChecksTable';
import { StatCard } from '../../../shared/components/StatCard';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { FileSpreadsheet, CheckCircle2, AlertOctagon, RefreshCw, Plus } from 'lucide-react';

export const ChecksPortfolioView: React.FC = () => {
  const { checks, summary, loading, refresh } = useChecks();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">محفظة الشيكات (Portefeuille des Chèques)</h2>
          <p className="text-xs text-slate-400 mt-1">تتبع استحقاقات الشيكات، الشيكات قيد الانتظار، والمحصلة، وإشعارات الرجوع</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refresh()} className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-lg shadow-amber-950/40 transition">
            <Plus className="w-4 h-4" /> إضافة شيك للمحفظة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="الشيكات قيد التحصيل" value={formatMAD(summary.totalPending)} subtitle="تنتظر تاريخ الاستحقاق" icon={FileSpreadsheet} variant="pending" />
        <StatCard title="الشيكات المحصلة" value={formatMAD(summary.totalEncaisse)} subtitle="أودعت بالرصيد البنكي" icon={CheckCircle2} variant="income" />
        <StatCard title="الشيكات المرفوضة (Impayés)" value={formatMAD(summary.totalRejete)} subtitle="تحتاج للمتابعة القانونية" icon={AlertOctagon} variant="expense" />
        <StatCard title="تنبيهات الاستحقاق العاجلة" value={summary.overdueCount + ' شيكات'} subtitle="تجاوزت تاريخ الصرف" icon={AlertOctagon} variant={summary.overdueCount > 0 ? 'expense' : 'default'} />
      </div>

      <ChecksTable checks={checks} />
    </div>
  );
};
