import { CheckRecord, CheckStatus } from '../../../shared/types';

export type { CheckRecord, CheckStatus };

export interface CheckSummary {
  totalPending: number;
  totalEncaisse: number;
  totalRejete: number;
  overdueCount: number;
  totalCount: number;
}
