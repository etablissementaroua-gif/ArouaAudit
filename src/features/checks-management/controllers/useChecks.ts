import { useState, useEffect, useCallback } from 'react';
import { checkService } from '../services/checkService';
import { CheckRecord, CheckSummary } from '../models/checkModels';

export const useChecks = () => {
  const [checks, setChecks] = useState<CheckRecord[]>([]);
  const [summary, setSummary] = useState<CheckSummary>({
    totalPending: 0,
    totalEncaisse: 0,
    totalRejete: 0,
    overdueCount: 0,
    totalCount: 0
  });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await checkService.getChecks();
      setChecks(data);
      setSummary(checkService.calculateSummary(data));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { checks, summary, loading, refresh: loadData };
};
