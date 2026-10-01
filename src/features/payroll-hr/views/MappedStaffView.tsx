import React from 'react';
import { StatCard } from '../../../shared/components/StatCard';
import { Users, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';

export const MappedStaffView: React.FC = () => {
  const staff: any[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">الموظفون المعتمدون (Personnel Mappé - arouaschools)</h2>
          <p className="text-xs text-slate-500 mt-1">تتبع الأطر التربوية والإدارية المربوطة تلقائياً عبر المعرفات المرجعية</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي الأطر المعتمدة" value="0 أطر" subtitle="مسجلون بالمنظومة" icon={Users} variant="default" />
        <StatCard title="المطابقة مع arouaschools" value="0%" subtitle="اتساق كامل للبيانات" icon={UserCheck} variant="income" />
        <StatCard title="المسجلون في CNSS" value="0 أطر" subtitle="التغطية الاجتماعية" icon={Sparkles} variant="pending" />
        <StatCard title="ديون الموظفين المغادرين" value="0,00 MAD" subtitle="تحت المتابعة" icon={ShieldAlert} variant="expense" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/60 backdrop-blur-md">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-50 text-xs text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-right">المعرف والموظف</th>
              <th className="px-4 py-3 text-right">المهمة / المنصب</th>
              <th className="px-4 py-3 text-right">السلك</th>
              <th className="px-4 py-3 text-right">رقم CNSS</th>
              <th className="px-4 py-3 text-left">حالة المزامنة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staff.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                  لا توجد أطر مربوطة حالياً
                </td>
              </tr>
            ) : (
              staff.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{s.name}</div>
                    <div className="font-mono text-xs text-emerald-700">{s.id}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{s.role}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{s.cycle}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{s.cnss}</td>
                  <td className="px-4 py-3 text-left">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
