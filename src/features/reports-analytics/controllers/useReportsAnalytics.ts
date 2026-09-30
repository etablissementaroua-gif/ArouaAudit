import { useState, useEffect, useCallback } from 'react';
import { reportsAnalyticsService } from '../services/reportsAnalytics.service';
import {
  FinancialSummaryReport,
  CollectionRateMetrics,
  ReportPeriodType,
  ReportExportFilter
} from '../models/reportsAnalytics.types';

export const useReportsAnalytics = (academicYear = '2026/2027') => {
  const [summary, setSummary] = useState<FinancialSummaryReport[]>([]);
  const [collectionMetrics, setCollectionMetrics] = useState<CollectionRateMetrics | null>(null);
  const [periodType, setPeriodType] = useState<ReportPeriodType>('monthly');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filter: Partial<ReportExportFilter> = {
        periodType,
        academicYear,
        includeServices: true,
        includePayroll: true,
        includeChecks: true
      };
      const [s, c] = await Promise.all([
        reportsAnalyticsService.getFinancialSummary(filter),
        reportsAnalyticsService.getCollectionRateMetrics(academicYear)
      ]);
      setSummary(s);
      setCollectionMetrics(c);
    } catch (err) {
      console.warn('[useReportsAnalytics] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [periodType, academicYear]);

  useEffect(() => { load(); }, [load]);

  // تصدير الملخص المالي إلى CSV مع ترميز UTF-8 BOM
  const exportFinancialSummary = useCallback(() => {
    const exportData = summary.map(s => ({
      'الفترة': s.period,
      'إجمالي المداخيل (MAD)': s.totalRevenue.toFixed(2),
      'إجمالي النفقات (MAD)': s.totalExpenses.toFixed(2),
      'صافي الفائض (MAD)': s.netSurplus.toFixed(2),
      'نسبة التحصيل (%)': s.collectionRate,
      'المستحقات غير المؤداة (MAD)': s.totalImpayes.toFixed(2),
      'الكتلة الأجرية (MAD)': s.payrollCost.toFixed(2)
    }));
    reportsAnalyticsService.exportToCSV(exportData, 'rapport_financier');
  }, [summary]);

  // تصدير تفصيل نسب التحصيل بالمستويات
  const exportCollectionByLevel = useCallback(() => {
    if (!collectionMetrics) return;
    const exportData = collectionMetrics.by_level.map(l => ({
      'المستوى الدراسي': l.level,
      'عدد التلاميذ': l.students,
      'المستحقات الإجمالية (MAD)': l.amount_due.toFixed(2),
      'المحصل الفعلي (MAD)': l.amount_collected.toFixed(2),
      'نسبة التحصيل (%)': l.rate
    }));
    reportsAnalyticsService.exportToCSV(exportData, 'taux_recouvrement_par_niveau');
  }, [collectionMetrics]);

  return {
    summary,
    collectionMetrics,
    periodType,
    setPeriodType,
    loading,
    refresh: load,
    exportFinancialSummary,
    exportCollectionByLevel
  };
};