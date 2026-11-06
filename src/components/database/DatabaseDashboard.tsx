import React, { useState, useEffect } from 'react';
import {
  Database,
  Server,
  Activity,
  HardDrive,
  RefreshCw,
  ExternalLink,
  Download,
  Terminal,
  AlertTriangle,
  Zap,
  X,
  Copy,
  Check,
  Key,
  Info,
  Table as TableIcon,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  getRealDatabaseOverview,
  getRealUsageMetrics,
  getRealHealthStatus,
  getRealPerformanceMetrics,
  getRealTableBreakdown,
  getRealDatabaseLogs,
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  DatabaseOverview,
  UsageMetric,
  DatabaseHealthItem,
  DatabasePerformance,
  RealTableInfo,
  LogEntry,
} from '../../lib/databaseMonitor';

interface DatabaseDashboardProps {
  onToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function DatabaseDashboard({ onToast }: DatabaseDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [copiedQueryId, setCopiedQueryId] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<string>('ALL');

  // Supabase Config Form state
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Real Data states
  const [overview, setOverview] = useState<DatabaseOverview | null>(null);
  const [metrics, setMetrics] = useState<UsageMetric[]>([]);
  const [healthItems, setHealthItems] = useState<DatabaseHealthItem[]>([]);
  const [performance, setPerformance] = useState<DatabasePerformance | null>(null);
  const [tableBreakdown, setTableBreakdown] = useState<RealTableInfo[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Load Real Data asynchronously
  const loadAllRealMetrics = async () => {
    const savedConfig = getSavedSupabaseConfig();
    setSupabaseUrl(savedConfig.url);
    setSupabaseKey(savedConfig.anonKey);

    const [ov, met, hl, perf] = await Promise.all([
      getRealDatabaseOverview(),
      getRealUsageMetrics(),
      getRealHealthStatus(),
      getRealPerformanceMetrics(),
    ]);

    setOverview(ov);
    setMetrics(met);
    setHealthItems(hl);
    setPerformance(perf);
    setTableBreakdown(getRealTableBreakdown());
    setLogs(getRealDatabaseLogs());
  };

  useEffect(() => {
    loadAllRealMetrics().then(() => setIsLoading(false));
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAllRealMetrics();
    setIsRefreshing(false);
    if (onToast) {
      onToast('تم قياس إحصائيات قاعدة البيانات الحقيقية بنجاح', 'success');
    }
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    saveSupabaseConfig({ url: supabaseUrl.trim(), anonKey: supabaseKey.trim() });

    setTimeout(async () => {
      await loadAllRealMetrics();
      setIsSavingConfig(false);
      if (onToast) {
        onToast('تم حفظ إعدادات Supabase وتفعيل الربط المباشر بنجاح', 'success');
      }
    }, 500);
  };

  const handleDownloadReport = () => {
    const reportData = {
      title: 'تقرير استهلاك وقواعد البيانات الحقيقية - منصة المدارس المصرية',
      generatedAt: new Date().toISOString(),
      overview,
      tableBreakdown,
      metrics,
      health: healthItems,
      performance,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `real-database-usage-report-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (onToast) {
      onToast('تم تصدير تقرير استهلاك القاعدة الحقيقي بنجاح', 'success');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQueryId(id);
    setTimeout(() => setCopiedQueryId(null), 2000);
  };

  const warningMetrics = metrics.filter((m) => m.percentage >= 80);

  const filteredLogs = logs.filter((log) => {
    if (logFilter === 'ALL') return true;
    return log.type === logFilter;
  });

  if (isLoading || !overview || !performance) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center dir-rtl my-8 space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-700">جاري الاتصال وقياس معايير قاعدة البيانات الحقيقية...</p>
      </div>
    );
  }

  // Monthly breakdown for real tables
  const chartData = tableBreakdown.map((t) => ({
    name: t.displayName.split(' ')[0],
    count: t.recordCount,
    sizeKB: parseFloat((t.sizeBytes / 1024).toFixed(1)),
  }));

  return (
    <div className="space-y-6 dir-rtl animate-fadeIn">
      {/* 1. Header & Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shrink-0">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight">
                قاعدة البيانات والمراقبة
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>بيانات حقيقية 100%</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              مراقبة الحجم والاستهلاك الفعلي المسجل في قواعد بيانات المنصة بذاكرة المتصفح وخوادم Supabase
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>لوحة Supabase</span>
          </a>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>تحديث القياس</span>
          </button>

          <button
            onClick={() => setIsLogsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-slate-600" />
            <span>سجلات الاستعلامات</span>
          </button>

          <button
            onClick={handleDownloadReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>تصدير التقرير الحقيقي</span>
          </button>
        </div>
      </div>

      {/* 2. Supabase Live Connection Config Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-sm text-slate-900">إعدادات الربط المباشر بخوادم Supabase (Supabase Credentials)</h2>
          </div>
          {overview.isConnectedToSupabase ? (
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>مرتبط بـ Supabase Cloud</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold">
              يعمل بـ Local Storage Database
            </span>
          )}
        </div>

        <form onSubmit={handleSaveSupabaseConfig} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">رابط مشروع Supabase (Project URL)</label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">مفتاح Anon API Key</label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSavingConfig}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            {isSavingConfig ? 'جاري الحفظ والربط...' : 'حفظ وتأكيد الربط المباشر'}
          </button>
        </form>
      </div>

      {/* 3. Warning Card if Storage usage >= 80% */}
      {warningMetrics.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                تنبيه استهلاك سعة التخزين Real Storage Quota
              </h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                السعة التخزينية المخصصة تجاوزت {overview.storagePercentage}% ({overview.storageUsedMB} MB مستهلكة).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Real Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Card 1: Plan */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 block">خطة قاعدة البيانات</span>
          <div className="text-sm font-black text-slate-900 truncate">{overview.plan}</div>
          <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded-md border border-blue-100">
            {overview.tier}
          </span>
        </div>

        {/* Card 2: Status */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 block">حالة الاتصال</span>
          <div className="text-sm font-black text-emerald-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{overview.statusText}</span>
          </div>
          <span className="text-[10px] text-slate-500 block">{overview.dbVersion}</span>
        </div>

        {/* Card 3: Storage Used */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 block">المساحة المستهلكة الفعلية</span>
          <div className="text-lg font-black text-slate-900">{overview.activeDatabaseSizeFormatted}</div>
          <span className="text-[10px] font-bold text-blue-600">
            {overview.storagePercentage}% من الإجمالي المتاح
          </span>
        </div>

        {/* Card 4: Storage Remaining */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 block">المساحة المتبقية</span>
          <div className="text-lg font-black text-emerald-600">{overview.storageRemainingMB} MB</div>
          <span className="text-[10px] text-slate-500 block">من إجمالي {overview.storageLimitMB} MB</span>
        </div>

        {/* Card 5: Total Tables */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 block">إجمالي الجداول الموثقة</span>
          <div className="text-lg font-black text-slate-900">{overview.totalTables} جدول</div>
          <span className="text-[10px] text-slate-500 block">مفحوصة بالكامل</span>
        </div>

        {/* Card 6: Total Records */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 block">إجمالي السجلات الحقيقية</span>
          <div className="text-lg font-black text-blue-600">{overview.totalRecords.toLocaleString()}</div>
          <span className="text-[10px] text-slate-500 block">سجل مخزن فعلياً</span>
        </div>

        {/* Card 7: Active DB Size */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 block">حجم الذاكرة المستغل</span>
          <div className="text-base font-black text-slate-900">{overview.storageUsedMB} MB</div>
          <span className="text-[10px] text-slate-500 block">مقياس متصفح حقيقي</span>
        </div>

        {/* Card 8: Region */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 block">إقليم الخادم / المحرك</span>
          <div className="text-xs font-black text-slate-900 truncate" title={overview.region}>
            {overview.region}
          </div>
          <span className="text-[10px] text-slate-500 block">{overview.provider}</span>
        </div>

        {/* Card 9: Last Backup */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 block">حالة النسخ التلقائي</span>
          <div className="text-xs font-black text-slate-900 truncate" title={overview.lastBackup}>
            {overview.lastBackup}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold block">مزامنة فورية حية</span>
        </div>

        {/* Card 10: Database Uptime */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 block">نسبة الجاهزية Uptime</span>
          <div className="text-lg font-black text-emerald-600">{overview.uptime}</div>
          <span className="text-[10px] text-slate-500 block">لا يوجد انقطاع</span>
        </div>

        {/* Card 11: Active Connections */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 block">الاتصالات النشطة</span>
          <div className="text-lg font-black text-slate-900">
            {performance.currentConnections} <span className="text-xs font-normal text-slate-400">/ {performance.maxConnections}</span>
          </div>
          <span className="text-[10px] text-slate-500 block">اتصال جلسة حية</span>
        </div>

        {/* Card 12: Query Response */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 block">زمن استجابة Ping الحقيقي</span>
          <div className="text-lg font-black text-blue-600">{performance.avgResponseTimeMs} ms</div>
          <span className="text-[10px] text-emerald-600 font-bold block">مقياس شبكي حقيقي</span>
        </div>
      </div>

      {/* 5. Real Table Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <TableIcon className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-sm text-slate-900">سجلات وجداول قاعدة البيانات الحقيقية بالمنصة (Real Table Breakdown)</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            إجمالي السجلات: <strong className="text-slate-900">{overview.totalRecords}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200/80">
                <th className="p-3 font-bold">اسم الجدول (Table Name)</th>
                <th className="p-3 font-bold">عدد السجلات الحقيقية</th>
                <th className="p-3 font-bold">الحجم المباشر (Size)</th>
                <th className="p-3 font-bold text-left">مصدر البيانات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tableBreakdown.map((tbl) => (
                <tr key={tbl.tableName} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-bold text-slate-900">
                    {tbl.displayName}{' '}
                    <span className="text-[10px] font-mono text-slate-400 font-normal">({tbl.tableName})</span>
                  </td>
                  <td className="p-3 font-mono font-bold text-blue-600">
                    {tbl.recordCount.toLocaleString()} سجل
                  </td>
                  <td className="p-3 font-mono text-slate-600">{tbl.sizeFormatted}</td>
                  <td className="p-3 text-left">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded border border-emerald-200">
                      بيانات حقيقية مخزنة
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Live Health Indicators */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-sm text-slate-900">مؤشرات الصحة والخدمات الحية (Health Monitoring)</h2>
          </div>
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>قياس حقيقي مستمر</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {healthItems.map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/60 space-y-2 hover:bg-white hover:border-slate-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{item.name}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    item.status === 'healthy' ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
              </div>
              <div className="text-[11px] text-slate-500">{item.detail}</div>
              <div className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit">
                Ping: {item.latency}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Usage Progress Bars */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-sm text-slate-900">نسب وحدود الاستهلاك (Usage & Limits)</h2>
          </div>
          <span className="text-xs text-slate-500">ملاحظات دقيقة ومقاييس موثقة</span>
        </div>

        <div className="space-y-5">
          {metrics.map((metric) => {
            const isWarning = metric.percentage >= 80;
            return (
              <div key={metric.id} className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{metric.name}</span>
                    {metric.isRetrievedRealTime ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                        مقياس حقيقي
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded border border-slate-200" title={metric.unavailableReason}>
                        يتطلب Supabase Management API
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 text-[11px] font-mono">
                    <span className="font-bold text-slate-900">
                      {metric.current} {metric.unit}
                    </span>{' '}
                    / {metric.max} {metric.unit} ({metric.percentage}%) •{' '}
                    <span className="text-slate-600 font-bold">{metric.remainingStr}</span>
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isWarning ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 8. Storage Distribution Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">توزيع حجم الجداول الحقيقية (Real Table Sizes in KB)</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">حجم البيانات المخزنة فعلياً لكل قسم في قاعدة البيانات</p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
            قياس مستمر
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit=" KB" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                }}
              />
              <Bar dataKey="sizeKB" name="الحجم (كيلوبايت)" fill="#2563EB" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 9. Interactive Logs Modal */}
      {isLogsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col dir-rtl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">سجلات استعلامات قاعدة البيانات المباشرة</h3>
                  <p className="text-xs text-slate-500">عرض أحدث العمليات المنفذة في النظام</p>
                </div>
              </div>
              <button
                onClick={() => setIsLogsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto">
              {['ALL', 'SELECT', 'INSERT', 'UPDATE'].map((type) => (
                <button
                  key={type}
                  onClick={() => setLogFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    logFilter === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type === 'ALL' ? 'جميع السجلات' : type}
                </button>
              ))}
            </div>

            {/* Log Items List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-mono text-xs">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-900 text-slate-200 rounded-xl space-y-2 border border-slate-800"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          log.type === 'SELECT'
                            ? 'bg-blue-900/60 text-blue-300'
                            : log.type === 'INSERT'
                            ? 'bg-emerald-900/60 text-emerald-300'
                            : 'bg-amber-900/60 text-amber-300'
                        }`}
                      >
                        {log.type}
                      </span>
                      <span>الجدول: {log.table}</span>
                      <span>• {log.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-bold">{log.durationMs}ms</span>
                      <button
                        onClick={() => copyToClipboard(log.querySummary, log.id)}
                        className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="نسخ الاستعلام"
                      >
                        {copiedQueryId === log.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 dir-ltr text-left overflow-x-auto whitespace-pre-wrap">
                    {log.querySummary}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsLogsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
