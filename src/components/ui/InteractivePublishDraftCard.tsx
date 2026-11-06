import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Megaphone,
  BarChart2,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  HelpCircle,
  Loader2,
  ShieldCheck,
  Send,
  XCircle,
  Sparkles,
  Tag,
} from 'lucide-react';
import { PublishDraft } from '../../lib/publishDraft';
import { saveAnnouncementApi } from '../../lib/schoolApi';
import { saveAnnouncement } from '../../lib/adminStorage';
import { saveCalendarTask } from '../../lib/calendarStorage';

interface InteractivePublishDraftCardProps {
  draft: PublishDraft;
  schoolId?: string;
  onPublished?: (publishedDraft: PublishDraft) => void;
}

export function InteractivePublishDraftCard({
  draft,
  schoolId = 'sch-1',
  onPublished,
}: InteractivePublishDraftCardProps) {
  const [isPublished, setIsPublished] = useState(Boolean(draft.isPublished));
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(draft.publishedAt || null);

  const isPoll = draft.type === 'poll';
  const isEvent = draft.type === 'event';
  const isAnnouncement = !isPoll && !isEvent;

  const priorityColor =
    draft.priority === 'عاجل جداً' || draft.priority === 'عاجل'
      ? 'bg-rose-100 text-rose-800 border-rose-200 font-bold'
      : draft.priority === 'هام'
      ? 'bg-amber-100 text-amber-900 border-amber-200 font-bold'
      : 'bg-blue-100 text-blue-800 border-blue-200';

  const audienceLabel = draft.targetAudience || 'الجميع';
  const audienceIcon =
    audienceLabel.includes('معلم') || audienceLabel.includes('مدرس')
      ? '👨‍🏫'
      : audienceLabel.includes('ولي') || audienceLabel.includes('أولياء')
      ? '👨‍👩‍👧‍👦'
      : audienceLabel.includes('طالب') || audienceLabel.includes('طلاب')
      ? '🎓'
      : '🌐';

  const handleConfirmPublish = async () => {
    setIsSubmitting(true);
    setPublishError(null);

    try {
      const payload: any = {
        id: draft.id || `ann-${schoolId}-${Date.now()}`,
        schoolId,
        type: draft.type === 'poll' ? 'poll' : draft.type === 'event' ? 'event' : 'general',
        title: draft.title,
        content: draft.content,
        targetAudience: draft.targetAudience || 'الجميع',
        author: draft.authorName || 'إدارة المدرسة',
        priority: draft.priority || 'عادي',
        important: draft.priority === 'عاجل جداً' || draft.priority === 'عاجل' || draft.priority === 'هام',
        publishDate: draft.date || new Date().toISOString().split('T')[0],
      };

      if (isPoll && Array.isArray(draft.pollOptions)) {
        payload.pollOptions = draft.pollOptions.map((opt: any, idx: number) => {
          if (typeof opt === 'string') return { id: `opt-${idx + 1}`, text: opt, votesCount: 0 };
          return { id: opt.id || `opt-${idx + 1}`, text: opt.text || `خيار ${idx + 1}`, votesCount: 0 };
        });
        payload.pollExpiresAt = draft.pollExpiresAt;
        payload.allowMultiple = Boolean(draft.allowMultiple);
      }

      if (isEvent) {
        payload.eventDate = draft.eventDate || draft.date;
        payload.eventTime = draft.eventTime || '10:00 صباحاً';
        payload.eventLocation = draft.eventLocation || 'مقر المدرسة';
        payload.eventOrganizer = draft.eventOrganizer || 'إدارة المدرسة';

        // Also save to calendar tasks
        try {
          const taskDate = draft.eventDate || draft.date || new Date().toISOString().split('T')[0];
          await saveCalendarTask({
            id: `task-${Date.now()}`,
            school_id: schoolId,
            schoolId,
            title: draft.title,
            description: draft.content,
            task_date: taskDate,
            date: taskDate,
            priority: (draft.priority === 'عاجل' || draft.priority === 'عاجل جداً' ? 'high' : draft.priority === 'هام' ? 'medium' : 'low'),
            status: 'pending',
            assignedTo: draft.targetAudience || 'الجميع',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } catch (calErr) {
          console.warn('Calendar task sync skipped:', calErr);
        }
      }

      // Save via storage & API
      saveAnnouncement(payload);
      await saveAnnouncementApi(schoolId, payload);

      const timeStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      const nowStr = `${new Date().toISOString().split('T')[0]} الساعة ${timeStr}`;
      setIsPublished(true);
      setPublishedAt(nowStr);
      setShowConfirm(false);

      if (onPublished) {
        onPublished({
          ...draft,
          isPublished: true,
          publishedAt: nowStr,
        });
      }
    } catch (err: any) {
      console.error('Publishing failed:', err);
      setPublishError(err?.message || 'تعذر نشر الإعلان، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. POLLS RENDERER (Matches User Image 2 exact visual style)
  if (isPoll) {
    return (
      <div className="mt-3 overflow-hidden rounded-2xl border border-purple-200/90 bg-white shadow-xs transition-all hover:shadow-md font-['Cairo',sans-serif] text-slate-800 dir-rtl text-right">
        {/* Top Header Row: Date on Left, Badges on Right */}
        <div className="p-4 pb-2 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">{draft.date || new Date().toISOString().split('T')[0]}</span>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${priorityColor}`}>
              {draft.priority || 'عادي'}
            </span>
            <span className="px-3 py-0.5 rounded-xl bg-purple-100 text-purple-700 text-xs font-bold flex items-center gap-1">
              <BarChart2 className="w-3.5 h-3.5" />
              <span>استطلاع رأي</span>
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="px-4 pb-4 space-y-3">
          {/* Title & Description */}
          <div>
            <h4 className="text-lg font-black text-slate-950 leading-tight">{draft.title}</h4>
            {draft.content && (
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{draft.content}</p>
            )}
          </div>

          {/* Options Container (Image 2 exact style) */}
          <div className="bg-purple-50/30 border border-purple-100 rounded-2xl p-3 space-y-2">
            {Array.isArray(draft.pollOptions) && draft.pollOptions.length > 0 ? (
              draft.pollOptions.map((opt: any, idx: number) => {
                const optText = typeof opt === 'string' ? opt : opt.text;
                return (
                  <div
                    key={idx}
                    className="bg-purple-100/50 hover:bg-purple-100 border border-purple-200/80 rounded-2xl px-4 py-3 flex items-center justify-between transition-colors"
                  >
                    <span className="text-xs font-bold text-purple-800">
                      {idx === 0 ? '100%' : '0%'}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold text-slate-900">{optText}</span>
                      <div className="w-5 h-5 rounded-full border-2 border-purple-400 flex items-center justify-center bg-white">
                        {idx === 0 && <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-2 text-xs text-purple-600">
                خيارات التصويت: موافق / غير موافق
              </div>
            )}

            <div className="pt-1 flex items-center justify-end text-[11px] font-semibold text-purple-700 gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>إجمالي الأصوات: {isPublished ? 1 : 0}</span>
            </div>
          </div>

          {/* Target Audience Footer Row */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span className="text-[11px] text-slate-400">
              {isPublished ? 'منشور ومعتمد في المدرسة' : 'مسودة استطلاع جاهزة للإطلاق'}
            </span>
            <div className="flex items-center gap-1 text-slate-600 font-medium text-xs">
              <Users className="w-3.5 h-3.5 text-purple-600" />
              <span>الموجه إلى: <strong>{audienceLabel}</strong></span>
            </div>
          </div>

          {/* Publish Error */}
          {publishError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{publishError}</span>
            </div>
          )}

          {/* Action / Confirmation Area */}
          <div className="pt-2 border-t border-slate-100">
            {!isPublished ? (
              <div>
                {!showConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowConfirm(true)}
                    className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs hover:shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <BarChart2 className="w-4 h-4" />
                    <span>إطلاق استطلاع الرأي بالمدرسة</span>
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-purple-50 border border-purple-300 rounded-xl p-3.5 space-y-2.5"
                  >
                    <div className="flex items-start gap-2 text-purple-950">
                      <AlertTriangle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-xs">تأكيد إطلاق الاستطلاع في المدرسة:</h5>
                        <p className="text-xs text-purple-900 mt-0.5 leading-relaxed">
                          هل أنت متأكد من رغبتك في إطلاق هذا الاستطلاع لـ ({draft.targetAudience || 'الجميع'})؟
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleConfirmPublish}
                        className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>جاري الإطلاق...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>نعم (تأكيد النشر)</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setShowConfirm(false)}
                        className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 transition-all cursor-pointer"
                      >
                        لا (إلغاء)
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-emerald-950 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">
                    تم إطلاق استطلاع الرأي بنجاح وإتاحته للتصويت في المنصة!
                  </span>
                </div>
                {publishedAt && <span className="text-[10px] text-emerald-700/80">{publishedAt}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. ANNOUNCEMENTS & EVENTS RENDERER
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/70 shadow-xs transition-all hover:shadow-md font-['Cairo',sans-serif] text-slate-800 dir-rtl text-right">
      {/* Top Banner & Type Indicator */}
      <div
        className={`px-4 py-2.5 flex items-center justify-between border-b ${
          isPublished
            ? 'bg-emerald-500/10 border-emerald-200 text-emerald-950'
            : isAnnouncement
            ? 'bg-blue-500/10 border-blue-200 text-blue-950'
            : 'bg-teal-500/10 border-teal-200 text-teal-950'
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-2xs ${
              isPublished
                ? 'bg-emerald-600'
                : isAnnouncement
                ? 'bg-blue-600'
                : 'bg-teal-600'
            }`}
          >
            {isPublished ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : isAnnouncement ? (
              <Megaphone className="w-4 h-4" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
          </div>
          <div>
            <span className="text-xs font-bold block leading-tight">
              {isPublished
                ? 'تم النشر بنجاح في سجلات المدرسة الرسمية'
                : isAnnouncement
                ? 'مسودة إعلان مدرسي رسمي (جاهزة للنشر)'
                : 'مسودة فعالية بالتقويم المدرسي (جاهزة للجدولة)'}
            </span>
          </div>
        </div>

        {isPublished && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            منشور ومعتمد
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div>
          <div className="text-[11px] font-semibold text-slate-500 mb-0.5 flex items-center gap-1">
            <Tag className="w-3 h-3 text-slate-400" />
            <span>عنوان {isAnnouncement ? 'الإعلان' : 'الفعالية'}:</span>
          </div>
          <h4 className="text-base font-bold text-slate-900 leading-snug">{draft.title}</h4>
        </div>

        {/* Metadata badges row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {/* Priority */}
          <div className={`px-3 py-1.5 rounded-xl border text-xs flex items-center justify-between ${priorityColor}`}>
            <span className="font-semibold text-slate-600">الأولوية:</span>
            <span className="font-bold">{draft.priority || 'عادي'}</span>
          </div>

          {/* Target Audience / Who is it sent to */}
          <div className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/90 text-blue-950 text-xs flex items-center justify-between">
            <span className="font-semibold text-blue-700 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>موجه إلى:</span>
            </span>
            <span className="font-bold">{audienceIcon} {audienceLabel}</span>
          </div>

          {/* Date */}
          <div className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-100/80 text-slate-700 text-xs flex items-center justify-between">
            <span className="font-semibold text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>التاريخ:</span>
            </span>
            <span className="font-medium">{draft.date || new Date().toISOString().split('T')[0]}</span>
          </div>
        </div>

        {/* Description / Content Box */}
        <div>
          <div className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
            <span>نص {isAnnouncement ? 'الإعلان والتوجيه الإداري' : 'الوصف والتفاصيل'}:</span>
          </div>
          <div className="bg-slate-50/95 rounded-xl p-3.5 border border-slate-200/90 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
            {draft.content}
          </div>
        </div>

        {/* Event Details Preview if type === event */}
        {isEvent && (
          <div className="bg-teal-50/50 rounded-xl p-3 border border-teal-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
            {draft.eventDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>الموعد: <strong>{draft.eventDate}</strong></span>
              </div>
            )}
            {draft.eventTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>التوقيت: <strong>{draft.eventTime}</strong></span>
              </div>
            )}
            {draft.eventLocation && (
              <div className="flex items-center gap-1.5 col-span-full">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>المكان: <strong>{draft.eventLocation}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Error message if publishing failed */}
        {publishError && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{publishError}</span>
          </div>
        )}

        {/* Action / Confirmation Area */}
        <div className="pt-2 border-t border-slate-100">
          {!isPublished ? (
            <div>
              {!showConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs hover:shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isAnnouncement ? (
                    <>
                      <Megaphone className="w-4 h-4" />
                      <span>نشر هذا الإعلان في المدرسة</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>جدولة الفعالية بالتقويم المدرسي</span>
                    </>
                  )}
                </button>
              ) : (
                /* Verification Dialog Box with Yes/No */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-amber-50/90 border border-amber-300 rounded-xl p-3.5 space-y-2.5"
                >
                  <div className="flex items-start gap-2 text-amber-950">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-xs">تأكيد النشر والإضافة إلى المدرسة:</h5>
                      <p className="text-xs text-amber-900/90 mt-0.5 leading-relaxed">
                        هل أنت متأكد من رغبتك في إضافة ونشر هذا {isAnnouncement ? 'الإعلان' : 'الحدث'} للمدرسة (الفئة المستهدفة: {draft.targetAudience || 'الجميع'})؟
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleConfirmPublish}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>جاري النشر...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>نعم (تأكيد النشر)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setShowConfirm(false)}
                      className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 transition-all cursor-pointer"
                    >
                      لا (إلغاء)
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            /* Published Success Banner */
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-emerald-950 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">
                  تم نشر {isAnnouncement ? 'الإعلان' : 'الحدث'} بنجاح في سجلات المدرسة الرسمية!
                </span>
              </div>
              {publishedAt && <span className="text-[10px] text-emerald-700/80">{publishedAt}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
