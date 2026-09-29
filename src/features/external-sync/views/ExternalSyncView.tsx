import React from 'react';
import { useSync } from '../controllers/useSync';
import { StatCard } from '../../../shared/components/StatCard';
import { formatDateFR } from '../../../shared/lib/dateUtils';
import { RefreshCw, CheckCircle2, Clock, AlertTriangle, Layers, Database } from 'lucide-react';

export const ExternalSyncView: React.FC = () => {
  const { mappings, overview, loading, refresh } = useSync();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">مركز المزامنة والربط الخارجي (External Sync Center)</h2>
          <p className="text-xs text-slate-500 mt-1">مطابقة التلاميذ والموظفين والرسوم عبر المعرف المرجعي external_source_id وضمان اتساق البيانات</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refresh()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-white font-medium text-xs border border-slate-200 transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            بدء فحص المزامنة الحية
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي السجلات المربوطة" value={overview.totalMapped.toString()} subtitle="مطابقة للمصادر الخارجية" icon={Layers} variant="default" />
        <StatCard title="متزامنة بنجاح (100%)" value={overview.syncedCount.toString()} subtitle="بيانات متطابقة كلياً" icon={CheckCircle2} variant="income" />
        <StatCard title="بانتظار المزامنة" value={overview.pendingCount.toString()} subtitle="تحديثات معلقة" icon={Clock} variant="pending" />
        <StatCard title="تضاربات البيانات (Conflicts)" value={overview.conflictCount.toString()} subtitle="تحتاج لتدخل يدوي" icon={AlertTriangle} variant={overview.conflictCount > 0 ? 'expense' : 'default'} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/60 backdrop-blur-md">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-50 text-xs text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-right">نوع الكيان</th>
              <th className="px-4 py-3 text-right">المعرف المحلي (Local ID)</th>
              <th className="px-4 py-3 text-right">المعرف الخارجي (External ID)</th>
              <th className="px-4 py-3 text-right">تاريخ آخر مطابقة</th>
              <th className="px-4 py-3 text-left">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mappings.map(m => (
              <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3 text-slate-800 font-medium">
                  <span className="inline-flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-emerald-700" /> {m.entity_type}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{m.local_id}</td>
                <td className="px-4 py-3 font-mono text-xs font-bold text-amber-700">{m.external_source_id}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{formatDateFR(m.last_synced_at)}</td>
                <td className="px-4 py-3 text-left">
                  {m.sync_status === 'synced' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold"><CheckCircle2 className="w-3 h-3" /> متزامن</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-amber-50 text-amber-800 border border-amber-200 font-bold"><Clock className="w-3 h-3" /> قيد المزامنة</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
