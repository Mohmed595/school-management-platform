import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { PublicPageLayout } from './PublicPageLayout';

interface ContactUsPageProps {
  onBackToHome: () => void;
  onNavigateToPage?: (pageId: string) => void;
}

export function ContactUsPage({ onBackToHome, onNavigateToPage }: ContactUsPageProps) {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <PublicPageLayout
      title="تواصل معنا"
      subtitle="نسعد دائماً بالتواصل معكم واستقبال استفساراتكم وملاحظاتكم وشراكات المدارس الجديدة."
      categoryBadge="نموذج المراسلة المباشرة"
      onBackToHome={onBackToHome}
      onNavigateToPage={onNavigateToPage}
    >
      <div className="max-w-2xl mx-auto">
        {/* Message Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl">
          {submitted ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-black text-white">شكراً لتواصلك معنا!</h4>
              <p className="text-xs text-slate-400 font-medium">
                تم استلام رسالتك بنجاح، وسيقوم فريقنا بالرد عليك عبر البريد الإلكتروني في أقرب وقت.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                إرسال رسالة أخرى
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-black text-white mb-2">أرسل استفسارك</h3>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">الاسم الكامل</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اسمك الكريم"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">الرسالة أو الاستفسار</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب رسالتك أو تفاصيل استفسارك هنا..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-bold resize-none leading-relaxed"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال الرسالة</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </PublicPageLayout>
  );
}
