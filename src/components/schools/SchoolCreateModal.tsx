import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { Governorate, SubscriptionPlan, EGYPT_GOVERNORATES, School } from '../../types';
import { schoolSchema, SchoolFormData } from '../../lib/validation';
import { generateSchoolCode, generateLicenseKey } from '../../lib/storage';
import { validateStudentImportApi, CreateSchoolPayload, ImportResultSummary } from '../../lib/schoolApi';
import { mapEgyptianSheetName } from '../../lib/egyptianSchoolUtils';
import {
  parseExcelFilesToBatches,
  validateStudentBatches,
  ParsedStudentRow,
  ParsedClassBatch,
} from '../../lib/excelStudentImporter';
import {
  X,
  Building2,
  Sparkles,
  Users,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Search,
  Check,
  RefreshCw,
  FileText,
  AlertCircle,
  Plus,
  Trash2,
  Layers,
} from 'lucide-react';

interface SchoolCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSchool: (schoolPayload: CreateSchoolPayload) => Promise<{ school: School; importResult?: ImportResultSummary } | void>;
  onToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export function SchoolCreateModal({
  isOpen,
  onClose,
  onCreateSchool,
  onToast,
}: SchoolCreateModalProps) {
  const [formData, setFormData] = useState<SchoolFormData>({
    name: '',
    governorate: 'القاهرة',
    principalName: '',
    principalPhone: '010',
    principalEmail: '',
    subscription: 'احترافي',
    studentsCount: 0,
    teachersCount: 0,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SchoolFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Multi-File Excel State
  const [files, setFiles] = useState<File[]>([]);
  const [classBatches, setClassBatches] = useState<ParsedClassBatch[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedStudents, setParsedStudents] = useState<ParsedStudentRow[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'valid' | 'errors'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Final Import Summary Modal View
  const [finalReport, setFinalReport] = useState<{ school: School; importResult?: ImportResultSummary } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live preview fields
  const previewGov = (formData.governorate as Governorate) || 'القاهرة';
  const previewCode = generateSchoolCode(previewGov);
  const previewLicense = generateLicenseKey();
  const todayDate = new Date().toISOString().slice(0, 10);

  // Download Sample Excel Template with Multiple Worksheets
  const downloadSampleExcel = () => {
    try {
      const headers = [['كود الوزارة', 'الاسم', 'الرقم القومي', 'السن']];

      const sampleData1 = [
        ['10293847', 'أحمد محمد علي السيد', '31801011234567', '7'],
        ['10293848', 'مريم محمود عبد العزيز', '31605151234568', '9'],
        ['10293849', 'عمر خالد مصطفى المغازي', '31409201234569', '11'],
        ['10293850', 'سارة إبراهيم حسن الشريف', '31208111234570', '13'],
        ['10293851', 'يوسف طارق كمال بدر', '31012051234571', '15'],
      ];

      const wb = XLSX.utils.book_new();

      const ws1 = XLSX.utils.aoa_to_sheet([...headers, ...sampleData1]);
      ws1['!cols'] = [{ wch: 18 }, { wch: 32 }, { wch: 22 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, ws1, 'بيانات الطلاب');

      XLSX.writeFile(wb, 'نموذج_استيراد_الطلاب_GGS.xlsx');
    } catch (err: any) {
      onToast('خطأ في تنزيل النموذج', err?.message || 'تعذر إنشاء ملف النموذج', 'error');
    }
  };

  // Handle Multi-Excel File Parsing & Validation
  const processExcelFiles = async (filesToProcess: File[]) => {
    setFileError(null);
    if (filesToProcess.length === 0) {
      clearExcelFiles();
      return;
    }

    // Check size limits (max 10MB per file)
    for (const f of filesToProcess) {
      if (f.size > 10 * 1024 * 1024) {
        setFileError(`حجم الملف (${f.name}) يتجاوز الحد الأقصى المسموح به (10 ميجابايت)`);
        return;
      }
    }

    setIsParsing(true);

    try {
      const fileBuffers = await Promise.all(
        filesToProcess.map(async (f) => ({
          name: f.name,
          buffer: await f.arrayBuffer(),
        }))
      );

      const rawBatches = await parseExcelFilesToBatches(fileBuffers);
      if (rawBatches.length === 0) {
        setFileError('لم يتم العثور على أوراق عمل صالحة في الملفات المحددة');
        setIsParsing(false);
        return;
      }

      // Flatten candidate students for DB duplicate check
      const allCandidates = rawBatches.flatMap((b) =>
        b.students.map((st) => ({
          name: st.name,
          ministryCode: st.ministryCode,
          nationalId: st.nationalId,
          className: st.className,
          sheetName: st.sheetName,
          fileName: st.fileName,
        }))
      );

      if (allCandidates.length > 5000) {
        setFileError(`إجمالي عدد الطلاب في الملفات (${allCandidates.length}) يتجاوز الحد الأقصى المسموح به (5,000 طالب)`);
        setIsParsing(false);
        return;
      }

      let dbExisting = { existingMinistryCodes: [], existingNationalIds: [] };
      if (allCandidates.length > 0) {
        try {
          dbExisting = await validateStudentImportApi(allCandidates);
        } catch (dbErr) {
          console.warn('DB live validation call failed:', dbErr);
        }
      }

      const { validatedBatches, allStudents } = validateStudentBatches(rawBatches, dbExisting);
      setClassBatches(validatedBatches);
      setParsedStudents(allStudents);
    } catch (err: any) {
      console.error('Error processing Excel files:', err);
      setFileError('حدث خطأ أثناء معالجة ملفات Excel: ' + (err?.message || 'يرجى مراجعة صياغة الملفات'));
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedList = Array.from(e.target.files);
      const existingNames = new Set(files.map((f) => f.name));
      const newlyAdded = selectedList.filter((f) => !existingNames.has(f.name));
      const combined = [...files, ...newlyAdded];
      setFiles(combined);
      processExcelFiles(combined);
    }
    if (e.target) e.target.value = '';
  };

  const removeFile = (fileNameToRemove: string) => {
    const remaining = files.filter((f) => f.name !== fileNameToRemove);
    setFiles(remaining);
    if (remaining.length === 0) {
      clearExcelFiles();
    } else {
      processExcelFiles(remaining);
    }
  };

  const clearExcelFiles = () => {
    setFiles([]);
    setClassBatches([]);
    setFileError(null);
    setParsedStudents([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Calculate parsed stats
  const validCount = parsedStudents.filter((s) => s.isValid).length;
  const errorCount = parsedStudents.filter((s) => !s.isValid).length;
  const duplicateCount = parsedStudents.filter(
    (s) => !s.isValid && ((s.errorReason && (s.errorReason.includes('مكرر') || s.errorReason.includes('مسجل سابقاً'))) || s.isDuplicate)
  ).length;
  const totalClassesCount = classBatches.length;
  const totalAgesCount = new Set(parsedStudents.filter((s) => s.isValid && s.age).map((s) => s.age)).size;

  // Filter list for inspection
  const filteredStudents = parsedStudents.filter((s) => {
    if (filterTab === 'valid' && !s.isValid) return false;
    if (filterTab === 'errors' && s.isValid) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.ministryCode.toLowerCase().includes(q) ||
        s.nationalId.toLowerCase().includes(q) ||
        (s.className ? s.className.toLowerCase().includes(q) : false) ||
        (s.age ? String(s.age).includes(q) : false) ||
        s.fileName.toLowerCase().includes(q) ||
        (s.errorReason && s.errorReason.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = schoolSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SchoolFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as keyof SchoolFormData] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare payload with school info and valid students array (including canonical age and standardized class)
      const validStudentsToImport = parsedStudents
        .filter((s) => s.isValid)
        .map((s) => {
          const rawCandidate = s.className || s.gradeLevel || s.age || s.sheetName || 'الصف الأول الابتدائي';
          const mappedCls = mapEgyptianSheetName(rawCandidate);
          const finalClassName = mappedCls.className || rawCandidate;
          const finalGradeLevel = mappedCls.gradeLevel || s.gradeLevel || s.age || 'المرحلة الدراسية';

          return {
            name: s.name,
            ministryCode: s.ministryCode,
            nationalId: s.nationalId,
            age: s.age,
            birthDate: s.birthDate,
            className: finalClassName,
            gradeLevel: finalGradeLevel,
            stage: mappedCls.stage || s.stage,
            sheetName: s.sheetName,
            fileName: s.fileName,
            rowNumber: s.rowNumber,
          };
        });

      const payload: CreateSchoolPayload = {
        id: `sch-${Date.now()}`,
        name: formData.name.trim(),
        code: generateSchoolCode(formData.governorate as Governorate),
        licenseKey: generateLicenseKey(),
        governorate: formData.governorate as Governorate,
        studentsCount: validStudentsToImport.length,
        teachersCount: formData.teachersCount,
        subscription: formData.subscription as SubscriptionPlan,
        status: 'نشطة',
        createdAt: todayDate,
        principalName: formData.principalName.trim(),
        principalPhone: formData.principalPhone.trim(),
        principalEmail: formData.principalEmail.trim(),
        licenseExpiry: `${new Date().getFullYear() + 1}-12-31`,
        students: validStudentsToImport,
      };

      const res = await onCreateSchool(payload);

      if (res && res.school) {
        if (res.importResult && res.importResult.total > 0) {
          // Show report view
          setFinalReport(res);
        } else {
          onClose();
          resetForm();
        }
      } else {
        onClose();
        resetForm();
      }
    } catch (err: any) {
      console.error('Error in SchoolCreateModal submit:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      governorate: 'القاهرة',
      principalName: '',
      principalPhone: '010',
      principalEmail: '',
      subscription: 'احترافي',
      studentsCount: 0,
      teachersCount: 0,
    });
    clearExcelFiles();
    setFinalReport(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">تسجيل مدرسة جديدة بالمنصة واستيراد الطلاب (GGS)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  إنشاء المدرسة + استيراد كشف الطلاب من ملف Excel بأسلوب مصفى وتراكمي
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* FINAL IMPORT REPORT VIEW */}
          {finalReport ? (
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-900 text-sm">تم إنشاء المدرسة وتطبيق التغييرات بنجاح!</h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    المدرسة: <strong>{finalReport.school.name}</strong> (الكود: <span className="font-mono">{finalReport.school.code}</span>)
                  </p>
                </div>
              </div>

              {finalReport.importResult && (
                <div className="space-y-4">
                  <h5 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    <span>ملخص نتيجة استيراد كشف الطلاب من Excel:</span>
                  </h5>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block mb-1">إجمالي الصفوف بالملف</span>
                      <span className="text-lg font-extrabold text-slate-800 font-mono">{finalReport.importResult.total}</span>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-emerald-700 block mb-1">تم حفظهم بقاعدة البيانات</span>
                      <span className="text-lg font-extrabold text-emerald-700 font-mono">{finalReport.importResult.imported}</span>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                      <span className="text-[10px] text-amber-700 block mb-1">سجلات مكررة (مرفوضة)</span>
                      <span className="text-lg font-extrabold text-amber-700 font-mono">{finalReport.importResult.duplicates}</span>
                    </div>
                    <div className="bg-red-50 p-3 rounded-xl border border-red-200">
                      <span className="text-[10px] text-red-700 block mb-1">بيانات غير صالحة</span>
                      <span className="text-lg font-extrabold text-red-700 font-mono">{finalReport.importResult.invalidRows}</span>
                    </div>
                  </div>

                  {/* Rejected details table if errors exist */}
                  {finalReport.importResult.errors && finalReport.importResult.errors.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h6 className="text-xs font-bold text-red-800">تفاصيل الصفوف المرفوضة أو المكررة:</h6>
                      <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto text-xs">
                        <table className="w-full text-right border-collapse">
                          <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                            <tr>
                              <th className="p-2 border-b"># السطر</th>
                              <th className="p-2 border-b">الاسم</th>
                              <th className="p-2 border-b">كود الوزارة</th>
                              <th className="p-2 border-b">الرقم القومي</th>
                              <th className="p-2 border-b">سبب عدم الاستيراد</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {finalReport.importResult.errors.map((err, idx) => (
                              <tr key={idx} className="hover:bg-red-50/50">
                                <td className="p-2 font-mono text-slate-500">{err.rowNumber}</td>
                                <td className="p-2 font-semibold text-slate-800">{err.name || '-'}</td>
                                <td className="p-2 font-mono text-slate-600">{err.ministryCode || '-'}</td>
                                <td className="p-2 font-mono text-slate-600">{err.nationalId || '-'}</td>
                                <td className="p-2 text-red-600 font-medium">{err.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Created Classes / Cohorts Badges */}
                  {finalReport.importResult.classesCreated && finalReport.importResult.classesCreated.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                      <span className="text-xs font-bold text-slate-800 block">
                        الصفوف والمراحل الدراسية التي تم قيد الطلاب بها ({finalReport.importResult.classesCreated.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {finalReport.importResult.classesCreated.map((cls, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-lg">
                            {cls}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      تم استيراد ({finalReport.importResult.imported}) طالباً وتوزيعهم بنجاح على{' '}
                      <strong>{finalReport.importResult.classesCount || finalReport.importResult.classesCreated?.length || 0} فصول دراسية</strong> من واقع أوراق العمل (Sheets) في الملفات.
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    resetForm();
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
                >
                  إغلاق ومتابعة
                </button>
              </div>
            </div>
          ) : (
            /* FORM VIEW */
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
              {/* Auto Generated Preview Banner */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-900 text-xs font-bold mb-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>التوليد الآلي والترخيص:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
                    <span className="text-[10px] text-slate-500 block">كود المدرسة المولّد:</span>
                    <span className="font-mono font-bold text-blue-700">{previewCode}</span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
                    <span className="text-[10px] text-slate-500 block">مفتاح الترخيص:</span>
                    <span className="font-mono font-bold text-emerald-700">{previewLicense}</span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
                    <span className="text-[10px] text-slate-500 block">تاريخ التسجيل:</span>
                    <span className="font-mono font-bold text-slate-800">{todayDate}</span>
                  </div>
                </div>
              </div>

              {/* General Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* School Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    اسم المدرسة بالكامل *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: مدرسة بورسعيد النموذجية الرسمية لغات"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                      errors.name ? 'border-red-500' : 'border-slate-200 focus:ring-blue-600'
                    } rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all`}
                  />
                  {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
                </div>

                {/* Governorate */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    المحافظة المصرية *
                  </label>
                  <select
                    value={formData.governorate}
                    onChange={(e) => setFormData({ ...formData, governorate: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all cursor-pointer"
                  >
                    {EGYPT_GOVERNORATES.map((gov) => (
                      <option key={gov} value={gov}>
                        {gov}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subscription Plan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    خطة الاشتراك الترخيصي *
                  </label>
                  <select
                    value={formData.subscription}
                    onChange={(e) => setFormData({ ...formData, subscription: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all cursor-pointer"
                  >
                    <option value="بريميوم">بريميوم (Premium - شامل الدعم والتطبيقات)</option>
                    <option value="احترافي">احترافي (Pro - متقدم مع التقارير)</option>
                    <option value="أساسي">أساسي (Basic - الإشراف العام)</option>
                  </select>
                </div>

                {/* Principal Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    اسم مدير المدرسة *
                  </label>
                  <input
                    type="text"
                    value={formData.principalName}
                    onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                    placeholder="د. مصطفى كامل"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                      errors.principalName ? 'border-red-500' : 'border-slate-200 focus:ring-blue-600'
                    } rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all`}
                  />
                  {errors.principalName && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.principalName}</p>
                  )}
                </div>

                {/* Principal Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    رقم هاتف التواصل (مصري) *
                  </label>
                  <input
                    type="text"
                    value={formData.principalPhone}
                    onChange={(e) => setFormData({ ...formData, principalPhone: e.target.value })}
                    placeholder="01012345678"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                      errors.principalPhone ? 'border-red-500' : 'border-slate-200 focus:ring-blue-600'
                    } rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all font-mono`}
                  />
                  {errors.principalPhone && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.principalPhone}</p>
                  )}
                </div>

                {/* Principal Email */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    البريد الإلكتروني الإداري للمدرسة *
                  </label>
                  <input
                    type="email"
                    value={formData.principalEmail}
                    onChange={(e) => setFormData({ ...formData, principalEmail: e.target.value })}
                    placeholder="principal@school.edu.eg"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                      errors.principalEmail ? 'border-red-500' : 'border-slate-200 focus:ring-blue-600'
                    } rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all`}
                  />
                  {errors.principalEmail && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.principalEmail}</p>
                  )}
                </div>
              </div>

              {/* GGS EXCEL IMPORT SECTION */}
              <div className="border-t border-slate-200 pt-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>استيراد الطلاب وتحديد الصفوف من ملفات Excel</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      يمكنك تحديد ملف أو عدة ملفات Excel معاً، والتعرف التلقائي على السن والصف الدراسي لكل طالب بدون اشتراط تقسيم فصول مسبق.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={downloadSampleExcel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-200 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل نموذج Excel متعدد الصفوف</span>
                  </button>
                </div>

                {/* Hidden input for file selection */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Dropzone if no files selected */}
                {files.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                  >
                    <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">اضغط لاختيار ملف أو عدة ملفات Excel (.xlsx, .xls)</span>
                      <span className="text-[11px] text-slate-500">
                        يدعم اختيار ملفات متعددة دفعة واحدة • معالجة كافة أوراق العمل (Sheets) كفصول دراسية مستقلة
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                    {/* Selected Files Header & Action */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-blue-600" />
                          <span>الملفات المحددة ({files.length}):</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-600 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>إضافة ملفات أخرى</span>
                          </button>
                          <button
                            type="button"
                            onClick={clearExcelFiles}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-red-50 text-red-600 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>إلغاء الكل</span>
                          </button>
                        </div>
                      </div>

                      {/* Files Chips / List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {files.map((f, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-800 block truncate" title={f.name}>
                                  {f.name}
                                </span>
                                <span className="text-[10px] text-slate-500">{(f.size / 1024).toFixed(1)} كيلوبايت</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(f.name)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                              title="حذف هذا الملف"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {isParsing && (
                      <div className="flex items-center justify-center gap-2 py-3 text-xs text-blue-600 font-medium bg-blue-50/50 rounded-lg border border-blue-100">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري قراءة أوراق العمل وفحص السجلات ومطابقة الأكواد بالمنظومة...</span>
                      </div>
                    )}

                    {/* Stats summary cards if parsed */}
                    {!isParsing && parsedStudents.length > 0 && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                            <span className="text-[10px] text-slate-500 block">الفئات العمرية المكتشفة</span>
                            <span className="font-mono font-bold text-blue-700 text-sm">{totalAgesCount} فئة عمرية</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                            <span className="text-[10px] text-slate-500 block">إجمالي أسطر الطلاب</span>
                            <span className="font-mono font-bold text-slate-800 text-sm">{parsedStudents.length}</span>
                          </div>
                          <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                            <span className="text-[10px] text-emerald-700 block">صالحة للاستيراد</span>
                            <span className="font-mono font-bold text-emerald-700 text-sm">{validCount}</span>
                          </div>
                          <div className="bg-red-50 p-2.5 rounded-lg border border-red-200">
                            <span className="text-[10px] text-red-700 block">أخطاء ومكررة</span>
                            <span className="font-mono font-bold text-red-700 text-sm">{errorCount}</span>
                          </div>
                        </div>

                        {/* Classes / Batches Breakdown Table */}
                        {classBatches.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold text-slate-800 block">
                              تفاصيل أوراق العمل المستوردة:
                            </span>
                            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-36 overflow-y-auto bg-white text-xs">
                              <table className="w-full text-right border-collapse">
                                <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                                   <tr>
                                    <th className="p-2 border-b">اسم الملف</th>
                                    <th className="p-2 border-b">ورقة العمل (Sheet)</th>
                                    <th className="p-2 border-b">إجمالي الطلاب</th>
                                    <th className="p-2 border-b">الصالح</th>
                                    <th className="p-2 border-b">أخطاء</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {classBatches.map((batch, bIdx) => (
                                    <tr key={bIdx} className="hover:bg-slate-50">
                                      <td className="p-2 text-slate-600 truncate max-w-[120px]" title={batch.fileName}>
                                        {batch.fileName}
                                      </td>
                                      <td className="p-2 font-medium text-slate-800">{batch.sheetName}</td>
                                      <td className="p-2 font-mono text-slate-700">{batch.students.length}</td>
                                      <td className="p-2 font-mono text-emerald-700 font-bold">{batch.validCount}</td>
                                      <td className="p-2 font-mono text-red-600">
                                        {batch.errorCount > 0 ? batch.errorCount : '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Class assignment notice */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-[11px] text-blue-900 flex items-center gap-2">
                          <Info className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>
                            <strong>حالة الاستيراد:</strong> سيتم استيراد الطلاب وتسكينهم وتصنيفهم حسب السن ({validCount} طالب صالح) مباشرة ضمن معاملة واحدة ذرية (Atomic Transaction).
                          </span>
                        </div>

                        {/* Filterable Table */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg text-xs">
                              <button
                                type="button"
                                onClick={() => setFilterTab('all')}
                                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                                  filterTab === 'all' ? 'bg-white font-bold text-slate-800 shadow-2xs' : 'text-slate-600'
                                }`}
                              >
                                الكل ({parsedStudents.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setFilterTab('valid')}
                                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                                  filterTab === 'valid' ? 'bg-emerald-600 text-white font-bold shadow-2xs' : 'text-emerald-700'
                                }`}
                              >
                                الصالحة ({validCount})
                              </button>
                              <button
                                type="button"
                                onClick={() => setFilterTab('errors')}
                                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                                  filterTab === 'errors' ? 'bg-red-600 text-white font-bold shadow-2xs' : 'text-red-700'
                                }`}
                              >
                                المرفوضة/المكررة ({errorCount})
                              </button>
                            </div>

                            <div className="relative text-xs min-w-[180px]">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                              <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="بحث بالاسم أو الكود أو السن..."
                                className="w-full pr-8 pl-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-white text-xs">
                            <table className="w-full text-right border-collapse">
                              <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                                <tr>
                                  <th className="p-2 border-b"># السطر</th>
                                  <th className="p-2 border-b">الاسم</th>
                                  <th className="p-2 border-b">السن / المرحلة الدراسية</th>
                                  <th className="p-2 border-b">كود الوزارة/التلميذ</th>
                                  <th className="p-2 border-b">الرقم القومي (14 رقماً)</th>
                                  <th className="p-2 border-b">ورقة العمل / الملف</th>
                                  <th className="p-2 border-b">الحالة والتأكيد</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {filteredStudents.length === 0 ? (
                                  <tr>
                                    <td colSpan={7} className="p-4 text-center text-slate-400">
                                      لا توجد سجلات تطابق الفلتر الحالي
                                    </td>
                                  </tr>
                                ) : (
                                  filteredStudents.map((s, idx) => (
                                    <tr key={idx} className={s.isValid ? 'hover:bg-slate-50' : 'bg-red-50/40 hover:bg-red-50/70'}>
                                      <td className="p-2 font-mono text-slate-500">{s.rowNumber}</td>
                                      <td className="p-2 font-semibold text-slate-800">{s.name || '-'}</td>
                                      <td className="p-2 font-bold text-blue-700">
                                        {s.age ? s.age : <span className="text-red-500 font-normal text-[11px]">مفقود</span>}
                                      </td>
                                      <td className="p-2 font-mono text-slate-700">{s.ministryCode || '-'}</td>
                                      <td className="p-2 font-mono text-slate-700">{s.nationalId || '-'}</td>
                                      <td className="p-2 text-slate-600 text-[11px] truncate max-w-[110px]" title={`${s.fileName} - ${s.sheetName}`}>
                                        {s.sheetName || s.fileName || '-'}
                                      </td>
                                      <td className="p-2">
                                        {s.isValid ? (
                                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-full text-[10px]">
                                            <CheckCircle2 className="w-3 h-3" />
                                            جاهز للاستيراد
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-red-700 font-semibold bg-red-100 px-2 py-0.5 rounded-full text-[10px]">
                                            <XCircle className="w-3 h-3 shrink-0" />
                                            {s.errorReason || 'بيانات غير صالحة'}
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Banner */}
                {fileError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">خطأ في ملفات Excel:</strong>
                      <span>{fileError}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    resetForm();
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || isParsing}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>
                        {validCount > 0
                          ? `حفظ المدرسة واستيراد ${validCount} طالباً`
                          : 'حفظ وتوليد بيانات المدرسة'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
