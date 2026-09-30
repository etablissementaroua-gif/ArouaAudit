import { useState, useEffect, useCallback } from 'react';
import { checksManagementService } from '../services/checksManagement.service';
import { CheckItem, CheckPortfolioStats } from '../models/check.types';

function computeStats(checks: CheckItem[]): CheckPortfolioStats {
  const stats: CheckPortfolioStats = {
    totalCount: checks.length,
    totalAmount: 0,
    inVaultCount: 0, inVaultAmount: 0,
    toDepositCount: 0, toDepositAmount: 0,
    depositedCount: 0, depositedAmount: 0,
    clearedCount: 0, clearedAmount: 0,
    rejectedCount: 0, rejectedAmount: 0
  };
  for (const c of checks) {
    const amt = Number(c.amount) || 0;
    stats.totalAmount += amt;
    if (c.status === 'en_portefeuille') { stats.inVaultCount++; stats.inVaultAmount += amt; }
    else if (c.status === 'a_deposer') { stats.toDepositCount++; stats.toDepositAmount += amt; }
    else if (c.status === 'remis') { stats.depositedCount++; stats.depositedAmount += amt; }
    else if (c.status === 'encaisse') { stats.clearedCount++; stats.clearedAmount += amt; }
    else if (c.status === 'rejete') { stats.rejectedCount++; stats.rejectedAmount += amt; }
  }
  return stats;
}

export const useChecks = () => {
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [stats, setStats] = useState<CheckPortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await checksManagementService.getChecksList();
      setChecks(data);
      setStats(computeStats(data));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  return { checks, stats, loading, refresh: loadData };
};
