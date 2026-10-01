import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import { 
  AcademicYear, 
  EducationalCycle, 
  AcademicLevelClass, 
  LevelTarif 
} from '../models/settings.types';

// Initial Seeds in case of offline/local state
const seedYears: AcademicYear[] = [
  { id: 'yr-2', code: '2026/2027', start_date: '2026-09-01', end_date: '2027-06-30', is_current: true, target_annual_ca: 0 }
];

const seedCycles: EducationalCycle[] = [
  { id: 'cyc-1', code: 'preschool', name_ar: 'التعليم الأولي', name_fr: 'Préscolaire', display_order: 1 },
  { id: 'cyc-2', code: 'primary', name_ar: 'التعليم الابتدائي', name_fr: 'Primaire', display_order: 2 },
  { id: 'cyc-3', code: 'middle_school', name_ar: 'الثانوي الإعدادي', name_fr: 'Collège', display_order: 3 }
];

const seedLevels: AcademicLevelClass[] = [
  { id: 'lvl-1', cycle_code: 'preschool', level_code: 'PS', name_ar: 'روض أول (صغار)', name_fr: 'Petite Section', display_order: 1, groups: ['فوج A'] },
  { id: 'lvl-2', cycle_code: 'preschool', level_code: 'MS', name_ar: 'روض ثان (متوسط)', name_fr: 'Moyenne Section', display_order: 2, groups: ['فوج A'] },
  { id: 'lvl-3', cycle_code: 'preschool', level_code: 'GS', name_ar: 'تمهيدي (كبار)', name_fr: 'Grande Section', display_order: 3, groups: ['فوج A', 'فوج B'] },
  { id: 'lvl-4', cycle_code: 'primary', level_code: 'CP', name_ar: 'الأول ابتدائي', name_fr: '1ère Année (CP)', display_order: 10, groups: ['فوج A', 'فوج B'] },
  { id: 'lvl-5', cycle_code: 'primary', level_code: 'CE1', name_ar: 'الثاني ابتدائي', name_fr: '2ème Année (CE1)', display_order: 11, groups: ['فوج A', 'فوج B'] },
  { id: 'lvl-6', cycle_code: 'primary', level_code: 'CE2', name_ar: 'الثالث ابتدائي', name_fr: '3ème Année (CE2)', display_order: 12, groups: ['فوج A', 'فوج B'] },
  { id: 'lvl-7', cycle_code: 'primary', level_code: 'CM1', name_ar: 'الرابع ابتدائي', name_fr: '4ème Année (CM1)', display_order: 13, groups: ['فوج A', 'فوج B'] },
  { id: 'lvl-8', cycle_code: 'primary', level_code: 'CM2', name_ar: 'الخامس ابتدائي', name_fr: '5ème Année (CM2)', display_order: 14, groups: ['فوج A', 'فوج B'] },
  { id: 'lvl-9', cycle_code: 'primary', level_code: 'CE6', name_ar: 'السادس ابتدائي', name_fr: '6ème Année (CE6)', display_order: 15, groups: ['فوج A', 'فوج B'] },
  { id: 'lvl-10', cycle_code: 'middle_school', level_code: '1AC', name_ar: 'الأولى إعدادي', name_fr: '1ère Année Collège', display_order: 20, groups: ['فوج A', 'فوج B'] },
  { id: 'lvl-11', cycle_code: 'middle_school', level_code: '2AC', name_ar: 'الثانية إعدادي', name_fr: '2ème Année Collège', display_order: 21, groups: ['فوج A'] },
  { id: 'lvl-12', cycle_code: 'middle_school', level_code: '3AC', name_ar: 'الثالثة إعدادي', name_fr: '3ème Année Collège', display_order: 22, groups: ['فوج A'] }
];

