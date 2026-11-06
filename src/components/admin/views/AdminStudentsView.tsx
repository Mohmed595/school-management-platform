import React, { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { AvatarDisplay } from '../../ui/AvatarDisplay';
import { getUserAvatarLayoutUid } from '../../../lib/avatarLayouts';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  UserCheck,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Award,
  AlertCircle,
  FileText,
  Building2,
  ChevronDown,
  Smartphone,
  Send,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Printer,
  Flame,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PrintableLoginCardsModal } from '../../messages/PrintableLoginCardsModal';
import { Student, ClassRoom, AttendanceRecord } from '../../../types/admin';
import { getStudentBadges, getGroupedStudentBadges } from '../../../lib/badgeStorage';
import { getStudentAdminActions } from '../../../lib/adminActionStorage';
import { getStudentStreakInfo } from '../../../lib/streakStorage';
import { ShieldAlert, PhoneCall, UserX } from 'lucide-react';
import { PhoneDisplay, isInvalidOrDummyPhone } from '../../ui/PhoneDisplay';
import { BadgeCard, BadgesEmptyState } from '../../ui/BadgeCard';
import { sendWelcomeSmsToStudentList, DEFAULT_PLATFORM_URL, getSmsBatchLogs, getParentSmsRecords, getSmsRemainingBalance } from '../../../lib/smsStorage';
import { getStoredSchools } from '../../../lib/storage';
import { sendBulkSMS } from '../../../lib/sms/smsmode';
import { setStorage, notifyDataChanged } from '../../../lib/adminStorage';
import { SmsBatchLog, ParentSmsRecord } from '../../../types/sms';
import { parseEgyptianClassDetails, compareStudentsByGradeClassAndName, getGradeLevelFromClassName, deriveGradeFromNationalId } from '../../../lib/egyptianSchoolUtils';


