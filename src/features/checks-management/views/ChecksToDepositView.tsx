import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checksManagementService } from '../services/checksManagement.service';
import { CheckItem, BankAccount } from '../models/check.types';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { isDateOverdue, daysUntil } from '../../../shared/lib/dateUtils';
import { 
  Clock, 
  Send, 
  Building, 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  GraduationCap, 
  X,
  Layers,
  ArrowRight
} from 'lucide-react';

export const ChecksToDepositView: React.FC = () => {
  const navigate = useNavigate();
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'this_week' | 'this_month'>('all');
  const [selectedCheckIds, setSelectedCheckIds] = useState<string[]>([]);

  // Remise Creation Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [remiseDate, setRemiseDate] = useState(new Date().toISOString().split('T')[0]);
  const [remiseNotes, setRemiseNotes] = useState('إيداع شيكات التمدرس - الموسم الدراسي 2026/2027');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [toDepositList, accounts] = await Promise.all([
      checksManagementService.getChecksToDeposit(),
      checksManagementService.getBankAccounts()
    ]);
    setChecks(toDepositList);
    setBankAccounts(accounts.filter(a => a.is_active));
    if (accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter based on tab
  const today = new Date().toISOString().split('T')[0];
  const filteredChecks = checks.filter(chk => {
    if (activeTab === 'overdue') return chk.due_date < today;
    if (activeTab === 'this_week') {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      return chk.due_date <= nextWeek.toISOString().split('T')[0];
    }
    if (activeTab === 'this_month') {
      return chk.due_date.slice(0, 7) === today.slice(0, 7);
    }
    return true;
  });

  const handleToggleSelectAll = () => {
    if (selectedCheckIds.length === filteredChecks.length) {
      setSelectedCheckIds([]);
    } else {
      setSelectedCheckIds(filteredChecks.map(c => c.id));
    }
  };

  const handleToggleCheck = (id: string) => {
    if (selectedCheckIds.includes(id)) {
      setSelectedCheckIds(selectedCheckIds.filter(i => i !== id));
    } else {
      setSelectedCheckIds([...selectedCheckIds, id]);
    }
  };

  const selectedChecks = checks.filter(c => selectedCheckIds.includes(c.id));
  const selectedTotalAmount = selectedChecks.reduce((sum, c) => sum + c.amount, 0);

  const handleCreateRemise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || selectedCheckIds.length === 0) return;

    setSubmitting(true);
    try {
      const newRemise = await checksManagementService.createBankRemise({
        bank_account_id: selectedAccountId,
        check_ids: selectedCheckIds,
        remise_date: remiseDate,
        notes: remiseNotes,
        created_by: 'أمين الصندوق'
      });

      setSuccessMessage(`تم إنشاء حافظة التسليم بنجاح برقم: ${newRemise.remise_number}`);
      setIsModalOpen(false);
      setSelectedCheckIds([]);
      await loadData();

      // Redirect after 1.5 seconds
      setTimeout(() => {
        navigate('/checks/delivery-slips');
      }, 1500);
    } catch {
      alert('حدث خطأ أثناء إنشاء حافظة التسليم');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-700">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">شيكات قيد الإيداع وحوافظ البنك</h1>
            <p className="text-slate-500 text-sm">تجهيز ومراجعة الشيكات التي حل أجل صرفها لإنشاء حافظة تسليم رسمية (Bordereau de Remise)</p>
          </div>
        </div>

        {selectedCheckIds.length > 0 && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Send className="w-5 h-5" />
            <span>إنشاء حافظة تسليم للبنك ({selectedCheckIds.length})</span>
          </button>
        )}
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-700 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button 
            onClick={() => navigate('/checks/delivery-slips')}
            className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold text-slate-900"
          >
            <span>عرض حوافظ التسليم</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            كافة الشيكات الجاهزة للإيداع ({checks.length})
          </button>

          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'overdue'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            حلت مواعيدها وتجاوزت الأجل ({checks.filter(c => c.due_date < today).length})
          </button>

          <button
            onClick={() => setActiveTab('this_week')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'this_week'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            مستحقة هذا الأسبوع
          </button>

          <button
            onClick={() => setActiveTab('this_month')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'this_month'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            مستحقة هذا الشهر
          </button>
        </div>

        <button
          onClick={handleToggleSelectAll}
          className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          {selectedCheckIds.length === filteredChecks.length && filteredChecks.length > 0 ? (
            <CheckSquare className="w-4 h-4 text-emerald-700" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          <span>تحديد الكل ({filteredChecks.length})</span>
        </button>
      </div>

      {/* Table of Ready Checks */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-4 w-12 text-center">اختيار</th>
                <th className="py-4 px-4">رقم الشيك</th>
                <th className="py-4 px-4">البنك الساحب</th>
                <th className="py-4 px-4">الساحب / التلميذ</th>
                <th className="py-4 px-4">المبلغ</th>
                <th className="py-4 px-4">تاريخ الاستحقاق</th>
                <th className="py-4 px-4">الوضعية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">جاري تحميل الشيكات المستحقة...</td>
                </tr>
              ) : filteredChecks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">لا توجد شيكات مستحقة للإيداع حالياً في هذا التبويب</td>
                </tr>
              ) : (
                filteredChecks.map(chk => {
                  const isSelected = selectedCheckIds.includes(chk.id);
                  const overdue = chk.due_date < today;
                  const days = daysUntil(chk.due_date);

                  return (
                    <tr 
                      key={chk.id} 
                      onClick={() => handleToggleCheck(chk.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-950/30' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-4 px-4 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleCheck(chk.id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-white border-slate-700 cursor-pointer"
                        />
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-mono font-bold text-slate-900 tracking-wider">{chk.check_number}</span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Building className="w-4 h-4 text-slate-500" />
                          <span>{chk.bank_name}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
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
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-mono font-bold text-emerald-700 text-base">
                          {formatMAD(chk.amount)}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-mono text-xs">
                          <span className={overdue ? 'text-amber-700 font-bold' : 'text-slate-700'}>
                            {chk.due_date}
                          </span>
                          <span className="block text-[11px] text-slate-500 mt-0.5">
                            {overdue ? 'تجاوز التاريخ' : days === 0 ? 'اليوم' : `باقي ${days} يوم`}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          overdue 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 border-amber-500/30' 
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200 border-indigo-500/30'
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span>{overdue ? 'واجب الإيداع فوراً' : 'جاهز للإيداع'}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Selection Action Bar */}
      {selectedCheckIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-indigo-500/40 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500 animate-ping" />
            <span className="text-sm font-semibold text-white">
              تم تحديد <span className="font-mono text-emerald-700 text-base">{selectedCheckIds.length}</span> شيكات
            </span>
          </div>

          <div className="h-6 w-px bg-slate-700" />

          <div className="text-sm">
            <span className="text-slate-500 ml-2">المبلغ الإجمالي:</span>
            <span className="font-mono font-black text-emerald-700 text-lg">
              {formatMAD(selectedTotalAmount)}
            </span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>إنشاء حافظة تسليم للبنك</span>
          </button>
        </div>
      )}

      {/* Remise Generation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 shadow-xs w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white/50">
              <div className="flex items-center gap-2.5">
                <Send className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-lg">إنشاء حافظة تسليم بنكية (Bordereau de Remise)</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRemise} className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">عدد الشيكات المختارة:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedCheckIds.length} شيكات</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">المجموع الإجمالي للحافظة:</span>
                  <span className="font-mono font-bold text-emerald-700 text-base">{formatMAD(selectedTotalAmount)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">الحساب البنكي المودع فيه (Destination) *</label>
                <select
                  value={selectedAccountId}
                  onChange={e => setSelectedAccountId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                  required
                >
                  {bankAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_name} - ({acc.bank_name} - {acc.agency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">تاريخ الإيداع بالبنك *</label>
                <input
                  type="date"
                  value={remiseDate}
                  onChange={e => setRemiseDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">ملاحظات الحافظة والغرض</label>
                <input
                  type="text"
                  value={remiseNotes}
                  onChange={e => setRemiseNotes(e.target.value)}
                  placeholder="مثال: إيداع دفعة شتنبر لشيكات التمدرس"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 text-sm font-medium transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {submitting ? 'جاري الإصدار والتوليد...' : 'تأكيد وتوليد الحافظة الرسمية'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
