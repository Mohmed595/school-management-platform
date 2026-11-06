import React, { useState, useEffect, useMemo } from 'react';
import {
  FileWarning,
  Plus,
  Search,
  Calendar,
  Clock,
  AlertTriangle,
  User,
  Users,
  CheckCircle2,
  Trash2,
  X,
  MapPin,
  Send,
  Eye,
  Filter,
  UserCheck,
  UserX,
  FileText,
  Building,
  RefreshCw,
  Sparkles,
  Info,
} from 'lucide-react';
import { TeacherPortalData } from '../../types/teacher';
import { Student, ClassRoom } from '../../types/admin';
import {
  InfractionMemo,
  InfractionStudent,
  InfractionUrgency,
  InfractionRequestedAction,
} from '../../types/infraction';
import {
  getAllInfractionMemos,
  fetchAndSyncInfractionMemos,
  createInfractionMemo,
  deleteInfractionMemo,
} from '../../lib/infractionStorage';
import { playSoftClickSound } from '../../lib/sound';

interface TeacherInfractionsViewProps {
  data: TeacherPortalData;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function TeacherInfractionsView({ data, addToast }: TeacherInfractionsViewProps) {
  const [memos, setMemos] = useState<InfractionMemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingMemo, setViewingMemo] = useState<InfractionMemo[] | null>(null);
  const [selectedMemoForDetails, setSelectedMemoForDetails] = useState<InfractionMemo | null>(null);

  // Form State
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<InfractionStudent[]>([]);
  const [reason, setReason] = useState('');
  const [location, setLocation] = useState('الفصل الدراسي');
  const [urgency, setUrgency] = useState<InfractionUrgency>('عادي');
  const [requestedAction, setRequestedAction] = useState<InfractionRequestedAction>('اتخاذ اللازم');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load memos
  const loadMemos = async () => {
    setLoading(true);
    try {
      const all = await fetchAndSyncInfractionMemos(data.schoolId);
      // Filter for this teacher
      setMemos(all.filter((m) => m.teacherId === data.teacher.id));
    } catch {
      const local = getAllInfractionMemos(data.schoolId);
      setMemos(local.filter((m) => m.teacherId === data.teacher.id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemos();
  }, [data.schoolId, data.teacher.id]);

  // Candidate students pool: teacher's assigned students or all students
  const availableStudents: Student[] = useMemo(() => {
    return data.assignedStudents || [];
  }, [data.assignedStudents]);

  // Filtered students for picker
  const filteredStudentsForPicker = useMemo(() => {
    return availableStudents.filter((s) => {
      // Class filter
      if (selectedClassId !== 'all') {
        const matchesClass = s.classId === selectedClassId || s.className === selectedClassId;
        if (!matchesClass) return false;
      }
      // Search term
      if (!studentSearchTerm.trim()) return true;
      const q = studentSearchTerm.trim().toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.className && s.className.toLowerCase().includes(q)) ||
        (s.studentCode && s.studentCode.toLowerCase().includes(q))
      );
    });
  }, [availableStudents, selectedClassId, studentSearchTerm]);

  // Toggle student selection
  const handleToggleStudent = (student: Student) => {
    playSoftClickSound();
    const isSelected = selectedStudents.some((s) => s.studentId === student.id);
    if (isSelected) {
      setSelectedStudents((prev) => prev.filter((s) => s.studentId !== student.id));
    } else {
      setSelectedStudents((prev) => [
        ...prev,
        {
          studentId: student.id,
          studentName: student.name,
          classId: student.classId,
          className: student.className,
          nationalId: student.nationalId,
          studentCode: student.studentCode,
        },
      ]);
    }
  };

