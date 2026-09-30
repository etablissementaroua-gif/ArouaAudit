// ArouaAudit — Caisse Treasury Service (Production Clean)
import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import { CaisseTransaction, PaymentMethod, TransactionType } from '../../../shared/types';
export type { CaisseTransaction, PaymentMethod, TransactionType };

export interface CaisseBalance {
  opening_balance: number;
  total_encaissements: number;
  total_decaissements: number;
  closing_balance: number;
}

export interface CaisseSummary {
  totalEncaissement: number;
  totalDecaissement: number;
  currentBalance: number;
  cashInHand: number;
  transactionsCount: number;
}

export const caisseService = {
  async getTransactions(filters?: {
    type?: TransactionType;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<CaisseTransaction[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      let query = supabase
        .from('caisse_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (filters?.type) query = query.eq("type", filters.type);
      if (filters?.startDate) query = query.gte("transaction_date", filters.startDate);
      if (filters?.endDate) query = query.lte("transaction_date", filters.endDate);
      if (filters?.search) {
        const s = filters.search;
        query = query.or("description.ilike.%" + s + "%,reference_number.ilike.%" + s + "%");
      }
      const { data, error } = await query.limit(200);
      if (error) { console.warn('[caisseService] getTransactions:', error.message); return []; }
      return (data as CaisseTransaction[]) ?? [];
    } catch { return []; }
  },

  calculateSummary(transactions: CaisseTransaction[]): CaisseSummary {
    const enc = transactions.filter(t => t.type === "encaissement");
    const dec = transactions.filter(t => t.type === "decaissement");
    const totalEncaissement = enc.reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalDecaissement = dec.reduce((s, t) => s + Number(t.amount || 0), 0);
    const cashInHand = enc
      .filter(t => t.payment_method === "especes")
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    return {
      totalEncaissement,
      totalDecaissement,
      currentBalance: totalEncaissement - totalDecaissement,
      cashInHand,
      transactionsCount: transactions.length,
    };
  },

  async getBalance(date?: string): Promise<CaisseBalance> {
    const all = await this.getTransactions();
    const filtered = date ? all.filter(t => t.transaction_date <= date) : all;
    const totalIn  = filtered.filter(t => t.type === "encaissement").reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalOut = filtered.filter(t => t.type === "decaissement").reduce((s, t) => s + Number(t.amount || 0), 0);
    return { opening_balance: 0, total_encaissements: totalIn, total_decaissements: totalOut, closing_balance: totalIn - totalOut };
  },

  async addTransaction(payload: Omit<CaisseTransaction, "id" | "created_at">): Promise<CaisseTransaction | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await supabase
        .from('caisse_transactions')
        .insert([{ ...payload, created_at: new Date().toISOString() }])
        .select().single();
      if (error || !data) { console.warn('[caisseService] addTransaction:', error?.message); return null; }
      return data as CaisseTransaction;
    } catch { return null; }
  },

  async getDailyJournal(date: string): Promise<{
    transactions: CaisseTransaction[]; totalIn: number; totalOut: number; net: number;
  }> {
    const txns = await this.getTransactions({ startDate: date, endDate: date });
    const totalIn  = txns.filter(t => t.type === "encaissement").reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalOut = txns.filter(t => t.type === "decaissement").reduce((s, t) => s + Number(t.amount || 0), 0);
    return { transactions: txns, totalIn, totalOut, net: totalIn - totalOut };
  }
};