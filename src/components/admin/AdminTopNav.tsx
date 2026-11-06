import React, { useState, useEffect } from 'react';
import { Menu, Search, Bell, GraduationCap, Building, CheckCheck, Trash2, X, SlidersHorizontal, Sparkles, ShieldAlert, AlertTriangle } from 'lucide-react';
import { AdminViewTab } from '../../types/admin';
import { getActiveSmartSuspensionAlerts, fetchAndSyncSmartSuspensionAlerts, SmartSuspensionAlert } from '../../lib/smartSuspensionRule';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { getUserAvatarLayoutUid } from '../../lib/avatarLayouts';
import { AccountSwitcherButton } from '../auth/AccountSwitcherButton';

interface AdminTopNavProps {
  activeTab: AdminViewTab;
  schoolName: string;
  principalName: string;
  onOpenMobileSidebar: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenSetupWizard?: () => void;
  schoolId?: string;
  onNavigateTab?: (tab: AdminViewTab) => void;
}

const TAB_TITLES: Record<AdminViewTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'لوحة القيادة والمتابعة اليومية',
    subtitle: 'مؤشرات الحضور، الأنشطة، والإعلانات المركزية للمدرسة',
  },
  private_messages: {
    title: 'رسائلي (المحادثات الخاصة)',
    subtitle: 'صندوق المحادثات والرسائل المباشرة مع الطلاب والمعلمين',
  },
  community: {
    title: 'المجتمع المدرسي للتواصل والتفاعل',
    subtitle: 'مساحة تواصل آمنة ومراقبة بين الطلاب والمعلمين وإدارة المدرسة',
  },
  calendar: {
    title: '📅 التقويم المدرسي',
    subtitle: 'مخطط شهري لإدارة المدرسة لمتابعة وتنظيم المهام والفعاليات',
  },
  leaderboard: {
    title: '🏆 قائمة الأوائل (Top 100)',
    subtitle: 'ترتيب الطلاب المتفوقين في المدرسة بناءً على النقاط والأوسمة',
  },
  students: {
    title: 'سجلات الطلاب والملفات الفردية',
    subtitle: 'إدارة الطلاب، التسجيل، والسلوك والمتابعة المدرسية',
  },
  teachers: {
    title: 'إدارة الكادر التعليمي والمعلمين',
    subtitle: 'توزيع المواد، الصفوف، والبيانات الوظيفية',
  },
  classes: {
    title: 'الصفوف والمراحل الدراسية',
    subtitle: 'توزيع الطلاب، رواد الصفوف، والطاقة الاستيعابية',
  },
  subjects: {
    title: 'المناهج والمواد الدراسية',
    subtitle: 'تحديد الدرجات العظمى، درجات النجاح، والمعلمين المخصصين',
  },
  attendance: {
    title: 'رصد الحضور والغياب اليومي',
    subtitle: 'تحضير الطلاب حسب الصفوف والتأخيرات بضغط زر واحدة',
  },
  behavior: {
    title: 'سجل السلوك والانضباط المدرسي',
    subtitle: 'تسجيل التميز والسلوك الإيجابي والسلبي مع الملاحظات',
  },
  badges: {
    title: 'نظام الأوسمة والتكريمات الرسمية',
    subtitle: 'منح وسحب الأوسمة التقديرية للطلاب والمعلمين وتوثيق إنجازاتهم',
  },
  infractions: {
    title: 'مذكرات المشاغبات وقرارات الإدارة',
    subtitle: 'مراجعة وقائع المشاغبة المحالة من المعلمين واتخاذ قرارات الاستدعاء، الفصل المؤقت، أو التخطي',
  },
  adminActions: {
    title: 'الإجراءات والقرارات الإدارية',
    subtitle: 'استدعاء أولياء الأمور وإصدار قرارات الإيقاف المؤقت عن الدراسة',
  },
  announcements: {
    title: 'مركز الإعلانات والتعاميم',
    subtitle: 'إصدار التنبيهات الموجهة للمعلمين والطلاب',
  },
  reports: {
    title: 'التقارير والإحصائيات الشاملة',
    subtitle: 'استخراج وتصدير تقارير PDF و Excel للحضور والدرجات',
  },
  extensions: {
    title: 'مركز الإضافات والميزات المتقدمة',
    subtitle: 'التحكم في ميزات المدرسة، ميزات الطلاب، والمجتمع المدرسي وتخصيص الصلاحيات',
  },
  settings: {
    title: 'إعدادات وبيانات المدرسة',
    subtitle: 'الشعار، الهاتف، العنوان، والعام الدراسي الرسمي',
  },
  ai_assistant: {
    title: 'المساعد الذكي (AI)',
    subtitle: 'تحليل البيانات واستعراض التقارير الذكية بالذكاء الاصطناعي',
  },
};

