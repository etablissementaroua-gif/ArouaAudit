import { useState, useEffect, useCallback } from 'react';
import { syncService } from '../services/syncService';
import { ExternalSyncMapping, SyncOverview } from '../models/syncModels';

export const useSync = () => {
  const [mappings, setMappings] = useState<ExternalSyncMapping[]>([]);
  const [overview, setOverview] = useState<SyncOverview>({
    totalMapped: 0,
    syncedCount: 0,
    pendingCount: 0,
    conflictCount: 0
  });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await syncService.getMappings();
      setMappings(data);
      setOverview(syncService.calculateOverview(data));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { mappings, overview, loading, refresh: loadData };
};
