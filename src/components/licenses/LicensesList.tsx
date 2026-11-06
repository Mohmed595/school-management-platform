import React, { useState } from 'react';
import { School, SubscriptionPlan } from '../../types';
import { PlanBadge, StatusBadge } from '../ui/Badge';
import { formatArabicNumber } from '../../lib/storage';
import { GenerateLicenseModal } from './GenerateLicenseModal';
import {
  KeyRound,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  ShieldCheck,
  Building2,
  RefreshCw,
} from 'lucide-react';

interface LicensesListProps {
  schools: School[];
  onGenerateLicense: (schoolId: string, newKey: string, newExpiry: string, plan: SubscriptionPlan) => void;
  onToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export function LicensesList({
  schools,
  onGenerateLicense,
  onToast,
}: LicensesListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredSchools = schools.filter((s) => {
    return (
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.licenseKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const copyLicenseKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    onToast('تم نسخ مفتاح الترخيص', key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const expiringCount = schools.filter((s) => s.status === 'معلقة' || s.licenseExpiry?.startsWith('2026-03') || s.licenseExpiry?.startsWith('2026-04')).length;
  const activePercent = schools.length > 0 ? ((schools.filter((s) => s.status === 'نشطة').length / schools.length) * 100).toFixed(1) : '100.0';

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">إجمالي التراخيص النشطة</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-slate-900">
            {formatArabicNumber(schools.filter((s) => s.status === 'نشطة').length)}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">تراخيص سارية بجميع المحافظات</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">تراخيص قاربت على الانتهاء</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-slate-900">
            {formatArabicNumber(expiringCount)}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">تتطلب تجديداً خلال الفترات القادمة</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">نسبة التراخيص السارية</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-slate-900">{activePercent}%</span>
          <p className="text-[11px] text-slate-400 mt-1">نسبة التراخيص النشطة بالنظام</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-600" />
              قائمة التراخيص ومفاتيح التشغيل
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              استعراض مفاتيح التشفير، تواريخ الانتهاء، وإصدار تراخيص جديدة
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم المدرسة أو الترخيص..."
                className="pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              />
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-2xs transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>إصدار ترخيص جديد</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[11px]">
                <th className="py-3.5 px-4">المدرسة</th>
                <th className="py-3.5 px-4">مفتاح الترخيص (License Key)</th>
                <th className="py-3.5 px-4">الخطة</th>
                <th className="py-3.5 px-4">تاريخ الإنشاء</th>
                <th className="py-3.5 px-4">تاريخ الانتهاء</th>
                <th className="py-3.5 px-4">حالة التشغيل</th>
                <th className="py-3.5 px-4 text-left">نسخ المفتاح</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredSchools.map((school) => (
                <tr key={school.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">
                        {school.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {school.governorate} • {school.code}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                    <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">
                      {school.licenseKey}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <PlanBadge plan={school.subscription} />
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 font-mono">
                    {school.createdAt}
                  </td>

                  <td className="py-3.5 px-4 text-slate-800 font-mono font-bold">
                    {school.licenseExpiry}
                  </td>

                  <td className="py-3.5 px-4">
                    <StatusBadge status={school.status} />
                  </td>

                  <td className="py-3.5 px-4 text-left">
                    <button
                      onClick={() => copyLicenseKey(school.licenseKey)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      {copiedKey === school.licenseKey ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>نسخ</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <GenerateLicenseModal
        schools={schools}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerateLicense={onGenerateLicense}
        onToast={onToast}
      />
    </div>
  );
}
