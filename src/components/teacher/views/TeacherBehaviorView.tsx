import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Users,
  Search,
  History,
  Calendar,
  Sparkles,
  Clock,
  Zap,
  X,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Check,
  Minus,
  MessageSquare,
  UserCheck,
  ChevronUp,
} from 'lucide-react';
import { TeacherPortalData } from '../../../types/teacher';
import { BehaviorRecord, BehaviorType, Student } from '../../../types/admin';
import { fetchStudentPointsApi } from '../../../lib/schoolApi';

interface TeacherBehaviorViewProps {
  data: TeacherPortalData;
  onSaveBehavior: (record: BehaviorRecord) => void;
  addToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

const POSITIVE_CATEGORIES = [
  { title: 'مشاركة متميزة وتفاعل إيجابي في الحصة', points: 5 },
  { title: 'التزام كامل بالهدوء والنظام والانضباط', points: 5 },
  { title: 'إتقان الواجبات المدرسية والأنشطة بدقة', points: 8 },
  { title: 'مساعدة الزملاء وروح التعاون البناء', points: 5 },
  { title: 'تفوق أكاديمي وتحصيل علمي استثنائي', points: 10 },
  { title: 'مبادرة فردية وأفكار إبداعية في المادة', points: 5 },
];

const NEGATIVE_CATEGORIES = [
  { title: 'عدم إحضار أدوات المادة أو الكشكول', points: -3 },
  { title: 'إحداث إزعاج أو التحدث أثناء الشرح', points: -5 },
  { title: 'إهمال أداء الواجب المدرسي المطلوب', points: -5 },
  { title: 'التأخر عن موعد الحصة الدراسية', points: -3 },
  { title: 'سلوك غير انضباطي تجاه الزملاء أو المعلم', points: -10 },
  { title: 'عدم الالتزام بتعليمات الصف وقواعد الحصة', points: -5 },
];

const QUICK_POINTS_OPTIONS = [1, 2, 3, 5, 8, 10];
const TEACHER_DAILY_LIMIT = 25;

/**
 * Calculates start timestamp of current 6 AM daily cycle in Egypt time (Africa/Cairo).
 * Cycle resets daily at 6:00 AM Egypt time.
 */
function getCurrent6AMCycleStart(now = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const p: Record<string, number> = {};
    for (const part of parts) {
      if (part.type !== 'literal') {
        p[part.type] = parseInt(part.value, 10);
      }
    }

    let year = p.year;
    let month = p.month;
    let day = p.day;
    let hour = p.hour === 24 ? 0 : p.hour;

    // If current hour in Egypt is before 6:00 AM, cycle started yesterday at 6:00 AM
    if (hour < 6) {
      const prevDate = new Date(Date.UTC(year, month - 1, day - 1));
      year = prevDate.getUTCFullYear();
      month = prevDate.getUTCMonth() + 1;
      day = prevDate.getUTCDate();
    }

    const tempUtcDate = new Date(Date.UTC(year, month - 1, day, 6, 0, 0));
    const tzParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Cairo',
      timeZoneName: 'shortOffset',
    }).formatToParts(tempUtcDate);

    const offsetPart = tzParts.find((pt) => pt.type === 'timeZoneName')?.value || 'GMT+3';
    let offsetHours = 3;
    const match = offsetPart.match(/GMT([+-]\d+)/);
    if (match) {
      offsetHours = parseInt(match[1], 10);
    }

    return Date.UTC(year, month - 1, day, 6 - offsetHours, 0, 0);
  } catch {
    const start = new Date(now);
    if (start.getHours() < 6) {
      start.setDate(start.getDate() - 1);
    }
    start.setHours(6, 0, 0, 0);
    return start.getTime();
  }
}

function getCurrent6AMCycleEnd(now = new Date()): number {
  return getCurrent6AMCycleStart(now) + 24 * 60 * 60 * 1000;
}

function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
    .trim();
}

