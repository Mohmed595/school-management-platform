import React from 'react';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { getUserAvatarLayoutUid } from '../../lib/avatarLayouts';
import {
  Home,
  FileSpreadsheet,
  Star,
  Award,
  User,
  LogOut,
  GraduationCap,
  X,
  School,
  CheckCircle2,
  MessageSquare,
  Megaphone,
  Trophy,
  FileWarning,
} from 'lucide-react';
import { TeacherViewTab } from '../../types/teacher';
import { playSwitchTabSound } from '../../lib/sound';

interface TeacherSidebarProps {
  activeTab: TeacherViewTab;
  onTabChange: (tab: TeacherViewTab) => void;
  onLogout: () => void;
  schoolName: string;
  teacherName: string;
  specialization: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function TeacherSidebar({
  activeTab,
  onTabChange,
  onLogout,
  schoolName,
  teacherName,
  specialization,
  isMobileOpen = false,
  onCloseMobile,
}: TeacherSidebarProps) {
  const menuItems: { id: TeacherViewTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: 'الرئيسية',
      icon: <Home className="w-5 h-5" />,
    },
    {
      id: 'private_messages',
      label: 'رسائلي',
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      id: 'leaderboard',
      label: 'الأوائل',
      icon: <Trophy className="w-5 h-5" />,
    },
    {
      id: 'community',
      label: 'المجتمع المدرسي',
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      id: 'badges',
      label: 'الأوسمة والتكريمات',
      icon: <Award className="w-5 h-5" />,
    },
    {
      id: 'behavior',
      label: 'السلوك',
      icon: <Star className="w-5 h-5" />,
    },
    {
      id: 'infractions',
      label: 'المشاغبات',
      icon: <FileWarning className="w-5 h-5" />,
    },
    {
      id: 'announcements',
      label: 'الإعلانات الرسمية',
      icon: <Megaphone className="w-5 h-5" />,
    },
    {
      id: 'profile',
      label: 'الملف الشخصي',
      icon: <User className="w-5 h-5" />,
    },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white border-l border-slate-200 w-full dir-rtl select-none p-4">
      {/* Top Header Branding (Pinned) */}
      <div className="shrink-0 pb-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="overflow-hidden min-w-0">
            <h1 className="font-black text-slate-900 text-sm truncate leading-tight">
              بوابة المعلم
            </h1>
            <p className="text-xs text-slate-500 truncate mt-0.5">{schoolName}</p>
          </div>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Teacher Mini Profile Badge (Pinned) */}
      <div className="shrink-0 my-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3 shadow-2xs">
        <AvatarDisplay
          layoutUid={getUserAvatarLayoutUid(teacherName || 'teacher')}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="font-bold text-xs text-slate-900 truncate">{teacherName}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          </div>
          <p className="text-[11px] text-slate-500 truncate mt-0.5">{specialization}</p>
        </div>
      </div>

      {/* Navigation Menu (Scrollable) */}
      <nav className="flex-1 overflow-y-auto min-h-0 py-1 space-y-1 scrollbar-thin">
        <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          القائمة الرئيسية
        </div>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                playSwitchTabSound();
                onTabChange(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white font-black shadow-sm shadow-blue-500/25'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200/70'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-slate-500'}>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer / Logout (Pinned) */}
      <div className="shrink-0 pt-3 border-t border-slate-100 space-y-2 mt-auto">
        <button
          onClick={onLogout}
          className="w-full min-h-[44px] flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-xs sm:text-sm text-red-600 bg-red-50/90 hover:bg-red-100 border border-red-200/60 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen w-64">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex dir-rtl">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full w-72 sm:w-80 max-w-[85vw] shadow-2xl animate-in slide-in-from-right duration-250 ease-out flex flex-col bg-white">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
