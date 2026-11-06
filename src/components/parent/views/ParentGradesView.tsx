import React, { useState } from 'react';
import { ParentPortalData } from '../../../types/parent';
import {
  Award,
  BookOpen,
  Filter,
  TrendingUp,
  User,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { formatArabicNumber } from '../../../lib/utils';

interface ParentGradesViewProps {
  data: ParentPortalData;
}

export function ParentGradesView({ data }: ParentGradesViewProps) {
  const { grades, stats } = data;

  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedExam, setSelectedExam] = useState<string>('all');

  // Filter grades
  const filteredGrades = grades.filter((g) => {
    if (selectedSemester !== 'all') {
      if (selectedSemester === 'sem1' && !g.examName.includes('الأول') && !g.date.startsWith('2025')) {
        return false;
      }
      if (selectedSemester === 'sem2' && !g.examName.includes('الثاني') && !g.date.startsWith('2026')) {
        return false;
      }
    }

    if (selectedExam !== 'all') {
      if (selectedExam === 'month' && !g.examName.includes('شهر')) return false;
      if (selectedExam === 'midterm' && !g.examName.includes('منتصف')) return false;
      if (selectedExam === 'final' && !g.examName.includes('نهائي') && !g.examName.includes('النهائي'))
        return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top GPA Overview Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0 border border-emerald-200/60">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">المعدل التراكمي الشامل</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-slate-900">
                {formatArabicNumber(stats.overallGpa)}%
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
                {stats.overallGradeLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              مجموع المواد المرصودة بالسجل الأكاديمي: {formatArabicNumber(grades.length)} مواد
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Semester Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold w-full sm:w-auto">
            <button
              onClick={() => setSelectedSemester('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedSemester === 'all'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              جميع الفصول
            </button>
            <button
              onClick={() => setSelectedSemester('sem1')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedSemester === 'sem1'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              الفصل الأول
            </button>
            <button
              onClick={() => setSelectedSemester('sem2')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedSemester === 'sem2'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              الفصل الثاني
            </button>
          </div>

          {/* Exam Type Filter */}
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="all">جميع الاختبارات</option>
            <option value="month">امتحانات الشهر</option>
            <option value="midterm">امتحانات منتصف الفصل</option>
            <option value="final">الامتحانات النهائية</option>
          </select>
        </div>
      </div>

      {/* SUBJECT CARDS GRID */}
      {filteredGrades.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 text-xs">
          لا توجد نتائج مطابقة لخيارات التصفية المحددة.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGrades.map((g) => {
            const percentage = Math.round((g.score / g.maxScore) * 100);

            let gradeColor = 'text-emerald-600 bg-emerald-50 border-emerald-200/60';
            let progressColor = 'bg-emerald-500';
            let label = 'ممتاز';

            if (percentage < 60) {
              gradeColor = 'text-red-600 bg-red-50 border-red-200/60';
              progressColor = 'bg-red-500';
              label = 'يحتاج دعم';
            } else if (percentage < 75) {
              gradeColor = 'text-amber-600 bg-amber-50 border-amber-200/60';
              progressColor = 'bg-amber-500';
              label = 'جيد';
            } else if (percentage < 85) {
              gradeColor = 'text-blue-600 bg-blue-50 border-blue-200/60';
              progressColor = 'bg-blue-500';
              label = 'جيد جداً';
            }

            return (
              <div
                key={g.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4 hover:border-blue-300 transition-all"
              >
                {/* Top Title & Exam Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {g.examName}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900 mt-1">{g.subjectName}</h3>
                  </div>

                  <span className={`px-2.5 py-1 rounded-xl text-xs font-extrabold border ${gradeColor}`}>
                    {label}
                  </span>
                </div>

                {/* Score Big Display & Progress */}
                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 font-semibold">الدرجة المحصلة</span>
                    <div className="text-2xl font-black font-mono text-slate-900 flex items-baseline gap-1">
                      <span>{formatArabicNumber(g.score)}</span>
                      <span className="text-xs text-slate-400 font-bold">
                        / {formatArabicNumber(g.maxScore)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200/70 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold pt-1">
                    <span>النسبة المئوية للمادة</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatArabicNumber(percentage)}%
                    </span>
                  </div>
                </div>

                {/* Teacher Info & Date */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      مدرس المادة:
                    </span>
                    <span className="font-bold text-slate-800">أ. معلم الفكّر والابتكار</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      تاريخ الرصد:
                    </span>
                    <span className="font-mono text-slate-700">{g.date}</span>
                  </div>

                  {g.notes && (
                    <div className="mt-2 p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl text-[11px] text-amber-900 font-medium">
                      ملاحظة معلم المادة: {g.notes}
                    </div>
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
