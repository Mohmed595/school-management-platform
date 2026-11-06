export interface PublishDraft {
  id?: string;
  type: 'announcement' | 'poll' | 'event';
  title: string;
  content: string;
  priority?: 'عاجل جداً' | 'عاجل' | 'هام' | 'عادي' | string;
  targetAudience?: 'الجميع' | 'المعلمين' | 'الطلاب' | 'أولياء الأمور' | string;
  authorName?: string;
  date?: string;
  // Poll fields
  pollOptions?: (string | { id: string; text: string; votesCount?: number })[];
  pollExpiresAt?: string;
  allowMultiple?: boolean;
  // Event fields
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventOrganizer?: string;
  // Status tracking
  isPublished?: boolean;
  publishedAt?: string;
}

/**
 * Normalizes priority value to standard Arabic labels
 */
export function normalizePriority(p?: string): string {
  if (!p) return 'عادي';
  const s = String(p).trim().toLowerCase();
  if (s.includes('عاجل جدا') || s.includes('urgent') || s.includes('critical')) return 'عاجل جداً';
  if (s.includes('عاجل') || s.includes('high')) return 'عاجل';
  if (s.includes('هام') || s.includes('مهم') || s.includes('important')) return 'هام';
  return 'عادي';
}

/**
 * Normalizes target audience
 */
export function normalizeAudience(a?: string): string {
  if (!a) return 'الجميع';
  const s = String(a).trim().toLowerCase();
  if (s.includes('معلم') || s.includes('مدرس') || s.includes('كادر') || s.includes('teacher')) return 'المعلمين';
  if (s.includes('ولي') || s.includes('أولياء') || s.includes('parent')) return 'أولياء الأمور';
  if (s.includes('طالب') || s.includes('طلاب') || s.includes('student')) return 'الطلاب';
  return 'الجميع';
}

/**
 * Extracts a structured PublishDraft (Announcement, Poll, or Event) from the AI response.
 * Supports:
 * 1. Explicit JSON code blocks (```json:publish-draft, ```json:announcement, ```json:ad, ```json)
 * 2. Formatted Markdown text (e.g., text containing title, target audience, and announcement content)
 * Cleans the raw JSON code block from the displayed text so the user gets clean text + interactive UI card.
 */
