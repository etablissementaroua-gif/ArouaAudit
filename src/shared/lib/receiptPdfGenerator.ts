import { formatMAD } from './currencyFormatter';
import { formatDateFR } from './dateUtils';

export interface FeeBreakdownItem {
  id: string;
  category: 'tuition' | 'transport' | 'canteen' | 'supplies' | 'registration' | 'other';
  labelAr: string;
  labelFr: string;
  period?: string;
  amountMAD: number;
}

export interface OfficialReceiptData {
  receiptNumber: string;
  date: string;
  studentName: string;
  massarCode: string;
  classroom: string;
  academicLevel: string;
  academicYear?: string;
  paymentFor: string;
  feeBreakdown?: FeeBreakdownItem[];
  amountMAD: number;
  paymentMethod: 'especes' | 'cheque' | 'virement' | 'carte';
  paymentReference?: string;
  bankName?: string;
  checkNumber?: string;
  checkDueDate?: string;
  parentName?: string;
  parentPhone?: string;
  remainingBalanceMAD?: number;
  notes?: string;
  cashierName?: string;
  qrSecurityHash?: string;
}

export interface OfficialPayslipData {
  slipNumber: string;
  month: string; // e.g. "2026-09"
  employeeName: string;
  employeeId: string;
  cin?: string;
  cnssNumber?: string;
  roleOrTitle: string;
  department: string;
  hireDate?: string;
  baseSalary: number;
  seniorityAllowance?: number;
  responsibilityAllowance?: number;
  grossSalary: number;
  advancesDeducted: number;
  creditDeducted: number;
  otherDeductions?: number;
  totalDeductions: number;
  netSalary: number;
  paymentMethod: 'virement' | 'especes' | 'cheque';
  paymentReference?: string;
  bankName?: string;
  rib?: string;
  dateIssued: string;
  cashierOrHrManager?: string;
  qrSecurityHash?: string;
}

export const INSTITUTION_INFO = {
  // Official Ministerial & Institutional Identifiers (Kingdom of Morocco)
  ministryAr: 'المملكة المغربية • وزارة التربية الوطنية والتعليم الأولي والرياضة',
  ministryFr: "ROYAUME DU MAROC • MINISTÈRE DE L'ÉDUCATION NATIONALE DU PRÉSCOLAIRE ET DES SPORTS",
  nameAr: 'مجموعة مدارس أروى للتعليم المدرسي الخصوصي',
  nameFr: 'GROUPE SCOLAIRE AROUA',
  subTitleAr: 'التعليم الأولي • الابتدائي • الثانوي الإعدادي',
  subTitleFr: 'Préscolaire • Primaire • Enseignement Secondaire Collégial',
  cyclesAr: 'حضانة - روض - ابتدائي - ثانوي إعدادي',
  
  // Official Legal, Tax & Accreditation Identifiers
  autorisationMen: '142/08',
  ice: '001524389000045',
  ifTax: '40285912',
  rc: '56789 Marrakech',
  cnss: '7894561',
  patente: '45218903',
  
  // Official Address & Communications
  address: 'سوكوما 1 رقم 2089، مراكش، المملكة المغربية',
  addressFr: 'Soukoma 1, N° 2089, Marrakech, Royaume du Maroc',
  phones: '05.24.49.76.38 / 07.07.77.75.10',
  email: 'etablissement.aroua@gmail.com',
  website: 'www.groupescolairearoua.ma',
  logoPath: '/assets/logo-aroua.png',
};

// Conversions in Moroccan Dirhams (Arabic)
const ONES_AR = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const TENS_AR = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const HUNDREDS_AR = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

const convertUnderThousandAr = (n: number): string => {
  if (n === 0) return '';
  const h = Math.floor(n / 100);
  const r = n % 100;

  const parts: string[] = [];
  if (h > 0) parts.push(HUNDREDS_AR[h]);

  if (r > 0) {
    if (r < 20) {
      parts.push(ONES_AR[r]);
    } else {
      const o = r % 10;
      const t = Math.floor(r / 10);
      if (o > 0) {
        parts.push(`${ONES_AR[o]} و ${TENS_AR[t]}`);
      } else {
        parts.push(TENS_AR[t]);
      }
    }
  }

  return parts.join(' و ');
};

