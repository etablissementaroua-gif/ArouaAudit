import React, { useState, useEffect } from 'react';
import { checksManagementService } from '../services/checksManagement.service';
import { ReceiptRecord } from '../models/check.types';
import { OfficialReceiptModal } from '../../treasury-caisse/components/OfficialReceiptModal';
import { OfficialReceiptData } from '../../../shared/lib/receiptPdfGenerator';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { 
  Receipt, 
  Search, 
  Printer, 
  CreditCard, 
  Banknote, 
  FileText, 
  User, 
  Calendar,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

export const ReceiptsRegistryView: React.FC = () => {
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Modal State
  const [selectedReceiptData, setSelectedReceiptData] = useState<OfficialReceiptData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchReceipts = async () => {
      setLoading(true);
      const data = await checksManagementService.getReceiptsRegistry();
      setReceipts(data);
      setLoading(false);
    };
    fetchReceipts();
  }, []);

  const filteredReceipts = receipts.filter(r => {
    const matchesSearch = 
      r.receipt_number.toLowerCase().includes(search.toLowerCase()) ||
      r.payer_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.reference && r.reference.toLowerCase().includes(search.toLowerCase()));

    const matchesMethod = methodFilter === 'all' || r.payment_method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const totalAmount = filteredReceipts.reduce((sum, r) => sum + r.amount, 0);

  const handleOpenReceipt = (rec: ReceiptRecord) => {
    const data: OfficialReceiptData = {
      receiptNumber: rec.receipt_number,
      date: rec.date,
      studentName: rec.payer_name,
      massarCode: rec.student_id || 'MAS-2026-ARW',
      classroom: 'القسم الدراسي المعتمد',
      academicLevel: 'المستوى الأكاديمي',
      paymentFor: rec.purpose,
      amountMAD: rec.amount,
      paymentMethod: rec.payment_method,
      paymentReference: rec.reference || rec.receipt_number,
      parentName: rec.payer_name,
      remainingBalanceMAD: 0,
      notes: `سند قبض صادر برسم الموسم الدراسي ${rec.academic_year}`,
      cashierName: 'أمين الصندوق المركزي'
    };
    setSelectedReceiptData(data);
    setIsModalOpen(true);
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'especes':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Banknote className="w-3.5 h-3.5" />
            <span>نقداً (Espèces)</span>
          </span>
        );
      case 'cheque':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <FileText className="w-3.5 h-3.5" />
            <span>شيك بنكي (Chèque)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
            <CreditCard className="w-3.5 h-3.5" />
            <span>تحويل بنكي (Virement)</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/90 p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">سجل الوصولات وسندات القبض</h1>
            <p className="text-slate-500 text-sm">الأرشيف المركزي لجميع وصولات الأداء المالي، الرسوم المدرسية، وسندات الصندوق</p>
          </div>
        </div>

        <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 text-sm text-emerald-800 font-mono">
          <span>إجمالي الوصولات: </span>
          <span className="font-bold text-emerald-700">{formatMAD(totalAmount)}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
          <span className="text-xs text-slate-500 uppercase font-semibold block mb-1">العدد الإجمالي للوصولات</span>
          <p className="text-2xl font-black text-slate-900 font-mono">{filteredReceipts.length}</p>
          <span className="text-xs text-slate-500">سند قبض صادر</span>
        </div>

        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
          <span className="text-xs text-emerald-700 uppercase font-semibold block mb-1">وصولات الأداء النقدي</span>
          <p className="text-2xl font-black text-emerald-600 font-mono">
            {formatMAD(receipts.filter(r => r.payment_method === 'especes').reduce((s, r) => s + r.amount, 0))}
          </p>
          <span className="text-xs text-slate-500">{receipts.filter(r => r.payment_method === 'especes').length} وصل نقدي</span>
        </div>

        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
          <span className="text-xs text-emerald-700 uppercase font-semibold block mb-1">وصولات الشيكات</span>
          <p className="text-2xl font-black text-indigo-600 font-mono">
            {formatMAD(receipts.filter(r => r.payment_method === 'cheque').reduce((s, r) => s + r.amount, 0))}
          </p>
          <span className="text-xs text-slate-500">{receipts.filter(r => r.payment_method === 'cheque').length} وصل شيك</span>
        </div>

        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
          <span className="text-xs text-emerald-800 uppercase font-semibold block mb-1">التحويلات البنكية</span>
          <p className="text-2xl font-black text-cyan-600 font-mono">
            {formatMAD(receipts.filter(r => r.payment_method === 'virement').reduce((s, r) => s + r.amount, 0))}
          </p>
          <span className="text-xs text-slate-500">{receipts.filter(r => r.payment_method === 'virement').length} وصل تحويل</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 p-4 rounded-2xl flex flex-wrap gap-3 items-center justify-between shadow-xs">
        <div className="flex-1 min-w-[260px] relative">
          <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث برقم الوصل، اسم الدافع، أو المرجع..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-500 shadow-xs"
          >
            <option value="all">كافة وسائل الأداء</option>
            <option value="especes">نقداً (Espèces)</option>
            <option value="cheque">شيك بنكي (Chèque)</option>
            <option value="virement">تحويل بنكي (Virement)</option>
          </select>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-700 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-4">رقم الوصل الرسمي</th>
                <th className="py-4 px-4">تاريخ الإصدار</th>
                <th className="py-4 px-4">الدافع / المعني بالأداء</th>
                <th className="py-4 px-4">طريقة الأداء</th>
                <th className="py-4 px-4">موضوع وسياق الأداء</th>
                <th className="py-4 px-4">المبلغ المستخلص</th>
                <th className="py-4 px-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">جاري تحميل سجل الوصولات...</td>
                </tr>
              ) : filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">لا توجد وصولات مطابقة للبحث</td>
                </tr>
              ) : (
                filteredReceipts.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-900 tracking-wider">
                      {rec.receipt_number}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{rec.date}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span>{rec.payer_name}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {getMethodBadge(rec.payment_method)}
                    </td>

                    <td className="py-4 px-4 text-slate-700 text-xs font-medium">
                      <span>{rec.purpose}</span>
                      {rec.reference && (
                        <span className="block font-mono text-[11px] text-slate-500 mt-0.5">
                          المرجع: {rec.reference}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 font-mono font-black text-emerald-600 text-base">
                      {formatMAD(rec.amount)}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleOpenReceipt(rec)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-105 active:scale-95 shadow-sm"
                        title="معاينة وإعادة طباعة الوصل"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>إعادة طباعة الوصل</span>
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
      {selectedReceiptData && (
        <OfficialReceiptModal
          receipt={selectedReceiptData}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
