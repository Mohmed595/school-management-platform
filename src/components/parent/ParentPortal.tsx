import React, { useState, useEffect } from 'react';
import { ParentViewTab, ParentPortalData } from '../../types/parent';
import { getParentPortalData, syncParentDataToLocalStorage } from '../../lib/parentStorage';
import { getStoredSession, getStoredSessionToken, saveStoredSession } from '../../lib/storage';
import { getStorage, setStorage } from '../../lib/adminStorage';
import { fetchAnnouncementsApi, fetchStudentAttendanceApi, fetchStudentPointsApi, fetchStudentBadgesApi } from '../../lib/schoolApi';
import { fetchAndSyncStudentAdminActions } from '../../lib/adminActionStorage';
import { AdministrativeAction } from '../../types/adminAction';
import { calculateStreakFromAttendance } from '../../lib/streakStorage';
import { getUnboxedBadgesForStudent, BADGES_STORAGE_KEY, STUDENT_BADGES_STORAGE_KEY } from '../../lib/badgeStorage';
import { MysteryGiftModal } from '../ui/MysteryGiftModal';
import { Badge, StudentBadge } from '../../types/badge';

import { ParentSidebar } from './ParentSidebar';
import { ParentTopNav } from './ParentTopNav';

// Views
import { ParentHomeView } from './views/ParentHomeView';
import { ParentReportsView } from './views/ParentReportsView';
import { ParentAttendanceView } from './views/ParentAttendanceView';
import { ParentBehaviorView } from './views/ParentBehaviorView';
import { ParentAnnouncementsView } from './views/ParentAnnouncementsView';
import { ParentProfileView } from './views/ParentProfileView';
import { ParentNotificationsView } from './views/ParentNotificationsView';
import { ParentTicketsView } from './views/ParentTicketsView';
import { PrivateMessagingView } from '../messages/PrivateMessagingView';
import { ObtainedBadgesView } from '../ui/ObtainedBadgesView';
import { CommunityMainView } from '../community/CommunityMainView';
import { SchoolLeaderboardView } from '../leaderboard/SchoolLeaderboardView';
import { ViewSkeleton } from '../ui/Skeleton';
import { parseEgyptianClassDetails } from '../../lib/egyptianSchoolUtils';
import { playSwitchTabSound } from '../../lib/sound';
import { isAnnouncementVisibleToRole } from '../../lib/utils';
import { useSchoolExtensions } from '../../hooks/useSchoolExtensions';

import {
  Home,
  CalendarCheck2,
  Award,
  MoreHorizontal,
  Star,
  Bell,
  Inbox,
  User,
  LogOut,
  X,
  Sparkles,
  Grid,
  Lock,
  MessageSquare,
} from 'lucide-react';

interface ParentPortalProps {
  studentNationalId?: string;
  schoolId?: string;
  onLogout: () => void;
}

