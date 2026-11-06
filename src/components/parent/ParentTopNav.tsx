import React, { useState, useEffect, useRef } from 'react';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { getUserAvatarLayoutUid } from '../../lib/avatarLayouts';
import {
  getStudentAvatarTheme,
  getStudentInitial,
} from '../../lib/studentAvatarThemes';
import { getStoredSession, getStoredSessionToken } from '../../lib/storage';
import {
  Menu,
  Bell,
  User,
  GraduationCap,
  Building2,
  LogOut,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  ArrowLeft,
  Calendar,
  Star,
  Award,
} from 'lucide-react';
import { ParentPortalData, ParentViewTab } from '../../types/parent';
import { getStudentNotifications } from '../../lib/adminActionStorage';
import { formatArabicNumber } from '../../lib/utils';
import { AccountSwitcherButton } from '../auth/AccountSwitcherButton';

interface ParentTopNavProps {
  data: ParentPortalData;
  onOpenMobileMenu: () => void;
  onSelectTab: (tab: ParentViewTab) => void;
  onLogout: () => void;
}

export function ParentTopNav({
  data,
  onOpenMobileMenu,
  onSelectTab,
  onLogout,
}: ParentTopNavProps) {
  const { student, schoolInfo, announcements, adminActions } = data;

  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const [currentThemeId, setCurrentThemeId] = useState<string | null>(
    () => student?.avatar_layout_uid || getStoredSession()?.avatar_layout_uid || null
  );

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNotifications]);

  useEffect(() => {
    if (student?.avatar_layout_uid) {
      setCurrentThemeId(student.avatar_layout_uid);
    }
  }, [student?.avatar_layout_uid]);

  useEffect(() => {
    const fetchAuthoritativeTheme = async () => {
      const sId = schoolInfo?.schoolId || (schoolInfo as any)?.id || student?.schoolId;
      const stdId = student?.id;
      if (!sId || !stdId) return;
      try {
        const token = getStoredSessionToken();
        const res = await fetch(`/api/schools/${sId}/students/${stdId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.student?.avatar_layout_uid) {
            setCurrentThemeId(json.student.avatar_layout_uid);
          }
        }
      } catch (err) {}
    };
    fetchAuthoritativeTheme();
  }, [student?.id, schoolInfo?.schoolId]);

  useEffect(() => {
    const handleAvatarUpdate = (e: any) => {
      if (e.detail?.themeId) {
        setCurrentThemeId(e.detail.themeId);
      }
    };
    window.addEventListener('student_avatar_updated', handleAvatarUpdate);
    return () => window.removeEventListener('student_avatar_updated', handleAvatarUpdate);
  }, []);

  const activeTheme = getStudentAvatarTheme(currentThemeId);

  // Compute unread notifications including administrative actions
  const allNotifs = student?.id && schoolInfo?.schoolId
    ? getStudentNotifications(schoolInfo.schoolId, student.id, adminActions)
    : [];
  const unreadCount = allNotifs.filter((n) => !n.isRead).length;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 px-4 sm:px-8 py-3.5 flex items-center justify-between dir-rtl">
        {/* Left items: Logout, School Logo Badge, Bell Notifications */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick Logout button */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-10 h-10 sm:w-11 sm:h-11 bg-slate-100/90 hover:bg-slate-200/80 text-slate-800 rounded-2xl flex items-center justify-center transition-colors cursor-pointer border border-slate-200/60"
            title="تسجيل الخروج"
          >
            <LogOut className="w-5 h-5 text-slate-700" />
          </button>

          {/* Account Switcher Button */}
          <AccountSwitcherButton variant="pill" />

        {/* Student Avatar / Identity Emblem - Dynamic with Active Theme */}
        <div
          id="parent-top-nav-avatar-emblem"
          onClick={() => onSelectTab('profile')}
          title={`السمة الشخصية الحالية: ${activeTheme.name} - انقر لتخصيص السمة`}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl border flex items-center justify-center shadow-2xs shrink-0 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${activeTheme.gradientClass} ${activeTheme.borderClass} ${activeTheme.glowClass}`}
        >
          <span className="font-black text-white text-sm sm:text-base leading-none drop-shadow-xs font-['Cairo',sans-serif]">
            {getStudentInitial(student?.name)}
          </span>
        </div>

        {/* Notifications Bell with Dropdown */}
        <div className="relative" ref={notifDropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center relative transition-all cursor-pointer border ${
              showNotifications
                ? 'bg-blue-50 text-blue-700 border-blue-200 ring-2 ring-blue-500/20'
                : 'bg-slate-100/90 hover:bg-slate-200/80 text-slate-800 border-slate-200/60'
            }`}
            title="التنبيهات والإعلانات"
            aria-expanded={showNotifications}
          >
            <Bell className={`w-5 h-5 ${showNotifications ? 'text-blue-600' : 'text-slate-700'}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
                {unreadCount > 9 ? '+9' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Container */}
          {showNotifications && (
            <>
              {/* Mobile Backdrop (No blur, does not obscure top bar) */}
              <div
                className="fixed inset-0 bg-slate-900/20 sm:hidden z-40"
                onClick={() => setShowNotifications(false)}
              />

              {/* Popover Panel */}
              <div
                className="fixed left-3 right-3 top-16 sm:absolute sm:top-full sm:right-0 sm:left-auto sm:mt-3 sm:w-[380px] max-w-[calc(100vw-1.5rem)] bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-4 z-50 text-xs space-y-3 animate-in fade-in zoom-in-95 duration-150"
                role="dialog"
                aria-label="قائمة التنبيهات المدرسية"
              >
                {/* Visual Pointer Caret for Desktop anchored directly to Bell Icon */}
                <div className="hidden sm:block absolute -top-1.5 right-4 w-3.5 h-3.5 bg-white border-t border-r border-slate-200/90 rotate-[-45deg] z-10" />

                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 relative z-20">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                      <Bell className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-slate-900 text-sm">
                      التنبيهات المدرسية
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-50 text-red-600 border border-red-200">
                        {unreadCount} جديدة
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="إغلاق"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Notifications List */}
                <div className="max-h-72 overflow-y-auto space-y-2 pr-0.5 divide-y divide-slate-50">
                  {allNotifs.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-100">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      </div>
                      <p className="font-bold text-slate-700 text-xs">لا توجد تنبيهات جديدة</p>
                      <p className="text-[11px] text-slate-400">أنت على اطلاع دائم بجميع المستجدات</p>
                    </div>
                  ) : (
                    allNotifs.slice(0, 5).map((notif) => {
                      const isSummons = notif.category === 'parent_summons';
                      const isSuspension = notif.category === 'temporary_suspension' || notif.category === 'expulsion';
                      const isPositive = notif.category === 'behavior' && (notif.title?.includes('+') || notif.title?.includes('إيجابي'));
                      const isBadge = notif.category === 'badge' || notif.title?.includes('وسام');

                      return (
                        <div
                          key={notif.id}
                          onClick={() => {
                            onSelectTab(notif.targetTab || 'notifications');
                            setShowNotifications(false);
                          }}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 pt-2.5 ${
                            isSummons || isSuspension
                              ? 'bg-rose-50/70 hover:bg-rose-100/70 border-rose-200/80 text-rose-950'
                              : isPositive
                              ? 'bg-emerald-50/60 hover:bg-emerald-100/60 border-emerald-200/70 text-emerald-950'
                              : isBadge
                              ? 'bg-indigo-50/60 hover:bg-indigo-100/60 border-indigo-200/70 text-indigo-950'
                              : 'bg-slate-50/80 hover:bg-blue-50/70 border-slate-200/70 text-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 font-bold text-xs">
                            <span className={`truncate flex items-center gap-1.5 ${
                              isSummons || isSuspension ? 'text-rose-700 font-black' : isPositive ? 'text-emerald-700 font-black' : isBadge ? 'text-indigo-700 font-black' : 'text-slate-900'
                            }`}>
                              {isSummons && <User className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                              {isSuspension && <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                              {isPositive && <Star className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500 shrink-0" />}
                              {isBadge && <Award className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                              <span className="truncate">{notif.title}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium shrink-0 bg-white/80 px-2 py-0.5 rounded-md border border-slate-100">
                              {notif.date?.split('T')[0]}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      onSelectTab('notifications');
                      setShowNotifications(false);
                    }}
                    className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold rounded-xl text-center text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                  >
                    <span>عرض كل التنبيهات والإشعارات</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right items: Blue Graduation Button & Hamburger Menu */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="w-10 h-10 sm:w-11 sm:h-11 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xs shrink-0">
          <GraduationCap className="w-6 h-6" />
        </div>

        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-800 hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer"
          title="القائمة"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>

    {/* LOGOUT CONFIRMATION MODAL */}
    {showLogoutModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 dir-rtl">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          onClick={() => setShowLogoutModal(false)}
        />

        {/* Modal Container */}
        <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100 z-10 space-y-4 animate-in zoom-in-95 duration-150">
          {/* Warning Circle */}
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-100">
            <LogOut className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-slate-900">تأكيد تسجيل الخروج</h3>
            <p className="text-xs font-medium text-slate-500">
              هل أنت تأكد من أنك تريد تسجيل الخروج من الحساب؟
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => {
                setShowLogoutModal(false);
                onLogout();
              }}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              موافق (تسجيل الخروج)
            </button>
            <button
              onClick={() => setShowLogoutModal(false)}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
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
