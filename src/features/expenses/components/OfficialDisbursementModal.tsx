import React from 'react';
import { Printer, X, FileText, CheckCircle2 } from 'lucide-react';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { formatDateFR } from '../../../shared/lib/dateUtils';
import { INSTITUTION_INFO, numberToWordsMAD } from '../../../shared/lib/receiptPdfGenerator';
import { DisbursementVoucher } from '../models/expenses.types';

interface OfficialDisbursementModalProps {
  voucher: DisbursementVoucher | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OfficialDisbursementModal: React.FC<OfficialDisbursementModalProps> = ({
  voucher,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !voucher) return null;

  const handlePrint = () => {
    window.print();
  };

  const getMethodLabel = (m: string) => {
    switch (m) {
      case 'especes':
        return 'نقداً من الصندوق (Espèces Caisse)';
      case 'cheque':
        return 'شيك بنكي مسحوب (Chèque Bancaire)';
      case 'virement':
        return 'تحويل بنكي صادر (Virement Bancaire)';
      case 'prelevement':
        return 'اقتطاع بنكي مباشر (Prélèvement)';
      default:
        return m;
    }
  };

  const amountInWords = numberToWordsMAD(voucher.amount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-300">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-4 bg-white text-slate-900 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-700" />
            <span className="text-xs font-bold font-sans">معاينة وطباعة سند الصرف المالي الرسمي (Bon de Décaissement)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة السند (Imprimer)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Sheet */}
        <div className="p-8 space-y-6 text-sm bg-white" id="printable-disbursement-voucher">
          
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
            <div>
              <h1 className="text-xl font-black text-slate-950 tracking-tight">{INSTITUTION_INFO.nameAr}</h1>
              <p className="text-xs font-medium text-slate-600">{INSTITUTION_INFO.nameFr}</p>
              <div className="mt-2 text-[10px] text-slate-500 space-y-0.5">
                <p>{INSTITUTION_INFO.address}</p>
                <p>الهاتف: {INSTITUTION_INFO.phones} | البريد: {INSTITUTION_INFO.email}</p>
              </div>
            </div>
            
            <div className="text-left bg-amber-50 border border-amber-200 p-3 rounded-xl min-w-[200px]">
              <div className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">سند صرف مالي رسمي</div>
              <div className="text-sm font-black text-slate-900 font-mono mt-0.5">{voucher.voucher_number}</div>
              <div className="text-[10px] text-slate-500 mt-1">التاريخ: {formatDateFR(voucher.disbursement_date)}</div>
              <div className="text-[10px] text-slate-500 font-mono">الخزينة: {voucher.treasury_source}</div>
            </div>
          </div>

          {/* Title Banner */}
          <div className="text-center py-2 bg-slate-100 rounded-lg border border-slate-200">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              BON DE DÉCAISSEMENT &middot; سند أداء وصرف نفقات
            </h2>
          </div>

          {/* Beneficiary Details */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block mb-1">المستفيد / الدائن (Bénéficiaire):</span>
              <span className="text-sm font-bold text-slate-900">{voucher.beneficiary}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">رقم بطاقة التعريف / السجل (CIN / ICE):</span>
              <span className="text-sm font-mono font-bold text-slate-800">
                {voucher.recipient_cin || '---'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">طريقة الصرف المعتمدة:</span>
              <span className="font-semibold text-slate-800">{getMethodLabel(voucher.payment_mode)}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">الآمر بالصرف / أمين الصندوق:</span>
              <span className="font-semibold text-slate-800">{voucher.disbursed_by}</span>
            </div>
            {voucher.check_number && (
              <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                <span>رقم الشيك: <strong className="font-mono">{voucher.check_number}</strong></span>
                <span>البنك المسحوب عليه: <strong>{voucher.bank_name || 'البنك المغربي'}</strong></span>
              </div>
            )}
          </div>

          {/* Reason / Notes */}
          {voucher.notes && (
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-xs">
              <span className="text-slate-500 block mb-1">بيان وموضوع النفقة (Motif de la dépense):</span>
              <p className="text-slate-800 font-medium">{voucher.notes}</p>
            </div>
          )}

          {/* Amount Box */}
          <div className="border-2 border-slate-900 rounded-xl p-4 bg-slate-50 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500">المبلغ الإجمالي المنصرف (Montant Décaissement):</div>
              <div className="text-xs font-semibold text-slate-700 italic mt-1 leading-relaxed">
                « {amountInWords} »
              </div>
            </div>
            <div className="text-left bg-white px-4 py-2 rounded-lg border border-slate-300 shadow-sm">
              <span className="text-xl font-black text-slate-950 font-mono tracking-tight">
                {formatMAD(voucher.amount)}
              </span>
            </div>
          </div>

          {/* Signatures & Visas */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-200 text-center text-xs">
            <div className="h-28 border border-dashed border-slate-300 rounded-xl p-2 flex flex-col justify-between">
              <span className="font-bold text-slate-700">توقيع المستلم (Émargement)</span>
              <div className="text-[10px] text-slate-500">توصلت بالمبلغ المذكور أعلاه</div>
            </div>
            <div className="h-28 border border-dashed border-slate-300 rounded-xl p-2 flex flex-col justify-between">
              <span className="font-bold text-slate-700">أمين الصندوق (Le Caissier)</span>
              <div className="text-[10px] text-slate-500">تأشيرة الصرف</div>
            </div>
            <div className="h-28 border border-dashed border-slate-300 rounded-xl p-2 flex flex-col justify-between">
              <span className="font-bold text-slate-700">الإدارة العامة والمالية</span>
              <div className="text-[10px] text-slate-500">الموافقة والاعتماد</div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-2 text-[10px] text-slate-500 font-mono">
            وثيقة مالية رسمية صادرة آلياً عن نظام الرقابة والتدقيق المستقل ArouaAudit &middot; {new Date().toLocaleDateString('ar-MA')}
          </div>
        </div>
      </div>
    </div>
  );
};
