import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Plus,
  Send,
  ArrowRight,
  Search,
  User,
  GraduationCap,
  Building,
  Check,
  CheckCheck,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  X,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import {
  PrivateConversation,
  PrivateMessage,
  RecipientSearchResult,
} from '../../types/privateMessaging';
import {
  fetchPrivateConversationsApi,
  fetchPrivateMessagesApi,
  startPrivateConversationApi,
  sendPrivateMessageApi,
  searchPrivateRecipientsApi,
  getPrivateMessagingEventSourceUrl,
  markPrivateConversationAsReadApi,
} from '../../lib/privateMessagingApi';

/**
 * Analyzes a URL to determine if it is HTTP or suspicious
 */
function analyzeLink(rawUrl: string): { isSuspicious: boolean; reason: string; fullUrl: string } {
  const cleanUrl = rawUrl.trim();
  let fullUrl = cleanUrl;
  if (!/^https?:\/\//i.test(cleanUrl)) {
    fullUrl = 'https://' + cleanUrl;
  }

  // 1. Explicit unencrypted HTTP
  if (/^http:\/\//i.test(cleanUrl)) {
    return {
      isSuspicious: true,
      reason: 'هذا الرابط يستخدم بروتوكولاً غير مشفر (HTTP) بدلاً من بروتوكول التشفير الآمن (HTTPS)، مما يعرض بياناتك ومراسلاتك للاعتراض والتجسس.',
      fullUrl: cleanUrl,
    };
  }

  // 2. Direct IP address URL
  if (
    /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i.test(fullUrl) ||
    /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i.test(cleanUrl)
  ) {
    return {
      isSuspicious: true,
      reason: 'هذا الرابط يتصل مباشرة بعنوان IP رقمي مجهول بدلاً من اسم نطاق رسمي موثوق.',
      fullUrl,
    };
  }

  // 3. Non-standard network ports
  if (/:\d{2,5}(\/|$)/.test(fullUrl) && !/:443(\/|$)/.test(fullUrl) && !/:80(\/|$)/.test(fullUrl)) {
    return {
      isSuspicious: true,
      reason: 'هذا الرابط يستهدف منفذ اتصال شبكي غير قياسي (Port) قد يُستخدم لأغراض مجهولة أو غير آمنة.',
      fullUrl,
    };
  }

  // 4. Suspicious symbols like @ embedded in authority or punycode xn--
  try {
    const parsed = new URL(fullUrl);
    if (parsed.username || parsed.password || parsed.hostname.includes('xn--')) {
      return {
        isSuspicious: true,
        reason: 'يحتوي الرابط على ترميز مشبوه أو أسماء مستخدمين مدمجة قد تستخدم في محاولات التصيد والاحتيال الإلكتروني.',
        fullUrl,
      };
    }
  } catch {
    return {
      isSuspicious: true,
      reason: 'عنوان الرابط غير صحيح أو يحتوي على رموز مجهولة.',
      fullUrl,
    };
  }

  return {
    isSuspicious: false,
    reason: '',
    fullUrl,
  };
}

/**
 * Renders a single line of text with link detection & suspicious highlight
 */
function renderLineWithLinks(
  line: string,
  isMe: boolean,
  onSuspiciousLink: (url: string, reason: string) => void
) {
  // Regex to match URLs (https://, http://, or domain.tld/...)
  const urlRegex = /(https?:\/\/[^\s]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(line)) !== null) {
    const matchedUrl = match[0];
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      parts.push(line.substring(lastIndex, matchIndex));
    }

    const { isSuspicious, reason, fullUrl } = analyzeLink(matchedUrl);

    if (isSuspicious) {
      parts.push(
        <button
          key={`susp-${matchIndex}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSuspiciousLink(fullUrl, reason);
          }}
          className={`inline-flex items-center gap-1 font-bold underline rounded px-1.5 py-0.5 text-xs mx-0.5 transition-all cursor-pointer shadow-2xs ${
            isMe
              ? 'bg-amber-300 text-amber-950 hover:bg-amber-200 border border-amber-400'
              : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
          }`}
          title="تحذير أمان: رابط غير آمن أو غير مشفر"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span dir="ltr" className="break-all font-mono">
            {matchedUrl}
          </span>
        </button>
      );
    } else {
      parts.push(
        <a
          key={`safe-${matchIndex}`}
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex items-center gap-1 underline font-bold hover:opacity-85 transition-opacity px-0.5 mx-0.5 cursor-pointer ${
            isMe ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-800'
          }`}
          title="فتح الرابط في علامة تبويب جديدة"
        >
          <span dir="ltr" className="break-all">
            {matchedUrl}
          </span>
          <ExternalLink className="w-3 h-3 inline shrink-0 opacity-70" />
        </a>
      );
    }

    lastIndex = matchIndex + matchedUrl.length;
  }

  if (lastIndex < line.length) {
    parts.push(line.substring(lastIndex));
  }

  return parts.length > 0 ? parts : line;
}

