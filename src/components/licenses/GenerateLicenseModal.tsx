import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { School, SubscriptionPlan } from '../../types';
import { generateLicenseKey } from '../../lib/storage';
import { Key, Sparkles, X, Check, Copy } from 'lucide-react';

interface GenerateLicenseModalProps {
  schools: School[];
  isOpen: boolean;
  onClose: () => void;
  onGenerateLicense: (schoolId: string, newKey: string, newExpiry: string, plan: SubscriptionPlan) => void;
  onToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export function GenerateLicenseModal({
  schools,
  isOpen,
  onClose,
  onGenerateLicense,
  onToast,
}: GenerateLicenseModalProps) {
  const [selectedSchoolId, setSelectedSchoolId] = useState(schools[0]?.id || '');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('احترافي');
  const [durationMonths, setDurationMonths] = useState(12);

  const generatedKey = generateLicenseKey();

  if (!isOpen) return null;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const school = schools.find((s) => s.id === selectedSchoolId);
    if (!school) return;

    // Calculate new expiry
    const future = new Date();
    future.setMonth(future.getMonth() + durationMonths);
    const newExpiryDate = future.toISOString().slice(0, 10);

    onGenerateLicense(selectedSchoolId, generatedKey, newExpiryDate, selectedPlan);
    onToast('تم إصدار الترخيص الجديد بنجاح', `تم تخصيص المفتاح ${generatedKey} لمدرسة ${school.name}`);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden p-6"
        >
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200/80">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">إصدار / تمديد ترخيص تشغيل</h3>
                <p className="text-xs text-slate-500">توليد مفاتيح الترخيص المشفرة للمدارس</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Generated Key Preview */}
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3.5 text-center">
              <span className="text-[10px] text-emerald-800 font-semibold uppercase block mb-1">
                مفتاح الترخيص المولد
              </span>
              <span className="font-mono font-bold text-emerald-900 text-lg tracking-wider">
                {generatedKey}
              </span>
            </div>

            {/* School Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                المدرسة المستفيدة *
              </label>
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all cursor-pointer"
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.governorate})
                  </option>
                ))}
              </select>
            </div>

            {/* Subscription Plan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                فئة الاشتراك والترخيص *
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value as SubscriptionPlan)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all cursor-pointer"
              >
                <option value="بريميوم">بريميوم (Premium)</option>
                <option value="احترافي">احترافي (Pro)</option>
                <option value="أساسي">أساسي (Basic)</option>
              </select>
            </div>

            {/* Duration Months */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                مدة الصلاحية (بالأشهر) *
              </label>
              <select
                value={durationMonths}
                onChange={(e) => setDurationMonths(parseInt(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all cursor-pointer"
              >
                <option value={6}>6 أشهر</option>
                <option value={12}>سنة واحدة (12 شهراً)</option>
                <option value={24}>سنتان (24 شهراً)</option>
                <option value={36}>3 سنوات (36 شهراً)</option>
              </select>
            </div>

            {/* Submit Buttons */}
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
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>إصدار واعتماد الترخيص</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
