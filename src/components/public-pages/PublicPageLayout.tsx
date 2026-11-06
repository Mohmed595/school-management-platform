import React from 'react';
import { ArrowRight, GraduationCap, ShieldCheck, Mail, Headphones } from 'lucide-react';

interface PublicPageLayoutProps {
  title: string;
  subtitle?: string;
  categoryBadge?: string;
  onBackToHome: () => void;
  onNavigateToPage?: (pageId: string) => void;
  children: React.ReactNode;
}

export function PublicPageLayout({
  title,
  subtitle,
  categoryBadge,
  onBackToHome,
  onNavigateToPage,
  children,
}: PublicPageLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Cairo',sans-serif] dir-rtl flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Header Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-2 text-xs font-black shadow-xs active:scale-95"
              title="العودة للصفحة الرئيسية"
            >
              <ArrowRight className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">العودة للرئيسية</span>
            </button>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <div
              onClick={onBackToHome}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-black text-base text-white tracking-tight">EduPortal</span>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center gap-2 text-xs font-bold">
            {onNavigateToPage && (
              <div className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-2xl">
                <button
                  onClick={() => onNavigateToPage('support')}
                  className="px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Headphones className="w-3.5 h-3.5 text-blue-400" />
                  <span>الدعم الفني</span>
                </button>
                <button
                  onClick={() => onNavigateToPage('faq')}
                  className="px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  الأسئلة الشائعة
                </button>
                <button
                  onClick={() => onNavigateToPage('about')}
                  className="px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  عن الشركة
                </button>
                <button
                  onClick={() => onNavigateToPage('changelog')}
                  className="px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  التحديثات
                </button>
              </div>
            )}

            <button
              onClick={onBackToHome}
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-600/25 transition-all cursor-pointer active:scale-95"
            >
              دخول النظام
            </button>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900/60 to-slate-950 py-12 sm:py-16 border-b border-slate-800/60">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10 space-y-4">
          {categoryBadge && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{categoryBadge}</span>
            </span>
          )}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </section>

      {/* Main Content Body */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800/80 py-8 text-xs text-slate-400 font-bold mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-500" />
            <span className="text-white font-extrabold">EduPortal</span>
            <span className="text-slate-600">|</span>
            <span>جميع الحقوق محفوظة © 2026</span>
          </div>

          {onNavigateToPage && (
            <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400 text-[11px]">
              <button
                onClick={() => onNavigateToPage('support')}
                className="hover:text-blue-400 transition-colors cursor-pointer"
              >
                الدعم الفني
              </button>
              <button
                onClick={() => onNavigateToPage('privacy')}
                className="hover:text-blue-400 transition-colors cursor-pointer"
              >
                سياسة الخصوصية
              </button>
              <button
                onClick={() => onNavigateToPage('terms')}
                className="hover:text-blue-400 transition-colors cursor-pointer"
              >
                الشروط والأحكام
              </button>
              <button
                onClick={() => onNavigateToPage('about')}
                className="hover:text-blue-400 transition-colors cursor-pointer"
              >
                عن الشركة
              </button>
              <button
                onClick={() => onNavigateToPage('faq')}
                className="hover:text-blue-400 transition-colors cursor-pointer"
              >
                الأسئلة الشائعة
              </button>
              <button
                onClick={() => onNavigateToPage('changelog')}
                className="hover:text-blue-400 transition-colors cursor-pointer"
              >
                سجل التحديثات
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
