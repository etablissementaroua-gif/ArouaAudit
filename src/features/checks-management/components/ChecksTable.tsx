import React from 'react';
import { CheckRecord } from '../models/checkModels';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { formatDateFR, isDateOverdue, daysUntil } from '../../../shared/lib/dateUtils';
import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';

export const ChecksTable: React.FC<{ checks: CheckRecord[] }> = ({ checks }) => {
  const getStatusBadge = (status: string, dueDate: string) => {
    if (status === 'encaisse') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-emerald-950/80 text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> تم التحصيل</span>;
    }
    if (status === 'rejete') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-rose-950/80 text-rose-400 border border-rose-500/20"><XCircle className="w-3.5 h-3.5" /> مرفوض / مرجع</span>;
    }
    const overdue = isDateOverdue(dueDate);
    if (overdue) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-red-950/80 text-red-400 border border-red-500/30 animate-pulse"><AlertTriangle className="w-3.5 h-3.5" /> متأخر الاستحقاق</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-amber-950/80 text-amber-400 border border-amber-500/20"><Clock className="w-3.5 h-3.5" /> قيد التحصيل ({daysUntil(dueDate)} يوم)</span>;
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
      <table className="w-full text-sm text-right">
        <thead className="bg-slate-800/80 text-xs text-slate-400 border-b border-slate-700/60">
          <tr>
            <th className="px-4 py-3 text-right">رقم الشيك</th>
            <th className="px-4 py-3 text-right">البنك الساحب</th>
            <th className="px-4 py-3 text-right">الساحب / ولي الأمر</th>
            <th className="px-4 py-3 text-right">تاريخ الاستحقاق</th>
            <th className="px-4 py-3 text-right">الحالة</th>
            <th className="px-4 py-3 text-left">المبلغ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {checks.map(c => (
            <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-indigo-400 font-semibold">{c.check_number}</td>
              <td className="px-4 py-3 text-slate-300 font-medium">{c.bank_name}</td>
              <td className="px-4 py-3 text-slate-200">
                <div>{c.drawer_name}</div>
                {c.rejection_reason && <div className="text-xs text-rose-400 mt-0.5">{c.rejection_reason}</div>}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-300">{formatDateFR(c.due_date)}</td>
              <td className="px-4 py-3">{getStatusBadge(c.status, c.due_date)}</td>
              <td className="px-4 py-3 text-left font-mono font-bold text-white">{formatMAD(c.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
