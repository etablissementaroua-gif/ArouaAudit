import React, { useState, useEffect } from 'react';
import { checksManagementService } from '../services/checksManagement.service';
import { BankRemise, CheckItem } from '../models/check.types';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { 
  FileText, 
  Printer, 
  Building, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Eye, 
  X, 
  ShieldCheck, 
  Landmark,
  ArrowUpRight,
  AlertOctagon
} from 'lucide-react';

export const DeliverySlipsView: React.FC = () => {
  const [remises, setRemises] = useState<BankRemise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRemise, setSelectedRemise] = useState<BankRemise | null>(null);
  const [remiseChecks, setRemiseChecks] = useState<CheckItem[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const loadRemises = async () => {
    setLoading(true);
    const data = await checksManagementService.getBankRemisesList();
    setRemises(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRemises();
  }, []);

  const handleOpenSlip = async (remise: BankRemise) => {
    setSelectedRemise(remise);
    const allChecks = await checksManagementService.getChecksList();
    const relatedChecks = allChecks.filter(c => c.remise_id === remise.id || c.remise_number === remise.remise_number);
    setRemiseChecks(relatedChecks.length > 0 ? relatedChecks : (remise.checks || []));
    setIsPrintModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'cleared':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>تم الصرف بالكامل</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>بها شيكات راجعة</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock className="w-3.5 h-3.5" />
            <span>أودعت بالبنك (قيد المقاصة)</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/90 p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">حوافظ تسليم الشيكات للبنك</h1>
            <p className="text-slate-400 text-sm">أرشيف وسجلات حوافظ الإيداع الرسمية (Bordereaux de Remise) مع إمكانية المعاينة والطباعة البنكية</p>
          </div>
        </div>

        <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 font-mono">
          <span>إجمالي الحوافظ: </span>
          <span className="font-bold text-indigo-400">{remises.length}</span>
        </div>
      </div>

      {/* Remises Archive Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-700 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-4">رقم الحافظة</th>
                <th className="py-4 px-4">الحساب البنكي والوكالة</th>
                <th className="py-4 px-4">تاريخ الإيداع</th>
                <th className="py-4 px-4">عدد الشيكات</th>
                <th className="py-4 px-4">المبلغ الإجمالي</th>
                <th className="py-4 px-4">الوضعية</th>
                <th className="py-4 px-4 text-center">الوثيقة الرسمية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">جاري تحميل حوافظ الإيداع...</td>
                </tr>
              ) : remises.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">لا توجد حوافظ إيداع مسجلة بعد</td>
                </tr>
              ) : (
                remises.map(rem => (
                  <tr key={rem.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-mono font-bold text-slate-900 text-base tracking-wider block">
                        {rem.remise_number}
                      </span>
                      <span className="text-[11px] text-slate-500">مسؤول الإيداع: {rem.created_by || 'أمين الصندوق'}</span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-slate-800 font-semibold">
                        <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>{rem.bank_account_name || rem.bank_name || 'الحساب الرئيسي'}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{rem.remise_date}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-mono font-bold text-slate-800 border border-slate-200 text-xs">
                        {rem.checks_count} شيكات
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-mono font-black text-emerald-600 text-base">
                        {formatMAD(rem.total_amount)}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      {getStatusBadge(rem.status)}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleOpenSlip(rem)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-105 active:scale-95 shadow-sm"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>معاينة وطباعة الحافظة</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Printable Bank Slip Modal */}
      {isPrintModalOpen && selectedRemise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-8">
            {/* Modal Control Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950 print:hidden">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Printer className="w-4 h-4 text-indigo-400" />
                <span>معاينة الحافظة البنكية الرسمية قبل الطباعة</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all hover:scale-105"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الحافظة (A4 Print)</span>
                </button>

                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet (A4 Styled) */}
            <div id="printable-bordereau" className="p-8 bg-white text-slate-900 font-sans select-text">
              {/* Slip Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5 mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-1.5 rounded-xl bg-white border border-slate-200 shadow-xs flex-shrink-0"><img src="/assets/logo-aroua.png" alt="Aroua Logo" className="h-16 w-auto object-contain" /></div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-950">GROUPE SCOLAIRE AROUA</h2>
                    <h3 className="text-sm font-bold text-slate-700">مجموعة مدارس أروى للتعليم الخصوصي</h3>
                    <p className="text-[11px] text-slate-500 mt-1">الرباط - المملكة المغربية • ICE: 002391029000045</p>
                  </div>
                </div>

                <div className="text-left font-mono">
                  <span className="block text-xs uppercase text-slate-500 font-sans font-bold">N° Bordereau / الحافظة</span>
                  <span className="text-lg font-black text-slate-950">{selectedRemise.remise_number}</span>
                  <span className="block text-xs text-slate-600 mt-1">تاريخ الإيداع: {selectedRemise.remise_date}</span>
                </div>
              </div>

              {/* Title */}
              <div className="text-center my-4 py-2 bg-slate-100 border border-slate-300 rounded-lg">
                <h1 className="text-base font-black uppercase tracking-wider text-slate-900">
                  BORDEREAU DE REMISE DE CHÈQUES À L'ENCAISSEMENT
                </h1>
                <h2 className="text-sm font-bold text-slate-700">حافظة تسليم الشيكات للتحصيل البنكي</h2>
              </div>

              {/* Bank & Beneficiary Info */}
              <div className="grid grid-cols-2 gap-4 text-xs mb-6 p-4 border border-slate-300 rounded-lg bg-slate-50">
                <div>
                  <span className="text-slate-500 block mb-0.5">البنك المودع لديه:</span>
                  <span className="font-bold text-slate-900 text-sm block">{selectedRemise.bank_name || 'Attijariwafa Bank'}</span>
                  <span className="text-slate-600 block mt-0.5">{selectedRemise.bank_account_name}</span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">المستفيد المسحوب لصالحه:</span>
                  <span className="font-bold text-slate-900 text-sm block">Établissement Aroua (Groupe Scolaire)</span>
                  <span className="text-slate-600 block font-mono mt-0.5">Compte N°: {selectedRemise.remise_number}</span>
                </div>
              </div>

              {/* Tabular Itemized Checks */}
              <table className="w-full text-right border-collapse text-xs mb-6">
                <thead>
                  <tr className="bg-slate-200 text-slate-800 font-bold border border-slate-400">
                    <th className="py-2.5 px-3 border border-slate-300 text-center w-10">N°</th>
                    <th className="py-2.5 px-3 border border-slate-300 font-mono">رقم الشيك (N° Chèque)</th>
                    <th className="py-2.5 px-3 border border-slate-300">الساحب (Tireur)</th>
                    <th className="py-2.5 px-3 border border-slate-300">البنك المسحوب عليه (Banque)</th>
                    <th className="py-2.5 px-3 border border-slate-300">تاريخ الاستحقاق</th>
                    <th className="py-2.5 px-3 border border-slate-300 text-left font-mono">المبلغ (Montant MAD)</th>
                  </tr>
                </thead>
                <tbody>
                  {remiseChecks.map((chk, idx) => (
                    <tr key={chk.id || idx} className="border border-slate-300">
                      <td className="py-2 px-3 text-center font-mono border border-slate-300">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold border border-slate-300">{chk.check_number}</td>
                      <td className="py-2 px-3 border border-slate-300">
                        <span className="font-semibold">{chk.issuer_name}</span>
                        {chk.student_name && <span className="text-[10px] text-slate-500 block">({chk.student_name})</span>}
                      </td>
                      <td className="py-2 px-3 border border-slate-300">{chk.bank_name}</td>
                      <td className="py-2 px-3 font-mono border border-slate-300 text-slate-700">{chk.due_date}</td>
                      <td className="py-2 px-3 font-mono font-black text-left border border-slate-300 text-slate-900">
                        {formatMAD(chk.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-800 text-sm">
                    <td colSpan={4} className="py-3 px-4 border border-slate-300">
                      المجموع العام ({selectedRemise.checks_count} شيكات مسلّمة)
                    </td>
                    <td colSpan={2} className="py-3 px-4 text-left font-mono text-base text-emerald-800 border border-slate-300">
                      {formatMAD(selectedRemise.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Signatures and Stamp Block */}
              <div className="grid grid-cols-2 gap-6 pt-6 border-t-2 border-slate-400 mt-8 text-xs">
                <div className="border border-slate-300 rounded-lg p-4 min-h-[120px] flex flex-col justify-between">
                  <span className="font-bold text-slate-900">توقيع وخاتم أمين صندوق المؤسسة:</span>
                  <span className="text-[10px] text-slate-500 italic">Pour le Groupe Scolaire Aroua</span>
                </div>

                <div className="border border-slate-300 rounded-lg p-4 min-h-[120px] flex flex-col justify-between bg-slate-50">
                  <span className="font-bold text-slate-900">تأشيرة وخاتم استلام الوكالة البنكية:</span>
                  <span className="text-[10px] text-slate-500 italic">Accusé de réception guichet (Date, Heure et Signature)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
