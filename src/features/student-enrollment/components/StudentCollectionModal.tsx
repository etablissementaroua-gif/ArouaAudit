import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  CreditCard, 
  Landmark, 
  Banknote, 
  CheckCircle2, 
  Calendar, 
  ShieldCheck, 
  Loader2, 
  Building2,
  Receipt,
  FileCheck,
  AlertTriangle
} from 'lucide-react';
import { StudentRecord } from '../models/enrollmentModels';
import { caisseService } from '../../treasury-caisse/services/caisseService';
import { checksManagementService } from '../../checks-management/services/checksManagement.service';
import { enrollmentService } from '../services/enrollmentService';
import { OfficialReceiptData } from '../../../shared/lib/receiptPdfGenerator';
import { formatMAD } from '../../../shared/lib/currencyFormatter';

interface StudentCollectionModalProps {
  student: StudentRecord;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (receipt: OfficialReceiptData) => void;
}

export const StudentCollectionModal: React.FC<StudentCollectionModalProps> = ({
  student,
  isOpen,
  onClose,
  onSuccess
}) => {
  // Fee Breakdown state
  const [tuitionChecked, setTuitionChecked] = useState(true);
  const [tuitionAmount, setTuitionAmount] = useState<number>(3000);

  const [transportChecked, setTransportChecked] = useState(true);
  const [transportAmount, setTransportAmount] = useState<number>(500);

  const [canteenChecked, setCanteenChecked] = useState(false);
  const [canteenAmount, setCanteenAmount] = useState<number>(0);

  // Payment Mode: 'especes' | 'cheque' | 'virement' | 'mixte'
  const [paymentMode, setPaymentMode] = useState<'especes' | 'cheque' | 'virement' | 'mixte'>('mixte');

  // Mixed Payment Breakdown
  const [cashPart, setCashPart] = useState<number>(1500);
  const [checkPart, setCheckPart] = useState<number>(2000);

  // Check Details
  const [checkNumber, setCheckNumber] = useState('CHQ-778899');
  const [bankName, setBankName] = useState('Attijariwafa Bank');
  const [checkDueDate, setCheckDueDate] = useState('2026-10-15');

  // Single Check details if mode === 'cheque'
  const [singleCheckNumber, setSingleCheckNumber] = useState('CHQ-990011');
  const [singleBankName, setSingleBankName] = useState('Attijariwafa Bank');
  const [singleDueDate, setSingleDueDate] = useState('2026-10-15');

  // Submission state
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Calculate Total
  const totalAmount = 
    (tuitionChecked ? Number(tuitionAmount) || 0 : 0) +
    (transportChecked ? Number(transportAmount) || 0 : 0) +
    (canteenChecked ? Number(canteenAmount) || 0 : 0);

  // Validation Check: does cash + check equal totalAmount in mixed mode?
  const isMixedValid = paymentMode !== 'mixte' || (cashPart + checkPart === totalAmount);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Strict Accounting Validation Check for Mixed Payment
    if (paymentMode === 'mixte' && (cashPart + checkPart !== totalAmount)) {
      alert(`تنبيه محاسبي: مجموع النقد (${cashPart}) والشيك (${checkPart}) لا يساوي مجموع الرسوم المستحقة (${totalAmount}) MAD`);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const receiptNumber = 'REC-' + Date.now().toString().slice(-6);
      const today = new Date().toISOString().split('T')[0];

      // 2. If Mixte or Especes: Add cash portion to General Caisse
      if (paymentMode === 'mixte' && cashPart > 0) {
        await caisseService.addTransaction({
          transaction_date: today,
          type: 'encaissement',
          amount: Number(cashPart),
          payment_method: 'especes',
          category: 'tuition',
          description: `استخلاص رسوم مدرسية (جزء نقدي) - ${student.full_name_ar}`,
          reference_number: receiptNumber
        });
      } else if (paymentMode === 'especes') {
        await caisseService.addTransaction({
          transaction_date: today,
          type: 'encaissement',
          amount: Number(totalAmount),
          payment_method: 'especes',
          category: 'tuition',
          description: `استخلاص رسوم مدرسية نقداً - ${student.full_name_ar}`,
          reference_number: receiptNumber
        });
      }

      // 3. If Mixte or Cheque: Register check in Checks Portfolio
      if (paymentMode === 'mixte' && checkPart > 0) {
        await checksManagementService.registerCheck({
          check_number: checkNumber,
          bank_name: bankName,
          issuer_name: `ولي أمر ${student.full_name_ar}`,
          student_id: student.student_id,
          beneficiary: 'Groupe Scolaire Aroua',
          amount: Number(checkPart),
          due_date: checkDueDate,
          received_date: today,
          status: 'en_portefeuille',
          academic_year: '2026/2027'
        });
      } else if (paymentMode === 'cheque') {
        await checksManagementService.registerCheck({
          check_number: singleCheckNumber,
          bank_name: singleBankName,
          issuer_name: `ولي أمر ${student.full_name_ar}`,
          student_id: student.student_id,
          beneficiary: 'Groupe Scolaire Aroua',
          amount: Number(totalAmount),
          due_date: singleDueDate,
          received_date: today,
          status: 'en_portefeuille',
          academic_year: '2026/2027'
        });
      }

      // 4. Update student balance in enrollment service
      try {
        await enrollmentService.recordPayment(student.id, totalAmount);
      } catch (enrollErr) {
        console.warn('Local enrollment update notice:', enrollErr);
      }

      // 5. Dispatch Realtime Custom Events for instant dashboard synchronization
      window.dispatchEvent(new CustomEvent('aroua_caisse_updated'));
      window.dispatchEvent(new CustomEvent('aroua_checks_updated'));

      // 6. Construct Official Receipt Data with full fee breakdown & mixed payment details
      const feeBreakdown = [];
      if (tuitionChecked && tuitionAmount > 0) {
        feeBreakdown.push({
          id: 'fb-tuition',
          category: 'tuition' as const,
          labelAr: 'واجبات التمدرس الشهري',
          labelFr: 'Frais de Scolarité Mensuelle',
          period: 'شهر أكتوبر 2026',
          amountMAD: Number(tuitionAmount)
        });
      }
      if (transportChecked && transportAmount > 0) {
        feeBreakdown.push({
          id: 'fb-transport',
          category: 'transport' as const,
          labelAr: 'واجبات النقل المدرسي',
          labelFr: 'Frais de Transport Scolaire',
          period: 'شهر أكتوبر 2026',
          amountMAD: Number(transportAmount)
        });
      }
      if (canteenChecked && canteenAmount > 0) {
        feeBreakdown.push({
          id: 'fb-canteen',
          category: 'canteen' as const,
          labelAr: 'واجبات الإطعام والمطعم',
          labelFr: 'Frais de Restauration',
          period: 'شهر أكتوبر 2026',
          amountMAD: Number(canteenAmount)
        });
      }

      const paymentReference = paymentMode === 'mixte'
        ? `أداء مختلط: نقد بالصندوق (${formatMAD(cashPart)}) + شيك بنكي (${formatMAD(checkPart)} - رقم: ${checkNumber} - ${bankName})`
        : paymentMode === 'cheque'
        ? `شيك بنكي رقم: ${singleCheckNumber} (${singleBankName})`
        : 'أداء نقدي مباشر بصندوق المؤسسة';

      const receiptData: OfficialReceiptData = {
        receiptNumber,
        date: today,
        studentName: student.full_name_ar,
        massarCode: student.massar_code,
        classroom: student.classroom || 'عام',
        academicLevel: student.academic_level,
        paymentFor: 'أداء الرسوم المدرسية واشتراكات الخدمات (2026-2027)',
        amountMAD: totalAmount,
        paymentMethod: paymentMode === 'mixte' ? 'cheque' : paymentMode,
        paymentReference,
        checkNumber: paymentMode === 'mixte' ? checkNumber : singleCheckNumber,
        bankName: paymentMode === 'mixte' ? bankName : singleBankName,
        checkDueDate: paymentMode === 'mixte' ? checkDueDate : singleDueDate,
        feeBreakdown,
        remainingBalanceMAD: Math.max(0, student.balance - totalAmount),
        cashierName: 'أمين الصندوق المركزي - أروى'
      };

      onSuccess(receiptData);
      onClose();
    } catch (err) {
      console.error('Error recording payment collection:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col font-sans text-start animate-fade-in" dir="rtl">
        
        {/* Modal Top Header */}
        <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black block leading-tight">
                استخلاص وتحصيل الرسوم المدرسية • Encaissement des Frais
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                {student.full_name_ar} • {student.massar_code}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Student Identity Card */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block mb-0.5">التلميذ المستهدف بالتحصيل:</span>
              <span className="text-sm font-black text-slate-900 block">{student.full_name_ar}</span>
              <span className="text-[11px] text-slate-500 font-medium">
                {student.academic_level} {student.classroom && <span className="font-mono font-bold">({student.classroom})</span>}
              </span>
            </div>
            <div className="text-end">
              <span className="text-[10px] text-slate-400 font-bold block mb-0.5">الذمة المتبقية الحالية:</span>
              <span className="text-sm font-black font-mono text-amber-600 block">{formatMAD(student.balance)}</span>
              <span className="text-[10px] text-slate-400 font-mono">مسار: {student.massar_code}</span>
            </div>
          </div>

          {/* Fee Items Breakdown Selection */}
          <div className="space-y-2">
            <span className="text-[11px] font-black text-slate-700 block">
              1. تفكيك وتحديد الرسوم المشمولة بالوصل:
            </span>

            <div className="space-y-2 bg-slate-50/70 border border-slate-200 rounded-2xl p-3">
              {/* Tuition */}
              <div className="flex items-center justify-between gap-3 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 select-none">
                  <input
                    type="checkbox"
                    checked={tuitionChecked}
                    onChange={(e) => setTuitionChecked(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                  />
                  <span>واجبات التمدرس الشهري (Scolarité)</span>
                </label>
                <div className="flex items-center gap-1 font-mono font-bold">
                  <input
                    type="number"
                    value={tuitionAmount}
                    onChange={(e) => setTuitionAmount(Number(e.target.value))}
                    disabled={!tuitionChecked}
                    className="w-24 text-end px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold font-mono focus:bg-white focus:outline-none focus:border-emerald-600 disabled:opacity-50"
                  />
                  <span className="text-slate-500 text-[11px]">MAD</span>
                </div>
              </div>

              {/* Transport */}
              <div className="flex items-center justify-between gap-3 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 select-none">
                  <input
                    type="checkbox"
                    checked={transportChecked}
                    onChange={(e) => setTransportChecked(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                  />
                  <span>واجبات النقل المدرسي (Transport)</span>
                </label>
                <div className="flex items-center gap-1 font-mono font-bold">
                  <input
                    type="number"
                    value={transportAmount}
                    onChange={(e) => setTransportAmount(Number(e.target.value))}
                    disabled={!transportChecked}
                    className="w-24 text-end px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold font-mono focus:bg-white focus:outline-none focus:border-emerald-600 disabled:opacity-50"
                  />
                  <span className="text-slate-500 text-[11px]">MAD</span>
                </div>
              </div>

              {/* Canteen */}
              <div className="flex items-center justify-between gap-3 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 select-none">
                  <input
                    type="checkbox"
                    checked={canteenChecked}
                    onChange={(e) => setCanteenChecked(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                  />
                  <span>واجبات الإطعام والمطعم (Restauration)</span>
                </label>
                <div className="flex items-center gap-1 font-mono font-bold">
                  <input
                    type="number"
                    value={canteenAmount}
                    onChange={(e) => setCanteenAmount(Number(e.target.value))}
                    disabled={!canteenChecked}
                    className="w-24 text-end px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold font-mono focus:bg-white focus:outline-none focus:border-emerald-600 disabled:opacity-50"
                  />
                  <span className="text-slate-500 text-[11px]">MAD</span>
                </div>
              </div>

              {/* Total Due Banner */}
              <div className="flex items-center justify-between p-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl">
                <span className="font-bold text-emerald-900">المجموع المطلوب تحصيله :</span>
                <span className="font-black font-mono text-emerald-950 text-sm">{formatMAD(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <span className="text-[11px] font-black text-slate-700 block">
              2. اختيار طريقة الأداء والسداد :
            </span>

            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('mixte')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                  paymentMode === 'mixte'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Wallet className="w-4 h-4 text-emerald-700" />
                <span className="text-[11px] leading-tight">مختلطة (Mixte)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('especes')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                  paymentMode === 'especes'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-700" />
                <span className="text-[11px] leading-tight">نقداً (Espèces)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('cheque')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                  paymentMode === 'cheque'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Landmark className="w-4 h-4 text-emerald-700" />
                <span className="text-[11px] leading-tight">شيك (Chèque)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('virement')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                  paymentMode === 'virement'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span className="text-[11px] leading-tight">تحويل بنكي</span>
              </button>
            </div>
          </div>

          {/* Mixed Payment Details (نقد + شيك) */}
          {paymentMode === 'mixte' && (
            <div className="bg-emerald-50/40 border border-emerald-200/90 rounded-2xl p-4 space-y-3 animate-fade-in">
              <span className="text-[11px] font-bold text-emerald-900 block border-b border-emerald-200/60 pb-1.5">
                تفاصيل السداد المختلط (نقد بالصندوق + شيك بنكي) :
              </span>

              <div className="grid grid-cols-2 gap-3">
                {/* Cash Part */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">
                    نقد بالصندوق (Espèces) :
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      value={cashPart}
                      onChange={(e) => setCashPart(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono focus:border-emerald-600 focus:outline-none"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[10px]">MAD</span>
                  </div>
                </div>

                {/* Check Part */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">
                    شيك بنكي (Chèque) :
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      value={checkPart}
                      onChange={(e) => setCheckPart(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono focus:border-emerald-600 focus:outline-none"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[10px]">MAD</span>
                  </div>
                </div>
              </div>

              {/* Inline Accounting Warning & Auto-Balance Helper */}
              {!isMixedValid && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      تنبيه محاسبي: مجموع النقد والشيك ({formatMAD(cashPart + checkPart)}) لا يساوي المطلوب ({formatMAD(totalAmount)}).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckPart(Math.max(0, totalAmount - cashPart))}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] shrink-0 transition cursor-pointer"
                  >
                    موازنة تلقائية
                  </button>
                </div>
              )}

              {/* Check Metadata */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">رقم الشيك :</label>
                  <input
                    type="text"
                    required
                    value={checkNumber}
                    onChange={(e) => setCheckNumber(e.target.value)}
                    placeholder="CHQ-778899"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">اسم البنك :</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-emerald-600 focus:outline-none cursor-pointer"
                  >
                    <option value="Attijariwafa Bank">Attijariwafa Bank</option>
                    <option value="Banque Populaire">Banque Populaire</option>
                    <option value="CIH Bank">CIH Bank</option>
                    <option value="Bank of Africa">Bank of Africa</option>
                    <option value="Société Générale">Société Générale</option>
                    <option value="BMCI">BMCI</option>
                    <option value="Crédit Agricole du Maroc">Crédit Agricole</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">تاريخ الاستحقاق :</label>
                  <input
                    type="date"
                    required
                    value={checkDueDate}
                    onChange={(e) => setCheckDueDate(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:border-emerald-600 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Single Check Details */}
          {paymentMode === 'cheque' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 animate-fade-in">
              <span className="text-[11px] font-bold text-slate-800 block border-b border-slate-200 pb-1.5">
                بيانات الشيك البنكي المعتمد :
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">رقم الشيك :</label>
                  <input
                    type="text"
                    required
                    value={singleCheckNumber}
                    onChange={(e) => setSingleCheckNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">اسم البنك :</label>
                  <select
                    value={singleBankName}
                    onChange={(e) => setSingleBankName(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-emerald-600 focus:outline-none cursor-pointer"
                  >
                    <option value="Attijariwafa Bank">Attijariwafa Bank</option>
                    <option value="Banque Populaire">Banque Populaire</option>
                    <option value="CIH Bank">CIH Bank</option>
                    <option value="Bank of Africa">Bank of Africa</option>
                    <option value="Société Générale">Société Générale</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">تاريخ الاستحقاق :</label>
                  <input
                    type="date"
                    required
                    value={singleDueDate}
                    onChange={(e) => setSingleDueDate(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:border-emerald-600 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={loading || totalAmount <= 0 || !isMixedValid}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black shadow-md shadow-emerald-600/20 flex items-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تسجيل السند والتحصيل...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد وحفظ السند ({formatMAD(totalAmount)})</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default StudentCollectionModal;
