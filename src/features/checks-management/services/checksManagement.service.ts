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
let localBankAccounts: BankAccount[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    account_name: 'الحساب الرئيسي للمؤسسة - التجاري وفا بنك',
    bank_name: 'Attijariwafa Bank',
    rib: '007780000123456789012345',
    account_number: '000123456789',
    agency: 'وكالة أكدال - الرباط',
    initial_balance: 250000.00,
    current_balance: 385400.00,
    is_active: true
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    account_name: 'حساب الرسوم والدراسة - البنك الشعبي',
    bank_name: 'Banque Populaire',
    rib: '101780000234567890123456',
    account_number: '000234567890',
    agency: 'وكالة حسان - الرباط',
    initial_balance: 150000.00,
    current_balance: 214800.00,
    is_active: true
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    account_name: 'حساب الاستثمار والتجهيز - بنك CIH',
    bank_name: 'CIH Bank',
    rib: '230780000345678901234567',
    account_number: '000345678901',
    agency: 'وكالة الرياض - الرباط',
    initial_balance: 80000.00,
    current_balance: 142000.00,
    is_active: true
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    account_name: 'حساب الخزينة والاحتياط - بنك أوف أفريقيا',
    bank_name: 'Bank of Africa',
    rib: '011780000456789012345678',
    account_number: '000456789012',
    agency: 'وكالة السويسي - الرباط',
    initial_balance: 50000.00,
    current_balance: 95500.00,
    is_active: true
  }
];

let localRemises: BankRemise[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    remise_number: 'REM-2026-001',
    bank_account_id: 'a0000000-0000-0000-0000-000000000001',
    bank_account_name: 'الحساب الرئيسي للمؤسسة - التجاري وفا بنك',
    bank_name: 'Attijariwafa Bank',
    remise_date: '2026-09-10',
    total_amount: 42500.00,
    checks_count: 3,
    status: 'cleared',
    created_by: 'المسير العام',
    notes: 'إيداع شيكات الدفعة الأولى - بداية الموسم'
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    remise_number: 'REM-2026-002',
    bank_account_id: 'a0000000-0000-0000-0000-000000000001',
    bank_account_name: 'الحساب الرئيسي للمؤسسة - التجاري وفا بنك',
    bank_name: 'Attijariwafa Bank',
    remise_date: '2026-09-22',
    total_amount: 28000.00,
    checks_count: 2,
    status: 'deposited',
    created_by: 'أمين الصندوق',
    notes: 'إيداع واجبات التمدرس لشهر سبتمبر'
  }
];

