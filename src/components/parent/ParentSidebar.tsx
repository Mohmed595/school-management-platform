import React, { useState } from 'react';
import { ParentViewTab } from '../../types/parent';
import { playSwitchTabSound } from '../../lib/sound';
import {
  Home,
  CalendarCheck2,
  Award,
  Star,
  BookOpen,
  Bell,
  Inbox,
  User,
  LogOut,
  Building2,
  X,
  Sparkles,
  MessageSquare,
  TrendingUp,
  LifeBuoy,
  Trophy,
  Lock,
} from 'lucide-react';

interface ParentSidebarProps {
  activeTab: ParentViewTab;
  onSelectTab: (tab: ParentViewTab) => void;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  studentName: string;
  className: string;
  gradeLevel?: string;
  schoolName: string;
  isCommunityLocked?: boolean;
}

export function ParentSidebar({
  activeTab,
  onSelectTab,
  onLogout,
  isOpenMobile,
  onCloseMobile,
  studentName,
  className,
  gradeLevel,
  schoolName,
  isCommunityLocked = false,
}: ParentSidebarProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems: { id: ParentViewTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'private_messages', label: 'رسائلي', icon: MessageSquare },
    { id: 'leaderboard', label: 'الأوائل', icon: Trophy },
    { id: 'community', label: 'المجتمع المدرسي', icon: MessageSquare },
    { id: 'badges', label: 'الأوسمة والإنجازات', icon: Award },
    { id: 'notifications', label: 'الإشعارات والقرارات', icon: Inbox },
    { id: 'attendance', label: 'الحضور والغياب', icon: CalendarCheck2 },
    { id: 'behavior', label: 'السلوك والانضباط', icon: Star },
    { id: 'announcements', label: 'الإعلانات الرسمية', icon: Bell },
    { id: 'tickets', label: 'الشكاوى والدعم', icon: LifeBuoy },
    { id: 'profile', label: 'بيانات الطالب والملف', icon: User },
  ];

  const handleItemClick = (tab: ParentViewTab) => {
    playSwitchTabSound();
    onSelectTab(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-l border-slate-200/90 w-full p-4 select-none">
      {/* Top Header Branding (Pinned) */}
      <div className="shrink-0 flex items-center justify-between pb-4 border-b border-slate-100 mb-3 px-1">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-xs shrink-0 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-black text-sm sm:text-base text-slate-900 tracking-tight leading-tight">
              بوابة الطالب
            </h2>
            <p className="text-[11px] text-slate-500 font-semibold truncate max-w-[150px] mt-0.5">
              {schoolName || 'منصة مدرستي'}
            </p>
          </div>
        </div>

        <button
          onClick={onCloseMobile}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          aria-label="إغلاق القائمة"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Student Quick Card (Pinned) */}
      <div className="shrink-0 p-3.5 bg-gradient-to-br from-blue-50/90 via-slate-50 to-indigo-50/60 border border-blue-100/90 rounded-2xl mb-3 space-y-1 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-md">
            الطالب المتابع
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <p className="font-extrabold text-xs sm:text-sm text-slate-900 truncate leading-snug">
          {studentName}
        </p>
        <p className="text-[11px] font-bold text-slate-500 truncate">
          {gradeLevel ? `${gradeLevel} - ${className}` : className}
        </p>
      </div>

      {/* Scrollable Navigation Menu Area (Smooth Scrolling on Mobile) */}
      <nav className="flex-1 overflow-y-auto min-h-0 py-1 space-y-1.5 pr-0.5 pl-0.5 scrollbar-thin">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-black'
                  : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 active:bg-slate-200/70'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'text-white scale-110' : 'text-slate-500'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.id === 'community' && isCommunityLocked && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                  title="الميزة مقفلة مؤقتاً"
                >
                  <Lock className="w-3 h-3 shrink-0" />
                  <span>مقفل</span>
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Pinned Footer with Logout (Always Visible on Screen) */}
      <div className="shrink-0 pt-3 pb-1 border-t border-slate-100 space-y-2 bg-white mt-auto">
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full min-h-[44px] flex items-center justify-center gap-2.5 px-3.5 py-2.5 rounded-xl font-black text-xs sm:text-sm text-red-600 bg-red-50/90 hover:bg-red-100 border border-red-200/60 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>تسجيل الخروج</span>
        </button>

        <p className="text-[10px] font-semibold text-slate-400 text-center select-none pt-0.5">
          جمهورية مصر العربية - منصة المدارس
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed sticky on large screens) */}
      <aside className="hidden lg:block shrink-0 h-screen sticky top-0 dir-rtl w-64">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex dir-rtl">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
            onClick={onCloseMobile}
          />

          {/* Drawer Sheet */}
          <div className="relative z-10 w-72 sm:w-80 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-right duration-250 ease-out flex flex-col bg-white">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 dir-rtl">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setShowLogoutModal(false)}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100 z-10 space-y-4 animate-in zoom-in-95 duration-150">
            {/* Warning Circle */}
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-100 shadow-2xs">
              <LogOut className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">تأكيد تسجيل الخروج</h3>
              <p className="text-xs font-medium text-slate-500">
                هل أنت متأكد من رغبتك في تسجيل الخروج من الحساب؟
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout();
                }}
                className="flex-1 py-2.5 min-h-[42px] bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                موافق (تسجيل الخروج)
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 min-h-[42px] bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
