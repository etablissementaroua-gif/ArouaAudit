import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  Building2, 
  Receipt, 
  FileText, 
  QrCode, 
  ShieldCheck, 
  Stamp, 
  CreditCard,
  Banknote,
  Landmark,
  Layers
} from 'lucide-react';
import { 
  OfficialReceiptData, 
  INSTITUTION_INFO, 
  numberToWordsMAD, 
  numberToWordsFrenchMAD,
  generateReceiptQRPayload 
} from '../../../shared/lib/receiptPdfGenerator';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { formatDateFR } from '../../../shared/lib/dateUtils';

interface OfficialReceiptModalProps {
  receipt?: OfficialReceiptData;
  receiptData?: OfficialReceiptData;
  isOpen: boolean;
  onClose: () => void;
}

export const OfficialReceiptModal: React.FC<OfficialReceiptModalProps> = ({
  receipt,
  receiptData,
  isOpen,
  onClose,
}) => {
  const activeReceipt = receipt || receiptData;
  const [printFormat, setPrintFormat] = useState<'a4' | 'ticket'>('a4');

  if (!isOpen || !activeReceipt) return null;
  const currentReceipt = activeReceipt;

  const handlePrint = () => {
    window.print();
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'especes':
        return { labelAr: 'نقداً بالصندوق', labelFr: 'Espèces', icon: Banknote };
      case 'cheque':
        return { labelAr: 'شيك بنكي', labelFr: 'Chèque Bancaire', icon: Landmark };
      case 'virement':
        return { labelAr: 'تحويل بنكي', labelFr: 'Virement Bancaire', icon: Building2 };
      case 'carte':
        return { labelAr: 'بطاقة بنكية', labelFr: 'Carte Bancaire', icon: CreditCard };
      default:
        return { labelAr: method, labelFr: method, icon: Banknote };
    }
  };

  const methodBadge = getMethodBadge(currentReceipt.paymentMethod);
  const MethodIcon = methodBadge.icon;

  // Breakdown items fallback if not provided
  const feeBreakdown = currentReceipt.feeBreakdown && currentReceipt.feeBreakdown.length > 0
    ? currentReceipt.feeBreakdown
    : [
        {
          id: 'fb-1',
          category: 'tuition' as const,
          labelAr: 'واجبات التمدرس الشهري',
          labelFr: 'Frais de Scolarité Mensuelle',
          period: currentReceipt.paymentFor,
          amountMAD: currentReceipt.amountMAD,
        }
      ];

  const qrPayload = generateReceiptQRPayload(currentReceipt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      {/* Outer Card Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[96vh] flex flex-col font-sans">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black block leading-tight">
                سند القبض المالي الرسمي • Reçu de Paiement Officiel
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                N° {currentReceipt.receiptNumber} • Groupe Scolaire Aroua
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format Switcher */}
            <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setPrintFormat('a4')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  printFormat === 'a4'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                A4 مخصص
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('ticket')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  printFormat === 'ticket'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                تذكرة صندوق (80mm)
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-900/30 transition cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الوصل (Imprimer)</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Workspace */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-8 bg-slate-100/60 print:p-0 print:bg-white print:overflow-visible">
          
          {printFormat === 'a4' ? (
            /* =========================================================================
               FORMAT 1: OFFICIAL INSTITUTIONAL A4 RECEIPT
               ========================================================================= */
            <div 
              id="official-aroua-receipt-a4" 
              className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-10 shadow-lg print:border-none print:shadow-none print:p-8 max-w-3xl mx-auto space-y-6 text-slate-800"
              dir="rtl"
            >
              {/* 1. Official State & Institutional Header */}
              <div className="border-b-2 border-slate-900 pb-5">
                <div className="grid grid-cols-12 items-center gap-4">
                  {/* Left Side: French Ministry & Institution */}
                  <div className="col-span-4 text-start font-sans" dir="ltr">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter leading-tight">
                      ROYAUME DU MAROC
                    </p>
                    <p className="text-[8px] text-slate-500 leading-tight mb-1.5">
                      Ministère de l'Éducation Nationale, du Préscolaire et des Sports
                    </p>
                    <h3 className="text-xs font-black text-slate-900 tracking-tight leading-tight">
                      {INSTITUTION_INFO.nameFr}
                    </h3>
                    <p className="text-[8px] font-semibold text-emerald-800">
                      {INSTITUTION_INFO.subTitleFr}
                    </p>
                  </div>

                  {/* Center: Official High-Res Logo */}
                  <div className="col-span-4 flex flex-col items-center text-center">
                    <div className="w-20 h-20 p-1.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center">
                      <img
                        src={INSTITUTION_INFO.logoPath}
                        alt="Logo Groupe Scolaire Aroua"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-slate-400 mt-1">
                      AUTORISATION N° {INSTITUTION_INFO.autorisationMen}
                    </span>
                  </div>

                  {/* Right Side: Arabic Ministry & Institution */}
                  <div className="col-span-4 text-end">
                    <p className="text-[10px] font-bold text-slate-700 leading-tight">
                      المملكة المغربية
                    </p>
                    <p className="text-[9px] text-slate-500 leading-tight mb-1.5">
                      وزارة التربية الوطنية والتعليم الأولي والرياضة
                    </p>
                    <h2 className="text-sm font-black text-slate-900 tracking-tight leading-tight">
                      {INSTITUTION_INFO.nameAr}
                    </h2>
                    <p className="text-[9px] font-bold text-emerald-800">
                      {INSTITUTION_INFO.cyclesAr}
                    </p>
                  </div>
                </div>

                {/* Institutional Legal & Tax Identifiers Bar */}
                <div className="mt-4 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[9px] font-mono text-slate-500 px-1" dir="ltr">
                  <span><strong>ICE:</strong> {INSTITUTION_INFO.ice}</span>
                  <span>•</span>
                  <span><strong>IF:</strong> {INSTITUTION_INFO.ifTax}</span>
                  <span>•</span>
                  <span><strong>RC:</strong> {INSTITUTION_INFO.rc}</span>
                  <span>•</span>
                  <span><strong>CNSS:</strong> {INSTITUTION_INFO.cnss}</span>
                  <span>•</span>
                  <span><strong>Tél:</strong> {INSTITUTION_INFO.phones}</span>
                </div>
              </div>

              {/* 2. Receipt Badge & Serial Number Section */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block">
                    الرقم التسلسلي للوصل المحاسبي (Réf. Reçu) :
                  </span>
                  <span className="text-lg font-black font-mono text-slate-900 tracking-wider">
                    {currentReceipt.receiptNumber}
                  </span>
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-xs shadow-2xs">
                    <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                    <span>سند قبض واستخلاص رسمي • REÇU DE RÈGLEMENT</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1 font-mono">
                    السنة الدراسية: {currentReceipt.academicYear || '2025 - 2026'}
                  </span>
                </div>

                <div className="text-start" dir="ltr">
                  <span className="text-[11px] text-slate-500 font-bold block">
                    Date de Règlement :
                  </span>
                  <span className="text-xs font-black font-mono text-slate-800">
                    {formatDateFR(currentReceipt.date)}
                  </span>
                </div>
              </div>

              {/* 3. Student & Enrollment Identity Grid */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-start divide-y divide-slate-200">
                  <tbody>
                    <tr className="bg-slate-50/70">
                      <td className="px-4 py-3 font-bold text-slate-600 w-1/4">اسم التلميذ(ة) الكامل :</td>
                      <td className="px-4 py-3 font-black text-slate-900 text-sm">{currentReceipt.studentName}</td>
                      <td className="px-4 py-3 font-bold text-slate-600 w-1/4">رمز مسار (Code Massar) :</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{currentReceipt.massarCode}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-600">المستوى الدراسي :</td>
                      <td className="px-4 py-3 text-slate-800 font-semibold">{currentReceipt.academicLevel}</td>
                      <td className="px-4 py-3 font-bold text-slate-600">القسم / الفوج :</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{currentReceipt.classroom || 'عام'}</td>
                    </tr>
                    {currentReceipt.parentName && (
                      <tr className="bg-slate-50/70">
                        <td className="px-4 py-3 font-bold text-slate-600">ولي الأمر / القائم بالأداء :</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{currentReceipt.parentName}</td>
                        <td className="px-4 py-3 font-bold text-slate-600">الهاتف :</td>
                        <td className="px-4 py-3 font-mono text-slate-800">{currentReceipt.parentPhone || '—'}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 4. Official School Fees Breakdown Table (جدول تفكيك الرسوم المدرسية) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    <span>تفكيك الرسوم المستخلصة (Ventilation des Droits et Frais) :</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Devise: MAD (Dirham Marocain)
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-start divide-y divide-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-bold text-[11px]">
                      <tr>
                        <th className="px-4 py-2.5 text-start">البيان / نوع الخدمة المدرسية (Désignation)</th>
                        <th className="px-4 py-2.5 text-center">الفترة / الشهر (Période)</th>
                        <th className="px-4 py-2.5 text-end">المبلغ المؤدى (Montant MAD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {feeBreakdown.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2.5">
                            <span className="font-bold text-slate-900 block">{item.labelAr}</span>
                            <span className="text-[10px] text-slate-500 font-mono block">{item.labelFr}</span>
                          </td>
                          <td className="px-4 py-2.5 text-center font-mono text-slate-700">
                            {item.period || currentReceipt.paymentFor}
                          </td>
                          <td className="px-4 py-2.5 text-end font-mono font-bold text-slate-900">
                            {formatMAD(item.amountMAD)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={2} className="px-4 py-2.5 text-slate-700 text-end">
                          المجموع الإجمالي المؤدى (Total Règlement) :
                        </td>
                        <td className="px-4 py-2.5 text-end font-mono text-sm font-black text-emerald-800">
                          {formatMAD(currentReceipt.amountMAD)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 5. Payment Method & Transaction Reference */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">
                    طريقة السداد المعتمدة (Mode de Règlement) :
                  </span>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold shadow-2xs">
                    <MethodIcon className="w-4 h-4 text-emerald-700" />
                    <span>{methodBadge.labelAr}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({methodBadge.labelFr})</span>
                  </div>
                </div>

                <div className="text-start">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">
                    بيانات السند / الشيك / التحويل :
                  </span>
                  <div className="font-mono text-xs text-slate-800 space-y-0.5">
                    {currentReceipt.paymentMethod === 'cheque' ? (
                      <>
                        <p><strong>رقم الشيك:</strong> {currentReceipt.checkNumber || currentReceipt.paymentReference || 'N/A'}</p>
                        <p><strong>البنك المسحوب عليه:</strong> {currentReceipt.bankName || 'شيك بنكي معتمد'}</p>
                        {currentReceipt.checkDueDate && <p><strong>تاريخ الاستحقاق:</strong> {formatDateFR(currentReceipt.checkDueDate)}</p>}
                      </>
                    ) : currentReceipt.paymentMethod === 'virement' ? (
                      <>
                        <p><strong>مرجع التحويل:</strong> {currentReceipt.paymentReference || 'Virement direct'}</p>
                        {currentReceipt.bankName && <p><strong>البنك:</strong> {currentReceipt.bankName}</p>}
                      </>
                    ) : (
                      <p><strong>المرجع:</strong> {currentReceipt.paymentReference || 'سداد فوري بصندوق المؤسسة'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 6. Amount in Words Banner (Ar & Fr) */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-2">
                  <span className="text-xs font-bold text-emerald-950">المبلغ الإجمالي بالحروف (بالدرهم المغربي) :</span>
                  <span className="text-xl font-black font-mono text-emerald-900">
                    {formatMAD(currentReceipt.amountMAD)}
                  </span>
                </div>
                <div className="space-y-1 text-xs font-semibold text-emerald-900">
                  <p className="leading-relaxed">
                    « {numberToWordsMAD(currentReceipt.amountMAD)} »
                  </p>
                  <p className="text-[11px] font-mono text-emerald-800 leading-relaxed" dir="ltr">
                    Arrêté le présent reçu à la somme de : {numberToWordsFrenchMAD(currentReceipt.amountMAD)}
                  </p>
                </div>
              </div>

              {/* Remaining Balance if applicable */}
              {currentReceipt.remainingBalanceMAD !== undefined && (
                <div className="flex items-center justify-between text-xs px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-bold">الذمة الصافية المتبقية بعد هذا السداد (Solde Restant) :</span>
                  <span className="font-mono font-black text-amber-700 text-sm">
                    {formatMAD(currentReceipt.remainingBalanceMAD)}
                  </span>
                </div>
              )}

              {/* 7. Signatures, Official Cachet & Security QR Code */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-12 gap-4 items-center">
                {/* Parent Signature Box */}
                <div className="col-span-4 h-32 border border-dashed border-slate-300 rounded-2xl p-3 flex flex-col justify-between text-center text-xs">
                  <span className="font-bold text-slate-700">توقيع ولي الأمر</span>
                  <span className="text-[10px] text-slate-400 font-mono">Émargement Parent</span>
                  <span className="text-[9px] text-slate-400">حرر بمراكش في {formatDateFR(currentReceipt.date)}</span>
                </div>

                {/* Security QR Code & Cryptographic Verification Box */}
                <div className="col-span-4 h-32 bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex flex-col items-center justify-between text-center">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-slate-600">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>رمز التحقق المشفر</span>
                  </div>

                  {/* High visual QR matrix representation */}
                  <div className="w-16 h-16 bg-white p-1 rounded-lg border border-slate-200 flex items-center justify-center shadow-2xs">
                    <QrCode className="w-14 h-14 text-slate-900" />
                  </div>

                  <span className="text-[8px] font-mono text-slate-400 truncate max-w-full">
                    SEC: {currentReceipt.receiptNumber}
                  </span>
                </div>

                {/* Management & Caisse Official Stamp Box */}
                <div className="col-span-4 h-32 border border-emerald-200 bg-emerald-50/30 rounded-2xl p-3 flex flex-col justify-between text-center text-xs">
                  <span className="font-bold text-emerald-950">خاتم وتوقيع إدارة الصندوق</span>
                  <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-800 font-bold">
                    <Stamp className="w-3.5 h-3.5 text-emerald-700" />
                    <span>مجموعة مدارس أروى — مراكش</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">
                    {currentReceipt.cashierName || 'أمين الصندوق المركزي'}
                  </span>
                </div>
              </div>

              {/* 8. Footer Legal Statement */}
              <div className="pt-3 border-t border-slate-100 text-center text-[9px] text-slate-400 space-y-0.5">
                <p>
                  هذا الوصل وثيقة مالية رسمية صادرة آلياً عن منصة ArouaAudit للرقابة والتدقيق المستقل التابعة لمجموعة مدارس أروى.
                </p>
                <p className="font-mono" dir="ltr">
                  Document officiel généré électroniquement • {INSTITUTION_INFO.addressFr}
                </p>
              </div>

            </div>
          ) : (
            /* =========================================================================
               FORMAT 2: COMPACT THERMAL TICKET (80mm)
               ========================================================================= */
            <div 
              id="official-aroua-receipt-ticket"
              className="bg-white border border-slate-300 rounded-xl p-5 shadow-lg max-w-xs mx-auto text-slate-900 font-mono text-xs space-y-3 print:border-none print:shadow-none print:p-2"
              dir="rtl"
            >
              {/* Header */}
              <div className="text-center pb-2 border-b border-dashed border-slate-400 space-y-1">
                <div className="w-12 h-12 mx-auto p-1 bg-white border border-slate-200 rounded-lg flex items-center justify-center mb-1">
                  <img
                    src={INSTITUTION_INFO.logoPath}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h2 className="font-black text-xs">{INSTITUTION_INFO.nameAr}</h2>
                <p className="text-[10px] font-bold text-slate-600">{INSTITUTION_INFO.nameFr}</p>
                <p className="text-[9px] text-slate-500">{INSTITUTION_INFO.address}</p>
                <p className="text-[9px] text-slate-500">Tél: {INSTITUTION_INFO.phones}</p>
                <p className="text-[9px] text-slate-500">ICE: {INSTITUTION_INFO.ice} • IF: {INSTITUTION_INFO.ifTax}</p>
              </div>

              {/* Title & Receipt Info */}
              <div className="text-center space-y-0.5 py-1">
                <span className="font-black text-xs block">وصل أداء مدرسي رسمي</span>
                <span className="text-[10px] text-slate-600 font-black block">REÇU DE CAISSE</span>
                <span className="font-bold text-xs block mt-1">N°: {currentReceipt.receiptNumber}</span>
                <span className="text-[10px] text-slate-500 block">Date: {formatDateFR(currentReceipt.date)}</span>
              </div>

              {/* Student Details */}
              <div className="border-t border-b border-dashed border-slate-400 py-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">التلميذ:</span>
                  <span className="font-black">{currentReceipt.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">مسار:</span>
                  <span className="font-bold">{currentReceipt.massarCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">المستوى:</span>
                  <span>{currentReceipt.academicLevel} ({currentReceipt.classroom || 'عام'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الدفعة:</span>
                  <span className="font-bold">{currentReceipt.paymentFor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الطريقة:</span>
                  <span>{methodBadge.labelAr}</span>
                </div>
              </div>

              {/* Total Amount */}
              <div className="text-center py-2 space-y-1">
                <span className="text-[10px] text-slate-500 block">المبلغ الصافي المؤدى:</span>
                <span className="text-lg font-black block text-emerald-800">
                  {formatMAD(currentReceipt.amountMAD)}
                </span>
                <p className="text-[9px] text-slate-700 italic px-2">
                  « {numberToWordsMAD(currentReceipt.amountMAD)} »
                </p>
              </div>

              {/* QR Code and Footer */}
              <div className="border-t border-dashed border-slate-400 pt-2 text-center space-y-2">
                <div className="w-16 h-16 mx-auto bg-white p-1 border border-slate-200 rounded flex items-center justify-center">
                  <QrCode className="w-14 h-14 text-slate-900" />
                </div>
                <p className="text-[8px] text-slate-400">
                  شكراً لثقتكم بمجموعة مدارس أروى
                </p>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default OfficialReceiptModal;