/**
 * Message Content renderer enforcing max 4 lines preview with 'قراءة المزيد'
 */
function MessageBubbleBody({
  body,
  isMe,
  onSuspiciousLink,
}: {
  body: string;
  isMe: boolean;
  onSuspiciousLink: (url: string, reason: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const lines = useMemo(() => body.split('\n'), [body]);
  const hasMoreThan4Lines = lines.length > 4;
  const displayedLines = hasMoreThan4Lines && !isExpanded ? lines.slice(0, 4) : lines;

  return (
    <div className="space-y-1">
      <div className="space-y-0.5 text-xs sm:text-sm leading-relaxed break-all break-words">
        {displayedLines.map((line, idx) => (
          <div key={idx} className="min-h-[1.25rem]">
            {renderLineWithLinks(line, isMe, onSuspiciousLink)}
          </div>
        ))}
      </div>

      {hasMoreThan4Lines && (
        <div className="pt-1.5 flex items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-2xs select-none ${
              isMe
                ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-xs'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
            }`}
          >
            {isExpanded ? (
              <>
                <span>عرض أقل</span>
                <ChevronUp className="w-3.5 h-3.5 shrink-0" />
              </>
            ) : (
              <>
                <span>قراءة المزيد</span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

interface PrivateMessagingViewProps {
  schoolId: string;
  userRole: 'student' | 'teacher' | 'attendance_teacher' | 'school_admin' | 'owner';
  currentUserId?: string;
  currentUserName?: string;
}

export function PrivateMessagingView({
  schoolId,
  userRole,
  currentUserId,
  currentUserName,
}: PrivateMessagingViewProps) {
  // State
  const [conversations, setConversations] = useState<PrivateConversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState<boolean>(true);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [conversationSearchQuery, setConversationSearchQuery] = useState<string>('');

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<PrivateConversation | null>(null);

  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(false);
  const [oldestCursor, setOldestCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState<boolean>(false);

  const [typedMessage, setTypedMessage] = useState<string>('');
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Daily Quota Tracking (55 messages daily per conversation)
  const [dailyLimit, setDailyLimit] = useState<number>(55);
  const [dailySentCount, setDailySentCount] = useState<number>(0);
  const [dailyRemaining, setDailyRemaining] = useState<number>(55);

  // Suspicious Link Warning Modal State
  const [suspiciousLinkModal, setSuspiciousLinkModal] = useState<{
    url: string;
    reason: string;
  } | null>(null);
  const [suspiciousCountdown, setSuspiciousCountdown] = useState<number>(3);

  // 3-second countdown timer for suspicious link modal
  useEffect(() => {
    if (!suspiciousLinkModal) {
      setSuspiciousCountdown(3);
      return;
    }
    setSuspiciousCountdown(3);
    const interval = setInterval(() => {
      setSuspiciousCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [suspiciousLinkModal]);

  // New Conversation Modal State
  const [isNewConvModalOpen, setIsNewConvModalOpen] = useState<boolean>(false);
  const [newConvRecipientType, setNewConvRecipientType] = useState<'student' | 'teacher'>(
    userRole === 'teacher' || userRole === 'attendance_teacher' ? 'student' : 'student'
  );
  const [newConvSearchQuery, setNewConvSearchQuery] = useState<string>('');
  const [recipientResults, setRecipientResults] = useState<RecipientSearchResult[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState<boolean>(false);
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientSearchResult | null>(null);
  const [newConvInitialMessage, setNewConvInitialMessage] = useState<string>('');
  const [startingConv, setStartingConv] = useState<boolean>(false);
  const [newConvError, setNewConvError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const canStartConversation =
    userRole === 'school_admin' ||
    userRole === 'owner' ||
    userRole === 'teacher' ||
    userRole === 'attendance_teacher';

  const activeConversationIdRef = useRef<string | null>(activeConversationId);
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  // 1. Load Conversations List
  const loadConversations = async (silent = false) => {
    if (!schoolId) return;
    if (!silent) setLoadingConversations(true);
    setConversationsError(null);
    try {
      const list = await fetchPrivateConversationsApi(schoolId);
      setConversations(list);
    } catch (err: any) {
      if (!silent) setConversationsError(err?.message || 'فشل تحميل قائمة المحادثات');
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [schoolId]);

  // 2. Load Messages for Active Conversation
  const loadMessages = async (convId: string, silent = false) => {
    if (!schoolId || !convId) return;
    if (!silent) setLoadingMessages(true);
    setMessagesError(null);
    try {
      const data = await fetchPrivateMessagesApi(schoolId, convId, { limit: 50 });
      setMessages((prev) => {
        if (!silent || prev.length === 0) return data.messages;
        const map = new Map<string, PrivateMessage>();
        prev.forEach((m) => map.set(m.id, m));
        data.messages.forEach((m) => {
          map.set(m.id, {
            ...m,
            isFromMe:
              m.isFromMe ??
              (m.senderId === currentUserId ||
                (userRole === 'school_admin' && (m.senderRole === 'school_admin' || m.senderId.startsWith('admin_')))),
          });
        });
        return Array.from(map.values()).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
      setHasMoreMessages(data.hasMore);
      setOldestCursor(data.oldestCursor);
      if (typeof data.dailyRemaining === 'number') {
        setDailyRemaining(data.dailyRemaining);
        setDailySentCount(data.dailySentCount ?? 0);
        setDailyLimit(data.dailyLimit ?? 55);
      }

      // Decrement unread count locally in list
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err: any) {
      if (!silent) setMessagesError(err?.message || 'فشل تحميل رسائل المحادثة');
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeConversationId) {
      const matched = conversations.find((c) => c.id === activeConversationId);
      if (matched) setActiveConversation(matched);
      loadMessages(activeConversationId);
    } else {
      setActiveConversation(null);
      setMessages([]);
    }
  }, [activeConversationId]);

  // Real-time live EventSource listener & fallback fast sync
  useEffect(() => {
    if (!schoolId) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSse = () => {
      try {
        const streamUrl = getPrivateMessagingEventSourceUrl(
          schoolId,
          userRole,
          currentUserId,
          currentUserName
        );
        eventSource = new EventSource(streamUrl);

        eventSource.addEventListener('new_message', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            const incomingMsg = data.message;
            const convId = data.conversationId;
            if (!incomingMsg || !convId) return;

            const isCurrentConv = activeConversationIdRef.current === convId;
            const isMe = Boolean(
              incomingMsg.isFromMe ||
              incomingMsg.senderId === currentUserId ||
              (userRole === 'school_admin' && (incomingMsg.senderRole === 'school_admin' || incomingMsg.senderId.startsWith('admin_')))
            );

            if (isCurrentConv) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === incomingMsg.id)) return prev;
                return [...prev, { ...incomingMsg, isFromMe: isMe }];
              });

              // Automatically mark as read if received from the other party
              if (!isMe) {
                markPrivateConversationAsReadApi(schoolId, convId);
              }
            }

            // Update conversation list and bump to top
            setConversations((prev) => {
              const idx = prev.findIndex((c) => c.id === convId);
              if (idx >= 0) {
                const target = prev[idx];
                const updatedConv: PrivateConversation = {
                  ...target,
                  lastMessage: {
                    body: incomingMsg.body,
                    senderId: incomingMsg.senderId,
                    createdAt: incomingMsg.createdAt,
                    isFromMe: isMe,
                  },
                  updatedAt: incomingMsg.createdAt,
                  unreadCount: isCurrentConv || isMe ? 0 : (target.unreadCount || 0) + 1,
                };
                const remaining = prev.filter((_, i) => i !== idx);
                return [updatedConv, ...remaining];
              } else {
                loadConversations(true);
                return prev;
              }
            });
          } catch (err) {
            console.warn('[SSE] Error handling new_message event:', err);
          }
        });

        eventSource.addEventListener('messages_read', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            const convId = data.conversationId;
            if (activeConversationIdRef.current === convId) {
              const readAt = data.readAt || new Date().toISOString();
              setMessages((prev) =>
                prev.map((m) => (m.isFromMe && !m.readAt ? { ...m, readAt } : m))
              );
            }
          } catch (err) {
            console.warn('[SSE] Error handling messages_read event:', err);
          }
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          reconnectTimeout = setTimeout(connectSse, 4000);
        };
      } catch {
        reconnectTimeout = setTimeout(connectSse, 4000);
      }
    };

    connectSse();

    // Fast background sync interval every 3 seconds for infallible reliability
    const syncTimer = setInterval(() => {
      if (document.hidden) return;
      if (activeConversationIdRef.current) {
        loadMessages(activeConversationIdRef.current, true);
      }
      loadConversations(true);
    }, 3000);

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(syncTimer);
    };
  }, [schoolId, userRole, currentUserId, currentUserName]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (!loadingMessages && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingMessages]);

  // 3. Load Older Messages
  const handleLoadOlder = async () => {
    if (!schoolId || !activeConversationId || !oldestCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const data = await fetchPrivateMessagesApi(schoolId, activeConversationId, {
        limit: 30,
        before: oldestCursor,
      });
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMoreMessages(data.hasMore);
      setOldestCursor(data.oldestCursor);
    } catch (err: any) {
      setMessagesError(err?.message || 'فشل تحميل الرسائل الأقدم');
    } finally {
      setLoadingOlder(false);
    }
  };

  // Input Change with 55 chars/line and 8 lines max enforcement (preserves full URLs without slicing)
  const handleMessageInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawVal = e.target.value;
    const lines = rawVal.split('\n');

    // Prevent exceeding 8 lines
    if (lines.length > 8) {
      return;
    }

    // Limit each line to 55 characters max unless it contains a URL
    const urlPattern = /(https?:\/\/[^\s]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?)/i;
    const trimmedLines = lines.map((l) => {
      if (urlPattern.test(l)) {
        return l; // Preserve complete links
      }
      return l.length > 55 ? l.slice(0, 55) : l;
    });
    setTypedMessage(trimmedLines.join('\n'));
  };

  // Paste handler ensuring no line exceeds 55 chars & total <= 8 lines, while keeping long URLs intact
  const handleMessagePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    if (!pasted) return;

    const rawLines = pasted.split('\n');
    const processed: string[] = [];
    const urlPattern = /(https?:\/\/[^\s]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?)/i;

    for (const rawLine of rawLines) {
      if (processed.length >= 8) break;
      if (urlPattern.test(rawLine) || rawLine.length <= 55) {
        processed.push(rawLine);
      } else {
        for (let i = 0; i < rawLine.length; i += 55) {
          if (processed.length >= 8) break;
          processed.push(rawLine.slice(i, i + 55));
        }
      }
    }

    const currentLines = typedMessage ? typedMessage.split('\n') : [];
    if (currentLines.length === 0 || typedMessage === '') {
      setTypedMessage(processed.slice(0, 8).join('\n'));
    } else {
      const combined = (typedMessage + '\n' + processed.join('\n')).split('\n').slice(0, 8);
      const capped = combined
        .map((l) => (urlPattern.test(l) ? l : l.slice(0, 55)))
        .join('\n');
      setTypedMessage(capped);
    }
  };

  // 4. Send Message in Active Conversation
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = typedMessage.trim();
    if (!clean || !activeConversationId || sendingMessage) return;

    // Check lines validation
    const lines = clean.split('\n');
    if (lines.length > 8) {
      setSendError('الحد الأقصى المسموح به هو 8 أسطر لكل رسالة');
      return;
    }
    const urlRegex = /(https?:\/\/[^\s]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;
    const urlPattern = /(https?:\/\/[^\s]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?)/i;
    const overlong = lines.some((l) => {
      const nonUrl = l.replace(urlRegex, '').trim();
      if (urlPattern.test(l)) {
        return nonUrl.length > 55;
      }
      return l.length > 55;
    });
    if (overlong) {
      setSendError('الحد الأقصى المسموح به لكل سطر هو 55 حرفاً (باستثناء الروابط)');
      return;
    }

    // Check daily quota
    if (dailyRemaining <= 0) {
      setSendError('لقد استنفدت الحد الأقصى اليومي للرسائل (55 رسالة يومياً في هذه المحادثة)');
      return;
    }

    setSendingMessage(true);
    setSendError(null);
    try {
      const newMsg = await sendPrivateMessageApi(schoolId, activeConversationId, clean);
      const enrichedMsg: PrivateMessage = {
        ...newMsg,
        isFromMe: true,
      };
      setMessages((prev) => (prev.some((m) => m.id === enrichedMsg.id) ? prev : [...prev, enrichedMsg]));
      setTypedMessage(''); // Clear ONLY on success
      setDailyRemaining((prev) => Math.max(0, prev - 1));
      setDailySentCount((prev) => prev + 1);

      // Update last message in conversation list and move to top
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === activeConversationId);
        if (idx >= 0) {
          const target = prev[idx];
          const updatedConv: PrivateConversation = {
            ...target,
            lastMessage: {
              body: clean,
              senderId: newMsg.senderId,
              createdAt: newMsg.createdAt,
              isFromMe: true,
            },
            updatedAt: newMsg.createdAt,
          };
          const remaining = prev.filter((_, i) => i !== idx);
          return [updatedConv, ...remaining];
        }
        return prev;
      });
    } catch (err: any) {
      // DO NOT clear typedMessage on error!
      setSendError(err?.message || 'فشل إرسال الرسالة، يرجى المحاولة ثانية');
    } finally {
      setSendingMessage(false);
    }
  };

  // 5. Search Recipients for New Conversation Modal
  useEffect(() => {
    if (!isNewConvModalOpen) return;
    let isCancelled = false;

    const timer = setTimeout(async () => {
      setLoadingRecipients(true);
      try {
        const list = await searchPrivateRecipientsApi(
          schoolId,
          newConvRecipientType,
          newConvSearchQuery
        );
        if (!isCancelled) {
          setRecipientResults(list);
        }
      } catch (err) {
        if (!isCancelled) setRecipientResults([]);
      } finally {
        if (!isCancelled) setLoadingRecipients(false);
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [isNewConvModalOpen, newConvRecipientType, newConvSearchQuery, schoolId]);

  // 6. Start New Conversation
  const handleStartConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipient || !newConvInitialMessage.trim() || startingConv) return;

    setStartingConv(true);
    setNewConvError(null);
    try {
      const res = await startPrivateConversationApi(schoolId, {
        recipientType: newConvRecipientType,
        recipientId: selectedRecipient.id,
        initialMessage: newConvInitialMessage.trim(),
      });

      // Reload conversations and select the new one immediately
      await loadConversations(true);
      setActiveConversationId(res.conversationId);
      setMessages([{ ...res.message, isFromMe: true }]);
      setIsNewConvModalOpen(false);
      setSelectedRecipient(null);
      setNewConvInitialMessage('');
      setNewConvSearchQuery('');
    } catch (err: any) {
      setNewConvError(err?.message || 'فشل بدء المحادثة');
    } finally {
      setStartingConv(false);
    }
  };

  // Filter conversations locally
  const filteredConversations = useMemo(() => {
    if (!conversationSearchQuery.trim()) return conversations;
    const q = conversationSearchQuery.trim().toLowerCase();
    return conversations.filter(
      (c) =>
        c.otherParticipant.name.toLowerCase().includes(q) ||
        (c.otherParticipant.details && c.otherParticipant.details.toLowerCase().includes(q)) ||
        (c.lastMessage?.body && c.lastMessage.body.toLowerCase().includes(q))
    );
  }, [conversations, conversationSearchQuery]);

  // Helper formatting for timestamps
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'الآن';
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
      if (diffHours < 24) {
        return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      }
      if (diffDays === 1) return 'أمس';
      if (diffDays < 7) return `منذ ${diffDays} أيام`;
      return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const getRoleIcon = (role?: string) => {
    if (role === 'school_admin' || role === 'owner' || role === 'admin') {
      return <Building className="w-4 h-4 text-emerald-600" />;
    }
    if (role === 'teacher' || role === 'attendance_teacher') {
      return <GraduationCap className="w-4 h-4 text-indigo-600" />;
    }
    return <User className="w-4 h-4 text-blue-600" />;
  };

  const getRoleBadgeStyle = (role?: string) => {
    if (role === 'school_admin' || role === 'owner' || role === 'admin') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (role === 'teacher' || role === 'attendance_teacher') {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const getRoleTitle = (role?: string) => {
    if (role === 'school_admin' || role === 'owner' || role === 'admin') return 'إدارة المدرسة';
    if (role === 'attendance_teacher') return 'مسؤول الحضور';
    if (role === 'teacher') return 'معلم';
    return 'طالب';
  };

  return (
    <div className="flex flex-col h-full w-full bg-white sm:rounded-2xl border-0 sm:border border-slate-200/80 shadow-xs overflow-hidden font-['Cairo',sans-serif] dir-rtl">
      {/* ---------------------------------------------------- */}
      {/* TOP HEADER (Visible on desktop always; on mobile only when browsing conversation list) */}
      {/* ---------------------------------------------------- */}
      <div
        className={`bg-white px-4 py-3 border-b border-slate-200/80 items-center justify-between shrink-0 shadow-xs z-20 ${
          activeConversationId ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <MessageSquare className="w-5 h-5" />
          </div>

          <div>
            <h1 className="text-base font-extrabold text-slate-900 leading-tight">رسائلي</h1>
            <p className="text-xs text-slate-500 font-medium">الرسائل والمحادثات الخاصة المباشرة</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadConversations()}
            disabled={loadingConversations}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="تحديث المحادثات"
          >
            <RefreshCw className={`w-4 h-4 ${loadingConversations ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Action button: بدأ محادثة (Only visible for authorized staff roles) */}
          {canStartConversation && (
            <button
              onClick={() => {
                setIsNewConvModalOpen(true);
                setSelectedRecipient(null);
                setNewConvInitialMessage('');
                setNewConvError(null);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>بدأ محادثة</span>
            </button>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MAIN CONTAINER (Split Pane Desktop / Single Pane Mobile) */}
      {/* ---------------------------------------------------- */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ==================================================== */}
        {/* CONVERSATION LIST (Visible on desktop or when no active conv on mobile) */}
        {/* ==================================================== */}
        <div
          className={`w-full lg:w-80 lg:border-l border-slate-200/80 bg-white flex flex-col shrink-0 h-full overflow-hidden ${
            activeConversationId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Search Box in Inbox */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/70 shrink-0">
            <div className="relative">
              <input
                type="text"
                value={conversationSearchQuery}
                onChange={(e) => setConversationSearchQuery(e.target.value)}
                placeholder="بحث في المحادثات..."
                className="w-full pl-3 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              {conversationSearchQuery && (
                <button
                  onClick={() => setConversationSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y-0">
            {loadingConversations ? (
              <div className="p-8 text-center space-y-3">
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">جاري تحميل رسائلك الخاصة...</p>
              </div>
            ) : conversationsError ? (
              <div className="p-4 m-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs text-center space-y-2">
                <AlertCircle className="w-5 h-5 mx-auto text-rose-600" />
                <p>{conversationsError}</p>
                <button
                  onClick={() => loadConversations()}
                  className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center space-y-3 my-auto">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-800">لا توجد رسائل</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-[220px] mx-auto">
                    {userRole === 'student'
                      ? 'لم يتم إرسال أي رسائل خاصة إليك من المعلمين أو إدارة المدرسة بعد.'
                      : 'لا توجد محادثات سابقة. اضغط على "بدأ محادثة" للتواصل مباشرة.'}
                  </p>
                </div>
                {canStartConversation && (
                  <button
                    onClick={() => {
                      setIsNewConvModalOpen(true);
                      setSelectedRecipient(null);
                      setNewConvInitialMessage('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>بدأ محادثة جديدة</span>
                  </button>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.id === activeConversationId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`w-full text-right p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 border ${
                      isActive
                        ? 'bg-blue-50/90 border-blue-300 shadow-xs'
                        : conv.unreadCount > 0
                        ? 'bg-amber-50/60 border-amber-200/80 hover:bg-amber-50'
                        : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200/60'
                    }`}
                  >
                    {/* Participant Avatar / Icon */}
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/70 flex items-center justify-center shrink-0 mt-0.5 relative">
                      {getRoleIcon(conv.otherParticipant.role)}
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-xs">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {conv.otherParticipant.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          {formatTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                        </span>
                      </div>

                      {/* Role & Details badge */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${getRoleBadgeStyle(
                            conv.otherParticipant.role
                          )}`}
                        >
                          {getRoleTitle(conv.otherParticipant.role)}
                        </span>
                        {conv.otherParticipant.details && (
                          <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                            {conv.otherParticipant.details}
                          </span>
                        )}
                      </div>

                      {/* Last message preview */}
                      <p className="text-xs text-slate-500 truncate line-clamp-1 leading-snug">
                        {conv.lastMessage ? (
                          <>
                            {conv.lastMessage.isFromMe && (
                              <span className="text-slate-400 font-medium">أنت: </span>
                            )}
                            {conv.lastMessage.body}
                          </>
                        ) : (
                          <span className="italic text-slate-400">محادثة جديدة</span>
                        )}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ==================================================== */}
        {/* ACTIVE CHAT SCREEN */}
        {/* ==================================================== */}
        <div
          className={`flex-1 flex flex-col h-full overflow-hidden bg-slate-100/70 ${
            activeConversationId ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {activeConversation ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
              {/* Active Chat Header */}
              <div className="bg-white px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200/90 flex items-center justify-between shrink-0 shadow-xs z-10">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <button
                    onClick={() => setActiveConversationId(null)}
                    className="p-1.5 -mr-1 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                    title="الرجوع إلى قائمة المحادثات"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                    {getRoleIcon(activeConversation.otherParticipant.role)}
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight truncate">
                      {activeConversation.otherParticipant.name}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span
                        className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${getRoleBadgeStyle(
                          activeConversation.otherParticipant.role
                        )}`}
                      >
                        {getRoleTitle(activeConversation.otherParticipant.role)}
                      </span>
                      {activeConversation.otherParticipant.details && (
                        <span className="text-[10px] sm:text-[11px] text-slate-500 truncate max-w-[150px] sm:max-w-[250px]">
                          {activeConversation.otherParticipant.details}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => loadMessages(activeConversation.id)}
                    disabled={loadingMessages}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    title="تحديث الرسائل"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingMessages ? 'animate-spin text-blue-600' : ''}`} />
                  </button>
                  <div className="hidden sm:flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>محادثة مباشرة</span>
                  </div>
                </div>
              </div>

              {/* Chat Thread Body (Independent Scroll Area) */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-4 space-y-3 flex flex-col min-h-0"
              >
                {/* Pagination button for older messages */}
                {hasMoreMessages && (
                  <div className="text-center pb-2">
                    <button
                      onClick={handleLoadOlder}
                      disabled={loadingOlder}
                      className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-2xs transition-colors cursor-pointer"
                    >
                      {loadingOlder ? 'جاري التحميل...' : 'تحميل الرسائل الأقدم'}
                    </button>
                  </div>
                )}

                {loadingMessages ? (
                  <div className="m-auto text-center py-8 space-y-2">
                    <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                    <p className="text-xs text-slate-500">جاري تحميل الرسائل...</p>
                  </div>
                ) : messagesError ? (
                  <div className="m-auto p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs text-center space-y-2 max-w-sm">
                    <AlertCircle className="w-5 h-5 mx-auto text-rose-600" />
                    <p>{messagesError}</p>
                    <button
                      onClick={() => activeConversationId && loadMessages(activeConversationId)}
                      className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold text-xs cursor-pointer"
                    >
                      إعادة المحاولة
                    </button>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="m-auto text-center py-8 space-y-2">
                    <div className="w-12 h-12 bg-white text-blue-600 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-slate-600 font-bold">
                      لا توجد رسائل سابقة في هذه المحادثة
                    </p>
                    <p className="text-[11px] text-slate-400">
                      اكتب رسالتك في الأسفل لبدء المحادثة المباشرة
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = Boolean(
                      msg.isFromMe ||
                      msg.senderId === currentUserId ||
                      (userRole === 'school_admin' && (msg.senderRole === 'school_admin' || msg.senderId.startsWith('admin_')))
                    );
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col w-fit max-w-[88%] sm:max-w-[75%] my-1 ${
                          isMe ? 'self-end items-end' : 'self-start items-start'
                        }`}
                      >
                        {/* Sender Label (Shown for others) */}
                        {!isMe && (
                          <span className="text-[10px] text-indigo-700 font-bold px-1.5 mb-1">
                            {msg.senderName}
                          </span>
                        )}

                        {/* Message Bubble with 4 lines max preview & link detection */}
                        <div
                          className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-bl-xs'
                              : 'bg-white text-slate-800 border border-slate-200/90 rounded-br-xs'
                          }`}
                        >
                          <MessageBubbleBody
                            body={msg.body}
                            isMe={isMe}
                            onSuspiciousLink={(url, reason) =>
                              setSuspiciousLinkModal({ url, reason })
                            }
                          />

                          {/* Inline Timestamp & Status */}
                          <div
                            className={`flex items-center gap-1.5 justify-end mt-1 text-[10px] font-medium select-none ${
                              isMe ? 'text-blue-100' : 'text-slate-400'
                            }`}
                          >
                            <span>{formatTime(msg.createdAt)}</span>
                            {isMe && (
                              <span title={msg.readAt ? 'تمت القراءة' : 'تم الإرسال'}>
                                {msg.readAt ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-blue-200 inline" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-blue-200/80 inline" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Error Banner if sending failed */}
              {sendError && (
                <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 flex items-center justify-between text-xs text-rose-700 shrink-0">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{sendError}</span>
                  </div>
                  <button
                    onClick={() => setSendError(null)}
                    className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Daily Quota Exhausted Alert */}
              {dailyRemaining <= 0 && (
                <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-200 flex items-center gap-2 text-xs text-amber-900 shrink-0">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    لقد استنفدت الحد اليومي (55 رسالة يومياً في هذه المحادثة). سيتم تجديد رصيدك غداً.
                  </span>
                </div>
              )}

              {/* Bottom Sticky Input Bar (Locked at bottom of the chat container) */}
              <form
                onSubmit={handleSendMessage}
                className="bg-white p-2.5 sm:p-3 border-t border-slate-200/90 flex items-center gap-2 shrink-0 shadow-sm sticky bottom-0 z-20"
              >
                <div className="flex-1 relative flex flex-col">
                  <textarea
                    rows={Math.min(3, Math.max(1, typedMessage.split('\n').length))}
                    value={typedMessage}
                    onChange={handleMessageInputChange}
                    onPaste={handleMessagePaste}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={
                      dailyRemaining <= 0
                        ? 'تم بلوغ الحد الأقصى اليومي (55 رسالة في هذه المحادثة)'
                        : 'اكتب رسالتك الخاصة هنا...'
                    }
                    disabled={sendingMessage || dailyRemaining <= 0}
                    className="w-full px-3.5 py-2 sm:py-2.5 bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium resize-none min-h-[38px] max-h-[85px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!typedMessage.trim() || sendingMessage || dailyRemaining <= 0}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl font-bold flex items-center justify-center transition-all shrink-0 shadow-xs ${
                    !typedMessage.trim() || sendingMessage || dailyRemaining <= 0
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white cursor-pointer'
                  }`}
                  title="إرسال"
                >
                  {sendingMessage ? (
                    <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 sm:w-5 sm:h-5 rtl:-scale-x-100" />
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="m-auto text-center p-8 space-y-3">
              <div className="w-16 h-16 bg-white border border-slate-200 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xs">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h2 className="text-base font-extrabold text-slate-800">صندوق الرسائل الخاصة</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                اختر محادثة من القائمة لعرض الرسائل المتبادلة أو اضغط على بدأ محادثة للتواصل المباشر.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* "بدأ محادثة" MODAL / SHEET (Strictly for authorized roles) */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {isNewConvModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">بدأ محادثة خاصة جديدة</h3>
                    <p className="text-[11px] text-slate-500">اختر المستلم وأرسل رسالتك الأولى</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNewConvModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body Form */}
              <form onSubmit={handleStartConversation} className="p-4 overflow-y-auto space-y-4 flex-1">
                {/* 1. Recipient Type Switcher (Only admin can choose between student & teacher) */}
                {userRole === 'school_admin' || userRole === 'owner' ? (
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      نوع المستلم:
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setNewConvRecipientType('student');
                          setSelectedRecipient(null);
                        }}
                        className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          newConvRecipientType === 'student'
                            ? 'bg-white text-blue-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        <span>طالب</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setNewConvRecipientType('teacher');
                          setSelectedRecipient(null);
                        }}
                        className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          newConvRecipientType === 'teacher'
                            ? 'bg-white text-indigo-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>معلم</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs font-bold">
                      <User className="w-4 h-4" />
                      <span>المستلم: طالب في المدرسة</span>
                    </div>
                  </div>
                )}

                {/* 2. Recipient Search & Selection */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    اختر {newConvRecipientType === 'student' ? 'الطالب' : 'المعلم'}:
                  </label>

                  <div className="relative mb-2">
                    <input
                      type="text"
                      value={newConvSearchQuery}
                      onChange={(e) => setNewConvSearchQuery(e.target.value)}
                      placeholder={`بحث بالاسم أو ${newConvRecipientType === 'student' ? 'الفصل' : 'المادة'}...`}
                      className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>

                  {/* Recipient Results Box */}
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                    {loadingRecipients ? (
                      <div className="p-4 text-center text-xs text-slate-500">جاري البحث...</div>
                    ) : recipientResults.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        لا توجد نتائج مطابقة
                      </div>
                    ) : (
                      recipientResults.map((r) => {
                        const isSelected = selectedRecipient?.id === r.id;
                        return (
                          <button
                            type="button"
                            key={r.id}
                            onClick={() => setSelectedRecipient(r)}
                            className={`w-full p-2.5 text-right flex items-center justify-between text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 text-blue-900 font-bold'
                                : 'hover:bg-white text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {getRoleIcon(r.role)}
                              <div>
                                <p className="font-bold text-slate-900">{r.name}</p>
                                <p className="text-[10px] text-slate-500">{r.details}</p>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Selected Recipient summary badge */}
                {selectedRecipient && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                    <span className="font-bold">المستلم المحدد: {selectedRecipient.name}</span>
                    <span className="text-[11px] text-emerald-600">{selectedRecipient.details}</span>
                  </div>
                )}

                {/* 3. Initial Message textarea */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    نص الرسالة الأولى:
                  </label>
                  <textarea
                    rows={3}
                    value={newConvInitialMessage}
                    onChange={(e) => setNewConvInitialMessage(e.target.value)}
                    placeholder="اكتب موضوع ورسالة المحادثة هنا..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white resize-none transition-all"
                  />
                </div>

                {/* Error Banner */}
                {newConvError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{newConvError}</span>
                  </div>
                )}

                {/* Modal Actions */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={!selectedRecipient || !newConvInitialMessage.trim() || startingConv}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      !selectedRecipient || !newConvInitialMessage.trim() || startingConv
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                    }`}
                  >
                    {startingConv ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 rotate-180" />
                        <span>إرسال وبدء المحادثة</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsNewConvModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* SUSPICIOUS / HTTP LINK WARNING MODAL (WITH 3-SEC WAIT) */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {suspiciousLinkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-amber-300 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200 shadow-2xs">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                    تحذير أمان: رابط غير آمن أو غير مشفر
                  </h3>
                  <p className="text-xs text-amber-800 font-bold mt-1">
                    يرجى توخي الحذر الشديد قبل فتح هذا الرابط
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSuspiciousLinkModal(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Warning explanation & target URL */}
              <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3.5 space-y-2.5 text-right">
                <p className="text-xs text-amber-950 font-medium leading-relaxed">
                  {suspiciousLinkModal.reason}
                </p>
                <div className="bg-white border border-amber-200/80 rounded-xl p-2.5">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">
                    الرابط المستهدف:
                  </span>
                  <span
                    dir="ltr"
                    className="font-mono text-xs text-amber-900 break-all select-all block text-left font-bold"
                  >
                    {suspiciousLinkModal.url}
                  </span>
                </div>
              </div>

              {/* Safety notice */}
              <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  لا تقم بإدخال أي كلمات مرور أو بيانات شخصية أو حسابات بنكية داخل مواقع غير موثوقة.
                </p>
              </div>

              {/* Action buttons with 3-second wait */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSuspiciousLinkModal(null)}
                  className="flex-1 py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء والعودة للسلامة
                </button>

                <button
                  type="button"
                  disabled={suspiciousCountdown > 0}
                  onClick={() => {
                    const destination = suspiciousLinkModal.url;
                    setSuspiciousLinkModal(null);
                    window.open(destination, '_blank', 'noopener,noreferrer');
                  }}
                  className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    suspiciousCountdown > 0
                      ? 'bg-amber-100 text-amber-800 border border-amber-300 cursor-not-allowed opacity-80'
                      : 'bg-amber-600 hover:bg-amber-700 text-white shadow-md cursor-pointer active:scale-95'
                  }`}
                >
                  {suspiciousCountdown > 0 ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin text-amber-700" />
                      <span>يرجى الانتظار ({suspiciousCountdown}ث)...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      <span>متابعة وفتح الرابط</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
