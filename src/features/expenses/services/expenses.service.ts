import { supabase, isSupabaseConfigured, getFriendlySupabaseErrorMessage, isSupabaseNetworkOrDnsError } from '../../../shared/lib/supabaseClient';
import {
  ExpenseCategory,
  ExpenseItem,
  DisbursementVoucher,
  ExpenseMonthlyStatItem,
  ExpenseBudgetSummary,
  ExpenseFilterParams,
  NewExpenseFormData,
  NewCategoryFormData,
  NewDisbursementFormData,
} from '../models/expenses.types';

export const expensesService = {
  /**
   * جلب تصنيفات وأبواب النفقات مع احتساب المبالغ المستهلكة من الميزانية
   */
  async getCategories(academicYear = '2026/2027'): Promise<ExpenseCategory[]> {
    try {
      const { data: categories, error: catError } = await supabase
        .from('expense_categories')
        .select('*')
        .order('budget_allocation', { ascending: false });

      if (catError) throw catError;
      if (!categories || categories.length === 0) return [];

      // جلب النفقات لحساب الاستهلاك
      const { data: expenses, error: expError } = await supabase
        .from('expenses')
        .select('category_code, amount, status')
        .eq('academic_year', academicYear)
        .neq('status', 'cancelled');

      if (expError) console.warn('Could not fetch expenses for category breakdown', expError);

      const spentMap: Record<string, number> = {};
      (expenses || []).forEach((exp) => {
        const code = exp.category_code;
        spentMap[code] = (spentMap[code] || 0) + Number(exp.amount || 0);
      });

      return categories.map((cat) => {
        const spent = spentMap[cat.code] || 0;
        const budget = Number(cat.budget_allocation) || 0;
        const remaining = Math.max(0, budget - spent);
        const rate = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;

        return {
          ...cat,
          budget_allocation: budget,
          spent_amount: spent,
          remaining_budget: remaining,
          consumption_rate: Math.round(rate * 10) / 10,
        };
      });
    } catch (err) {
      console.error('Error fetching expense categories:', err);
      return [];
    }
  },

  /**
   * إضافة باب نفقة جديد
   */
  async addCategory(data: NewCategoryFormData): Promise<ExpenseCategory | null> {
    try {
      const { data: created, error } = await supabase
        .from('expense_categories')
        .insert({
          code: data.code.toUpperCase().trim(),
          name_ar: data.name_ar.trim(),
          name_fr: data.name_fr.trim(),
          charge_type: data.charge_type,
          budget_allocation: Number(data.budget_allocation) || 0,
          color_hex: data.color_hex || '#6366f1',
          is_active: true,
        })
        .select()
        .single();

      if (error) throw new Error(getFriendlySupabaseErrorMessage(error, 'فشلت عملية إضافة باب النفقة في قاعدة البيانات'));
      return created;
    } catch (err) {
      console.error('Error adding category:', err);
      throw new Error(getFriendlySupabaseErrorMessage(err, 'حدث خطأ أثناء إضافة باب النفقة'));
    }
  },

  /**
   * تحديث ميزانية أو بيانات باب النفقة
   */
  async updateCategory(id: string, updates: Partial<ExpenseCategory>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('expense_categories')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw new Error(getFriendlySupabaseErrorMessage(error, 'فشلت عملية إضافة باب النفقة في قاعدة البيانات'));
      return true;
    } catch (err) {
      console.error('Error updating category:', err);
      return false;
    }
  },

  /**
   * جلب النفقات والمصروفات مع التصفية
   */
  async getExpenses(filters?: ExpenseFilterParams): Promise<ExpenseItem[]> {
    try {
      let query = supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (filters?.academic_year) {
        query = query.eq('academic_year', filters.academic_year);
      }
      if (filters?.category_code && filters.category_code !== 'all') {
        query = query.eq('category_code', filters.category_code);
      }
      if (filters?.payment_method && filters.payment_method !== 'all') {
        query = query.eq('payment_method', filters.payment_method);
      }
      if (filters?.payment_source && filters.payment_source !== 'all') {
        query = query.eq('payment_source', filters.payment_source);
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw new Error(getFriendlySupabaseErrorMessage(error, 'فشلت عملية إضافة باب النفقة في قاعدة البيانات'));

      let results = data || [];

      if (filters?.search_query && filters.search_query.trim() !== '') {
        const q = filters.search_query.toLowerCase().trim();
        results = results.filter(
          (item) =>
            item.reference_no?.toLowerCase().includes(q) ||
            item.beneficiary_name?.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q) ||
            item.invoice_reference?.toLowerCase().includes(q)
        );
      }

      return results.map((item) => ({
        ...item,
        amount: Number(item.amount) || 0,
      }));
    } catch (err) {
      console.error('Error fetching expenses:', err);
      return [];
    }
  },

  /**
   * تسجيل نفقة جديدة مع توليد سند صرف تلقائي إذا كانت نقداً
   */
  async recordExpense(formData: NewExpenseFormData): Promise<ExpenseItem | null> {
    try {
      const year = new Date().getFullYear();
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const reference_no = `DEP-${year}-${randNum}`;

      const { data: createdExp, error: expError } = await supabase
        .from('expenses')
        .insert({
          reference_no,
          category_code: formData.category_code,
          expense_date: formData.expense_date,
          amount: Number(formData.amount),
          beneficiary_name: formData.beneficiary_name.trim(),
          beneficiary_ice: formData.beneficiary_ice || null,
          payment_method: formData.payment_method,
          payment_source: formData.payment_source,
          check_or_trans_ref: formData.check_or_trans_ref || null,
          invoice_reference: formData.invoice_reference || null,
          status: formData.status || 'paid',
          academic_year: formData.academic_year || '2026/2027',
          authorized_by: formData.authorized_by || 'الإدارة العامة',
          description: formData.description.trim(),
        })
        .select()
        .single();

      if (expError) throw expError;

      // إنشاء سند صرف تلقائي إذا تم الصرف نقداً
      if (formData.payment_method === 'especes' && createdExp) {
        const voucher_number = `DEC-${year}-${randNum}`;
        await supabase.from('expense_disbursements').insert({
          voucher_number,
          expense_id: createdExp.id,
          disbursement_date: formData.expense_date,
          amount: Number(formData.amount),
          beneficiary: formData.beneficiary_name.trim(),
          payment_mode: 'especes',
          treasury_source: formData.payment_source === 'caisse_centrale' ? 'الصندوق المركزي' : 'صندوق الاستقبال',
          disbursed_by: 'أمين الصندوق المركزي',
          notes: `سند صرف نقدي تلقائي للنفقة: ${formData.description.trim()}`,
        });
      }

      return createdExp;
    } catch (err) {
      console.error('Error recording expense:', err);
      throw new Error(getFriendlySupabaseErrorMessage(err, 'حدث خطأ أثناء إضافة باب النفقة'));
    }
  },

  /**
   * تحديث حالة النفقة (معتمدة، ملغاة، مدفوعة)
   */
  async updateExpenseStatus(id: string, status: ExpenseItem['status']): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw new Error(getFriendlySupabaseErrorMessage(error, 'فشلت عملية إضافة باب النفقة في قاعدة البيانات'));
      return true;
    } catch (err) {
      console.error('Error updating expense status:', err);
      return false;
    }
  },

  /**
   * جلب سجل سندات الصرف (Décaissements)
   */
  async getDisbursementsRegister(): Promise<DisbursementVoucher[]> {
    try {
      const { data, error } = await supabase
        .from('expense_disbursements')
        .select('*')
        .order('disbursement_date', { ascending: false });

      if (error) throw new Error(getFriendlySupabaseErrorMessage(error, 'فشلت عملية إضافة باب النفقة في قاعدة البيانات'));
      return (data || []).map((v) => ({
        ...v,
        amount: Number(v.amount) || 0,
      }));
    } catch (err) {
      console.error('Error fetching disbursements register:', err);
      return [];
    }
  },

  /**
   * إنشاء سند صرف جديد مباشرة
   */
  async generateDisbursementVoucher(data: NewDisbursementFormData): Promise<DisbursementVoucher | null> {
    try {
      const year = new Date().getFullYear();
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const voucher_number = `DEC-${year}-${randNum}`;

      const { data: created, error } = await supabase
        .from('expense_disbursements')
        .insert({
          voucher_number,
          expense_id: data.expense_id || null,
          disbursement_date: data.disbursement_date,
          amount: Number(data.amount),
          beneficiary: data.beneficiary.trim(),
          recipient_cin: data.recipient_cin?.trim() || null,
          payment_mode: data.payment_mode,
          check_number: data.check_number || null,
          bank_name: data.bank_name || null,
          treasury_source: data.treasury_source,
          disbursed_by: data.disbursed_by || 'أمين الصندوق',
          notes: data.notes?.trim() || null,
        })
        .select()
        .single();

      if (error) throw new Error(getFriendlySupabaseErrorMessage(error, 'فشلت عملية إضافة باب النفقة في قاعدة البيانات'));
      return created;
    } catch (err) {
      console.error('Error generating disbursement voucher:', err);
      throw new Error(getFriendlySupabaseErrorMessage(err, 'حدث خطأ أثناء إضافة باب النفقة'));
    }
  },

  /**
   * التحليل الإحصائي الشهري للنفقات (المصاريف الثابتة مقابل المتغيرة)
   */
  async getMonthlyExpenseStats(academicYear = '2026/2027'): Promise<ExpenseMonthlyStatItem[]> {
    try {
      const { data: categories } = await supabase.from('expense_categories').select('code, charge_type');
      const catTypeMap: Record<string, 'fixe' | 'variable'> = {};
      (categories || []).forEach((c) => {
        catTypeMap[c.code] = c.charge_type;
      });

      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('expense_date, amount, category_code')
        .eq('academic_year', academicYear)
        .neq('status', 'cancelled');

      if (error) throw new Error(getFriendlySupabaseErrorMessage(error, 'فشلت عملية إضافة باب النفقة في قاعدة البيانات'));

      const monthNames: Record<string, string> = {
        '09': 'سبتمبر',
        '10': 'أكتوبر',
        '11': 'نوفمبر',
        '12': 'ديسمبر',
        '01': 'يناير',
        '02': 'فبراير',
        '03': 'مارس',
        '04': 'أبريل',
        '05': 'مايو',
        '06': 'يونيو',
      };

      const monthlyMap: Record<string, { fixed: number; variable: number; count: number }> = {};

      (expenses || []).forEach((exp) => {
        const dateStr = exp.expense_date || '';
        const monthKey = dateStr.substring(0, 7); // '2026-09'
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { fixed: 0, variable: 0, count: 0 };
        }
        const amt = Number(exp.amount) || 0;
        const type = catTypeMap[exp.category_code] || 'variable';
        if (type === 'fixe') {
          monthlyMap[monthKey].fixed += amt;
        } else {
          monthlyMap[monthKey].variable += amt;
        }
        monthlyMap[monthKey].count += 1;
      });

      const sortedKeys = Object.keys(monthlyMap).sort();

      return sortedKeys.map((k) => {
        const mPart = k.split('-')[1] || '';
        const yPart = k.split('-')[0] || '';
        const label = `${monthNames[mPart] || mPart} ${yPart}`;
        const item = monthlyMap[k];
        return {
          month_key: k,
          month_label: label,
          fixed_charges: item.fixed,
          variable_charges: item.variable,
          total_charges: item.fixed + item.variable,
          count: item.count,
        };
      });
    } catch (err) {
      console.error('Error getting monthly stats:', err);
      return [];
    }
  },

  /**
   * احتساب ملخص الميزانية التراكمي ونسب التنفيذ
   */
  async getBudgetConsumptionOverview(academicYear = '2026/2027'): Promise<ExpenseBudgetSummary> {
    try {
      const categories = await this.getCategories(academicYear);
      const totalBudget = categories.reduce((sum, c) => sum + (c.budget_allocation || 0), 0);

      const expenses = await this.getExpenses({ academic_year: academicYear });
      const activeExpenses = expenses.filter((e) => e.status !== 'cancelled');

      const totalSpent = activeExpenses.reduce((sum, e) => sum + e.amount, 0);
      const caisseSpent = activeExpenses
        .filter((e) => e.payment_source.includes('caisse') || e.payment_method === 'especes')
        .reduce((sum, e) => sum + e.amount, 0);
      const bankSpent = totalSpent - caisseSpent;
      const pendingApproval = activeExpenses.filter((e) => e.status === 'pending').length;

      const fixedCats = new Set(categories.filter((c) => c.charge_type === 'fixe').map((c) => c.code));
      const fixedTotal = activeExpenses
        .filter((e) => fixedCats.has(e.category_code))
        .reduce((sum, e) => sum + e.amount, 0);
      const variableTotal = totalSpent - fixedTotal;

      const rate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      return {
        total_annual_budget: totalBudget,
        total_spent: totalSpent,
        remaining_budget: Math.max(0, totalBudget - totalSpent),
        consumption_rate: Math.round(rate * 10) / 10,
        fixed_total: fixedTotal,
        variable_total: variableTotal,
        caisse_spent: caisseSpent,
        bank_spent: bankSpent,
        pending_approval: pendingApproval,
      };
    } catch (err) {
      console.error('Error getting budget consumption overview:', err);
      return {
        total_annual_budget: 0,
        total_spent: 0,
        remaining_budget: 0,
        consumption_rate: 0,
        fixed_total: 0,
        variable_total: 0,
        caisse_spent: 0,
        bank_spent: 0,
        pending_approval: 0,
      };
    }
  },

  async resetAllBudgetAllocations(): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('expense_categories').update({ budget_allocation: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
        return true;
      } catch (err) {
        console.warn('Supabase resetAllBudgetAllocations error:', err);
      }
    }
    return true;
  },
};
