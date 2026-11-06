import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  X,
  Edit2,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { CalendarTask, CalendarPriority, CalendarStatus } from '../../../types/admin';
import {
  getCalendarTasksBySchool,
  fetchAndSyncCalendarTasks,
  saveCalendarTask,
  deleteCalendarTask,
  toggleCalendarTaskStatus,
} from '../../../lib/calendarStorage';

interface AdminCalendarViewProps {
  schoolId: string;
  onToast?: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
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

export function AdminCalendarView({ schoolId, onToast }: AdminCalendarViewProps) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Day for Modal
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for creating / editing task
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<CalendarPriority>('medium');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load tasks authoritatively from PostgreSQL with local fallback cache
  const loadTasks = async () => {
    if (!schoolId) return;
    setIsLoading(true);
    setError(null);
    try {
      const serverTasks = await fetchAndSyncCalendarTasks(schoolId);
      setTasks(serverTasks);
    } catch (err: any) {
      // Read local cache as non-authoritative fallback for UI continuity
      const cached = getCalendarTasksBySchool(schoolId);
      setTasks(cached);
      setError(err?.message || 'تعذر جلب مهام التقويم من الخادم مباشرة. تأكد من اتصالك بالإنترنت وصلاحيات الحساب.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();

    const handleTasksChanged = () => {
      const list = getCalendarTasksBySchool(schoolId);
      setTasks(list);
    };
    window.addEventListener('calendar_tasks_changed', handleTasksChanged);
    window.addEventListener('storage', handleTasksChanged);

    return () => {
      window.removeEventListener('calendar_tasks_changed', handleTasksChanged);
      window.removeEventListener('storage', handleTasksChanged);
    };
  }, [schoolId]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleJumpToToday = () => {
    setCurrentDate(new Date());
  };

  // Get days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Get index of 1st day of month starting on Saturday (Saturday = 0)
  const firstDayJs = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const saturdayStartOffset = (firstDayJs + 1) % 7;

  // Month string format YYYY-MM
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Filter tasks for current month
  const currentMonthTasks = tasks.filter((t) => t.task_date.startsWith(monthStr));

  // Statistics for Quick Summary Panel
  const totalTasksCount = currentMonthTasks.length;
  const highPriorityCount = currentMonthTasks.filter((t) => t.priority === 'high').length;
  const completedTasksCount = currentMonthTasks.filter((t) => t.status === 'completed').length;

  // Format today string YYYY-MM-DD
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;

  // Open modal for a specific day date string
  const handleOpenDayModal = (dayNumber: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    setSelectedDateStr(dateStr);
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskPriority('medium');
    setIsModalOpen(true);
  };

  // Save new task or update existing
  const handleSaveTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedDateStr || isSaving) return;

    setIsSaving(true);
    try {
      if (editingTaskId) {
        const existing = tasks.find((t) => t.id === editingTaskId);
        if (existing) {
          await saveCalendarTask({
            ...existing,
            title: taskTitle.trim(),
            priority: taskPriority,
          });
          if (onToast) onToast('تم تحديث المهمة بنجاح', undefined, 'success');
        }
      } else {
        const newTask: CalendarTask = {
          id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          school_id: schoolId,
          title: taskTitle.trim(),
          priority: taskPriority,
          status: 'pending',
          task_date: selectedDateStr,
          created_by: 'إدارة المدرسة',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await saveCalendarTask(newTask);
        if (onToast) onToast('تمت إضافة المهمة للتقويم بنجاح', undefined, 'success');
      }

      setEditingTaskId(null);
      setTaskTitle('');
      setTaskPriority('medium');
      loadTasks();
    } catch (err: any) {
      if (onToast) onToast(err?.message || 'فشل حفظ المهمة في قاعدة البيانات', undefined, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditTask = (task: CalendarTask) => {
    setEditingTaskId(task.id);
    setTaskTitle(task.title);
    setTaskPriority(task.priority);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskPriority('medium');
  };

  const handleDeleteTaskClick = async (taskId: string) => {
    try {
      await deleteCalendarTask(taskId, schoolId);
      if (onToast) onToast('تم حذف المهمة بنجاح', undefined, 'info');
      loadTasks();
    } catch (err: any) {
      if (onToast) onToast(err?.message || 'فشل حذف المهمة من قاعدة البيانات', undefined, 'error');
    }
  };

  const handleToggleTaskStatusClick = async (taskId: string) => {
    try {
      await toggleCalendarTaskStatus(taskId, schoolId);
      loadTasks();
    } catch (err: any) {
      if (onToast) onToast(err?.message || 'فشل تغيير حالة المهمة', undefined, 'error');
    }
  };

  // Helper for priority display badge
  const getPriorityBadge = (priority: CalendarPriority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-200 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
            عالية 🔴
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            متوسطة 🟡
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            منخفضة 🟢
          </span>
        );
    }
  };

  // Format date display for modal header e.g. "15 سبتمبر 2026"
  const formatSelectedDateArabic = (dateStr: string | null) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const mIdx = parseInt(m, 10) - 1;
    return `${parseInt(d, 10)} ${MONTH_NAMES_AR[mIdx]} ${y}`;
  };

  const prevMonthName = MONTH_NAMES_AR[(month - 1 + 12) % 12];
  const prevMonthYear = month === 0 ? year - 1 : year;
  const nextMonthName = MONTH_NAMES_AR[(month + 1) % 12];
  const nextMonthYear = month === 11 ? year + 1 : year;

  // Selected Day's tasks for modal
  const selectedDayTasks = selectedDateStr
    ? tasks.filter((t) => t.task_date === selectedDateStr)
    : [];

  return (
    <div className="space-y-6 dir-rtl">
      {/* Top Header Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">📅 التقويم المدرسي</h1>
            <p className="text-xs text-slate-500 font-medium">مخطط شهري مخصص لإدارة المدرسة لمتابعة وتنظيم المهام والفعاليات</p>
          </div>
        </div>

        {/* Right side controls (Navigation + Today Button) */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          {/* Today Button */}
          <button
            onClick={handleJumpToToday}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
            title="الانتقال إلى تاريخ اليوم"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
            <span>اليوم</span>
          </button>

          {/* Month Navigation */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white text-slate-700 hover:text-blue-600 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
              title={`الشهر السابق: ${prevMonthName}`}
            >
              <ChevronRight className="w-4 h-4" />
              <span className="hidden md:inline text-[11px]">{prevMonthName}</span>
            </button>

            <span className="font-extrabold text-xs text-slate-900 px-3 py-1 bg-white rounded-lg border border-slate-200/60 shadow-2xs min-w-[120px] text-center">
              {MONTH_NAMES_AR[month]} {year}
            </span>

            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white text-slate-700 hover:text-blue-600 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
              title={`الشهر التالي: ${nextMonthName}`}
            >
              <span className="hidden md:inline text-[11px]">{nextMonthName}</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Layout (Calendar + Quick Summary Panel on Desktop) */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar Grid (Main Section) */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs overflow-hidden">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-2">
            {DAY_NAMES_AR.map((dayName, idx) => (
              <div
                key={dayName}
                className={`py-2 text-xs font-black rounded-lg ${
                  idx === 0 || idx === 6
                    ? 'bg-blue-50/60 text-blue-900'
                    : 'bg-slate-50 text-slate-700'
                }`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Days Cells Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 auto-rows-fr">
            {/* Saturday Start Offset Empty Cells */}
            {Array.from({ length: saturdayStartOffset }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-[90px] sm:min-h-[110px] bg-slate-50/40 border border-dashed border-slate-100 rounded-xl p-1.5 opacity-40 select-none"
              />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                dayNum
              ).padStart(2, '0')}`;
              const isTodayCell = dateStr === todayStr;

              // Filter tasks for this day
              const dayTasks = tasks.filter((t) => t.task_date === dateStr);
              const pendingDayTasks = dayTasks.filter((t) => t.status === 'pending');
              const completedDayTasks = dayTasks.filter((t) => t.status === 'completed');

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => handleOpenDayModal(dayNum)}
                  className={`min-h-[95px] sm:min-h-[115px] border rounded-xl p-1.5 sm:p-2 transition-all cursor-pointer flex flex-col justify-between group hover:border-blue-400 hover:shadow-md ${
                    isTodayCell
                      ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-400/30 shadow-xs'
                      : dayTasks.length > 0
                      ? 'bg-white border-slate-200 hover:bg-slate-50/50'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  {/* Cell Header (Day Number + Add button on hover) */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-transform ${
                        isTodayCell
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-800 group-hover:bg-slate-200/70'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Quick Add indicator on hover */}
                    <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 transition-opacity flex items-center gap-0.5">
                      <Plus className="w-3 h-3" />
                      إضافة
                    </span>
                  </div>

                  {/* Tasks List inside cell */}
                  <div className="my-1 space-y-1 overflow-hidden flex-1 flex flex-col justify-start">
                    {dayTasks.slice(0, 2).map((t) => {
                      const isCompleted = t.status === 'completed';
                      return (
                        <div
                          key={t.id}
                          className={`p-1 rounded text-[10px] sm:text-[11px] font-medium flex items-center gap-1 truncate transition-colors border ${
                            isCompleted
                              ? 'bg-slate-100/80 border-slate-200 text-slate-400 line-through opacity-75'
                              : t.priority === 'high'
                              ? 'bg-red-50 border-red-200/80 text-red-900 font-bold'
                              : t.priority === 'medium'
                              ? 'bg-amber-50 border-amber-200/80 text-amber-900 font-bold'
                              : 'bg-emerald-50 border-emerald-200/80 text-emerald-900 font-bold'
                          }`}
                        >
                          {/* Priority dot / icon */}
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isCompleted
                                ? 'bg-slate-400'
                                : t.priority === 'high'
                                ? 'bg-red-600'
                                : t.priority === 'medium'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <span className="truncate">{t.title}</span>
                        </div>
                      );
                    })}

                    {/* Overflow tasks count badge */}
                    {dayTasks.length > 2 && (
                      <div className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 text-center mt-auto">
                        +{dayTasks.length - 2} مهام أُخرى
                      </div>
                    )}
                  </div>

                  {/* Cell Footer Summary Badge */}
                  {dayTasks.length > 0 && (
                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-500 font-bold">
                      <span className="flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        {completedDayTasks.length}/{dayTasks.length}
                      </span>
                      {pendingDayTasks.length > 0 && (
                        <span className="text-amber-700">
                          {pendingDayTasks.length} متبقية
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Summary Panel (Desktop Only - Hidden on Phone) */}
        <div className="hidden lg:block w-72 xl:w-80 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>مهام هذا الشهر</span>
              </h2>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {MONTH_NAMES_AR[month]} {year}
              </span>
            </div>

            {/* Counters Display Grid */}
            <div className="grid grid-cols-1 gap-2.5">
              {/* Total Tasks */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">📋 عدد المهام</span>
                    <span className="text-[10px] text-slate-500">إجمالي الشهر الحالي</span>
                  </div>
                </div>
                <span className="text-lg font-black text-slate-900 font-mono">
                  {totalTasksCount}
                </span>
              </div>

              {/* High Priority Tasks */}
              <div className="p-3 bg-red-50/80 rounded-xl border border-red-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-red-100 text-red-700 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-red-900 block">🔴 عالية الأولوية</span>
                    <span className="text-[10px] text-red-700">تستوجب الإنجاز</span>
                  </div>
                </div>
                <span className="text-lg font-black text-red-900 font-mono">
                  {highPriorityCount}
                </span>
              </div>

              {/* Completed Tasks */}
              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-900 block">✅ مكتملة</span>
                    <span className="text-[10px] text-emerald-700">تم إنجازها بنجاح</span>
                  </div>
                </div>
                <span className="text-lg font-black text-emerald-900 font-mono">
                  {completedTasksCount}
                </span>
              </div>
            </div>

            {/* Upcoming Pending Tasks List */}
            <div className="pt-2">
              <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                <span>المهام القادمة والمستحقة</span>
                <span className="text-[10px] text-blue-600 font-bold">
                  {currentMonthTasks.filter((t) => t.status === 'pending').length} متبقية
                </span>
              </h3>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                {currentMonthTasks.filter((t) => t.status === 'pending').length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    لا توجد مهام معلقة لهذا الشهر 🎉
                  </div>
                ) : (
                  currentMonthTasks
                    .filter((t) => t.status === 'pending')
                    .slice(0, 5)
                    .map((t) => {
                      const dayVal = t.task_date.split('-')[2];
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedDateStr(t.task_date);
                            setIsModalOpen(true);
                          }}
                          className="p-2.5 bg-slate-50 hover:bg-blue-50/60 border border-slate-200/70 hover:border-blue-200 rounded-xl transition-all cursor-pointer space-y-1 group"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-700">
                              {t.title}
                            </span>
                            {getPriorityBadge(t.priority)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium flex items-center justify-between">
                            <span>التاريخ: {parseInt(dayVal, 10)} {MONTH_NAMES_AR[month]}</span>
                            <span className="text-blue-600 font-bold group-hover:underline">عرض</span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TASK MODAL (Add / Edit / View Tasks for Selected Date) */}
      {isModalOpen && selectedDateStr && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden dir-rtl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 rounded-xl text-white">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">إضافة مهمة</h3>
                  <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                    مهام يوم {formatSelectedDateArabic(selectedDateStr)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Existing Tasks Section */}
              {selectedDayTasks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>مهام اليوم المجدولة ({selectedDayTasks.length})</span>
                    <span className="text-[10px] text-slate-400">انقر للتحديد أو التعديل</span>
                  </h4>

                  <div className="space-y-2 divide-y divide-slate-100 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                    {selectedDayTasks.map((t) => {
                      const isCompleted = t.status === 'completed';
                      return (
                        <div
                          key={t.id}
                          className="pt-2 first:pt-0 flex items-start justify-between gap-3 group"
                        >
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            {/* Toggle Checkbox */}
                            <button
                              type="button"
                              onClick={() => handleToggleTaskStatusClick(t.id)}
                              className="mt-0.5 text-slate-400 hover:text-blue-600 cursor-pointer shrink-0 transition-colors"
                              title={isCompleted ? 'علامة كـ غير مكتمل' : 'علامة كـ مكتمل'}
                            >
                              {isCompleted ? (
                                <CheckSquare className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-400 hover:text-blue-600" />
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-xs font-bold leading-relaxed break-words ${
                                  isCompleted
                                    ? 'line-through text-slate-400 opacity-70'
                                    : 'text-slate-900'
                                }`}
                              >
                                {t.title}
                              </p>

                              <div className="flex items-center gap-2 mt-1">
                                {getPriorityBadge(t.priority)}
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {isCompleted ? '☑ تم' : '☐ لم يتم'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons (Edit & Delete) */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditTask(t)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                              title="تعديل المهمة"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTaskClick(t.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                              title="حذف المهمة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add / Edit Task Form */}
              <form onSubmit={handleSaveTaskSubmit} className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span>{editingTaskId ? 'تعديل بيانات المهمة' : 'إضافة مهمة جديدة'}</span>
                  </h4>
                  {editingTaskId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      إلغاء التعديل
                    </button>
                  )}
                </div>

                {/* Field 📝 المهمة */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    📝 المهمة
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="أدخل عنوان أو تفاصيل المهمة المطلوبة..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all resize-none"
                  />
                </div>

                {/* Field ⚡ الأولوية */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ⚡ الأولوية
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as CalendarPriority)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="low">منخفضة 🟢</option>
                    <option value="medium">متوسطة 🟡</option>
                    <option value="high">عالية 🔴</option>
                  </select>
                </div>

                {/* Modal Action Buttons (إلغاء, حفظ) */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
                  >
                    <span>{editingTaskId ? 'حفظ التعديلات' : 'حفظ'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
