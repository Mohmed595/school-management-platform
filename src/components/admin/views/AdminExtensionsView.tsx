import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Puzzle,
  CheckCircle2,
  XCircle,
  Users,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  Search,
  AlertCircle,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { SchoolExtension } from '../../../types/extensions.ts';

interface AdminExtensionsViewProps {
  schoolId: string;
  schoolName?: string;
  extensions: SchoolExtension[];
  isLoading: boolean;
  onToggleExtension: (extensionId: string, enabled: boolean) => Promise<boolean>;
  onUpdateSettings: (extensionId: string, settings: Record<string, any>) => Promise<boolean>;
  onRefresh: () => void;
}

export const AdminExtensionsView: React.FC<AdminExtensionsViewProps> = ({
  schoolId,
  schoolName,
  extensions,
  isLoading,
  onToggleExtension,
  onUpdateSettings,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggle = async (extensionId: string, currentStatus: boolean) => {
    setUpdatingId(extensionId);
    const newStatus = !currentStatus;
    const ok = await onToggleExtension(extensionId, newStatus);
    setUpdatingId(null);
    if (ok) {
      showToast(newStatus ? 'تم تفعيل الإضافة بنجاح للمدرسة' : 'تم تعطيل الإضافة وإيقاف ميزاتها الفرعية');
    }
  };

  const handleToggleSubSetting = async (
    extensionId: string,
    currentSettings: Record<string, any>,
    key: string,
    newValue: boolean
  ) => {
    setUpdatingId(`${extensionId}_${key}`);
    const updated = {
      ...currentSettings,
      [key]: newValue,
    };
    const ok = await onUpdateSettings(extensionId, updated);
    setUpdatingId(null);
    if (ok) {
      showToast('تم حفظ التعديل وتحديث الصلاحيات فورياً');
    }
  };

  const filteredExtensions = extensions.filter((ext) => {
    const term = searchTerm.trim().toLowerCase();
    const nameMatch = (ext.name || '').toLowerCase().includes(term);
    const descMatch = (ext.description || '').toLowerCase().includes(term);
    const matchesSearch = !term || nameMatch || descMatch;
    const matchesCategory = selectedCategory === 'all' || ext.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeCount = extensions.filter((e) => e.isEnabled).length;

  return (
    <div className="space-y-6 max-w-5xl dir-rtl pb-10" id="admin-extensions-container">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-emerald-400/30 text-xs font-bold"
            id="extensions-success-toast"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-bold text-sm text-slate-900" id="extensions-page-title">
                إضافات المدرسة وميزات النظام
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold">
                <Puzzle className="w-3.5 h-3.5" />
                {activeCount} من {extensions.length} مفعل
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              إدارة الامتدادات المركزية وتخصيص ميزات الطلاب والتطبيقات المعتمدة لـ {schoolName || 'المدرسة'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
            id="refresh-extensions-btn"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Search & Categories Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="البحث في الإضافات والميزات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all placeholder:text-slate-400"
            id="search-extensions-input"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل ({extensions.length})
          </button>
          <button
            onClick={() => setSelectedCategory('student')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              selectedCategory === 'student'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ميزات الطلاب
          </button>
        </div>
      </div>

      {/* Extensions List */}
      <div className="space-y-4" id="extensions-list">
        {isLoading && extensions.length === 0 ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 animate-pulse space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-slate-200 rounded-xl" />
                    <div className="space-y-2">
                      <div className="w-40 h-4 bg-slate-200 rounded" />
                      <div className="w-60 h-3 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-slate-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredExtensions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Puzzle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">لا توجد إضافات تطابق بحثك</h3>
            <p className="text-xs text-slate-500 mt-1">
              جرب تغيير كلمات البحث أو استعراض جميع الفئات
            </p>
            {(searchTerm || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <span>إعادة تعيين البحث</span>
              </button>
            )}
          </div>
        ) : (
          filteredExtensions.map((ext) => {
            const isUpdating = updatingId === ext.extensionId;
            const isStudentControl = ext.extensionId === 'student_features_control';
            const isCommunityActive =
              ext.isEnabled && ext.settings?.community_enabled !== false;

            return (
              <div
                key={ext.extensionId}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 transition-all space-y-4"
                id={`extension-card-${ext.extensionId}`}
              >
                {/* Main Card Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      {isStudentControl ? (
                        <Users className="w-5 h-5" />
                      ) : (
                        <SlidersHorizontal className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-bold text-sm text-slate-900">
                          {ext.name || 'امتداد نظام'}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-xs font-bold ${
                            ext.isEnabled
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {ext.isEnabled ? 'مفعّل ●' : 'غير مفعّل ○'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {ext.description || 'التحكم في تفعيل أو إيقاف الميزات التفاعلية المتاحة للطلاب مثل المجتمع المدرسي'}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <span className="text-xs font-bold text-slate-700">
                      {ext.isEnabled ? 'حالة الإضافة: مفعّلة' : 'حالة الإضافة: معطلة'}
                    </span>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleToggle(ext.extensionId, ext.isEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        ext.isEnabled ? 'bg-blue-600' : 'bg-slate-200'
                      } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      id={`toggle-extension-${ext.extensionId}`}
                      title={ext.isEnabled ? 'تعطيل الإضافة' : 'تفعيل الإضافة'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          ext.isEnabled ? '-translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Sub-Features Section (Visible when enabled) */}
                {ext.isEnabled && (
                  <div className="pt-4 border-t border-slate-100 bg-slate-50/70 rounded-xl p-4 border border-slate-200/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        الميزات التفاعلية المندرجة تحت هذه الإضافة:
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        تتحكم في صلاحيات الوصول الفعلي للطلاب
                      </span>
                    </div>

                    {isStudentControl && (
                      <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 block">
                              المجتمع المدرسي
                            </span>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              إتاحة تبويب المجتمع المدرسي وغرف الفصول للطلاب للمناقشات التعليمية والتواصل
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                          <span
                            className={`text-xs font-bold ${
                              isCommunityActive ? 'text-emerald-700' : 'text-slate-500'
                            }`}
                          >
                            {isCommunityActive ? 'مفعّل' : 'معطل مؤقتاً'}
                          </span>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              handleToggleSubSetting(
                                ext.extensionId,
                                ext.settings || {},
                                'community_enabled',
                                !isCommunityActive
                              )
                            }
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isCommunityActive ? 'bg-blue-600' : 'bg-slate-200'
                            } ${isUpdating ? 'opacity-50' : ''}`}
                            id="toggle-community-feature"
                            title={isCommunityActive ? 'تعطيل المجتمع المدرسي' : 'تفعيل المجتمع المدرسي'}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                isCommunityActive ? '-translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-400 font-medium">
                      💡 ملاحظة: يمكن أيضاً إدارة وتخصيص ميزات الطلاب مباشرة من تبويب إعدادات المدرسة.
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Info Notice */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          جميع التغييرات التي تجريها في إضافات المدرسة يتم تطبيقها فورياً على جميع مستخدمي المدرسة دون الحاجة لإعادة تشغيل النظام أو الخروج من الحساب.
        </p>
      </div>
    </div>
  );
};
