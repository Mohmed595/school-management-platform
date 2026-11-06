import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitEvent: (title: string, date: string, time: string, location?: string) => void;
}

export function CreateEventModal({ isOpen, onClose, onSubmitEvent }: CreateEventModalProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('الخميس القادم - 6 أغسطس 2026');
  const [time, setTime] = useState('08:00 صباحاً');
  const [location, setLocation] = useState('فناء المدرسة الرئيسي');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date.trim()) return;
    onSubmitEvent(title.trim(), date.trim(), time.trim(), location.trim());
    onClose();
    setTitle('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 dir-rtl select-none animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <h3 className="font-extrabold text-sm">إضافة مناسبة أو فعالية مدرسية</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">عنوان المناسبة</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: رحلة علمية لمتحف العلوم / تكريم المتفوقين"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-emerald-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">التاريخ</label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">الوقت</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-emerald-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">المكان (اختياري)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
            >
              نشر المناسبة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
