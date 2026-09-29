import React from 'react';
import { usePayroll } from '../controllers/usePayroll';
import { PayrollTable } from '../components/PayrollTable';
import { StatCard } from '../../../shared/components/StatCard';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { Users, CreditCard, Banknote, AlertTriangle, RefreshCw, FileText } from 'lucide-react';

export const PayrollView: React.FC = () => {
  const { slips, summary, loading, refresh } = usePayroll();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">إدارة الأجور والرواتب والموارد البشرية (Gestion de la Paie)</h2>
          <p className="text-xs text-slate-500 mt-1">احتساب الكتلة الأجرية، التسبيقات المالية، ومتابعة ديون الموظفين المغادرين العالقة</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refresh()} className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-800 transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-950/40 transition">
            <FileText className="w-4 h-4" /> إصدار مسير رواتب جديد
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="الكتلة الأجرية الصافية" value={formatMAD(summary.totalSalariesNet)} subtitle="المستحق دفعه للموظفين" icon={CreditCard} variant="expense" />
        <StatCard title="إجمالي التسبيقات (Avances)" value={formatMAD(summary.totalAvances)} subtitle="المقتطعة من رواتب الشهر" icon={Banknote} variant="pending" />
        <StatCard title="ديون الموظفين المغادرين" value={formatMAD(summary.totalDepartedDebts)} subtitle="ديون عالقة للمتابعة" icon={AlertTriangle} variant={summary.totalDepartedDebts > 0 ? 'expense' : 'default'} />
        <StatCard title="عدد كشوف الرواتب" value={summary.slipsCount + ' كشف'} subtitle="المسجلة خلال الفترة" icon={Users} variant="default" />
      </div>

      <PayrollTable slips={slips} />
    </div>
  );
};
