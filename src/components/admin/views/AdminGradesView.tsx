import React, { useState, useEffect } from 'react';
import { ClipboardList, Save, Check, Award, BookOpen, Building2 } from 'lucide-react';
import { GradeRecord, ClassRoom, Subject, Student } from '../../../types/admin';

export type ExamType = 'اختبار شهر أكتوبر' | 'منتصف الفصل الدراسي الأول' | 'اختبار شهر نوفمبر' | 'الاختبار النهائي';

interface AdminGradesViewProps {
  schoolId: string;
  classes: ClassRoom[];
  subjects: Subject[];
  students: Student[];
  grades: GradeRecord[];
  onSaveGrades: (records: GradeRecord[]) => Promise<void> | void;
  onToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export function AdminGradesView({
  schoolId,
  classes,
  subjects,
  students,
  grades,
  onSaveGrades,
  onToast,
}: AdminGradesViewProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [selectedExamType, setSelectedExamType] = useState<ExamType>('اختبار شهر أكتوبر');

  // Sheet State
  const [scores, setScores] = useState<Record<string, { score: number; remarks: string }>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  const classStudents = students.filter((s) => s.classId === selectedClassId);

  const maxScore = selectedSubject?.maxScore || 100;
  const passScore = selectedSubject?.passScore || 50;

  useEffect(() => {
    const existing = grades.filter(
      (g) =>
        g.classId === selectedClassId &&
        g.subjectId === selectedSubjectId &&
        g.examName === selectedExamType
    );

    const initialSheet: Record<string, { score: number; remarks: string }> = {};

    classStudents.forEach((std) => {
      const match = existing.find((g) => g.studentId === std.id);
      if (match) {
        initialSheet[std.id] = { score: match.score, remarks: match.notes || '' };
      } else {
        initialSheet[std.id] = { score: Math.floor(passScore + Math.random() * (maxScore - passScore)), remarks: '' };
      }
    });

    setScores(initialSheet);
    setIsSaved(false);
  }, [selectedClassId, selectedSubjectId, selectedExamType, grades, students]);

  const handleScoreChange = (studentId: string, value: number) => {
    const clamped = Math.min(Math.max(0, value), maxScore);
    setScores((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], score: clamped },
    }));
    setIsSaved(false);
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: { score: prev[studentId]?.score || 0, remarks },
    }));
    setIsSaved(false);
  };

  const handleSave = async () => {
    const toSave: GradeRecord[] = classStudents.map((std) => {
      const entry = scores[std.id] || { score: passScore, remarks: '' };
      return {
        id: `grd-${schoolId}-${std.id}-${selectedSubjectId}-${selectedExamType}`,
        schoolId,
        studentId: std.id,
        studentName: std.name,
        classId: selectedClassId,
        className: selectedClass?.name || '',
        subjectId: selectedSubjectId,
        subjectName: selectedSubject?.name || '',
        examName: selectedExamType,
        score: entry.score,
        maxScore,
        notes: entry.remarks,
        date: new Date().toISOString().split('T')[0],
      };
    });

    setIsSaving(true);
    try {
      await onSaveGrades(toSave);
      setIsSaved(true);
      onToast('تم حفظ درجات الطلاب بنجاح', `مادة: ${selectedSubject?.name} - ${selectedExamType}`, 'success');
    } catch (err: any) {
      onToast('فشل حفظ الدرجات', err?.message || 'تعذر حفظ الدرجات في قاعدة البيانات', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selection Panel Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
          {/* Class Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">الفصل الدراسي:</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">المادة الدراسية:</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              {subjects.map((sbj) => (
                <option key={sbj.id} value={sbj.id}>
                  {sbj.name} (من {sbj.maxScore})
                </option>
              ))}
            </select>
          </div>

          {/* Exam Type Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">نوع الاختبار / التقويم:</label>
            <select
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value as ExamType)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              <option value="اختبار شهر أكتوبر">اختبار شهر أكتوبر</option>
              <option value="اختبار شهر نوفمبر">اختبار شهر نوفمبر</option>
              <option value="امتحان منتصف العام">امتحان منتصف العام</option>
              <option value="اختبار شهر مارس">اختبار شهر مارس</option>
              <option value="اختبار شهر أبريل">اختبار شهر أبريل</option>
              <option value="امتحان نهاية العام">امتحان نهاية العام</option>
            </select>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>جاري الحفظ...</span>
            </>
          ) : isSaved ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>تم حفظ الدرجات</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>حفظ نتائج الفصل</span>
            </>
          )}
        </button>
      </div>

      {/* Subject Rules Badge */}
      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs">
        <span className="font-bold text-slate-800">
          مادة: <span className="text-blue-600">{selectedSubject?.name}</span> • النهاية العظمى:{' '}
          <span className="font-mono">{maxScore}</span> درجة • درجة النجاح الصغرى:{' '}
          <span className="font-mono text-emerald-700">{passScore}</span> درجة
        </span>
        <span className="text-[11px] text-slate-500">يتم التقييم ورصد الدرجات بالدقة الرقمية</span>
      </div>

      {/* Grades Sheet Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-xs text-slate-900">
              كشف درجات طلاب {selectedClass?.name} ({classStudents.length} طالب)
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">اسم الطالب</th>
                <th className="px-5 py-3 text-center">الدرجة المكتسبة (من {maxScore})</th>
                <th className="px-5 py-3 text-center">التقييم والنتيجة</th>
                <th className="px-5 py-3">ملاحظات معلم المادة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    لا يوجد طلاب مسجلون بهذا الفصل
                  </td>
                </tr>
              ) : (
                classStudents.map((std, idx) => {
                  const entry = scores[std.id] || { score: passScore, remarks: '' };
                  const isPassed = entry.score >= passScore;
                  const scorePercent = Math.round((entry.score / maxScore) * 100);

                  return (
                    <tr key={std.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">{std.name}</td>
                      <td className="px-5 py-3.5 text-center">
                        <input
                          type="number"
                          min={0}
                          max={maxScore}
                          value={entry.score}
                          onChange={(e) => handleScoreChange(std.id, Number(e.target.value))}
                          className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-center text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isPassed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-red-50 text-red-700 border border-red-200/60'
                          }`}
                        >
                          {isPassed ? `ناجح (${scorePercent}%)` : `راسب (${scorePercent}%)`}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <input
                          type="text"
                          value={entry.remarks}
                          onChange={(e) => handleRemarksChange(std.id, e.target.value)}
                          placeholder="ملاحظات المعلم على مستوى الطالب..."
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
