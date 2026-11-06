import React, { useState } from 'react';
import { Star, Plus, ThumbsUp, AlertTriangle, X, Trash2, Search } from 'lucide-react';
import { BehaviorRecord, Student } from '../../../types/admin';
import { StudentPicker } from '../common/StudentPicker';

interface AdminBehaviorViewProps {
  schoolId: string;
  students: Student[];
  behavior: BehaviorRecord[];
  onSaveBehavior: (record: BehaviorRecord) => Promise<void> | void;
  onDeleteBehavior: (id: string) => Promise<void> | void;
  onToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export function AdminBehaviorView({
  schoolId,
  students,
  behavior,
  onSaveBehavior,
  onDeleteBehavior,
  onToast,
}: AdminBehaviorViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingBehaviorId, setDeletingBehaviorId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    type: 'إيجابي' as 'إيجابي' | 'سلبي',
    points: 5,
    notes: '',
  });

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      onToast('خطأ بالبيانات', 'يرجى كتابة عنوان الملاحظة السلوكية', 'error');
      return;
    }

    const newRecord: BehaviorRecord = {
      id: `bhv-${schoolId}-${Date.now()}`,
      schoolId,
      studentId: selectedStudentId,
      studentName: selectedStudent?.name || '',
      classId: selectedStudent?.classId || '',
      type: formData.type,
      title: formData.title,
      points: formData.points,
      notes: formData.notes,
      reportedBy: 'إدارة المدرسة / الأخصائي الاجتماعي',
      date: new Date().toISOString().split('T')[0],
    };

    setIsSubmitting(true);
    try {
      await onSaveBehavior(newRecord);
      setIsModalOpen(false);
      onToast(
        formData.type === 'إيجابي' ? 'تم تسجيل تميز سلوكي' : 'تم تسجيل مخالفة سلوكية',
        `الطالب: ${selectedStudent?.name}`,
        formData.type === 'إيجابي' ? 'success' : 'error'
      );
    } catch (err: any) {
      onToast('فشل حفظ السجل السلوكي', err?.message || 'تعذر حفظ السجل في قاعدة البيانات', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900">سجل الانضباط والسلوك المدرسي</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            توثيق الملاحظات الإيجابية والسلبيات بمشاركة الأخصائي الاجتماعي
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({ title: '', type: 'إيجابي', points: 5, notes: '' });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل ملاحظة سلوكية</span>
        </button>
      </div>

      {/* Behavior Timeline Stream */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Star className="w-4 h-4 text-amber-500" />
          <h4 className="font-bold text-xs text-slate-900">
            أحدث السجلات والتحديثات السلوكية ({behavior.length} سجل)
          </h4>
        </div>

        <div className="space-y-3">
          {behavior.length === 0 ? (
            <p className="text-center py-10 text-xs text-slate-400">لا توجد سجلات سلوكية مسجلة حالياً</p>
          ) : (
            behavior.map((bh) => (
              <div
                key={bh.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  bh.type === 'إيجابي'
                    ? 'bg-emerald-50/40 border-emerald-200/80'
                    : 'bg-red-50/40 border-red-200/80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      bh.type === 'إيجابي'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {bh.type === 'إيجابي' ? <ThumbsUp className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{bh.studentName}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          bh.type === 'إيجابي' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {bh.type === 'إيجابي' ? `+${bh.points} تميز` : `-${bh.points} مخالفة`}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 mt-1">{bh.title}</p>
                    {bh.notes && <p className="text-[11px] text-slate-600 mt-0.5">{bh.notes}</p>}
                    <span className="text-[10px] text-slate-400 font-mono block mt-1">
                      مقدم التقرير: {bh.reportedBy} • {bh.date}
                    </span>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    if (confirm('هل تريد حذف هذه الملاحظة السلوكية؟')) {
                      setDeletingBehaviorId(bh.id);
                      try {
                        await onDeleteBehavior(bh.id);
                        onToast('تم حذف السجل السلوكي', '', 'info');
                      } catch (err: any) {
                        onToast('فشل حذف السجل السلوكي', err?.message || 'تعذر حذف السجل من قاعدة البيانات', 'error');
                      } finally {
                        setDeletingBehaviorId(null);
                      }
                    }
                  }}
                  disabled={deletingBehaviorId === bh.id}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer self-end sm:self-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingBehaviorId === bh.id ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Behavior Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">تسجيل ملاحظة سلوكية جديدة</h3>
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
              <StudentPicker
                students={students}
                selectedStudentId={selectedStudentId}
                onSelectStudent={setSelectedStudentId}
                accentColor="blue"
                label="اختر الطالب"
                required
                disabled={isSubmitting}
                idPrefix="behavior-std"
              />

              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع الملاحظة</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setFormData({ ...formData, type: 'إيجابي', points: 5 })}
                    className={`flex-1 py-2 rounded-xl font-bold cursor-pointer transition-all disabled:opacity-60 ${
                      formData.type === 'إيجابي'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    سلوك إيجابي / تميز
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setFormData({ ...formData, type: 'سلبي', points: 3 })}
                    className={`flex-1 py-2 rounded-xl font-bold cursor-pointer transition-all disabled:opacity-60 ${
                      formData.type === 'سلبي'
                        ? 'bg-red-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    مخالفة سلوكية
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان الملاحظة *</label>
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: تفوق في مسابقة الموهوبين / تأخير متكرر"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تفاصيل وملاحظات إضافية</label>
                <textarea
                  rows={3}
                  disabled={isSubmitting}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="اكتب التوصيات والتفاصيل الموثقة..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:opacity-60"
                />
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
                    <span>حفظ السجل</span>
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
