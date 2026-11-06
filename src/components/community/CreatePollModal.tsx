import React, { useState } from 'react';
import { X, BarChart2, Plus, Trash2 } from 'lucide-react';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPoll: (question: string, options: string[]) => void;
}

export function CreatePollModal({ isOpen, onClose, onSubmitPoll }: CreatePollModalProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['نعم، مناسب جداً', 'لا، يفضل تغيير الموعد']);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== idx));
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (!question.trim() || validOptions.length < 2) return;
    onSubmitPoll(question.trim(), validOptions);
    onClose();
    setQuestion('');
    setOptions(['نعم، مناسب جداً', 'لا، يفضل تغيير الموعد']);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 dir-rtl select-none animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5" />
            <h3 className="font-extrabold text-sm">إنشاء استطلاع رأي تفاعلي</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">سؤال الاستطلاع</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="مثال: هل موعد الامتحان التقييمي مناسب؟"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">خيارات التصويت (2 على الأقل)</label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`خيار ${idx + 1}`}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
                  required
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {options.length < 5 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 pt-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                إضافة خيار آخر
              </button>
            )}
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
              disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}
              className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              نشر الاستطلاع
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