  // Submit new memo
  const handleSubmitMemo = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (selectedStudents.length === 0) {
      setFormError('يرجى اختيار طالب واحد على الأقل لكتابة المذكرة');
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      setFormError('يرجى كتابة سبب المذكرة وتفاصيل الواقعة بشكل واضح (5 أحرف على الأقل)');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

      await createInfractionMemo({
        schoolId: data.schoolId,
        teacherId: data.teacher.id,
        teacherName: `أستاذ/ة ${data.teacher.name}`,
        subjectName: data.teacher.specialization || undefined,
        date: dateStr,
        time: timeStr,
        students: selectedStudents,
        reason: reason.trim(),
        location: location.trim() || 'الفصل الدراسي',
        urgency,
        requestedAction,
      });

      playSoftClickSound();
      addToast('تم إرسال مذكرة المشاغبة لإدارة المدرسة بنجاح 📋', 'success');
      setIsAddModalOpen(false);
      // Reset form
      setSelectedStudents([]);
      setReason('');
      setLocation('الفصل الدراسي');
      setUrgency('عادي');
      setRequestedAction('اتخاذ اللازم');
      loadMemos();
    } catch (err: any) {
      setFormError(err?.message || 'حدث خطأ أثناء حفظ المذكرة');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete memo
  const handleDeleteMemo = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه المذكرة؟')) return;
    try {
      await deleteInfractionMemo(data.schoolId, id);
      addToast('تم حذف المذكرة بنجاح', 'info');
      loadMemos();
    } catch {
      addToast('فشل حذف المذكرة', 'error');
    }
  };

