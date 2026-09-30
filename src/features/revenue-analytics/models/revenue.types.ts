// ── Merged from analyticsModels.ts (legacy) ─────────────────────────────────
export interface RevenueMetric {
  period: string;
  income: number;
  expense: number;
  margin: number;
}
// ─────────────────────────────────────────────────────────────────────────────
export interface MonthlyTheoreticalCA {
  academic_level: string;
  level_name_ar: string;
  students_count: number;
  tuition_subtotal: number;
  transport_subtotal: number;
  canteen_subtotal: number;
  monthly_total: number;
}

export interface AnnualCASummary {
  academic_year: string;
  target_annual_ca: number;
  monthly_tuition_x10: number;
  monthly_transport_x10: number;
  monthly_canteen_x10: number;
  total_registration_fees: number;
  total_supplies_fees: number;
  annual_theoretical_ca: number;
  actual_collected_ca: number;
  achievement_rate: number;
  reliquat_total: number;
}

export interface RecetteDailyRecord {
  id: string;
  transaction_date: string;
  amount: number;
  payment_method: 'especes' | 'cheque' | 'virement' | 'carte' | string;
  category: string;
  reference_number?: string;
  description: string;
  author_name?: string;
  receipt_type?: 'agent' | 'admin' | 'direct';
  created_at?: string;
}

export interface CaisseAlimentation {
  id: string;
  alimentation_date: string;
  amount: number;
  source: 'apport_personnel' | 'virement_bancaire' | 'recouvrement' | 'autre' | string;
  destination_account: string;
  agent_name: string;
  motif: string;
  receipt_reference?: string;
  academic_year: string;
  created_at?: string;
}

export interface RevenueComparison {
  theoretical_monthly: number;
  actual_collected_monthly: number;
  collection_rate: number;
  total_reliquat: number;
  service_breakdown: {
    tuition_share: number;
    transport_share: number;
    canteen_share: number;
  };
}

export interface DailyCalendarRecette {
  date: string;
  day_number: number;
  total_amount: number;
  transactions_count: number;
  by_method: {
    especes: number;
    cheque: number;
    virement: number;
  };
}
