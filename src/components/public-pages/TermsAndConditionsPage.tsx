import React from 'react';
import { Scale, CheckCircle2, ShieldAlert, BookOpen, AlertTriangle } from 'lucide-react';
import { PublicPageLayout } from './PublicPageLayout';

interface TermsAndConditionsPageProps {
  onBackToHome: () => void;
  onNavigateToPage?: (pageId: string) => void;
}

export function TermsAndConditionsPage({ onBackToHome, onNavigateToPage }: TermsAndConditionsPageProps) {
  return (
    <PublicPageLayout
      title="الشروط والأحكام واتفاقية الاستخدام"
      subtitle="تنظم هذه الاتفاقية استخدام منصة EduPortal التعليمية بين المؤسسات التربوية المسجلة، المعلمين، الطلاب، وأولياء الأمور."
      categoryBadge="اتفاقية استخدام معتمدة 2026"
      onBackToHome={onBackToHome}
      onNavigateToPage={onNavigateToPage}
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-blue-400">
            <Scale className="w-5 h-5 shrink-0" />
            <h3 className="text-base sm:text-lg font-black text-white">
              1. قبول الشروط والأهلية
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            يُعد تسجيل الدخول أو استخدام أي من خدمات EduPortal موافقة تامة على الالتزام ببنود هذه الاتفاقية. يتم توفير الحسابات للطلاب وأولياء الأمور والمعلمين بناءً على بيانات معتمدة ومسجلة رسمياً من إدارة المدرسة التابع لها الطالب.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <h3 className="text-base sm:text-lg font-black text-white">
              2. مسؤولية الحساب وأمان بيانات الدخول
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            حساب الطالب وولي الأمر هو حساب موحد ومشترك يُسجل الدخول إليه باستخدام (اسم الطالب، الرقم القومي، وكود الوزارة) دون كلمة مرور، بينما يعتمد المعلمون والإدارة على بيانات دخول مشفرة ومخصصة. المستخدم مسؤول عن الحفاظ على دقة بياناته، وعدم تفعيل خيار "الوثوق بهذا الجهاز" إلا على الأجهزة الشخصية الآمنة، مع إمكانية مسح الجلسات المحفوظة في أي وقت.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-amber-400">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <h3 className="text-base sm:text-lg font-black text-white">
              3. قواعد الاستخدام التربوي والانضباط المدرسي
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            تُستخدم المنصة حصرياً للمتابعة التربوية والانضباط المدرسي ورصد الحضور والغياب اليومي والسلوكيات والأوسمة التشجيعية. يُحظر تماماً نشر أي محتوى غير لائق، أو محاولة استغلال الثغرات، أو رصد أي ملاحظات تخالف اللائحة المدرسية المنظمة للانضباط والسلوك.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-indigo-400">
            <BookOpen className="w-5 h-5 shrink-0" />
            <h3 className="text-base sm:text-lg font-black text-white">
              4. الملكية الفكرية وحقوق النشر
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            كافة حقوق الملكية الفكرية للعلامة التجارية والتصميم والبرمجيات والمخططات البيانية لمنصة EduPortal محفوظة بالكامل لشركة ومطوري EduPortal لعام 2026. لا يجوز نسخ أو هندسة عكسية لأي جزء من النظام دون إذن كتابي رسمي.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="text-base sm:text-lg font-black text-white">
              5. التحديثات والتعديلات على الاتفاقية
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            تحتفظ إدارة المنصة بالحق في تحديث هذه الشروط عند الحاجة لمواكبة التحديثات التقنية أو اللوائح التعليمية الجديدة، وسيتم إشعار المستخدمين بأي تغييرات جوهرية عبر لوحة التحكم.
          </p>
        </div>
      </div>
    </PublicPageLayout>
  );
}
