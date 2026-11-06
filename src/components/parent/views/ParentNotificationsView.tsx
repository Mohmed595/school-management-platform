import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  PhoneCall,
  UserX,
  Megaphone,
  BarChart3,
  Star,
  Award,
  AlertTriangle,
  Clock,
  Calendar,
  Filter,
  ChevronLeft,
  Sparkles,
  Inbox,
  ArrowLeft,
  CircleAlert,
  FileText,
  User,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { ParentPortalData, ParentViewTab } from '../../../types/parent';
import {
  ParentNotification,
  NotificationCategory,
  AdministrativeAction,
} from '../../../types/adminAction';
import {
  getStudentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  fetchAndSyncStudentAdminActions,
} from '../../../lib/adminActionStorage';
import { formatArabicNumber } from '../../../lib/utils';

interface ParentNotificationsViewProps {
  data: ParentPortalData;
  onNavigateTab?: (tab: ParentViewTab) => void;
}

function formatNotificationDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const now = new Date();
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 3600);

  const timeFormatted = date.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  if (diffHours < 24 && now.getDate() === date.getDate()) {
    return `${timeFormatted} اليوم`;
  } else if (
    diffHours < 48 &&
    (now.getDate() - date.getDate() === 1 || now.getDate() - date.getDate() === -30)
  ) {
    return `أمس ${timeFormatted}`;
  } else {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day} ${timeFormatted}`;
  }
}

export function ParentNotificationsView({ data, onNavigateTab }: ParentNotificationsViewProps) {
  const { student, schoolInfo, adminActions } = data;
  const [notifications, setNotifications] = useState<ParentNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'unread' | 'high_priority' | 'actions'
  >('all');

  const loadNotifications = async () => {
    if (!student?.id || !schoolInfo?.schoolId) return;
    
    // Initial display with existing data / prop adminActions
    let currentActions = adminActions;
    const initialNotifs = getStudentNotifications(schoolInfo.schoolId, student.id, currentActions);
    setNotifications(initialNotifs);

    // Fetch and sync authoritative administrative actions from PostgreSQL
    try {
      const serverActions = await fetchAndSyncStudentAdminActions(schoolInfo.schoolId, student.id);
      const syncedNotifs = getStudentNotifications(schoolInfo.schoolId, student.id, serverActions);
      setNotifications(syncedNotifs);
    } catch (err) {}
  };

  useEffect(() => {
    loadNotifications();

    const handleDataChanged = () => loadNotifications();
    window.addEventListener('school_data_changed', handleDataChanged);
    window.addEventListener('storage', handleDataChanged);
    return () => {
      window.removeEventListener('school_data_changed', handleDataChanged);
      window.removeEventListener('storage', handleDataChanged);
    };
  }, [student?.id, schoolInfo?.schoolId]);

  const handleMarkAsRead = (notificationId: string, targetTab?: ParentViewTab) => {
    markNotificationAsRead(student.id, notificationId);
    loadNotifications();
    if (targetTab && onNavigateTab) {
      onNavigateTab(targetTab);
    }
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(student.id, notifications);
    loadNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const highPriorityCount = notifications.filter((n) => n.priority === 'عالي').length;
  const actionsCount = notifications.filter(
    (n) => n.category === 'parent_summons' || n.category === 'temporary_suspension'
  ).length;

  // Filter list
  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.isRead;
    if (activeFilter === 'high_priority') return n.priority === 'عالي';
    if (activeFilter === 'actions')
      return (
        n.category === 'parent_summons' ||
        n.category === 'temporary_suspension' ||
        n.category === 'attendance_late_rule'
      );
    return true;
  });

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'parent_summons':
        return <User className="w-5 h-5 text-red-600 stroke-[2.2]" />;
      case 'temporary_suspension':
        return <ShieldAlert className="w-5 h-5 text-red-600 stroke-[2.2]" />;
      case 'attendance_late_rule':
        return <Clock className="w-5 h-5 text-amber-600 stroke-[2.2]" />;
      case 'announcement':
        return <Megaphone className="w-5 h-5 text-indigo-600 stroke-[2.2]" />;
      case 'grade':
        return <FileText className="w-5 h-5 text-blue-600 stroke-[2.2]" />;
      case 'behavior':
        return <MessageSquare className="w-5 h-5 text-amber-600 stroke-[2.2]" />;
      case 'badge':
        return <Award className="w-5 h-5 text-amber-500 stroke-[2.2]" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600 stroke-[2.2]" />;
    }
  };

  const getSourceSubtitle = (n: ParentNotification) => {
    if (n.category === 'parent_summons' || n.category === 'temporary_suspension') {
      return 'من الإدارة';
    }
    if (n.category === 'attendance_late_rule') {
      return 'مسؤول الحضور والانضباط';
    }
    if (n.category === 'behavior') {
      return 'الأستاذ أحمد حسام';
    }
    if (n.category === 'grade') {
      return 'نظام المدرسة';
    }
    return 'إدارة المدرسة';
  };

  return (
    <div className="space-y-6 dir-rtl select-none font-sans max-w-5xl mx-auto p-2 sm:p-4">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-blue-900/40 flex items-center justify-between gap-6">
        <div className="absolute -top-10 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2.5 flex-1 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-black backdrop-blur-md border border-white/10 shadow-2xs">
            <Bell className="w-4 h-4 text-amber-300" />
            <span>مركز التنبيهات والإشعارات الرسمية</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            مركز الإشعارات والقرارات
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 font-bold leading-relaxed">
            متابعة مباشرة وموثقة لكافة استدعاءات أولياء الأمور، القرارات الإدارية، الدرجات، والملاحظات السلوكية للطالب{' '}
            <span className="text-amber-300 font-black underline decoration-amber-400/50 underline-offset-4">
              {student.name}
            </span>
          </p>

          {unreadCount > 0 && (
            <div className="pt-1">
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 border border-white/20 backdrop-blur-md shrink-0 active:scale-95 shadow-2xs"
              >
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                <span>تحديد الكل كمقروء ({formatArabicNumber(unreadCount)})</span>
              </button>
            </div>
          )}
        </div>

        {/* Stylized 3D Bell Illustration */}
        <div className="hidden sm:flex relative shrink-0 items-center justify-center w-36 h-36">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl" />
          <svg viewBox="0 0 160 160" className="w-36 h-36 drop-shadow-2xl overflow-visible">
            <defs>
              <linearGradient id="bellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#93c5fd" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#e0e7ff" />
              </linearGradient>
            </defs>
            {/* Background Paper Document */}
            <g transform="translate(65, 38) rotate(14)">
              <rect
                x="0"
                y="0"
                width="62"
                height="78"
                rx="10"
                fill="url(#docGrad)"
                stroke="#cbd5e1"
                strokeWidth="2.5"
              />
              <line x1="12" y1="20" x2="50" y2="20" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
              <line x1="12" y1="36" x2="42" y2="36" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
              <line x1="12" y1="50" x2="46" y2="50" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            </g>
            {/* 3D Blue Bell */}
            <g transform="translate(18, 18) rotate(-6)">
              <path
                d="M45 25 C45 15, 75 15, 75 25 C75 55, 95 65, 95 75 L25 75 C25 65, 45 55, 45 25 Z"
                fill="url(#bellGrad)"
                stroke="#1e40af"
                strokeWidth="1.5"
              />
              <circle cx="60" cy="83" r="10" fill="#1e3a8a" />
              {/* Red Notification Badge "1" */}
              <circle cx="85" cy="22" r="14" fill="#ef4444" stroke="#ffffff" strokeWidth="3" />
              <text
                x="85"
                y="27"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="15"
                fontWeight="900"
                fontFamily="sans-serif"
              >
                1
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* 2. Quick Summary KPI Grid (2x2) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Card 1: إجمالي الإشعارات */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-500 block">إجمالي الإشعارات</span>
            <span className="text-2xl font-black text-slate-900 block font-sans">
              {formatArabicNumber(notifications.length)}
            </span>
            <span className="text-[11px] font-bold text-slate-400 block">كل الإشعارات</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200/60 shadow-2xs">
            <Bell className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 2: غير مقروءة */}
        <div className="p-4 bg-white rounded-3xl border border-blue-100/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-extrabold text-blue-600 block">غير مقروءة</span>
            <span className="text-2xl font-black text-blue-700 block font-sans">
              {formatArabicNumber(unreadCount)}
            </span>
            <span className="text-[11px] font-bold text-slate-400 block">إشعارات جديدة</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
            <Inbox className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 3: عالية الأولوية */}
        <div className="p-4 bg-white rounded-3xl border border-red-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-extrabold text-red-600 block">عالية الأولوية</span>
            <span className="text-2xl font-black text-red-700 block font-sans">
              {formatArabicNumber(highPriorityCount)}
            </span>
            <span className="text-[11px] font-bold text-slate-400 block">تحتاج إلى متابعة</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100 shadow-2xs">
            <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 4: تحديث الحساب */}
        <div className="p-4 bg-white rounded-3xl border border-emerald-100/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-black text-emerald-600 block">تحديث الحساب</span>
            <span className="text-sm font-black text-emerald-800 block">مباشر ومحمي</span>
            <span className="text-[11px] font-bold text-slate-400 block">معلومات مهمة لك</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
            <Sparkles className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* 3. Filter Navigation Tabs Bar */}
      <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap min-h-[38px] flex items-center justify-center active:scale-98 ${
            activeFilter === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          الكل ({formatArabicNumber(notifications.length)})
        </button>

        <button
          onClick={() => setActiveFilter('unread')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap min-h-[38px] flex items-center justify-center gap-1.5 active:scale-98 ${
            activeFilter === 'unread'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <span>غير مقروءه ({formatArabicNumber(unreadCount)})</span>
          {unreadCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveFilter('high_priority')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap min-h-[38px] flex items-center justify-center gap-1.5 active:scale-98 ${
            activeFilter === 'high_priority'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <span>عالية الأولوية ({formatArabicNumber(highPriorityCount)})</span>
        </button>

        <button
          onClick={() => setActiveFilter('actions')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap min-h-[38px] flex items-center justify-center gap-1.5 active:scale-98 ${
            activeFilter === 'actions'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>الاستدعاءات والإيقاف ({formatArabicNumber(actionsCount)})</span>
        </button>
      </div>

      {/* 4. Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-200/60 shadow-2xs">
            <CheckCheck className="w-8 h-8 text-emerald-500 stroke-[2.2]" />
          </div>
          <h3 className="font-black text-base text-slate-900">لا توجد إشعارات حالياً</h3>
          <p className="text-xs text-slate-500 font-bold max-w-sm mx-auto leading-relaxed">
            جميع الإشعارات والقرارات تمت مشاهدتها ومراجعتها بالكامل أو لا توجد عناصر مطابقة للفلتر المختار.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredNotifications.map((n) => {
            const isUnread = !n.isRead;
            const isHighPriority = n.priority === 'عالي';
            const isAction =
              n.category === 'parent_summons' ||
              n.category === 'temporary_suspension' ||
              n.category === 'attendance_late_rule';
            const isBehavior = n.category === 'behavior';
            const isGrade = n.category === 'grade';

            // Card left accent bar color
            let accentBorderClass = 'border-l-4 border-l-blue-500';
            let dotColorClass = 'bg-blue-500';

            if (isAction || isHighPriority) {
              accentBorderClass = 'border-l-4 border-l-red-500';
              dotColorClass = 'bg-red-500';
            } else if (isBehavior) {
              accentBorderClass = 'border-l-4 border-l-amber-500';
              dotColorClass = 'bg-amber-500';
            } else if (isGrade) {
              accentBorderClass = 'border-l-4 border-l-blue-500';
              dotColorClass = 'bg-blue-500';
            }

            return (
              <div
                key={n.id}
                onClick={() => handleMarkAsRead(n.id, n.targetTab)}
                className={`bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 transition-all cursor-pointer relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-2xs hover:shadow-md hover:border-blue-300 ${accentBorderClass}`}
              >
                {/* Right / Main Content (RTL) */}
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Category Icon Box */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                      isAction
                        ? 'bg-red-50 text-red-600 border border-red-100'
                        : isBehavior
                        ? 'bg-amber-50 text-amber-600 border border-amber-100'
                        : isGrade
                        ? 'bg-blue-50 text-blue-600 border border-blue-100'
                        : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                    }`}
                  >
                    {getCategoryIcon(n.category)}
                  </div>

                  {/* Body Text */}
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-black text-sm sm:text-base text-slate-900 leading-snug">
                      {n.title.replace(/^🚨 |^⚠️ |^📢 |^📊 |^⭐ |^🏅 /, '')}
                    </h3>

                    <p className="text-xs font-bold text-slate-500 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>

                    <p className="text-[11px] font-bold text-slate-400">
                      {getSourceSubtitle(n)}
                    </p>
                  </div>
                </div>

                {/* Left Side Info (RTL) - Timestamp & Status Dot */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-600 font-sans">
                      {formatNotificationDate(n.date)}
                    </span>
                    <span className={`w-2.5 h-2.5 rounded-full ${dotColorClass} shrink-0`} />
                  </div>

                  {isUnread && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      جديد
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
