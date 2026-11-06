import React from 'react';
import { AvatarDisplay } from '../../ui/AvatarDisplay';
import { getUserAvatarLayoutUid } from '../../../lib/avatarLayouts';
import {
  Users,
  GraduationCap,
  Building2,
  CalendarCheck,
  UserX,
  Megaphone,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronLeft,
  Star,
  Plus,
} from 'lucide-react';
import {
  Student,
  Teacher,
  ClassRoom,
  AttendanceRecord,
  Announcement,
  BehaviorRecord,
  AdminViewTab,
} from '../../../types/admin';

interface AdminDashboardViewProps {
  schoolId: string;
  students: Student[];
  teachers: Teacher[];
  classes: ClassRoom[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  behavior: BehaviorRecord[];
  setActiveTab: (tab: AdminViewTab) => void;
  onOpenAddStudent: () => void;
  onOpenAddAnnouncement: () => void;
}

export function AdminDashboardView({
  students,
  teachers,
  classes,
  attendance,
  announcements,
  behavior,
  setActiveTab,
  onOpenAddStudent,
  onOpenAddAnnouncement,
}: AdminDashboardViewProps) {
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalClasses = classes.length;

  // Calculate today's attendance metrics
  const todayDate = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter((a) => a.date === todayDate);
  const targetAttendance = todayAttendance.length > 0 ? todayAttendance : attendance;

  const todayPresent = targetAttendance.filter((a) => a.status === 'حاضر').length;
  const todayAbsent = targetAttendance.filter((a) => a.status === 'غائب').length;
  const todayLate = targetAttendance.filter((a) => a.status === 'متأخر').length;
  const totalRecorded = targetAttendance.length;

  const attendancePercentage = totalRecorded > 0 ? Math.round(((todayPresent + todayLate) / totalRecorded) * 100) : 0;
  const absencePercentage = totalRecorded > 0 ? Math.round((todayAbsent / totalRecorded) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 6 Top Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Total Students */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">إجمالي الطلاب</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-bold text-slate-900">{totalStudents}</h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              منتظم
            </span>
          </div>
        </div>

        {/* Card 2: Total Teachers */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">إجمالي المعلمين</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-bold text-slate-900">{totalTeachers}</h3>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
              نشط
            </span>
          </div>
        </div>

        {/* Card 3: Total Classes */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">إجمالي الصفوف</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-bold text-slate-900">{totalClasses}</h3>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              صف
            </span>
          </div>
        </div>

        {/* Card 4: Today Attendance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">حضور اليوم</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-bold text-emerald-700">{attendancePercentage}%</h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              مرتفع
            </span>
          </div>
        </div>

        {/* Card 5: Absence Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">نسبة الغياب</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-bold text-amber-700">{absencePercentage}%</h3>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              {todayAbsent} غائب
            </span>
          </div>
        </div>

        {/* Card 6: Total Announcements */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">الإعلانات</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Megaphone className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-bold text-slate-900">{announcements.length}</h3>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
              نشط
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Section (2 columns on lg) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget 1: Today's Attendance Overview */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">سجل حضور اليوم حسب الصفوف</h3>
                <p className="text-[11px] text-slate-500">
                  تحديثات الطابور الصباحي والتأخيرات الموثقة
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('attendance')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>رصد الحضور</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-3 bg-emerald-50/80 border border-emerald-200/60 rounded-xl">
              <span className="text-emerald-700 font-bold block text-base">{todayPresent}</span>
              <span className="text-[11px] text-emerald-800">حاضر الآن</span>
            </div>
            <div className="p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl">
              <span className="text-amber-700 font-bold block text-base">{todayLate}</span>
              <span className="text-[11px] text-amber-800">متأخر</span>
            </div>
            <div className="p-3 bg-red-50/80 border border-red-200/60 rounded-xl">
              <span className="text-red-700 font-bold block text-base">{todayAbsent}</span>
              <span className="text-[11px] text-red-800">غائب بعذر/بدون</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            {classes.slice(0, 4).map((cls) => {
              const clsAtt = targetAttendance.filter((a) => a.classId === cls.id);
              const clsPresent = clsAtt.filter((a) => a.status === 'حاضر' || a.status === 'متأخر').length;
              const clsRate = clsAtt.length > 0 ? Math.round((clsPresent / clsAtt.length) * 100) : 0;
              return (
                <div
                  key={cls.id}
                  className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{cls.name}</span>
                    <span className="text-[11px] text-slate-500">رائد الفصل: {cls.headTeacherName || 'غير معين'}</span>
                  </div>
                  <div className="flex items-center gap-3 font-semibold">
                    <span className="text-slate-600">{cls.studentCount} طالب</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[11px]">
                      {clsRate}% حضور
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Widget 2: Latest Announcements */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">أحدث الإعلانات والتعاميم</h3>
                <p className="text-[11px] text-slate-500">
                  القرارات والتنبيهات الموجهة للمعلمين والطلاب
                </p>
              </div>
            </div>

            <button
              onClick={onOpenAddAnnouncement}
              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إعلان جديد</span>
            </button>
          </div>

          <div className="space-y-3">
            {announcements.slice(0, 3).map((anc) => (
              <div
                key={anc.id}
                className="p-3.5 bg-slate-50/80 border border-slate-200/70 rounded-xl space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[240px]">
                    {anc.title}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      anc.priority === 'عاجل جداً'
                        ? 'bg-red-100 text-red-700'
                        : anc.priority === 'هام'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {anc.priority}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  {anc.content}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>الموجه إلى: {anc.targetAudience}</span>
                  <span>{anc.publishDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Grid Section (Students & Behavior) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget 3: Recent Students Activity */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">سجلات الطلاب الأخيرة</h3>
                <p className="text-[11px] text-slate-500">
                  قائمة الطلاب المضافين حديثاً والملفات النشطة
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('students')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>عرض جميع الطلاب</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5">
            {students.slice(0, 4).map((std) => (
              <div
                key={std.id}
                className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <AvatarDisplay
                    layoutUid={std.avatar_layout_uid || getUserAvatarLayoutUid(std.id)}
                    size="sm"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">{std.name}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {std.className} • كود الطالب: {std.studentCode || std.id}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-lg border border-emerald-200/60">
                  {std.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 4: Recent Behavior Reports */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Star className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">أحدث تقارير السلوك والملاحظات</h3>
                <p className="text-[11px] text-slate-500">
                  ملاحظات المعلمين على تفوق وسلوكيات الطلاب
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('behavior')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>سجل السلوك الكامل</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {behavior.slice(0, 3).map((bh) => (
              <div
                key={bh.id}
                className={`p-3 border rounded-xl space-y-1 text-xs ${
                  bh.type === 'إيجابي'
                    ? 'bg-emerald-50/40 border-emerald-200/80'
                    : 'bg-amber-50/40 border-amber-200/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{bh.studentName}</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      bh.type === 'إيجابي'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {bh.type === 'إيجابي' ? `+${bh.points} نقطة إيجابية` : `${bh.points} نقطة`}
                  </span>
                </div>
                <p className="text-slate-700 text-[11px] font-semibold">{bh.title}</p>
                <p className="text-slate-500 text-[10px]">{bh.notes}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
