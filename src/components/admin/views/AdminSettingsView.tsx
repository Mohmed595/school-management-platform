import React, { useState } from 'react';
import {
  Settings,
  Save,
  Check,
  Building,
  Phone,
  Mail,
  MapPin,
  KeyRound,
  ShieldCheck,
  UserCheck,
  SlidersHorizontal,
  MessageSquare,
  UserX,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';
import { SchoolAdminData } from '../../../types/admin';
import type { SchoolExtension } from '../../../types/extensions.ts';
import { unassignAllStudentsFromClassesApi } from '../../../lib/schoolApi';

interface AdminSettingsViewProps {
  schoolData: SchoolAdminData;
  onSaveSettings: (data: Partial<SchoolAdminData>) => void;
  onToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
  studentFeaturesExtension?: SchoolExtension;
  onUpdateExtensionSettings?: (extensionId: string, settings: Record<string, any>) => Promise<boolean>;
}

export function AdminSettingsView({
  schoolData,
  onSaveSettings,
  onToast,
  studentFeaturesExtension,
  onUpdateExtensionSettings,
}: AdminSettingsViewProps) {
  const [formData, setFormData] = useState({
    schoolName: schoolData.schoolName || '',
    principalName: schoolData.principalName || '',
    phone: schoolData.phone || '0223456789',
    email: schoolData.email || 'info@nileschool.edu.eg',
    address: schoolData.address || 'القاهرة - المعادي - جمهورية مصر العربية',
    academicYear: schoolData.academicYear || '2025/2026',
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isTogglingCommunity, setIsTogglingCommunity] = useState(false);

  // Plan mode unassign state
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);

  const handleUnassignAll = async () => {
    const targetSchoolId = schoolData.schoolId || (schoolData as any).id || 'sch-1';
    setIsUnassigning(true);
    try {
      const res = await unassignAllStudentsFromClassesApi(targetSchoolId);
      onToast(
        'تم تحويل جميع طلاب المدرسة إلى (بدون فصل) - Plan Mode',
        res.message || 'سيتم توزيع الطلاب آلياً على فصولهم المعتمدة عند تسجيل الحضور لأول مرة.',
        'success'
      );
      setShowUnassignModal(false);
    } catch (err: any) {
      console.error('Unassign students error:', err);
      onToast('فشل تحويل الطلاب', err?.message || 'تعذر تحويل طلاب المدرسة إلى صفة بدون فصل', 'error');
    } finally {
      setIsUnassigning(false);
    }
  };

  const isCommunityEnabled =
    studentFeaturesExtension?.settings?.community_enabled !== false;

  const handleToggleCommunity = async () => {
    if (!onUpdateExtensionSettings || !studentFeaturesExtension) return;
    setIsTogglingCommunity(true);
    const newStatus = !isCommunityEnabled;
    const ok = await onUpdateExtensionSettings(studentFeaturesExtension.extensionId, {
      ...studentFeaturesExtension.settings,
      community_enabled: newStatus,
    });
    setIsTogglingCommunity(false);
    if (ok) {
      onToast(
        newStatus ? 'تم تفعيل ميزة المجتمع المدرسي للطلاب' : 'تم تعطيل ميزة المجتمع المدرسي وقفل الوصول مؤقتاً',
        '',
        'success'
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setIsSaved(true);
    onToast('تم حفظ إعدادات المدرسة بنجاح', '', 'success');
  };

  return (
    <div className="space-y-6 max-w-5xl dir-rtl">
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">إعدادات وبيانات المدرسة</h3>
            <p className="text-xs text-slate-500 mt-0.5">تعديل الترويسة الرسمية والبيانات المعتمدة للمؤسسة</p>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            الترخيص نشط ومفعل
          </span>
        </div>

        {/* Student Features Control Settings (Visible when extension is enabled) */}
        {studentFeaturesExtension?.isEnabled && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">إعدادات التحكم في ميزات الطلاب</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    تفعيل أو تعطيل الميزات التفاعلية المتاحة للطلاب مثل المجتمع المدرسي
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                الإضافة مفعلة
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 block">المجتمع المدرسي</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    إتاحة تبويب المجتمع المدرسي وغرف الفصول للطلاب للمناقشات والأنشطة التعليمية
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                <span
                  className={`text-xs font-bold ${
                    isCommunityEnabled ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  {isCommunityEnabled ? 'مفعّل' : 'معطل مؤقتاً'}
                </span>
                <button
                  type="button"
                  onClick={handleToggleCommunity}
                  disabled={isTogglingCommunity}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isCommunityEnabled ? 'bg-blue-600' : 'bg-slate-200'
                  } ${isTogglingCommunity ? 'opacity-50' : ''}`}
                  title={isCommunityEnabled ? 'تعطيل المجتمع المدرسي' : 'تفعيل المجتمع المدرسي'}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isCommunityEnabled ? '-translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم المدرسة الرسمي *</label>
              <input
                type="text"
                required
                value={formData.schoolName || ''}
                onChange={(e) => {
                  setFormData({ ...formData, schoolName: e.target.value });
                  setIsSaved(false);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم مدير المدرسة المسئول</label>
              <input
                type="text"
                value={formData.principalName || ''}
                onChange={(e) => {
                  setFormData({ ...formData, principalName: e.target.value });
                  setIsSaved(false);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">هاتف التواصل الرسمي</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  setIsSaved(false);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني والموقع</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setIsSaved(false);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">العنوان بالتفصيل</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => {
                  setFormData({ ...formData, address: e.target.value });
                  setIsSaved(false);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Read-only License Section */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>بيانات الترخيص المعتمد لدى وزارة التربية والتعليم والمنصة:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white border border-slate-200/60 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">كود المدرسة المعتمد:</span>
                <span className="font-mono font-bold text-blue-600 text-xs">{schoolData.schoolCode}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200/60 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">مفتاح الترخيص:</span>
                <span className="font-mono font-bold text-slate-800 text-xs">{schoolData.licenseKey}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200/60 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">تاريخ الانتهاء:</span>
                <span className="font-mono font-bold text-emerald-700 text-xs">{schoolData.licenseExpiry}</span>
              </div>
            </div>
          </div>

          {/* Discipline Rule: 3 Consecutive Lates = Absent Rule */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl space-y-2">
            <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2.5 text-emerald-950">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs text-emerald-950">لائحة الانضباط المدرسي (قاعدة: 3 أيام تأخير متتالية = اليوم الثالث غياب)</h4>
                  <p className="text-[11px] text-emerald-800/90 mt-0.5">
                    تُطبق القاعدة حصراً عند تكرار التأخير لمدة 3 أيام متتالية، حيث يقوم النظام تلقائياً باحتساب اليوم الثالث كـ «غائب» وإشعار ولي الأمر فوراً.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl font-black text-xs shrink-0 border border-emerald-200 shadow-2xs">
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>مفعلة تلقائياً (3 أيام متتالية)</span>
              </div>
            </div>
          </div>

          {/* Plan Mode: Unassign all students in this school */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-amber-950">
                <UserX className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs text-amber-950">إعادة تسكين وتفريغ الفصول (Plan Mode)</h4>
                  <p className="text-[11px] text-amber-800/90 mt-0.5">
                    تحويل جميع طلاب مدرسة ({schoolData.schoolName}) لصفة (بدون فصل) لتوزيعهم الآلي عند أخذ الحضور لأول مرة.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled
                className="py-2 px-3.5 bg-slate-200 text-slate-400 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-not-allowed opacity-75 shadow-none"
                title="تم تعطيل هذه الخاصية مؤقتاً"
              >
                <UserX className="w-4 h-4 text-slate-400" />
                <span>تحويل الطلاب إلى (بدون فصل) (معطل مؤقتاً)</span>
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{isSaved ? 'تم الحفظ بنجاح' : 'حفظ التغييرات'}</span>
            </button>
          </div>
        </form>

        {/* Modal Confirmation for Admin View */}
        {showUnassignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden dir-rtl text-right p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>تأكيد تحويل الطلاب إلى (بدون فصل) - Plan Mode</span>
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
                  المدرسة: <span className="text-amber-700">{schoolData.schoolName}</span>
                </p>
                <p>
                  هل أنت متأكد من تحويل كافة طلاب المدرسة لصفة <strong>(بدون فصل)</strong>؟
                </p>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 space-y-1">
                  <span className="font-bold block">💡 النتيجة المباشرة:</span>
                  <span>
                    عند أخذ الحضور اليومي لأول مرة بواسطة المعلمين، سيتولى النظام التوزيع والتسكين الآلي للطلاب في فصولهم الفعلية المعتمدة لمرة واحدة فور تسجيل الحضور (Plan Mode).
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isUnassigning}
                  onClick={handleUnassignAll}
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
                      <span>نعم (تحويل لـ بدون فصل - Plan Mode)</span>
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
    </div>
  );
}
