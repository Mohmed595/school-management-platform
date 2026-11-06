import React from 'react';
import { BookOpen, Calendar, ArrowLeft, Sparkles, User } from 'lucide-react';
import { PublicPageLayout } from './PublicPageLayout';

interface BlogPageProps {
  onBackToHome: () => void;
  onNavigateToPage?: (pageId: string) => void;
}

export function BlogPage({ onBackToHome, onNavigateToPage }: BlogPageProps) {
  const articles = [
    {
      id: '1',
      title: 'أهمية التحفيز السلوكي الإيجابي في تحسين مستوى الطلاب الأكاديمي',
      summary: 'دراسة وتحليل حول أثر رصد السلوك الإيجابي ومنح الأوسمة التقديرية في بناء شخصية الطالب ورفع دافعيته للتعلم.',
      date: '18 سبتمبر 2026',
      author: 'فريق EduPortal التربوي',
      readTime: '4 دقائق قراءة',
      tag: 'تربية وسلوك',
    },
    {
      id: '2',
      title: 'كيف يساهم تطبيق PWA في ربط ولي الأمر بالمدرسة لحظياً؟',
      summary: 'نظرة متعمقة في التكنولوجيا المستخدمة في إشعارات ولي الأمر الفورية وسرعة التصفح دون الحاجة لتنزيل تطبيقات ثقيلة.',
      date: '10 أغسطس 2026',
      author: 'القسم الهندسي',
      readTime: '3 دقائق قراءة',
      tag: 'تكنولوجيا التعليم',
    },
    {
      id: '3',
      title: 'دليل المعلم لإدارة الفصل ورصد الحضور والملاحظات السلوكية بفاعلية',
      summary: 'نصائح عملية للمعلمين لتقليل العبء الإداري، ورصد الانضباط والملاحظات السلوكية الإيجابية والسلبية لحظياً داخل الفصل الدراسي.',
      date: '25 يوليو 2026',
      author: 'مستشار المناهج',
      readTime: '5 دقائق قراءة',
      tag: 'إدارة صفية وانضباط',
    },
  ];

  return (
    <PublicPageLayout
      title="مدونة EduPortal التعليمية"
      subtitle="مقالات، دراسات، وتجارب ملهمة حول التحول الرقمي المدرسي وأحدث الممارسات التربوية الحديثة."
      categoryBadge="المعرفة والابتكار التعليمي"
      onBackToHome={onBackToHome}
      onNavigateToPage={onNavigateToPage}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {articles.map((article) => (
          <div
            key={article.id}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {article.tag}
                </span>
                <span className="text-slate-400">{article.readTime}</span>
              </div>

              <h3 className="text-base font-black text-white leading-snug">
                {article.title}
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                {article.summary}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>{article.author}</span>
              </div>
              <span className="text-[10px] font-mono">{article.date}</span>
            </div>
          </div>
        ))}
      </div>
    </PublicPageLayout>
  );
}
