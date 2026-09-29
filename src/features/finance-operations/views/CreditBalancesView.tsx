import React, { useState, useEffect } from 'react';
import { financeOperationsService } from '../services/financeOperations.service';
import { StudentCreditBalance, CreateCreditBalanceDTO } from '../models/finance.types';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { 
  PiggyBank, 
  Search, 
  Plus, 
  ArrowRightLeft, 
  CheckCircle2, 
  User, 
  Calendar, 
  X,
  CreditCard,
  Banknote,
  RotateCcw
} from 'lucide-react';

export const CreditBalancesView: React.FC = () => {
  const [balances, setBalances] = useState<StudentCreditBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newCredit, setNewCredit] = useState<CreateCreditBalanceDTO>({
    student_id: '',
    student_name: '',
    academic_level: 'CE1',
    credit_amount: 0,
    source_payment_reference: '',
    notes: ''
  });

  const loadBalances = async () => {
    setLoading(true);
    const data = await financeOperationsService.getCreditBalances();
    setBalances(data);
    setLoading(false);
  };

  useEffect(() => {
    loadBalances();
  }, []);

  const filteredBalances = balances.filter(b => 
    b.student_name.toLowerCase().includes(search.toLowerCase()) ||
    b.student_id.toLowerCase().includes(search.toLowerCase()) ||
    (b.source_payment_reference && b.source_payment_reference.toLowerCase().includes(search.toLowerCase()))
  );

  const totalCreditAvailable = balances
    .filter(b => b.status === 'available')
    .reduce((sum, b) => sum + b.credit_amount, 0);

  const handleCarryOver = async (id: string) => {
    if (confirm('هل تؤكد ترحيل هذا الرصيد الدائن لخصمه من واجبات الشهر المقبل؟')) {
      await financeOperationsService.carryOverCredit(id, 'تم الترحيل آلياً لواجبات الشهر القادم');
      loadBalances();
    }
  };

  const handleRefund = async (id: string) => {
    if (confirm('هل تؤكد إرجاع هذا الفائض نقداً لولي الأمر مع تسليمه وصلاً رسمياً؟')) {
      await financeOperationsService.refundCredit(id);
      loadBalances();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCredit.student_name || newCredit.credit_amount <= 0) return;

    await financeOperationsService.recordCreditBalance({
      ...newCredit,
      student_id: newCredit.student_id || `STU-${Date.now().toString().slice(-4)}`
    });

    setIsModalOpen(false);
    setNewCredit({
      student_id: '',
      student_name: '',
      academic_level: 'CE1',
      credit_amount: 0,
      source_payment_reference: '',
      notes: ''
    });
    loadBalances();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'carried_over':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 border border-indigo-500/30">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>تم الترحيل للشهر القادم</span>
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تم الإرجاع نقداً</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>رصيد متاح للخصم</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-700">
            <PiggyBank className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">الأرصدة الزائدة والفوائض المالية (Soldes Créditeurs)</h1>
            <p className="text-slate-500 text-sm">سجل المبالغ المسددة بالزيادة أو التسبيقات القابلة للترحيل أو الاسترجاع لأولياء الأمور</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-700/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>تسجيل رصيد دائن جديد</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 p-5 rounded-2xl">
          <span className="text-xs text-emerald-700 uppercase font-semibold block mb-1">إجمالي الفوائض المتاحة للخصم</span>
          <p className="text-2xl font-black text-emerald-700 font-mono">{formatMAD(totalCreditAvailable)}</p>
          <span className="text-xs text-slate-500 mt-1 block">رصيد متاح للاستخدام في الشهور القادمة</span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <span className="text-xs text-slate-500 uppercase font-semibold block mb-1">عدد التلاميذ أصحاب الأرصدة</span>
          <p className="text-2xl font-bold text-slate-900 font-mono">{balances.filter(b => b.status === 'available').length}</p>
          <span className="text-xs text-slate-500 mt-1 block">تلاميذ لديهم مبالغ دائنة</span>
        </div>

        <div className="bg-white border border-slate-200 shadow-xs p-5 rounded-2xl">
          <span className="text-xs text-emerald-700 uppercase font-semibold block mb-1">المبالغ المرحلة سابقاً</span>
          <p className="text-2xl font-bold text-indigo-700 font-mono font-bold">
            {formatMAD(balances.filter(b => b.status === 'carried_over').reduce((s, b) => s + b.credit_amount, 0))}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">تم خصمها في دورات سابقة</span>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="بحث سريع باسم التلميذ، المعرف، أو مرجع الوصل..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl shadow-xs pr-10 pl-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-lg"
        />
      </div>

      {/* Credit Balances Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <th className="py-4 px-4">التلميذ / المعرف</th>
                <th className="py-4 px-4">المستوى الدراسي</th>
                <th className="py-4 px-4">مبلغ الرصيد الدائن</th>
                <th className="py-4 px-4">مرجع الأداء المصدر</th>
                <th className="py-4 px-4">الوضعية الحالية</th>
                <th className="py-4 px-4">ملاحظات</th>
                <th className="py-4 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">جاري تحميل الأرصدة الدائنة...</td>
                </tr>
              ) : filteredBalances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">لا توجد أرصدة زائدة مطابقة للبحث</td>
                </tr>
              ) : (
                filteredBalances.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span>{item.student_name}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                        معرف: {item.student_id}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-slate-700">
                      {item.academic_level}
                    </td>

                    <td className="py-4 px-4 font-mono font-black text-emerald-700 text-base">
                      {formatMAD(item.credit_amount)}
                    </td>

                    <td className="py-4 px-4 font-mono text-xs text-emerald-700">
                      {item.source_payment_reference || '---'}
                    </td>

                    <td className="py-4 px-4">
                      {getStatusBadge(item.status)}
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-500 max-w-[200px] truncate" title={item.notes || ''}>
                      {item.notes || '---'}
                    </td>

                    <td className="py-4 px-4 text-center">
                      {item.status === 'available' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleCarryOver(item.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all hover:scale-105 active:scale-95"
                            title="ترحيل للخصم من الشهر الموالي"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>ترحيل للشهر القادم</span>
                          </button>

                          <button
                            onClick={() => handleRefund(item.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-all"
                            title="إرجاع المبلغ نقداً لولي الأمر"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>إرجاع نقدي</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">تمت المعالجة</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 shadow-xs w-full max-w-lg rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5 text-emerald-700">
                <PiggyBank className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">تسجيل رصيد دائن / تسبيق مالي</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">اسم التلميذ *</label>
                  <input
                    type="text"
                    required
                    placeholder="اسم التلميذ الثلاثي"
                    value={newCredit.student_name}
                    onChange={e => setNewCredit({ ...newCredit, student_name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">المعرف المدرسي (اختياري)</label>
                  <input
                    type="text"
                    placeholder="مثال: STU-2026-001"
                    value={newCredit.student_id}
                    onChange={e => setNewCredit({ ...newCredit, student_id: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">المستوى الدراسي</label>
                  <input
                    type="text"
                    placeholder="مثال: CE1"
                    value={newCredit.academic_level}
                    onChange={e => setNewCredit({ ...newCredit, academic_level: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">مبلغ الفائض الزائد (درهم) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="0.00"
                    value={newCredit.credit_amount || ''}
                    onChange={e => setNewCredit({ ...newCredit, credit_amount: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono font-bold text-left dir-ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">مرجع الأداء أو الوصل الأصلي</label>
                <input
                  type="text"
                  placeholder="مثال: REC-2026-0891 أو رقم الشيك/التحويل"
                  value={newCredit.source_payment_reference}
                  onChange={e => setNewCredit({ ...newCredit, source_payment_reference: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">ملاحظات ومبررات التسجيل</label>
                <textarea
                  rows={2}
                  value={newCredit.notes}
                  onChange={e => setNewCredit({ ...newCredit, notes: e.target.value })}
                  placeholder="مثال: تسديد واجب شهرين دفعة واحدة مع زيادة في المبلغ..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-500 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-700/20 active:scale-95 transition-all"
                >
                  تأكيد وحفظ الرصيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
