import { useState, useEffect, useCallback } from 'react';
import { financeOperationsService } from '../services/financeOperations.service';
import {
  StudentImpayeRecord,
  StudentCreditBalance,
  StudentDiscountExemption,
  PaymentJournalRecord,
  ImpayesStats,
  ImpayeFilters,
  RecoveryStatus
} from '../models/finance.types';

export const useFinance = (initialFilters?: ImpayeFilters) => {
  const [impayes, setImpayes] = useState<StudentImpayeRecord[]>([]);
  const [creditBalances, setCreditBalances] = useState<StudentCreditBalance[]>([]);
  const [discounts, setDiscounts] = useState<StudentDiscountExemption[]>([]);
  const [paymentsJournal, setPaymentsJournal] = useState<PaymentJournalRecord[]>([]);
  const [stats, setStats] = useState<ImpayesStats | null>(null);
  const [filters, setFilters] = useState<ImpayeFilters>(initialFilters || {});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [impayeData, creditData, discountData, journalData, statsData] = await Promise.all([
        financeOperationsService.getImpayesList(filters),
        financeOperationsService.getCreditBalances(),
        financeOperationsService.getDiscountsAndExemptions(),
        financeOperationsService.getPaymentsJournal(),
        financeOperationsService.getImpayesSummaryStats(await financeOperationsService.getImpayesList(filters))
      ]);
      setImpayes(impayeData);
      setCreditBalances(creditData);
      setDiscounts(discountData);
      setPaymentsJournal(journalData);
      setStats(statsData);
    } catch (err) {
      console.warn('[useFinance] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const updateRecoveryStatus = useCallback(async (id: string, status: RecoveryStatus, notes?: string) => {
    await financeOperationsService.updateImpayeRecoveryStatus(id, status, notes);
    await load();
  }, [load]);

  return {
    impayes,
    creditBalances,
    discounts,
    paymentsJournal,
    stats,
    filters,
    setFilters,
    loading,
    refresh: load,
    updateRecoveryStatus
  };
};