let localChecks: CheckItem[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    check_number: 'CHQ-892144',
    bank_name: 'Attijariwafa Bank',
    issuer_name: 'محمد المنصوري',
    student_id: 'STU-2026-001',
    student_name: 'ياسين المنصوري',
    beneficiary: 'Ets Aroua',
    amount: 15000.00,
    received_date: '2026-09-02',
    due_date: '2026-09-08',
    deposit_date: '2026-09-10',
    clearance_date: '2026-09-12',
    remise_id: 'b0000000-0000-0000-0000-000000000001',
    remise_number: 'REM-2026-001',
    status: 'encaisse',
    academic_year: '2026/2027'
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    check_number: 'CHQ-774321',
    bank_name: 'Banque Populaire',
    issuer_name: 'كريم العمراني',
    student_id: 'STU-2026-002',
    student_name: 'هبة العمراني',
    beneficiary: 'Ets Aroua',
    amount: 13500.00,
    received_date: '2026-09-03',
    due_date: '2026-09-09',
    deposit_date: '2026-09-10',
    clearance_date: '2026-09-13',
    remise_id: 'b0000000-0000-0000-0000-000000000001',
    remise_number: 'REM-2026-001',
    status: 'encaisse',
    academic_year: '2026/2027'
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    check_number: 'CHQ-991204',
    bank_name: 'CIH Bank',
    issuer_name: 'رشيد بلمقدم',
    student_id: 'STU-2026-003',
    student_name: 'سفيان بلمقدم',
    beneficiary: 'Ets Aroua',
    amount: 14000.00,
    received_date: '2026-09-05',
    due_date: '2026-09-10',
    deposit_date: '2026-09-10',
    clearance_date: '2026-09-14',
    remise_id: 'b0000000-0000-0000-0000-000000000001',
    remise_number: 'REM-2026-001',
    status: 'encaisse',
    academic_year: '2026/2027'
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    check_number: 'CHQ-331902',
    bank_name: 'Bank of Africa',
    issuer_name: 'سعاد الودغيري',
    student_id: 'STU-2026-004',
    student_name: 'مريم الودغيري',
    beneficiary: 'Ets Aroua',
    amount: 16000.00,
    received_date: '2026-09-12',
    due_date: '2026-09-20',
    deposit_date: '2026-09-22',
    clearance_date: null,
    remise_id: 'b0000000-0000-0000-0000-000000000002',
    remise_number: 'REM-2026-002',
    status: 'remis',
    academic_year: '2026/2027'
  },
  {
    id: 'c0000000-0000-0000-0000-000000000005',
    check_number: 'CHQ-445890',
    bank_name: 'Société Générale',
    issuer_name: 'أحمد التازي',
    student_id: 'STU-2026-005',
    student_name: 'حمزة التازي',
    beneficiary: 'Ets Aroua',
    amount: 12000.00,
    received_date: '2026-09-15',
    due_date: '2026-09-21',
    deposit_date: '2026-09-22',
    clearance_date: null,
    remise_id: 'b0000000-0000-0000-0000-000000000002',
    remise_number: 'REM-2026-002',
    status: 'remis',
    academic_year: '2026/2027'
  },
  {
    id: 'c0000000-0000-0000-0000-000000000006',
    check_number: 'CHQ-112345',
    bank_name: 'Attijariwafa Bank',
    issuer_name: 'عمر السبتي',
    student_id: 'STU-2026-006',
    student_name: 'أنس السبتي',
    beneficiary: 'Ets Aroua',
    amount: 18500.00,
    received_date: '2026-09-18',
    due_date: '2026-09-25',
    status: 'a_deposer',
    academic_year: '2026/2027'
  },
  {
    id: 'c0000000-0000-0000-0000-000000000007',
    check_number: 'CHQ-556789',
    bank_name: 'Banque Populaire',
    issuer_name: 'فاطمة الزهراء العلوي',
    student_id: 'STU-2026-007',
    student_name: 'سلمى العلوي',
    beneficiary: 'Ets Aroua',
    amount: 9500.00,
    received_date: '2026-09-20',
    due_date: '2026-09-27',
    status: 'a_deposer',
    academic_year: '2026/2027'
  },
  {
    id: 'c0000000-0000-0000-0000-000000000008',
    check_number: 'CHQ-667890',
    bank_name: 'CIH Bank',
    issuer_name: 'طارق الإدريسي',
    student_id: 'STU-2026-008',
    student_name: 'أيمن الإدريسي',
    beneficiary: 'Ets Aroua',
    amount: 11000.00,
    received_date: '2026-09-22',
    due_date: '2026-10-05',
    status: 'en_portefeuille',
    academic_year: '2026/2027'
  },
  {
    id: 'c0000000-0000-0000-0000-000000000009',
    check_number: 'CHQ-778901',
    bank_name: 'Bank of Africa',
    issuer_name: 'يوسف بنجلون',
    student_id: 'STU-2026-009',
    student_name: 'غيثة بنجلون',
    beneficiary: 'Ets Aroua',
    amount: 13000.00,
    received_date: '2026-09-24',
    due_date: '2026-10-15',
    status: 'en_portefeuille',
    academic_year: '2026/2027'
  },
  {
    id: 'c0000000-0000-0000-0000-000000000010',
    check_number: 'CHQ-889012',
    bank_name: 'Attijariwafa Bank',
    issuer_name: 'سميرة بناني',
    student_id: 'STU-2026-010',
    student_name: 'ريان بناني',
    beneficiary: 'Ets Aroua',
    amount: 8500.00,
    received_date: '2026-09-10',
    due_date: '2026-09-18',
    deposit_date: '2026-09-19',
    status: 'rejete',
    rejection_reason: 'انعدام المؤونة الكافية في الحساب (Défaut de provision)',
    academic_year: '2026/2027'
  },
  {
    id: 'c0000000-0000-0000-0000-000000000011',
    check_number: 'CHQ-990123',
    bank_name: 'BMCI',
    issuer_name: 'نور الدين الفاسي',
    student_id: 'STU-2026-011',
    student_name: 'عالية الفاسي',
    beneficiary: 'Ets Aroua',
    amount: 6000.00,
    received_date: '2026-09-08',
    due_date: '2026-09-15',
    status: 'restitue',
    rejection_reason: 'تم استبداله بأداء نقدي مباشر مع وصل',
    academic_year: '2026/2027'
  }
];

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
