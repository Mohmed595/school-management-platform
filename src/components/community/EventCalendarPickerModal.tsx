import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  X,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';
import { EventData, CommunityMessage } from '../../types/community';
import { CalendarTask } from '../../types/admin';
import { getCalendarTasksBySchool, saveCalendarTask } from '../../lib/calendarStorage';
import { getCommunityMessages, getAllGroups, toggleEventCalendar } from '../../lib/communityStorage';
import { getStoredSession } from '../../lib/storage';

interface EventCalendarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string;
  userId: string;
  userRole?: string;
  message: CommunityMessage | null;
  onSuccess: (addedDateStr: string) => void;
}

const MONTH_NAMES_AR = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

const DAY_NAMES_AR = [
  'السبت',
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
];

export function EventCalendarPickerModal({
  isOpen,
  onClose,
  schoolId,
  userId,
  userRole,
  message,
  onSuccess,
}: EventCalendarPickerModalProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([]);
  const [submittedEvents, setSubmittedEvents] = useState<Array<{ title: string; dateStr: string; time?: string }>>([]);
  
  // Pending selected cell for "Are you sure?" popup
  const [pendingDateStr, setPendingDateStr] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Check role authorization
  const currentSession = getStoredSession();
  const effectiveRole = userRole || currentSession?.userRole;
  const isAuthorized = effectiveRole === 'owner' || effectiveRole === 'admin' || effectiveRole === 'school_admin';

  useEffect(() => {
    if (isOpen && schoolId) {
      loadAllEventsAndTasks();
      setPendingDateStr(null);
      setShowConfirmDialog(false);
      setPermissionError(null);
    }
  }, [isOpen, schoolId]);

  const loadAllEventsAndTasks = () => {
    // 1. Fetch calendar tasks from storage
    const tasks = getCalendarTasksBySchool(schoolId);
    setCalendarTasks(tasks);

    // 2. Fetch all community event messages for this school
    const groups = getAllGroups(schoolId);
    const eventsList: Array<{ title: string; dateStr: string; time?: string }> = [];

    groups.forEach((g) => {
      const msgs = getCommunityMessages(schoolId, g.id);
      msgs.forEach((m) => {
        if (m.type === 'event' && m.event && !m.isDeleted) {
          eventsList.push({
            title: m.event.title,
            dateStr: m.event.date,
            time: m.event.time,
          });
        }
      });
    });

    setSubmittedEvents(eventsList);
  };

  if (!isOpen || !message || !message.event) return null;

  // Refuse to operate for unauthorized roles
  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl border border-slate-200 dir-rtl">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">غير مصرح بالعملية</h3>
          <p className="text-sm text-slate-600">
            عذراً، إضافة المهام إلى التقويم المدرسي الرسمي مخصصة لمدير المدرسة والمالك فقط.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  const eventData = message.event;
  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleJumpToToday = () => {
    setCurrentDate(new Date());
  };

  // Month grid calculation
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayJs = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday...
  const saturdayStartOffset = (firstDayJs + 1) % 7;
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;

  // Helper to format date string
  const getDateStrForDay = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Get all tasks & submitted events for a specific day string
  const getItemsForDay = (dateStr: string) => {
    const tasksForDay = calendarTasks.filter((t) => t.task_date === dateStr);
    const submittedForDay = submittedEvents.filter((e) => e.dateStr === dateStr);
    return { tasksForDay, submittedForDay };
  };

  // Handle cell click -> prompt confirmation
  const handleCellClick = (day: number) => {
    const dateStr = getDateStrForDay(day);
    setPendingDateStr(dateStr);
    setShowConfirmDialog(true);
  };

  // Confirm addition
  const handleConfirmSubmit = async () => {
    if (!pendingDateStr || !message || !eventData || isSubmitting) return;

    setIsSubmitting(true);
    setPermissionError(null);

    const newTask: CalendarTask = {
      id: `event-task-${Date.now()}`,
      school_id: schoolId,
      title: `[فعالية مدرسية] ${eventData.title}${eventData.time ? ` - الساعة ${eventData.time}` : ''}${
        eventData.location ? ` (${eventData.location})` : ''
      }`,
      priority: 'high',
      status: 'pending',
      task_date: pendingDateStr,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      // 1. Save to backend PostgreSQL first (throws if 403 or error)
      await saveCalendarTask(newTask);

      // 2. Mark as added / toggle attendee in community storage if needed
      toggleEventCalendar(schoolId, message.id, userId);

      // 3. Trigger success callback
      onSuccess(pendingDateStr);

      setShowConfirmDialog(false);
      onClose();
    } catch (err: any) {
      console.error('[EventCalendarPickerModal] Save failed:', err);
      setPermissionError(err?.message || 'فشل حفظ المهمة في التقويم المدرسي. يرجى التحقق من الصلاحيات.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-[95%] sm:w-full max-w-xl my-auto overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-3.5 sm:p-4 px-4 sm:px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                تحديد تاريخ الفعالية بالتقويم
              </h3>
              <p className="text-[11px] sm:text-xs text-emerald-100 font-medium">
                اختر اليوم المناسب لإدراج المناسبة في جدولك وحفظها
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition-all cursor-pointer shrink-0"
            title="إغلاق"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Event Preview Info Banner */}
        <div className="bg-emerald-50/80 border-b border-emerald-100 p-3 px-5 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-black text-emerald-950">
              <span className="text-emerald-700 font-bold">الفعالية:</span>
              <span>{eventData.title}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600">
              {eventData.time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  {eventData.time}
                </span>
              )}
              {eventData.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {eventData.location}
                </span>
              )}
            </div>
          </div>
          <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2.5 py-1 rounded-lg shrink-0">
            انقر على أي يوم بالتقويم للتسجيل
          </span>
        </div>

        {/* Calendar Body Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* Calendar Month Navigation Header */}
          <div className="flex items-center justify-between bg-slate-50 p-2 px-3 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white text-slate-700 rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer"
                title="الشهر السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white text-slate-700 rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer"
                title="الشهر التالي"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h4 className="font-black text-sm text-slate-900 mr-1">
                {MONTH_NAMES_AR[month]} {year}
              </h4>
            </div>

            <button
              onClick={handleJumpToToday}
              className="text-xs font-bold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200/80 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              اليوم
            </button>
          </div>

          {/* Calendar Grid Container */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            {/* Weekdays Header */}
            <div className="grid grid-cols-7 bg-slate-100/80 border-b border-slate-200 text-center py-2 text-xs font-black text-slate-700">
              {DAY_NAMES_AR.map((dayName) => (
                <div key={dayName} className="py-0.5">
                  {dayName}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 text-right dir-rtl">
              {/* Blank Offset Cells */}
              {Array.from({ length: saturdayStartOffset }).map((_, idx) => (
                <div key={`blank-${idx}`} className="bg-slate-50/50 min-h-[55px] p-1" />
              ))}

              {/* Day Cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateStr = getDateStrForDay(dayNum);
                const isToday = dateStr === todayStr;
                const { tasksForDay, submittedForDay } = getItemsForDay(dateStr);
                const totalEventsCount = tasksForDay.length + submittedForDay.length;

                return (
                  <button
                    key={`day-${dayNum}`}
                    onClick={() => handleCellClick(dayNum)}
                    className={`min-h-[60px] p-1.5 flex flex-col justify-between transition-all cursor-pointer hover:bg-emerald-50/60 relative group text-right ${
                      isToday ? 'bg-emerald-50/40 ring-2 ring-emerald-500 ring-inset font-bold' : 'bg-white'
                    }`}
                  >
                    {/* Date Number Badge */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-black rounded-lg px-1.5 py-0.5 ${
                          isToday
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'text-slate-800 group-hover:text-emerald-700'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {isToday && <span className="text-[9px] font-bold text-emerald-600">اليوم</span>}
                    </div>

                    {/* Existing Submitted Events / Tasks Indicators */}
                    <div className="space-y-0.5 mt-1 overflow-hidden w-full">
                      {tasksForDay.slice(0, 2).map((t) => (
                        <div
                          key={t.id}
                          className="text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-200/80 rounded px-1 truncate leading-tight"
                          title={t.title}
                        >
                          📌 {t.title}
                        </div>
                      ))}
                      {submittedForDay.slice(0, 2).map((e, eIdx) => (
                        <div
                          key={`sub-${eIdx}`}
                          className="text-[9px] font-bold bg-blue-100 text-blue-900 border border-blue-200/80 rounded px-1 truncate leading-tight"
                          title={e.title}
                        >
                          🗓️ {e.title}
                        </div>
                      ))}

                      {totalEventsCount > 2 && (
                        <div className="text-[8px] font-bold text-slate-500 text-center">
                          +{totalEventsCount - 2} المزيد
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-3 px-5 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-3 text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> مهام بالجدول
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" /> فعاليات مدرجة
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <X className="w-4 h-4 text-slate-600" />
            <span>إغلاق</span>
          </button>
        </div>
      </div>

      {/* Confirmation Popup Modal ("Are you sure?") */}
      {showConfirmDialog && pendingDateStr && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 max-w-sm w-full space-y-4 text-center animate-in zoom-in-95 duration-150 dir-rtl">
            
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-slate-900">
                تأكيد إضافة المناسبة للتقويم
              </h4>
              <p className="text-xs font-semibold text-slate-600">
                هل أنت تأكد من إضافة هذه الفعالية إلى هذا التاريخ المحدد؟
              </p>
            </div>

            {/* Event & Target Date Info Box */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-right space-y-2 text-xs">
              <div className="flex items-start justify-between">
                <span className="text-slate-500 font-bold">اسم الفعالية:</span>
                <span className="font-black text-emerald-800">{eventData.title}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                <span className="text-slate-500 font-bold">التاريخ المختار:</span>
                <span className="font-black text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded-md">
                  {pendingDateStr}
                </span>
              </div>
              {eventData.time && (
                <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                  <span className="text-slate-500 font-bold">الوقت المحدد:</span>
                  <span className="font-bold text-slate-800">{eventData.time}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleConfirmSubmit}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                نعم، إقرار وإضافة
              </button>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
