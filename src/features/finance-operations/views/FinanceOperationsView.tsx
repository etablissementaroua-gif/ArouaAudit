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
        <StatCard title="المتأخرات العالقة (Impayés)" value="56,500 MAD" subtitle="3 ملفات بانتظار التحصيل" icon={AlertTriangle} variant="expense" />
        <StatCard title="التخفيضات الممنوحة (Remises)" value="12,000 MAD" subtitle="تخفيضات الأخوة والتميز" icon={Gift} variant="pending" />
        <StatCard title="الإعفاءات الدراسية" value="0.00 MAD" subtitle="حالات استثنائية" icon={FileSpreadsheet} variant="default" />
        <StatCard title="الأرصدة الزائدة (Trop-perçus)" value="3,200 MAD" subtitle="أرصدة دائنة لأولياء الأمور" icon={DollarSign} variant="income" />
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
                <td className="py-3 font-bold text-slate-900">حمزة الشرايبي (R134567890)</td>
                <td className="py-3 text-slate-700">2Bac SM-A</td>
                <td className="py-3 font-mono text-slate-800">41,500 MAD</td>
                <td className="py-3 font-mono font-bold text-rose-600">21,500 MAD</td>
                <td className="py-3 text-left">
                  <span className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">إشعار تذكير 2</span>
                </td>
              </tr>
              <tr>
                <td className="py-3 font-bold text-slate-900">سامي الإدريسي العلمي (K138765432)</td>
                <td className="py-3 text-slate-700">3Collège-2</td>
                <td className="py-3 font-mono text-slate-800">29,000 MAD</td>
                <td className="py-3 font-mono font-bold text-rose-600">15,000 MAD</td>
                <td className="py-3 text-left">
                  <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">قيد المتابعة</span>
                </td>
              </tr>
              <tr>
                <td className="py-3 font-bold text-slate-900">هبة بلقاسم (G149922110)</td>
                <td className="py-3 text-slate-700">1Bac ScExp</td>
                <td className="py-3 font-mono text-slate-800">39,500 MAD</td>
                <td className="py-3 font-mono font-bold text-rose-600">20,000 MAD</td>
                <td className="py-3 text-left">
                  <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">قيد المتابعة</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
