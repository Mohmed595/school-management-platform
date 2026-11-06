import React, { useState, useEffect } from 'react';
import {
  FileText,
  UserX,
  PhoneCall,
  Plus,
  Search,
  Calendar,
  Clock,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Filter,
  ShieldAlert,
  Send,
  User,
  Building,
  Sparkles,
  Info,
  ChevronLeft,
  Eye,
  ShieldCheck,
  History,
  XCircle,
  AlertCircle,
  CheckCircle,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { Student, ClassRoom } from '../../../types/admin';
import { AdministrativeAction, AdministrativeActionType } from '../../../types/adminAction';
import { StudentPicker } from '../common/StudentPicker';
import {
  getAllAdminActions,
  createAdminAction,
  deleteAdminAction,
  fetchAndSyncAdminActions,
} from '../../../lib/adminActionStorage';
import {
  SmartSuspensionAlert,
  SmartRuleAuditLog,
  getAllSmartSuspensionAlerts,
  getActiveSmartSuspensionAlerts,
  getSmartRuleAuditLogs,
  fetchAndSyncSmartSuspensionAlerts,
  fetchAndSyncSmartRuleAuditLogs,
  resolveCorrectAttendance,
  resolveEndSuspension,
  resolveIgnoreAlert,
} from '../../../lib/smartSuspensionRule';

interface AdminActionsViewProps {
  schoolId: string;
  students: Student[];
  classes: ClassRoom[];
  onToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export function AdminActionsView({
  schoolId,
  students,
  classes,
  onToast,
}: AdminActionsViewProps) {
  const [actions, setActions] = useState<AdministrativeAction[]>([]);
  const [smartAlerts, setSmartAlerts] = useState<SmartSuspensionAlert[]>([]);
  const [auditLogs, setAuditLogs] = useState<SmartRuleAuditLog[]>([]);
  const [filterType, setFilterType] = useState<'all' | AdministrativeActionType | 'smart_alerts'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isSummonsModalOpen, setIsSummonsModalOpen] = useState(false);
  const [isSuspensionModalOpen, setIsSuspensionModalOpen] = useState(false);
  const [isExpulsionModalOpen, setIsExpulsionModalOpen] = useState(false);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Smart Rule Modals state
  const [viewingAlert, setViewingAlert] = useState<SmartSuspensionAlert | null>(null);
  const [ignoreAlertId, setIgnoreAlertId] = useState<string | null>(null);
  const [ignoreReasonInput, setIgnoreReasonInput] = useState('');
  const [showAuditLogs, setShowAuditLogs] = useState(true);

  // Form states - Summons
  const [summonsStudentId, setSummonsStudentId] = useState('');
  const [summonsSearchTerm, setSummonsSearchTerm] = useState('');
  const [summonsDate, setSummonsDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [summonsTime, setSummonsTime] = useState('10:00 صباحاً');
  const [summonsReason, setSummonsReason] = useState('');
  const [summonsNotes, setSummonsNotes] = useState('');

  // Form states - Suspension
  const [suspensionStudentId, setSuspensionStudentId] = useState('');
  const [suspensionSearchTerm, setSuspensionSearchTerm] = useState('');
  const [suspensionStartDate, setSuspensionStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [suspensionEndDate, setSuspensionEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspensionNotes, setSuspensionNotes] = useState('');

  // Form states - Expulsion
  const [expulsionStudentId, setExpulsionStudentId] = useState('');
  const [expulsionSearchTerm, setExpulsionSearchTerm] = useState('');
  const [expulsionReason, setExpulsionReason] = useState('');
  const [expulsionNotes, setExpulsionNotes] = useState('');

  const loadData = async () => {
    try {
      const data = await fetchAndSyncAdminActions(schoolId);
      setActions(data);
    } catch (err) {
      setActions(getAllAdminActions(schoolId));
    }

    try {
      const alerts = await fetchAndSyncSmartSuspensionAlerts(schoolId);
      setSmartAlerts(alerts);
    } catch (err) {
      setSmartAlerts(getAllSmartSuspensionAlerts(schoolId));
    }

    try {
      const logs = await fetchAndSyncSmartRuleAuditLogs(schoolId);
      setAuditLogs(logs);
    } catch (err) {
      setAuditLogs(getSmartRuleAuditLogs(schoolId));
    }
  };

  useEffect(() => {
    loadData();

    const handleStorageChange = () => loadData();
    window.addEventListener('school_data_changed', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('school_data_changed', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [schoolId]);

  // Smart Action 1: Correct Attendance
  const handleCorrectAttendance = async (alertId: string) => {
    try {
      await resolveCorrectAttendance(alertId, 'إدارة المدرسة', schoolId);
      onToast(
        'تم تصحيح الحضور بنجاح! ⚡',
        'تم تغيير حالة حضور الطالب إلى "غائب" وتوثيق الإجراء في سجل تدقيق القرارات الذكية',
        'success'
      );
    } catch (err: any) {
      onToast('خطأ ⚠️', err?.message || 'فشل تصحيح الحضور في الخادم', 'error');
    }
  };

  // Smart Action 2: End Suspension
  const handleEndSuspension = async (alertId: string) => {
    try {
      await resolveEndSuspension(alertId, 'إدارة المدرسة', schoolId);
      onToast(
        'تم إنهاء الإيقاف بنجاح! ✅',
        'تم تحويل قرار الإيقاف إلى "منتهي" والسماح بالطالب بالحضور رسميًا وتوثيق السجل',
        'success'
      );
    } catch (err: any) {
      onToast('خطأ ⚠️', err?.message || 'فشل إنهاء الإيقاف في الخادم', 'error');
    }
  };

  // Smart Action 3: Ignore Alert with Reason
  const handleConfirmIgnore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ignoreAlertId) return;
    if (!ignoreReasonInput.trim()) {
      onToast('تنبيه ⚠️', 'يرجى كتابة سبب التجاهل للتوثيق الإداري', 'error');
      return;
    }

    try {
      await resolveIgnoreAlert(ignoreAlertId, 'إدارة المدرسة', ignoreReasonInput.trim(), schoolId);
      onToast(
        'تم توثيق التجاهل بنجاح 📝',
        'تم حفظ سبب التجاهل وتسجيل العملية في سجل التدقيق بنجاح',
        'info'
      );

      setIgnoreAlertId(null);
      setIgnoreReasonInput('');
    } catch (err: any) {
      onToast('خطأ ⚠️', err?.message || 'فشل توثيق التجاهل في الخادم', 'error');
    }
  };

  // Handle Summons Submit
  const handleCreateSummons = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summonsStudentId) {
      onToast('تنبيه ⚠️', 'يرجى اختيار الطالب المراد استدعاء ولي أمره', 'error');
      return;
    }
    if (!summonsReason.trim()) {
      onToast('تنبيه ⚠️', 'يرجى كتابة سبب الاستدعاء', 'error');
      return;
    }

    const student = students.find((s) => s.id === summonsStudentId);
    if (!student) return;

    setIsSubmitting(true);
    try {
      await createAdminAction({
        schoolId,
        studentId: student.id,
        studentName: student.name,
        className: student.className,
        actionType: 'parent_summons',
        title: 'استدعاء ولي الأمر',
        summonsDate,
        summonsTime,
        reason: summonsReason,
        notes: summonsNotes,
        createdBy: 'إدارة المدرسة',
      });

      onToast(
        'تم إرسال الاستدعاء بنجاح! 📩',
        `تم حفظ الاستدعاء في الخادم وإرسال إشعار عاجل لولي أمر الطالب ${student.name}`,
        'success'
      );

      // Reset & Close
      setIsSummonsModalOpen(false);
      setSummonsStudentId('');
      setSummonsReason('');
      setSummonsNotes('');
      await loadData();
    } catch (err: any) {
      onToast('خطأ ❌', err?.message || 'فشل حفظ الاستدعاء في الخادم', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Suspension Submit
  const handleCreateSuspension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspensionStudentId) {
      onToast('تنبيه ⚠️', 'يرجى اختيار الطالب المراد إصدار قرار الإيقاف له', 'error');
      return;
    }
    if (!suspensionReason.trim()) {
      onToast('تنبيه ⚠️', 'يرجى تحديد سبب الإيقاف عن الدراسة', 'error');
      return;
    }

    const student = students.find((s) => s.id === suspensionStudentId);
    if (!student) return;

    setIsSubmitting(true);
    try {
      await createAdminAction({
        schoolId,
        studentId: student.id,
        studentName: student.name,
        className: student.className,
        actionType: 'temporary_suspension',
        title: 'إيقاف مؤقت عن الدراسة',
        startDate: suspensionStartDate,
        endDate: suspensionEndDate,
        reason: suspensionReason,
        notes: suspensionNotes,
        createdBy: 'إدارة المدرسة',
      });

      onToast(
        'تم حفظ القرار وإصدار الإشعار! ⚠️',
        `تم إصدار قرار إيقاف مؤقت للطالب ${student.name} في قاعدة البيانات وإشعار ولي الأمر عاجلاً`,
        'success'
      );

      // Reset & Close
      setIsSuspensionModalOpen(false);
      setSuspensionStudentId('');
      setSuspensionReason('');
      setSuspensionNotes('');
      await loadData();
    } catch (err: any) {
      onToast('خطأ ❌', err?.message || 'فشل حفظ قرار الإيقاف في الخادم', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Expulsion Submit
  const handleCreateExpulsion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expulsionStudentId) {
      onToast('تنبيه ⚠️', 'يرجى اختيار الطالب المراد إصدار قرار الفصل النهائي له', 'error');
      return;
    }
    if (!expulsionReason.trim()) {
      onToast('تنبيه ⚠️', 'يرجى كتابة سبب قرار الفصل النهائي', 'error');
      return;
    }

    const student = students.find((s) => s.id === expulsionStudentId);
    if (!student) return;

    setIsSubmitting(true);
    try {
      await createAdminAction({
        schoolId,
        studentId: student.id,
        studentName: student.name,
        className: student.className,
        actionType: 'expulsion',
        title: 'قرار طرد / فصل نهائي',
        reason: expulsionReason,
        notes: expulsionNotes,
        createdBy: 'إدارة المدرسة',
      });

      onToast(
        'تم حفظ قرار الفصل النهائي! 🚫',
        `تم حفظ قرار فصل الطالب ${student.name} في قاعدة البيانات وإرسال إشعار رسمي عاجل`,
        'success'
      );

      // Reset & Close
      setIsExpulsionModalOpen(false);
      setExpulsionStudentId('');
      setExpulsionReason('');
      setExpulsionNotes('');
      await loadData();
    } catch (err: any) {
      onToast('خطأ ❌', err?.message || 'فشل حفظ قرار الفصل النهائي في الخادم', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteAction = async (id: string) => {
    setIsSubmitting(true);
    try {
      await deleteAdminAction(id, schoolId);
      onToast('تم إلغاء القرار الإداري', 'تم حذف الإجراء من قاعدة البيانات بنجاح', 'info');
      setDeleteConfirmationId(null);
      await loadData();
    } catch (err: any) {
      onToast('خطأ ❌', err?.message || 'فشل حذف القرار من الخادم', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Active Smart Alerts Filter
  const activeSmartAlerts = smartAlerts.filter((a) => a.status === 'active');

  // Filter actions
  const filteredActions = actions.filter((act) => {
    if (filterType === 'smart_alerts') return false;
    const matchesFilter = filterType === 'all' || act.actionType === filterType;
    const matchesSearch =
      !searchQuery.trim() ||
      act.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalSummons = actions.filter((a) => a.actionType === 'parent_summons').length;
  const totalSuspensions = actions.filter((a) => a.actionType === 'temporary_suspension').length;
  const totalExpulsions = actions.filter((a) => a.actionType === 'expulsion').length;

  return (
    <div className="space-y-6 dir-rtl">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-900 via-slate-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-red-900/40">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-red-200 text-xs font-bold backdrop-blur-md border border-white/10">
              <ShieldAlert className="w-4 h-4 text-orange-400 animate-pulse" />
              <span>الإجراءات والانضباط الإداري + مراقبة الإيقاف الذكية 🛡️ (PostgreSQL)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              الإجراءات والقرارات الإدارية (Administrative Actions)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              وحدة التحكم الإداري لاستدعاء أولياء الأمور وإصدار قرارات الإيقاف والطرد ومراقبة التعارضات الذكية ومزامنتها لحظياً عبر كافة الأجهزة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => loadData()}
              className="px-3 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-white/20 active:scale-95"
              title="تحديث ومزامنة البيانات من خادم PostgreSQL"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">مزامنة</span>
            </button>

            <button
              onClick={() => {
                if (students.length > 0 && !summonsStudentId) setSummonsStudentId(students[0].id);
                setIsSummonsModalOpen(true);
              }}
              className="px-3.5 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-red-900/50 hover:shadow-red-900/80 transition-all cursor-pointer flex items-center gap-1.5 border border-red-500/40 active:scale-95"
            >
              <PhoneCall className="w-4 h-4" />
              <span>استدعاء ولي الأمر</span>
            </button>

            <button
              onClick={() => {
                if (students.length > 0 && !suspensionStudentId) setSuspensionStudentId(students[0].id);
                setIsSuspensionModalOpen(true);
              }}
              className="px-3.5 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-amber-950/50 hover:shadow-amber-950/80 transition-all cursor-pointer flex items-center gap-1.5 border border-amber-500/40 active:scale-95"
            >
              <UserX className="w-4 h-4" />
              <span>إيقاف مؤقت</span>
            </button>

            <button
              onClick={() => {
                if (students.length > 0 && !expulsionStudentId) setExpulsionStudentId(students[0].id);
                setIsExpulsionModalOpen(true);
              }}
              className="px-3.5 py-3 bg-rose-700 hover:bg-rose-600 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-rose-950/50 hover:shadow-rose-950/80 transition-all cursor-pointer flex items-center gap-1.5 border border-rose-500/40 active:scale-95"
            >
              <XCircle className="w-4 h-4" />
              <span>طرد / فصل نهائي</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 cursor-pointer group flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">إجمالي الإجراءات</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{actions.length}</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold group-hover:bg-slate-200 group-hover:scale-110 transition-all duration-300">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-red-100 hover:border-red-300 shadow-2xs hover:shadow-md hover:shadow-red-500/10 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 cursor-pointer group flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-red-600 block">استدعاءات أولياء الأمور</span>
            <span className="text-2xl font-black text-red-700 mt-1 block">{totalSummons}</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold border border-red-100 group-hover:bg-red-100 group-hover:scale-110 transition-all duration-300">
            <PhoneCall className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-amber-100 hover:border-amber-300 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 cursor-pointer group flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-700 block">قرارات الإيقاف المؤقت</span>
            <span className="text-2xl font-black text-amber-800 mt-1 block">{totalSuspensions}</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold border border-amber-100 group-hover:bg-amber-100 group-hover:scale-110 transition-all duration-300">
            <UserX className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-rose-100 hover:border-rose-300 shadow-2xs hover:shadow-md hover:shadow-rose-500/10 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 cursor-pointer group flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-700 block">قرارات الفصل النهائي</span>
            <span className="text-2xl font-black text-rose-800 mt-1 block">{totalExpulsions}</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold border border-rose-100 group-hover:bg-rose-100 group-hover:scale-110 transition-all duration-300">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Smart Suspension Conflicts Alert Stat Card */}
        <div className={`p-5 bg-white rounded-3xl border shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 cursor-pointer group flex items-center justify-between ${
          activeSmartAlerts.length > 0
            ? 'border-orange-300 hover:border-orange-400 bg-orange-50/30 hover:shadow-orange-500/10'
            : 'border-emerald-200 hover:border-emerald-300 hover:shadow-emerald-500/10'
        }`}>
          <div>
            <span className="text-xs font-bold text-orange-800 block flex items-center gap-1">
              <span>تنبيهات الإيقاف الذكية</span>
              {activeSmartAlerts.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
              )}
            </span>
            <span className="text-2xl font-black text-orange-900 mt-1 block">
              {activeSmartAlerts.length}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold border border-orange-200 group-hover:bg-orange-200 group-hover:scale-110 transition-all duration-300">
            <ShieldAlert className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </div>

      {/* 🛡️ SECTION 1: SMART SUSPENSION MONITORING (مراقبة الإيقاف الذكية) */}
      <div className="bg-gradient-to-br from-orange-50/90 via-amber-50/50 to-white rounded-3xl border border-orange-200 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-orange-200/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/30 font-bold shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  🛡️ مراقبة الإيقاف الذكية (Smart Suspension Rule)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-extrabold shadow-2xs">
                  تفعيل آلي
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAuditLogs(!showAuditLogs)}
            className="px-3.5 py-2 bg-white hover:bg-orange-100/60 text-orange-800 rounded-xl text-xs font-bold border border-orange-200 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <History className="w-4 h-4 text-orange-600" />
            <span>{showAuditLogs ? 'إخفاء سجل التدقيق' : 'عرض سجل التدقيق (Audit Log)'}</span>
          </button>
        </div>

        {/* Active Smart Suspension Alerts List */}
        {activeSmartAlerts.length === 0 ? (
          <div className="p-6 bg-white/80 rounded-2xl border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-extrabold text-slate-900">لا توجد تعارضات حالياً</h4>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-orange-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span>تنبيهات حرجة نشطة ({activeSmartAlerts.length}):</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeSmartAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => setViewingAlert(alert)}
                  className="bg-white rounded-2xl border-2 border-orange-300 hover:border-orange-500 p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-3 relative active:scale-98"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0" />
                      <span className="text-[10px] font-extrabold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-md border border-orange-200 shrink-0">
                        🚨 تعارض إيقاف
                      </span>
                    </div>
                    <h4 className="font-black text-sm text-slate-900 truncate group-hover:text-orange-700 transition-colors">
                      {alert.studentName}
                    </h4>
                    <p className="text-xs font-bold text-slate-500 truncate">
                      {alert.className}
                    </p>
                  </div>

                  <div className="w-9 h-9 rounded-xl bg-orange-50 group-hover:bg-orange-500 text-orange-600 group-hover:text-white flex items-center justify-center font-bold shrink-0 transition-colors border border-orange-200">
                    <ChevronLeft className="w-5 h-5 rtl:rotate-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Log Table (سجل تدقيق القرارات والتنبيهات الذكية) */}
        {showAuditLogs && (
          <div className="pt-4 border-t border-orange-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-orange-600" />
                <span>سجل التدقيق والمتابعة الآلية (Audit Log):</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                تتبع شامل لجميع التنبيهات المنشأة والإجراءات المنفذة
              </span>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">لا توجد سجلات تدقيق حتى الآن</p>
            ) : (
              <div className="bg-white rounded-2xl border border-orange-200/80 overflow-x-auto shadow-2xs">
                <table className="w-full text-right text-xs">
                  <thead className="bg-orange-50/70 border-b border-orange-200/80 text-orange-950 font-black">
                    <tr>
                      <th className="p-3">التاريخ والوقت</th>
                      <th className="p-3">الطالب</th>
                      <th className="p-3">معلم الحضور</th>
                      <th className="p-3">المسؤول / المنفذ</th>
                      <th className="p-3">الإجراء المتخذ</th>
                      <th className="p-3">السبب / الملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('ar-EG')}
                        </td>
                        <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                          {log.studentName}
                        </td>
                        <td className="p-3 whitespace-nowrap">{log.teacherName}</td>
                        <td className="p-3 font-semibold text-slate-800 whitespace-nowrap">{log.adminName}</td>
                        <td className="p-3 whitespace-nowrap">
                          {log.actionTaken === 'إنشاء التنبيه الآلي' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 border border-orange-200">
                              🚨 إنشاء آلي
                            </span>
                          )}
                          {log.actionTaken === 'تصحيح الحضور' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                              ⚡ تصحيح الحضور
                            </span>
                          )}
                          {log.actionTaken === 'إنهاء الإيقاف' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ✅ إنهاء الإيقاف
                            </span>
                          )}
                          {log.actionTaken === 'تجاهل مع سبب' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                              📝 تجاهل مع سبب
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-[11px] text-slate-600 max-w-xs truncate" title={log.reason}>
                          {log.reason || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الكل ({actions.length})
          </button>
          <button
            onClick={() => setFilterType('parent_summons')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filterType === 'parent_summons'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-red-700'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>استدعاء ولي الأمر ({totalSummons})</span>
          </button>
          <button
            onClick={() => setFilterType('temporary_suspension')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filterType === 'temporary_suspension'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-amber-800'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>إيقاف مؤقت ({totalSuspensions})</span>
          </button>
          <button
            onClick={() => setFilterType('expulsion')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filterType === 'expulsion'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-rose-800'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>فصل نهائي ({totalExpulsions})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم الطالب أو الفصل أو السبب..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Actions List */}
      {filteredActions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-100">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900">لا توجد قرارات إدارية مسجلة</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            لم يتم إصدار أية استدعاءات أولياء أمور أو قرارات إيقاف مؤقت عن الدراسة مطابقة للفلتر المحدد.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActions.map((act) => {
            const isSummons = act.actionType === 'parent_summons';
            const isExpulsion = act.actionType === 'expulsion';
            return (
              <div
                key={act.id}
                className={`bg-white rounded-3xl border p-5 shadow-2xs space-y-4 relative flex flex-col justify-between transition-all hover:shadow-md ${
                  isExpulsion
                    ? 'border-rose-200/90 hover:border-rose-300'
                    : isSummons
                    ? 'border-red-200/90 hover:border-red-300'
                    : 'border-amber-200/90 hover:border-amber-300'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badge & Delete Button */}
                  <div className="flex items-center justify-between">
                    {isExpulsion ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-900 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-700" />
                        <span>قرار طرد / فصل نهائي</span>
                      </span>
                    ) : isSummons ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-red-100 text-red-800 border border-red-200">
                        <PhoneCall className="w-3.5 h-3.5 text-red-600" />
                        <span>استدعاء ولي أمر</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                        <UserX className="w-3.5 h-3.5 text-amber-700" />
                        <span>إيقاف مؤقت عن الدراسة</span>
                      </span>
                    )}

                    <button
                      onClick={() => setDeleteConfirmationId(act.id)}
                      title="سحب الإجراء وتحديث السجل"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Student Info */}
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                      {act.studentName}
                    </h3>
                    <span className="text-xs font-bold text-blue-600 block mt-0.5">
                      {act.className}
                    </span>
                  </div>

                  {/* Date & Time Details */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                    {isSummons ? (
                      <>
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="text-slate-400 font-medium">موعد الاستدعاء:</span>
                          <span className="font-bold flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-red-500" />
                            {act.summonsDate}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="text-slate-400 font-medium">الوقت المحضر:</span>
                          <span className="font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-red-500" />
                            {act.summonsTime}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="text-slate-400 font-medium">تاريخ البداية:</span>
                          <span className="font-bold text-amber-700">{act.startDate}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="text-slate-400 font-medium">تاريخ النهاية:</span>
                          <span className="font-bold text-amber-700">{act.endDate}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Reason */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block mb-0.5">السبب المعلن:</span>
                    <p className="text-xs font-medium text-slate-800 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                      "{act.reason}"
                    </p>
                  </div>

                  {/* Notes */}
                  {act.notes && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 block mb-0.5">ملاحظات إضافية:</span>
                      <p className="text-[11px] text-slate-600 italic">
                        {act.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>بواسطة: {act.createdBy}</span>
                  <span>{new Date(act.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: View Student (عرض الطالب) */}
      {viewingAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dir-rtl animate-in fade-in zoom-in-95 duration-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">بطاقة تفاصيل الطالب وتعارض الحضور</h3>
                  <p className="text-xs text-slate-500">معلومات الطالب وسجل التعارض المرصود</p>
                </div>
              </div>
              <button
                onClick={() => setViewingAlert(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between"><span className="text-slate-500 font-bold">اسم الطالب:</span> <span className="font-extrabold text-slate-900">{viewingAlert.studentName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 font-bold">كود الطالب:</span> <span className="font-mono font-bold text-blue-700">{viewingAlert.studentCode}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 font-bold">الفصل الدراسي:</span> <span className="font-bold">{viewingAlert.className}</span></div>
              </div>

              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 space-y-2 text-orange-950">
                <div className="font-bold text-sm text-orange-900 border-b border-orange-200 pb-1">تفاصيل قرار الإيقاف:</div>
                <div><span className="font-bold">فترة الإيقاف:</span> من {viewingAlert.suspensionStartDate} إلى {viewingAlert.suspensionEndDate}</div>
                <div><span className="font-bold">السبب:</span> {viewingAlert.suspensionReason}</div>
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 space-y-2 text-blue-950">
                <div className="font-bold text-sm text-blue-900 border-b border-blue-200 pb-1">تفاصيل الحضور المرصود:</div>
                <div><span className="font-bold">حالة الحضور:</span> <span className="font-extrabold text-blue-700">{viewingAlert.attendanceStatus}</span></div>
                <div><span className="font-bold">معلم الحضور:</span> {viewingAlert.attendanceTeacherName}</div>
                <div><span className="font-bold">تاريخ وتوقيت التسجيل:</span> {viewingAlert.recordedDate} الساعة {viewingAlert.recordedTime}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    const alertId = viewingAlert.id;
                    setViewingAlert(null);
                    handleCorrectAttendance(alertId);
                  }}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>تصحيح الحضور</span>
                </button>

                <button
                  onClick={() => {
                    const alertId = viewingAlert.id;
                    setViewingAlert(null);
                    handleEndSuspension(alertId);
                  }}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>إنهاء الإيقاف</span>
                </button>

                <button
                  onClick={() => {
                    const alertId = viewingAlert.id;
                    setViewingAlert(null);
                    setIgnoreAlertId(alertId);
                    setIgnoreReasonInput('');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-red-100 hover:text-red-800 text-slate-700 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>تجاهل مع سبب</span>
                </button>
              </div>

              <button
                onClick={() => setViewingAlert(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Ignore with Reason (تجاهل مع كتابة سبب) */}
      {ignoreAlertId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dir-rtl animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center gap-3 text-orange-700 bg-orange-50 p-3.5 rounded-2xl border border-orange-200">
              <AlertCircle className="w-6 h-6 shrink-0 text-orange-600" />
              <div>
                <h3 className="font-bold text-sm">تجاهل التنبيه مع توثيق السبب</h3>
                <p className="text-xs text-orange-800 mt-0.5">سيتم تسجيل سبب التجاهل في سجل التدقيق المعتمد.</p>
              </div>
            </div>

            <form onSubmit={handleConfirmIgnore} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">سبب التجاهل أو الاستثناء الإداري *</label>
                <textarea
                  required
                  rows={3}
                  value={ignoreReasonInput}
                  onChange={(e) => setIgnoreReasonInput(e.target.value)}
                  placeholder="اكتب سبب السماح للصحية أو تعديل قرار الإيقاف شفوياً..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIgnoreAlertId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  تراجع
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors cursor-pointer shadow-md shadow-orange-200"
                >
                  حفظ وتأكيد التجاهل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: Parent Summons (استدعاء ولي الأمر) */}
      {isSummonsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dir-rtl animate-in fade-in zoom-in-95 duration-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold border border-red-100">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">إصدار استدعاء ولي الأمر</h3>
                  <p className="text-xs text-slate-500 font-medium">سيصل إشعار عالي الأولوية فوراً إلى بوابة ولي الأمر</p>
                </div>
              </div>
              <button
                onClick={() => setIsSummonsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSummons} className="space-y-4 text-xs">
              {/* Select Student */}
              <StudentPicker
                students={students}
                selectedStudentId={summonsStudentId}
                onSelectStudent={setSummonsStudentId}
                accentColor="red"
                label="اختر الطالب المراد استدعاء ولي أمره"
                required
                disabled={isSubmitting}
                idPrefix="summons-std"
              />

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ الاستدعاء *</label>
                  <input
                    type="date"
                    required
                    value={summonsDate}
                    onChange={(e) => setSummonsDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 font-semibold cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">وقت الحضور المطلوب *</label>
                  <input
                    type="text"
                    required
                    value={summonsTime}
                    onChange={(e) => setSummonsTime(e.target.value)}
                    placeholder="مثال: 10:00 صباحاً"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 font-semibold"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">سبب الاستدعاء *</label>
                <textarea
                  required
                  rows={3}
                  value={summonsReason}
                  onChange={(e) => setSummonsReason(e.target.value)}
                  placeholder="مثال: مناقشة السلوك الأخير في الفصل وتراجع المستوى في اختبار منتصف الفصل..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 font-medium"
                />
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات إضافية لولي الأمر (اختياري)</label>
                <input
                  type="text"
                  value={summonsNotes}
                  onChange={(e) => setSummonsNotes(e.target.value)}
                  placeholder="مثال: يرجى إحضار بطاقة الرقم القومي والإحضار في مكتب الأخصائي الاجتماعي"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="p-3 bg-red-50/80 rounded-2xl border border-red-200/80 text-[11px] text-red-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>
                  عند إرسال هذا الإجراء، سيتم توثيقه في السجل الإداري للطالب وإرسال تنبيه عاجل بلون بارز في حساب ولي الأمر.
                </span>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSummonsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-200 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال الإشعار لولي الأمر</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Temporary Suspension (إيقاف مؤقت عن الدراسة) */}
      {isSuspensionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dir-rtl animate-in fade-in zoom-in-95 duration-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold border border-amber-100">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">قرار إيقاف مؤقت عن الدراسة</h3>
                  <p className="text-xs text-slate-500 font-medium">تحديد فترة الإيقاف وتوثيق القرار رسمياً في ملف الطالب</p>
                </div>
              </div>
              <button
                onClick={() => setIsSuspensionModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSuspension} className="space-y-4 text-xs">
              {/* Select Student */}
              <StudentPicker
                students={students}
                selectedStudentId={suspensionStudentId}
                onSelectStudent={setSuspensionStudentId}
                accentColor="amber"
                label="اختر الطالب المراد إيقافه مؤقتاً"
                required
                disabled={isSubmitting}
                idPrefix="suspension-std"
              />

              {/* Start Date & End Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ بداية الإيقاف *</label>
                  <input
                    type="date"
                    required
                    value={suspensionStartDate}
                    onChange={(e) => setSuspensionStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 font-semibold cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ نهاية الإيقاف *</label>
                  <input
                    type="date"
                    required
                    value={suspensionEndDate}
                    onChange={(e) => setSuspensionEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 font-semibold cursor-pointer"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">سبب قرار الإيقاف *</label>
                <textarea
                  required
                  rows={3}
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="مثال: ارتكاب مخالفة سلوكية جسيمة وحسب لائحة الانضباط المدرسي..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">توجيهات إضافية أو ملاحظات</label>
                <input
                  type="text"
                  value={suspensionNotes}
                  onChange={(e) => setSuspensionNotes(e.target.value)}
                  placeholder="مثال: يمنع من حضور الحصص الدراسية ويُتاح له أداء الاختبارات فقط"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  سيتم حفظ القرار في السجل الإداري وإشعار ولي الأمر فوراً بالقرار وتواريخ البداية والنهاية.
                </span>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSuspensionModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-200 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <UserX className="w-4 h-4" />
                  <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ القرار وإخطار ولي الأمر'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Expulsion (قرار طرد / فصل نهائي من المدرسة) */}
      {isExpulsionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-100 dir-rtl animate-in fade-in zoom-in-95 duration-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold border border-rose-200">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">قرار طرد / فصل نهائي من المدرسة</h3>
                  <p className="text-xs text-rose-600 font-medium">توثيق قرار الفصل النهائي في قاعدة بيانات المدرسة وقاعدة بيانات الوزارة</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpulsionModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpulsion} className="space-y-4 text-xs">
              {/* Select Student */}
              <StudentPicker
                students={students}
                selectedStudentId={expulsionStudentId}
                onSelectStudent={setExpulsionStudentId}
                accentColor="rose"
                label="اختر الطالب المراد إصدار قرار الفصل النهائي له"
                required
                disabled={isSubmitting}
                idPrefix="expulsion-std"
              />

              {/* Reason */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">سبب قرار الفصل النهائي *</label>
                <textarea
                  required
                  rows={3}
                  value={expulsionReason}
                  onChange={(e) => setExpulsionReason(e.target.value)}
                  placeholder="مثال: صدور قرار من لجنة الانضباط المدرسي بالفصل النهائي بناءً على..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 font-medium"
                />
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات وقرارات إضافية</label>
                <input
                  type="text"
                  value={expulsionNotes}
                  onChange={(e) => setExpulsionNotes(e.target.value)}
                  placeholder="مثال: تسليم الملف لولي الأمر وسحب كارت القيد الإداري"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-[11px] text-rose-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  تنبيه: قرار الفصل النهائي إجراء إداري حاسم، سيتم توثيقه وإخطار ولي الأمر فوراً عبر المنظومة.
                </span>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpulsionModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-rose-700 hover:bg-rose-800 shadow-md shadow-rose-200 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{isSubmitting ? 'جاري التوثيق...' : 'توثيق الفصل وإخطار ولي الأمر'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Confirmation */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dir-rtl animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600 bg-red-50 p-3.5 rounded-2xl border border-red-100">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold text-sm">حذف الإجراء الإداري</h3>
                <p className="text-xs text-red-700/80 mt-0.5">سيتم إلغاء هذا القرار وحذفه من السجل الإداري.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              هل أنت تأكيد من رغبتك في إلغاء وتجريد هذا القرار الإداري؟
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmationId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAction(deleteConfirmationId)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer shadow-md shadow-red-200"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
