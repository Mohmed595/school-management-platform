import React, { useState, useEffect } from 'react';
import { TeacherSidebar } from './TeacherSidebar';
import { TeacherTopNav } from './TeacherTopNav';
import { TeacherHomeView } from './views/TeacherHomeView';
import { TeacherBehaviorView } from './views/TeacherBehaviorView';
import { TeacherInfractionsView } from './TeacherInfractionsView';
import { TeacherProfileView } from './views/TeacherProfileView';
import { ObtainedBadgesView } from '../ui/ObtainedBadgesView';
import { CommunityMainView } from '../community/CommunityMainView';
import { SchoolLeaderboardView } from '../leaderboard/SchoolLeaderboardView';
import { ParentAnnouncementsView } from '../parent/views/ParentAnnouncementsView';
import { PrivateMessagingView } from '../messages/PrivateMessagingView';
import { TeacherViewTab, TeacherPortalData, TeacherActivityLog } from '../../types/teacher';
import {
  getTeacherPortalData,
  saveTeacherGradesList,
  saveTeacherBehaviorNote,
  getTeacherActivities,
} from '../../lib/teacherStorage';
import { getAnnouncementsBySchool } from '../../lib/adminStorage';
import { isAnnouncementVisibleToRole } from '../../lib/utils';
import { fetchAnnouncementsApi } from '../../lib/schoolApi';
import { GradeRecord, BehaviorRecord } from '../../types/admin';
import { CheckCircle2, AlertCircle, Info, X, Home, Star, Trophy, MessageSquare, Award, Megaphone, User, Menu, FileWarning } from 'lucide-react';
import { ViewSkeleton } from '../ui/Skeleton';
import { playSwitchTabSound } from '../../lib/sound';

interface ToastItem {
  id: string;
  title: string;
  desc?: string;
  type: 'success' | 'error' | 'info';
}

interface TeacherPortalProps {
  schoolId: string;
  teacherId: string;
  onLogout: () => void;
}

