import { useState, useEffect, useCallback } from 'react';
import { payrollService } from '../services/payrollService';
import { StaffPayrollSlip, PayrollSummary } from '../models/payrollModels';

export const usePayroll = () => {
  const [slips, setSlips] = useState<StaffPayrollSlip[]>([]);
  const [summary, setSummary] = useState<PayrollSummary>({
    totalSalariesNet: 0,
    totalAvances: 0,
    totalDepartedDebts: 0,
    slipsCount: 0
  });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await payrollService.getPayrollSlips();
      setSlips(data);
      setSummary(payrollService.calculateSummary(data));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { slips, summary, loading, refresh: loadData };
};
