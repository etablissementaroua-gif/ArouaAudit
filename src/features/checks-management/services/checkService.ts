import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import { CheckRecord, CheckSummary } from '../models/checkModels';
import { isDateOverdue } from '../../../shared/lib/dateUtils';

const demoChecks: CheckRecord[] = [
  {
    id: 'chk-01',
    check_number: 'CHK-892144',
    bank_name: 'Attijariwafa Bank',
    drawer_name: 'ولي أمر التلميذ: محمد المنصوري',
    beneficiary_name: 'Établissement Aroua',
    amount: 6500.00,
    emission_date: '2026-09-10',
    due_date: '2026-09-30',
    status: 'en_attente',
    created_at: new Date().toISOString()
  },
  {
    id: 'chk-02',
    check_number: 'CHK-331902',
    bank_name: 'Banque Populaire',
    drawer_name: 'شركة التوريدات التعليمية',
    beneficiary_name: 'Établissement Aroua',
    amount: 12400.00,
    emission_date: '2026-09-01',
    due_date: '2026-09-25',
    status: 'encaisse',
    created_at: new Date().toISOString()
  },
  {
    id: 'chk-03',
    check_number: 'CHK-774011',
    bank_name: 'CIH Bank',
    drawer_name: 'ولي أمر التلميذة: سلمى العلمي',
    beneficiary_name: 'Établissement Aroua',
    amount: 4800.00,
    emission_date: '2026-08-20',
    due_date: '2026-09-20',
    status: 'rejete',
    rejection_reason: 'عدم كفاية الرصيد (Défaut de provision)',
    created_at: new Date().toISOString()
  }
];

export const checkService = {
  async getChecks(): Promise<CheckRecord[]> {
    if (!isSupabaseConfigured()) return demoChecks;
    try {
      const { data, error } = await supabase.from('checks_portfolio').select('*').order('due_date', { ascending: true });
      if (error || !data || data.length === 0) return demoChecks;
      return data as CheckRecord[];
    } catch {
      return demoChecks;
    }
  },

  calculateSummary(checks: CheckRecord[]): CheckSummary {
    let totalPending = 0;
    let totalEncaisse = 0;
    let totalRejete = 0;
    let overdueCount = 0;

    for (const c of checks) {
      if (c.status === 'en_attente') {
        totalPending += c.amount;
        if (isDateOverdue(c.due_date)) overdueCount++;
      } else if (c.status === 'encaisse') {
        totalEncaisse += c.amount;
      } else if (c.status === 'rejete') {
        totalRejete += c.amount;
      }
    }

    return {
      totalPending,
      totalEncaisse,
      totalRejete,
      overdueCount,
      totalCount: checks.length
    };
  }
};
