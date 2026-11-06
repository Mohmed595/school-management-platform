import React, { useState, useMemo } from 'react';
import { ParentPortalData } from '../../../types/parent';
import { Announcement } from '../../../types/admin';
import {
  Megaphone,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  ChevronLeft,
  SlidersHorizontal,
  Search,
  User,
  Clock,
  Bookmark,
  X,
  Check,
  Tag,
  BarChart2,
  MapPin,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Vote,
} from 'lucide-react';
import { formatArabicNumber, isAnnouncementVisibleToRole } from '../../../lib/utils';
import { votePollAnnouncementApi, rsvpEventAnnouncementApi } from '../../../lib/schoolApi';

interface ParentAnnouncementsViewProps {
  data?: { announcements?: Announcement[] } | null;
  announcements?: Announcement[];
  role?: 'student' | 'parent' | 'teacher' | 'attendance_teacher' | 'school_admin' | 'owner' | string;
  schoolId?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onAnnouncementUpdate?: (updated: Announcement) => void;
}

export function ParentAnnouncementsView({
  data,
  announcements: propAnnouncements,
  role,
  schoolId = 'school-1',
  loading = false,
  error = null,
  onRetry,
  onAnnouncementUpdate,
}: ParentAnnouncementsViewProps) {
  const rawAnnouncements = propAnnouncements ?? data?.announcements ?? [];

  const [localAnnouncements, setLocalAnnouncements] = useState<Announcement[]>(rawAnnouncements);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [rsvpingId, setRsvpingId] = useState<string | null>(null);

  React.useEffect(() => {
    setLocalAnnouncements(propAnnouncements ?? data?.announcements ?? []);
  }, [propAnnouncements, data?.announcements]);

  // Real DB announcements strictly without invented fallbacks, filtered by role if specified
  const listToUse = useMemo(() => {
    const raw = role
      ? (localAnnouncements || []).filter((a) => isAnnouncementVisibleToRole(a.targetAudience, role))
      : localAnnouncements || [];

    return [...raw].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA && timeB && timeA !== timeB) return timeB - timeA;

      const matchA = a.id?.match(/(\d{10,14})$/);
      const matchB = b.id?.match(/(\d{10,14})$/);
      if (matchA && matchB) {
        const numA = parseInt(matchA[1], 10);
        const numB = parseInt(matchB[1], 10);
        if (numA !== numB) return numB - numA;
      }

      const dateA = a.publishDate || a.date || '';
      const dateB = b.publishDate || b.date || '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);

      return (b.id || '').localeCompare(a.id || '');
    });
  }, [localAnnouncements, role]);

  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'general' | 'poll' | 'event'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);

  // Filter logic
  const filteredAnnouncements = listToUse.filter((anc) => {
    // Type filter
    if (filterType !== 'all') {
      const type = anc.type || 'general';
      if (type !== filterType) return false;
    }

    // Priority filter
    if (filterPriority === 'عاجل' && anc.priority !== 'عاجل جداً') {
      return false;
    }
    if (filterPriority === 'مهم' && anc.priority !== 'هام') {
      return false;
    }
    if (filterPriority === 'عام' && anc.priority !== 'عادي') {
      return false;
    }

    // Search query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = anc.title.toLowerCase().includes(q);
      const matchContent = anc.content.toLowerCase().includes(q);
      const matchAuthor = anc.author ? anc.author.toLowerCase().includes(q) : false;
      return matchTitle || matchContent || matchAuthor;
    }

    return true;
  });

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (bookmarkedIds.includes(id)) {
      setBookmarkedIds(bookmarkedIds.filter((bId) => bId !== id));
    } else {
      setBookmarkedIds([...bookmarkedIds, id]);
    }
  };

  const handleVote = async (ann: Announcement, optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVotingId(ann.id);
    try {
      const updated = await votePollAnnouncementApi(ann.schoolId || schoolId, ann.id, [optionId]);
      setLocalAnnouncements((prev) => prev.map((item) => (item.id === ann.id ? updated : item)));
      if (onAnnouncementUpdate) onAnnouncementUpdate(updated);
    } catch (err: any) {
      alert(err?.message || 'تعذر تسجيل التصويت في الوقت الحالي');
    } finally {
      setVotingId(null);
    }
  };

  const handleRsvp = async (
    ann: Announcement,
    status: 'attending' | 'interested' | 'declined',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setRsvpingId(ann.id);
    try {
      const updated = await rsvpEventAnnouncementApi(ann.schoolId || schoolId, ann.id, status);
      setLocalAnnouncements((prev) => prev.map((item) => (item.id === ann.id ? updated : item)));
      if (onAnnouncementUpdate) onAnnouncementUpdate(updated);
    } catch (err: any) {
      alert(err?.message || 'تعذر حفظ حالة المشاركة في الوقت الحالي');
    } finally {
      setRsvpingId(null);
    }
  };

  const getThemeDetails = (anc: Announcement, index: number) => {
    const isPoll = anc.type === 'poll';
    const isEvent = anc.type === 'event';
    const isUrgent = anc.priority === 'عاجل جداً';
    const isImportant = anc.priority === 'هام';

    if (isPoll) {
      return {
        cardBorder: 'border-2 border-purple-200/90 hover:border-purple-400 bg-purple-50/20',
        badgeBg: 'bg-purple-100 text-purple-800 border border-purple-200/80',
        badgeText: 'استطلاع رأي',
        iconBg: 'bg-purple-100/80 text-purple-600',
        iconComponent: BarChart2,
        accentColor: 'purple',
      };
    }

    if (isEvent) {
      return {
        cardBorder: 'border-2 border-emerald-200/90 hover:border-emerald-400 bg-emerald-50/20',
        badgeBg: 'bg-emerald-100 text-emerald-800 border border-emerald-200/80',
        badgeText: 'فعالية / حدث',
        iconBg: 'bg-emerald-100/80 text-emerald-600',
        iconComponent: Calendar,
        accentColor: 'emerald',
      };
    }

    if (isUrgent) {
      return {
        cardBorder: 'border-2 border-rose-200/90 hover:border-rose-400 bg-rose-50/20',
        badgeBg: 'bg-rose-100 text-rose-700 border border-rose-200/80',
        badgeText: 'عاجل',
        iconBg: 'bg-rose-100/80 text-rose-600',
        iconComponent: AlertTriangle,
        accentColor: 'rose',
      };
    }

    if (isImportant) {
      return {
        cardBorder: 'border-2 border-amber-200/90 hover:border-amber-400 bg-amber-50/20',
        badgeBg: 'bg-amber-100 text-amber-800 border border-amber-200/80',
        badgeText: 'مهم',
        iconBg: 'bg-amber-100/80 text-amber-600',
        iconComponent: AlertCircle,
        accentColor: 'amber',
      };
    }

    return {
      cardBorder: 'border-2 border-blue-200/90 hover:border-blue-400 bg-blue-50/20',
      badgeBg: 'bg-blue-100 text-blue-800 border border-blue-200/80',
      badgeText: 'إعلان عام',
      iconBg: 'bg-blue-100/80 text-blue-600',
      iconComponent: Megaphone,
      accentColor: 'blue',
    };
  };

  // Relative time helper
  const getRelativeDateLabel = (dateStr: string, index: number) => {
    if (index === 0) return { label: 'منذ يوم', isNew: true };
    if (index === 1) return { label: 'منذ يومين', isNew: true };
    if (index === 2) return { label: 'منذ 5 أيام', isNew: false };
    if (index === 3) return { label: 'منذ 8 أيام', isNew: false };

    if (!dateStr) return { label: 'مؤخراً', isNew: false };
    const pub = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil(Math.abs(today.getTime() - pub.getTime()) / (1000 * 60 * 60 * 24));

    if (isNaN(diffDays) || diffDays <= 1) return { label: 'منذ يوم', isNew: true };
    if (diffDays === 2) return { label: 'منذ يومين', isNew: true };
    return { label: `منذ ${formatArabicNumber(diffDays)} أيام`, isNew: false };
  };

  return (
    <div className="space-y-5 dir-rtl font-sans">
      {/* 1. HEADER BANNER CARD (الاعلانات المدرسية) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-4">
        {/* Right Section: Megaphone Graphic & Title */}
        <div className="flex items-center gap-4 sm:gap-5">
          {/* 3D Visual Megaphone Icon Badge */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 rounded-3xl flex items-center justify-center text-white shadow-md shadow-purple-200/80 transform -rotate-6 transition-transform hover:rotate-0 duration-300">
              <Megaphone className="w-8 h-8 sm:w-10 sm:h-10 text-white stroke-[2.2]" />
            </div>
            {/* Pulsing soundwave dots effect */}
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-purple-400 rounded-full animate-ping opacity-75" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-purple-500 rounded-full border-2 border-white" />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              الاعلانات المدرسية
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-500">
              تابع آخر الإعلانات المهمة من مدرستك
            </p>
          </div>
        </div>

        {/* Left Section: Metric Pill */}
        <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl px-4 py-3 text-center min-w-[75px] sm:min-w-[95px] shrink-0">
          <div className="text-2xl sm:text-3xl font-black text-indigo-700 font-sans leading-none">
            {formatArabicNumber(listToUse.length)}
          </div>
          <div className="text-xs font-bold text-indigo-600/90 mt-1">إعلان</div>
        </div>
      </div>

      {/* 2. SECTION TITLE & FILTERS ROW (جميع الإعلانات) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900">جميع الإعلانات</h2>
            {filterPriority !== 'all' && (
              <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                تصفية: {filterPriority}
              </span>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="p-2 sm:px-3 sm:py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">تصفية</span>
            </button>

            {/* Filter Dropdown Menu */}
            {showFilterDropdown && (
              <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-2 space-y-1 animate-in fade-in duration-150">
                <button
                  onClick={() => {
                    setFilterPriority('all');
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between ${
                    filterPriority === 'all'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>جميع الإعلانات</span>
                  {filterPriority === 'all' && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
                <button
                  onClick={() => {
                    setFilterPriority('عاجل');
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between ${
                    filterPriority === 'عاجل'
                      ? 'bg-rose-50 text-rose-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    العاجلة فقط
                  </span>
                  {filterPriority === 'عاجل' && <Check className="w-4 h-4 text-rose-600" />}
                </button>
                <button
                  onClick={() => {
                    setFilterPriority('مهم');
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between ${
                    filterPriority === 'مهم'
                      ? 'bg-amber-50 text-amber-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    المهمة فقط
                  </span>
                  {filterPriority === 'مهم' && <Check className="w-4 h-4 text-amber-600" />}
                </button>
                <button
                  onClick={() => {
                    setFilterPriority('عام');
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between ${
                    filterPriority === 'عام'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    العامة فقط
                  </span>
                  {filterPriority === 'عام' && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في عنوان الإعلان أو المحتوى..."
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-2xs"
          />
          <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-rose-800 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-2xs shrink-0"
            >
              إعادة المحاولة
            </button>
          )}
        </div>
      )}

      {/* 3. ANNOUNCEMENT CARDS LIST (Matching screenshot pixel-perfectly) */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-2xs space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold">جاري تحميل الإعلانات من الخادم...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-2xs space-y-3">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">لا توجد إعلانات مسجلة لهذه المدرسة حالياً</h3>
          <p className="text-xs text-slate-400">سيتم عرض الإعلانات والتنبيهات المدرسية هنا عند نشرها بواسطة إدارة المدرسة.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredAnnouncements.map((anc, idx) => {
            const theme = getThemeDetails(anc, idx);
            const dateInfo = getRelativeDateLabel(anc.publishDate, idx);
            const IconComponent = theme.iconComponent;
            const isExpanded = expandedId === anc.id;
            const isBookmarked = bookmarkedIds.includes(anc.id);

            const isPoll = anc.type === 'poll';
            const isEvent = anc.type === 'event';

            const pollVotes = anc.pollVotes || [];
            const pollOptions = anc.pollOptions || [];
            const totalVotes = pollVotes.length;

            return (
              <div
                key={anc.id}
                onClick={() => setExpandedId(isExpanded ? null : anc.id)}
                className={`bg-white rounded-2xl p-4 sm:p-5 shadow-2xs transition-all duration-200 cursor-pointer group ${theme.cardBorder}`}
              >
                {/* Main Content Row: Icon + Title/Description + Left Chevron */}
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  {/* Right Side: Icon & Title/Content */}
                  <div className="flex items-start gap-3 sm:gap-3.5 flex-1 min-w-0">
                    {/* Visual Icon Badge */}
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 border border-white/60 ${theme.iconBg}`}
                    >
                      <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                    </div>

                    {/* Text Block */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.badgeBg}`}>
                          {theme.badgeText}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                        {anc.title}
                      </h3>
                      <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed line-clamp-2">
                        {anc.content}
                      </p>
                    </div>
                  </div>

                  {/* Left Side: Chevron Arrow */}
                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    <button
                      onClick={(e) => toggleBookmark(anc.id, e)}
                      className={`p-1.5 rounded-xl transition-colors ${
                        isBookmarked
                          ? 'text-amber-500 bg-amber-50'
                          : 'text-slate-300 hover:text-slate-500'
                      }`}
                      title={isBookmarked ? 'إزالة من المحفوظات' : 'حفظ الإعلان'}
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>

                    <ChevronLeft
                      className={`w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${
                        isExpanded ? '-rotate-90 text-indigo-600' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* DYNAMIC INTERACTIVE POLL / EVENT CONTENT */}
                <div className="mt-3 space-y-3">
                  {/* YouTube-Style Poll Display */}
                  {isPoll && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5"
                    >
                      <div className="space-y-2">
                        {pollOptions.map((opt) => {
                          const votes = opt.votesCount || 0;
                          const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={(e) => handleVote(anc, opt.id, e)}
                              disabled={votingId === anc.id}
                              className={`group/pollOpt relative w-full overflow-hidden rounded-xl border text-right transition-all cursor-pointer p-3 flex items-center justify-between ${
                                votingId === anc.id
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

                      {/* Footer votes counter */}
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 pt-1 px-1">
                        <span className="flex items-center gap-1 font-semibold text-purple-900">
                          <Vote className="w-3.5 h-3.5 text-purple-600" />
                          <span>إجمالي الأصوات: {formatArabicNumber(totalVotes)}</span>
                        </span>
                        {anc.pollExpiresAt && <span>ينتهي: {anc.pollExpiresAt}</span>}
                      </div>
                    </div>
                  )}

                  {/* Clean Non-Interactive Event Display */}
                  {isEvent && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="bg-emerald-50/50 border border-emerald-200/70 rounded-2xl p-3.5"
                    >
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
                          <div className="flex items-center gap-1.5 bg-white p-2.5 rounded-xl border border-emerald-100/80 shadow-2xs col-span-1 sm:col-span-1">
                            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>الموقع: <strong className="text-slate-900">{anc.eventLocation}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
                    <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 text-xs font-medium text-slate-700 leading-relaxed">
                      {anc.content}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 flex-wrap gap-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>المصدر: {anc.author || 'إدارة المدرسة'}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <span>الفئة المستهدفة: {anc.targetAudience}</span>
                      </div>

                      <div className="flex items-center gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>تاريخ النشر: {anc.publishDate}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
