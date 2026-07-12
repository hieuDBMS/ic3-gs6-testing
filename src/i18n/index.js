import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import viCommon from './locales/vi.json';
import enCommon from './locales/en.json';
import viDashboard from './locales/vi.dashboard.json';
import enDashboard from './locales/en.dashboard.json';
import viExam from './locales/vi.exam.json';
import enExam from './locales/en.exam.json';
import viMockExam from './locales/vi.mockExam.json';
import enMockExam from './locales/en.mockExam.json';
import viPayment from './locales/vi.payment.json';
import enPayment from './locales/en.payment.json';
import viTeacherAdmin from './locales/vi.teacherAdmin.json';
import enTeacherAdmin from './locales/en.teacherAdmin.json';

const getInitialLanguage = () => {
  const stored = localStorage.getItem('ic3_lang');
  if (stored === 'vi' || stored === 'en') return stored;
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'vi';
};

/* Each page/feature area owns its own locale file (see docs/PATTERNS_AND_CONVENTIONS.md
   → i18n Pattern) so multiple areas can be translated independently without touching a
   shared file. They're merged here into one flat `translation` resource per language —
   t() calls stay unprefixed (e.g. t('dashboard.title')), no i18next namespaces involved. */
const vi = { ...viCommon, ...viDashboard, ...viExam, ...viMockExam, ...viPayment, ...viTeacherAdmin };
const en = { ...enCommon, ...enDashboard, ...enExam, ...enMockExam, ...enPayment, ...enTeacherAdmin };

i18next.use(initReactI18next).init({
  resources: { vi: { translation: vi }, en: { translation: en } },
  lng: getInitialLanguage(),
  fallbackLng: 'vi',
  interpolation: { escapeValue: false },
  returnObjects: true,
});

export default i18next;
