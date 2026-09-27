import React from 'react';
import { usePreInscription } from '../controllers/usePreInscription';
import { StatCard } from '../../../shared/components/StatCard';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { formatDateFR } from '../../../shared/lib/dateUtils';
import { UserCheck, FilePlus2, CheckCircle2 } from 'lucide-react';

export const PreInscriptionView: React.FC = () => {
  const { candidates } = usePreInscription();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">إدارة طلبات التسجيل الأولي (Pré-Inscriptions)</h2>
          <p className="text-xs text-slate-400 mt-1">متابعة ملفات الترشح، المقابلات التقييمية، ورسوم فتح الملفات التمهيدية</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="إجمالي طلبات التسجيل الأولي" value={candidates.length.toString()} subtitle="المسجلة للموسم الدراسي" icon={FilePlus2} variant="default" />
        <StatCard title="الملفات المقبولة" value="1 ملف" subtitle="جاهزة للتسجيل النهائي" icon={CheckCircle2} variant="income" />
        <StatCard title="رسوم الملفات المحصلة" value={formatMAD(candidates.length * 500)} subtitle="رسوم فحص الملفات" icon={UserCheck} variant="pending" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-800/80 text-xs text-slate-400 border-b border-slate-700/60">
            <tr>
              <th className="px-4 py-3 text-right">اسم المترشح</th>
              <th className="px-4 py-3 text-right">المستوى الدراسي المطلوب</th>
              <th className="px-4 py-3 text-right">هاتف ولي الأمر</th>
              <th className="px-4 py-3 text-right">تاريخ تقديم الطلب</th>
              <th className="px-4 py-3 text-right">رسوم الملف</th>
              <th className="px-4 py-3 text-left">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {candidates.map(c => (
              <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 text-white font-semibold">{c.candidate_name}</td>
                <td className="px-4 py-3 text-slate-300">{c.grade_level}</td>
                <td className="px-4 py-3 text-slate-400 font-mono text-xs">{c.parent_phone}</td>
                <td className="px-4 py-3 text-slate-400 font-mono text-xs">{formatDateFR(c.application_date)}</td>
                <td className="px-4 py-3 font-mono font-bold text-emerald-400">{formatMAD(c.application_fee)}</td>
                <td className="px-4 py-3 text-left">
                  {c.status === 'accepted' && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-emerald-950/80 text-emerald-400 border border-emerald-500/20">مقبول</span>}
                  {c.status === 'interview_scheduled' && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-sky-950/80 text-sky-400 border border-sky-500/20">موعد مقابلة</span>}
                  {c.status === 'pending' && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-amber-950/80 text-amber-400 border border-amber-500/20">قيد الدراسة</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
