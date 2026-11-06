import type { Request, Response, NextFunction } from 'express';
import os from 'os';
import { db } from '../src/db/index.ts';
import { sql } from 'drizzle-orm';
import { requireOwnerAuth } from './serverAuth.ts';

export { requireOwnerAuth };

// Server-level request metrics tracking (in-memory sliding window)
interface RequestMetrics {
  totalRequests: number;
  successRequests: number;
  errorRequests: number;
  startTime: number;
  recentLatenciesMs: number[];
  recentStatusCodes: { [code: number]: number };
}

const metricsState: RequestMetrics = {
  totalRequests: 0,
  successRequests: 0,
  errorRequests: 0,
  startTime: Date.now(),
  recentLatenciesMs: [],
  recentStatusCodes: {},
};

/**
 * Middleware to track live server traffic, response status codes, and latencies
 */
export function platformUsageTrackingMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  metricsState.totalRequests += 1;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // Track latency (maintain sliding window of last 100 requests)
    metricsState.recentLatenciesMs.push(duration);
    if (metricsState.recentLatenciesMs.length > 100) {
      metricsState.recentLatenciesMs.shift();
    }

    // Track status codes
    metricsState.recentStatusCodes[statusCode] = (metricsState.recentStatusCodes[statusCode] || 0) + 1;

    if (statusCode >= 400) {
      metricsState.errorRequests += 1;
    } else {
      metricsState.successRequests += 1;
    }
  });

  next();
}

/**
 * CPU Usage calculation helper over a short interval
 */
function getCpuUsagePercent(): Promise<number> {
  return new Promise((resolve) => {
    const cpus1 = os.cpus();
    const startIdle = cpus1.reduce((acc, cpu) => acc + cpu.times.idle, 0);
    const startTotal = cpus1.reduce(
      (acc, cpu) => acc + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq + cpu.times.idle,
      0
    );

    setTimeout(() => {
      const cpus2 = os.cpus();
      const endIdle = cpus2.reduce((acc, cpu) => acc + cpu.times.idle, 0);
      const endTotal = cpus2.reduce(
        (acc, cpu) => acc + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq + cpu.times.idle,
        0
      );

      const idleDelta = endIdle - startIdle;
      const totalDelta = endTotal - startTotal;

      if (totalDelta <= 0) {
        resolve(0);
        return;
      }

      const usage = 100 - (100 * idleDelta) / totalDelta;
      resolve(Math.max(0, Math.min(100, Math.round(usage))));
    }, 150);
  });
}

export interface PlatformUsageData {
  timestamp: string;
  server: {
    status: 'normal' | 'warning' | 'critical';
    statusText: string;
    runtime: string;
    nodeVersion: string;
    platform: string;
    architecture: string;
    serverUptimeSeconds: number;
    serverUptimeFormatted: string;
    processUptimeSeconds: number;
  };
  hosting: {
    provider: string;
    environment: string;
    serviceName: string | null;
    revisionName: string | null;
    cloudRegion: string | null;
    containerCores: number;
    cpuUsagePercent: number;
    cpuStatus: 'normal' | 'warning' | 'critical';
    totalMemoryBytes: number;
    totalMemoryMB: number;
    usedMemoryBytes: number;
    usedMemoryMB: number;
    freeMemoryMB: number;
    memoryUsagePercent: number;
    memoryStatus: 'normal' | 'warning' | 'critical';
    processMemoryMB: number;
    networkBandwidthStatus: string; // 'غير متاح حالياً' if provider doesn't expose real-time ingress interface
    hostingQuotaLimit: string; // 'حسب خطة Cloud Run'
  };
  traffic: {
    totalRequests: number;
    successRequests: number;
    errorRequests: number;
    errorRatePercent: number;
    avgLatencyMs: number;
    trafficStatus: 'normal' | 'warning' | 'critical';
  };
  database: {
    engine: string;
    version: string;
    databaseName: string;
    hostSocket: string;
    totalSizeBytes: number;
    totalSizePretty: string;
    storageUsagePercent: number | null; // null if disk total unconstrained/cloud-managed
    storageQuotaPretty: string; // Cloud SQL Developer Free Tier / Auto-scaling
    activeConnections: number;
    totalConnections: number;
    maxConnections: number;
    connectionsUsagePercent: number;
    dbUptimeFormatted: string;
    dbStatus: 'normal' | 'warning' | 'critical';
    tableStats: Array<{
      tableName: string;
      rowCount: number;
      sizePretty: string;
      sizeBytes: number;
    }>;
  };
  unavailableMetrics: Array<{
    name: string;
    reason: string;
  }>;
}

