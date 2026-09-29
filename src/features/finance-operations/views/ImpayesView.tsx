import React, { useState, useEffect } from 'react';
import { financeOperationsService } from '../services/financeOperations.service';
import { StudentImpayeRecord, ImpayeFilters, ServiceType, AgingCategory, RecoveryStatus } from '../models/finance.types';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { 
  AlertOctagon, 
  Search, 
  Filter, 
  MessageSquare, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  User, 
  Bus, 
  Utensils, 
  GraduationCap, 
  AlertTriangle, 
  Layers,
  ArrowUpDown,
  X,
  FileSpreadsheet
} from 'lucide-react';

export const ImpayesView: React.FC = () => {
  const [impayes, setImpayes] = useState<StudentImpayeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ImpayeFilters>({
    search: '',
    service_type: 'all',
    aging_category: 'all',
    recovery_status: 'all',
    sort_by: 'amount_desc'
  });

  // Modal State for Promise of payment
  const [selectedImpaye, setSelectedImpaye] = useState<StudentImpayeRecord | null>(null);
  const [promiseDate, setPromiseDate] = useState('');
  const [promiseNotes, setPromiseNotes] = useState('');
  const [isPromiseModalOpen, setIsPromiseModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await financeOperationsService.getImpayesList(filters);
    setImpayes(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const stats = financeOperationsService.getImpayesSummaryStats(impayes);

  const handleOpenPromiseModal = (item: StudentImpayeRecord) => {
    setSelectedImpaye(item);
    setPromiseDate(item.promise_date || new Date().toISOString().split('T')[0]);
    setPromiseNotes(item.notes || '');
    setIsPromiseModalOpen(true);
  };

  const handleSavePromise = async () => {
    if (!selectedImpaye) return;
    await financeOperationsService.updateImpayeRecoveryStatus(
      selectedImpaye.id, 
      'promised', 
      promiseNotes, 
      promiseDate
    );
    setIsPromiseModalOpen(false);
    setSelectedImpaye(null);
    loadData();
  };

  const handleMarkSettled = async (id: string) => {
    if (confirm('هل تؤكد تسوية واستخلاص هذا المبلغ المتأخر؟')) {
      await financeOperationsService.updateImpayeRecoveryStatus(id, 'settled', 'تمت التسوية والاستخلاص بنجاح');
      loadData();
    }
  };

  const handleSendWhatsApp = async (item: StudentImpayeRecord) => {
    const phone = item.guardian_whatsapp || item.guardian_phone || '212600000000';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const serviceNameAr = item.service_type === 'transport' ? 'النقل المدرسي' : item.service_type === 'cantine' ? 'المطعم المدرسي' : 'التمدرس والتعليم';
    const message = encodeURIComponent(
      `السلام عليكم ورحمة الله، ولي أمر التلميذ(ة) ${item.student_name} المحترم،\n\nنود تذكيركم بوجود مستحقات واجب ${serviceNameAr} لشهر ${item.due_month} بمبلغ ${formatMAD(item.amount_due)} لفائدة مجموعة مدارس أروى.\n\nنشكركم على حسن تعاونكم ونسعد باستقبالكم لتسوية المستحقات.\nإدارة الحسابات - Groupe Scolaire Aroua`
    );

    await financeOperationsService.logReminderSent(item.id);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    loadData();
  };

  const getServiceBadge = (service: ServiceType) => {
    switch (service) {
      case 'transport':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Bus className="w-3 h-3" />
            <span>نقل مدرسي</span>
          </span>
        );
      case 'cantine':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
            <Utensils className="w-3 h-3" />
            <span>مطعم مدرسي</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <GraduationCap className="w-3 h-3" />
            <span>تمدرس ورسوم</span>
          </span>
        );
    }
  };

  const getAgingBadge = (aging: AgingCategory) => {
    switch (aging) {
      case '90_plus':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300 animate-pulse">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>تأخر +90 يوماً (حرج)</span>
          </span>
        );
      case '60_days':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
            <Clock className="w-3.5 h-3.5" />
            <span>تأخر 60 يوماً</span>
          </span>
        );
      case '30_days':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>تأخر 30 يوماً</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <span>مستحق هذا الشهر</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: RecoveryStatus, promiseDate?: string | null) => {
    switch (status) {
      case 'settled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>تمت التسوية</span>
          </span>
        );
      case 'promised':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200" title={`موعد الوعد: ${promiseDate || ''}`}>
            <Calendar className="w-3 h-3" />
            <span>وعد بالسداد ({promiseDate || 'محدد'})</span>
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Phone className="w-3 h-3" />
            <span>تم الاتصال</span>
          </span>
        );
      case 'litigation':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-100 text-rose-800 border border-rose-300">
            <span>متابعة إدارية وقانونية</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span>غير مؤدى (جديد)</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/90 p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-600">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">المستحقات غير المؤداة والمتأخرات (Impayés)</h1>
            <p className="text-slate-500 text-sm">لوحة المراقبة والتحصيل المالي للذمم المدرسية، التمدرس، النقل، والمطعم</p>
          </div>
        </div>

        <div className="bg-rose-50/80 border border-rose-200 px-5 py-3 rounded-2xl flex items-center gap-4">
          <div>
            <span className="text-xs text-rose-700 font-semibold block">إجمالي الديون العالقة</span>
            <span className="text-2xl font-black text-rose-600 font-mono">{formatMAD(stats.totalDueAmount)}</span>
          </div>
          <div className="h-8 w-px bg-rose-200" />
          <div>
            <span className="text-xs text-rose-700 font-semibold block">التلاميذ المدينين</span>
            <span className="text-xl font-black text-slate-900 font-mono">{stats.debtorsCount} تلميذ</span>
          </div>
        </div>
      </div>

      {/* Financial Risk KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 border-l-4 border-l-indigo-400 p-4 rounded-xl shadow-xs">
          <span className="text-xs text-indigo-700 font-bold block mb-1">متأخرات التمدرس</span>
          <p className="text-xl font-black text-slate-900 font-mono">{formatMAD(stats.scolariteDueAmount)}</p>
          <span className="text-[11px] text-slate-500">واجبات التمدرس الشهرية</span>
        </div>

        <div className="bg-white border border-slate-200/90 border-l-4 border-l-amber-400 p-4 rounded-xl shadow-xs">
          <span className="text-xs text-amber-700 font-bold block mb-1">متأخرات النقل المدرسي</span>
          <p className="text-xl font-black text-amber-600 font-mono">{formatMAD(stats.transportDueAmount)}</p>
          <span className="text-[11px] text-slate-500">اشتراكات الحافلات العالقة</span>
        </div>

        <div className="bg-white border border-slate-200/90 border-l-4 border-l-cyan-400 p-4 rounded-xl shadow-xs">
          <span className="text-xs text-cyan-700 font-bold block mb-1">متأخرات المطعم المدرسي</span>
          <p className="text-xl font-black text-cyan-600 font-mono">{formatMAD(stats.cantineDueAmount)}</p>
          <span className="text-[11px] text-slate-500">وجبات التغذية والمطعم</span>
        </div>

        <div className="bg-rose-50/70 border border-rose-200 border-l-4 border-l-rose-500 p-4 rounded-xl shadow-xs">
          <span className="text-xs text-rose-700 font-bold block mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>ديون حرجة (+90 يوماً)</span>
          </span>
          <p className="text-xl font-bold text-rose-600 font-mono">{formatMAD(stats.overdue90DaysAmount)}</p>
          <span className="text-[11px] text-rose-600/80">{stats.overdue90DaysCount} تلميذ بحاجة لمتابعة عاجلة</span>
        </div>
      </div>

      {/* Dual Tab Switcher: By Service */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilters({ ...filters, service_type: 'all' })}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filters.service_type === 'all'
                ? 'px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold shadow-xs text-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs font-semibold'
            }`}
          >
            كافة المتأخرات والخدمات
          </button>

          <button
            onClick={() => setFilters({ ...filters, service_type: 'scolarite' })}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filters.service_type === 'scolarite'
                ? 'px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold shadow-xs text-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs font-semibold'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>التمدرس فقط (Scolarité)</span>
          </button>

          <button
            onClick={() => setFilters({ ...filters, service_type: 'transport' })}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filters.service_type === 'transport'
                ? 'bg-slate-900 text-white rounded-xl font-bold shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs font-medium'
            }`}
          >
            <Bus className="w-3.5 h-3.5" />
            <span>النقل فقط (لائحة المشرفين)</span>
          </button>

          <button
            onClick={() => setFilters({ ...filters, service_type: 'cantine' })}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filters.service_type === 'cantine'
                ? 'bg-slate-900 text-white rounded-xl font-bold shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs font-medium'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>المطعم فقط (لائحة المشرفين)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filters.aging_category}
            onChange={e => setFilters({ ...filters, aging_category: e.target.value as any })}
            className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium shadow-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="all">كافة فترات التقادم (Aging)</option>
            <option value="current">هذا الشهر</option>
            <option value="30_days">متأخر 30 يوماً</option>
            <option value="60_days">متأخر 60 يوماً</option>
            <option value="90_plus">متأخر +90 يوماً (خطر)</option>
          </select>

          <select
            value={filters.sort_by}
            onChange={e => setFilters({ ...filters, sort_by: e.target.value as any })}
            className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium shadow-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="amount_desc">الأعلى مديونية (تنازلي)</option>
            <option value="amount_asc">الأقل مديونية (تصاعدي)</option>
            <option value="name_asc">حسب اسم التلميذ أبجدياً</option>
          </select>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="بحث سريع باسم التلميذ، المعرف المدرسي (ID)، أو الفوج..."
          value={filters.search}
          onChange={e => setFilters({ ...filters, search: e.target.value })}
          className="w-full bg-white border border-slate-300 rounded-2xl pr-10 pl-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
        />
      </div>

      {/* Debtors Interactive Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-700 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-4">التلميذ / المعرف</th>
                <th className="py-4 px-4">المستوى والفوج</th>
                <th className="py-4 px-4">الخدمة المستحقة</th>
                <th className="py-4 px-4">المبلغ العالق</th>
                <th className="py-4 px-4">التقادم الزمني (Aging)</th>
                <th className="py-4 px-4">حالة التحصيل</th>
                <th className="py-4 px-4 text-center">إجراءات المتابعة والتحصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">جاري تحميل سجل المتأخرات...</td>
                </tr>
              ) : impayes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-emerald-700">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-8 h-8" />
                      <span>ممتاز! لا توجد متأخرات مطابقة لمعايير البحث المحددة</span>
                    </div>
                  </td>
                </tr>
              ) : (
                impayes.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span>{item.student_name}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                        معرف: {item.student_id}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="text-slate-800 font-semibold block">{item.academic_level}</span>
                      {item.classroom_group && (
                        <span className="text-[11px] text-emerald-700 block">{item.classroom_group}</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      {getServiceBadge(item.service_type)}
                      <span className="block text-[11px] text-slate-500 font-mono mt-1">شهر: {item.due_month}</span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-mono font-black text-rose-600 text-base">
                        {formatMAD(item.amount_due)}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      {getAgingBadge(item.aging_category)}
                    </td>

                    <td className="py-4 px-4">
                      {getStatusBadge(item.recovery_status, item.promise_date)}
                      {item.reminder_count > 0 && (
                        <span className="block text-[11px] text-slate-500 mt-0.5">
                          تذكيرات مرسلة: {item.reminder_count}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* WhatsApp Direct Reminder */}
                        <button
                          onClick={() => handleSendWhatsApp(item)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-300 shadow-xs transition-all hover:scale-105 active:scale-95 shadow-sm"
                          title="إرسال تذكير رسمي فوري عبر واتساب"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>تذكير WhatsApp</span>
                        </button>

                        {/* Promise of Payment */}
                        <button
                          onClick={() => handleOpenPromiseModal(item)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs transition-all hover:scale-105 active:scale-95 shadow-sm"
                          title="تسجيل وعد بالأداء"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>وعد بالأداء</span>
                        </button>

                        {/* Quick Mark Settled */}
                        {item.recovery_status !== 'settled' && (
                          <button
                            onClick={() => handleMarkSettled(item.id)}
                            className="p-1.5 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded-xl transition-colors border border-transparent hover:border-emerald-200"
                            title="تسجيل السداد والتسوية"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promise of payment modal */}
      {isPromiseModalOpen && selectedImpaye && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 border border-slate-200 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 text-slate-900">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5 text-emerald-700">
                <Calendar className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">تسجيل وعد بالسداد والمتابعة</h3>
              </div>
              <button
                onClick={() => setIsPromiseModalOpen(false)}
                className="p-1.5 text-slate-600 hover:text-slate-900 font-medium rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 p-3.5">
                <p className="text-slate-500">التلميذ: <span className="text-slate-900 font-bold">{selectedImpaye.student_name}</span></p>
                <p className="text-slate-500">المبلغ العالق: <span className="text-rose-600 font-mono font-bold">{formatMAD(selectedImpaye.amount_due)}</span></p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 font-bold mb-1.5">تاريخ الوعد بالسداد المحدد *</label>
                <input
                  type="date"
                  value={promiseDate}
                  onChange={e => setPromiseDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 font-bold mb-1.5">ملاحظات ومخرجات التواصل مع ولي الأمر</label>
                <textarea
                  rows={3}
                  value={promiseNotes}
                  onChange={e => setPromiseNotes(e.target.value)}
                  placeholder="مثال: تم الاتصال بالأب وأفاد بالحضور للصندوق يوم الإثنين لأداء المبلغ نقداً..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPromiseModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSavePromise}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-700/20 active:scale-95 transition-all"
                >
                  حفظ وتأكيد الوعد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
