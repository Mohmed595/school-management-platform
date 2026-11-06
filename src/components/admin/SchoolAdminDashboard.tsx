import React, { useState, useEffect, useMemo } from 'react';
import {
  AdminViewTab,
  SchoolAdminData,
  Student,
  Teacher,
  ClassRoom,
  Subject,
  AttendanceRecord,
  GradeRecord,
  BehaviorRecord,
  Parent,
  Announcement,
} from '../../types/admin';
import {
  getSchoolAdminData,
  saveSchoolAdminData,
  saveStudent,
  deleteStudent,
  saveTeacher,
  deleteTeacher,
  saveClass,
  deleteClass,
  saveSubject,
  deleteSubject,
  saveAttendanceRecords,
  saveGradeRecords,
  saveBehaviorRecord,
  deleteBehaviorRecord,
  saveAnnouncement,
  deleteAnnouncement,
  syncSchoolDataFromCentralDb,
} from '../../lib/adminStorage';
import {
  fetchAnnouncementsApi,
  saveAnnouncementApi,
  deleteAnnouncementApi,
} from '../../lib/schoolApi';

import { AdminSidebar } from './AdminSidebar';
import { AdminTopNav } from './AdminTopNav';
import { SchoolSetupWizardModal } from './SchoolSetupWizardModal';
import { SchoolLeaderboardView } from '../leaderboard/SchoolLeaderboardView';

import { AdminDashboardView } from './views/AdminDashboardView';
import { PrivateMessagingView } from '../messages/PrivateMessagingView';
import { AdminStudentsView } from './views/AdminStudentsView';
import { AdminTeachersView } from './views/AdminTeachersView';
import { AdminClassesView } from './views/AdminClassesView';
import { AdminSubjectsView } from './views/AdminSubjectsView';
import { AdminAttendanceView } from './views/AdminAttendanceView';
import { AdminBehaviorView } from './views/AdminBehaviorView';
import { AdminBadgesView } from './views/AdminBadgesView';
import { AdminActionsView } from './views/AdminActionsView';
import { AdminInfractionsView } from './views/AdminInfractionsView';

import { AdminAnnouncementsView } from './views/AdminAnnouncementsView';
import { AdminCalendarView } from './views/AdminCalendarView';
import { AdminReportsView } from './views/AdminReportsView';
import { AdminSettingsView } from './views/AdminSettingsView';
import { AdminExtensionsView } from './views/AdminExtensionsView';
import { CommunityMainView } from '../community/CommunityMainView';
import { AiChatbotWidget } from '../ui/AiChatbotWidget';
import { ViewSkeleton } from '../ui/Skeleton';
import { useSchoolExtensions } from '../../hooks/useSchoolExtensions';
import { LayoutDashboard, Users, MessageSquare, CalendarCheck, Menu } from 'lucide-react';
import { playSwitchTabSound } from '../../lib/sound';

interface SchoolAdminDashboardProps {
  schoolId: string;
  onLogout: () => void;
  onSwitchToOwner?: () => void;
}

interface ToastMessage {
  id: string;
  title: string;
  desc?: string;
  type: 'success' | 'error' | 'info';
}

