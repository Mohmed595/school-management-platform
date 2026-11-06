import React from 'react';
import { Menu, GraduationCap, BookOpen, Users, LogOut, CheckCircle2 } from 'lucide-react';
import { TeacherViewTab } from '../../types/teacher';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { getUserAvatarLayoutUid } from '../../lib/avatarLayouts';
import { AccountSwitcherButton } from '../auth/AccountSwitcherButton';

interface TeacherTopNavProps {
  activeTab: TeacherViewTab;
  teacherName: string;
  schoolName: string;
  assignedSubjects: string[];
  assignedClasses: string[];
  onOpenMobileMenu: () => void;
  onLogout: () => void;
}

const TAB_TITLES: Record<TeacherViewTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'لوحة تحكم المعلم',
    subtitle: 'نظرة عامة على الطلاب المكلف بهم والملاحظات السلوكية',
  },
  private_messages: {
    title: 'رسائلي (المحادثات الخاصة)',
    subtitle: 'المحادثات الخاصة مع الطلاب المصرح لهم',
  },
  community: {
    title: 'المجتمع المدرسي والتواصل',
    subtitle: 'التواصل المباشر والآمن مع فصولك والصف الدراسي تحت رقابة المدرسة',
  },
  leaderboard: {
    title: '🏆 قائمة الأوائل (Top 100)',
    subtitle: 'ترتيب الطلاب المتفوقين في المدرسة بناءً على النقاط والأوسمة',
  },
  badges: {
    title: 'سجل الأوسمة والتكريمات الرسمية',
    subtitle: 'عرض الأوسمة التقديرية الممنوحة للمعلم والاعتمادات التربوية',
  },
  behavior: {
    title: 'سجل السلوك والتهذيب',
    subtitle: 'تسجيل السلوكيات الإيجابية والسلبية ومتابعة التقييم التربوي للطلاب',
  },
  infractions: {
    title: 'سجل المشاغبات والمذكرات',
    subtitle: 'تحرير مذكرات المشاغبة وسوء السلوك لإدارة المدرسة ومتابعة الإجراءات والقرارات',
  },
  announcements: {
    title: 'الإعلانات والتعاميم المدرسية الرسمية',
    subtitle: 'الاطلاع على أحدث القرارات، الإعلانات والتنبيهات المعتمدة من إدارة المدرسة',
  },
  profile: {
    title: 'الملف الشخصي للمعلم',
    subtitle: 'بيانات التكليف بالتدريس، الصفوف المنسوبة، والمواد الدراسية',
  },
};

export function TeacherTopNav({
  activeTab,
  teacherName,
  schoolName,
  assignedSubjects,
  assignedClasses,
  onOpenMobileMenu,
  onLogout,
}: TeacherTopNavProps) {
  const currentTabInfo = TAB_TITLES[activeTab] || TAB_TITLES.dashboard;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-3 sm:px-6 py-2.5 sm:py-3.5 dir-rtl">
      <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-7xl mx-auto">
        {/* Right Section: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer border border-slate-200 shrink-0"
            aria-label="افتح القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="font-black text-slate-900 text-sm sm:text-lg tracking-tight truncate">
                {currentTabInfo.title}
              </h2>
              <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                2025/2026
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block mt-0.5 truncate">
              {currentTabInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Left Section: Subject/Class Tags & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Assigned Quick Tags */}
          <div className="hidden lg:flex items-center gap-2 border-l border-slate-200 pl-3">
            {assignedSubjects.length > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>{assignedSubjects.slice(0, 2).join(' • ')}</span>
              </div>
            )}
            <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>{assignedClasses.length} فصول مكلفة</span>
            </div>
          </div>

          {/* Teacher Badge */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2 sm:px-3 py-1 sm:py-1.5">
            <AvatarDisplay
              layoutUid={getUserAvatarLayoutUid(teacherName || 'teacher')}
              size="sm"
            />
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-900 leading-none">{teacherName}</span>
                <CheckCircle2 className="w-3 h-3 text-blue-600" />
              </div>
              <span className="text-[10px] text-slate-500 leading-none mt-1 block">
                {schoolName}
              </span>
            </div>
          </div>

          {/* Account Switcher Button */}
          <AccountSwitcherButton variant="compact" />

          {/* Quick Logout Icon */}
          <button
            onClick={onLogout}
            title="تسجيل الخروج"
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer border border-transparent hover:border-red-100"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
