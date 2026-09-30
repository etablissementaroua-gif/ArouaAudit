import { useState, useEffect, useCallback, useRef } from 'react';
import { syncService } from '../services/syncService';
import {
  SyncBatch,
  SyncOverview,
  SyncProgress,
  SyncAuditEntry,
  PendingStudentRecord,
  PendingPaymentRecord,
} from '../models/syncModels';
import { ExternalSyncMapping } from '../models/syncModels';

export const useSync = () => {
  const [batches, setBatches] = useState<SyncBatch[]>([]);
  const [mappings, setMappings] = useState<ExternalSyncMapping[]>([]);
  const [pendingStudents, setPendingStudents] = useState<PendingStudentRecord[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPaymentRecord[]>([]);
  const [auditLog, setAuditLog] = useState<SyncAuditEntry[]>([]);
  const [overview, setOverview] = useState<SyncOverview>({
    totalMapped: 0,
    syncedCount: 0,
    pendingCount: 0,
    conflictCount: 0,
    pendingBatches: 0,
  });
  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean;
    supabaseOk: boolean;
    pendingBatchesCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Import state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [syncErrors, setSyncErrors] = useState<string[]>([]);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(null);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [batchList, mapList, students, payments, audit, status] = await Promise.all([
        syncService.getBatches(),
        syncService.getMappings(),
        syncService.fetchPendingStudentBatches(),
        syncService.syncPendingPayments(),
        syncService.getAuditLog(),
        syncService.getSyncStatus(),
      ]);
      setBatches(batchList);
      setMappings(mapList);
      setPendingStudents(students);
      setPendingPayments(payments);
      setAuditLog(audit);
      setOverview(syncService.calculateOverview(batchList, mapList));
      setConnectionStatus(status);
    } catch (err) {
      console.warn('[useSync] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Trigger batch import with live progress ────────────────────
  const triggerBatchImport = useCallback(async (batchId: string) => {
    if (isSyncing) return;
    setIsSyncing(true);
    setActiveBatchId(batchId);
    setSyncErrors([]);
    setSyncProgress({ batchId, phase: 'fetching', processedCount: 0, totalCount: 0, percentage: 0 });

    try {
      const result = await syncService.triggerBatchImport(batchId, (progress) => {
        setSyncProgress({ ...progress });
      });

      setSyncErrors(result.errors);
      setLastSyncTimestamp(new Date().toISOString());

      // Refresh all data after import
      await loadData();
    } catch (err: any) {
      setSyncErrors([err?.message || 'خطأ غير متوقع أثناء المزامنة']);
    } finally {
      setIsSyncing(false);
      setActiveBatchId(null);
      // Keep progress visible for 2 seconds then clear
      setTimeout(() => setSyncProgress(null), 2500);
    }
  }, [isSyncing, loadData]);

  return {
    // Data
    batches,
    mappings,
    pendingStudents,
    pendingPayments,
    auditLog,
    overview,
    connectionStatus,
    loading,
    // Import
    isSyncing,
    syncProgress,
    syncErrors,
    lastSyncTimestamp,
    activeBatchId,
    // Actions
    refresh: loadData,
    triggerBatchImport,
  };
};