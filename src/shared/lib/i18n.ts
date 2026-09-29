import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import Arabic resources
import arCommon from '../locales/ar/common.json';
import arSidebar from '../locales/ar/sidebar.json';
import arFinance from '../locales/ar/finance.json';
import arPayroll from '../locales/ar/payroll.json';
import arServices from '../locales/ar/services.json';
import arSecurity from '../locales/ar/security.json';

// Import French resources
import frCommon from '../locales/fr/common.json';
import frSidebar from '../locales/fr/sidebar.json';
import frFinance from '../locales/fr/finance.json';
import frPayroll from '../locales/fr/payroll.json';
import frServices from '../locales/fr/services.json';
import frSecurity from '../locales/fr/security.json';

export const defaultNS = 'common';
export const resources = {
  ar: {
    common: arCommon,
    sidebar: arSidebar,
    finance: arFinance,
    payroll: arPayroll,
    services: arServices,
    security: arSecurity,
  },
  fr: {
    common: frCommon,
    sidebar: frSidebar,
    finance: frFinance,
    payroll: frPayroll,
    services: frServices,
    security: frSecurity,
  },
} as const;

export const STORAGE_KEY = 'aroua_audit_lang';

export const updateDocumentDirection = (lng: string) => {
  const isRtl = lng === 'ar' || lng.startsWith('ar');
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  document.documentElement.lang = isRtl ? 'ar' : 'fr';
};

const savedLang = localStorage.getItem(STORAGE_KEY) || 'ar';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'ar',
    defaultNS,
    ns: ['common', 'sidebar', 'finance', 'payroll', 'services', 'security'],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Set initial direction based on resolved language
updateDocumentDirection(i18n.language || savedLang);

// Listen to language changes
i18n.on('languageChanged', (lng: string) => {
  updateDocumentDirection(lng);
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // ignore
  }
});

export default i18n;
