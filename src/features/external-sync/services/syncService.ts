import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import { ExternalSyncMapping, SyncOverview } from '../models/syncModels';

const demoSyncMappings: ExternalSyncMapping[] = [
  {
    id: 'sync-01',
    entity_type: 'student',
    local_id: 'std-1002',
    external_source_id: 'EXT-MASSAR-44910',
    sync_status: 'synced',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'sync-02',
    entity_type: 'staff',
    local_id: 'stf-0012',
    external_source_id: 'EXT-CNSS-889123',
    sync_status: 'synced',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'sync-03',
    entity_type: 'fee_schedule',
    local_id: 'fee-2026',
    external_source_id: 'EXT-MINISTRY-T26',
    sync_status: 'pending',
    last_synced_at: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

export const syncService = {
  async getMappings(): Promise<ExternalSyncMapping[]> {
    if (!isSupabaseConfigured()) return demoSyncMappings;
    try {
      const { data, error } = await supabase.from('external_sync_mappings').select('*').order('last_synced_at', { ascending: false });
      if (error || !data || data.length === 0) return demoSyncMappings;
      return data as ExternalSyncMapping[];
    } catch {
      return demoSyncMappings;
    }
  },

  calculateOverview(list: ExternalSyncMapping[]): SyncOverview {
    let syncedCount = 0;
    let pendingCount = 0;
    let conflictCount = 0;

    for (const item of list) {
      if (item.sync_status === 'synced') syncedCount++;
      else if (item.sync_status === 'pending') pendingCount++;
      else if (item.sync_status === 'conflict') conflictCount++;
    }

    return {
      totalMapped: list.length,
      syncedCount,
      pendingCount,
      conflictCount
    };
  }
};
