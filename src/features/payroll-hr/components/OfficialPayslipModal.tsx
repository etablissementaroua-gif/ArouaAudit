import React from 'react';
import { 
  X, 
  Printer, 
  Building2, 
  FileText, 
  QrCode, 
  ShieldCheck, 
  Stamp, 
  CreditCard,
  Banknote,
  Landmark,
  UserCheck
} from 'lucide-react';
import { 
  OfficialPayslipData, 
  INSTITUTION_INFO, 
  numberToWordsMAD, 
  numberToWordsFrenchMAD,
  generatePayslipQRPayload 
} from '../../../shared/lib/receiptPdfGenerator';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { formatDateFR } from '../../../shared/lib/dateUtils';

interface OfficialPayslipModalProps {
  payslip: OfficialPayslipData;
  isOpen: boolean;
  onClose: () => void;
}

export const OfficialPayslipModal: React.FC<OfficialPayslipModalProps> = ({
  payslip,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'especes':
        return { labelAr: 'نقداً بالصندوق', labelFr: 'Espèces', icon: Banknote };
      case 'cheque':
        return { labelAr: 'شيك بنكي', labelFr: 'Chèque', icon: Landmark };
      case 'virement':
      default:
        return { labelAr: 'تحويل بنكي', labelFr: 'Virement Bancaire', icon: Building2 };
    }
  };

  const methodBadge = getMethodBadge(payslip.paymentMethod);
  const MethodIcon = methodBadge.icon;

  const totalGains = payslip.grossSalary || (payslip.baseSalary + (payslip.seniorityAllowance || 0) + (payslip.responsibilityAllowance || 0));
  const totalRetenues = payslip.totalDeductions || (payslip.advancesDeducted + payslip.creditDeducted + (payslip.otherDeductions || 0));
  const netFinal = payslip.netSalary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      {/* Outer Card Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[96vh] flex flex-col font-sans">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black block leading-tight">
                كشف الراتب والأجور الرسمي • Bulletin de Paie Officiel
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                {payslip.employeeName} • Mois: {payslip.month}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-900/30 transition cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة كشف الراتب (Imprimer)</span>
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

        {/* Printable Workspace */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-8 bg-slate-100/60 print:p-0 print:bg-white print:overflow-visible">
          
          <div 
            id="official-aroua-payslip" 
            className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-10 shadow-lg print:border-none print:shadow-none print:p-8 max-w-3xl mx-auto space-y-6 text-slate-800"
            dir="rtl"
          >
            {/* 1. Official State & Institutional Header */}
            <div className="border-b-2 border-slate-900 pb-5">
              <div className="grid grid-cols-12 items-center gap-4">
                {/* Left Side: French Header */}
                <div className="col-span-4 text-start font-sans" dir="ltr">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter leading-tight">
                    ROYAUME DU MAROC
                  </p>
                  <p className="text-[8px] text-slate-500 leading-tight mb-1.5">
                    Ministère de l'Éducation Nationale
                  </p>
                  <h3 className="text-xs font-black text-slate-900 tracking-tight leading-tight">
                    {INSTITUTION_INFO.nameFr}
                  </h3>
                  <p className="text-[8px] font-semibold text-emerald-800">
                    {INSTITUTION_INFO.subTitleFr}
                  </p>
                </div>

                {/* Center: Official Logo */}
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

                {/* Right Side: Arabic Header */}
                <div className="col-span-4 text-end">
                  <p className="text-[10px] font-bold text-slate-700 leading-tight">
                    المملكة المغربية
                  </p>
                  <p className="text-[9px] text-slate-500 leading-tight mb-1.5">
                    وزارة التربية الوطنية والتعليم الأولي
                  </p>
                  <h2 className="text-sm font-black text-slate-900 tracking-tight leading-tight">
                    {INSTITUTION_INFO.nameAr}
                  </h2>
                  <p className="text-[9px] font-bold text-emerald-800">
                    {INSTITUTION_INFO.cyclesAr}
                  </p>
                </div>
              </div>

              {/* Tax & Social Identifiers Bar */}
              <div className="mt-4 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[9px] font-mono text-slate-500 px-1" dir="ltr">
                <span><strong>ICE:</strong> {INSTITUTION_INFO.ice}</span>
                <span>•</span>
                <span><strong>IF:</strong> {INSTITUTION_INFO.ifTax}</span>
                <span>•</span>
                <span><strong>CNSS Entreprise:</strong> {INSTITUTION_INFO.cnss}</span>
                <span>•</span>
                <span><strong>RC:</strong> {INSTITUTION_INFO.rc}</span>
                <span>•</span>
                <span><strong>Marrakech</strong></span>
              </div>
            </div>

            {/* 2. Payslip Title & Period Section */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 font-bold block">
                  رقم بيان الراتب (Réf. Bulletin) :
                </span>
                <span className="text-lg font-black font-mono text-slate-900 tracking-wider">
                  {payslip.slipNumber}
                </span>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-xs shadow-2xs">
                  <FileText className="w-3.5 h-3.5 text-emerald-700" />
                  <span>بيان الأجور والمستحقات • BULLETIN DE PAIE</span>
                </div>
                <span className="text-[10px] text-slate-600 block mt-1 font-bold font-mono">
                  شـهـر: {payslip.month}
                </span>
              </div>

              <div className="text-start" dir="ltr">
                <span className="text-[11px] text-slate-500 font-bold block">
                  Date d'Émission :
                </span>
                <span className="text-xs font-black font-mono text-slate-800">
                  {formatDateFR(payslip.dateIssued)}
                </span>
              </div>
            </div>

            {/* 3. Employee Personal & Professional Identity Grid */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-start divide-y divide-slate-200">
                <tbody>
                  <tr className="bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-600 w-1/4">اسم الموظف(ة) الكامل :</td>
                    <td className="px-4 py-3 font-black text-slate-900 text-sm">{payslip.employeeName}</td>
                    <td className="px-4 py-3 font-bold text-slate-600 w-1/4">رقم التعريف المهني (Matricule) :</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{payslip.employeeId}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-slate-600">الصفة / المنصب (Fonction) :</td>
                    <td className="px-4 py-3 text-slate-800 font-semibold">{payslip.roleOrTitle}</td>
                    <td className="px-4 py-3 font-bold text-slate-600">المصلحة / السلك التعليمي :</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{payslip.department}</td>
                  </tr>
                  <tr className="bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-600">رقم ب.ت.و (CIN) :</td>
                    <td className="px-4 py-3 font-mono text-slate-800">{payslip.cin || 'EE123456'}</td>
                    <td className="px-4 py-3 font-bold text-slate-600">رقم الصندوق الوطني (CNSS) :</td>
                    <td className="px-4 py-3 font-mono text-slate-800">{payslip.cnssNumber || '189452367'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. Salary & Allowances Detailed Matrix (مصفوفة الرواتب والتعويضات والاقتطاعات) */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-900 px-1">
                تفكيك عناصر الراتب والاقتطاعات (Détail des Éléments de Rémunération) :
              </h4>

              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-start divide-y divide-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[11px]">
                    <tr>
                      <th className="px-4 py-2.5 text-start w-1/2">بيان عنصر الأجر (Désignation)</th>
                      <th className="px-4 py-2.5 text-center">المستحقات (Gains MAD)</th>
                      <th className="px-4 py-2.5 text-center">الاقتطاعات (Retenues MAD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Base Salary */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5">
                        <span className="font-bold text-slate-900 block">الراتب الأساسي الشهري</span>
                        <span className="text-[10px] text-slate-500 font-mono block">Salaire de Base</span>
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono font-bold text-slate-800">
                        {formatMAD(payslip.baseSalary)}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono text-slate-400">—</td>
                    </tr>

                    {/* Seniority or Function Allowance */}
                    {(payslip.seniorityAllowance || 0) > 0 && (
                      <tr className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5">
                          <span className="font-bold text-slate-900 block">تعويض الأقدمية والمهام</span>
                          <span className="text-[10px] text-slate-500 font-mono block">Prime d'Ancienneté / Fonction</span>
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono font-bold text-slate-800">
                          {formatMAD(payslip.seniorityAllowance!)}
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono text-slate-400">—</td>
                      </tr>
                    )}

                    {/* Deductions: Advances sur Salaire */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5">
                        <span className="font-bold text-slate-900 block">اقتطاع التسبيقات على الراتب</span>
                        <span className="text-[10px] text-slate-500 font-mono block">Avances sur Salaire du mois</span>
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono text-slate-400">—</td>
                      <td className="px-4 py-2.5 text-center font-mono font-bold text-amber-700">
                        {payslip.advancesDeducted > 0 ? `-${formatMAD(payslip.advancesDeducted)}` : '0,00 MAD'}
                      </td>
                    </tr>

                    {/* Deductions: Previous Debts */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5">
                        <span className="font-bold text-slate-900 block">اقتطاع السلف والديون السابقة العالقة</span>
                        <span className="text-[10px] text-slate-500 font-mono block">Retenues sur Dettes & Avances Antérieures</span>
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono text-slate-400">—</td>
                      <td className="px-4 py-2.5 text-center font-mono font-bold text-rose-600">
                        {payslip.creditDeducted > 0 ? `-${formatMAD(payslip.creditDeducted)}` : '0,00 MAD'}
                      </td>
                    </tr>
                  </tbody>

                  {/* Summary Totals */}
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td className="px-4 py-2.5 text-slate-700">
                        المجاميع الفرعية (Sous-Totaux) :
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono text-slate-900">
                        {formatMAD(totalGains)}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono text-rose-700">
                        -{formatMAD(totalRetenues)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 5. Net Payable Banner (المبلغ الصافي المستحق بالأرقام والحروف) */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border-2 border-emerald-500/40 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-2">
                <div>
                  <span className="text-xs font-bold text-emerald-950 block">
                    صافي الراتب المستحق والمؤدى (NET À PAYER) :
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono">
                    Mode de Règlement : {methodBadge.labelAr} ({methodBadge.labelFr})
                  </span>
                </div>
                <span className="text-2xl font-black font-mono text-emerald-900">
                  {formatMAD(netFinal)}
                </span>
              </div>
              <div className="space-y-1 text-xs font-semibold text-emerald-900">
                <p className="leading-relaxed">
                  « {numberToWordsMAD(netFinal)} »
                </p>
                <p className="text-[11px] font-mono text-emerald-800 leading-relaxed" dir="ltr">
                  Net à payer en Dirhams : {numberToWordsFrenchMAD(netFinal)}
                </p>
              </div>
            </div>

            {/* 6. Signatures, Seals & QR Code Box */}
            <div className="pt-4 border-t border-slate-200 grid grid-cols-12 gap-4 items-center">
              {/* Employee Signature */}
              <div className="col-span-4 h-32 border border-dashed border-slate-300 rounded-2xl p-3 flex flex-col justify-between text-center text-xs">
                <span className="font-bold text-slate-700">توقيع وإمضاء الموظف(ة)</span>
                <span className="text-[10px] text-slate-400 font-mono">Émargement du Salarié</span>
                <span className="text-[9px] text-slate-400">Pour acquit et solde</span>
              </div>

              {/* Security QR Code */}
              <div className="col-span-4 h-32 bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex flex-col items-center justify-between text-center">
                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>التحقق الرقمي المعتمد</span>
                </div>
                <div className="w-16 h-16 bg-white p-1 rounded-lg border border-slate-200 flex items-center justify-center shadow-2xs">
                  <QrCode className="w-14 h-14 text-slate-900" />
                </div>
                <span className="text-[8px] font-mono text-slate-400 truncate max-w-full">
                  PAY: {payslip.slipNumber}
                </span>
              </div>

              {/* Institution Seal */}
              <div className="col-span-4 h-32 border border-emerald-200 bg-emerald-50/30 rounded-2xl p-3 flex flex-col justify-between text-center text-xs">
                <span className="font-bold text-emerald-950">خاتم وتوقيع إدارة المؤسسة</span>
                <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-800 font-bold">
                  <Stamp className="w-3.5 h-3.5 text-emerald-700" />
                  <span>مجموعة مدارس أروى — مراكش</span>
                </div>
                <span className="text-[9px] text-slate-500 font-mono">
                  Direction Générale & Ressources Humaines
                </span>
              </div>
            </div>

            {/* 7. Footer Notice */}
            <div className="pt-3 border-t border-slate-100 text-center text-[9px] text-slate-400 space-y-0.5">
              <p>
                وثيقة رسمية صادرة عن منظومة ArouaAudit للرقابة المحاسبية والتدقيق الإداري لمجموعة مدارس أروى.
              </p>
              <p className="font-mono" dir="ltr">
                Pour faire valoir ce que de droit • Conservez ce bulletin sans limitation de durée
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default OfficialPayslipModal;
