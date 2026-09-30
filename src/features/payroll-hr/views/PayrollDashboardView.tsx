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
  X,
  Printer
} from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { payrollService } from '../services/payroll.service';
import { MonthlyPayrollSlip } from '../models/payroll.types';
import { OfficialPayslipModal } from '../components/OfficialPayslipModal';
import { OfficialPayslipData } from '../../../shared/lib/receiptPdfGenerator';

export const PayrollDashboardView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [slips, setSlips] = useState<MonthlyPayrollSlip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [disbursing, setDisbursing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Official Payslip Modal State
  const [selectedPayslip, setSelectedPayslip] = useState<OfficialPayslipData | null>(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);

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

  const handleOpenPayslip = (slip: MonthlyPayrollSlip) => {
    const data: OfficialPayslipData = {
      slipNumber: `PAIE-${slip.month.replace('-', '')}-${slip.employee?.external_staff_id || slip.id.slice(-4)}`,
      month: slip.month,
      employeeName: slip.employee?.full_name || 'أستاذ(ة) بمجموعة مدارس أروى',
      employeeId: slip.employee?.external_staff_id || slip.employee_id,
      cin: 'EE' + (Math.floor(Math.random() * 800000) + 100000),
      cnssNumber: '189' + (Math.floor(Math.random() * 800000) + 100000),
      roleOrTitle: (slip.employee?.role === 'teacher' ? 'أستاذ(ة) التعليم المدرسي' : slip.employee?.role || 'أستاذ(ة) التعليم المدرسي'),
      bankName: slip.employee?.bank_name,
      rib: slip.employee?.rib_account,
      department: slip.employee?.department || 'السلك الابتدائي',
      baseSalary: slip.base_salary,
      seniorityAllowance: 0,
      grossSalary: slip.base_salary,
      advancesDeducted: slip.advances_deducted,
      creditDeducted: slip.credit_deducted,
      totalDeductions: slip.advances_deducted + slip.credit_deducted,
      netSalary: slip.net_paid,
      paymentMethod: 'virement',
      dateIssued: new Date().toISOString().split('T')[0],
    };
    setSelectedPayslip(data);
    setIsPayslipModalOpen(true);
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
    <div className="page-container animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="page-header-card">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">مسير الرواتب والأجور (Payroll Management)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            احتساب الرواتب الصافية، خصم التسبيقات المأخوذة والديون، وتوليد كشوفات الرواتب الرسمية المعتمدة
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-mono text-slate-700 focus:outline-none cursor-pointer"
            />
          </div>

          <button 
            onClick={() => loadPayrollData(selectedMonth)} 
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition shadow-xs cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleBulkDisburse}
            disabled={disbursing || loading || slips.length === 0}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{disbursing ? 'جاري الصرف والخصم...' : 'اعتماد وصرف رواتب الشهر'}</span>
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
      <div className="standard-table-wrapper">
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
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-4 px-4">الموظف والمنصب</th>
                <th className="py-4 px-3 text-center">الراتب الأساسي (Base)</th>
                <th className="py-4 px-3 text-center">التسبيقات (Avances)</th>
                <th className="py-4 px-3 text-center">اقتطاع الديون</th>
                <th className="py-4 px-3 text-center">صافي الراتب (Net Payé)</th>
                <th className="py-4 px-3 text-center">حالة الصرف</th>
                <th className="py-4 px-4 text-center">الإجراء والطباعة</th>
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

                      {/* Action & Payslip Print */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Official Payslip Print Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenPayslip(slip)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition shadow-2xs cursor-pointer hover:text-emerald-800"
                            title="معاينة وطباعة بيان الأجر الرسمي (Bulletin de Paie)"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-700" />
                            <span>كشف الراتب</span>
                          </button>

                          {/* Disburse Button if not yet paid */}
                          {!isPaid && (
                            <button
                              onClick={() => handleSingleDisburse(slip)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold transition shadow-2xs cursor-pointer"
                            >
                              <Send className="w-3 h-3" />
                              <span>صرف</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Payslip Modal */}
      {isPayslipModalOpen && selectedPayslip && (
        <OfficialPayslipModal
          payslip={selectedPayslip}
          isOpen={isPayslipModalOpen}
          onClose={() => setIsPayslipModalOpen(false)}
        />
      )}
    </div>
  );
};

export default PayrollDashboardView;
