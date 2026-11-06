import React from 'react';
import { School } from '../../types';
import { StatusBadge, PlanBadge } from '../ui/Badge';
import { formatArabicNumber } from '../../lib/storage';
import { Building2, ArrowLeft, Eye, Edit3, Ban, CheckCircle, Key } from 'lucide-react';

interface RecentSchoolsWidgetProps {
  schools: School[];
  onViewAll: () => void;
  onViewDetails: (school: School) => void;
  onEditSchool: (school: School) => void;
  onToggleSuspend: (school: School) => void;
}

export function RecentSchoolsWidget({
  schools,
  onViewAll,
  onViewDetails,
  onEditSchool,
  onToggleSuspend,
}: RecentSchoolsWidgetProps) {
  const recentSchools = schools.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-6 min-w-0 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>أحدث المدارس المسجلة حديثاً</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            قائمة بالمدارس المضافة مؤخراً إلى النظام بجميع المحافظات
          </p>
        </div>

        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/60 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <span>عرض جميع المدارس ({formatArabicNumber(schools.length)})</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto max-w-full border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
        <table className="w-full min-w-[520px] text-right text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[11px]">
              <th className="py-3 px-3">اسم المدرسة</th>
              <th className="py-3 px-3">المحافظة</th>
              <th className="py-3 px-3">الطلاب</th>
              <th className="py-3 px-3">الاشتراك</th>
              <th className="py-3 px-3">الحالة</th>
              <th className="py-3 px-3 text-left">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {recentSchools.map((school) => (
              <tr
                key={school.id}
                className="hover:bg-slate-50/80 transition-colors group"
              >
                <td className="py-3.5 px-3">
                  <div>
                    <span className="font-bold text-slate-900 block group-hover:text-blue-600 transition-colors">
                      {school.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {school.code} • {school.licenseKey}
                    </span>
                  </div>
                </td>

                <td className="py-3.5 px-3 text-slate-700">
                  {school.governorate}
                </td>

                <td className="py-3.5 px-3 text-slate-700 font-bold">
                  {formatArabicNumber(school.studentsCount)}
                </td>

                <td className="py-3.5 px-3">
                  <PlanBadge plan={school.subscription} />
                </td>

                <td className="py-3.5 px-3">
                  <StatusBadge status={school.status} />
                </td>

                <td className="py-3.5 px-3 text-left">
                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={() => onViewDetails(school)}
                      title="عرض التفاصيل الكاملة"
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onEditSchool(school)}
                      title="تعديل المخطط والتفاصيل"
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onToggleSuspend(school)}
                      title={school.status === 'نشطة' ? 'تعليق الترخيص' : 'إعادة تفعيل المدرسة'}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        school.status === 'نشطة'
                          ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                          : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {school.status === 'نشطة' ? (
                        <Ban className="w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
