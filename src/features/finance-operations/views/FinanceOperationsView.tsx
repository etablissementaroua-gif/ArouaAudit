import React from 'react';
import { StatCard } from '../../../shared/components/StatCard';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { FileSpreadsheet, AlertTriangle, Gift, DollarSign, Clock } from 'lucide-react';

export const FinanceOperationsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">القوائم والعمليات المالية (Opérations Financières & Impayés)</h2>
          <p className="text-xs text-slate-500 mt-1">تتبع المتأخرات، التخفيضات الممنوحة، الإعفاءات الدراسية، والأرصدة الزائدة</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="المتأخرات العالقة (Impayés)" value="0,00 MAD" subtitle="0 ملفات بانتظار التحصيل" icon={AlertTriangle} variant="expense" />
        <StatCard title="التخفيضات الممنوحة (Remises)" value="0,00 MAD" subtitle="تخفيضات الأخوة والتميز" icon={Gift} variant="pending" />
        <StatCard title="الإعفاءات الدراسية" value="0.00 MAD" subtitle="حالات استثنائية" icon={FileSpreadsheet} variant="default" />
        <StatCard title="الأرصدة الزائدة (Trop-perçus)" value="0,00 MAD" subtitle="أرصدة دائنة لأولياء الأمور" icon={DollarSign} variant="income" />
      </div>

      <div className="p-5 rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-md">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-700" />
          قائمة ملفات المتأخرات العاجلة (Dossiers en Impayé)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="text-xs text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2 text-right">التلميذ ورمز مسار</th>
                <th className="py-2 text-right">المستوى</th>
                <th className="py-2 text-right">الرسوم المستحقة</th>
                <th className="py-2 text-right">المتبقي (الذمة)</th>
                <th className="py-2 text-left">الإجراء المالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                  لا توجد ملفات متأخرات عالقة حالياً (0 ملفات)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
