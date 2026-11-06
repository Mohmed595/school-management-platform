import React, { useState } from 'react';
import { X, Megaphone, Pin } from 'lucide-react';

interface CreateAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitAd: (title: string, content: string, isPinned: boolean) => void;
}

export function CreateAdModal({ isOpen, onClose, onSubmitAd }: CreateAdModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSubmitAd(title.trim(), content.trim(), isPinned);
    onClose();
    setTitle('');
    setContent('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 dir-rtl select-none animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            <h3 className="font-extrabold text-sm">نشر إعلان رسمي (AD)</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              عنوان الإعلان <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تنبيه هام بخصوص موعد الاختبارات / جدول الحصص"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              تفاصيل الإعلان <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="اكتب نص وتفاصيل الإعلان هنا بوضوح لجميع الطلاب وأولياء الأمور..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white transition-all resize-none"
              required
            />
          </div>

          {/* Pin Toggle */}
          <div className="flex items-center gap-2.5 p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl">
            <input
              type="checkbox"
              id="pin-ad-checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-500 cursor-pointer"
            />
            <label
              htmlFor="pin-ad-checkbox"
              className="text-xs font-bold text-amber-900 flex items-center gap-1.5 cursor-pointer"
            >
              <Pin className="w-3.5 h-3.5 fill-current text-amber-700" />
              <span>تثبيت هذا الإعلان في أعلى المحادثة للجميع</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !content.trim()}
              className="px-5 py-2 text-xs font-extrabold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Megaphone className="w-4 h-4" />
              <span>نشر الإعلان الآن</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
