import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import { 
  StudentImpayeRecord, 
  StudentCreditBalance, 
  StudentDiscountExemption, 
  PaymentJournalRecord, 
  ImpayesStats, 
  ImpayeFilters, 
  RecoveryStatus, 
  CreateCreditBalanceDTO, 
  CreateDiscountDTO 
} from '../models/finance.types';

// Initial Mock Data (Offline / Fallback)
let localImpayes: StudentImpayeRecord[] = [];

let localCreditBalances: StudentCreditBalance[] = [];

let localDiscountsExemptions: StudentDiscountExemption[] = [];

let localPaymentsJournal: PaymentJournalRecord[] = [];

export const financeOperationsService = {
  // 1. المتأخرات والديون (Impayés)
  async getImpayesList(filters?: ImpayeFilters): Promise<StudentImpayeRecord[]> {
    let list: StudentImpayeRecord[] = [];

    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('student_impayes').select('*');
        if (filters?.service_type && filters.service_type !== 'all') {
          query = query.eq('service_type', filters.service_type);
        }
        if (filters?.aging_category && filters.aging_category !== 'all') {
          query = query.eq('aging_category', filters.aging_category);
        }
        if (filters?.recovery_status && filters.recovery_status !== 'all') {
          query = query.eq('recovery_status', filters.recovery_status);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          list = data.map((d: any) => ({
            ...d,
            amount_due: Number(d.amount_due || 0)
          }));
        }
      } catch (err) {
        console.warn('Fallback to local impayes:', err);
      }
    }

    if (list.length === 0) {
      list = [...localImpayes];
    }

    // Local filtering & Sorting
    if (filters) {
      if (filters.service_type && filters.service_type !== 'all') {
        list = list.filter(i => i.service_type === filters.service_type);
      }
      if (filters.aging_category && filters.aging_category !== 'all') {
        list = list.filter(i => i.aging_category === filters.aging_category);
      }
      if (filters.recovery_status && filters.recovery_status !== 'all') {
        list = list.filter(i => i.recovery_status === filters.recovery_status);
      }
      if (filters.search) {
        const s = filters.search.toLowerCase();
        list = list.filter(i => 
          i.student_name.toLowerCase().includes(s) ||
          i.student_id.toLowerCase().includes(s) ||
          (i.classroom_group && i.classroom_group.toLowerCase().includes(s))
        );
      }
      if (filters.sort_by === 'amount_desc') {
        list.sort((a, b) => b.amount_due - a.amount_due);
      } else if (filters.sort_by === 'amount_asc') {
        list.sort((a, b) => a.amount_due - b.amount_due);
      } else if (filters.sort_by === 'name_asc') {
        list.sort((a, b) => a.student_name.localeCompare(b.student_name));
      }
    }

    return list;
  },

  getImpayesSummaryStats(impayes: StudentImpayeRecord[]): ImpayesStats {
    const stats: ImpayesStats = {
      totalDueAmount: 0,
      debtorsCount: impayes.length,
      scolariteDueAmount: 0,
      transportDueAmount: 0,
      cantineDueAmount: 0,
      overdue90DaysAmount: 0,
      overdue90DaysCount: 0
    };

    impayes.forEach(i => {
      const amt = Number(i.amount_due || 0);
      stats.totalDueAmount += amt;

      if (i.service_type === 'scolarite' || i.service_type === 'all') {
        stats.scolariteDueAmount += amt;
      }
      if (i.service_type === 'transport') {
        stats.transportDueAmount += amt;
      }
      if (i.service_type === 'cantine') {
        stats.cantineDueAmount += amt;
      }
      if (i.aging_category === '90_plus') {
        stats.overdue90DaysAmount += amt;
        stats.overdue90DaysCount++;
      }
    });

    return stats;
  },

  async updateImpayeRecoveryStatus(
    id: string, 
    status: RecoveryStatus, 
    notes?: string, 
    promiseDate?: string
  ): Promise<boolean> {
    const payload: any = {
      recovery_status: status,
      updated_at: new Date().toISOString()
    };
    if (notes !== undefined) payload.notes = notes;
    if (promiseDate !== undefined) payload.promise_date = promiseDate;

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('student_impayes').update(payload).eq('id', id);
      } catch (err) {
        console.warn('Error updating impaye in Supabase:', err);
      }
    }

    const item = localImpayes.find(i => i.id === id);
    if (item) {
      item.recovery_status = status;
      if (notes !== undefined) item.notes = notes;
      if (promiseDate !== undefined) item.promise_date = promiseDate;
    }
    return true;
  },

  async logReminderSent(id: string): Promise<number> {
    const item = localImpayes.find(i => i.id === id);
    const newCount = (item?.reminder_count || 0) + 1;
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('student_impayes').update({
          reminder_count: newCount,
          last_reminder_sent_at: now
        }).eq('id', id);
      } catch (err) {
        console.warn('Error logging reminder in Supabase:', err);
      }
    }

    if (item) {
      item.reminder_count = newCount;
      item.last_reminder_sent_at = now;
    }
    return newCount;
  },

  // 2. الأرصدة الزائدة (Credit Balances)
  async getCreditBalances(): Promise<StudentCreditBalance[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('student_credit_balances')
          .select('*')
          .order('credit_amount', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            ...d,
            credit_amount: Number(d.credit_amount || 0)
          }));
        }
      } catch (err) {
        console.warn('Fallback to local credit balances:', err);
      }
    }
    return [...localCreditBalances];
  },

  async recordCreditBalance(dto: CreateCreditBalanceDTO): Promise<StudentCreditBalance> {
    const record: StudentCreditBalance = {
      id: `d${Date.now()}`,
      student_id: dto.student_id,
      student_name: dto.student_name,
      academic_level: dto.academic_level,
      credit_amount: Number(dto.credit_amount),
      source_payment_reference: dto.source_payment_reference || 'MANUAL-ENTRY',
      academic_year: '2026/2027',
      status: 'available',
      notes: dto.notes || 'رصيد دائن زائد مسجل',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('student_credit_balances')
          .insert([record])
          .select()
          .single();
        if (!error && data) return { ...data, credit_amount: Number(data.credit_amount) };
      } catch (err) {
        console.warn('Error creating credit balance in Supabase:', err);
      }
    }

    localCreditBalances.unshift(record);
    return record;
  },

  async carryOverCredit(id: string, notes?: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('student_credit_balances')
          .update({ status: 'carried_over', notes, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (err) {
        console.warn('Error updating credit balance in Supabase:', err);
      }
    }
    const item = localCreditBalances.find(b => b.id === id);
    if (item) {
      item.status = 'carried_over';
      if (notes) item.notes = notes;
    }
    return true;
  },

  async refundCredit(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('student_credit_balances')
          .update({ status: 'refunded', updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (err) {
        console.warn('Error refunding credit balance in Supabase:', err);
      }
    }
    const item = localCreditBalances.find(b => b.id === id);
    if (item) item.status = 'refunded';
    return true;
  },

  // 3. التخفيضات والإعفاءات (Discounts & Exemptions)
  async getDiscountsAndExemptions(group?: 'discounts' | 'exemptions'): Promise<StudentDiscountExemption[]> {
    let list: StudentDiscountExemption[] = [];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('student_discounts_exemptions')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          list = data.map((d: any) => ({
            ...d,
            rate_or_amount: Number(d.rate_or_amount || 0)
          }));
        }
      } catch (err) {
        console.warn('Fallback to local discounts:', err);
      }
    }

    if (list.length === 0) {
      list = [...localDiscountsExemptions];
    }

    if (group === 'discounts') {
      return list.filter(d => d.type === 'reduction_mensuelle' || d.type === 'reduction_annuelle');
    } else if (group === 'exemptions') {
      return list.filter(d => d.type === 'gratuite_totale' || d.type === 'gratuite_partielle');
    }
    return list;
  },

  async addDiscountExemption(dto: CreateDiscountDTO): Promise<StudentDiscountExemption> {
    const item: StudentDiscountExemption = {
      id: `e${Date.now()}`,
      student_id: dto.student_id,
      student_name: dto.student_name,
      academic_level: dto.academic_level,
      type: dto.type,
      service_type: dto.service_type,
      rate_or_amount: Number(dto.rate_or_amount),
      is_percentage: dto.is_percentage,
      beneficiary_relation: dto.beneficiary_relation || 'تخفيض معتمد',
      approved_by: dto.approved_by || 'الإدارة العامة',
      academic_year: '2026/2027',
      is_active: true,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('student_discounts_exemptions')
          .insert([item])
          .select()
          .single();
        if (!error && data) return { ...data, rate_or_amount: Number(data.rate_or_amount) };
      } catch (err) {
        console.warn('Error adding discount in Supabase:', err);
      }
    }

    localDiscountsExemptions.unshift(item);
    return item;
  },

  async toggleDiscountStatus(id: string, isActive: boolean): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('student_discounts_exemptions')
          .update({ is_active: isActive })
          .eq('id', id);
      } catch (err) {
        console.warn('Error toggling discount in Supabase:', err);
      }
    }
    const d = localDiscountsExemptions.find(x => x.id === id);
    if (d) d.is_active = isActive;
    return true;
  },

  // 4. يومية التسديدات (Payments Journal)
  async getPaymentsJournal(search?: string): Promise<PaymentJournalRecord[]> {
    let list: PaymentJournalRecord[] = [];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('student_payments_journal')
          .select('*')
          .order('payment_date', { ascending: false });

        if (!error && data && data.length > 0) {
          list = data.map((d: any) => ({
            ...d,
            amount_paid: Number(d.amount_paid || 0)
          }));
        }
      } catch (err) {
        console.warn('Fallback to local payments journal:', err);
      }
    }

    if (list.length === 0) {
      list = [...localPaymentsJournal];
    }

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p => 
        p.receipt_number.toLowerCase().includes(s) ||
        p.student_name.toLowerCase().includes(s) ||
        p.student_id.toLowerCase().includes(s)
      );
    }

    return list;
  }
};
