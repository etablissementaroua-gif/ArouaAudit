import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Users, 
  DollarSign, 
  ArrowDownLeft, 
  CheckCircle2, 
  X, 
  Calendar, 
  Banknote, 
  ShieldAlert, 
  Save
} from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { payrollService } from '../services/payroll.service';
import { Employee } from '../models/payroll.types';

export const StaffDebtsView: React.FC = () => {
  const [departedStaff, setDepartedStaff] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Repayment Modal
  const [repayingEmployee, setRepayingEmployee] = useState<Employee | null>(null);
  const [repayAmount, setRepayAmount] = useState<number>(500);
  const [repayNotes, setRepayNotes] = useState<string>('');
  const [repayLoading, setRepayLoading] = useState<boolean>(false);

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    setLoading(true);
    try {
      const data = await payrollService.getDepartedEmployeesWithDebts();
      setDepartedStaff(data);
    } catch (err) {
      console.error('Error loading departed debts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayingEmployee) return;

    setRepayLoading(true);
    try {
      await payrollService.recordDebtRepayment(repayingEmployee.id, repayAmount, repayNotes);
      await loadDebts();
      showToast(`تم استرداد مبلغ ${repayAmount} MAD من الأستاذ/الموظف السابق ${repayingEmployee.full_name} وتقييد مدخول بالصندوق`);
      setRepayingEmployee(null);
    } catch (err) {
      console.error('Debt repayment error:', err);
      alert('حدث خطأ أثناء تسجيل الاسترداد');
    } finally {
      setRepayLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const totalOutstanding = departedStaff.reduce((sum, e) => sum + (Number(e.credit_ancien) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">ديون الموظفين المغادرين العالقة (Créances du Personnel Partant)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              الرقابة واسترداد الذمم
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            تتبع وتحصيل المديونيات السابقة للموظفين والأساتذة الذين انتهت مهامهم بالمؤسسة مع توثيق التحصيل بالصندوق.
          </p>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400/60 hover:text-emerald-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          title="عدد المغادرين ذوي المديونية" 
          value={`${departedStaff.length} موظفين`} 
          subtitle="ملفات تحت المتابعة المالية" 
          icon={Users} 
          variant="expense" 
        />
        <StatCard 
          title="إجمالي الديون العالقة" 
          value={`${totalOutstanding.toLocaleString()} MAD`} 
          subtitle="ذمم مستحقة للمؤسسة" 
          icon={DollarSign} 
          variant="expense" 
        />
        <StatCard 
          title="حالة التدقيق والتحصيل" 
          value="نشطة" 
          subtitle="تُقيد مداخيل الاسترداد بالصندوق فوراً" 
          icon={ArrowDownLeft} 
          variant="income" 
        />
      </div>

      {/* Departed Staff Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase">
              <tr>
                <th className="py-4 px-4">الموظف السابق</th>
                <th className="py-4 px-3">المنصب السابق</th>
                <th className="py-4 px-3">بيانات الاتصال</th>
                <th className="py-4 px-3 text-center">المديونية العالقة (Crédit Ancien)</th>
                <th className="py-4 px-3 text-center">الحالة</th>
                <th className="py-4 px-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                    جاري تحميل سجل ديون المغادرين...
                  </td>
                </tr>
              ) : departedStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    لا توجد أي مديونيات عالقة لموظفين مغادرين حالياً.
                  </td>
                </tr>
              ) : (
                departedStaff.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{emp.full_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {emp.external_staff_id} • CIN: {emp.cin || 'غير متوفر'}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-slate-300">
                      {emp.role} • {emp.department}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-slate-400">
                      {emp.phone || 'غير مسجل'}
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono font-bold text-sm text-rose-400">
                      {emp.credit_ancien.toLocaleString()} MAD
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        مغادر المؤسسة
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => {
                          setRepayingEmployee(emp);
                          setRepayAmount(Math.min(emp.credit_ancien, 1000));
                          setRepayNotes('');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer"
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        تسجيل استرداد
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Repayment Modal */}
      {repayingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">تسجيل استرداد دين مالي</h3>
                  <p className="text-xs text-slate-400">{repayingEmployee.full_name} • متبقي: {repayingEmployee.credit_ancien} MAD</p>
                </div>
              </div>
              <button 
                onClick={() => setRepayingEmployee(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordRepayment} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  المبلغ المسترد (MAD) *
                </label>
                <input 
                  type="number"
                  step="50"
                  min="50"
                  max={repayingEmployee.credit_ancien}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-sm focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  بيان وتفاصيل الاسترداد
                </label>
                <input 
                  type="text"
                  placeholder="مثال: تسوية نقدية بالصندوق أو تحويل بنكي..."
                  value={repayNotes}
                  onChange={(e) => setRepayNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 text-[11px]">
                سيتم خصم هذا المبلغ من مديونية الموظف وإضافته كمدخول نقدي (Encaissement) في يومية الصندوق.
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRepayingEmployee(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={repayLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition cursor-pointer"
                >
                  {repayLoading ? 'جاري التسجيل...' : 'تأكيد الاسترداد بالصندوق'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
