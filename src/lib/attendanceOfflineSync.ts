import { AttendanceRecord, AttendanceStatus } from '../types/admin';
import { saveAttendanceRecordsApi, saveAttendanceSessionApi } from './schoolApi';
import { getStorage, setStorage, notifyDataChanged } from './adminStorage';

export interface PendingAttendanceBatch {
  id: string;
  schoolId: string;
  date: string;
  records: AttendanceRecord[];
  sessionObj?: any;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

export interface AttendanceWizardDraft {
  schoolId: string;
  dateIso: string;
  studentStatusMap: Record<string, AttendanceStatus>;
  studentClassMap: Record<string, string>;
  currentStep: number;
  elapsedSeconds: number;
  updatedAt: string;
}

const PENDING_QUEUE_KEY = 'eg_pending_attendance_batches_v1';
const DRAFT_PREFIX = 'eg_att_wizard_draft_';

// ---------------------------------------------------------------------------
// 1. Wizard Draft Auto-save and Recovery (Zero Data Loss during Taking Attendance)
// ---------------------------------------------------------------------------

export function saveAttendanceWizardDraft(
  schoolId: string,
  dateIso: string,
  draft: Omit<AttendanceWizardDraft, 'schoolId' | 'dateIso' | 'updatedAt'>
): void {
  try {
    if (!schoolId || !dateIso) return;
    const fullDraft: AttendanceWizardDraft = {
      ...draft,
      schoolId,
      dateIso,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`${DRAFT_PREFIX}${schoolId}_${dateIso}`, JSON.stringify(fullDraft));
  } catch (err) {
    console.warn('[Attendance Draft]: Failed to save draft:', err);
  }
}

export function getAttendanceWizardDraft(
  schoolId: string,
  dateIso: string
): AttendanceWizardDraft | null {
  try {
    if (!schoolId || !dateIso) return null;
    const raw = localStorage.getItem(`${DRAFT_PREFIX}${schoolId}_${dateIso}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAttendanceWizardDraft(schoolId: string, dateIso: string): void {
  try {
    localStorage.removeItem(`${DRAFT_PREFIX}${schoolId}_${dateIso}`);
  } catch {}
}

// ---------------------------------------------------------------------------
// 2. Offline Pending Queue Management
// ---------------------------------------------------------------------------

export function getPendingAttendanceBatches(schoolId?: string): PendingAttendanceBatch[] {
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY);
    const list: PendingAttendanceBatch[] = raw ? JSON.parse(raw) : [];
    if (schoolId) {
      return list.filter((b) => b.schoolId === schoolId);
    }
    return list;
  } catch {
    return [];
  }
}

export function enqueuePendingAttendanceBatch(
  schoolId: string,
  records: AttendanceRecord[],
  sessionObj?: any,
  errorMsg?: string
): PendingAttendanceBatch {
  const date = records[0]?.date || new Date().toISOString().split('T')[0];
  const list = getPendingAttendanceBatches();
  
  // Look for existing batch for same school and date
  const existingIdx = list.findIndex((b) => b.schoolId === schoolId && b.date === date);
  const batchId = existingIdx >= 0 ? list[existingIdx].id : `batch-${schoolId}-${date}-${Date.now()}`;
  
  const batch: PendingAttendanceBatch = {
    id: batchId,
    schoolId,
    date,
    records,
    sessionObj: sessionObj || list[existingIdx]?.sessionObj,
    createdAt: list[existingIdx]?.createdAt || new Date().toISOString(),
    retryCount: (list[existingIdx]?.retryCount || 0) + 1,
    lastError: errorMsg || 'انقطاع الاتصال بالإنترنت أثناء الحفظ',
  };

  if (existingIdx >= 0) {
    list[existingIdx] = batch;
  } else {
    list.push(batch);
  }

  localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(list));
  notifyDataChanged('attendance_pending_queue');

  window.dispatchEvent(
    new CustomEvent('attendance_offline_queued', {
      detail: { schoolId, date, batchId, totalRecords: records.length },
    })
  );

  return batch;
}

export function removePendingAttendanceBatch(batchId: string): void {
  try {
    const list = getPendingAttendanceBatches().filter((b) => b.id !== batchId);
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(list));
    notifyDataChanged('attendance_pending_queue');
  } catch {}
}

export function removePendingAttendanceByDate(schoolId: string, date: string): void {
  try {
    const list = getPendingAttendanceBatches().filter(
      (b) => !(b.schoolId === schoolId && b.date === date)
    );
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(list));
    notifyDataChanged('attendance_pending_queue');
  } catch {}
}

// ---------------------------------------------------------------------------
// 3. Flush & Synchronize Pending Queue with Server
// ---------------------------------------------------------------------------

let isFlushing = false;

export async function flushPendingAttendanceQueue(
  schoolId?: string
): Promise<{ syncedCount: number; failedCount: number; message: string }> {
  if (isFlushing) {
    return { syncedCount: 0, failedCount: 0, message: 'عملية المزامنة قيد التشغيل بالفعل' };
  }

  const batches = getPendingAttendanceBatches(schoolId);
  if (batches.length === 0) {
    return { syncedCount: 0, failedCount: 0, message: 'لا توجد سجلات معلقة بحاجة للمزامنة' };
  }

  isFlushing = true;
  let syncedCount = 0;
  let failedCount = 0;

  try {
    for (const batch of batches) {
      try {
        // 1. Send attendance records
        const serverSavedRecords = await saveAttendanceRecordsApi(batch.schoolId, batch.records);

        // 2. Send session metadata if present
        if (batch.sessionObj) {
          try {
            await saveAttendanceSessionApi(batch.schoolId, batch.sessionObj);
          } catch (sessErr) {
            console.warn('[Offline Sync]: Session metadata warning:', sessErr);
          }
        }

        // 3. Update local cache with authoritative server records (e.g. 3-late conversion)
        if (serverSavedRecords && serverSavedRecords.length > 0) {
          const all = getStorage<AttendanceRecord[]>('attendance', []);
          serverSavedRecords.forEach((rec) => {
            const idx = all.findIndex(
              (a) =>
                a.id === rec.id ||
                (a.schoolId === rec.schoolId && a.studentId === rec.studentId && a.date === rec.date)
            );
            if (idx >= 0) all[idx] = rec;
            else all.unshift(rec);
          });
          setStorage('attendance', all);
        }

        // Remove batch from pending queue
        removePendingAttendanceBatch(batch.id);
        syncedCount++;
      } catch (err: any) {
        console.warn(`[Offline Sync]: Failed to sync batch ${batch.id}:`, err);
        failedCount++;
        // Update batch error info
        batch.retryCount = (batch.retryCount || 0) + 1;
        batch.lastError = err?.message || 'فشلت المزامنة';
      }
    }

    if (syncedCount > 0) {
      notifyDataChanged('attendance');
      notifyDataChanged('attendance_sessions');
      notifyDataChanged('attendance_pending_queue');

      window.dispatchEvent(
        new CustomEvent('attendance_queue_flushed', {
          detail: { syncedCount, failedCount, timestamp: Date.now() },
        })
      );
    }

    return {
      syncedCount,
      failedCount,
      message: `تم مزامنة ${syncedCount} كشف حضور بنجاح${failedCount > 0 ? `، وتبقي ${failedCount} كشف معلق` : ''}.`,
    };
  } finally {
    isFlushing = false;
  }
}

// ---------------------------------------------------------------------------
// 4. Automatic Online Background Synchronization
// ---------------------------------------------------------------------------

if (typeof window !== 'undefined') {
  // Listen for internet restored
  window.addEventListener('online', () => {
    console.log('[Offline Sync]: Network connection restored. Flushing pending attendance queue...');
    flushPendingAttendanceQueue().catch((err) => {
      console.warn('[Offline Sync]: Automatic online flush error:', err);
    });
  });

  // Periodic background check every 60 seconds if online
  setInterval(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const pending = getPendingAttendanceBatches();
      if (pending.length > 0) {
        flushPendingAttendanceQueue().catch(() => {});
      }
    }
  }, 60000);
}
