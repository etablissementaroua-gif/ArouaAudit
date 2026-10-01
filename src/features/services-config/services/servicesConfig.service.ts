import { supabase } from '../../../shared/lib/supabaseClient';
import {
  TransportLine,
  CanteenPlan,
  SuppliesPack,
  ServicesOverviewStats,
  NewTransportLineFormData,
  NewCanteenPlanFormData,
  NewSuppliesPackFormData,
} from '../models/services.types';

export const servicesConfigService = {
  /**
   * جلب خطوط النقل المدرسي مع حساب نسب الإشغال
   */
  async getTransportLines(academicYear = '2026/2027'): Promise<TransportLine[]> {
    try {
      const { data, error } = await supabase
        .from('transport_lines')
        .select('*')
        .eq('academic_year', academicYear)
        .order('line_code', { ascending: true });

      if (error) throw error;

      // أعداد التلاميذ المسندين لكل خط
      const mockAssignedCounts: Record<string, number> = {};

      return (data || []).map((line) => {
        const capacity = line.capacity || 25;
        const enrolled = mockAssignedCounts[line.line_code] || 0;
        const rate = Math.round((enrolled / capacity) * 100);

        return {
          ...line,
          monthly_fee: Number(line.monthly_fee) || 0,
          enrolled_count: enrolled,
          occupancy_rate: rate,
        };
      });
    } catch (err) {
      console.error('Error fetching transport lines:', err);
      return [];
    }
  },

  /**
   * إضافة خط نقل مدرسي جديد
   */
  async addTransportLine(data: NewTransportLineFormData): Promise<TransportLine | null> {
    try {
      const { data: created, error } = await supabase
        .from('transport_lines')
        .insert({
          line_code: data.line_code.toUpperCase().trim(),
          line_name: data.line_name.trim(),
          bus_registration: data.bus_registration.trim(),
          bus_brand: data.bus_brand.trim() || 'Mercedes Sprinter',
          capacity: Number(data.capacity) || 24,
          driver_name: data.driver_name.trim(),
          driver_phone: data.driver_phone.trim() || null,
          assistant_name: data.assistant_name.trim() || null,
          assistant_phone: data.assistant_phone.trim() || null,
          zone_coverage: data.zone_coverage.trim(),
          monthly_fee: Number(data.monthly_fee) || 350,
          academic_year: data.academic_year || '2026/2027',
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return created;
    } catch (err) {
      console.error('Error adding transport line:', err);
      throw err;
    }
  },

  /**
   * تحديث بيانات أو حالة خط النقل
   */
  async updateTransportLine(id: string, updates: Partial<TransportLine>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('transport_lines')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating transport line:', err);
      return false;
    }
  },

  /**
   * جلب خطط وصيغ المطعم المدرسي
   */
  async getCanteenPlans(academicYear = '2026/2027'): Promise<CanteenPlan[]> {
    try {
      const { data, error } = await supabase
        .from('canteen_plans')
        .select('*')
        .eq('academic_year', academicYear)
        .order('fee_amount', { ascending: true });

      if (error) throw error;

      // أعداد المشتركين المسجلين لكل خطة
      const mockEnrolled: Record<string, number> = {};

      return (data || []).map((plan) => ({
        ...plan,
        fee_amount: Number(plan.fee_amount) || 0,
        enrolled_count: mockEnrolled[plan.plan_code] || 0,
      }));
    } catch (err) {
      console.error('Error fetching canteen plans:', err);
      return [];
    }
  },

  /**
   * إضافة صيغة اشتراك مطعم جديدة
   */
  async addCanteenPlan(data: NewCanteenPlanFormData): Promise<CanteenPlan | null> {
    try {
      const { data: created, error } = await supabase
        .from('canteen_plans')
        .insert({
          plan_code: data.plan_code.toUpperCase().trim(),
          name_ar: data.name_ar.trim(),
          name_fr: data.name_fr.trim(),
          frequency: data.frequency,
          fee_amount: Number(data.fee_amount),
          daily_meal_desc: data.daily_meal_desc.trim() || null,
          max_capacity: Number(data.max_capacity) || 100,
          academic_year: data.academic_year || '2026/2027',
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return created;
    } catch (err) {
      console.error('Error adding canteen plan:', err);
      throw err;
    }
  },

  /**
   * تحديث خطة المطعم
   */
  async updateCanteenPlan(id: string, updates: Partial<CanteenPlan>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('canteen_plans')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating canteen plan:', err);
      return false;
    }
  },

  /**
   * جلب حزم اللوازم والكتب والمقررات والمآزر
   */
  async getSuppliesPacks(academicYear = '2026/2027'): Promise<SuppliesPack[]> {
    try {
      const { data, error } = await supabase
        .from('supplies_packs')
        .select('*')
        .eq('academic_year', academicYear)
        .order('selling_price', { ascending: true });

      if (error) throw error;

      return (data || []).map((pack) => {
        const cost = Number(pack.cost_price) || 0;
        const selling = Number(pack.selling_price) || 0;
        const sold = Number(pack.stock_sold) || 0;
        const marginUnit = Math.max(0, selling - cost);
        const marginTotal = marginUnit * sold;

        return {
          ...pack,
          cost_price: cost,
          selling_price: selling,
          margin_unit: marginUnit,
          margin_total: marginTotal,
        };
      });
    } catch (err) {
      console.error('Error fetching supplies packs:', err);
      return [];
    }
  },

  /**
   * إضافة حزمة لوازم ومقررات جديدة
   */
  async addSuppliesPack(data: NewSuppliesPackFormData): Promise<SuppliesPack | null> {
    try {
      const { data: created, error } = await supabase
        .from('supplies_packs')
        .insert({
          pack_code: data.pack_code.toUpperCase().trim(),
          academic_level: data.academic_level.trim(),
          title_ar: data.title_ar.trim(),
          title_fr: data.title_fr.trim(),
          items_count: Number(data.items_count) || data.items_breakdown.length || 1,
          cost_price: Number(data.cost_price),
          selling_price: Number(data.selling_price),
          stock_available: Number(data.stock_available) || 0,
          stock_sold: 0,
          items_breakdown: data.items_breakdown || [],
          academic_year: data.academic_year || '2026/2027',
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return created;
    } catch (err) {
      console.error('Error adding supplies pack:', err);
      throw err;
    }
  },

  /**
   * إحصائيات عامة شاملة للخدمات الملحقة
   */
  async getServicesOverviewStats(academicYear = '2026/2027'): Promise<ServicesOverviewStats> {
    try {
      const [lines, plans, packs] = await Promise.all([
        this.getTransportLines(academicYear),
        this.getCanteenPlans(academicYear),
        this.getSuppliesPacks(academicYear),
      ]);

      const totalBuses = lines.length;
      const totalSeats = lines.reduce((sum, l) => sum + l.capacity, 0);
      const totalTransportStudents = lines.reduce((sum, l) => sum + (l.enrolled_count || 0), 0);
      const avgOccupancy = totalSeats > 0 ? Math.round((totalTransportStudents / totalSeats) * 100) : 0;

      const totalCanteenEnrolled = plans.reduce((sum, p) => sum + (p.enrolled_count || 0), 0);
      const canteenCapacity = plans.reduce((sum, p) => sum + p.max_capacity, 0);

      const packsSold = packs.reduce((sum, p) => sum + p.stock_sold, 0);
      const suppliesMargin = packs.reduce((sum, p) => sum + (p.margin_total || 0), 0);

      return {
        total_buses: totalBuses,
        total_seats: totalSeats,
        total_transport_students: totalTransportStudents,
        avg_bus_occupancy: avgOccupancy,
        total_canteen_enrolled: totalCanteenEnrolled,
        canteen_capacity: canteenCapacity,
        packs_total_sold: packsSold,
        total_supplies_margin: suppliesMargin,
      };
    } catch (err) {
      console.error('Error fetching services overview stats:', err);
      return {
        total_buses: 0,
        total_seats: 0,
        total_transport_students: 0,
        avg_bus_occupancy: 0,
        total_canteen_enrolled: 0,
        canteen_capacity: 0,
        packs_total_sold: 0,
        total_supplies_margin: 0,
      };
    }
  },
};
