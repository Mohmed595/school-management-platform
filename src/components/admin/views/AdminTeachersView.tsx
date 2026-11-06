import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { AvatarDisplay } from '../../ui/AvatarDisplay';
import { getUserAvatarLayoutUid } from '../../../lib/avatarLayouts';
import {
  GraduationCap,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  BookOpen,
  Building2,
  Phone,
  Mail,
  CheckCircle2,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  Printer,
} from 'lucide-react';
import { PrintableTeacherLoginCardsModal } from '../../messages/PrintableTeacherLoginCardsModal';
import { Teacher, ClassRoom, Subject } from '../../../types/admin';
import { PhoneDisplay } from '../../ui/PhoneDisplay';
import { downloadExcelAttachment } from '../../../lib/excelGenerator';

interface AdminTeachersViewProps {
  schoolId: string;
  teachers: Teacher[];
  classes: ClassRoom[];
  subjects: Subject[];
  onSaveTeacher: (teacher: Teacher) => Promise<void> | void;
  onDeleteTeacher: (teacherId: string) => Promise<void> | void;
  onToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export function AdminTeachersView({
  schoolId,
  teachers,
  classes,
  subjects,
  onSaveTeacher,
  onDeleteTeacher,
  onToast,
}: AdminTeachersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingTeacherId, setDeletingTeacherId] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Excel Import state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreviewList, setImportPreviewList] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    nationalId: '',
    phone: '',
    email: '',
    username: '',
    password: '',
    isAttendanceOfficer: false,
    specialization: '',
    status: 'نشط' as 'نشط' | 'إجازة' | 'غير نشط',
    assignedClasses: [] as string[],
    assignedSubjects: [] as string[],
  });

  const filteredTeachers = teachers.filter((t) => {
    if (!t) return false;
    const q = (searchTerm || '').trim().toLowerCase();
    if (!q) return true;
    return (
      (Boolean(t.name) && t.name.toLowerCase().includes(q)) ||
      (Boolean(t.specialization) && t.specialization.toLowerCase().includes(q)) ||
      (Boolean(t.nationalId) && t.nationalId.toLowerCase().includes(q)) ||
      (Boolean(t.username) && t.username.toLowerCase().includes(q))
    );
  });

  const handleOpenCreate = () => {
    setEditingTeacher(null);
    setFormData({
      name: '',
      nationalId: `28${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      phone: '',
      email: '',
      username: '',
      password: `${Math.floor(10000 + Math.random() * 90000)}`,
      isAttendanceOfficer: false,
      specialization: 'اللغة العربية والتربية الدينية',
      status: 'نشط',
      assignedClasses: [classes[0]?.name || 'الصف الأول الإعدادي - أ'],
      assignedSubjects: [subjects[0]?.name || 'اللغة العربية'],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    const isHashed = teacher.password?.startsWith('scrypt:') || teacher.password?.startsWith('$');
    setFormData({
      name: teacher.name || '',
      nationalId: teacher.nationalId || '',
      phone: teacher.phone || '',
      email: teacher.email || '',
      username: teacher.username || teacher.name || '',
      password: isHashed ? '' : (teacher.password || ''),
      isAttendanceOfficer: Boolean(teacher.isAttendanceOfficer),
      specialization: teacher.specialization || '',
      status: teacher.status || 'نشط',
      assignedClasses: teacher.assignedClasses || [],
      assignedSubjects: teacher.assignedSubjects || [],
    });
    setIsModalOpen(true);
  };

  const toggleClassAssignment = (className: string) => {
    setFormData((prev) => {
      const exists = prev.assignedClasses.includes(className);
      return {
        ...prev,
        assignedClasses: exists
          ? prev.assignedClasses.filter((c) => c !== className)
          : [...prev.assignedClasses, className],
      };
    });
  };

  const toggleSubjectAssignment = (subjectName: string) => {
    setFormData((prev) => {
      const exists = prev.assignedSubjects.includes(subjectName);
      return {
        ...prev,
        assignedSubjects: exists
          ? prev.assignedSubjects.filter((s) => s !== subjectName)
          : [...prev.assignedSubjects, subjectName],
      };
    });
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const teacherName = formData.name.trim();
    if (!teacherName || !formData.nationalId.trim()) {
      onToast('خطأ في البيانات', 'يرجى كتابة اسم المعلم والرقم القومي', 'error');
      return;
    }

    // Password as string
    const inputPassword = String(formData.password || '').trim();
    const effectivePassword = inputPassword || editingTeacher?.password || '';
    if (!effectivePassword) {
      onToast('كلمة المرور مطلوبة', 'يرجى إدخال كلمة المرور (الباسورد) الخاصة بالمعلم للدخول', 'error');
      return;
    }

    // Constraint: Check max 1 attendance officer
    if (formData.isAttendanceOfficer) {
      const existingAttendanceOfficer = teachers.find(
        (t) => t.isAttendanceOfficer && t.id !== editingTeacher?.id
      );
      if (existingAttendanceOfficer) {
        onToast(
          'تعديل مسؤول الحضور والغياب',
          `تم تحويل صفة محضر الغياب من (${existingAttendanceOfficer.name}) إلى (${teacherName}) - حيث يسمح بحساب واحد فقط لكل مدرسة.`,
          'info'
        );
      }
    }

    const teacherObj: Teacher = {
      id: editingTeacher ? editingTeacher.id : `tch-${schoolId}-${Date.now()}`,
      schoolId,
      name: teacherName,
      nationalId: formData.nationalId.trim(),
      phone: formData.phone.trim(),
      email: formData.email || '',
      // For teachers: username = name. For attendance officer: custom or name.
      username: formData.isAttendanceOfficer ? (formData.username?.trim() || teacherName) : teacherName,
      password: effectivePassword,
      isAttendanceOfficer: formData.isAttendanceOfficer,
      specialization: formData.specialization,
      status: formData.status,
      assignedClasses: formData.assignedClasses,
      assignedSubjects: formData.assignedSubjects,
      joinDate: editingTeacher ? editingTeacher.joinDate : new Date().toISOString().split('T')[0],
    };

    setIsSaving(true);
    try {
      await onSaveTeacher(teacherObj);
      setIsModalOpen(false);
      onToast(
        editingTeacher ? 'تم تحديث بيانات المعلم' : 'تم إضافة المعلم بنجاح',
        `أستاذ: ${teacherName} - كلمة المرور للدخول: ${effectivePassword}`,
        'success'
      );
    } catch (err: any) {
      console.error('Error saving teacher:', err);
      onToast('خطأ في حفظ المعلم بالخادم', err?.message || 'فشلت عملية حفظ المعلم في قاعدة البيانات المركزية', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ----------------------------------------------------
  // Excel Template & Import Logic
  // ----------------------------------------------------
  const handleDownloadTemplate = () => {
    try {
      const headers = ['الاسم', 'باسورد', 'التخصص', 'الرقم القومي', 'رقم الهاتف', 'البريد الإلكتروني'];
      const sampleData = [
        ['أ. هبة الله محمود', 'Pass#2026', 'رياض أطفال وتربية مبكرة (KG)', '29305120102934', '01011223344', 'heba.m@school.edu.eg'],
        ['أ. منى السيد', 'Pass#2026', 'اللغة العربية - المرحلة الابتدائية', '29008151203948', '01122334455', 'mona.elsayed@school.edu.eg'],
        ['أ. محمد عبد السلام', 'Pass#2026', 'اللغة العربية والتربية الدينية', '28805120102934', '01011223344', 'm.abdelsalam@school.edu.eg'],
      ];

      const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'المعلمين');
      XLSX.writeFile(wb, 'نموذج_استيراد_المعلمين.xlsx');
      onToast('تم تحميل النموذج', 'تم تنزيل نموذج إكسيل لاستيراد المعلمين بنجاح', 'success');
    } catch (err: any) {
      console.error('Error generating template:', err);
      onToast('فشل التحميل', 'تعذر توليد ملف النموذج', 'error');
    }
  };

  const handleExportTeachersExcel = () => {
    try {
      const listToExport = filteredTeachers.length > 0 ? filteredTeachers : teachers;
      if (listToExport.length === 0) {
        onToast('لا يوجد معلمين', 'لا توجد بيانات معلمين مقتطعة لتصديرها حالياً', 'info');
        return;
      }

      const columns = [
        'م',
        'اسم المعلم (Name)',
        'المواد الدراسية (Subjects)',
        'كلمة المرور (Password)',
        'الرقم القومي (Government ID)',
        'رقم الهاتف (Phone)',
        'التخصص الأكاديمي',
        'الفصول المسندة',
      ];

      const rows = listToExport.map((tch, idx) => [
        idx + 1,
        tch.name || 'غير مسجل',
        Array.isArray(tch.assignedSubjects) && tch.assignedSubjects.length > 0
          ? tch.assignedSubjects.join(' - ')
          : 'غير مخصص',
        tch.password || (tch as any).ministryCode || 'Password123',
        tch.nationalId || 'غير مسجل',
        tch.phone || 'غير مسجل',
        tch.specialization || 'عام',
        Array.isArray(tch.assignedClasses) && tch.assignedClasses.length > 0
          ? tch.assignedClasses.join(' - ')
          : 'غير مخصص',
      ]);

      downloadExcelAttachment({
        fileName: `سجل_بيانات_المعلمين_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: 'بيانات_المعلمين',
        metadata: {
          title: 'كشف وسجل بيانات وتكليفات المعلمين وكلمات المرور الرسمية',
        },
        columns,
        rows,
      });

      onToast('تم تصدير ملف الإكسيل', 'تم استخراج كشف المعلمين شاملاً الأسماء والمواد وكلمات المرور والأرقام القومية بنجاح', 'success');
    } catch (err: any) {
      console.error('Error exporting teachers excel:', err);
      onToast('فشل التصدير', err?.message || 'تعذر توليد واستخراج ملف الإكسيل للمعلمين', 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        // Parse with raw: false so numbers like 00123 are preserved as strings
        const wb = XLSX.read(bstr, { type: 'binary', raw: false, cellText: true });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });

        if (rows.length === 0) {
          onToast('الملف فارغ', 'لا يحتوي ملف الإكسيل على صفوف بيانات صالحة', 'error');
          return;
        }

        const getVal = (row: any, keys: string[]) => {
          for (const k of keys) {
            if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
              return String(row[k]).trim();
            }
          }
          const rowKeys = Object.keys(row);
          for (const k of keys) {
            const cleanK = k.trim().toLowerCase().replace(/[\s_\-]/g, '').replace(/ة/g, 'ه').replace(/[أإآ]/g, 'ا');
            const foundK = rowKeys.find((rk) => {
              const cleanRk = rk.trim().toLowerCase().replace(/[\s_\-]/g, '').replace(/ة/g, 'ه').replace(/[أإآ]/g, 'ا');
              return cleanRk === cleanK;
            });
            if (foundK && row[foundK] !== undefined && row[foundK] !== null && String(row[foundK]).trim() !== '') {
              return String(row[foundK]).trim();
            }
          }
          return '';
        };

        const parsedTeachers: any[] = [];
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          const name = getVal(r, ['الاسم', 'اسم المعلم', 'الاسم الثلاثي', 'اسم المدرس', 'Name', 'Teacher Name']);
          if (!name) continue;

          // Treat password strictly as a STRING, never convert to JS number!
          const teacherPassword = getVal(r, [
            'باسورد',
            'الباسورد',
            'كلمة المرور',
            'كلمه المرور',
            'كلمة السر',
            'كلمه السر',
            'Password',
            'password',
            'Pass',
            'pass',
            'كود الوزارة',
            'كود الوزاره',
            'كود المعلم',
            'كود_المعلم',
            'Ministry Code',
            'كود',
            'Code',
          ]);

          const specialization = getVal(r, ['التخصص', 'المادة', 'المادة الدراسية', 'Specialization']) || 'عام';
          const nationalId = getVal(r, ['الرقم القومي', 'الرقم_القومي', 'National ID', 'القومي']) || `29${Math.floor(100000000000 + Math.random() * 900000000000)}`;
          const phone = getVal(r, ['رقم الهاتف', 'الهاتف', 'الموبايل', 'Phone', 'رقم الموبايل']);
          const email = getVal(r, ['البريد الإلكتروني', 'الإيميل', 'Email']);

          const finalPass = teacherPassword || `${Math.floor(10000 + Math.random() * 90000)}`;

          parsedTeachers.push({
            name,
            password: finalPass,
            ministryCode: finalPass,
            specialization,
            nationalId,
            phone,
            email,
          });
        }

        if (parsedTeachers.length === 0) {
          onToast('تنسيق غير متطابق', 'يرجى التأكد من كتابة عمود "الاسم" و "باسورد" في رأس الجدول', 'error');
          return;
        }

        setImportPreviewList(parsedTeachers);
        onToast('تم قراءة الملف', `تم التعرف على ${parsedTeachers.length} معلماً جاهزاً للاستيراد`, 'info');
      } catch (err: any) {
        console.error('Error parsing excel:', err);
        onToast('فشل قراءة الملف', err?.message || 'تأكد من اختيار ملف إكسيل (.xlsx أو .xls) صالح', 'error');
      }
    };
    reader.readAsBinaryString(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = async () => {
    if (importPreviewList.length === 0) return;
    setIsImporting(true);
    let successCount = 0;

    try {
      for (const t of importPreviewList) {
        const teacherPass = String(t.password || t.ministryCode || '').trim();
        const teacherObj: Teacher = {
          id: `tch-${schoolId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          schoolId,
          name: t.name,
          nationalId: t.nationalId,
          phone: t.phone,
          email: t.email || `${t.name.split(' ')[0].toLowerCase()}@school.edu.eg`,
          // Store name in username
          username: t.name,
          // Password saved directly
          password: teacherPass,
          isAttendanceOfficer: false,
          specialization: t.specialization,
          status: 'نشط',
          assignedClasses: [classes[0]?.name || 'الصف الأول الابتدائي - أ'],
          assignedSubjects: [t.specialization || subjects[0]?.name || 'عام'],
          joinDate: new Date().toISOString().split('T')[0],
        };

        await onSaveTeacher(teacherObj);
        successCount++;
      }

      onToast('اكتمل الاستيراد بنجاح', `تم استيراد ${successCount} معلماً بنجاح بحسابات الدخول (الاسم + باسورد)`, 'success');
      setImportPreviewList([]);
      setIsImportModalOpen(false);
    } catch (err: any) {
      console.error('Error importing teachers:', err);
      onToast('حدث خطأ أثناء الاستيراد', err?.message || 'تعذر إكمال استيراد بعض المعلمين', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTeacherId) return;
    setIsSaving(true);
    try {
      await onDeleteTeacher(deletingTeacherId);
      setDeletingTeacherId(null);
      onToast('تم حذف المعلم', 'تم إزالة سجل المعلم من الخادم وقاعدة البيانات بنجاح', 'success');
    } catch (err: any) {
      console.error('Error deleting teacher:', err);
      onToast('فشل حذف المعلم', err?.message || 'تعذر حذف سجل المعلم من الخادم المركزي', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Actions Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="البحث باسم المعلم، التخصص، أو الرقم القومي..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          {/* Printable Teacher Login Cards Button */}
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer border border-blue-500/30 active:scale-95"
            title="طباعة بطاقات تسجيل الدخول للمعلمين PDF"
          >
            <Printer className="w-4 h-4" />
            <span>🖨️ طباعة PDF للمدرسين</span>
          </button>

          <button
            type="button"
            onClick={handleExportTeachersExcel}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
            title="تصدير كشف بيانات وكلمات مرور المعلمين كملف إكسيل (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>تصدير المعلمين (Excel)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setImportPreviewList([]);
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>استيراد المعلمين (Excel)</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة معلم جديد</span>
          </button>
        </div>
      </div>

      {/* Teachers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.map((tch) => (
          <div
            key={tch.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <AvatarDisplay
                    layoutUid={tch.avatar_layout_uid || getUserAvatarLayoutUid(tch.id)}
                    size="md"
                  />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 block">{tch.name}</h4>
                    <span className="text-[11px] font-semibold text-blue-600 block">
                      {tch.specialization}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    tch.status === 'نشط'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                  }`}
                >
                  {tch.status}
                </span>
              </div>

              {/* Details List */}
              <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <PhoneDisplay phone={tch.phone} showIcon />
                </div>
              </div>

              {/* Assigned Subjects & Classes */}
              <div className="space-y-2 pt-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">المواد المدرسة:</span>
                  <div className="flex flex-wrap gap-1">
                    {tch.assignedSubjects.length > 0 ? (
                      tch.assignedSubjects.map((sbj, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold"
                        >
                          {sbj}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400">غير مخصص</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">الصفوف المخصصة:</span>
                  <div className="flex flex-wrap gap-1">
                    {tch.assignedClasses.length > 0 ? (
                      tch.assignedClasses.map((cls, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-50 text-blue-700 border border-blue-200/60 px-2 py-0.5 rounded text-[10px] font-semibold"
                        >
                          {cls}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400">غير مخصص</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Row */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-slate-400 font-mono">القومي: {tch.nationalId}</span>
                {tch.password && !tch.password.startsWith('scrypt:') && !tch.password.startsWith('$') ? (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded font-mono font-bold" title="كلمة المرور للدخول">
                    باسورد: {tch.password}
                  </span>
                ) : tch.password ? (
                  <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono font-medium" title="كلمة المرور مشفرة ومحفوظة">
                    باسورد: ••••••••
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(tch)}
                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                  title="تعديل وتعيين المواد والصفوف"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeletingTeacherId(tch.id)}
                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="حذف المعلم"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingTeacher ? 'تعديل بيانات وتكليفات المعلم' : 'إضافة معلم جديد'}
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
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المعلم الثلاثي *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: أ. محمد عبد السلام"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">التخصص الأكاديمي *</label>
                  <input
                    type="text"
                    required
                    value={formData.specialization || ''}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="مثال: اللغة العربية والتربية الدينية"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                {!formData.isAttendanceOfficer ? (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      كلمة المرور للدخول (Password) {editingTeacher ? '(اتركه فارغاً للإبقاء على الحالي)' : '*'}
                    </label>
                    <input
                      type="text"
                      required={!editingTeacher && !editingTeacher?.password}
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editingTeacher && !formData.password ? '•••••••• (كلمة المرور الحالية محفوظة)' : 'أدخل كلمة المرور الخاصة بالمعلم'}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      يتم تسجيل دخول المعلم بواسطة <strong>الاسم</strong> و <strong>باسورد</strong>
                    </span>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">اسم المستخدم للدخول (Username) *</label>
                      <input
                        type="text"
                        required
                        value={formData.username || ''}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="att_officer"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">كلمة المرور (Password) *</label>
                      <input
                        type="text"
                        required
                        value={formData.password || ''}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Password123"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                <div className="sm:col-span-2 bg-amber-50/60 border border-amber-200 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-amber-900 block">حساب محضر الغياب للمدرسة</span>
                    <span className="text-[11px] text-amber-700">تخصيص الحساب كمحضر وغياب معتمد (حد أقصى حساب واحد بالمدرسة)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isAttendanceOfficer}
                    onChange={(e) => setFormData({ ...formData, isAttendanceOfficer: e.target.checked })}
                    className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الرقم القومي (14 رقم) *</label>
                  <input
                    type="text"
                    required
                    value={formData.nationalId || ''}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Assign Subjects Section */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 block">تعيين المواد الدراسية:</span>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((sbj) => {
                    const isAssigned = formData.assignedSubjects.includes(sbj.name);
                    return (
                      <button
                        type="button"
                        key={sbj.id}
                        onClick={() => toggleSubjectAssignment(sbj.name)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isAssigned
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sbj.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assign Classes Section */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 block">تعيين الصفوف الدراسية:</span>
                <div className="flex flex-wrap gap-2">
                  {classes.map((cls) => {
                    const isAssigned = formData.assignedClasses.includes(cls.name);
                    return (
                      <button
                        type="button"
                        key={cls.id}
                        onClick={() => toggleClassAssignment(cls.name)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isAssigned
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cls.name}
                      </button>
                    );
                  })}
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

      {/* Delete Teacher Modal */}
      {deletingTeacherId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 text-center shadow-xl border border-slate-200">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">حذف بيانات المعلم؟</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              سيتم إزالة جدول الحصص وتكليفات المواد الخاصة بهذا المعلم من المدرسة.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingTeacherId(null)}
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

      {/* Excel Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">استيراد المعلمين من ملف إكسيل</h3>
                  <p className="text-xs text-slate-500">حسابات المعلمين: الاسم + باسورد</p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-blue-900 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-1">تعليمات الاستيراد:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-blue-800 text-[11px]">
                    <li>عمود <strong>الاسم</strong>: اسم المعلم الكامل أو مع اللقب (أ. فلان).</li>
                    <li>عمود <strong>باسورد</strong>: يتم حفظه كنص ويستخدم ككلمة مرور للدخول، مع الحفاظ على الأرقام والرموز.</li>
                    <li>أعمدة اختيارية: التخصص، الرقم القومي، رقم الهاتف، البريد الإلكتروني.</li>
                  </ul>
                </div>
              </div>

              {/* Upload & Template Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">اختر ملف الإكسيل (.xlsx أو .xls)</p>
                  <p className="text-[11px] text-slate-500">أو يمكنك تنزيل النموذج المعتمد وتعبئة بيانات الكادر</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>تنزيل النموذج</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>اختيار الملف</span>
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              {importPreviewList.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      معاينة البيانات المستخرجة ({importPreviewList.length} معلماً):
                    </span>
                    <button
                      type="button"
                      onClick={() => setImportPreviewList([])}
                      className="text-[11px] text-red-600 hover:underline cursor-pointer"
                    >
                      مسح المعاينة
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                        <tr>
                          <th className="p-2.5">الاسم</th>
                          <th className="p-2.5">باسورد</th>
                          <th className="p-2.5">التخصص</th>
                          <th className="p-2.5">الرقم القومي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {importPreviewList.map((tch, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{tch.name}</td>
                            <td className="p-2.5 font-mono text-emerald-700 font-bold">{tch.password || tch.ministryCode}</td>
                            <td className="p-2.5 text-slate-600">{tch.specialization}</td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-500">{tch.nationalId}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={importPreviewList.length === 0 || isImporting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-2"
              >
                {isImporting ? (
                  <span>جاري الاستيراد...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد استيراد ({importPreviewList.length}) معلماً</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Teacher Login Cards Modal */}
      <PrintableTeacherLoginCardsModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onAddToast={onToast}
        schoolId={schoolId}
        teachers={teachers}
      />
    </div>
  );
}