const seedTarifs: LevelTarif[] = [
  { level_code: 'PS', academic_year_code: '2026/2027', tuition_monthly: 0, transport_monthly: 0, canteen_monthly: 0, supplies_fee: 0, registration_fee: 0, re_registration_fee: 0, supplies_checklist: [] },
  { level_code: 'MS', academic_year_code: '2026/2027', tuition_monthly: 0, transport_monthly: 0, canteen_monthly: 0, supplies_fee: 0, registration_fee: 0, re_registration_fee: 0, supplies_checklist: [] },
  { level_code: 'GS', academic_year_code: '2026/2027', tuition_monthly: 0, transport_monthly: 0, canteen_monthly: 0, supplies_fee: 0, registration_fee: 0, re_registration_fee: 0, supplies_checklist: [] },
  { level_code: 'CP', academic_year_code: '2026/2027', tuition_monthly: 0, transport_monthly: 0, canteen_monthly: 0, supplies_fee: 0, registration_fee: 0, re_registration_fee: 0, supplies_checklist: [] },
  { level_code: 'CE1', academic_year_code: '2026/2027', tuition_monthly: 0, transport_monthly: 0, canteen_monthly: 0, supplies_fee: 0, registration_fee: 0, re_registration_fee: 0, supplies_checklist: [] },
  { level_code: 'CE2', academic_year_code: '2026/2027', tuition_monthly: 0, transport_monthly: 0, canteen_monthly: 0, supplies_fee: 0, registration_fee: 0, re_registration_fee: 0, supplies_checklist: [] },
  { level_code: 'CM1', academic_year_code: '2026/2027', tuition_monthly: 0, transport_monthly: 0, canteen_monthly: 0, supplies_fee: 0, registration_fee: 0, re_registration_fee: 0, supplies_checklist: [] },
  { level_code: 'CM2', academic_year_code: '2026/2027', tuition_monthly: 0, transport_monthly: 0, canteen_monthly: 0, supplies_fee: 0, registration_fee: 0, re_registration_fee: 0, supplies_checklist: [] },
  { level_code: 'CE6', academic_year_code: '2026/2027', tuition_monthly: 0, transport_monthly: 0, canteen_monthly: 0, supplies_fee: 0, registration_fee: 0, re_registration_fee: 0, supplies_checklist: [] },
  { level_code: '1AC', academic_year_code: '2026/2027', tuition_monthly: 0, transport_monthly: 0, canteen_monthly: 0, supplies_fee: 0, registration_fee: 0, re_registration_fee: 0, supplies_checklist: [] },
  { level_code: '2AC', academic_year_code: '2026/2027', tuition_monthly: 0, transport_monthly: 0, canteen_monthly: 0, supplies_fee: 0, registration_fee: 0, re_registration_fee: 0, supplies_checklist: [] },
  { level_code: '3AC', academic_year_code: '2026/2027', tuition_monthly: 0, transport_monthly: 0, canteen_monthly: 0, supplies_fee: 0, registration_fee: 0, re_registration_fee: 0, supplies_checklist: [] }
];

