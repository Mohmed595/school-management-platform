import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { School } from '../../types';
import { Trash2, AlertOctagon, X } from 'lucide-react';

interface SchoolDeleteModalProps {
  school: School | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (schoolId: string) => void;
}

export function SchoolDeleteModal({
  school,
  isOpen,
  onClose,
  onConfirmDelete,
}: SchoolDeleteModalProps) {
  const [confirmInput, setConfirmInput] = useState('');

  if (!isOpen || !school) return null;

  const isConfirmed = confirmInput.trim() === school.name.trim() || confirmInput.trim() === 'حذف';

  const handleDelete = () => {
    if (!isConfirmed) return;
    onConfirmDelete(school.id);
    onClose();
    setConfirmInput('');
  };

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
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl border border-red-200/80">
              <AlertOctagon className="w-6 h-6" />
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="font-bold text-slate-900 text-lg mb-2">حذف المدرسة نهائياً</h3>

          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            تحذير: أنت على وشك حذف مدرسة{' '}
            <span className="font-bold text-slate-900">{school.name}</span> وكافة بياناتها التابعة نهائياً
            (الطلاب، المعلمين، الفصول، الإعلانات، الواجبات، الحضور والغياب، السجلات والدرجات).
            سيتم مسح بيانات هذه المدرسة حصراً ولا يمكن التراجع عن هذا الإجراء!
          </p>

          <div className="mb-5">
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              لتأكيد الحذف النهائي، اكتب <span className="text-red-600">حذف</span> أو اسم المدرسة:
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="اكتب اسم المدرسة أو كلمة حذف"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            <button
              onClick={handleDelete}
              disabled={!isConfirmed}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-semibold rounded-xl text-xs shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>تأكيد الحذف النهائي</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