export function TeacherPortal({ schoolId, teacherId, onLogout }: TeacherPortalProps) {
  const [activeTab, setActiveTab] = useState<TeacherViewTab>('dashboard');
  const [data, setData] = useState<TeacherPortalData | null>(null);
  const [activities, setActivities] = useState<TeacherActivityLog[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState<boolean>(false);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);

  const loadAnnouncements = async () => {
    if (!schoolId) return;
    setAnnouncementsLoading(true);
    setAnnouncementsError(null);
    try {
      const announcements = await fetchAnnouncementsApi(schoolId);
      const teacherVisible = (announcements || []).filter((a) =>
        isAnnouncementVisibleToRole(a.targetAudience, 'teacher')
      );
      setData((prev) => (prev ? { ...prev, announcements: teacherVisible } : prev));
    } catch (err: any) {
      setAnnouncementsError(err?.message || 'فشل تحميل الإعلانات المدرسية من الخادم');
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  // Load teacher data & listen for live updates
  useEffect(() => {
    const loadTeacherLocalData = () => {
      const loaded = getTeacherPortalData(schoolId, teacherId);
      const localAncs = getAnnouncementsBySchool(schoolId).filter((a) =>
        isAnnouncementVisibleToRole(a.targetAudience, 'teacher')
      );
      setData({ ...loaded, announcements: localAncs });
      setActivities(getTeacherActivities());
    };

    // Initial load
    loadTeacherLocalData();
    loadAnnouncements();

    const handleDataChanged = (e: Event) => {
      loadTeacherLocalData();

      const eventType = (e as CustomEvent)?.detail?.type;
      // Only fetch announcements if event is related to announcements or global sync/storage
      if (!eventType || eventType === 'announcements' || eventType === 'school_init' || eventType === 'central_sync_complete' || e.type === 'storage') {
        loadAnnouncements();
      }
    };

    window.addEventListener('school_data_changed', handleDataChanged);
    window.addEventListener('storage', handleDataChanged);

    return () => {
      window.removeEventListener('school_data_changed', handleDataChanged);
      window.removeEventListener('storage', handleDataChanged);
    };
  }, [schoolId, teacherId]);

  const addToast = (title: string, desc?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, desc, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSaveGrades = async (updatedGrades: GradeRecord[]) => {
    if (!data) return;
    try {
      await saveTeacherGradesList(updatedGrades, data.teacher.name);

      // Refresh data
      const refreshed = getTeacherPortalData(schoolId, teacherId);
      setData(refreshed);
      setActivities(getTeacherActivities());
    } catch (err: any) {
      addToast('فشل حفظ الدرجات', err?.message || 'تعذر حفظ الدرجات في قاعدة البيانات', 'error');
    }
  };

  const handleSaveBehavior = async (record: BehaviorRecord) => {
    if (!data) return;
    try {
      await saveTeacherBehaviorNote(record);

      // Refresh data
      const refreshed = getTeacherPortalData(schoolId, teacherId);
      setData(refreshed);
      setActivities(getTeacherActivities());
    } catch (err: any) {
      addToast('فشل تسجيل الملاحظة السلوكية', err?.message || 'تعذر حفظ الملاحظة في قاعدة البيانات', 'error');
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dir-rtl p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 animate-pulse" />
            <div className="space-y-1">
              <div className="w-40 h-4 bg-slate-200 rounded animate-pulse" />
              <div className="w-24 h-3 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
          <ViewSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#F8FAFC] dir-rtl font-sans antialiased text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <TeacherSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onLogout}
        schoolName={data.schoolName}
        teacherName={data.teacher.name}
        specialization={data.teacher.specialization}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden ${
          activeTab === 'community' || activeTab === 'private_messages'
            ? 'pb-14 lg:pb-0'
            : 'pb-20 lg:pb-8'
        }`}
      >
        {/* Top Navbar */}
        {activeTab !== 'community' && activeTab !== 'private_messages' && (
          <TeacherTopNav
            activeTab={activeTab}
            teacherName={data.teacher.name}
            schoolName={data.schoolName}
            assignedSubjects={data.assignedSubjects.map((s) => s.name)}
            assignedClasses={data.assignedClasses.map((c) => c.name)}
            onOpenMobileMenu={() => setIsMobileOpen(true)}
            onLogout={onLogout}
          />
        )}

        {/* View Container */}
        <main
          className={`flex-1 max-w-7xl w-full mx-auto ${
            activeTab === 'community' || activeTab === 'private_messages'
              ? 'p-0 sm:p-2 lg:p-3 h-full overflow-hidden'
              : 'overflow-y-auto p-3.5 sm:p-6 lg:p-8 pb-20 lg:pb-8'
          }`}
        >
          {activeTab === 'dashboard' && (
            <TeacherHomeView
              data={data}
              activities={activities}
              onNavigateToBehavior={() => setActiveTab('behavior')}
            />
          )}

          {activeTab === 'private_messages' && (
            <PrivateMessagingView
              schoolId={schoolId}
              userRole="teacher"
              currentUserId={data.teacher.id}
              currentUserName={data.teacher.name}
            />
          )}

          {activeTab === 'leaderboard' && (
            <SchoolLeaderboardView
              schoolId={schoolId}
              userRole="teacher"
              schoolName={data.schoolName}
            />
          )}

          {activeTab === 'community' && (
            <CommunityMainView
              schoolId={schoolId}
              userId={data.teacher.id}
              userName={`أستاذ/ة ${data.teacher.name}`}
              userRole="teacher"
              teacherAssignedClasses={data.teacher.assignedClasses}
              userBadge={`معلم ${data.teacher.specialization}`}
              onBack={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'badges' && (
            <ObtainedBadgesView
              accountType="teacher"
              entityId={data.teacher.id}
              entityName={data.teacher.name}
              schoolName={data.schoolName}
            />
          )}

          {activeTab === 'behavior' && (
            <TeacherBehaviorView
              data={data}
              onSaveBehavior={handleSaveBehavior}
              addToast={addToast}
            />
          )}

          {activeTab === 'infractions' && (
            <TeacherInfractionsView
              data={data}
              addToast={addToast}
            />
          )}

          {activeTab === 'announcements' && (
            <ParentAnnouncementsView
              announcements={data.announcements || []}
              role="teacher"
              loading={announcementsLoading}
              error={announcementsError}
              onRetry={loadAnnouncements}
            />
          )}

          {activeTab === 'profile' && <TeacherProfileView data={data} />}
        </main>

        {/* Mobile Bottom Navigation Bar (Phone Quick Access) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-40 px-1 py-1 flex items-center justify-around shadow-lg dir-rtl">
          {[
            { id: 'dashboard', label: 'الرئيسية', icon: Home },
            { id: 'infractions', label: 'المشاغبات', icon: FileWarning },
            { id: 'community', label: 'المجتمع', icon: MessageSquare },
            { id: 'behavior', label: 'السلوك', icon: Star },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  playSwitchTabSound();
                  setActiveTab(item.id as TeacherViewTab);
                }}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
                  isActive ? 'text-blue-600 font-black scale-105' : 'text-slate-500 font-medium hover:text-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 stroke-[2.5]' : 'text-slate-400'}`} />
                <span className="text-[10px] mt-0.5 leading-none">{item.label}</span>
              </button>
            );
          })}

          {/* 5th element: المزيد opens the main mobile sidebar */}
          <button
            onClick={() => {
              playSwitchTabSound();
              setIsMobileOpen(true);
            }}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer text-slate-500 font-medium hover:text-slate-800"
          >
            <Menu className="w-5 h-5 text-slate-400" />
            <span className="text-[10px] mt-0.5 leading-none">المزيد</span>
          </button>
        </nav>
      </div>

      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-2.5 max-w-sm w-full dir-rtl pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-2xl shadow-lg border flex items-start gap-3 pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white border-slate-800'
                : toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-800'
                : 'bg-blue-900 text-white border-blue-800'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}

            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs">{toast.title}</h4>
              {toast.desc && <p className="text-[11px] opacity-80 mt-0.5 leading-snug">{toast.desc}</p>}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/60 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
