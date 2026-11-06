import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Trash2,
  X,
  Send,
  BarChart2,
  Calendar,
  MapPin,
  Clock,
  User,
  Check,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Vote,
  Sparkles,
} from 'lucide-react';
import { Announcement, AnnouncementType, PollOption, EventRsvp } from '../../../types/admin';
import { votePollAnnouncementApi, rsvpEventAnnouncementApi } from '../../../lib/schoolApi';

interface AdminAnnouncementsViewProps {
  schoolId: string;
  announcements: Announcement[];
  onSaveAnnouncement: (announcement: Announcement) => Promise<void> | void;
  onDeleteAnnouncement: (id: string) => Promise<void> | void;
  onToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export function AdminAnnouncementsView({
  schoolId,
  announcements,
  onSaveAnnouncement,
  onDeleteAnnouncement,
  onToast,
}: AdminAnnouncementsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'general' | 'poll' | 'event'>('all');

  const [annType, setAnnType] = useState<AnnouncementType>('general');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetAudience: 'الجميع (المعلمين والطلاب)' as string,
    priority: 'عادي' as 'عادي' | 'هام' | 'عاجل جداً',
    // Poll fields
    pollExpiresAt: '',
    allowMultiple: false,
    pollOptions: ['', ''],
    // Event fields
    eventDate: '',
    eventTime: '',
    eventLocation: '',
    eventOrganizer: 'إدارة المدرسة',
  });

  const [submittingVoteId, setSubmittingVoteId] = useState<string | null>(null);
  const [submittingRsvpId, setSubmittingRsvpId] = useState<string | null>(null);

  const resetForm = () => {
    setAnnType('general');
    setFormData({
      title: '',
      content: '',
      targetAudience: 'الجميع (المعلمين والطلاب)',
      priority: 'عادي',
      pollExpiresAt: '',
      allowMultiple: false,
      pollOptions: ['موافق', 'غير موافق'],
      eventDate: new Date().toISOString().split('T')[0],
      eventTime: '09:00',
      eventLocation: 'مسرح المدرسة',
      eventOrganizer: 'إدارة المدرسة',
    });
  };

  const handleAddPollOption = () => {
    if (formData.pollOptions.length >= 6) {
      onToast('تنبيه', 'الحد الأقصى لخيارات الاستطلاع هو 6 خيارات', 'info');
      return;
    }
    setFormData({ ...formData, pollOptions: [...formData.pollOptions, ''] });
  };

  const handleRemovePollOption = (index: number) => {
    if (formData.pollOptions.length <= 2) {
      onToast('تنبيه', 'يجب توفير خيارين على الأقل للاستطلاع', 'info');
      return;
    }
    const updated = formData.pollOptions.filter((_, i) => i !== index);
    setFormData({ ...formData, pollOptions: updated });
  };

  const handleOptionTextChange = (index: number, val: string) => {
    const updated = [...formData.pollOptions];
    updated[index] = val;
    setFormData({ ...formData, pollOptions: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      onToast('خطأ بالبيانات', 'يرجى ملء عنوان وتفاصيل الإعلان', 'error');
      return;
    }

    let finalPollOptions: PollOption[] | undefined;
    if (annType === 'poll') {
      const validOptions = formData.pollOptions.map((opt) => opt.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        onToast('خطأ بالاستطلاع', 'يرجى إدخال خيارين على الأقل للاستطلاع', 'error');
        return;
      }
      finalPollOptions = validOptions.map((text, idx) => ({
        id: `opt-${idx + 1}-${Date.now()}`,
        text,
        votesCount: 0,
      }));
    }

    const nowIso = new Date().toISOString();
    const newAnc: Announcement = {
      id: `anc-${schoolId}-${Date.now()}`,
      schoolId,
      type: annType,
      title: formData.title,
      content: formData.content,
      targetAudience: formData.targetAudience,
      priority: formData.priority,
      publishDate: nowIso.split('T')[0],
      createdAt: nowIso,
      updatedAt: nowIso,
      isScheduled: false,
      author: 'إدارة المدرسة',

      ...(annType === 'poll'
        ? {
            pollOptions: finalPollOptions,
            pollVotes: [],
            pollExpiresAt: formData.pollExpiresAt || undefined,
            allowMultiple: formData.allowMultiple,
          }
        : {}),

      ...(annType === 'event'
        ? {
            eventDate: formData.eventDate || undefined,
            eventTime: formData.eventTime || undefined,
            eventLocation: formData.eventLocation || undefined,
            eventOrganizer: formData.eventOrganizer || 'إدارة المدرسة',
            eventRsvps: [],
          }
        : {}),
    };

    setIsSubmitting(true);
    try {
      await onSaveAnnouncement(newAnc);
      setIsModalOpen(false);
      resetForm();
      const typeLabel = annType === 'poll' ? 'استطلاع الرأي' : annType === 'event' ? 'الفعالية' : 'الإعلان';
      onToast(`تم نشر ${typeLabel} بنجاح`, `عنوان: ${formData.title}`, 'success');
    } catch (err: any) {
      onToast('فشل نشر الإعلان', err?.message || 'حدث خطأ أثناء الاتصال بقاعدة البيانات المركزية', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Interactive Poll Voting in Admin View
  const handleVote = async (announcementId: string, optionId: string) => {
    setSubmittingVoteId(announcementId);
    try {
      const updated = await votePollAnnouncementApi(schoolId, announcementId, [optionId]);
      await onSaveAnnouncement(updated);
      onToast('تم تسجيل التصويت', 'تم حفظ الصوت مباشرة في قاعدة البيانات المركزية', 'success');
    } catch (err: any) {
      onToast('فشل التصويت', err?.message || 'تعذر تسجيل التصويت', 'error');
    } finally {
      setSubmittingVoteId(null);
    }
  };

  // Interactive Event RSVP in Admin View
  const handleRsvp = async (announcementId: string, status: 'attending' | 'interested' | 'declined') => {
    setSubmittingRsvpId(announcementId);
    try {
      const updated = await rsvpEventAnnouncementApi(schoolId, announcementId, status);
      await onSaveAnnouncement(updated);
      onToast('تم تحديث حالة المشاركة', 'تمت المزامنة المباشرة مع الخادم', 'success');
    } catch (err: any) {
      onToast('فشل تحديث الحالة', err?.message || 'تعذر حفظ حالة المشاركة', 'error');
    } finally {
      setSubmittingRsvpId(null);
    }
  };

  // Sort announcements so the newest created AD is always at the top
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    // 1. Compare by explicit createdAt date/timestamp if available
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA && timeB && timeA !== timeB) {
      return timeB - timeA;
    }

    // 2. Extract numeric timestamp from ID (e.g. anc-sch-1-1727142820000)
    const matchA = a.id?.match(/(\d{10,14})$/);
    const matchB = b.id?.match(/(\d{10,14})$/);
    if (matchA && matchB) {
      const numA = parseInt(matchA[1], 10);
      const numB = parseInt(matchB[1], 10);
      if (numA !== numB) return numB - numA;
    }

    // 3. Fallback to publishDate / date string
    const dateA = a.publishDate || a.date || '';
    const dateB = b.publishDate || b.date || '';
    if (dateA !== dateB) {
      return dateB.localeCompare(dateA);
    }

    return (b.id || '').localeCompare(a.id || '');
  });

  const filteredAnnouncements = sortedAnnouncements.filter((anc) => {
    if (activeTabFilter === 'all') return true;
    const type = anc.type || 'general';
    return type === activeTabFilter;
  });

  return (
    <div className="space-y-6 dir-rtl font-sans">
      {/* Header Actions & Filter Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <span>مركز الإعلانات والفعاليات واستطلاعات الرأي</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            نشر التعاميم العامة، تنظيم الفعاليات مع تأكيد الحضور، وإنشاء استطلاعات رأي تفاعلية مباشرة
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Tabs Filter */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold text-slate-600">
            <button
              onClick={() => setActiveTabFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTabFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              الكل ({announcements.length})
            </button>
            <button
              onClick={() => setActiveTabFilter('general')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTabFilter === 'general' ? 'bg-white text-blue-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              إعلانات
            </button>
            <button
              onClick={() => setActiveTabFilter('poll')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTabFilter === 'poll' ? 'bg-white text-purple-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              استطلاعات
            </button>
            <button
              onClick={() => setActiveTabFilter('event')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTabFilter === 'event' ? 'bg-white text-emerald-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              فعاليات
            </button>
          </div>

          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء نشر جديد</span>
          </button>
        </div>
      </div>

      {/* Announcements Grid Stream */}
      {filteredAnnouncements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-bold text-sm text-slate-700">لا توجد منشورات بهذه الفئة</h4>
          <p className="text-xs text-slate-400">اضغط على "إنشاء نشر جديد" لبدء إضافة إعلان أو استطلاع أو فعالية مدرسية.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredAnnouncements.map((anc) => {
            const type = anc.type || 'general';
            const isPoll = type === 'poll';
            const isEvent = type === 'event';

            // Poll stats calculation
            const pollVotes = anc.pollVotes || [];
            const pollOptions = anc.pollOptions || [];
            const totalVotes = pollVotes.length;

            // Event stats calculation
            const eventRsvps = anc.eventRsvps || [];
            const attendingCount = eventRsvps.filter((r) => r.status === 'attending').length;
            const interestedCount = eventRsvps.filter((r) => r.status === 'interested').length;
            const declinedCount = eventRsvps.filter((r) => r.status === 'declined').length;

            return (
              <div
                key={anc.id}
                className={`bg-white rounded-2xl border shadow-2xs p-5 space-y-4 flex flex-col justify-between transition-all ${
                  isPoll
                    ? 'border-purple-200/90 hover:border-purple-300 bg-purple-50/10'
                    : isEvent
                    ? 'border-emerald-200/90 hover:border-emerald-300 bg-emerald-50/10'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Metadata & Type Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-3 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          isPoll
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : isEvent
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : anc.priority === 'عاجل جداً'
                            ? 'bg-red-100 text-red-700'
                            : anc.priority === 'هام'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isPoll && <BarChart2 className="w-3 h-3" />}
                        {isEvent && <Calendar className="w-3 h-3" />}
                        {!isPoll && !isEvent && <Megaphone className="w-3 h-3" />}
                        <span>{isPoll ? 'استطلاع رأي' : isEvent ? 'فعالية / حدث' : 'إعلان عام'}</span>
                      </span>

                      {anc.priority && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {anc.priority}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">{anc.publishDate}</span>
                  </div>

                  {/* Title & Description */}
                  <h4 className="font-extrabold text-base text-slate-900 leading-snug">{anc.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{anc.content}</p>

                  {/* ----------------- POLL BODY ----------------- */}
                  {isPoll && (
                    <div className="mt-3 bg-slate-50/80 border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5">
                      <div className="space-y-2">
                        {pollOptions.map((opt) => {
                          const votes = opt.votesCount || 0;
                          const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleVote(anc.id, opt.id)}
                              disabled={submittingVoteId === anc.id}
                              className={`group/pollOpt relative w-full overflow-hidden rounded-xl border text-right transition-all cursor-pointer p-3 flex items-center justify-between ${
                                submittingVoteId === anc.id
                                  ? 'opacity-70 cursor-wait border-slate-200'
                                  : 'border-slate-200/90 hover:border-purple-400 hover:shadow-2xs bg-white'
                              }`}
                            >
                              {/* Background Percentage Progress Fill */}
                              <div
                                className="absolute inset-y-0 right-0 bg-purple-100/90 group-hover/pollOpt:bg-purple-200/80 transition-all duration-500 rounded-xl"
                                style={{ width: `${percentage}%` }}
                              />

                              {/* Option Label & Circle */}
                              <div className="relative z-10 flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-4 h-4 rounded-full border-2 border-purple-300 group-hover/pollOpt:border-purple-600 flex items-center justify-center shrink-0 bg-white">
                                  <div className="w-2 h-2 rounded-full bg-purple-600 opacity-0 group-hover/pollOpt:opacity-100 transition-opacity" />
                                </div>
                                <span className="font-bold text-xs sm:text-sm text-slate-800 group-hover/pollOpt:text-purple-950 truncate">
                                  {opt.text}
                                </span>
                              </div>

                              {/* Right side percentage badge */}
                              <div className="relative z-10 text-xs font-extrabold text-purple-700 font-mono shrink-0 pr-2">
                                {percentage}%
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 pt-1 px-1">
                        <span className="flex items-center gap-1 font-semibold text-purple-900">
                          <Vote className="w-3.5 h-3.5 text-purple-600" />
                          <span>إجمالي الأصوات: {totalVotes}</span>
                        </span>
                        {anc.pollExpiresAt && <span>ينتهي: {anc.pollExpiresAt}</span>}
                      </div>
                    </div>
                  )}

                  {/* ----------------- EVENT BODY ----------------- */}
                  {isEvent && (
                    <div className="mt-3 bg-emerald-50/50 border border-emerald-200/70 rounded-2xl p-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold text-slate-700">
                        {anc.eventDate && (
                          <div className="flex items-center gap-1.5 bg-white p-2.5 rounded-xl border border-emerald-100/80 shadow-2xs">
                            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>التاريخ: <strong className="text-slate-900">{anc.eventDate}</strong></span>
                          </div>
                        )}
                        {anc.eventTime && (
                          <div className="flex items-center gap-1.5 bg-white p-2.5 rounded-xl border border-emerald-100/80 shadow-2xs">
                            <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>الوقت: <strong className="text-slate-900">{anc.eventTime}</strong></span>
                          </div>
                        )}
                        {anc.eventLocation && (
                          <div className="flex items-center gap-1.5 bg-white p-2.5 rounded-xl border border-emerald-100/80 shadow-2xs">
                            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>الموقع: <strong className="text-slate-900">{anc.eventLocation}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    الموجه إلى: <strong className="text-slate-700">{anc.targetAudience}</strong>
                  </span>

                  <button
                    onClick={() => {
                      if (confirm('هل أنت تأكد من رغبتك في حذف هذا المنشور نهائياً من قاعدة البيانات؟')) {
                        onDeleteAnnouncement(anc.id);
                        onToast('تم حذف المنشور', '', 'info');
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="حذف المنشور"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Announcement / Poll / Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">إضافة منشور جديد في المدرسة</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type Selector Tabs */}
            <div className="bg-slate-100 p-1 rounded-2xl grid grid-cols-3 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAnnType('general')}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  annType === 'general' ? 'bg-white text-blue-700 shadow-2xs font-black' : 'text-slate-600'
                }`}
              >
                <Megaphone className="w-4 h-4" />
                <span>إعلان عام</span>
              </button>
              <button
                type="button"
                onClick={() => setAnnType('poll')}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  annType === 'poll' ? 'bg-white text-purple-700 shadow-2xs font-black' : 'text-slate-600'
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                <span>استطلاع رأي</span>
              </button>
              <button
                type="button"
                onClick={() => setAnnType('event')}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  annType === 'event' ? 'bg-white text-emerald-700 shadow-2xs font-black' : 'text-slate-600'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>فعالية / حدث</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {annType === 'poll'
                    ? 'عنوان استطلاع الرأي *'
                    : annType === 'event'
                    ? 'اسم الفعالية أو المناسبة *'
                    : 'عنوان الإعلان *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={
                    annType === 'poll'
                      ? 'مثال: ما هو الموعد المفضل لرحلة نهاية الفصل الدراسي؟'
                      : annType === 'event'
                      ? 'مثال: المعرض العلمي والابتكاري السنوي'
                      : 'مثال: جدول اختبارات منتصف العام الدراسي'
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المستهدفون بالنشر</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer font-semibold"
                  >
                    <option value="الجميع (المعلمين والطلاب)">الجميع (المعلمين والطلاب)</option>
                    <option value="المعلمين فقط">المعلمين فقط</option>
                    <option value="الطلاب فقط">الطلاب فقط</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">درجة الأهمية</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer font-semibold"
                  >
                    <option value="عادي">عادي</option>
                    <option value="هام">هام</option>
                    <option value="عاجل جداً">عاجل جداً</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {annType === 'poll'
                    ? 'وصف الاستطلاع وتفاصيله *'
                    : annType === 'event'
                    ? 'تفاصيل وبرنامج الفعالية *'
                    : 'محتوى ونص الإعلان *'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="اكتب التوضيحات والتفاصيل الكاملة للمستهدفين..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium text-slate-900"
                />
              </div>

              {/* ------------ DYNAMIC POLL FIELDS ------------ */}
              {annType === 'poll' && (
                <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-purple-900 flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-purple-600" />
                      <span>خيارات الاستطلاع والتصويت</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>إضافة خيار</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formData.pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-purple-700 font-bold w-5 text-center">{idx + 1}.</span>
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                          placeholder={`الخيار رقم ${idx + 1}`}
                          className="flex-1 px-3 py-1.5 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                        />
                        {formData.pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePollOption(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-purple-200/60 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-purple-900 mb-1">تاريخ انتهاء الاستطلاع</label>
                      <input
                        type="date"
                        value={formData.pollExpiresAt}
                        onChange={(e) => setFormData({ ...formData, pollExpiresAt: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-5">
                      <input
                        type="checkbox"
                        id="allowMultiple"
                        checked={formData.allowMultiple}
                        onChange={(e) => setFormData({ ...formData, allowMultiple: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                      />
                      <label htmlFor="allowMultiple" className="font-bold text-purple-900 cursor-pointer">
                        السماح باختيار أكثر من خيار
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------ DYNAMIC EVENT FIELDS ------------ */}
              {annType === 'event' && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3">
                  <span className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>بيانات موعد ومكان الفعالية</span>
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-emerald-900 mb-1">تاريخ الفعالية *</label>
                      <input
                        type="date"
                        required
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-emerald-900 mb-1">وقت الفعالية *</label>
                      <input
                        type="time"
                        required
                        value={formData.eventTime}
                        onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-emerald-900 mb-1">المكان / القاعة *</label>
                      <input
                        type="text"
                        required
                        value={formData.eventLocation}
                        onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
                        placeholder="مسرح المدرسة الرئيسي"
                        className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-emerald-900 mb-1">الجهة المنظمة</label>
                      <input
                        type="text"
                        value={formData.eventOrganizer}
                        onChange={(e) => setFormData({ ...formData, eventOrganizer: e.target.value })}
                        placeholder="إدارة النشاط المطبقي"
                        className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isSubmitting
                      ? 'جاري الحفظ بالسيرفر...'
                      : annType === 'poll'
                      ? 'نشر الاستطلاع'
                      : annType === 'event'
                      ? 'نشر الفعالية'
                      : 'نشر الإعلان'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

