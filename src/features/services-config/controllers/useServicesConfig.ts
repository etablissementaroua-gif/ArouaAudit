import { useState, useEffect, useCallback } from 'react';
import { servicesConfigService } from '../services/servicesConfig.service';
import {
  TransportLine,
  CanteenPlan,
  SuppliesPack,
  ServicesOverviewStats
} from '../models/services.types';

export const useServicesConfig = (academicYear = '2026/2027') => {
  const [transportLines, setTransportLines] = useState<TransportLine[]>([]);
  const [canteenPlans, setCanteenPlans] = useState<CanteenPlan[]>([]);
  const [suppliesPacks, setSuppliesPacks] = useState<SuppliesPack[]>([]);
  const [stats, setStats] = useState<ServicesOverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lines, plans, packs, overview] = await Promise.all([
        servicesConfigService.getTransportLines(academicYear),
        servicesConfigService.getCanteenPlans(academicYear),
        servicesConfigService.getSuppliesPacks(academicYear),
        servicesConfigService.getServicesOverviewStats(academicYear)
      ]);
      setTransportLines(lines);
      setCanteenPlans(plans);
      setSuppliesPacks(packs);
      setStats(overview);
    } catch (err) {
      console.warn('[useServicesConfig] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [academicYear]);

  useEffect(() => { load(); }, [load]);

  return { transportLines, canteenPlans, suppliesPacks, stats, loading, refresh: load };
};