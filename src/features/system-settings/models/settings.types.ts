export interface AcademicYear {
  id: string;
  code: string; // '2026/2027'
  start_date: string;
  end_date: string;
  is_current: boolean;
  target_annual_ca: number;
  created_at?: string;
  updated_at?: string;
}

export interface EducationalCycle {
  id: string;
  code: 'preschool' | 'primary' | 'middle_school' | string;
  name_ar: string;
  name_fr: string;
  display_order: number;
}

export interface AcademicLevelClass {
  id: string;
  cycle_code: string;
  level_code: string;
  name_ar: string;
  name_fr: string;
  groups: string[];
  display_order: number;
}

export interface SuppliesItem {
  id: string;
  item_name: string;
  quantity: number;
  mandatory: boolean;
}

export interface LevelTarif {
  level_code: string;
  academic_year_code: string;
  tuition_monthly: number;
  transport_monthly: number;
  canteen_monthly: number;
  supplies_fee: number;
  registration_fee: number;
  re_registration_fee: number;
  supplies_checklist: SuppliesItem[];
  updated_at?: string;
}
