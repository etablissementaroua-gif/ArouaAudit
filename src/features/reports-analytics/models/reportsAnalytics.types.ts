// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ArouaAudit — Reports & Analytics Domain Types
// CCP: All types consumed exclusively by reports-analytics feature
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type ReportPeriodType = 'monthly' | 'quarterly' | 'annual' | 'custom';

export interface ReportExportFilter {
  periodType: ReportPeriodType;
  startDate: string;       // ISO date: 'YYYY-MM-DD'
  endDate: string;
  academicYear: string;
  includeServices: boolean;
  includePayroll: boolean;
  includeChecks: boolean;
}

/**
 * Consolidated monthly financial snapshot for dashboard-level reporting
 */
export interface FinancialSummaryReport {
  period: string;             // e.g. '2026-09' or 'T1 2026-27'
  totalRevenue: number;       // المداخيل الإجمالية (MAD)
  totalExpenses: number;      // النفقات الإجمالية (MAD)
  netSurplus: number;         // صافي الفائض التشغيلي (MAD)
  collectionRate: number;     // نسبة التحصيل (%)
  totalImpayes: number;       // إجمالي المستحقات غير المؤداة (MAD)
  payrollCost: number;        // الكتلة الأجرية المصروفة (MAD)
}

/**
 * Per-service revenue breakdown for comparative analysis
 */
export interface ServicesBreakdownItem {
  service: 'scolarite' | 'transport' | 'cantine' | 'fournitures' | 'inscription' | 'autre';
  label_ar: string;
  label_fr: string;
  theoretical_amount: number;   // الرقم المعياري المتوقع (MAD)
  collected_amount: number;     // المبلغ المحصل فعلياً (MAD)
  recovery_rate: number;        // نسبة الإنجاز (%)
  students_count: number;       // عدد التلاميذ المعنيين
}

/**
 * Multi-axis collection rate analysis
 */
export interface CollectionRateMetrics {
  overall_rate: number;         // النسبة الإجمالية (%)
  by_level: Array<{
    level: string;
    rate: number;
    students: number;
    amount_due: number;
    amount_collected: number;
  }>;
  by_service: ServicesBreakdownItem[];
  monthly_trend: Array<{
    month: string;             // 'YYYY-MM'
    month_label: string;       // e.g. 'سبتمبر 2026'
    rate: number;
    collected: number;
    theoretical: number;
  }>;
}

/**
 * Summary card for export & print headers
 */
export interface ReportExportMetadata {
  title_ar: string;
  title_fr: string;
  period_label: string;
  academic_year: string;
  generated_at: string;       // ISO datetime
  generated_by: string;       // user name
  institution: string;        // مجموعة مدارس أروى
}