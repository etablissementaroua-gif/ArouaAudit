export interface StudentRecord {
  id: string;
  student_id: string;            // المعرف الداخلي (e.g. STU-2026-001)
  external_id?: string;          // المعرف الخارجي من منظومة أروى
  source_platform: string;       // e.g. 'arouaschools'
  full_name_ar: string;
  full_name_fr?: string;
  massar_code: string;           // رمز مسار
  academic_level: string;        // المستوى الدراسي
  academic_year: string;
  classroom?: string;
  has_transport: boolean;        // اشتراك النقل المدرسي
  has_canteen: boolean;          // اشتراك الإطعام
  parent_whatsapp?: string;      // واتساب ولي الأمر للتذكير المالي
  parent_phone?: string;
  enrollment_status: 'enrolled' | 'graduated' | 'transferred' | 'suspended';
  
  // Financial & Billing Data
  tuition_fee: number;
  transport_fee: number;
  canteen_fee: number;
  total_due: number;
  total_paid: number;
  balance: number;
  created_at?: string;
}

export interface EnrollmentFilters {
  searchQuery: string;
  levelFilter: string;
  transportOnly: boolean;
  canteenOnly: boolean;
  paymentStatus: 'all' | 'settled' | 'pending';
}

export interface BillingSummary {
  totalStudents: number;
  totalDue: number;
  totalPaid: number;
  totalBalance: number;
  transportSubscribers: number;
  canteenSubscribers: number;
  arouaSchoolsSyncedCount: number;
}