export function AdminTopNav({
  activeTab,
  schoolName,
  principalName,
  onOpenMobileSidebar,
  searchQuery,
  setSearchQuery,
  onOpenSetupWizard,
  schoolId,
  onNavigateTab,
}: AdminTopNavProps) {
  const currentTabInfo = TAB_TITLES[activeTab] || TAB_TITLES.dashboard;
  const [showNotifications, setShowNotifications] = useState(false);
  const [smartAlerts, setSmartAlerts] = useState<SmartSuspensionAlert[]>([]);
  const [notifications, setNotifications] = useState<
    {
      id: string;
      title: string;
      desc: string;
      time: string;
      read: boolean;
    }[]
  >([]);

  const loadSmartAlerts = async () => {
    // 1. Synchronous cache read for instant UI
    const cached = getActiveSmartSuspensionAlerts(schoolId);
    setSmartAlerts(cached);

    // 2. Asynchronous server fetch if schoolId is present
    if (schoolId) {
      try {
        const serverAlerts = await fetchAndSyncSmartSuspensionAlerts(schoolId);
        setSmartAlerts(serverAlerts.filter((a) => a.status === 'active'));
      } catch (err) {}
    }
  };

  useEffect(() => {
    loadSmartAlerts();

    const handleStorageChange = () => loadSmartAlerts();
    window.addEventListener('school_data_changed', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('school_data_changed', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [schoolId]);

  const unreadCount = notifications.filter((n) => !n.read).length + smartAlerts.length;

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

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left side (RTL right) */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-sm font-bold text-slate-900 leading-tight">
            {currentTabInfo.title}
          </h2>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            {currentTabInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative hidden md:block w-48 lg:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث عن طالب أو معلم..."
            className="w-full pr-8 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
        </div>

        {/* School Info Badge */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
          <Building className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-bold truncate max-w-[150px]">{schoolName}</span>
        </div>

        {/* School Setup Wizard Quick Button */}
        {onOpenSetupWizard && (
          <button
            onClick={onOpenSetupWizard}
            title="تهيئة وإعداد المدرسة المبتكرة"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="hidden sm:inline">تهيئة المدرسة</span>
            <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300 hidden sm:inline" />
          </button>
        )}

        {/* Notifications Icon */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            title="التنبيهات الإدارية"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {smartAlerts.length > 0 ? (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full ring-2 ring-white animate-ping"></span>
            ) : unreadCount > 0 ? (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
            ) : null}
          </button>

          {showNotifications && (
            <div className="fixed left-3 right-3 top-16 sm:absolute sm:top-full sm:left-0 sm:right-auto sm:mt-2 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 text-right">
              <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">تنبيهات المدرسة</span>
                  {unreadCount > 0 && (
                    <span className="bg-orange-100 text-orange-800 font-bold text-[10px] px-2 py-0.5 rounded-full border border-orange-200">
                      {unreadCount} تنبيه موجه
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      تحديد الكل كمقروء
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={() => setNotifications([])}
                      className="text-[11px] text-slate-400 hover:text-red-600 flex items-center gap-1 font-medium cursor-pointer"
                      title="مسح الكل"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {/* 🛡️ Smart Suspension Alerts (High Priority) */}
                {smartAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => {
                      if (onNavigateTab) onNavigateTab('adminActions');
                      setShowNotifications(false);
                    }}
                    className="p-3.5 bg-orange-50/90 border-r-4 border-orange-500 hover:bg-orange-100/80 transition-colors cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
                        <span className="text-xs font-black text-orange-950 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                          <span>🚨 تعارض بين الحضور والإيقاف</span>
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                        حرج
                      </span>
                    </div>

                    <p className="text-xs font-bold text-orange-900 leading-relaxed">
                      تم تسجيل الطالب كـ ({alert.attendanceStatus}) رغم وجود إيقاف نشط. يرجى مراجعة الأمر.
                    </p>

                    <div className="text-[11px] text-orange-950 font-medium space-y-0.5 bg-white/70 p-2 rounded-lg border border-orange-200/60">
                      <div><span className="font-bold">الطالب:</span> {alert.studentName} ({alert.className})</div>
                      <div><span className="font-bold">المعلم:</span> {alert.attendanceTeacherName}</div>
                      <div><span className="font-bold">التوقيت:</span> {alert.recordedDate} - {alert.recordedTime}</div>
                    </div>

                    <div className="text-[10px] font-extrabold text-orange-700 text-left underline">
                      اضغط للانتقال إلى الإجراءات الإدارية وتصحيح الأمر ←
                    </div>
                  </div>
                ))}

                {notifications.length === 0 && smartAlerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    لا توجد تنبيهات حالياً
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => toggleRead(n.id)}
                      className={`p-3 sm:p-3.5 hover:bg-slate-50 transition-colors cursor-pointer relative group ${
                        !n.read ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
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
                            <X className="w-3.5 h-3.5" />
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

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2.5 pl-1 border-r border-slate-200/80 pr-3">
          <AvatarDisplay
            layoutUid={getUserAvatarLayoutUid('school_admin')}
            size="sm"
          />
          <div className="hidden sm:block text-right">
            <span className="text-xs font-bold text-slate-900 block leading-tight">
              إدارة المدرسة
            </span>
            <span className="text-[10px] text-slate-500 truncate max-w-[120px] block">
              {principalName || 'مدير المدرسة'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
