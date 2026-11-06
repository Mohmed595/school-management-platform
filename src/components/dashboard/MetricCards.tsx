import React from 'react';
import { School } from '../../types';
import { formatArabicNumber } from '../../lib/storage';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Users,
  GraduationCap,
  TrendingUp,
} from 'lucide-react';

interface MetricCardsProps {
  schools: School[];
}

export function MetricCards({ schools }: MetricCardsProps) {
  const totalSchools = schools.length;
  const activeSchools = schools.filter((s) => s.status === 'نشطة').length;
  const suspendedSchools = schools.filter((s) => s.status === 'معلقة').length;
  const totalStudents = schools.reduce((acc, s) => acc + s.studentsCount, 0);
  const totalTeachers = schools.reduce((acc, s) => acc + s.teachersCount, 0);

  const cards = [
    {
      title: 'إجمالي المدارس',
      value: totalSchools,
      formatted: formatArabicNumber(totalSchools),
      subtext: 'مدرسة مسجلة بالمنصة',
      icon: <Building2 className="w-5 h-5 text-blue-600" />,
      badge: '+12% هذا الشهر',
      badgeBg: 'bg-blue-50 text-blue-700',
      border: 'border-slate-200/80',
    },
    {
      title: 'المدارس النشطة',
      value: activeSchools,
      formatted: formatArabicNumber(activeSchools),
      subtext: 'تراخيص سارية وبخدمة نشطة',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      badge: `${Math.round((activeSchools / (totalSchools || 1)) * 100)}% من الإجمالي`,
      badgeBg: 'bg-emerald-50 text-emerald-700',
      border: 'border-slate-200/80',
    },
    {
      title: 'المدارس المعلقة',
      value: suspendedSchools,
      formatted: formatArabicNumber(suspendedSchools),
      subtext: 'تحتاج مراجعة أو تجديد ترخيص',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      badge: suspendedSchools > 0 ? 'يتطلب إجراء' : 'لا يوجد تعليق',
      badgeBg: suspendedSchools > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600',
      border: 'border-slate-200/80',
    },
    {
      title: 'إجمالي الطلاب',
      value: totalStudents,
      formatted: formatArabicNumber(totalStudents),
      subtext: 'طالب وطالبة بجميع المحافظات',
      icon: <GraduationCap className="w-5 h-5 text-indigo-600" />,
      badge: 'موزعين على المدارس',
      badgeBg: 'bg-indigo-50 text-indigo-700',
      border: 'border-slate-200/80',
    },
    {
      title: 'إجمالي المعلمين',
      value: totalTeachers,
      formatted: formatArabicNumber(totalTeachers),
      subtext: 'معلم وإداري معتمد',
      icon: <Users className="w-5 h-5 text-cyan-600" />,
      badge: 'نسبة 1:15 لكل معلم',
      badgeBg: 'bg-cyan-50 text-cyan-700',
      border: 'border-slate-200/80',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`bg-white rounded-2xl p-5 border ${card.border} shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500">{card.title}</span>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                {card.icon}
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {card.formatted}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium truncate">
              {card.subtext}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${card.badgeBg} shrink-0`}>
              {card.badge}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
