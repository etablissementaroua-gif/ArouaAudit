import React, { useState, useEffect } from 'react';
import { checksManagementService } from '../services/checksManagement.service';
import { CheckItem, CheckFilterOptions, CheckStatus, CreateCheckDTO } from '../models/check.types';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { formatDateFR, isDateOverdue, daysUntil } from '../../../shared/lib/dateUtils';
import { 
  FileSpreadsheet, 
  Search, 
  Plus, 
  Filter, 
  CheckCircle2, 
  AlertOctagon, 
  Clock, 
  ArrowUpRight, 
  RotateCcw, 
  Ban, 
  Check, 
  X, 
  AlertCircle,
  Building,
  User,
  GraduationCap
} from 'lucide-react';

export const ChecksPortfolioView: React.FC = () => {
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CheckFilterOptions>({
    search: '',
    status: 'all',
    bank_name: '',
    due_range: 'all'
  });

  // Modals state
  const [isNewCheckModalOpen, setIsNewCheckModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedCheckForReject, setSelectedCheckForReject] = useState<CheckItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('انعدام المؤونة الكافية في الحساب (Défaut de provision)');

  const [newCheck, setNewCheck] = useState<CreateCheckDTO>({
    check_number: '',
    bank_name: 'Attijariwafa Bank',
    issuer_name: '',
    student_id: '',
    beneficiary: 'Ets Aroua',
    amount: 0,
    due_date: new Date().toISOString().split('T')[0]
  });
  const [formError, setFormError] = useState('');

  const loadChecks = async () => {
    setLoading(true);
    const data = await checksManagementService.getChecksList(filters);
    setChecks(data);
    setLoading(false);
  };

  useEffect(() => {
    loadChecks();
  }, [filters]);

  const stats = checksManagementService.getCheckStats(checks);

  const handleStatusChange = async (
    checkId: string, 
    newStatus: CheckStatus, 
    extra?: { clearance_date?: string; rejection_reason?: string }
  ) => {
    await checksManagementService.updateCheckStatus(checkId, newStatus, extra);
    loadChecks();
  };

  const handleOpenReject = (chk: CheckItem) => {
    setSelectedCheckForReject(chk);
    setRejectionReason('انعدام المؤونة الكافية في الحساب (Défaut de provision)');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedCheckForReject) return;
    await handleStatusChange(selectedCheckForReject.id, 'rejete', {
      rejection_reason: rejectionReason
    });
    setIsRejectModalOpen(false);
    setSelectedCheckForReject(null);
  };

  const handleCreateCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheck.check_number || !newCheck.issuer_name || newCheck.amount <= 0 || !newCheck.due_date) {
      setFormError('يرجى ملء جميع الحقول المطلوبة والتأكد من صحة المبلغ');
      return;
    }

    try {
      await checksManagementService.registerCheck(newCheck);
      setIsNewCheckModalOpen(false);
      setNewCheck({
        check_number: '',
        bank_name: 'Attijariwafa Bank',
        issuer_name: '',
        student_id: '',
        beneficiary: 'Ets Aroua',
        amount: 0,
        due_date: new Date().toISOString().split('T')[0]
      });
      setFormError('');
      loadChecks();
    } catch {
      setFormError('حدث خطأ أثناء تسجيل الشيك');
    }
  };

  const getStatusBadge = (status: CheckStatus, dueDate: string) => {
    switch (status) {
      case 'encaisse':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>مصروف بالبنك</span>
          </span>
        );
      case 'rejete':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>شيك راجع (Impayé)</span>
          </span>
        );
      case 'remis':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 border border-indigo-500/30">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>أودع بالحافظة</span>
          </span>
        );
      case 'a_deposer':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>حان موعد الإيداع</span>
          </span>
        );
      case 'restitue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-500 border border-slate-700">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تم الإرجاع</span>
          </span>
        );
      default:
        const overdue = isDateOverdue(dueDate);
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            overdue 
              ? 'bg-amber-50 text-amber-700 border border-amber-200 border-amber-500/30' 
              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{overdue ? 'مستحق بالخزنة' : 'في الخزنة'}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">محفظة الشيكات والكمبيالات</h1>
              <p className="text-slate-500 text-sm">متابعة الشيكات المدرسية، مواعيد استحقاقها، الصرف البنكي، وتدقيق الشيكات الراجعة</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsNewCheckModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-bold px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          <span>تسجيل شيك جديد بالمحفظة</span>
        </button>
      </div>

      {/* Financial Status KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 shadow-xs p-4 rounded-xl">
          <span className="text-xs text-slate-500 block mb-1">إجمالي المحفظة</span>
          <p className="text-lg font-bold text-slate-900 font-mono">{formatMAD(stats.totalAmount)}</p>
          <span className="text-[11px] text-slate-500">{stats.totalCount} شيك مسجل</span>
        </div>

        <div className="bg-white border border-slate-200 shadow-xs p-4 rounded-xl">
          <span className="text-xs text-slate-500 block mb-1 font-semibold">في الخزنة</span>
          <p className="text-lg font-black text-indigo-700 font-mono">{formatMAD(stats.inVaultAmount)}</p>
          <span className="text-[11px] text-slate-500">{stats.inVaultCount} شيك</span>
        </div>

        <div className="bg-white border border-amber-200 shadow-xs p-4 rounded-xl">
          <span className="text-xs text-amber-700 block mb-1">حان موعد الإيداع</span>
          <p className="text-lg font-bold text-amber-700 font-mono">{formatMAD(stats.toDepositAmount)}</p>
          <span className="text-[11px] text-slate-500">{stats.toDepositCount} شيك مستحق</span>
        </div>

        <div className="bg-white border border-slate-200 shadow-xs p-4 rounded-xl">
          <span className="text-xs text-emerald-700 block mb-1">أودع بالحوافظ</span>
          <p className="text-lg font-bold text-emerald-700 font-mono">{formatMAD(stats.depositedAmount)}</p>
          <span className="text-[11px] text-slate-500">{stats.depositedCount} شيك بالبنك</span>
        </div>

        <div className="bg-white border border-emerald-200 shadow-xs p-4 rounded-xl">
          <span className="text-xs text-emerald-700 block mb-1">تم صرفه بالكامل</span>
          <p className="text-lg font-bold text-emerald-700 font-mono">{formatMAD(stats.clearedAmount)}</p>
          <span className="text-[11px] text-slate-500">{stats.clearedCount} شيك ناجح</span>
        </div>

        <div className="bg-rose-950/30 border border-rose-500/30 p-4 rounded-xl">
          <span className="text-xs text-rose-600 block mb-1 font-semibold flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>شيكات راجعة (خطر)</span>
          </span>
          <p className="text-lg font-bold text-rose-600 font-mono">{formatMAD(stats.rejectedAmount)}</p>
          <span className="text-[11px] text-rose-600/80">{stats.rejectedCount} شيك مرفوض</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 shadow-xs p-4 rounded-2xl flex flex-wrap gap-3 items-center justify-between shadow-lg">
        <div className="flex-1 min-w-[260px] relative">
          <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث برقم الشيك، اسم الساحب، أو معرف التلميذ..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value as any })}
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">كافة الحالات</option>
            <option value="en_portefeuille">في الخزنة (En Portefeuille)</option>
            <option value="a_deposer">حان أجل إيداعه (À Déposer)</option>
            <option value="remis">مودع بالحافظة (Remis)</option>
            <option value="encaisse">تم صرفه (Encaissé)</option>
            <option value="rejete">شيك راجع (Impayé)</option>
            <option value="restitue">تم إرجاعه (Restitué)</option>
          </select>

          <select
            value={filters.due_range}
            onChange={e => setFilters({ ...filters, due_range: e.target.value as any })}
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">كافة الآجال</option>
            <option value="overdue">تجاوزت تاريخ الصرف (Échus)</option>
            <option value="today">مستحقة اليوم</option>
            <option value="this_week">مستحقة هذا الأسبوع</option>
            <option value="this_month">مستحقة هذا الشهر</option>
          </select>
        </div>
      </div>

      {/* Checks Interactive Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-4">رقم الشيك</th>
                <th className="py-4 px-4">البنك المسحوب عليه</th>
                <th className="py-4 px-4">الساحب / التلميذ المرتبط</th>
                <th className="py-4 px-4">المبلغ</th>
                <th className="py-4 px-4">تاريخ الاستحقاق</th>
                <th className="py-4 px-4">الحالة والوضعية</th>
                <th className="py-4 px-4 text-center">الإجراءات السريعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">جاري تحميل شيكات المحفظة...</td>
                </tr>
              ) : checks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">لا توجد شيكات مطابقة لمعايير البحث</td>
                </tr>
              ) : (
                checks.map(chk => {
                  const overdue = isDateOverdue(chk.due_date);
                  const days = daysUntil(chk.due_date);

                  return (
                    <tr key={chk.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-mono font-bold text-slate-900 tracking-wider block">{chk.check_number}</span>
                        {chk.remise_number && (
                          <span className="text-[11px] text-emerald-700 font-mono mt-0.5 block">
                            حافظة: {chk.remise_number}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <span className="text-slate-700 font-medium">{chk.bank_name}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div>
                          <div className="flex items-center gap-1.5 text-white font-medium">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span>{chk.issuer_name}</span>
                          </div>
                          {(chk.student_name || chk.student_id) && (
                            <div className="flex items-center gap-1 text-xs text-emerald-700 mt-0.5">
                              <GraduationCap className="w-3 h-3" />
                              <span>{chk.student_name || chk.student_id}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-mono font-bold text-emerald-700 text-base">
                          {formatMAD(chk.amount)}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-mono text-xs">
                          <span className={overdue && chk.status !== 'encaisse' && chk.status !== 'restitue' ? 'text-amber-700 font-bold' : 'text-slate-700'}>
                            {chk.due_date}
                          </span>
                          {chk.status === 'en_portefeuille' && (
                            <span className="block text-[11px] text-slate-500 mt-0.5">
                              {overdue ? 'تجاوز الأجل' : days === 0 ? 'اليوم' : `باقي ${days} يوم`}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {getStatusBadge(chk.status, chk.due_date)}
                        {chk.rejection_reason && (
                          <span className="block text-[11px] text-rose-600 mt-1 max-w-[200px] truncate" title={chk.rejection_reason}>
                            السبب: {chk.rejection_reason}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {chk.status !== 'encaisse' && (
                            <button
                              onClick={() => handleStatusChange(chk.id, 'encaisse', { clearance_date: new Date().toISOString().split('T')[0] })}
                              title="تأكيد الصرف البنكي"
                              className="p-1.5 hover:bg-emerald-500/20 text-emerald-700 rounded-lg transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          {chk.status !== 'rejete' && (
                            <button
                              onClick={() => handleOpenReject(chk)}
                              title="تسجيل كشيك راجع (Impayé)"
                              className="p-1.5 hover:bg-rose-500/20 text-rose-600 rounded-lg transition-colors"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}

                          {chk.status === 'en_portefeuille' && (
                            <button
                              onClick={() => handleStatusChange(chk.id, 'a_deposer')}
                              title="تحويل إلى جاهز للإيداع"
                              className="p-1.5 hover:bg-amber-500/20 text-amber-700 rounded-lg transition-colors"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                          )}

                          {chk.status !== 'restitue' && (
                            <button
                              onClick={() => handleStatusChange(chk.id, 'restitue')}
                              title="إرجاع الشيك للساحب"
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {isRejectModalOpen && selectedCheckForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 shadow-xs w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <div className="p-2 bg-rose-500/20 border border-rose-500/30 rounded-xl">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">تسجيل شيك راجع (Impayé)</h3>
                <p className="text-xs text-slate-500 font-mono">شيك رقم: {selectedCheckForReject.check_number}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-white rounded-xl text-xs space-y-1">
                <p className="text-slate-500">الساحب: <span className="text-white font-semibold">{selectedCheckForReject.issuer_name}</span></p>
                <p className="text-slate-500">المبلغ: <span className="text-emerald-700 font-mono font-bold">{formatMAD(selectedCheckForReject.amount)}</span></p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">سبب الرفض البنكي *</label>
                <select
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="انعدام المؤونة الكافية في الحساب (Défaut de provision)">انعدام المؤونة الكافية في الحساب (Défaut de provision)</option>
                  <option value="توقيع غير مطابق (Signature non conforme)">توقيع غير مطابق (Signature non conforme)</option>
                  <option value="تعرض على الشيك (Opposition sur chèque)">تعرض على الشيك (Opposition sur chèque)</option>
                  <option value="حساب بنكي مغلق (Compte clôturé)">حساب بنكي مغلق (Compte clôturé)</option>
                  <option value="خطأ في صياغة المبلغ أو التاريخ">خطأ في صياغة المبلغ أو التاريخ</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-500 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-rose-600/20"
                >
                  تأكيد الرفض وتسجيل الخطر
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Check Modal */}
      {isNewCheckModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 shadow-xs w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white/50">
              <div className="flex items-center gap-2.5">
                <Plus className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-lg">تسجيل شيك جديد بالمحفظة</h3>
              </div>
              <button
                onClick={() => setIsNewCheckModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCheck} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">رقم الشيك *</label>
                  <input
                    type="text"
                    placeholder="مثال: CHQ-889012"
                    value={newCheck.check_number}
                    onChange={e => setNewCheck({ ...newCheck, check_number: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono text-sm focus:outline-none focus:border-indigo-500 dir-ltr text-left"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">البنك المسحوب عليه *</label>
                  <select
                    value={newCheck.bank_name}
                    onChange={e => setNewCheck({ ...newCheck, bank_name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Attijariwafa Bank">Attijariwafa Bank</option>
                    <option value="Banque Populaire">Banque Populaire (الشعبي)</option>
                    <option value="CIH Bank">CIH Bank</option>
                    <option value="Bank of Africa">Bank of Africa (BMCE)</option>
                    <option value="Société Générale">Société Générale</option>
                    <option value="BMCI">BMCI</option>
                    <option value="Crédit Agricole">Crédit Agricole du Maroc</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">اسم الساحب (ولي الأمر/الطرف) *</label>
                  <input
                    type="text"
                    placeholder="مثال: ذ. عبد الرحيم العلمي"
                    value={newCheck.issuer_name}
                    onChange={e => setNewCheck({ ...newCheck, issuer_name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">معرف أو اسم التلميذ المرتبط</label>
                  <input
                    type="text"
                    placeholder="STU-2026-001 أو اسم التلميذ"
                    value={newCheck.student_id || ''}
                    onChange={e => setNewCheck({ ...newCheck, student_id: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">مبلغ الشيك (درهم مغربي) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="0.00"
                    value={newCheck.amount || ''}
                    onChange={e => setNewCheck({ ...newCheck, amount: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-indigo-500 text-left dir-ltr"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">تاريخ استحقاق الصرف *</label>
                  <input
                    type="date"
                    value={newCheck.due_date}
                    onChange={e => setNewCheck({ ...newCheck, due_date: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewCheckModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-sm font-medium transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  حفظ الشيك بالخزنة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
