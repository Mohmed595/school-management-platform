import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Star,
  UserCheck,
  Megaphone,
  BarChart3,
  Settings,
  LogOut,
  X,
  Building,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Award,
  MessageSquare,
  Calendar,
  Trophy,
  Puzzle,
  FileWarning,
} from 'lucide-react';

import { AdminViewTab } from '../../types/admin';
import { playSwitchTabSound } from '../../lib/sound';

interface AdminSidebarProps {
  activeTab: AdminViewTab;
  setActiveTab: (tab: AdminViewTab) => void;
  onLogout: () => void;
  schoolName: string;
  schoolCode: string;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onSwitchToOwner?: () => void;
  onOpenSetupWizard?: () => void;
}

export function AdminSidebar({
  activeTab,
  setActiveTab,
  onLogout,
  schoolName,
  schoolCode,
  isOpenMobile,
  setIsOpenMobile,
  onSwitchToOwner,
  onOpenSetupWizard,
}: AdminSidebarProps) {
  const navItems = [
    { id: 'dashboard' as AdminViewTab, label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'private_messages' as AdminViewTab, label: 'رسائلي', icon: MessageSquare },
    { id: 'leaderboard' as AdminViewTab, label: 'الأوائل', icon: Trophy },
    { id: 'community' as AdminViewTab, label: 'المجتمع المدرسي', icon: MessageSquare },
    { id: 'calendar' as AdminViewTab, label: 'التقويم', icon: Calendar },
    { id: 'students' as AdminViewTab, label: 'الطلاب', icon: Users },
    { id: 'teachers' as AdminViewTab, label: 'المعلمين', icon: GraduationCap },
    { id: 'classes' as AdminViewTab, label: 'الصفوف', icon: Building2 },
    { id: 'attendance' as AdminViewTab, label: 'الحضور', icon: CalendarCheck },
    { id: 'behavior' as AdminViewTab, label: 'السلوك', icon: Star },
    { id: 'badges' as AdminViewTab, label: 'الأوسمة', icon: Award },
    { id: 'infractions' as AdminViewTab, label: 'المشاغبات', icon: FileWarning },
    { id: 'adminActions' as AdminViewTab, label: 'الإجراءات الإدارية', icon: ShieldAlert },
    { id: 'announcements' as AdminViewTab, label: 'الإعلانات', icon: Megaphone },

    { id: 'reports' as AdminViewTab, label: 'التقارير', icon: BarChart3 },
    { id: 'extensions' as AdminViewTab, label: 'الإضافات', icon: Puzzle },
    { id: 'settings' as AdminViewTab, label: 'الإعدادات', icon: Settings },
    { id: 'ai_assistant' as AdminViewTab, label: 'المساعد الذكي (AI)', icon: Sparkles },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 right-0 z-50 h-screen w-72 sm:w-80 max-w-[85vw] lg:w-64 bg-white border-l border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out shrink-0 ${
          isOpenMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header Branding */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-sm text-slate-900 truncate leading-tight" title={schoolName || 'إدارة المدرسة'}>
                {schoolName || 'إدارة المدرسة'}
              </h1>
              <p className="text-[11px] text-emerald-700 font-mono font-semibold mt-0.5 truncate" title={`كود: ${schoolCode || '---'}`}>
                كود: {schoolCode || '---'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOpenMobile(false)}
            className="lg:hidden text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Badge / Mode Notice */}
        <div className="px-4 pt-3 space-y-2">
          <div className="p-2.5 bg-emerald-50/80 border border-emerald-200/60 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>لوحة إدارة المدرسة</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-200">
              2025/2026
            </span>
          </div>

          {/* Setup Wizard Modal Launcher Button */}
          {onOpenSetupWizard && (
            <button
              onClick={() => {
                onOpenSetupWizard();
                setIsOpenMobile(false);
              }}
              className="w-full p-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-xs text-xs font-bold transition-all cursor-pointer flex items-center justify-between group active:scale-[0.98]"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-300 shrink-0" />
                <span>إعداد وتهيئة المدرسة</span>
              </div>
              <span className="text-[10px] bg-white/20 text-white font-mono px-2 py-0.5 rounded-full group-hover:bg-white/30 transition-colors flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                4 خطوات
              </span>
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  playSwitchTabSound();
                  setActiveTab(item.id);
                  setIsOpenMobile(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-100 space-y-1 shrink-0">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
