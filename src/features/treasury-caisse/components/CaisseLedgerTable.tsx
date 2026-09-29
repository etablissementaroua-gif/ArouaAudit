import React from 'react';
import { CaisseTransaction } from '../models/caisseModels';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { formatDateFR } from '../../../shared/lib/dateUtils';
import { ArrowDownLeft, ArrowUpRight, Banknote, CreditCard, FileSpreadsheet } from 'lucide-react';

export const CaisseLedgerTable: React.FC<{ transactions: CaisseTransaction[] }> = ({ transactions }) => {
  const getBadge = (m: string) => {
    if (m === 'especes') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-emerald-950/80 text-emerald-700 border border-emerald-500/20"><Banknote className="w-3 h-3" /> نقد</span>;
    }
    if (m === 'cheque') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-amber-950/80 text-amber-700 border border-amber-500/20"><FileSpreadsheet className="w-3 h-3" /> شيك</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-sky-950/80 text-sky-400 border border-sky-500/20"><CreditCard className="w-3 h-3" /> تحويل</span>;
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/60 backdrop-blur-md">
      <table className="w-full text-sm text-right">
        <thead className="bg-slate-50 text-xs text-slate-700 font-bold border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-right">التاريخ</th>
            <th className="px-4 py-3 text-right">النوع</th>
            <th className="px-4 py-3 text-right">البيان والفئة</th>
            <th className="px-4 py-3 text-right">وسيلة الدفع</th>
            <th className="px-4 py-3 text-right">المرجع</th>
            <th className="px-4 py-3 text-left">المبلغ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {transactions.map(t => (
            <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
              <td className="px-4 py-3 text-slate-700 font-mono text-xs">{formatDateFR(t.transaction_date)}</td>
              <td className="px-4 py-3">
                {t.type === 'encaissement' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs"><ArrowDownLeft className="w-4 h-4" /> قبض</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-xs"><ArrowUpRight className="w-4 h-4" /> صرف</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-slate-800">{t.description}</div>
                <div className="text-xs text-slate-500">{t.category}</div>
              </td>
              <td className="px-4 py-3">{getBadge(t.payment_method)}</td>
              <td className="px-4 py-3 text-slate-500 font-mono text-xs">{t.reference_number || '-'}</td>
              <td className="px-4 py-3 text-left font-mono font-bold">
                <span className={t.type === 'encaissement' ? 'text-emerald-700' : 'text-rose-600'}>
                  {t.type === 'encaissement' ? '+' : '-'}{formatMAD(t.amount)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
