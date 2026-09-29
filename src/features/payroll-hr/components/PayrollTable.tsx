import React from 'react';
import { StaffPayrollSlip } from '../models/payrollModels';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { Check, Clock, AlertCircle } from 'lucide-react';

export const PayrollTable: React.FC<{ slips: StaffPayrollSlip[] }> = ({ slips }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/60 backdrop-blur-md">
      <table className="w-full text-sm text-right">
        <thead className="bg-slate-800/80 text-xs text-slate-500 border-b border-slate-700/60">
          <tr>
            <th className="px-4 py-3 text-right">الموظف / الإطار</th>
            <th className="px-4 py-3 text-right">الشهر</th>
            <th className="px-4 py-3 text-right">الراتب الأساسي</th>
            <th className="px-4 py-3 text-right">التسبيقات (Avances)</th>
            <th className="px-4 py-3 text-right">صافي الدفع (Net)</th>
            <th className="px-4 py-3 text-right">ديون عالقة (Sortants)</th>
            <th className="px-4 py-3 text-left">الحالة</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {slips.map(s => (
            <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
              <td className="px-4 py-3">
                <div className="font-semibold text-slate-800">{s.staff_name}</div>
                <div className="text-xs text-slate-500 font-mono">{s.role} - ID: {s.staff_id}</div>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-700">{s.month_year}</td>
              <td className="px-4 py-3 font-mono text-slate-700">{formatMAD(s.base_salary)}</td>
              <td className="px-4 py-3 font-mono text-amber-700">{formatMAD(s.avances_deduites)}</td>
              <td className="px-4 py-3 font-mono font-bold text-emerald-700">{formatMAD(s.net_payable)}</td>
              <td className="px-4 py-3 font-mono">
                {s.dettes_restantes > 0 ? (
                  <span className="text-rose-600 font-semibold">{formatMAD(s.dettes_restantes)}</span>
                ) : (
                  <span className="text-slate-600">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-left">
                {s.status === 'paye' && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-emerald-950/80 text-emerald-700 border border-emerald-500/20"><Check className="w-3.5 h-3.5" /> مدفوع</span>}
                {s.status === 'valide' && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-sky-950/80 text-sky-400 border border-sky-500/20"><Clock className="w-3.5 h-3.5" /> معتمد</span>}
                {s.status === 'brouillon' && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-slate-800 text-slate-500 border border-slate-700"><AlertCircle className="w-3.5 h-3.5" /> مسودة</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
