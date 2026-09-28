import { formatMAD } from './currencyFormatter';
import { formatDateFR } from './dateUtils';

export interface OfficialReceiptData {
  receiptNumber: string;
  date: string;
  studentName: string;
  massarCode: string;
  classroom: string;
  academicLevel: string;
  paymentFor: string;
  amountMAD: number;
  paymentMethod: 'especes' | 'cheque' | 'virement' | 'carte';
  paymentReference?: string;
  parentName?: string;
  remainingBalanceMAD?: number;
  notes?: string;
  cashierName?: string;
}

export const INSTITUTION_INFO = {
  nameAr: 'مجموعة مدارس أروى للتعليم الخصوصي',
  cyclesAr: 'حضانة - روض - ابتدائي - ثانوي إعدادي',
  nameFr: 'Groupe Scolaire Aroua',
  address: 'سوكوما 1 رقم 2089، مراكش',
  phones: '05.24.49.76.38 / 07.07.77.75.10',
  email: 'etablissement.aroua@gmail.com',
  logoPath: '/assets/logo-aroua.png',
};

export const numberToWordsMAD = (amount: number): string => {
  const dirhams = Math.floor(amount);
  const centimes = Math.round((amount - dirhams) * 100);
  return `${dirhams.toLocaleString('fr-FR')} درهم مغربي ${centimes > 0 ? `و ${centimes} سنتيم` : 'فقط لا غير'}`;
};
