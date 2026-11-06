import React, { useState, useEffect, useCallback } from 'react';
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  Activity,
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Cloud,
  Zap,
  Layers,
  HelpCircle,
  BarChart2,
  Radio,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { fetchPlatformUsageApi, PlatformUsageData } from '../../lib/platformUsageApi';

interface PlatformUsageViewProps {
  onToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function PlatformUsageView({ onToast }: PlatformUsageViewProps) {
  const [data, setData] = useState<PlatformUsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date | null>(null);
  const [minutesSinceUpdate, setMinutesSinceUpdate] = useState<number>(0);

  const loadUsageData = useCallback(
    async (showRefreshIndicator = false) => {
      try {
        if (showRefreshIndicator) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const result = await fetchPlatformUsageApi();
        setData(result);
        const now = new Date();
        setLastUpdatedTime(now);
        setMinutesSinceUpdate(0);

        if (showRefreshIndicator && onToast) {
          onToast('تم تحديث بيانات استهلاك المنصة بنجاح', 'success');
        }
      } catch (err: any) {
        console.error('Failed to load platform usage:', err);
        setError(err.message || 'تعذر الحصول على بيانات الاستضافة حالياً');
        if (showRefreshIndicator && onToast) {
          onToast(err.message || 'تعذر تحديث بيانات الاستضافة', 'error');
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [onToast]
  );

  useEffect(() => {
    loadUsageData();

    // Auto-refresh interval (every 45 seconds for a reasonable operational interval)
    const interval = setInterval(() => {
      loadUsageData(true);
    }, 45 * 1000);

    return () => clearInterval(interval);
  }, [loadUsageData]);

  // Update minutes-since-update counter every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (lastUpdatedTime) {
        const diffMinutes = Math.floor((Date.now() - lastUpdatedTime.getTime()) / 60000);
        setMinutesSinceUpdate(diffMinutes);
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [lastUpdatedTime]);

  const getStatusBadge = (status: 'normal' | 'warning' | 'critical', text?: string) => {
    if (status === 'normal') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {text || 'طبيعي'}
        </span>
      );
    }
    if (status === 'warning') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          {text || 'مرتفع'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
        <span className="w-2 h-2 rounded-full bg-rose-500" />
        {text || 'خطر'}
      </span>
    );
  };

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 animate-spin">
          <RefreshCw className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">جاري جلب بيانات الاستضافة...</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          يتم الاتصال بمزود الاستضافة وقاعدة البيانات السحابية لقراءة مقاييس الاستهلاك الفعلية.
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] bg-white rounded-2xl border border-rose-200 p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 mb-4">
          <XCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">تعذر الحصول على بيانات الاستضافة حالياً</h3>
        <p className="text-xs text-slate-500 mb-6 max-w-md">{error}</p>
        <button
          onClick={() => loadUsageData(false)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 max-w-full">
      {/* 1. Header & Quick Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">استخدام المنصة والاستضافة الفعلية</h2>
              {getStatusBadge(data.server.status, data.server.statusText)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              نظرة عامة ومباشرة على استهلاك المعالج، الذاكرة، وقاعدة البيانات السحابية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          <div className="text-left rtl:text-right text-[11px] text-slate-500">
            <span>آخر تحديث: </span>
            <span className="font-semibold text-slate-700">
              {minutesSinceUpdate === 0 ? 'منذ لحظات' : `منذ ${minutesSinceUpdate} دقيقة`}
            </span>
          </div>

          <button
            onClick={() => loadUsageData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            تحديث الآن
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Server Status */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">حالة الخادم</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">
              {data.server.status === 'normal' ? '🟢 يعمل بشكل طبيعي' : data.server.statusText}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>وقت التشغيل المتواصل:</span>
            <span className="font-semibold text-slate-700">{data.server.serverUptimeFormatted}</span>
          </div>
        </div>

        {/* Card 2: CPU Usage */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">استهلاك المعالج (CPU)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{data.hosting.cpuUsagePercent}%</span>
            {getStatusBadge(data.hosting.cpuStatus)}
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                data.hosting.cpuStatus === 'critical'
                  ? 'bg-rose-500'
                  : data.hosting.cpuStatus === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.max(4, data.hosting.cpuUsagePercent)}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
            <span>عدد الأنوية المتاحة:</span>
            <span className="font-semibold text-slate-700">{data.hosting.containerCores} Cores</span>
          </div>
        </div>

        {/* Card 3: Memory Usage */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">استهلاك الذاكرة (RAM)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{data.hosting.memoryUsagePercent}%</span>
            {getStatusBadge(data.hosting.memoryStatus)}
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                data.hosting.memoryStatus === 'critical'
                  ? 'bg-rose-500'
                  : data.hosting.memoryStatus === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${Math.max(4, data.hosting.memoryUsagePercent)}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
            <span>المستخدم:</span>
            <span className="font-semibold text-slate-700">
              {data.hosting.usedMemoryMB} MB / {data.hosting.totalMemoryMB} MB
            </span>
          </div>
        </div>

        {/* Card 4: Database Storage & Connections */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">قاعدة البيانات السحابية</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{data.database.totalSizePretty}</span>
            {getStatusBadge(data.database.dbStatus)}
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-teal-600 transition-all duration-500"
              style={{ width: `${Math.max(6, data.database.connectionsUsagePercent)}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
            <span>الاتصالات النشطة:</span>
            <span className="font-semibold text-slate-700">
              {data.database.activeConnections} من أصل {data.database.maxConnections}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Detailed Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Hosting Infrastructure */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">بيئة الاستضافة والخوادم</h3>
                <p className="text-xs text-slate-500">المعلومات التقنية لمزود الحوسبة السحابية</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
              {data.hosting.provider}
            </span>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
              <span className="text-slate-500">بيئة التشغيل (Runtime):</span>
              <span className="font-semibold text-slate-800">{data.server.runtime}</span>
            </div>

            <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
              <span className="text-slate-500">المنطقة الجغرافية (Region):</span>
              <span className="font-semibold text-slate-800">{data.hosting.cloudRegion || 'Google Cloud Run'}</span>
            </div>

            <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
              <span className="text-slate-500">حجم الذاكرة المخصصة للخادم:</span>
              <span className="font-semibold text-slate-800">{data.hosting.totalMemoryMB} ميجابايت (4 GB)</span>
            </div>

            <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
              <span className="text-slate-500">ذاكرة عملية Node.js الفعلية (RSS):</span>
              <span className="font-semibold text-indigo-700">{data.hosting.processMemoryMB} ميجابايت</span>
            </div>

            <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
              <span className="text-slate-500">معدل نقل بيانات الشبكة (Network I/O):</span>
              <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                {data.hosting.networkBandwidthStatus}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-2">
              <span className="text-slate-500">حدود مهلة الاستجابة (Quota Timeout):</span>
              <span className="font-semibold text-slate-800">{data.hosting.hostingQuotaLimit}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Database Infrastructure */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">قاعدة البيانات المركزية (PostgreSQL)</h3>
                <p className="text-xs text-slate-500">حجم الجداول ومؤشرات استهلاك التخزين الفعلي</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg">
              {data.database.engine}
            </span>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
              <span className="text-slate-500">إصدار المحرك (Engine Version):</span>
              <span className="font-semibold text-slate-800">{data.database.version}</span>
            </div>

            <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
              <span className="text-slate-500">اسم قاعدة البيانات:</span>
              <span className="font-semibold text-slate-800 font-mono text-[11px]">{data.database.databaseName}</span>
            </div>

            <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
              <span className="text-slate-500">إجمالي حجم البيانات الفعلي (DB Size):</span>
              <span className="font-bold text-teal-700">{data.database.totalSizePretty}</span>
            </div>

            <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
              <span className="text-slate-500">حصة التخزين (Storage Quota):</span>
              <span className="font-semibold text-slate-800">{data.database.storageQuotaPretty}</span>
            </div>

            <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
              <span className="text-slate-500">استهلاك اتصالات قاعدة البيانات:</span>
              <span className="font-semibold text-slate-800">
                {data.database.activeConnections} نشط / {data.database.maxConnections} أقصى حد
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-2">
              <span className="text-slate-500">وقت عمل قاعدة البيانات:</span>
              <span className="font-semibold text-slate-800">{data.database.dbUptimeFormatted}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Real Database Tables Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">توزيع التخزين الفعلي على جداول قاعدة البيانات</h3>
          </div>
          <span className="text-xs text-slate-500">أعلى الجداول استهلاكاً للمساحة</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/60">
                <th className="py-2.5 px-4 rounded-r-lg">اسم الجدول في PostgreSQL</th>
                <th className="py-2.5 px-4">عدد السجلات الفعلية</th>
                <th className="py-2.5 px-4 rounded-l-lg">الحجم الفعلي على القرص</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.database.tableStats.map((tbl, idx) => (
                <tr key={tbl.tableName || idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-800">{tbl.tableName}</td>
                  <td className="py-2.5 px-4 text-slate-600">{tbl.rowCount.toLocaleString()} سجل</td>
                  <td className="py-2.5 px-4 font-semibold text-teal-700">{tbl.sizePretty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Metrics Disclosure / Unavailable Metrics Transparency Card */}
      {data.unavailableMetrics && data.unavailableMetrics.length > 0 && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5">
          <div className="flex items-center gap-2 mb-2 text-slate-700">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <h4 className="text-xs font-bold">الشفافية في مؤشرات الاستضافة ومحدودية واجهات المزود:</h4>
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-600 pr-5 list-disc">
            {data.unavailableMetrics.map((item, idx) => (
              <li key={idx}>
                <span className="font-semibold text-slate-800">{item.name}</span>: {item.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
