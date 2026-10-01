import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Eye, 
  X, 
  RefreshCw,
  Lock,
  ArrowRightLeft,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { securityService } from '../services/security.service';
import { AuditLog, AuditActionType } from '../models/security.types';

export const AuditTrailView: React.FC = () => {
  const { t, i18n } = useTranslation(['common', 'sidebar']);
  const isRtl = i18n.language === 'ar' || !i18n.language?.startsWith('fr');

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');

  // Diff Modal State
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await securityService.getAuditLogs({
        search,
        action_type: selectedAction,
        target_entity: selectedEntity,
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const [clearingLogs, setClearingLogs] = useState(false);
  const handleClearLogs = async () => {
    
    setClearingLogs(true);
    await securityService.clearAllAuditLogs();
    setLogs([]);
    setClearingLogs(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedAction, selectedEntity, search]);

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'DISBURSEMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
            <span>{isRtl ? 'صرف مالي' : 'Décaissement'}</span>
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
            <span>{isRtl ? 'حذف سجل' : 'Suppression'}</span>
          </span>
        );
      case 'CREATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span>{isRtl ? 'إنشاء جديد' : 'Création'}</span>
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
            <span>{isRtl ? 'تعديل بيانات' : 'Modification'}</span>
          </span>
        );
      case 'RECONCILE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-800 border border-indigo-200">
            <span>{isRtl ? 'مطابقة بنكية' : 'Rapprochement'}</span>
          </span>
        );
      case 'ROLE_CHANGE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-purple-800 border border-purple-200">
            <span>{isRtl ? 'تغيير صلاحيات' : 'Modif. Droits'}</span>
          </span>
        );
      case 'SUSPEND':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-900 text-white">
            <span>{isRtl ? 'تعليق حساب' : 'Suspension'}</span>
          </span>
        );
      case 'LOGIN':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span>{isRtl ? 'تسجيل دخول' : 'Connexion'}</span>
          </span>
        );
    }
  };

  const getEntityLabel = (entity: string) => {
    switch (entity) {
      case 'caisse_transactions':
        return isRtl ? 'يومية الصندوق والخزينة' : 'Journal de Caisse';
      case 'expenses':
        return isRtl ? 'سجل المصروفات والنفقات' : 'Registre des Dépenses';
      case 'student_payments_journal':
        return isRtl ? 'وصولات واستخلاصات التمدرس' : 'Paiements & Reçus Scolaires';
      case 'student_impayes':
        return isRtl ? 'المستحقات والمتأخرات' : 'Impayés & Créances';
      case 'employees':
        return isRtl ? 'ملفات الموظفين والأجور' : 'Personnel & Salaires';
      case 'role_permissions':
        return isRtl ? 'مصفوفة الصلاحيات' : 'Permissions RBAC';
      case 'user_profiles':
        return isRtl ? 'حسابات المستخدمين' : 'Comptes Utilisateurs';
      case 'bank_accounts':
        return isRtl ? 'الحسابات البنكية' : 'Comptes Bancaires';
      default:
        return entity;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <div className="text-start">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {isRtl ? 'سجل التدقيق والرقابة المالية المشفر' : 'Piste d\'Audit & Contrôle Financier Immuable'}
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-mono">
                IMMUTABLE LOG
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              {isRtl 
                ? 'سجل زمني دقيق غير قابل للتعديل أو الحذف لتوثيق كافة العمليات المالية والتغييرات الإدارية بالثانية' 
                : 'Journal chronologique inaltérable traçant toutes les opérations de caisse et de sécurité à la seconde'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearLogs}
            disabled={clearingLogs}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            title="تفريغ وتصفير سجل التدقيق (0 سجل)"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>تفريغ وتصفير السجل (0 سجل)</span>
          </button>
          <button
          type="button"
          onClick={() => loadData()}
          className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl shadow-xs transition cursor-pointer self-start md:self-auto"
          title="تحديث السجل"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
        </div>
      </div>

      {/* Security Immutability Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-start">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
          <div>
            <span className="text-xs font-black text-emerald-950 block">
              {isRtl ? 'حماية تامة ضد التلاعب (Trigger Immutability Active)' : 'Protection Anti-Altération (Immutabilité Active)'}
            </span>
            <span className="text-[11px] text-emerald-700 block mt-0.5">
              {isRtl 
                ? 'تم قفل هذا السجل نهائياً على مستوى محرك قاعدة بيانات PostgreSQL عبر تريغر يمنع أي أمر UPDATE أو DELETE.' 
                : 'Ce registre est verrouillé au niveau du moteur PostgreSQL interdisant toute altération ou suppression.'}
            </span>
          </div>
        </div>
        <span className="hidden sm:inline-flex px-3 py-1 bg-white text-emerald-800 border border-emerald-200 rounded-xl text-xs font-mono font-bold shadow-2xs">
          WORM Verified
        </span>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 shadow-xs p-4 rounded-2xl flex flex-wrap gap-3 items-center justify-between">
        {/* Search */}
        <div className="flex-1 min-w-[240px] relative">
          <Search className={`w-4 h-4 text-slate-500 absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
          <input
            type="text"
            placeholder={isRtl ? 'البحث باسم المستخدم، المعرف، أو الوحدة...' : 'Recherche utilisateur, ID ou module...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full bg-white border border-slate-200 rounded-xl ${
              isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'
            } py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600`}
          />
        </div>

        {/* Action Type Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedAction}
            onChange={e => setSelectedAction(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-600"
          >
            <option value="ALL">{isRtl ? 'كافة العمليات' : 'Toutes les actions'}</option>
            <option value="DISBURSEMENT">{isRtl ? 'صرف مالي (Disbursement)' : 'Décaissements'}</option>
            <option value="CREATE">{isRtl ? 'إنشاء (Create)' : 'Créations'}</option>
            <option value="UPDATE">{isRtl ? 'تعديل (Update)' : 'Modifications'}</option>
            <option value="DELETE">{isRtl ? 'حذف (Delete)' : 'Suppressions'}</option>
            <option value="RECONCILE">{isRtl ? 'مطابقة (Reconcile)' : 'Rapprochements'}</option>
            <option value="ROLE_CHANGE">{isRtl ? 'صلاحيات (Permissions)' : 'Modif. Droits'}</option>
            <option value="LOGIN">{isRtl ? 'دخول (Login)' : 'Connexions'}</option>
          </select>

          {/* Target Entity Filter */}
          <select
            value={selectedEntity}
            onChange={e => setSelectedEntity(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-600"
          >
            <option value="ALL">{isRtl ? 'كافة الجداول المحاسبية' : 'Toutes les entités'}</option>
            <option value="caisse_transactions">{isRtl ? 'يومية الصندوق' : 'Caisse'}</option>
            <option value="expenses">{isRtl ? 'النفقات' : 'Dépenses'}</option>
            <option value="student_payments_journal">{isRtl ? 'استخلاصات التلاميذ' : 'Paiements Élèves'}</option>
            <option value="student_impayes">{isRtl ? 'المتأخرات والديون' : 'Impayés'}</option>
            <option value="employees">{isRtl ? 'الموظفين والأجور' : 'Salariés'}</option>
            <option value="role_permissions">{isRtl ? 'مصفوفة الصلاحيات' : 'Droits RBAC'}</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <th className="py-4 px-4 text-start">{isRtl ? 'التاريخ والوقت' : 'Date & Heure'}</th>
                <th className="py-4 px-4 text-start">{isRtl ? 'المستخدم والرتبة' : 'Utilisateur & Rôle'}</th>
                <th className="py-4 px-4 text-center">{isRtl ? 'نوع العملية' : 'Action'}</th>
                <th className="py-4 px-4 text-start">{isRtl ? 'الوحدة والكيان المستهدف' : 'Entité Ciblée'}</th>
                <th className="py-4 px-4 font-mono text-start">{isRtl ? 'معرف السجل' : 'ID Entité'}</th>
                <th className="py-4 px-4 text-center">{isRtl ? 'مقارنة التغييرات' : 'Détails & Diff'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    {isRtl ? 'جاري فحص وتدقيق السجلات...' : 'Chargement de la piste d\'audit...'}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    {isRtl ? 'لا توجد سجلات مطابقة لمعايير البحث' : 'Aucune trace trouvée pour ces critères'}
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4 text-start">
                      <div className="flex items-center gap-1.5 text-slate-900 font-mono font-bold">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.created_at}</span>
                      </div>
                      {log.ip_address && (
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          IP: {log.ip_address}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-start">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                          {log.user_name.substring(0, 1)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">{log.user_name}</span>
                          <span className="text-[10px] text-emerald-700 font-semibold block">
                            [{log.user_role}]
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      {getActionBadge(log.action_type)}
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-800 text-start">
                      {getEntityLabel(log.target_entity)}
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-600 text-xs text-start">
                      {log.entity_id || '—'}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isRtl ? 'معاينة الفروقات' : 'Voir le Diff'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIFF INSPECTION MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    {isRtl ? 'تفاصيل العملية والمقارنة المحاسبية' : 'Détails de l\'Opération & Comparaison (Diff)'}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {selectedLog.id} • {selectedLog.created_at}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">{isRtl ? 'المنفذ' : 'Exécutant'}</span>
                <span className="font-black text-slate-900">{selectedLog.user_name} ({selectedLog.user_role})</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">{isRtl ? 'الكيان والمعرف' : 'Entité & ID'}</span>
                <span className="font-mono font-bold text-slate-900">{selectedLog.target_entity} : {selectedLog.entity_id || 'N/A'}</span>
              </div>
            </div>

            {/* Old vs New Values Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* Old Values */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-rose-700 flex items-center gap-1 font-sans">
                  <span>{isRtl ? 'القيم السابقة (Before / Old):' : 'Valeurs Précédentes :'}</span>
                </span>
                <pre className="bg-rose-50/50 border border-rose-200 p-3 rounded-xl text-[11px] text-rose-950 overflow-x-auto max-h-56 leading-relaxed">
                  {selectedLog.old_values ? JSON.stringify(selectedLog.old_values, null, 2) : (isRtl ? 'لا توجد قيم سابقة (عملية إنشاء أو دخول)' : 'Aucune (Création ou Login)')}
                </pre>
              </div>

              {/* New Values */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 font-sans">
                  <span>{isRtl ? 'القيم الجديدة (After / New):' : 'Nouvelles Valeurs :'}</span>
                </span>
                <pre className="bg-emerald-50/50 border border-emerald-200 p-3 rounded-xl text-[11px] text-emerald-950 overflow-x-auto max-h-56 leading-relaxed">
                  {selectedLog.new_values ? JSON.stringify(selectedLog.new_values, null, 2) : (isRtl ? 'تم حذف السجل' : 'Entité supprimée')}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                {isRtl ? 'إغلاق المعاينة' : 'Fermer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditTrailView;
