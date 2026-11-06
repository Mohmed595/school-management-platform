import React, { useState, useEffect } from 'react';
import { ViewTab } from '../../types';
import { getStoredSchools } from '../../lib/storage';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { getUserAvatarLayoutUid } from '../../lib/avatarLayouts';
import { AccountSwitcherButton } from '../auth/AccountSwitcherButton';
import {
  Menu,
  Plus,
  Bell,
  Search,
  Check,
  ShieldCheck,
  Building2,
  Trash2,
  X,
  CheckCheck,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type?: 'warning' | 'info' | 'success';
}

interface TopNavProps {
  activeTab: ViewTab;
  onOpenMobileSidebar: () => void;
  onOpenCreateSchool: () => void;
  totalActiveSchools: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function TopNav({
  activeTab,
  onOpenMobileSidebar,
  onOpenCreateSchool,
  totalActiveSchools,
  searchQuery,
  setSearchQuery,
}: TopNavProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Generate dynamic notifications from real schools data on mount or when tab changes
  useEffect(() => {
    const schools = getStoredSchools();
    const items: NotificationItem[] = [];

    // Alert for suspended schools
    const suspended = schools.filter((s) => s.status === 'معلقة');
    if (suspended.length > 0) {
      items.push({
        id: 'notif-suspended',
        title: 'تنبيه مدارس معلقة',
        desc: `يوجد ${suspended.length} مدارس معلقة الترخيص (${suspended.map((s) => s.name).slice(0, 2).join('، ')})`,
        time: 'الآن',
        read: false,
        type: 'warning',
      });
    }

    // Alert for active schools count
    items.push({
      id: 'notif-active-summary',
      title: 'حالة النظام المركزي',
      desc: `يعمل بالنظام حالياً ${totalActiveSchools} مدرسة نشطة من أصل ${schools.length} مدرسة مسجلة`,
      time: 'منذ 5 دقائق',
      read: false,
      type: 'info',
    });

    // Alert for latest added school
    if (schools.length > 0) {
      const latest = schools[0];
      items.push({
        id: 'notif-latest-school',
        title: 'أحدث مدرسة مسجلة',
        desc: `تم تسجيل ${latest.name} بمحافظة ${latest.governorate} وباقة ${latest.subscription}`,
        time: 'اليوم',
        read: true,
        type: 'success',
      });
    }

    setNotifications(items);
  }, [totalActiveSchools, activeTab]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getTabTitle = (tab: ViewTab) => {
    switch (tab) {
      case 'dashboard':
        return 'لوحة التحكم الرئيسية';
      case 'schools':
        return 'إدارة المدارس المصرية';
      case 'licenses':
        return 'إدارة التراخيص والاشتراكات';
      case 'analytics':
        return 'التقارير والإحصائيات الشاملة';
      case 'database':
        return 'قاعدة البيانات والمراقبة';
      case 'settings':
        return 'إعدادات المنصة والحساب';
      case 'ai_assistant':
        return 'المساعد الذكي (AI)';
      default:
        return 'لوحة التحكم';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left side (RTL context) */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          title="افتح القائمة"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
            {getTabTitle(activeTab)}
          </h1>
          <p className="hidden sm:block text-xs text-slate-500">
            النظام المركزي لإدارة المدارس في جمهورية مصر العربية
          </p>
        </div>
      </div>

      {/* Middle Search Bar (Visible on Desktop) */}
      <div className="hidden md:flex items-center flex-1 max-w-sm mx-4">
        <div className="relative w-full">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث عن مدرسة، كود، مفتاح ترخيص، أومحافظة..."
            className="w-full pr-9 pl-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          />
        </div>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Create School Quick CTA */}
        <button
          onClick={onOpenCreateSchool}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-primary hover:bg-brand-hover active:bg-brand-active text-white font-semibold text-xs rounded-xl shadow-2xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">إضافة مدرسة جديدة</span>
          <span className="sm:hidden">مدرسة</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="التنبيهات"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-primary ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="fixed left-3 right-3 top-16 sm:absolute sm:top-full sm:left-0 sm:right-auto sm:mt-2 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 text-right">
              <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">التنبيهات الإدارية</span>
                  {unreadCount > 0 && (
                    <span className="bg-brand-light text-brand-primary font-bold text-[10px] px-2 py-0.5 rounded-full">
                      {unreadCount} غير مقروء
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-brand-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      تحديد الكل كمقروء
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[11px] text-slate-400 hover:text-red-600 flex items-center gap-1 font-medium cursor-pointer"
                      title="مسح الكل"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    لا توجد تنبيهات حالياً
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => toggleRead(n.id)}
                      className={`p-3 sm:p-3.5 hover:bg-slate-50 transition-colors cursor-pointer relative group ${
                        !n.read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-brand-primary shrink-0" />
                          )}
                          <span className="text-xs font-bold text-slate-900">{n.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{n.time}</span>
                          <button
                            onClick={(e) => deleteNotification(n.id, e)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-0.5 cursor-pointer"
                            title="حذف التنبيه"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pr-3.5">{n.desc}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Account Switcher Button */}
        <AccountSwitcherButton variant="compact" />

        {/* Owner Profile Card */}
        <div className="flex items-center gap-2.5 pr-2 border-r border-slate-200/80">
          <AvatarDisplay
            layoutUid={getUserAvatarLayoutUid('platform_owner')}
            size="sm"
            showGlow={true}
          />
          <div className="hidden xl:block text-right">
            <h3 className="text-xs font-bold text-slate-900 leading-tight">المهندس مالك المنصة</h3>
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              مدير النظام الرئيسي
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
