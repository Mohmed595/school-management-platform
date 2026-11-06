import React, { useState, useMemo, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Users,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Copy,
  ExternalLink,
  Settings,
  ShieldCheck,
  AlertCircle,
  Award,
  CalendarCheck,
  Key,
  FileSpreadsheet,
  Megaphone,
  Check,
  Smartphone,
  RefreshCw,
  Eye,
  Zap,
  Info,
} from 'lucide-react';
import { getStoredSchools } from '../../lib/storage';
import { getStudentsBySchool, getClassesBySchool } from '../../lib/adminStorage';
import { Student, ClassRoom } from '../../types/admin';
import { compareStudentsByGradeClassAndName } from '../../lib/egyptianSchoolUtils';
import {
  formatEgyptianWhatsAppPhone,
  generateWhatsAppWebUrl,
  buildAbsenceAlertTemplate,
  buildHonorCertificateTemplate,
  buildStudentLoginTemplate,
  buildReportCardTemplate,
  buildGeneralAnnouncementTemplate,
  sendWhatsAppViaCloudApi,
  getWhatsAppAutoSettings,
  saveWhatsAppAutoSettings,
  getWhatsAppLogs,
  logWhatsAppAlert,
  WhatsAppLogItem,
  WhatsAppAutoSettings,
} from '../../lib/whatsapp/whatsappService';

interface WhatsAppManagementViewProps {
  onAddToast: (title: string, description?: string, type?: 'success' | 'error' | 'info') => void;
  schoolId?: string;
}

type AlertCategory = 'absence' | 'honor' | 'login_credentials' | 'report_card' | 'announcement';

