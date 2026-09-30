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
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Toast Notification */}
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">{notification}</span>
          </div>
        </div>
      )}

      {/* 2. Page Header */}
      <div className="page-header-card">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  التلاميذ المسجلون وملفات الذمم المدرسية (Student Billing)
                </h1>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full font-bold text-xs">
                  {students.length} / {rawCount} تلميذ
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                استقبال تلقائي للمسجلين من منظومة <strong className="text-emerald-700 font-bold">arouaschools</strong> وربطهم بقيود الذمم واشتراكات النقل والإطعام
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => refresh()}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-colors cursor-pointer"
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
            className="btn-primary"
          >
            <Sparkles className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'جاري الاستقبال...' : 'استقبال دفعة من arouaschools'}</span>
          </button>
        </div>
      </div>

      {/* 3. Strict Unified KPI Financial Cards (Pure Stitch Design) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Due */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-slate-300" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">إجمالي الذمم والرسوم</span>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {formatMAD(summary.totalDue).replace('MAD', '').trim()} <span className="text-sm font-bold text-slate-500 font-sans">MAD</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">مستحقات السنة الدراسية المعتمدة</div>
          </div>
        </div>

        {/* Card 2: Collected */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">المستخلص الفعلي (المقبوض)</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono tracking-tight">
              {formatMAD(summary.totalPaid).replace('MAD', '').trim()} <span className="text-sm font-bold text-emerald-600 font-sans">MAD</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">المسدد فعلياً في الحسابات</div>
          </div>
        </div>

        {/* Card 3: Balance Remaining */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-400" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">الذمم المتبقية (قيد التحصيل)</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono tracking-tight">
              {formatMAD(summary.totalBalance).replace('MAD', '').trim()} <span className="text-sm font-bold text-amber-500 font-sans">MAD</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">ديون دراسية مفتوحة للمتابعة</div>
          </div>
        </div>

        {/* Card 4: Transport & Canteen Subscribers */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-teal-500" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">مشتركو النقل والمطعم</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
              <Bus className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 font-mono text-xl sm:text-2xl font-black text-slate-800">
              <span>{summary.transportSubscribers} <span className="text-xs font-bold text-teal-700 font-sans">نقل</span></span>
              <span className="text-slate-300">|</span>
              <span>{summary.canteenSubscribers} <span className="text-xs font-bold text-amber-700 font-sans">مطعم</span></span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">
              المزامنون من أروى: {summary.arouaSchoolsSyncedCount} تلميذاً
            </div>
          </div>
        </div>
      </div>

      {/* 4. Balanced Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            placeholder="بحث بالاسم، رمز مسار، أو المعرف..."
            className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 pr-9 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none w-full shadow-inner transition-colors"
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
                ? "px-3 py-1.5 bg-slate-900 text-white rounded-xl font-bold shadow-xs text-xs cursor-pointer flex items-center gap-1.5 transition-all"
                : "px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            }
          >
            <Bus className="w-3.5 h-3.5 text-amber-600" />
            <span>مشتركو النقل</span>
          </button>

          {/* Canteen Filter */}
          <button
            type="button"
            onClick={() => setFilters(prev => ({ ...prev, canteenOnly: !prev.canteenOnly }))}
            className={
              filters.canteenOnly
                ? "px-3 py-1.5 bg-slate-900 text-white rounded-xl font-bold shadow-xs text-xs cursor-pointer flex items-center gap-1.5 transition-all"
                : "px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            }
          >
            <Utensils className="w-3.5 h-3.5 text-sky-600" />
            <span>مشتركو المطعم</span>
          </button>

          {/* Payment Status Dropdown */}
          <select
            value={filters.paymentStatus}
            onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value as any }))}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold focus:bg-white focus:border-emerald-600 focus:outline-none cursor-pointer transition-colors"
          >
            <option value="all">كل الحالات المالية</option>
            <option value="pending">متبقي عليهم ذمم</option>
            <option value="settled">مسددون بالكامل (خالص)</option>
          </select>
        </div>
      </div>

      {/* 5. The Core Financial Ledger Table with Dual Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[900px] border-collapse text-right">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4 text-start">المعرف ورمز مسار</th>
                <th className="py-3.5 px-4 text-start">التلميذ والمستوى</th>
                <th className="py-3.5 px-4 text-start">المصدر</th>
                <th className="py-3.5 px-4 text-start">الخدمات الملحقة</th>
                <th className="py-3.5 px-4 text-start">إجمالي المستحق</th>
                <th className="py-3.5 px-4 text-start">المسدد</th>
                <th className="py-3.5 px-4 text-start">المتبقي</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    لا يوجد تلاميذ مطابقين لمعايير البحث الحالية
                  </td>
                </tr>
              ) : (
                students.map((st) => (
                  <tr key={st.id} className="bg-white hover:bg-slate-50/80 transition-colors">
                    {/* Identifiers */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-start">
                      <div>
                        <span className="font-mono text-xs text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block mb-1">
                          {st.student_id}
                        </span>
                      </div>
                      <div className="font-mono text-xs text-slate-500 font-medium">
                        مسار: <span className="font-bold text-slate-800">{st.massar_code}</span>
                      </div>
                    </td>

                    {/* Student Name & Level */}
                    <td className="py-3.5 px-4 text-start">
                      <div className="font-bold text-slate-900 text-sm">{st.full_name_ar}</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">
                        {st.academic_level} {st.classroom && <span className="font-mono text-slate-600 font-semibold">({st.classroom})</span>}
                      </div>
                    </td>

                    {/* Source Platform Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-start">
                      {getSourceBadge(st.source_platform)}
                    </td>

                    {/* Auxiliary Services Subscriptions */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-start">
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
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs whitespace-nowrap text-start">
                      {formatMAD(st.total_due)}
                    </td>

                    {/* Total Paid */}
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 text-xs whitespace-nowrap text-start">
                      {formatMAD(st.total_paid)}
                    </td>

                    {/* Remaining Balance */}
                    <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap text-start">
                      {st.balance > 0 ? (
                        <span className="font-mono font-black text-amber-600 text-sm">
                          {formatMAD(st.balance)}
                        </span>
                      ) : (
                        <span className="font-mono font-bold text-emerald-700 text-xs bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                          خالص (0.00)
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
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
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                          title="إصدار وطباعة وصل مالي رسمي بالشعار"
                        >
                          <FileText className="w-3 h-3" />
                          <span>وصل رسمي</span>
                        </button>

                        <button
                          onClick={() => setSelectedStudent(st)}
                          className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-all cursor-pointer"
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
                <span className="text-slate-500 block mb-1 font-medium">المعرف الداخلي:</span>
                <span className="font-mono font-bold text-emerald-800">{selectedStudent.student_id}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1 font-medium">رمز مسار (Massar):</span>
                <span className="font-mono font-bold text-emerald-800">{selectedStudent.massar_code}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1 font-medium">رسم التمدرس السنوي:</span>
                <span className="font-mono font-bold text-slate-900">{formatMAD(selectedStudent.tuition_fee)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1 font-medium">رسم النقل المدرسي:</span>
                <span className="font-mono font-bold text-amber-700">{formatMAD(selectedStudent.transport_fee)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1 font-medium">رسم الإطعام والمطعم:</span>
                <span className="font-mono font-bold text-sky-700">{formatMAD(selectedStudent.canteen_fee)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1 font-medium">الذمة الصافية المتبقية:</span>
                <span className="font-mono font-bold text-amber-600">{formatMAD(selectedStudent.balance)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedStudent(null)}
                className="btn-secondary px-5 py-2 text-xs cursor-pointer"
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
