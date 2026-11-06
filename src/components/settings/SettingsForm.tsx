import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Building2,
  Database,
  Globe,
  Bell,
  Key,
  Save,
  RotateCcw,
  CheckCircle2,
  Palette,
  Check,
  Sparkles,
  UserX,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';
import { THEMES, ThemeId, getStoredTheme, setStoredTheme } from '../../lib/theme';
import { AvatarSettingsSection } from './AvatarSettingsSection';
import { School } from '../../types';
import { unassignAllStudentsFromClassesApi } from '../../lib/schoolApi';

interface SettingsFormProps {
  schools?: School[];
  onResetData: () => void;
  onToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export function SettingsForm({ schools = [], onResetData, onToast }: SettingsFormProps) {
  const [activeTab, setActiveTab] = useState<'theme' | 'general'>('theme');
  const [platformName, setPlatformName] = useState('منصة إدارة المدارس - جمهورية مصر العربية');
  const [supportEmail, setSupportEmail] = useState('support@support.schoolplatform.eg');
  const [currency, setCurrency] = useState('EGP');
  const [codePrefix, setCodePrefix] = useState('EG');
  const [autoApproveSchools, setAutoApproveSchools] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(getStoredTheme());
  const [isSaved, setIsSaved] = useState(false);

  // Plan mode unassign state
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);

