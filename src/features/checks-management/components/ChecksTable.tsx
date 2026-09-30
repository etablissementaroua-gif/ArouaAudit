import React from 'react';
import { CheckRecord } from '../models/check.types';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { formatDateFR, isDateOverdue, daysUntil } from '../../../shared/lib/dateUtils';
import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';

export const ChecksTable: React.FC<{ checks: CheckRecord[] }> = ({ checks }) => {
  const getStatusBadge = (status: string, dueDate: string) => {
    if (status === 'encaisse') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> تم التحصيل</span>;
    }
    if (status === 'rejete') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-rose-50 text-rose-700 border border-rose-200"><XCircle className="w-3.5 h-3.5" /> مرفوض / مرجع</span>;
    }
    const overdue = isDateOverdue(dueDate);
    if (overdue) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-red-50 text-red-700 border border-red-300 animate-pulse"><AlertTriangle className="w-3.5 h-3.5" /> متأخر الاستحقاق</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3.5 h-3.5" /> قيد التحصيل ({daysUntil(dueDate)} يوم)</span>;
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      <table className="w-full text-sm text-right">
        <thead className="bg-slate-50/90 text-xs text-slate-700 font-bold border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-right">رقم الشيك</th>
            <th className="px-4 py-3 text-right">البنك الساحب</th>
            <th className="px-4 py-3 text-right">الساحب / ولي الأمر</th>
            <th className="px-4 py-3 text-right">تاريخ الاستحقاق</th>
            <th className="px-4 py-3 text-right">الحالة</th>
            <th className="px-4 py-3 text-left">المبلغ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {checks.map(c => (
            <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-indigo-700 font-bold">{c.check_number}</td>
              <td className="px-4 py-3 text-slate-800 font-semibold">{c.bank_name}</td>
              <td className="px-4 py-3 text-slate-900 font-medium">
                <div>{c.drawer_name}</div>
                {c.rejection_reason && <div className="text-xs text-rose-400 mt-0.5">{c.rejection_reason}</div>}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-600">{formatDateFR(c.due_date)}</td>
              <td className="px-4 py-3">{getStatusBadge(c.status, c.due_date)}</td>
              <td className="px-4 py-3 text-left font-mono font-bold text-slate-900 font-bold">{formatMAD(c.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
