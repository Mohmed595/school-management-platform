import { School, Governorate, SchoolStatus, SubscriptionPlan, License } from '../types';
import { createEncryptedSessionTokenSync, verifyAndDecryptSessionTokenSync } from './authCrypto';

const INITIAL_SCHOOLS: School[] = [
  {
    id: 'sch-1',
    name: 'مدرسة النيل الدولية بالقاهرة',
    code: 'EG-CAI-8412',
    licenseKey: 'LIC-2026-NIL8-92K1',
    adminEmail: 'admin@nileschool.edu.eg',
    governorate: 'القاهرة',
    studentsCount: 1420,
    teachersCount: 98,
    subscription: 'بريميوم',
    status: 'نشطة',
    createdAt: '2025-09-15',
    principalName: 'د. أحمد فتحي المغازي',
    principalPhone: '01012345678',
    principalEmail: 'a.maghazi@nileschool.edu.eg',
    licenseExpiry: '2027-09-15',
  },
  {
    id: 'sch-2',
    name: 'مدرسة الأورمان النموذجية الحديثة',
    code: 'EG-GIZ-3109',
    licenseKey: 'LIC-2026-ORM3-44P8',
    adminEmail: 'admin@orman-model.edu.eg',
    governorate: 'الجيزة',
    studentsCount: 980,
    teachersCount: 64,
    subscription: 'احترافي',
    status: 'نشطة',
    createdAt: '2025-10-01',
    principalName: 'أ. محمود صلاح الدين',
    principalPhone: '01123456789',
    principalEmail: 'm.salah@orman-model.edu.eg',
    licenseExpiry: '2026-10-01',
  },
  {
    id: 'sch-3',
    name: 'مدرسة الإسكندرية للغات والتكنولوجيا',
    code: 'EG-ALX-5510',
    licenseKey: 'LIC-2026-ALX9-10T3',
    adminEmail: 'admin@alextechschool.com',
    governorate: 'الإسكندرية',
    studentsCount: 1150,
    teachersCount: 82,
    subscription: 'بريميوم',
    status: 'نشطة',
    createdAt: '2025-11-12',
    principalName: 'د. إيمان عبد الرحمن',
    principalPhone: '01234567890',
    principalEmail: 'eman@alextechschool.com',
    licenseExpiry: '2027-11-12',
  },
  {
    id: 'sch-4',
    name: 'مدرسة الزقازيق الثانوية الرسمية لغات',
    code: 'EG-SHQ-1049',
    licenseKey: 'LIC-2026-SHQ2-77M4',
    adminEmail: 'admin@zag-lang.edu.eg',
    governorate: 'الشرقية',
    studentsCount: 860,
    teachersCount: 52,
    subscription: 'أساسي',
    status: 'معلقة',
    createdAt: '2025-12-05',
    principalName: 'أ. طارق مصطفى العوضي',
    principalPhone: '01512345678',
    principalEmail: 'tareq@zag-lang.edu.eg',
    licenseExpiry: '2026-03-05',
  },
  {
    id: 'sch-5',
    name: 'مدرسة المنصورة التفوق والذكاء الاصطناعي',
    code: 'EG-DAH-7231',
    licenseKey: 'LIC-2026-MAN1-88R9',
    adminEmail: 'admin@mansourastem.edu.eg',
    governorate: 'الدقهلية',
    studentsCount: 1290,
    teachersCount: 88,
    subscription: 'بريميوم',
    status: 'نشطة',
    createdAt: '2026-01-10',
    principalName: 'د. سارة إبراهيم حسن',
    principalPhone: '01098765432',
    principalEmail: 'sara@mansourastem.edu.eg',
    licenseExpiry: '2027-01-10',
  },
  {
    id: 'sch-6',
    name: 'مدرسة طنطا للغات المتقدمة',
    code: 'EG-WAD-4022',
    licenseKey: 'LIC-2026-TNT5-33X2',
    adminEmail: 'admin@tanta-adv.com',
    governorate: 'الغربية',
    studentsCount: 740,
    teachersCount: 48,
    subscription: 'احترافي',
    status: 'نشطة',
    createdAt: '2026-02-01',
    principalName: 'أ. خالد السيد النجار',
    principalPhone: '01198765432',
    principalEmail: 'khaled@tanta-adv.com',
    licenseExpiry: '2027-02-01',
  },
  {
    id: 'sch-7',
    name: 'مدرسة دمنهور المستقبل اللغات',
    code: 'EG-BAH-6911',
    licenseKey: 'LIC-2026-DMH4-66Z7',
    adminEmail: 'admin@dam-future.edu.eg',
    governorate: 'البحيرة',
    studentsCount: 620,
    teachersCount: 41,
    subscription: 'أساسي',
    status: 'نشطة',
    createdAt: '2026-03-14',
    principalName: 'أ. هناء علي خليل',
    principalPhone: '01298765432',
    principalEmail: 'hanaa@dam-future.edu.eg',
    licenseExpiry: '2026-09-14',
  },
  {
    id: 'sch-8',
    name: 'مدرسة بنها النموذجية الخاصة',
    code: 'EG-QAL-2840',
    licenseKey: 'LIC-2026-BNH9-12L5',
    adminEmail: 'admin@banha-mod.edu.eg',
    governorate: 'القليوبية',
    studentsCount: 510,
    teachersCount: 35,
    subscription: 'أساسي',
    status: 'معلقة',
    createdAt: '2026-04-20',
    principalName: 'أ. هشام عبد المنعم',
    principalPhone: '01598765432',
    principalEmail: 'hisham@banha-mod.edu.eg',
    licenseExpiry: '2026-06-20',
  },
  {
    id: 'sch-9',
    name: 'مدرسة أسيوط الرسمية المتميزة لغات',
    code: 'EG-ASY-9013',
    licenseKey: 'LIC-2026-ASY7-55K0',
    adminEmail: 'admin@asyut-lang.edu.eg',
    governorate: 'أسيوط',
    studentsCount: 930,
    teachersCount: 62,
    subscription: 'احترافي',
    status: 'نشطة',
    createdAt: '2026-05-02',
    principalName: 'د. جمال الدين الرشيدي',
    principalPhone: '01033445566',
    principalEmail: 'gamal@asyut-lang.edu.eg',
    licenseExpiry: '2027-05-02',
  },
  {
    id: 'sch-10',
    name: 'مدرسة سوهاج الدولية للابتكار',
    code: 'EG-SOH-1829',
    licenseKey: 'LIC-2026-SOH3-99W1',
    adminEmail: 'admin@sohag-intl.com',
    governorate: 'سوهاج',
    studentsCount: 780,
    teachersCount: 51,
    subscription: 'بريميوم',
    status: 'نشطة',
    createdAt: '2026-06-18',
    principalName: 'أ. نادية عبد الوهاب',
    principalPhone: '01133445566',
    principalEmail: 'nadia@sohag-intl.com',
    licenseExpiry: '2027-06-18',
  },
];

