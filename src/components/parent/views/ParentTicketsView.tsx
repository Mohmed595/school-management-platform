import React, { useState, useEffect } from 'react';
import {
  SupportTicket,
  TicketWithReplies,
  TicketStatus,
  DailyTicketUsage,
  CreateTicketInput,
} from '../../../types/ticket';
import {
  fetchSupportTicketsApi,
  fetchSupportTicketDetailsApi,
  createSupportTicketApi,
  replySupportTicketApi,
  fetchMyDailyTicketUsageApi,
} from '../../../lib/supportTicketsApi';
import {
  LifeBuoy,
  Plus,
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
  ShieldAlert,
  HelpCircle,
  Inbox,
  ArrowRight,
} from 'lucide-react';

interface ParentTicketsViewProps {
  studentId?: string;
  studentName?: string;
  studentCode?: string;
  className?: string;
  schoolId?: string;
  schoolName?: string;
}

export function ParentTicketsView({
  studentId = '',
  studentName = '',
  studentCode = '',
  className = '',
  schoolId = '',
  schoolName = '',
}: ParentTicketsViewProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Daily Quota state
  const [dailyUsage, setDailyUsage] = useState<DailyTicketUsage | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithReplies | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // Create form state (only title / subject and description)
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Reply state
  const [replyMessage, setReplyMessage] = useState<string>('');
  const [isReplying, setIsReplying] = useState<boolean>(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Load tickets list
  const loadTickets = async (pageToLoad?: number) => {
    setLoading(true);
    setError(null);
    const pageNum = pageToLoad ?? currentPage;
    try {
      const data = await fetchSupportTicketsApi({
        status: statusFilter,
        search: searchQuery,
        page: pageNum,
        limit: 20,
      });
      setTickets(data);
      setCurrentPage(data.page || pageNum);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      setError(err?.message || 'فشل تحميل التذاكر والشكاوى');
    } finally {
      setLoading(false);
    }
  };

  // Load daily quota
  const loadDailyUsage = async () => {
    try {
      const usage = await fetchMyDailyTicketUsageApi();
      setDailyUsage(usage);
    } catch (err) {
      // Non-critical, fallback to null
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadTickets(1);
    loadDailyUsage();
  }, [studentId, schoolId, statusFilter, searchQuery]);

  // Open ticket detail modal
  const handleOpenTicket = async (ticket: SupportTicket) => {
    setLoadingDetails(true);
    setSelectedTicket(null);
    setReplyError(null);
    setReplyMessage('');
    try {
      const fullTicket = await fetchSupportTicketDetailsApi(ticket.id);
      setSelectedTicket(fullTicket);
    } catch (err: any) {
      setError(err?.message || 'فشل جلب تفاصيل الشكوى');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Submit new ticket
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    if (!formData.subject.trim() || !formData.description.trim()) {
      setCreateError('يرجى كتابة عنوان الشكوى وتفاصيل المشكلة بالتفصيل.');
      return;
    }

    setIsSubmitting(true);
    try {
      const input: CreateTicketInput = {
        schoolId,
        schoolName,
        studentId,
        studentName,
        studentCode,
        className,
        subject: formData.subject.trim(),
        description: formData.description.trim(),
      };

      await createSupportTicketApi(input);

      setCreateSuccess('تم إرسال الشكوى بنجاح وسيتم مراجعتها من قبل الإدارة.');
      // Refresh list and usage
      await loadTickets();
      await loadDailyUsage();

      // Reset form
      setFormData({
        subject: '',
        description: '',
      });

      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(null);
      }, 1500);
    } catch (err: any) {
      setCreateError(err?.message || 'فشل إرسال الشكوى. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send reply in ticket conversation
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim() || isReplying) return;

    setReplyError(null);
    setIsReplying(true);
    try {
      const result = await replySupportTicketApi(selectedTicket.id, replyMessage.trim());
      // Append reply to selected ticket
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
      // Refresh background list
      loadTickets();
    } catch (err: any) {
      setReplyError(err?.message || 'فشل إرسال الرد');
    } finally {
      setIsReplying(false);
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter !== 'الكل' && ticket.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCode = ticket.ticketCode.toLowerCase().includes(q);
      const matchSubject = ticket.subject.toLowerCase().includes(q);
      const matchCategory = ticket.category.toLowerCase().includes(q);
      const matchDesc = ticket.description.toLowerCase().includes(q);
      if (!matchCode && !matchSubject && !matchCategory && !matchDesc) {
        return false;
      }
    }
    return true;
  });

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'جديدة':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            جديدة
          </span>
        );
      case 'قيد المراجعة':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
            <Clock className="w-3.5 h-3.5" />
            قيد المراجعة
          </span>
        );
      case 'تم الرد':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <CheckCircle2 className="w-3.5 h-3.5" />
            تم الرد
          </span>
        );
      case 'مغلقة':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            مغلقة
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 dir-rtl text-right">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              الشكاوى والدعم الفني
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              يمكنك تقديم الاستفسارات والشكاوى ومتابعة ردود إدارة المدرسة وفريق الدعم
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {dailyUsage && (
            <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
              <span className="text-slate-500 font-medium">الحد اليومي للتذاكر:</span>
              <span className="font-bold text-slate-800">
                {dailyUsage.usedToday} / {dailyUsage.maxDaily}
              </span>
              {dailyUsage.usedToday >= dailyUsage.maxDaily ? (
                <span className="text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">
                  اكتمل الحد اليومي
                </span>
              ) : (
                <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                  متاح {dailyUsage.remainingToday}
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setCreateError(null);
              setCreateSuccess(null);
              setShowCreateModal(true);
            }}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تقديم شكوى جديدة</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Status Filter Chips */}
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

        {/* Search Box */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="بحث برقم التذكرة، الموضوع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200/90 text-center flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm font-bold text-slate-700">جاري تحميل الشكاوى من الخادم...</p>
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
        /* Empty State */
        <div className="bg-white rounded-2xl p-12 border border-slate-200/90 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Inbox className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-slate-800">لا توجد شكاوى</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
              يمكنك إرسال شكوى جديدة إذا واجهت مشكلة.
            </p>
          </div>
          <button
            onClick={() => {
              setCreateError(null);
              setCreateSuccess(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تقديم شكوى جديدة</span>
          </button>
        </div>
      ) : (
        /* Tickets Grid / List */
        <div className="grid grid-cols-1 gap-3.5">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => handleOpenTicket(ticket)}
              className="bg-white hover:bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer shadow-2xs hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-extrabold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
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

                <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(ticket.createdAt).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {ticket.answeredAt && (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      تم الرد {ticket.answeredBy ? `بواسطة ${ticket.answeredBy}` : ''}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl border border-blue-100 transition-colors">
                  <span>عرض التفاصيل والمحادثة</span>
                  <ChevronLeft className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-bold text-slate-500">
            صفحة <span className="text-slate-900">{currentPage}</span> من <span className="text-slate-900">{totalPages}</span>
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
              disabled={currentPage >= totalPages || loading}
              onClick={() => loadTickets(currentPage + 1)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              التالي
            </button>
          </div>
        </div>
      )}

      {/* CREATE TICKET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs dir-rtl">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">تقديم شكوى / استفسار جديد</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    سيتم حفظ الشكوى وإرسالها فوراً إلى الفريق المختص
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Daily limit notice */}
            {dailyUsage && (
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-blue-800 font-medium">الحد الأقصى للشكاوى اليومية:</span>
                <span className="font-extrabold text-blue-900">
                  المستخدم اليوم: {dailyUsage.usedToday} من {dailyUsage.maxDaily}
                </span>
              </div>
            )}

            {/* Error Alert */}
            {createError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-800 font-bold">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">{createError}</div>
              </div>
            )}

            {/* Success Alert */}
            {createSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{createSuccess}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Subject / Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  عنوان الشكوى / الموضوع <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="اكتب عنواناً يوضح موضوع الشكوى..."
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-medium"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  تفاصيل الشكوى والوصف <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="اشرح المشكلة أو الاستفسار بالتفصيل..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-medium resize-none leading-relaxed"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري الإرسال...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال الشكوى</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TICKET DETAILS & CONVERSATION MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs dir-rtl">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
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

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-2 py-3 border-b border-slate-100 text-xs">
                {selectedTicket.category && selectedTicket.category !== 'عام' && (
                  <span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg border border-blue-100">
                    {selectedTicket.category}
                  </span>
                )}
                {selectedTicket.subcategory && selectedTicket.subcategory !== 'عام' && (
                  <span className="bg-slate-50 text-slate-600 font-medium px-2.5 py-1 rounded-lg border border-slate-200">
                    {selectedTicket.subcategory}
                  </span>
                )}
                <span className="text-slate-400 text-[11px] font-medium mr-auto">
                  تاريخ الإنشاء: {new Date(selectedTicket.createdAt).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Initial ticket message */}
              <div className="my-4 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">وصف الشكوى الأساسي:</span>
                  <span className="text-[11px] text-slate-400">من قبلك</span>
                </div>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Conversation thread */}
              <div className="space-y-3 my-4">
                <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>المحادثة والردود ({selectedTicket.replies?.length || 0})</span>
                </h4>

                {(!selectedTicket.replies || selectedTicket.replies.length === 0) ? (
                  <div className="p-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl text-center">
                    <p className="text-xs text-slate-500 font-medium">
                      لم يتم تسجيل أي ردود إضافية بعد. فريق الدعم سيقوم بالرد قريباً.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto p-1">
                    {selectedTicket.replies.map((reply) => {
                      const isFromSupport = reply.senderRole === 'owner' || reply.senderRole === 'school_admin';
                      return (
                        <div
                          key={reply.id}
                          className={`p-3.5 rounded-2xl text-xs space-y-1.5 ${
                            isFromSupport
                              ? 'bg-blue-50/90 border border-blue-200 text-blue-950 mr-4'
                              : 'bg-slate-100 border border-slate-200 text-slate-900 ml-4'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className={isFromSupport ? 'text-blue-700' : 'text-slate-700'}>
                              {reply.senderName} ({isFromSupport ? 'فريق الدعم / الإدارة' : 'الطالب'})
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

            {/* Reply Input Box */}
            {selectedTicket.status !== 'مغلقة' ? (
              <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-100 space-y-2">
                {replyError && (
                  <div className="text-xs text-red-600 font-bold bg-red-50 p-2 rounded-lg">
                    {replyError}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="اكتب رداً أو استفساراً إضافياً..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                  />
                  <button
                    type="submit"
                    disabled={isReplying || !replyMessage.trim()}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    {isReplying ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>إرسال</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 bg-slate-100 text-slate-500 rounded-xl text-xs text-center font-bold">
                هذه التذكرة مغلقة حالياً.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
