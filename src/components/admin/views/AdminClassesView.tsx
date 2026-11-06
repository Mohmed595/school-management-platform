import React, { useState } from 'react';
import { Building2, Plus, Users, Edit2, Trash2, X, Eye } from 'lucide-react';
import { ClassRoom, Teacher, Student } from '../../../types/admin';
import { parseEgyptianClassDetails, ALL_EGYPTIAN_GRADES } from '../../../lib/egyptianSchoolUtils';

interface AdminClassesViewProps {
  schoolId: string;
  classes: ClassRoom[];
  teachers: Teacher[];
  students: Student[];
  onSaveClass: (classRoom: ClassRoom) => Promise<void> | void;
  onDeleteClass: (classId: string) => Promise<void> | void;
  onToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export function AdminClassesView({
  schoolId,
  classes,
  teachers,
  students,
  onSaveClass,
  onDeleteClass,
  onToast,
}: AdminClassesViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [viewingStudentsClass, setViewingStudentsClass] = useState<ClassRoom | null>(null);

  const [formData, setFormData] = useState({
    name: '1/1',
    gradeLevel: 'الصف الأول الإعدادي',
    roomNumber: '101',
    capacity: 35,
    headTeacherName: teachers[0]?.name || '',
  });

  const handleOpenCreate = () => {
    setEditingClass(null);
    setFormData({
      name: '1/1',
      gradeLevel: 'الصف الأول الإعدادي',
      roomNumber: `${Math.floor(100 + Math.random() * 400)}`,
      capacity: 35,
      headTeacherName: teachers[0]?.name || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassRoom) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name || '1/1',
      gradeLevel: cls.gradeLevel || 'الصف الأول الإعدادي',
      roomNumber: cls.roomNumber || '',
      capacity: cls.capacity || 35,
      headTeacherName: cls.headTeacherName || teachers[0]?.name || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      onToast('خطأ بالبيانات', 'يرجى كتابة اسم الفصل', 'error');
      return;
    }

    const details = parseEgyptianClassDetails(formData.gradeLevel, formData.name);

    const classObj: ClassRoom = {
      id: editingClass ? editingClass.id : `cls-${schoolId}-${Date.now()}`,
      schoolId,
      name: details.formattedClassName,
      gradeLevel: formData.gradeLevel,
      stage: details.stage,
      grade: details.grade,
      class_number: details.class_number,
      roomNumber: formData.roomNumber,
      capacity: formData.capacity,
      studentCount: editingClass ? editingClass.studentCount : 0,
      headTeacherName: formData.headTeacherName,
    };

    setIsSubmitting(true);
    try {
      await onSaveClass(classObj);
      setIsModalOpen(false);
      onToast(
        editingClass ? 'تم تعديل الفصل' : 'تم إضافة الفصل بنجاح',
        `الفصل: ${details.formattedClassName}`,
        'success'
      );
    } catch (err: any) {
      onToast('فشل حفظ الفصل', err?.message || 'تعذر حفظ بيانات الفصل في قاعدة البيانات', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const unassignedStudents = students.filter(
    (s) => s.isClassAssigned === false || !s.classId || !classes.some((c) => c.id === s.classId || c.name === s.className)
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900">الفصول القائمة بالمدرسة</h3>
          <p className="text-xs text-slate-500 mt-0.5">توزيع الطلاب والقاعات مع رواد الفصول ({classes.length} فصل)</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء فصل جديد</span>
        </button>
      </div>

      {/* Unassigned Students Info Banner */}
      {unassignedStudents.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
              ⚡
            </div>
            <div>
              <h4 className="text-xs font-black text-amber-950">
                يوجد {unassignedStudents.length} طلاب بانتظار التسكين في فصولهم
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                سيتمكن معلم الحضور من اختيار فصولهم وتسكينهم تلقائياً لمرة واحدة في أول جلسة حضور لليوم، أو يمكنك تعديل فصل أي طالب في شاشة الطلاب.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-900 bg-white/80 px-3 py-1.5 rounded-xl border border-amber-200 shrink-0">
            {unassignedStudents.length} طالب جديد
          </span>
        </div>
      )}

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => {
          const enrolledStudents = students.filter((s) => s.classId === cls.id);
          const studentCount = enrolledStudents.length || cls.studentCount || 0;

          return (
            <div
              key={cls.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center border border-indigo-200/60 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{cls.name}</h4>
                      <span className="text-[11px] text-slate-500 font-medium block">
                        المرحلة: {cls.gradeLevel}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-lg">
                    قاعة {cls.roomNumber}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span>رائد الفصل:</span>
                    <span className="font-bold text-slate-900">
                      {cls.headTeacherName || 'غير معين'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span>عدد الطلاب المقيدين:</span>
                    <span className="font-bold text-blue-600 font-mono">
                      {studentCount} / {cls.capacity}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => setViewingStudentsClass(cls)}
                  className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-xs cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>عرض قائمة الطلاب ({studentCount})</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(cls)}
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                    title="تعديل الفصل"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`هل تريد حذف ${cls.name}؟`)) {
                        setDeletingClassId(cls.id);
                        try {
                          await onDeleteClass(cls.id);
                          onToast('تم حذف الفصل', `تم إزالة ${cls.name}`, 'info');
                        } catch (err: any) {
                          onToast('فشل حذف الفصل', err?.message || 'تعذر حذف الفصل من قاعدة البيانات', 'error');
                        } finally {
                          setDeletingClassId(null);
                        }
                      }
                    }}
                    disabled={deletingClassId === cls.id}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="حذف الفصل"
                  >
                    {deletingClassId === cls.id ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingClass ? 'تعديل بيانات الفصل' : 'إنشاء فصل جديد'}
              </h3>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الصف / المرحلة الدراسية</label>
                <select
                  disabled={isSubmitting}
                  value={formData.gradeLevel || 'الصف الأول الإعدادي'}
                  onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold disabled:opacity-60"
                >
                  {ALL_EGYPTIAN_GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رمز/اسم الفصل (مثل 1/1 أو 1/2) *</label>
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: 1/1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono font-bold disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم القاعة</label>
                  <input
                    type="text"
                    disabled={isSubmitting}
                    value={formData.roomNumber || ''}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">السعة القصوى</label>
                  <input
                    type="number"
                    disabled={isSubmitting}
                    value={formData.capacity ?? 35}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رائد الفصل (المعلم المسئول)</label>
                <select
                  disabled={isSubmitting}
                  value={formData.headTeacherName || ''}
                  onChange={(e) => setFormData({ ...formData, headTeacherName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer disabled:opacity-60"
                >
                  <option value="">بدون رائد فصل</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <span>حفظ الفصل</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Enrolled Students Modal */}
      {viewingStudentsClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-base text-slate-900">
                طلاب فصل: {viewingStudentsClass.name}
              </h3>
              <button
                onClick={() => setViewingStudentsClass(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 p-1">
              {students.filter((s) => s.classId === viewingStudentsClass.id).length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">
                  لا يوجد طلاب مضافين لهذا الفصل حالياً
                </p>
              ) : (
                students
                  .filter((s) => s.classId === viewingStudentsClass.id)
                  .map((s, idx) => (
                    <div
                      key={s.id}
                      className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-900">{s.name}</span>
                      </div>
                      <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-bold">{s.studentCode || s.id}</span>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setViewingStudentsClass(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