export const numberToWordsMAD = (amount: number): string => {
  if (isNaN(amount) || amount === 0) return 'صفر درهم مغربي';

  const dirhams = Math.floor(Math.abs(amount));
  const centimes = Math.round((Math.abs(amount) - dirhams) * 100);

  const thousands = Math.floor(dirhams / 1000);
  const remainder = dirhams % 1000;

  const parts: string[] = [];

  if (thousands > 0) {
    if (thousands === 1) {
      parts.push('ألف');
    } else if (thousands === 2) {
      parts.push('ألفان');
    } else if (thousands >= 3 && thousands <= 10) {
      parts.push(`${ONES_AR[thousands]} آلاف`);
    } else {
      parts.push(`${convertUnderThousandAr(thousands)} ألف`);
    }
  }

  if (remainder > 0) {
    parts.push(convertUnderThousandAr(remainder));
  }

  const dirhamText = parts.length > 0 ? parts.join(' و ') : 'صفر';
  const centimesText = centimes > 0 ? ` و ${convertUnderThousandAr(centimes)} سنتيم` : '';

  return `${dirhamText} درهم مغربي${centimesText} فقط لا غير`;
};

// Conversions in Moroccan Dirhams (French)
const ONES_FR = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const TENS_FR = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];

const convertUnderHundredFr = (n: number): string => {
  if (n === 0) return '';
  if (n < 20) return ONES_FR[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (t === 7) return `soixante-${ONES_FR[10 + u]}`;
  if (t === 9) return `quatre-vingt-${ONES_FR[10 + u]}`;
  if (u === 1 && t < 8) return `${TENS_FR[t]}-et-un`;
  if (u > 0) return `${TENS_FR[t]}-${ONES_FR[u]}`;
  return TENS_FR[t];
};

const convertUnderThousandFr = (n: number): string => {
  if (n === 0) return '';
  const h = Math.floor(n / 100);
  const r = n % 100;
  let text = '';
  if (h === 1) text = 'cent';
  else if (h > 1) text = `${ONES_FR[h]} cent${r === 0 ? 's' : ''}`;

  if (r > 0) {
    const remText = convertUnderHundredFr(r);
    text = text ? `${text} ${remText}` : remText;
  }
  return text;
};

export const numberToWordsFrenchMAD = (amount: number): string => {
  if (isNaN(amount) || amount === 0) return 'Zéro Dirham Marocain';

  const dirhams = Math.floor(Math.abs(amount));
  const centimes = Math.round((Math.abs(amount) - dirhams) * 100);

  const thousands = Math.floor(dirhams / 1000);
  const remainder = dirhams % 1000;

  let text = '';
  if (thousands === 1) {
    text = 'mille';
  } else if (thousands > 1) {
    text = `${convertUnderThousandFr(thousands)} mille`;
  }

  if (remainder > 0) {
    const rem = convertUnderThousandFr(remainder);
    text = text ? `${text} ${rem}` : rem;
  }

  text = text ? `${text} Dirhams Marocains` : 'Zéro Dirham';
  if (centimes > 0) {
    text += ` et ${convertUnderHundredFr(centimes)} Centimes`;
  }

  return `${text.charAt(0).toUpperCase() + text.slice(1)} uniquement.`;
};

// Cryptographic Verification QR Payload
export const generateReceiptQRPayload = (receipt: OfficialReceiptData): string => {
  const hash = receipt.qrSecurityHash || `AROUA-SEC-${receipt.receiptNumber}-${Date.now().toString(36)}`;
  return `AROUA-RECEP|NO:${receipt.receiptNumber}|DATE:${receipt.date}|STUDENT:${receipt.studentName}|MASSAR:${receipt.massarCode}|AMT:${receipt.amountMAD}|PAY:${receipt.paymentMethod}|ICE:${INSTITUTION_INFO.ice}|AUTH:${hash}`;
};

export const generatePayslipQRPayload = (payslip: OfficialPayslipData): string => {
  const hash = payslip.qrSecurityHash || `AROUA-PAIE-${payslip.slipNumber}-${payslip.month}`;
  return `AROUA-PAYSLIP|NO:${payslip.slipNumber}|MOIS:${payslip.month}|EMP:${payslip.employeeName}|CIN:${payslip.cin || 'N/A'}|NET:${payslip.netSalary}|ICE:${INSTITUTION_INFO.ice}|AUTH:${hash}`;
};
