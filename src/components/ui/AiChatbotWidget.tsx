import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from './Skeleton';
import { getStoredSession } from '../../lib/storage';
import {
  downloadExcelAttachment,
  extractExcelFromResponse,
  ExcelAttachment,
} from '../../lib/excelGenerator';
import {
  PublishDraft,
  extractPublishDraftFromResponse,
} from '../../lib/publishDraft';
import { InteractivePublishDraftCard } from './InteractivePublishDraftCard';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Trash2,
  Minimize2,
  Maximize2,
  ShieldCheck,
  Building2,
  BarChart3,
  RefreshCw,
  Info,
  FileSpreadsheet,
  Download,
  Table,
  Check,
  Eye,
  ChevronDown,
  ChevronUp,
  Copy,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  attachment?: ExcelAttachment;
  publishDraft?: PublishDraft;
}

interface ExcelAttachmentCardProps {
  attachment: ExcelAttachment;
}

function ExcelAttachmentCard({ attachment }: ExcelAttachmentCardProps) {
  const [downloaded, setDownloaded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleDownload = () => {
    try {
      downloadExcelAttachment(attachment);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  const rowCount = attachment.rows?.length || 0;
  const colCount = attachment.columns?.length || 0;

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-emerald-300/90 bg-emerald-50/80 p-3 sm:p-4 text-slate-800 shadow-xs transition-all hover:border-emerald-400">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* File info */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm sm:text-base text-slate-900 truncate">
                {attachment.fileName || 'بيانات_مدرستي.xlsx'}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-700 text-white uppercase tracking-wider">
                XLSX
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-2">
              <span>{rowCount} سجل</span>
              <span>•</span>
              <span>{colCount} أعمدة</span>
              {attachment.sheetName && (
                <>
                  <span>•</span>
                  <span>ورقة: {attachment.sheetName}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {rowCount > 0 && (
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors cursor-pointer border border-emerald-300/80"
              title="معاينة محتويات الجدول"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showPreview ? 'إخفاء' : 'معاينة'}</span>
              {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            type="button"
            onClick={handleDownload}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer ${
              downloaded
                ? 'bg-emerald-800 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md active:scale-95'
            }`}
          >
            {downloaded ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>{downloaded ? 'تم التحميل!' : 'تحميل Excel (.xlsx)'}</span>
          </button>
        </div>
      </div>

      {/* Embedded Table Preview (collapsible) */}
      {showPreview && (
        <div className="mt-3 pt-3 border-t border-emerald-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <Table className="w-3.5 h-3.5 text-emerald-700" />
              معاينة سريعة للجدول:
            </span>
            <span className="text-[11px] text-slate-500">
              تنسيق رسمي باللغة العربية (RTL)
            </span>
          </div>

          <div className="overflow-x-auto max-h-56 rounded-xl border border-emerald-200 bg-white shadow-inner">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="bg-emerald-100/80 text-emerald-950 border-b border-emerald-200 font-bold sticky top-0">
                  {attachment.columns.map((col, idx) => (
                    <th key={idx} className="p-2 px-3 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {attachment.rows.slice(0, 15).map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-2 px-3 whitespace-nowrap">
                        {cell === null || cell === undefined ? '-' : String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {attachment.rows.length > 15 && (
            <p className="text-[10px] text-slate-500 mt-1.5 text-center">
              تم عرض أول 15 صفاً من أصل {attachment.rows.length} صفاً في المعاينة. قم بتحميل الملف للاطلاع على السجل الكامل.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const normalizeStoredMessages = (list: any[]): ChatMessage[] => {
  if (!Array.isArray(list)) return [];
  return list.map((m) => {
    let updated = { ...m };
    if (updated && !updated.attachment && updated.sender === 'bot' && typeof updated.text === 'string' && updated.text.includes('excel-export')) {
      const { cleanText, attachment } = extractExcelFromResponse(updated.text);
      if (attachment) {
        updated.text = cleanText;
        updated.attachment = attachment;
      }
    }
    if (updated && !updated.publishDraft && updated.sender === 'bot' && typeof updated.text === 'string' && (updated.text.includes('publish-draft') || updated.text.includes('announcement') || updated.text.includes('تعميم'))) {
      const { cleanText, draft } = extractPublishDraftFromResponse(updated.text);
      if (draft) {
        updated.text = cleanText;
        updated.publishDraft = draft;
      }
    }
    return updated;
  });
};

interface AiChatbotWidgetProps {
  role: 'admin' | 'owner';
  title: string;
  subtitle: string;
  badgeText: string;
  contextData: any;
  quickPrompts: string[];
  themeColor?: 'blue' | 'indigo' | 'emerald';
  embedded?: boolean;
}

export function AiChatbotWidget({
  role,
  title,
  subtitle,
  badgeText,
  contextData,
  quickPrompts,
  themeColor = 'blue',
  embedded = true,
}: AiChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const activeSchoolId = contextData?.schoolId || getStoredSession()?.schoolId || 'sch-1';
  const storageKey =
    role === 'admin'
      ? `ai_chat_history_admin_${contextData?.schoolName || contextData?.schoolId || 'default'}`
      : `ai_chat_history_owner`;

  const getWelcomeMessage = (): ChatMessage[] => {
    const welcomeMsg =
      role === 'admin'
        ? `أهلاً بك يا سيادة المدير في **المستشار الإداري والتربوي الذكي**! 🏫🌟\n\nأنا لست مجرد أداة لسرد أرقام أو نسخ الجداول، بل شريكك الاستراتيجي ومستشارك المبدع لمساعدتك في قيادة مدرستك بأعلى درجات الكفاءة والتميز:\n• 📊 **تحليل عميق لما وراء المؤشرات** (حضور وغياب، لوحة الشرف، نبض المجتمع، والسلوك).\n• 💡 **نصائح وتوصيات إبداعية وعملية** لتطوير البيئة المدرسية وحل التحديات اليومية بذكاء.\n• 🎯 **مبادرات استباقية** لتحفيز المعلمين والطلاب وتوثيق الشراكة مع أولياء الأمور.\n\nتفضل بطرح أي استفسار أو اختر موضوعاً من المقترحات أدناه، وسأقدم لك رؤية إدارية ثرية وحلولاً مبتكرة!`
        : `يا مرحباً بك يا مالك المنظومة! 👋\n\nأنا مستشارك الذكي السريع لمتابعة جميع المدارس والتراخيص والاشتراكات. أسلوبي مبسط ومباشر لمساعدتك في اتخاذ القرارات الماليّة والتنظيمية بسرعة!\n\n*ملاحظة: البيانات للعرض والتحليل المباشر فقط دون تعديل.*`;
    return [
      {
        id: 'msg-welcome',
        sender: 'bot',
        text: welcomeMsg,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return normalizeStoredMessages(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load chat history from storage', e);
    }
    return getWelcomeMessage();
  });

  // Sync state if storageKey changes (e.g. switching school or role)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(normalizeStoredMessages(parsed));
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load chat history from storage', e);
    }
    setMessages(getWelcomeMessage());
  }, [storageKey]);

  // Persist messages whenever they change
  useEffect(() => {
    if (messages && messages.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch (e) {
        console.error('Failed to persist chat messages to storage', e);
      }
    }
  }, [messages, storageKey]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const session = getStoredSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-User-Role': role === 'owner' ? 'owner' : (session?.userRole || 'school_admin'),
      };

      if (session?.sessionToken) {
        headers['Authorization'] = `Bearer ${session.sessionToken}`;
      }

      const activeSchoolId = contextData?.schoolId || session?.schoolId;
      if (activeSchoolId) {
        headers['X-School-Id'] = activeSchoolId;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          role,
          messages: newMessages.map((m) => ({ sender: m.sender, text: m.text })),
          contextData,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          const botMsg: ChatMessage = {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: 'عفواً، انتهت صلاحية جلسة العمل أو يلزم تسجيل الدخول مجدداً لاستخدام المساعد الذكي.',
            timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, botMsg]);
          return;
        }
        throw new Error(`Server returned error status ${response.status}`);
      }

      const data = await response.json();
      const { cleanText: excelCleanText, attachment: extractedAttachment } = extractExcelFromResponse(data.answer || '');
      const { cleanText, draft: extractedDraft } = extractPublishDraftFromResponse(excelCleanText);
      const attachment = data.attachment || extractedAttachment;
      const publishDraft = data.publishDraft || extractedDraft;
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: cleanText || (attachment ? 'تم إعداد وتوليد ملف الإكسيل المطلوب بنجاح (.xlsx):' : (publishDraft ? 'تم صياغة المسودة المطلوبة وجاهزة للاعتماد والنشر للمدرسة:' : 'لم نتمكن من الحصول على إجابة، يرجى إعادة المحاولة.')),
        attachment,
        publishDraft,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error('Chat bot error:', error);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: 'عذراً، حدث خطأ أثناء الاتصال بالخادم. يرجى التأكد من اتصال الإنترنت ثم المحاولة مرة أخرى.',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    const welcomeMsg =
      role === 'admin'
        ? `تم إعادة ضبط المحادثة الرسمية لإدارة المدرسة. كيف يمكنني مساعدتك الآن؟`
        : `تم المسح! أنا جاهز لأي استفسارات جديدة عن المنظومة يا مالك المنصة 👍`;
    const resetMessages: ChatMessage[] = [
      {
        id: `msg-reset-${Date.now()}`,
        sender: 'bot',
        text: welcomeMsg,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setMessages(resetMessages);
    try {
      localStorage.setItem(storageKey, JSON.stringify(resetMessages));
    } catch (e) {
      console.error('Failed to clear chat storage', e);
    }
  };

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  return (
    <div dir="ltr" className="my-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 font-mono text-xs overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400">
        <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-300">
          {language || 'CODE'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="text-[10px]">{copied ? 'تم النسخ!' : 'نسخ'}</span>
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-left leading-relaxed text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

  // Helper to parse inline bolding, italics, and inline code
  const parseInline = (text: string) => {
    // Split by inline code `...`
    const codeParts = text.split(/(`.*?`)/g);
    return codeParts.map((codePart, cIdx) => {
      if (codePart.startsWith('`') && codePart.endsWith('`') && codePart.length > 2) {
        return (
          <code
            key={`inline-${cIdx}`}
            dir="ltr"
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-900 font-mono text-xs font-semibold"
          >
            {codePart.slice(1, -1)}
          </code>
        );
      }

      // Split by bold **
      const parts = codePart.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={j} className="font-bold text-slate-950">
              {part.slice(2, -2)}
            </strong>
          );
        }
        // Support italics *text* or _text_
        const subParts = part.split(/(\*.*?\*|_.*?_)/g);
        if (subParts.length > 1) {
          return subParts.map((sp, k) => {
            if (
              (sp.startsWith('*') && sp.endsWith('*')) ||
              (sp.startsWith('_') && sp.endsWith('_'))
            ) {
              return (
                <em key={k} className="italic text-slate-700">
                  {sp.slice(1, -1)}
                </em>
              );
            }
            return sp;
          });
        }
        return part;
      });
    });
  };

  // Helper to format text with headings (###), dividers (---), bullets, code blocks, and inline markdown
  const renderFormattedText = (text: string) => {
    // Extract code blocks ```lang\ncode```
    const codeBlockRegex = /```([a-zA-Z0-9_\-:]*)\s*\n([\s\S]*?)```/g;
    const segments: { type: 'text' | 'code'; content: string; language?: string }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      segments.push({
        type: 'code',
        language: match[1]?.trim() || '',
        content: match[2].trim(),
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      segments.push({ type: 'text', content: text.substring(lastIndex) });
    }

    return segments.map((seg, sIdx) => {
      if (seg.type === 'code') {
        return <CodeBlock key={`cb-${sIdx}`} code={seg.content} language={seg.language} />;
      }

      const lines = seg.content.split('\n');
      return (
        <div key={`seg-${sIdx}`} className="space-y-1">
          {lines.map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={i} className="h-1.5" />;

            // Horizontal Rule: --- or *** or ___
            if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
              return <hr key={i} className="my-2 border-slate-200" />;
            }

            // Headings: #, ##, ###, ####
            if (trimmed.startsWith('#')) {
              const levelMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
              if (levelMatch) {
                const level = levelMatch[1].length;
                const headingText = levelMatch[2];
                return (
                  <div
                    key={i}
                    className={`font-bold text-slate-950 mt-2 mb-1 pb-1 border-b border-slate-200/80 ${
                      level === 1
                        ? 'text-base'
                        : level === 2
                        ? 'text-sm'
                        : 'text-xs uppercase tracking-wide text-slate-900'
                    }`}
                  >
                    {parseInline(headingText)}
                  </div>
                );
              }
            }

            // Blockquote: > text
            if (trimmed.startsWith('>')) {
              const quoteText = trimmed.replace(/^>\s*/, '');
              return (
                <blockquote
                  key={i}
                  className="my-1.5 p-2 bg-slate-100 border-r-4 border-slate-400 rounded-l-md text-xs text-slate-700 italic"
                >
                  {parseInline(quoteText)}
                </blockquote>
              );
            }

            // Bullet points: *, -, •, or numbered 1., 2.
            const isBullet =
              trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ');
            const isNumbered = /^\d+\.\s+/.test(trimmed);

            if (isBullet) {
              const bulletText = trimmed.replace(/^(\*|-|•)\s+/, '');
              return (
                <div key={i} className="flex items-start gap-2 my-0.5 pr-1">
                  <span className="text-slate-400 select-none font-bold text-xs mt-1">•</span>
                  <div className="flex-1 leading-relaxed text-sm text-slate-800">
                    {parseInline(bulletText)}
                  </div>
                </div>
              );
            }

            if (isNumbered) {
              const numMatch = trimmed.match(/^(\d+\.)\s+(.*)$/);
              if (numMatch) {
                return (
                  <div key={i} className="flex items-start gap-2 my-0.5 pr-1">
                    <span className="text-slate-500 font-semibold text-xs mt-0.5">
                      {numMatch[1]}
                    </span>
                    <div className="flex-1 leading-relaxed text-sm text-slate-800">
                      {parseInline(numMatch[2])}
                    </div>
                  </div>
                );
              }
            }

            // Standard paragraph line
            return (
              <div key={i} className="leading-relaxed text-sm text-slate-800">
                {parseInline(trimmed)}
              </div>
            );
          })}
        </div>
      );
    });
  };

  const isEmerald = themeColor === 'emerald';
  const isIndigo = themeColor === 'indigo';

  const badgeBg = isEmerald
    ? 'bg-emerald-500'
    : isIndigo
    ? 'bg-indigo-600'
    : 'bg-blue-600';

  const headerBg = isEmerald
    ? 'from-emerald-800 to-teal-900'
    : isIndigo
    ? 'from-indigo-900 to-slate-900'
    : 'from-blue-900 to-slate-900';

  if (embedded) {
    return (
      <div className="w-full h-[calc(100vh-8rem)] min-h-[520px] max-w-5xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200/90 flex flex-col overflow-hidden font-['Cairo',sans-serif] dir-rtl">
        {/* Header */}
        <div
          className={`p-4 sm:p-5 bg-gradient-to-r ${headerBg} text-white flex items-center justify-between shrink-0 shadow-md`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15">
              {role === 'admin' ? (
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300" />
              ) : (
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-300" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">{title}</h3>
              <p className="text-[11px] sm:text-xs text-white/70 leading-tight mt-0.5">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              title="مسح المحادثة"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer border border-white/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">إعادة ضبط</span>
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 font-bold shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-slate-800 text-white'
                    : isEmerald
                    ? 'bg-emerald-600 text-white'
                    : isIndigo
                    ? 'bg-indigo-600 text-white'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className="max-w-[85%] space-y-1">
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl shadow-xs text-slate-800 space-y-1 ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-tl-none font-medium'
                      : 'bg-white border border-slate-200/80 rounded-tr-none text-slate-800'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div className="space-y-2">
                      {renderFormattedText(msg.text)}
                      {msg.publishDraft && (
                        <InteractivePublishDraftCard draft={msg.publishDraft} schoolId={activeSchoolId} />
                      )}
                      {msg.attachment && <ExcelAttachmentCard attachment={msg.attachment} />}
                    </div>
                  )}
                </div>

                <div
                  className={`text-[10px] text-slate-400 px-1 ${
                    msg.sender === 'user' ? 'text-left' : 'text-right'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator / Advanced Skeleton */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 items-start"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 font-bold text-white shadow-sm mt-0.5 ${
                  isEmerald ? 'bg-emerald-600' : isIndigo ? 'bg-indigo-600' : 'bg-blue-600'
                }`}
              >
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl rounded-tr-none shadow-xs space-y-2 min-w-[200px] max-w-[80%]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-slate-400">جاري صياغة الرد الذكي...</span>
                </div>
                <Skeleton variant="text" className="w-full h-3" />
                <Skeleton variant="text" className="w-4/5 h-3" />
                <Skeleton variant="text" className="w-2/3 h-3" />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {quickPrompts && quickPrompts.length > 0 && (
          <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 pr-1">اقتراحات:</span>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                disabled={isLoading}
                onClick={() => handleSendMessage(prompt)}
                className="text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Box */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                role === 'admin'
                  ? 'اسأل الذكاء الاصطناعي عن بيانات المدرسة...'
                  : 'اسأل عن المنظومة والمدارس...'
              }
              disabled={isLoading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 sm:py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`p-2.5 sm:p-3 rounded-2xl text-white transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isEmerald
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : isIndigo
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </form>
          <div className="mt-1.5 text-center text-[10px] text-slate-400">
            المساعد يعرض البيانات المتاحة في اللوحة فقط ولا يمتلك صلاحيات التعديل.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Floating Toggle Button hidden in sidebar tab mode */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed z-50 bottom-4 left-4 ${
              isExpanded
                ? 'w-[calc(100vw-2rem)] sm:w-[700px] h-[calc(100vh-2rem)]'
                : 'w-[calc(100vw-2rem)] sm:w-[420px] h-[600px] max-h-[calc(100vh-2rem)]'
            } bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden font-['Cairo',sans-serif] dir-rtl`}
          >
            {/* Header */}
            <div
              className={`p-4 bg-gradient-to-r ${headerBg} text-white flex items-center justify-between shrink-0 shadow-md`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15">
                  {role === 'admin' ? (
                    <Building2 className="w-5 h-5 text-emerald-300" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-indigo-300" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm">{title}</h3>
                  <p className="text-[11px] text-white/70 leading-tight mt-0.5">{subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearChat}
                  title="مسح المحادثة"
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'تصغير' : 'توسيع'}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer hidden sm:block"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="إغلاق"
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 font-bold shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-slate-800 text-white'
                        : isEmerald
                        ? 'bg-emerald-600 text-white'
                        : isIndigo
                        ? 'bg-indigo-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[82%] space-y-1`}>
                    <div
                      className={`p-3.5 rounded-2xl shadow-sm text-slate-800 space-y-1 ${
                        msg.sender === 'user'
                          ? 'bg-slate-900 text-white rounded-tl-none font-medium'
                          : 'bg-white border border-slate-200/80 rounded-tr-none text-slate-800'
                      }`}
                    >
                      {msg.sender === 'user' ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        <div className="space-y-2">
                          {renderFormattedText(msg.text)}
                          {msg.publishDraft && (
                            <InteractivePublishDraftCard draft={msg.publishDraft} schoolId={activeSchoolId} />
                          )}
                          {msg.attachment && <ExcelAttachmentCard attachment={msg.attachment} />}
                        </div>
                      )}
                    </div>

                    <div
                      className={`text-[10px] text-slate-400 px-1 ${
                        msg.sender === 'user' ? 'text-left' : 'text-right'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator / Advanced Skeleton */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 items-start"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 font-bold text-white shadow-sm mt-0.5 ${
                      isEmerald ? 'bg-emerald-600' : isIndigo ? 'bg-indigo-600' : 'bg-blue-600'
                    }`}
                  >
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl rounded-tr-none shadow-sm space-y-2 min-w-[200px] max-w-[80%]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-slate-400">جاري صياغة الرد الذكي...</span>
                    </div>
                    <Skeleton variant="text" className="w-full h-3" />
                    <Skeleton variant="text" className="w-4/5 h-3" />
                    <Skeleton variant="text" className="w-2/3 h-3" />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            {quickPrompts && quickPrompts.length > 0 && (
              <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[11px] font-bold text-slate-400 shrink-0 pr-1">اقتراحات:</span>
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    disabled={isLoading}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Box */}
            <div className="p-3 bg-white border-t border-slate-200 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    role === 'admin'
                      ? 'اسأل الذكاء الاصطناعي عن بيانات المدرسة...'
                      : 'اسأل عن المنظومة والمدارس...'
                  }
                  disabled={isLoading}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`p-2.5 rounded-2xl text-white transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isEmerald
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : isIndigo
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Send className="w-4 h-4 rotate-180" />
                </button>
              </form>
              <div className="mt-1.5 text-center text-[10px] text-slate-400">
                المساعد يعرض البيانات المتاحة في اللوحة فقط ولا يمتلك صلاحيات التعديل.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