export function TeacherBehaviorView({ data, onSaveBehavior, addToast }: TeacherBehaviorViewProps) {
  const { schoolId, assignedStudents, assignedClasses, recentBehavior, teacher } = data;

  // ----------------------------------------------------
  // 1. Quota & Cycle Calculation
  // ----------------------------------------------------
  const cycleStartMs = getCurrent6AMCycleStart();
  const cycleEndMs = getCurrent6AMCycleEnd();

  const teacherRecordsInCycle = useMemo(() => {
    return recentBehavior.filter((b) => {
      const isThisTeacher =
        b.reportedBy === teacher.name ||
        b.reportedBy === teacher.id ||
        (teacher.username && b.reportedBy === teacher.username);

      if (!isThisTeacher) return false;

      if (b.id) {
        const match = b.id.match(/(\d{12,13})/);
        if (match) {
          const ts = parseInt(match[1], 10);
          if (!isNaN(ts)) {
            return ts >= cycleStartMs && ts < cycleEndMs;
          }
        }
      }

      if (b.date) {
        const startDateStr = new Date(cycleStartMs).toISOString().split('T')[0];
        const endDateStr = new Date(cycleEndMs).toISOString().split('T')[0];
        return b.date === startDateStr || b.date === endDateStr;
      }

      return true;
    });
  }, [recentBehavior, teacher, cycleStartMs, cycleEndMs]);

  const usedDailyPoints = useMemo(() => {
    return teacherRecordsInCycle.reduce((acc, curr) => acc + Math.abs(curr.points || 0), 0);
  }, [teacherRecordsInCycle]);

  const remainingDailyPoints = Math.max(0, TEACHER_DAILY_LIMIT - usedDailyPoints);
  const dailyUsagePercentage = Math.min(100, Math.round((usedDailyPoints / TEACHER_DAILY_LIMIT) * 100));

  // ----------------------------------------------------
  // 2. Main View Log Filter (Search bar only)
  // ----------------------------------------------------
  const [logSearch, setLogSearch] = useState('');

  const getStudentDisplayName = (rec: BehaviorRecord): string => {
    if (rec.studentName && rec.studentName.trim() && !rec.studentName.match(/^\d{8,}/)) {
      return rec.studentName.trim();
    }
    const found = assignedStudents.find(
      (s) => s.id === rec.studentId || (rec.studentName && s.id === rec.studentName)
    );
    if (found?.name) return found.name;
    return rec.studentName && !rec.studentName.match(/^\d{8,}/) ? rec.studentName : 'طالب';
  };

  const getClassDisplayName = (rec: BehaviorRecord): string => {
    // If classId is clean Arabic class name (e.g. "1/1 ابتدائي")
    if (rec.classId && !rec.classId.includes('-') && rec.classId.length < 20) {
      return rec.classId;
    }
    // Check assignedClasses
    const cls = assignedClasses.find((c) => c.id === rec.classId || c.name === rec.classId);
    if (cls?.name) return cls.name;

    // Check student
    const st = assignedStudents.find((s) => s.id === rec.studentId);
    if (st?.className) return st.className;

    return 'الفصل';
  };

  const filteredLogs = useMemo(() => {
    return recentBehavior
      .filter((rec) => {
        if (logSearch.trim()) {
          const q = normalizeArabic(logSearch);
          const studentResolved = normalizeArabic(getStudentDisplayName(rec));
          const classResolved = normalizeArabic(getClassDisplayName(rec));
          const titleMatch = normalizeArabic(rec.title || '').includes(q);
          const notesMatch = normalizeArabic(rec.notes || '').includes(q);
          if (!studentResolved.includes(q) && !classResolved.includes(q) && !titleMatch && !notesMatch) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = a.id ? parseInt(a.id.match(/\d{10,14}/)?.[0] || '0', 10) : 0;
        const timeB = b.id ? parseInt(b.id.match(/\d{10,14}/)?.[0] || '0', 10) : 0;
        if (timeA && timeB && timeA !== timeB) return timeB - timeA;
        return (b.date || '').localeCompare(a.date || '');
      });
  }, [recentBehavior, logSearch, assignedStudents, assignedClasses]);

  // ----------------------------------------------------
  // 3. Wizard State (Mobile-First)
  // ----------------------------------------------------
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);

  // Wizard Step 1: Student & Reason
  const [studentSearchInput, setStudentSearchInput] = useState('');
  const [selectedStudentClassFilter, setSelectedStudentClassFilter] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isStudentPickerExpanded, setIsStudentPickerExpanded] = useState(false);

  const [behaviorType, setBehaviorType] = useState<BehaviorType>('إيجابي');
  const [customReason, setCustomReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Wizard Step 2: Points UX
  const [pointsMagnitude, setPointsMagnitude] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Student Live Points
  const [studentPoints, setStudentPoints] = useState<{
    totalPoints: number;
    behaviorPoints: number;
    loading: boolean;
  }>({
    totalPoints: 0,
    behaviorPoints: 0,
    loading: false,
  });

  // Filter students for Step 1 picker
  const filteredStudents = useMemo(() => {
    const q = normalizeArabic(studentSearchInput);
    return assignedStudents.filter((st) => {
      const matchesSearch =
        !q ||
        normalizeArabic(st.name).includes(q) ||
        normalizeArabic(st.className).includes(q) ||
        (st.studentCode && st.studentCode.includes(studentSearchInput.trim())) ||
        st.id.includes(studentSearchInput.trim());

      const matchesClass =
        selectedStudentClassFilter === 'all' ||
        st.className === selectedStudentClassFilter ||
        st.classId === selectedStudentClassFilter;

      return matchesSearch && matchesClass;
    });
  }, [assignedStudents, studentSearchInput, selectedStudentClassFilter]);

  const selectedStudent = useMemo(() => {
    return assignedStudents.find((s) => s.id === selectedStudentId);
  }, [assignedStudents, selectedStudentId]);

  // Load student live points whenever selected
  useEffect(() => {
    if (!selectedStudentId || !schoolId) return;

    let isMounted = true;
    setStudentPoints((prev) => ({ ...prev, loading: true }));

    fetchStudentPointsApi(schoolId, selectedStudentId)
      .then((res) => {
        if (!isMounted) return;
        setStudentPoints({
          totalPoints: res.totalPoints || 0,
          behaviorPoints: res.behaviorPoints || res.breakdown?.behavior?.points || 0,
          loading: false,
        });
      })
      .catch(() => {
        if (!isMounted) return;
        setStudentPoints({
          totalPoints: 50,
          behaviorPoints: 0,
          loading: false,
        });
      });

    return () => {
      isMounted = false;
    };
  }, [selectedStudentId, schoolId]);

  // Open Wizard
  const handleOpenWizard = () => {
    if (remainingDailyPoints <= 0) {
      addToast(
        'تم الوصول للحد اليومي (25 نقطة)',
        'لقد استنفدت كامل رصيد النقاط اليومي المخصص لك. يتجدد الرصيد تلقائياً كل صباح في تمام الساعة 6:00 ص.',
        'error'
      );
      return;
    }

    setWizardStep(1);
    setStudentSearchInput('');
    setSelectedStudentClassFilter('all');
    
    // Choose first student if available, but keep picker collapsed if student is selected
    const initialStudent = assignedStudents[0]?.id || '';
    setSelectedStudentId(initialStudent);
    setIsStudentPickerExpanded(!initialStudent);

    setBehaviorType('إيجابي');
    setCustomReason('');
    setNotes('');
    setPointsMagnitude(Math.min(5, Math.max(1, remainingDailyPoints)));
    setIsWizardOpen(true);
  };

  const handleCloseWizard = () => {
    setIsWizardOpen(false);
    setIsStudentPickerExpanded(false);
  };

  // Behavior type change
  const handleTypeChange = (type: BehaviorType) => {
    setBehaviorType(type);
    const defaultPts = Math.min(5, Math.max(1, remainingDailyPoints));
    setPointsMagnitude(defaultPts);
  };

  // Points adjustments
  const maxAllowedForThisNote = Math.min(10, remainingDailyPoints);

  const handlePointChange = (val: number) => {
    const raw = Math.abs(val);
    const clamped = Math.min(maxAllowedForThisNote > 0 ? maxAllowedForThisNote : 1, Math.max(1, raw));
    setPointsMagnitude(clamped);
  };

  const finalSignedPoints = behaviorType === 'إيجابي' ? pointsMagnitude : -pointsMagnitude;
  const projectedTotalPoints = Math.max(0, studentPoints.totalPoints + finalSignedPoints);

  // Wizard Step Validation
  const canProceedToStep2 = Boolean(selectedStudent && customReason.trim().length > 0);

  // Submit Handler
  const handleConfirmSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!selectedStudent) {
      addToast('تنبيه', 'يرجى اختيار الطالب المراد تقييمه', 'error');
      return;
    }

    if (!customReason.trim()) {
      addToast('تنبيه', 'يرجى إدخال سبب الملاحظة السلوكية', 'error');
      return;
    }

    if (remainingDailyPoints <= 0) {
      addToast('تنبيه', 'تم استنفاد كامل الرصيد اليومي المتاح (25 نقطة)', 'error');
      return;
    }

    if (Math.abs(finalSignedPoints) > remainingDailyPoints) {
      addToast(
        'تجاوز الرصيد المتاح',
        `النقاط المحددة (${Math.abs(finalSignedPoints)}) تتجاوز الرصيد المتبقي لديك (${remainingDailyPoints} نقطة).`,
        'error'
      );
      return;
    }

    setIsSubmitting(true);

    const record: BehaviorRecord = {
      id: `beh-${Date.now()}`,
      schoolId,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      classId: selectedStudent.className || selectedStudent.classId,
      type: behaviorType,
      title: customReason.trim(),
      points: finalSignedPoints,
      date: new Date().toISOString().split('T')[0],
      notes: notes.trim(),
      reportedBy: teacher.name,
    };

    try {
      onSaveBehavior(record);
      setIsSubmitting(false);
      setIsWizardOpen(false);

      addToast(
        'تم تسجيل الملاحظة بنجاح',
        `تم تسجيل ${finalSignedPoints > 0 ? `+${finalSignedPoints}` : finalSignedPoints} نقطة للطالب ${selectedStudent.name}. الرصيد المتبقي اليوم: ${remainingDailyPoints - Math.abs(finalSignedPoints)} / 25 نقطة.`,
        'success'
      );
    } catch {
      setIsSubmitting(false);
      addToast('خطأ', 'حدث خطأ أثناء حفظ الملاحظة، يرجى المحاولة مرة أخرى', 'error');
    }
  };

  const currentPresets = behaviorType === 'إيجابي' ? POSITIVE_CATEGORIES : NEGATIVE_CATEGORIES;

  return (
    <div className="space-y-4 sm:space-y-6 dir-rtl font-sans max-w-7xl mx-auto px-1 sm:px-0 pb-12">
      {/* ---------------------------------------------------- */}
      {/* 1. MAIN HEADER: الرصيد (DAILY BALANCE) + ACTION BUTTON */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Teacher and Title Info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <Zap className="w-6 h-6 fill-white/20" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  الرصيد وسجل السلوك
                </h1>
                <span className="text-[11px] font-black bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {teacher.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                رصيد يومي ثابت <strong className="text-slate-800 font-black">25 نقطة</strong> يتجدد 6:00 ص.
              </p>
            </div>
          </div>

          {/* Action Button: تسجيل ملاحظه سلوكيه */}
          <button
            type="button"
            onClick={handleOpenWizard}
            className={`w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-98 ${
              remainingDailyPoints <= 0
                ? 'bg-slate-400 text-white/90 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 shadow-blue-600/25 ring-2 ring-blue-600/20'
            }`}
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>تسجيل ملاحظه سلوكيه</span>
          </button>
        </div>

        {/* Balance Card Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
          {/* Remaining Balance */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/50 border border-slate-200/80 flex items-center justify-between col-span-1">
            <div>
              <span className="text-[11px] font-extrabold text-slate-500 block">الرصيد المتبقي</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span
                  className={`text-xl sm:text-2xl font-black font-sans ${
                    remainingDailyPoints > 10
                      ? 'text-emerald-600'
                      : remainingDailyPoints > 0
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}
                >
                  {remainingDailyPoints}
                </span>
                <span className="text-[11px] font-bold text-slate-400">/ 25</span>
              </div>
            </div>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                remainingDailyPoints > 10
                  ? 'bg-emerald-100 text-emerald-800'
                  : remainingDailyPoints > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {100 - dailyUsagePercentage}%
            </div>
          </div>

          {/* Used Points */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between col-span-1">
            <div>
              <span className="text-[11px] font-extrabold text-slate-500 block">المستهلك اليوم</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-black font-sans text-slate-800">
                  {usedDailyPoints}
                </span>
                <span className="text-[11px] font-bold text-slate-400">نقطة</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
              {teacherRecordsInCycle.length}
            </div>
          </div>

          {/* Reset Schedule Notice */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 items-center gap-2.5 col-span-2 sm:col-span-1 flex">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold text-slate-500 block">دورة التجديد</span>
              <span className="text-xs font-black text-slate-800 block truncate">
                تتجدد يومياً 6:00 ص
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-500">نسبة استهلاك رصيدك اليومي</span>
            <span
              className={`font-sans font-black ${
                dailyUsagePercentage >= 100
                  ? 'text-rose-600'
                  : dailyUsagePercentage > 75
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {dailyUsagePercentage}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/70 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                dailyUsagePercentage >= 100
                  ? 'bg-rose-500'
                  : dailyUsagePercentage > 75
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${dailyUsagePercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. THE LOG: سجل الملاحظات السلوكية المسجلة للطلاب */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-3 sm:p-5 shadow-sm space-y-3">
        {/* Search Bar Only */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            placeholder="بحث باسم الطالب أو سبب الملاحظة..."
            className="w-full pr-10 pl-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:bg-white transition-all shadow-2xs"
          />
          {logSearch && (
            <button
              type="button"
              onClick={() => setLogSearch('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Notices Cards List */}
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2">
            <Star className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-bold">
              {logSearch ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد ملاحظات مسجلة حتى الآن'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 pt-1">
            {filteredLogs.map((item) => {
              const isPositive = item.type === 'إيجابي';
              const displayName = getStudentDisplayName(item);
              const displayClass = getClassDisplayName(item);

              return (
                <div
                  key={item.id}
                  className={`p-3 sm:p-4 rounded-2xl border transition-all shadow-2xs hover:shadow-xs ${
                    isPositive
                      ? 'bg-gradient-to-r from-emerald-50/40 via-white to-white border-emerald-200/80 hover:border-emerald-300'
                      : 'bg-gradient-to-r from-rose-50/40 via-white to-white border-rose-200/80 hover:border-rose-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    {/* Student Avatar + Information */}
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-2xs ${
                          isPositive ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {displayName.charAt(0) || 'ط'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-slate-900 text-xs sm:text-sm">
                            {displayName}
                          </span>
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                            {displayClass}
                          </span>
                        </div>
                        <p
                          className={`text-xs font-black mt-1 leading-snug ${
                            isPositive ? 'text-emerald-950' : 'text-rose-950'
                          }`}
                        >
                          {item.title}
                        </p>
                      </div>
                    </div>

                    {/* Points Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-xl font-black font-sans text-xs border flex items-center gap-1 shrink-0 ${
                        isPositive
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                          : 'bg-rose-100 text-rose-900 border-rose-200'
                      }`}
                    >
                      {isPositive ? (
                        <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      )}
                      <span>{item.points > 0 ? `+${item.points}` : item.points} نقاط</span>
                    </span>
                  </div>

                  {item.notes && (
                    <div className="mt-2 p-2 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] font-semibold text-slate-700 flex items-start gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{item.notes}</span>
                    </div>
                  )}

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span>المسجل: {item.reportedBy || teacher.name}</span>
                    <span className="font-sans">{item.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. MOBILE-PERFECT WIZARD MODAL: تسجيل ملاحظه سلوكيه   */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {isWizardOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseWizard}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            />

            {/* Modal Dialog (Bottom-sheet on phone, centered modal on tablet/desktop) */}
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col max-h-[92vh] sm:max-h-[88vh] z-10 dir-rtl font-sans overflow-hidden"
            >
              {/* Header Bar */}
              <div className="shrink-0 px-4 sm:px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-blue-200" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base leading-tight">
                      تسجيل ملاحظه سلوكيه
                    </h3>
                    <p className="text-[11px] text-blue-100 font-bold">
                      {wizardStep === 1
                        ? 'الخطوة 1 من 2: اختيار الطالب والسبب'
                        : 'الخطوة 2 من 2: تحديد عدد النقاط'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full font-sans">
                    {wizardStep}/2
                  </span>
                  <button
                    type="button"
                    onClick={handleCloseWizard}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="إغلاق"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="shrink-0 h-1.5 bg-slate-100 w-full overflow-hidden">
                <div
                  className={`h-full bg-blue-600 transition-all duration-300 ${
                    wizardStep === 1 ? 'w-1/2' : 'w-full'
                  }`}
                />
              </div>

              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {/* ------------------------------------------- */}
                {/* WIZARD PAGE 1: اختيار الطالب والسبب         */}
                {/* ------------------------------------------- */}
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    {/* SECTION 1: STUDENT SELECTION */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-blue-600" />
                          <span>1. اختيار الطالب المراد تقييمه:</span>
                          <span className="text-rose-500">*</span>
                        </label>

                        {selectedStudent && (
                          <button
                            type="button"
                            onClick={() => setIsStudentPickerExpanded((prev) => !prev)}
                            className="text-[11px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isStudentPickerExpanded ? 'إغلاق البحث' : 'تغيير الطالب'}</span>
                            {isStudentPickerExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Clean Selected Student Card (Compact, Mobile-Friendly) */}
                      {selectedStudent && !isStudentPickerExpanded && (
                        <div
                          onClick={() => setIsStudentPickerExpanded(true)}
                          className="p-3 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/50 border border-blue-200/90 flex items-center justify-between gap-2.5 cursor-pointer hover:border-blue-300 transition-all shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                              {selectedStudent.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs sm:text-sm font-black text-slate-900 truncate block">
                                {selectedStudent.name}
                              </span>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
                                <span>{selectedStudent.className}</span>
                                {selectedStudent.studentCode && (
                                  <>
                                    <span>•</span>
                                    <span className="font-sans text-[10px] text-slate-400">
                                      {selectedStudent.studentCode}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-left shrink-0">
                            <span className="text-[10px] font-extrabold text-slate-500 block">
                              الرصيد الحالي
                            </span>
                            <span className="text-xs font-black font-sans text-blue-900 bg-white px-2 py-0.5 rounded-lg border border-blue-200/70 inline-block">
                              {studentPoints.loading ? '...' : `${studentPoints.totalPoints} نقطة`}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Expandable Search & Dropdown Picker */}
                      {(!selectedStudent || isStudentPickerExpanded) && (
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                          {/* Search Input & Class Filter on Same Row */}
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                autoFocus
                                value={studentSearchInput}
                                onChange={(e) => setStudentSearchInput(e.target.value)}
                                placeholder="ابحث بالاسم أو كود الطالب..."
                                className="w-full pr-9 pl-7 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                              />
                              {studentSearchInput && (
                                <button
                                  type="button"
                                  onClick={() => setStudentSearchInput('')}
                                  className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Class / Grade Dropdown */}
                            <select
                              value={selectedStudentClassFilter}
                              onChange={(e) => setSelectedStudentClassFilter(e.target.value)}
                              className="w-32 px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 cursor-pointer"
                            >
                              <option value="all">كل الصفوف ({assignedStudents.length})</option>
                              {assignedClasses.map((c) => (
                                <option key={c.id || c.name} value={c.name}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Student Results List (Clear, Mobile-Optimized Height) */}
                          <div className="border border-slate-200 rounded-xl bg-white max-h-44 sm:max-h-52 overflow-y-auto divide-y divide-slate-100 shadow-2xs">
                            {filteredStudents.length === 0 ? (
                              <div className="p-4 text-center text-xs text-slate-400 font-bold">
                                لا يوجد طلاب يطابقون البحث ({studentSearchInput})
                              </div>
                            ) : (
                              filteredStudents.map((st) => {
                                const isSelected = st.id === selectedStudentId;
                                return (
                                  <button
                                    key={st.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedStudentId(st.id);
                                      setIsStudentPickerExpanded(false);
                                    }}
                                    className={`w-full text-right p-2.5 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                      isSelected
                                        ? 'bg-blue-50/90 text-blue-950 font-black'
                                        : 'hover:bg-slate-50 text-slate-800 font-bold'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                                          isSelected
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 text-slate-600'
                                        }`}
                                      >
                                        {st.name.charAt(0)}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-xs truncate">{st.name}</div>
                                        <div className="text-[10px] text-slate-400 font-bold">
                                          {st.className} {st.studentCode ? `• ${st.studentCode}` : ''}
                                        </div>
                                      </div>
                                    </div>

                                    {isSelected && (
                                      <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                                      </div>
                                    )}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SECTION 2: BEHAVIOR TYPE (SEGMENTED PILL) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-900 block">
                        2. نوع الملاحظة السلوكية:
                      </label>
                      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
                        <button
                          type="button"
                          onClick={() => handleTypeChange('إيجابي')}
                          className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-black text-xs transition-all cursor-pointer ${
                            behaviorType === 'إيجابي'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Star className="w-4 h-4 fill-emerald-100 text-emerald-100 shrink-0" />
                          <span>سلوك إيجابي (+)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTypeChange('سلبي')}
                          className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-black text-xs transition-all cursor-pointer ${
                            behaviorType === 'سلبي'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>ملاحظة سلبية (-)</span>
                        </button>
                      </div>
                    </div>

                    {/* SECTION 3: REASON INPUT TEXT ONLY */}
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-900 block">
                          3. سبب الملاحظة السلوكية: <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          placeholder="اكتب سبب الملاحظة السلوكية هنا..."
                          className="w-full px-3.5 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-500 transition-all shadow-2xs"
                        />
                      </div>

                      {/* Additional Notes (Compact) */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 block">
                          ملاحظات أو توصيات إضافية (اختياري):
                        </label>
                        <textarea
                          rows={2}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="أي تفاصيل أخرى ترغب في تسجيلها للمتابعة..."
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------- */}
                {/* WIZARD PAGE 2: تحديد عدد النقاط في UX واضح  */}
                {/* ------------------------------------------- */}
                {wizardStep === 2 && (
                  <div className="space-y-4">
                    {/* Summary of Step 1 Choice */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 ${
                            behaviorType === 'إيجابي' ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        >
                          {selectedStudent?.name.charAt(0) || 'ط'}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-black text-slate-900 truncate block">
                            {selectedStudent?.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold block truncate">
                            {selectedStudent?.className} • {customReason}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-black px-2 py-0.5 rounded-lg border shrink-0 ${
                          behaviorType === 'إيجابي'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                            : 'bg-rose-100 text-rose-900 border-rose-200'
                        }`}
                      >
                        {behaviorType === 'إيجابي' ? 'إيجابي' : 'سلبي'}
                      </span>
                    </div>

                    {/* Teacher Quota Notice */}
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs font-bold">
                      <span className="text-blue-900 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        رصيدك المتبقي اليوم:
                      </span>
                      <span className="font-sans font-black text-blue-900">
                        {remainingDailyPoints} / 25 نقطة
                      </span>
                    </div>

                    {/* Prominent Stepper Box */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 text-center space-y-3">
                      <span className="text-xs font-extrabold text-slate-500 block">
                        اختر عدد النقاط الممنوحة
                      </span>

                      {/* Big Stepper Display */}
                      <div className="flex items-center justify-center gap-4 sm:gap-6 py-1">
                        <button
                          type="button"
                          onClick={() => handlePointChange(pointsMagnitude - 1)}
                          disabled={pointsMagnitude <= 1}
                          className="w-12 h-12 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 font-black shadow-xs cursor-pointer active:scale-95 transition-all"
                          aria-label="إنقاص النقاط"
                        >
                          <Minus className="w-5 h-5 stroke-[2.5]" />
                        </button>

                        <div className="min-w-[110px] text-center">
                          <span
                            className={`text-4xl sm:text-5xl font-black font-sans block ${
                              behaviorType === 'إيجابي' ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {finalSignedPoints > 0 ? `+${finalSignedPoints}` : finalSignedPoints}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 block mt-0.5">
                            نقطة سلوكية
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handlePointChange(pointsMagnitude + 1)}
                          disabled={pointsMagnitude >= maxAllowedForThisNote}
                          className="w-12 h-12 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 font-black shadow-xs cursor-pointer active:scale-95 transition-all"
                          aria-label="زيادة النقاط"
                        >
                          <Plus className="w-5 h-5 stroke-[2.5]" />
                        </button>
                      </div>

                      {/* Quick Chips */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block mb-1.5">
                          خيارات سريعة للنقاط:
                        </span>
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {QUICK_POINTS_OPTIONS.map((val) => {
                            const isExceeded = val > maxAllowedForThisNote;
                            const isSelected = pointsMagnitude === val;
                            return (
                              <button
                                key={val}
                                type="button"
                                disabled={isExceeded}
                                onClick={() => handlePointChange(val)}
                                className={`min-w-[42px] py-1.5 px-2.5 rounded-xl font-black text-xs font-sans transition-all cursor-pointer border ${
                                  isExceeded
                                    ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                                    : isSelected
                                    ? behaviorType === 'إيجابي'
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                      : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {behaviorType === 'إيجابي' ? `+${val}` : `-${val}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Student Balance Impact Preview */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-black">
                      <span className="text-slate-600">رصيد الطالب بعد الملاحظة:</span>
                      <div className="flex items-center gap-1.5 font-sans dir-ltr">
                        <span className="text-slate-400">{studentPoints.totalPoints}</span>
                        <span
                          className={
                            finalSignedPoints >= 0
                              ? 'text-emerald-600 font-bold'
                              : 'text-rose-600 font-bold'
                          }
                        >
                          {finalSignedPoints >= 0 ? `+${finalSignedPoints}` : `${finalSignedPoints}`}
                        </span>
                        <span className="text-slate-400">=</span>
                        <span
                          className={`px-2 py-0.5 rounded-md border font-black text-xs ${
                            finalSignedPoints >= 0
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                              : 'bg-rose-100 text-rose-900 border-rose-200'
                          }`}
                        >
                          {projectedTotalPoints} نقطة
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed Footer Bar (Always Visible on Mobile) */}
              <div className="shrink-0 p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2.5">
                {wizardStep === 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCloseWizard}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 font-black text-xs text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      disabled={!canProceedToStep2}
                      onClick={() => setWizardStep(2)}
                      className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                    >
                      <span>التالي: تحديد النقاط</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 font-black text-xs text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>السابق</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleConfirmSubmit}
                      className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-black text-xs text-white flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-98 ${
                        behaviorType === 'إيجابي'
                          ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                          : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isSubmitting
                          ? 'جاري الحفظ...'
                          : `تأكيد وتسجيل (${
                              finalSignedPoints > 0 ? `+${finalSignedPoints}` : finalSignedPoints
                            } نقطة)`}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
