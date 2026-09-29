export { 
  arouaStaffSyncService, 
  arouaSchoolsExternalStaffRegistry, 
  fallbackStaffRegistry 
} from './arouaStaffSync.service';
import { arouaStaffSyncService } from './arouaStaffSync.service';
import { StaffSyncResult } from '../models/payroll.types';

export const staffSyncService = {
  syncStaffFromArouaSchools(): Promise<StaffSyncResult> {
    return arouaStaffSyncService.syncApprovedStaffFromArouaSchools();
  }
};
