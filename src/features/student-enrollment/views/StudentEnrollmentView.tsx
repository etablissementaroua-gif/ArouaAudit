import React, { useState } from 'react';
import { useEnrollment } from '../controllers/useEnrollment';
import { StudentRecord } from '../models/enrollmentModels';
import { OfficialReceiptModal } from '../../treasury-caisse/components/OfficialReceiptModal';
import { OfficialReceiptData } from '../../../shared/lib/receiptPdfGenerator';
import { StatCard } from '../../../shared/components/StatCard';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { 
  GraduationCap, 
  Wallet, 
  CreditCard, 
  Bus, 
  Utensils, 
  Search, 
  RefreshCw, 
  Sparkles, 
  PhoneCall, 
  Send, 
  CheckCircle2, 
  Clock, 
  Layers, 
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

export const StudentEnrollmentView: React.FC = () => {
  const { 
    students, 
    rawCount,
    summary, 
    loading, 
    syncing, 
    generatingDues,
    filters, 
    setFilters, 
    notification,
    refresh, 
    triggerSyncFromArouaSchools,
    generateServiceDues
  } = useEnrollment();

  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [receiptData, setReceiptData] = useState<OfficialReceiptData | null>(null);

  const handleOpenReceipt = (st: StudentRecord) => {
    setReceiptData({
      receiptNumber: 'REC-' + (st.student_id ? st.student_id.replace('STU-', '') : '2026-001'),
      date: new Date().toISOString().split('T')[0],
      studentName: st.full_name_ar,
      massarCode: st.massar_code,
      classroom: st.classroom || 'عام',
      academicLevel: st.academic_level,
      paymentFor: 'أداء الرسوم المدرسية واشتراكات الخدمات (2026-2027)',
      amountMAD: st.total_paid > 0 ? st.total_paid : 5000,
      paymentMethod: 'virement',
      paymentReference: 'VIR-REC-' + st.massar_code,
      remainingBalanceMAD: st.balance,
      cashierName: 'أمين الصندوق - أروى'
    });
  };

  const getSourceBadge = (platform: string) => {
    if (platform === 'arouaschools') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 border border-emerald-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          منظومة أروى (arouaschools)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60 border border-slate-700">
        محلي
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold">{notification}</span>
          </div>
        </div>
      )}

      {/* Header Bar with Direct arouaschools Sync Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">التلاميذ المسجلون وملفات الذمم المدرسية (Student Billing)</h2>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 border border-indigo-500/20">
              {students.length} / {rawCount} تلميذ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            استقبال تلقائي للمسجلين من منظومة <strong className="text-emerald-700">arouaschools</strong> وربطهم بقيود الذمم واشتراكات النقل والإطعام
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => refresh()}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-white hover:bg-slate-800 transition"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Service Dues Generation Dropdown or Direct Action */}
          <button
            disabled={generatingDues}
            onClick={() => generateServiceDues('both')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-800 text-amber-700 border border-amber-500/30 text-xs font-medium transition shadow-sm"
            title="توليد مستحقات النقل والإطعام تلقائياً في يومية الصندوق"
          >
            <Bus className="w-4 h-4" />
            <Utensils className="w-3.5 h-3.5" />
            <span>{generatingDues ? 'جاري التوليد...' : 'توليد مستحقات الخدمات في الصندوق'}</span>
          </button>

          {/* Sync from arouaschools Action */}
          <button
            disabled={syncing}
            onClick={() => triggerSyncFromArouaSchools()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95"
          >
            <Sparkles className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'جاري الاستقبال...' : 'استقبال دفعة من arouaschools'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الذمم والرسوم"
          value={formatMAD(summary.totalDue)}
          subtitle="مستحقات السنة الدراسية"
          icon={Wallet}
          variant="default"
        />
        <StatCard
          title="المستخلص الفعلي (المقبوض)"
          value={formatMAD(summary.totalPaid)}
          subtitle="المسدد في الحسابات"
          icon={CreditCard}
          variant="income"
        />
        <StatCard
          title="الذمم المتبقية (قيد التحصيل)"
          value={formatMAD(summary.totalBalance)}
          subtitle="ديون دراسية مفتوحة"
          icon={GraduationCap}
          variant={summary.totalBalance > 0 ? 'expense' : 'default'}
        />
        <StatCard
          title="مشتركو النقل والمطعم"
          value={`${summary.transportSubscribers} نقل | ${summary.canteenSubscribers} مطعم`}
          subtitle={`المزامنون من أروى: ${summary.arouaSchoolsSyncedCount}`}
          icon={Bus}
          variant="pending"
        />
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white/60 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            placeholder="بحث بالاسم، رمز مسار، أو المعرف..."
            className="w-full pr-9 pl-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Transport Filter */}
          <button
            onClick={() => setFilters(prev => ({ ...prev, transportOnly: !prev.transportOnly }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              filters.transportOnly 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                : 'bg-slate-800/60 text-slate-500 border-slate-700 hover:text-white'
            }`}
          >
            <Bus className="w-3.5 h-3.5" />
            <span>مشتركو النقل</span>
          </button>

          {/* Canteen Filter */}
          <button
            onClick={() => setFilters(prev => ({ ...prev, canteenOnly: !prev.canteenOnly }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              filters.canteenOnly 
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' 
                : 'bg-slate-800/60 text-slate-500 border-slate-700 hover:text-white'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>مشتركو المطعم</span>
          </button>

          {/* Payment Status */}
          <select
            value={filters.paymentStatus}
            onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value as any }))}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">كل الحالات المالية</option>
            <option value="pending">متبقي عليهم ذمم</option>
            <option value="settled">مسددون بالكامل (خالص)</option>
          </select>
        </div>
      </div>

      {/* Main Students & Billing Ledger Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/60 backdrop-blur-md">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-800/80 text-xs text-slate-500 border-b border-slate-700/60">
            <tr>
              <th className="px-4 py-3.5 text-right">المعرف ورمز مسار</th>
              <th className="px-4 py-3.5 text-right">التلميذ والمستوى</th>
              <th className="px-4 py-3.5 text-right">المصدر</th>
              <th className="px-4 py-3.5 text-right">الخدمات الملحقة</th>
              <th className="px-4 py-3.5 text-right">إجمالي المستحق</th>
              <th className="px-4 py-3.5 text-right">المسدد</th>
              <th className="px-4 py-3.5 text-right">المتبقي (الذمة)</th>
              <th className="px-4 py-3.5 text-left">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {students.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                  لا يوجد تلاميذ مطابقين لمعايير البحث الحالية
                </td>
              </tr>
            ) : (
              students.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Identifiers */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-mono text-xs font-bold text-emerald-700">
                      {st.student_id}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500">
                      مسار: <span className="text-slate-700 font-semibold">{st.massar_code}</span>
                    </div>
                  </td>

                  {/* Student Name & Level */}
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900 text-sm">{st.full_name_ar}</div>
                    <div className="text-xs text-slate-500">
                      {st.academic_level} {st.classroom && <span className="font-mono text-slate-500">({st.classroom})</span>}
                    </div>
                  </td>

                  {/* Source Platform Badge */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getSourceBadge(st.source_platform)}
                  </td>

                  {/* Subscriptions */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {st.has_transport ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/80 text-amber-700 border border-amber-500/25">
                          <Bus className="w-3 h-3" /> نقل ({formatMAD(st.transport_fee)})
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">-</span>
                      )}
                      {st.has_canteen ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-950/80 text-blue-400 border border-blue-500/25">
                          <Utensils className="w-3 h-3" /> مطعم ({formatMAD(st.canteen_fee)})
                        </span>
                      ) : null}
                    </div>
                  </td>

                  {/* Total Due */}
                  <td className="px-4 py-3 font-mono text-xs text-slate-800 whitespace-nowrap">
                    {formatMAD(st.total_due)}
                  </td>

                  {/* Total Paid */}
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-emerald-700 whitespace-nowrap">
                    {formatMAD(st.total_paid)}
                  </td>

                  {/* Remaining Balance */}
                  <td className="px-4 py-3 font-mono text-xs font-bold whitespace-nowrap">
                    {st.balance > 0 ? (
                      <span className="text-rose-600">{formatMAD(st.balance)}</span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        خالص (0.00)
                      </span>
                    )}
                  </td>

                  {/* Actions & WhatsApp Reminder */}
                  <td className="px-4 py-3 text-left whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {st.parent_whatsapp && st.balance > 0 && (
                        <a
                          href={`https://wa.me/${st.parent_whatsapp}?text=${encodeURIComponent(`السلام عليكم ولي أمر التلميذ(ة) ${st.full_name_ar} (رمز مسار: ${st.massar_code})، نود تذكيركم بأن الذمة المتبقية في حساب الرسوم المدرسية هي: ${st.balance} درهم. شكراً لتعاونكم - إدارة مؤسسة أروى`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-700 border border-emerald-500/30 text-xs transition"
                          title="إرسال إشعار تذكير عبر واتساب"
                        >
                          <Send className="w-3 h-3" />
                          <span>تذكير</span>
                        </a>
                      )}

                      <button
                        onClick={() => handleOpenReceipt(st)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-emerald-800 border border-cyan-500/30 text-xs font-semibold transition"
                        title="إصدار وطباعة وصل مالي رسمي بالشعار"
                      >
                        وصل رسمي
                      </button>
                      <button
                        onClick={() => setSelectedStudent(st)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition"
                      >
                        تفاصيل
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Student Details Dialog */}
      {receiptData && (
        <OfficialReceiptModal
          receipt={receiptData}
          isOpen={Boolean(receiptData)}
          onClose={() => setReceiptData(null)}
        />
      )}

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xs p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedStudent.full_name_ar}</h3>
                <p className="text-xs text-slate-500">{selectedStudent.full_name_fr} - {selectedStudent.academic_level}</p>
              </div>
              {getSourceBadge(selectedStudent.source_platform)}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-500 block mb-1">المعرف الداخلي:</span>
                <span className="font-mono font-bold text-emerald-700">{selectedStudent.student_id}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-500 block mb-1">رمز مسار (Massar):</span>
                <span className="font-mono font-bold text-emerald-700">{selectedStudent.massar_code}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-500 block mb-1">رسم التمدرس السنوي:</span>
                <span className="font-mono font-bold text-slate-900">{formatMAD(selectedStudent.tuition_fee)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-500 block mb-1">رسم النقل المدرسي:</span>
                <span className="font-mono font-bold text-amber-700">{formatMAD(selectedStudent.transport_fee)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-500 block mb-1">رسم الإطعام والمطعم:</span>
                <span className="font-mono font-bold text-blue-400">{formatMAD(selectedStudent.canteen_fee)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-500 block mb-1">الذمة الصافية المتبقية:</span>
                <span className="font-mono font-bold text-rose-600">{formatMAD(selectedStudent.balance)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">هاتف ولي الأمر:</span>
              <span className="font-mono text-white">{selectedStudent.parent_phone || selectedStudent.parent_whatsapp || 'غير مسجل'}</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const st = selectedStudent;
                  setSelectedStudent(null);
                  handleOpenReceipt(st);
                }}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition"
              >
                طباعة وصل أداء رسمي بالشعار
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
