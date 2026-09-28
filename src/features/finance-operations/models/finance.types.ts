export type ServiceType = 'scolarite' | 'transport' | 'cantine' | 'all';
export type AgingCategory = 'current' | '30_days' | '60_days' | '90_plus';
export type RecoveryStatus = 'unpaid' | 'contacted' | 'promised' | 'litigation' | 'settled';

export interface StudentImpayeRecord {
  id: string;
  student_id: string;
  student_name: string;
  academic_level: string;
  classroom_group?: string;
  guardian_phone?: string;
  guardian_whatsapp?: string;
  service_type: ServiceType;
  amount_due: number;
  due_month: string;
  aging_category: AgingCategory;
  recovery_status: RecoveryStatus;
  promise_date?: string | null;
  last_reminder_sent_at?: string | null;
  reminder_count: number;
  academic_year: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StudentCreditBalance {
  id: string;
  student_id: string;
  student_name: string;
  academic_level: string;
  credit_amount: number;
  source_payment_reference?: string;
  academic_year: string;
  status: 'available' | 'carried_over' | 'refunded';
  notes?: string;
  created_at?: string;
}

export interface StudentDiscountExemption {
  id: string;
  student_id: string;
  student_name: string;
  academic_level: string;
  type: 'reduction_mensuelle' | 'reduction_annuelle' | 'gratuite_totale' | 'gratuite_partielle';
  service_type: ServiceType;
  rate_or_amount: number;
  is_percentage: boolean;
  beneficiary_relation?: string;
  approved_by: string;
  academic_year: string;
  is_active: boolean;
  created_at?: string;
}

export interface PaymentJournalRecord {
  id: string;
  receipt_number: string;
  student_id: string;
  student_name: string;
  academic_level: string;
  payment_date: string;
  amount_paid: number;
  payment_method: 'especes' | 'cheque' | 'virement';
  service_breakdown: {
    scolarite: number;
    transport: number;
    cantine: number;
    frais_inscription?: number;
  };
  cashier_agent: string;
  check_or_bank_ref?: string;
  period_month?: string;
  academic_year: string;
  notes?: string;
  created_at?: string;
}

export interface ImpayesStats {
  totalDueAmount: number;
  debtorsCount: number;
  scolariteDueAmount: number;
  transportDueAmount: number;
  cantineDueAmount: number;
  overdue90DaysAmount: number;
  overdue90DaysCount: number;
}

export interface ImpayeFilters {
  search?: string;
  service_type?: 'all' | ServiceType;
  aging_category?: 'all' | AgingCategory;
  recovery_status?: 'all' | RecoveryStatus;
  academic_level?: string;
  sort_by?: 'amount_desc' | 'amount_asc' | 'name_asc';
}

export interface CreateCreditBalanceDTO {
  student_id: string;
  student_name: string;
  academic_level: string;
  credit_amount: number;
  source_payment_reference?: string;
  notes?: string;
}

export interface CreateDiscountDTO {
  student_id: string;
  student_name: string;
  academic_level: string;
  type: 'reduction_mensuelle' | 'reduction_annuelle' | 'gratuite_totale' | 'gratuite_partielle';
  service_type: ServiceType;
  rate_or_amount: number;
  is_percentage: boolean;
  beneficiary_relation?: string;
  approved_by?: string;
}
