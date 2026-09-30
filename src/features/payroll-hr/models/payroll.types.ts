// ── Merged from payrollModels.ts (legacy) ──────────────────────────────────
import { StaffPayrollSlip, PayrollStatus } from '../../../shared/types';
export type { StaffPayrollSlip, PayrollStatus };

export interface PayrollSummary {
  totalSalariesNet: number;
  totalAvances: number;
  totalDepartedDebts: number;
  slipsCount: number;
}
// ────────────────────────────────────────────────────────────────────────────
export interface Employee {
  id: string;
  external_staff_id: string; // UID from arouaschools
  full_name: string;
  cin?: string;
  cnss_number?: string;
  phone?: string;
  email?: string;
  role: 'teacher' | 'admin' | 'driver' | 'assistant' | string;
  department: 'Pedagogique' | 'Transport' | 'Administration' | 'Services' | string;
  subjects: string[];
  assigned_classes: string[];
  base_salary: number;
  credit_ancien: number; // ديون سابقة عالقة
  bank_name?: string;
  rib_account?: string;
  employment_status: 'active' | 'departed' | 'suspended';
  source_platform: string;
  created_at?: string;
  updated_at?: string;
}

export interface StaffAdvance {
  id: string;
  employee_id: string;
  amount: number;
  advance_date: string;
  payment_method: 'espece' | 'cheque' | 'virement';
  check_number?: string;
  academic_year: string;
  month_reference: string; // Format: 'YYYY-MM' (e.g., '2026-09')
  is_settled: boolean;
  notes?: string;
  created_at?: string;
  employee?: Employee;
}

export interface MonthlyPayrollSlip {
  id: string;
  employee_id: string;
  academic_year: string;
  month: string; // 'YYYY-MM'
  base_salary: number;
  advances_deducted: number;
  credit_deducted: number;
  net_paid: number;
  payment_status: 'pending' | 'paid' | 'cancelled';
  paid_at?: string;
  payment_reference?: string;
  created_at?: string;
  employee?: Employee;
}

export interface StaffSyncResult {
  totalSynced: number;
  newAdded: number;
  updated: number;
  timestamp: string;
  details: string;
}

export interface StaffFilter {
  department?: string;
  role?: string;
  status?: string;
  searchQuery?: string;
}
