// ArouaAudit — External Sync Bridge Service (Production Clean)
import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import { ExternalSyncMapping } from '../../../shared/types';
import {
  SyncBatch, PendingStudentRecord, PendingPaymentRecord,
  SyncProgress, SyncOverview, SyncAuditEntry
} from '../models/syncModels';

const localAuditLog: SyncAuditEntry[] = [];

export const syncService = {
  async getSyncStatus(): Promise<{
    isConnected: boolean;
    lastPing: string;
    supabaseOk: boolean;
    pendingBatchesCount: number;
  }> {
    const supabaseOk = isSupabaseConfigured();
    let pendingCount = 0;
    if (supabaseOk) {
      try {
        const { count } = await supabase
          .from('sync_batches')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        if (count !== null) pendingCount = count;
      } catch (_) {}
    }
    return {
      isConnected: supabaseOk,
      lastPing: new Date().toISOString(),
      supabaseOk,
      pendingBatchesCount: pendingCount,
    };
  },

  async getBatches(): Promise<SyncBatch[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await supabase
        .from('sync_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error || !data) return [];
      return data as SyncBatch[];
    } catch { return []; }
  },

  async fetchPendingStudentBatches(): Promise<PendingStudentRecord[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await supabase
        .from('pending_student_imports')
        .select('*')
        .eq('is_imported', false)
        .order('enrollment_date', { ascending: true });
      if (error || !data) return [];
      return data as PendingStudentRecord[];
    } catch { return []; }
  },

  async syncPendingPayments(): Promise<PendingPaymentRecord[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await supabase
        .from('pending_payment_imports')
        .select('*')
        .eq('is_imported', false)
        .order('payment_date', { ascending: true });
      if (error || !data) return [];
      return data as PendingPaymentRecord[];
    } catch { return []; }
  },

  async triggerBatchImport(
    batchId: string,
    onProgress?: (progress: SyncProgress) => void
  ): Promise<{ success: boolean; imported: number; failed: number; errors: string[] }> {
    if (!isSupabaseConfigured()) {
      return { success: false, imported: 0, failed: 0, errors: ['Supabase غير متصل'] };
    }

    const errors: string[] = [];
    let imported = 0;
    let failed = 0;

    // Get batch info
    const { data: batchData } = await supabase
      .from('sync_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    const entityType = batchData?.entity_type || 'student';
    const records: any[] = entityType === 'student'
      ? await this.fetchPendingStudentBatches()
      : await this.syncPendingPayments();

    const total = records.length;

    onProgress?.({ batchId, phase: 'fetching', processedCount: 0, totalCount: total, percentage: 0 });
    await new Promise(r => setTimeout(r, 300));
    onProgress?.({ batchId, phase: 'validating', processedCount: 0, totalCount: total, percentage: 5 });
    await new Promise(r => setTimeout(r, 200));

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const idKey = entityType === 'student'
        ? (record as PendingStudentRecord).massar_code
        : (record as PendingPaymentRecord).external_ref;

      onProgress?.({
        batchId, phase: 'inserting',
        processedCount: i + 1, totalCount: total,
        percentage: Math.round(10 + ((i + 1) / total) * 75),
        currentRecord: idKey,
      });

      try {
        if (entityType === 'student') {
          const stu = record as PendingStudentRecord;
          await supabase.from('enrolled_students').upsert(
            { massar_code: stu.massar_code, full_name: stu.full_name, academic_level: stu.academic_level,
              guardian_name: stu.guardian_name, guardian_phone: stu.guardian_phone || null,
              total_due: stu.tuition_monthly * 10, total_paid: 0,
              transport_subscribed: stu.transport_subscribed, canteen_subscribed: stu.canteen_subscribed,
              enrollment_date: stu.enrollment_date, academic_year: '2026/2027',
              external_source_id: stu.external_source_id, source_platform: 'arouaschools' },
            { onConflict: 'massar_code' }
          );
        } else {
          const pay = record as PendingPaymentRecord;
          await supabase.from('caisse_transactions').upsert(
            { external_ref: pay.external_ref, transaction_date: pay.payment_date,
              type: 'encaissement', amount: pay.amount, payment_method: pay.payment_method,
              category: 'student_payment',
              description: 'استيراد دفعة: ' + pay.student_name,
              reference_number: pay.check_number || pay.external_ref },
            { onConflict: 'external_ref' }
          );
        }
        imported++;
      } catch (err: any) {
        failed++;
        errors.push(idKey + ': ' + (err?.message || 'خطأ'));
      }
    }

    onProgress?.({ batchId, phase: 'reconciling', processedCount: total, totalCount: total, percentage: 95 });
    await new Promise(r => setTimeout(r, 200));
    onProgress?.({ batchId, phase: 'done', processedCount: total, totalCount: total, percentage: 100 });

    await this.logSyncAudit({
      batch_id: batchId,
      action: failed === 0 ? 'IMPORT_SUCCESS' : failed < total ? 'PARTIAL_IMPORT' : 'IMPORT_FAILED',
      entity_type: entityType,
      records_count: imported,
      details: failed === 0
        ? 'تم استيراد ' + imported + ' سجل بنجاح'
        : 'استيراد جزئي: ' + imported + ' نجح / ' + failed + ' فشل',
      performed_by: 'مسؤول المزامنة',
    });

    return { success: failed === 0, imported, failed, errors };
  },

  async logSyncAudit(entry: Omit<SyncAuditEntry, 'id' | 'timestamp'>): Promise<void> {
    const full: SyncAuditEntry = { ...entry, id: 'sa-' + Date.now(), timestamp: new Date().toISOString() };
    localAuditLog.unshift(full);
    if (isSupabaseConfigured()) {
      try { await supabase.from('sync_audit_log').insert([full]); } catch (_) {}
    }
  },

  async getAuditLog(): Promise<SyncAuditEntry[]> {
    if (!isSupabaseConfigured()) return [...localAuditLog];
    try {
      const { data, error } = await supabase
        .from('sync_audit_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(30);
      if (!error && data && data.length > 0) return data as SyncAuditEntry[];
    } catch (_) {}
    return [...localAuditLog];
  },

  async getMappings(): Promise<ExternalSyncMapping[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await supabase
        .from('external_sync_mappings')
        .select('*')
        .order('last_synced_at', { ascending: false });
      if (!error && data) return data as ExternalSyncMapping[];
    } catch (_) {}
    return [];
  },

  calculateOverview(
    batches: SyncBatch[],
    mappings: ExternalSyncMapping[]
  ): SyncOverview {
    return {
      totalMapped:     mappings.length,
      syncedCount:     mappings.filter(m => m.sync_status === 'synced').length,
      pendingCount:    mappings.filter(m => m.sync_status === 'pending').length,
      conflictCount:   mappings.filter(m => m.sync_status === 'conflict').length,
      pendingBatches:  batches.filter(b => b.status === 'pending').length,
      lastSyncTimestamp: batches.find(b => b.completed_at)?.completed_at,
    };
  },
};
