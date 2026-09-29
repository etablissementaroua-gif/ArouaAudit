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
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">إدارة طلبات التسجيل الأولي (Pré-Inscriptions)</h2>
          <p className="text-xs text-slate-500 mt-1">متابعة ملفات الترشح، المقابلات التقييمية، ورسوم فتح الملفات التمهيدية</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="إجمالي طلبات التسجيل الأولي" value={candidates.length.toString()} subtitle="المسجلة للموسم الدراسي" icon={FilePlus2} variant="default" />
        <StatCard title="الملفات المقبولة" value="1 ملف" subtitle="جاهزة للتسجيل النهائي" icon={CheckCircle2} variant="income" />
        <StatCard title="رسوم الملفات المحصلة" value={formatMAD(candidates.length * 500)} subtitle="رسوم فحص الملفات" icon={UserCheck} variant="pending" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/60 backdrop-blur-md">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-50 text-xs text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-right">اسم المترشح</th>
              <th className="px-4 py-3 text-right">المستوى الدراسي المطلوب</th>
              <th className="px-4 py-3 text-right">هاتف ولي الأمر</th>
              <th className="px-4 py-3 text-right">تاريخ تقديم الطلب</th>
              <th className="px-4 py-3 text-right">رسوم الملف</th>
              <th className="px-4 py-3 text-left">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {candidates.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3 text-slate-900 font-bold">{c.candidate_name}</td>
                <td className="px-4 py-3 text-slate-700">{c.grade_level}</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{c.parent_phone}</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{formatDateFR(c.application_date)}</td>
                <td className="px-4 py-3 font-mono font-bold text-emerald-700">{formatMAD(c.application_fee)}</td>
                <td className="px-4 py-3 text-left">
                  {c.status === 'accepted' && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">مقبول</span>}
                  {c.status === 'interview_scheduled' && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-sky-50 text-sky-800 border border-sky-200 font-bold">موعد مقابلة</span>}
                  {c.status === 'pending' && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-amber-50 text-amber-800 border border-amber-200 font-bold">قيد الدراسة</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
