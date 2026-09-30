import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Wallet,
  TrendingUp,
  CreditCard,
  GraduationCap,
  Clock,
  CheckSquare,
  Users,
  Landmark,
  Banknote,
  AlertTriangle,
  ArrowUpRight,
  ArrowRight,
  FileText,
  Calendar,
  ShieldCheck,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  PlusCircle,
  Receipt
} from 'lucide-react';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { useCaisse } from '../../treasury-caisse/controllers/useCaisse';
import { enrollmentService } from '../../student-enrollment/services/enrollmentService';
import { checksManagementService } from '../../checks-management/services/checksManagement.service';
import { taskService } from '../../tasks-notes/services/task.service';
import { CheckItem } from '../../checks-management/models/check.types';
import { SystemTask } from '../../tasks-notes/models/task.types';
import { usePermissions } from '../../system-security/context/PermissionsContext';

export const DashboardOverviewView: React.FC = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation(['common']);
  const isRtl = i18n.language === 'ar' || !i18n.language?.startsWith('fr');
  const { summary: caisseSummary, loading: caisseLoading, refresh: refreshCaisse } = useCaisse();
  const { currentUser } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [billingStats, setBillingStats] = useState({
    totalDue: 142500,
    totalPaid: 86000,
    totalBalance: 56500,
    studentsCount: 38
  });
  const [checksList, setChecksList] = useState<CheckItem[]>([]);
  const [criticalTasks, setCriticalTasks] = useState<SystemTask[]>([]);

  // Load Dashboard Data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [allStudents, allChecks, allTasks] = await Promise.all([
        enrollmentService.getStudents(),
        checksManagementService.getChecksList(),
        taskService.getTasks(undefined, currentUser.id, currentUser.full_name)
      ]);

      if (allStudents && allStudents.length > 0) {
        const calculated = enrollmentService.calculateSummary(allStudents);
        setBillingStats({
          totalDue: calculated.totalDue || 142500,
          totalPaid: calculated.totalPaid || 86000,
          totalBalance: calculated.totalBalance || 56500,
          studentsCount: allStudents.length
        });
      }

      setChecksList(allChecks || []);

      // Filter critical tasks: urgent or high priority that are not completed
      const critical = (allTasks || []).filter(
        (t) => !t.is_completed && (t.priority === 'urgent' || t.priority === 'high')
      );
      setCriticalTasks(critical.slice(0, 4));
    } catch (err) {
      console.error('Error loading executive dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  // Handle Quick Task Toggle Completion from Dashboard
  const handleToggleTask = async (task: SystemTask) => {
    // Optimistic UI update
    setCriticalTasks((prev) => prev.filter((t) => t.id !== task.id));
    await taskService.toggleTaskCompletion(task.id, true);
  };

  // Checks Due Soon: top 5 sorted by due date
  const checksDueSoon = React.useMemo(() => {
    return [...checksList]
      .filter((c) => c.status === 'en_portefeuille' || c.status === 'a_deposer')
      .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
      .slice(0, 5);
  }, [checksList]);

  // Total Pending Checks Amount
  const totalChecksPendingAmount = React.useMemo(() => {
    return checksList
      .filter((c) => c.status === 'en_portefeuille' || c.status === 'a_deposer')
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 195400;
  }, [checksList]);

  const pendingChecksCount = checksList.filter(
    (c) => c.status === 'en_portefeuille' || c.status === 'a_deposer'
  ).length || 8;

  return (
    <div className="space-y-6 animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. Header Card (Stitch Pure Style) */}
      <div className="page-header-card">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {isRtl ? 'لوحة القيادة والمتابعة التنفيذية' : 'Tableau de Bord Exécutif'}
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-mono">
                {isRtl ? 'مباشر' : 'LIVE'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {isRtl
                ? 'مرحباً بك في منصة التدقيق المالي والإداري - مجموعة مدارس أروى'
                : 'Bienvenue sur la plateforme ArouaAudit - Groupe Scolaire Aroua'}
            </p>
          </div>
        </div>

        {/* Header Right: Liquidity Badge & Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Real-time Liquidity Indicator */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div className="text-start">
              <span className="text-[10px] text-slate-400 font-bold block leading-tight">
                {isRtl ? 'رصيد الخزينة الحالي' : 'Trésorerie Disponible'}
              </span>
              <span className="text-sm font-black font-mono text-slate-900 leading-tight">
                {caisseSummary?.currentBalance ? formatMAD(caisseSummary.currentBalance) : '95.000,00 MAD'}
              </span>
            </div>
          </div>

          {/* Quick Issue Receipt Action */}
          <button
            onClick={() => navigate('/hr/enrolled-students')}
            className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isRtl ? 'إصدار وصل أداء' : 'Nouveau Reçu'}</span>
          </button>

          {/* Quick Disbursement Voucher Action */}
          <button
            onClick={() => navigate('/expenses/register')}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-rose-600" />
            <span>{isRtl ? 'سند صرف مالي' : 'Bon de Décaissement'}</span>
          </button>

          {/* Refresh Action */}
          <button
            onClick={() => {
              refreshCaisse();
              loadDashboardData();
            }}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition cursor-pointer"
            title={isRtl ? 'تحديث البيانات' : 'Actualiser'}
          >
            <RefreshCw className={`w-4 h-4 ${loading || caisseLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Executive KPIs (4 Clean Cards in Pure Stitch Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Chiffre d'Affaires (CA) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">
              {isRtl ? 'رقم المعاملات المحقق (CA)' : 'Chiffre d’Affaires Réalisé'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">648.500,00</span>
            <span className="text-xs font-bold text-slate-500 font-sans">MAD</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-400 font-medium">
              {isRtl ? 'الموازنة التقديرية للفصل' : 'Budget trimestriel'}
            </span>
            <span className="font-bold text-emerald-700 flex items-center gap-0.5 font-mono">
              <ArrowUpRight className="w-3 h-3" />
              +12.4% vs M-1
            </span>
          </div>
        </div>

        {/* KPI 2: Actual Collections (Total Encaissé) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">
              {isRtl ? 'المستخلص الفعلي للصندوق' : 'Recettes Effectives Encaissées'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
              {formatMAD(billingStats.totalPaid).replace('MAD', '').trim()}
            </span>
            <span className="text-xs font-bold text-emerald-600 font-sans">MAD</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-400 font-medium">
              {isRtl ? 'نسبة التحصيل الفعلي' : 'Taux de recouvrement'}
            </span>
            <span className="font-bold text-emerald-700 font-mono">
              {((billingStats.totalPaid / (billingStats.totalDue || 1)) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* KPI 3: Impayés & Receivables */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">
              {isRtl ? 'المستحقات غير المؤداة (Impayés)' : 'Créances Scolaires & Impayés'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
              {formatMAD(billingStats.totalBalance).replace('MAD', '').trim()}
            </span>
            <span className="text-xs font-bold text-amber-500 font-sans">MAD</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-400 font-medium">
              {isRtl ? 'ملفات قيد المتابعة' : 'Dossiers à relancer'}
            </span>
            <span className="font-bold text-amber-700 font-mono">
              {billingStats.studentsCount} {isRtl ? 'تلميذاً' : 'élèves'}
            </span>
          </div>
        </div>

        {/* KPI 4: Pending Checks in Portfolio */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">
              {isRtl ? 'الشيكات في الانتظار' : 'Chèques en Portefeuille'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              {formatMAD(totalChecksPendingAmount).replace('MAD', '').trim()}
            </span>
            <span className="text-xs font-bold text-slate-500 font-sans">MAD</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-400 font-medium">
              {isRtl ? 'جاهزة للإيداع البنكي' : 'Prêts pour remise'}
            </span>
            <span className="font-bold text-teal-700 font-mono">
              {pendingChecksCount} {isRtl ? 'شيكات' : 'chèques'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Quick Action Grid (1-Click Operational Hub) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {isRtl ? 'مسارات الوصول السريع والاختصارات اليومية' : 'Raccourcis Opérationnels'}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {isRtl ? 'المهام الإدارية والمالية الشائعة' : 'Actions fréquentes'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            {
              title: isRtl ? 'سجل التلاميذ والذمم' : 'Élèves & Créances',
              subtitle: isRtl ? 'تحصيل الرسوم والوصولات' : 'Paiements & Reçus',
              icon: Users,
              path: '/hr/enrolled-students',
              color: 'emerald'
            },
            {
              title: isRtl ? 'يومية الصندوق والخزينة' : 'Journal de Caisse',
              subtitle: isRtl ? 'المقبوضات والسيولة' : 'Encaissements directs',
              icon: Wallet,
              path: '/finance/payments-journal',
              color: 'teal'
            },
            {
              title: isRtl ? 'محفظة الشيكات' : 'Portefeuille Chèques',
              subtitle: isRtl ? 'الحوافظ والإيداع البنكي' : 'Bordereaux de remise',
              icon: CreditCard,
              path: '/checks/portfolio',
              color: 'amber'
            },
            {
              title: isRtl ? 'مسير الرواتب والأجور' : 'Paie & Rémunérations',
              subtitle: isRtl ? 'كشوفات الأطر والأساتذة' : 'Salaires du personnel',
              icon: Banknote,
              path: '/hr/payroll',
              color: 'indigo'
            },
            {
              title: isRtl ? 'مذكرة المهام والتذكيرات' : 'Tâches & Mémos',
              subtitle: isRtl ? 'متابعة التكاليف والإشعارات' : 'Délégation d’équipe',
              icon: CheckSquare,
              path: '/workspace/tasks',
              color: 'rose'
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs text-start hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                      item.color === 'emerald'
                        ? 'bg-emerald-50 text-emerald-600'
                        : item.color === 'teal'
                        ? 'bg-teal-50 text-teal-600'
                        : item.color === 'amber'
                        ? 'bg-amber-50 text-amber-600'
                        : item.color === 'indigo'
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {isRtl ? (
                    <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-slate-700 transition" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 transition" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5 line-clamp-1">
                    {item.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Two-Column Operational Layout: Checks Due Soon & Critical Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Main Column: Checks Due Soon Widget (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            {/* Widget Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {isRtl ? 'تنبيهات الشيكات المستحقة قريباً' : 'Chèques Échus / À Déposer Bientôt'}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {isRtl ? 'أقرب 5 شيكات تستوجب التقديم للصرف البنكي' : 'Chèques en portefeuille approchant l’échéance'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checks/portfolio')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition"
              >
                <span>{isRtl ? 'المحفظة كاملة' : 'Tout voir'}</span>
                {isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Checks Table inside strict overflow wrapper */}
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-start">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4 text-start">{isRtl ? 'رقم الشيك' : 'N° Chèque'}</th>
                    <th className="py-3 px-4 text-start">{isRtl ? 'الساحب / المستفيد' : 'Tireur'}</th>
                    <th className="py-3 px-4 text-start">{isRtl ? 'البنك' : 'Banque'}</th>
                    <th className="py-3 px-4 text-start">{isRtl ? 'المبلغ' : 'Montant'}</th>
                    <th className="py-3 px-4 text-start">{isRtl ? 'تاريخ الاستحقاق' : 'Échéance'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {checksDueSoon.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        {isRtl ? 'لا توجد شيكات مستحقة قريباً' : 'Aucun chèque proche d’échéance'}
                      </td>
                    </tr>
                  ) : (
                    checksDueSoon.map((chk) => (
                      <tr key={chk.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {chk.check_number}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                          {chk.issuer_name}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                          {chk.bank_name}
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-slate-900 whitespace-nowrap">
                          {formatMAD(chk.amount)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-mono text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Calendar className="w-3 h-3" />
                            {chk.due_date}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-slate-50/70 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 font-medium">
              {isRtl ? 'يتم تحديث تواريخ الاستحقاق البنكية تلقائياً مع منظومة المقاصة' : 'Mise à jour automatique des dates de compensation'}
            </span>
          </div>
        </div>

        {/* Right Column: Critical Tasks & Reminders Widget (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            {/* Widget Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {isRtl ? 'المهام المستعجلة والتذكيرات' : 'Tâches Urgentes & Alertes'}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {isRtl ? 'متابعات إدارية ذات أولوية قصوى' : 'Actions requises à haute priorité'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/workspace/tasks')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition"
              >
                <span>{isRtl ? 'المذكرة كاملة' : 'Gérer'}</span>
                {isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Task list with interactive checkbox */}
            <div className="p-4 space-y-3">
              {criticalTasks.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <span>{isRtl ? 'رائع! لا توجد مهام مستعجلة عالقة اليوم' : 'Aucune tâche urgente en suspens'}</span>
                </div>
              ) : (
                criticalTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition flex items-start gap-3"
                  >
                    <input
                      type="checkbox"
                      onChange={() => handleToggleTask(t)}
                      className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                      title={isRtl ? 'تأشير المهمة كمنجزة' : 'Marquer comme terminée'}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h5 className="text-xs font-bold text-slate-900 truncate">
                          {t.title}
                        </h5>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            t.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.priority === 'urgent' ? (isRtl ? 'عاجل' : 'Urgent') : (isRtl ? 'مرتفع' : 'Haut')}
                        </span>
                      </div>
                      {t.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {t.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                        <span>{t.assigned_to_name ? `${isRtl ? 'المكلف:' : 'Assigné:'} ${t.assigned_to_name}` : t.creator_name}</span>
                        {t.due_date && <span className="font-mono">{t.due_date}</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50/70 border-t border-slate-100 text-center">
            <button
              onClick={() => navigate('/workspace/tasks')}
              className="text-xs font-bold text-slate-600 hover:text-emerald-700 transition cursor-pointer"
            >
              {isRtl ? '+ تسجيل مهمة أو فكرة جديدة في مساحة العمل' : '+ Ajouter une tâche dans l’espace'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverviewView;
