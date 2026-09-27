import { StaffPayrollSlip, PayrollStatus } from '../../../shared/types';

export type { StaffPayrollSlip, PayrollStatus };

export interface PayrollSummary {
  totalSalariesNet: number;
  totalAvances: number;
  totalDepartedDebts: number;
  slipsCount: number;
}
