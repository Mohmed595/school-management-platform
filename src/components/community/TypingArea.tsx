import React, { useState, useEffect, useRef } from 'react';
import { CommunityMessage } from '../../types/community';
import { Send, Smile, X, Lock, MicOff, MoreVertical, BarChart2, Megaphone } from 'lucide-react';

interface TypingAreaProps {
  onSendMessage: (text: string) => Promise<boolean | void> | void;
  replyingToMessage: CommunityMessage | null;
  onCancelReply: () => void;
  editingMessage: CommunityMessage | null;
  onCancelEdit: () => void;
  isMuted: boolean;
  isLocked: boolean;
  userRole: 'student' | 'teacher' | 'admin' | 'owner' | 'parent';
  isSending?: boolean;
  onOpenCreatePoll?: () => void;
  onOpenCreateAd?: () => void;
}

const EMOJI_LIST = [
  '😊', '👍', '❤️', '👏', '🎉', '🔥', '😮', '📚', '✍️', '💡', '🏆', '💯', '🙏', '🙌', '⭐', '✨'
];

/**
 * Wraps text so no single line exceeds maxCharsPerLine (default 30 chars)
 * and limits total lines to maxTotalLines (default 12 lines).
 */
function wrapTextByLineLimit(input: string, maxCharsPerLine = 30, maxTotalLines = 12): string {
  const lines = input.split('\n');
  const formattedLines: string[] = [];

  for (const line of lines) {
    if (formattedLines.length >= maxTotalLines) break;

    if (line.length <= maxCharsPerLine) {
      formattedLines.push(line);
    } else {
      const words = line.split(' ');
      let currentLine = '';

      for (const word of words) {
        if (formattedLines.length >= maxTotalLines) break;

        if (word.length > maxCharsPerLine) {
          if (currentLine) {
            formattedLines.push(currentLine);
            currentLine = '';
          }
          for (let i = 0; i < word.length; i += maxCharsPerLine) {
            if (formattedLines.length >= maxTotalLines) break;
            formattedLines.push(word.slice(i, i + maxCharsPerLine));
          }
        } else if (!currentLine) {
          currentLine = word;
        } else if (currentLine.length + 1 + word.length <= maxCharsPerLine) {
          currentLine += ' ' + word;
        } else {
          formattedLines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine && formattedLines.length < maxTotalLines) {
        formattedLines.push(currentLine);
      }
    }
  }

  return formattedLines.join('\n');
}

export function TypingArea({
  onSendMessage,
  replyingToMessage,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  isMuted,
  isLocked,
  userRole,
  isSending = false,
  onOpenCreatePoll,
  onOpenCreateAd,
}: TypingAreaProps) {
  const [text, setText] = useState(editingMessage ? editingMessage.message : '');
  const [showEmojiPalette, setShowEmojiPalette] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Sync text if editingMessage changes
  useEffect(() => {
    if (editingMessage) {
      setText(wrapTextByLineLimit(editingMessage.message, 30, 12));
    }
  }, [editingMessage]);

  // Auto resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 110)}px`;
    }
  }, [text]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);

  // Keyboard-Safe: listen to visualViewport resize (on mobile virtual keyboard toggle)
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleViewportChange = () => {
      if (document.activeElement === textareaRef.current) {
        setTimeout(() => {
          textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 150);
      }
    };

    vv.addEventListener('resize', handleViewportChange);
    vv.addEventListener('scroll', handleViewportChange);
    return () => {
      vv.removeEventListener('resize', handleViewportChange);
      vv.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  const isDisabled = isMuted || (isLocked && userRole === 'student');

  const handleFocus = () => {
    setShowMoreMenu(false);
    setShowEmojiPalette(false);
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 250);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isDisabled || isSubmitting || isSending) return;
    setIsSubmitting(true);
    try {
      const res = await onSendMessage(text.trim());
      if (res !== false) {
        setText('');
        setShowEmojiPalette(false);
        setShowMoreMenu(false);
      }
    } catch {
      // Keep input text so user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift + Enter: allow new line unless 12 lines limit reached
        const linesCount = text.split('\n').length;
        if (linesCount >= 12) {
          e.preventDefault();
        }
      } else {
        // Plain Enter: submit form
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const formatted = wrapTextByLineLimit(e.target.value, 30, 12);
    setText(formatted);
  };

  const handleEmojiClick = (emoji: string) => {
    setText((prev) => wrapTextByLineLimit(prev + emoji, 30, 12));
    setShowEmojiPalette(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  if (isDisabled) {
    return (
      <div className="bg-amber-50 border-t border-amber-200 p-3 sm:p-4 dir-rtl text-center text-xs font-bold text-amber-900 select-none flex items-center justify-center gap-2 sticky bottom-0 z-20 shrink-0">
        {isMuted ? (
          <>
            <MicOff className="w-4 h-4 text-amber-700" />
            <span>عفواً، تم كتم صوتك في هذا المجتمع بواسطة إدارة المدرسة.</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 text-amber-700" />
            <span>المجتمع مغلق حالياً للتعليقات بواسطة الإدارة.</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="bg-white border-t border-slate-200/90 px-2.5 py-2 sm:px-4 sm:py-2.5 dir-rtl select-none sticky bottom-0 z-20 shrink-0 min-h-[52px] flex flex-col justify-center"
    >
      {/* Reply Banner */}
      {replyingToMessage && !editingMessage && (
        <div className="mb-2 p-2 bg-blue-50 border-r-4 border-blue-600 rounded-xl flex items-center justify-between text-xs animate-fade-in">
          <div className="min-w-0">
            <span className="font-extrabold text-blue-800">جاري الرد على {replyingToMessage.senderName}:</span>
            <p className="text-slate-600 truncate font-medium">{replyingToMessage.message}</p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editing Banner */}
      {editingMessage && (
        <div className="mb-2 p-2 bg-amber-50 border-r-4 border-amber-500 rounded-xl flex items-center justify-between text-xs animate-fade-in">
          <div>
            <span className="font-extrabold text-amber-900">تعديل الرسالة المحددة</span>
          </div>
          <button
            onClick={() => {
              onCancelEdit();
              setText('');
            }}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Fast Palette Popover */}
      {showEmojiPalette && (
        <div className="absolute bottom-full mb-2 right-2 sm:right-4 bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 shadow-xl grid grid-cols-8 gap-1 z-40 animate-fade-in max-w-[280px] sm:max-w-none">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-xl text-base sm:text-lg transition-transform hover:scale-125 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Form Bar (Keyboard-Safe) */}
      <form onSubmit={handleSubmit} className="flex items-end gap-1.5 sm:gap-2 relative">
        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder="اكتب رسالة... (Shift + Enter للسطر الجديد)"
          rows={1}
          className="flex-1 bg-slate-100/90 border border-slate-200/90 rounded-2xl px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all dir-rtl resize-none min-h-[40px] max-h-[110px] leading-relaxed scrollbar-thin"
        />

        {/* 3 Dots Button (Right to Emoji Button in RTL) */}
        {(onOpenCreatePoll || onOpenCreateAd) && (
          <div ref={moreMenuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowMoreMenu(!showMoreMenu);
                setShowEmojiPalette(false);
              }}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                showMoreMenu
                  ? 'bg-blue-50 text-blue-600 border-blue-200 ring-2 ring-blue-100'
                  : 'text-slate-500 hover:bg-slate-100 border-slate-200 bg-slate-50'
              }`}
              title="خيارات إضافية (استطلاع / إعلان)"
            >
              <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* 3 Dots Popover Menu: Poll and AD */}
            {showMoreMenu && (
              <div className="absolute bottom-full mb-2 right-0 bg-white border border-slate-200/95 rounded-2xl p-1.5 shadow-2xl min-w-[170px] z-50 animate-fade-in flex flex-col gap-1">
                {onOpenCreatePoll && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      onOpenCreatePoll();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer text-right group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                      <BarChart2 className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="font-extrabold text-slate-900 group-hover:text-blue-700">استطلاع رأي</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Poll</span>
                    </div>
                  </button>
                )}

                {onOpenCreateAd && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      onOpenCreateAd();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer text-right group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="font-extrabold text-slate-900 group-hover:text-amber-700">إعلان رسمي</span>
                      <span className="text-[10px] text-slate-400 font-semibold">AD</span>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => {
            setShowEmojiPalette(!showEmojiPalette);
            setShowMoreMenu(false);
          }}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
            showEmojiPalette
              ? 'bg-blue-50 text-blue-600 border-blue-200'
              : 'text-slate-500 hover:bg-slate-100 border-slate-200 bg-slate-50'
          }`}
          title="إيموجي"
        >
          <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Send Button: Blue Circle */}
        <button
          type="submit"
          disabled={!text.trim() || isSubmitting || isSending}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all shadow-2xs shrink-0 cursor-pointer ${
            text.trim() && !isSubmitting && !isSending
              ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
              : 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200'
          }`}
          title="إرسال"
        >
          <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5 rotate-180" />
        </button>
      </form>
    </div>
  );
}
