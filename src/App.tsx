import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, RefreshCw, WifiOff, AlertTriangle } from 'lucide-react';
import { ViewTab, School, SubscriptionPlan } from './types';
import {
  getStoredAuth,
  setStoredAuth,
  getStoredSession,
  saveStoredSession,
  clearStoredSession,
  getStoredSchools,
  UserSession,
} from './lib/storage';
import { getStoredTheme, applyThemeToDocument } from './lib/theme';
import { updateSchoolAdminInfo, seedSchoolData, syncSchoolDataFromCentralDb, syncAllLocalSchoolsToCentralDb, purgeSchoolLocalData } from './lib/adminStorage';
import { playLoginSound } from './lib/sound';
import {
  fetchSchoolsApi,
  createSchoolApi,
  updateSchoolApi,
  deleteSchoolApi,
  seedInitialSchoolsApi,
  schoolAdminLoginApi,
  CreateSchoolPayload,
} from './lib/schoolApi';
import { getOrCreateDeviceId } from './lib/trustedDeviceStorage';

// Auth Components
import { StartLandingLogin } from './components/auth/StartLandingLogin';

// Parent Portal
import { ParentPortal } from './components/parent/ParentPortal';

// Teacher Portal
import { TeacherPortal } from './components/teacher/TeacherPortal';

// Attendance Teacher Portal
import { AttendanceTeacherPortal } from './components/attendance/AttendanceTeacherPortal';

// School Admin Dashboard
import { SchoolAdminDashboard } from './components/admin/SchoolAdminDashboard';

// Layout Components (Owner)
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';

// Dashboard Components (Owner)
import { DatabaseDashboard } from './components/database/DatabaseDashboard';
import { PlatformUsageView } from './components/usage/PlatformUsageView';
import { MetricCards } from './components/dashboard/MetricCards';
import { RecentSchoolsWidget } from './components/dashboard/RecentSchoolsWidget';
import { GovernoratesDistribution } from './components/dashboard/GovernoratesDistribution';

// Schools Components (Owner)
import { SchoolsTable } from './components/schools/SchoolsTable';
import { SchoolCreateModal } from './components/schools/SchoolCreateModal';
import { SchoolEditModal } from './components/schools/SchoolEditModal';
import { SchoolDeleteModal } from './components/schools/SchoolDeleteModal';
import { SchoolSuspendModal } from './components/schools/SchoolSuspendModal';
import { SchoolDetailsModal } from './components/schools/SchoolDetailsModal';

// Licenses & Analytics & Settings & Messages (Owner)
import { LicensesList } from './components/licenses/LicensesList';
import { AnalyticsCharts } from './components/analytics/AnalyticsCharts';
import { SettingsForm } from './components/settings/SettingsForm';
import { SmsManagementView } from './components/messages/SmsManagementView';
import { OwnerTicketsView } from './components/owner/OwnerTicketsView';

// Toast System
import { ToastContainer, ToastMessage } from './components/ui/Toast';
import { AiChatbotWidget } from './components/ui/AiChatbotWidget';
import { useBrowserMode } from './lib/browserCompat';

