import { CaisseTransaction, PaymentMethod, TransactionType } from '../../../shared/types';

export type { CaisseTransaction, PaymentMethod, TransactionType };

export interface CaisseSummary {
  totalEncaissement: number;
  totalDecaissement: number;
  currentBalance: number;
  cashInHand: number;
  transactionsCount: number;
}

export interface CreateTransactionDTO {
  type: TransactionType;
  amount: number;
  payment_method: PaymentMethod;
  category: string;
  reference_number?: string;
  description: string;
  transaction_date: string;
}
