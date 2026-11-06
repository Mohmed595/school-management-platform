import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import {
  GraduationCap,
  Building2,
  UserCheck,
  ShieldCheck,
  BookOpen,
  ArrowLeft,
  Sparkles,
  School as SchoolIcon,
  User,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  Lock,
  Smartphone,
  Star,
  Layers,
  Award,
  Users,
  BarChart3,
  Check,
  Send,
  Bell,
  Calendar,
  Search,
  MessageSquare,
  FileText,
  TrendingUp,
  Globe,
  Mail,
  ChevronDown,
  Crown,
  Download,
  Eye,
  EyeOff,
  LifeBuoy,
  Trophy,
  HelpCircle,
  Zap,
  Clock,
  ShieldAlert,
  CalendarCheck,
} from 'lucide-react';
import { SupportCenterPage } from '../public-pages/SupportCenterPage';
import { PrivacyAndCookiesPage } from '../public-pages/PrivacyAndCookiesPage';
import { TermsAndConditionsPage } from '../public-pages/TermsAndConditionsPage';
import { FaqPage } from '../public-pages/FaqPage';
import { ChangelogPage } from '../public-pages/ChangelogPage';
import { AboutCompanyPage } from '../public-pages/AboutCompanyPage';
import { ContactUsPage } from '../public-pages/ContactUsPage';
import { BlogPage } from '../public-pages/BlogPage';
import { CareersPage } from '../public-pages/CareersPage';
import { PartnersPage } from '../public-pages/PartnersPage';

export type PublicPageType =
  | 'support'
  | 'privacy'
  | 'terms'
  | 'faq'
  | 'changelog'
  | 'about'
  | 'contact'
  | 'blog'
  | 'careers'
  | 'partners';

import { usePWAInstall } from '../../hooks/usePWAInstall';
import { School } from '../../types';
import { getStoredSchools } from '../../lib/storage';
import { fetchSchoolsApi, staffLoginApi, studentLoginApi, ownerLoginApi } from '../../lib/schoolApi';
import { loginStudentByNamePhoneCode, syncParentDataToLocalStorage } from '../../lib/parentStorage';
import { authenticateStaffAccount, saveTeacher, saveStudent, cacheSchoolDetails } from '../../lib/adminStorage';
import { UserSession, saveStoredSession, setStoredAuth } from '../../lib/storage';
import {
  getSavedAccounts,
  saveTrustedAccount,
  getOrCreateDeviceId,
  removeSavedAccount,
  removeAllSavedAccounts,
} from '../../lib/trustedDeviceStorage';
import { SavedAccountItem } from '../../types/auth';
import { AccountSwitcherModal } from './AccountSwitcherModal';
import { TrustedDeviceModal } from './TrustedDeviceModal';
import { AccountSwitcherButton } from './AccountSwitcherButton';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { getUserAvatarLayoutUid } from '../../lib/avatarLayouts';


interface StartLandingLoginProps {
  onLoginSuccess: (session: UserSession) => void;
}

type AdminTab = 'admin' | 'teacher' | 'attendance';

// Animated Counter Hook Component
function AnimatedStatNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000; // 2 seconds
    const frameTime = 1000 / 60;
    const totalFrames = Math.round(duration / frameTime);
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      // Ease out quad formula
      const current = Math.round(value * (1 - (1 - progress) * (1 - progress)));
      setCount(current);

      if (frame >= totalFrames) {
        setCount(value);
        clearInterval(timer);
      }
    }, frameTime);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref} className="font-black">
      {count.toLocaleString('ar-EG')}
      {suffix}
    </span>
  );
}

