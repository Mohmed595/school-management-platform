import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { CommunityGroup, CommunityMessage, CommunityMute } from '../../types/community';
import {
  getUserAccessibleGroups,
  fetchCommunityMessagesApi,
  sendCommunityMessageApi,
  editCommunityMessageApi,
  deleteCommunityMessageApi,
  toggleMessageReactionApi,
  voteInPollApi,
  toggleEventCalendarApi,
  pinCommunityMessageApi,
  subscribeToCommunityEvents,
  fetchMutedUsersApi,
  fetchGroupLocksApi,
  getMutedUsers,
  isUserMuted,
  toggleUserMute,
  toggleGroupLock,
} from '../../lib/communityStorage';
import { CommunityList } from './CommunityList';
import { CommunityHeader } from './CommunityHeader';
import { MessageBubble } from './MessageBubble';
import { TypingArea } from './TypingArea';
import { CommunityModerationModal } from './CommunityModerationModal';
import { CreatePollModal } from './CreatePollModal';
import { CreateEventModal } from './CreateEventModal';
import { CreateAdModal } from './CreateAdModal';
import { EventCalendarPickerModal } from './EventCalendarPickerModal';
import { MessageSquare, AlertCircle, ArrowRight, RefreshCw, Loader2, ChevronUp, ArrowDown } from 'lucide-react';

interface CommunityMainViewProps {
  schoolId: string;
  userId: string;
  userName: string;
  userRole: 'student' | 'teacher' | 'admin' | 'owner' | 'parent';
  userGradeName?: string;
  userClassName?: string;
  teacherAssignedClasses?: string[];
  userBadge?: string;
  onBack?: () => void;
}

