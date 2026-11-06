import { getStoredSession } from './storage';

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
    networkBandwidthStatus: string;
    hostingQuotaLimit: string;
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
    storageUsagePercent: number | null;
    storageQuotaPretty: string;
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

/**
 * Fetches real hosting and database metrics from the backend for the Owner.
 * Strict owner authorization header enforced.
 */
export async function fetchPlatformUsageApi(): Promise<PlatformUsageData> {
  const session = getStoredSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-User-Role': session?.userRole || 'owner',
  };

  if (session?.sessionToken) {
    headers['Authorization'] = `Bearer ${session.sessionToken}`;
  }

  const response = await fetch('/api/owner/platform-usage', {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    let errorMsg = 'تعذر الحصول على بيانات الاستضافة حالياً';
    try {
      const errData = await response.json();
      if (errData?.error) errorMsg = errData.error;
    } catch {}
    throw new Error(errorMsg);
  }

  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'تعذر الحصول على بيانات الاستضافة حالياً');
  }

  return result.data;
}
