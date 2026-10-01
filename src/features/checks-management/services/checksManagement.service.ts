import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import { 
  BankAccount, 
  CreateBankAccountDTO, 
  BankRemise, 
  CreateRemiseDTO, 
  CheckItem, 
  CreateCheckDTO, 
  CheckFilterOptions, 
  CheckPortfolioStats,
  CheckStatus,
  ReceiptRecord,
  BankReconciliationItem
} from '../models/check.types';

// Mock Initial Data
let localBankAccounts: BankAccount[] = [];

let localRemises: BankRemise[] = [];

let localChecks: CheckItem[] = [];

export const checksManagementService = {
  // 1. الحسابات البنكية (Bank Accounts)
  async getBankAccounts(): Promise<BankAccount[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('bank_accounts')
          .select('*')
          .order('current_balance', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((acc: any) => ({
            ...acc,
            initial_balance: Number(acc.initial_balance || 0),
            current_balance: Number(acc.current_balance || 0)
          }));
        }
      } catch (err) {
        console.warn('Fallback to local bank accounts:', err);
      }
    }
    return [...localBankAccounts];
  },

  async createBankAccount(payload: CreateBankAccountDTO): Promise<BankAccount> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('bank_accounts')
          .insert([payload])
          .select()
          .single();

        if (!error && data) {
          return {
            ...data,
            initial_balance: Number(data.initial_balance || 0),
            current_balance: Number(data.current_balance || 0)
          };
        }
      } catch (err) {
        console.warn('Error inserting bank account in Supabase:', err);
      }
    }

    const newAcc: BankAccount = {
      ...payload,
      id: `a${Date.now()}`,
      current_balance: payload.current_balance || payload.initial_balance || 0,
      created_at: new Date().toISOString()
    };
    localBankAccounts.push(newAcc);
    return newAcc;
  },

  async toggleAccountStatus(id: string, is_active: boolean): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('bank_accounts')
          .update({ is_active, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (err) {
        console.warn('Error updating bank account status:', err);
      }
    }
    const acc = localBankAccounts.find(a => a.id === id);
    if (acc) acc.is_active = is_active;
    return true;
  },

  // 2. محفظة الشيكات (Checks Portfolio)
  async getChecksList(filters?: CheckFilterOptions): Promise<CheckItem[]> {
    let list: CheckItem[] = [];

    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('checks_portfolio')
          .select('*, bank_remises(remise_number)')
          .order('due_date', { ascending: true });

        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        if (filters?.bank_name) {
          query = query.eq('bank_name', filters.bank_name);
        }
        if (filters?.academic_year) {
          query = query.eq('academic_year', filters.academic_year);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          list = data.map((item: any) => ({
            ...item,
            amount: Number(item.amount || 0),
            remise_number: item.bank_remises?.remise_number || null
          }));
        }
      } catch (err) {
        console.warn('Fallback to local checks:', err);
      }
    }

    if (list.length === 0) {
      list = [...localChecks];
    }

    // فلترة محلية إضافية للبحث وتواريخ الاستحقاق
    if (filters) {
      if (filters.status && filters.status !== 'all') {
        list = list.filter(c => c.status === filters.status);
      }
      if (filters.bank_name) {
        list = list.filter(c => c.bank_name.toLowerCase().includes(filters.bank_name!.toLowerCase()));
      }
      if (filters.search) {
        const s = filters.search.toLowerCase();
        list = list.filter(c => 
          c.check_number.toLowerCase().includes(s) ||
          c.issuer_name.toLowerCase().includes(s) ||
          (c.student_name && c.student_name.toLowerCase().includes(s)) ||
          (c.student_id && c.student_id.toLowerCase().includes(s))
        );
      }
      if (filters.due_range && filters.due_range !== 'all') {
        const today = new Date().toISOString().split('T')[0];
        if (filters.due_range === 'overdue') {
          list = list.filter(c => c.due_date < today && c.status !== 'encaisse' && c.status !== 'restitue');
        } else if (filters.due_range === 'today') {
          list = list.filter(c => c.due_date === today);
        } else if (filters.due_range === 'this_week') {
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          const nextWeekStr = nextWeek.toISOString().split('T')[0];
          list = list.filter(c => c.due_date >= today && c.due_date <= nextWeekStr);
        } else if (filters.due_range === 'this_month') {
          const currentMonth = today.slice(0, 7);
          list = list.filter(c => c.due_date.startsWith(currentMonth));
        }
      }
    }

    return list;
  },

  getCheckStats(checks: CheckItem[]): CheckPortfolioStats {
    const stats: CheckPortfolioStats = {
      totalCount: checks.length,
      totalAmount: 0,
      inVaultCount: 0,
      inVaultAmount: 0,
      toDepositCount: 0,
      toDepositAmount: 0,
      depositedCount: 0,
      depositedAmount: 0,
      clearedCount: 0,
      clearedAmount: 0,
      rejectedCount: 0,
      rejectedAmount: 0
    };

    checks.forEach(c => {
      const amt = Number(c.amount || 0);
      stats.totalAmount += amt;

      switch (c.status) {
        case 'en_portefeuille':
          stats.inVaultCount++;
          stats.inVaultAmount += amt;
          break;
        case 'a_deposer':
          stats.toDepositCount++;
          stats.toDepositAmount += amt;
          break;
        case 'remis':
          stats.depositedCount++;
          stats.depositedAmount += amt;
          break;
        case 'encaisse':
          stats.clearedCount++;
          stats.clearedAmount += amt;
          break;
        case 'rejete':
          stats.rejectedCount++;
          stats.rejectedAmount += amt;
          break;
      }
    });

    return stats;
  },

  async registerCheck(payload: CreateCheckDTO): Promise<CheckItem> {
    const checkRecord: CheckItem = {
      id: `c${Date.now()}`,
      check_number: payload.check_number,
      bank_name: payload.bank_name,
      issuer_name: payload.issuer_name,
      student_id: payload.student_id || null,
      beneficiary: payload.beneficiary || 'Ets Aroua',
      amount: Number(payload.amount),
      received_date: payload.received_date || new Date().toISOString().split('T')[0],
      due_date: payload.due_date,
      status: payload.status || 'en_portefeuille',
      academic_year: payload.academic_year || '2026/2027',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('checks_portfolio')
          .insert([{
            check_number: checkRecord.check_number,
            bank_name: checkRecord.bank_name,
            issuer_name: checkRecord.issuer_name,
            student_id: checkRecord.student_id,
            beneficiary: checkRecord.beneficiary,
            amount: checkRecord.amount,
            received_date: checkRecord.received_date,
            due_date: checkRecord.due_date,
            status: checkRecord.status,
            academic_year: checkRecord.academic_year
          }])
          .select()
          .single();

        if (!error && data) {
          return {
            ...data,
            amount: Number(data.amount)
          };
        }
      } catch (err) {
        console.warn('Error inserting check in Supabase:', err);
      }
    }

    localChecks.unshift(checkRecord);
    return checkRecord;
  },

  async updateCheckStatus(
    checkId: string, 
    newStatus: CheckStatus, 
    extra?: { 
      clearance_date?: string; 
      rejection_reason?: string; 
      deposit_date?: string; 
      remise_id?: string;
    }
  ): Promise<boolean> {
    const updatePayload: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };
    if (extra?.clearance_date !== undefined) updatePayload.clearance_date = extra.clearance_date;
    if (extra?.rejection_reason !== undefined) updatePayload.rejection_reason = extra.rejection_reason;
    if (extra?.deposit_date !== undefined) updatePayload.deposit_date = extra.deposit_date;
    if (extra?.remise_id !== undefined) updatePayload.remise_id = extra.remise_id;

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('checks_portfolio')
          .update(updatePayload)
          .eq('id', checkId);
      } catch (err) {
        console.warn('Error updating check status in Supabase:', err);
      }
    }

    const item = localChecks.find(c => c.id === checkId);
    if (item) {
      item.status = newStatus;
      if (extra?.clearance_date !== undefined) item.clearance_date = extra.clearance_date;
      if (extra?.rejection_reason !== undefined) item.rejection_reason = extra.rejection_reason;
      if (extra?.deposit_date !== undefined) item.deposit_date = extra.deposit_date;
      if (extra?.remise_id !== undefined) item.remise_id = extra.remise_id;
    }
    return true;
  },

  // 3. الشيكات قيد الإيداع وحوافظ التسليم (Remises)
  async getChecksToDeposit(): Promise<CheckItem[]> {
    const all = await this.getChecksList();
    const today = new Date().toISOString().split('T')[0];
    return all.filter(c => (c.status === 'a_deposer' || (c.status === 'en_portefeuille' && c.due_date <= today)));
  },

  async createBankRemise(payload: CreateRemiseDTO): Promise<BankRemise> {
    const today = payload.remise_date || new Date().toISOString().split('T')[0];
    const checks = await this.getChecksList();
    const selectedChecks = checks.filter(c => payload.check_ids.includes(c.id));
    const totalAmount = selectedChecks.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const checksCount = selectedChecks.length;
    const remiseNum = `REM-${new Date().getFullYear()}-${String(localRemises.length + 1).padStart(3, '0')}`;

    const account = localBankAccounts.find(a => a.id === payload.bank_account_id);

    const remiseRecord: BankRemise = {
      id: `b${Date.now()}`,
      remise_number: remiseNum,
      bank_account_id: payload.bank_account_id,
      bank_account_name: account?.account_name || 'حساب المؤسسة',
      bank_name: account?.bank_name || 'البنك',
      remise_date: today,
      total_amount: totalAmount,
      checks_count: checksCount,
      status: 'deposited',
      created_by: payload.created_by || 'أمين الصندوق',
      notes: payload.notes || 'حافظة تسليم شيكات بنكية',
      created_at: new Date().toISOString(),
      checks: selectedChecks
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('bank_remises')
          .insert([{
            remise_number: remiseNum,
            bank_account_id: payload.bank_account_id,
            remise_date: today,
            total_amount: totalAmount,
            checks_count: checksCount,
            status: 'deposited',
            created_by: remiseRecord.created_by,
            notes: remiseRecord.notes
          }])
          .select()
          .single();

        if (!error && data) {
          remiseRecord.id = data.id;
          // تحديث الشيكات في Supabase
          await supabase
            .from('checks_portfolio')
            .update({
              remise_id: data.id,
              status: 'remis',
              deposit_date: today
            })
            .in('id', payload.check_ids);
        }
      } catch (err) {
        console.warn('Error saving remise to Supabase:', err);
      }
    }

    // تحديث الشيكات محلياً
    localChecks.forEach(c => {
      if (payload.check_ids.includes(c.id)) {
        c.remise_id = remiseRecord.id;
        c.remise_number = remiseNum;
        c.status = 'remis';
        c.deposit_date = today;
      }
    });

    localRemises.unshift(remiseRecord);
    return remiseRecord;
  },

  async getBankRemisesList(): Promise<BankRemise[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('bank_remises')
          .select('*, bank_accounts(account_name, bank_name, rib)')
          .order('remise_date', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((r: any) => ({
            ...r,
            total_amount: Number(r.total_amount || 0),
            bank_account_name: r.bank_accounts?.account_name || 'حساب المؤسسة',
            bank_name: r.bank_accounts?.bank_name || 'البنك'
          }));
        }
      } catch (err) {
        console.warn('Fallback to local remises:', err);
      }
    }
    return [...localRemises];
  },

  // 4. سجل الوصولات وسندات الصندوق (Receipts Registry)
  async getReceiptsRegistry(): Promise<ReceiptRecord[]> {
    return [
      {
        id: 'rec-001',
        receipt_number: 'REC-2026-0891',
        date: '2026-09-25',
        amount: 3500.00,
        payer_name: 'أحمد التازي (ولي أمر التلميذ حمزة التازي)',
        payment_method: 'especes',
        purpose: 'واجبات التمدرس والإطعام - شهر شتنبر',
        student_id: 'STU-2026-005',
        reference: 'ESP-99812',
        academic_year: '2026/2027'
      },
      {
        id: 'rec-002',
        receipt_number: 'REC-2026-0892',
        date: '2026-09-24',
        amount: 15000.00,
        payer_name: 'محمد المنصوري (ولي أمر التلميذ ياسين المنصوري)',
        payment_method: 'cheque',
        purpose: 'واجبات التمدرس للثلاثي الأول',
        student_id: 'STU-2026-001',
        reference: 'CHQ-892144',
        academic_year: '2026/2027'
      },
      {
        id: 'rec-003',
        receipt_number: 'REC-2026-0893',
        date: '2026-09-23',
        amount: 2800.00,
        payer_name: 'سعاد الودغيري',
        payment_method: 'virement',
        purpose: 'رسوم النقل المدرسي والتسجيل السنوي',
        student_id: 'STU-2026-004',
        reference: 'VIR-BNK-4412',
        academic_year: '2026/2027'
      },
      {
        id: 'rec-004',
        receipt_number: 'REC-2026-0894',
        date: '2026-09-22',
        amount: 4200.00,
        payer_name: 'فاطمة الزهراء العلوي',
        payment_method: 'especes',
        purpose: 'تمدرس شهر أكتوبر وتأمين مدرسي',
        student_id: 'STU-2026-007',
        reference: 'ESP-11094',
        academic_year: '2026/2027'
      }
    ];
  },

  // 5. المطابقة البنكية (Bank Reconciliation)
  async getBankReconciliationSummary(): Promise<{
    items: BankReconciliationItem[];
    bankBalance: number;
    bookBalance: number;
    pendingChecksAmount: number;
    difference: number;
  }> {
    const accounts = await this.getBankAccounts();
    const bankBalance = accounts.reduce((sum, a) => sum + a.current_balance, 0);
    const checks = await this.getChecksList();
    const pendingChecks = checks.filter(c => c.status === 'remis');
    const pendingChecksAmount = pendingChecks.reduce((sum, c) => sum + c.amount, 0);
    const bookBalance = bankBalance - pendingChecksAmount;

    const items: BankReconciliationItem[] = [
      {
        id: 'rec-item-1',
        date: '2026-09-22',
        type: 'check_cleared',
        reference: 'CHQ-892144',
        description: 'صرف شيك التمدرس - محمد المنصوري',
        debit: 0,
        credit: 15000.00,
        bank_balance: 385400.00,
        book_balance: 385400.00,
        difference: 0,
        is_matched: true
      },
      {
        id: 'rec-item-2',
        date: '2026-09-20',
        type: 'caisse_deposit',
        reference: 'REM-2026-001',
        description: 'إيداع نقدي حصيلة الصندوق - أمين الصندوق',
        debit: 0,
        credit: 42500.00,
        bank_balance: 370400.00,
        book_balance: 370400.00,
        difference: 0,
        is_matched: true
      },
      {
        id: 'rec-item-3',
        date: '2026-09-22',
        type: 'check_cleared',
        reference: 'CHQ-331902',
        description: 'شيك قيد المقاصة في الحافظة REM-2026-002',
        debit: 0,
        credit: 16000.00,
        bank_balance: 385400.00,
        book_balance: 369400.00,
        difference: 16000.00,
        is_matched: false
      }
    ];

    return {
      items,
      bankBalance,
      bookBalance,
      pendingChecksAmount,
      difference: pendingChecksAmount
    };
  }
};
