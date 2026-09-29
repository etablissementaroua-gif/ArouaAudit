import React from 'react';
import { StatCard } from '../../../shared/components/StatCard';
import { Users, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';

export const MappedStaffView: React.FC = () => {
  const staff = [
    { id: 'STF-01', name: 'رشيد العلمي', role: 'أستاذ الرياضيات', cycle: 'ثانوي تأهيلي', cnss: '18992011', status: 'مربوط بنجاح' },
    { id: 'STF-02', name: 'حميد الناصري', role: 'سائق حافلة النقل', cycle: 'الخدمات اللوجستية', cnss: '22883344', status: 'مربوط بنجاح' },
    { id: 'STF-03', name: 'سناء بنكيران', role: 'أستاذة الفرنسية', cycle: 'إعدادي', cnss: '44556677', status: 'مربوط بنجاح' },
    { id: 'STF-04', name: 'فاطمة الزهراء', role: 'مسؤولة الصندوق والإدارة', cycle: 'الإدارة العامة', cnss: '99887711', status: 'مربوط بنجاح' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">الموظفون المعتمدون (Personnel Mappé - arouaschools)</h2>
          <p className="text-xs text-slate-500 mt-1">تتبع الأطر التربوية والإدارية المربوطة تلقائياً عبر المعرفات المرجعية</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي الأطر المعتمدة" value="4 أطر" subtitle="مسجلون بالمنظومة" icon={Users} variant="default" />
        <StatCard title="المطابقة مع arouaschools" value="100%" subtitle="اتساق كامل للبيانات" icon={UserCheck} variant="income" />
        <StatCard title="المسجلون في CNSS" value="4 أطر" subtitle="التغطية الاجتماعية" icon={Sparkles} variant="pending" />
        <StatCard title="ديون الموظفين المغادرين" value="2,400 MAD" subtitle="تحت المتابعة" icon={ShieldAlert} variant="expense" />
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
          <tbody className="divide-y divide-slate-800/60">
            {staff.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-bold text-slate-900">{s.name}</div>
                  <div className="font-mono text-xs text-emerald-700">{s.id}</div>
                </td>
                <td className="px-4 py-3 text-slate-700">{s.role}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{s.cycle}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{s.cnss}</td>
                <td className="px-4 py-3 text-left">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                    🟢 {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
