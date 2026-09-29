import React, { useState, useEffect } from 'react';
import { financeOperationsService } from '../services/financeOperations.service';
import { PaymentJournalRecord } from '../models/finance.types';
import { OfficialReceiptModal } from '../../treasury-caisse/components/OfficialReceiptModal';
import { OfficialReceiptData } from '../../../shared/lib/receiptPdfGenerator';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { 
  FileSpreadsheet, 
  Search, 
  Printer, 
  Banknote, 
  CreditCard, 
  FileText, 
  User, 
  Calendar,
  Layers,
  GraduationCap
} from 'lucide-react';

export const PaymentsJournalView: React.FC = () => {
  const [payments, setPayments] = useState<PaymentJournalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<OfficialReceiptData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await financeOperationsService.getPaymentsJournal(search);
    setPayments(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const filteredPayments = payments.filter(p => {
    const matchesMethod = methodFilter === 'all' || p.payment_method === methodFilter;
    return matchesMethod;
  });

  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount_paid, 0);
  const totalScolarite = filteredPayments.reduce((sum, p) => sum + (p.service_breakdown?.scolarite || 0), 0);
  const totalTransport = filteredPayments.reduce((sum, p) => sum + (p.service_breakdown?.transport || 0), 0);
  const totalCantine = filteredPayments.reduce((sum, p) => sum + (p.service_breakdown?.cantine || 0), 0);

  const handleOpenReceipt = (p: PaymentJournalRecord) => {
    const receiptData: OfficialReceiptData = {
      receiptNumber: p.receipt_number,
      date: p.payment_date,
      studentName: p.student_name,
      massarCode: p.student_id,
      classroom: p.academic_level,
      academicLevel: p.academic_level,
      paymentFor: `واجبات التمدرس والخدمات لشهر ${p.period_month || 'شتنبر'}`,
      amountMAD: p.amount_paid,
      paymentMethod: p.payment_method,
      paymentReference: p.check_or_bank_ref || p.receipt_number,
      parentName: p.student_name,
      remainingBalanceMAD: 0,
      notes: p.notes || `تسديد برسم الموسم ${p.academic_year}`,
      cashierName: p.cashier_agent
    };
    setSelectedReceipt(receiptData);
    setIsModalOpen(true);
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'especes':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Banknote className="w-3 h-3" />
            <span>نقداً</span>
          </span>
        );
      case 'cheque':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 border border-indigo-500/30">
            <FileText className="w-3 h-3" />
            <span>شيك</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-emerald-800 border border-cyan-500/30">
            <CreditCard className="w-3 h-3" />
            <span>تحويل</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">يومية التسديدات والمدفوعات المدرسية</h1>
            <p className="text-slate-500 text-sm">السجل الزمني المحاسبي لجميع المقبوضات المدرسية المباشرة مع تفكيك الخدمات المستخلصة</p>
          </div>
        </div>

        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 font-mono">
          <span>إجمالي المقبوضات: </span>
          <span className="font-bold text-emerald-700">{formatMAD(totalCollected)}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <span className="text-xs text-slate-500 uppercase font-semibold block mb-1">إجمالي العمليات المسجلة</span>
          <p className="text-2xl font-bold text-slate-900 font-mono">{filteredPayments.length}</p>
          <span className="text-xs text-slate-500 mt-1 block">عملية استخلاص مؤكدة</span>
        </div>

        <div className="bg-white border border-slate-200 shadow-xs p-5 rounded-2xl">
          <span className="text-xs text-emerald-700 uppercase font-semibold block mb-1">استخلاصات التمدرس</span>
          <p className="text-2xl font-bold text-slate-900 font-mono">{formatMAD(totalScolarite)}</p>
          <span className="text-xs text-slate-500 mt-1 block">رسوم التعليم والتمدرس</span>
        </div>

        <div className="bg-white border border-amber-200 shadow-xs p-5 rounded-2xl">
          <span className="text-xs text-amber-700 uppercase font-semibold block mb-1">استخلاصات النقل المدرسي</span>
          <p className="text-2xl font-bold text-amber-700 font-mono">{formatMAD(totalTransport)}</p>
          <span className="text-xs text-slate-500 mt-1 block">اشتراكات خطوط الحافلات</span>
        </div>

        <div className="bg-white border border-cyan-500/20 p-5 rounded-2xl">
          <span className="text-xs text-emerald-800 uppercase font-semibold block mb-1">استخلاصات المطعم</span>
          <p className="text-2xl font-bold text-emerald-800 font-mono">{formatMAD(totalCantine)}</p>
          <span className="text-xs text-slate-500 mt-1 block">وجبات التغذية المدرسية</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200 shadow-xs p-4 rounded-2xl flex flex-wrap gap-3 items-center justify-between shadow-lg">
        <div className="flex-1 min-w-[260px] relative">
          <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث برقم الوصل، اسم التلميذ، أو أمين الصندوق..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">كافة وسائل الأداء</option>
            <option value="especes">نقداً (Espèces)</option>
            <option value="cheque">شيك (Chèques)</option>
            <option value="virement">تحويل بنكي (Virements)</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <th className="py-4 px-4">رقم الوصل والتاريخ</th>
                <th className="py-4 px-4">التلميذ / المعرف</th>
                <th className="py-4 px-4">المبلغ المستخلص</th>
                <th className="py-4 px-4">طريقة الأداء</th>
                <th className="py-4 px-4">تفكيك الخدمات المسددة</th>
                <th className="py-4 px-4">أمين الصندوق</th>
                <th className="py-4 px-4 text-center">الوصل الرسمي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">جاري تحميل يومية التسديدات...</td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">لا توجد تسديدات مطابقة لمعايير البحث</td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-mono font-bold text-slate-900 tracking-wider block">{p.receipt_number}</span>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{p.payment_date}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{p.student_name}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                        {p.student_id} • {p.academic_level}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono font-black text-emerald-700 text-base">
                      {formatMAD(p.amount_paid)}
                    </td>

                    <td className="py-4 px-4">
                      {getMethodBadge(p.payment_method)}
                      {p.check_or_bank_ref && (
                        <span className="block font-mono text-[10px] text-slate-500 mt-1">
                          {p.check_or_bank_ref}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-xs">
                      <div className="flex items-center gap-2">
                        {p.service_breakdown.scolarite > 0 && (
                          <span className="bg-white px-2 py-0.5 rounded text-indigo-700 font-mono font-bold border border-slate-200">
                            تمدرس: {formatMAD(p.service_breakdown.scolarite)}
                          </span>
                        )}
                        {p.service_breakdown.transport > 0 && (
                          <span className="bg-white px-2 py-0.5 rounded text-amber-700 font-mono font-bold border border-slate-200">
                            نقل: {formatMAD(p.service_breakdown.transport)}
                          </span>
                        )}
                        {p.service_breakdown.cantine > 0 && (
                          <span className="bg-white px-2 py-0.5 rounded text-sky-700 font-mono font-bold border border-slate-200">
                            مطعم: {formatMAD(p.service_breakdown.cantine)}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-700">
                      {p.cashier_agent}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleOpenReceipt(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs"
                        title="معاينة وإعادة طباعة الوصل الرسمي"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>طباعة الوصل</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Receipt Modal */}
      {selectedReceipt && (
        <OfficialReceiptModal
          receipt={selectedReceipt}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
