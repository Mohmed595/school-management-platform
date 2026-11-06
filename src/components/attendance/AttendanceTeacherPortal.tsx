import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, CalendarCheck, Home, Award, User, CheckCircle2, Megaphone, Trophy, MessageSquare } from 'lucide-react';
import { AttendanceTeacherSidebar, AttendanceTab } from './AttendanceTeacherSidebar';
import { AttendanceTeacherHome } from './AttendanceTeacherHome';
import { AttendanceTeacherProfile } from './AttendanceTeacherProfile';
import { AttendanceWizardModal } from './AttendanceWizardModal';
import { ObtainedBadgesView } from '../ui/ObtainedBadgesView';
import { SchoolLeaderboardView } from '../leaderboard/SchoolLeaderboardView';
import { ParentAnnouncementsView } from '../parent/views/ParentAnnouncementsView';
import { PrivateMessagingView } from '../messages/PrivateMessagingView';
import { CommunityMainView } from '../community/CommunityMainView';
import { fetchAnnouncementsApi, fetchSchoolFullDataApi } from '../../lib/schoolApi';
import {
  getClassesBySchool,
  getStudentsBySchool,
  getSchoolAdminInfo,
  getTeachersBySchool,
  getAnnouncementsBySchool,
  setStorage,
  getStorage,
  dedupeById,
  notifyDataChanged,
} from '../../lib/adminStorage';
import { isAnnouncementVisibleToRole } from '../../lib/utils';
import {
  getArabicFormattedTodayDate,
  checkSchoolAttendanceStatusForDate,
} from '../../lib/attendanceStorage';
import {
  getPendingAttendanceBatches,
  flushPendingAttendanceQueue,
  PendingAttendanceBatch,
} from '../../lib/attendanceOfflineSync';
import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react';
import { AccountSwitcherButton } from '../auth/AccountSwitcherButton';

interface AttendanceTeacherPortalProps {
  schoolId: string;
  teacherId?: string;
  teacherName?: string;
  onLogout: () => void;
}

