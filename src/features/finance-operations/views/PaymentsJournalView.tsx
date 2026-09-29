import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  Calendar
} from 'lucide-react';

export const PaymentsJournalView: React.FC = () => {
  const { t, i18n } = useTranslation(['finance', 'common']);
  const isRtl = i18n.language === 'ar' || !i18n.language?.startsWith('fr');

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
      paymentFor: isRtl 
        ? `واجبات التمدرس والخدمات لشهر ${p.period_month || 'شتنبر'}` 
        : `Frais de scolarité & services - Mois de ${p.period_month || 'Septembre'}`,
      amountMAD: p.amount_paid,
      paymentMethod: p.payment_method,
      paymentReference: p.check_or_bank_ref || p.receipt_number,
      parentName: p.student_name,
      remainingBalanceMAD: 0,
      notes: p.notes || (isRtl ? `تسديد برسم الموسم ${p.academic_year}` : `Règlement année scolaire ${p.academic_year}`),
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
            <span>{t('finance:cash_flow.cash')}</span>
          </span>
        );
      case 'cheque':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <FileText className="w-3 h-3" />
            <span>{t('finance:cash_flow.check')}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
            <CreditCard className="w-3 h-3" />
            <span>{t('finance:cash_flow.transfer')}</span>
          </span>
        );
    }
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header-card">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="text-start">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {t('finance:journal_caisse')}
            </h1>
            <p className="text-slate-500 text-sm">
              {t('finance:subtitle')}
            </p>
          </div>
        </div>

        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 text-sm text-slate-700 flex items-center gap-2 shadow-xs">
          <span className="font-bold">{t('finance:cash_flow.total_inflow')}: </span>
          <span className="font-black text-emerald-700 font-mono text-base">{formatMAD(totalCollected)}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="standard-kpi-card text-start"><div className={`w-1.5 h-full absolute top-0 ${isRtl ? 'right-0' : 'left-0'} bg-teal-500`} />
          <span className="text-xs text-slate-500 font-bold block mb-1">
            {isRtl ? 'إجمالي العمليات المسجلة' : 'Opérations Enregistrées'}
          </span>
          <p className="text-3xl font-black text-slate-900 font-mono tracking-tight">{filteredPayments.length}</p>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            {isRtl ? 'عملية استخلاص مؤكدة' : 'Encaissements confirmés'}
          </span>
        </div>

        <div className="standard-kpi-card text-start"><div className={`w-1.5 h-full absolute top-0 ${isRtl ? 'right-0' : 'left-0'} bg-emerald-500`} />
          <span className="text-xs text-slate-500 font-bold block mb-1">
            {isRtl ? 'استخلاصات التمدرس' : 'Recettes Scolarité'}
          </span>
          <p className="text-3xl font-black text-emerald-700 font-mono tracking-tight">{formatMAD(totalScolarite)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            {isRtl ? 'رسوم التعليم والتمدرس' : 'Frais d\'enseignement'}
          </span>
        </div>

        <div className="standard-kpi-card text-start"><div className={`w-1.5 h-full absolute top-0 ${isRtl ? 'right-0' : 'left-0'} bg-amber-400`} />
          <span className="text-xs text-slate-500 font-bold block mb-1">
            {isRtl ? 'استخلاصات النقل المدرسي' : 'Recettes Transport'}
          </span>
          <p className="text-3xl font-black text-amber-700 font-mono tracking-tight">{formatMAD(totalTransport)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            {isRtl ? 'اشتراكات خطوط الحافلات' : 'Abonnements transport'}
          </span>
        </div>

        <div className="standard-kpi-card text-start"><div className={`w-1.5 h-full absolute top-0 ${isRtl ? 'right-0' : 'left-0'} bg-sky-500`} />
          <span className="text-xs text-slate-500 font-bold block mb-1">
            {isRtl ? 'استخلاصات المطعم' : 'Recettes Restauration'}
          </span>
          <p className="text-3xl font-black text-sky-700 font-mono tracking-tight">{formatMAD(totalCantine)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            {isRtl ? 'وجبات التغذية المدرسية' : 'Frais de demi-pension'}
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200 shadow-xs p-4 rounded-2xl flex flex-wrap gap-3 items-center justify-between">
        <div className="flex-1 min-w-[260px] relative">
          <Search className={`w-4 h-4 text-slate-500 absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
          <input
            type="text"
            placeholder={t('finance:actions.search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full bg-white border border-slate-200 rounded-xl ${
              isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'
            } py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-600`}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-emerald-600"
          >
            <option value="all">{isRtl ? 'كافة وسائل الأداء' : 'Tous les modes de règlement'}</option>
            <option value="especes">{t('finance:cash_flow.cash')}</option>
            <option value="cheque">{t('finance:cash_flow.check')}</option>
            <option value="virement">{t('finance:cash_flow.transfer')}</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="standard-table-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700 font-bold text-xs uppercase tracking-wider text-start">
                <th className="py-4 px-4 text-start">{t('finance:fields.receipt_no')} & {t('finance:fields.date')}</th>
                <th className="py-4 px-4 text-start">{t('finance:fields.student_name')}</th>
                <th className="py-4 px-4 text-start">{t('finance:fields.amount')}</th>
                <th className="py-4 px-4 text-start">{t('finance:fields.payment_method')}</th>
                <th className="py-4 px-4 text-start">{isRtl ? 'تفكيك الخدمات المسددة' : 'Détail des Services'}</th>
                <th className="py-4 px-4 text-start">{isRtl ? 'أمين الصندوق' : 'Caissier / Régisseur'}</th>
                <th className="py-4 px-4 text-center">{t('common:documents.official_receipt')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    {isRtl ? 'جاري تحميل يومية التسديدات...' : 'Chargement du journal des paiements...'}
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    {isRtl ? 'لا توجد تسديدات مطابقة لمعايير البحث' : 'Aucun paiement correspondant aux critères'}
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 text-start">
                      <span className="font-mono font-bold text-slate-900 tracking-wider block">{p.receipt_number}</span>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{p.payment_date}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-900 text-start">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{p.student_name}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                        {p.student_id} • {p.academic_level}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono font-black text-emerald-700 text-base text-start">
                      {formatMAD(p.amount_paid)}
                    </td>

                    <td className="py-4 px-4 text-start">
                      {getMethodBadge(p.payment_method)}
                      {p.check_or_bank_ref && (
                        <span className="block font-mono text-[10px] text-slate-500 mt-1">
                          {p.check_or_bank_ref}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-xs text-start">
                      <div className="flex items-center gap-2">
                        {p.service_breakdown.scolarite > 0 && (
                          <span className="bg-slate-50 px-2 py-0.5 rounded text-indigo-700 font-bold border border-slate-200 flex items-center gap-1">
                            <span className="font-sans text-[11px] text-slate-500">
                              {isRtl ? 'تمدرس:' : 'Scolarité:'}
                            </span>
                            <span className="font-mono text-xs">{formatMAD(p.service_breakdown.scolarite)}</span>
                          </span>
                        )}
                        {p.service_breakdown.transport > 0 && (
                          <span className="bg-slate-50 px-2 py-0.5 rounded text-amber-700 font-bold border border-slate-200 flex items-center gap-1">
                            <span className="font-sans text-[11px] text-slate-500">
                              {isRtl ? 'نقل:' : 'Transport:'}
                            </span>
                            <span className="font-mono text-xs">{formatMAD(p.service_breakdown.transport)}</span>
                          </span>
                        )}
                        {p.service_breakdown.cantine > 0 && (
                          <span className="bg-slate-50 px-2 py-0.5 rounded text-sky-700 font-bold border border-slate-200 flex items-center gap-1">
                            <span className="font-sans text-[11px] text-slate-500">
                              {isRtl ? 'مطعم:' : 'Cantine:'}
                            </span>
                            <span className="font-mono text-xs">{formatMAD(p.service_breakdown.cantine)}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-700 text-start">
                      {p.cashier_agent}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleOpenReceipt(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer"
                        title={t('common:actions.print_receipt')}
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{t('common:actions.print_receipt')}</span>
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
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          receipt={selectedReceipt}
        />
      )}
    </div>
  );
};

export default PaymentsJournalView;

