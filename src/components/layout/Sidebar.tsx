import React from 'react';
import { ViewTab } from '../../types';
import { playSwitchTabSound } from '../../lib/sound';
import {
  LayoutDashboard,
  Building2,
  KeyRound,
  BarChart3,
  Database,
  Settings,
  LogOut,
  Sparkles,
  ChevronLeft,
  X,
  Smartphone,
  Activity,
  LifeBuoy,
} from 'lucide-react';

interface SidebarProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  onLogout: () => void;
  schoolsCount: number;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  onLogout,
  schoolsCount,
  isOpenMobile,
  setIsOpenMobile,
}: SidebarProps) {
  const menuItems: { id: ViewTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'الرئيسية',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'schools',
      label: 'المدارس',
      icon: <Building2 className="w-4 h-4" />,
      badge: String(schoolsCount),
    },
    {
      id: 'licenses',
      label: 'التراخيص',
      icon: <KeyRound className="w-4 h-4" />,
    },
    {
      id: 'messages',
      label: 'الواتساب والرسائل (WhatsApp)',
      icon: <Smartphone className="w-4 h-4 text-emerald-600" />,
      badge: 'مباشر',
    },
    {
      id: 'tickets',
      label: 'الشكاوى',
      icon: <LifeBuoy className="w-4 h-4 text-blue-600" />,
    },
    {
      id: 'analytics',
      label: 'الإحصائيات',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'database',
      label: 'قاعدة البيانات',
      icon: <Database className="w-4 h-4" />,
    },
    {
      id: 'platform_usage',
      label: 'استخدام المنصة',
      icon: <Activity className="w-4 h-4 text-teal-600" />,
      badge: 'الاستضافة',
    },
    {
      id: 'settings',
      label: 'الإعدادات',
      icon: <Settings className="w-4 h-4" />,
    },
    {
      id: 'ai_assistant',
      label: 'المساعد الذكي (AI)',
      icon: <Sparkles className="w-4 h-4 text-indigo-600" />,
      badge: 'جديد',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 right-0 z-50 h-screen w-72 sm:w-80 max-w-[85vw] lg:w-64 bg-white border-l border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out shrink-0 ${
          isOpenMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-primary flex items-center justify-center text-white font-bold text-lg shadow-xs">
              م
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm tracking-tight leading-tight">
                منصة المدارس
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                لوحة المالك (Owner)
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsOpenMobile(false)}
            className="lg:hidden text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              القائمة الرئيسية
            </span>
          </div>

          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  playSwitchTabSound();
                  setActiveTab(item.id);
                  setIsOpenMobile(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand-light text-brand-primary font-bold border border-brand-border shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-brand-primary' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-[11px] rounded-full font-bold ${
                      isActive ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* System Info Banner */}
        <div className="p-3 mx-3 mb-3 bg-slate-50 rounded-xl border border-slate-200/60">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-primary shrink-0" />
            <span className="text-xs font-bold text-slate-800">نظام موحد لجمهورية مصر</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            ربط مباشر لمحافظات مصر مع مزامنة بيانات الترخيص فورياً.
          </p>
        </div>

        {/* Footer Logout Button */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </div>
            <ChevronLeft className="w-4 h-4 opacity-40" />
          </button>
        </div>
      </aside>
    </>
  );
}