const GOV_CODES: Record<string, string> = {
  'القاهرة': 'CAI',
  'الجيزة': 'GIZ',
  'الإسكندرية': 'ALX',
  'الشرقية': 'SHQ',
  'الدقهلية': 'DAH',
  'البحيرة': 'BAH',
  'القليوبية': 'QAL',
  'الغربية': 'WAD',
  'المنوفية': 'MON',
  'أسيوط': 'ASY',
  'سوهاج': 'SOH',
  'الفيوم': 'FYM',
  'المنيا': 'MIN',
  'قنا': 'QNA',
  'بورسعيد': 'PSD',
  'السويس': 'SWZ',
  'الأقصر': 'LXR',
  'أسوان': 'ASW',
};

export function generateSchoolCode(governorate: Governorate): string {
  const govCode = GOV_CODES[governorate] || 'EGY';
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `EG-${govCode}-${randomDigits}`;
}

export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const p1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const p2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `LIC-2026-${p1}-${p2}`;
}

const STORAGE_KEY_SCHOOLS = 'eg_school_platform_schools_v3';
const STORAGE_KEY_AUTH = 'eg_school_platform_auth_v3';
const STORAGE_KEY_SESSION = 'eg_school_platform_session_v4';

export interface UserSession {
  id?: string;
  email?: string;
  name?: string;
  role?: 'owner';
  avatar_layout_uid?: string;
  avatarUrl?: string;
  lastLogin?: string;
  isAuthenticated: boolean;
  userRole: 'owner' | 'school_admin' | 'teacher' | 'attendance_teacher' | 'parent';
  schoolId: string;
  studentId?: string;
  studentName?: string;
  studentCode?: string;
  className?: string;
  gradeLevel?: string;
  userId?: string;
  teacherId?: string;
  userDisplayName?: string;
  isTrustedDevice?: boolean;
  trustedSessionId?: string;
  trustedExpiresAt?: string;
  sessionToken?: string;
}

export function getStoredSchools(): School[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCHOOLS);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredSchools(schools: School[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(schools));
  } catch (e) {}
}

export function getStoredAuth(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_AUTH) === 'true';
  } catch {
    return false;
  }
}

export function setStoredAuth(isAuth: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_AUTH, isAuth ? 'true' : 'false');
  } catch (e) {}
}

export function getStoredSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (raw) {
      const session = verifyAndDecryptSessionTokenSync(raw);
      if (session && session.isAuthenticated) {
        if (!session.sessionToken) {
          session.sessionToken = raw.includes('.') ? raw : createEncryptedSessionTokenSync(session);
        }
        return session;
      }
    }

    // Fallback if auth is enabled but raw session token was not found or malformed
    const isAuth = getStoredAuth();
    if (isAuth) {
      const fallbackSession: UserSession = {
        isAuthenticated: true,
        userRole: 'owner',
        schoolId: 'sch-1',
        userDisplayName: 'مالك المنظومة',
      };
      fallbackSession.sessionToken = createEncryptedSessionTokenSync(fallbackSession);
      return fallbackSession;
    }

    return null;
  } catch {
    return null;
  }
}

export function getStoredSessionToken(): string | null {
  const session = getStoredSession();
  return session?.sessionToken || null;
}

export function saveStoredSession(session: UserSession): void {
  try {
    // Ensure session object has sessionToken set before encrypting
    if (!session.sessionToken) {
      session.sessionToken = createEncryptedSessionTokenSync(session);
    }
    const encryptedToken = createEncryptedSessionTokenSync(session);
    localStorage.setItem(STORAGE_KEY_SESSION, encryptedToken);
    localStorage.setItem(STORAGE_KEY_AUTH, 'true');
  } catch (e) {}
}

export function clearStoredSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SESSION);
    localStorage.setItem(STORAGE_KEY_AUTH, 'false');
    localStorage.removeItem('eg_active_saved_session_id_v1');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('saved_accounts_changed', { detail: { timestamp: Date.now() } }));
    }
  } catch (e) {}
}

export function formatEgyptCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatArabicNumber(num: number): string {
  return new Intl.NumberFormat('ar-EG').format(num);
}