export function ParentPortal({ studentNationalId, schoolId, onLogout }: ParentPortalProps) {
  const [activeTab, setActiveTab] = useState<ParentViewTab>('home');
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);

  const fetchRealPortalData = () => {
    const session = getStoredSession();
    return getParentPortalData({
      studentNationalId: studentNationalId || session?.studentId,
      studentId: session?.studentId,
      studentCode: session?.studentCode,
      schoolId: schoolId || session?.schoolId,
      studentName: session?.studentName || session?.userDisplayName,
      className: session?.className,
      avatarUid: session?.avatar_layout_uid,
    });
  };

  const [portalData, setPortalData] = useState<ParentPortalData>(fetchRealPortalData);
  const [announcementsLoading, setAnnouncementsLoading] = useState<boolean>(true);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState<boolean>(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  // School Extensions & Feature Controls
  const effectiveSchoolId = portalData.schoolInfo.schoolId || schoolId;
  const { isFeatureEnabled } = useSchoolExtensions(effectiveSchoolId);
  const isCommunityEnabled = isFeatureEnabled('student_community');

  // Queue of unboxed badges to display as mystery gift cutscene
  const [unboxedQueue, setUnboxedQueue] = useState<
    Array<{ assignment: StudentBadge; badge: Badge }>
  >([]);

  const loadAnnouncements = async (sId: string) => {
    if (!sId) return;
    setAnnouncementsLoading(true);
    setAnnouncementsError(null);
    try {
      const fetched = await fetchAnnouncementsApi(sId);
      const studentVisible = (fetched || []).filter((a) =>
        isAnnouncementVisibleToRole(a.targetAudience, 'student')
      );
      setPortalData((prev) => (prev ? { ...prev, announcements: studentVisible } : prev));
    } catch (err: any) {
      setAnnouncementsError(err?.message || 'فشل تحميل الإعلانات المدرسية من الخادم');
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const loadStudentAttendance = async (sId: string, stdId: string) => {
    if (!sId || !stdId) return;
    setAttendanceLoading(true);
    setAttendanceError(null);
    try {
      const records = await fetchStudentAttendanceApi(sId, stdId);

      // Persist fetched records to localStorage for synchronous offline availability
      if (Array.isArray(records) && records.length > 0) {
        const existing = getStorage<any[]>('attendance', []);
        const attMap = new Map<string, any>();
        existing.forEach((a) => {
          const key = a.id || `${a.studentId}_${a.date}`;
          attMap.set(key, a);
        });
        records.forEach((r) => {
          const key = r.id || `${r.studentId}_${r.date}`;
          attMap.set(key, { ...attMap.get(key), ...r });
        });
        setStorage('attendance', Array.from(attMap.values()));
      }

      const presentDays = records.filter((a) => a.status === 'حاضر').length;
      const absentDays = records.filter((a) => a.status === 'غائب').length;
      const lateDays = records.filter((a) => a.status === 'متأخر').length;
      const totalDays = presentDays + absentDays + lateDays;
      const attendancePercentage = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

      setPortalData((prev) => {
        if (!prev) return prev;
        const updatedStreak = calculateStreakFromAttendance(
          prev.student?.id || stdId,
          prev.student?.name || 'الطالب',
          sId,
          records
        );
        return {
          ...prev,
          attendance: records,
          streak: updatedStreak,
          stats: {
            ...prev.stats,
            presentDays,
            absentDays,
            lateDays,
            attendancePercentage,
          },
        };
      });
    } catch (err: any) {
      setAttendanceError(err?.message || 'فشل جلب سجل الحضور والغياب من خادم المنظومة');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const loadAdminActions = async (sId: string, stdId: string) => {
    if (!sId || !stdId) return;
    try {
      const actions = await fetchAndSyncStudentAdminActions(sId, stdId);
      setPortalData((prev) => (prev ? { ...prev, adminActions: actions } : prev));
    } catch (err: any) {}
  };

  const loadStudentPoints = async (sId: string, stdId: string) => {
    if (!sId || !stdId) return;
    try {
      const points = await fetchStudentPointsApi(sId, stdId);
      setPortalData((prev) => (prev ? { ...prev, points } : prev));
    } catch (err: any) {}
  };

  const loadStudentBadges = async (sId: string, stdId: string) => {
    if (!sId || !stdId) return;
    try {
      const { assignments, badges } = await fetchStudentBadgesApi(sId, stdId);
      if (Array.isArray(badges) && badges.length > 0) {
        const existingBadges = getStorage<Badge[]>(BADGES_STORAGE_KEY, []);
        const bMap = new Map<string, Badge>();
        existingBadges.forEach((b) => bMap.set(b.id, b));
        badges.forEach((b) => bMap.set(b.id, { ...bMap.get(b.id), ...b }));
        setStorage(BADGES_STORAGE_KEY, Array.from(bMap.values()));
      }
      if (Array.isArray(assignments) && assignments.length > 0) {
        const existingAssignments = getStorage<StudentBadge[]>(STUDENT_BADGES_STORAGE_KEY, []);
        const aMap = new Map<string, StudentBadge>();
        existingAssignments.forEach((a) => aMap.set(a.id, a));
        assignments.forEach((a) => aMap.set(a.id, { ...aMap.get(a.id), ...a }));
        setStorage(STUDENT_BADGES_STORAGE_KEY, Array.from(aMap.values()));
      }
      const unboxed = getUnboxedBadgesForStudent(stdId, sId);
      setUnboxedQueue(unboxed);
    } catch (err: any) {
      console.warn('Failed to load student badges from server:', err);
    }
  };

  const loadAuthoritativeStudentProfile = async (sId: string, stdId: string) => {
    if (!sId || !stdId) return;
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/schools/${sId}/students/${stdId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.student) {
          syncParentDataToLocalStorage({ student: json.student });
          try {
            const currentSession = getStoredSession();
            if (
              currentSession &&
              (currentSession.studentId === json.student.id ||
                currentSession.userId === json.student.id ||
                currentSession.studentCode === json.student.studentCode)
            ) {
              if (
                currentSession.className !== json.student.className ||
                currentSession.gradeLevel !== json.student.gradeLevel
              ) {
                currentSession.className = json.student.className;
                currentSession.gradeLevel = json.student.gradeLevel;
                saveStoredSession(currentSession);
              }
            }
          } catch {}
          setPortalData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              student: {
                ...prev.student,
                ...json.student,
                avatar_layout_uid: json.student.avatar_layout_uid,
              },
            };
          });
        }
      }
    } catch (err) {
      // Non-critical fallback
    }
  };

  const refreshData = (e?: Event) => {
    const updatedData = fetchRealPortalData();
    setPortalData(updatedData);

    const targetSchoolId = schoolId || updatedData?.schoolInfo?.schoolId;
    const targetStudentId = updatedData?.student?.id;

    // Check for unboxed mystery gift badges for this student
    if (targetStudentId) {
      const unboxed = getUnboxedBadgesForStudent(targetStudentId, targetSchoolId);
      setUnboxedQueue(unboxed);
    }

    if (!targetSchoolId) return;

    const eventType = (e as CustomEvent)?.detail?.type;

    // If e is undefined (initial mount/explicit refresh) or global sync event, fetch all API datasets
    const isFullSync = !e || !eventType || eventType === 'central_sync_complete' || eventType === 'school_init' || e.type === 'storage' || e.type === 'badges_updated' || eventType === 'community_reconciled';

    if (isFullSync || eventType === 'announcements') {
      loadAnnouncements(targetSchoolId);
    }

    if (targetStudentId) {
      // Always load authoritative student profile from PostgreSQL
      if (isFullSync || eventType === 'students' || eventType === 'classes' || eventType === 'community_reconciled') {
        loadAuthoritativeStudentProfile(targetSchoolId, targetStudentId);
      }

      if (isFullSync || eventType === 'attendance' || eventType === 'attendance_synced' || eventType === 'students') {
        loadStudentAttendance(targetSchoolId, targetStudentId);
      }
      if (isFullSync || eventType === 'admin_action_created' || eventType === 'admin_action_deleted') {
        loadAdminActions(targetSchoolId, targetStudentId);
      }
      if (isFullSync || eventType === 'attendance' || eventType === 'attendance_synced' || eventType === 'badges' || eventType === 'badge_awarded' || eventType === 'badges_updated' || eventType === 'students') {
        loadStudentPoints(targetSchoolId, targetStudentId);
        loadStudentBadges(targetSchoolId, targetStudentId);
      }
    }
  };

  useEffect(() => {
    const handleAvatarUpdated = (e: any) => {
      if (e.detail?.themeId) {
        setPortalData((prev) => {
          if (!prev?.student) return prev;
          return {
            ...prev,
            student: {
              ...prev.student,
              avatar_layout_uid: e.detail.themeId,
            },
          };
        });
      }
    };
    window.addEventListener('student_avatar_updated', handleAvatarUpdated);
    return () => window.removeEventListener('student_avatar_updated', handleAvatarUpdated);
  }, []);

  useEffect(() => {
    refreshData();

    const handleDataChanged = (e: Event) => {
      refreshData(e);
    };

    window.addEventListener('school_data_changed', handleDataChanged);
    window.addEventListener('badges_updated', handleDataChanged);
    window.addEventListener('storage', handleDataChanged);

    return () => {
      window.removeEventListener('school_data_changed', handleDataChanged);
      window.removeEventListener('badges_updated', handleDataChanged);
      window.removeEventListener('storage', handleDataChanged);
    };
  }, [studentNationalId, schoolId]);

  const handleClaimBadge = () => {
    // Remove current badge from queue and update portal data locally
    setUnboxedQueue((prev) => prev.slice(1));
    const updatedData = fetchRealPortalData();
    setPortalData(updatedData);
  };

  if (!portalData || !portalData.student) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dir-rtl p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <ViewSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col dir-rtl text-slate-800 font-sans overflow-hidden">
      {/* Mystery Gift Unboxing Cutscene Modal */}
      {unboxedQueue.length > 0 && (
        <MysteryGiftModal
          badge={unboxedQueue[0].badge}
          assignment={unboxedQueue[0].assignment}
          onClaim={handleClaimBadge}
        />
      )}

      <div className="flex flex-1 h-screen overflow-hidden">

        {/* Desktop Sidebar */}
        <ParentSidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
          }}
          onLogout={onLogout}
          isOpenMobile={isOpenMobileSidebar}
          onCloseMobile={() => setIsOpenMobileSidebar(false)}
          studentName={portalData.student.name}
          className={portalData.student.className}
          gradeLevel={portalData.student.gradeLevel}
          schoolName={portalData.schoolInfo.name}
          isCommunityLocked={!isCommunityEnabled}
        />

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden ${
            activeTab === 'community' || activeTab === 'private_messages'
              ? 'pb-14 lg:pb-0'
              : 'pb-20 lg:pb-8'
          }`}
        >
          {/* Top Nav */}
          {activeTab !== 'community' && (
            <ParentTopNav
              data={portalData}
              onOpenMobileMenu={() => setIsOpenMobileSidebar(true)}
              onSelectTab={(tab) => setActiveTab(tab)}
              onLogout={onLogout}
            />
          )}

          {/* Page Body View */}
          <main
            className={`flex-1 max-w-7xl w-full mx-auto animate-in fade-in duration-200 ${
              activeTab === 'community' || activeTab === 'private_messages'
                ? 'p-0 sm:p-2 lg:p-3 h-full overflow-hidden'
                : 'overflow-y-auto p-4 sm:p-8 pb-20 lg:pb-8'
            }`}
          >
            {activeTab === 'home' && (
              <ParentHomeView data={portalData} onNavigateTab={(tab) => setActiveTab(tab)} />
            )}

            {activeTab === 'private_messages' && (
              <PrivateMessagingView
                schoolId={schoolId || portalData.schoolInfo.schoolId}
                userRole="student"
                currentUserId={portalData.student.id}
                currentUserName={portalData.student.name}
              />
            )}

            {activeTab === 'leaderboard' && (
              <SchoolLeaderboardView
                schoolId={schoolId || portalData.schoolInfo.schoolId}
                currentStudentId={portalData.student.id}
                userRole="student"
                schoolName={portalData.schoolInfo.name}
              />
            )}

            {activeTab === 'reports' && <ParentReportsView data={portalData} />}

            {activeTab === 'community' && (
              !isCommunityEnabled ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 m-3 shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 shadow-sm">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    المجتمع المدرسي مقفل مؤقتاً
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md leading-relaxed">
                    تم قفل هذه الميزة مؤقتًا من قِبل إدارة المدرسة. يرجى مراجعة إدارة المدرسة لمزيد من التفاصيل.
                  </p>
                  <button
                    onClick={() => setActiveTab('home')}
                    className="mt-6 px-5 py-2.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-medium text-xs rounded-xl shadow-xs hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    العودة للرئيسية
                  </button>
                </div>
              ) : (
                <CommunityMainView
                  schoolId={portalData.schoolInfo.schoolId || schoolId}
                  userId={portalData.student.id}
                  userName={portalData.student.name}
                  userRole="student"
                  userGradeName={
                    portalData.student.gradeLevel ||
                    parseEgyptianClassDetails(portalData.student.gradeLevel, portalData.student.className).gradeName ||
                    'الصف الأول الابتدائي'
                  }
                  userClassName={portalData.student.className || portalData.student.classId || 'فصل 1'}
                  userBadge="طالب"
                  onBack={() => setActiveTab('home')}
                />
              )
            )}

            {activeTab === 'badges' && (
              <ObtainedBadgesView
                accountType="student"
                entityId={portalData.student.id}
                entityName={portalData.student.name}
                schoolName={portalData.schoolInfo.name}
              />
            )}

            {activeTab === 'notifications' && (
              <ParentNotificationsView data={portalData} onNavigateTab={(tab) => setActiveTab(tab)} />
            )}

            {activeTab === 'attendance' && <ParentAttendanceView data={portalData} />}

            {activeTab === 'behavior' && <ParentBehaviorView data={portalData} />}

            {activeTab === 'announcements' && (
              <ParentAnnouncementsView
                data={portalData}
                role="student"
                loading={announcementsLoading}
                error={announcementsError}
                onRetry={() => {
                  const targetSchoolId = schoolId || portalData?.schoolInfo?.schoolId;
                  if (targetSchoolId) loadAnnouncements(targetSchoolId);
                }}
              />
            )}

            {activeTab === 'tickets' && (
              <ParentTicketsView
                studentId={portalData.student.id}
                studentName={portalData.student.name}
                studentCode={portalData.student.studentCode}
                className={portalData.student.className}
                schoolId={schoolId || portalData?.schoolInfo?.schoolId}
                schoolName={portalData?.schoolInfo?.name}
              />
            )}

            {activeTab === 'profile' && <ParentProfileView data={portalData} />}
          </main>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-t border-slate-200/80 z-40 px-2 flex items-center justify-around dir-rtl shadow-sm">
        <button
          onClick={() => {
            playSwitchTabSound();
            setActiveTab('home');
          }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-extrabold transition-colors cursor-pointer ${
            activeTab === 'home' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>الرئيسية</span>
        </button>

        <button
          onClick={() => {
            playSwitchTabSound();
            setActiveTab('attendance');
          }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-extrabold transition-colors cursor-pointer ${
            activeTab === 'attendance' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <CalendarCheck2 className="w-5 h-5" />
          <span>الحضور</span>
        </button>

        <button
          onClick={() => {
            playSwitchTabSound();
            setActiveTab('community');
          }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-extrabold transition-colors cursor-pointer ${
            activeTab === 'community' ? 'text-blue-600 font-black scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span>المجتمع</span>
        </button>

        <button
          onClick={() => {
            playSwitchTabSound();
            setActiveTab('behavior');
          }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-extrabold transition-colors cursor-pointer ${
            activeTab === 'behavior' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Star className="w-5 h-5" />
          <span>السلوك</span>
        </button>

        <button
          onClick={() => setIsOpenMobileSidebar(true)}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-extrabold transition-colors cursor-pointer ${
            isOpenMobileSidebar ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>المزيد</span>
        </button>
      </nav>
    </div>
  );
}
