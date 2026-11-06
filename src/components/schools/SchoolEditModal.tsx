import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { School, Governorate, SubscriptionPlan, EGYPT_GOVERNORATES } from '../../types';
import { schoolSchema, SchoolFormData } from '../../lib/validation';
import { X, Edit3, Save } from 'lucide-react';

interface SchoolEditModalProps {
  school: School | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSchool: (updatedSchool: School) => void;
  onToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export function SchoolEditModal({
  school,
  isOpen,
  onClose,
  onUpdateSchool,
  onToast,
}: SchoolEditModalProps) {
  const [formData, setFormData] = useState<SchoolFormData>({
    name: '',
    governorate: 'القاهرة',
    principalName: '',
    principalPhone: '',
    principalEmail: '',
    subscription: 'احترافي',
    studentsCount: 0,
    teachersCount: 0,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SchoolFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (school) {
      setFormData({
        name: school.name || '',
        governorate: school.governorate || 'القاهرة',
        principalName: school.principalName || '',
        principalPhone: school.principalPhone || '',
        principalEmail: school.principalEmail || '',
        subscription: school.subscription || 'احترافي',
        studentsCount: school.studentsCount || 0,
        teachersCount: school.teachersCount || 0,
      });
      setErrors({});
    }
  }, [school]);

  if (!isOpen || !school) return null;

  const handleSubmit = (e: React.FormEvent) => {
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

    const updatedSchool: School = {
      ...school,
      name: formData.name.trim(),
      governorate: formData.governorate as Governorate,
      principalName: formData.principalName.trim(),
      principalPhone: formData.principalPhone.trim(),
      principalEmail: formData.principalEmail.trim(),
      subscription: formData.subscription as SubscriptionPlan,
      studentsCount: formData.studentsCount,
      teachersCount: formData.teachersCount,
    };

    onUpdateSchool(updatedSchool);
    setIsSubmitting(false);
    onToast('تم تحديث بيانات المدرسة بنجاح', `تحديث بيانات ${updatedSchool.name}`);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">تعديل بيانات المدرسة</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  الكود: {school.code} • الترخيص: {school.licenseKey}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* School Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  اسم المدرسة بالكامل *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                    errors.name ? 'border-red-500' : 'border-slate-200 focus:ring-blue-600'
                  } rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-all`}
                />
                {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
              </div>

              {/* Governorate */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  المحافظة المصرية *
                </label>
                <select
                  value={formData.governorate || 'القاهرة'}
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
                  خطة الاشتراك *
                </label>
                <select
                  value={formData.subscription || 'احترافي'}
                  onChange={(e) => setFormData({ ...formData, subscription: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all cursor-pointer"
                >
                  <option value="بريميوم">بريميوم</option>
                  <option value="احترافي">احترافي</option>
                  <option value="أساسي">أساسي</option>
                </select>
              </div>

              {/* Principal Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  اسم مدير المدرسة *
                </label>
                <input
                  type="text"
                  value={formData.principalName || ''}
                  onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                    errors.principalName ? 'border-red-500' : 'border-slate-200 focus:ring-blue-600'
                  } rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-all`}
                />
                {errors.principalName && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.principalName}</p>
                )}
              </div>

              {/* Principal Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  رقم هاتف التواصل *
                </label>
                <input
                  type="text"
                  value={formData.principalPhone || ''}
                  onChange={(e) => setFormData({ ...formData, principalPhone: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                    errors.principalPhone ? 'border-red-500' : 'border-slate-200 focus:ring-blue-600'
                  } rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-all font-mono`}
                />
                {errors.principalPhone && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.principalPhone}</p>
                )}
              </div>

              {/* Principal Email */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  البريد الإلكتروني الإداري *
                </label>
                <input
                  type="email"
                  value={formData.principalEmail || ''}
                  onChange={(e) => setFormData({ ...formData, principalEmail: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                    errors.principalEmail ? 'border-red-500' : 'border-slate-200 focus:ring-blue-600'
                  } rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-all`}
                />
                {errors.principalEmail && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.principalEmail}</p>
                )}
              </div>

              {/* Real Stats Display */}
              <div className="sm:col-span-2 grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">إجمالي الطلاب الفعلي المسجل</span>
                  <span className="text-base font-extrabold text-blue-700 font-mono mt-0.5 block">
                    {school.studentsCount} طالب
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">الكادر التعليمي الفعلي المسجل</span>
                  <span className="text-base font-extrabold text-indigo-700 font-mono mt-0.5 block">
                    {school.teachersCount} معلم
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>حفظ التعديلات</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
