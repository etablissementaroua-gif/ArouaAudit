export interface StudentEnrollment {
  id: string;
  student_name: string;
  class_name: string;
  annual_tuition: number;
  paid_amount: number;
  remaining_amount: number;
  transport_active: boolean;
  canteen_active: boolean;
}