export function extractPublishDraftFromResponse(
  text: string,
  userQuery?: string
): {
  cleanText: string;
  draft: PublishDraft | null;
} {
  if (!text || typeof text !== 'string') {
    return { cleanText: text || '', draft: null };
  }

  // 1. Check Regex for JSON code blocks: publish-draft, announcement, ad, poll, event, school-action
  const blockRegex = /```(?:json:(?:publish-draft|announcement|ad|poll|event|school-action|action)|json)?\s*\n([\s\S]*?)```/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(text)) !== null) {
    const rawBlock = match[0];
    const content = match[1].trim();

    try {
      const parsed = JSON.parse(content);
      if (!parsed || typeof parsed !== 'object') continue;

      // Check if it's an announcement/ad, poll, or event draft
      const isAnnouncement =
        parsed.type === 'announcement' ||
        parsed.type === 'ad' ||
        parsed.type === 'إعلان' ||
        parsed.type === 'اعلان' ||
        (parsed.title && (parsed.content || parsed.description) && (parsed.targetAudience || parsed.audience || parsed.priority));

      const isPoll =
        parsed.type === 'poll' ||
        parsed.type === 'استطلاع' ||
        (parsed.title && Array.isArray(parsed.pollOptions || parsed.options));

      const isEvent =
        parsed.type === 'event' ||
        parsed.type === 'فعالية' ||
        parsed.type === 'حدث' ||
        (parsed.title && (parsed.eventDate || parsed.date) && (parsed.eventTime || parsed.time || parsed.location));

      if (isAnnouncement || isPoll || isEvent) {
        const detectedType: 'announcement' | 'poll' | 'event' = isPoll ? 'poll' : isEvent ? 'event' : 'announcement';

        let formattedOptions: { id: string; text: string; votesCount: number }[] = [];
        const rawOptions = parsed.pollOptions || parsed.options;
        if (Array.isArray(rawOptions)) {
          formattedOptions = rawOptions.map((opt: any, idx: number) => {
            if (typeof opt === 'string') {
              return { id: `opt-${idx + 1}`, text: opt, votesCount: 0 };
            }
            return {
              id: opt.id || `opt-${idx + 1}`,
              text: opt.text || opt.title || `خيار ${idx + 1}`,
              votesCount: opt.votesCount || 0,
            };
          });
        }

        const draft: PublishDraft = {
          id: parsed.id || `draft-${Date.now()}`,
          type: detectedType,
          title: parsed.title || 'إعلان مدرسي رسمي',
          content: parsed.content || parsed.description || parsed.details || '',
          priority: normalizePriority(parsed.priority || parsed.importance),
          targetAudience: normalizeAudience(parsed.targetAudience || parsed.audience || parsed.whoIsSendTo || parsed.target),
          authorName: parsed.authorName || parsed.author || 'إدارة المدرسة',
          date: parsed.date || parsed.publishDate || new Date().toISOString().split('T')[0],
          pollOptions: formattedOptions,
          pollExpiresAt: parsed.pollExpiresAt || parsed.expiresAt,
          allowMultiple: Boolean(parsed.allowMultiple),
          eventDate: parsed.eventDate || parsed.date,
          eventTime: parsed.eventTime || parsed.time,
          eventLocation: parsed.eventLocation || parsed.location,
          eventOrganizer: parsed.eventOrganizer || parsed.organizer || 'إدارة المدرسة',
          isPublished: false,
        };

        const cleanText = text.replace(rawBlock, '').trim();
        return { cleanText, draft };
      }
    } catch (e) {
      // Continue to next code block if JSON parsing fails
    }
  }

  // 2. Intent detection based on user query and response content
  const qLower = (userQuery || '').toLowerCase();
  const tLower = (text || '').toLowerCase();

  const isExplicitAnnouncement =
    qLower.includes('اعلان') ||
    qLower.includes('إعلان') ||
    qLower.includes('تعميم') ||
    qLower.includes('نشر اعلان') ||
    qLower.includes('نشر إعلان') ||
    qLower.includes('اضيف اعلان') ||
    qLower.includes('أضيف إعلان') ||
    qLower.includes('اضافه اعلان') ||
    qLower.includes('إضافة إعلان') ||
    qLower.includes('تجهيزات') ||
    qLower.includes('حثهم') ||
    tLower.includes('نص الإعلان') ||
    tLower.includes('عنوان الإعلان') ||
    tLower.includes('تعميم إداري:');

  const isExplicitPoll =
    !isExplicitAnnouncement &&
    (qLower.includes('poll') ||
      qLower.includes('استطلاع') ||
      qLower.includes('استبيان') ||
      qLower.includes('تصويت') ||
      qLower.includes('سؤال تصويت') ||
      qLower.includes('موافق او غير موافق') ||
      qLower.includes('موافق أو غير موافق') ||
      tLower.includes('### استطلاع رأي') ||
      tLower.includes('سؤال الاستطلاع'));

  const isExplicitEvent =
    !isExplicitAnnouncement &&
    !isExplicitPoll &&
    (qLower.includes('event') ||
      qLower.includes('فعالية') ||
      qLower.includes('حدث') ||
      qLower.includes('نشاط مدرسي') ||
      qLower.includes('جدولة فعالية') ||
      tLower.includes('### فعالية بالتقويم'));

  // 2.1 Announcements Parser
  if (isExplicitAnnouncement) {
    // Extract title
    let extractedTitle = '';
    const titleMatch =
      text.match(/(?:الموضوع|العنوان|عنوان الإعلان|عنوان التعميم)\s*[:：]\s*(?:\*\*)?([^\n\*]+)/i) ||
      text.match(/###\s*(?:أولاً:\s*)?(?:نص\s*)?(?:ال)?(?:إعلان|تعميم)[^\n]*\n+(?:\*\*)?([^\n\*]+)/i) ||
      text.match(/\*\*(تعميم إداري[^\*]+|\bإعلان هام[^\*]+)\*\*/i);

    if (titleMatch && titleMatch[1]) {
      extractedTitle = titleMatch[1].replace(/^[#\*\s:]+|[#\*\s:]+$/g, '').trim();
    } else if (qLower.includes('امتحان') || qLower.includes('نصف العام') || tLower.includes('امتحان')) {
      extractedTitle = 'تعميم إداري: الاستعداد والتجهيز الشامل لاختبارات منتصف العام الدراسي';
    } else {
      extractedTitle = 'إعلان وتوجيه إداري رسمي للمدرسة';
    }

    // Determine target audience
    let audience = 'الجميع';
    if (qLower.includes('معلم') || qLower.includes('مدرس') || qLower.includes('كادر') || tLower.includes('المعلمين') || tLower.includes('المدرسين')) {
      audience = 'المعلمين';
    } else if (qLower.includes('ولي') || qLower.includes('أولياء') || tLower.includes('أولياء الأمور')) {
      audience = 'أولياء الأمور';
    } else if (qLower.includes('طالب') || qLower.includes('طلاب') || tLower.includes('الطلاب')) {
      audience = 'الطلاب';
    }

    // Extract content/body
    let extractedContent = '';
    const bodyMatch = text.match(/(?:الزملاء|السادة|أبنائي|إلى كافة|تحية طيبة|حرصاً من إدارة)([\s\S]+?)(?=(?:---|### ثانياً|نصيحة إضافية|\*\*إدارة المدرسة|\n\s*\n\s*هل ترغب|$))/i);
    if (bodyMatch) {
      extractedContent = (bodyMatch[0] || '').trim();
    } else {
      // Grab clean paragraphs
      const paragraphs = text
        .split('\n')
        .filter((l) => !l.startsWith('#') && !l.includes('مستشارك') && !l.includes('أحييك'))
        .join('\n')
        .trim();
      extractedContent = paragraphs.slice(0, 600);
    }

    if (!extractedContent || extractedContent.length < 20) {
      extractedContent = 'نهيب بكافة الزملاء المعلمين والمعلمات الكرام بضرورة الاستعداد التام والتجهيز الشامل لاختبارات منتصف العام الدراسي، متمنين للجميع التوفيق والنجاح.';
    }

    const draft: PublishDraft = {
      id: `draft-ann-${Date.now()}`,
      type: 'announcement',
      title: extractedTitle,
      content: extractedContent,
      priority: qLower.includes('عاجل') || tLower.includes('عاجل') ? 'عاجل' : 'هام',
      targetAudience: audience,
      authorName: 'إدارة المدرسة',
      date: new Date().toISOString().split('T')[0],
      isPublished: false,
    };

    return { cleanText: text, draft };
  }

  // 2.2 Polls Parser
  if (isExplicitPoll) {
    let audience = 'الجميع (المعلمين والطلاب)';
    if (qLower.includes('معلم') || qLower.includes('مدرس') || qLower.includes('كادر')) {
      audience = 'المعلمين';
    } else if (qLower.includes('طالب') || qLower.includes('طلاب')) {
      audience = 'الطلاب';
    } else if (qLower.includes('ولي') || qLower.includes('أولياء')) {
      audience = 'أولياء الأمور';
    }

    let pollTitle = 'استطلاع رأي تفاعلي للمدرسة';
    if (qLower.includes('رحله') || qLower.includes('رحلة') || qLower.includes('اهرامات') || qLower.includes('أهرامات')) {
      pollTitle = 'استطلاع رأي: تنظيم الرحلة المدرسية للأهرامات غداً';
    } else if (qLower.includes('اجتماع')) {
      pollTitle = 'استطلاع رأي: تحديد الموعد الأنسب للاجتماع القادم';
    }

    let extractedOptions: { id: string; text: string; votesCount: number }[] = [];
    if (qLower.includes('موافق') && qLower.includes('غير موافق')) {
      extractedOptions = [
        { id: 'opt-1', text: 'موافق', votesCount: 0 },
        { id: 'opt-2', text: 'غير موافق', votesCount: 0 },
      ];
    } else if (qLower.includes('نعم') && qLower.includes('لا')) {
      extractedOptions = [
        { id: 'opt-1', text: 'نعم', votesCount: 0 },
        { id: 'opt-2', text: 'لا', votesCount: 0 },
      ];
    } else {
      const optionMatches = text.match(/(?:(?:[1-4]\.|\*|-|•)\s*(?:الخيار\s*\d+\s*[:：]?\s*)?([^\n]+))/g);
      if (optionMatches && optionMatches.length >= 2) {
        extractedOptions = optionMatches.slice(0, 4).map((opt, idx) => ({
          id: `opt-${idx + 1}`,
          text: opt.replace(/^([1-4]\.|\*|-|•)\s*(?:الخيار\s*\d+\s*[:：]?\s*)?/, '').trim(),
          votesCount: 0,
        })),
        { id: 'opt-2', text: 'غير موافق', votesCount: 0 };
      } else {
        extractedOptions = [
          { id: 'opt-1', text: 'موافق', votesCount: 0 },
          { id: 'opt-2', text: 'غير موافق', votesCount: 0 },
        ];
      }
    }

    let pollContent = 'نأمل مشاركتكم والتصويت في هذا الاستطلاع لاختيار القرار الأنسب للمدرسة.';
    if (qLower.includes('رحله') || qLower.includes('رحلة')) {
      pollContent = 'هل توافق على تنظيم رحلة مدرسية إلى أهرامات الجيزة يوم غدٍ؟';
    }

    const draft: PublishDraft = {
      id: `draft-poll-${Date.now()}`,
      type: 'poll',
      title: pollTitle,
      content: pollContent,
      priority: qLower.includes('بكره') || qLower.includes('غدا') || qLower.includes('غداً') || qLower.includes('عاجل') ? 'عاجل' : 'عادي',
      targetAudience: audience,
      pollOptions: extractedOptions,
      authorName: 'إدارة المدرسة',
      date: new Date().toISOString().split('T')[0],
      isPublished: false,
    };

    return { cleanText: text, draft };
  }

  // 2.3 Events Parser
  if (isExplicitEvent) {
    let audience = 'الجميع';
    if (qLower.includes('معلم') || qLower.includes('مدرس')) audience = 'المعلمين';
    else if (qLower.includes('طالب') || qLower.includes('طلاب')) audience = 'الطلاب';

    const draft: PublishDraft = {
      id: `draft-evt-${Date.now()}`,
      type: 'event',
      title: qLower.includes('رحله') || qLower.includes('رحلة') ? 'رحلة مدرسية استكشافية' : 'فعالية ونشاط مدرسي بالتقويم',
      content: 'فعالية مدرسية تهدف إلى تعزيز المهارات والأنشطة التربوية لكافة المشاركين.',
      priority: 'هام',
      targetAudience: audience,
      eventDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      eventTime: '10:00 صباحاً',
      eventLocation: qLower.includes('اهرامات') || qLower.includes('أهرامات') ? 'أهرامات الجيزة' : 'القاعة الرئيسية بالمدرسة',
      eventOrganizer: 'إدارة المدرسة',
      authorName: 'إدارة المدرسة',
      date: new Date().toISOString().split('T')[0],
      isPublished: false,
    };

    return { cleanText: text, draft };
  }

  return { cleanText: text, draft: null };
}
