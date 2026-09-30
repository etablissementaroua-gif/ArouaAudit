import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import { caisseService } from '../../treasury-caisse/services/caisseService';
import { StudentRecord, BillingSummary } from '../models/enrollmentModels';

export const initialSyncedStudents: StudentRecord[] = [];

export const enrollmentService = {
  async getStudents(): Promise<StudentRecord[]> {
    if (!isSupabaseConfigured()) {
      return initialSyncedStudents;
    }

    try {
      // جلب الطلاب وربطهم بحسابات الذمم المالية
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          student_accounts (
            total_due,
            total_paid,
            balance,
            tuition_fee,
            transport_fee,
            canteen_fee
          )
        `)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return initialSyncedStudents;
      }

      return data.map((item: any) => {
        const acc = Array.isArray(item.student_accounts) ? item.student_accounts[0] : item.student_accounts;
        return {
          id: item.id,
          student_id: item.student_id,
          external_id: item.external_id,
          source_platform: item.source_platform || 'arouaschools',
          full_name_ar: item.full_name_ar,
          full_name_fr: item.full_name_fr,
          massar_code: item.massar_code,
          academic_level: item.academic_level,
          academic_year: item.academic_year || '2026-2027',
          classroom: item.classroom,
          has_transport: Boolean(item.has_transport),
          has_canteen: Boolean(item.has_canteen),
          parent_whatsapp: item.parent_whatsapp,
          parent_phone: item.parent_phone,
          enrollment_status: item.enrollment_status || 'enrolled',
          tuition_fee: acc?.tuition_fee ?? 24000,
          transport_fee: acc?.transport_fee ?? (item.has_transport ? 5000 : 0),
          canteen_fee: acc?.canteen_fee ?? (item.has_canteen ? 4500 : 0),
          total_due: acc?.total_due ?? 24000,
          total_paid: acc?.total_paid ?? 0,
          balance: acc?.balance ?? 24000,
          created_at: item.created_at,
        } as StudentRecord;
      });
    } catch (err) {
      console.warn('Supabase fetch students fallback:', err);
      return initialSyncedStudents;
    }
  },

  calculateSummary(students: StudentRecord[]): BillingSummary {
    let totalDue = 0;
    let totalPaid = 0;
    let totalBalance = 0;
    let transportSubscribers = 0;
    let canteenSubscribers = 0;
    let arouaSchoolsSyncedCount = 0;

    for (const s of students) {
      totalDue += s.total_due;
      totalPaid += s.total_paid;
      totalBalance += s.balance;
      if (s.has_transport) transportSubscribers++;
      if (s.has_canteen) canteenSubscribers++;
      if (s.source_platform === 'arouaschools') arouaSchoolsSyncedCount++;
    }

    return {
      totalStudents: students.length,
      totalDue,
      totalPaid,
      totalBalance,
      transportSubscribers,
      canteenSubscribers,
      arouaSchoolsSyncedCount,
    };
  },

  /**
   * توليد مستحقات اشتراك النقل المدرسي والمطعم تلقائياً في يومية الصندوق والخزينة
   */
  async generateServiceDuesInCaisse(
    serviceType: 'transport' | 'canteen' | 'both',
    students: StudentRecord[]
  ): Promise<{ addedCount: number; totalGeneratedMAD: number }> {
    const today = new Date().toISOString().split('T')[0];
    let count = 0;
    let total = 0;

    const targets = students.filter(s => {
      if (serviceType === 'transport') return s.has_transport;
      if (serviceType === 'canteen') return s.has_canteen;
      return s.has_transport || s.has_canteen;
    });

    for (const st of targets) {
      if ((serviceType === 'transport' || serviceType === 'both') && st.has_transport) {
        const amount = st.transport_fee > 0 ? st.transport_fee / 10 : 500; // قسط شهري
        await caisseService.addTransaction({
          type: 'encaissement',
          amount,
          payment_method: 'virement',
          category: 'مستحقات النقل المدرسي (arouaschools)',
          reference_number: `TRP-${st.student_id}`,
          description: `قسط النقل المدرسي - التلميذ: ${st.full_name_ar} (مسار: ${st.massar_code})`,
          transaction_date: today,
        });
        count++;
        total += amount;
      }

      if ((serviceType === 'canteen' || serviceType === 'both') && st.has_canteen) {
        const amount = st.canteen_fee > 0 ? st.canteen_fee / 10 : 450; // قسط شهري
        await caisseService.addTransaction({
          type: 'encaissement',
          amount,
          payment_method: 'virement',
          category: 'مستحقات الإطعام المدرسي (arouaschools)',
          reference_number: `CAN-${st.student_id}`,
          description: `قسط الإطعام والمطعم - التلميذ: ${st.full_name_ar} (مسار: ${st.massar_code})`,
          transaction_date: today,
        });
        count++;
        total += amount;
      }
    }

    return { addedCount: count, totalGeneratedMAD: total };
  },

  /**
   * محاكاة أو استقبال دفعة جديدة من منظومة أروى
   */
  async syncIncomingBatchFromArouaSchools(): Promise<StudentRecord> {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const newStudent: StudentRecord = {
      id: `std-sync-${Date.now()}`,
      student_id: `STU-2026-${randomId}`,
      external_id: `AROUA-SCH-${randomId}`,
      source_platform: 'arouaschools',
      full_name_ar: 'مريم التازي المكناسي',
      full_name_fr: 'Meryem Tazi',
      massar_code: `N14${randomId}00`,
      academic_level: 'الأولى إعدادي مسار دولي',
      academic_year: '2026-2027',
      classroom: '1Coll-3',
      has_transport: true,
      has_canteen: true,
      parent_whatsapp: '212665889900',
      parent_phone: '0665-889900',
      enrollment_status: 'enrolled',
      tuition_fee: 22000,
      transport_fee: 5000,
      canteen_fee: 4500,
      total_due: 31500,
      total_paid: 0,
      balance: 31500,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('students').insert([{
          student_id: newStudent.student_id,
          external_id: newStudent.external_id,
          source_platform: 'arouaschools',
          full_name_ar: newStudent.full_name_ar,
          full_name_fr: newStudent.full_name_fr,
          massar_code: newStudent.massar_code,
          academic_level: newStudent.academic_level,
          academic_year: newStudent.academic_year,
          classroom: newStudent.classroom,
          has_transport: newStudent.has_transport,
          has_canteen: newStudent.has_canteen,
          parent_whatsapp: newStudent.parent_whatsapp,
          parent_phone: newStudent.parent_phone,
          enrollment_status: newStudent.enrollment_status,
        }]);
      } catch (err) {
        console.warn('Sync to supabase error:', err);
      }
    }

    return newStudent;
  },

  /**
   * تسجيل أداء مالي وتحديث ذمة التلميذ
   */
  async recordPayment(studentId: string, amount: number): Promise<boolean> {
    const list = await this.getStudents();
    const st = list.find(s => s.id === studentId || s.student_id === studentId);
    if (st) {
      st.total_paid = (Number(st.total_paid) || 0) + Number(amount);
      st.balance = Math.max(0, (Number(st.total_due) || 0) - st.total_paid);
      localStorage.setItem('aroua_synced_students', JSON.stringify(list));
    }
    return true;
  }
};
