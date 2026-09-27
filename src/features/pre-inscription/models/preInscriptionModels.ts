export interface PreInscriptionRecord {
  id: string;
  candidate_name: string;
  grade_level: string;
  parent_phone: string;
  application_date: string;
  application_fee: number;
  status: 'pending' | 'accepted' | 'rejected' | 'interview_scheduled';
}
