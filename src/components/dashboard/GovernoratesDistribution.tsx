import React from 'react';
import { School } from '../../types';
import { formatArabicNumber } from '../../lib/storage';
import { MapPin, ArrowUpRight } from 'lucide-react';

interface GovernoratesDistributionProps {
  schools: School[];
  onSelectGovernorate?: (gov: string) => void;
}

export function GovernoratesDistribution({
  schools,
  onSelectGovernorate,
}: GovernoratesDistributionProps) {
  // Aggregate count by governorate
  const govMap: Record<string, { schools: number; students: number }> = {};
  schools.forEach((s) => {
    if (!govMap[s.governorate]) {
      govMap[s.governorate] = { schools: 0, students: 0 };
    }
    govMap[s.governorate].schools += 1;
    govMap[s.governorate].students += s.studentsCount;
  });

  const sortedGovs = Object.entries(govMap)
    .sort((a, b) => b[1].schools - a[1].schools)
    .slice(0, 6);

  const maxCount = Math.max(...sortedGovs.map(([, data]) => data.schools), 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              توزيع المدارس حسب المحافظة
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              أعلى المحافظات المصرية نشاطاً وتسجيلاً في المنصة
            </p>
          </div>
          <span className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer flex items-center gap-0.5">
            عرض الكل
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="space-y-4">
          {sortedGovs.map(([gov, data]) => {
            const percentage = Math.round((data.schools / maxCount) * 100);
            return (
              <div
                key={gov}
                onClick={() => onSelectGovernorate?.(gov)}
                className="group cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-800 group-hover:text-blue-600 transition-colors">
                    محافظة {gov}
                  </span>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span>{formatArabicNumber(data.schools)} مدرسة</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400 font-normal">
                      {formatArabicNumber(data.students)} طالب
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>مجموع المحافظات المغطاة: {formatArabicNumber(Object.keys(govMap).length)} محافظة</span>
        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
          تغطية 100%
        </span>
      </div>
    </div>
  );
}
