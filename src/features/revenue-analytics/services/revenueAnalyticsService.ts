import { RevenueMetric } from '../models/analyticsModels';

const demoMetrics: RevenueMetric[] = [
  { period: 'ماي 2026', income: 145000, expense: 92000, margin: 53000 },
  { period: 'يونيو 2026', income: 162000, expense: 98000, margin: 64000 },
  { period: 'يوليوز 2026', income: 85000, expense: 60000, margin: 25000 },
  { period: 'غشت 2026', income: 110000, expense: 75000, margin: 35000 },
  { period: 'سبتمبر 2026 (حالي)', income: 240000, expense: 125000, margin: 115000 }
];

export const revenueAnalyticsService = {
  async getMetrics(): Promise<RevenueMetric[]> {
    return demoMetrics;
  }
};
