// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ArouaAudit — External Sync Bridge Service
// Handles idempotent import of students & payments from arouaschools
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import { ExternalSyncMapping, SyncStatus } from '../../../shared/types';
import {
  SyncBatch,
  PendingStudentRecord,
  PendingPaymentRecord,
  SyncProgress,
  SyncOverview,
  SyncAuditEntry,
  BatchStatus,
} from '../models/syncModels';

// ── Demo seed data ────────────────────────────────────────────
const DEMO_BATCHES: SyncBatch[] = [
  {
    id: 'batch-001',
    batch_ref: 'BATCH-2026-09-001',
    entity_type: 'student',
    source_system: 'arouaschools',
    total_records: 18,
    imported_records: 0,
    failed_records: 0,
    status: 'pending',
    created_at: new Date(Date.now() - 3_600_000).toISOString(),
  },
  {
    id: 'batch-002',
    batch_ref: 'BATCH-2026-09-002',
    entity_type: 'payment',
    source_system: 'arouaschools',
    total_records: 34,
    imported_records: 34,
    failed_records: 0,
    status: 'completed',
    created_at: new Date(Date.now() - 86_400_000).toISOString(),
    completed_at: new Date(Date.now() - 82_800_000).toISOString(),
  },
  {
    id: 'batch-003',
    batch_ref: 'BATCH-2026-09-003',
    entity_type: 'student',
    source_system: 'massar',
    total_records: 7,
    imported_records: 5,
    failed_records: 2,
    status: 'partial',
    created_at: new Date(Date.now() - 172_800_000).toISOString(),
    completed_at: new Date(Date.now() - 168_000_000).toISOString(),
  },
];

const DEMO_PENDING_STUDENTS: PendingStudentRecord[] = [
  { massar_code: 'G135802641', full_name: 'آدم العمراني', academic_level: 'CE1', guardian_name: 'يوسف العمراني', guardian_phone: '0661234567', tuition_monthly: 2050, transport_subscribed: true, canteen_subscribed: false, enrollment_date: '2026-09-01', external_source_id: 'fb-uid-stu-001' },
  { massar_code: 'G135802642', full_name: 'سارة الريفي', academic_level: 'CP', guardian_name: 'لطيفة الريفي', guardian_phone: '0662345678', tuition_monthly: 2000, transport_subscribed: false, canteen_subscribed: true, enrollment_date: '2026-09-01', external_source_id: 'fb-uid-stu-002' },
  { massar_code: 'G135802643', full_name: 'محمد نور الدين', academic_level: 'CE2', guardian_name: 'نور الدين البقالي', guardian_phone: '0663456789', tuition_monthly: 2100, transport_subscribed: true, canteen_subscribed: true, enrollment_date: '2026-09-02', external_source_id: 'fb-uid-stu-003' },
  { massar_code: 'G135802644', full_name: 'رقية المنصوري', academic_level: 'GS', guardian_name: 'عبد الرحمن المنصوري', guardian_phone: '0664567890', tuition_monthly: 1800, transport_subscribed: false, canteen_subscribed: false, enrollment_date: '2026-09-02', external_source_id: 'fb-uid-stu-004' },
  { massar_code: 'G135802645', full_name: 'إسلام الزيراوي', academic_level: '1AC', guardian_name: 'حسن الزيراوي', guardian_phone: '0665678901', tuition_monthly: 2400, transport_subscribed: true, canteen_subscribed: false, enrollment_date: '2026-09-03', external_source_id: 'fb-uid-stu-005' },
];

const DEMO_PENDING_PAYMENTS: PendingPaymentRecord[] = [
  { external_ref: 'pay-fb-001', massar_code: 'G135802641', student_name: 'آدم العمراني', amount: 2050, payment_method: 'especes', payment_date: '2026-09-05', is_imported: false },
  { external_ref: 'pay-fb-002', massar_code: 'G135802642', student_name: 'سارة الريفي', amount: 4000, payment_method: 'cheque', payment_date: '2026-09-06', check_number: 'CHQ-441892', bank_name: 'CIH', is_imported: false },
  { external_ref: 'pay-fb-003', massar_code: 'G135802643', student_name: 'محمد نور الدين', amount: 2100, payment_method: 'virement', payment_date: '2026-09-07', is_imported: false },
];

