export type CanteenFrequency = 'mensuel' | 'trimestriel' | 'annuel' | 'carnet_tickets';

export interface TransportLine {
  id: string;
  line_code: string;
  line_name: string;
  bus_registration: string;
  bus_brand?: string;
  capacity: number;
  driver_name: string;
  driver_phone?: string;
  assistant_name?: string;
  assistant_phone?: string;
  zone_coverage: string;
  monthly_fee: number;
  is_active: boolean;
  academic_year: string;
  enrolled_count?: number;
  occupancy_rate?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CanteenPlan {
  id: string;
  plan_code: string;
  name_ar: string;
  name_fr: string;
  frequency: CanteenFrequency;
  fee_amount: number;
  daily_meal_desc?: string;
  max_capacity: number;
  is_active: boolean;
  academic_year: string;
  enrolled_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SuppliesItemDetail {
  name: string;
  qty: number;
}

export interface SuppliesPack {
  id: string;
  pack_code: string;
  academic_level: string;
  title_ar: string;
  title_fr: string;
  items_count: number;
  cost_price: number;
  selling_price: number;
  stock_available: number;
  stock_sold: number;
  items_breakdown?: SuppliesItemDetail[];
  academic_year: string;
  is_active: boolean;
  margin_unit?: number;
  margin_total?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ServicesOverviewStats {
  total_buses: number;
  total_seats: number;
  total_transport_students: number;
  avg_bus_occupancy: number;
  total_canteen_enrolled: number;
  canteen_capacity: number;
  packs_total_sold: number;
  total_supplies_margin: number;
}

export interface NewTransportLineFormData {
  line_code: string;
  line_name: string;
  bus_registration: string;
  bus_brand: string;
  capacity: number;
  driver_name: string;
  driver_phone: string;
  assistant_name: string;
  assistant_phone: string;
  zone_coverage: string;
  monthly_fee: number;
  academic_year: string;
}

export interface NewCanteenPlanFormData {
  plan_code: string;
  name_ar: string;
  name_fr: string;
  frequency: CanteenFrequency;
  fee_amount: number;
  daily_meal_desc: string;
  max_capacity: number;
  academic_year: string;
}

export interface NewSuppliesPackFormData {
  pack_code: string;
  academic_level: string;
  title_ar: string;
  title_fr: string;
  items_count: number;
  cost_price: number;
  selling_price: number;
  stock_available: number;
  items_breakdown: SuppliesItemDetail[];
  academic_year: string;
}