export function WhatsAppManagementView({ onAddToast, schoolId }: WhatsAppManagementViewProps) {
  const [activeTab, setActiveTab] = useState<'dispatcher' | 'auto_settings' | 'logs'>('dispatcher');

  // Selected school
  const schools = getStoredSchools();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schoolId || (schools[0]?.id ?? ''));

  // Alert Category
  const [category, setCategory] = useState<AlertCategory>('absence');

  // Filter & Selection
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Template custom fields
  const [absenceDate, setAbsenceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [absenceNotes, setAbsenceNotes] = useState<string>('يرجى مراعاة التواصل مع المشرف الإداري لتقديم العذر.');
  const [honorBadgeTitle, setHonorBadgeTitle] = useState<string>('وسام التميز والتفوق العلمي');
  const [honorReason, setHonorReason] = useState<string>('للحصول على المراكز الأولى والانضباط السلوكي العالي.');
  const [examName, setExamName] = useState<string>('اختبار منتصف الفصل الدراسي');
  const [defaultScore, setDefaultScore] = useState<string>('95');
  const [announcementTitle, setAnnouncementTitle] = useState<string>('مواعيد الاختبارات القادمة ولقاء أولياء الأمور');
  const [announcementContent, setAnnouncementContent] = useState<string>('نحيطكم علماً ببدء التقييمات الشاملة يوم الأحد القادم، وسيتم تنظيم اجتماع أولياء الأمور لمناقشة النتائج.');

  // Auto Alert settings
  const [autoSettings, setAutoSettings] = useState<WhatsAppAutoSettings>(getWhatsAppAutoSettings());

  // Logs
  const [logs, setLogs] = useState<WhatsAppLogItem[]>(getWhatsAppLogs());

  // Copy state feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Bulk Modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [bulkSendingIndex, setBulkSendingIndex] = useState<number>(-1);
  const [isApiSending, setIsApiSending] = useState<boolean>(false);

  // Load students and classes for selected school
  const activeSchool = useMemo(() => {
    return schools.find((s) => s.id === selectedSchoolId) || schools[0];
  }, [schools, selectedSchoolId]);

  const studentsList: Student[] = useMemo(() => {
    if (!selectedSchoolId) return [];
    return getStudentsBySchool(selectedSchoolId);
  }, [selectedSchoolId]);

  const classesList: ClassRoom[] = useMemo(() => {
    if (!selectedSchoolId) return [];
    return getClassesBySchool(selectedSchoolId);
  }, [selectedSchoolId]);

  // Filtered & Sorted Students (Grade/Stage -> Class -> Name)
  const filteredStudents = useMemo(() => {
    const list = studentsList.filter((std) => {
      const matchesClass = selectedClassId === 'all' || std.classId === selectedClassId;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        std.name.toLowerCase().includes(q) ||
        (std.studentCode && std.studentCode.toLowerCase().includes(q)) ||
        (std.parentPhone && std.parentPhone.includes(q));
      return matchesClass && matchesSearch;
    });

    return [...list].sort((a, b) => {
      const matchingClassA = classesList.find((c) => c.id === a.classId);
      const matchingClassB = classesList.find((c) => c.id === b.classId);
      return compareStudentsByGradeClassAndName(
        {
          name: a.name,
          className: a.className,
          gradeLevel: a.gradeLevel || matchingClassA?.gradeLevel,
        },
        {
          name: b.name,
          className: b.className,
          gradeLevel: b.gradeLevel || matchingClassB?.gradeLevel,
        }
      );
    });
  }, [studentsList, selectedClassId, searchQuery, classesList]);

  // Helper to generate text for a specific student
  const getMessageForStudent = (student: Student): string => {
    const schoolName = activeSchool?.name || 'المدرسة الرقمية';
    switch (category) {
      case 'absence':
        return buildAbsenceAlertTemplate(student.name, student.className || '', absenceDate, schoolName, absenceNotes);
      case 'honor':
        return buildHonorCertificateTemplate(student.name, honorBadgeTitle, schoolName, honorReason);
      case 'login_credentials':
        return buildStudentLoginTemplate(
          student.name,
          student.studentCode || 'STD-2026',
          student.parentPhone || '01012345678',
          schoolName
        );
      case 'report_card':
        return buildReportCardTemplate(student.name, examName, defaultScore, 100, schoolName);
      case 'announcement':
        return buildGeneralAnnouncementTemplate(announcementTitle, announcementContent, schoolName);
      default:
        return '';
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onAddToast('تم النسخ', 'تم نسخ نص الرسالة بنجاح إلى الحافظة', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenWhatsAppLink = (student: Student) => {
    const phone = student.parentPhone || '';
    const text = getMessageForStudent(student);
    const url = generateWhatsAppWebUrl(phone, text);

    window.open(url, '_blank', 'noopener,noreferrer');

    logWhatsAppAlert({
      id: `wa-link-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      studentName: student.name,
      recipientPhone: formatEgyptianWhatsAppPhone(phone),
      category,
      message: text,
      sentAt: new Date().toLocaleString('ar-EG'),
      method: 'direct_whatsapp_link',
      status: 'opened',
    });

    setLogs(getWhatsAppLogs());
    onAddToast('فتح محادثة الواتساب', `جاري فتح محادثة ولي أمر الطالب ${student.name}`, 'info');
  };

  const handleSendCloudApi = async (student: Student) => {
    const phone = student.parentPhone || '';
    const text = getMessageForStudent(student);
    setIsApiSending(true);

    const res = await sendWhatsAppViaCloudApi(phone, text, student.name, category);
    setIsApiSending(false);

    if (res.success) {
      onAddToast('تم الإرسال بنجاح', res.message, 'success');
      setLogs(getWhatsAppLogs());
    } else {
      onAddToast('فتح المحادثة المباشرة', `${res.message}. جاري فتح المحادثة بدلاً من ذلك.`, 'info');
      handleOpenWhatsAppLink(student);
    }
  };

  const handleSaveSettings = () => {
    saveWhatsAppAutoSettings(autoSettings);
    onAddToast('تم حفظ الإعدادات', 'تم تحديث خيارات التفعيل التلقائي لإشعارات الواتساب بنجاح', 'success');
  };

  return (
    <div className="space-y-6 dir-rtl text-right p-4 sm:p-6 max-w-7xl mx-auto font-sans">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-800/80">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>نظام إشعارات الواتساب المباشرة (Direct WhatsApp Alerts)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-200 text-xs font-bold border border-emerald-400/20">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>مستقر 100% | بدون تكاليف SMS</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              💬 التنبيهات الفورية عبر الواتساب لأولياء الأمور
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm max-w-3xl leading-relaxed">
              إرسال إشعارات الغياب، بطاقات التكريم، بيانات الدخول، وشهادات الدرجات فورياً لولياء الأمور عبر الواتساب بنقرة واحدة، مع الربط المباشر أو خادم Meta Cloud API.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-emerald-950/80 px-4 py-3 rounded-2xl border border-emerald-700/60 text-center">
              <span className="text-[10px] text-emerald-300 font-bold block">إجمالي طلاب المدرسة</span>
              <span className="text-2xl font-black font-mono text-emerald-400">{filteredStudents.length}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Header */}
        <div className="flex items-center gap-2 pt-6 mt-6 border-t border-emerald-800/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dispatcher')}
            className={`py-2.5 px-5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'dispatcher'
                ? 'bg-white text-emerald-950 shadow-md font-black'
                : 'bg-emerald-800/40 text-emerald-100 hover:bg-emerald-800/70'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>إرسال وتوليد الإشعارات (Dispatcher)</span>
          </button>
          <button
            onClick={() => setActiveTab('auto_settings')}
            className={`py-2.5 px-5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'auto_settings'
                ? 'bg-white text-emerald-950 shadow-md font-black'
                : 'bg-emerald-800/40 text-emerald-100 hover:bg-emerald-800/70'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>إعدادات التفعيل التلقائي و Meta API</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2.5 px-5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'logs'
                ? 'bg-white text-emerald-950 shadow-md font-black'
                : 'bg-emerald-800/40 text-emerald-100 hover:bg-emerald-800/70'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>سجل الرسائل المرسلة ({logs.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DISPATCHER */}
      {activeTab === 'dispatcher' && (
        <div className="space-y-6">
          {/* Controls Bar: School & Category Selection */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Select School */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">اختر المدرسة:</label>
                <select
                  value={selectedSchoolId}
                  onChange={(e) => {
                    setSelectedSchoolId(e.target.value);
                    setSelectedClassId('all');
                  }}
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {schools.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.name} ({sch.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Class */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">تصفية بالفصل الدراسي:</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">جميع فصول المدرسة ({studentsList.length} طالب)</option>
                  {classesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({studentsList.filter((s) => s.classId === c.id).length} طالب)
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">بحث بالاسم أو الكود أو الهاتف:</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن طالب أو ولي أمر..."
                    className="w-full py-2.5 pr-9 pl-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Category Selector */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 block">نوع التنبيه المكتوب:</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'absence', label: '🚨 غياب وحضور', icon: CalendarCheck, color: 'text-red-600 bg-red-50 border-red-200' },
                  { id: 'honor', label: '🎖️ بطاقة تكريم', icon: Award, color: 'text-amber-600 bg-amber-50 border-amber-200' },
                  { id: 'login_credentials', label: '🔑 بيانات الدخول', icon: Key, color: 'text-blue-600 bg-blue-50 border-blue-200' },
                  { id: 'report_card', label: '📝 نتيجة ودرجات', icon: FileSpreadsheet, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
                  { id: 'announcement', label: '📢 إعلان عام', icon: Megaphone, color: 'text-purple-600 bg-purple-50 border-purple-200' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id as AlertCategory)}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      category === cat.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-extrabold'
                        : `${cat.color} hover:opacity-90`
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Template Specific Inputs */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-emerald-600" />
                <span>تخصيص متغيّرات نموذج القالب الحالي:</span>
              </h4>

              {category === 'absence' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">تاريخ الغياب:</label>
                    <input
                      type="date"
                      value={absenceDate}
                      onChange={(e) => setAbsenceDate(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">ملاحظة الإدارة إضافية:</label>
                    <input
                      type="text"
                      value={absenceNotes}
                      onChange={(e) => setAbsenceNotes(e.target.value)}
                      placeholder="مثال: يرجى تقديم العذر الطبي..."
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>
              )}

              {category === 'honor' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">عنوان الوسام/التكريم:</label>
                    <input
                      type="text"
                      value={honorBadgeTitle}
                      onChange={(e) => setHonorBadgeTitle(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">سبب التكريم:</label>
                    <input
                      type="text"
                      value={honorReason}
                      onChange={(e) => setHonorReason(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>
              )}

              {category === 'report_card' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">اسم الاختبار/المادة:</label>
                    <input
                      type="text"
                      value={examName}
                      onChange={(e) => setExamName(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">الدرجة الافتراضية / النسبة:</label>
                    <input
                      type="text"
                      value={defaultScore}
                      onChange={(e) => setDefaultScore(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>
              )}

              {category === 'announcement' && (
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">عنوان الإعلان الرسمي:</label>
                    <input
                      type="text"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">نص الإعلان تفصيلياً:</label>
                    <textarea
                      rows={2}
                      value={announcementContent}
                      onChange={(e) => setAnnouncementContent(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Preview Box */}
          {filteredStudents.length > 0 && (
            <div className="bg-emerald-950 rounded-3xl p-5 text-white space-y-3 border border-emerald-800 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>معاينة حية لنص التنبيه الجاهز للواتساب (لأول طالب: {filteredStudents[0]?.name})</span>
                </span>
                <button
                  onClick={() => handleCopyText(getMessageForStudent(filteredStudents[0]), 'preview-copy')}
                  className="py-1 px-3 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'preview-copy' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>نسخ النص</span>
                </button>
              </div>
              <div className="bg-emerald-900/80 p-4 rounded-2xl border border-emerald-700/60 font-mono text-xs text-emerald-100 whitespace-pre-wrap leading-relaxed dir-rtl">
                {getMessageForStudent(filteredStudents[0])}
              </div>
            </div>
          )}

          {/* Students Dispatch Roster List */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  قائمة أولياء الأمور المستهدفين ({filteredStudents.length} طالب)
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  انقر على إرسال لتجهيز الرسالة وإرسالها فورياً عبر الواتساب الرسمي.
                </p>
              </div>

              <button
                onClick={() => setIsBulkModalOpen(true)}
                disabled={filteredStudents.length === 0}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>إرسال لجميع الطلاب المستهدفين ({filteredStudents.length})</span>
              </button>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold">لا يوجد طلاب يطابقون خيارات البحث أو التصفية الحالية.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 border-b border-slate-200/80 font-extrabold">
                      <th className="p-3.5">الطالب / الفصل</th>
                      <th className="p-3.5">كود الطالب</th>
                      <th className="p-3.5">رقم ولي الأمر</th>
                      <th className="p-3.5">الصلاحية للواتساب</th>
                      <th className="p-3.5 text-center">إجراءات الإرسال</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredStudents.map((std) => {
                      const formattedPhone = formatEgyptianWhatsAppPhone(std.parentPhone);
                      const isValid = formattedPhone.length >= 10;
                      return (
                        <tr key={std.id} className="hover:bg-emerald-50/40 transition-colors">
                          <td className="p-3.5">
                            <span className="font-extrabold text-slate-900 block">{std.name}</span>
                            <span className="text-[11px] text-slate-500">{std.className || 'فصل غير محدد'}</span>
                          </td>
                          <td className="p-3.5 font-mono text-slate-600 font-bold">{std.studentCode || '-'}</td>
                          <td className="p-3.5 font-mono font-bold text-slate-800">
                            {std.parentPhone || 'غير مدخل'}
                          </td>
                          <td className="p-3.5">
                            {isValid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {formattedPhone}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                يحتاج تعديل الرقم
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center justify-center gap-2">
                              {/* Direct Launch WhatsApp Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenWhatsAppLink(std)}
                                className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-[11px] font-extrabold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                                title="فتح محادثة الواتساب المباشرة"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>إرسال عبر الواتساب</span>
                                <ExternalLink className="w-3 h-3 opacity-80" />
                              </button>

                              {/* Cloud API Button */}
                              <button
                                type="button"
                                onClick={() => handleSendCloudApi(std)}
                                disabled={isApiSending}
                                className="py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="إرسال من الخادم Meta Cloud API"
                              >
                                <Send className="w-3 h-3 text-emerald-400" />
                                <span className="hidden sm:inline">آلي</span>
                              </button>

                              {/* Copy Text */}
                              <button
                                type="button"
                                onClick={() => handleCopyText(getMessageForStudent(std), std.id)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="نسخ نص الرسالة"
                              >
                                {copiedId === std.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AUTOMATED SETTINGS & META API */}
      {activeTab === 'auto_settings' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              <span>خيارات الربط والتفعيل التلقائي لإشعارات الواتساب</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              تحديد حالات النظام التي تتطلب توليد وإرسال إشعارات الواتساب تلقائياً لأولياء الأمور.
            </p>
          </div>

          <div className="space-y-4">
            {/* Toggle 1: Auto Absence */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-extrabold text-xs text-slate-900">🚨 التنبيه التلقائي المباشر للغياب</h4>
                <p className="text-[11px] text-slate-500">
                  توليد زر إرسال الواتساب الفوري وإشعار الإدارة فور تسجيل أي طالب بوضع (غائب) في شاشة الحضور والغياب اليومي.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoSettings.autoAbsenceAlert}
                onChange={(e) => setAutoSettings({ ...autoSettings, autoAbsenceAlert: e.target.checked })}
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer shrink-0"
              />
            </div>

            {/* Toggle 2: Auto Behavior */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-extrabold text-xs text-slate-900">🎖️ التنبيه التلقائي لبطاقات التكريم</h4>
                <p className="text-[11px] text-slate-500">
                  إرسال رسالة تهنئة لولي الأمر عبر الواتساب عند منح الطالب وسام تميز أو إشادة سلوكية إيجابية.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoSettings.autoBehaviorAlert}
                onChange={(e) => setAutoSettings({ ...autoSettings, autoBehaviorAlert: e.target.checked })}
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer shrink-0"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              onClick={handleSaveSettings}
              className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>حفظ التفضيلات التلقائية</span>
            </button>
          </div>

          {/* Meta Cloud API Guide Info Box */}
          <div className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl space-y-3 border border-slate-800">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
              <Info className="w-4 h-4" />
              <span>معلومات ربط خادم الواتساب الرسمي (Meta WhatsApp Cloud API)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              المنظومة تدعم الربط التلقائي عبر خوادم Meta الرسمية من خلال المتغيرات <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">WHATSAPP_API_TOKEN</code> و <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">WHATSAPP_PHONE_NUMBER_ID</code> في ملف البيئة <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200 font-mono">.env.example</code>.
              في حالة عدم إضافة المتغيرات، يعمل النظام تلقائياً وبأقصى سرعة عن طريق فتح وتجهيز روابط محادثات الواتساب المباشرة <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300 font-mono">wa.me</code> لكل ولي أمر.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">سجل الإرسال التاريخي لرسائل الواتساب</h3>
              <p className="text-[11px] text-slate-500 font-medium">عرض توثيق العمليات والإشعارات الصادرة لولياء الأمور</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('whatsapp_alerts_logs_v1');
                setLogs([]);
                onAddToast('تم مسح السجل', 'تم تفريغ سجل إشعارات الواتساب بنجاح', 'info');
              }}
              className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              تفريغ السجل
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="p-10 text-center text-slate-400 space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold">لا يوجد سجل إشعارات مرسلة حتى الآن.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((item) => (
                <div key={item.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900">{item.studentName}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-500">({item.recipientPhone})</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                        {item.category === 'absence' ? 'غاياب' : item.category === 'honor' ? 'تكريم' : 'إشعار'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{item.message}</p>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono font-bold text-slate-400 shrink-0">
                    <span>{item.sentAt}</span>
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {item.method === 'meta_cloud_api' ? 'Meta Cloud API' : 'رابط مباشر wa.me'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BULK SENDING MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl text-right">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base">إرسال التنبيهات الجماعية لأولياء الأمور</h3>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                سيتم إعداد وتجهيز روابط محادثات الواتساب المباشرة أو إرسالها آلياً لكل طالب في قائمة أولياء الأمور المستهدفين ({filteredStudents.length} ولي أمر).
              </p>

              <div className="max-h-60 overflow-y-auto space-y-2 p-2 bg-slate-50 rounded-2xl border border-slate-200">
                {filteredStudents.map((std, idx) => (
                  <div key={std.id} className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{std.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{std.parentPhone || 'بدون رقم'}</span>
                    </div>

                    <button
                      onClick={() => handleOpenWhatsAppLink(std)}
                      className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>فتح المحادثة ({idx + 1})</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
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
