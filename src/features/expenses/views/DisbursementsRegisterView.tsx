import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Plus,
  Search,
  RefreshCw,
  TrendingDown,
  Building,
  CreditCard,
  Banknote,
  CheckCircle2,
  X,
  User,
} from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { formatDateFR } from '../../../shared/lib/dateUtils';
import { DisbursementVoucher, NewDisbursementFormData, ExpensePaymentMethod } from '../models/expenses.types';
import { expensesService } from '../services/expenses.service';
import { OfficialDisbursementModal } from '../components/OfficialDisbursementModal';

export const DisbursementsRegisterView: React.FC = () => {
  const [disbursements, setDisbursements] = useState<DisbursementVoucher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<string>('all');

  // Modal State for Printing
  const [selectedVoucher, setSelectedVoucher] = useState<DisbursementVoucher | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // New Disbursement Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<NewDisbursementFormData>({
    disbursement_date: new Date().toISOString().split('T')[0],
    amount: 1000,
    beneficiary: '',
    recipient_cin: '',
    payment_mode: 'especes',
    check_number: '',
    bank_name: '',
    treasury_source: 'الصندوق المركزي',
    disbursed_by: 'أمين الصندوق المركزي',
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await expensesService.getDisbursementsRegister();
      setDisbursements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDisbursements = disbursements.filter((item) => {
    const matchesMode = selectedMode === 'all' || item.payment_mode === selectedMode;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      item.voucher_number.toLowerCase().includes(q) ||
      item.beneficiary.toLowerCase().includes(q) ||
      item.recipient_cin?.toLowerCase().includes(q) ||
      item.notes?.toLowerCase().includes(q);

    return matchesMode && matchesSearch;
  });

  const totalDisbursed = disbursements.reduce((sum, d) => sum + d.amount, 0);
  const cashDisbursed = disbursements
    .filter((d) => d.payment_mode === 'especes')
    .reduce((sum, d) => sum + d.amount, 0);
  const bankDisbursed = totalDisbursed - cashDisbursed;

  const handlePrintClick = (voucher: DisbursementVoucher) => {
    setSelectedVoucher(voucher);
    setIsPrintModalOpen(true);
  };

  const handleCreateDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.beneficiary || !formData.amount) return;

    setSubmitting(true);
    try {
      const created = await expensesService.generateDisbursementVoucher(formData);
      setIsCreateModalOpen(false);
      setFormData({
        disbursement_date: new Date().toISOString().split('T')[0],
        amount: 1000,
        beneficiary: '',
        recipient_cin: '',
        payment_mode: 'especes',
        check_number: '',
        bank_name: '',
        treasury_source: 'الصندوق المركزي',
        disbursed_by: 'أمين الصندوق المركزي',
        notes: '',
      });
      await loadData();
      if (created) {
        setSelectedVoucher(created);
        setIsPrintModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إصدار سند الصرف');
    } finally {
      setSubmitting(false);
    }
  };

  const getModeBadge = (m: string) => {
    switch (m) {
      case 'especes':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Banknote className="w-3 h-3" /> نقداً (Caisse)
          </span>
        );
      case 'cheque':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <CreditCard className="w-3 h-3" /> شيك بنكي
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Building className="w-3 h-3" /> تحويل صادر
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span>سجل المصروفات وسندات الصرف الرسمية (Bons de Décaissement)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            أرشيف أوامر الصرف الصادرة من الصندوق والخزينة، تفقيط المبالغ، وتوثيق توقيعات الاستلام
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs transition-all disabled:opacity-50"
            title="تحديث السجل"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إصدار سند صرف مباشر</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المصروفات بسندات"
          value={formatMAD(totalDisbursed)}
          subtitle={`${disbursements.length} سند صرف معتمد`}
          icon={FileText}
          variant="expense"
        />
        <StatCard
          title="سندات الصرف النقدي"
          value={formatMAD(cashDisbursed)}
          subtitle="مسحوبة مباشرة من الصندوق"
          icon={Banknote}
          variant="pending"
        />
        <StatCard
          title="سندات الصرف البنكي"
          value={formatMAD(bankDisbursed)}
          subtitle="شيكات وتحويلات صادرة"
          icon={Building}
          variant="default"
        />
        <StatCard
          title="إجمالي السندات الصادرة"
          value={`${disbursements.length} سند`}
          subtitle="مرقمة تسلسلياً"
          icon={CheckCircle2}
          variant="income"
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث برقم السند، المستفيد، بطاقة التعريف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs transition-all font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-medium focus:outline-none focus:border-indigo-500 shadow-xs"
          >
            <option value="all">كافة طرق الصرف</option>
            <option value="especes">نقداً من الصندوق (Espèces)</option>
            <option value="cheque">شيك بنكي (Chèque)</option>
            <option value="virement">تحويل بنكي (Virement)</option>
          </select>
        </div>
      </div>

      {/* Disbursements Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/90 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">رقم السند الرسمي</th>
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4">المستفيد / الدائن</th>
                <th className="py-3 px-4">رقم ب.ت.و / السجل</th>
                <th className="py-3 px-4">طريقة الصرف</th>
                <th className="py-3 px-4">الخزينة / المصدر</th>
                <th className="py-3 px-4">بيان الصرف والملاحظات</th>
                <th className="py-3 px-4">الآمر بالصرف</th>
                <th className="py-3 px-4 text-left">المبلغ (MAD)</th>
                <th className="py-3 px-4 text-center">الطباعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-mono">
                    جاري تحميل سجل سندات الصرف...
                  </td>
                </tr>
              ) : filteredDisbursements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    لا توجد سندات صرف مطابقة لمعايير البحث الحالية
                  </td>
                </tr>
              ) : (
                filteredDisbursements.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{item.voucher_number}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{formatDateFR(item.disbursement_date)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{item.beneficiary}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{item.recipient_cin || '---'}</td>
                    <td className="py-3 px-4">{getModeBadge(item.payment_mode)}</td>
                    <td className="py-3 px-4 text-slate-300 font-sans">{item.treasury_source}</td>
                    <td className="py-3 px-4 text-slate-400 max-w-[200px] truncate" title={item.notes || ''}>
                      {item.notes || '---'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{item.disbursed_by}</td>
                    <td className="py-3 px-4 text-left font-mono font-bold text-rose-600 text-sm">
                      {formatMAD(item.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handlePrintClick(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold inline-flex items-center gap-1 transition-all active:scale-95 shadow-xs"
                        title="معاينة وطباعة السند الرسمي A4"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>طباعة</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Voucher Printable Modal */}
      <OfficialDisbursementModal
        voucher={selectedVoucher}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />

      {/* Direct Create Voucher Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 text-slate-900 my-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold">إصدار سند صرف مباشر (Bon de Décaissement)</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDisbursement} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">المستفيد / الدائن*</label>
                  <input
                    type="text"
                    required
                    placeholder="اسم الشخص أو المؤسسة"
                    value={formData.beneficiary}
                    onChange={(e) => setFormData({ ...formData, beneficiary: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">رقم بطاقة التعريف (CIN للمستلم)</label>
                  <input
                    type="text"
                    placeholder="مثال: AB123456"
                    value={formData.recipient_cin}
                    onChange={(e) => setFormData({ ...formData, recipient_cin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">تاريخ الصرف*</label>
                  <input
                    type="date"
                    required
                    value={formData.disbursement_date}
                    onChange={(e) => setFormData({ ...formData, disbursement_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-indigo-500 shadow-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">المبلغ الإجمالي (MAD)*</label>
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">طريقة الصرف*</label>
                  <select
                    value={formData.payment_mode}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_mode: e.target.value as ExpensePaymentMethod })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                  >
                    <option value="especes">نقداً (Espèces)</option>
                    <option value="cheque">شيك بنكي (Chèque)</option>
                    <option value="virement">تحويل بنكي (Virement)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">الخزينة / المصدر*</label>
                  <input
                    type="text"
                    required
                    value={formData.treasury_source}
                    onChange={(e) => setFormData({ ...formData, treasury_source: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                  />
                </div>
              </div>

              {formData.payment_mode === 'cheque' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">رقم الشيك</label>
                    <input
                      type="text"
                      placeholder="CHQ-XXXXXX"
                      value={formData.check_number}
                      onChange={(e) => setFormData({ ...formData, check_number: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-indigo-500 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">اسم البنك</label>
                    <input
                      type="text"
                      placeholder="مثال: التجاري وفا بنك"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-700 font-bold block mb-1">موضوع النفقة وبيان الصرف (Motif)*</label>
                <textarea
                  rows={2}
                  required
                  placeholder="بيان سبب الصرف والوثائق المرفقة..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-all disabled:opacity-50"
                >
                  {submitting ? 'جاري الإصدار...' : 'إصدار ومعاينة السند للطباعة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
