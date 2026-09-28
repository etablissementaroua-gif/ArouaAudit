import { CheckRecord, CheckStatus as LegacyCheckStatus } from '../../../shared/types';

export type CheckStatus = 
  | 'en_portefeuille' 
  | 'a_deposer' 
  | 'remis' 
  | 'encaisse' 
  | 'rejete' 
  | 'restitue';

export type RemiseStatus = 'draft' | 'deposited' | 'cleared' | 'rejected';

export interface BankAccount {
  id: string;
  account_name: string;
  bank_name: string;
  rib: string;
  account_number?: string;
  agency?: string;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type CreateBankAccountDTO = Omit<BankAccount, 'id' | 'created_at' | 'updated_at'>;

export interface BankRemise {
  id: string;
  remise_number: string;
  bank_account_id?: string;
  bank_account_name?: string;
  bank_name?: string;
  remise_date: string;
  total_amount: number;
  checks_count: number;
  status: RemiseStatus;
  created_by?: string;
  notes?: string;
  created_at?: string;
  checks?: CheckItem[];
}

export interface CreateRemiseDTO {
  bank_account_id: string;
  check_ids: string[];
  remise_date?: string;
  notes?: string;
  created_by?: string;
}

export interface CheckItem {
  id: string;
  check_number: string;
  bank_name: string;
  issuer_name: string;
  student_id?: string | null;
  student_name?: string | null;
  beneficiary: string;
  amount: number;
  received_date: string;
  due_date: string;
  deposit_date?: string | null;
  clearance_date?: string | null;
  remise_id?: string | null;
  remise_number?: string | null;
  status: CheckStatus;
  rejection_reason?: string | null;
  check_image_url?: string | null;
  academic_year: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCheckDTO {
  check_number: string;
  bank_name: string;
  issuer_name: string;
  student_id?: string;
  beneficiary?: string;
  amount: number;
  received_date?: string;
  due_date: string;
  academic_year?: string;
  status?: CheckStatus;
}

export interface CheckFilterOptions {
  search?: string;
  status?: CheckStatus | 'all';
  bank_name?: string;
  due_range?: 'all' | 'overdue' | 'today' | 'this_week' | 'this_month';
  academic_year?: string;
}

export interface CheckPortfolioStats {
  totalCount: number;
  totalAmount: number;
  inVaultCount: number;
  inVaultAmount: number;
  toDepositCount: number;
  toDepositAmount: number;
  depositedCount: number;
  depositedAmount: number;
  clearedCount: number;
  clearedAmount: number;
  rejectedCount: number;
  rejectedAmount: number;
}

export interface ReceiptRecord {
  id: string;
  receipt_number: string;
  date: string;
  amount: number;
  payer_name: string;
  payment_method: 'especes' | 'cheque' | 'virement';
  purpose: string;
  student_id?: string;
  reference?: string;
  academic_year: string;
}

export interface BankReconciliationItem {
  id: string;
  date: string;
  type: 'check_cleared' | 'caisse_deposit' | 'direct_transfer';
  reference: string;
  description: string;
  debit: number;
  credit: number;
  bank_balance: number;
  book_balance: number;
  difference: number;
  is_matched: boolean;
}

// التوافق التراجعي
export type { CheckRecord, LegacyCheckStatus };
export interface CheckSummary {
  totalPending: number;
  totalEncaisse: number;
  totalRejete: number;
  overdueCount: number;
  totalCount: number;
}