export default function App() {
  const browserMode = useBrowserMode();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(getStoredAuth);
  const [userRole, setUserRole] = useState<'owner' | 'school_admin' | 'parent' | 'teacher' | 'attendance_teacher'>(() => {
    const s = getStoredSession();
    return s?.isAuthenticated && s?.userRole ? s.userRole : 'owner';
  });
  const [currentSchoolId, setCurrentSchoolId] = useState<string>(() => {
    const s = getStoredSession();
    return s?.schoolId || 'sch-1';
  });
  const [currentStudentNationalId, setCurrentStudentNationalId] = useState<string>(() => {
    const s = getStoredSession();
    return s?.studentId || '';
  });
  const [currentTeacherId, setCurrentTeacherId] = useState<string>(() => {
    const s = getStoredSession();
    return s?.teacherId || '';
  });

  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state (Owner)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [suspendingSchool, setSuspendingSchool] = useState<School | null>(null);
  const [deletingSchool, setDeletingSchool] = useState<School | null>(null);
  const [detailsSchool, setDetailsSchool] = useState<School | null>(null);

  // Toast Stack
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const loadSchoolsFromCentralDb = useCallback(async () => {
    try {
      setIsLoadingSchools(true);
      setServerError(null);
      const serverSchools = await fetchSchoolsApi();
      if (Array.isArray(serverSchools) && serverSchools.length > 0) {
        setSchools(serverSchools);
      }
    } catch (err: any) {
      const cached = getStoredSchools();
      if (cached && cached.length > 0) {
        setSchools(cached);
        setServerError(null);
      } else {
        setServerError(err.message || 'تعذر الاتصال بقاعدة البيانات المركزية');
      }
    } finally {
      setIsLoadingSchools(false);
    }
  }, []);

  useEffect(() => {
    applyThemeToDocument(getStoredTheme());
    
    // Load schools directly from central database
    loadSchoolsFromCentralDb();

    // Auto-login if valid persistent session exists
    const session = getStoredSession();
    if (session && session.isAuthenticated) {
      setIsAuthenticated(true);
      setUserRole(session.userRole);
      if (session.schoolId) {
        setCurrentSchoolId(session.schoolId);
      }
      if (session.studentId) setCurrentStudentNationalId(session.studentId);
      if (session.teacherId) setCurrentTeacherId(session.teacherId);
    }

    window.addEventListener('school_data_changed', loadSchoolsFromCentralDb);
    return () => {
      window.removeEventListener('school_data_changed', loadSchoolsFromCentralDb);
    };
  }, [loadSchoolsFromCentralDb]);

  // Sync data for current active school whenever currentSchoolId changes
  useEffect(() => {
    if (currentSchoolId) {
      syncSchoolDataFromCentralDb(currentSchoolId);
    }
  }, [currentSchoolId]);

  const addToast = (
    title: string,
    description?: string,
    type: 'success' | 'error' | 'info' = 'success'
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSessionLoginSuccess = (session: UserSession) => {
    playLoginSound();
    setIsAuthenticated(true);
    setUserRole(session.userRole);
    if (session.schoolId) setCurrentSchoolId(session.schoolId);
    if (session.studentId) setCurrentStudentNationalId(session.studentId);
    if (session.teacherId) setCurrentTeacherId(session.teacherId);

    const roleTitles: Record<string, string> = {
      owner: 'مالك المنظومة',
      school_admin: 'إدارة المدرسة',
      parent: 'طالب / ولي أمر',
      teacher: 'معلم المادة',
      attendance_teacher: 'مسؤول الغياب والتسجيل',
    };

    addToast(
      'تم تسجيل الدخول بنجاح',
      `أهلاً بك (${session.userDisplayName || roleTitles[session.userRole]})`,
      'success'
    );
  };

  const handleLogout = () => {
    clearStoredSession();
    setIsAuthenticated(false);
    setUserRole('owner');
    addToast('تسجيل الخروج', 'تم تسجيل الخروج بنجاح والعودة لشاشة البداية', 'info');
  };

  const handleSwitchToAdminMode = async (schoolId: string) => {
    setUserRole('school_admin');
    setCurrentSchoolId(schoolId);
    
    // Acquire signed session token for school_admin
    const targetSchool = schools.find((s) => s.id === schoolId);
    if (targetSchool) {
      seedSchoolData(schoolId, targetSchool.name, targetSchool.code);
    }
    let sessionToken = '';
    let sessionId = `tds_adm_${Date.now().toString(36)}`;
    
    try {
      const authRes = await schoolAdminLoginApi({
        schoolCode: targetSchool?.code || schoolId,
        licenseKey: targetSchool?.licenseKey || '',
        deviceId: getOrCreateDeviceId(),
        trustDevice300Days: true,
      });
      if (authRes?.sessionToken) {
        sessionToken = authRes.sessionToken;
        sessionId = authRes.sessionId || sessionId;
      }
    } catch (e) {
      console.warn('Could not auto-sign admin token during switch:', e);
    }

    saveStoredSession({
      isAuthenticated: true,
      userRole: 'school_admin',
      schoolId: schoolId,
      userDisplayName: targetSchool?.name || 'إدارة المدرسة',
      sessionToken,
      trustedSessionId: sessionId,
    });
    addToast('الانتقال للوحة المدرسة', 'تم توثيق صلاحيات إدارة المدرسة في قاعدة البيانات المركزية', 'info');
  };

  // School CRUD actions (Owner - Central Database API)
  const handleCreateSchool = async (payload: CreateSchoolPayload) => {
    try {
      const { school: created, importResult } = await createSchoolApi(payload);
      setSchools((prev) => [created, ...prev.filter((s) => s.id !== created.id)]);
      // Seed default admin records in adminStorage as needed
      seedSchoolData(created.id, created.name, created.code);
      let toastMsg = `تم تسجيل ${created.name} في قاعدة البيانات المركزية`;
      if (importResult && importResult.imported > 0) {
        const clsCount = importResult.classesCount || importResult.classesCreated?.length || 0;
        toastMsg += ` وتم استيراد ${importResult.imported} طالباً وتوزيعهم على ${clsCount} فصول دراسية!`;
      }
      addToast('تمت إضافة المدرسة بنجاح', toastMsg, 'success');
      loadSchoolsFromCentralDb();
      return { school: created, importResult };
    } catch (err: any) {
      console.error('Failed to create school:', err);
      addToast('فشل إضافة المدرسة', err.message || 'حدث خطأ أثناء حفظ المدرسة في قاعدة البيانات', 'error');
      throw err;
    }
  };

  const handleUpdateSchool = async (updatedSchool: School) => {
    try {
      const saved = await updateSchoolApi(updatedSchool.id, updatedSchool);
      setSchools((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
      // Sync changes to school_info in adminStorage as well
      updateSchoolAdminInfo({
        schoolId: saved.id,
        name: saved.name,
        code: saved.code,
        licenseKey: saved.licenseKey,
        governorate: saved.governorate,
        educationalDistrict: 'الإدارة التعليمية',
        address: `محافظة ${saved.governorate}`,
        phone: saved.principalPhone,
        email: saved.principalEmail,
        principalName: saved.principalName,
        academicYear: '2025/2026',
      });
      addToast('تم تحديث المدرسة', `تم حفظ بيانات ${saved.name} في قاعدة البيانات المركزية`, 'success');
    } catch (err: any) {
      console.error('Failed to update school:', err);
      addToast('فشل تحديث المدرسة', err.message || 'حدث خطأ أثناء تحديث بيانات المدرسة في الخادم', 'error');
    }
  };

  const handleConfirmToggleSuspend = async (schoolToToggle: School) => {
    const updatedStatus = schoolToToggle.status === 'نشطة' ? 'معلقة' : 'نشطة';
    try {
      const saved = await updateSchoolApi(schoolToToggle.id, { status: updatedStatus });
      setSchools((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
      addToast(
        updatedStatus === 'نشطة' ? 'تم إعادة تفعيل المدرسة' : 'تم تعليق ترخيص المدرسة',
        `مدرسة: ${schoolToToggle.name}`,
        updatedStatus === 'نشطة' ? 'success' : 'info'
      );
    } catch (err: any) {
      console.error('Failed to toggle school status:', err);
      addToast('فشل تغيير حالة المدرسة', err.message || 'حدث خطأ أثناء تحديث حالة المدرسة', 'error');
    }
  };

  const handleConfirmDelete = async (schoolId: string) => {
    const target = schools.find((s) => s.id === schoolId);
    try {
      await deleteSchoolApi(schoolId);
      purgeSchoolLocalData(schoolId);
      setSchools((prev) => prev.filter((s) => s.id !== schoolId));
      if (currentSchoolId === schoolId) {
        const remaining = schools.filter((s) => s.id !== schoolId);
        setCurrentSchoolId(remaining.length > 0 ? remaining[0].id : '');
      }
      addToast(
        'تم حذف المدرسة نهائياً',
        `تم إزالة سجل ${target ? target.name : schoolId} وكافة بياناتها التابعة نهائياً من قاعدة البيانات المركزية`,
        'error'
      );
    } catch (err: any) {
      console.error('Failed to delete school:', err);
      addToast('فشل حذف المدرسة', err.message || 'حدث خطأ أثناء إزالة المدرسة من قاعدة البيانات', 'error');
    }
  };

  const handleGenerateLicense = async (
    schoolId: string,
    newKey: string,
    newExpiry: string,
    plan: SubscriptionPlan
  ) => {
    const target = schools.find((s) => s.id === schoolId);
    if (!target) return;

    try {
      const saved = await updateSchoolApi(schoolId, {
        licenseKey: newKey,
        licenseExpiry: newExpiry,
        subscription: plan,
        status: 'نشطة',
      });
      setSchools((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
      addToast('تم إصدار وتفعيل الترخيص بنجاح', `تم تحديث ترخيص ${target.name} إلى باقة ${plan}`, 'success');
    } catch (err: any) {
      console.error('Failed to generate license:', err);
      addToast('فشل إصدار الترخيص', err.message || 'حدث خطأ أثناء تفعيل الترخيص', 'error');
    }
  };

  const handleResetData = async () => {
    try {
      await seedInitialSchoolsApi();
      await loadSchoolsFromCentralDb();
      addToast('تمت استعادة البيانات المركزية', 'تمت إعادة ضبط قائمة المدارس في قاعدة البيانات المركزية بنجاح', 'success');
    } catch (e: any) {
      addToast('خطأ في العملية', e.message || 'فشلت استعادة البيانات في قاعدة البيانات المركزية', 'error');
    }
  };

  // 1. Not Authenticated -> Start Landing & Login
  if (!isAuthenticated) {
    return <StartLandingLogin onLoginSuccess={handleSessionLoginSuccess} />;
  }

  // 2. Attendance Teacher Role -> Attendance Teacher Portal
  if (userRole === 'attendance_teacher') {
    return (
      <AttendanceTeacherPortal
        schoolId={currentSchoolId}
        teacherId={currentTeacherId}
        onLogout={handleLogout}
      />
    );
  }

  // 3. Teacher Role -> Teacher Portal
  if (userRole === 'teacher') {
    return (
      <TeacherPortal
        schoolId={currentSchoolId}
        teacherId={currentTeacherId}
        onLogout={handleLogout}
      />
    );
  }

  // 3. Parent Role -> Parent Portal
  if (userRole === 'parent') {
    return (
      <ParentPortal
        studentNationalId={currentStudentNationalId}
        schoolId={currentSchoolId}
        onLogout={handleLogout}
      />
    );
  }

  // 4. School Admin Role -> School Administration Dashboard
  if (userRole === 'school_admin') {
    return (
      <SchoolAdminDashboard
        schoolId={currentSchoolId}
        onLogout={handleLogout}
        onSwitchToOwner={() => {
          loadSchoolsFromCentralDb();
          setUserRole('owner');
        }}
      />
    );
  }

  // 3. Platform Owner Role -> Platform Owner Dashboard
  const activeSchoolsCount = schools.filter((s) => s.status === 'نشطة').length;

  return (
    <div data-browser-mode={browserMode} className="min-h-screen bg-[#F8FAFC] flex font-['Cairo',sans-serif] text-slate-900 dir-rtl selection:bg-blue-100 selection:text-blue-700 max-w-full overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        schoolsCount={schools.length}
        isOpenMobile={isOpenMobileSidebar}
        setIsOpenMobile={setIsOpenMobileSidebar}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
        {/* Top Navigation */}
        <TopNav
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsOpenMobileSidebar(true)}
          onOpenCreateSchool={() => setIsCreateOpen(true)}
          totalActiveSchools={activeSchoolsCount}
          searchQuery={searchQuery}
          setSearchQuery={(q) => {
            setSearchQuery(q);
            if (activeTab !== 'schools') {
              setActiveTab('schools');
            }
          }}
        />

        {/* View Router */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 min-w-0 max-w-full">
          {/* Central Database Failure Banner (Zero Silent Fallbacks) */}
          {serverError && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0">
                  <WifiOff className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">تعذر الاتصال بقاعدة البيانات المركزية</h4>
                  <p className="text-xs text-amber-800/80 mt-0.5">{serverError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => loadSchoolsFromCentralDb()}
                disabled={isLoadingSchools}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition shadow-xs disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSchools ? 'animate-spin' : ''}`} />
                <span>إعادة المحاولة</span>
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* 1. Owner Dashboard View */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 min-w-0 max-w-full"
              >
                {/* Metric Cards Row */}
                <MetricCards schools={schools} />

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0 max-w-full">
                  {/* Recent Schools Table Widget (2 cols) */}
                  <div className="lg:col-span-2 min-w-0 max-w-full">
                    <RecentSchoolsWidget
                      schools={schools}
                      onViewAll={() => setActiveTab('schools')}
                      onViewDetails={(s) => setDetailsSchool(s)}
                      onEditSchool={(s) => setEditingSchool(s)}
                      onToggleSuspend={(s) => setSuspendingSchool(s)}
                    />
                  </div>

                  {/* Governorates Distribution Widget (1 col) */}
                  <div>
                    <GovernoratesDistribution
                      schools={schools}
                      onSelectGovernorate={() => {
                        setActiveTab('schools');
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. Schools Page View */}
            {activeTab === 'schools' && (
              <motion.div
                key="schools"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SchoolsTable
                  schools={schools}
                  onOpenCreate={() => setIsCreateOpen(true)}
                  onViewDetails={(s) => setDetailsSchool(s)}
                  onEditSchool={(s) => setEditingSchool(s)}
                  onToggleSuspend={(s) => setSuspendingSchool(s)}
                  onDeleteSchool={(s) => setDeletingSchool(s)}
                  onToast={addToast}
                  initialSearchQuery={searchQuery}
                  onOpenAdminDashboard={(sId) => handleSwitchToAdminMode(sId)}
                />
              </motion.div>
            )}

            {/* 3. Licenses View */}
            {activeTab === 'licenses' && (
              <motion.div
                key="licenses"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <LicensesList
                  schools={schools}
                  onGenerateLicense={handleGenerateLicense}
                  onToast={addToast}
                />
              </motion.div>
            )}

            {/* 3.5. Messages (SMS Management) View */}
            {activeTab === 'messages' && (
              <motion.div
                key="messages"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SmsManagementView onAddToast={addToast} />
              </motion.div>
            )}

            {/* 4. Analytics View */}
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AnalyticsCharts schools={schools} onAddToast={addToast} />
              </motion.div>
            )}

            {/* 4.1. Support & Complaints Tickets View (Owner Only) */}
            {activeTab === 'tickets' && (
              <motion.div
                key="tickets"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <OwnerTicketsView onToast={addToast} />
              </motion.div>
            )}

            {/* 4.5. Database View (Owner Only) */}
            {activeTab === 'database' && (
              <motion.div
                key="database"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <DatabaseDashboard onToast={addToast} />
              </motion.div>
            )}

            {/* 4.6. Platform Usage View (Owner Only) */}
            {activeTab === 'platform_usage' && (
              <motion.div
                key="platform_usage"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <PlatformUsageView onToast={addToast} />
              </motion.div>
            )}

            {/* 5. Settings View */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SettingsForm schools={schools} onResetData={handleResetData} onToast={addToast} />
              </motion.div>
            )}

            {/* 6. AI Assistant View */}
            {activeTab === 'ai_assistant' && (
              <motion.div
                key="ai_assistant"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AiChatbotWidget
                  role="owner"
                  title="مستشار مالك المنظومة الذكي"
                  subtitle="تحليلات سريعة ومباشرة للمدارس والاشتراكات"
                  badgeText="ودود ومباشر"
                  themeColor="indigo"
                  embedded={true}
                  contextData={{
                    platformStats: {
                      totalSchools: schools.length,
                      activeSchools: schools.filter((s) => s.status === 'نشطة').length,
                      suspendedSchools: schools.filter((s) => s.status === 'معلقة').length,
                      totalStudentsEstimate: schools.reduce((acc, s) => acc + (s.studentsCount || 0), 0),
                    },
                    subscriptionsBreakdown: {
                      basic: schools.filter((s) => (s.subscription as string) === 'مجاني' || s.subscription === 'أساسي').length,
                      professional: schools.filter((s) => s.subscription === 'احترافي').length,
                      enterprise: schools.filter((s) => (s.subscription as string) === 'مؤسسي' || s.subscription === 'بريميوم').length,
                    },
                    schoolsOverview: schools.map((s) => ({
                      name: s.name,
                      code: s.code,
                      governorate: s.governorate,
                      status: s.status,
                      subscription: s.subscription,
                      licenseExpiry: s.licenseExpiry,
                      studentsCount: s.studentsCount,
                    })),
                  }}
                  quickPrompts={[
                    'إجمالي الاشتراكات النشطة وأعداد المدارس؟',
                    '📊 تصدير كشف المدارس والتراخيص (ملف Excel .xlsx)',
                    'ما هي المدارس المعلقة أو القريبة من انتهاء الترخيص؟',
                    'توزيع المدارس حسب المحافظات والخطط',
                    'عطني ملخص سريع لأداء المنظومة اليوم',
                  ]}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Global Modals */}
      <SchoolCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateSchool={handleCreateSchool}
        onToast={addToast}
      />

      <SchoolEditModal
        school={editingSchool}
        isOpen={Boolean(editingSchool)}
        onClose={() => setEditingSchool(null)}
        onUpdateSchool={handleUpdateSchool}
        onToast={addToast}
      />

      <SchoolSuspendModal
        school={suspendingSchool}
        isOpen={Boolean(suspendingSchool)}
        onClose={() => setSuspendingSchool(null)}
        onConfirmToggle={handleConfirmToggleSuspend}
      />

      <SchoolDeleteModal
        school={deletingSchool}
        isOpen={Boolean(deletingSchool)}
        onClose={() => setDeletingSchool(null)}
        onConfirmDelete={handleConfirmDelete}
      />

      <SchoolDetailsModal
        school={detailsSchool}
        isOpen={Boolean(detailsSchool)}
        onClose={() => setDetailsSchool(null)}
        onToast={addToast}
        onOpenAdminDashboard={(sId) => handleSwitchToAdminMode(sId)}
      />

      {/* Global Toast Stack */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