  useEffect(() => {
    setSelectedTheme(getStoredTheme());
    if (schools && schools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(schools[0].id);
    }
  }, [schools]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setStoredTheme(selectedTheme);
    onToast('تم حفظ الإعدادات بنجاح', 'تمت مزامنة جميع تغييرات النظام والألوان فوراً');
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSelectTheme = (themeId: ThemeId) => {
    setSelectedTheme(themeId);
    setStoredTheme(themeId);
    const themeObj = THEMES.find((t) => t.id === themeId);
    onToast(
      'تم تغيير الهوية البصرية بنجاح',
      `تم تطبيق نسق "${themeObj?.name || ''}" على لوحة تحكم المنصة`,
      'info'
    );
  };

  const handleUnassignAllStudents = async () => {
    if (!selectedSchoolId) return;
    setIsUnassigning(true);
    try {
      const res = await unassignAllStudentsFromClassesApi(selectedSchoolId);
      const targetSchool = schools.find((s) => s.id === selectedSchoolId);
      onToast(
        'تم تفريغ فصول الطلاب بنجاح (Plan Mode)',
        res.message || `تم تحويل جميع طلاب ${targetSchool?.name || 'المدرسة'} إلى صفة (بدون فصل) جاهزين لأخذ الحضور والتوزيع الآلي.`,
        'success'
      );
      setShowUnassignModal(false);
    } catch (err: any) {
      console.error('Plan mode unassign error:', err);
      onToast('فشل تحويل الطلاب', err?.message || 'تعذر تحويل طلاب المدرسة إلى صفة بدون فصل', 'error');
    } finally {
      setIsUnassigning(false);
    }
  };

  const selectedSchoolObj = schools.find((s) => s.id === selectedSchoolId) || schools[0];

  const activeThemeObj = THEMES.find((t) => t.id === selectedTheme) || THEMES[0];

  return (
    <div className="max-w-5xl space-y-6 dir-rtl">
      {/* Top Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('theme')}
          className={`py-2.5 px-5 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'theme'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>نسق الألوان (Theme Palette)</span>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`py-2.5 px-5 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'general'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>إعدادات المنصة والنظام</span>
        </button>
      </div>

      {/* Tab 1: Theme Settings */}
      {activeTab === 'theme' && (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
        <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 text-white rounded-xl shadow-xs transition-colors"
              style={{ backgroundColor: activeThemeObj.primaryHex }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                اختيار الهوية البصرية والألوان الرئيسية (Theme Palette)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                تخصيص اللون الرسمي الشامل للوحة تحكم مالك المنصة والأزرار التفاعلية
              </p>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 flex items-center gap-1.5 border border-slate-200">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: activeThemeObj.primaryHex }}
            />
            <span>{activeThemeObj.name}</span>
          </span>
        </div>

        {/* Theme Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {THEMES.map((t) => {
            const isSelected = selectedTheme === t.id;
            return (
              <div
                key={t.id}
                onClick={() => handleSelectTheme(t.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'border-2 bg-slate-50/90 shadow-2xs ring-2'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                }`}
                style={{
                  borderColor: isSelected ? t.primaryHex : undefined,
                  boxShadow: isSelected ? `0 0 0 1px ${t.primaryHex}` : undefined,
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full shadow-xs shrink-0"
                        style={{ backgroundColor: t.primaryHex }}
                      />
                      <span className="font-bold text-xs text-slate-900">{t.name}</span>
                    </div>

                    {isSelected && (
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] shadow-xs"
                        style={{ backgroundColor: t.primaryHex }}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed min-h-[32px]">
                    {t.description}
                  </p>
                </div>

                {/* Color Swatches Bar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded-md"
                      style={{ backgroundColor: t.primaryHex }}
                      title="اللون الرئيسي"
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-md"
                      style={{ backgroundColor: t.primaryHoverHex }}
                      title="لون التفاعل (Hover)"
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-md border border-slate-200"
                      style={{ backgroundColor: t.lightBgHex }}
                      title="خلفية العناصر النشطة"
                    />
                  </div>

                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                    style={{
                      color: t.primaryHex,
                      backgroundColor: t.lightBgHex,
                    }}
                  >
                    {t.primaryHex}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Preview Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>معاينة فورية لعناصر الواجهة باللون المختار ({activeThemeObj.name}):</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {/* Primary Button Preview */}
            <button
              type="button"
              className="px-4 py-2 text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95"
              style={{ backgroundColor: activeThemeObj.primaryHex }}
            >
              زر إجراء رئيسي
            </button>

            {/* Light Active Tab Preview */}
            <div
              className="px-3.5 py-2 font-bold text-xs rounded-xl border flex items-center gap-2"
              style={{
                backgroundColor: activeThemeObj.lightBgHex,
                color: activeThemeObj.primaryHex,
                borderColor: activeThemeObj.borderHex,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: activeThemeObj.primaryHex }}
              />
              <span>تبويب نشط بالمدرسة</span>
            </div>

            {/* Badge Preview */}
            <span
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border"
              style={{
                backgroundColor: activeThemeObj.lightBgHex,
                color: activeThemeObj.primaryHex,
                borderColor: activeThemeObj.borderHex,
              }}
            >
              14 مدرسة نشطة
            </span>
          </div>
        </div>
      </div>
      )}

      {/* Tab 3: General Settings */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
        <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 text-white rounded-xl shadow-xs transition-colors"
              style={{ backgroundColor: activeThemeObj.primaryHex }}
            >
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">إعدادات المنصة والنظام الرئيسي</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                تكوين الخيارات العامة لتوليد التراخيص والرموز بالجمهورية
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 text-white font-semibold text-xs rounded-xl shadow-2xs transition-all cursor-pointer hover:opacity-90 active:scale-95"
            style={{ backgroundColor: activeThemeObj.primaryHex }}
          >
            {isSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>تم الحفظ</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ الإعدادات</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          {/* Platform Title */}
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1.5">
              اسم المنصة الرئيسي
            </label>
            <input
              type="text"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 transition-all"
              style={{ outlineColor: activeThemeObj.primaryHex }}
            />
          </div>

          {/* Support Email */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              بريد الدعم الفني المركزي
            </label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-all"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              العملة الرسمية المعتمدة
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-all cursor-pointer"
            >
              <option value="EGP">الجنيه المصري (EGP - ج.م)</option>
              <option value="USD">الدولار الأمريكي ($ - USD)</option>
            </select>
          </div>

          {/* Code Prefix */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              بادئة أكواد المدارس المولدة
            </label>
            <input
              type="text"
              value={codePrefix}
              onChange={(e) => setCodePrefix(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 transition-all"
            />
          </div>

          {/* Auto Approve Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div>
              <span className="font-bold text-slate-800 block">تفعيل المدارس تلقائياً</span>
              <span className="text-[11px] text-slate-500">
                إصدار مفتاح الترخيص آلياً عند إضافة مدرسة جديدة
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoApproveSchools}
              onChange={(e) => setAutoApproveSchools(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 focus:ring-2 cursor-pointer"
              style={{ accentColor: activeThemeObj.primaryHex }}
            />
          </div>
        </div>
      </form>

      {/* 3. Supabase & Database Integrations */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">ربط خوادم Supabase & PostgreSQL</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              حالة الاتصال ومزامنة القواعد بين البيئات
            </p>
          </div>
        </div>

        <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-900">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">الاتصال بنجاح مع Supabase Auth & DB</span>
              <span className="text-[11px] text-emerald-700">
                مشروع قاعدة البيانات متصل ومتزامن فورياً
              </span>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg shrink-0 text-center">
            نشط ومستقر
          </span>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-800 block">إعادة ضبط البيانات الافتراضية</span>
            <span className="text-[11px] text-slate-500">
              استعادة قائمة المدارس والتراخيص الأولية لجميع محافظات مصر
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('هل تريد استعادة المدارس والإعدادات الافتراضية؟')) {
                onResetData();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>استعادة البيانات الافتراضية</span>
          </button>
        </div>
      </div>

      {/* 4. Plan Mode: Unassign all students in selected school from classes */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">إدارة تفريغ فصول الطلاب المدرسية (Plan Mode / إعادة التسكين)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              تحويل جميع طلاب المدرسة المحددة إلى صفة (بدون فصل) حتى يتم تسكينهم آلياً في فصولهم الحقيقية عند أخذ الحضور لأول مرة.
            </p>
          </div>
        </div>

        <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">اختر المدرسة المراد تفريغ فصولها:</label>
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                {schools.length > 0 ? (
                  schools.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.name} ({sch.studentsCount || 0} طالب) - [{sch.governorate}]
                    </option>
                  ))
                ) : (
                  <option value="sch-1">المدرسة المحددة (جميع الطلاب)</option>
                )}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                disabled
                className="w-full py-2.5 px-4 bg-slate-200 text-slate-400 font-bold text-xs rounded-xl shadow-none transition-all flex items-center justify-center gap-2 cursor-not-allowed opacity-75"
                title="تم تعطيل هذه الخاصية مؤقتاً"
              >
                <UserX className="w-4 h-4 text-slate-400" />
                <span>تحويل جميع طلاب المدرسة إلى (بدون فصل) (معطل مؤقتاً)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Plan Mode */}
      {showUnassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden dir-rtl text-right p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>تأكيد تفريغ فصول الطلاب (Plan Mode)</span>
              </div>
              <button
                onClick={() => setShowUnassignModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
              <p className="font-bold text-slate-900">
                المدرسة المحددة: <span className="text-amber-700">{selectedSchoolObj?.name || 'المدرسة المختارة'}</span>
              </p>
              <p>
                هل أنت متأكد من رغبتك في تحويل كافة طلاب هذه المدرسة لصفة <strong>(بدون فصل)</strong>؟
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 space-y-1">
                <span className="font-bold block">💡 ما فائدة هذه العملية؟</span>
                <span>
                  عند أخذ الحضور لأول مرة عبر التطبيق أو كشوف الغياب، سيقوم النظام تلقائياً بتوزيع الطلاب على فصولهم الحقيقية المعتمدة فور تسجيل الحضور (Plan Mode).
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isUnassigning}
                onClick={handleUnassignAllStudents}
                className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {isUnassigning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري التفريغ...</span>
                  </>
                ) : (
                  <>
                    <UserX className="w-4 h-4" />
                    <span>نعم (تأكيد التفريغ - Plan Mode)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isUnassigning}
                onClick={() => setShowUnassignModal(false)}
                className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 transition cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
}
