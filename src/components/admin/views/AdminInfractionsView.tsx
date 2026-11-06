import React, { useState, useEffect, useMemo } from 'react';
import {
  FileWarning,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
  XCircle,
  MapPin,
  RefreshCw,
  Building,
  GraduationCap,
  MessageSquare,
  ShieldAlert,
  Send,
  X,
  Check,
  Sparkles,
  Info,
  Archive,
} from 'lucide-react';
import { Student, ClassRoom } from '../../../types/admin';
import {
  InfractionMemo,
  InfractionDecision,
} from '../../../types/infraction';
import {
  getAllInfractionMemos,
  fetchAndSyncInfractionMemos,
  decideInfractionMemo,
  deleteInfractionMemo,
} from '../../../lib/infractionStorage';
import { playSoftClickSound } from '../../../lib/sound';

interface AdminInfractionsViewProps {
  schoolId: string;
  students: Student[];
  classes: ClassRoom[];
  onToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export function AdminInfractionsView({
  schoolId,
  students,
  classes,
  onToast,
}: AdminInfractionsViewProps) {
  const [memos, setMemos] = useState<InfractionMemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');

  // Decision Modal State
  const [selectedMemo, setSelectedMemo] = useState<InfractionMemo | null>(null);
  const [decisionType, setDecisionType] = useState<'parent_summons' | 'temporary_suspension' | 'skip' | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [summonsDate, setSummonsDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [summonsTime, setSummonsTime] = useState('10:00 صباحاً');
  const [suspensionStartDate, setSuspensionStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [suspensionEndDate, setSuspensionEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Load memos
  const loadMemos = async () => {
    setLoading(true);
    try {
      const all = await fetchAndSyncInfractionMemos(schoolId);
      setMemos(all);
    } catch {
      setMemos(getAllInfractionMemos(schoolId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemos();
  }, [schoolId]);

  // Open Decision Modal
  const openDecisionModal = (
    memo: InfractionMemo,
    type: 'parent_summons' | 'temporary_suspension' | 'skip'
  ) => {
    playSoftClickSound();
    setSelectedMemo(memo);
    setDecisionType(type);
    if (type === 'parent_summons') {
      setDecisionNotes('استدعاء ولي الأمر لمناقشة واقعة الشغب والتعهد بعدم التكرار');
    } else if (type === 'temporary_suspension') {
      setDecisionNotes('فصل مؤقت عن المدرسة نظراً لجسامة المخالفة ولإعادة الانضباط المدرسي');
    } else {
      setDecisionNotes('تم الاكتفاء بالتنبيه الشفهي وأخذ تعهد بعدم التكرار داخل الفصل');
    }
  };

  // Submit Decision
  const handleConfirmDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemo || !decisionType) return;

    setIsSubmittingDecision(true);
    try {
      await decideInfractionMemo(schoolId, selectedMemo.id, {
        actionType: decisionType,
        decisionNotes: decisionNotes.trim(),
        decidedBy: 'إدارة المدرسة',
        summonsDate: decisionType === 'parent_summons' ? summonsDate : undefined,
        summonsTime: decisionType === 'parent_summons' ? summonsTime : undefined,
        startDate: decisionType === 'temporary_suspension' ? suspensionStartDate : undefined,
        endDate: decisionType === 'temporary_suspension' ? suspensionEndDate : undefined,
      });

      playSoftClickSound();
      const actionName =
        decisionType === 'parent_summons'
          ? 'استدعاء ولي أمر'
          : decisionType === 'temporary_suspension'
          ? 'طرد مؤقت'
          : 'تخطي وحفظ المذكرة';
      onToast('تم اتخاذ الإجراء بنجاح 📋', `تم تطبيق: ${actionName}`, 'success');

      setSelectedMemo(null);
      setDecisionType(null);
      loadMemos();
    } catch (err: any) {
      onToast('خطأ', err?.message || 'فشل تسجيل القرار', 'error');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // Filtered memos
  const filteredMemos = useMemo(() => {
    return memos.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (urgencyFilter !== 'all' && m.urgency !== urgencyFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      const matchTeacher = m.teacherName.toLowerCase().includes(q);
      const matchReason = m.reason.toLowerCase().includes(q);
      const matchStudent = m.students.some((s) => s.studentName.toLowerCase().includes(q));
      return matchTeacher || matchReason || matchStudent;
    });
  }, [memos, statusFilter, urgencyFilter, searchQuery]);

  // Statistics
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
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 shadow-2xs">
            <FileWarning className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>مذكرات المشاغبات وقرارات الإدارة</span>
              {counts.pending > 0 && (
                <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">
                  {counts.pending} مذكرة جديدة قيد المراجعة
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              مراجعة مذكرات المشاغبة المحالة من المعلمين واتخاذ قرارات الاستدعاء، الفصل المؤقت، أو التخطي
            </p>
          </div>
        </div>

        <button
          onClick={loadMemos}
          className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث السجل</span>
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-xs'
              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">إجمالي المذكرات</span>
            <Building className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black mt-1">{counts.all}</p>
        </div>

        <div
          onClick={() => setStatusFilter('قيد المراجعة')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'قيد المراجعة'
              ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs ring-2 ring-amber-200'
              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">قيد المراجعة (جديدة)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black mt-1 text-amber-600">{counts.pending}</p>
        </div>

        <div
          onClick={() => setStatusFilter('تم استدعاء ولي أمر')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'تم استدعاء ولي أمر'
              ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-xs'
              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">استدعاء ولي أمر</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black mt-1 text-blue-600">{counts.summons}</p>
        </div>

        <div
          onClick={() => setStatusFilter('تم الفصل المؤقت')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'تم الفصل المؤقت'
              ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-xs'
              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">فصل مؤقت</span>
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black mt-1 text-rose-600">{counts.suspension}</p>
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
            placeholder="البحث باسم المعلم، الطالب، أو نص الواقعة..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:border-amber-500 cursor-pointer"
          >
            <option value="all">جميع الحالات</option>
            <option value="قيد المراجعة">قيد المراجعة الإدارية (جديدة)</option>
            <option value="تم استدعاء ولي أمر">تم استدعاء ولي أمر</option>
            <option value="تم الفصل المؤقت">تم الفصل المؤقت</option>
            <option value="تم الحفظ والتخطي">تم الحفظ والتخطي</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:border-amber-500 cursor-pointer"
          >
            <option value="all">جميع درجات الاستعجال</option>
            <option value="طارئ">طارئ</option>
            <option value="عاجل">عاجل</option>
            <option value="عادي">عادي</option>
          </select>
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-amber-500 mb-2" />
          <p className="text-xs font-bold">جاري تحميل مذكرات المشاغبات...</p>
        </div>
      ) : filteredMemos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400">
          <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <CheckCircle2 className="w-8 h-8 stroke-1 text-emerald-500" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-700">لا توجد مذكرات مشاغبة حالياً</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all' || urgencyFilter !== 'all'
              ? 'لم يتم العثور على مذكرات تطابق شروط الفلترة المحددة'
              : 'جميع الفصول هادئة ولم يتم إرسال أي مذكرات جديدة من المعلمين.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {filteredMemos.map((memo) => {
            const isPending = memo.status === 'قيد المراجعة';
            const isSummons = memo.status === 'تم استدعاء ولي أمر';
            const isSuspension = memo.status === 'تم الفصل المؤقت';
            const isDismissed = memo.status === 'تم الحفظ والتخطي';

            const urgencyBadge = {
              عادي: 'bg-slate-100 text-slate-700 border-slate-200',
              عاجل: 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold',
              طارئ: 'bg-rose-100 text-rose-800 border-rose-300 font-black animate-pulse',
            }[memo.urgency || 'عادي'];

            const statusBadge = isPending
              ? { bg: 'bg-amber-100 text-amber-900 border-amber-300 font-black', text: 'وارد جديد - قيد المراجعة' }
              : isSummons
              ? { bg: 'bg-blue-50 text-blue-800 border-blue-200 font-bold', text: 'تم استدعاء ولي أمر' }
              : isSuspension
              ? { bg: 'bg-rose-50 text-rose-800 border-rose-200 font-bold', text: 'تم الفصل المؤقت' }
              : { bg: 'bg-slate-100 text-slate-700 border-slate-200 font-bold', text: 'تم الحفظ والتخطي' };

            return (
              <div
                key={memo.id}
                className={`bg-white rounded-3xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  isPending
                    ? 'border-amber-300 ring-2 ring-amber-100/80 shadow-amber-500/5'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Pending Status Accent Top Bar */}
                {isPending && (
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-1.5 text-white flex items-center justify-between text-xs font-black">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 animate-spin text-amber-200" />
                      <span>مذكرة جديدة • بانتظار قرار الإدارة</span>
                    </span>
                    <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                      واردة من المعلم
                    </span>
                  </div>
                )}

                <div className="p-4 sm:p-5">
                  {/* Card Header: Teacher Information & Incident Metadata */}
                  <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-black shrink-0 shadow-2xs">
                        <GraduationCap className="w-5 h-5 text-slate-700" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-slate-900 truncate">
                            {memo.teacherName}
                          </h3>
                          {memo.subjectName && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                              {memo.subjectName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-semibold">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{memo.location || 'الفصل الدراسي'}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-medium text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{memo.date}</span>
                            {memo.time && <span>({memo.time})</span>}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs ${urgencyBadge}`}>
                        {memo.urgency || 'عادي'}
                      </span>
                      {!isPending && (
                        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusBadge.bg}`}>
                          {statusBadge.text}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Students In Memo Section */}
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
                        <div className="text-[11px] font-bold text-slate-600 bg-rose-50/80 border border-rose-200/70 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <span className="text-slate-500">مقترح المعلم:</span>
                          <span className="text-rose-700 font-black">{memo.requestedAction}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
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

                  {/* Incident Description Box */}
                  <div className="mt-3.5 bg-slate-50/90 border-r-4 border-r-rose-500 border border-slate-200/80 rounded-2xl p-3.5">
                    <div className="flex items-center justify-between mb-1 text-[11px] font-black text-slate-500">
                      <span>تفاصيل الواقعة وملاحظات المعلم:</span>
                      <span className="text-[10px] text-slate-400 font-mono">#{memo.id.slice(0, 8)}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed whitespace-pre-wrap">
                      {memo.reason}
                    </p>
                  </div>

                  {/* Decided Outcome Banner (if already resolved) */}
                  {memo.adminDecision && (
                    <div className="mt-3.5 p-3.5 rounded-2xl border bg-slate-50 border-slate-200/90 text-xs">
                      <div className="flex items-center justify-between font-black text-slate-900 mb-2">
                        <span className="flex items-center gap-2">
                          {isSummons && <UserCheck className="w-4 h-4 text-blue-600" />}
                          {isSuspension && <UserX className="w-4 h-4 text-rose-600" />}
                          {isDismissed && <CheckCircle2 className="w-4 h-4 text-slate-600" />}
                          <span className="text-xs">{statusBadge.text}</span>
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
                </div>

                {/* Card Action Controls Footer */}
                <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50/80 border-t border-slate-100">
                  {isPending ? (
                    <div>
                      <div className="text-xs font-black text-slate-700 mb-2.5 flex items-center justify-between">
                        <span>اتخاذ القرار الإداري:</span>
                        <span className="text-[11px] text-amber-700 font-bold bg-amber-100/70 px-2 py-0.5 rounded-md">
                          يتطلب إجراء فوري
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Option 1: استدعاء ولي أمر */}
                        <button
                          onClick={() => openDecisionModal(memo, 'parent_summons')}
                          className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                        >
                          <UserCheck className="w-4 h-4 shrink-0" />
                          <span>استدعاء ولي أمر</span>
                        </button>

                        {/* Option 2: طرد مؤقت */}
                        <button
                          onClick={() => openDecisionModal(memo, 'temporary_suspension')}
                          className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                        >
                          <UserX className="w-4 h-4 shrink-0" />
                          <span>فصل مؤقت</span>
                        </button>

                        {/* Option 3: تخطي وحفظ */}
                        <button
                          onClick={() => openDecisionModal(memo, 'skip')}
                          className="py-2.5 px-3 bg-white hover:bg-slate-100 active:scale-98 text-slate-700 rounded-xl text-xs font-black border border-slate-300 shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                        >
                          <Archive className="w-4 h-4 text-slate-500 shrink-0" />
                          <span>تخطي وحفظ</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium">المذكرة محسومة ومعتمدة</span>
                      <button
                        onClick={async () => {
                          if (window.confirm('هل تريد حذف هذه المذكرة نهائياً من السجل؟')) {
                            await deleteInfractionMemo(schoolId, memo.id);
                            onToast('تم الحذف', 'تم حذف المذكرة من السجل', 'info');
                            loadMemos();
                          }
                        }}
                        className="text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg cursor-pointer transition-colors font-bold"
                      >
                        حذف السجل
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* DECISION MODAL: PARENT SUMMONS / SUSPENSION / SKIP       */}
      {/* ======================================================== */}
      {selectedMemo && decisionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in dir-rtl">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div
              className={`p-4 sm:p-5 text-white flex items-center justify-between shrink-0 ${
                decisionType === 'parent_summons'
                  ? 'bg-blue-600'
                  : decisionType === 'temporary_suspension'
                  ? 'bg-rose-600'
                  : 'bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                  {decisionType === 'parent_summons' && <UserCheck className="w-5 h-5" />}
                  {decisionType === 'temporary_suspension' && <UserX className="w-5 h-5" />}
                  {decisionType === 'skip' && <Archive className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black">
                    {decisionType === 'parent_summons' && 'إصدار قرار استدعاء ولي أمر'}
                    {decisionType === 'temporary_suspension' && 'إصدار قرار طرد / فصل مؤقت'}
                    {decisionType === 'skip' && 'تخطي المذكرة وحفظها'}
                  </h2>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    بناءً على مذكرة الأستاذ/ة {selectedMemo.teacherName} ({selectedMemo.students.length} طلاب)
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedMemo(null);
                  setDecisionType(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmDecision} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {/* Target Students Reminder */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[11px] font-black text-slate-500 block mb-1">الطلاب المطبق عليهم القرار:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMemo.students.map((s) => (
                    <span
                      key={s.studentId}
                      className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs font-black text-slate-800"
                    >
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{s.studentName}</span>
                      {s.className && <span className="text-[10px] text-slate-400 font-semibold">({s.className})</span>}
                    </span>
                  ))}
                </div>
              </div>

              {/* Fields for Parent Summons */}
              {decisionType === 'parent_summons' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">
                        تاريخ الحضور المطلوب *
                      </label>
                      <input
                        type="date"
                        value={summonsDate}
                        onChange={(e) => setSummonsDate(e.target.value)}
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">
                        وقت المقابلة بالتقريب *
                      </label>
                      <input
                        type="text"
                        value={summonsTime}
                        onChange={(e) => setSummonsTime(e.target.value)}
                        placeholder="مثال: 10:00 صباحاً"
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Fields for Temporary Suspension */}
              {decisionType === 'temporary_suspension' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">
                        تاريخ بدء الفصل المؤقت *
                      </label>
                      <input
                        type="date"
                        value={suspensionStartDate}
                        onChange={(e) => setSuspensionStartDate(e.target.value)}
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">
                        تاريخ نهاية الفصل المؤقت *
                      </label>
                      <input
                        type="date"
                        value={suspensionEndDate}
                        onChange={(e) => setSuspensionEndDate(e.target.value)}
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-rose-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Decision Notes */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  ملاحظات وتوجيه الإدارة المدرسية *
                </label>
                <textarea
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="اكتب التوجيه الإداري، سبب القرار أو أسباب التخطي والحفظ..."
                  rows={3}
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white resize-none leading-relaxed"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMemo(null);
                    setDecisionType(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDecision}
                  className={`px-5 py-2.5 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60 ${
                    decisionType === 'parent_summons'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : decisionType === 'temporary_suspension'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-slate-800 hover:bg-slate-900'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isSubmittingDecision
                      ? 'جاري الاعتماد...'
                      : decisionType === 'parent_summons'
                      ? 'اعتماد استدعاء ولي الأمر'
                      : decisionType === 'temporary_suspension'
                      ? 'اعتماد قرار الفصل المؤقت'
                      : 'حفظ وتخطي المذكرة'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
