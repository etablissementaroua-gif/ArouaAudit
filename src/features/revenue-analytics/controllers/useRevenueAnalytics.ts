import { useState, useEffect } from 'react';
import { revenueAnalyticsService } from '../services/revenueAnalyticsService';
import { RevenueMetric } from '../models/analyticsModels';

export const useRevenueAnalytics = () => {
  const [metrics, setMetrics] = useState<RevenueMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    revenueAnalyticsService.getMetrics().then(data => {
      setMetrics(data);
      setLoading(false);
    });
  }, []);

  return { metrics, loading };
};