export function AttendanceTeacherPortal({
  schoolId,
  teacherId = 'tch-att-1',
  teacherName = 'مسؤول الحضور والغياب',
  onLogout,
}: AttendanceTeacherPortalProps) {
  const [activeTab, setActiveTab] = useState<AttendanceTab>('home');
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState<boolean>(false);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [wizardClassId, setWizardClassId] = useState<string | null>(null);

  const handleStartWizard = (classId?: string) => {
    setWizardClassId(classId || null);
    setIsWizardOpen(true);
  };

  const [schoolInfo, setSchoolInfo] = useState(() => getSchoolAdminInfo(schoolId));
  const [classes, setClasses] = useState(() => getClassesBySchool(schoolId));
  const [students, setStudents] = useState(() => getStudentsBySchool(schoolId));
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState<boolean>(false);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);

  const [pendingBatches, setPendingBatches] = useState<PendingAttendanceBatch[]>(() =>
    getPendingAttendanceBatches(schoolId)
  );
  const [isSyncingQueue, setIsSyncingQueue] = useState<boolean>(false);
  const [queueSyncMessage, setQueueSyncMessage] = useState<string | null>(null);

  // Find real teacher name if available
  const currentTeachers = getTeachersBySchool(schoolId);
  const matchedTeacher = currentTeachers.find((t) => t.id === teacherId || t.isAttendanceOfficer);
  const displayTeacherName = matchedTeacher ? matchedTeacher.name : teacherName;

  const todayInfo = getArabicFormattedTodayDate();
  const status = checkSchoolAttendanceStatusForDate(schoolId, todayInfo.isoDate);

  const loadAnnouncements = async () => {
    if (!schoolId) return;
    setAnnouncementsLoading(true);
    setAnnouncementsError(null);
    try {
      const fetched = await fetchAnnouncementsApi(schoolId);
      const visible = (fetched || []).filter((a) =>
        isAnnouncementVisibleToRole(a.targetAudience, 'attendance_teacher')
      );
      setAnnouncements(visible);
    } catch (err: any) {
      setAnnouncementsError(err?.message || 'فشل تحميل الإعلانات المدرسية من الخادم');
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const refreshData = useCallback(() => {
    setSchoolInfo(getSchoolAdminInfo(schoolId));
    setClasses(getClassesBySchool(schoolId));
    setStudents(getStudentsBySchool(schoolId));
    setPendingBatches(getPendingAttendanceBatches(schoolId));
    const localAncs = getAnnouncementsBySchool(schoolId).filter((a) =>
      isAnnouncementVisibleToRole(a.targetAudience, 'attendance_teacher')
    );
    if (localAncs.length > 0) {
      setAnnouncements((prev) => (prev.length === 0 ? localAncs : prev));
    }
  }, [schoolId]);

  useEffect(() => {
    refreshData();
    loadAnnouncements();

    const loadServerSchoolData = async () => {
      if (!schoolId) return;
      try {
        const fullData = await fetchSchoolFullDataApi(schoolId);
        if (fullData && fullData.success) {
          if (Array.isArray(fullData.classes) && fullData.classes.length > 0) {
            setClasses(fullData.classes);
            setStorage(`school_${schoolId}_classes`, fullData.classes);
            const allStored = getStorage<any[]>('classes', []);
            const otherSchools = allStored.filter((c) => c.schoolId !== schoolId);
            setStorage('classes', dedupeById([...otherSchools, ...fullData.classes]));
          }
          if (Array.isArray(fullData.students) && fullData.students.length > 0) {
            setStudents(fullData.students);
            setStorage(`school_${schoolId}_students`, fullData.students);
            const allStoredStudents = getStorage<any[]>('students', []);
            const otherSchoolsStudents = allStoredStudents.filter((s) => s.schoolId !== schoolId);
            setStorage('students', dedupeById([...otherSchoolsStudents, ...fullData.students]));
          }
          if (fullData.schoolInfo) {
            setSchoolInfo(fullData.schoolInfo);
          }
          notifyDataChanged('classes');
          notifyDataChanged('students');
        }
      } catch (err) {
        console.warn('AttendanceTeacherPortal: using local school cache:', err);
      }
    };
    loadServerSchoolData();

    const handleDataChanged = (e: Event) => {
      refreshData();
      const eventType = (e as CustomEvent)?.detail?.type;
      if (!eventType || eventType === 'announcements' || eventType === 'school_init' || eventType === 'central_sync_complete' || e.type === 'storage') {
        loadAnnouncements();
      }
    };

    const handleQueueUpdated = () => {
      setPendingBatches(getPendingAttendanceBatches(schoolId));
    };

    window.addEventListener('school_data_changed', handleDataChanged);
    window.addEventListener('storage', handleDataChanged);
    window.addEventListener('attendance_offline_queued', handleQueueUpdated);
    window.addEventListener('attendance_queue_flushed', handleQueueUpdated);
    window.addEventListener('online', handleQueueUpdated);

    return () => {
      window.removeEventListener('school_data_changed', handleDataChanged);
      window.removeEventListener('storage', handleDataChanged);
      window.removeEventListener('attendance_offline_queued', handleQueueUpdated);
      window.removeEventListener('attendance_queue_flushed', handleQueueUpdated);
      window.removeEventListener('online', handleQueueUpdated);
    };
  }, [schoolId, refreshData]);

  // When clicking on 'attendance' tab, auto trigger wizard modal
  const handleTabChange = (tab: AttendanceTab) => {
    setActiveTab(tab);
  };

  return (
    <div className="h-screen bg-[#F8FAFC] flex font-['Cairo',sans-serif] text-slate-900 dir-rtl selection:bg-blue-100 selection:text-blue-700 overflow-hidden">
      {/* Sidebar */}
      <AttendanceTeacherSidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onLogout={onLogout}
        schoolName={schoolInfo.name}
        teacherName={displayTeacherName}
        isOpenMobile={isOpenMobileSidebar}
        setIsOpenMobile={setIsOpenMobileSidebar}
      />

      {/* Main Layout Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden ${
          activeTab === 'private_messages' || activeTab === 'community' ? 'pb-14 lg:pb-0' : 'pb-20 lg:pb-8'
        }`}
      >
        {/* Top Header (Hidden in private_messages and community to provide full immersion for chat) */}
        {activeTab !== 'private_messages' && activeTab !== 'community' && (
          <header className="bg-white border-b border-slate-200/80 px-4 py-3 lg:py-4 sticky top-0 z-10 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsOpenMobileSidebar(true)}
                className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="القائمة"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                    لوحة مسؤول الحضور
                  </h1>
                  <p className="text-[10px] font-bold text-slate-500 mt-0.5">{schoolInfo.name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Account Switcher Button */}
              <AccountSwitcherButton variant="compact" />

              {/* Dynamic Header Action Button */}
              <button
                onClick={() => handleStartWizard()}
                className={`py-2 px-3.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  status.isCompleted
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white'
                }`}
              >
                {status.isCompleted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>تم أخذ الحضور ✓</span>
                  </>
                ) : (
                  <>
                    <CalendarCheck className="w-4 h-4" />
                    <span>أخذ الحضور الآن</span>
                  </>
                )}
              </button>
            </div>
          </header>
        )}

        {/* View Router Main Container */}
        <main
          className={`flex-1 max-w-7xl w-full mx-auto ${
            activeTab === 'private_messages' || activeTab === 'community'
              ? 'p-0 sm:p-2 lg:p-3 h-full min-h-0 pb-14 lg:pb-0 overflow-hidden'
              : 'overflow-y-auto p-3.5 sm:p-6 lg:p-8 pb-20 lg:pb-8'
          }`}
        >
          {/* Offline Pending Queue Notice */}
          {pendingBatches.length > 0 && (
            <div className="mb-5 bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  <WifiOff className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-amber-950">
                    يوجد {pendingBatches.length} كشف حضور محفوظ محلياً بأمان (وضع غير متصل)
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    تم تأمين كافة سجلات الحضور والغياب على جهازك لضمان عدم ضياع أي بيانات. ستتم المزامنة التلقائية مع الخادم المركزي فور عودة الاتصال، أو يمكنك المزامنة الآن.
                  </p>
                  {queueSyncMessage && (
                    <p className="text-xs font-bold text-blue-700 bg-blue-100/70 p-1.5 rounded-lg border border-blue-200 mt-1.5 inline-block">
                      {queueSyncMessage}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                disabled={isSyncingQueue}
                onClick={async () => {
                  setIsSyncingQueue(true);
                  setQueueSyncMessage(null);
                  try {
                    const res = await flushPendingAttendanceQueue(schoolId);
                    setQueueSyncMessage(res.message);
                    setPendingBatches(getPendingAttendanceBatches(schoolId));
                  } catch (e: any) {
                    setQueueSyncMessage('تعذرت المزامنة: يرجى التحقق من اتصال الإنترنت.');
                  } finally {
                    setIsSyncingQueue(false);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingQueue ? 'animate-spin' : ''}`} />
                <span>{isSyncingQueue ? 'جارِ المزامنة...' : 'مزامنة السجلات الآن'}</span>
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AttendanceTeacherHome
                  schoolId={schoolId}
                  schoolName={schoolInfo.name}
                  teacherName={displayTeacherName}
                  classes={classes && classes.length > 0 ? classes : getClassesBySchool(schoolId)}
                  students={students && students.length > 0 ? students : getStudentsBySchool(schoolId)}
                  onStartWizard={(classId) => handleStartWizard(classId)}
                  onNavigateTab={(tab) => handleTabChange(tab)}
                />
              </motion.div>
            )}

            {activeTab === 'private_messages' && (
              <motion.div
                key="private_messages"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col min-h-0 w-full"
              >
                <PrivateMessagingView
                  schoolId={schoolId}
                  userRole="attendance_teacher"
                  currentUserId={teacherId}
                  currentUserName={displayTeacherName}
                />
              </motion.div>
            )}

            {activeTab === 'community' && (
              <motion.div
                key="community"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <CommunityMainView
                  schoolId={schoolId}
                  userId={teacherId}
                  userName={`مسؤول الحضور (${displayTeacherName})`}
                  userRole="teacher"
                  userBadge="مسؤول الحضور والغياب"
                  onBack={() => handleTabChange('home')}
                />
              </motion.div>
            )}

            {activeTab === 'leaderboard' && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SchoolLeaderboardView
                  schoolId={schoolId}
                  userRole="attendance_teacher"
                  schoolName={schoolInfo.name}
                />
              </motion.div>
            )}

            {activeTab === 'badges' && (
              <motion.div
                key="badges"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ObtainedBadgesView
                  accountType="attendance"
                  entityId={teacherId}
                  entityName={displayTeacherName}
                  schoolName={schoolInfo.name}
                />
              </motion.div>
            )}

            {activeTab === 'announcements' && (
              <motion.div
                key="announcements"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ParentAnnouncementsView
                  announcements={announcements}
                  role="attendance_teacher"
                  loading={announcementsLoading}
                  error={announcementsError}
                  onRetry={loadAnnouncements}
                />
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AttendanceTeacherProfile
                  schoolId={schoolId}
                  schoolName={schoolInfo.name}
                  teacherName={displayTeacherName}
                  onLogout={onLogout}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-30 px-1 py-1 flex items-center justify-around shadow-lg dir-rtl">
          {[
            { id: 'home', label: 'الرئيسية', icon: Home },
            { id: 'community', label: 'المجتمع', icon: MessageSquare },
            { id: 'private_messages', label: 'رسائلي', icon: MessageSquare },
            { id: 'announcements', label: 'الإعلانات', icon: Megaphone },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id as AttendanceTab)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
                  isActive ? 'text-blue-600 font-extrabold scale-105' : 'text-slate-500 font-medium hover:text-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 stroke-[2.5]' : 'text-slate-400'}`} />
                <span className="text-[10px] mt-0.5 leading-none">{item.label}</span>
              </button>
            );
          })}

          {/* 5th element: المزيد opens the mobile sidebar */}
          <button
            onClick={() => setIsOpenMobileSidebar(true)}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer text-slate-500 font-medium hover:text-slate-800"
          >
            <Menu className="w-5 h-5 text-slate-400" />
            <span className="text-[10px] mt-0.5 leading-none">المزيد</span>
          </button>
        </nav>
      </div>

      {/* Attendance Multi-Step Wizard Modal */}
      <AttendanceWizardModal
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setWizardClassId(null);
          setActiveTab('home');
        }}
        classes={classes && classes.length > 0 ? classes : getClassesBySchool(schoolId)}
        students={students && students.length > 0 ? students : getStudentsBySchool(schoolId)}
        schoolId={schoolId}
        teacherId={teacherId}
        teacherName={displayTeacherName}
        initialClassId={wizardClassId}
        onCompleteSession={() => {
          setActiveTab('home');
          setWizardClassId(null);
          refreshData();
        }}
      />
    </div>
  );
}
