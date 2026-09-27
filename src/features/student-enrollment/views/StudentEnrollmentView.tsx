import React from 'react';
import { useEnrollment } from '../controllers/useEnrollment';
import { StatCard } from '../../../shared/components/StatCard';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { GraduationCap, Wallet, CreditCard, Bus } from 'lucide-react';

export const StudentEnrollmentView: React.FC = () => {
  const { students } = useEnrollment();
  const totalTuition = students.reduce((acc, s) => acc + s.annual_tuition, 0);
  const totalPaid = students.reduce((acc, s) => acc + s.paid_amount, 0);
  const totalRemaining = students.reduce((acc, s) => acc + s.remaining_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">التسجيل المالي للتلاميذ والأقساط (Inscriptions & Échéanciers)</h2>
          <p className="text-xs text-slate-400 mt-1">تتبع الرسوم الدراسية السنوية، خطط السداد المجزأة، واشتراكات النقل والإطعام</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي الرسوم المعتمدة" value={formatMAD(totalTuition)} subtitle="حجم الرسوم السنوية" icon={Wallet} variant="default" />
        <StatCard title="المبالغ المستخلصة" value={formatMAD(totalPaid)} subtitle="المسددة فعلياً" icon={CreditCard} variant="income" />
        <StatCard title="المستحقات المتبقية" value={formatMAD(totalRemaining)} subtitle="أقساط بانتظار السداد" icon={GraduationCap} variant="expense" />
        <StatCard title="المشتركون بالنقل" value={students.filter(s => s.transport_active).length + ' تلميذ'} subtitle="خدمة النقل المدرسي" icon={Bus} variant="pending" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-800/80 text-xs text-slate-400 border-b border-slate-700/60">
            <tr>
              <th className="px-4 py-3 text-right">اسم التلميذ</th>
              <th className="px-4 py-3 text-right">القسم / المستوى</th>
              <th className="px-4 py-3 text-right">الرسوم السنوية</th>
              <th className="px-4 py-3 text-right">المسدد (Payé)</th>
              <th className="px-4 py-3 text-right">المتبقي (Reste)</th>
              <th className="px-4 py-3 text-left">خدمات إضافية</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {students.map(s => (
              <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 text-white font-semibold">{s.student_name}</td>
                <td className="px-4 py-3 text-slate-300 font-mono text-xs">{s.class_name}</td>
                <td className="px-4 py-3 font-mono text-slate-200">{formatMAD(s.annual_tuition)}</td>
                <td className="px-4 py-3 font-mono font-bold text-emerald-400">{formatMAD(s.paid_amount)}</td>
                <td className="px-4 py-3 font-mono font-bold">
                  {s.remaining_amount > 0 ? (
                    <span className="text-rose-400">{formatMAD(s.remaining_amount)}</span>
                  ) : (
                    <span className="text-emerald-400">خالص (Soldé)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-left flex gap-1.5 justify-end">
                  {s.transport_active && <span className="px-2 py-0.5 rounded text-xs bg-amber-950/80 text-amber-400 border border-amber-500/20">نقل</span>}
                  {s.canteen_active && <span className="px-2 py-0.5 rounded text-xs bg-blue-950/80 text-blue-400 border border-blue-500/20">إطعام</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
