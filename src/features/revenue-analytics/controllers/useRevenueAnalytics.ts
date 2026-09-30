import { useState, useEffect, useCallback } from 'react';
import { revenueAnalyticsService } from '../services/revenueAnalytics.service';
import { RevenueMetric, RevenueComparison, MonthlyTheoreticalCA, AnnualCASummary } from '../models/revenue.types';

export const useRevenueAnalytics = (academicYear = '2026/2027') => {
  const [comparison, setComparison] = useState<RevenueComparison | null>(null);
  const [monthlyCA, setMonthlyCA] = useState<MonthlyTheoreticalCA[]>([]);
  const [annualCA, setAnnualCA] = useState<AnnualCASummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [comp, monthly, annual] = await Promise.all([
        revenueAnalyticsService.getRevenueComparison(academicYear),
        revenueAnalyticsService.getMonthlyTheoreticalCA(academicYear),
        revenueAnalyticsService.getAnnualEstimatedCA(academicYear)
      ]);
      setComparison(comp);
      setMonthlyCA(monthly);
      setAnnualCA(annual);
    } catch (err) {
      console.warn('[useRevenueAnalytics] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [academicYear]);

  useEffect(() => { load(); }, [load]);
  return { comparison, monthlyCA, annualCA, loading, refresh: load };
};