export async function gatherPlatformUsage(): Promise<PlatformUsageData> {
  const cpuPercent = await getCpuUsagePercent();
  
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = Math.round((usedMem / totalMem) * 100);
  const processMem = process.memoryUsage();

  // Traffic and Latency
  const totalReq = metricsState.totalRequests;
  const errReq = metricsState.errorRequests;
  const errorRatePercent = totalReq > 0 ? Number(((errReq / totalReq) * 100).toFixed(1)) : 0;
  const latencies = metricsState.recentLatenciesMs;
  const avgLatencyMs = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

  // Cloud Run / GCP Environment detection
  const kService = process.env.K_SERVICE || null;
  const kRevision = process.env.K_REVISION || null;
  const isCloudRun = Boolean(kService || process.env.CLOUD_RUN_TIMEOUT_SECONDS);
  const hostProvider = isCloudRun ? 'Google Cloud Run' : 'Node.js Container Runtime';
  const cloudRegion = process.env.NG_ALLOWED_HOSTS?.includes('europe-west2') ? 'europe-west2 (London)' : 'Google Cloud Platform';

  // Database stats from PostgreSQL
  let dbSizePretty = 'غير متاح حالياً';
  let dbSizeBytes = 0;
  let activeConn = 1;
  let totalConn = 1;
  let maxConn = 50;
  let pgVer = 'PostgreSQL';
  let dbStartTime: string | null = null;
  let tableStats: Array<{ tableName: string; rowCount: number; sizePretty: string; sizeBytes: number }> = [];

  try {
    const sizeRes = await db.execute(sql`SELECT pg_size_pretty(pg_database_size(current_database())) as size, pg_database_size(current_database()) as bytes;`);
    if (sizeRes?.rows?.[0]) {
      const row = sizeRes.rows[0] as any;
      dbSizePretty = row.size || dbSizePretty;
      dbSizeBytes = Number(row.bytes || 0);
    }

    const connRes = await db.execute(sql`SELECT count(*) as total, count(*) filter (where state = 'active') as active FROM pg_stat_activity WHERE datname = current_database();`);
    if (connRes?.rows?.[0]) {
      const row = connRes.rows[0] as any;
      totalConn = Number(row.total || 1);
      activeConn = Number(row.active || 1);
    }

    const verRes = await db.execute(sql`SELECT version(), current_setting('max_connections') as max_connections, pg_postmaster_start_time() as start_time;`);
    if (verRes?.rows?.[0]) {
      const row = verRes.rows[0] as any;
      pgVer = (row.version || 'PostgreSQL').split(' on ')[0];
      maxConn = Number(row.max_connections || 50);
      dbStartTime = row.start_time ? new Date(row.start_time).toISOString() : null;
    }

    const tablesRes = await db.execute(sql`
      SELECT relname as table_name, 
             n_live_tup as row_count, 
             pg_size_pretty(pg_total_relation_size(relid)) as total_size,
             pg_total_relation_size(relid) as bytes
      FROM pg_stat_user_tables 
      ORDER BY pg_total_relation_size(relid) DESC
      LIMIT 10;
    `);
    if (tablesRes?.rows) {
      tableStats = tablesRes.rows.map((r: any) => ({
        tableName: r.table_name || '',
        rowCount: Number(r.row_count || 0),
        sizePretty: r.total_size || '',
        sizeBytes: Number(r.bytes || 0),
      }));
    }
  } catch (err) {
    console.error('Error fetching real DB usage metrics:', err);
  }

  // Calculate status levels
  const cpuStatus: 'normal' | 'warning' | 'critical' = cpuPercent > 85 ? 'critical' : cpuPercent > 65 ? 'warning' : 'normal';
  const memoryStatus: 'normal' | 'warning' | 'critical' = memUsagePercent > 85 ? 'critical' : memUsagePercent > 70 ? 'warning' : 'normal';
  
  const connUsagePercent = Math.round((totalConn / maxConn) * 100);
  const dbStatus: 'normal' | 'warning' | 'critical' = connUsagePercent > 80 ? 'critical' : connUsagePercent > 60 ? 'warning' : 'normal';

  const trafficStatus: 'normal' | 'warning' | 'critical' = errorRatePercent > 15 ? 'critical' : errorRatePercent > 5 ? 'warning' : 'normal';

  // Overall server status
  let serverStatus: 'normal' | 'warning' | 'critical' = 'normal';
  let statusText = 'يعمل بشكل طبيعي ومستقر';

  if (cpuStatus === 'critical' || memoryStatus === 'critical' || dbStatus === 'critical') {
    serverStatus = 'critical';
    statusText = 'استهلاك مرتفع جداً - يتطلب الانتباه';
  } else if (cpuStatus === 'warning' || memoryStatus === 'warning' || dbStatus === 'warning' || trafficStatus === 'warning') {
    serverStatus = 'warning';
    statusText = 'ضغط متوسط على الموارد';
  }

  const serverUptimeSeconds = Math.round(os.uptime());
  const hours = Math.floor(serverUptimeSeconds / 3600);
  const minutes = Math.floor((serverUptimeSeconds % 3600) / 60);
  const serverUptimeFormatted = `${hours} ساعة و ${minutes} دقيقة`;

  let dbUptimeFormatted = 'غير متاح حالياً';
  if (dbStartTime) {
    const dbDiffMs = Date.now() - new Date(dbStartTime).getTime();
    const dbHours = Math.floor(dbDiffMs / (1000 * 60 * 60));
    const dbMinutes = Math.floor((dbDiffMs % (1000 * 60 * 60)) / (1000 * 60));
    dbUptimeFormatted = `${dbHours} ساعة و ${dbMinutes} دقيقة`;
  }

  return {
    timestamp: new Date().toISOString(),
    server: {
      status: serverStatus,
      statusText,
      runtime: `Node.js ${process.version}`,
      nodeVersion: process.version,
      platform: `${os.type()} ${os.arch()}`,
      architecture: os.arch(),
      serverUptimeSeconds,
      serverUptimeFormatted,
      processUptimeSeconds: Math.round(process.uptime()),
    },
    hosting: {
      provider: hostProvider,
      environment: isCloudRun ? 'Google Cloud Run Managed Container' : 'Local / Custom Container',
      serviceName: kService,
      revisionName: kRevision,
      cloudRegion: isCloudRun ? cloudRegion : null,
      containerCores: os.cpus().length,
      cpuUsagePercent: cpuPercent,
      cpuStatus,
      totalMemoryBytes: totalMem,
      totalMemoryMB: Math.round(totalMem / (1024 * 1024)),
      usedMemoryBytes: usedMem,
      usedMemoryMB: Math.round(usedMem / (1024 * 1024)),
      freeMemoryMB: Math.round(freeMem / (1024 * 1024)),
      memoryUsagePercent: memUsagePercent,
      memoryStatus,
      processMemoryMB: Math.round(processMem.rss / (1024 * 1024)),
      networkBandwidthStatus: 'غير متاح حالياً', // Cloud Monitoring API requires GCP Service Account OAuth
      hostingQuotaLimit: 'Cloud Run Auto-scaled (حتى 3600s/req)',
    },
    traffic: {
      totalRequests: totalReq,
      successRequests: metricsState.successRequests,
      errorRequests: errReq,
      errorRatePercent,
      avgLatencyMs,
      trafficStatus,
    },
    database: {
      engine: 'PostgreSQL (Cloud SQL)',
      version: pgVer,
      databaseName: process.env.SQL_DB_NAME || 'cloud_sql_development_database',
      hostSocket: process.env.SQL_HOST ? 'Cloud SQL Unix Socket' : 'Local TCP Socket',
      totalSizeBytes: dbSizeBytes,
      totalSizePretty: dbSizePretty,
      storageUsagePercent: null, // PostgreSQL Cloud SQL storage auto-extends
      storageQuotaPretty: 'مساحة مرنة (Cloud SQL Tier)',
      activeConnections: activeConn,
      totalConnections: totalConn,
      maxConnections: maxConn,
      connectionsUsagePercent: connUsagePercent,
      dbUptimeFormatted,
      dbStatus,
      tableStats,
    },
    unavailableMetrics: [
      {
        name: 'معدل نقل بيانات الشبكة الفعلي (Network I/O Bandwidth)',
        reason: 'يتطلب ربط مباشر مع Google Cloud Monitoring API وحساب خدمة مفوض',
      },
      {
        name: 'الحد الأقصى لمساحة قرص التخزين الكلي (Disk Capacity Total)',
        reason: 'تدار سعة التخزين تلقائياً بواسطة Cloud SQL Auto-Storage Expansion',
      },
    ],
  };
}
