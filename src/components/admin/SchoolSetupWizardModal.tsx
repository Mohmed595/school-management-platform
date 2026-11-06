import React, { useState } from 'react';
import {
  X,
  Check,
  Palette,
  Building2,
  Users,
  UserCheck,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import { ClassRoom, Student } from '../../types/admin';
import { saveSetupWizardData, generateStudentCode } from '../../lib/adminStorage';
import { PhoneDisplay } from '../ui/PhoneDisplay';

interface SchoolSetupWizardModalProps {
  schoolId: string;
  currentThemeColor?: string;
  currentClasses: ClassRoom[];
  currentStudents: Student[];
  onClose: () => void;
  onSaveSuccess: (updatedTheme: string) => void;
}

const THEME_OPTIONS = [
  { id: 'blue', name: 'الأزرق الملكي (القياسي)', hex: '#2563EB', bgClass: 'bg-blue-600', ringClass: 'ring-blue-500' },
  { id: 'emerald', name: 'الزمردي التعليمي', hex: '#059669', bgClass: 'bg-emerald-600', ringClass: 'ring-emerald-500' },
  { id: 'navy', name: 'الكحلي الرئاسي', hex: '#1E293B', bgClass: 'bg-slate-800', ringClass: 'ring-slate-700' },
  { id: 'purple', name: 'الأرجواني الملوكي', hex: '#7C3AED', bgClass: 'bg-purple-600', ringClass: 'ring-purple-500' },
  { id: 'rose', name: 'العنابي الياقوتي', hex: '#E11D48', bgClass: 'bg-rose-600', ringClass: 'ring-rose-500' },
  { id: 'amber', name: 'الذهبي البرونزي', hex: '#D97706', bgClass: 'bg-amber-600', ringClass: 'ring-amber-500' },
];

const STANDARD_GRADES = [
  'الصف الأول الابتدائي',
  'الصف الثاني الابتدائي',
  'الصف الثالث الابتدائي',
  'الصف الرابع الابتدائي',
  'الصف الخامس الابتدائي',
  'الصف السادس الابتدائي',
  'الصف الأول الإعدادي',
  'الصف الثاني الإعدادي',
  'الصف الثالث الإعدادي',
  'الصف الأول الثانوي',
  'الصف الثاني الثانوي',
  'الصف الثالث الثانوي',
];

export function SchoolSetupWizardModal({
  schoolId,
  currentThemeColor = '#2563EB',
  currentClasses,
  currentStudents,
  onClose,
  onSaveSuccess,
}: SchoolSetupWizardModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 State: Theme Color
  const [selectedThemeHex, setSelectedThemeHex] = useState<string>(currentThemeColor);

  // Step 2 State: Classes List
  const [classesList, setClassesList] = useState<ClassRoom[]>(
    currentClasses.length > 0 ? [...currentClasses] : []
  );
  const [newGradeLevel, setNewGradeLevel] = useState<string>('الصف الأول الإعدادي');
  const [newClassName, setNewClassName] = useState<string>('أ');
  const [newRoomNumber, setNewRoomNumber] = useState<string>('101');
  const [newCapacity, setNewCapacity] = useState<number>(35);

  // Step 3 State: Students List
  const [studentsList, setStudentsList] = useState<Student[]>(
    currentStudents.length > 0 ? [...currentStudents] : []
  );
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentGrade, setNewStudentGrade] = useState<string>('الصف الأول الإعدادي');
  const [newStudentGender, setNewStudentGender] = useState<'ذكر' | 'أنثى'>('ذكر');
  const [newStudentPhone, setNewStudentPhone] = useState<string>('');

  // Bulk Paste State
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);
  const [bulkNamesText, setBulkNamesText] = useState<string>('');

  // Step 4 Error / Notice
  const [errorNotice, setErrorNotice] = useState<string>('');

  // Step 2 Action: Add Single Class
  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    const fullName = `${newGradeLevel} - ${newClassName.trim()}`;
    const id = `cls-${schoolId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const createdClass: ClassRoom = {
      id,
      schoolId,
      name: fullName,
      gradeLevel: newGradeLevel,
      roomNumber: newRoomNumber.trim() || '101',
      capacity: newCapacity > 0 ? newCapacity : 35,
      studentCount: 0,
    };

    setClassesList((prev) => [...prev, createdClass]);
    setNewClassName(newClassName === 'أ' ? 'ب' : newClassName === 'ب' ? 'ج' : 'أ');
    setErrorNotice('');
  };

  // Step 2 Action: Add Preset Classes (أ، ب) for selected grade
  const handleAddPresetClassesForGrade = (grade: string) => {
    const existingForGrade = classesList.filter((c) => c.gradeLevel === grade);
    if (existingForGrade.length > 0) return;

    const classA: ClassRoom = {
      id: `cls-${schoolId}-${Date.now()}-a`,
      schoolId,
      name: `${grade} - أ`,
      gradeLevel: grade,
      roomNumber: '101',
      capacity: 35,
      studentCount: 0,
    };

    const classB: ClassRoom = {
      id: `cls-${schoolId}-${Date.now()}-b`,
      schoolId,
      name: `${grade} - ب`,
      gradeLevel: grade,
      roomNumber: '102',
      capacity: 35,
      studentCount: 0,
    };

    setClassesList((prev) => [...prev, classA, classB]);
  };

  const handleDeleteClass = (id: string) => {
    setClassesList((prev) => prev.filter((c) => c.id !== id));
    // Reset students class assignment if linked to this class
    setStudentsList((prev) =>
      prev.map((s) => (s.classId === id ? { ...s, classId: '', className: 'غير مسكن' } : s))
    );
  };

  // Step 3 Action: Add Single Student
  const handleAddStudent = () => {
    if (!newStudentName.trim()) return;

    const id = `std-${schoolId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nationalId = `${300 + Math.floor(Math.random() * 20)}${Math.floor(
      10000000000 + Math.random() * 90000000000
    )}`;

    // Try finding an available class in that grade
    const availableClass = classesList.find((c) => c.gradeLevel === newStudentGrade);

    const createdStudent: Student = {
      id,
      schoolId,
      name: newStudentName.trim(),
      studentCode: generateStudentCode(),
      nationalId,
      age: newStudentGrade || 'الصف الأول الابتدائي',
      gradeLevel: newStudentGrade || 'الصف الأول الابتدائي',
      classId: availableClass ? availableClass.id : '',
      className: availableClass ? availableClass.name : 'غير مسكن',
      birthDate: '2012-05-15',
      gender: newStudentGender,
      status: 'منتظم',
      parentName: `ولي أمر ${newStudentName.trim().split(' ')[0] || ''}`,
      parentPhone: newStudentPhone.trim(),
      address: 'القاهرة - مصر',
      joinDate: new Date().toISOString().split('T')[0],
    };

    setStudentsList((prev) => [...prev, createdStudent]);
    setNewStudentName('');
    setErrorNotice('');
  };

  // Step 3 Action: Process Bulk Students Text
  const handleProcessBulkStudents = () => {
    const lines = bulkNamesText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    const availableClass = classesList.find((c) => c.gradeLevel === newStudentGrade);

    const created: Student[] = lines.map((name, idx) => {
      const id = `std-${schoolId}-${Date.now()}-${idx}`;
      const nationalId = `${300 + Math.floor(Math.random() * 20)}${Math.floor(
        10000000000 + Math.random() * 90000000000
      )}`;
      return {
        id,
        schoolId,
        name,
        studentCode: generateStudentCode(),
        nationalId,
        age: newStudentGrade || 'الصف الأول الابتدائي',
        gradeLevel: newStudentGrade || 'الصف الأول الابتدائي',
        classId: availableClass ? availableClass.id : '',
        className: availableClass ? availableClass.name : 'غير مسكن',
        birthDate: '2012-05-15',
        gender: 'ذكر' as const,
        status: 'منتظم' as const,
        parentName: `ولي أمر ${name.split(' ')[0] || ''}`,
        parentPhone: '01000000000',
        address: 'القاهرة - مصر',
        joinDate: new Date().toISOString().split('T')[0],
      };
    });

    setStudentsList((prev) => [...prev, ...created]);
    setBulkNamesText('');
    setIsBulkMode(false);
    setErrorNotice('');
  };

  const handleDeleteStudent = (id: string) => {
    setStudentsList((prev) => prev.filter((s) => s.id !== id));
  };

  // Step 4 Action: Connect Student to Specific Class
  const handleAssignStudentToClass = (studentId: string, classId: string) => {
    const selectedClass = classesList.find((c) => c.id === classId);
    setStudentsList((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const fullClassName = selectedClass
            ? selectedClass.gradeLevel
              ? `${selectedClass.gradeLevel} - ${selectedClass.name}`
              : selectedClass.name
            : 'غير مسكن';
          return {
            ...s,
            classId: selectedClass ? selectedClass.id : '',
            className: fullClassName,
          };
        }
        return s;
      })
    );
  };

  // Step 4 Action: Auto Balance Students of a Grade across its available classes
  const handleAutoBalanceGrade = (grade: string) => {
    const gradeClasses = classesList.filter((c) => c.gradeLevel === grade);
    if (gradeClasses.length === 0) return;

    const gradeStudentIndices: number[] = [];
    studentsList.forEach((s, idx) => {
      // Find students who belong to this grade (either matching class or standard grade)
      const matchesGrade =
        classesList.find((c) => c.id === s.classId)?.gradeLevel === grade ||
        (Boolean(s.className) && s.className.includes(grade)) ||
        newStudentGrade === grade;
      if (matchesGrade) {
        gradeStudentIndices.push(idx);
      }
    });

    if (gradeStudentIndices.length === 0) return;

    setStudentsList((prev) => {
      const next = [...prev];
      gradeStudentIndices.forEach((studentIdx, i) => {
        const assignedClass = gradeClasses[i % gradeClasses.length];
        next[studentIdx] = {
          ...next[studentIdx],
          classId: assignedClass.id,
          className: assignedClass.name,
        };
      });
      return next;
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Final Action: Save All and Apply
  const handleFinalSubmit = async () => {
    if (classesList.length === 0) {
      setErrorNotice('تنبيه: يجب إضافة فصل دراسي واحد على الأقل قبل إتمام التهيئة');
      setStep(2);
      return;
    }

    if (studentsList.length === 0) {
      setErrorNotice('تنبيه: يجب تسجيل طالب واحد على الأقل قبل إتمام التهيئة');
      setStep(3);
      return;
    }

    setIsSubmitting(true);
    try {
      // Save persistent data directly to central PostgreSQL
      await saveSetupWizardData(schoolId, {
        themeColor: selectedThemeHex,
        classes: classesList,
        students: studentsList,
      });

      onSaveSuccess(selectedThemeHex);
    } catch (err: any) {
      console.error('Failed to finalize wizard:', err);
      setErrorNotice(err?.message || 'فشل حفظ بيانات التهيئة في قاعدة البيانات المركزية. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-md dir-rtl overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Top Navigation / Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>مركز تهيئة وإعداد بيانات المدرسة</span>
                <span className="text-[10px] bg-blue-500/30 text-blue-300 font-mono font-bold px-2 py-0.5 rounded-full border border-blue-400/30">
                  إعداد دقيق 100%
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تحديد اللون الرسمي، تخصيص الفصول، تسجيل الطلاب، وتسكينهم بدقة متناهية
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 shrink-0">
          <div className="grid grid-cols-4 gap-2 max-w-3xl mx-auto">
            {[
              { num: 1, title: 'اللون والسمة', icon: Palette },
              { num: 2, title: 'إنشاء الصفوف', icon: Building2 },
              { num: 3, title: 'تسجيل الطلاب', icon: Users },
              { num: 4, title: 'تسكين الطلاب', icon: UserCheck },
            ].map((s) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isCompleted = step > s.num;

              return (
                <button
                  key={s.num}
                  onClick={() => {
                    // allow going back or forward if valid
                    setStep(s.num as any);
                  }}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                      isActive
                        ? 'bg-white text-blue-600 font-extrabold'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                  </div>
                  <span className="truncate text-[11px] sm:text-xs">{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Error/Warning Alert */}
        {errorNotice && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-2xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button onClick={() => setErrorNotice('')} className="text-amber-600 hover:text-amber-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Step Frame Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
          {/* ================= STEP 1: THEME COLOR SELECTION ================= */}
          {step === 1 && (
            <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 inline-flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  الخطوة الأولى: الهوية البصرية واللون
                </span>
                <h3 className="text-lg font-bold text-slate-900">اختر اللون الرسمي للوحة إدارة المدرسة</h3>
                <p className="text-xs text-slate-500">
                  سيتم تطبيق السمة الملونة المحددة على الأزرار والبطاقات والشارات في جميع أركان المنصة
                </p>
              </div>

              {/* Theme Color Selection Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {THEME_OPTIONS.map((theme) => {
                  const isSelected = selectedThemeHex === theme.hex;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedThemeHex(theme.hex)}
                      className={`p-4 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-28 ${
                        isSelected
                          ? `bg-slate-900 text-white border-slate-800 ring-2 ${theme.ringClass} shadow-md`
                          : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-6 h-6 rounded-full shadow-inner border border-white/20 ${theme.bgClass}`}
                        />
                        {isSelected && (
                          <span className="p-1 bg-emerald-500 text-white rounded-full">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="font-bold text-xs">{theme.name}</div>
                        <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                          {theme.hex}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Theme Live Preview Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>معاينة حية للون المختار:</span>
                  <span className="text-[11px] font-mono text-slate-500">{selectedThemeHex}</span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-2xs"
                        style={{ backgroundColor: selectedThemeHex }}
                      >
                        م
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">مدرسة النيل النموذجية</div>
                        <div className="text-[10px] text-slate-500">عام دراسي 2025/2026</div>
                      </div>
                    </div>

                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-2xs"
                      style={{ backgroundColor: selectedThemeHex }}
                    >
                      بوابة الإدارة
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex gap-2">
                    <button
                      className="px-3 py-1.5 rounded-lg text-white font-bold text-xs shadow-2xs"
                      style={{ backgroundColor: selectedThemeHex }}
                    >
                      زر رئيسي
                    </button>
                    <button className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200">
                      زر فرعي
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: MANUALLY CREATE CLASSES ================= */}
          {step === 2 && (
            <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 inline-flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  الخطوة الثانية: إنشاء وتعيين الفصول الدراسية
                </span>
                <h3 className="text-lg font-bold text-slate-900">حدد الفصول والمراحل بدقة لمنع التضارب</h3>
                <p className="text-xs text-slate-500">
                  قم باختيار الصف الدراسي ثم اكتب رمز الفصل (مثل: 1/أ أو 1/ب) لإضافته للقائمة
                </p>
              </div>

              {/* Class Creator Form */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-sm">
                <h4 className="font-bold text-xs text-blue-300 flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  إضافة فصل جديد يدويًا:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      الصف / المرحلة الدراسية:
                    </label>
                    <select
                      value={newGradeLevel}
                      onChange={(e) => setNewGradeLevel(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {STANDARD_GRADES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      اسم/رمز الفصل (مثال: أ، ب، 1/أ):
                    </label>
                    <input
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="مثال: أ أو 1/أ"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      رقم القاعة / الغرفة:
                    </label>
                    <input
                      type="text"
                      value={newRoomNumber}
                      onChange={(e) => setNewRoomNumber(e.target.value)}
                      placeholder="101"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      سعة الفصل (طالب):
                    </label>
                    <input
                      type="number"
                      value={newCapacity}
                      onChange={(e) => setNewCapacity(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => handleAddPresetClassesForGrade(newGradeLevel)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>توليد فصلين أ، ب تلقائياً لـ ({newGradeLevel})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddClass}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة الفصل للقائمة</span>
                  </button>
                </div>
              </div>

              {/* Created Classes Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                    <span>الفصول المحددة حاليًا:</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px]">
                      {classesList.length} فصل
                    </span>
                  </h4>

                  {classesList.length === 0 && (
                    <span className="text-xs text-rose-600 font-bold">
                      يرجى إضافة فصل دراسي واحد على الأقل
                    </span>
                  )}
                </div>

                {classesList.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-slate-500 text-xs space-y-2">
                    <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-bold">لم تقم بإنشاء أي فصول دراسية بعد</p>
                    <p className="text-[11px] text-slate-400">
                      استخدم النموذج أعلاه لإضافة الفصول الخاصة بمدرستك يدويًا
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {classesList.map((cls) => (
                      <div
                        key={cls.id}
                        className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between gap-3 group hover:border-blue-300 transition-all"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 truncate">{cls.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>القاعة: {cls.roomNumber}</span>
                            <span>•</span>
                            <span>السعة: {cls.capacity} طالب</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteClass(cls.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                          title="حذف الفصل"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 3: MANUALLY REGISTER STUDENTS ================= */}
          {step === 3 && (
            <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  الخطوة الثالثة: تسجيل وإضافة أسماء الطلاب
                </span>
                <h3 className="text-lg font-bold text-slate-900">أدخل أسماء الطلاب الحقيقيين وتخصصاتهم</h3>
                <p className="text-xs text-slate-500">
                  يمكنك الإضافة طالبًا بطالب، أو استخدام ميزة اللصق السريع لعدة أسماء دفعة واحدة
                </p>
              </div>

              {/* Toggle Input Mode */}
              <div className="flex bg-slate-100 p-1 rounded-2xl max-w-md mx-auto text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setIsBulkMode(false)}
                  className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                    !isBulkMode ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  إضافة طالب فردي
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkMode(true)}
                  className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isBulkMode ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>لصق دفعة أسماء سريعة</span>
                </button>
              </div>

              {/* Input Mode 1: Single Student */}
              {!isBulkMode ? (
                <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-sm">
                  <h4 className="font-bold text-xs text-blue-300 flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    بيانات الطالب الجديد:
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="lg:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        اسم الطالب الثلاثي / الرباعي:
                      </label>
                      <input
                        type="text"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        placeholder="مثال: أحمد محمود علي النجار"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        الصف الدراسي:
                      </label>
                      <select
                        value={newStudentGrade}
                        onChange={(e) => setNewStudentGrade(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {STANDARD_GRADES.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">النوع:</label>
                      <select
                        value={newStudentGender}
                        onChange={(e) => setNewStudentGender(e.target.value as 'ذكر' | 'أنثى')}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ذكر">ذكر</option>
                        <option value="أنثى">أنثى</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddStudent}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة الطالب للقائمة</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Input Mode 2: Bulk Multi-Line Paste */
                <div className="p-5 rounded-2xl bg-blue-950 border border-blue-800 text-white space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-blue-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      إضافة مجموعة أسماء دفعة واحدة:
                    </h4>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-blue-300 font-bold">تحديد الصف للجميع:</span>
                      <select
                        value={newStudentGrade}
                        onChange={(e) => setNewStudentGrade(e.target.value)}
                        className="px-3 py-1 bg-slate-900 border border-blue-700 rounded-xl text-xs font-bold text-white"
                      >
                        {STANDARD_GRADES.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-blue-200 mb-1 font-semibold">
                      اكتب أو الصق قائمة الأسماء هنا (اسم واحد في كل سطر):
                    </label>
                    <textarea
                      rows={5}
                      value={bulkNamesText}
                      onChange={(e) => setBulkNamesText(e.target.value)}
                      placeholder={`أحمد فتحي المغازي\nمحمود صلاح الدين\nياسين طارق العوضي\nعمر محمد عبد الرحمن`}
                      className="w-full p-3 bg-slate-900 border border-blue-700 rounded-xl text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleProcessBulkStudents}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>إدراج كافة الأسماء في القائمة</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Created Students Table View */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                    <span>قائمة الطلاب المسجلين:</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px]">
                      {studentsList.length} طالب
                    </span>
                  </h4>
                </div>

                {studentsList.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-slate-500 text-xs space-y-2">
                    <Users className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-bold">لم تقم بإضافة أي طلاب بعد</p>
                    <p className="text-[11px] text-slate-400">
                      استخدم النموذج المباشر أو خيار اللصق السريع لإضافة طلاب مدرستك
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                      {studentsList.map((std, idx) => (
                        <div
                          key={std.id}
                          className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[11px]">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="font-bold text-slate-900">{std.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                كود الطالب: {std.studentCode || std.id}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                              {std.className !== 'غير مسكن' ? std.className : newStudentGrade}
                            </span>

                            <button
                              onClick={() => handleDeleteStudent(std.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                              title="حذف الطالب"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 4: CONNECT STUDENTS TO CLASS NAMES ================= */}
          {step === 4 && (
            <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  الخطوة الرابعة والنهائية: تسكين وتوصيل الطلاب بالفصول
                </span>
                <h3 className="text-lg font-bold text-slate-900">ربط كل طالب بالفصل الدراسي المحدد له</h3>
                <p className="text-xs text-slate-500">
                  اختر الفصل المناسب لكل طالب من القائمة المنسدلة، أو استخدم الزر لتوزيع تلقائي متوازن
                </p>
              </div>

              {/* Status Summary Widget */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
                  <div className="text-[11px] text-slate-400 font-bold">إجمالي الطلاب</div>
                  <div className="text-xl font-black text-white">{studentsList.length}</div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-800 text-white space-y-1">
                  <div className="text-[11px] text-emerald-300 font-bold">تم تسكينهم بالفصول</div>
                  <div className="text-xl font-black text-emerald-400">
                    {studentsList.filter((s) => s.classId && s.className !== 'غير مسكن').length}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-950 border border-amber-800 text-white space-y-1">
                  <div className="text-[11px] text-amber-300 font-bold">بانتظار التسكين</div>
                  <div className="text-xl font-black text-amber-400">
                    {studentsList.filter((s) => !s.classId || s.className === 'غير مسكن').length}
                  </div>
                </div>
              </div>

              {/* Class Capacity Distribution Monitor */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>إحصائيات استيعاب الفصول الحالية:</span>
                  <span className="text-[11px] text-slate-500 font-mono">{classesList.length} فصل</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {classesList.map((c) => {
                    const assignedCount = studentsList.filter(
                      (s) => s.classId === c.id || s.className === c.name
                    ).length;
                    return (
                      <div
                        key={c.id}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs flex items-center justify-between"
                      >
                        <span className="font-bold text-slate-800 truncate">{c.name}</span>
                        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md text-[11px]">
                          {assignedCount} طالب
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Student to Class Linkage List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-800">توزيع الطلاب وتعيين الفصول:</h4>

                  {/* Auto Balance Button */}
                  <button
                    type="button"
                    onClick={() => {
                      // Auto distribute for all available grades
                      const grades: string[] = Array.from(new Set(classesList.map((c) => c.gradeLevel)));
                      grades.forEach((g) => handleAutoBalanceGrade(g));
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>توزيع تلقائي متوازن لجميع الصفوف</span>
                  </button>
                </div>

                {studentsList.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 text-xs">
                    يرجى العودة للخطوة الثالثة وإضافة طلاب للبدء في تسكينهم
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs divide-y divide-slate-100">
                    {studentsList.map((std, idx) => {
                      const isAssigned = std.classId && std.className !== 'غير مسكن';

                      return (
                        <div
                          key={std.id}
                          className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[11px] shrink-0">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="font-bold text-slate-900">{std.name}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                                <span>الجنس: {std.gender} • التواصل:</span>
                                <PhoneDisplay phone={std.parentPhone} />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            {/* Class Dropdown Selection */}
                            <select
                              value={std.classId || ''}
                              onChange={(e) => handleAssignStudentToClass(std.id, e.target.value)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isAssigned
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                  : 'bg-amber-50 border-amber-300 text-amber-900'
                              }`}
                            >
                              <option value="">-- اختر الفصل للتسكين --</option>
                              {classesList.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.gradeLevel ? `${c.gradeLevel} - ${c.name}` : c.name}
                                </option>
                              ))}
                            </select>

                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                                isAssigned
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isAssigned ? 'تم التسكين' : 'معلق'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Sticky Controls / Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>الخطوة السابقة</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-slate-500 hover:text-slate-800 font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>
            )}
          </div>

          <div>
            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  setErrorNotice('');
                  if (step === 2 && classesList.length === 0) {
                    setErrorNotice('يرجى إضافة فصل دراسي واحد على الأقل قبل الانتقال للخطوة التالية');
                    return;
                  }
                  if (step === 3 && studentsList.length === 0) {
                    setErrorNotice('يرجى تسجيل طالب واحد على الأقل قبل الانتقال للخطوة التالية');
                    return;
                  }
                  setStep((s) => (s + 1) as any);
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>الخطوة التالية</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4.5 h-4.5 text-white" />
                )}
                <span>{isSubmitting ? 'جاري الحفظ في الخادم السحابي...' : 'حفظ وتهيئة بيانات المدرسة بالكامل'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
