import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import { CaisseTransaction, CreateTransactionDTO, CaisseSummary } from '../models/caisseModels';

const initialDemoData: CaisseTransaction[] = [
  {
    id: 'trx-001',
    transaction_date: '2026-09-27',
    type: 'encaissement',
    amount: 18500.00,
    payment_method: 'virement',
    category: 'رسوم دراسية (T1)',
    reference_number: 'VIR-26-0901',
    description: 'سداد الرسوم المدرسية للفصل الأول - المستوى التأهيلي',
    solde_apres: 18500.00,
    author_name: 'المحاسب المالي',
    created_at: new Date().toISOString()
  },
  {
    id: 'trx-002',
    transaction_date: '2026-09-27',
    type: 'encaissement',
    amount: 4200.00,
    payment_method: 'especes',
    category: 'النقل والمطعم',
    reference_number: 'REC-26-003',
    description: 'اشتراكات النقل والإطعام المدرسي',
    solde_apres: 22700.00,
    author_name: 'أمين الصندوق',
    created_at: new Date().toISOString()
  },
  {
    id: 'trx-003',
    transaction_date: '2026-09-26',
    type: 'decaissement',
    amount: 3150.00,
    payment_method: 'especes',
    category: 'الصيانة والمستلزمات',
    reference_number: 'DEP-26-012',
    description: 'فواتير الصيانة الدورية وتزويد الحافلات بالوقود',
    solde_apres: 19550.00,
    author_name: 'أمين الصندوق',
    created_at: new Date().toISOString()
  }
];

export const caisseService = {
  async getTransactions(): Promise<CaisseTransaction[]> {
    if (!isSupabaseConfigured()) {
      return initialDemoData;
    }
    try {
      const { data, error } = await supabase
        .from('caisse_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });
      if (error || !data || data.length === 0) return initialDemoData;
      return data as CaisseTransaction[];
    } catch {
      return initialDemoData;
    }
  },

  async addTransaction(dto: CreateTransactionDTO): Promise<CaisseTransaction> {
    const item: CaisseTransaction = {
      id: 'trx-' + Date.now(),
      ...dto,
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('caisse_transactions').insert([dto]).select().single();
        if (!error && data) return data as CaisseTransaction;
      } catch (e) {
        console.warn('Fallback local save:', e);
      }
    }
    return item;
  },

  calculateSummary(transactions: CaisseTransaction[]): CaisseSummary {
    let totalEncaissement = 0;
    let totalDecaissement = 0;
    let cashInHand = 0;
    for (const t of transactions) {
      if (t.type === 'encaissement') {
        totalEncaissement += t.amount;
        if (t.payment_method === 'especes') cashInHand += t.amount;
      } else {
        totalDecaissement += t.amount;
        if (t.payment_method === 'especes') cashInHand -= t.amount;
      }
    }
    return {
      totalEncaissement,
      totalDecaissement,
      currentBalance: totalEncaissement - totalDecaissement,
      cashInHand,
      transactionsCount: transactions.length
    };
  }
};
