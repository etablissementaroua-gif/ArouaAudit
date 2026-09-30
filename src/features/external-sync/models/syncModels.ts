import { ExternalSyncMapping, SyncStatus } from '../../../shared/types';

export type { ExternalSyncMapping, SyncStatus };

export type BatchEntityType = 'student' | 'staff' | 'fee_schedule' | 'payment';

export type BatchStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'partial';

export interface SyncBatch {
  id: string;
  batch_ref: string;               // e.g. 'BATCH-2026-09-001'
  entity_type: BatchEntityType;
  source_system: string;           // 'arouaschools' | 'firebase' | 'massar'
  source_url?: string;
  total_records: number;
  imported_records: number;
  failed_records: number;
  status: BatchStatus;
  error_log?: string;
  created_at: string;
  completed_at?: string;
}

export interface PendingStudentRecord {
  massar_code: string;             // Idempotency key
  full_name: string;
  academic_level: string;
  guardian_name: string;
  guardian_phone?: string;
  tuition_monthly: number;
  transport_subscribed: boolean;
  canteen_subscribed: boolean;
  enrollment_date: string;
  external_source_id: string;     // Firebase UID
}

export interface PendingPaymentRecord {
  external_ref: string;           // Firebase payment UID
  massar_code: string;            // Links to student
  student_name: string;
  amount: number;
  payment_method: 'especes' | 'cheque' | 'virement';
  payment_date: string;
  check_number?: string;
  bank_name?: string;
  is_imported: boolean;
}

export interface SyncProgress {
  batchId: string;
  phase: 'fetching' | 'validating' | 'inserting' | 'reconciling' | 'done' | 'error';
  processedCount: number;
  totalCount: number;
  percentage: number;
  currentRecord?: string;
  errorMessage?: string;
}

export interface SyncOverview {
  totalMapped: number;
  syncedCount: number;
  pendingCount: number;
  conflictCount: number;
  pendingBatches: number;
  lastSyncTimestamp?: string;
}

export interface SyncAuditEntry {
  id: string;
  batch_id: string;
  action: 'IMPORT_SUCCESS' | 'IMPORT_FAILED' | 'PARTIAL_IMPORT' | 'CONFLICT_DETECTED' | 'SYNC_STARTED';
  entity_type: BatchEntityType;
  records_count: number;
  details: string;
  performed_by: string;
  timestamp: string;
}