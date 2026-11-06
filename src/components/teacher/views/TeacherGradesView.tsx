import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  FileSpreadsheet,
  Save,
  CheckCircle2,
  AlertCircle,
  Search,
  Lock,
  Sparkles,
  BookOpen,
  Users,
  Calendar,
  Check,
} from 'lucide-react';
import { TeacherPortalData } from '../../../types/teacher';
import { GradeRecord } from '../../../types/admin';

interface TeacherGradesViewProps {
  data: TeacherPortalData;
  onSaveGrades: (updatedGrades: GradeRecord[]) => void;
  addToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

const EXAM_OPTIONS = [
  'اختبار شهر أكتوبر',
  'اختبار شهر نوفمبر',
  'اختبار شهر ديسمبر',
  'اختبار منتصف الفصل الأول',
  'اختبار شهر مارس',
  'اختبار شهر أبريل',
];

export function TeacherGradesView({ data, onSaveGrades, addToast }: TeacherGradesViewProps) {
  const { schoolId, assignedSubjects, assignedClasses, assignedStudents, recentGrades, teacher } = data;

  // 1. Filter State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    assignedSubjects[0]?.id || ''
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(
    assignedClasses[0]?.id || ''
  );
  const [selectedExam, setSelectedExam] = useState<string>('اختبار شهر أكتوبر');
  const [searchQuery, setSearchQuery] = useState('');

  // Local draft scores map: { studentId: { score: number | string, notes: string, saved: boolean } }
  const [draftScores, setDraftScores] = useState<
    Record<string, { score: string; notes: string; saved: boolean }>
  >({});

  const [isExamLocked, setIsExamLocked] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');

  // Input refs for keyboard navigation (up/down/enter)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Get active subject details
  const activeSubject =
    assignedSubjects.find((s) => s.id === selectedSubjectId) || assignedSubjects[0];

  // Get active class details
  const activeClass =
    assignedClasses.find((c) => c.id === selectedClassId) || assignedClasses[0];

  // Filter students by selected class
  const classStudents = assignedStudents.filter(
    (st) =>
      st.classId === activeClass?.id ||
      st.className === activeClass?.name ||
      assignedClasses.some((ac) => ac.name === st.className && ac.id === selectedClassId)
  );

  // Search filtered students
  const filteredStudents = classStudents.filter((st) =>
    st.name.includes(searchQuery) ||
    (st.studentCode && st.studentCode.includes(searchQuery)) ||
    st.id.includes(searchQuery)
  );

  // Load existing grade records into draft state whenever filters change
  useEffect(() => {
    if (!activeSubject || !activeClass) return;

    const newDrafts: Record<string, { score: string; notes: string; saved: boolean }> = {};

    classStudents.forEach((st) => {
      // Find matching grade record
      const existing = recentGrades.find(
        (g) =>
          g.studentId === st.id &&
          (g.subjectId === activeSubject.id || g.subjectName === activeSubject.name) &&
          g.examName === selectedExam
      );

      if (existing) {
        newDrafts[st.id] = {
          score: existing.score.toString(),
          notes: existing.notes || '',
          saved: true,
        };
      } else {
        newDrafts[st.id] = {
          score: '',
          notes: '',
          saved: false,
        };
      }
    });

    setDraftScores(newDrafts);
  }, [selectedSubjectId, selectedClassId, selectedExam, recentGrades]);

  // Handle Score Input Change
  const handleScoreChange = (studentId: string, val: string) => {
    if (isExamLocked) return;

    // Validate number against max score
    const maxScore = activeSubject?.maxScore || 100;
    const num = parseFloat(val);

    if (val !== '' && !isNaN(num) && num > maxScore) {
      addToast('درجة غير صالحة', `الدرجة العظمى لهذه المادة هي ${maxScore}`, 'error');
      return;
    }

    setDraftScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        score: val,
        saved: false,
      },
    }));

    setAutoSaveStatus('saving');
    setTimeout(() => setAutoSaveStatus('idle'), 1000);
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    if (isExamLocked) return;

    setDraftScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes,
        saved: false,
      },
    }));
  };

  // Keyboard navigation up/down
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      const nextStudent = filteredStudents[index + 1];
      if (nextStudent && inputRefs.current[nextStudent.id]) {
        inputRefs.current[nextStudent.id]?.focus();
        inputRefs.current[nextStudent.id]?.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevStudent = filteredStudents[index - 1];
      if (prevStudent && inputRefs.current[prevStudent.id]) {
        inputRefs.current[prevStudent.id]?.focus();
        inputRefs.current[prevStudent.id]?.select();
      }
    }
  };

  // Save All Grades
  const handleSaveAll = () => {
    if (!activeSubject || !activeClass) return;

    const recordsToSave: GradeRecord[] = [];
    let savedCount = 0;

    classStudents.forEach((st) => {
      const draft = draftScores[st.id];
      if (draft && draft.score !== '') {
        const scoreVal = parseFloat(draft.score);
        if (!isNaN(scoreVal)) {
          recordsToSave.push({
            id: `grd-${schoolId}-${st.id}-${activeSubject.id}-${selectedExam.replace(/\s+/g, '')}`,
            schoolId,
            studentId: st.id,
            studentName: st.name,
            classId: activeClass.id,
            className: activeClass.name,
            subjectId: activeSubject.id,
            subjectName: activeSubject.name,
            examName: selectedExam,
            score: scoreVal,
            maxScore: activeSubject.maxScore || 100,
            date: new Date().toISOString().split('T')[0],
            notes: draft.notes,
          });
          savedCount++;
        }
      }
    });

    if (recordsToSave.length === 0) {
      addToast('تنبيـه', 'برجاء إدخال درجة طالب واحد على الأقل قبل الحفظ', 'info');
      return;
    }

    onSaveGrades(recordsToSave);

    // Update draft saved flags
    setDraftScores((prev) => {
      const updated = { ...prev };
      recordsToSave.forEach((r) => {
        if (updated[r.studentId]) {
          updated[r.studentId].saved = true;
        }
      });
      return updated;
    });

    setAutoSaveStatus('saved');
    addToast(
      'تم حفظ الدرجات بنجاح',
      `تم تسجيل درجات ${savedCount} طالب في (${selectedExam}) لمادة ${activeSubject.name}`,
      'success'
    );
  };

  return (
    <div className="space-y-6 dir-rtl">
      {/* View Header & Exam Filter Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">رصد وإدخال درجات الشهر</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              اختر المادة والفصل ثم اختبار الشهر لإدخال الدرجات ورصد التقييمات بكل سهولة.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {autoSaveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                <Check className="w-3.5 h-3.5" />
                تم الحفظ بالكامل
              </span>
            )}
            <button
              onClick={handleSaveAll}
              disabled={isExamLocked}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>حفظ واعتماد الدرجات</span>
            </button>
          </div>
        </div>

        {/* 3 Step Selectors: Subject ↓ Class ↓ Exam */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Selector 1: Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>1. اختر المادة الدراسية:</span>
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              {assignedSubjects.map((sbj) => (
                <option key={sbj.id} value={sbj.id}>
                  {sbj.name} ({sbj.code})
                </option>
              ))}
            </select>
          </div>

          {/* Selector 2: Class */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span>2. اختر الفصل الدراسي:</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              {assignedClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.gradeLevel})
                </option>
              ))}
            </select>
          </div>

          {/* Selector 3: Exam */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>3. اختر الاختبار الشهر:</span>
            </label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              {EXAM_OPTIONS.map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject Specs Info Ribbon */}
        {activeSubject && (
          <div className="mt-4 p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
            <div className="flex items-center gap-4">
              <span>
                الدرجة العظمى: <strong className="text-blue-900">{activeSubject.maxScore} درجة</strong>
              </span>
              <span>
                درجة النجاح: <strong className="text-slate-900">{activeSubject.passScore} درجة</strong>
              </span>
              <span>
                عدد الطلاب بالكشف: <strong className="text-slate-900">{classStudents.length} طالب</strong>
              </span>
            </div>

            <div className="text-[11px] text-slate-500">
              💡 يمكنك التنقل بسرعة بين الخانات بالضغط على سهم لأسفل <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded text-[10px]">↓</kbd> أو زر Enter.
            </div>
          </div>
        )}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Search & Status Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث باسم الطالب أو كود الطالب..."
              className="w-full pr-9 pl-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">حالة رصد المادة:</span>
            {isExamLocked ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg font-bold border border-amber-200">
                <Lock className="w-3.5 h-3.5" />
                مغلق ومُعتمد من الإدارة
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-bold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                مفتوح للتعديل والرصد
              </span>
            )}
          </div>
        </div>

        {/* Grades Entry Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">اسم الطالب</th>
                <th className="py-3.5 px-4 text-center w-36">
                  الدرجة (من {activeSubject?.maxScore || 100})
                </th>
                <th className="py-3.5 px-4">ملاحظات المعلم (اختياري)</th>
                <th className="py-3.5 px-4 text-center w-28">حالة التسجيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    لا يوجد طلاب ينطبق عليهم البحث في هذا الفصل
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const draft = draftScores[student.id] || { score: '', notes: '', saved: false };
                  const scoreNum = parseFloat(draft.score);
                  const isPass = !isNaN(scoreNum) && scoreNum >= (activeSubject?.passScore || 50);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {student.name}
                        <div className="text-[10px] text-slate-500 font-mono font-normal mt-0.5">
                          {student.className} • كود: {student.studentCode || student.id}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="relative inline-block w-28">
                          <input
                            ref={(el) => {
                              inputRefs.current[student.id] = el;
                            }}
                            type="number"
                            min={0}
                            max={activeSubject?.maxScore || 100}
                            step="0.5"
                            value={draft?.score ?? ''}
                            disabled={isExamLocked}
                            onChange={(e) => handleScoreChange(student.id, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx)}
                            placeholder="0"
                            className={`w-full text-center px-3 py-2 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 ${
                              !draft?.score
                                ? 'border-slate-200 bg-white text-slate-800 focus:ring-blue-600'
                                : isPass
                                ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900 focus:ring-emerald-500'
                                : 'border-rose-300 bg-rose-50/50 text-rose-900 focus:ring-rose-500'
                            }`}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={draft?.notes ?? ''}
                          disabled={isExamLocked}
                          onChange={(e) => handleNotesChange(student.id, e.target.value)}
                          placeholder="مثال: ممتازة في الاستيعاب، يحتاج مراجعة النحو..."
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        {draft.saved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-lg border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            تم الحفظ
                          </span>
                        ) : draft.score !== '' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-[11px] font-bold rounded-lg border border-amber-200">
                            غير محفوظ
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">معلق</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            إجمالي الطلاب في هذا الجدول: <strong className="text-slate-900">{filteredStudents.length}</strong> | 
            تم إدخال درجات: <strong className="text-emerald-700">{Object.keys(draftScores).filter(k => draftScores[k]?.score !== '').length}</strong>
          </div>

          <button
            onClick={handleSaveAll}
            disabled={isExamLocked}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>حفظ جميع درجات الكشف</span>
          </button>
        </div>
      </div>
    </div>
  );
}
