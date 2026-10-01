import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import { caisseService } from '../../treasury-caisse/services/caisseService';
import { systemSettingsService } from '../../system-settings/services/systemSettings.service';
import { enrollmentService } from '../../student-enrollment/services/enrollmentService';
import { 
  MonthlyTheoreticalCA, 
  AnnualCASummary, 
  RecetteDailyRecord, 
  CaisseAlimentation, 
  RevenueComparison, 
  DailyCalendarRecette 
} from '../models/revenue.types';

// Fallback seed data for theoretical monthly CA
const seedTheoreticalCA: MonthlyTheoreticalCA[] = [];

const seedAlimentations: CaisseAlimentation[] = [];

export const revenueAnalyticsService = {
  // 1. Monthly Theoretical CA by level
  async getMonthlyTheoreticalCA(academicYear: string = '2026/2027'): Promise<MonthlyTheoreticalCA[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.rpc('calculate_monthly_theoretical_ca', { p_academic_year: academicYear });
        if (!error && data && data.length > 0) {
          return data.map((item: any) => ({
            academic_level: item.academic_level,
            level_name_ar: item.level_name_ar || item.academic_level,
            students_count: Number(item.students_count) || 0,
            tuition_subtotal: Number(item.tuition_subtotal) || 0,
            transport_subtotal: Number(item.transport_subtotal) || 0,
            canteen_subtotal: Number(item.canteen_subtotal) || 0,
            monthly_total: Number(item.monthly_total) || 0
          }));
        }
      } catch (err) {
        console.warn('RPC calculate_monthly_theoretical_ca fallback:', err);
      }
    }

    const local = localStorage.getItem('aroua_theoretical_ca_' + academicYear);
    return local ? JSON.parse(local) : [];
  },

  // 2. Annual CA Summary and Target Comparison
  async getAnnualEstimatedCA(academicYear: string = '2026/2027'): Promise<AnnualCASummary> {
    const monthlyList = await this.getMonthlyTheoreticalCA(academicYear);
    const years = await systemSettingsService.getAcademicYears();
    const currentYear = years.find(y => y.code === academicYear) || years[0];
    const targetCA = currentYear?.target_annual_ca || 4800000;

    const monthlyTuitionTotal = monthlyList.reduce((acc, c) => acc + c.tuition_subtotal, 0);
    const monthlyTransportTotal = monthlyList.reduce((acc, c) => acc + c.transport_subtotal, 0);
    const monthlyCanteenTotal = monthlyList.reduce((acc, c) => acc + c.canteen_subtotal, 0);
    const totalStudents = monthlyList.reduce((acc, c) => acc + c.students_count, 0);

    // Annual estimations: 10 months school year + registration + supplies
    const tuitionX10 = monthlyTuitionTotal * 10;
    const transportX10 = monthlyTransportTotal * 10;
    const canteenX10 = monthlyCanteenTotal * 10;
    const registrationFees = totalStudents * 1500;
    const suppliesFees = totalStudents * 950;

    const annualTheoretical = tuitionX10 + transportX10 + canteenX10 + registrationFees + suppliesFees;

    // Actual collected from caisse_transactions
    const transactions = await caisseService.getTransactions();
    const actualCollected = transactions
      .filter(t => t.type === 'encaissement')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const achievementRate = targetCA > 0 ? Math.round((actualCollected / targetCA) * 100) : 0;
    const reliquatTotal = Math.max(0, annualTheoretical - actualCollected);

    return {
      academic_year: academicYear,
      target_annual_ca: targetCA,
      monthly_tuition_x10: tuitionX10,
      monthly_transport_x10: transportX10,
      monthly_canteen_x10: canteenX10,
      total_registration_fees: registrationFees,
      total_supplies_fees: suppliesFees,
      annual_theoretical_ca: annualTheoretical,
      actual_collected_ca: actualCollected,
      achievement_rate: achievementRate,
      reliquat_total: reliquatTotal
    };
  },

  // 3. Daily Recettes filtered by agent or admin
  async getDailyRecettes(date: string = new Date().toISOString().split('T')[0], filterBy: 'all' | 'agent' | 'admin' = 'all'): Promise<RecetteDailyRecord[]> {
    const transactions = await caisseService.getTransactions();
    
    // Filter encaissements matching date
    let records: RecetteDailyRecord[] = transactions
      .filter(t => t.type === 'encaissement' && (!date || t.transaction_date === date))
      .map(t => {
        const isAgent = t.payment_method === 'especes' || (t.author_name && t.author_name.includes('أمين'));
        return {
          id: t.id,
          transaction_date: t.transaction_date,
          amount: Number(t.amount) || 0,
          payment_method: t.payment_method,
          category: t.category,
          reference_number: t.reference_number,
          description: t.description,
          author_name: t.author_name || (isAgent ? 'وكيل الصندوق (Régisseur)' : 'إدارة الحسابات'),
          receipt_type: isAgent ? 'agent' : 'admin',
          created_at: t.created_at
        };
      });

    if (filterBy === 'agent') {
      records = records.filter(r => r.receipt_type === 'agent' || r.payment_method === 'especes');
    } else if (filterBy === 'admin') {
      records = records.filter(r => r.receipt_type === 'admin' || r.payment_method !== 'especes');
    }

    return records;
  },

  // 4. Caisse Alimentations List
  async getAlimentationsList(academicYear: string = '2026/2027'): Promise<CaisseAlimentation[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('caisse_alimentations')
          .select('*')
          .eq('academic_year', academicYear)
          .order('alimentation_date', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as CaisseAlimentation[];
        }
      } catch (err) {
        console.warn('Supabase alimentations fetch fallback:', err);
      }
    }

    const local = localStorage.getItem('aroua_alimentations_' + academicYear);
    return local ? JSON.parse(local) : [];
  },

  // 5. Record New Alimentation
  async recordAlimentation(payload: Omit<CaisseAlimentation, 'id' | 'created_at'>): Promise<CaisseAlimentation> {
    const newAlim: CaisseAlimentation = {
      id: 'alim-' + Date.now(),
      alimentation_date: payload.alimentation_date || new Date().toISOString().split('T')[0],
      amount: Number(payload.amount) || 0,
      source: payload.source || 'apport_personnel',
      destination_account: payload.destination_account || 'caisse_centrale',
      agent_name: payload.agent_name || 'المسير العام',
      motif: payload.motif || 'تغذية سيولة الصندوق',
      receipt_reference: payload.receipt_reference || 'ALIM-' + Date.now().toString().slice(-4),
      academic_year: payload.academic_year || '2026/2027',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        // In Supabase, trigger trg_alimentation_caisse inserts into caisse_transactions automatically
        const { data, error } = await supabase.from('caisse_alimentations').insert([newAlim]).select().single();
        if (!error && data) return data as CaisseAlimentation;
      } catch (err) {
        console.warn('Supabase record alimentation error:', err);
      }
    }

    // Local storage fallback
    const list = await this.getAlimentationsList(newAlim.academic_year);
    const updated = [newAlim, ...list];
    localStorage.setItem('aroua_alimentations_' + newAlim.academic_year, JSON.stringify(updated));

    // Register caisse inflow
    try {
      await caisseService.addTransaction({
        transaction_date: newAlim.alimentation_date,
        type: 'encaissement',
        amount: newAlim.amount,
        payment_method: 'especes',
        category: 'alimentation',
        reference_number: newAlim.receipt_reference,
        description: 'تغذية الصندوق: ' + newAlim.motif
      });
    } catch (err) {
      console.warn('Local caisse alimentation notice:', err);
    }

    return newAlim;
  },

  // 6. Monthly Recettes Calendar
  async getMonthlyRecettesCalendar(yearMonth: string = '2026-09'): Promise<DailyCalendarRecette[]> {
    const transactions = await caisseService.getTransactions();
    const encaissements = transactions.filter(t => t.type === 'encaissement' && t.transaction_date.startsWith(yearMonth));

    // Generate days 1..30
    const [year, month] = yearMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const calendar: DailyCalendarRecette[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${yearMonth}-${String(d).padStart(2, '0')}`;
      const dayTrx = encaissements.filter(t => t.transaction_date === dateStr);

      let especes = 0;
      let cheque = 0;
      let virement = 0;

      dayTrx.forEach(t => {
        const amt = Number(t.amount) || 0;
        if (t.payment_method === 'especes') especes += amt;
        else if (t.payment_method === 'cheque') cheque += amt;
        else virement += amt;
      });

      const total = especes + cheque + virement;
      calendar.push({
        date: dateStr,
        day_number: d,
        total_amount: total,
        transactions_count: dayTrx.length,
        by_method: { especes, cheque, virement }
      });
    }

    return calendar;
  },

  // 7. General Revenue Comparison
  async getRevenueComparison(academicYear: string = '2026/2027'): Promise<RevenueComparison> {
    const theoreticalList = await this.getMonthlyTheoreticalCA(academicYear);
    const totalTheoretical = theoreticalList.reduce((sum, c) => sum + c.monthly_total, 0);

    const tuitionSum = theoreticalList.reduce((sum, c) => sum + c.tuition_subtotal, 0);
    const transportSum = theoreticalList.reduce((sum, c) => sum + c.transport_subtotal, 0);
    const canteenSum = theoreticalList.reduce((sum, c) => sum + c.canteen_subtotal, 0);

    const transactions = await caisseService.getTransactions();
    const actualCollected = transactions
      .filter(t => t.type === 'encaissement')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const rate = totalTheoretical > 0 ? Math.min(100, Math.round((actualCollected / totalTheoretical) * 100)) : 0;
    const reliquat = Math.max(0, totalTheoretical - actualCollected);

    return {
      theoretical_monthly: totalTheoretical,
      actual_collected_monthly: actualCollected,
      collection_rate: rate,
      total_reliquat: reliquat,
      service_breakdown: {
        tuition_share: totalTheoretical > 0 ? Math.round((tuitionSum / totalTheoretical) * 100) : 70,
        transport_share: totalTheoretical > 0 ? Math.round((transportSum / totalTheoretical) * 100) : 18,
        canteen_share: totalTheoretical > 0 ? Math.round((canteenSum / totalTheoretical) * 100) : 12
      }
    };
  }
};
