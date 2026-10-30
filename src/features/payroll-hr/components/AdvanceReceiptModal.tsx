import React from 'react';
import { 
  X, 
  Printer, 
  Building2, 
  Banknote, 
  CreditCard, 
  Landmark, 
  ShieldCheck, 
  FileText, 
  Calendar,
  CheckCircle2,
  Stamp,
  UserCheck
} from 'lucide-react';
import { 
  INSTITUTION_INFO, 
  numberToWordsMAD, 
  numberToWordsFrenchMAD 
} from '../../../shared/lib/receiptPdfGenerator';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { formatDateFR } from '../../../shared/lib/dateUtils';
import { StaffAdvance, Employee } from '../models/payroll.types';

interface AdvanceReceiptModalProps {
  advance: StaffAdvance | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AdvanceReceiptModal: React.FC<AdvanceReceiptModalProps> = ({
  advance,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !advance) return null;

  const handlePrint = () => {
    window.print();
  };

  const emp = advance.employee;
  const advanceAmount = Number(advance.amount) || 0;
  const wordsAr = numberToWordsMAD(advanceAmount);
  const wordsFr = numberToWordsFrenchMAD(advanceAmount);

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'espece':
      case 'especes':
        return { labelAr: 'نقداً من الصندوق المركزي', labelFr: 'Espèces', icon: Banknote };
      case 'cheque':
        return { labelAr: 'شيك بنكي', labelFr: 'Chèque Bancaire', icon: Landmark };
      case 'virement':
      default:
        return { labelAr: 'تحويل بنكي', labelFr: 'Virement Bancaire', icon: Building2 };
    }
  };

  const methodBadge = getMethodBadge(advance.payment_method);
  const MethodIcon = methodBadge.icon;

  const formattedActualDate = advance.advance_date ? formatDateFR(advance.advance_date) : formatDateFR(new Date());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fade-in">
      {/* Outer Card Container */}
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[96vh] flex flex-col font-sans">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black block leading-tight">
                سند استلام تسبيق مالي رسمي • Bon d'Avance sur Salaire
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                {emp?.full_name || 'موظف بمجموعة مدارس أروى'} • مرجع: {advance.id}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة السند الرسمي (A4 / A5)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-6 print:p-0 print:m-0 print:overflow-visible text-slate-900" dir="rtl">
          
          {/* 1. Official Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-sm shadow-xs">
                  AR
                </div>
                <div>
                  <h1 className="text-base font-black text-slate-900 tracking-tight leading-none">
                    {INSTITUTION_INFO.nameAr}
                  </h1>
                  <span className="text-[10px] font-bold text-slate-500 tracking-wider font-mono block mt-0.5">
                    {INSTITUTION_INFO.nameFr.toUpperCase()}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight pt-1">
                المديرية الإقليمية لمراكش • الأكاديمية الجهوية مراكش-آسفي
              </p>
              <p className="text-[9px] text-slate-400 font-mono">
                ICE: {INSTITUTION_INFO.ice} | IF: {INSTITUTION_INFO.ifTax} | RC: {INSTITUTION_INFO.rc}
              </p>
            </div>

            <div className="text-left font-mono space-y-1" dir="ltr">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>BON D'AVANCE SUR SALAIRE</span>
              </div>
              <div className="text-[11px] text-slate-600 font-bold block pt-1">
                N°: <span className="text-emerald-700 font-black">{advance.id.toUpperCase()}</span>
              </div>
              <div className="text-[10px] text-slate-500">
                Date d'effet: <strong className="text-slate-800">{formattedActualDate}</strong>
              </div>
            </div>
          </div>

          {/* 2. Document Banner Title */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-1">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              سـنـد اسـتـلام تـسـبـيـق مـالـي عـلـى الـراتـب
            </h2>
            <p className="text-[11px] font-semibold text-slate-600">
              وصل استلام مالي رسمي وموافقة على الخصم المحاسبي من راتب شهر ({advance.month_reference})
            </p>
          </div>

          {/* 3. Beneficiary Employee Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-slate-400 block border-b border-slate-200 pb-1">
                بيانات الموظف / الأستاذ المستفيد (Bénéficiaire)
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">الاسم الكامل:</span>
                  <span className="font-bold text-slate-900">{emp?.full_name || 'غير محدد'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">رقم البطاقة الوطنية (CIN):</span>
                  <span className="font-mono font-bold text-slate-900">{emp?.cin || 'غير مسجل'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">رقم التأجير / المعرف المالي:</span>
                  <span className="font-mono font-bold text-emerald-700">{emp?.external_staff_id || 'STF-AUDIT'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">السلك / القسم الوظيفي:</span>
                  <span className="font-semibold text-slate-800">{emp?.department || 'السلك الابتدائي'} • {emp?.role || 'أستاذ'}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-slate-400 block border-b border-slate-200 pb-1">
                تفاصيل العملية المالية والصرف (Modalités de Paiement)
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">تاريخ الصرف والاستلام الفعلي:</span>
                  <span className="font-mono font-bold text-slate-900">{formattedActualDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الشهر المالي للخصم من الراتب:</span>
                  <span className="font-mono font-bold text-rose-700">{advance.month_reference}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">طريقة الأداء:</span>
                  <span className="font-bold text-slate-800 inline-flex items-center gap-1">
                    <MethodIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{methodBadge.labelAr}</span>
                  </span>
                </div>
                {advance.check_number && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">رقم الشيك البنكي:</span>
                    <span className="font-mono font-bold text-slate-900">{advance.check_number}</span>
                  </div>
                )}
                {advance.notes && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">ملاحظات:</span>
                    <span className="text-slate-700 text-[11px] truncate max-w-[200px]">{advance.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Financial Amount Card with Words Breakdown */}
          <div className="p-5 bg-emerald-50/50 border-2 border-emerald-300 rounded-3xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 block">
                  المبلغ الصافي المسلم كتسبيق (Montant Net de l'Avance)
                </span>
                <span className="text-xs text-slate-500">
                  تم خصم المبلغ وتوثيقه في الصندوق المركزي للمؤسسة
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-800 text-left sm:text-right" dir="ltr">
                {formatMAD(advanceAmount)}
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <div className="text-xs text-slate-800 flex items-start gap-1.5">
                <span className="text-slate-500 font-semibold shrink-0">المبلغ بالحروف (عربي):</span>
                <span className="font-bold text-slate-900">{wordsAr}</span>
              </div>
              <div className="text-[11px] text-slate-700 flex items-start gap-1.5 font-mono" dir="ltr">
                <span className="text-slate-500 font-semibold shrink-0">Montant en lettres:</span>
                <span className="font-bold text-slate-900 capitalize">{wordsFr}</span>
              </div>
            </div>
          </div>

          {/* 5. Legal & Undertaking Text */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 leading-relaxed text-justify">
            <strong>إقرار بالاستلام والتفويض:</strong> يقر الأستاذ/الموظف الموقع أسفله باستلامه الفعلي لمبلغ التسبيق المحدد أعلاه كاملاً، 
            ويفوض إدارة مجموعة مدارس أروى باقتطاعه كلياً من مستحقات الراتب الشهري المحدد لشهر <strong>({advance.month_reference})</strong> دون أي اعتراض.
          </div>

          {/* 6. Dual Signatures & Stamps */}
          <div className="grid grid-cols-2 gap-6 pt-4">
            {/* Beneficiary Signature */}
            <div className="border border-slate-300 rounded-2xl p-4 text-center space-y-14 bg-white shadow-2xs">
              <div>
                <span className="text-xs font-black text-slate-900 block">
                  توقيع وإشهاد الموظف المستفيد
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  Émargement du Bénéficiaire
                </span>
                <span className="text-[9px] text-slate-400 italic mt-1 block">
                  (مسبوقاً بعبارة: قرأت ووافقت • Lu et approuvé)
                </span>
              </div>
              <div className="text-[10px] text-slate-300 font-mono">
                {emp?.full_name}
              </div>
            </div>

            {/* Financial Administration Stamp */}
            <div className="border border-slate-300 rounded-2xl p-4 text-center space-y-14 bg-white shadow-2xs">
              <div>
                <span className="text-xs font-black text-slate-900 block">
                  تأشيرة وخاتم الإدارة المالية والمحاسبية
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  Visa et Cachet de la Direction Financière
                </span>
                <span className="text-[9px] text-emerald-700 font-semibold mt-1 block">
                  مجموعة مدارس أروى للتعليم المدرسي الخصوصي
                </span>
              </div>
              <div className="text-[10px] text-slate-300 font-mono">
                ArouaAudit Trésorerie Centrale
              </div>
            </div>
          </div>

          {/* 7. Sovereign Print Footer */}
          <div className="border-t border-slate-200 pt-3 text-[9px] text-slate-400 flex items-center justify-between font-mono">
            <span>ArouaAudit Financial Sovereign Platform • Document ID: {advance.id}</span>
            <span>Edité le {formatDateFR(new Date())} • Système Anti-Fraude Actif</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdvanceReceiptModal;
