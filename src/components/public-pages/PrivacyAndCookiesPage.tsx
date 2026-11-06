import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Cookie,
  EyeOff,
  UserCheck,
  Server,
  FileText,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { PublicPageLayout } from './PublicPageLayout';
import { removeAllSavedAccounts } from '../../lib/trustedDeviceStorage';

interface PrivacyAndCookiesPageProps {
  onBackToHome: () => void;
  onNavigateToPage?: (pageId: string) => void;
}

export function PrivacyAndCookiesPage({ onBackToHome, onNavigateToPage }: PrivacyAndCookiesPageProps) {
  const [cookieSection, setCookieSection] = useState<'privacy' | 'cookies'>('privacy');
  const [clearedNotice, setClearedNotice] = useState(false);

  const handleClearLocalData = () => {
    removeAllSavedAccounts();
    try {
      localStorage.removeItem('trusted_device_accounts');
      localStorage.removeItem('eg_school_platform_session_v4');
    } catch {}
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 3000);
  };

  return (
    <PublicPageLayout
      title="سياسة الخصوصية وقواعد ملفات تعريف الارتباط"
      subtitle="نلتزم في منصة EduPortal بأعلى المعايير العالمية لحماية البيانات وخصوصية المؤسسات التعليمية والطلاب وأولياء الأمور."
      categoryBadge="أمان وتشفير معتمد"
      onBackToHome={onBackToHome}
      onNavigateToPage={onNavigateToPage}
    >
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Toggle between Privacy & Cookies */}
        <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl max-w-md mx-auto">
          <button
            onClick={() => setCookieSection('privacy')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              cookieSection === 'privacy'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>سياسة الخصوصية</span>
          </button>
          <button
            onClick={() => setCookieSection('cookies')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              cookieSection === 'cookies'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Cookie className="w-4 h-4" />
            <span>ملفات تعريف الارتباط (Cookies)</span>
          </button>
        </div>

        {cookieSection === 'privacy' ? (
          <div className="space-y-6">
            {/* Card 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3">
              <div className="flex items-center gap-3 text-blue-400">
                <Lock className="w-5 h-5 shrink-0" />
                <h3 className="text-base sm:text-lg font-black text-white">
                  1. مبادئ جمع البيانات وحمايتها
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                تجمع منصة EduPortal البيانات الضرورية فقط لسير العملية التربوية والانضباط المدرسي (اسم الطالب، الرقم القومي، كود الوزارة، الصف والفصل الدراسي، سجل الحضور والغياب اليومي، والملاحظات السلوكية الإيجابية والسلبية ونقاط التميز والأوسمة التشجيعية). المنصة مخصصة حصرياً للانضباط والسلوك والحضور، ولا تدعم أو تجري أي امتحانات أو اختبارات أو تقييمات إلكترونية.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3">
              <div className="flex items-center gap-3 text-indigo-400">
                <Server className="w-5 h-5 shrink-0" />
                <h3 className="text-base sm:text-lg font-black text-white">
                  2. التشفير والتخزين السحابي الآمن
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                يتم تشفير كافة البيانات المتداولة بين جهاز المستخدم وخوادمنا باستخدام بروتوكولات التشفير المتقدمة (TLS / HTTPS 256-bit). قواعد البيانات محمية بعزل متعدد المستويات وصلاحيات وصول صارمة مبنية على الأدوار (RBAC) لضمان عدم وصول أي طرف غير مصرح له للمعلومات.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3">
              <div className="flex items-center gap-3 text-emerald-400">
                <EyeOff className="w-5 h-5 shrink-0" />
                <h3 className="text-base sm:text-lg font-black text-white">
                  3. حظر بيع البيانات أو الإعلانات التجارية
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                نلتزم قطعياً بعدم بيع أو تأجير أو مشاركة أي بيانات تخص الطلاب أو الكوادر التعليمية مع شبكات الإعلانات أو جهات خارجية. منصة EduPortal خالية تماماً من أي إعلانات تجارية موجهة لحماية بيئة التعليم النظيفة.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3">
              <div className="flex items-center gap-3 text-amber-400">
                <UserCheck className="w-5 h-5 shrink-0" />
                <h3 className="text-base sm:text-lg font-black text-white">
                  4. حقوق أولياء الأمور والطلاب (الحساب الموحد)
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                نظراً لأن حساب الطالب وولي الأمر هو حساب موحد ومشترك، يحق لولي الأمر والطالب مراجعة السجلات المسجلة (الحضور، الغياب، والملاحظات السلوكية) وطلب تصحيح أي بيان من خلال إدارة المدرسة أو تقديم تذكرة استفسار عبر مركز المساعدة في أي وقت.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-3 text-amber-400">
                <Cookie className="w-6 h-6 shrink-0" />
                <h3 className="text-base sm:text-lg font-black text-white">
                  ما هي ملفات تعريف الارتباط (Cookies) وكيف نستخدمها؟
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                ملفات تعريف الارتباط والتخزين المحلي (Local Storage) هي ملفات تقنية مشفرة وصغيرة تُحفظ على متصفح جهازك لتمكين الموقع من العمل بسلاسة وتذكر الجلسات النشطة والأجهزة الموثوقة.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-black text-blue-400">ملفات أساسية تشغيلية (Essential)</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    تضمن بقاء جلسة تسجيل الدخول آمنة والتحقق من صلاحية المستخدم للوحة التحكم. لا يمكن تعطيلها لأنها أساسية لتشغيل النظام.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-black text-emerald-400">ملفات تذكر الأجهزة الموثوقة</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    تسمح بالتبديل السريع بين حسابات الأبناء وأفراد الأسرة في الجهاز الموثوق بنقرة واحدة وتفضيلات اللغة والواجهة.
                  </p>
                </div>
              </div>
            </div>

            {/* Clear Cookie Data Action Box */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-right">
                <h4 className="text-sm font-black text-white">إدارة ملفات الجهاز الحالي</h4>
                <p className="text-xs text-slate-400 font-medium">
                  يمكنك مسح الجلسات المحفوظة والحسابات الموثوقة المحفوظة على هذا المتصفح في أي وقت بنقرة واحدة.
                </p>
              </div>

              <div className="shrink-0">
                <button
                  onClick={handleClearLocalData}
                  className="py-2.5 px-4 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>مسح بيانات الجهاز المحفوظة</span>
                </button>
              </div>
            </div>

            {clearedNotice && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-black rounded-xl text-center flex items-center justify-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4" />
                <span>تم مسح كافة ملفات التخزين للجهاز الموثوق بنجاح من هذا المتصفح.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </PublicPageLayout>
  );
}
