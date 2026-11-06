import React, { useState, useEffect, useMemo } from 'react';
import {
  Printer,
  Smartphone,
  Users,
  CheckCircle2,
  Clock,
  Search,
  School as SchoolIcon,
  ShieldAlert,
  FileText,
  AlertCircle,
  X,
  Send,
  Eye,
  Download,
  MessageSquare,
} from 'lucide-react';
import { getStoredSchools } from '../../lib/storage';
import { getStudentsBySchool } from '../../lib/adminStorage';
import { PrintableLoginCardsModal } from './PrintableLoginCardsModal';
import { WhatsAppManagementView } from './WhatsAppManagementView';

interface SmsManagementViewProps {
  onAddToast: (title: string, description?: string, type?: 'success' | 'error' | 'info') => void;
  schoolId?: string;
}

export function SmsManagementView({ onAddToast, schoolId }: SmsManagementViewProps) {
  const [activeSection, setActiveSection] = useState<'whatsapp' | 'cards_and_sms'>('whatsapp');
  // Modals state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isSmsUnavailableModalOpen, setIsSmsUnavailableModalOpen] = useState<boolean>(false);

  const schools = getStoredSchools();

  // Calculate total students count
  const totalStudentsCount = useMemo(() => {
    return schools.reduce((acc, sch) => {
      const stds = getStudentsBySchool(sch.id);
      return acc + (stds.length || sch.studentsCount || 0);
    }, 0);
  }, [schools]);

  return (
    <div className="space-y-6 dir-rtl text-right p-4 sm:p-6 max-w-7xl mx-auto font-sans">
      {/* Top Section Selector */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-2 max-w-xl">
        <button
          onClick={() => setActiveSection('whatsapp')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSection === 'whatsapp'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>💬 إشعارات الواتساب (مستقر)</span>
        </button>

        <button
          onClick={() => setActiveSection('cards_and_sms')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSection === 'cards_and_sms'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>🖨️ طباعة بطاقات الدخول (PDF)</span>
        </button>
      </div>

      {activeSection === 'whatsapp' ? (
        <WhatsAppManagementView onAddToast={onAddToast} schoolId={schoolId} />
      ) : (
        <div className="space-y-8">
          {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                <span>نظام بطاقات الدخول المطبوعة (Printable Cards System)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                <span>إرسال SMS: غير متوفر حالياً</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              📱 إدارة بيانات تسجيل الدخول للطلاب وأولياء الأمور
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              طباعة وتوليد بطاقات تسجيل الدخول المقسمة بالفصول في ملفات PDF جاهزة للمشاركة والطباعة، أو متابعة خدمة الرسائل النصية القصيرة.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700/80 text-center">
              <span className="text-[10px] text-slate-400 font-bold block">إجمالي الطلاب المسجلين</span>
              <span className="text-xl font-black font-mono text-blue-400">{totalStudentsCount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two Large Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Card 1: Printable Login Cards (Primary Blue Button) */}
        <div className="bg-white rounded-3xl border-2 border-blue-100 p-6 sm:p-8 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-100/60 transition-colors" />

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-200">
                <Printer className="w-7 h-7" />
              </div>
              <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                متاح الآن (PDF)
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                🖨️ طباعة بيانات تسجيل الدخول
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                توليد ملف PDF احترافي يتضمن بطاقات دخول مقسمة بالفصول بتنسيق A4 (4cm × 6cm)، تحتوي كل بطاقة على اسم الطالب، كود الدخول، رقم ولي الأمر، ورمز QR للمسح المباشر.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>فرز تلقائي: المدرسة ← المرحلة ← الفصل ← رقم الطالب</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>رمز QR خاص بكل طالب للدخول المباشر للمنصة</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>خيارات المعاينة، التحميل، والطباعة المباشرة</span>
              </div>
            </div>
          </div>

          {/* Primary Blue Button */}
          <div className="pt-4 border-t border-slate-100 relative z-10">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 transform active:scale-[0.99]"
            >
              <Printer className="w-5 h-5" />
              <span>🖨️ طباعة بيانات تسجيل الدخول</span>
            </button>
          </div>
        </div>

        {/* Card 2: Send Via SMS (Secondary Gray Button - Disabled / Unavailable) */}
        <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center font-bold">
                <Smartphone className="w-7 h-7" />
              </div>
              <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                غير متوفر حالياً
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-700">
                  📱 إرسال عبر SMS
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                إرسال الرسائل النصية القصيرة تلقائياً عبر موفري خدمة SMS المحترفين لإبلاغ أولياء الأمور بكود الطالب ورابط المنصة التعليمية مباشرة.
              </p>
            </div>

            <div className="p-4 bg-slate-100/90 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-bold text-slate-700">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>حالة الخدمة: غير متاحة في هذا الإصدار</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                يتم العمل على ربط البوابة بمزودي خدمة جديدين للحفاظ على استقرار تسليم الرسائل.
              </p>
            </div>
          </div>

          {/* Secondary Gray Button (Triggers Unavailable Modal) */}
          <div className="pt-4 border-t border-slate-200 relative z-10">
            <button
              type="button"
              onClick={() => setIsSmsUnavailableModalOpen(true)}
              className="w-full py-4 bg-slate-200 hover:bg-slate-300 text-slate-600 font-extrabold text-base rounded-2xl cursor-pointer flex items-center justify-center gap-2 transition-all border border-slate-300"
            >
              <Smartphone className="w-5 h-5 text-slate-500" />
              <span>📱 إرسال عبر SMS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

      {/* Printable Login Cards PDF Generator & Preview Modal */}
      <PrintableLoginCardsModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onAddToast={onAddToast}
        schoolId={schoolId}
      />

      {/* SMS Feature Unavailable Dialog */}
      {isSmsUnavailableModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl text-right">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <Smartphone className="w-5 h-5 text-slate-600" />
                <h3 className="font-extrabold text-base">📱 إرسال عبر SMS</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSmsUnavailableModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 py-2 text-center sm:text-right">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto sm:mx-0">
                <AlertCircle className="w-6 h-6 text-slate-500" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-base">
                  هذه الميزة غير متوفرة حالياً.
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  سيتم توفيرها في تحديث مستقبلي.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsSmsUnavailableModalOpen(false)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                حسناً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