export const systemSettingsService = {
  // --- Academic Years ---
  async getAcademicYears(): Promise<AcademicYear[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('academic_years').select('*').order('start_date', { ascending: false });
        if (!error && data && data.length > 0) {
          return (data as any[]).map(year => {
            const raw = Number(year.target_annual_ca) || 0;
            // Purge dummy mock targets (4200000, 4800000, 5200000)
            const target = (raw === 4200000 || raw === 4800000 || raw === 5200000) ? 0 : raw;
            return {
              ...year,
              target_annual_ca: target
            };
          }) as AcademicYear[];
        }
      } catch (err) {
        console.warn('Academic years fetch fallback:', err);
      }
    }
    const local = localStorage.getItem('aroua_academic_years');
    return local ? JSON.parse(local) : seedYears;
  },

  async deleteAcademicYear(code: string): Promise<boolean> {
    if (code === '2026/2027') return false;
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('academic_years').delete().eq('code', code);
      } catch (err) {
        console.warn('Supabase deleteAcademicYear error:', err);
      }
    }
    const years = await this.getAcademicYears();
    const updated = years.filter(y => y.code !== code);
    localStorage.setItem('aroua_academic_years', JSON.stringify(updated));
    return true;
  },

  async purgeMockAcademicYears(): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('academic_years').update({ target_annual_ca: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('academic_years').delete().in('code', ['2025/2026', '2027/2028']);
      } catch (err) {
        console.warn('Supabase purgeMockAcademicYears error:', err);
      }
    }
    localStorage.removeItem('aroua_academic_years');
    return true;
  },

  async setActiveAcademicYear(code: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('academic_years').update({ is_current: false }).neq('code', code);
        await supabase.from('academic_years').update({ is_current: true }).eq('code', code);
      } catch (err) {
        console.warn('Supabase set active year error:', err);
      }
    }
    const years = await this.getAcademicYears();
    const updated = years.map(y => ({ ...y, is_current: y.code === code }));
    localStorage.setItem('aroua_academic_years', JSON.stringify(updated));
    return true;
  },

  async createAcademicYear(year: Partial<AcademicYear>): Promise<AcademicYear> {
    const newYear: AcademicYear = {
      id: 'yr-' + Date.now(),
      code: year.code || '2028/2029',
      start_date: year.start_date || '2028-09-01',
      end_date: year.end_date || '2029-06-30',
      is_current: Boolean(year.is_current),
      target_annual_ca: Number(year.target_annual_ca) || 0,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        if (newYear.is_current) {
          await supabase.from('academic_years').update({ is_current: false }).neq('code', '');
        }
        await supabase.from('academic_years').insert([newYear]);
      } catch (err) {
        console.warn('Supabase create year error:', err);
      }
    }

    const years = await this.getAcademicYears();
    const updated = [newYear, ...years.map(y => newYear.is_current ? { ...y, is_current: false } : y)];
    localStorage.setItem('aroua_academic_years', JSON.stringify(updated));
    return newYear;
  },

  // --- Educational Cycles & Levels ---
  async getEducationalCycles(): Promise<EducationalCycle[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('educational_cycles').select('*').order('display_order', { ascending: true });
        if (!error && data && data.length > 0) return data as EducationalCycle[];
      } catch (err) {
        console.warn('Cycles fetch fallback:', err);
      }
    }
    return seedCycles;
  },

  async getLevelsAndClasses(): Promise<AcademicLevelClass[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('academic_levels_classes').select('*').order('display_order', { ascending: true });
        if (!error && data && data.length > 0) return data as AcademicLevelClass[];
      } catch (err) {
        console.warn('Levels fetch fallback:', err);
      }
    }
    const local = localStorage.getItem('aroua_levels_classes');
    return local ? JSON.parse(local) : seedLevels;
  },

  async updateClassGroups(levelCode: string, groups: string[]): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('academic_levels_classes').update({ groups }).eq('level_code', levelCode);
      } catch (err) {
        console.warn('Supabase update groups error:', err);
      }
    }
    const levels = await this.getLevelsAndClasses();
    const updated = levels.map(l => l.level_code === levelCode ? { ...l, groups } : l);
    localStorage.setItem('aroua_levels_classes', JSON.stringify(updated));
    return true;
  },

  // --- Tarifs & Pricing Grid ---
  async getLevelTarifs(yearCode: string = '2026/2027'): Promise<LevelTarif[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('level_tarifs').select('*').eq('academic_year_code', yearCode);
        if (!error && data && data.length > 0) return data as LevelTarif[];
      } catch (err) {
        console.warn('Tarifs fetch fallback:', err);
      }
    }
    const local = localStorage.getItem('aroua_level_tarifs_' + yearCode);
    return local ? JSON.parse(local) : seedTarifs;
  },

  async updateLevelTarif(levelCode: string, tarifData: Partial<LevelTarif>, yearCode: string = '2026/2027'): Promise<boolean> {
    const updatedPayload = { ...tarifData, updated_at: new Date().toISOString() };
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('level_tarifs').update(updatedPayload).eq('level_code', levelCode).eq('academic_year_code', yearCode);
      } catch (err) {
        console.warn('Supabase update tarif error:', err);
      }
    }
    const tarifs = await this.getLevelTarifs(yearCode);
    const updated = tarifs.map(t => t.level_code === levelCode ? { ...t, ...updatedPayload } : t);
    localStorage.setItem('aroua_level_tarifs_' + yearCode, JSON.stringify(updated));
    return true;
  }
};
