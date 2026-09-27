import { StudentEnrollment } from '../models/enrollmentModels';

const demoStudents: StudentEnrollment[] = [
  { id: 'enr-01', student_name: 'حمزة الشرايبي', class_name: '2Bac SM-A', annual_tuition: 32000, paid_amount: 12000, remaining_amount: 20000, transport_active: true, canteen_active: true },
  { id: 'enr-02', student_name: 'ريم الفاسي', class_name: 'TC Sci-1', annual_tuition: 28000, paid_amount: 28000, remaining_amount: 0, transport_active: false, canteen_active: true },
  { id: 'enr-03', student_name: 'سامي الإدريسي', class_name: '3Collège-2', annual_tuition: 24000, paid_amount: 8000, remaining_amount: 16000, transport_active: true, canteen_active: false }
];

export const enrollmentService = {
  async getEnrollments(): Promise<StudentEnrollment[]> {
    return demoStudents;
  }
};