  // Filtered memos for log
  const filteredMemos = useMemo(() => {
    return memos.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      const matchReason = m.reason.toLowerCase().includes(q);
      const matchStudent = m.students.some((s) => s.studentName.toLowerCase().includes(q));
      return matchReason || matchStudent;
    });
  }, [memos, statusFilter, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: memos.length,
      pending: memos.filter((m) => m.status === 'قيد المراجعة').length,
      summons: memos.filter((m) => m.status === 'تم استدعاء ولي أمر').length,
      suspension: memos.filter((m) => m.status === 'تم الفصل المؤقت').length,
      skipped: memos.filter((m) => m.status === 'تم الحفظ والتخطي').length,
    };
  }, [memos]);

  return (
    <div className="space-y-4 pb-16 lg:pb-6 dir-rtl select-none font-sans">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 shadow-2xs">
            <FileWarning className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>سجل المشاغبات والمذكرات السلوكية</span>
              <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                مذكرة إحالة
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              رفع مذكرات فورية لإدارة المدرسة بشأن وقائع سوء السلوك ومتابعة القرارات الإدارية المتخذة
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            playSoftClickSound();
            setIsAddModalOpen(true);
          }}
          className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مذكرة جديدة</span>
        </button>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-xs'
              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">إجمالي المذكرات</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-black mt-1">{counts.all}</p>
        </div>

        <div
          onClick={() => setStatusFilter('قيد المراجعة')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'قيد المراجعة'
              ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-xs'
              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">قيد المراجعة</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black mt-1 text-amber-600">{counts.pending}</p>
        </div>

        <div
          onClick={() => setStatusFilter('تم استدعاء ولي أمر')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'تم استدعاء ولي أمر'
              ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-xs'
              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">استدعاء ولي أمر</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-black mt-1 text-blue-600">{counts.summons}</p>
        </div>

        <div
          onClick={() => setStatusFilter('تم الفصل المؤقت')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'تم الفصل المؤقت'
              ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-xs'
              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">فصل مؤقت</span>
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-black mt-1 text-rose-600">{counts.suspension}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث باسم الطالب أو نص الواقعة..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:border-blue-500 cursor-pointer"
          >
            <option value="all">جميع الحالات</option>
            <option value="قيد المراجعة">قيد المراجعة الإدارية</option>
            <option value="تم استدعاء ولي أمر">تم استدعاء ولي أمر</option>
            <option value="تم الفصل المؤقت">تم الفصل المؤقت</option>
            <option value="تم الحفظ والتخطي">تم الحفظ والتخطي</option>
          </select>

          <button
            onClick={loadMemos}
            title="تحديث السجل"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer shrink-0 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Memos List / Log */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-rose-500 mb-2" />
          <p className="text-xs font-bold">جاري تحميل مذكرات المشاغبات...</p>
        </div>
      ) : filteredMemos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400">
          <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <FileWarning className="w-8 h-8 stroke-1 text-slate-300" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-700">لا توجد مذكرات مشاغبة مسجلة</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'لم يتم العثور على مذكرات مطابقة لبحثك'
              : 'عند حدوث أي واقعة سوء سلوك، يمكنك الضغط على "إضافة مذكرة جديدة" لإحالتها فوراً للإدارة.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredMemos.map((memo) => {
            const isPending = memo.status === 'قيد المراجعة';
            const isSummons = memo.status === 'تم استدعاء ولي أمر';
            const isSuspension = memo.status === 'تم الفصل المؤقت';
            const isDismissed = memo.status === 'تم الحفظ والتخطي';

            const urgencyBadge = {
              عادي: 'bg-slate-100 text-slate-700 border-slate-200',
              عاجل: 'bg-amber-100 text-amber-800 border-amber-200',
              طارئ: 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse',
            }[memo.urgency || 'عادي'];

            const statusBadge = isPending
              ? { bg: 'bg-amber-50 text-amber-800 border-amber-200', text: 'قيد مراجعة الإدارة' }
              : isSummons
              ? { bg: 'bg-blue-50 text-blue-800 border-blue-200', text: 'تم استدعاء ولي الأمر' }
              : isSuspension
              ? { bg: 'bg-rose-50 text-rose-800 border-rose-200', text: 'تم الفصل المؤقت' }
              : { bg: 'bg-slate-100 text-slate-700 border-slate-200', text: 'تم الحفظ والتخطي' };

            return (
              <div
                key={memo.id}
                className={`bg-white rounded-3xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  isPending
                    ? 'border-amber-300 ring-2 ring-amber-100/70'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Pending Status Accent Top Bar */}
                {isPending && (
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-1.5 text-white flex items-center justify-between text-xs font-black">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 animate-spin text-amber-200" />
                      <span>قيد المراجعة لدى إدارة المدرسة</span>
                    </span>
                    <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                      بانتظار الإجراء
                    </span>
                  </div>
                )}

                <div className="p-4 sm:p-5">
                  {/* Top Header of Card */}
                  <div className="flex items-start justify-between gap-2 pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs ${statusBadge.bg}`}>
                        {statusBadge.text}
                      </span>
                      <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs ${urgencyBadge}`}>
                        {memo.urgency || 'عادي'}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{memo.location || 'الفصل'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-400 font-medium shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{memo.date}</span>
                      {memo.time && <span>• {memo.time}</span>}
                    </div>
                  </div>

                  {/* Students involved */}
                  <div className="mt-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span>الطلاب المعنيون بالمذكرة</span>
                        <span className="bg-slate-100 text-slate-700 text-[11px] font-extrabold px-2 py-0.2 rounded-full border border-slate-200">
                          {memo.students?.length || 0}
                        </span>
                      </span>

                      {memo.requestedAction && (
                        <div className="text-[11px] font-bold text-slate-600 bg-rose-50/80 border border-rose-200/70 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                          <span className="text-slate-500">طلبك:</span>
                          <span className="text-rose-700 font-black">{memo.requestedAction}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {memo.students?.map((s) => (
                        <div
                          key={s.studentId}
                          className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-black text-slate-800 shadow-2xs transition-colors"
                        >
                          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <User className="w-3 h-3" />
                          </div>
                          <span>{s.studentName}</span>
                          {s.className && (
                            <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">
                              {s.className}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Incident Reason Box */}
                  <div className="mt-3.5 bg-slate-50/90 border-r-4 border-r-rose-500 border border-slate-200/80 rounded-2xl p-3.5">
                    <div className="flex items-center justify-between mb-1.5 text-[11px] font-black text-slate-500">
                      <span>تفاصيل المشاغبة وسلوك الطلاب:</span>
                      <span className="text-[10px] text-slate-400 font-mono">#{memo.id.slice(0, 8)}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed whitespace-pre-wrap">
                      {memo.reason}
                    </p>
                  </div>

                  {/* Administration Decision Feedback Banner */}
                  {memo.adminDecision && (
                    <div className="mt-3.5 p-3.5 rounded-2xl border bg-slate-50 border-slate-200/90 text-xs">
                      <div className="flex items-center justify-between font-black text-slate-900 mb-2">
                        <span className="flex items-center gap-2">
                          {isSummons && <UserCheck className="w-4 h-4 text-blue-600" />}
                          {isSuspension && <UserX className="w-4 h-4 text-rose-600" />}
                          {isDismissed && <CheckCircle2 className="w-4 h-4 text-slate-600" />}
                          <span className="text-xs font-black">قرار الإدارة: {statusBadge.text}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold">
                          اعتماد: {memo.adminDecision.decisionDate}
                        </span>
                      </div>

                      {memo.adminDecision.summonsDate && (
                        <div className="text-xs font-bold text-blue-900 bg-blue-50/90 p-2.5 rounded-xl border border-blue-200 my-1.5 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>
                            موعد الحضور: <strong>{memo.adminDecision.summonsDate}</strong> الساعة <strong>{memo.adminDecision.summonsTime || '10:00 ص'}</strong>
                          </span>
                        </div>
                      )}

                      {memo.adminDecision.suspensionStartDate && (
                        <div className="text-xs font-bold text-rose-900 bg-rose-50/90 p-2.5 rounded-xl border border-rose-200 my-1.5 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            فترة الإيقاف: من <strong>{memo.adminDecision.suspensionStartDate}</strong> إلى <strong>{memo.adminDecision.suspensionEndDate || 'إشعار آخر'}</strong>
                          </span>
                        </div>
                      )}

                      {memo.adminDecision.decisionNotes && (
                        <p className="text-xs text-slate-600 mt-1.5 italic bg-white p-2 rounded-lg border border-slate-100">
                          توجيه الإدارة: "{memo.adminDecision.decisionNotes}"
                        </p>
                      )}
                    </div>
                  )}

                  {isPending && (
                    <div className="mt-3.5 p-3 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-center gap-2.5 text-xs font-black text-amber-900">
                      <Clock className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
                      <span>المذكرة قيد المراجعة لدى إدارة المدرسة لاتخاذ الإجراء الإداري الرسمي.</span>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-bold">
                    معرف المذكرة: <span className="font-mono text-slate-600 font-normal">#{memo.id.slice(0, 8)}</span>
                  </span>

                  {isPending ? (
                    <button
                      onClick={() => handleDeleteMemo(memo.id)}
                      className="text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer font-bold border border-slate-200/80 hover:border-rose-200 shadow-2xs"
                      title="سحب أو إلغاء المذكرة"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>سحب المذكرة</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      تم الحسم
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD INFRACTION MEMO (إضافة مذكرة جديدة)             */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in dir-rtl">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-600 to-rose-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                  <FileWarning className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black">تحرير مذكرة مشاغبة جديدة</h2>
                  <p className="text-[11px] text-rose-100 mt-0.5">
                    إحالة واقعة سوء سلوك إلى إدارة المدرسة لاتخاذ الإجراء المناسب
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitMemo} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Step 1: Select Students (Multi-selection) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-rose-600" />
                    <span>تحديد الطلاب المعنيين بالواقعة *</span>
                  </label>
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                    تم اختيار: {selectedStudents.length} طلاب
                  </span>
                </div>

                {/* Selected Students Chips */}
                {selectedStudents.length > 0 && (
                  <div className="mb-2 p-2 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {selectedStudents.map((s) => (
                      <span
                        key={s.studentId}
                        className="inline-flex items-center gap-1.5 bg-rose-600 text-white text-xs font-extrabold px-2.5 py-1 rounded-lg shadow-2xs animate-fade-in"
                      >
                        <span>{s.studentName}</span>
                        {s.className && <span className="text-[10px] opacity-80 font-normal">({s.className})</span>}
                        <button
                          type="button"
                          onClick={() => {
                            playSoftClickSound();
                            setSelectedStudents((prev) => prev.filter((item) => item.studentId !== s.studentId));
                          }}
                          className="hover:bg-white/20 rounded-full p-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick Filters for Picking */}
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      placeholder="ابحث باسم الطالب لاختياره..."
                      className="w-full pr-8 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-rose-500 focus:bg-white"
                    />
                  </div>

                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="all">جميع الفصول المكلف بها</option>
                    {data.assignedClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Student Checkbox List */}
                <div className="border border-slate-200 rounded-2xl p-2 max-h-40 overflow-y-auto bg-slate-50/50 space-y-1">
                  {filteredStudentsForPicker.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-4">لم يتم العثور على طلاب مطابقين</p>
                  ) : (
                    filteredStudentsForPicker.map((std) => {
                      const isChecked = selectedStudents.some((s) => s.studentId === std.id);
                      return (
                        <div
                          key={std.id}
                          onClick={() => handleToggleStudent(std)}
                          className={`p-2 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-rose-50 border border-rose-200 text-rose-900 font-bold'
                              : 'hover:bg-white text-slate-700 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-4 h-4 text-rose-600 rounded-md border-slate-300 focus:ring-rose-500 pointer-events-none"
                            />
                            <span>{std.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">
                            {std.className || 'غير محدد'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Step 2: Reason & Description */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  تفاصيل الواقعة وسبب المذكرة *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="اكتب بالتفصيل ما قام به الطالب/الطلاب من شغب، تجاوز، أو عدم التزام..."
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-rose-500 focus:bg-white resize-none leading-relaxed"
                />
              </div>

              {/* Step 3: Location, Urgency, Requested Action */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1.5">موقع الواقعة</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-rose-500 cursor-pointer"
                  >
                    <option value="الفصل الدراسي">الفصل الدراسي</option>
                    <option value="المعمل المدرسي">المعمل المدرسي</option>
                    <option value="فناء المدرسة / الطابور">فناء المدرسة / الطابور</option>
                    <option value="المكتبة">المكتبة</option>
                    <option value="طرقات المدرسة">طرقات المدرسة</option>
                    <option value="أخرى">مكان آخر</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1.5">درجة الاستعجال</label>
                  <div className="flex gap-1.5">
                    {(['عادي', 'عاجل', 'طارئ'] as InfractionUrgency[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          playSoftClickSound();
                          setUrgency(lvl);
                        }}
                        className={`flex-1 py-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                          urgency === lvl
                            ? lvl === 'طارئ'
                              ? 'bg-rose-600 text-white border-rose-600'
                              : lvl === 'عاجل'
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Requested Action */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  الإجراء المقترح لإدارة المدرسة
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'استدعاء ولي أمر', label: 'استدعاء ولي أمر', icon: UserCheck },
                    { id: 'طرد مؤقت', label: 'طرد / فصل مؤقت', icon: UserX },
                    { id: 'اتخاذ اللازم', label: 'تحويل للإدارة', icon: Building },
                  ].map((act) => {
                    const Icon = act.icon;
                    const isSelected = requestedAction === act.id;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => {
                          playSoftClickSound();
                          setRequestedAction(act.id as InfractionRequestedAction);
                        }}
                        className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-50 border-rose-500 text-rose-900 font-black shadow-xs ring-2 ring-rose-200'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-rose-600' : 'text-slate-400'}`} />
                        <span className="text-[11px]">{act.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5 rotate-180" />
                  <span>{isSubmitting ? 'جاري الإرسال...' : 'إرسال المذكرة للإدارة'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
