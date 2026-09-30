import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import { caisseService } from '../../treasury-caisse/services/caisseService';
import { 
  Employee, 
  StaffAdvance, 
  MonthlyPayrollSlip, 
  StaffFilter 
} from '../models/payroll.types';
import { arouaSchoolsExternalStaffRegistry } from './staffSync.service';

const initialEmployees: Employee[] = arouaSchoolsExternalStaffRegistry.map((item, index) => ({
  id: 'emp-uuid-' + (index + 1),
  external_staff_id: item.external_staff_id || 'STF-00' + (index + 1),
  full_name: item.full_name || '',
  cin: item.cin,
  cnss_number: item.cnss_number,
  phone: item.phone,
  email: item.email,
  role: item.role || 'teacher',
  department: item.department || 'Pedagogique',
  subjects: item.subjects || [],
  assigned_classes: item.assigned_classes || [],
  base_salary: item.base_salary || 0,
  credit_ancien: item.credit_ancien || 0,
  bank_name: item.bank_name,
  rib_account: item.rib_account,
  employment_status: item.employment_status || 'active',
  source_platform: 'arouaschools',
  created_at: new Date().toISOString()
}));

export const payrollService = {
  // 1. Fetch Employees
  async getEmployees(filter?: StaffFilter): Promise<Employee[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('employees').select('*').order('created_at', { ascending: true });
        if (filter?.status) query = query.eq('employment_status', filter.status);
        if (filter?.role) query = query.eq('role', filter.role);
        if (filter?.department) query = query.eq('department', filter.department);

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as Employee[];
        }
      } catch (err) {
        console.warn('Supabase fetch employees fallback:', err);
      }
    }

    const local = localStorage.getItem('aroua_staff_employees');
    let list: Employee[] = local ? JSON.parse(local) : initialEmployees;

    if (filter?.status) list = list.filter(e => e.employment_status === filter.status);
    if (filter?.role) list = list.filter(e => e.role === filter.role);
    if (filter?.department) list = list.filter(e => e.department === filter.department);
    if (filter?.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      list = list.filter(e => 
        e.full_name.toLowerCase().includes(q) ||
        (e.cin && e.cin.toLowerCase().includes(q)) ||
        e.external_staff_id.toLowerCase().includes(q)
      );
    }
    return list;
  },

  // 2. Update Employee Financials
  async updateEmployeeFinancials(
    id: string, 
    base_salary: number, 
    credit_ancien: number, 
    status?: 'active' | 'departed' | 'suspended'
  ): Promise<boolean> {
    const updatePayload: any = { 
      base_salary: Number(base_salary) || 0, 
      credit_ancien: Number(credit_ancien) || 0,
      updated_at: new Date().toISOString()
    };
    if (status) updatePayload.employment_status = status;

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('employees').update(updatePayload).eq('id', id);
      } catch (err) {
        console.warn('Supabase update employee error:', err);
      }
    }

    const employees = await this.getEmployees();
    const updated = employees.map(e => e.id === id ? { ...e, ...updatePayload } : e);
    localStorage.setItem('aroua_staff_employees', JSON.stringify(updated));
    return true;
  },

  // 3. Record Staff Advance (Avance sur salaire)
  async recordAdvance(advanceData: {
    employee_id: string;
    amount: number;
    advance_date: string;
    payment_method: 'espece' | 'cheque' | 'virement';
    check_number?: string;
    academic_year?: string;
    month_reference: string;
    notes?: string;
  }): Promise<StaffAdvance> {
    const newAdvance: StaffAdvance = {
      id: 'adv-' + Date.now(),
      employee_id: advanceData.employee_id,
      amount: Number(advanceData.amount) || 0,
      advance_date: advanceData.advance_date || new Date().toISOString().split('T')[0],
      payment_method: advanceData.payment_method || 'espece',
      check_number: advanceData.check_number,
      academic_year: advanceData.academic_year || '2026/2027',
      month_reference: advanceData.month_reference || '2026-09',
      is_settled: false,
      notes: advanceData.notes,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        // في Supabase، ينطلق Trigger الخصم من الصندوق trg_staff_advance_caisse تلقائياً
        const { data, error } = await supabase.from('staff_advances').insert([newAdvance]).select().single();
        if (!error && data) {
          return data as StaffAdvance;
        }
      } catch (err) {
        console.warn('Supabase advance insert fallback:', err);
      }
    }

    // حفظ محلي + خصم فوري من الخزينة عبر caisseService
    const local = localStorage.getItem('aroua_staff_advances');
    const advances: StaffAdvance[] = local ? JSON.parse(local) : [];
    advances.push(newAdvance);
    localStorage.setItem('aroua_staff_advances', JSON.stringify(advances));

    // خصم الصندوق المحلي
    try {
      await caisseService.addTransaction({
        transaction_date: newAdvance.advance_date,
        type: 'decaissement',
        amount: newAdvance.amount,
        payment_method: newAdvance.payment_method === 'espece' ? 'especes' : newAdvance.payment_method,
        category: 'payroll_advances',
        description: `تسبيق على الراتب (Avance) - ${advanceData.month_reference}`,
        reference_number: newAdvance.id
      });
    } catch (caisseErr) {
      console.warn('Caisse advance deduction notice:', caisseErr);
    }

    return newAdvance;
  },

  // 4. Fetch Advances
  async getStaffAdvances(monthReference?: string, employeeId?: string): Promise<StaffAdvance[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('staff_advances').select('*, employees(*)');
        if (monthReference) query = query.eq('month_reference', monthReference);
        if (employeeId) query = query.eq('employee_id', employeeId);

        const { data, error } = await query;
        if (!error && data) return data as StaffAdvance[];
      } catch (err) {
        console.warn('Supabase fetch advances fallback:', err);
      }
    }

    const local = localStorage.getItem('aroua_staff_advances');
    let list: StaffAdvance[] = local ? JSON.parse(local) : [
      {
        id: 'adv-seed-01',
        employee_id: 'emp-uuid-7',
        amount: 1000,
        advance_date: '2026-09-12',
        payment_method: 'espece',
        academic_year: '2026/2027',
        month_reference: '2026-09',
        is_settled: false,
        notes: 'تسبيق استثنائي على راتب شهر شتنبر',
        created_at: '2026-09-12T10:00:00Z'
      }
    ];
    if (monthReference) list = list.filter(a => a.month_reference === monthReference);
    if (employeeId) list = list.filter(a => a.employee_id === employeeId);
    return list;
  },

  // 5. Calculate Monthly Payroll Slips
  async calculateMonthlyPayroll(month: string = '2026-09', academicYear: string = '2026/2027'): Promise<MonthlyPayrollSlip[]> {
    const employees = await this.getEmployees();
    const advances = await this.getStaffAdvances(month);

    // Fetch existing paid records if any
    let paidMap = new Map<string, MonthlyPayrollSlip>();
    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('monthly_payroll').select('*').eq('month', month);
        if (data) data.forEach((slip: any) => paidMap.set(slip.employee_id, slip));
      } catch (err) {
        console.warn('Supabase check paid slips notice:', err);
      }
    }

    const localPaid = localStorage.getItem(`aroua_payroll_${month}`);
    if (localPaid) {
      const parsed: MonthlyPayrollSlip[] = JSON.parse(localPaid);
      parsed.forEach(s => paidMap.set(s.employee_id, s));
    }

    return employees
      .filter(e => e.employment_status === 'active')
      .map(emp => {
        const existingSlip = paidMap.get(emp.id);
        if (existingSlip) {
          return { ...existingSlip, employee: emp };
        }

        // حساب مجموع تسبيقات الشهر
        const empAdvances = advances
          .filter(a => a.employee_id === emp.id && !a.is_settled)
          .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

        // اقتطاع ديون قديمة (مثال: اقتطاع تدريجي 10% أو 500 درهم كحد أقصى)
        const creditDeduction = emp.credit_ancien > 0 ? Math.min(emp.credit_ancien, 500) : 0;

        const base = Number(emp.base_salary) || 0;
        const net = Math.max(0, base - empAdvances - creditDeduction);

        return {
          id: `slip-${emp.id}-${month}`,
          employee_id: emp.id,
          academic_year: academicYear,
          month,
          base_salary: base,
          advances_deducted: empAdvances,
          credit_deducted: creditDeduction,
          net_paid: net,
          payment_status: 'pending',
          employee: emp
        };
      });
  },

  // 6. Bulk Disburse Payroll
  async disbursePayroll(slips: MonthlyPayrollSlip[]): Promise<boolean> {
    const paidSlips = slips.map(s => ({
      ...s,
      payment_status: 'paid' as const,
      paid_at: new Date().toISOString(),
      payment_reference: 'VIR-PAY-' + Date.now().toString().slice(-6)
    }));

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('monthly_payroll').upsert(paidSlips);
        // تسوية التسبيقات لشهر الصرف
        const empIds = slips.map(s => s.employee_id);
        await supabase
          .from('staff_advances')
          .update({ is_settled: true })
          .in('employee_id', empIds)
          .eq('month_reference', slips[0]?.month || '2026-09');
      } catch (err) {
        console.warn('Supabase disburse payroll error:', err);
      }
    }

    const month = slips[0]?.month || '2026-09';
    localStorage.setItem(`aroua_payroll_${month}`, JSON.stringify(paidSlips));

    // خصم الكتلة الأجرية الإجمالية من الصندوق
    const totalNet = paidSlips.reduce((sum, s) => sum + s.net_paid, 0);
    try {
      await caisseService.addTransaction({
        transaction_date: new Date().toISOString().split('T')[0],
        type: 'decaissement',
        amount: totalNet,
        payment_method: 'virement',
        category: 'payroll',
        description: `صرف الأجور الشهرية - كتلة رواتب شهر ${month}`,
        reference_number: 'PAY-BULK'
      });
    } catch (caisseErr) {
      console.warn('Caisse payroll mass deduction notice:', caisseErr);
    }

    return true;
  },

  // 7. Single Disburse
  async disburseSinglePayroll(slip: MonthlyPayrollSlip): Promise<boolean> {
    const updatedSlip: MonthlyPayrollSlip = {
      ...slip,
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
      payment_reference: 'VIR-PAY-' + Date.now().toString().slice(-6)
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('monthly_payroll').upsert([updatedSlip]);
        await supabase
          .from('staff_advances')
          .update({ is_settled: true })
          .eq('employee_id', slip.employee_id)
          .eq('month_reference', slip.month);
      } catch (err) {
        console.warn('Supabase disburse single error:', err);
      }
    }

    const currentSlips = await this.calculateMonthlyPayroll(slip.month);
    const updatedList = currentSlips.map(s => s.id === slip.id ? updatedSlip : s);
    localStorage.setItem(`aroua_payroll_${slip.month}`, JSON.stringify(updatedList));

    // إضافة حركة الصندوق
    try {
      await caisseService.addTransaction({
        transaction_date: new Date().toISOString().split('T')[0],
        type: 'decaissement',
        amount: slip.net_paid,
        payment_method: 'virement',
        category: 'payroll',
        description: `صرف راتب شهري: ${slip.employee?.full_name || 'موظف'} - شهر ${slip.month}`,
      });
    } catch (err) {
      console.warn('Caisse single payroll notice:', err);
    }

    return true;
  },

  // 8. Departed Staff Debts
  async getDepartedEmployeesWithDebts(): Promise<Employee[]> {
    const employees = await this.getEmployees();
    return employees.filter(e => e.employment_status === 'departed' && e.credit_ancien > 0);
  },

  // 9. Record Debt Repayment
  async recordDebtRepayment(employeeId: string, amount: number, notes?: string): Promise<boolean> {
    const employees = await this.getEmployees();
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return false;

    const newDebt = Math.max(0, emp.credit_ancien - (Number(amount) || 0));
    await this.updateEmployeeFinancials(employeeId, emp.base_salary, newDebt);

    // إضافة مدخول إلى الصندوق (استرجاع ديون)
    try {
      await caisseService.addTransaction({
        transaction_date: new Date().toISOString().split('T')[0],
        type: 'encaissement',
        amount: Number(amount),
        payment_method: 'especes',
        category: 'debt_recovery',
        description: `استرداد مديونية سابقة من موظف مغادر: ${emp.full_name}`,
        reference_number: 'REC-DEBT'
      });
    } catch (err) {
      console.warn('Caisse debt recovery encaissement notice:', err);
    }

    return true;
  }
};
