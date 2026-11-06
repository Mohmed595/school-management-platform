import React from 'react';
import {
  GraduationCap,
  Target,
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  Users,
  Code2,
  Award,
  Globe2,
} from 'lucide-react';
import { PublicPageLayout } from './PublicPageLayout';

interface AboutCompanyPageProps {
  onBackToHome: () => void;
  onNavigateToPage?: (pageId: string) => void;
}

export function AboutCompanyPage({ onBackToHome, onNavigateToPage }: AboutCompanyPageProps) {
  return (
    <PublicPageLayout
      title="عن شركة ومنصة EduPortal"
      subtitle="رؤيتنا هي رقمنة المنظومة المدرسية وربط الطالب والمعلم وولي الأمر في بيئة تفاعلية ذكية وسلسة."
      categoryBadge="الريادة في التكنولوجيا التعليمية"
      onBackToHome={onBackToHome}
      onNavigateToPage={onNavigateToPage}
    >
      <div className="space-y-10 max-w-4xl mx-auto">
        {/* Story & Vision */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-blue-400">قصتنا ورسالتنا</span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                تطوير التعليم برؤية رقمية عصرية
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            انطلقت منصة <strong>EduPortal</strong> بهدف سد الفجوة الرقمية بين الإدارة المدرسية والمنزل، وتمكين المعلمين من التركيز على رسالتهم التربوية بدلاً من إرهاق الأعمال الورقية الروتينية. نعمل على تقديم نظام سحابي فائق السرعة والأمان، يتيح متابعة الحضور والغياب اليومي بدقة، رصد السلوك الإيجابي والسلبي اللحظي، تشجيع الطلاب عبر الأوسمة التقديرية ونقاط التميز، والتواصل الإداري والتربوي الفعال بين المدرسة والمنزل.
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
            <div className="text-center p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-xl sm:text-2xl font-black text-blue-400 block font-mono">100%</span>
              <span className="text-[11px] text-slate-400 font-bold">توافق مع المدارس المصرية</span>
            </div>
            <div className="text-center p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-xl sm:text-2xl font-black text-emerald-400 block font-mono">256-bit</span>
              <span className="text-[11px] text-slate-400 font-bold">تشفير وأمان البيانات</span>
            </div>
            <div className="text-center p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-xl sm:text-2xl font-black text-amber-400 block font-mono">PWA</span>
              <span className="text-[11px] text-slate-400 font-bold">تطبيق خفيف وسريع</span>
            </div>
            <div className="text-center p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-xl sm:text-2xl font-black text-purple-400 block font-mono">24/7</span>
              <span className="text-[11px] text-slate-400 font-bold">دعم فني واستجابة</span>
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-white">الخصوصية والأمان أولاً</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              حماية بيانات الطلاب وسجلاتهم الأكاديمية التزام أخلاقي وتقني غير قابل للتنازل.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-white">البساطة وسهولة الاستخدام</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              تصميم بديهي ومريح يتيح لولي الأمر والمعلم والطالب الوصول لأي معلومة في ثوانٍ.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-white">الشراكة والتعاون التربوي</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              نستمع لمقترحات المدارس والمعلمين وأولياء الأمور ونطور النظام وفق احتياجاتهم الفعلية.
            </p>
          </div>
        </div>

        {/* Development & Team Leadership */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Code2 className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-black text-white">فريق التطوير والقيادة التقنية</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Owner & Lead Dev */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                MA
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white">Mohamed Ahmed Abdelrahim</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Owner & Lead Dev
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  المؤسس ومهندس البرمجيات الرئيسي، قائد تصميم وتطوير منصة EduPortal.
                </p>
              </div>
            </div>

            {/* Helper Dev */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-800 text-slate-200 font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                MA
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white">Mohamed Adel Atia</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-700 text-slate-300 border border-slate-600">
                    Helper & Collaborator
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  المساهم والمشارك في اختبارات الجودة وتطوير الميزات المساندة.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicPageLayout>
  );
}
