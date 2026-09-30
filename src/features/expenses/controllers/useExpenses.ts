import { useState, useEffect, useCallback } from 'react';
import { expensesService } from '../services/expenses.service';
import {
  ExpenseCategory,
  ExpenseItem,
  DisbursementVoucher,
  ExpenseMonthlyStatItem,
  ExpenseBudgetSummary,
  ExpenseFilterParams
} from '../models/expenses.types';

export const useExpenses = (academicYear = '2026/2027') => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [disbursements, setDisbursements] = useState<DisbursementVoucher[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<ExpenseMonthlyStatItem[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<ExpenseBudgetSummary | null>(null);
  const [filters, setFilters] = useState<ExpenseFilterParams>({ academic_year: academicYear });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, exps, disbs, monthly, budget] = await Promise.all([
        expensesService.getCategories(academicYear),
        expensesService.getExpenses(filters),
        expensesService.getDisbursementsRegister(),
        expensesService.getMonthlyExpenseStats(academicYear),
        expensesService.getBudgetConsumptionOverview(academicYear)
      ]);
      setCategories(cats);
      setExpenses(exps);
      setDisbursements(disbs);
      setMonthlyStats(monthly);
      setBudgetSummary(budget);
    } catch (err) {
      console.warn('[useExpenses] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [academicYear, filters]);

  useEffect(() => { load(); }, [load]);

  return {
    categories,
    expenses,
    disbursements,
    monthlyStats,
    budgetSummary,
    filters,
    setFilters,
    loading,
    refresh: load
  };
};