export function StartLandingLogin({ onLoginSuccess }: StartLandingLoginProps) {
  const { isInstalled, isStandalone, install: executePwaInstall, openApp, isIframe } = usePWAInstall();
  const [pwaInstallNotice, setPwaInstallNotice] = useState<string | null>(null);
  const [isInstallPromptModalOpen, setIsInstallPromptModalOpen] = useState<boolean>(false);
  const [isOpenAppGuidanceModalOpen, setIsOpenAppGuidanceModalOpen] = useState<boolean>(false);

  const handlePwaInstall = async () => {
    setPwaInstallNotice(null);
    const result = await executePwaInstall();
    if (result.triggeredNativePrompt && result.accepted) {
      return;
    }
    // If native prompt was not triggered or dismiss, show easy step-by-step installation instructions
    setIsOpenAppGuidanceModalOpen(true);
  };

  const handleStartNowClick = () => {
    if (!isInstalled && !isStandalone) {
      setIsInstallPromptModalOpen(true);
    } else {
      setIsStudentModalOpen(true);
    }
  };

  const [schools, setSchools] = useState<School[]>(() => getStoredSchools());

  // Trusted Device & Saved Accounts State
  const [trustThisDevice, setTrustThisDevice] = useState<boolean>(true);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccountItem[]>([]);
  const [isSwitcherModalOpen, setIsSwitcherModalOpen] = useState<boolean>(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState<boolean>(false);
  const [isSwitching, setIsSwitching] = useState<boolean>(false);

  // Dedicated Public Pages State
  const [currentPublicPage, setCurrentPublicPage] = useState<PublicPageType | null>(null);

  // Interactive Hero Role Showcase State
  const [heroSimulatedRole, setHeroSimulatedRole] = useState<'admin' | 'teacher' | 'parent' | 'student'>('admin');
  const [mockAttendance, setMockAttendance] = useState<{ [id: string]: 'present' | 'late' | 'absent' }>({
    's1': 'present',
    's2': 'present',
    's3': 'late',
  });
  const [mockBehaviorBonus, setMockBehaviorBonus] = useState<number>(0);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);
  const [featureFilter, setFeatureFilter] = useState<'all' | 'admin' | 'teacher' | 'parent'>('all');

  const refreshAccounts = () => {
    setSavedAccounts(getSavedAccounts());
  };

  useEffect(() => {
    refreshAccounts();
    fetchSchoolsApi()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSchools(data);
        }
      })
      .catch(() => {
        const cached = getStoredSchools();
        if (cached && cached.length > 0) {
          setSchools(cached);
        }
      });

    const handleUpdate = () => {
      refreshAccounts();
    };

    window.addEventListener('saved_accounts_changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('saved_accounts_changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleSelectSavedAccount = async (target: SavedAccountItem) => {
    setIsSwitching(true);
    try {
      const response = await fetch('/api/auth/switch-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetSessionId: target.sessionId,
          sessionToken: target.sessionToken,
          deviceId: getOrCreateDeviceId(),
          accountMeta: {
            userId: target.userId,
            userRole: target.userRole,
            schoolId: target.schoolId,
            schoolName: target.schoolName,
            studentId: target.studentId,
            studentName: target.studentName,
            studentCode: target.studentCode,
            className: target.className,
            userDisplayName: target.userDisplayName,
            avatarUid: target.avatarUid,
          },
        }),
      });

      const data = await response.json();
      const effectiveRole = (data.success && data.session?.userRole) ? data.session.userRole : target.userRole;
      const effectiveSchoolId = (data.success && data.session?.schoolId) ? data.session.schoolId : target.schoolId;
      const isTeacher = effectiveRole === 'teacher' || effectiveRole === 'attendance_teacher';
      const isParent = effectiveRole === 'parent';

      const session: UserSession = {
        isAuthenticated: true,
        userRole: effectiveRole,
        schoolId: effectiveSchoolId,
        studentId: isParent ? (data.session?.studentId || target.studentId || target.userId) : undefined,
        studentName: (data.session?.studentName || target.studentName),
        studentCode: (data.session?.studentCode || target.studentCode),
        className: (data.session?.className || target.className),
        teacherId: isTeacher ? (data.session?.userId || target.userId) : undefined,
        userDisplayName: (data.session?.userDisplayName || target.userDisplayName),
        avatar_layout_uid: (data.session?.avatarUid || target.avatarUid),
        isTrustedDevice: true,
        trustedSessionId: data.session?.sessionId || target.sessionId,
        trustedExpiresAt: data.session?.expiresAt || target.expiresAt,
        sessionToken: data.sessionToken || target.sessionToken,
      };

      saveStoredSession(session);
      setStoredAuth(true);

      saveTrustedAccount({
        ...target,
        sessionToken: data.sessionToken || target.sessionToken,
        lastUsedAt: new Date().toISOString(),
        isCurrent: true,
      });

      setIsSwitcherModalOpen(false);
      onLoginSuccess(session);
    } catch (e) {
      console.error('Failed to switch account:', e);
      const effectiveRole = target.userRole;
      const isTeacher = effectiveRole === 'teacher' || effectiveRole === 'attendance_teacher';
      const isParent = effectiveRole === 'parent';

      const session: UserSession = {
        isAuthenticated: true,
        userRole: effectiveRole,
        schoolId: target.schoolId,
        studentId: isParent ? (target.studentId || target.userId) : undefined,
        studentName: target.studentName,
        studentCode: target.studentCode,
        className: target.className,
        teacherId: isTeacher ? target.userId : undefined,
        userDisplayName: target.userDisplayName,
        avatar_layout_uid: target.avatarUid,
        isTrustedDevice: true,
        trustedSessionId: target.sessionId,
        trustedExpiresAt: target.expiresAt,
        sessionToken: target.sessionToken,
      };
      saveStoredSession(session);
      setStoredAuth(true);
      setIsSwitcherModalOpen(false);
      onLoginSuccess(session);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleRemoveSavedAccount = async (sessionId: string) => {
    await removeSavedAccount(sessionId);
    refreshAccounts();
  };

  const handleLogoutAllAccounts = async () => {
    await removeAllSavedAccounts();
    localStorage.removeItem('eg_school_platform_session_v4');
    setStoredAuth(false);
    refreshAccounts();
  };

  // Mouse parallax position state for Hero Mockup
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Student Form State (Name / Ministry Code / National ID) - Blank by default
  const [studentName, setStudentName] = useState<string>('');
  const [ministryCode, setMinistryCode] = useState<string>('');
  const [nationalId, setNationalId] = useState<string>('');
  const [studentError, setStudentError] = useState<string>('');
  const [isNotFoundModalOpen, setIsNotFoundModalOpen] = useState<boolean>(false);

  // Modals
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false);
  const [selectedAdminTab, setSelectedAdminTab] = useState<AdminTab>('admin');

  // Admin Login Inputs
  const [adminSchoolCode, setAdminSchoolCode] = useState<string>('');
  const [adminLicenseCode, setAdminLicenseCode] = useState<string>('');
  const [adminError, setAdminError] = useState<string>('');

  // Staff (Teacher / Attendance) Inputs - Blank by default
  const [staffUsername, setStaffUsername] = useState<string>('');
  const [staffPassword, setStaffPassword] = useState<string>('');
  const [showStaffPassword, setShowStaffPassword] = useState<boolean>(false);
  const [staffError, setStaffError] = useState<string>('');

  // Loading states for submit buttons
  const [isStudentLoginLoading, setIsStudentLoginLoading] = useState<boolean>(false);
  const [isAdminLoginLoading, setIsAdminLoginLoading] = useState<boolean>(false);
  const [isStaffLoginLoading, setIsStaffLoginLoading] = useState<boolean>(false);

  // Newsletter Email State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Hero Mouse move handler for interactive parallax 3D tilt
  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleHeroMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  // Student Login Handler (Name / Ministry Code / National ID)
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    if (!studentName.trim()) {
      setStudentError('يرجى كتابة اسم الطالب للمتابعة');
      return;
    }
    if (!ministryCode.trim()) {
      setStudentError('يرجى كتابة كود الوزارة للمتابعة');
      return;
    }
    if (!nationalId.trim()) {
      setStudentError('يرجى كتابة الرقم القومي للطالب للمتابعة');
      return;
    }

    setIsStudentLoginLoading(true);
    try {
      const deviceId = getOrCreateDeviceId();
      const result = await studentLoginApi({
        studentName: studentName.trim(),
        ministryCode: ministryCode.trim(),
        nationalId: nationalId.trim(),
        deviceId,
        trustDevice300Days: trustThisDevice,
      });

      if (!result.success || !result.student || !result.parentData) {
        setStudentError(result.error || 'لم يتم العثور على حساب الطالب بالبيانات المدخلة.');
        setIsNotFoundModalOpen(true);
        return;
      }

      const parentData = result.parentData;
      syncParentDataToLocalStorage(parentData);
      const sessionToken = result.sessionToken || '';
      const sessionId = result.sessionId || `tds_${Date.now().toString(36)}`;
      const expiresAt = result.expiresAt || new Date(Date.now() + (trustThisDevice ? 300 : 1) * 24 * 60 * 60 * 1000).toISOString();

      // Check if the student's school is suspended
      const studentSchoolId = parentData.schoolInfo?.schoolId || result.student.schoolId;
      const targetSchool = schools.find((s) => s.id === studentSchoolId);
      if (targetSchool && targetSchool.status === 'معلقة') {
        setStudentError('عفواً، هذه المدرسة معلقة حالياً وموقوفة عن العمل مؤقتاً. يرجى التواصل مع إدارة المدرسة أو مالك المنظومة.');
        return;
      }

      if (trustThisDevice) {
        saveTrustedAccount({
          sessionId,
          sessionToken,
          deviceId,
          userId: parentData.student.id,
          userRole: 'parent',
          userDisplayName: parentData.student.name,
          schoolId: studentSchoolId,
          schoolName: parentData.schoolInfo?.name || targetSchool?.name,
          studentId: parentData.student.id,
          studentName: parentData.student.name,
          studentCode: parentData.student.studentCode,
          className: parentData.student.className,
          avatarUid: parentData.student.avatar_layout_uid,
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          expiresAt,
          remainingDays: 300,
          isCurrent: true,
        });
      }

      const session: UserSession = {
        isAuthenticated: true,
        userRole: 'parent',
        schoolId: studentSchoolId,
        studentId: parentData.student.id,
        studentName: parentData.student.name,
        studentCode: parentData.student.studentCode,
        className: parentData.student.className,
        userDisplayName: parentData.student.name,
        avatar_layout_uid: parentData.student.avatar_layout_uid,
        isTrustedDevice: trustThisDevice,
        trustedSessionId: trustThisDevice ? sessionId : undefined,
        trustedExpiresAt: trustThisDevice ? expiresAt : undefined,
        sessionToken,
      };

      saveStoredSession(session);
      setStoredAuth(true);
      onLoginSuccess(session);
    } catch (err: any) {
      setStudentError(err?.message || 'تعذر الاتصال بالخادم الرئيسي لتسجيل الدخول');
      setIsNotFoundModalOpen(true);
    } finally {
      setIsStudentLoginLoading(false);
    }
  };

  // Admin Login Handler (Strict Server-Verified Authentication - Secret Owner Login Supported)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    const cleanCode = (adminSchoolCode || '').trim();
    const cleanLicense = (adminLicenseCode || '').trim();

    if (!cleanCode || !cleanLicense) {
      setAdminError('يرجى كتابة كود المدرسة وكود الترخيص المعتمد معاً للدخول.');
      return;
    }

    setIsAdminLoginLoading(true);
    const deviceId = getOrCreateDeviceId();

    try {
      // 1. Authenticate against central backend API endpoint
      const res = await fetch('/api/auth/school-admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolCode: cleanCode,
          licenseKey: cleanLicense,
          trustDevice300Days: trustThisDevice,
          deviceId,
        }),
      });

      const authData = await res.json();

      if (authData.success) {
        const sessionToken = authData.sessionToken || '';
        const sessionId = authData.sessionId || `tds_${Date.now().toString(36)}`;
        const expiresAt = authData.expiresAt || new Date(Date.now() + (trustThisDevice ? 300 : 1) * 24 * 60 * 60 * 1000).toISOString();
        const userRole = authData.userRole || 'school_admin';
        const isOwner = userRole === 'owner';

        if (trustThisDevice) {
          saveTrustedAccount({
            sessionId,
            sessionToken,
            deviceId,
            userId: isOwner ? 'owner_master' : (authData.schoolId || 'sch-1'),
            userRole,
            userDisplayName: authData.userDisplayName || (isOwner ? 'مالك المنظومة' : authData.schoolName),
            schoolId: authData.schoolId || 'sch-1',
            schoolName: authData.schoolName || (isOwner ? 'المنظومة المركزية' : 'إدارة المدرسة'),
            createdAt: new Date().toISOString(),
            lastUsedAt: new Date().toISOString(),
            expiresAt,
            remainingDays: 300,
            isCurrent: true,
          });
        }

        if (!isOwner && authData.schoolId) {
          cacheSchoolDetails({
            schoolId: authData.schoolId,
            name: authData.schoolName || cleanCode,
            code: authData.schoolCode || cleanCode,
            licenseKey: authData.licenseKey || cleanLicense,
            governorate: authData.governorate,
            principalName: authData.principalName,
            phone: authData.phone,
            email: authData.email,
            academicYear: authData.academicYear,
          });
        }

        const session: UserSession = {
          isAuthenticated: true,
          userRole,
          schoolId: authData.schoolId || 'sch-1',
          userDisplayName: authData.userDisplayName || (isOwner ? 'مالك المنظومة' : authData.schoolName),
          isTrustedDevice: trustThisDevice,
          trustedSessionId: trustThisDevice ? sessionId : undefined,
          trustedExpiresAt: trustThisDevice ? expiresAt : undefined,
          sessionToken,
        };

        saveStoredSession(session);
        setStoredAuth(true);
        onLoginSuccess(session);
        return;
      } else {
        setAdminError(authData.error || 'كود المدرسة أو كود الترخيص غير صحيح. يرجى التأكد وإعادة المحاولة.');
      }
    } catch (apiErr: any) {
      console.error('API school admin login error:', apiErr);
      setAdminError('تعذر الاتصال بالخادم الرئيسي للتحقق من ترخيص المدرسة.');
    } finally {
      setIsAdminLoginLoading(false);
    }
  };

  // Staff Login Handler (Connected to Central Database - No School Selection Required)
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');

    if (!staffUsername.trim() || !staffPassword.trim()) {
      setStaffError(selectedAdminTab === 'teacher' ? 'يرجى إدخال الاسم وكلمة المرور' : 'يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setIsStaffLoginLoading(true);
    const role = selectedAdminTab === 'attendance' ? 'attendance' : 'teacher';
    const deviceId = getOrCreateDeviceId();

    try {
      // 1. Authenticate against central PostgreSQL database
      const result = await staffLoginApi({
        username: staffUsername,
        password: staffPassword,
        role,
        deviceId,
        trustDevice300Days: trustThisDevice,
      });

      if (result.success && result.teacher) {
        const teacherAccount = result.teacher;
        const assignedSchoolId = teacherAccount.schoolId;
        const targetSchool = schools.find((s) => s.id === assignedSchoolId);

        if (targetSchool && targetSchool.status === 'معلقة') {
          setStaffError('عفواً، هذه المدرسة معلقة حالياً وموقوفة عن العمل مؤقتاً. يرجى التواصل مع مالك المنظومة.');
          return;
        }

        saveTeacher(teacherAccount); // Cache locally for rendering

        const sessionRole = result.userRole || (role === 'attendance' ? 'attendance_teacher' : 'teacher');
        const sessionToken = result.sessionToken || '';
        const sessionId = result.sessionId || `tds_${Date.now().toString(36)}`;
        const expiresAt = result.expiresAt || new Date(Date.now() + (trustThisDevice ? 300 : 1) * 24 * 60 * 60 * 1000).toISOString();

        if (trustThisDevice) {
          saveTrustedAccount({
            sessionId,
            sessionToken,
            deviceId,
            userId: teacherAccount.id,
            userRole: sessionRole,
            userDisplayName: teacherAccount.name,
            schoolId: assignedSchoolId,
            schoolName: result.schoolName || targetSchool?.name,
            createdAt: new Date().toISOString(),
            lastUsedAt: new Date().toISOString(),
            expiresAt,
            remainingDays: 300,
            isCurrent: true,
          });
        }

        const session: UserSession = {
          isAuthenticated: true,
          userRole: sessionRole,
          schoolId: assignedSchoolId,
          teacherId: teacherAccount.id,
          userDisplayName: teacherAccount.name,
          isTrustedDevice: trustThisDevice,
          trustedSessionId: trustThisDevice ? sessionId : undefined,
          trustedExpiresAt: trustThisDevice ? expiresAt : undefined,
          sessionToken,
        };

        saveStoredSession(session);
        setStoredAuth(true);
        onLoginSuccess(session);
        return;
      } else {
        if (role === 'attendance') {
          setStaffError(
            result.error ||
            result.message ||
            'لم يتم العثور على حساب محضر الغياب بهذا الاسم وكلمة المرور.'
          );
        } else {
          setStaffError(result.error || result.message || 'اسم المستخدم أو كلمة المرور غير صحيحة.');
        }
      }
    } catch (apiErr: any) {
      console.error('Central staff login error:', apiErr);
      setStaffError(apiErr?.message || 'تعذر الاتصال بالخادم الرئيسي لتسجيل الدخول.');
    } finally {
      setIsStaffLoginLoading(false);
    }
  };


  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSubscribed(true);
      setTimeout(() => setNewsletterSubscribed(false), 4000);
      setNewsletterEmail('');
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBackToHome = () => {
    setCurrentPublicPage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigatePublicPage = (pageId: string) => {
    setCurrentPublicPage(pageId as PublicPageType);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dedicated Pages Render (Outside the landing area)
  if (currentPublicPage === 'support') {
    return <SupportCenterPage onBackToHome={handleBackToHome} onNavigateToPage={handleNavigatePublicPage} />;
  }
  if (currentPublicPage === 'privacy') {
    return <PrivacyAndCookiesPage onBackToHome={handleBackToHome} onNavigateToPage={handleNavigatePublicPage} />;
  }
  if (currentPublicPage === 'terms') {
    return <TermsAndConditionsPage onBackToHome={handleBackToHome} onNavigateToPage={handleNavigatePublicPage} />;
  }
  if (currentPublicPage === 'faq') {
    return <FaqPage onBackToHome={handleBackToHome} onNavigateToPage={handleNavigatePublicPage} />;
  }
  if (currentPublicPage === 'changelog') {
    return <ChangelogPage onBackToHome={handleBackToHome} onNavigateToPage={handleNavigatePublicPage} />;
  }
  if (currentPublicPage === 'about') {
    return <AboutCompanyPage onBackToHome={handleBackToHome} onNavigateToPage={handleNavigatePublicPage} />;
  }
  if (currentPublicPage === 'contact') {
    return <ContactUsPage onBackToHome={handleBackToHome} onNavigateToPage={handleNavigatePublicPage} />;
  }
  if (currentPublicPage === 'blog') {
    return <BlogPage onBackToHome={handleBackToHome} onNavigateToPage={handleNavigatePublicPage} />;
  }
  if (currentPublicPage === 'careers') {
    return <CareersPage onBackToHome={handleBackToHome} onNavigateToPage={handleNavigatePublicPage} />;
  }
  if (currentPublicPage === 'partners') {
    return <PartnersPage onBackToHome={handleBackToHome} onNavigateToPage={handleNavigatePublicPage} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-['Cairo',sans-serif] dir-rtl relative overflow-x-hidden selection:bg-blue-100 selection:text-blue-700">
      {/* BACKGROUND ANIMATED GLOW ORBS & SUBTLE DRIFT PARTICLES */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px] animate-bg-drift" />
        <div className="absolute bottom-[20%] left-[-10%] w-[700px] h-[700px] rounded-full bg-indigo-500/10 blur-[140px] animate-bg-drift-reverse" />
        <div className="absolute top-[45%] right-[15%] w-[400px] h-[400px] rounded-full bg-cyan-400/5 blur-[100px] animate-bg-drift" />
      </div>

      {/* ================= 1. NAVBAR (Sequence 0ms -> 600ms) ================= */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 transition-all"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo (400ms) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-500/25">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-900 tracking-tight">EduPortal</span>
              </div>
              <p className="text-[11px] font-bold text-slate-500">منصة إدارة المدارس الذكية</p>
            </div>
          </motion.div>

          {/* Navigation Links (600ms - Staggered 80ms) */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-600">
            {[
              { label: 'الرئيسية', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }), active: true },
              { label: 'المميزات', action: () => scrollToSection('features') },
              { label: 'المدارس', action: () => scrollToSection('mockups') },
              { label: 'الدعم الفني', action: () => handleNavigatePublicPage('support') },
              { label: 'تواصل معنا', action: () => handleNavigatePublicPage('contact') },
            ].map((link, idx) => (
              <motion.button
                key={link.label}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 + idx * 0.08 }}
                onClick={link.action}
                className={`relative py-1 cursor-pointer transition-colors hover:text-blue-600 ${
                  link.active ? 'text-blue-600 font-extrabold' : ''
                }`}
              >
                {link.label}
                {link.active && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                  />
                )}
              </motion.button>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            {savedAccounts.length > 0 && (
              <AccountSwitcherButton
                variant="pill"
              />
            )}

            {!isStandalone && (
              <button
                onClick={handlePwaInstall}
                className="py-2.5 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="تثبيت التطبيق"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>تثبيت التطبيق</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsAdminModalOpen(true);
                setAdminError('');
                setStaffError('');
              }}
              className="py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>أدمن النظام</span>
            </button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsStudentModalOpen(true)}
              className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>تسجيل الدخول</span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ================= 2. HERO SECTION ================= */}
      <section
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative z-10 pt-10 pb-20 lg:pt-16 lg:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Right Column: Text & Hero CTAs */}
          <div className="lg:col-span-5 space-y-6 text-right">
            {/* Title (900ms) */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-3"
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.15] tracking-tight">
                منصة إدارة المدارس الذكية
              </h1>
            </motion.div>

            {/* Subtitle (1100ms) */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl font-medium"
            >
              حل متكامل لإدارة المدارس بجميع المراحل. متابعة الحضور، السلوك والانضباط المدرسي، الأوسمة والتحفيز، والتواصل الفوري مع أولياء الأمور وأكثر من ذلك بكثير.
            </motion.p>

            {/* Hero Action Buttons (1300ms) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              {/* Primary Blue Button */}
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 12px 25px -5px rgba(37, 99, 235, 0.4)' }}
                whileTap={{ scale: 0.96 }}
                onClick={handleStartNowClick}
                className="group px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2.5 cursor-pointer"
              >
                <span>ابدأ الآن</span>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1.5 transition-transform duration-250" />
              </motion.button>

              {/* Install PWA Button (Only visible in browser) */}
              {!isStandalone && (
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 12px 25px -5px rgba(16, 185, 129, 0.35)' }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handlePwaInstall}
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
                  title="تثبيت التطبيق"
                >
                  <Download className="w-4 h-4" />
                  <span>تثبيت التطبيق</span>
                </motion.button>
              )}

              {/* Secondary Outline Button */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => scrollToSection('features')}
                className="px-6 py-3.5 bg-white hover:bg-slate-50 border border-blue-200 text-blue-600 font-extrabold text-sm rounded-2xl transition-all cursor-pointer shadow-xs"
              >
                <span>شاهد المميزات</span>
              </motion.button>
            </motion.div>

            {/* Proof Avatars */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.4 }}
              className="flex items-center gap-3 pt-3"
            >
              <div className="flex -space-x-2 space-x-reverse">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="user"
                  className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-2xs"
                />
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                  alt="user"
                  className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-2xs"
                />
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                  alt="user"
                  className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-2xs"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>+50 مدرسة تستخدم المنصة بنجاح</span>
              </div>
            </motion.div>

            {/* Quick Trusted Device Saved Accounts Banner */}
            {savedAccounts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-white/95 backdrop-blur-md rounded-3xl border border-blue-100/90 shadow-xl shadow-blue-500/5 space-y-3 mt-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">حساباتك المحفوظة على هذا الجهاز</h4>
                      <p className="text-[10px] font-bold text-slate-500">
                        جهاز موثوق لمدة 300 يوم — اضغط للدخول الفوري
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSwitcherModalOpen(true)}
                    className="text-[11px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer bg-blue-50 px-2.5 py-1 rounded-xl"
                  >
                    <span>تبديل الحسابات ({savedAccounts.length})</span>
                    <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {savedAccounts.slice(0, 2).map((acc) => (
                    <button
                      key={acc.sessionId}
                      disabled={isSwitching}
                      onClick={() => handleSelectSavedAccount(acc)}
                      className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/90 hover:bg-blue-50/80 hover:border-blue-300 transition-all text-right group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <AvatarDisplay
                          layoutUid={acc.avatarUid}
                          className="w-9 h-9 rounded-full border border-white shadow-2xs shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate group-hover:text-blue-700">
                            {acc.studentName || acc.userDisplayName}
                          </p>
                          <p className="text-[10px] font-medium text-slate-500 truncate">
                            {acc.schoolName || (acc.userRole === 'parent' ? 'حساب ولي أمر' : 'حساب مدرسي')}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/90 px-2.5 py-1 rounded-xl shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        دخول سريع ✓
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Left Column: Interactive 3D Dashboard Mockup (1500ms) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 relative perspective-1000"
          >
            {/* Interactive Tilt Container */}
            <motion.div
              animate={{
                rotateX: mousePos.y * -6,
                rotateY: mousePos.x * 6,
              }}
              transition={{ type: 'spring', stiffness: 150, damping: 20 }}
              className="relative w-full rounded-3xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-300/60 overflow-hidden transform-gpu"
              style={{
                boxShadow: `${mousePos.x * -15}px ${
                  mousePos.y * -15 + 20
                }px 40px -10px rgba(15, 23, 42, 0.15)`,
              }}
            >
              {/* POLISHED GLASS SWEEP BEAM EFFECT */}
              <div className="absolute inset-0 z-20 pointer-events-none animate-glass-sweep bg-gradient-to-r from-transparent via-white/40 to-transparent w-1/2 h-full transform" />

              {/* Mockup Windows Control Header & Role Switcher */}
              <div className="bg-slate-100 border-b border-slate-200/80 p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[11px] font-black text-slate-800 hidden sm:inline">محاكي المنصة الحي</span>
                </div>

                {/* 4-Role Segmented Switcher */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs text-[11px] font-bold">
                  {[
                    { id: 'admin', label: '🏢 الإدارة' },
                    { id: 'teacher', label: '👨‍🏫 المعلم' },
                    { id: 'parent', label: '👨‍👩‍👧 ولي الأمر' },
                    { id: 'student', label: '🎓 الطالب' },
                  ].map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setHeroSimulatedRole(role.id as any)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                        heroSimulatedRole === role.id
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mockup Dynamic Content Layout */}
              <div className="p-4 sm:p-5 bg-slate-50 min-h-[380px] text-xs dir-rtl">
                <AnimatePresence mode="wait">
                  {/* ROLE 1: ADMIN VIEW */}
                  {heroSimulatedRole === 'admin' && (
                    <motion.div
                      key="admin"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      {/* Top Header */}
                      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 text-xs block">لوحة تحكم الإدارة المدرسية</span>
                            <span className="text-[10px] text-slate-500 font-medium">العام الدراسي الحالي • مباشر</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          مزامنة سحابية نشطة
                        </span>
                      </div>

                      {/* 4 Metric Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
                          <span className="text-[10px] text-slate-500 font-bold block">نسبة الحضور</span>
                          <span className="text-base font-black text-blue-600 block my-0.5">98.4%</span>
                          <span className="text-[9px] text-emerald-600 font-bold block">+1.2% هذا الأسبوع</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
                          <span className="text-[10px] text-slate-500 font-bold block">الطلاب المقيدين</span>
                          <span className="text-base font-black text-slate-900 block my-0.5">1,245</span>
                          <span className="text-[9px] text-slate-400 font-medium block">24 فصلاً دراسياً</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
                          <span className="text-[10px] text-slate-500 font-bold block">انضباط السلوك</span>
                          <span className="text-base font-black text-emerald-600 block my-0.5">96%</span>
                          <span className="text-[9px] text-emerald-700 font-bold block">سلوك إيجابي مرتفع</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
                          <span className="text-[10px] text-slate-500 font-bold block">الأوسمة الممنوحة</span>
                          <span className="text-base font-black text-amber-600 block my-0.5">182</span>
                          <span className="text-[9px] text-amber-700 font-bold block">وسام تميز هذا الشهر</span>
                        </div>
                      </div>

                      {/* Line Chart & Activity Log */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-700">
                            <span>مؤشر الحضور الأسبوعي لجميع الفصول</span>
                            <span className="text-blue-600 font-black">98.4%</span>
                          </div>
                          <div className="h-20 w-full relative pt-1">
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 200 60">
                              <path
                                d="M0,45 Q40,25 80,35 T160,12 T200,18"
                                fill="none"
                                stroke="#2563eb"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                              <circle cx="0" cy="45" r="3" fill="#2563eb" />
                              <circle cx="40" cy="30" r="3" fill="#2563eb" />
                              <circle cx="80" cy="35" r="3" fill="#2563eb" />
                              <circle cx="120" cy="20" r="3" fill="#2563eb" />
                              <circle cx="160" cy="12" r="4" fill="#2563eb" />
                              <circle cx="200" cy="18" r="3" fill="#2563eb" />
                            </svg>
                            <div className="flex justify-between text-[9px] text-slate-400 mt-2 font-bold">
                              <span>الأحد</span>
                              <span>الإثنين</span>
                              <span>الثلاثاء</span>
                              <span>الأربعاء</span>
                              <span>الخميس</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 text-[10px]">
                          <span className="font-extrabold text-slate-800 block border-b border-slate-100 pb-1">
                            سجل النشاط اللحظي
                          </span>
                          <div className="space-y-1.5">
                            <div className="p-1.5 bg-slate-50 rounded-xl flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="font-bold text-slate-800">اكتمل رصد حضور المرحلة الإعدادية</span>
                            </div>
                            <div className="p-1.5 bg-slate-50 rounded-xl flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span className="font-bold text-slate-800">اعتماد 8 أوسمة تفوق دراسي</span>
                            </div>
                            <div className="p-1.5 bg-slate-50 rounded-xl flex items-center gap-1.5">
                              <Bell className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span className="font-bold text-slate-800">إشعار ولي أمر بغياب مبرر</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ROLE 2: TEACHER INTERACTIVE VIEW */}
                  {heroSimulatedRole === 'teacher' && (
                    <motion.div
                      key="teacher"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-3"
                    >
                      {/* Teacher Header Bar */}
                      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 text-xs block">فصل 3/1 • رصد الحضور والسلوك</span>
                            <span className="text-[10px] text-slate-500 font-medium">جرب النقر على الحالات بنفسك!</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            حاضر: {Object.values(mockAttendance).filter((s) => s === 'present').length}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            متأخر: {Object.values(mockAttendance).filter((s) => s === 'late').length}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                            غائب: {Object.values(mockAttendance).filter((s) => s === 'absent').length}
                          </span>
                        </div>
                      </div>

                      {/* Interactive Student Rows */}
                      <div className="space-y-2">
                        {[
                          { id: 's1', name: 'أحمد محمد علي', points: 35 },
                          { id: 's2', name: 'سارة محمود حسن', points: 48 },
                          { id: 's3', name: 'يوسف خالد إبراهيم', points: 28 },
                        ].map((student) => (
                          <div
                            key={student.id}
                            className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 font-black flex items-center justify-center text-[10px]">
                                {student.name[0]}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">{student.name}</span>
                                <span className="text-[10px] text-slate-500">النقاط: {student.points + (student.id === 's1' ? mockBehaviorBonus : 0)} ⭐</span>
                              </div>
                            </div>

                            {/* Attendance Switcher Pill Buttons */}
                            <div className="flex items-center gap-1.5 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => setMockAttendance((prev) => ({ ...prev, [student.id]: 'present' }))}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold cursor-pointer transition-all ${
                                  mockAttendance[student.id] === 'present'
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                حاضر ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => setMockAttendance((prev) => ({ ...prev, [student.id]: 'late' }))}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold cursor-pointer transition-all ${
                                  mockAttendance[student.id] === 'late'
                                    ? 'bg-amber-600 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                متأخر
                              </button>
                              <button
                                type="button"
                                onClick={() => setMockAttendance((prev) => ({ ...prev, [student.id]: 'absent' }))}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold cursor-pointer transition-all ${
                                  mockAttendance[student.id] === 'absent'
                                    ? 'bg-red-600 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                غائب
                              </button>

                              {/* Quick Action Behavior Reward */}
                              <button
                                type="button"
                                onClick={() => setMockBehaviorBonus((prev) => prev + 5)}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-[10px] font-black cursor-pointer transition-transform active:scale-95 flex items-center gap-1"
                                title="منح نقاط سلوك إيجابي"
                              >
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                <span>+5 نقاط</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Interactive Success Banner */}
                      <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl text-[10px] font-bold flex items-center justify-between">
                        <span>💡 التغييرات تحفظ سحابياً وتصل لولي الأمر فورياً عبر الإشعارات</span>
                        <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">رصد فوري ⚡</span>
                      </div>
                    </motion.div>
                  )}

                  {/* ROLE 3: PARENT PORTAL VIEW */}
                  {heroSimulatedRole === 'parent' && (
                    <motion.div
                      key="parent"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-3"
                    >
                      {/* Parent Child Header */}
                      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
                            ع
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 text-xs block">عمر أحمد محمد</span>
                            <span className="text-[10px] text-slate-500 font-medium">الصف الثاني الإعدادي • فصل 2/2</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          حاضر اليوم (07:42 ص)
                        </span>
                      </div>

                      {/* Parent Status Cards */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                          <span className="text-[10px] text-slate-500 font-bold block">سجل الحضور هذا الشهر</span>
                          <span className="text-base font-black text-emerald-600 block my-0.5">100% انضباط</span>
                          <span className="text-[9px] text-slate-400 block">0 أيام غياب بدون عذر</span>
                        </div>
                        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                          <span className="text-[10px] text-slate-500 font-bold block">مجموع نقاط السلوك</span>
                          <span className="text-base font-black text-amber-600 block my-0.5">485 نقطة ⭐</span>
                          <span className="text-[9px] text-emerald-600 font-bold block">المستوى: متميز ومتفوق</span>
                        </div>
                      </div>

                      {/* Today's Feed */}
                      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                        <span className="text-[11px] font-black text-slate-800 block border-b border-slate-100 pb-1">
                          آخر التحديثات والإشعارات الرسمية
                        </span>
                        <div className="space-y-1.5 text-[10px]">
                          <div className="p-2 bg-emerald-50 rounded-xl flex items-center justify-between text-emerald-900">
                            <span className="font-bold">🏅 منح وسام التفوق الدراسي في الرياضيات</span>
                            <span className="text-[9px] text-emerald-700">اليوم 10:15 ص</span>
                          </div>
                          <div className="p-2 bg-blue-50 rounded-xl flex items-center justify-between text-blue-900">
                            <span className="font-bold">⭐ +5 نقاط سلوك: مشاركة ممتازة في الإذاعة المدرسية</span>
                            <span className="text-[9px] text-blue-700">اليوم 08:30 ص</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ROLE 4: STUDENT VIEW */}
                  {heroSimulatedRole === 'student' && (
                    <motion.div
                      key="student"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-3"
                    >
                      {/* Student Rank Header */}
                      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 p-3.5 rounded-2xl shadow-md flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-2xl bg-white/20 text-slate-950 flex items-center justify-center font-black">
                            <Trophy className="w-5 h-5 text-amber-950" />
                          </div>
                          <div>
                            <span className="text-xs font-black block">لوحة صدارة الطالب: عمر أحمد</span>
                            <span className="text-[10px] font-bold text-amber-950/80">المركز الثاني على مستوى المدرسة 🏆</span>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="text-sm font-black block">{485 + mockBehaviorBonus} نقطة</span>
                          <span className="text-[9px] font-bold">باقي 15 نقطة للمركز الأول!</span>
                        </div>
                      </div>

                      {/* Unlocked Badges Showcase */}
                      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-black text-slate-800">
                          <span>حقيبة الأوسمة والتكريمات الرقمية</span>
                          <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">
                            4 أوسمة معتمدة
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px]">
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                            <span className="text-lg block">🏅</span>
                            <span className="font-extrabold text-amber-900 block">المتفوق الدراسي</span>
                            <span className="text-[8px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded font-black">
                              خرافي
                            </span>
                          </div>
                          <div className="p-2 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                            <span className="text-lg block">⭐</span>
                            <span className="font-extrabold text-purple-900 block">الانضباط الذهبي</span>
                            <span className="text-[8px] bg-purple-200/80 text-purple-900 px-1.5 py-0.5 rounded font-black">
                              أسطوري
                            </span>
                          </div>
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                            <span className="text-lg block">🚀</span>
                            <span className="font-extrabold text-blue-900 block">المبتكر الصغير</span>
                            <span className="text-[8px] bg-blue-200/80 text-blue-900 px-1.5 py-0.5 rounded font-black">
                              ملحمي
                            </span>
                          </div>
                          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                            <span className="text-lg block">📚</span>
                            <span className="font-extrabold text-emerald-900 block">القارئ المتميز</span>
                            <span className="text-[8px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded font-black">
                              نادر
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================= 3. FEATURES SECTION ("مميزات المنصة") ================= */}
      <section id="features" className="py-24 bg-white border-y border-slate-200/80 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-3xl mx-auto space-y-3"
          >
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>المنظومة المتكاملة للريادة المدرسية</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              كل ما تحتاجه مدرستك للتحول الرقمي والتميز
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
              صُممت منصة مدرستي وفق أحدث المعايير التربوية والتقنية لتغطية كافة متطلبات الإدارة المدرسية، المعلمين، والأسرة في مكان واحد متكامل.
            </p>

            {/* Filter Tabs */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
              {[
                { id: 'all', label: 'كافة المميزات' },
                { id: 'admin', label: '🏢 لإدارة المدرسة' },
                { id: 'teacher', label: '👨‍🏫 للمعلمين' },
                { id: 'parent', label: '👨‍👩‍👧 لأولياء الأمور' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFeatureFilter(tab.id as any)}
                  className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                    featureFilter === tab.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* 6 Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                id: 'attendance',
                roles: ['admin', 'teacher', 'parent'],
                icon: CalendarCheck,
                title: 'متابعة الحضور والانضباط اللحظي',
                subtitle: 'رصد ذكي للحضور في أقل من 30 ثانية',
                desc: 'تسجيل حضور الحصص وطابور الصباح بدقة متناهية، واحتساب نسب التأخير والغياب آلياً مع تنبيهات فورية للإدارة وأولياء الأمور.',
                points: ['رصد يومي وبالحصة مع إحصاءات بيانية فورية', 'إشعار غياب آلي لولي الأمر لحظة الرصد'],
                metric: '⚡ أسرع بنسبة 90% من السجلات الورقية',
                iconColor: 'text-blue-600 bg-blue-50 border-blue-200',
                badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
              },
              {
                id: 'behavior',
                roles: ['admin', 'teacher', 'parent'],
                icon: Star,
                title: 'السلوك والتعزيز الإيجابي',
                subtitle: 'إدارة السلوك وتعديل المسار التربوي',
                desc: 'تسجيل الملاحظات السلوكية الإيجابية والسلبية بلحظتها وفق لائحة الانضباط المدرسي، مع نظام نقاط يرفع دافعية الطلاب للالتزام.',
                points: ['بنك ملاحظات تربوية مسبق التجهيز بنقرة واحدة', 'سجل تراكمي دقيق لمسار الطالب السلوكي طوال العام'],
                metric: '📈 خفض المخالفات الصفية بنسبة 40%',
                iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
                badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
              },
              {
                id: 'badges',
                roles: ['admin', 'teacher', 'parent'],
                icon: Award,
                title: 'الأوسمة والتحفيز الرقمي',
                subtitle: 'لوحة صدارة وأوسمة تشعل التميز والتحفيز',
                desc: 'نظام تحفيز رقمي متكامل يمنح الطلاب أوسمة نادرة وخرافية عند التفوق الدراسي والانضباطي، مع منصة تتويج أسبوعية وشهرية للأوائل.',
                points: ['4 مستويات ندرة (نادر، ملحمي، أسطوري، خرافي)', 'لوحة شرف مدرسية تنافسية ترفع الدافعية والشغف'],
                metric: '🏅 أكثر من 20 وساماً مخصصاً ومعتمداً',
                iconColor: 'text-amber-600 bg-amber-50 border-amber-200',
                badgeBg: 'bg-amber-50 text-amber-900 border-amber-200',
              },
              {
                id: 'admin_actions',
                roles: ['admin'],
                icon: ShieldAlert,
                title: 'القرارات الإدارية والاستدعاءات',
                subtitle: 'حوكمة القرارات الإدارية والاستدعاءات الرسمية',
                desc: 'إصدار استدعاءات أولياء الأمور وقرارات الإيقاف المؤقت آلياً عند تجاوز حدود الغياب أو تكرار السلوك السلبي مع سجل تدقيق شفاف.',
                points: ['توليد خطابات استدعاء رسمية جاهزة للطباعة والاعتماد', 'إنذارات وقائية ذكية قبل تفاقم الغياب والمخالفات'],
                metric: '🛡️ توافق 100% مع اللائحة الوزارية للانضباط',
                iconColor: 'text-rose-600 bg-rose-50 border-rose-200',
                badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
              },
              {
                id: 'parent_portal',
                roles: ['parent'],
                icon: Smartphone,
                title: 'بوابة أولياء الأمور والشراكة المدرسية',
                subtitle: 'متابعة مستمرة وشراكة حقيقية مع المنزل',
                desc: 'بوابة مخصصة ومؤمنة لولي الأمر لمتابعة وصول ابنه وطابور الصباح، نقاط سلوكه، وتكريماته من أي هاتف لحظة بلحظة دون عناء.',
                points: ['إشعارات فورية بكل مستجد وملاحظة دراسية', 'تواصل مباشر وسريع مع إدارة المدرسة والمعلمين'],
                metric: '📱 متوافقة بالكامل مع جميع الهواتف الذكية',
                iconColor: 'text-purple-600 bg-purple-50 border-purple-200',
                badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
              },
              {
                id: 'reports',
                roles: ['admin', 'teacher'],
                icon: BarChart3,
                title: 'التقارير والإحصاءات الذكية',
                subtitle: 'تحليلات معمقة وتقارير PDF معتمدة',
                desc: 'لوحات تحكم بيانية تفاعلية لقياس مؤشرات أداء المدرسة وكشوف الحضور الشهرية والشهادات والتقارير القابلة للطباعة والتصدير.',
                points: ['تصدير تقارير PDF رسمية واستيراد Excel سريع', 'مؤشرات أداء شاملة تساند اتخاذ القرارات الإدارية'],
                metric: '📊 تقارير فورية توفر 85% من الجهد اليدوي',
                iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
                badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
              },
            ]
              .filter((f) => featureFilter === 'all' || f.roles.includes(featureFilter))
              .map((feature, idx) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  whileHover={{
                    y: -8,
                    boxShadow: '0 20px 35px -10px rgba(37, 99, 235, 0.12)',
                    borderColor: '#93c5fd',
                  }}
                  className="bg-white p-7 sm:p-8 rounded-3xl border border-slate-200/90 shadow-2xs group transition-all duration-300 flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    {/* Icon & Category Badge */}
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border transition-transform duration-300 group-hover:scale-110 ${feature.iconColor}`}
                      >
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border ${feature.badgeBg}`}>
                        {feature.metric}
                      </span>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-xs font-bold text-slate-600">
                        {feature.subtitle}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {feature.desc}
                    </p>
                  </div>

                  {/* Bullet Highlights */}
                  <div className="space-y-2 pt-3 border-t border-slate-100 text-xs font-bold text-slate-700">
                    {feature.points.map((point) => (
                      <div key={point} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      </section>

      {/* ================= 4. STATS SECTION ================= */}
      <section className="py-16 bg-slate-50 border-b border-slate-200/80 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            {[
              { label: 'مدرسة', value: 50, suffix: '+' },
              { label: 'طالب', value: 20000, suffix: '+' },
              { label: 'معلم', value: 1200, suffix: '+' },
              { label: 'رضا المستخدمين', value: 98, suffix: '%' },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-1"
              >
                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  <AnimatedStatNumber value={stat.value} suffix={stat.suffix} />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-500 block">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 5. MOCKUPS SECTION ("مصممة لكل مستخدم") ================= */}
      <section id="mockups" className="py-24 bg-white relative z-10 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto space-y-3"
          >
            <span className="inline-block text-xs font-black text-blue-600 bg-blue-50 border border-blue-200 px-4 py-1.5 rounded-full">
              واجهات سهلة وبسيطة
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">مصممة لكل مستخدم</h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Card 1: School Admin Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-slate-50 rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-6 flex flex-col justify-between group hover:border-blue-300 transition-all"
            >
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-inner min-h-[220px] flex flex-col justify-between text-xs dir-rtl">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-extrabold text-slate-800">
                  <span>لوحة المعاينة للمدرسة</span>
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">نشط</span>
                </div>
                <div className="grid grid-cols-2 gap-2 my-3">
                  <div className="bg-blue-50 p-2 rounded-xl text-center">
                    <span className="text-[10px] text-blue-700 block font-bold">نسبة الحضور</span>
                    <span className="text-sm font-black text-blue-900">92%</span>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-xl text-center">
                    <span className="text-[10px] text-emerald-700 block font-bold">المعلمين</span>
                    <span className="text-sm font-black text-emerald-900">86</span>
                  </div>
                </div>
                <div className="h-12 bg-slate-100 rounded-xl p-2 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <span>تقرير اليوم الإداري</span>
                  <span className="font-bold text-slate-800">مكتمل 100%</span>
                </div>
              </div>

              <div className="space-y-2 text-right">
                <h3 className="text-lg font-black text-slate-900">لوحة إدارة المدرسة</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  تحكم كامل في جميع جوانب المدرسة تقارير شاملة ورؤية واضحة
                </p>
              </div>
            </motion.div>

            {/* Card 2: Teacher Interface Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="bg-slate-50 rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-6 flex flex-col justify-between group hover:border-blue-300 transition-all"
            >
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-inner min-h-[220px] flex flex-col justify-between text-xs dir-rtl">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-extrabold text-slate-800">
                  <span>واجهة رصد السلوك والحضور</span>
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">المعلم</span>
                </div>
                <div className="space-y-2 my-2">
                  <div className="p-2 bg-slate-50 rounded-xl flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-800">أحمد محمد علي</span>
                    <span className="font-black text-emerald-600">حاضر • سلوك متميز</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-800">سارة محمود حسن</span>
                    <span className="font-black text-blue-600">حاضر • وسام الالتزام</span>
                  </div>
                </div>
                <div className="p-2 bg-indigo-50 text-indigo-900 text-[10px] rounded-xl font-bold text-center">
                  تم رصد الحضور والملاحظات السلوكية للفصل بنجاح
                </div>
              </div>

              <div className="space-y-2 text-right">
                <h3 className="text-lg font-black text-slate-900">واجهة المعلم</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  إدارة السلوك اليومي والحضور والأوسمة التشجيعية بكل سهولة وتوفير الوقت والجهد
                </p>
              </div>
            </motion.div>

            {/* Card 3: Phone Mockup (Floating -2deg -> 2deg) */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="bg-slate-50 rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-6 flex flex-col justify-between group hover:border-blue-300 transition-all"
            >
              {/* Floating Phone Frame */}
              <motion.div
                animate={{ rotate: [-2, 2, -2] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                whileHover={{ scale: 1.04 }}
                className="bg-slate-900 text-white rounded-3xl p-3.5 border-4 border-slate-800 shadow-xl max-w-[210px] mx-auto w-full min-h-[220px] flex flex-col justify-between text-[10px] dir-rtl relative overflow-hidden"
              >
                <div className="w-12 h-2.5 bg-slate-800 rounded-full mx-auto mb-2" />
                <div className="bg-slate-800/90 p-2.5 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between font-extrabold text-blue-300">
                    <span>أحمد محمد علي</span>
                    <span className="bg-blue-500/20 px-1.5 py-0.5 rounded text-[8px]">طالب</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-300">
                    <span>نسبة الحضور:</span>
                    <span className="font-bold text-emerald-400">98%</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-300">
                    <span>السلوك:</span>
                    <span className="font-bold text-amber-300">ممتاز 🏅</span>
                  </div>
                </div>
                <div className="bg-blue-600 p-2 rounded-xl text-center font-bold text-[9px] text-white">
                  بوابة ولي الأمر التفاعلية
                </div>
              </motion.div>

              <div className="space-y-2 text-right">
                <h3 className="text-lg font-black text-slate-900">بوابة ولي الأمر</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  متابعة شاملة لأداء الأبناء والتواصل مع المدرسة في أي وقت ومن أي مكان
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= 6. TESTIMONIALS SECTION ("ماذا يقول عملاؤنا") ================= */}
      <section className="py-24 bg-slate-50 relative z-10 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto space-y-2"
          >
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">ماذا يقول عملاؤنا</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: 'أستطيع متابعة ابني في أي وقت ومعرفة تقدمه الدراسي أولاً بأول.',
                name: 'أ. محمد علي',
                role: 'ولي أمر',
                img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
              },
              {
                quote: 'أحببت طريقة التواصل مع أولياء الأمور والشفافية في عرض جميع المعلومات.',
                name: 'أ. سارة محمد',
                role: 'معلمة لغة عربية',
                img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
              },
              {
                quote: 'المنصة غيرت طريقة إدارتنا للمدرسة تماماً. أصبحت كل العمليات أسهل وأسرع بكثير.',
                name: 'أ. أحمد محمود',
                role: 'مدير مدرسة النور',
                img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
              },
            ].map((t, idx) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                whileHover={{ y: -12 }}
                className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-2xs space-y-6 flex flex-col justify-between group transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium italic">
                    "{t.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <img
                    src={t.img}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover group-hover:scale-108 transition-transform"
                  />
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{t.name}</h4>
                    <span className="text-[11px] text-slate-400 font-bold block">{t.role}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 7. FAQ ACCORDION SECTION ("الأسئلة الشائعة") ================= */}
      <section id="faq" className="py-24 bg-white relative z-10 border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-3"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>إجابات واضحة وسريعة</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              الأسئلة الأكثر شيوعاً
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              كل ما تحتاج لمعرفته حول طريقة عمل المنصة، خطط المدارس، وسهولة الاستخدام.
            </p>
          </motion.div>

          {/* Accordion List */}
          <div className="space-y-3">
            {[
              {
                q: 'كيف تبدأ إدارة المدرسة في تطبيق نظام المنصة؟',
                a: 'البدء في غاية السهولة ولا يستغرق سوى دقائق معدودة؛ حيث يتم استيراد بيانات الطلاب والفصول والمعلمين عبر ملف Excel قياسي بضغطة زر واحدة، لتصبح المدرسة جاهزة فورياً للعمل وبدء رصد الحضور والسلوك.',
              },
              {
                q: 'هل يتطلب النظام أجهزة خاصة أو خوادم داخلية في المدرسة؟',
                a: 'لا على الإطلاق. منصة مدرستي سحابية بالكامل وتعمل بسلاسة فائقة على أي جهاز (هاتف محمول، تابلت، أو حاسوب) عبر أي متصفح، مع إمكانية تثبيتها كتطبيق مباشر (PWA) دون الحاجة لمتاجر التطبيقات.',
              },
              {
                q: 'كيف يتابع ولي الأمر حضور وسلوك ابنه أولاً بأول؟',
                a: 'يمتلك كل ولي أمر حساباً مؤمناً ومخصصاً يتيح له رؤية موعد حضور ابنه لحظة بلحظة، بالإضافة إلى إشعارات فورية بأي ملاحظات سلوكية أو أوسمة تميز، مع إمكانية طباعة تقارير PDF المعتمدة.',
              },
              {
                q: 'ما هو أثر نظام الأوسمة ونقاط التميز على الطلاب؟',
                a: 'صُممت منظومة الأوسمة الرقمية وفق أسس التعزيز السلوكي الإيجابي؛ حيث يتسابق الطلاب للحصول على الأوسمة الأسطورية ونقاط الشرف في لوحة صدارة المدرسة، مما أثبت قدرته على رفع الانضباط الصفي بأكثر من 40%.',
              },
              {
                q: 'كيف يتم تأمين وسرية بيانات المدرسة والطلاب؟',
                a: 'نستخدم أعلى معايير التشفير السحابي المعتمدة عالمياً عبر بنية Google Cloud الآمنة، مع عزل بيانات كل مدرسة، وتأمين حسابات الأجهزة الموثوقة، مع نسخ احتياطي دوري مشفر بصورة دائمة.',
              },
            ].map((faq, idx) => {
              const isOpen = faqOpenIndex === idx;
              return (
                <motion.div
                  key={faq.q}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="bg-slate-50 border border-slate-200/80 rounded-2xl overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-right flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/70 transition-colors"
                  >
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug">
                      {faq.q}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isOpen ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-200/70 text-slate-600'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 text-xs text-slate-600 font-medium leading-relaxed border-t border-slate-200/50">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= 8. HIGH-IMPACT PRE-FOOTER CTA BANNER ================= */}
      <section className="py-20 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white relative z-10 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>ابدأ التحول الرقمي اليوم</span>
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight max-w-3xl mx-auto">
            جاهز لتطوير بيئة مدرستك وتوفير 85% من الجهد الورقي؟
          </h2>

          <p className="text-xs sm:text-base text-blue-100 max-w-2xl mx-auto leading-relaxed font-medium">
            انضم الآن إلى المدارس الرائدة التي تستخدم منصة مدرستي لرصد الحضور، تعزيز السلوك الإيجابي، وبناء تواصل شفاف ومستمر مع أولياء الأمور.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleStartNowClick}
              className="px-8 py-3.5 bg-white hover:bg-slate-50 text-blue-700 font-black text-sm rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>ابدأ الآن مجاناً</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsAdminModalOpen(true);
                setAdminError('');
                setStaffError('');
              }}
              className="px-6 py-3.5 bg-blue-900/60 hover:bg-blue-900 text-white border border-white/20 font-extrabold text-sm rounded-2xl transition-all cursor-pointer flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>دخول إدارة المدرسة</span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= 9. FOOTER SECTION ================= */}
      <footer id="footer" className="bg-slate-900 text-white relative z-10 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Newsletter Box */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 max-w-xl text-right">
              <h3 className="text-xl sm:text-2xl font-black text-white">اشترك في نشرتنا</h3>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                احصل على آخر التحديثات والعروض الخاصة مباشرة في بريدك الإلكتروني.
              </p>
            </div>

            <form onSubmit={handleNewsletterSubmit} className="w-full md:w-auto flex items-center gap-2">
              <div className="relative w-full md:w-80">
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="البريد الإلكتروني"
                  className="w-full pr-10 pl-4 py-3 bg-white/10 border border-white/10 rounded-2xl text-xs font-bold text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-2xl shrink-0 cursor-pointer transition-colors flex items-center gap-2"
              >
                <span>اشترك</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {newsletterSubscribed && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold text-center">
              تم الاشتراك بنجاح في النشرة البريدية!
            </div>
          )}

          {/* Links Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-right text-xs">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white font-black text-base">
                <GraduationCap className="w-6 h-6 text-blue-500" />
                <span>EduPortal</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed font-medium max-w-xs">
                نسعى لتطوير العملية التعليمية من خلال التكنولوجيا وتوفير بيئة تعليمية أفضل.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-extrabold text-white text-sm">الدعم الفني</h4>
              <ul className="space-y-2 text-slate-400 font-bold">
                <li>
                  <button
                    onClick={() => handleNavigatePublicPage('support')}
                    className="hover:text-blue-400 transition-colors cursor-pointer text-right flex items-center gap-1.5"
                  >
                    <span>مركز المساعدة والتذاكر</span>
                    <span className="px-1.5 py-0.5 text-[9px] bg-blue-500/20 text-blue-300 rounded font-black">جديد</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigatePublicPage('contact')}
                    className="hover:text-blue-400 transition-colors cursor-pointer text-right"
                  >
                    تواصل معنا
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigatePublicPage('privacy')}
                    className="hover:text-blue-400 transition-colors cursor-pointer text-right"
                  >
                    سياسة الخصوصية والكوكيز
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigatePublicPage('terms')}
                    className="hover:text-blue-400 transition-colors cursor-pointer text-right"
                  >
                    الشروط والأحكام
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-extrabold text-white text-sm">الشركة</h4>
              <ul className="space-y-2 text-slate-400 font-bold">
                <li>
                  <button
                    onClick={() => handleNavigatePublicPage('about')}
                    className="hover:text-blue-400 transition-colors cursor-pointer text-right"
                  >
                    عن الشركة
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigatePublicPage('blog')}
                    className="hover:text-blue-400 transition-colors cursor-pointer text-right"
                  >
                    المدونة التربوية
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigatePublicPage('partners')}
                    className="hover:text-blue-400 transition-colors cursor-pointer text-right"
                  >
                    الشركاء والمدارس
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-extrabold text-white text-sm">المنصة والخدمات</h4>
              <ul className="space-y-2 text-slate-400 font-bold">
                <li>
                  <button
                    onClick={() => scrollToSection('features')}
                    className="hover:text-blue-400 transition-colors cursor-pointer text-right"
                  >
                    المميزات الرئيسية
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigatePublicPage('changelog')}
                    className="hover:text-blue-400 transition-colors cursor-pointer text-right flex items-center gap-1.5"
                  >
                    <span>سجل التحديثات</span>
                    <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-300 rounded font-black">v2026.4</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigatePublicPage('faq')}
                    className="hover:text-blue-400 transition-colors cursor-pointer text-right"
                  >
                    الأسئلة الشائعة (FAQ)
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Social Icons */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-bold">
            <p>جميع الحقوق محفوظة © 2026 EduPortal</p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleNavigatePublicPage('support')}
                className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-black"
              >
                <LifeBuoy className="w-3.5 h-3.5" />
                <span>مركز الدعم الفني المباشر</span>
              </button>
              <button
                onClick={() => handleNavigatePublicPage('faq')}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors cursor-pointer text-xs font-bold"
              >
                الأسئلة الشائعة
              </button>
            </div>
          </div>

          {/* Centered Footer Credit */}
          <div className="pt-6 mt-4 border-t border-white/10 text-center dir-ltr">
            <div className="inline-flex flex-col items-center justify-center gap-1.5 px-6 py-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-xl max-w-full">
              <p className="text-sm sm:text-base text-slate-300 font-medium tracking-wide flex flex-wrap items-center justify-center gap-1.5">
                <span>Designed & Developed by</span>
                <span className="font-extrabold text-white text-base sm:text-lg">Mohamed Ahmed Abdelrahim</span>
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 shadow-xs">(Owner)</span>
              </p>
              <p className="text-xs sm:text-sm text-slate-300/90 font-medium flex items-center justify-center gap-1.5">
                <span className="text-slate-400">Helper :</span>
                <span className="font-semibold text-slate-100">Mohamed Adel Atia</span>
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* ================= STUDENT / PARENT LOGIN MODAL ================= */}
      <AnimatePresence>
        {isStudentModalOpen && (
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-['Cairo',sans-serif] dir-rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5 text-blue-200" />
                  </div>
                  <div>
                    <h3 className="text-base font-black">تسجيل دخول الطالب المباشر</h3>
                    <p className="text-xs text-slate-400">بوابة المتابعة المدرسية للطلاب وأولياء الأمور</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsStudentModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                {studentError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{studentError}</span>
                  </div>
                )}

                <form onSubmit={handleStudentLogin} className="space-y-4">
                  {/* 1. Student Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-blue-600" />
                      <span>الاسم (اسم الطالب):</span>
                    </label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => {
                        setStudentName(e.target.value);
                        setStudentError('');
                      }}
                      placeholder="مثال: آدم أحمد فتحي"
                      className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* 2. Ministry Code */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-blue-600" />
                      <span>كود الوزارة (Ministry Code):</span>
                    </label>
                    <input
                      type="text"
                      value={ministryCode}
                      onChange={(e) => {
                        setMinistryCode(e.target.value);
                        setStudentError('');
                      }}
                      placeholder="مثال: MIN-10001"
                      className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 dir-ltr text-right"
                    />
                  </div>

                  {/* 3. National ID */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>الرقم القومي (National ID):</span>
                    </label>
                    <input
                      type="text"
                      value={nationalId}
                      onChange={(e) => {
                        setNationalId(e.target.value);
                        setStudentError('');
                      }}
                      placeholder="مثال: 32205120108234"
                      maxLength={14}
                      className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 dir-ltr text-right"
                    />
                  </div>

                  {/* 4. Trust This Device Checkbox */}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none py-2 px-3 rounded-2xl bg-blue-50/70 border border-blue-100 hover:bg-blue-100/60 transition-all group">
                    <input
                      type="checkbox"
                      id="trust-this-device-student"
                      checked={trustThisDevice}
                      onChange={(e) => setTrustThisDevice(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 transition-colors cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        الوثوق بهذا الجهاز لمدة 300 يوم
                      </span>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                        تسجيل دخول تلقائي بدون إعادة كتابة الكود عند فتح المنصة
                      </p>
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={isStudentLoginLoading}
                    className={`w-full py-4 text-white font-extrabold rounded-2xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 ${
                      isStudentLoginLoading
                        ? 'bg-blue-600/75 opacity-75 blur-[0.5px] cursor-not-allowed pointer-events-none select-none'
                        : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                    }`}
                  >
                    {isStudentLoginLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>جاري التحقق والدخول...</span>
                      </div>
                    ) : (
                      <>
                        <span>تسجيل الدخول ومتابعة الطالب</span>
                        <ArrowLeft className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= ADMIN MODAL WITH 3 OPTIONS ================= */}
      <AnimatePresence>
        {isAdminModalOpen && (
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-['Cairo',sans-serif] dir-rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black">تسجيل دخول الكوادر والإدارة</h3>
                    <p className="text-xs text-slate-400">اختر نوع حسابك المعتمد بالمدرسة</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAdminModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* THREE TAB CHOICES */}
              <div className="p-2 bg-slate-100 border-b border-slate-200 grid grid-cols-3 gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAdminTab('admin');
                    setAdminError('');
                    setStaffError('');
                  }}
                  className={`py-2.5 px-2 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedAdminTab === 'admin'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>إدارة المدرسة</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedAdminTab('teacher');
                    setAdminError('');
                    setStaffError('');
                    setStaffUsername('');
                    setStaffPassword('');
                  }}
                  className={`py-2.5 px-2 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedAdminTab === 'teacher'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>معلم المادة</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedAdminTab('attendance');
                    setAdminError('');
                    setStaffError('');
                    setStaffUsername('');
                    setStaffPassword('');
                  }}
                  className={`py-2.5 px-2 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedAdminTab === 'attendance'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>محضر الغياب</span>
                </button>
              </div>

              {/* Modal Body / Tab Content */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
                {/* 1. TAB: SCHOOL ADMINISTRATION */}
                {selectedAdminTab === 'admin' && (
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-xs text-blue-900">
                      خاص بإدارة المدرسة للتحكم في الكشوف، المعلمين والإعدادات.
                    </div>

                    {adminError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>{adminError}</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">كود اسم المدرسة (أو البريد):</label>
                      <input
                        type="text"
                        value={adminSchoolCode}
                        onChange={(e) => setAdminSchoolCode(e.target.value)}
                        placeholder="كود أو بريد المدرسة (مثال: EG-CAI-8412)"
                        className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">كود الترخيص (License Key):</label>
                      <input
                        type="password"
                        value={adminLicenseCode}
                        onChange={(e) => setAdminLicenseCode(e.target.value)}
                        placeholder="LIC-2026-..."
                        className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                      />
                    </div>

                    {/* Trust Device Checkbox */}
                    <label className="flex items-center gap-2.5 cursor-pointer select-none py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={trustThisDevice}
                        onChange={(e) => setTrustThisDevice(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 transition-colors cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        الوثوق بهذا الجهاز لمدة 300 يوم
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={isAdminLoginLoading}
                      className={`w-full py-3.5 text-white font-extrabold rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isAdminLoginLoading
                          ? 'bg-slate-900/75 opacity-75 blur-[0.5px] cursor-not-allowed pointer-events-none select-none'
                          : 'bg-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      {isAdminLoginLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>جاري التحقق والدخول...</span>
                        </div>
                      ) : (
                        <>
                          <span>دخول لوحة إدارة المدرسة</span>
                          <ArrowLeft className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* 2. TAB: SUBJECT TEACHER */}
                {selectedAdminTab === 'teacher' && (
                  <form onSubmit={handleStaffLogin} className="space-y-4">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 text-xs text-indigo-900">
                      تسجيل دخول معلم المادة لمتابعة الفصول ورصد الحضور والملاحظات السلوكية والأوسمة.
                    </div>

                    {staffError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>{staffError}</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">الاسم</label>
                      <input
                        type="text"
                        value={staffUsername}
                        onChange={(e) => setStaffUsername(e.target.value)}
                        placeholder="أدخل اسم المعلم"
                        className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">كلمة المرور</label>
                      <div className="relative">
                        <input
                          type={showStaffPassword ? 'text' : 'password'}
                          value={staffPassword}
                          onChange={(e) => setStaffPassword(e.target.value)}
                          placeholder="أدخل كلمة المرور"
                          className="w-full py-2.5 px-3.5 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowStaffPassword(!showStaffPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          title={showStaffPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        >
                          {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Trust Device Checkbox */}
                    <label className="flex items-center gap-2.5 cursor-pointer select-none py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={trustThisDevice}
                        onChange={(e) => setTrustThisDevice(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 transition-colors cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        الوثوق بهذا الجهاز لمدة 300 يوم
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={isStaffLoginLoading}
                      className={`w-full py-3.5 text-white font-extrabold rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isStaffLoginLoading
                          ? 'bg-indigo-600/75 opacity-75 blur-[0.5px] cursor-not-allowed pointer-events-none select-none'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {isStaffLoginLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>جاري التحقق والدخول...</span>
                        </div>
                      ) : (
                        <>
                          <span>تسجيل الدخول</span>
                          <ArrowLeft className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* 3. TAB: ATTENDANCE TEACHER */}
                {selectedAdminTab === 'attendance' && (
                  <form onSubmit={handleStaffLogin} className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900 space-y-1">
                      <span className="font-extrabold block">خاص بـ مسؤول الحضور والغياب اليومي</span>
                      <p className="text-[11px] text-emerald-800">
                        تسجيل الدخول باسم المستخدم وكلمة المرور المسجلة من إدارة المدرسة.
                      </p>
                    </div>

                    {staffError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>{staffError}</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">اسم المستخدم المعتمد لمسؤول الحضور:</label>
                      <input
                        type="text"
                        value={staffUsername}
                        onChange={(e) => setStaffUsername(e.target.value)}
                        placeholder="اسم مستخدم مسؤول الحضور"
                        className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">كلمة المرور:</label>
                      <input
                        type="password"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                      />
                    </div>

                    {/* Trust Device Checkbox */}
                    <label className="flex items-center gap-2.5 cursor-pointer select-none py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={trustThisDevice}
                        onChange={(e) => setTrustThisDevice(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 transition-colors cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        الوثوق بهذا الجهاز لمدة 300 يوم
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={isStaffLoginLoading}
                      className={`w-full py-3.5 text-white font-extrabold rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isStaffLoginLoading
                          ? 'bg-emerald-600/75 opacity-75 blur-[0.5px] cursor-not-allowed pointer-events-none select-none'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {isStaffLoginLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>جاري التحقق والدخول...</span>
                        </div>
                      ) : (
                        <>
                          <span>دخول لوحة مسؤول الحضور والغياب اليومي</span>
                          <ArrowLeft className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Account Switcher Modal */}
      <AccountSwitcherModal
        isOpen={isSwitcherModalOpen}
        onClose={() => setIsSwitcherModalOpen(false)}
        accounts={savedAccounts}
        onSelectAccount={handleSelectSavedAccount}
        onRemoveAccount={handleRemoveSavedAccount}
        onAddNewAccount={() => {
          setIsSwitcherModalOpen(false);
          setIsStudentModalOpen(true);
        }}
        onOpenDeviceManagement={() => {
          setIsSwitcherModalOpen(false);
          setIsDeviceModalOpen(true);
        }}
        onLogoutAll={handleLogoutAllAccounts}
      />

      {/* Trusted Device Info Modal */}
      <TrustedDeviceModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        onRevokeDevice={handleLogoutAllAccounts}
      />

      {/* Non-Registered Student Account Modal */}
      <AnimatePresence>
        {isNotFoundModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm dir-rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-slate-100 shadow-2xl space-y-5 text-center relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 text-red-600 mx-auto flex items-center justify-center shadow-inner">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div className="space-y-3">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                  لا يمكن العثور علي هذا الحساب
                </h3>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs sm:text-sm font-bold text-slate-700 leading-relaxed space-y-1.5">
                  <p>يرجي التاكد م ان المدرسه مدعومه</p>
                  <p>والتاكد ايضا من الصف الدراسي و الاسم</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsNotFoundModalOpen(false)}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-sm rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>العوده لتسجيل الدخول</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= PWA Install Prompt Modal (Shown on "ابدأ الآن" when app is not installed) ================= */}
      <AnimatePresence>
        {isInstallPromptModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs dir-rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-100 shadow-2xl space-y-5 text-center relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setIsInstallPromptModalOpen(false);
                  setIsStudentModalOpen(true);
                }}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>

              {/* App Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Smartphone className="w-8 h-8" />
              </div>

              {/* Header Texts */}
              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-slate-900">
                  تثبيت تطبيق مدرستي
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  هل تود تثبيت التطبيق على جهازك للوصول السريع، تجربة أسرع بدون إنترنت، وتنبيهات فورية؟
                </p>
              </div>

              {/* Quick Feature Perks */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs font-bold text-slate-700 text-right space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>دخول مباشر وسريع من شاشة جهازك</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>إشعارات الحضور والغياب والدرجات أولاً بأول</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>تجربة أكثر سلاسة واستهلاك أقل للبيانات</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsInstallPromptModalOpen(false);
                    handlePwaInstall();
                  }}
                  className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تثبيت التطبيق</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsInstallPromptModalOpen(false);
                    setIsStudentModalOpen(true);
                  }}
                  className="w-full sm:w-auto py-3 px-6 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
                >
                  <span>تخطي</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= PWA Open App Guidance Modal (Informs user how to open installed app) ================= */}
      <AnimatePresence>
        {isOpenAppGuidanceModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs dir-rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-100 shadow-2xl space-y-5 text-center relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpenAppGuidanceModalOpen(false)}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon Container */}
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
                <Download className="w-8 h-8 text-emerald-600" />
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-slate-900">
                  تثبيت تطبيق مدرستي على جهازك 📲
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  خطوات سريعة وسهلة لتثبيت التطبيق على جهازك للوصول المباشر وتجربة أسرع:
                </p>
              </div>

              {/* Steps */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs font-bold text-slate-700 text-right space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 text-xs font-black">
                    1
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-900 font-black block">متصفح الكمبيوتر (Chrome / Edge / Windows / Mac)</span>
                    <span className="text-slate-500 font-normal block">اضغط على أيقونة التثبيت <strong>(🖥️ أو ➕)</strong> في شريط الرابط بالأعلى، أو من قائمة المتصفح (⋮) واختر <strong>تثبيت تطبيق مدرستي</strong>.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-1.5 border-t border-slate-200/60">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-xs font-black">
                    2
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-900 font-black block">هواتف أندرويد (Google Chrome)</span>
                    <span className="text-slate-500 font-normal block">اضغط على قائمة المتصفح (⋮) بالأعلى ➔ ثم اختر <strong>تثبيت التطبيق</strong> أو <strong>إضافة إلى الشاشة الرئيسية</strong>.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-1.5 border-t border-slate-200/60">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 text-xs font-black">
                    3
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-900 font-black block">أجهزة آبل (iPhone / iPad - Safari)</span>
                    <span className="text-slate-500 font-normal block">اضغط على زر المشاركة <strong>(Share ⎋)</strong> أسفل الشاشة ➔ ثم اختر <strong>إضافة إلى الصفحة الرئيسية (Add to Home Screen ➕)</strong>.</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    const result = await executePwaInstall();
                    if (result.triggeredNativePrompt && result.accepted) {
                      setIsOpenAppGuidanceModalOpen(false);
                    }
                  }}
                  className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>محاولة التثبيت الآن</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpenAppGuidanceModalOpen(false)}
                  className="w-full sm:w-auto py-3 px-6 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
                >
                  <span>حسناً، فهمت</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Informative PWA Install Notice (shown only if beforeinstallprompt is blocked/unavailable) */}
      <AnimatePresence>
        {pwaInstallNotice && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-[calc(100%-2rem)] bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
              <Download className="w-4 h-4" />
            </div>
            <div className="flex-1 text-right">
              <p className="text-xs font-bold leading-relaxed">{pwaInstallNotice}</p>
            </div>
            <button
              onClick={() => setPwaInstallNotice(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
