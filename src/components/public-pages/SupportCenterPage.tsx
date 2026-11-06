import React, { useState } from 'react';
import {
  LifeBuoy,
  Send,
  Search,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle,
  Copy,
  Check,
  Phone,
  ShieldAlert,
  Building,
  User,
  Sparkles,
} from 'lucide-react';
import { PublicPageLayout } from './PublicPageLayout';
import { formatArabicNumber } from '../../lib/utils';

interface SupportCenterPageProps {
  onBackToHome: () => void;
  onNavigateToPage?: (pageId: string) => void;
}

type TabType = 'new_ticket' | 'track_ticket';

export function SupportCenterPage({ onBackToHome, onNavigateToPage }: SupportCenterPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('new_ticket');

  // New ticket state
  const [senderName, setSenderName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [category, setCategory] = useState('مشاكل تسجيل الدخول والحسابات');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdTicketInfo, setCreatedTicketInfo] = useState<{ id: string; subject: string } | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Track ticket state
  const [trackTicketId, setTrackTicketId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [trackedTicket, setTrackedTicket] = useState<any | null>(null);

  const ticketCategories = [
    'مشاكل تسجيل الدخول ومطابقة بيانات الطالب',
    'استفسار حول كود الوزارة أو الرقم القومي',
    'الحساب المشترك للطالب وولي الأمر',
    'مشكلة في حفظ الجهاز الموثوق أو تبديل الحسابات',
    'عدم ظهور سجلات الحضور أو الملاحظات السلوكية',
    'مشاكل تقنية لمعلمي المادة أو محضري الغياب',
    'مشاكل كود المدرسة وتراخيص إدارة المدرسة',
    'اقتراحات لتطوير المنصة والميزات',
    'استفسارات عامة ومساعدة أخرى',
  ];

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!senderName.trim() || !contactInfo.trim()) {
      setErrorMessage('يرجى كتابة الاسم ومعلومات التواصل (الهاتف أو البريد)');
      return;
    }

    if (!subject.trim() || !description.trim()) {
      setErrorMessage('يرجى توضيح موضوع التذكرة وشرح المشكلة بالتفصيل');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/support-tickets/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: senderName.trim(),
          contactInfo: contactInfo.trim(),
          schoolName: schoolName.trim() || 'EduPortal الدعم العام',
          category,
          subject: subject.trim(),
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'فشل إرسال التذكرة. يرجى المحاولة لاحقاً');
      }

      setCreatedTicketInfo({
        id: data.ticketId || data.ticket?.id,
        subject: subject.trim(),
      });

      // Clear form
      setSenderName('');
      setContactInfo('');
      setSubject('');
      setDescription('');
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ في الاتصال، تأكد من اتصال الإنترنت وحاول مجدداً');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackTicket = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!trackTicketId.trim()) {
      setSearchError('يرجى إدخال رقم التذكرة للمتابعة');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setTrackedTicket(null);

    try {
      const res = await fetch(`/api/support-tickets/public/track/${encodeURIComponent(trackTicketId.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'لم يتم العثور على تذكرة بهذا الرقم');
      }

      setTrackedTicket(data.ticket);
    } catch (err: any) {
      setSearchError(err.message || 'تعذر جلب التذكرة، يرجى التأكد من الرقم');
    } finally {
      setIsSearching(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'جديدة':
      case 'جديد':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>جديدة (بانتظار المراجعة)</span>
          </span>
        );
      case 'قيد المراجعة':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>قيد المراجعة والمعالجة</span>
          </span>
        );
      case 'تم الرد':
      case 'محلولة':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>تم الرد وتقديم الحل</span>
          </span>
        );
      case 'مغلقة':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-500/20 text-slate-400 border border-slate-500/30 inline-flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>مغلقة</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-700 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <PublicPageLayout
      title="مركز المساعدة والدعم الفني المباشر"
      subtitle="نحن هنا لمساعدتك! يمكنك تقديم تذكرة دعم فني جديدة ومتابعتها في أي وقت دون الحاجة لتسجيل الدخول."
      categoryBadge="دعم فني على مدار الساعة"
      onBackToHome={onBackToHome}
      onNavigateToPage={onNavigateToPage}
    >
      <div className="space-y-8">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl max-w-md mx-auto shadow-inner">
          <button
            onClick={() => setActiveTab('new_ticket')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'new_ticket'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>فتح تذكرة جديدة</span>
          </button>
          <button
            onClick={() => setActiveTab('track_ticket')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'track_ticket'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>متابعة تذكرة سابقة</span>
          </button>
        </div>

        {/* TAB 1: NEW TICKET FORM */}
        {activeTab === 'new_ticket' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl max-w-2xl mx-auto">
            {createdTicketInfo ? (
              <div className="text-center space-y-6 py-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    تم استلام تذكرتك بنجاح!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
                    تم إدراج طلبك في نظام الدعم الفني، وسيقوم فريق الدعم بمراجعة المشكلة والرد عليك في أقرب وقت.
                  </p>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl inline-flex flex-col sm:flex-row items-center gap-3 max-w-full">
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-slate-500 block">رقم التذكرة الخاص بك للمتابعة:</span>
                    <span className="text-lg font-black font-mono text-blue-400 select-all">
                      {createdTicketInfo.id}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(createdTicketInfo.id)}
                    className="p-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
                  >
                    {copiedId ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-blue-400" />
                        <span>نسخ الرقم</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setTrackTicketId(createdTicketInfo.id);
                      setActiveTab('track_ticket');
                      setCreatedTicketInfo(null);
                    }}
                    className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-blue-600/20"
                  >
                    <Search className="w-4 h-4" />
                    <span>الانتقال لمتابعة حالة التذكرة الآن</span>
                  </button>
                  <button
                    onClick={() => setCreatedTicketInfo(null)}
                    className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                  >
                    فتح تذكرة أخرى
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitTicket} className="space-y-5">
                <div className="border-b border-slate-800 pb-4 mb-2">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <LifeBuoy className="w-5 h-5 text-blue-400" />
                    <span>إرسال طلب دعم فني أو بلاغ</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    لا يتطلب تسجيل الدخول. املأ البيانات التالية وسنتواصل معك لحل المشكلة فوراً.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3.5 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-bold flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      <span>الاسم الكامل <span className="text-rose-400">*</span></span>
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="مثال: أحمد محمد علي"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-bold"
                      required
                    />
                  </div>

                  {/* Contact */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-400" />
                      <span>رقم الهاتف أو البريد <span className="text-rose-400">*</span></span>
                    </label>
                    <input
                      type="text"
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      placeholder="010XXXXXXXX أو user@domain.com"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-bold"
                      required
                    />
                  </div>
                </div>

                {/* School Name & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-blue-400" />
                      <span>اسم المدرسة (اختياري)</span>
                    </label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="مثال: مدرسة المستقبل الابتدائية"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                      <span>تصنيف المشكلة <span className="text-rose-400">*</span></span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-bold cursor-pointer"
                    >
                      {ticketCategories.map((c) => (
                        <option key={c} value={c} className="bg-slate-900 text-white">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300">
                    عنوان الشكوى أو المشكلة <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="ملخص المشكلة في سطر واحد..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-bold"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300">
                    تفاصيل المشكلة والخطوات <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="اشرح المشكلة بالتفصيل مع ذكر اسم الطالب، الرقم القومي، أو كود الوزارة، واسم المدرسة..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-bold leading-relaxed resize-none"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>جاري إرسال التذكرة...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>إرسال التذكرة فوراً</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: TRACK TICKET */}
        {activeTab === 'track_ticket' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl max-w-2xl mx-auto space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-400" />
                <span>الاستعلام عن حالة تذكرة دعم</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                أدخل رقم التذكرة الذي استلمته عند فتح الطلب لمشاهدة حالة المعالجة والردود الرسمية.
              </p>
            </div>

            <form onSubmit={handleTrackTicket} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                <input
                  type="text"
                  value={trackTicketId}
                  onChange={(e) => setTrackTicketId(e.target.value)}
                  placeholder="مثال: TK-PUB-123456"
                  className="w-full pr-10 pl-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
              >
                {isSearching ? <span>جاري البحث...</span> : <span>استعلام</span>}
              </button>
            </form>

            {searchError && (
              <div className="p-3.5 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {trackedTicket && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-5 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div>
                    <span className="text-[11px] font-mono text-blue-400 font-bold block">
                      #{trackedTicket.id}
                    </span>
                    <h4 className="text-base font-black text-white mt-0.5">
                      {trackedTicket.subject}
                    </h4>
                    <span className="text-xs text-slate-400 font-bold block mt-1">
                      التصنيف: {trackedTicket.category} • {trackedTicket.schoolName}
                    </span>
                  </div>
                  <div>{getStatusBadge(trackedTicket.status)}</div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>تاريخ الإنشاء:</span>
                    <span className="font-mono text-slate-300">
                      {new Date(trackedTicket.createdAt).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Replies / History */}
                <div className="space-y-3 pt-2">
                  <h5 className="text-xs font-black text-white flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    <span>سجل الردود والحلول:</span>
                  </h5>

                  {trackedTicket.replies && trackedTicket.replies.length > 0 ? (
                    <div className="space-y-3">
                      {trackedTicket.replies.map((reply: any) => (
                        <div
                          key={reply.id}
                          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-black text-blue-400">
                              {reply.authorName} ({reply.authorRole === 'admin' ? 'إدارة الدعم' : reply.authorRole})
                            </span>
                            <span className="text-slate-500 font-mono">
                              {new Date(reply.createdAt).toLocaleDateString('ar-EG')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed font-medium">
                            {reply.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center text-xs text-slate-400 font-medium">
                      التذكرة قيد الفحص من قبل مسؤولي النظام، سيتم إدراج الرد هنا فور المعالجة.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PublicPageLayout>
  );
}