export function CommunityMainView({
  schoolId,
  userId,
  userName,
  userRole,
  userGradeName,
  userClassName,
  teacherAssignedClasses,
  userBadge,
  onBack,
}: CommunityMainViewProps) {
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [mutedUsers, setMutedUsers] = useState<CommunityMute[]>([]);

  // Loading & Error States for PostgreSQL Persistence
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Search & Filters
  const [isSearchingInChat, setIsSearchingInChat] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');

  // Replying & Editing
  const [replyingMessage, setReplyingMessage] = useState<CommunityMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<CommunityMessage | null>(null);

  // Modals
  const [isModerationModalOpen, setIsModerationModalOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isCreateAdOpen, setIsCreateAdOpen] = useState(false);
  const [eventCalendarModalMessage, setEventCalendarModalMessage] = useState<CommunityMessage | null>(null);

  // Responsive mobile view toggle
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Floating Scroll-To-Bottom State & New Messages Tracker
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [newMessagesWhileScrolled, setNewMessagesWhileScrolled] = useState(0);
  const isNearBottomRef = useRef(true);

  // Toast Notice
  const [toastError, setToastError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const isPrependingRef = useRef<boolean>(false);
  const previousScrollInfoRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);
  const activeGroupIdRef = useRef<string | null>(activeGroupId);

  // Keep ref in sync with state
  useEffect(() => {
    activeGroupIdRef.current = activeGroupId;
  }, [activeGroupId]);

  const showToast = (msg: string) => {
    setToastError(msg);
    setTimeout(() => setToastError(null), 4500);
  };

  // Load Groups metadata
  const refreshGroupsData = useCallback(async () => {
    const userGroups = getUserAccessibleGroups(
      schoolId,
      userRole,
      userGradeName,
      userClassName,
      teacherAssignedClasses
    );
    setGroups(userGroups);
    setMutedUsers(getMutedUsers(schoolId));

    let currentGroupId = activeGroupIdRef.current;
    if (!currentGroupId || !userGroups.some((g) => g.id === currentGroupId)) {
      if (userGroups.length > 0) {
        currentGroupId = userGroups[0].id;
        setActiveGroupId(currentGroupId);
        activeGroupIdRef.current = currentGroupId;
      } else {
        currentGroupId = null;
        setActiveGroupId(null);
        activeGroupIdRef.current = null;
      }
    }

    // Fetch authoritative server mutes and locks asynchronously
    try {
      const [serverMutes] = await Promise.all([
        fetchMutedUsersApi(schoolId),
        fetchGroupLocksApi(schoolId),
      ]);
      setMutedUsers(serverMutes);
      // Re-read groups to reflect any updated isLocked flags
      const updatedGroups = getUserAccessibleGroups(
        schoolId,
        userRole,
        userGradeName,
        userClassName,
        teacherAssignedClasses
      );
      setGroups(updatedGroups);
    } catch {}
  }, [schoolId, userRole, userGradeName, userClassName, teacherAssignedClasses]);

  // Load authoritative messages from PostgreSQL (Initial 50 latest messages)
  const loadMessages = useCallback(
    async (groupId: string) => {
      setIsLoadingMessages(true);
      setLoadError(null);
      setHasMore(false);
      try {
        const msgs = await fetchCommunityMessagesApi(schoolId, groupId, { limit: 50 });
        setHasMore(Boolean(msgs.hasMore));
        // Deduplicate messages by ID
        const uniqueMap = new Map<string, CommunityMessage>();
        for (const m of msgs) {
          uniqueMap.set(m.id, m);
        }
        setMessages(Array.from(uniqueMap.values()));
      } catch (err: any) {
        const errorMsg = err?.message || 'فشل جلب الرسائل من قاعدة البيانات';
        setLoadError(errorMsg);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [schoolId]
  );

  // Load older historical messages on demand (keyset pagination)
  const loadOlderMessages = async () => {
    if (!activeGroupId || isLoadingOlder || !hasMore || messages.length === 0) return;

    const oldestMessage = messages[0];
    if (!oldestMessage?.createdAt) return;

    setIsLoadingOlder(true);
    try {
      const container = messagesContainerRef.current;
      if (container) {
        previousScrollInfoRef.current = {
          scrollHeight: container.scrollHeight,
          scrollTop: container.scrollTop,
        };
        isPrependingRef.current = true;
      }

      const res = await fetchCommunityMessagesApi(schoolId, activeGroupId, {
        limit: 50,
        before: oldestMessage.createdAt,
      });

      setHasMore(Boolean(res.hasMore));

      if (res.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newUnique = res.filter((m) => !existingIds.has(m.id));
          const combined = [...newUnique, ...prev];
          combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          return combined;
        });
      } else {
        isPrependingRef.current = false;
        previousScrollInfoRef.current = null;
      }
    } catch (err: any) {
      isPrependingRef.current = false;
      previousScrollInfoRef.current = null;
      showToast(err?.message || 'فشل تحميل الرسائل السابقة');
    } finally {
      setIsLoadingOlder(false);
    }
  };

  // Preserve scroll position when older messages are prepended
  useLayoutEffect(() => {
    if (isPrependingRef.current && messagesContainerRef.current && previousScrollInfoRef.current) {
      const container = messagesContainerRef.current;
      const scrollDelta = container.scrollHeight - previousScrollInfoRef.current.scrollHeight;
      container.scrollTop = previousScrollInfoRef.current.scrollTop + scrollDelta;
      isPrependingRef.current = false;
      previousScrollInfoRef.current = null;
    }
  }, [messages]);

  useEffect(() => {
    refreshGroupsData();
    const handleCustomDataChange = () => refreshGroupsData();
    window.addEventListener('community_data_changed', handleCustomDataChange);
    window.addEventListener('school_data_changed', handleCustomDataChange);
    return () => {
      window.removeEventListener('community_data_changed', handleCustomDataChange);
      window.removeEventListener('school_data_changed', handleCustomDataChange);
    };
  }, [refreshGroupsData]);

  // Instantly reflect real-time avatar/theme updates across rendered messages
  useEffect(() => {
    const handleAvatarUpdated = (e: any) => {
      if (e.detail?.themeId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === userId ? { ...m, senderAvatar: e.detail.themeId } : m
          )
        );
      }
    };
    window.addEventListener('student_avatar_updated', handleAvatarUpdated);
    return () => window.removeEventListener('student_avatar_updated', handleAvatarUpdated);
  }, [userId]);

  // Load messages & subscribe to live SSE real-time events on activeGroupId changes
  useEffect(() => {
    if (!activeGroupId) {
      setMessages([]);
      return;
    }

    loadMessages(activeGroupId);

    // Subscribe to SSE real-time events for instant cross-device delivery
    const unsubscribe = subscribeToCommunityEvents(schoolId, activeGroupId, (event) => {
      if (event.type === 'new_message' && event.message) {
        const incoming = event.message;
        if (incoming.communityId === activeGroupIdRef.current) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) {
              return prev.map((m) => (m.id === incoming.id ? incoming : m));
            }
            return [...prev, incoming];
          });
        }

        // Update last message snippet in the groups list
        setGroups((prevGroups) =>
          prevGroups.map((g) => {
            if (g.id === incoming.communityId) {
              return {
                ...g,
                lastMessage: `${incoming.senderName.split(' ')[0]}: ${incoming.message.substring(0, 40)}`,
                lastMessageTime: incoming.formattedTime,
              };
            }
            return g;
          })
        );
      } else if (event.type === 'update_message' && event.message) {
        const updated = event.message;
        if (updated.communityId === activeGroupIdRef.current) {
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        }
      } else if (event.type === 'delete_message' && event.messageId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === event.messageId
              ? { ...m, isDeleted: true, message: event.data?.message || 'تم حذف هذه الرسالة' }
              : m
          )
        );
      } else if (
        event.type === 'user_muted' ||
        event.type === 'user_unmuted' ||
        event.type === 'group_lock_toggled'
      ) {
        refreshGroupsData();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [schoolId, activeGroupId, loadMessages, refreshGroupsData]);

  // Scroll handler for tracking if user is near bottom
  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isFar = distanceFromBottom > 140;
    setShowScrollBottom(isFar);
    isNearBottomRef.current = !isFar;
    if (!isFar) {
      setNewMessagesWhileScrolled(0);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
    setNewMessagesWhileScrolled(0);
    isNearBottomRef.current = true;
  };

  // Scroll to bottom when messages update (unless prepending older historical messages or user is scrolled up)
  useEffect(() => {
    if (!isPrependingRef.current) {
      if (isNearBottomRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        setNewMessagesWhileScrolled((prev) => prev + 1);
      }
    }
  }, [messages]);

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];
  const pinnedMessage = messages.find((m) => m.isPinned && !m.isDeleted) || null;
  const isCurrentMuted = activeGroupId ? isUserMuted(schoolId, activeGroupId, userId) : false;

  // Handlers
  const handleSelectGroup = (groupId: string) => {
    setActiveGroupId(groupId);
    activeGroupIdRef.current = groupId;
    setShowMobileChat(true);
    setReplyingMessage(null);
    setEditingMessage(null);
    setShowScrollBottom(false);
    setNewMessagesWhileScrolled(0);
    isNearBottomRef.current = true;
    loadMessages(groupId);
  };

  const handleSendMessage = async (text: string): Promise<boolean> => {
    if (!activeGroupId) return false;

    setIsSending(true);
    try {
      if (editingMessage) {
        // Edit message - strictly restricted to school administration
        if (userRole !== 'admin' && userRole !== 'owner') {
          showToast('تعديل الرسائل مقتصر على حساب إدارة المدرسة فقط.');
          setEditingMessage(null);
          return false;
        }

        // Edit mode in PostgreSQL
        const updated = await editCommunityMessageApi(
          schoolId,
          editingMessage.id,
          text,
          userId,
          userRole
        );
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        setEditingMessage(null);
        return true;
      } else {
        // Send new message to PostgreSQL
        const saved = await sendCommunityMessageApi(
          schoolId,
          activeGroupId,
          {
            id: userId,
            name: userName,
            role: userRole === 'owner' ? 'admin' : userRole === 'parent' ? 'student' : userRole,
            badge: userBadge,
          },
          text,
          'text',
          replyingMessage
            ? {
                replyTo: {
                  id: replyingMessage.id,
                  senderName: replyingMessage.senderName,
                  message: replyingMessage.message,
                },
              }
            : undefined
        );

        setMessages((prev) => {
          if (prev.some((m) => m.id === saved.id)) return prev;
          return [...prev, saved];
        });
        setReplyingMessage(null);
        scrollToBottom();
        return true;
      }
    } catch (err: any) {
      showToast(err?.message || 'فشل إرسال الرسالة إلى قاعدة البيانات، يرجى إعادة المحاولة.');
      return false; // Tells TypingArea not to clear input so user can retry!
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    // Delete message - strictly restricted to school administration
    if (userRole !== 'admin' && userRole !== 'owner') {
      showToast('حذف الرسائل مقتصر على حساب إدارة المدرسة فقط.');
      return;
    }

    try {
      await deleteCommunityMessageApi(schoolId, messageId, userId, userRole);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, message: 'تم حذف هذه الرسالة' } : m
        )
      );
    } catch (err: any) {
      showToast(err?.message || 'تعذر حذف الرسالة على الخادم');
    }
  };

  const handlePinMessage = async (messageId: string) => {
    if (!activeGroupId) return;
    const targetMsg = messages.find((m) => m.id === messageId);
    const willBePinned = !targetMsg?.isPinned;
    try {
      await pinCommunityMessageApi(schoolId, activeGroupId, messageId, willBePinned);
      setMessages((prev) =>
        prev.map((m) => ({
          ...m,
          isPinned: m.id === messageId ? willBePinned : false,
        }))
      );
    } catch (err: any) {
      showToast(err?.message || 'تعذر تثبيت الرسالة');
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    const targetMsg = messages.find((m) => m.id === messageId);
    if (!targetMsg) return;
    try {
      const updatedReactions = await toggleMessageReactionApi(
        schoolId,
        messageId,
        targetMsg.reactions || {},
        emoji,
        userId
      );
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions: updatedReactions } : m))
      );
    } catch (err: any) {
      showToast(err?.message || 'فشل تسجيل التفاعل');
    }
  };

  const handleVotePoll = async (messageId: string, optionId: string) => {
    const targetMsg = messages.find((m) => m.id === messageId);
    if (!targetMsg || !targetMsg.poll) return;
    try {
      const updatedPoll = await voteInPollApi(
        schoolId,
        messageId,
        targetMsg.poll,
        optionId,
        userId
      );
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, poll: updatedPoll } : m))
      );
    } catch (err: any) {
      showToast(err?.message || 'فشل تسجيل التصويت');
    }
  };

  const handleToggleEventCalendar = async (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (msg && msg.type === 'event' && msg.event) {
      setEventCalendarModalMessage(msg);
    } else {
      if (!msg?.event) return;
      try {
        const { isAdded, event } = await toggleEventCalendarApi(
          schoolId,
          messageId,
          msg.event,
          userId
        );
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, event } : m))
        );
        if (isAdded) {
          showToast('تمت إضافة المناسبة المدرسية إلى تقويمك بنجاح 📅');
        }
      } catch (err: any) {
        showToast(err?.message || 'فشل تحديث المناسبة في قاعدة البيانات');
      }
    }
  };

  const handleCreatePollSubmit = async (question: string, options: string[]) => {
    if (!activeGroupId) return;
    try {
      const saved = await sendCommunityMessageApi(
        schoolId,
        activeGroupId,
        {
          id: userId,
          name: userName,
          role: userRole === 'owner' ? 'admin' : userRole === 'parent' ? 'student' : userRole,
          badge: userBadge || 'معلم',
        },
        question,
        'poll',
        {
          poll: {
            question,
            options: options.map((opt, i) => ({ id: `opt-${i}-${Date.now()}`, text: opt, votes: [] })),
            totalVotes: 0,
          },
        }
      );
      setMessages((prev) => {
        if (prev.some((m) => m.id === saved.id)) return prev;
        return [...prev, saved];
      });
    } catch (err: any) {
      showToast(err?.message || 'فشل نشر الاستطلاع في قاعدة البيانات');
    }
  };

  const handleCreateEventSubmit = async (title: string, date: string, time: string, location?: string) => {
    if (!activeGroupId) return;
    try {
      const saved = await sendCommunityMessageApi(
        schoolId,
        activeGroupId,
        {
          id: userId,
          name: userName,
          role: userRole === 'owner' ? 'admin' : userRole === 'parent' ? 'student' : userRole,
          badge: userBadge || 'إدارة المدرسة',
        },
        title,
        'event',
        {
          event: {
            title,
            date,
            time,
            location,
            attendees: [],
          },
        }
      );
      setMessages((prev) => {
        if (prev.some((m) => m.id === saved.id)) return prev;
        return [...prev, saved];
      });
    } catch (err: any) {
      showToast(err?.message || 'فشل نشر الفعالية في قاعدة البيانات');
    }
  };

  const handleCreateAdSubmit = async (title: string, content: string, isPinned = true) => {
    if (!activeGroupId) return;
    try {
      const fullText = `📢 [إعلان هام]: ${title}\n\n${content}`;
      const saved = await sendCommunityMessageApi(
        schoolId,
        activeGroupId,
        {
          id: userId,
          name: userName,
          role: userRole === 'owner' ? 'admin' : userRole === 'parent' ? 'student' : userRole,
          badge: userBadge || 'إدارة المدرسة',
        },
        fullText,
        'announcement',
        undefined
      );
      if (isPinned && saved.id) {
        try {
          await pinCommunityMessageApi(schoolId, activeGroupId, saved.id, true);
          saved.isPinned = true;
        } catch {}
      }
      setMessages((prev) => {
        if (prev.some((m) => m.id === saved.id)) return prev;
        return [...prev, saved];
      });
      showToast('تم نشر الإعلان الرسمي في المجتمع بنجاح 📢');
      scrollToBottom();
    } catch (err: any) {
      showToast(err?.message || 'فشل نشر الإعلان في قاعدة البيانات');
    }
  };

  const handleToggleLockGroup = async () => {
    if (!activeGroupId) return;
    try {
      const locked = await toggleGroupLock(schoolId, activeGroupId);
      showToast(locked ? 'تم إغلاق المحادثة في هذا المجتمع' : 'تم فتح المحادثة للجميع');
      refreshGroupsData();
    } catch (err: any) {
      showToast(err?.message || 'تعذر تغيير حالة قفل المحادثة على الخادم');
    }
  };

  const handleToggleMuteUser = async (targetUserId: string, targetUserName: string) => {
    if (!activeGroupId) return;
    try {
      const isMutedNow = await toggleUserMute(
        schoolId,
        activeGroupId,
        targetUserId,
        targetUserName,
        userName
      );
      showToast(isMutedNow ? `تم كتم صوت ${targetUserName}` : `تم إلغاء كتم ${targetUserName}`);
      refreshGroupsData();
    } catch (err: any) {
      showToast(err?.message || 'تعذر تحديث حالة الكتم على الخادم');
    }
  };

  // Deduplicate and filter messages by search inside chat
  const uniqueMessagesMap = new Map<string, CommunityMessage>();
  for (const m of messages) {
    if (m && m.id) {
      uniqueMessagesMap.set(m.id, m);
    }
  }
  const deduplicatedMessages = Array.from(uniqueMessagesMap.values());

  const filteredMessages = deduplicatedMessages.filter((m) => {
    if (!chatSearchQuery.trim()) return true;
    const q = chatSearchQuery.toLowerCase();
    return (
      m.message.toLowerCase().includes(q) ||
      m.senderName.toLowerCase().includes(q)
    );
  });

  if (!activeGroup) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-8 text-center text-slate-400 dir-rtl">
        <MessageSquare className="w-12 h-12 stroke-1 text-slate-300 mx-auto mb-2" />
        <p className="font-bold text-sm">جاري تحميل المجتمعات المدرسية...</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 sm:min-h-[500px] max-w-7xl mx-auto rounded-none sm:rounded-2xl border-0 sm:border border-slate-200/90 shadow-xs bg-slate-50 overflow-hidden flex dir-rtl select-none relative">
      {/* Toast Alert Banner */}
      {toastError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl z-50 text-xs font-bold flex items-center gap-2 animate-bounce">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastError}</span>
        </div>
      )}

      {/* Sidebar Communities List */}
      <CommunityList
        groups={groups}
        activeGroupId={activeGroup.id}
        onSelectGroup={handleSelectGroup}
        userRole={userRole}
        onBack={onBack}
        className={`w-full md:w-80 lg:w-96 shrink-0 ${
          showMobileChat ? 'hidden md:flex' : 'flex'
        }`}
      />

      {/* Chat Interface Main Area */}
      <div
        className={`flex-1 flex flex-col h-full bg-[#F8FAFC] min-w-0 ${
          showMobileChat ? 'flex' : 'hidden md:flex'
        }`}
      >
        {/* Mobile Top Back Button */}
        <div className="md:hidden bg-slate-900 text-white p-2.5 flex items-center gap-2 text-xs font-bold">
          <button
            onClick={() => setShowMobileChat(false)}
            className="p-1 text-white hover:bg-white/10 rounded-lg flex items-center gap-1 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>الرجوع للمجتمعات</span>
          </button>
        </div>

        {/* Chat Header */}
        <CommunityHeader
          group={activeGroup}
          pinnedMessage={pinnedMessage}
          userRole={userRole}
          onSearchToggle={() => setIsSearchingInChat(!isSearchingInChat)}
          isSearching={isSearchingInChat}
          searchQuery={chatSearchQuery}
          onSearchChange={setChatSearchQuery}
          onOpenModerationModal={() => setIsModerationModalOpen(true)}
          onOpenCreatePoll={() => setIsCreatePollOpen(true)}
          onOpenCreateEvent={() => setIsCreateEventOpen(true)}
          onToggleLockGroup={handleToggleLockGroup}
        />

        {/* Loading / Error / Messages Container */}
        <div
          ref={messagesContainerRef}
          onScroll={handleMessagesScroll}
          className="flex-1 overflow-y-auto px-2.5 sm:px-4 py-2 space-y-1.5 bg-[#F8FAFC] relative overscroll-contain"
        >
          {/* Load Older Messages Button */}
          {hasMore && !isLoadingMessages && (
            <div className="flex justify-center py-2">
              <button
                type="button"
                onClick={loadOlderMessages}
                disabled={isLoadingOlder}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-60 text-xs font-semibold rounded-full border border-slate-200 transition-colors shadow-xs cursor-pointer"
              >
                {isLoadingOlder ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    <span>جاري تحميل الرسائل السابقة...</span>
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                    <span>تحميل الرسائل السابقة</span>
                  </>
                )}
              </button>
            </div>
          )}

          {isLoadingMessages && messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-xs font-bold">جاري تحميل الرسائل من قاعدة البيانات المركزية...</p>
            </div>
          ) : loadError ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl max-w-md shadow-xs space-y-3">
                <div className="flex items-center justify-center gap-2 font-bold text-xs">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <span>خطأ في تحميل الرسائل</span>
                </div>
                <p className="text-[11px] text-red-600/90">{loadError}</p>
                <button
                  onClick={() => activeGroupId && loadMessages(activeGroupId)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>إعادة المحاولة الآن</span>
                </button>
              </div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
              <MessageSquare className="w-12 h-12 stroke-1 text-slate-300" />
              <p className="text-xs font-bold text-slate-600">
                {chatSearchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد رسائل في هذا المجتمع بعد'}
              </p>
              <p className="text-[11px] text-slate-400">كن أول من يبدأ النقاش التعليمي الآمن!</p>
            </div>
          ) : (
            filteredMessages.map((msg, idx) => (
              <MessageBubble
                key={msg.id ? `${msg.id}` : `msg-idx-${idx}`}
                message={msg}
                currentUserId={userId}
                currentUserRole={userRole}
                onReply={(m) => {
                  setReplyingMessage(m);
                  setEditingMessage(null);
                }}
                onEdit={(m) => {
                  setEditingMessage(m);
                  setReplyingMessage(null);
                }}
                onDelete={handleDeleteMessage}
                onPin={handlePinMessage}
                onToggleReaction={handleToggleReaction}
                onVotePoll={handleVotePoll}
                onToggleEventCalendar={handleToggleEventCalendar}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Scroll to Bottom Button */}
        {showScrollBottom && (
          <div className="absolute bottom-24 sm:bottom-28 left-4 sm:left-6 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto">
            <button
              type="button"
              onClick={scrollToBottom}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/95 hover:bg-white text-blue-600 border border-blue-200 shadow-xl backdrop-blur-md rounded-full transition-all duration-200 transform active:scale-95 cursor-pointer text-xs font-bold"
              title="الانتقال إلى آخر رسالة"
            >
              <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
              </div>
              <span>آخر رسالة</span>
              {newMessagesWhileScrolled > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-xs animate-pulse">
                  +{newMessagesWhileScrolled}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Typing Input Bar (Keyboard-Safe) */}
        <TypingArea
          onSendMessage={handleSendMessage}
          replyingToMessage={replyingMessage}
          onCancelReply={() => setReplyingMessage(null)}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
          isMuted={isCurrentMuted}
          isLocked={activeGroup.isLocked}
          userRole={userRole}
          isSending={isSending}
          onOpenCreatePoll={
            userRole === 'admin' || userRole === 'owner' || userRole === 'teacher'
              ? () => setIsCreatePollOpen(true)
              : undefined
          }
          onOpenCreateAd={
            userRole === 'admin' || userRole === 'owner' || userRole === 'teacher'
              ? () => setIsCreateAdOpen(true)
              : undefined
          }
        />
      </div>

      {/* Moderation Details Modal */}
      <CommunityModerationModal
        isOpen={isModerationModalOpen}
        onClose={() => setIsModerationModalOpen(false)}
        group={activeGroup}
        userRole={userRole}
        mutedUsers={mutedUsers}
        onToggleLockGroup={handleToggleLockGroup}
        onToggleMuteUser={handleToggleMuteUser}
        onOpenCreatePoll={() => setIsCreatePollOpen(true)}
        onOpenCreateEvent={() => setIsCreateEventOpen(true)}
      />

      {/* Create Poll Modal */}
      <CreatePollModal
        isOpen={isCreatePollOpen}
        onClose={() => setIsCreatePollOpen(false)}
        onSubmitPoll={handleCreatePollSubmit}
      />

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateEventOpen}
        onClose={() => setIsCreateEventOpen(false)}
        onSubmitEvent={handleCreateEventSubmit}
      />

      {/* Create Ad / Announcement Modal */}
      <CreateAdModal
        isOpen={isCreateAdOpen}
        onClose={() => setIsCreateAdOpen(false)}
        onSubmitAd={handleCreateAdSubmit}
      />

      {/* Temporary Monthly Event Calendar Picker Modal */}
      <EventCalendarPickerModal
        isOpen={eventCalendarModalMessage !== null}
        onClose={() => setEventCalendarModalMessage(null)}
        schoolId={schoolId}
        userId={userId}
        userRole={userRole}
        message={eventCalendarModalMessage}
        onSuccess={(addedDateStr) => {
          showToast(`تمت إضافة الفعالية المدرسية إلى التقويم بتاريخ ${addedDateStr} بنجاح 📅`);
          if (activeGroupId) loadMessages(activeGroupId);
        }}
      />
    </div>
  );
}

