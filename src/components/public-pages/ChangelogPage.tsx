import React from 'react';
import {
  Sparkles,
  GitCommit,
  CheckCircle2,
  Calendar,
  Zap,
  Shield,
  Layers,
  Smartphone,
} from 'lucide-react';
import { PublicPageLayout } from './PublicPageLayout';

interface ChangelogPageProps {
  onBackToHome: () => void;
  onNavigateToPage?: (pageId: string) => void;
}

interface ReleaseItem {
  version: string;
  releaseDate: string;
  title: string;
  badgeText: string;
  badgeColor: string;
  highlights: {
    type: 'new' | 'improved' | 'fix';
    text: string;
  }[];
}

export function ChangelogPage({ onBackToHome, onNavigateToPage }: ChangelogPageProps) {
  const releases: ReleaseItem[] = [
    {
      version: 'v2026.4',
      releaseDate: 'سبتمبر 2026 (الإصدار الحالي)',
      title: 'تحديث الدعم العام وواجهات المساعدة المتقدمة',
      badgeText: 'أحدث إصدار',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      highlights: [
        {
          type: 'new',
          text: 'إطلاق مركز الدعم الفني العام لفتح تذاكر ومتابعتها مباشرة بدون الحاجة لتسجيل الدخول.',
        },
        {
          type: 'new',
          text: 'إضافة صفحات الشروط والأحكام، سياسة الخصوصية والكوكيز، الأسئلة الشائعة، وعن الشركة.',
        },
        {
          type: 'improved',
          text: 'إعادة تصميم وتطوير لوحة تحكم المعلم لتكون أكثر فخامة وسرعة مع تبسيط بطاقات المؤشرات الأساسية.',
        },
        {
          type: 'improved',
          text: 'تحسين كفاءة استعلامات رصد الحضور والسلوك والأوسمة اللحظية بنسبة 40%.',
        },
      ],
    },
    {
      version: 'v2026.3',
      releaseDate: 'أغسطس 2026',
      title: 'الأجهزة الموثوقة وحفظ الحسابات الذكي',
      badgeText: 'ترقية رئيسية',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      highlights: [
        {
          type: 'new',
          text: 'نظام حفظ الحسابات والتبديل السريع بين حسابات الطلاب في الأجهزة الموثوقة دون إعادة كتابة الرقم القومي وكود الوزارة.',
        },
        {
          type: 'new',
          text: 'أفاتارات وتخصيص هوية بصرية ممتعة لكل طالب مع شارات التميز.',
        },
        {
          type: 'improved',
          text: 'تعزيز أمان الجلسات وحماية الرموز المميزة وتشفير التخزين المحلي للمتصفح.',
        },
      ],
    },
    {
      version: 'v2026.2',
      releaseDate: 'يوليو 2026',
      title: 'تطبيق الويب التقدمي (PWA) والتكامل التربوي',
      badgeText: 'ميزة هامة',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      highlights: [
        {
          type: 'new',
          text: 'دعم التثبيت كتطبيق مستقل PWA على أجهزة Android و iPhone وحواسيب Windows/Mac.',
        },
        {
          type: 'improved',
          text: 'نظام رصد السلوك الفوري وإشعار أولياء الأمور عبر الرسائل والتنبيهات المباشرة.',
        },
        {
          type: 'fix',
          text: 'معالجة مشكلات مزامنة الحضور الفوري والملاحظات السلوكية بدقة عالية.',
        },
      ],
    },
    {
      version: 'v2026.1',
      releaseDate: 'يونيو 2026',
      title: 'الإطلاق الرسمي لمنصة EduPortal للمدارس المصرية',
      badgeText: 'الإصدار الأولي',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      highlights: [
        {
          type: 'new',
          text: 'إطلاق بوابة الإدارة المدرسية الموحدة وشؤون الطلاب والمعلمين وأولياء الأمور.',
        },
        {
          type: 'new',
          text: 'نظام إدارة الفصول والصفوف الدراسية المتوافق مع مناهج وزارة التربية والتعليم.',
        },
      ],
    },
  ];

  const renderBadgeType = (type: 'new' | 'improved' | 'fix') => {
    switch (type) {
      case 'new':
        return (
          <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-black shrink-0">
            جديد
          </span>
        );
      case 'improved':
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black shrink-0">
            تحسين
          </span>
        );
      case 'fix':
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black shrink-0">
            إصلاح
          </span>
        );
    }
  };

  return (
    <PublicPageLayout
      title="سجل التحديثات والتطويرات (Update Log)"
      subtitle="نعمل باستمرار على تطوير وتحديث منصة EduPortal بأحدث التقنيات والميزات لضمان أفضل تجربة للمدارس والطلاب."
      categoryBadge="تطوير مستمر 2026"
      onBackToHome={onBackToHome}
      onNavigateToPage={onNavigateToPage}
    >
      <div className="space-y-8 max-w-3xl mx-auto">
        <div className="relative border-r-2 border-slate-800 pr-6 mr-3 space-y-10">
          {releases.map((rel, index) => (
            <div key={rel.version} className="relative">
              {/* Timeline Bullet Node */}
              <div className="absolute -right-[33px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-4 border-slate-950 shadow-md shadow-blue-500/50" />

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 hover:border-slate-700 transition-all shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black font-mono text-white">
                      {rel.version}
                    </span>
                    <span
                      className={`px-3 py-0.5 rounded-full text-[11px] font-black border ${rel.badgeColor}`}
                    >
                      {rel.badgeText}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span>{rel.releaseDate}</span>
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-black text-slate-100">
                  {rel.title}
                </h3>

                <div className="space-y-2.5 pt-1">
                  {rel.highlights.map((h, hIdx) => (
                    <div key={hIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                      <div className="mt-0.5">{renderBadgeType(h.type)}</div>
                      <span className="leading-relaxed font-medium">{h.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PublicPageLayout>
  );
}
