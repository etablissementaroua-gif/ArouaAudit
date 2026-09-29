import React, { useState } from 'react';
import { useEnrollment } from '../controllers/useEnrollment';
import { StudentRecord } from '../models/enrollmentModels';
import { OfficialReceiptModal } from '../../treasury-caisse/components/OfficialReceiptModal';
import { OfficialReceiptData } from '../../../shared/lib/receiptPdfGenerator';
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
  Send, 
  CheckCircle2, 
  Users,
  FileText
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          منظومة أروى (arouaschools)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
        محلي
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6 text-slate-800 animate-fade-in" dir="rtl">
      {/* Toast Notification */}
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">{notification}</span>
          </div>
        </div>
      )}

      {/* 2. Page Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">التلاميذ المسجلون وملفات الذمم المدرسية (Student Billing)</h1>
                <span className="px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200/80 rounded-full font-bold text-xs">
                  {students.length} / {rawCount} تلميذ
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                استقبال تلقائي للمسجلين من منظومة <strong className="text-sky-700 font-bold">arouaschools</strong> وربطهم بقيود الذمم واشتراكات النقل والإطعام
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => refresh()}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Service Dues Generation */}
          <button
            disabled={generatingDues}
            onClick={() => generateServiceDues('both')}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="توليد مستحقات النقل والإطعام تلقائياً في يومية الصندوق"
          >
            <Bus className="w-4 h-4 text-amber-600" />
            <Utensils className="w-3.5 h-3.5 text-sky-600" />
            <span>{generatingDues ? 'جاري التوليد...' : 'توليد مستحقات الخدمات في الصندوق'}</span>
          </button>

          {/* Sync from arouaschools Action */}
          <button
            disabled={syncing}
            onClick={() => triggerSyncFromArouaSchools()}
            className="bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-slate-900 font-bold text-xs px-5 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(2,132,199,0.25)] transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'جاري الاستقبال...' : 'استقبال دفعة من arouaschools'}</span>
          </button>
        </div>
      </div>

      {/* 3. KPI Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Due */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] relative overflow-hidden border-r-4 border-r-sky-500 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">إجمالي الذمم والرسوم</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-slate-900 font-black font-mono text-2xl">{formatMAD(summary.totalDue)}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">مستحقات السنة الدراسية المعتمدة</div>
          </div>
        </div>

        {/* Collected */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] relative overflow-hidden border-r-4 border-r-emerald-500 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">المستخلص الفعلي (المقبوض)</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-emerald-600 font-black font-mono text-2xl">{formatMAD(summary.totalPaid)}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">المسدد فعلياً في الحسابات</div>
          </div>
        </div>

        {/* Balance Remaining */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] relative overflow-hidden border-r-4 border-r-rose-500 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">الذمم المتبقية (قيد التحصيل)</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-rose-600 font-black font-mono text-2xl">{formatMAD(summary.totalBalance)}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">ديون دراسية مفتوحة للمتابعة</div>
          </div>
        </div>

        {/* Transport & Canteen Subscribers */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] relative overflow-hidden border-r-4 border-r-amber-500 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">مشتركو النقل والمطعم</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Bus className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-amber-600 font-black font-mono text-2xl">
              {summary.transportSubscribers} نقل | {summary.canteenSubscribers} مطعم
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">
              المزامنون من أروى: {summary.arouaSchoolsSyncedCount} تلميذاً
            </div>
          </div>
        </div>
      </div>

      {/* 4. Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            placeholder="بحث بالاسم، رمز مسار، أو المعرف..."
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 pr-9 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:outline-none w-full sm:w-80 shadow-inner transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Transport Filter */}
          <button
            type="button"
            onClick={() => setFilters(prev => ({ ...prev, transportOnly: !prev.transportOnly }))}
            className={
              filters.transportOnly
                ? "bg-sky-600 text-slate-900 font-bold rounded-xl px-3.5 py-2 text-xs shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            }
          >
            <Bus className="w-3.5 h-3.5" />
            <span>مشتركو النقل</span>
          </button>

          {/* Canteen Filter */}
          <button
            type="button"
            onClick={() => setFilters(prev => ({ ...prev, canteenOnly: !prev.canteenOnly }))}
            className={
              filters.canteenOnly
                ? "bg-sky-600 text-slate-900 font-bold rounded-xl px-3.5 py-2 text-xs shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            }
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>مشتركو المطعم</span>
          </button>

          {/* Payment Status Dropdown */}
          <select
            value={filters.paymentStatus}
            onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value as any }))}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 font-bold focus:bg-white focus:border-sky-500 focus:outline-none cursor-pointer transition-colors"
          >
            <option value="all">كل الحالات المالية</option>
            <option value="pending">متبقي عليهم ذمم</option>
            <option value="settled">مسددون بالكامل (خالص)</option>
          </select>
        </div>
      </div>

      {/* 5. The Core Financial Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
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
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    لا يوجد تلاميذ مطابقين لمعايير البحث الحالية
                  </td>
                </tr>
              ) : (
                students.map((st) => (
                  <tr key={st.id} className="bg-white hover:bg-sky-50/40 border-b border-slate-100 transition-colors">
                    {/* Identifiers */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <span className="font-mono text-xs text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100 inline-block mb-1">
                          {st.student_id}
                        </span>
                      </div>
                      <div className="font-mono text-xs text-slate-500 font-medium">
                        مسار: <span className="font-bold text-slate-800">{st.massar_code}</span>
                      </div>
                    </td>

                    {/* Student Name & Level */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 text-sm">{st.full_name_ar}</div>
                      <div className="text-xs text-slate-500 font-medium">
                        {st.academic_level} {st.classroom && <span className="font-mono text-slate-600 font-semibold">({st.classroom})</span>}
                      </div>
                    </td>

                    {/* Source Platform Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getSourceBadge(st.source_platform)}
                    </td>

                    {/* Auxiliary Services Subscriptions */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {st.has_transport ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Bus className="w-3 h-3 text-amber-700" />
                            <span>نقل ({formatMAD(st.transport_fee)})</span>
                          </span>
                        ) : null}
                        {st.has_canteen ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                            <Utensils className="w-3 h-3 text-sky-700" />
                            <span>مطعم ({formatMAD(st.canteen_fee)})</span>
                          </span>
                        ) : null}
                        {!st.has_transport && !st.has_canteen && (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </div>
                    </td>

                    {/* Total Due */}
                    <td className="px-4 py-3 font-mono font-bold text-slate-800 text-xs whitespace-nowrap">
                      {formatMAD(st.total_due)}
                    </td>

                    {/* Total Paid */}
                    <td className="px-4 py-3 font-mono font-bold text-emerald-700 text-xs whitespace-nowrap">
                      {formatMAD(st.total_paid)}
                    </td>

                    {/* Remaining Balance */}
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                      {st.balance > 0 ? (
                        <span className="font-mono font-black text-rose-600 text-sm">
                          {formatMAD(st.balance)}
                        </span>
                      ) : (
                        <span className="font-mono font-bold text-emerald-700 text-xs bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                          خالص (0.00)
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {st.parent_whatsapp && st.balance > 0 && (
                          <a
                            href={`https://wa.me/${st.parent_whatsapp}?text=${encodeURIComponent(`السلام عليكم ولي أمر التلميذ(ة) ${st.full_name_ar} (رمز مسار: ${st.massar_code})، نود تذكيركم بأن الذمة المتبقية في حساب الرسوم المدرسية هي: ${st.balance} درهم. شكراً لتعاونكم - إدارة مؤسسة أروى`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-800 border border-amber-200 text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                            title="إرسال إشعار تذكير عبر واتساب"
                          >
                            <Send className="w-3 h-3" />
                            <span>تذكير</span>
                          </a>
                        )}

                        <button
                          onClick={() => handleOpenReceipt(st)}
                          className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 border border-sky-200 text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                          title="إصدار وطباعة وصل مالي رسمي بالشعار"
                        >
                          <FileText className="w-3 h-3" />
                          <span>وصل رسمي</span>
                        </button>

                        <button
                          onClick={() => setSelectedStudent(st)}
                          className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium transition-all cursor-pointer"
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
      </div>

      {/* Official Receipt Dialog */}
      {receiptData && (
        <OfficialReceiptModal
          receipt={receiptData}
          isOpen={Boolean(receiptData)}
          onClose={() => setReceiptData(null)}
        />
      )}

      {/* Student Details Dialog */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedStudent.full_name_ar}</h3>
                <p className="text-xs text-slate-500">{selectedStudent.full_name_fr} - {selectedStudent.academic_level}</p>
              </div>
              {getSourceBadge(selectedStudent.source_platform)}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1">المعرف الداخلي:</span>
                <span className="font-mono font-bold text-sky-700">{selectedStudent.student_id}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1">رمز مسار (Massar):</span>
                <span className="font-mono font-bold text-sky-700">{selectedStudent.massar_code}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1">رسم التمدرس السنوي:</span>
                <span className="font-mono font-bold text-slate-900">{formatMAD(selectedStudent.tuition_fee)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1">رسم النقل المدرسي:</span>
                <span className="font-mono font-bold text-amber-700">{formatMAD(selectedStudent.transport_fee)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1">رسم الإطعام والمطعم:</span>
                <span className="font-mono font-bold text-sky-700">{formatMAD(selectedStudent.canteen_fee)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1">الذمة الصافية المتبقية:</span>
                <span className="font-mono font-bold text-rose-600">{formatMAD(selectedStudent.balance)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">هاتف ولي الأمر:</span>
              <span className="font-mono font-bold text-slate-800">{selectedStudent.parent_phone || selectedStudent.parent_whatsapp || 'غير مسجل'}</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const st = selectedStudent;
                  setSelectedStudent(null);
                  handleOpenReceipt(st);
                }}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                طباعة وصل أداء رسمي بالشعار
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
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

export default StudentEnrollmentView;
