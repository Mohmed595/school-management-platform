import React from 'react';
import { Handshake, School, CheckCircle2, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { PublicPageLayout } from './PublicPageLayout';

interface PartnersPageProps {
  onBackToHome: () => void;
  onNavigateToPage?: (pageId: string) => void;
}

export function PartnersPage({ onBackToHome, onNavigateToPage }: PartnersPageProps) {
  const partnerTypes = [
    {
      title: 'المدارس والمعاهد التعليمية الخاصة والحكومية',
      description: 'نظام إدارة شامل وموحد مع تدريب مجاني لكادر المعلمين والإداريين ودعم فني على مدار الساعة.',
      benefits: ['ربط لحظي لجميع المراحل الدراسية', 'تدريب مباشر وتجهيز كشوف الطلاب', 'لوحة تحكم مخصصة لإدارة المدرسة'],
    },
    {
      title: 'مؤسسات وتطبيقات التكنولوجيا التربوية (EdTech)',
      description: 'تكامل عبر واجهات برمجة التطبيقات (API) ومشاركة البيانات الأكاديمية والتقارير المعتمدة.',
      benefits: ['واجهات REST API آمنة وموثقة', 'مزامنة فورية لسجلات الحضور والملاحظات السلوكية', 'أمان عالي وشهادات تشفير معتمدة'],
    },
  ];

  return (
    <PublicPageLayout
      title="الشركاء والتعاون المؤسسي"
      subtitle="نعمل جنباً إلى جنب مع المدارس الرائدة والجهات التعليمية لتقديم بيئة تعليمية ذكية ومتطورة."
      categoryBadge="شراكات استراتيجية"
      onBackToHome={onBackToHome}
      onNavigateToPage={onNavigateToPage}
    >
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {partnerTypes.map((pt, idx) => (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 flex flex-col justify-between shadow-lg"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Handshake className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-white">{pt.title}</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  {pt.description}
                </p>

                <div className="space-y-2 pt-2">
                  {pt.benefits.map((b, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Join as partner */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-4">
          <h4 className="text-lg font-black text-white">هل ترغب في انضمام مدرستك إلى منظومة EduPortal؟</h4>
          <p className="text-xs text-slate-400 max-w-lg mx-auto font-medium leading-relaxed">
            تواصل مع فريق تطوير الأعمال لعقد جلسة عرض توضيحي (Demo) ومعاينة تجربة المنصة لكادرك التعليمي.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigateToPage?.('contact')}
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md shadow-blue-600/30"
            >
              طلب شراكة أو عرض توضيحي
            </button>
            <button
              onClick={() => onNavigateToPage?.('support')}
              className="py-2.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              تواصل مع الدعم الفني
            </button>
          </div>
        </div>
      </div>
    </PublicPageLayout>
  );
}
