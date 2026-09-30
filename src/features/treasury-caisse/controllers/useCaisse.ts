import { useState, useEffect, useCallback } from 'react';
import { caisseService } from '../services/caisseService';
import { CaisseTransaction, CaisseSummary, CreateTransactionDTO } from '../models/caisseModels';

export const useCaisse = () => {
  const [transactions, setTransactions] = useState<CaisseTransaction[]>([]);
  const [summary, setSummary] = useState<CaisseSummary>({
    totalEncaissement: 0,
    totalDecaissement: 0,
    currentBalance: 0,
    cashInHand: 0,
    transactionsCount: 0
  });
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await caisseService.getTransactions();
      setTransactions(data);
      setSummary(caisseService.calculateSummary(data));
    } finally {
      setLoading(false);
    }
  }, []);

  const addTransaction = async (dto: CreateTransactionDTO) => {
    const created = await caisseService.addTransaction(dto);
    const updated = [created, ...transactions].filter(Boolean) as CaisseTransaction[];
    setTransactions(updated);
    setSummary(caisseService.calculateSummary(updated));
    return created;
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { transactions, summary, loading, refresh: loadData, addTransaction };
};
