import React, { useState } from 'react';
import { BookOpen, Plus, Edit2, Trash2, X, Award } from 'lucide-react';
import { Subject, Teacher } from '../../../types/admin';

interface AdminSubjectsViewProps {
  schoolId: string;
  subjects: Subject[];
  teachers: Teacher[];
  onSaveSubject: (subject: Subject) => Promise<void> | void;
  onDeleteSubject: (subjectId: string) => Promise<void> | void;
  onToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export function AdminSubjectsView({
  schoolId,
  subjects,
  teachers,
  onSaveSubject,
  onDeleteSubject,
  onToast,
}: AdminSubjectsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: 'AR101',
    gradeLevel: 'الصف الأول الإعدادي',
    maxScore: 100,
    passScore: 50,
    teacherNames: [] as string[],
  });

  const handleOpenCreate = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: `SUB-${Math.floor(100 + Math.random() * 900)}`,
      gradeLevel: 'الصف الأول الإعدادي',
      maxScore: 100,
      passScore: 50,
      teacherNames: [teachers[0]?.name || 'أ. محمد عبد السلام'],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sbj: Subject) => {
    setEditingSubject(sbj);
    setFormData({
      name: sbj.name || '',
      code: sbj.code || '',
      gradeLevel: sbj.gradeLevel || '',
      maxScore: sbj.maxScore ?? 100,
      passScore: sbj.passScore ?? 50,
      teacherNames: sbj.teacherNames || [],
    });
    setIsModalOpen(true);
  };

  const toggleTeacher = (tName: string) => {
    setFormData((prev) => {
      const exists = prev.teacherNames.includes(tName);
      return {
        ...prev,
        teacherNames: exists
          ? prev.teacherNames.filter((t) => t !== tName)
          : [...prev.teacherNames, tName],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      onToast('خطأ بالبيانات', 'يرجى كتابة اسم المادة الدراسية', 'error');
      return;
    }

    const sbjObj: Subject = {
      id: editingSubject ? editingSubject.id : `sbj-${schoolId}-${Date.now()}`,
      schoolId,
      name: formData.name,
      code: formData.code,
      gradeLevel: formData.gradeLevel,
      maxScore: formData.maxScore,
      passScore: formData.passScore,
      teacherNames: formData.teacherNames,
    };

    setIsSubmitting(true);
    try {
      await onSaveSubject(sbjObj);
      setIsModalOpen(false);
      onToast(
        editingSubject ? 'تم تعديل المادة الدراسية' : 'تم إضافة المادة الدراسية',
        `مادة: ${formData.name}`,
        'success'
      );
    } catch (err: any) {
      onToast('فشل حفظ المادة الدراسية', err?.message || 'تعذر حفظ المادة في قاعدة البيانات', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900">المواد والمناهج الدراسية</h3>
          <p className="text-xs text-slate-500 mt-0.5">تحديد الدرجات العظمى ومعلمي المادة المعتمدين</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مادة جديدة</span>
        </button>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((sbj) => (
          <div
            key={sbj.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 font-bold text-sm flex items-center justify-center border border-amber-200/60 shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{sbj.name}</h4>
                    <span className="text-[11px] font-mono text-slate-400 block">{sbj.code}</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-md">
                  {sbj.gradeLevel}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">الدرجة العظمى:</span>
                  <span className="font-bold text-slate-900 font-mono">{sbj.maxScore} درجة</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">درجة النجاح:</span>
                  <span className="font-bold text-emerald-700 font-mono">{sbj.passScore} درجة</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">المعلمون المدرسون:</span>
                <div className="flex flex-wrap gap-1">
                  {sbj.teacherNames && sbj.teacherNames.length > 0 ? (
                    sbj.teacherNames.map((tn, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-50 text-blue-700 border border-blue-200/60 px-2 py-0.5 rounded text-[10px] font-semibold"
                      >
                        {tn}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400">غير مخصص</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1 text-xs">
              <button
                onClick={() => handleOpenEdit(sbj)}
                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                title="تعديل المادة"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={async () => {
                  if (confirm(`هل تريد حذف مادة ${sbj.name}؟`)) {
                    setDeletingSubjectId(sbj.id);
                    try {
                      await onDeleteSubject(sbj.id);
                      onToast('تم حذف المادة', `تم إزالة ${sbj.name}`, 'info');
                    } catch (err: any) {
                      onToast('فشل حذف المادة', err?.message || 'تعذر حذف المادة من قاعدة البيانات', 'error');
                    } finally {
                      setDeletingSubjectId(null);
                    }
                  }
                }}
                disabled={deletingSubjectId === sbj.id}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="حذف المادة"
              >
                {deletingSubjectId === sbj.id ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingSubject ? 'تعديل المادة الدراسية' : 'إضافة مادة جديدة'}
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
                <label className="block font-bold text-slate-700 mb-1">اسم المادة *</label>
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: الرياضيات المتقدمة"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">كود المادة</label>
                  <input
                    type="text"
                    disabled={isSubmitting}
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none uppercase disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المرحلة الدراسية</label>
                  <input
                    type="text"
                    disabled={isSubmitting}
                    value={formData.gradeLevel || ''}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الدرجة العظمى</label>
                  <input
                    type="number"
                    disabled={isSubmitting}
                    value={formData.maxScore ?? 100}
                    onChange={(e) => setFormData({ ...formData, maxScore: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">درجة النجاح</label>
                  <input
                    type="number"
                    disabled={isSubmitting}
                    value={formData.passScore ?? 50}
                    onChange={(e) => setFormData({ ...formData, passScore: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تعيين المعلمين المدرسين:</label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {teachers.map((t) => {
                    const isAssigned = formData.teacherNames.includes(t.name);
                    return (
                      <button
                        type="button"
                        key={t.id}
                        disabled={isSubmitting}
                        onClick={() => toggleTeacher(t.name)}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-bold cursor-pointer transition-all disabled:opacity-60 ${
                          isAssigned
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
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
                    <span>حفظ المادة</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
