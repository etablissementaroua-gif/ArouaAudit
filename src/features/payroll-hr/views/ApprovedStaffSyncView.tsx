import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  RefreshCw, 
  Plus, 
  Search, 
  Banknote, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Tag, 
  DollarSign, 
  ShieldCheck, 
  Save, 
  Clock, 
  GraduationCap, 
  Bus, 
  Briefcase, 
  HeartHandshake,
  FileText,
  CreditCard,
  Building
} from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { arouaStaffSyncService } from '../services/arouaStaffSync.service';
import { payrollService } from '../services/payroll.service';
import { Employee, StaffAdvance } from '../models/payroll.types';

export const ApprovedStaffSyncView: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Advance Modal State
  const [advanceModalEmployee, setAdvanceModalEmployee] = useState<Employee | null>(null);
  const [advanceAmount, setAdvanceAmount] = useState<number>(1000);
  const [advanceDate, setAdvanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [advanceMethod, setAdvanceMethod] = useState<'espece' | 'cheque' | 'virement'>('espece');
  const [advanceCheckNumber, setAdvanceCheckNumber] = useState<string>('');
  const [advanceMonth, setAdvanceMonth] = useState<string>('2026-09');
  const [advanceNotes, setAdvanceNotes] = useState<string>('');
  const [advanceLoading, setAdvanceLoading] = useState<boolean>(false);

  // Edit Financials Modal State
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [editSalary, setEditSalary] = useState<number>(0);
  const [editDebt, setEditDebt] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<'active' | 'departed' | 'suspended'>('active');

  // Statement Drawer / Modal State
  const [statementEmp, setStatementEmp] = useState<Employee | null>(null);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await payrollService.getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error('Error loading employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFromArouaSchools = async () => {
    setSyncing(true);
    try {
      const result = await arouaStaffSyncService.syncApprovedStaffFromArouaSchools();
      await loadStaff();
      showToast(`${result.details} (تمت في ${result.timestamp})`);
    } catch (err) {
      console.error('Sync error:', err);
      alert('حدث خطأ أثناء الاتصال بمنظومة arouaschools');
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceModalEmployee) return;

    setAdvanceLoading(true);
    try {
      await payrollService.recordAdvance({
        employee_id: advanceModalEmployee.id,
        amount: Number(advanceAmount) || 0,
        advance_date: advanceDate,
        payment_method: advanceMethod,
        check_number: advanceMethod === 'cheque' ? advanceCheckNumber : undefined,
        month_reference: advanceMonth,
        notes: advanceNotes
      });

      showToast(`تم صرف وتقييد تسبيق بقيمة ${advanceAmount} MAD للأستاذ/الموظف ${advanceModalEmployee.full_name} وخصمه تلقائياً من الصندوق`);
      setAdvanceModalEmployee(null);
    } catch (err) {
      console.error('Record advance error:', err);
      alert('حدث خطأ أثناء تسجيل التسبيق');
    } finally {
      setAdvanceLoading(false);
    }
  };

  const handleSaveFinancials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmp) return;

    try {
      await payrollService.updateEmployeeFinancials(editEmp.id, editSalary, editDebt, editStatus);
      await loadStaff();
      showToast(`تم تحديث البيانات المالية للأستاذ/الموظف ${editEmp.full_name} بنجاح`);
      setEditEmp(null);
    } catch (err) {
      console.error('Update financials error:', err);
      alert('حدث خطأ أثناء تعديل البيانات المالية');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Aggregated Stats
  const activeStaff = employees.filter(e => e.employment_status === 'active');
  const teachersCount = activeStaff.filter(e => e.role === 'teacher').length;
  const driversCount = activeStaff.filter(e => e.role === 'driver' || e.department === 'Transport' || e.role === 'assistant').length;
  const totalBaseSalary = activeStaff.reduce((sum, e) => sum + (Number(e.base_salary) || 0), 0);

  // Filtering
  const filteredEmployees = employees.filter(e => {
    const matchesDept = deptFilter === 'all' || e.department === deptFilter;
    const matchesSearch = !searchQuery || 
      e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.cin && e.cin.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.external_staff_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">الموظفون المعتمدون ومسير الرواتب (Personnel Mappé)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              مزامنة الأطر والأساتذة
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            جلب وتدقيق لائحة الموظفين والأساتذة وسائقي النقل المعتمدين من منظومة arouaschools وإدارة كتل الرواتب المحاسبية.
          </p>
        </div>

        <button
          onClick={handleSyncFromArouaSchools}
          disabled={syncing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'جاري جلب وتحديث الأطر...' : '🔄 مزامنة الموظفين من arouaschools'}
        </button>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="إجمالي الأطر المسجلة" 
          value={`${employees.length} أطر`} 
          subtitle="تربويون، إداريون، سائقون ومساعدات" 
          icon={Users} 
          variant="income" 
        />
        <StatCard 
          title="طاقم وهيئة التدريس" 
          value={`${teachersCount} أساتذة`} 
          subtitle="ابتدائي، إعدادي، وتأهيلي" 
          icon={GraduationCap} 
          variant="default" 
        />
        <StatCard 
          title="السائقون والمرافقات" 
          value={`${driversCount} أطر`} 
          subtitle="النقل واللوجستيك والمطعمة" 
          icon={Bus} 
          variant="pending" 
        />
        <StatCard 
          title="إجمالي كتلة الأجور الأساسية" 
          value={`${totalBaseSalary.toLocaleString()} MAD`} 
          subtitle="الرواتب الشهرية الثابتة للأطر النشطة" 
          icon={Banknote} 
          variant="expense" 
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setDeptFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              deptFilter === 'all' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            الجميع ({employees.length})
          </button>
          <button
            onClick={() => setDeptFilter('Pedagogique')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              deptFilter === 'Pedagogique' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            الهيئة التربوية ({employees.filter(e => e.department === 'Pedagogique').length})
          </button>
          <button
            onClick={() => setDeptFilter('Transport')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              deptFilter === 'Transport' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            النقل واللوجستيك ({employees.filter(e => e.department === 'Transport').length})
          </button>
          <button
            onClick={() => setDeptFilter('Administration')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              deptFilter === 'Administration' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            الإدارة والصندوق ({employees.filter(e => e.department === 'Administration').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
          <input 
            type="text"
            placeholder="بحث بالاسم أو CIN أو المعرف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase">
              <tr>
                <th className="py-4 px-4">الموظف والمعرف</th>
                <th className="py-4 px-3">المنصب والقسم</th>
                <th className="py-4 px-3">المواد والأفواج المسندة</th>
                <th className="py-4 px-3 text-center">الراتب الأساسي (Base Salary)</th>
                <th className="py-4 px-3 text-center">ديون سابقة (Crédit Ancien)</th>
                <th className="py-4 px-3 text-center">الحالة</th>
                <th className="py-4 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                    جاري تحميل سجل الأطر والموظفين...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    لا يوجد أي موظف مطابق للبحث.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Name & UID */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{emp.full_name}</span>
                          <span 
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm"
                            title="إطار معتمد ومطابق رسمياً من منظومة arouaschools"
                          >
                            <span>🟢 معتمد من arouaschools</span>
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="text-indigo-400">{emp.external_staff_id}</span>
                          {emp.cin && <span>• CIN: {emp.cin}</span>}
                          {emp.phone && <span>• {emp.phone}</span>}
                        </div>
                      </div>
                    </td>

                    {/* Role & Dept */}
                    <td className="py-3.5 px-3">
                      <div className="font-medium text-slate-200">
                        {emp.role === 'teacher' ? 'أستاذ(ة) ممارس' :
                         emp.role === 'driver' ? 'سائق حافلة النقل' :
                         emp.role === 'admin' ? 'إطار إداري / مالي' :
                         emp.role === 'assistant' ? 'مربية / مساعدة' : emp.role}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{emp.department}</div>
                    </td>

                    {/* Subjects & Classes */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {emp.subjects && emp.subjects.length > 0 ? (
                          emp.subjects.map((sub, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 text-[10px] border border-indigo-500/20">
                              {sub}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-500">عام</span>
                        )}
                        {emp.assigned_classes && emp.assigned_classes.length > 0 && (
                          emp.assigned_classes.map((cls, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
                              {cls}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    {/* Base Salary */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-mono font-bold text-sm text-white">
                        {emp.base_salary ? emp.base_salary.toLocaleString() : '0'} MAD
                      </span>
                    </td>

                    {/* Credit Ancien */}
                    <td className="py-3.5 px-3 text-center">
                      {emp.credit_ancien > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono font-bold text-xs border border-rose-500/20">
                          {emp.credit_ancien.toLocaleString()} MAD
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-xs">0 MAD</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        emp.employment_status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : emp.employment_status === 'departed'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {emp.employment_status === 'active' ? 'نشط بالخدمة' : 
                         emp.employment_status === 'departed' ? 'مغادر للمؤسسة' : 'موقوف مؤقتاً'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* 1. Record Advance Action */}
                        <button
                          onClick={() => {
                            setAdvanceModalEmployee(emp);
                            setAdvanceAmount(1000);
                            setAdvanceNotes('');
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-medium transition cursor-pointer"
                          title="تسجيل تسبيق مالي فوري (Avance)"
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          تسبيق
                        </button>

                        {/* 2. Edit Base Salary and Credit Action */}
                        <button
                          onClick={() => {
                            setEditEmp(emp);
                            setEditSalary(emp.base_salary);
                            setEditDebt(emp.credit_ancien);
                            setEditStatus(emp.employment_status);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                          title="تعديل الراتب الأساسي والديون السابقة"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* 3. Open Financial Statement Slip */}
                        <button
                          onClick={() => setStatementEmp(emp)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 transition cursor-pointer"
                          title="فتح كشف الحساب المالي للموظف"
                        >
                          <FileText className="w-3.5 h-3.5" />
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

      {/* Advance Modal */}
      {advanceModalEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">تسجيل تسبيق مالي (Avance sur salaire)</h3>
                  <p className="text-xs text-slate-400">{advanceModalEmployee.full_name} • راتب: {advanceModalEmployee.base_salary} MAD</p>
                </div>
              </div>
              <button 
                onClick={() => setAdvanceModalEmployee(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdvance} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">المبلغ المطلوب (MAD)</label>
                <input 
                  type="number"
                  min="100"
                  step="50"
                  required
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">تاريخ الصرف</label>
                  <input 
                    type="date"
                    required
                    value={advanceDate}
                    onChange={(e) => setAdvanceDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">طريقة الصرف</label>
                  <select 
                    value={advanceMethod}
                    onChange={(e) => setAdvanceMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="espece">نقداً (Espèces)</option>
                    <option value="cheque">شيك بنكي (Chèque)</option>
                    <option value="virement">تحويل بنكي (Virement)</option>
                  </select>
                </div>
              </div>

              {advanceMethod === 'cheque' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">رقم الشيك البنكي</label>
                  <input 
                    type="text"
                    required
                    placeholder="CHQ-..."
                    value={advanceCheckNumber}
                    onChange={(e) => setAdvanceCheckNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">الشهر المحاسبي للخصم</label>
                <input 
                  type="month"
                  required
                  value={advanceMonth}
                  onChange={(e) => setAdvanceMonth(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">ملاحظات الصندوق</label>
                <textarea 
                  rows={2}
                  placeholder="سبب التسبيق أو توضيحات إضافية..."
                  value={advanceNotes}
                  onChange={(e) => setAdvanceNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>سيتم تسجيل هذا التسبيق تلقائياً كحركة سحب (Décaissement) في يومية الصندوق وخصمه من راتب شهر {advanceMonth}.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdvanceModalEmployee(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={advanceLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {advanceLoading ? 'جاري التقييد...' : 'تأكيد وصرف التسبيق'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Financials Modal */}
      {editEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">تعديل البيانات المالية للأستاذ/الموظف</h3>
                  <p className="text-xs text-slate-400">{editEmp.full_name} ({editEmp.external_staff_id})</p>
                </div>
              </div>
              <button 
                onClick={() => setEditEmp(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFinancials} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">الراتب الأساسي الشهري (MAD)</label>
                <input 
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={editSalary}
                  onChange={(e) => setEditSalary(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">الديون والذمم السابقة العالقة (Crédit Ancien MAD)</label>
                <input 
                  type="number"
                  min="0"
                  step="50"
                  value={editDebt}
                  onChange={(e) => setEditDebt(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:border-indigo-500 focus:outline-none text-rose-400 font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">تقتطع تدريجياً أو عند التسوية الشاملة للراتب</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">الحالة الوظيفية بالنظام المالي</label>
                <select 
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="active">نشط بالخدمة (Active)</option>
                  <option value="departed">مغادر للمؤسسة (Departed)</option>
                  <option value="suspended">موقوف مؤقتاً (Suspended)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditEmp(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  حفظ البيانات المالية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Financial Statement Modal */}
      {statementEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">كشف الحساب المالي المعتمد للموظف</h3>
                  <p className="text-xs text-slate-400">{statementEmp.full_name} • {statementEmp.external_staff_id}</p>
                </div>
              </div>
              <button 
                onClick={() => setStatementEmp(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[11px] text-slate-400 block">رقم البطاقة الوطنية (CIN):</span>
                <span className="font-mono font-bold text-white">{statementEmp.cin || 'غير محدد'}</span>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[11px] text-slate-400 block">رقم الضمان الاجتماعي (CNSS):</span>
                <span className="font-mono font-bold text-white">{statementEmp.cnss_number || 'غير مسجل'}</span>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[11px] text-slate-400 block">الراتب الأساسي المعتمد:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{statementEmp.base_salary.toLocaleString()} MAD</span>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[11px] text-slate-400 block">الديون السابقة العالقة:</span>
                <span className="font-mono font-bold text-rose-400 text-sm">{statementEmp.credit_ancien.toLocaleString()} MAD</span>
              </div>
            </div>

            {/* Bank details */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                <Building className="w-3.5 h-3.5 text-indigo-400" />
                <span>البنك المعتمد: <strong className="text-white">{statementEmp.bank_name || 'غير محدد'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                <span>رقم الحساب (RIB): <strong className="text-white font-mono">{statementEmp.rib_account || 'غير مسجل'}</strong></span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>هذا الإطار معتمد ومربوط مع منظومة arouaschools، ويتم تدقيق مدفوعاته آلياً مع الخزينة.</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStatementEmp(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
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
