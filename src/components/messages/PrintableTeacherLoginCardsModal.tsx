import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Printer,
  FileText,
  User,
  Key,
  Globe,
  FileArchive,
  RefreshCw,
  Lock,
  School as SchoolIcon,
  ChevronRight,
  ChevronLeft,
  Eye,
  CheckCircle2,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import QRCode from 'qrcode';
import { getStoredSchools, getStoredSession } from '../../lib/storage';
import { getTeachersBySchool, getSchoolAdminInfo } from '../../lib/adminStorage';
import { Teacher } from '../../types/admin';
import {
  GroupedTeacherPage,
  exportAllTeacherPagesToUnifiedPdf,
  exportAllTeacherPagesToImagesZip,
} from '../../lib/pdf/fast-canvas-card-renderer';

interface PrintableTeacherLoginCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToast: (title: string, description?: string, type?: 'success' | 'error' | 'info') => void;
  schoolId?: string;
  teachers?: Teacher[];
}

const CARDS_PER_PAGE = 16; // 4 columns x 4 rows
const CARD_WIDTH_MM = 40;
const CARD_HEIGHT_MM = 60;
const HORIZONTAL_GAP_MM = 5;
const VERTICAL_GAP_MM = 5;
const CARDS_PER_ROW = 4;
const MARGIN_LEFT_MM = 10;
const MARGIN_TOP_MM = 26;

