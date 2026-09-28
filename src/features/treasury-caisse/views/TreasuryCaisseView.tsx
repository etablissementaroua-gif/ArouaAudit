import React, { useState } from 'react';
import { useCaisse } from '../controllers/useCaisse';
import { CaisseLedgerTable } from '../components/CaisseLedgerTable';
import { StatCard } from '../../../shared/components/StatCard';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { Wallet, TrendingUp, TrendingDown, Coins, Plus, RefreshCw, Printer } from 'lucide-react';
import { OfficialReceiptModal } from '../components/OfficialReceiptModal';
import { OfficialReceiptData } from '../../../shared/lib/receiptPdfGenerator';
import { PaymentMethod, TransactionType } from '../../../shared/types';

export const TreasuryCaisseView: React.FC = () => {
  const { transactions, summary, loading, refresh, addTransaction } = useCaisse();
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState<TransactionType>('encaissement');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('especes');
  const [category, setCategory] = useState('رسوم دراسية');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [receiptData, setReceiptData] = useState<OfficialReceiptData | null>(null);

  const handlePrintDemoReceipt = () => {
    setReceiptData({
      receiptNumber: 'REC-2026-9901',
      date: new Date().toISOString().split('T')[0],
      studentName: 'حمزة الشرايبي',
      massarCode: 'R134567890',
      classroom: '2Bac SM-A',
      academicLevel: 'السنة الثانية بكالوريا - علوم رياضية',
      paymentFor: 'سداد قسط الرسوم الدراسية للفصل الأول والنقل المدرسي',
      amountMAD: 18500.00,
      paymentMethod: 'virement',
      paymentReference: 'VIR-26-0901',
      remainingBalanceMAD: 23000.00,
      cashierName: 'المسؤول المالي - أروى'
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    await addTransaction({
      type,
      amount: val,
      payment_method: method,
      category,
      description: description || 'معاملة مالية',
      reference_number: reference,
      transaction_date: new Date().toISOString().split('T')[0]
    });
    setShowModal(false);
    setAmount('');
    setDescription('');
    setReference('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">سجل الخزينة وحركة الصندوق (Journal de Caisse)</h2>
          <p className="text-xs text-slate-400 mt-1">تتبع التدفقات النقدية اللحظية، المقبوضات، والمصاريف واحتساب الرصيد الصافي</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refresh()} className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handlePrintDemoReceipt} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 font-medium text-xs shadow-sm transition">
            <Printer className="w-4 h-4" /> نموذج وصل رسمي
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-950/40 transition">
            <Plus className="w-4 h-4" /> تسجيل حركة جديدة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="الرصيد الصافي المتاح" value={formatMAD(summary.currentBalance)} subtitle="صافي الخزينة الإجمالي" icon={Wallet} variant="default" />
        <StatCard title="إجمالي المقبوضات" value={formatMAD(summary.totalEncaissement)} subtitle="مداخيل الخزينة" icon={TrendingUp} variant="income" />
        <StatCard title="إجمالي المصاريف" value={formatMAD(summary.totalDecaissement)} subtitle="نفقات المؤسسة" icon={TrendingDown} variant="expense" />
        <StatCard title="السيولة النقدية (Espèces)" value={formatMAD(summary.cashInHand)} subtitle="السيولة المتواجدة بالخزنة" icon={Coins} variant="pending" />
      </div>

      <CaisseLedgerTable transactions={transactions} />

      {receiptData && (
        <OfficialReceiptModal
          receipt={receiptData}
          isOpen={Boolean(receiptData)}
          onClose={() => setReceiptData(null)}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">تسجيل حركة نقدية في الصندوق</h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setType('encaissement')} className={`py-2 rounded-lg font-bold border ${type === 'encaissement' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                  قبض (Encaissement)
                </button>
                <button type="button" onClick={() => setType('decaissement')} className={`py-2 rounded-lg font-bold border ${type === 'decaissement' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                  صرف (Décaissement)
                </button>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">المبلغ (بالدرهم MAD)</label>
                <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">طريقة السداد</label>
                <select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none">
                  <option value="especes">نقد (Espèces)</option>
                  <option value="virement">تحويل بنكي (Virement)</option>
                  <option value="cheque">شيك بنكي (Chèque)</option>
                  <option value="carte">بطاقة بنكية (Carte)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">الفئة المحاسبية</label>
                <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">البيان والشرح</label>
                <input type="text" required value={description} onChange={e => setDescription(e.target.value)} placeholder="وصف العملية..." className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">رقم الإيصال أو المرجع</label>
                <input type="text" value={reference} onChange={e => setReference(e.target.value)} placeholder="REC-..." className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none font-mono" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700">إلغاء</button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">حفظ العملية</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
