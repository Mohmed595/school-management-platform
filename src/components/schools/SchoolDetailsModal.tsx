import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { School } from '../../types';
import { StatusBadge, PlanBadge } from '../ui/Badge';
import { formatArabicNumber } from '../../lib/storage';
import {
  Building2,
  Key,
  Calendar,
  UserCheck,
  Phone,
  Mail,
  GraduationCap,
  Users,
  Copy,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface SchoolDetailsModalProps {
  school: School | null;
  isOpen: boolean;
  onClose: () => void;
  onToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
  onOpenAdminDashboard?: (schoolId: string) => void;
}

export function SchoolDetailsModal({
  school,
  isOpen,
  onClose,
  onToast,
  onOpenAdminDashboard,
}: SchoolDetailsModalProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen || !school) return null;

  const copyValue = (text: string, type: 'key' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      onToast('تم نسخ مفتاح الترخيص', text);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      onToast('تم نسخ كود المدرسة', text);
    }
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
          {/* Header Banner */}
          <div className="p-6 bg-slate-900 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={school.status} />
                  <PlanBadge plan={school.subscription} />
                </div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  {school.name}
                </h2>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span>محافظة {school.governorate}</span>
                  <span>•</span>
                  <span>تاريخ التسجيل: {school.createdAt}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6">
            {/* System Generated Credentials Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                بيانات الترخيص المولدة آلياً من المنصة
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* School Code */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      كود المدرسة الفريد (School Code)
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {school.code}
                    </span>
                  </div>
                  <button
                    onClick={() => copyValue(school.code, 'code')}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="نسخ الكود"
                  >
                    {copiedCode ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* License Key */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      مفتاح التشغيل والترخيص (License Key)
                    </span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      {school.licenseKey}
                    </span>
                  </div>
                  <button
                    onClick={() => copyValue(school.licenseKey, 'key')}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                    title="نسخ المفتاح"
                  >
                    {copiedKey ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* School Capacity & Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5">
                <span className="text-[11px] text-slate-500 font-semibold block">إجمالي الطلاب</span>
                <span className="text-xl font-extrabold text-blue-700 mt-1 block">
                  {formatArabicNumber(school.studentsCount)}
                </span>
              </div>

              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5">
                <span className="text-[11px] text-slate-500 font-semibold block">الكادر التعليمي</span>
                <span className="text-xl font-extrabold text-indigo-700 mt-1 block">
                  {formatArabicNumber(school.teachersCount)}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-amber-50/50 border border-amber-100 rounded-xl p-3.5">
                <span className="text-[11px] text-slate-500 font-semibold block">انتهاء الترخيص</span>
                <span className="text-sm font-bold font-mono text-amber-800 mt-1 block">
                  {school.licenseExpiry}
                </span>
              </div>
            </div>

            {/* Principal & Contact Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800">بيانات الإدارة والتواصل</h4>
              <div className="bg-white border border-slate-200/80 rounded-xl p-4 divide-y divide-slate-100 text-xs">
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-slate-400" />
                    مدير المدرسة:
                  </span>
                  <span className="font-bold text-slate-900">{school.principalName}</span>
                </div>

                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    هاتف التواصل:
                  </span>
                  <span className="font-bold font-mono text-slate-900">
                    {school.principalPhone}
                  </span>
                </div>

                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    البريد الإلكتروني:
                  </span>
                  <span className="font-bold text-blue-600 hover:underline">
                    {school.principalEmail}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              بيانات متزامنة مع خوادم Supabase
            </span>

            <div className="flex items-center gap-2">
              {onOpenAdminDashboard && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAdminDashboard(school.id);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>دخول لوحة إدارة المدرسة</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
