import React from 'react';
import { motion } from 'motion/react';
import { AvatarDisplay } from '../../ui/AvatarDisplay';
import { getUserAvatarLayoutUid } from '../../../lib/avatarLayouts';
import { formatArabicNumber } from '../../../lib/storage';
import {
  Users,
  BookOpen,
  Star,
  ChevronLeft,
  Megaphone,
  School,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { TeacherPortalData, TeacherActivityLog } from '../../../types/teacher';

interface TeacherHomeViewProps {
  data: TeacherPortalData;
  activities: TeacherActivityLog[];
  onNavigateToBehavior: () => void;
}

export function TeacherHomeView({
  data,
  activities,
  onNavigateToBehavior,
}: TeacherHomeViewProps) {
  const { teacher, assignedClasses, assignedSubjects, assignedStudents, recentBehavior } = data;
  const announcements = data.announcements || [];

  // 1. Calculate Stats
  const totalAssignedStudents = assignedStudents.length;

  // Behavior notes added count
  const behaviorNotesCount = recentBehavior.length;
  const positiveCount = recentBehavior.filter((b) => b.type === 'إيجابي').length;
  const negativeCount = recentBehavior.filter((b) => b.type === 'سلبي').length;
  const positivePercentage =
    behaviorNotesCount > 0 ? Math.round((positiveCount / behaviorNotesCount) * 100) : 100;

  return (
    <div className="space-y-4 sm:space-y-6 dir-rtl">
      {/* 1. Teacher Welcome Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm relative overflow-hidden"
      >
        {/* Subtle decorative background ambient glows */}
        <div className="absolute -top-24 -left-20 w-64 h-64 bg-gradient-to-br from-blue-100/60 to-indigo-100/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-20 w-64 h-64 bg-gradient-to-tl from-amber-100/40 to-sky-100/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-5 sm:gap-7">
          {/* Avatar & Teacher Details */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 text-center sm:text-right w-full lg:w-auto">
            <div className="relative shrink-0">
              <AvatarDisplay
                layoutUid={teacher.avatar_layout_uid || getUserAvatarLayoutUid(teacher.id)}
                size="xl"
                showGlow={true}
              />
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-blue-600 text-white p-1 rounded-full ring-2 ring-white shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  أهلاً بك، {teacher.name}
                </h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200/80 inline-flex items-center gap-1 shadow-2xs">
                  <span>معلم معتمد</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-2.5 text-xs font-bold text-slate-600">
                <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-xl shadow-2xs">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>التخصص: <strong className="text-slate-900">{teacher.specialization}</strong></span>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-xl shadow-2xs">
                  <School className="w-3.5 h-3.5 text-blue-600" />
                  <span>المدرسة: <strong className="text-slate-900">{data.schoolName}</strong></span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-center sm:justify-end">
            <button
              onClick={onNavigateToBehavior}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98"
            >
              <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>إضافة ملاحظة سلوكية</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* 2. Key Metrics & Summary Cards Grid (Premium 2-Column Layout without المواد الدراسية) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Card 1: Assigned Students & Classes */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between relative overflow-hidden"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                  نطاق التكليف الدراسي
                </span>
                <h3 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                  الطلاب المكلف بهم
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Users className="w-6 h-6 stroke-[2.2]" />
              </div>
            </div>

            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 font-sans tracking-tight">
                {formatArabicNumber(totalAssignedStudents)}
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-500">طالب في صفوفك</span>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>الصفوف المسندة:</span>
            </div>
            <span className="font-sans font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100 shadow-2xs">
              {formatArabicNumber(assignedClasses.length)} صفوف دراسية
            </span>
          </div>
        </motion.div>

        {/* Card 2: Behavior Notes & Evaluation Ratio */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between relative overflow-hidden"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                  المتابعة والتهذيب
                </span>
                <h3 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                  سجل التقييمات التربوية
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
              </div>
            </div>

            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 font-sans tracking-tight">
                {formatArabicNumber(behaviorNotesCount)}
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-500">ملاحظة سلوكية مسجلة</span>
            </div>

            {/* Proportion Bar */}
            {behaviorNotesCount > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{ width: `${positivePercentage}%` }}
                    title={`إيجابي: ${positivePercentage}%`}
                  />
                  <div
                    className="bg-rose-500 h-full transition-all"
                    style={{ width: `${100 - positivePercentage}%` }}
                    title={`سلبي: ${100 - positivePercentage}%`}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">إيجابي / سلبي:</span>
            <div className="flex items-center gap-2">
              <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 font-sans font-black flex items-center gap-1">
                <span>+</span>
                <span>{formatArabicNumber(positiveCount)} إيجابي</span>
              </span>
              <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 font-sans font-black flex items-center gap-1">
                <span>-</span>
                <span>{formatArabicNumber(negativeCount)} سلبي</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3. My Assigned Classes Cards Showcase */}
      {assignedClasses.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h3 className="font-black text-slate-900 text-sm">فصولي الدراسية المسندة</h3>
            </div>
            <span className="text-xs font-extrabold text-slate-500">
              إجمالي {formatArabicNumber(assignedClasses.length)} فصول
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {assignedClasses.map((cls) => {
              const studentsInClass = assignedStudents.filter((s) => s.classId === cls.id);
              return (
                <div
                  key={cls.id}
                  className="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200/70 hover:border-blue-300 transition-all flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <h4 className="font-black text-xs text-slate-900">{cls.name}</h4>
                    <p className="text-[11px] font-semibold text-slate-500">{cls.grade || 'المرحلة الدراسية'}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100 font-sans">
                      <Users className="w-3 h-3 text-blue-500" />
                      <span>{formatArabicNumber(studentsInClass.length)} طالب</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Recent Behavior Evaluations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">أحدث الملاحظات والتقييمات التربوية</h3>
                  <p className="text-xs font-semibold text-slate-500">آخر التقييمات المسجلة للطلاب في فصولك</p>
                </div>
              </div>

              <button
                onClick={onNavigateToBehavior}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
              >
                <span>السجل الكامل</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5">
              {recentBehavior.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-500">لم تقم بتسجيل أي ملاحظات سلوكية مؤخراً.</p>
                  <button
                    onClick={onNavigateToBehavior}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة أول ملاحظة الآن</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentBehavior.slice(0, 5).map((b) => (
                    <div
                      key={b.id}
                      className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 mt-0.5 border ${
                            b.type === 'إيجابي'
                              ? 'bg-emerald-100 border-emerald-200 text-emerald-800'
                              : 'bg-rose-100 border-rose-200 text-rose-800'
                          }`}
                        >
                          {b.type === 'إيجابي' ? '🌟' : '⚠️'}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-black text-xs text-slate-900">{b.studentName}</span>
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                                b.type === 'إيجابي'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              {b.type} ({formatArabicNumber(b.points)} نقطة)
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-800">{b.title}</p>
                          {b.notes && (
                            <p className="text-[11px] font-medium text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/60 leading-relaxed">
                              "{b.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 font-extrabold shrink-0 self-end sm:self-center font-sans">
                        {b.date}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Announcements & Quick Links */}
        <div className="space-y-6">
          {/* Real School Announcements Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-black text-slate-900 text-xs sm:text-sm">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <span>الإعلانات والتعاميم المدرسية</span>
              </div>
              <span className="text-[10px] bg-blue-50 text-blue-700 font-extrabold px-2.5 py-0.5 rounded-full border border-blue-100">
                {formatArabicNumber(announcements.length)} إعلان
              </span>
            </div>

            {announcements.length === 0 ? (
              <p className="leading-relaxed text-slate-500 text-center py-4 text-xs font-semibold">
                لا توجد إعلانات أو تعاميم صادرة من إدارة المدرسة حالياً.
              </p>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 3).map((anc) => (
                  <div key={anc.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-black text-slate-900 text-xs line-clamp-1">{anc.title}</h4>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                        anc.priority === 'عاجل جداً'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : anc.priority === 'هام'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}>
                        {anc.priority || 'عادي'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-medium">{anc.content}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold pt-1 border-t border-slate-200/40">
                      <span>{anc.author || 'إدارة المدرسة'}</span>
                      <span className="font-sans">{anc.publishDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
