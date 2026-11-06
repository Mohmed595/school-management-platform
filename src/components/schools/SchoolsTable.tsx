import React, { useState, useMemo } from 'react';
import { School, Governorate, SchoolStatus, SubscriptionPlan, EGYPT_GOVERNORATES } from '../../types';
import { StatusBadge, PlanBadge } from '../ui/Badge';
import { formatArabicNumber } from '../../lib/storage';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit3,
  Ban,
  CheckCircle,
  Trash2,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Building2,
  SlidersHorizontal,
  X,
  FileSpreadsheet,
  GraduationCap,
} from 'lucide-react';

interface SchoolsTableProps {
  schools: School[];
  onOpenCreate: () => void;
  onViewDetails: (school: School) => void;
  onEditSchool: (school: School) => void;
  onToggleSuspend: (school: School) => void;
  onDeleteSchool: (school: School) => void;
  onToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
  initialSearchQuery?: string;
  onOpenAdminDashboard?: (schoolId: string) => void;
}

export function SchoolsTable({
  schools,
  onOpenCreate,
  onViewDetails,
  onEditSchool,
  onToggleSuspend,
  onDeleteSchool,
  onToast,
  initialSearchQuery = '',
  onOpenAdminDashboard,
}: SchoolsTableProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedGov, setSelectedGov] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPlan, setSelectedPlan] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'students' | 'teachers' | 'date'>('date');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filter logic
  const filteredSchools = useMemo(() => {
    return schools.filter((s) => {
      // Text search
      const matchesText =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.licenseKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.principalName.toLowerCase().includes(searchQuery.toLowerCase());

      // Governorate filter
      const matchesGov = selectedGov === 'ALL' || s.governorate === selectedGov;

      // Status filter
      const matchesStatus = selectedStatus === 'ALL' || s.status === selectedStatus;

      // Subscription filter
      const matchesPlan = selectedPlan === 'ALL' || s.subscription === selectedPlan;

      return matchesText && matchesGov && matchesStatus && matchesPlan;
    });
  }, [schools, searchQuery, selectedGov, selectedStatus, selectedPlan]);

  // Sort logic
  const sortedSchools = useMemo(() => {
    return [...filteredSchools].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'ar');
      if (sortBy === 'students') return b.studentsCount - a.studentsCount;
      if (sortBy === 'teachers') return b.teachersCount - a.teachersCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filteredSchools, sortBy]);

  // Pagination slicing
  const totalPages = Math.ceil(sortedSchools.length / pageSize) || 1;
  const paginatedSchools = sortedSchools.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const copyLicenseKey = (key: string, schoolName: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    onToast('تم نسخ مفتاح الترخيص', `مفتاح ترخيص ${schoolName}: ${key}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const exportCSV = () => {
    const headers = ['اسم المدرسة', 'الكود', 'مفتاح الترخيص', 'المحافظة', 'الطلاب', 'المعلمين', 'الاشتراك', 'الحالة', 'المدير', 'هاتف المدير'];
    const rows = sortedSchools.map((s) => [
      `"${s.name}"`,
      `"${s.code}"`,
      `"${s.licenseKey}"`,
      `"${s.governorate}"`,
      s.studentsCount,
      s.teachersCount,
      `"${s.subscription}"`,
      `"${s.status}"`,
      `"${s.principalName}"`,
      `"${s.principalPhone}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `مدارس_مصر_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('تم تصدير البيانات بنجاح', `تم تحميل ملف CSV يحتوي على ${sortedSchools.length} مدرسة`);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedGov('ALL');
    setSelectedStatus('ALL');
    setSelectedPlan('ALL');
    setSortBy('date');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Table Header & Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              سجل المدارس المصرية المسجلة ({formatArabicNumber(sortedSchools.length)})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              إدارة المدارس، متابعة تراخيص التشغيل، التعديل، والحظر أو التفعيل
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>تصدير CSV</span>
            </button>

            <button
              onClick={onOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مدرسة جديدة</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
          {/* Search Field */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="اسم المدرسة، كود، أو الترخيص..."
              className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            />
          </div>

          {/* Governorate Select */}
          <div>
            <select
              value={selectedGov}
              onChange={(e) => {
                setSelectedGov(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all cursor-pointer"
            >
              <option value="ALL">جميع المحافظات (18)</option>
              {EGYPT_GOVERNORATES.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
          </div>

          {/* Status Select */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all cursor-pointer"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="نشطة">نشطة فقط</option>
              <option value="معلقة">معلقة فقط</option>
            </select>
          </div>

          {/* Subscription Select */}
          <div>
            <select
              value={selectedPlan}
              onChange={(e) => {
                setSelectedPlan(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all cursor-pointer"
            >
              <option value="ALL">جميع الاشتراكات</option>
              <option value="بريميوم">بريميوم</option>
              <option value="احترافي">احترافي</option>
              <option value="أساسي">أساسي</option>
            </select>
          </div>

          {/* Sorting */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all cursor-pointer font-medium"
            >
              <option value="date">الأحدث إنشاءً</option>
              <option value="name">أبجدياً بالاسم</option>
              <option value="students">الأكثر طلاباً</option>
              <option value="teachers">الأكثر معلمين</option>
            </select>
          </div>
        </div>

        {/* Active Filters Bar */}
        {(searchQuery || selectedGov !== 'ALL' || selectedStatus !== 'ALL' || selectedPlan !== 'ALL') && (
          <div className="flex items-center gap-2 pt-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">الفلاتر النشطة:</span>
            {selectedGov !== 'ALL' && (
              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-medium">
                المحافظة: {selectedGov}
              </span>
            )}
            {selectedStatus !== 'ALL' && (
              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-medium">
                الحالة: {selectedStatus}
              </span>
            )}
            {selectedPlan !== 'ALL' && (
              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-medium">
                الاشتراك: {selectedPlan}
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-red-600 hover:underline flex items-center gap-1 font-semibold mr-auto"
            >
              <X className="w-3.5 h-3.5" />
              إعادة ضبط الفلاتر
            </button>
          </div>
        )}
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {paginatedSchools.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">لم يتم العثور على مدارس مطابقة</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              تأكد من صحة كلمات البحث أو قم بتغيير الخيارات المحددة في الفلاتر اعلاه.
            </p>
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              إلغاء جميع الفلاتر
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[11px]">
                  <th className="py-3.5 px-4">اسم المدرسة الكود والترخيص</th>
                  <th className="py-3.5 px-4">المحافظة</th>
                  <th className="py-3.5 px-4">الطلاب</th>
                  <th className="py-3.5 px-4">المعلمين</th>
                  <th className="py-3.5 px-4">الاشتراك</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedSchools.map((school) => (
                  <tr
                    key={school.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* School Name & Generated Keys */}
                    <td className="py-4 px-4">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block group-hover:text-blue-600 transition-colors">
                          {school.name}
                        </span>
                        <div className="flex items-center gap-2 mt-1 font-mono text-[11px] text-slate-500">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                            {school.code}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1 text-slate-600">
                            {school.licenseKey}
                            <button
                              onClick={() => copyLicenseKey(school.licenseKey, school.name)}
                              className="text-slate-400 hover:text-blue-600 cursor-pointer p-0.5"
                              title="نسخ مفتاح الترخيص"
                            >
                              {copiedKey === school.licenseKey ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Governorate */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
                        {school.governorate}
                      </span>
                    </td>

                    {/* Students */}
                    <td className="py-4 px-4 font-bold text-slate-900">
                      {formatArabicNumber(school.studentsCount)}
                    </td>

                    {/* Teachers */}
                    <td className="py-4 px-4 font-bold text-slate-700">
                      {formatArabicNumber(school.teachersCount)}
                    </td>

                    {/* Subscription */}
                    <td className="py-4 px-4">
                      <PlanBadge plan={school.subscription} />
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <StatusBadge status={school.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-left">
                      <div className="inline-flex items-center gap-1 bg-white border border-slate-200/80 rounded-xl p-1 shadow-2xs">
                        {/* School Admin Portal Quick Entry */}
                        {onOpenAdminDashboard && (
                          <button
                            onClick={() => onOpenAdminDashboard(school.id)}
                            title="الانتقال الفوري للوحة إدارة المدرسة"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <GraduationCap className="w-4 h-4" />
                          </button>
                        )}

                        {/* Details */}
                        <button
                          onClick={() => onViewDetails(school)}
                          title="عرض ملف المدرسة بالكامل"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onEditSchool(school)}
                          title="تعديل بيانات المدرسة"
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Suspend / Activate */}
                        <button
                          onClick={() => onToggleSuspend(school)}
                          title={
                            school.status === 'نشطة'
                              ? 'تعليق حساب الترخيص'
                              : 'إعادة تفعيل الترخيص والمدرسة'
                          }
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            school.status === 'نشطة'
                              ? 'text-slate-600 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {school.status === 'نشطة' ? (
                            <Ban className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteSchool(school)}
                          title="حذف المدرسة نهائياً"
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50/50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
            <span>
              عرض {formatArabicNumber((currentPage - 1) * pageSize + 1)} إلى{' '}
              {formatArabicNumber(
                Math.min(currentPage * pageSize, sortedSchools.length)
              )}{' '}
              من إجمالي {formatArabicNumber(sortedSchools.length)} مدرسة
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <span className="font-bold px-2 text-slate-800">
                صفحة {formatArabicNumber(currentPage)} من {formatArabicNumber(totalPages)}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
