import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { School } from '../../types';
import { Ban, CheckCircle, AlertTriangle, X } from 'lucide-react';

interface SchoolSuspendModalProps {
  school: School | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmToggle: (school: School) => void;
}

export function SchoolSuspendModal({
  school,
  isOpen,
  onClose,
  onConfirmToggle,
}: SchoolSuspendModalProps) {
  if (!isOpen || !school) return null;

  const isCurrentlyActive = school.status === 'نشطة';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden p-6"
        >
          <div className="flex justify-between items-start mb-4">
            <div
              className={`p-3 rounded-2xl ${
                isCurrentlyActive
                  ? 'bg-amber-50 text-amber-600 border border-amber-200/80'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200/80'
              }`}
            >
              {isCurrentlyActive ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <CheckCircle className="w-6 h-6" />
              )}
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="font-bold text-slate-900 text-lg mb-2">
            {isCurrentlyActive ? 'تعليق حساب المدرسة' : 'تفعيل حساب المدرسة'}
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            {isCurrentlyActive ? (
              <>
                هل أنت تأكد من رغبتك في تعليق ترخيص تشغيل{' '}
                <span className="font-bold text-slate-900">{school.name}</span>؟ عند التعليق، لن
                يتمكن المعلمون أو الطلاب من الدخول للنظام لحين إعادة التفعيل.
              </>
            ) : (
              <>
                هل أنت تأكد من رغبتك في إعادة تفعيل ترخيص تشغيل{' '}
                <span className="font-bold text-slate-900">{school.name}</span>؟ سيتمكن جميع
                المستخدمين من الوصول للخدمات فوراً.
              </>
            )}
          </p>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl mb-6 text-xs font-mono text-slate-600 space-y-1">
            <p>الكود: {school.code}</p>
            <p>مفتاح الترخيص: {school.licenseKey}</p>
            <p>المحافظة: {school.governorate}</p>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            <button
              onClick={() => {
                onConfirmToggle(school);
                onClose();
              }}
              className={`px-5 py-2.5 font-semibold text-white rounded-xl text-xs shadow-2xs transition-all cursor-pointer ${
                isCurrentlyActive
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isCurrentlyActive ? 'تأكيد التعليق' : 'تأكيد التفعيل'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
