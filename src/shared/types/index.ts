export type PaymentMethod = 'especes' | 'cheque' | 'virement' | 'carte';

export type TransactionType = 'encaissement' | 'decaissement';

export type CheckStatus = 'en_attente' | 'encaisse' | 'rejete' | 'annule';

export type PayrollStatus = 'brouillon' | 'valide' | 'paye';

export type SyncStatus = 'synced' | 'pending' | 'conflict' | 'failed';

export interface CaisseTransaction {
  id: string;
  transaction_date: string;
  type: TransactionType;
  amount: number;
  payment_method: PaymentMethod;
  category: string;
  reference_number?: string;
  description: string;
  solde_apres?: number;
  author_id?: string;
  author_name?: string;
  created_at: string;
}

export interface CheckRecord {
  id: string;
  check_number: string;
  bank_name: string;
  drawer_name: string;
  beneficiary_name: string;
  amount: number;
  emission_date: string;
  due_date: string;
  status: CheckStatus;
  rejection_reason?: string;
  scanned_copy_url?: string;
  created_at: string;
}

export interface StaffPayrollSlip {
  id: string;
  staff_id: string;
  staff_name: string;
  role: string;
  month_year: string;
  base_salary: number;
  primes: number;
  deductions: number;
  avances_deduites: number;
  net_payable: number;
  status: PayrollStatus;
  dettes_restantes: number;
  created_at: string;
}

export interface ExternalSyncMapping {
  id: string;
  entity_type: 'student' | 'staff' | 'fee_schedule' | 'transaction';
  local_id: string;
  external_source_id: string;
  sync_status: SyncStatus;
  last_synced_at: string;
  payload_hash?: string;
}
