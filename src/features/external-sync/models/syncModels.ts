import { ExternalSyncMapping, SyncStatus } from '../../../shared/types';

export type { ExternalSyncMapping, SyncStatus };

export interface SyncOverview {
  totalMapped: number;
  syncedCount: number;
  pendingCount: number;
  conflictCount: number;
}
