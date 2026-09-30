import React, { useState } from 'react';
import { useSync } from '../controllers/useSync';
import { SyncBatch } from '../models/syncModels';
import {
  RefreshCw, CheckCircle2, Clock, AlertTriangle, Layers, Database,
  Play, Wifi, WifiOff, ArrowDownToLine, FileCheck, FileX,
  ChevronDown, ChevronUp, Activity, BarChart3
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────
const formatDate = (iso?: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ar-MA', { dateStyle: 'short', timeStyle: 'short' });
};

const statusBadge = (status: SyncBatch['status']) => {
  const cfg: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    pending:     { label: 'بانتظار التنفيذ', cls: 'bg-amber-50 text-amber-800 border-amber-200',    icon: <Clock className="w-3 h-3" /> },
    in_progress: { label: 'جاري الاستيراد',  cls: 'bg-sky-50 text-sky-800 border-sky-200',          icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
    completed:   { label: 'مكتملة',          cls: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
    partial:     { label: 'جزئية',           cls: 'bg-orange-50 text-orange-800 border-orange-200', icon: <AlertTriangle className="w-3 h-3" /> },
    failed:      { label: 'فاشلة',           cls: 'bg-rose-50 text-rose-800 border-rose-200',       icon: <FileX className="w-3 h-3" /> },
  };
  const c = cfg[status] || cfg.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border font-semibold ${c.cls}`}>
      {c.icon}{c.label}
    </span>
  );
};

const phaseLabel = (phase?: string) => {
  const map: Record<string, string> = {
    fetching: 'جلب السجلات من المصدر…',
    validating: 'التحقق من صحة البيانات…',
    inserting: 'إدراج السجلات (Upsert)…',
    reconciling: 'التسوية المحاسبية…',
    done: 'اكتملت المزامنة بنجاح ✓',
    error: 'خطأ في المزامنة ✗',
  };
  return phase ? (map[phase] || phase) : '';
};

// ── Main Component ─────────────────────────────────────────────
export const ExternalSyncView: React.FC = () => {
  const {
    batches, overview, connectionStatus, auditLog,
    pendingStudents, pendingPayments,
    loading, isSyncing, syncProgress, syncErrors, lastSyncTimestamp, activeBatchId,
    refresh, triggerBatchImport
  } = useSync();

  const [activeTab, setActiveTab] = useState<'batches' | 'students' | 'payments' | 'audit'>('batches');
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  const isOnline = connectionStatus?.isConnected ?? true;
  const pendingBatchCount = batches.filter(b => b.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5 text-emerald-600" />
            مركز المزامنة والاستيراد الخارجي
            {pendingBatchCount > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {pendingBatchCount} دفعة جديدة
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            استيراد التلاميذ والدفعات من منظومة arouaschools بضمان عدم التكرار (Idempotent via Massar Code)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${isOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isOnline ? (connectionStatus?.supabaseOk ? 'Supabase متصل' : 'وضع تجريبي') : 'غير متصل'}
          </span>
          <button
            onClick={refresh}
            disabled={loading || isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'الدفعات المعلقة', value: overview.pendingBatches, icon: Clock, color: 'amber' },
          { label: 'تلاميذ بانتظار الاستيراد', value: pendingStudents.length, icon: Layers, color: 'sky' },
          { label: 'دفعات مالية معلقة', value: pendingPayments.length, icon: BarChart3, color: 'violet' },
          { label: 'سجلات متزامنة', value: overview.syncedCount, icon: CheckCircle2, color: 'emerald' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          const colorMap: Record<string, string> = {
            amber: 'bg-amber-500', sky: 'bg-sky-500', violet: 'bg-violet-500', emerald: 'bg-emerald-500'
          };
          const bgMap: Record<string, string> = {
            amber: 'bg-amber-50', sky: 'bg-sky-50', violet: 'bg-violet-50', emerald: 'bg-emerald-50'
          };
          return (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${bgMap[kpi.color]} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4.5 h-4.5 text-${kpi.color}-600`} style={{ width: 18, height: 18, color: `var(--${kpi.color}-600, #059669)` }} />
              </div>
              <div>
                <div className="text-xl font-black text-slate-900">{kpi.value}</div>
                <div className="text-xs text-slate-500">{kpi.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Active Sync Progress ── */}
      {isSyncing && syncProgress && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-emerald-800 flex items-center gap-2">
              <Activity className="w-4 h-4 animate-pulse" />
              {phaseLabel(syncProgress.phase)}
            </span>
            <span className="text-xs font-mono text-emerald-700">
              {syncProgress.processedCount} / {syncProgress.totalCount} ({syncProgress.percentage}%)
            </span>
          </div>
          <div className="w-full bg-emerald-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${syncProgress.percentage}%` }}
            />
          </div>
          {syncProgress.currentRecord && (
            <p className="text-xs text-emerald-700 font-mono truncate">
              جاري معالجة: {syncProgress.currentRecord}
            </p>
          )}
        </div>
      )}

      {/* ── Sync Errors ── */}
      {syncErrors.length > 0 && !isSyncing && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
          <p className="text-xs font-bold text-rose-700 mb-1">أخطاء في المزامنة ({syncErrors.length}):</p>
          <ul className="space-y-0.5">
            {syncErrors.map((e, i) => (
              <li key={i} className="text-xs text-rose-600 font-mono">{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-slate-200 bg-white rounded-t-xl px-2 pt-2">
        {[
          { key: 'batches', label: 'الدفعات المعلقة' },
          { key: 'students', label: 'تلاميذ بانتظار الاستيراد' },
          { key: 'payments', label: 'دفعات مالية' },
          { key: 'audit', label: 'سجل التدقيق' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
              activeTab === tab.key
                ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="bg-white rounded-b-xl border border-slate-200 border-t-0 overflow-hidden">

        {/* Batches Tab */}
        {activeTab === 'batches' && (
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-xs text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-right">رقم الدفعة</th>
                <th className="px-4 py-3 text-right">النوع</th>
                <th className="px-4 py-3 text-right">المصدر</th>
                <th className="px-4 py-3 text-right">السجلات</th>
                <th className="px-4 py-3 text-right">تاريخ الإنشاء</th>
                <th className="px-4 py-3 text-right">الحالة</th>
                <th className="px-4 py-3 text-left">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map(batch => (
                <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{batch.batch_ref}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                      <Database className="w-3.5 h-3.5 text-emerald-600" />
                      {batch.entity_type === 'student' ? 'تلاميذ' : batch.entity_type === 'payment' ? 'دفعات مالية' : batch.entity_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{batch.source_system}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    <span className="text-emerald-700 font-bold">{batch.imported_records}</span>
                    <span className="text-slate-400"> / {batch.total_records}</span>
                    {batch.failed_records > 0 && (
                      <span className="text-rose-600 font-bold ml-1">({batch.failed_records} ✗)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{formatDate(batch.created_at)}</td>
                  <td className="px-4 py-3">{statusBadge(batch.status)}</td>
                  <td className="px-4 py-3 text-left">
                    {batch.status === 'pending' && (
                      <button
                        onClick={() => triggerBatchImport(batch.id)}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {activeBatchId === batch.id && isSyncing
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : <Play className="w-3.5 h-3.5" />
                        }
                        {activeBatchId === batch.id && isSyncing ? 'جارٍ…' : 'بدء الاستيراد'}
                      </button>
                    )}
                    {batch.status === 'completed' && (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5" /> مكتمل
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-xs text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">رمز مسار</th>
                <th className="px-4 py-3">الاسم الكامل</th>
                <th className="px-4 py-3">المستوى</th>
                <th className="px-4 py-3">ولي الأمر</th>
                <th className="px-4 py-3">الواجب الشهري</th>
                <th className="px-4 py-3 text-left">الخدمات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingStudents.map((s, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-xs font-bold text-amber-700">{s.massar_code}</td>
                  <td className="px-4 py-2.5 font-bold text-slate-800">{s.full_name}</td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded text-xs font-bold">{s.academic_level}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">{s.guardian_name}</td>
                  <td className="px-4 py-2.5 font-mono text-emerald-700 font-bold text-xs">{s.tuition_monthly.toLocaleString('ar-MA')} MAD</td>
                  <td className="px-4 py-2.5 text-left">
                    <span className="flex gap-1">
                      {s.transport_subscribed && <span className="px-1.5 py-0.5 bg-violet-50 text-violet-700 rounded text-xs border border-violet-200">نقل</span>}
                      {s.canteen_subscribed && <span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded text-xs border border-orange-200">إطعام</span>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-xs text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">المرجع الخارجي</th>
                <th className="px-4 py-3">رمز مسار</th>
                <th className="px-4 py-3">التلميذ</th>
                <th className="px-4 py-3">المبلغ</th>
                <th className="px-4 py-3">طريقة الأداء</th>
                <th className="px-4 py-3">تاريخ الدفع</th>
                <th className="px-4 py-3 text-left">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingPayments.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-xs text-amber-700 font-bold">{p.external_ref}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{p.massar_code}</td>
                  <td className="px-4 py-2.5 font-bold text-slate-800">{p.student_name}</td>
                  <td className="px-4 py-2.5 font-mono text-emerald-700 font-black">{p.amount.toLocaleString('ar-MA')} MAD</td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded border bg-slate-50 text-slate-600 border-slate-200 font-semibold">
                      {p.payment_method === 'especes' ? 'نقد' : p.payment_method === 'cheque' ? 'شيك' : 'تحويل'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{formatDate(p.payment_date)}</td>
                  <td className="px-4 py-2.5 text-left">
                    {p.is_imported
                      ? <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/>مستورد</span>
                      : <span className="text-xs text-amber-600 font-semibold flex items-center gap-1"><Clock className="w-3 h-3"/>معلق</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          auditLog.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <FileCheck className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">لا توجد سجلات تدقيق بعد. قم بتنفيذ عملية مزامنة لبدء التسجيل.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-xs text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">الحدث</th>
                  <th className="px-4 py-3">النوع</th>
                  <th className="px-4 py-3">السجلات</th>
                  <th className="px-4 py-3">المسؤول</th>
                  <th className="px-4 py-3">التفاصيل</th>
                  <th className="px-4 py-3 text-left">التوقيت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLog.map(entry => {
                  const isOk = entry.action === 'IMPORT_SUCCESS';
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded border ${
                          isOk ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          entry.action === 'PARTIAL_IMPORT' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {isOk ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {entry.action === 'IMPORT_SUCCESS' ? 'استيراد ناجح' :
                           entry.action === 'PARTIAL_IMPORT' ? 'جزئي' :
                           entry.action === 'IMPORT_FAILED' ? 'فاشل' :
                           entry.action === 'SYNC_STARTED' ? 'بدأ' : entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">{entry.entity_type}</td>
                      <td className="px-4 py-2.5 font-mono text-sm font-bold text-emerald-700">{entry.records_count}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">{entry.performed_by}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 max-w-xs truncate">{entry.details}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-400 text-left">{formatDate(entry.timestamp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}
      </div>

      {/* Last sync info */}
      {lastSyncTimestamp && (
        <p className="text-xs text-slate-400 text-center">
          آخر مزامنة منجزة: <span className="font-mono font-bold text-emerald-600">{formatDate(lastSyncTimestamp)}</span>
        </p>
      )}
    </div>
  );
};
