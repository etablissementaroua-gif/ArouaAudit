import React from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { formatDateFR } from '../../../shared/lib/dateUtils';
import { OfficialReceiptData, INSTITUTION_INFO, numberToWordsMAD } from '../../../shared/lib/receiptPdfGenerator';

interface OfficialReceiptModalProps {
  receipt: OfficialReceiptData;
  isOpen: boolean;
  onClose: () => void;
}

export const OfficialReceiptModal: React.FC<OfficialReceiptModalProps> = ({
  receipt,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getMethodLabel = (m: string) => {
    switch (m) {
      case 'especes':
        return 'نقداً (Espèces)';
      case 'cheque':
        return 'شيك بنكي (Chèque)';
      case 'virement':
        return 'تحويل بنكي (Virement)';
      default:
        return 'بطاقة بنكية (Carte)';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-300">
        
        {/* Modal Top Actions */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold">معاينة وطباعة الوصل المالي الرسمي (Reçu de Paiement)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              طباعة الوصل (Imprimer)
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Voucher Area */}
        <div className="p-8 font-sans space-y-6 print:p-6 print:m-0" id="official-aroua-receipt">
          
          {/* Header with Official Logo */}
          <div className="border-b-2 border-cyan-600 pb-5">
            <div className="flex flex-col items-center text-center">
              <div className="mb-2 inline-block p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <img
                  src={INSTITUTION_INFO.logoPath}
                  alt={INSTITUTION_INFO.nameAr}
                  className="h-24 w-auto object-contain mx-auto"
                />
              </div>

              <h1 className="text-lg font-black text-slate-900 tracking-tight">
                {INSTITUTION_INFO.nameAr}
              </h1>
              <p className="text-xs font-bold text-amber-600 mb-1">
                {INSTITUTION_INFO.cyclesAr}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                {INSTITUTION_INFO.address} | الهاتف: {INSTITUTION_INFO.phones} | البريد: {INSTITUTION_INFO.email}
              </p>
            </div>
          </div>

          {/* Receipt Title and N° */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div>
              <span className="text-xs text-slate-500 block">رقم الوصل المحاسبي:</span>
              <span className="font-mono font-black text-base text-cyan-700">{receipt.receiptNumber}</span>
            </div>
            <div className="text-center">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-cyan-100 text-cyan-800 border border-cyan-300">
                وصل أداء مدرسي (REÇU DE RÈGLEMENT)
              </span>
            </div>
            <div className="text-left">
              <span className="text-xs text-slate-500 block">تاريخ الإيداع:</span>
              <span className="font-mono font-bold text-xs text-slate-800">{formatDateFR(receipt.date)}</span>
            </div>
          </div>

          {/* Student & Payment Metadata Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-right divide-y divide-slate-200">
              <tbody>
                <tr className="bg-slate-50/50">
                  <td className="px-4 py-2.5 font-bold text-slate-600 w-1/4">اسم التلميذ(ة):</td>
                  <td className="px-4 py-2.5 font-black text-slate-900 text-sm">{receipt.studentName}</td>
                  <td className="px-4 py-2.5 font-bold text-slate-600 w-1/4">رمز مسار (Massar):</td>
                  <td className="px-4 py-2.5 font-mono font-bold text-slate-800">{receipt.massarCode}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-slate-600">المستوى الدراسي:</td>
                  <td className="px-4 py-2.5 text-slate-800 font-medium">{receipt.academicLevel}</td>
                  <td className="px-4 py-2.5 font-bold text-slate-600">القسم / الفوج:</td>
                  <td className="px-4 py-2.5 font-mono text-slate-800">{receipt.classroom || 'عام'}</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="px-4 py-2.5 font-bold text-slate-600">موضوع الدفعة:</td>
                  <td className="px-4 py-2.5 font-semibold text-cyan-800" colSpan={3}>
                    {receipt.paymentFor}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-slate-600">طريقة السداد:</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{getMethodLabel(receipt.paymentMethod)}</td>
                  <td className="px-4 py-2.5 font-bold text-slate-600">المرجع / الشيك:</td>
                  <td className="px-4 py-2.5 font-mono text-slate-800">{receipt.paymentReference || 'مباشر بالصندوق'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Amount Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-50 via-amber-50/40 to-cyan-50 border-2 border-cyan-600/30 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-600 block mb-0.5">المبلغ المسدد بالأرقام:</span>
              <span className="text-2xl font-black font-mono text-cyan-800">
                {formatMAD(receipt.amountMAD)}
              </span>
            </div>
            <div className="text-left max-w-xs">
              <span className="text-[11px] text-slate-500 block mb-0.5">المبلغ الصافي بالحروف:</span>
              <span className="text-xs font-bold text-slate-800 block">
                {numberToWordsMAD(receipt.amountMAD)}
              </span>
            </div>
          </div>

          {receipt.remainingBalanceMAD !== undefined && (
            <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-600 font-medium">الذمة الصافية المتبقية بعد هذا السداد:</span>
              <span className="font-mono font-bold text-amber-700">{formatMAD(receipt.remainingBalanceMAD)}</span>
            </div>
          )}

          {/* Signatures & Stamps */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-center">
            <div className="h-28 border border-dashed border-slate-300 rounded-xl p-3 flex flex-col justify-between">
              <span className="font-bold text-slate-600">توقيع ولي الأمر (Signature du Parent)</span>
              <span className="text-[10px] text-slate-400">حرر بمراكش، في {formatDateFR(receipt.date)}</span>
            </div>

            <div className="h-28 border border-dashed border-cyan-300 bg-cyan-50/20 rounded-xl p-3 flex flex-col justify-between">
              <span className="font-bold text-cyan-900">خاتم وتوقيع إدارة المؤسسة / الصندوق</span>
              <div className="flex items-center justify-center gap-1 text-[10px] text-cyan-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
                <span>إدارة الشؤون المالية - أروى</span>
              </div>
            </div>
          </div>

          {/* Legal Notice Footer */}
          <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
            هذا الوصل وثيقة مالية رسمية صادرة عن منظومة ArouaAudit المحاسبية التابعة لمجموعة مدارس أروى.
          </div>

        </div>

      </div>
    </div>
  );
};