export function PrintableTeacherLoginCardsModal({
  isOpen,
  onClose,
  onAddToast,
  schoolId,
  teachers: propTeachers,
}: PrintableTeacherLoginCardsModalProps) {
  const [platformUrl] = useState<string>('https://madrasety.ai.studio');
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportStatusText, setExportStatusText] = useState<string>('');
  const [exportProgressPercent, setExportProgressPercent] = useState<number>(0);
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [defaultQrDataUrl, setDefaultQrDataUrl] = useState<string>('');

  const schools = useMemo(() => getStoredSchools(), []);

  // Generate fallback QR for platform URL once
  useEffect(() => {
    QRCode.toDataURL(platformUrl, {
      width: 120,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => setDefaultQrDataUrl(url))
      .catch(() => {});
  }, [platformUrl]);

  // Active School Account
  const activeSchool = useMemo(() => {
    const session = getStoredSession();
    const targetId = schoolId || session?.schoolId;
    if (targetId) {
      const found = schools.find((s) => s.id === targetId);
      if (found) return found;

      const info = getSchoolAdminInfo(targetId);
      if (info) {
        return {
          id: targetId,
          name: info.name,
          code: info.code,
          governorate: (info.governorate || 'القاهرة') as any,
          educationalDistrict: info.educationalDistrict || '',
          address: info.address || '',
          phone: info.phone || '',
          email: info.email || '',
          principalName: info.principalName || '',
          academicYear: info.academicYear || '',
          type: 'حكومي' as const,
          studentCount: 0,
          teacherCount: 0,
          createdAt: new Date().toISOString().split('T')[0],
        };
      }
    }
    return schools[0] || null;
  }, [schoolId, schools]);

  // Group teachers into pages of 16 cards per page
  const pagesData: GroupedTeacherPage[] = useMemo(() => {
    if (!activeSchool) return [];

    const effectiveTeachers =
      propTeachers && propTeachers.length > 0
        ? propTeachers.filter((t) => !activeSchool.id || t.schoolId === activeSchool.id)
        : getTeachersBySchool(activeSchool.id);

    const sortedTeachers = [...effectiveTeachers].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'ar')
    );

    const totalTeachers = sortedTeachers.length;
    const totalPages = Math.ceil(totalTeachers / CARDS_PER_PAGE) || 1;

    const allPages: GroupedTeacherPage[] = [];

    for (let pIndex = 0; pIndex < totalPages; pIndex++) {
      const pageTeachers = sortedTeachers.slice(
        pIndex * CARDS_PER_PAGE,
        (pIndex + 1) * CARDS_PER_PAGE
      );

      allPages.push({
        schoolName: activeSchool.name,
        departmentTitle: 'هيئة التدريس والمواد الدراسية',
        totalTeachers,
        pageIndex: pIndex + 1,
        totalPages,
        teachers: pageTeachers,
      });
    }

    return allPages;
  }, [activeSchool, propTeachers]);

  // Keep currentPageIndex in valid bounds
  useEffect(() => {
    if (currentPageIndex >= pagesData.length && pagesData.length > 0) {
      setCurrentPageIndex(0);
    }
  }, [pagesData.length, currentPageIndex]);

  // Generate QR codes on-demand for teachers on current page
  const activePage = pagesData[currentPageIndex] || null;

  useEffect(() => {
    if (!isOpen || !activePage) return;

    let isMounted = true;
    const missingTeachers = activePage.teachers.filter((t) => !qrMap[t.id]);

    if (missingTeachers.length === 0) return;

    const generatePageQrs = async () => {
      const newItems: Record<string, string> = {};
      for (const teacher of missingTeachers) {
        const teacherPassword = (teacher.password && !teacher.password.startsWith('scrypt:') && !teacher.password.startsWith('$'))
          ? teacher.password
          : 'Pass#2026';
        const loginUrl = `${platformUrl.replace(/\/+$/, '')}/login?role=teacher&username=${encodeURIComponent(teacher.username || teacher.name)}&pwd=${encodeURIComponent(teacherPassword)}`;
        try {
          const dataUrl = await QRCode.toDataURL(loginUrl, {
            width: 120,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' },
            errorCorrectionLevel: 'M',
          });
          newItems[teacher.id] = dataUrl;
        } catch {
          // Fallback handled gracefully
        }
      }
      if (isMounted && Object.keys(newItems).length > 0) {
        setQrMap((prev) => ({ ...prev, ...newItems }));
      }
    };

    generatePageQrs();

    return () => {
      isMounted = false;
    };
  }, [isOpen, activePage, platformUrl, qrMap]);

  if (!isOpen) return null;

  const totalCardsCount = pagesData.reduce((acc, p) => acc + p.teachers.length, 0);

  // Direct Browser Native Print
  const handlePrint = () => {
    onAddToast('جاري تحضير الطباعة 🖨️', 'سيتم فتح نافذة الطباعة الآن للصفحة المعروضة.', 'info');
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Ultra-Fast Unified PDF Export for Teachers
  const handleExportUnifiedPdf = async () => {
    if (pagesData.length === 0) return;
    setIsExporting(true);
    setExportProgressPercent(5);
    setExportStatusText('جاري تجهيز بطاقات المعلمين للتحويل إلى PDF موحد...');
    onAddToast(
      'جاري إنشاء ملف PDF للمعلمين 📄',
      `جاري تحويل ${pagesData.length} صفحة ودمجها في ملف PDF واحد بسرعة فائقة...`,
      'info'
    );

    try {
      const pdfBlob = await exportAllTeacherPagesToUnifiedPdf(
        pagesData,
        platformUrl,
        (current, total, status) => {
          const percent = Math.min(98, Math.round((current / total) * 95) + 3);
          setExportProgressPercent(percent);
          setExportStatusText(status);
        }
      );

      setExportProgressPercent(100);
      setExportStatusText('تم تجهيز ملف PDF الموحد للمعلمين بنجاح!');

      const schoolNameClean = (activeSchool?.name || 'TeacherCards').replace(/[\\/*?:"<>|\s]+/g, '_');
      const pdfFileName = `بطاقات_دخول_المعلمين_${schoolNameClean}_${new Date().toISOString().slice(0, 10)}.pdf`;

      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = pdfFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      onAddToast(
        'تم تصدير ملف PDF للمعلمين بنجاح 📄',
        `تم حفظ ملف PDF موحد يحتوي على ${pagesData.length} صفحة لجميع المعلمين.`,
        'success'
      );
    } catch (err: any) {
      console.error('Teacher PDF export failed:', err);
      onAddToast('حدث خطأ أثناء تصدير ملف PDF', err?.message || 'تعذر توليد ملف PDF', 'error');
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgressPercent(0);
        setExportStatusText('');
      }, 700);
    }
  };

  // Secondary Option: Export as ZIP containing arranged PNG images
  const handleExportImagesZip = async () => {
    if (pagesData.length === 0) return;
    setIsExporting(true);
    setExportProgressPercent(5);
    setExportStatusText('جاري تجهيز صور بطاقات المعلمين لتجميعها داخل مجلد ZIP...');
    onAddToast('جاري البدء في تصدير الصور 🖼️', 'سيتم تحويل صفحات المعلمين إلى صور عالية الدقة وضغطها...', 'info');

    try {
      const zipBlob = await exportAllTeacherPagesToImagesZip(
        pagesData,
        platformUrl,
        (current, total, status) => {
          const percent = Math.min(95, Math.round((current / total) * 85) + 5);
          setExportProgressPercent(percent);
          setExportStatusText(status);
        }
      );

      setExportProgressPercent(100);
      setExportStatusText('تم إنشاء حزمة صور بطاقات المعلمين بنجاح!');

      const schoolNameClean = (activeSchool?.name || 'TeacherCards').replace(/[\\/*?:"<>|\s]+/g, '_');
      const zipFileName = `صور_بطاقات_المعلمين_${schoolNameClean}_${new Date().toISOString().slice(0, 10)}.zip`;

      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      onAddToast(
        'تم تحميل حزمة الصور بنجاح 🚀',
        `تم تنزيل ${pagesData.length} صورة PNG منظمة داخل مجلد ZIP.`,
        'success'
      );
    } catch (err: any) {
      console.error('Image ZIP export failed:', err);
      onAddToast('حدث خطأ أثناء تصدير الصور', err?.message || 'تعذر إنشاء ملف ZIP', 'error');
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgressPercent(0);
        setExportStatusText('');
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden dir-rtl text-right">
      <div className="bg-slate-100 rounded-3xl max-w-6xl w-full h-[95vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden font-sans">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold shadow-md shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  🎴 بطاقات تسجيل الدخول للمعلمين (طباعة PDF)
                </h2>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {totalCardsCount} معلماً
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تصدير وطباعة بطاقات المعلمين (الاسم • كلمة المرور • QR Code للدخول المباشر)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Direct Native Print */}
            <button
              onClick={handlePrint}
              disabled={isExporting || pagesData.length === 0}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              title="طباعة الصفحة الحالية عبر نافذة المتصفح"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>طباعة مباشرة</span>
            </button>

            {/* Unified PDF Export Button */}
            <button
              onClick={handleExportUnifiedPdf}
              disabled={isExporting || pagesData.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="توليد ملف PDF موحد لجميع المعلمين"
            >
              {isExporting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <FileText className="w-4 h-4 text-white" />
              )}
              <span>تحميل ملف PDF الموحد</span>
            </button>

            {/* ZIP Export Button */}
            <button
              onClick={handleExportImagesZip}
              disabled={isExporting || pagesData.length === 0}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              title="تصدير كصور داخل ملف ZIP"
            >
              <FileArchive className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">تصدير كصور (ZIP)</span>
            </button>

            <button
              onClick={onClose}
              disabled={isExporting}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-rose-600/80 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer mr-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar (Visible during export) */}
        {isExporting && (
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 transition-all animate-fade-in shrink-0">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5 font-bold">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span>{exportStatusText}</span>
              </span>
              <span className="font-mono text-blue-400">{exportProgressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-200"
                style={{ width: `${exportProgressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Navigation Toolbar between Pages */}
        <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-2xs flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-slate-800">
              {activePage?.departmentTitle}
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-600 font-bold">
              المعروض في هذه الصفحة: {activePage?.teachers.length || 0} بطاقة
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentPageIndex === 0}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-slate-700 px-2">
              صفحة {currentPageIndex + 1} من {pagesData.length || 1}
            </span>

            <button
              onClick={() => setCurrentPageIndex((prev) => Math.min(pagesData.length - 1, prev + 1))}
              disabled={currentPageIndex >= pagesData.length - 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: A4 Sheet Preview Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-200/90 flex justify-center items-start">
          {pagesData.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center shadow-md max-w-md my-auto">
              <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-black text-slate-800 mb-1">لا يوجد معلمين مسجلين</h3>
              <p className="text-xs text-slate-500">
                يرجى إضافة أو استيراد المعلمين أولاً لتتمكن من استخراج بطاقات تسجيل الدخول الخاصة بهم.
              </p>
            </div>
          ) : activePage ? (
            /* A4 Sheet Container: Exactly 210mm x 297mm in standard print ratio */
            <div
              id="printable-teachers-sheet"
              className="bg-white shadow-2xl relative select-none box-border text-black"
              style={{
                width: '210mm',
                minHeight: '297mm',
                maxHeight: '297mm',
                boxSizing: 'border-box',
                backgroundColor: '#ffffff',
                color: '#000000',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: '"Cairo", "Segoe UI", Arial, sans-serif',
              }}
            >
              {/* Sheet Header */}
              <div
                className="flex flex-col items-center justify-center text-center"
                style={{
                  position: 'absolute',
                  top: '6mm',
                  left: '11mm',
                  width: '188mm',
                  height: '14mm',
                  borderBottom: '2px solid #000000',
                  color: '#000000',
                  boxSizing: 'border-box',
                }}
              >
                <h1 className="text-lg font-black tracking-tight leading-tight" style={{ color: '#000000' }}>
                  {activePage.schoolName}
                </h1>
                <div
                  className="flex items-center justify-center gap-3 text-xs font-bold"
                  style={{ color: '#000000' }}
                >
                  <span>{activePage.departmentTitle}</span>
                  <span>•</span>
                  <span>عدد المعلمين: {activePage.totalTeachers}</span>
                  {activePage.totalPages > 1 && (
                    <>
                      <span>•</span>
                      <span>(صفحة {activePage.pageIndex} من {activePage.totalPages})</span>
                    </>
                  )}
                </div>
              </div>

              {/* 16 Cards Grid on current page */}
              {activePage.teachers.map((teacher, teacherIdx) => {
                const teacherPassword =
                  (teacher.password && !teacher.password.startsWith('scrypt:') && !teacher.password.startsWith('$'))
                    ? teacher.password
                    : 'Pass#2026';
                const qrSrc = qrMap[teacher.id] || defaultQrDataUrl || '';

                const col = teacherIdx % CARDS_PER_ROW;
                const row = Math.floor(teacherIdx / CARDS_PER_ROW);

                const x = MARGIN_LEFT_MM + col * (CARD_WIDTH_MM + HORIZONTAL_GAP_MM);
                const y = MARGIN_TOP_MM + row * (CARD_HEIGHT_MM + VERTICAL_GAP_MM);

                return (
                  <div
                    key={teacher.id}
                    className="login-card border-2 rounded-2xl p-2 flex flex-col justify-between box-border shadow-2xs"
                    style={{
                      position: 'absolute',
                      left: `${x}mm`,
                      top: `${y}mm`,
                      width: `${CARD_WIDTH_MM}mm`,
                      height: `${CARD_HEIGHT_MM}mm`,
                      boxSizing: 'border-box',
                      borderColor: '#000000',
                      backgroundColor: '#ffffff',
                      color: '#000000',
                      overflow: 'hidden',
                      direction: 'rtl',
                    }}
                  >
                    {/* Header Banner */}
                    <div className="flex flex-col gap-1">
                      <div
                        className="bg-black text-white px-2 py-0.5 rounded-full flex items-center justify-between gap-1"
                        style={{ backgroundColor: '#000000', color: '#ffffff' }}
                      >
                        <span
                          className="font-extrabold text-[7.5px] leading-tight truncate text-white"
                          style={{ color: '#ffffff' }}
                        >
                          {activePage.schoolName}
                        </span>
                        <div className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>
                      <div className="border-b border-black" style={{ borderColor: '#000000' }} />
                    </div>

                    {/* Teacher Info */}
                    <div className="flex flex-col justify-between flex-1 py-0.5 gap-1 text-black">
                      <div
                        className="flex items-center justify-between text-black font-extrabold text-[8.5px] leading-none"
                        style={{ color: '#000000' }}
                      >
                        <span className="truncate flex-1 min-w-0" style={{ color: '#000000' }}>
                          {teacher.name}
                        </span>
                        <User className="w-3 h-3 text-black shrink-0 mr-1" />
                      </div>

                      {/* Password Box */}
                      <div
                        className="border border-black rounded-lg p-1 bg-white flex items-center justify-between"
                        style={{ borderColor: '#000000', backgroundColor: '#ffffff' }}
                      >
                        <div className="flex-1 flex flex-col items-center justify-center leading-none">
                          <span className="text-[6px] font-bold text-black mb-0.5" style={{ color: '#000000' }}>
                            كلمة المرور (Password)
                          </span>
                          <span
                            className="text-[8px] font-black font-mono tracking-wider text-black"
                            style={{ color: '#000000' }}
                          >
                            {teacherPassword}
                          </span>
                        </div>
                        <Key className="w-3 h-3 text-black shrink-0 mr-1" />
                      </div>

                      {/* Dashed Separator */}
                      <div
                        className="border-t border-dashed border-neutral-400"
                        style={{ borderColor: '#9ca3af' }}
                      />

                      {/* QR Code */}
                      <div
                        className="mx-auto border-[1.5px] border-black rounded-xl p-0.5 bg-white flex items-center justify-center"
                        style={{ borderColor: '#000000', backgroundColor: '#ffffff' }}
                      >
                        {qrSrc ? (
                          <img
                            src={qrSrc}
                            alt="QR Code"
                            className="w-10 h-10 object-contain block"
                            style={{ width: '40px', height: '40px', imageRendering: 'pixelated' }}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-slate-100 flex items-center justify-center text-[7px] text-slate-400 font-mono">
                            QR
                          </div>
                        )}
                      </div>

                      {/* Platform Pill */}
                      <div
                        className="bg-black text-white px-2 py-0.5 rounded-full text-center"
                        style={{ backgroundColor: '#000000', color: '#ffffff' }}
                      >
                        <span
                          className="font-mono font-bold text-[6.5px] tracking-wide block text-white"
                          style={{ color: '#ffffff' }}
                        >
                          madrasety.ai.studio
                        </span>
                      </div>
                    </div>

                    {/* Card Security Footer */}
                    <div
                      className="border-t border-neutral-300 pt-0.5 text-center text-[5.5px] font-bold text-neutral-600"
                      style={{ borderColor: '#d1d5db', color: '#4b5563' }}
                    >
                      <span>🔒 بطاقة تسجيل دخول المعلم الرسمية</span>
                    </div>
                  </div>
                );
              })}

              {/* Sheet Footer */}
              <div
                className="flex items-center justify-between text-[8px] font-bold text-neutral-600"
                style={{
                  position: 'absolute',
                  bottom: '5mm',
                  left: '11mm',
                  width: '188mm',
                  borderTop: '1px solid #cbd5e1',
                  paddingTop: '2mm',
                  boxSizing: 'border-box',
                }}
              >
                <span>منصة مدرسة المستقبل التعليمية • كروت تسجيل دخول المعلمين</span>
                <span>
                  صفحة {activePage.pageIndex} من {activePage.totalPages}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Native Browser Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          #printable-teachers-sheet,
          #printable-teachers-sheet * {
            visibility: visible;
          }
          #printable-teachers-sheet {
            position: fixed;
            left: 0;
            top: 0;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border: none !important;
            background-color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
