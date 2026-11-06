import React, { useState, useRef, useEffect } from 'react';
import { CommunityMessage } from '../../types/community';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { getUserAvatarLayoutUid } from '../../lib/avatarLayouts';
import { SafeMessageText } from './SafeMessageText';
import {
  MoreVertical,
  Reply,
  Edit2,
  Trash2,
  Pin,
  Calendar,
  BarChart2,
  ShieldAlert,
  CalendarPlus,
} from 'lucide-react';

interface MessageBubbleProps {
  key?: React.Key;
  message: CommunityMessage;
  currentUserId: string;
  currentUserRole: 'student' | 'teacher' | 'admin' | 'owner' | 'parent';
  onReply: (msg: CommunityMessage) => void;
  onEdit: (msg: CommunityMessage) => void;
  onDelete: (messageId: string) => void;
  onPin: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onVotePoll: (messageId: string, optionId: string) => void;
  onToggleEventCalendar: (messageId: string) => void;
}

const EMOJI_PALETTE = ['👍', '❤️', '😂', '🎉', '🔥', '😮', '😢', '👏'];

export function MessageBubble({
  message,
  currentUserId,
  currentUserRole,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onToggleReaction,
  onVotePoll,
  onToggleEventCalendar,
}: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [liveTheme, setLiveTheme] = useState<string | null>(null);

  // Mobile Drag-to-Reply & Hold-to-React State
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasHaptickedRef = useRef(false);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
        setIsSelected(false);
      }
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(e.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    if (showEmojiPicker || showMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showEmojiPicker, showMenu]);

  // Touch handlers for WhatsApp-like 3/4s hold (750ms) to React & Drag Left-to-Right to Reply
  const handleTouchStart = (e: React.TouchEvent) => {
    if (message.isDeleted) return;
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    hasHaptickedRef.current = false;

    // Start 3/4 second (750ms) hold timer for emoji reaction
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setShowEmojiPicker(true);
      setIsSelected(true);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(40);
        } catch {}
      }
    }, 750);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current || message.isDeleted) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartPosRef.current.x;
    const deltaY = touch.clientY - touchStartPosRef.current.y;

    // If movement is detected, cancel the long press timer
    if (Math.hypot(deltaX, deltaY) > 8 && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Drag from left to right (deltaX > 0)
    if (deltaX > 5 && deltaX > Math.abs(deltaY) * 0.8) {
      setIsDragging(true);
      const clamped = Math.min(Math.max(0, deltaX * 0.65), 75);
      setDragX(clamped);

      // Trigger light haptic when reaching reply activation threshold (45px)
      if (clamped >= 45 && !hasHaptickedRef.current) {
        hasHaptickedRef.current = true;
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(30);
          } catch {}
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (dragX >= 45 && !message.isDeleted) {
      onReply(message);
    }

    setIsDragging(false);
    setDragX(0);
    touchStartPosRef.current = null;
  };

  const isOwnMessage = message.senderId === currentUserId;
  const isAdminOrOwner = currentUserRole === 'admin' || currentUserRole === 'owner';
  const isTeacher = currentUserRole === 'teacher';

  useEffect(() => {
    if (!isOwnMessage) return;
    const handleAvatarUpdated = (e: any) => {
      if (e.detail?.themeId) {
        setLiveTheme(e.detail.themeId);
      }
    };
    window.addEventListener('student_avatar_updated', handleAvatarUpdated);
    return () => window.removeEventListener('student_avatar_updated', handleAvatarUpdated);
  }, [isOwnMessage]);

  // Restrict Edit and Delete strictly to school administration
  const canEdit = !message.isDeleted && isAdminOrOwner;
  const canDelete = !message.isDeleted && isAdminOrOwner;
  const canPin = !message.isDeleted && (isTeacher || isAdminOrOwner);

  return (
    <div
      className={`group w-full flex items-start gap-2 my-1.5 dir-rtl select-none relative ${
        isOwnMessage
          ? 'justify-start animate-msg-send'
          : 'justify-end animate-msg-receive'
      }`}
    >
      {/* For My Messages: Avatar is rendered FIRST in RTL DOM -> displays on the FAR RIGHT */}
      {isOwnMessage && (
        <AvatarDisplay
          layoutUid={liveTheme || message.senderAvatar || getUserAvatarLayoutUid(message.senderId)}
          name={message.senderName}
          size="sm"
          className="mt-0.5 shadow-2xs shrink-0"
        />
      )}

      {/* Main Bubble Container & Actions Flex Wrapper with Swipe-to-Reply Dragging */}
      <div
        className={`relative flex items-center gap-1.5 max-w-[88%] sm:max-w-[75%] lg:max-w-[65%] ${
          isOwnMessage ? 'flex-row' : 'flex-row-reverse'
        }`}
      >
        {/* Swipe-to-reply Animated Icon (Shows on mobile when swiping left-to-right) */}
        {dragX > 0 && !message.isDeleted && (
          <div
            className="absolute -left-10 z-10 flex items-center justify-center transition-all pointer-events-none"
            style={{
              opacity: Math.min(1, dragX / 35),
              transform: `scale(${Math.min(1.2, Math.max(0.4, dragX / 40))}) rotate(${Math.min(
                0,
                -90 + (dragX / 45) * 90
              )}deg)`,
            }}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-colors ${
                dragX >= 45 ? 'bg-blue-600 text-white scale-110' : 'bg-blue-100 text-blue-700'
              }`}
            >
              <Reply className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Bubble Box with Sender Meta and Content */}
        <div
          className={`min-w-[60px] flex flex-col relative min-w-0 ${
            isOwnMessage ? 'items-start' : 'items-end'
          }`}
          style={{
            transform: `translateX(${dragX}px)`,
            transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
            touchAction: 'pan-y',
          }}
        >
          {/* Top Sender Meta Row (Shown for other users) */}
          {!isOwnMessage && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold mb-0.5 px-1">
              <span className="text-slate-900 font-extrabold">{message.senderName}</span>
              {message.senderBadge && (
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[9px] font-extrabold border ${
                    message.senderRole === 'admin'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : message.senderRole === 'teacher'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {message.senderBadge}
                </span>
              )}
            </div>
          )}

          {/* Reply Quote Block if exists */}
          {message.replyTo && !message.isDeleted && (
            <div className="bg-slate-100/90 border-r-4 border-blue-500 rounded-lg p-1.5 mb-1 text-xs text-slate-700 w-full">
              <span className="font-extrabold text-blue-700 text-[11px]">
                رداً على {message.replyTo.senderName}:
              </span>
              <p className="truncate text-[11px] font-medium text-slate-600">
                <SafeMessageText text={message.replyTo.message} isOwnMessage={false} />
              </p>
            </div>
          )}

          {/* WhatsApp-Style Floating Reaction Dock (Triggered on 3/4s hold on mobile or emoji click) */}
          {showEmojiPicker && !message.isDeleted && (
            <div
              ref={emojiPickerRef}
              className={`absolute -top-11 z-40 bg-white/95 backdrop-blur-md px-2 py-1 rounded-full shadow-xl border border-slate-200 flex items-center gap-1.5 animate-in fade-in zoom-in-90 duration-150 ${
                isOwnMessage ? 'right-0' : 'left-0'
              }`}
            >
              {EMOJI_PALETTE.map((emoji) => (
                <button
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleReaction(message.id, emoji);
                    setShowEmojiPicker(false);
                    setIsSelected(false);
                  }}
                  className="p-1 hover:bg-slate-100 rounded-full text-base sm:text-lg transition-transform hover:scale-130 active:scale-140 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Main Content Bubble Box */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className={`w-fit min-w-[60px] py-1.5 px-2.5 sm:px-3 text-[11px] sm:text-xs leading-snug relative shadow-2xs rounded-[14px] break-words transition-shadow hover:shadow-xs select-none ${
              message.isDeleted
                ? 'bg-slate-100 text-slate-400 italic border border-slate-200'
                : message.type === 'announcement'
                ? 'bg-amber-50/95 border-2 border-amber-300 text-amber-950 font-medium'
                : message.type === 'poll'
                ? 'bg-white border-2 border-blue-200 text-slate-900 shadow-xs'
                : message.type === 'event'
                ? 'bg-emerald-50/90 border-2 border-emerald-300 text-emerald-950'
                : message.type === 'achievement'
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 text-slate-900'
                : isOwnMessage
                ? 'bg-blue-600 text-white font-medium rounded-tr-xs'
                : 'bg-white text-slate-900 font-medium border border-slate-200/90 rounded-tl-xs'
            }`}
          >
            {/* Deleted state text */}
            {message.isDeleted ? (
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <ShieldAlert className="w-4 h-4 text-slate-400" />
                <span>{message.message}</span>
              </div>
            ) : (
              <>
                {/* Type: Pinned Announcement */}
                {message.type === 'announcement' && (
                  <div className="flex items-center gap-1.5 text-amber-800 font-extrabold text-xs mb-1.5 border-b border-amber-200 pb-1">
                    <Pin className="w-3.5 h-3.5 fill-current" />
                    <span>إعلان هام من إدارة المدرسة</span>
                  </div>
                )}

                {/* Type: Achievement Card */}
                {message.type === 'achievement' && message.achievement && (
                  <div className="p-2.5 sm:p-3 bg-white/90 rounded-xl border border-indigo-200 space-y-1.5 text-right my-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl sm:text-2xl">{message.achievement.icon || '🏆'}</span>
                      <div>
                        <span className="text-[10px] sm:text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          إنجاز وسلوك متميز
                        </span>
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 mt-0.5">
                          {message.achievement.badgeTitle}
                        </h4>
                      </div>
                    </div>
                    <p className="text-[11px] sm:text-xs font-bold text-slate-700 leading-snug">
                      تهانينا للطالب/ة <span className="text-blue-700 font-black">{message.achievement.studentName}</span> على هذا التفوق!
                    </p>
                  </div>
                )}

                {/* Type: Quick Poll */}
                {message.type === 'poll' && message.poll && (
                  <div className="space-y-1.5 pt-0.5 min-w-[150px] sm:min-w-[190px] max-w-full">
                    <div className="flex items-center gap-1.5 text-blue-800 font-extrabold text-[11px]">
                      <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>استطلاع رأي تفاعلي</span>
                    </div>
                    <h4 className="font-extrabold text-xs text-slate-900 leading-tight">
                      {message.poll.question}
                    </h4>
                    <div className="space-y-1 mt-1">
                      {message.poll.options.map((option) => {
                        const total = message.poll!.totalVotes || 0;
                        const votesCount = option.votes.length;
                        const percentage = total > 0 ? Math.round((votesCount / total) * 100) : 0;
                        const hasVoted = option.votes.includes(currentUserId);

                        return (
                          <button
                            key={option.id}
                            onClick={() => onVotePoll(message.id, option.id)}
                            className={`w-full text-right p-1.5 px-2 rounded-lg border transition-all cursor-pointer relative overflow-hidden flex items-center justify-between text-xs ${
                              hasVoted
                                ? 'border-blue-500 bg-blue-50/80 font-bold text-blue-900'
                                : 'border-slate-200 hover:border-blue-300 bg-slate-50'
                            }`}
                          >
                            <div
                              className={`absolute top-0 bottom-0 right-0 transition-all duration-300 ${
                                hasVoted ? 'bg-blue-200/60' : 'bg-slate-200/50'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />

                            <div className="relative z-10 flex items-center gap-1.5">
                              <span
                                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] shrink-0 ${
                                  hasVoted
                                    ? 'border-blue-600 bg-blue-600 text-white'
                                    : 'border-slate-400 bg-white'
                                }`}
                              >
                                {hasVoted && '✓'}
                              </span>
                              <span className="text-[11px] font-extrabold">{option.text}</span>
                            </div>

                            <div className="relative z-10 flex items-center gap-1 text-[10px] font-mono font-bold text-slate-600">
                              <span>{percentage}%</span>
                              <span className="text-slate-400">({votesCount})</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="text-[9px] text-slate-400 font-semibold text-left pt-0.5">
                      إجمالي الأصوات: {message.poll.totalVotes}
                    </div>
                  </div>
                )}

                {/* Type: Class Event */}
                {message.type === 'event' && message.event && (
                  <div className="space-y-2 pt-1 min-w-[160px] sm:min-w-[200px] max-w-full">
                    <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span>مناسبة / فعالية مدرسية</span>
                    </div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                      {message.event.title}
                    </h4>
                    <div className="bg-white/80 p-2 rounded-xl border border-emerald-200 text-xs font-bold text-slate-700 space-y-1">
                      <p className="flex items-center gap-1.5">
                        <span className="text-emerald-700">التاريخ:</span> {message.event.date}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <span className="text-emerald-700">الوقت:</span> {message.event.time}
                      </p>
                      {message.event.location && (
                        <p className="flex items-center gap-1.5">
                          <span className="text-emerald-700">المكان:</span> {message.event.location}
                        </p>
                      )}
                    </div>
                    {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
                      <button
                        onClick={() => onToggleEventCalendar(message.id)}
                        className={`w-full py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          message.event.attendees?.includes(currentUserId)
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-100/50'
                        }`}
                      >
                        <CalendarPlus className="w-4 h-4" />
                        {message.event.attendees?.includes(currentUserId)
                          ? 'تمت الإضافة إلى التقويم المدرسي ✓'
                          : '[إضافة إلى التقويم]'}
                      </button>
                    )}
                  </div>
                )}

                {/* Standard Text & Announcement Message */}
                {(message.type === 'text' || message.type === 'announcement') && (() => {
                  const messageText = message.message || '';
                  const lines = messageText.split('\n');
                  const hasMoreThan5Lines = lines.length > 5;
                  const displayedText = (hasMoreThan5Lines && !isExpanded)
                    ? lines.slice(0, 5).join('\n')
                    : messageText;

                  return (
                    <div className="space-y-1">
                      <span className="whitespace-pre-wrap font-medium break-words leading-relaxed block">
                        <SafeMessageText text={displayedText} isOwnMessage={isOwnMessage} />
                      </span>
                      {hasMoreThan5Lines && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded((prev) => !prev);
                          }}
                          className={`mt-1 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all py-0.5 px-2 rounded-md ${
                            isOwnMessage
                              ? 'text-cyan-200 hover:text-white bg-white/10 hover:bg-white/20'
                              : 'text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100'
                          }`}
                        >
                          <span>{isExpanded ? 'إظهار أقل ▲' : 'إظهار المزيد ▼'}</span>
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Bottom Corner Meta: Timestamp & Edit indicator */}
                <div className={`flex items-center justify-end gap-1 mt-1 pt-0.5 text-[10px] font-mono select-none ${
                  isOwnMessage ? 'text-blue-100/80' : 'text-slate-400'
                }`}>
                  {message.editedAt && !message.isDeleted && (
                    <span className="text-[9px] flex items-center gap-0.5 opacity-80">
                      (مُعدَّل)
                    </span>
                  )}
                  <span>{message.formattedTime}</span>
                </div>
              </>
            )}
          </div>

          {/* Emoji Reactions Row (under the bubble) */}
          {message.reactions && Object.keys(message.reactions).length > 0 && !message.isDeleted && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(message.reactions).map(([emoji, userIds]) => {
                if (!userIds || userIds.length === 0) return null;
                const hasReacted = userIds.includes(currentUserId);
                return (
                  <button
                    key={emoji}
                    onClick={() => onToggleReaction(message.id, emoji)}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                      hasReacted
                        ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{emoji}</span>
                    <span className="font-mono text-[10px]">{userIds.length}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Controls Menu & Quick Emoji Trigger (Visible on hover for PC / desktop, or when selected) */}
        {!message.isDeleted && (
          <div
            ref={menuContainerRef}
            className={`flex items-center gap-1 shrink-0 transition-opacity duration-150 z-20 ${
              showEmojiPicker || showMenu || isSelected
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto'
            }`}
          >
            {/* Quick Emoji Reaction Popup Trigger */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                className="p-1 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 text-slate-500 hover:text-slate-800 text-xs cursor-pointer active:scale-95"
                title="إضافة تفاعل"
              >
                😊
              </button>
            </div>

            {/* Reply Button */}
            <button
              onClick={() => onReply(message)}
              className="p-1 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 text-slate-500 hover:text-blue-600 cursor-pointer active:scale-95"
              title="رد"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>

            {/* Options Menu Toggle (Shown if user has administrative or pin permissions) */}
            {(canEdit || canPin || canDelete) && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="p-1 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 text-slate-500 hover:text-slate-800 cursor-pointer active:scale-95"
                  title="خيارات الرسالة"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {/* Context Dropdown */}
                {showMenu && (
                  <div className={`absolute bottom-full mb-1 ${
                    isOwnMessage ? 'right-0' : 'left-0'
                  } bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-36 text-xs font-bold text-slate-700 z-30 animate-fade-in`}>
                    {canEdit && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onEdit(message);
                        }}
                        className="w-full text-right px-3 py-2 hover:bg-slate-100 flex items-center gap-2 text-slate-800 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                        تعديل الرسالة
                      </button>
                    )}
                    {canPin && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onPin(message.id);
                        }}
                        className="w-full text-right px-3 py-2 hover:bg-slate-100 flex items-center gap-2 text-amber-800 cursor-pointer"
                      >
                        <Pin className="w-3.5 h-3.5 text-amber-600" />
                        {message.isPinned ? 'إلغاء التثبيت' : 'تثبيت كـ إعلان'}
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDelete(message.id);
                        }}
                        className="w-full text-right px-3 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف الرسالة
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* For Other User Messages: Avatar is rendered SECOND in RTL DOM -> displays on the FAR LEFT */}
      {!isOwnMessage && (
        <AvatarDisplay
          layoutUid={message.senderAvatar || getUserAvatarLayoutUid(message.senderId)}
          name={message.senderName}
          size="sm"
          className="mt-0.5 shadow-2xs shrink-0"
        />
      )}
    </div>
  );
}