export function SchoolAdminDashboard({
  schoolId,
  onLogout,
  onSwitchToOwner,
}: SchoolAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminViewTab>('dashboard');
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Loaded state for school
  const [schoolAdminData, setSchoolAdminData] = useState<SchoolAdminData | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // School Extensions & Feature Controls
  const {
    extensions,
    isLoading: isExtensionsLoading,
    toggleExtension,
    updateExtensionSettings,
    refresh: refreshExtensions,
  } = useSchoolExtensions(schoolId);

  // Load school data on mount or when schoolId or live data changes
  useEffect(() => {
    const refreshAdminData = () => {
      const data = getSchoolAdminData(schoolId);
      setSchoolAdminData(data);

      fetchAnnouncementsApi(schoolId)
        .then((announcements) => {
          setSchoolAdminData((prev) => (prev ? { ...prev, announcements } : prev));
        })
        .catch(() => {});
    };

    refreshAdminData();

    // Trigger central database sync (and immediately refresh state on completion)
    syncSchoolDataFromCentralDb(schoolId)
      .then(() => {
        refreshAdminData();
      })
      .catch(() => {});

    window.addEventListener('school_data_changed', refreshAdminData);
    window.addEventListener('storage', refreshAdminData);

    return () => {
      window.removeEventListener('school_data_changed', refreshAdminData);
      window.removeEventListener('storage', refreshAdminData);
    };
  }, [schoolId]);

  const handleSaveWizardSuccess = (updatedTheme: string) => {
    setIsSetupWizardOpen(false);
    // Reload school admin data with new real students & classes
    const refreshed = getSchoolAdminData(schoolId);
    setSchoolAdminData(refreshed);
    showToast(
      'تمت تهيئة بيانات المدرسة بنجاح!',
      'تم تحديث الفصول والطلاب وتسكينهم بالكامل وتطبيق الهوية البصرية بنجاح',
      'success'
    );
  };

  const showToast = (title: string, desc?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}`,
      title,
      desc,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 3500);
  };

  if (!schoolAdminData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Event Handlers for CRUD
  const handleSaveStudent = async (student: Student) => {
    await saveStudent(student);
    setSchoolAdminData(getSchoolAdminData(schoolId));
  };

  const handleDeleteStudent = async (studentId: string) => {
    await deleteStudent(studentId);
    setSchoolAdminData(getSchoolAdminData(schoolId));
  };

  const handleSaveTeacher = async (teacher: Teacher) => {
    await saveTeacher(teacher);
    setSchoolAdminData(getSchoolAdminData(schoolId));
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    await deleteTeacher(teacherId);
    setSchoolAdminData(getSchoolAdminData(schoolId));
  };

  const handleSaveClass = async (classRoom: ClassRoom) => {
    await saveClass(classRoom);
    setSchoolAdminData(getSchoolAdminData(schoolId));
  };

  const handleDeleteClass = async (classId: string) => {
    await deleteClass(classId, schoolId);
    setSchoolAdminData(getSchoolAdminData(schoolId));
  };

  const handleSaveSubject = async (subject: Subject) => {
    await saveSubject(subject);
    setSchoolAdminData(getSchoolAdminData(schoolId));
  };

  const handleDeleteSubject = async (subjectId: string) => {
    await deleteSubject(subjectId, schoolId);
    setSchoolAdminData(getSchoolAdminData(schoolId));
  };

  const handleSaveAttendance = async (records: AttendanceRecord[]) => {
    await saveAttendanceRecords(records);
    setSchoolAdminData(getSchoolAdminData(schoolId));
  };

  const handleSaveGrades = async (records: GradeRecord[]) => {
    await saveGradeRecords(records);
    setSchoolAdminData(getSchoolAdminData(schoolId));
  };

  const handleSaveBehavior = async (record: BehaviorRecord) => {
    await saveBehaviorRecord(record);
    setSchoolAdminData(getSchoolAdminData(schoolId));
  };

  const handleDeleteBehavior = async (id: string) => {
    await deleteBehaviorRecord(id, schoolId);
    setSchoolAdminData(getSchoolAdminData(schoolId));
  };

  const handleSaveAnnouncement = async (anc: Announcement) => {
    // Optimistically prepend to announcements state so it appears at the top immediately
    setSchoolAdminData((prev) => {
      if (!prev) return prev;
      const currentList = prev.announcements || [];
      const updated = currentList.some((a) => a.id === anc.id)
        ? currentList.map((a) => (a.id === anc.id ? anc : a))
        : [anc, ...currentList];
      return { ...prev, announcements: updated };
    });
    saveAnnouncement(anc);
    await saveAnnouncementApi(schoolId, anc);
    const announcements = await fetchAnnouncementsApi(schoolId);
    setSchoolAdminData((prev) => (prev ? { ...prev, announcements } : prev));
  };

  const handleDeleteAnnouncement = async (id: string) => {
    deleteAnnouncement(id, schoolId);
    await deleteAnnouncementApi(schoolId, id);
    const announcements = await fetchAnnouncementsApi(schoolId);
    setSchoolAdminData((prev) => (prev ? { ...prev, announcements } : prev));
  };

  const handleSaveSettings = async (updates: Partial<SchoolAdminData>) => {
    if (!schoolAdminData) return;
    await saveSchoolAdminData(schoolId, updates);
    const updated = { ...schoolAdminData, ...updates };
    setSchoolAdminData(updated);
  };

  if (!schoolAdminData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dir-rtl p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <ViewSkeleton />
        </div>
      </div>
    );
  }

  // Lightweight metadata overview for AI assistant: 0ms execution time, zero lag or tab freeze!
  const lightSchoolSummary = {
    schoolId: schoolAdminData.schoolId || schoolId || 'sch-1',
    schoolName: schoolAdminData.schoolName,
    schoolCode: schoolAdminData.schoolCode,
    academicYear: schoolAdminData.academicYear,
    principalName: schoolAdminData.principalName,
    governorate: (schoolAdminData as any).governorate,
    stats: {
      totalStudents: schoolAdminData.students?.length || 0,
      totalTeachers: schoolAdminData.teachers?.length || 0,
      totalClasses: schoolAdminData.classes?.length || 0,
      totalSubjects: schoolAdminData.subjects?.length || 0,
      totalAnnouncements: schoolAdminData.announcements?.length || 0,
      totalParents: schoolAdminData.parents?.length || 0,
    },
    classes: schoolAdminData.classes?.map((c) => ({ id: c.id, name: c.name, gradeLevel: c.gradeLevel })) || [],
  };

  return (
    <div className="h-screen bg-[#F8FAFC] text-slate-900 flex dir-rtl overflow-hidden">
      {/* Toast Overlay */}
      <div className="fixed bottom-5 left-5 z-50 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-lg text-xs flex flex-col min-w-[280px] max-w-sm ${
              t.type === 'success'
                ? 'bg-emerald-950 text-white border-emerald-800'
                : t.type === 'error'
                ? 'bg-red-950 text-white border-red-800'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            <span className="font-bold text-sm">{t.title}</span>
            {t.desc && <span className="opacity-80 text-[11px] mt-0.5">{t.desc}</span>}
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={onLogout}
        schoolName={schoolAdminData.schoolName}
        schoolCode={schoolAdminData.schoolCode}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
        onSwitchToOwner={onSwitchToOwner}
        onOpenSetupWizard={() => setIsSetupWizardOpen(true)}
      />

      {/* School Setup Wizard Modal */}
      {isSetupWizardOpen && (
        <SchoolSetupWizardModal
          schoolId={schoolId}
          currentThemeColor={schoolAdminData.themeColor}
          currentClasses={schoolAdminData.classes}
          currentStudents={schoolAdminData.students}
          onClose={() => setIsSetupWizardOpen(false)}
          onSaveSuccess={handleSaveWizardSuccess}
        />
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {activeTab !== 'community' && (
          <AdminTopNav
            activeTab={activeTab}
            schoolName={schoolAdminData.schoolName}
            principalName={schoolAdminData.principalName}
            onOpenMobileSidebar={() => setIsOpenMobile(true)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onOpenSetupWizard={() => setIsSetupWizardOpen(true)}
            schoolId={schoolId}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* View Content Body */}
        <main
          className={`flex-1 max-w-7xl w-full mx-auto ${
            activeTab === 'community' || activeTab === 'private_messages'
              ? 'p-0 sm:p-2.5 lg:p-3 h-full pb-14 lg:pb-0 overflow-hidden'
              : 'overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8'
          }`}
        >
          {activeTab === 'dashboard' && (
            <AdminDashboardView
              schoolId={schoolId}
              students={schoolAdminData.students}
              teachers={schoolAdminData.teachers}
              classes={schoolAdminData.classes}
              attendance={schoolAdminData.attendance}
              announcements={schoolAdminData.announcements}
              behavior={schoolAdminData.behavior}
              setActiveTab={setActiveTab}
              onOpenAddStudent={() => setActiveTab('students')}
              onOpenAddAnnouncement={() => setActiveTab('announcements')}
            />
          )}

          {activeTab === 'private_messages' && (
            <PrivateMessagingView
              schoolId={schoolId}
              userRole="school_admin"
              currentUserId={`admin_${schoolId}`}
              currentUserName={schoolAdminData.schoolName}
            />
          )}

          {activeTab === 'leaderboard' && (
            <SchoolLeaderboardView
              schoolId={schoolId}
              userRole="admin"
              schoolName={schoolAdminData.schoolName}
            />
          )}

          {activeTab === 'community' && (
            <CommunityMainView
              schoolId={schoolId}
              userId="admin-1"
              userName={`إدارة المدرسة (${schoolAdminData.principalName || 'الناظر'})`}
              userRole="admin"
              userBadge="إدارة المدرسة"
              onBack={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'calendar' && (
            <AdminCalendarView schoolId={schoolId} onToast={showToast} />
          )}

          {activeTab === 'students' && (
            <AdminStudentsView
              schoolId={schoolId}
              students={schoolAdminData.students}
              classes={schoolAdminData.classes}
              attendance={schoolAdminData.attendance}
              onSaveStudent={handleSaveStudent}
              onDeleteStudent={handleDeleteStudent}
              onToast={showToast}
            />
          )}

          {activeTab === 'teachers' && (
            <AdminTeachersView
              schoolId={schoolId}
              teachers={schoolAdminData.teachers}
              classes={schoolAdminData.classes}
              subjects={schoolAdminData.subjects}
              onSaveTeacher={handleSaveTeacher}
              onDeleteTeacher={handleDeleteTeacher}
              onToast={showToast}
            />
          )}

          {activeTab === 'classes' && (
            <AdminClassesView
              schoolId={schoolId}
              classes={schoolAdminData.classes}
              teachers={schoolAdminData.teachers}
              students={schoolAdminData.students}
              onSaveClass={handleSaveClass}
              onDeleteClass={handleDeleteClass}
              onToast={showToast}
            />
          )}

          {activeTab === 'subjects' && (
            <AdminSubjectsView
              schoolId={schoolId}
              subjects={schoolAdminData.subjects}
              teachers={schoolAdminData.teachers}
              onSaveSubject={handleSaveSubject}
              onDeleteSubject={handleDeleteSubject}
              onToast={showToast}
            />
          )}

          {activeTab === 'attendance' && (
            <AdminAttendanceView
              schoolId={schoolId}
              classes={schoolAdminData.classes}
              students={schoolAdminData.students}
              attendance={schoolAdminData.attendance}
              onSaveAttendance={handleSaveAttendance}
              onToast={showToast}
            />
          )}

          {activeTab === 'behavior' && (
            <AdminBehaviorView
              schoolId={schoolId}
              students={schoolAdminData.students}
              behavior={schoolAdminData.behavior}
              onSaveBehavior={handleSaveBehavior}
              onDeleteBehavior={handleDeleteBehavior}
              onToast={showToast}
            />
          )}

          {activeTab === 'badges' && (
            <AdminBadgesView
              schoolId={schoolId}
              students={schoolAdminData.students}
              onToast={showToast}
            />
          )}

          {activeTab === 'infractions' && (
            <AdminInfractionsView
              schoolId={schoolId}
              students={schoolAdminData.students}
              classes={schoolAdminData.classes}
              onToast={showToast}
            />
          )}

          {activeTab === 'adminActions' && (
            <AdminActionsView
              schoolId={schoolId}
              students={schoolAdminData.students}
              classes={schoolAdminData.classes}
              onToast={showToast}
            />
          )}

          {activeTab === 'announcements' && (
            <AdminAnnouncementsView
              schoolId={schoolId}
              announcements={schoolAdminData.announcements}
              onSaveAnnouncement={handleSaveAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
              onToast={showToast}
            />
          )}

          {activeTab === 'reports' && (
            <AdminReportsView
              schoolId={schoolId}
              students={schoolAdminData.students}
              teachers={schoolAdminData.teachers}
              classes={schoolAdminData.classes}
              attendance={schoolAdminData.attendance}
              grades={schoolAdminData.grades || []}
              onToast={showToast}
            />
          )}

          {activeTab === 'extensions' && (
            <AdminExtensionsView
              schoolId={schoolId}
              schoolName={schoolAdminData.schoolName}
              extensions={extensions}
              isLoading={isExtensionsLoading}
              onToggleExtension={toggleExtension}
              onUpdateSettings={updateExtensionSettings}
              onRefresh={refreshExtensions}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettingsView
              schoolData={schoolAdminData}
              onSaveSettings={handleSaveSettings}
              onToast={showToast}
              studentFeaturesExtension={extensions.find(
                (e) => e.extensionId === 'student_features_control'
              )}
              onUpdateExtensionSettings={updateExtensionSettings}
            />
          )}

          {activeTab === 'ai_assistant' && (
            <AiChatbotWidget
              role="admin"
              title="المستشار الإداري والتربوي الذكي"
              subtitle={`مدرسة: ${schoolAdminData.schoolName} • تحليل استراتيجي وتوصيات مبتكرة`}
              badgeText="مستشار ذكي ومبدع"
              themeColor="emerald"
              embedded={true}
              contextData={lightSchoolSummary}
              quickPrompts={[
                '📋 تصدير كشف قيد وبيانات الطلاب كاملة (الاسم، الرقم القومي، كود الوزارة) .xlsx',
                'تحليل نبض مجتمع المدرسة وأحدث النقاشات مع نصائح لتعزيز التفاعل',
                'قراءة في لوحة الشرف والأوائل وأفكار لتحفيز التنافس الدراسي',
                '📊 تصدير كشف الطلاب الأوائل (ملف Excel .xlsx)',
                '📥 كشف الحضور والغياب اليومي (.xlsx)',
                'تقرير مؤشرات الحضور والغياب اليومي مع حلول للحد من التأخير',
                'استعراض استحقاقات التقويم المدرسي القادمة وخطط الاستعداد',
                'تقييم منظومة الأوسمة والتكريمات ومقترحات لتحفيز الطلاب والمعلمين',
                'تحليل السلوك والإجراءات الإدارية مع توصيات لتعديل السلوك',
              ]}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar (Phone Quick Access) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-40 px-1 py-1 flex items-center justify-around shadow-lg dir-rtl">
          {[
            { id: 'dashboard' as AdminViewTab, label: 'الرئيسية', icon: LayoutDashboard },
            { id: 'students' as AdminViewTab, label: 'الطلاب', icon: Users },
            { id: 'community' as AdminViewTab, label: 'المجتمع', icon: MessageSquare },
            { id: 'attendance' as AdminViewTab, label: 'الحضور', icon: CalendarCheck },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  playSwitchTabSound();
                  setActiveTab(item.id);
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
              setIsOpenMobile(true);
            }}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer text-slate-500 font-medium hover:text-slate-800"
          >
            <Menu className="w-5 h-5 text-slate-400" />
            <span className="text-[10px] mt-0.5 leading-none">المزيد</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
