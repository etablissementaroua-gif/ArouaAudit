import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Banknote, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Send, 
  Check, 
  Clock, 
  FileText, 
  Users, 
  ArrowDownLeft, 
  ShieldCheck,
  X
} from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { payrollService } from '../services/payroll.service';
import { MonthlyPayrollSlip } from '../models/payroll.types';

export const PayrollDashboardView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [slips, setSlips] = useState<MonthlyPayrollSlip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [disbursing, setDisbursing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadPayrollData(selectedMonth);
  }, [selectedMonth]);

  const loadPayrollData = async (month: string) => {
    setLoading(true);
    try {
      const data = await payrollService.calculateMonthlyPayroll(month);
      setSlips(data);
    } catch (err) {
      console.error('Error calculating payroll:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDisburse = async () => {
    if (slips.length === 0) return;
    const pendingSlips = slips.filter(s => s.payment_status !== 'paid');
    if (pendingSlips.length === 0) {
      alert('تم صرف جميع رواتب هذا الشهر بالفعل.');
      return;
    }

    if (!confirm(`هل أنت متأكد من صرف رواتب ${pendingSlips.length} موظفاً وضخ قيود الخصم في يومية الصندوق؟`)) {
      return;
    }

    setDisbursing(true);
    try {
      await payrollService.disbursePayroll(pendingSlips);
      await loadPayrollData(selectedMonth);
      showToast(`تم اعتماد وصرف رواتب شهر ${selectedMonth} بنجاح وتسجيل قيد الخصم بالخزينة`);
    } catch (err) {
      console.error('Bulk disburse error:', err);
      alert('حدث خطأ أثناء صرف الرواتب');
    } finally {
      setDisbursing(false);
    }
  };

  const handleSingleDisburse = async (slip: MonthlyPayrollSlip) => {
    try {
      await payrollService.disburseSinglePayroll(slip);
      await loadPayrollData(selectedMonth);
      showToast(`تم صرف راتب الأستاذ/الموظف ${slip.employee?.full_name} بنجاح`);
    } catch (err) {
      console.error('Single disburse error:', err);
      alert('حدث خطأ أثناء صرف الراتب');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Calculations
  const totalBase = slips.reduce((sum, s) => sum + s.base_salary, 0);
  const totalAdvances = slips.reduce((sum, s) => sum + s.advances_deducted, 0);
  const totalCreditDeductions = slips.reduce((sum, s) => sum + s.credit_deducted, 0);
  const totalNet = slips.reduce((sum, s) => sum + s.net_paid, 0);
  const paidCount = slips.filter(s => s.payment_status === 'paid').length;

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-700" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">مسير الأجور والرواتب (Gestion de la Paie)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 border border-indigo-500/20">
              المرحلة 3: مسير الرواتب المعتمد
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            احتساب صافي الرواتب الشهرية، خصم التسبيقات المأخوذة، وضخ قيود الصرف في يومية الصندوق والخزينة.
          </p>
        </div>

        {/* Month Selector + Bulk Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span className="text-xs text-slate-500">الشهر المالي:</span>
            <input 
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white text-xs font-mono font-bold focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleBulkDisburse}
            disabled={disbursing || loading || slips.every(s => s.payment_status === 'paid')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className={`w-4 h-4 ${disbursing ? 'animate-pulse' : ''}`} />
            {disbursing ? 'جاري الصرف والتقييد...' : 'اعتماد وصرف رواتب الشهر'}
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700/60 hover:text-emerald-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="صافي الرواتب المستحقة" 
          value={`${totalNet.toLocaleString()} MAD`} 
          subtitle={`المستحق صرفه لشهر ${selectedMonth}`} 
          icon={CreditCard} 
          variant="expense" 
        />
        <StatCard 
          title="التسبيقات المقتطعة" 
          value={`${totalAdvances.toLocaleString()} MAD`} 
          subtitle="تسبيقات الشهر المخصومة تلقائياً" 
          icon={Banknote} 
          variant="pending" 
        />
        <StatCard 
          title="اقتطاعات الديون السابقة" 
          value={`${totalCreditDeductions.toLocaleString()} MAD`} 
          subtitle="تسويات المديونيات القديمة" 
          icon={ArrowDownLeft} 
          variant="default" 
        />
        <StatCard 
          title="حالة الصرف والإنجاز" 
          value={`${paidCount} / ${slips.length} كشوف`} 
          subtitle={`${Math.round((paidCount / (slips.length || 1)) * 100)}% تم صرفها`} 
          icon={CheckCircle2} 
          variant="income" 
        />
      </div>

      {/* Payroll Calculation Matrix */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden backdrop-blur-md">
        <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            <h2 className="text-sm font-bold text-slate-900">مصفوفة احتساب أجور شهر: {selectedMonth}</h2>
          </div>
          <span className="text-xs font-mono text-slate-500">
            الكتلة الخام: {totalBase.toLocaleString()} MAD
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase">
              <tr>
                <th className="py-4 px-4">الموظف والمنصب</th>
                <th className="py-4 px-3 text-center">الراتب الأساسي (Base)</th>
                <th className="py-4 px-3 text-center">التسبيقات (Avances)</th>
                <th className="py-4 px-3 text-center">اقتطاع الديون</th>
                <th className="py-4 px-3 text-center">صافي الراتب (Net Payé)</th>
                <th className="py-4 px-3 text-center">حالة الصرف</th>
                <th className="py-4 px-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                    جاري احتساب مسير الرواتب والتسبيقات...
                  </td>
                </tr>
              ) : slips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    لا يوجد موظفون نشطون مسجلون لشهر {selectedMonth}.
                  </td>
                </tr>
              ) : (
                slips.map((slip) => {
                  const isPaid = slip.payment_status === 'paid';
                  return (
                    <tr key={slip.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Employee Details */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {slip.employee?.full_name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {slip.employee?.external_staff_id} • {slip.employee?.department}
                        </div>
                      </td>

                      {/* Base Salary */}
                      <td className="py-3 px-3 text-center font-mono font-medium text-slate-800">
                        {slip.base_salary.toLocaleString()} MAD
                      </td>

                      {/* Advances Deducted */}
                      <td className="py-3 px-3 text-center font-mono">
                        {slip.advances_deducted > 0 ? (
                          <span className="text-amber-700 font-bold">
                            -{slip.advances_deducted.toLocaleString()} MAD
                          </span>
                        ) : (
                          <span className="text-slate-500">0 MAD</span>
                        )}
                      </td>

                      {/* Credit Deducted */}
                      <td className="py-3 px-3 text-center font-mono">
                        {slip.credit_deducted > 0 ? (
                          <span className="text-rose-600 font-bold">
                            -{slip.credit_deducted.toLocaleString()} MAD
                          </span>
                        ) : (
                          <span className="text-slate-500">0 MAD</span>
                        )}
                      </td>

                      {/* Net Paid */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-sm text-emerald-700">
                        {slip.net_paid.toLocaleString()} MAD
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Check className="w-3.5 h-3.5" />
                            تم الصرف بنجاح
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            قيد الانتظار
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        {isPaid ? (
                          <span className="text-[10px] font-mono text-slate-500">
                            {slip.payment_reference || 'صُرف'}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSingleDisburse(slip)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            صرف الراتب
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
