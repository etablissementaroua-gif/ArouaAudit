export type ChargeType = 'fixe' | 'variable';
export type ExpensePaymentMethod = 'especes' | 'cheque' | 'virement' | 'prelevement';
export type ExpenseStatus = 'pending' | 'approved' | 'paid' | 'cancelled';

export interface ExpenseCategory {
  id: string;
  code: string;
  name_ar: string;
  name_fr: string;
  charge_type: ChargeType;
  budget_allocation: number;
  color_hex: string;
  is_active: boolean;
  spent_amount?: number;
  remaining_budget?: number;
  consumption_rate?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseItem {
  id: string;
  reference_no: string;
  category_id?: string;
  category_code: string;
  expense_date: string;
  amount: number;
  beneficiary_name: string;
  beneficiary_ice?: string;
  payment_method: ExpensePaymentMethod;
  payment_source: string;
  check_or_trans_ref?: string;
  invoice_reference?: string;
  status: ExpenseStatus;
  academic_year: string;
  authorized_by: string;
  description: string;
  receipt_attachment_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DisbursementVoucher {
  id: string;
  voucher_number: string;
  expense_id?: string;
  disbursement_date: string;
  amount: number;
  beneficiary: string;
  recipient_cin?: string;
  payment_mode: ExpensePaymentMethod;
  check_number?: string;
  bank_name?: string;
  treasury_source: string;
  disbursed_by: string;
  notes?: string;
  created_at?: string;
}

export interface ExpenseMonthlyStatItem {
  month_key: string;       // e.g. '2026-09'
  month_label: string;     // e.g. 'سبتمبر 2026'
  fixed_charges: number;
  variable_charges: number;
  total_charges: number;
  count: number;
}

export interface ExpenseBudgetSummary {
  total_annual_budget: number;
  total_spent: number;
  remaining_budget: number;
  consumption_rate: number;
  fixed_total: number;
  variable_total: number;
  caisse_spent: number;
  bank_spent: number;
  pending_approval: number;
}

export interface ExpenseFilterParams {
  category_code?: string;
  payment_method?: string;
  payment_source?: string;
  status?: string;
  search_query?: string;
  academic_year?: string;
}

export interface NewExpenseFormData {
  category_code: string;
  expense_date: string;
  amount: number;
  beneficiary_name: string;
  beneficiary_ice?: string;
  payment_method: ExpensePaymentMethod;
  payment_source: string;
  check_or_trans_ref?: string;
  invoice_reference?: string;
  status: ExpenseStatus;
  academic_year: string;
  authorized_by: string;
  description: string;
}

export interface NewCategoryFormData {
  code: string;
  name_ar: string;
  name_fr: string;
  charge_type: ChargeType;
  budget_allocation: number;
  color_hex: string;
}

export interface NewDisbursementFormData {
  expense_id?: string;
  disbursement_date: string;
  amount: number;
  beneficiary: string;
  recipient_cin?: string;
  payment_mode: ExpensePaymentMethod;
  check_number?: string;
  bank_name?: string;
  treasury_source: string;
  disbursed_by: string;
  notes?: string;
}
