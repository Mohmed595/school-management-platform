import React from 'react';
import { Home, CalendarCheck, Award, User, LogOut, CheckCircle2, ShieldAlert, X, Megaphone, Trophy, MessageSquare } from 'lucide-react';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { ROLE_AVATARS } from '../../lib/avatarLayouts';
import { playSwitchTabSound } from '../../lib/sound';

export type AttendanceTab = 'home' | 'community' | 'private_messages' | 'leaderboard' | 'badges' | 'announcements' | 'profile';

interface AttendanceTeacherSidebarProps {
  activeTab: AttendanceTab;
  setActiveTab: (tab: AttendanceTab) => void;
  onLogout: () => void;
  schoolName: string;
  teacherName: string;
  isOpenMobile?: boolean;
  setIsOpenMobile?: (open: boolean) => void;
}

export function AttendanceTeacherSidebar({
  activeTab,
  setActiveTab,
  onLogout,
  schoolName,
  teacherName,
  isOpenMobile,
  setIsOpenMobile,
}: AttendanceTeacherSidebarProps) {
  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'community', label: 'المجتمع المدرسي', icon: MessageSquare },
    { id: 'private_messages', label: 'رسائلي', icon: MessageSquare },
    { id: 'leaderboard', label: 'الأوائل', icon: Trophy },
    { id: 'badges', label: 'الأوسمة والتقديرات', icon: Award },
    { id: 'announcements', label: 'الإعلانات الرسمية', icon: Megaphone },
    { id: 'profile', label: 'الملف الشخصي', icon: User },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white border-l border-slate-200/80 w-full lg:w-64 p-4 font-['Cairo',sans-serif]">
      <div>
        {/* Top Header & Role Badge */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 leading-tight">منظومة الحضور والغياب</h1>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[140px]">{schoolName}</p>
            </div>
          </div>

          {setIsOpenMobile && (
            <button
              onClick={() => setIsOpenMobile(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Teacher Badge */}
        <div className="mb-5 p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center gap-3">
          <AvatarDisplay layoutUid={ROLE_AVATARS.ATTENDANCE_TEACHER} size="sm" />
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-blue-900 block truncate">مسؤول الحضور المعتمد</span>
            <p className="text-xs font-extrabold text-slate-900 mt-0.5 truncate">{teacherName}</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  playSwitchTabSound();
                  setActiveTab(item.id as AttendanceTab);
                  if (setIsOpenMobile) setIsOpenMobile(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Restricted Capabilities Notice & Logout */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[10px] text-slate-500 flex items-start gap-2 leading-relaxed">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <span>حساب محدد الصلاحيات لتسجيل الحضور والغياب اليومي فقط.</span>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
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
      <aside className="hidden lg:block h-screen sticky top-0 shrink-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsOpenMobile && setIsOpenMobile(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
