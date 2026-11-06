import React, { useState, useEffect } from 'react';
import {
  SupportTicket,
  TicketWithReplies,
  TicketStatus,
} from '../../types/ticket';
import {
  fetchSupportTicketsApi,
  fetchSupportTicketDetailsApi,
  replySupportTicketApi,
  updateSupportTicketStatusApi,
} from '../../lib/supportTicketsApi';
import {
  LifeBuoy,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Send,
  X,
  RefreshCw,
  ChevronLeft,
  Calendar,
  User,
  Building2,
  GraduationCap,
  Inbox,
  ShieldCheck,
  Check,
  MessageCircle,
} from 'lucide-react';

interface OwnerTicketsViewProps {
  onToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function OwnerTicketsView({ onToast }: OwnerTicketsViewProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Server Stats
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [stats, setStats] = useState<{
    totalCount: number;
    newCount: number;
    inReviewCount: number;
    answeredCount: number;
    closedCount: number;
  }>({
    totalCount: 0,
    newCount: 0,
    inReviewCount: 0,
    answeredCount: 0,
    closedCount: 0,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('الكل');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Ticket Drawer / Modal
  const [selectedTicket, setSelectedTicket] = useState<TicketWithReplies | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // Reply Form in Drawer
  const [replyMessage, setReplyMessage] = useState<string>('');
  const [replyStatus, setReplyStatus] = useState<TicketStatus>('تم الرد');
  const [isReplying, setIsReplying] = useState<boolean>(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Status updating state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Load tickets with server-side filtering and pagination
  const loadTickets = async (pageToLoad?: number) => {
    setLoading(true);
    setError(null);
    const pageNum = pageToLoad ?? currentPage;
    try {
      const data = await fetchSupportTicketsApi({
        status: statusFilter,
        schoolId: schoolFilter,
        search: searchQuery,
        page: pageNum,
        limit: 50,
      });
      setTickets(data);
      setCurrentPage(data.page || pageNum);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
      setHasMore(Boolean(data.hasMore));
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err: any) {
      setError(err?.message || 'فشل تحميل قائمة التذاكر');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadTickets(1);
  }, [statusFilter, schoolFilter, searchQuery]);

  // Open ticket drawer & fetch full conversation
  const handleOpenTicket = async (ticket: SupportTicket) => {
    setLoadingDetails(true);
    setReplyError(null);
    setReplyMessage('');
    setReplyStatus('تم الرد');
    try {
      const details = await fetchSupportTicketDetailsApi(ticket.id);
      setSelectedTicket(details);
    } catch (err: any) {
      if (onToast) onToast(err?.message || 'فشل تحميل تفاصيل التذكرة', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Quick preset replies
  const quickPresets = [
    'تم استلام الشكوى ومراجعتها، وجاري العمل على حل المشكلة.',
    'تم حل المشكلة التقنية بنجاح. يرجى تجربة تسجيل الدخول أو إعادة تحميل الصفحة.',
    'تم تحويل طلبكم إلى إدارة المدرسة للمتابعة المباشرة.',
    'يرجى تزويدنا بمزيد من التفاصيل لنتمكن من مساعدتكم بشكل أفضل.',
  ];

  // Send reply and update status
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim() || isReplying) return;

    setIsReplying(true);
    setReplyError(null);
    try {
      const result = await replySupportTicketApi(
        selectedTicket.id,
        replyMessage.trim(),
        replyStatus
      );

      // Update active ticket
      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              status: result.updatedStatus,
              replies: [...prev.replies, result.reply],
            }
          : prev
      );

      setReplyMessage('');
      if (onToast) onToast('تم إرسال الرد وتحديث حالة التذكرة بنجاح', 'success');

      // Refresh list in background
      loadTickets();
    } catch (err: any) {
      setReplyError(err?.message || 'فشل إرسال الرد');
      if (onToast) onToast(err?.message || 'فشل إرسال الرد', 'error');
    } finally {
      setIsReplying(false);
    }
  };

  // Change status directly
  const handleChangeStatus = async (newStatus: TicketStatus) => {
    if (!selectedTicket || isUpdatingStatus || selectedTicket.status === newStatus) return;

    setIsUpdatingStatus(true);
    try {
      await updateSupportTicketStatusApi(selectedTicket.id, newStatus);
      setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : prev));
      if (onToast) onToast(`تم تغيير حالة التذكرة إلى "${newStatus}"`, 'success');
      loadTickets();
    } catch (err: any) {
      if (onToast) onToast(err?.message || 'فشل تغيير حالة التذكرة', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Compute unique schools for filter
  const uniqueSchools = Array.from(
    new Map(
      tickets
        .filter((t) => t.schoolId)
        .map((t) => [t.schoolId, t.schoolName || t.schoolId])
    ).entries()
  );

  // Stat counts from server aggregation or fallback
  const totalCountStat = stats.totalCount || totalCount;
  const newCount = stats.newCount;
  const inReviewCount = stats.inReviewCount;
  const answeredCount = stats.answeredCount;
  const closedCount = stats.closedCount;

  // Filtered tickets
  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter !== 'الكل' && ticket.status !== statusFilter) {
      return false;
    }
    if (schoolFilter !== 'all' && ticket.schoolId !== schoolFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCode = ticket.ticketCode.toLowerCase().includes(q);
      const matchStudent = ticket.studentName.toLowerCase().includes(q);
      const matchSubject = ticket.subject.toLowerCase().includes(q);
      const matchSchool = (ticket.schoolName || '').toLowerCase().includes(q);
      const matchDesc = ticket.description.toLowerCase().includes(q);
      if (!matchCode && !matchStudent && !matchSubject && !matchSchool && !matchDesc) {
        return false;
      }
    }
    return true;
  });

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'جديدة':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            جديدة
          </span>
        );
      case 'قيد المراجعة':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            قيد المراجعة
          </span>
        );
      case 'تم الرد':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            تم الرد
          </span>
        );
      case 'مغلقة':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
            مغلقة
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 dir-rtl text-right">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              إدارة الشكاوى والدعم الفني
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              متابعة جميع استفسارات وشكاوى الطلاب وأولياء الأمور عبر المدارس والرد المباشر عليها
            </p>
          </div>
        </div>

        <button
          onClick={() => loadTickets()}
          className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث التذاكر</span>
        </button>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total */}
        <div
          onClick={() => setStatusFilter('الكل')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'الكل'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : 'bg-white text-slate-800 border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold opacity-80 mb-1">إجمالي الشكاوى</div>
          <div className="text-2xl font-black">{totalCountStat}</div>
        </div>

        {/* New */}
        <div
          onClick={() => setStatusFilter('جديدة')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'جديدة'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : 'bg-white text-slate-800 border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-blue-600 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            جديدة
          </div>
          <div className="text-2xl font-black">{newCount}</div>
        </div>

        {/* In Review */}
        <div
          onClick={() => setStatusFilter('قيد المراجعة')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'قيد المراجعة'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md'
              : 'bg-white text-slate-800 border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-amber-600 mb-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            قيد المراجعة
          </div>
          <div className="text-2xl font-black">{inReviewCount}</div>
        </div>

        {/* Answered */}
        <div
          onClick={() => setStatusFilter('تم الرد')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'تم الرد'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-white text-slate-800 border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-emerald-600 mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            تم الرد
          </div>
          <div className="text-2xl font-black">{answeredCount}</div>
        </div>

        {/* Closed */}
        <div
          onClick={() => setStatusFilter('مغلقة')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'مغلقة'
              ? 'bg-slate-700 text-white border-slate-700 shadow-md'
              : 'bg-white text-slate-800 border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-slate-500 mb-1">مغلقة</div>
          <div className="text-2xl font-black">{closedCount}</div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Status buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {['الكل', 'جديدة', 'قيد المراجعة', 'تم الرد', 'مغلقة'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* School Dropdown & Search Input */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
          {/* School filter */}
          {uniqueSchools.length > 0 && (
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="w-full sm:w-44 px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-800 font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع المدارس</option>
              {uniqueSchools.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          )}

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="بحث برقم التذكرة، الطالب، الموضوع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 transition-all font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* TICKETS LIST / TABLE */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200/90 text-center flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm font-bold text-slate-700">جاري تحميل الشكاوى والتذاكر...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm font-bold text-red-800">{error}</p>
          <button
            onClick={() => loadTickets()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200/90 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-800">لا توجد شكاوى مطابقة</h3>
          <p className="text-xs text-slate-500">لم يتم العثور على أي شكاوى وفق معايير البحث والفلترة المحددة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => handleOpenTicket(ticket)}
              className="bg-white hover:bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer shadow-2xs hover:shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              {/* Left Details */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                    {ticket.ticketCode}
                  </span>
                  {getStatusBadge(ticket.status)}
                  {ticket.category && ticket.category !== 'عام' && (
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {ticket.category}
                    </span>
                  )}
                  {ticket.subcategory && ticket.subcategory !== 'عام' && (
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                      {ticket.subcategory}
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                  {ticket.subject}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {ticket.description}
                </p>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1 font-medium">
                  <span className="flex items-center gap-1 text-slate-700 font-bold">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    {ticket.studentName} {ticket.className ? `(${ticket.className})` : ''}
                  </span>
                  {ticket.schoolName && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {ticket.schoolName}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(ticket.createdAt).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-end lg:justify-center shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100">
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl border border-blue-100 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>عرض الشكوى والرد</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-bold text-slate-500">
            صفحة <span className="text-slate-900">{currentPage}</span> من <span className="text-slate-900">{totalPages}</span> (إجمالي {totalCount} تذكرة)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => loadTickets(currentPage - 1)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              السابق
            </button>

            <span className="text-xs font-bold px-2 text-slate-600">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={(!hasMore && currentPage >= totalPages) || loading}
              onClick={() => loadTickets(currentPage + 1)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              التالي
            </button>
          </div>
        </div>
      )}

      {/* TICKET DETAILS & REPLY DRAWER / MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs dir-rtl">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-5 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                      {selectedTicket.ticketCode}
                    </span>
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
                    {selectedTicket.subject}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Student & School Info Banner */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 my-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold">اسم الطالب:</span>
                  <span className="font-extrabold text-slate-800">{selectedTicket.studentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold">كود الطالب / الفصل:</span>
                  <span className="font-extrabold text-slate-800">
                    {selectedTicket.studentCode || '—'} {selectedTicket.className ? `(${selectedTicket.className})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold">المدرسة:</span>
                  <span className="font-extrabold text-slate-800">{selectedTicket.schoolName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold">تاريخ الإنشاء:</span>
                  <span className="font-bold text-slate-700">
                    {new Date(selectedTicket.createdAt).toLocaleDateString('ar-EG', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Status Selector */}
              <div className="flex items-center justify-between p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl my-3">
                <span className="text-xs font-bold text-slate-700">تغيير حالة التذكرة الحالية:</span>
                <div className="flex items-center gap-1.5">
                  {(['جديدة', 'قيد المراجعة', 'تم الرد', 'مغلقة'] as TicketStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleChangeStatus(st)}
                      disabled={isUpdatingStatus || selectedTicket.status === st}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedTicket.status === st
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Initial Student Message */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 my-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-900">نص الشكوى الأساسي من الطالب:</span>
                  <span className="text-slate-400 text-[11px]">
                    {selectedTicket.category} / {selectedTicket.subcategory}
                  </span>
                </div>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Conversation Replies */}
              <div className="space-y-3 my-3">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>سجل الردود والمحادثة ({selectedTicket.replies?.length || 0})</span>
                </h4>

                {(!selectedTicket.replies || selectedTicket.replies.length === 0) ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
                    <p className="text-xs text-slate-500 font-medium">
                      لم يتم تسجيل أي ردود بعد على هذه الشكوى. يمكنك كتابة رد أدناه.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-56 overflow-y-auto p-1">
                    {selectedTicket.replies.map((reply) => {
                      const isSupport = reply.senderRole === 'owner' || reply.senderRole === 'school_admin';
                      return (
                        <div
                          key={reply.id}
                          className={`p-3.5 rounded-2xl text-xs space-y-1.5 ${
                            isSupport
                              ? 'bg-blue-50 border border-blue-200 text-blue-950 ml-6'
                              : 'bg-slate-100 border border-slate-200 text-slate-900 mr-6'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className={isSupport ? 'text-blue-700' : 'text-slate-700'}>
                              {reply.senderName} ({isSupport ? 'فريق الدعم / الإدارة' : 'الطالب'})
                            </span>
                            <span className="text-slate-400 font-normal">
                              {new Date(reply.createdAt).toLocaleTimeString('ar-EG', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed">{reply.message}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Reply Composer Form */}
            <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-100 space-y-3">
              {replyError && (
                <div className="text-xs text-red-600 font-bold bg-red-50 p-2.5 rounded-xl border border-red-200">
                  {replyError}
                </div>
              )}

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 block">ردود سريعة جاهزة:</span>
                <div className="flex flex-wrap gap-1.5">
                  {quickPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReplyMessage(preset)}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-medium border border-slate-200 transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reply Textarea */}
              <div>
                <textarea
                  rows={3}
                  placeholder="اكتب رد فريق الدعم الفني هنا..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-medium resize-none leading-relaxed"
                  required
                />
              </div>

              {/* Actions row */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-600">تعيين الحالة عند الرد:</span>
                  <select
                    value={replyStatus}
                    onChange={(e) => setReplyStatus(e.target.value as TicketStatus)}
                    className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-800 font-bold"
                  >
                    <option value="تم الرد">تم الرد</option>
                    <option value="قيد المراجعة">قيد المراجعة</option>
                    <option value="مغلقة">مغلقة</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isReplying || !replyMessage.trim()}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {isReplying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري الإرسال...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال الرد وتحديث التذكرة</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