const DEMO_MAPPINGS: ExternalSyncMapping[] = [
  { id: 'sync-01', entity_type: 'student', local_id: 'std-1002', external_source_id: 'fb-uid-stu-001', sync_status: 'synced', last_synced_at: new Date().toISOString(), payload_hash: 'abc123' },
  { id: 'sync-02', entity_type: 'staff', local_id: 'stf-0012', external_source_id: 'EXT-CNSS-889123', sync_status: 'synced', last_synced_at: new Date().toISOString() },
  { id: 'sync-03', entity_type: 'fee_schedule', local_id: 'fee-2026', external_source_id: 'EXT-MINISTRY-T26', sync_status: 'pending', last_synced_at: new Date(Date.now() - 3_600_000 * 24).toISOString() },
];

// In-memory audit log for demo mode
const localAuditLog: SyncAuditEntry[] = [];

export const syncService = {
  // ── 1. Status & Overview ─────────────────────────────────────
  async getSyncStatus(): Promise<{
    isConnected: boolean;
    lastPing: string;
    supabaseOk: boolean;
    pendingBatchesCount: number;
  }> {
    const supabaseOk = isSupabaseConfigured();
    let pendingCount = DEMO_BATCHES.filter((b) => b.status === 'pending').length;
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
      isConnected: true,
      lastPing: new Date().toISOString(),
      supabaseOk,
      pendingBatchesCount: pendingCount,
    };
  },

  // ── 2. Batches ────────────────────────────────────────────────
  async getBatches(): Promise<SyncBatch[]> {
    if (!isSupabaseConfigured()) return [...DEMO_BATCHES];
    try {
      const { data, error } = await supabase
        .from('sync_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data && data.length > 0) return data as SyncBatch[];
    } catch (_) {}
    return [...DEMO_BATCHES];
  },

  // ── 3. Pending Records ────────────────────────────────────────
  async fetchPendingStudentBatches(): Promise<PendingStudentRecord[]> {
    if (!isSupabaseConfigured()) return [...DEMO_PENDING_STUDENTS];
    try {
      const { data, error } = await supabase
        .from('pending_student_imports')
        .select('*')
        .eq('is_imported', false)
        .order('enrollment_date', { ascending: true });
      if (!error && data && data.length > 0) return data as PendingStudentRecord[];
    } catch (_) {}
    return [...DEMO_PENDING_STUDENTS];
  },

  async syncPendingPayments(): Promise<PendingPaymentRecord[]> {
    if (!isSupabaseConfigured()) return [...DEMO_PENDING_PAYMENTS];
    try {
      const { data, error } = await supabase
        .from('pending_payment_imports')
        .select('*')
        .eq('is_imported', false)
        .order('payment_date', { ascending: true });
      if (!error && data && data.length > 0) return data as PendingPaymentRecord[];
    } catch (_) {}
    return [...DEMO_PENDING_PAYMENTS];
  },

  // ── 4. Idempotent Batch Import ─────────────────────────────────
  async triggerBatchImport(
    batchId: string,
    onProgress?: (progress: SyncProgress) => void
  ): Promise<{ success: boolean; imported: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;
    let failed = 0;

    const batch = DEMO_BATCHES.find((b) => b.id === batchId);
    const entityType = batch?.entity_type || 'student';
    const records: any[] =
      entityType === 'student'
        ? await this.fetchPendingStudentBatches()
        : await this.syncPendingPayments();

    const total = records.length;

    // Report start
    onProgress?.({
      batchId,
      phase: 'fetching',
      processedCount: 0,
      totalCount: total,
      percentage: 0,
    });

    await new Promise((r) => setTimeout(r, 500));

    // Validate phase
    onProgress?.({
      batchId,
      phase: 'validating',
      processedCount: 0,
      totalCount: total,
      percentage: 5,
    });

    await new Promise((r) => setTimeout(r, 400));

    // Insert phase — process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const idKey = entityType === 'student'
        ? (record as PendingStudentRecord).massar_code
        : (record as PendingPaymentRecord).external_ref;

      onProgress?.({
        batchId,
        phase: 'inserting',
        processedCount: i + 1,
        totalCount: total,
        percentage: Math.round(10 + ((i + 1) / total) * 75),
        currentRecord: idKey,
      });

      await new Promise((r) => setTimeout(r, 120)); // simulate latency

      if (isSupabaseConfigured()) {
        try {
          if (entityType === 'student') {
            const stu = record as PendingStudentRecord;
            // Idempotent: upsert on massar_code
            await supabase
              .from('enrolled_students')
              .upsert(
                {
                  massar_code: stu.massar_code,
                  full_name: stu.full_name,
                  academic_level: stu.academic_level,
                  guardian_name: stu.guardian_name,
                  guardian_phone: stu.guardian_phone || null,
                  total_due: stu.tuition_monthly * 10,
                  total_paid: 0,
                  transport_subscribed: stu.transport_subscribed,
                  canteen_subscribed: stu.canteen_subscribed,
                  enrollment_date: stu.enrollment_date,
                  academic_year: '2026/2027',
                  external_source_id: stu.external_source_id,
                  source_platform: 'arouaschools',
                },
                { onConflict: 'massar_code' }
              );
          } else {
            const pay = record as PendingPaymentRecord;
            // Idempotent: upsert on external_ref
            await supabase
              .from('caisse_transactions')
              .upsert(
                {
                  external_ref: pay.external_ref,
                  transaction_date: pay.payment_date,
                  type: 'encaissement',
                  amount: pay.amount,
                  payment_method: pay.payment_method,
                  category: 'student_payment',
                  description: 'استيراد دفعة خارجية: ' + pay.student_name,
                  reference_number: pay.check_number || pay.external_ref,
                },
                { onConflict: 'external_ref' }
              );
          }
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(idKey + ': ' + (err?.message || 'خطأ في الإدراج'));
        }
      } else {
        // Demo mode: simulate success
        imported++;
      }
    }

    // Reconcile phase
    onProgress?.({
      batchId,
      phase: 'reconciling',
      processedCount: total,
      totalCount: total,
      percentage: 95,
    });
    await new Promise((r) => setTimeout(r, 300));

    // Done
    onProgress?.({
      batchId,
      phase: 'done',
      processedCount: total,
      totalCount: total,
      percentage: 100,
    });

    // Write audit log
    await this.logSyncAudit({
      batch_id: batchId,
      action: failed === 0 ? 'IMPORT_SUCCESS' : failed < total ? 'PARTIAL_IMPORT' : 'IMPORT_FAILED',
      entity_type: entityType,
      records_count: imported,
      details: failed === 0
        ? `تم استيراد ${imported} سجل بنجاح دون أخطاء`
        : `استيراد جزئي: ${imported} نجح / ${failed} فشل`,
      performed_by: 'مسؤول المزامنة',
    });

    // Update batch status in demo
    const batchIdx = DEMO_BATCHES.findIndex((b) => b.id === batchId);
    if (batchIdx !== -1) {
      DEMO_BATCHES[batchIdx].imported_records = imported;
      DEMO_BATCHES[batchIdx].failed_records = failed;
      DEMO_BATCHES[batchIdx].status = failed === 0 ? 'completed' : failed < total ? 'partial' : 'failed';
      DEMO_BATCHES[batchIdx].completed_at = new Date().toISOString();
    }

    return { success: failed === 0, imported, failed, errors };
  },

  // ── 5. Audit Log ──────────────────────────────────────────────
  async logSyncAudit(entry: Omit<SyncAuditEntry, 'id' | 'timestamp'>): Promise<void> {
    const fullEntry: SyncAuditEntry = {
      ...entry,
      id: 'audit-sync-' + Date.now(),
      timestamp: new Date().toISOString(),
    };
    localAuditLog.unshift(fullEntry);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('sync_audit_log').insert([fullEntry]);
      } catch (_) {}
    }
  },

  async getAuditLog(): Promise<SyncAuditEntry[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('sync_audit_log')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(30);
        if (!error && data && data.length > 0) return data as SyncAuditEntry[];
      } catch (_) {}
    }
    return [...localAuditLog];
  },

  // ── 6. Legacy ─────────────────────────────────────────────────
  async getMappings(): Promise<ExternalSyncMapping[]> {
    if (!isSupabaseConfigured()) return DEMO_MAPPINGS;
    try {
      const { data, error } = await supabase
        .from('external_sync_mappings')
        .select('*')
        .order('last_synced_at', { ascending: false });
      if (!error && data && data.length > 0) return data as ExternalSyncMapping[];
    } catch (_) {}
    return DEMO_MAPPINGS;
  },

  calculateOverview(
    batches: SyncBatch[],
    mappings: ExternalSyncMapping[]
  ): import('../models/syncModels').SyncOverview {
    const pendingBatches = batches.filter((b) => b.status === 'pending').length;
    const synced = mappings.filter((m) => m.sync_status === 'synced').length;
    const pending = mappings.filter((m) => m.sync_status === 'pending').length;
    const conflict = mappings.filter((m) => m.sync_status === 'conflict').length;
    const lastBatch = batches.find((b) => b.completed_at);
    return {
      totalMapped: mappings.length,
      syncedCount: synced,
      pendingCount: pending,
      conflictCount: conflict,
      pendingBatches,
      lastSyncTimestamp: lastBatch?.completed_at,
    };
  },
};