interface AdminStudentsViewProps {
  schoolId: string;
  students: Student[];
  classes: ClassRoom[];
  attendance?: AttendanceRecord[];
  onSaveStudent: (student: Student) => Promise<void> | void;
  onDeleteStudent: (studentId: string) => Promise<void> | void;
  onToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export function AdminStudentsView({
  schoolId,
  students,
  classes,
  attendance = [],
  onSaveStudent,
  onDeleteStudent,
  onToast,
}: AdminStudentsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

  // Reset pagination when search term or class filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchTerm, selectedClassFilter]);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);

  // Welcome SMS Modal State
  const [isWelcomeSmsModalOpen, setIsWelcomeSmsModalOpen] = useState(false);
  const [isSendingWelcomeSms, setIsSendingWelcomeSms] = useState(false);

  // Printable Cards Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    studentCode: '',
    ministryCode: '',
    nationalId: '',
    classId: classes[0]?.id || '',
    className: classes[0]?.name || '',
    birthDate: '2011-05-15',
    gender: 'ذكر' as 'ذكر' | 'أنثى',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    address: 'القاهرة',
    status: 'منتظم' as 'منتظم' | 'موقوف' | 'منقول',
  });

  const getStudentAge = (birthDate?: string): number => {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // HIGH-PERFORMANCE OPTIMIZATION FOR THOUSANDS OF STUDENTS:
  // 1. Pre-index classes for O(1) instant map/set lookups instead of O(M) nested loops
  const { classById, validClassIds, validClassNames } = useMemo(() => {
    const byId = new Map<string, ClassRoom>();
    const idSet = new Set<string>();
    const nameSet = new Set<string>();
    for (const c of classes) {
      if (c && c.id) {
        byId.set(c.id, c);
        idSet.add(c.id);
      }
      if (c && c.name) {
        nameSet.add(c.name);
      }
    }
    return { classById: byId, validClassIds: idSet, validClassNames: nameSet };
  }, [classes]);

  // 2. Pre-sort students ONCE when dataset or classes change, rather than sorting 13M times on every keystroke
  const baseSortedStudents = useMemo(() => {
    return [...(students || [])].sort((a, b) => {
      const matchingClassA = a.classId ? classById.get(a.classId) : undefined;
      const matchingClassB = b.classId ? classById.get(b.classId) : undefined;
      return compareStudentsByGradeClassAndName(
        {
          name: a.name || '',
          className: a.className || '',
          gradeLevel: a.gradeLevel || matchingClassA?.gradeLevel,
        },
        {
          name: b.name || '',
          className: b.className || '',
          gradeLevel: b.gradeLevel || matchingClassB?.gradeLevel,
        }
      );
    });
  }, [students, classById]);

  // 3. Filter the pre-sorted list in a single fast O(N) pass without UI freeze
  const filteredStudents = useMemo(() => {
    const q = (deferredSearchTerm || '').trim().toLowerCase();
    const filterMode = selectedClassFilter;

    return baseSortedStudents.filter((s) => {
      if (!s) return false;

      // Class filter check with O(1) set lookups
      if (filterMode !== 'all') {
        if (filterMode === 'unassigned') {
          const isUnassigned =
            s.isClassAssigned === false ||
            !s.classId ||
            (!validClassIds.has(s.classId) && (!s.className || !validClassNames.has(s.className)));
          if (!isUnassigned) return false;
        } else if (s.classId !== filterMode) {
          return false;
        }
      }

      // Search term check
      if (!q) return true;

      return (
        (Boolean(s.name) && s.name.toLowerCase().includes(q)) ||
        (Boolean(s.studentCode) && s.studentCode.toLowerCase().includes(q)) ||
        (Boolean(s.ministryCode) && s.ministryCode.toLowerCase().includes(q)) ||
        (Boolean(s.nationalId) && s.nationalId.toLowerCase().includes(q)) ||
        (Boolean(s.id) && s.id.toLowerCase().includes(q)) ||
        (Boolean(s.parentName) && s.parentName.toLowerCase().includes(q)) ||
        (Boolean(s.className) && s.className.toLowerCase().includes(q)) ||
        (Boolean(s.gradeLevel) && s.gradeLevel.toLowerCase().includes(q))
      );
    });
  }, [baseSortedStudents, deferredSearchTerm, selectedClassFilter, validClassIds, validClassNames]);

  const studentsWithPhone = useMemo(() => {
    return filteredStudents.filter((s) => s.parentPhone && !isInvalidOrDummyPhone(s.parentPhone));
  }, [filteredStudents]);

  const studentsWithoutPhone = useMemo(() => {
    return filteredStudents.filter((s) => !s.parentPhone || isInvalidOrDummyPhone(s.parentPhone));
  }, [filteredStudents]);

  // Pagination logic: load first 30 students to maintain top performance
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredStudents.length);
  const displayedStudents = useMemo(() => {
    return filteredStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredStudents, startIndex, pageSize]);

  const handleConfirmSendWelcomeSms = async () => {
    if (studentsWithPhone.length === 0) {
      onToast('لا يوجد أرقام مسجلة', 'لم يتم العثور على أي طلاب لديهم أرقام هواتف صحيحة للإرسال.', 'error');
      return;
    }

    setIsSendingWelcomeSms(true);

    const currentSchool = getStoredSchools().find((s) => s.id === schoolId);
    const schoolName = currentSchool?.name || 'مدرستنا الدولية النموذجية';

    const recipients = studentsWithPhone.map((s) => ({
      studentId: s.id,
      studentName: s.name,
      studentCode: s.studentCode || `STD-2026-${s.id}`,
      parentName: s.parentName || `ولي أمر ${s.name}`,
      phone: s.parentPhone || '',
    }));

    try {
      let bulkResult;
      try {
        const resp = await fetch('/api/sms/send-bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schoolId: schoolId || 'sch-1',
            schoolName,
            recipients,
            platformUrl: DEFAULT_PLATFORM_URL,
          }),
        });

        if (resp.ok) {
          bulkResult = await resp.json();
        } else {
          throw new Error('Fallback to client SMSMode');
        }
      } catch (e) {
        bulkResult = await sendBulkSMS({
          schoolId: schoolId || 'sch-1',
          schoolName,
          recipients,
          platformUrl: DEFAULT_PLATFORM_URL,
        });
      }

      const nowStr = new Date().toLocaleString('ar-EG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      const batchLog: SmsBatchLog = {
        id: bulkResult.batchId || `batch-welcome-${Date.now().toString().slice(-6)}`,
        sendDate: nowStr,
        schoolId: schoolId || 'sch-1',
        schoolName: `${schoolName} - رسائل الترحيب`,
        recipientsCount: recipients.length,
        deliveredCount: bulkResult.deliveredCount,
        failedCount: bulkResult.failedCount,
        status: bulkResult.failedCount > 0 ? 'فشل جزئي' : 'مكتمل',
        duration: bulkResult.durationFormatted || '1.0 ثانية',
        sender: 'SMSMode Provider Client',
      };

      const createdRecords: ParentSmsRecord[] = (bulkResult.logs || []).map((log: any) => ({
        id: log.id,
        batchId: batchLog.id,
        schoolId: schoolId || 'sch-1',
        schoolName,
        studentId: log.student_id,
        studentName: recipients.find((r) => r.studentId === log.student_id)?.studentName || 'طالب',
        studentCode: recipients.find((r) => r.studentId === log.student_id)?.studentCode || '',
        parentName: recipients.find((r) => r.studentId === log.student_id)?.parentName || 'ولي أمر',
        parentPhone: log.phone,
        status: log.status,
        sentAt: log.sent_at || nowStr,
        failureReason: log.error,
        smsMessage: log.message,
      }));

      const existingBatches = getSmsBatchLogs();
      setStorage('sms_batch_logs_v1', [batchLog, ...existingBatches]);

      const existingRecords = getParentSmsRecords();
      setStorage('sms_parent_records_v1', [...createdRecords, ...existingRecords]);

      const currentBalance = getSmsRemainingBalance();
      const updatedBalance = Math.max(0, currentBalance - bulkResult.deliveredCount);
      setStorage('sms_balance_v1', updatedBalance);

      notifyDataChanged('sms_logs');
      window.dispatchEvent(new Event('sms_data_changed'));

      setIsSendingWelcomeSms(false);
      setIsWelcomeSmsModalOpen(false);

      onToast(
        'تم إرسال رسائل الترحيب بنجاح 📱',
        `تم إرسال ${bulkResult.deliveredCount} رسالة ترحيب نصية عبر SMSMode (وتخطي ${studentsWithoutPhone.length} بدون رقم هاتف).`,
        'success'
      );
    } catch (err: any) {
      setIsSendingWelcomeSms(false);
      onToast('خطأ في الإرسال', err?.message || 'فشلت عملية إرسال الرسائل', 'error');
    }
  };

  const handleOpenCreate = () => {
    setEditingStudent(null);
    const firstClass = classes[0];
    const initialClassName = firstClass
      ? firstClass.gradeLevel
        ? `${firstClass.gradeLevel} - ${firstClass.name}`
        : firstClass.name
      : 'الصف الأول الإعدادي - 1/1';

    setFormData({
      name: '',
      studentCode: `STD-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      ministryCode: `MIN-${Math.floor(10000 + Math.random() * 90000)}`,
      nationalId: `31${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      classId: firstClass?.id || '',
      className: initialClassName,
      birthDate: '2012-01-01',
      gender: 'ذكر',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      address: 'القاهرة - جمهورية مصر العربية',
      status: 'منتظم',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || '',
      studentCode: student.studentCode || `STD-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      ministryCode: student.ministryCode || `MIN-${Math.floor(10000 + Math.random() * 90000)}`,
      nationalId: student.nationalId || '',
      classId: student.classId || (classes[0]?.id || ''),
      className: student.className || (classes[0]?.name || ''),
      birthDate: student.birthDate || '2012-01-01',
      gender: student.gender || 'ذكر',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      parentEmail: student.parentEmail || '',
      address: student.address || '',
      status: student.status || 'منتظم',
    });
    setIsModalOpen(true);
  };

  const handleClassChange = (cId: string) => {
    const matchedClass = classes.find((c) => c.id === cId);
    setFormData((prev) => ({
      ...prev,
      classId: cId,
      className: matchedClass ? matchedClass.name : prev.className,
    }));
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      onToast('خطأ في البيانات', 'يرجى كتابة اسم الطالب', 'error');
      return;
    }

    const assignedNationalId = formData.nationalId.trim() || `300${Date.now()}`;
    const assignedCode = formData.studentCode.trim() || `STD-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const assignedMinistryCode = formData.ministryCode.trim() || `MIN-${Math.floor(10000 + Math.random() * 90000)}`;
    const matchedClass = classes.find((c) => c.id === formData.classId);
    const assignedGradeLevel = matchedClass?.gradeLevel || editingStudent?.gradeLevel || 'الصف الأول الابتدائي';

    const newOrUpdatedStudent: Student = {
      id: editingStudent ? editingStudent.id : `std-${schoolId}-${Date.now()}`,
      schoolId,
      name: formData.name.trim(),
      studentCode: assignedCode,
      ministryCode: assignedMinistryCode,
      nationalId: assignedNationalId,
      classId: formData.classId,
      className: matchedClass?.name || formData.className,
      gradeLevel: assignedGradeLevel,
      birthDate: formData.birthDate,
      gender: formData.gender,
      status: formData.status,
      parentName: formData.parentName || `ولي أمر ${formData.name}`,
      parentPhone: formData.parentPhone,
      parentEmail: formData.parentEmail,
      address: formData.address,
      joinDate: editingStudent ? editingStudent.joinDate : new Date().toISOString().split('T')[0],
    };

    setIsSaving(true);
    try {
      await onSaveStudent(newOrUpdatedStudent);
      setIsModalOpen(false);
      onToast(
        editingStudent ? 'تم تحديث بيانات الطالب' : 'تم إضافة الطالب بنجاح',
        `الطالب: ${formData.name}`,
        'success'
      );
    } catch (err: any) {
      console.error('Error saving student:', err);
      onToast('خطأ في حفظ البيانات بالخادم', err?.message || 'فشلت عملية إضافة/تحديث الطالب في قاعدة البيانات المركزية', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingStudentId) return;
    setIsSaving(true);
    try {
      await onDeleteStudent(deletingStudentId);
      setDeletingStudentId(null);
      onToast('تم حذف الطالب', 'تم إزالة سجل الطالب من النظام وقاعدة البيانات نهائياً', 'success');
    } catch (err: any) {
      console.error('Error deleting student:', err);
      onToast('فشل حذف الطالب', err?.message || 'تعذر حذف سجل الطالب من الخادم المركزي', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Actions Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث باسم الطالب أو الفصل..."
              className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="all">جميع الفصول الدراسية</option>
            <option value="unassigned">⚡ طلاب بانتظار التسكين (اليوم الأول)</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Printable Login Cards Button */}
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer border border-blue-500/30 active:scale-95"
            title="طباعة بطاقات تسجيل الدخول للطلاب PDF"
          >
            <Printer className="w-4 h-4" />
            <span>🖨️ طباعة PDF للطلاب</span>
          </button>

          {/* Welcome SMS Button */}
          <button
            type="button"
            onClick={() => setIsWelcomeSmsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer border border-emerald-500/30 active:scale-95"
            title="إرسال رسائل الترحيب لجميع الطلاب الذين لديهم أرقام هواتف"
          >
            <Smartphone className="w-4 h-4 text-emerald-200" />
            <span>📱 إرسال رسائل الترحيب</span>
          </button>

          {/* Add Student Button */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer border border-blue-500/30 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة طالب جديد</span>
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-xs text-slate-900">
              قائمة الطلاب ({filteredStudents.length} طالب إجمالاً)
            </h3>
            {filteredStudents.length > 0 && (
              <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                عرض {startIndex + 1} - {endIndex} من {filteredStudents.length}
              </span>
            )}
          </div>

          {/* Page size & Fast paging info */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">عدد العرض:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value={30}>30 طالب (سريع ومثالي)</option>
              <option value={50}>50 طالب</option>
              <option value={100}>100 طالب</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3">اسم الطالب</th>
                <th className="px-5 py-3">كود الوزارة</th>
                <th className="px-5 py-3">الرقم القومي</th>
                <th className="px-5 py-3">الفصل الدراسي</th>
                <th className="px-5 py-3">الهاتف</th>
                <th className="px-5 py-3">الحالة</th>
                <th className="px-5 py-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    لا توجد سجلات طلاب تطابق معايير البحث
                  </td>
                </tr>
              ) : (
                displayedStudents.map((std) => (
                  <tr key={std.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <AvatarDisplay
                          layoutUid={std.avatar_layout_uid || getUserAvatarLayoutUid(std.id)}
                          name={std.name}
                          size="sm"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">{std.name}</span>
                          <span className="text-[10px] text-slate-400">تاريخ الميلاد: {std.birthDate}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2.5 py-1 rounded-lg dir-ltr inline-block">
                        {std.ministryCode || 'غير مسجل'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg dir-ltr inline-block">
                        {std.nationalId || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-800">
                          {std.className && std.className !== 'غير محدد'
                            ? std.className
                            : std.gradeLevel || (std.nationalId ? deriveGradeFromNationalId(std.nationalId) : 'غير محدد')}
                        </span>
                        <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded w-fit font-medium">
                          {std.gradeLevel || (std.className && std.className !== 'غير محدد' ? getGradeLevelFromClassName(std.className) : '') || (std.nationalId ? deriveGradeFromNationalId(std.nationalId) : 'المرحلة الدراسية')}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <PhoneDisplay phone={std.parentPhone} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          std.status === 'منتظم'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : std.status === 'موقوف'
                            ? 'bg-red-50 text-red-700 border border-red-200/60'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        }`}
                      >
                        {std.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setProfileStudent(std)}
                          title="عرض ملف الطالب"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(std)}
                          title="تعديل البيانات"
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingStudentId(std.id)}
                          title="حذف الطالب"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-500">
              الصفحة <strong className="text-slate-800">{currentPage}</strong> من{' '}
              <strong className="text-slate-800">{totalPages}</strong> (إجمالي {filteredStudents.length} طالب)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                <span>السابق</span>
              </button>

              {/* Numbered Page Buttons */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
              >
                <span>التالي</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">اسم الطالب الرباعي *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: عمر أحمد فتحي المغازي"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">كود الوزارة (Ministry Code) *</label>
                  <input
                    type="text"
                    required
                    value={formData.ministryCode || ''}
                    onChange={(e) => setFormData({ ...formData, ministryCode: e.target.value })}
                    placeholder="MIN-10005"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-indigo-700 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الرقم القومي (14 رقم) *</label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    value={formData.nationalId || ''}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    placeholder="31201010100000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الفصل الدراسي *</label>
                  <select
                    value={formData.classId || ''}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.gradeLevel ? `${c.gradeLevel} - ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">كود الطالب الداخلي (Student ID)</label>
                  <input
                    type="text"
                    value={formData.studentCode || ''}
                    onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                    placeholder="STD-2026-10005"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ الميلاد</label>
                  <input
                    type="date"
                    value={formData.birthDate || ''}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">هاتف التواصل</label>
                  <input
                    type="text"
                    value={formData.parentPhone || ''}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    placeholder="01012345678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">عنوان السكن بالتفصيل</label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="القاهرة - المعادي - شارع 9"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Profile Drawer / Modal */}
      {profileStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <AvatarDisplay
                  layoutUid={profileStudent.avatar_layout_uid || getUserAvatarLayoutUid(profileStudent.id)}
                  name={profileStudent.name}
                  size="lg"
                />
                <div>
                  <h3 className="font-bold text-base text-slate-900">{profileStudent.name}</h3>
                  {(() => {
                    const matchedClass = classes.find((c) => c.id === profileStudent.classId || c.name === profileStudent.className);
                    const details = parseEgyptianClassDetails(matchedClass?.gradeLevel, profileStudent.className);
                    return (
                      <div className="flex items-center gap-2 text-xs font-bold mt-1">
                        <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          الصف: {details.gradeName}
                        </span>
                        <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-mono">
                          الفصل: {details.formattedClassName}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <button
                onClick={() => setProfileStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* Profile Grid Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-indigo-50/70 border border-indigo-200/60 rounded-xl space-y-0.5">
                <span className="text-indigo-600 font-bold block text-[10px]">كود الوزارة</span>
                <span className="font-extrabold text-indigo-900 font-mono text-xs">{profileStudent.ministryCode || 'غير مسجل'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-0.5">
                <span className="text-slate-500 font-bold block text-[10px]">الرقم القومي</span>
                <span className="font-bold text-slate-800 font-mono text-xs">{profileStudent.nationalId || '—'}</span>
              </div>
              <div className="p-3 bg-blue-50/60 border border-blue-200/50 rounded-xl space-y-0.5">
                <span className="text-blue-600 font-medium block text-[10px]">كود الطالب (ID)</span>
                <span className="font-bold text-blue-900 font-mono text-xs">{profileStudent.studentCode || profileStudent.id}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-slate-400 font-medium block">حالة الطالب</span>
                <span className="font-bold text-emerald-700">{profileStudent.status}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-slate-400 font-medium block">تاريخ الميلاد</span>
                <span className="font-bold text-slate-800">{profileStudent.birthDate}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-slate-400 font-medium block">تاريخ الالتحاق</span>
                <span className="font-bold text-slate-800">{profileStudent.joinDate}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5 sm:col-span-2">
                <span className="text-slate-400 font-medium block">هاتف التواصل</span>
                <PhoneDisplay phone={profileStudent.parentPhone} showIcon />
              </div>
            </div>

            {/* Attendance & Behavior Summary Tabs */}
            {(() => {
              const stdAtt = attendance.filter((a) => a.studentId === profileStudent.id || a.studentName === profileStudent.name);
              const stdPresent = stdAtt.filter((a) => a.status === 'حاضر' || a.status === 'متأخر').length;
              const rate = stdAtt.length > 0 ? Math.round((stdPresent / stdAtt.length) * 100) : 0;
              const label = rate >= 90 ? 'ممتاز' : rate >= 75 ? 'جيد جداً' : rate >= 50 ? 'مقبول' : 'يحتاج متابعة';
              const streakInfo = getStudentStreakInfo(profileStudent.id, schoolId);
              return (
                <div className="space-y-2.5">
                  <div className="p-4 bg-emerald-50/60 border border-emerald-200/60 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-emerald-900">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        نسبة الانضباط والحضور هذا الفصل: {rate}%
                      </span>
                      <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px]">{label}</span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      سجلات الحضور المسجلة للتعليم: {stdAtt.length} يوم (حضور: {stdPresent}، غياب: {stdAtt.length - stdPresent})
                    </p>
                  </div>

                  {/* Attendance Streak Banner */}
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                        <Flame className="w-5 h-5 fill-white animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900">سلسلة المواظبة الحالية:</span>
                          <span className="font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md font-mono text-xs">
                            {streakInfo.currentStreak} يوم متتالي 🔥
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold">
                          أطول سلسلة سابقة: {streakInfo.longestStreak} يوم • المستوى: {streakInfo.streakTitle}
                        </p>
                      </div>
                    </div>

                    {streakInfo.nextMilestone > streakInfo.currentStreak && (
                      <div className="text-left shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 block">الهدف القادم</span>
                        <span className="text-xs font-black text-amber-700 font-mono">
                          {streakInfo.nextMilestone} أيام ({streakInfo.daysToNextMilestone} أيام متبقية)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Badges Section */}
            {(() => {
              const stdBadges = getGroupedStudentBadges(profileStudent.id);
              const totalCount = stdBadges.reduce((acc, b) => acc + b.count, 0);
              return (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>🏅 الأوسمة والتكريمات ({totalCount})</span>
                    </h4>
                  </div>
                  {stdBadges.length === 0 ? (
                    <BadgesEmptyState />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                      {stdBadges.map(({ badge, count, latestAssignment }) => (
                        <BadgeCard
                          key={badge.id}
                          badge={badge}
                          assignment={latestAssignment}
                          count={count}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Administrative Actions History Section */}
            {(() => {
              const studentActions = getStudentAdminActions(profileStudent.id);
              return (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-red-600" />
                      <span>📜 السجل الإداري والقرارات الصادرة ({studentActions.length})</span>
                    </h4>
                  </div>

                  {studentActions.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                      لا توجد أية استدعاءات أولياء أمور أو قرارات إيقاف سابقة لهذا الطالب.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto p-1">
                      {studentActions.map((act) => {
                        const isSummons = act.actionType === 'parent_summons';
                        return (
                          <div
                            key={act.id}
                            className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                              isSummons ? 'bg-red-50/60 border-red-200' : 'bg-amber-50/60 border-amber-200'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className="flex items-center gap-1 text-slate-900">
                                {isSummons ? (
                                  <>
                                    <PhoneCall className="w-3.5 h-3.5 text-red-600" />
                                    <span>استدعاء ولي الأمر</span>
                                  </>
                                ) : (
                                  <>
                                    <UserX className="w-3.5 h-3.5 text-amber-700" />
                                    <span>إيقاف مؤقت عن الدراسة</span>
                                  </>
                                )}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">{act.createdAt.split('T')[0]}</span>
                            </div>

                            <p className="text-slate-800 font-medium">
                              <strong>السبب:</strong> {act.reason}
                            </p>

                            {isSummons ? (
                              <p className="text-[11px] text-slate-600">
                                موعد الحضور: {act.summonsDate} - الوقت: {act.summonsTime}
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-600">
                                من {act.startDate} إلى {act.endDate}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}


            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/80 flex justify-end shrink-0">
              <button
                onClick={() => setProfileStudent(null)}
                className="px-6 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudentId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 text-center shadow-xl border border-slate-200">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">حذف الطالب نهائياً؟</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              سيتم إزالة كافة درجات الطالب، سجل الحضور والغياب، وملف السلوك من قاعدة بيانات المدرسة.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingStudentId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome SMS Modal */}
      {isWelcomeSmsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 text-right space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base">إرسال رسائل الترحيب للطلاب (SMS)</h3>
              </div>
              <button
                type="button"
                onClick={() => !isSendingWelcomeSms && setIsWelcomeSmsModalOpen(false)}
                disabled={isSendingWelcomeSms}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <p className="leading-relaxed font-medium">
                عند التأكيد، سيتم إرسال رسالة ترحيبية تلقائية تحتوي على بيانات الدخول وكود الطالب عبر <strong>SMS</strong> لكل طالب يمتلك رقم هاتف مسجل.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
                  <span className="text-emerald-800 text-[11px] font-bold block">طلاب لديهم رقم هاتف (مستهدفين):</span>
                  <strong className="text-emerald-900 font-mono text-lg block">
                    {studentsWithPhone.length} طالب
                  </strong>
                </div>

                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
                  <span className="text-amber-800 text-[11px] font-bold block">بدون رقم هاتف (سيتم تخطيهم):</span>
                  <strong className="text-amber-900 font-mono text-lg block">
                    {studentsWithoutPhone.length} طالب
                  </strong>
                </div>
              </div>

              {/* Message Sample */}
              <div className="p-3.5 bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold border-b border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>معاينة نص الترحيب:</span>
                  </span>
                  <span className="text-slate-400 font-mono">SMS Sample</span>
                </div>
                <p className="font-sans text-[11px] leading-relaxed whitespace-pre-line text-slate-300">
                  {`أهلاً بك عزيزي ولي الأمر / [اسم ولي الأمر] 🌟
يسر إدارة المدرسة الترحيب بكم في المنصة التعليمية للعام الدراسي.

بيانات دخول الطالب:
الاسم: [اسم الطالب]
كود الطالب: [STD-2026-XXXX]
رابط المنصة: ${DEFAULT_PLATFORM_URL}

نتمنى لطالبنا العزيز عاماً حافلاً بالتفوق والنجاح!`}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsWelcomeSmsModalOpen(false)}
                disabled={isSendingWelcomeSms}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmSendWelcomeSms}
                disabled={isSendingWelcomeSms || studentsWithPhone.length === 0}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-emerald-200 flex items-center gap-1.5"
              >
                {isSendingWelcomeSms ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري إرسال الرسائل...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>تأكيد وإرسال الترحيب ({studentsWithPhone.length} طالب) 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Printable Login Cards Modal */}
      <PrintableLoginCardsModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onAddToast={onToast}
        schoolId={schoolId}
        students={students}
        classes={classes}
      />
    </div>
  );
}
