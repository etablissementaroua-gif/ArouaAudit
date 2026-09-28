import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  RefreshCw,
  TrendingDown,
  Building,
  CreditCard,
  Banknote,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { formatDateFR } from '../../../shared/lib/dateUtils';
import { ExpenseItem, ExpenseCategory, NewExpenseFormData, ExpensePaymentMethod } from '../models/expenses.types';
import { expensesService } from '../services/expenses.service';

export const ExpensesListView: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Form State
  const [formData, setFormData] = useState<NewExpenseFormData>({
    category_code: 'FOURNITURES',
    expense_date: new Date().toISOString().split('T')[0],
    amount: 1500,
    beneficiary_name: '',
    beneficiary_ice: '',
    payment_method: 'especes',
    payment_source: 'caisse_centrale',
    check_or_trans_ref: '',
    invoice_reference: '',
    status: 'paid',
    academic_year: '2026/2027',
    authorized_by: 'المدير العام',
    description: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [expData, catData] = await Promise.all([
        expensesService.getExpenses({
          category_code: selectedCategory,
          payment_method: selectedMethod,
          status: selectedStatus,
          search_query: searchQuery,
        }),
        expensesService.getCategories(),
      ]);
      setExpenses(expData);
      setCategories(catData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedMethod, selectedStatus]);

  // Recalculate KPI stats
  const totalSpent = expenses.filter((e) => e.status !== 'cancelled').reduce((sum, e) => sum + e.amount, 0);
  const caisseTotal = expenses
    .filter((e) => e.status !== 'cancelled' && (e.payment_method === 'especes' || e.payment_source.includes('caisse')))
    .reduce((sum, e) => sum + e.amount, 0);
  const bankTotal = totalSpent - caisseTotal;
  const pendingCount = expenses.filter((e) => e.status === 'pending').length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.beneficiary_name || !formData.amount || !formData.description) return;

    setSubmitting(true);
    try {
      await expensesService.recordExpense(formData);
      setIsModalOpen(false);
      setFormData({
        category_code: categories[0]?.code || 'FOURNITURES',
        expense_date: new Date().toISOString().split('T')[0],
        amount: 1500,
        beneficiary_name: '',
        beneficiary_ice: '',
        payment_method: 'especes',
        payment_source: 'caisse_centrale',
        check_or_trans_ref: '',
        invoice_reference: '',
        status: 'paid',
        academic_year: '2026/2027',
        authorized_by: 'المدير العام',
        description: '',
      });
      await loadData();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تسجيل النفقة');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: ExpenseItem['status']) => {
    try {
      await expensesService.updateExpenseStatus(id, newStatus);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const getMethodBadge = (m: string) => {
    switch (m) {
      case 'especes':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Banknote className="w-3 h-3" /> نقداً (Espèces)
          </span>
        );
      case 'cheque':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <CreditCard className="w-3 h-3" /> شيك (Chèque)
          </span>
        );
      case 'virement':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Building className="w-3 h-3" /> تحويل (Virement)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Building className="w-3 h-3" /> اقتطاع بنكي
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> تم الصرف (Payé)
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <CheckCircle2 className="w-3 h-3" /> معتمدة للصرف
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" /> قيد المراجعة
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> ملغاة
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-400" />
            <span>قائمة وسجل النفقات والالتزامات العامة (Registre des Dépenses)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            متابعة الفواتير المدرسية، أوامر الأداء، الموردين المعتمدين، وطرق التسوية المالية
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all disabled:opacity-50"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل نفقة جديدة</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي النفقات المصروفة"
          value={formatMAD(totalSpent)}
          subtitle={`${expenses.length} عملية نفقة مسجلة`}
          icon={Receipt}
          variant="expense"
        />
        <StatCard
          title="نفقات الصندوق النقدي"
          value={formatMAD(caisseTotal)}
          subtitle="تسويات نقدية فورية"
          icon={Banknote}
          variant="pending"
        />
        <StatCard
          title="نفقات الحسابات البنكية"
          value={formatMAD(bankTotal)}
          subtitle="شيكات وتحويلات بنكية"
          icon={Building}
          variant="default"
        />
        <StatCard
          title="نفقات قيد المصادقة"
          value={`${pendingCount} فواتير`}
          subtitle="في انتظار تأشيرة الإدارة"
          icon={Clock}
          variant={pendingCount > 0 ? 'pending' : 'income'}
        />
      </div>

      {/* Search & Filters Bar */}
      <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث برقم السند، المورد، الفاتورة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-sans"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">كافة أبواب النفقات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.code}>
                {c.name_ar} ({c.code})
              </option>
            ))}
          </select>

          {/* Payment Method Filter */}
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">كافة وسائل الأداء</option>
            <option value="especes">نقداً (Espèces)</option>
            <option value="cheque">شيك بنكي (Chèque)</option>
            <option value="virement">تحويل بنكي (Virement)</option>
            <option value="prelevement">اقتطاع بنكي</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">كافة الحالات</option>
            <option value="paid">تم الصرف (Payé)</option>
            <option value="approved">معتمدة</option>
            <option value="pending">قيد الانتظار</option>
            <option value="cancelled">ملغاة</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-medium border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">رقم السند</th>
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4">الباب المحاسبي</th>
                <th className="py-3 px-4">المستفيد / الدائن</th>
                <th className="py-3 px-4">رقم الفاتورة</th>
                <th className="py-3 px-4">بيان النفقة</th>
                <th className="py-3 px-4">وسيلة ومصدر الصرف</th>
                <th className="py-3 px-4 text-left">المبلغ (MAD)</th>
                <th className="py-3 px-4 text-center">الحالة</th>
                <th className="py-3 px-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-mono">
                    جاري تحميل سجل النفقات...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    لا توجد نفقات مسجلة مطابقة لمعايير البحث الحالية
                  </td>
                </tr>
              ) : (
                expenses.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">{item.reference_no}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{formatDateFR(item.expense_date)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {item.category_code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{item.beneficiary_name}</div>
                      {item.beneficiary_ice && (
                        <span className="text-[10px] text-slate-500 font-mono">ICE: {item.beneficiary_ice}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{item.invoice_reference || '---'}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-[200px] truncate" title={item.description}>
                      {item.description}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div>{getMethodBadge(item.payment_method)}</div>
                        <span className="text-[10px] text-slate-500 block font-mono">
                          {item.payment_source === 'caisse_centrale'
                            ? 'الصندوق المركزي'
                            : item.payment_source.replace('banque_', 'بنك ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-left font-mono font-bold text-rose-400 text-sm">
                      {formatMAD(item.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(item.status)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {item.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'approved')}
                            className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-[10px] font-bold"
                          >
                            مصادقة
                          </button>
                        )}
                        {item.status === 'approved' && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'paid')}
                            className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[10px] font-bold"
                          >
                            تأكيد الصرف
                          </button>
                        )}
                        <span className="text-slate-600 text-xs">&middot;</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-white my-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold">تسجيل نفقة جديدة وإصدار أمر صرف</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">الباب المحاسبي (Rubrique)*</label>
                  <select
                    value={formData.category_code}
                    onChange={(e) => setFormData({ ...formData, category_code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.name_ar} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">تاريخ العملية*</label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">المستفيد / الشركة / المورد*</label>
                  <input
                    type="text"
                    required
                    placeholder="اسم المورد أو المستفيد"
                    value={formData.beneficiary_name}
                    onChange={(e) => setFormData({ ...formData, beneficiary_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">رقم تعريف المقاولة (ICE للمورد)</label>
                  <input
                    type="text"
                    placeholder="15 رقماً"
                    value={formData.beneficiary_ice}
                    onChange={(e) => setFormData({ ...formData, beneficiary_ice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">المبلغ الإجمالي (MAD)*</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">رقم الفاتورة أو وصل الشراء</label>
                  <input
                    type="text"
                    placeholder="FAC-2026-XXXX"
                    value={formData.invoice_reference}
                    onChange={(e) => setFormData({ ...formData, invoice_reference: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">طريقة الصرف المعتمدة*</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment_method: e.target.value as ExpensePaymentMethod,
                        payment_source: e.target.value === 'especes' ? 'caisse_centrale' : 'banque_attijari',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="especes">نقداً (Espèces)</option>
                    <option value="cheque">شيك بنكي (Chèque)</option>
                    <option value="virement">تحويل بنكي (Virement)</option>
                    <option value="prelevement">اقتطاع بنكي (Prélèvement)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">مصدر الخزينة / الحساب*</label>
                  <select
                    value={formData.payment_source}
                    onChange={(e) => setFormData({ ...formData, payment_source: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="caisse_centrale">الصندوق المركزي (Caisse Principale)</option>
                    <option value="caisse_reception">صندوق الاستقبال (Caisse Régie)</option>
                    <option value="banque_attijari">حساب التجاري وفا بنك</option>
                    <option value="banque_bp">حساب البنك الشعبي</option>
                  </select>
                </div>
              </div>

              {formData.payment_method !== 'especes' && (
                <div>
                  <label className="text-slate-400 block mb-1">رقم الشيك أو المعاملة البنكية</label>
                  <input
                    type="text"
                    placeholder="CHQ-XXXXXX أو رقم التحويل"
                    value={formData.check_or_trans_ref}
                    onChange={(e) => setFormData({ ...formData, check_or_trans_ref: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="text-slate-400 block mb-1">بيان وموضوع النفقة (Description)*</label>
                <textarea
                  rows={2}
                  required
                  placeholder="وصف موضوع النفقة أو المشتريات المدرسية بالتفصيل"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {formData.payment_method === 'especes' && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
                  <Banknote className="w-4 h-4 shrink-0" />
                  <span>
                    ملاحظة: سيتم إنشاء <strong>سند صرف نقدي رسمي (Bon de Décaissement)</strong> آلياً في سجل المصروفات
                    لهذه العملية.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all disabled:opacity-50"
                >
                  {submitting ? 'جاري التسجيل...' : 'تسجيل النفقة واعتمادها'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
