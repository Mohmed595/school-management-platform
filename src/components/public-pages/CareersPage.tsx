import React from 'react';
import { Briefcase, CheckCircle2, Send, Sparkles, MapPin, Clock } from 'lucide-react';
import { PublicPageLayout } from './PublicPageLayout';

interface CareersPageProps {
  onBackToHome: () => void;
  onNavigateToPage?: (pageId: string) => void;
}

export function CareersPage({ onBackToHome, onNavigateToPage }: CareersPageProps) {
  const jobs = [
    {
      title: 'مهندس واجهات أمامية أول (Senior React / TypeScript Developer)',
      type: 'دوام كامل - عن بعد / هجين',
      location: 'القاهرة، مصر',
      department: 'فريق هندسة البرمجيات',
      description: 'المساهمة في بناء وتطوير واجهات المستخدم المدرسية فائقة السرعة مع Vite و Tailwind.',
    },
    {
      title: 'أخصائي دعم فني وتكامل مدرسي (Technical Support Specialist)',
      type: 'دوام كامل',
      location: 'القاهرة، مصر',
      department: 'فريق تجربة العملاء والمدارس',
      description: 'متابعة وتدريب مسؤولي المدارس والمعلمين على استخدام المنصة وحل المشكلات الفنية.',
    },
    {
      title: 'مستشار تربوي لتطوير المحتوى واللوائح المدرسية',
      type: 'دوام جزئي / استشاري',
      location: 'عن بعد',
      department: 'قسم التطوير التربوي',
      description: 'مراجعة معايير لائحة الانضباط المدرسي وقواعد الأوسمة التقديرية للتحقق من توافقها التام مع لوائح وزارة التربية والتعليم المصرية.',
    },
  ];

  return (
    <PublicPageLayout
      title="انضم إلى فريق EduPortal"
      subtitle="نبحث دائماً عن الشغوفين بالتكنولوجيا والتعليم لبناء مستقبل تعليمي أفضل وأكثر ذكاءً."
      categoryBadge="فرص عمل مميزة 2026"
      onBackToHome={onBackToHome}
      onNavigateToPage={onNavigateToPage}
    >
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="space-y-4">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-400" />
            <span>الوظائف الشاغرة حالياً</span>
          </h3>

          <div className="space-y-4">
            {jobs.map((job, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition-all shadow-md"
              >
                <div className="space-y-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-black">
                    {job.department}
                  </span>
                  <h4 className="text-base font-black text-white">{job.title}</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xl">
                    {job.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-bold pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {job.type}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.location}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 w-full sm:w-auto">
                  <a
                    href="mailto:careers@eduportal.eg?subject=التقديم على وظيفة"
                    className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
                  >
                    <span>التقديم الآن</span>
                    <Send className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Culture box */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-3">
          <h4 className="text-base font-black text-white">لم تجد وظيفة تناسب خبراتك؟</h4>
          <p className="text-xs text-slate-400 max-w-lg mx-auto font-medium">
            نرحب دائماً بالسير الذاتية المتميزة. أرسل ملفك الشخصي وسنتواصل معك فور توفر شاغر ملائم:
          </p>
          <a
            href="mailto:careers@eduportal.eg"
            className="text-blue-400 font-bold text-xs underline hover:text-blue-300"
          >
            careers@eduportal.eg
          </a>
        </div>
      </div>
    </PublicPageLayout>
  );
}
