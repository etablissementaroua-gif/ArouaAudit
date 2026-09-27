import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import { StaffPayrollSlip, PayrollSummary } from '../models/payrollModels';

const demoPayroll: StaffPayrollSlip[] = [
  {
    id: 'pay-01',
    staff_id: 'ENS-012',
    staff_name: 'أستاذ(ة) الرياضيات: رشيد العلمي',
    role: 'Enseignant Maths',
    month_year: '2026-09',
    base_salary: 7500.00,
    primes: 600.00,
    deductions: 200.00,
    avances_deduites: 1000.00,
    net_payable: 6900.00,
    status: 'valide',
    dettes_restantes: 0.00,
    created_at: new Date().toISOString()
  },
  {
    id: 'pay-02',
    staff_id: 'ADM-004',
    staff_name: 'سائق حافلة النقل: حميد الناصري',
    role: 'Chauffeur Transport',
    month_year: '2026-09',
    base_salary: 4200.00,
    primes: 300.00,
    deductions: 0.00,
    avances_deduites: 500.00,
    net_payable: 4000.00,
    status: 'paye',
    dettes_restantes: 0.00,
    created_at: new Date().toISOString()
  },
  {
    id: 'pay-03',
    staff_id: 'ENS-007',
    staff_name: 'أستاذ(ة) اللغة الفرنسية (مغادر): كريمة بناني',
    role: 'Ex-Enseignante (Départ)',
    month_year: '2026-08',
    base_salary: 0.00,
    primes: 0.00,
    deductions: 0.00,
    avances_deduites: 0.00,
    net_payable: 0.00,
    status: 'brouillon',
    dettes_restantes: 2400.00,
    created_at: new Date().toISOString()
  }
];

export const payrollService = {
  async getPayrollSlips(): Promise<StaffPayrollSlip[]> {
    if (!isSupabaseConfigured()) return demoPayroll;
    try {
      const { data, error } = await supabase.from('staff_payroll').select('*').order('created_at', { ascending: false });
      if (error || !data || data.length === 0) return demoPayroll;
      return data as StaffPayrollSlip[];
    } catch {
      return demoPayroll;
    }
  },

  calculateSummary(slips: StaffPayrollSlip[]): PayrollSummary {
    let totalSalariesNet = 0;
    let totalAvances = 0;
    let totalDepartedDebts = 0;

    for (const s of slips) {
      totalSalariesNet += s.net_payable;
      totalAvances += s.avances_deduites;
      totalDepartedDebts += s.dettes_restantes;
    }

    return {
      totalSalariesNet,
      totalAvances,
      totalDepartedDebts,
      slipsCount: slips.length
    };
  }
};
