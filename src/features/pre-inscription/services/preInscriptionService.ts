import { PreInscriptionRecord } from '../models/preInscriptionModels';

const demoCandidates: PreInscriptionRecord[] = [
  { id: 'pre-01', candidate_name: 'ياسين بنجلون', grade_level: 'السنة الأولى بكالوريا - علوم رياضية', parent_phone: '0661-234567', application_date: '2026-09-20', application_fee: 500, status: 'accepted' },
  { id: 'pre-02', candidate_name: 'آية المرابط', grade_level: 'الجذع المشترك العلمي', parent_phone: '0662-987654', application_date: '2026-09-22', application_fee: 500, status: 'interview_scheduled' },
  { id: 'pre-03', candidate_name: 'عمر التازي', grade_level: 'الثالثة إعدادي مسار دولي', parent_phone: '0663-554433', application_date: '2026-09-25', application_fee: 500, status: 'pending' }
];

export const preInscriptionService = {
  async getCandidates(): Promise<PreInscriptionRecord[]> {
    return demoCandidates;
  }
};
