import { InfractionMemo, InfractionDecision } from '../types/infraction';
import { getStorage, setStorage, notifyDataChanged } from './adminStorage';
import {
  fetchInfractionMemosApi,
  createInfractionMemoApi,
  submitInfractionDecisionApi,
  deleteInfractionMemoApi,
} from './schoolApi';
import { getStoredSession } from './storage';

const INFRACTIONS_STORAGE_KEY = 'school_infractions_v1';

export function getAllInfractionMemos(schoolId?: string): InfractionMemo[] {
  const memos = getStorage<InfractionMemo[]>(INFRACTIONS_STORAGE_KEY, []);
  if (!schoolId) return memos;
  return memos.filter((m) => m.schoolId === schoolId);
}

export function getTeacherInfractionMemos(schoolId: string, teacherId: string): InfractionMemo[] {
  const memos = getAllInfractionMemos(schoolId);
  return memos.filter((m) => m.teacherId === teacherId);
}

export async function fetchAndSyncInfractionMemos(schoolId: string): Promise<InfractionMemo[]> {
  try {
    const memos = await fetchInfractionMemosApi(schoolId);
    setStorage(INFRACTIONS_STORAGE_KEY, memos);
    return memos;
  } catch (err) {
    return getAllInfractionMemos(schoolId);
  }
}

export async function createInfractionMemo(
  memoData: Omit<InfractionMemo, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'adminDecision'> & {
    id?: string;
  }
): Promise<InfractionMemo> {
  const session = getStoredSession();
  const schoolId = memoData.schoolId || session?.schoolId || 'sch-1';

  try {
    const created = await createInfractionMemoApi(schoolId, memoData);
    const existing = getStorage<InfractionMemo[]>(INFRACTIONS_STORAGE_KEY, []);
    const updated = [created, ...existing.filter((m) => m.id !== created.id)];
    setStorage(INFRACTIONS_STORAGE_KEY, updated);
    notifyDataChanged('infraction_created');
    return created;
  } catch (err) {
    // Local fallback if offline
    const id = memoData.id || `infr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const fallbackMemo: InfractionMemo = {
      ...memoData,
      id,
      schoolId,
      status: 'قيد المراجعة',
      adminDecision: undefined,
      createdAt: now,
      updatedAt: now,
    };
    const existing = getStorage<InfractionMemo[]>(INFRACTIONS_STORAGE_KEY, []);
    const updated = [fallbackMemo, ...existing];
    setStorage(INFRACTIONS_STORAGE_KEY, updated);
    notifyDataChanged('infraction_created');
    return fallbackMemo;
  }
}

export async function decideInfractionMemo(
  schoolId: string,
  id: string,
  decision: {
    actionType: 'parent_summons' | 'temporary_suspension' | 'skip';
    decisionNotes?: string;
    decidedBy?: string;
    summonsDate?: string;
    summonsTime?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<InfractionMemo> {
  try {
    const updated = await submitInfractionDecisionApi(schoolId, id, decision);
    const existing = getStorage<InfractionMemo[]>(INFRACTIONS_STORAGE_KEY, []);
    const newMemos = existing.map((m) => (m.id === id ? updated : m));
    setStorage(INFRACTIONS_STORAGE_KEY, newMemos);
    notifyDataChanged('infraction_decided');
    // Also notify admin actions updated so any counters or list auto-refreshes
    notifyDataChanged('admin_action_created');
    return updated;
  } catch (err) {
    const existing = getStorage<InfractionMemo[]>(INFRACTIONS_STORAGE_KEY, []);
    const target = existing.find((m) => m.id === id);
    if (!target) throw err;

    let newStatus = target.status;
    if (decision.actionType === 'parent_summons') newStatus = 'تم استدعاء ولي أمر';
    else if (decision.actionType === 'temporary_suspension') newStatus = 'تم الفصل المؤقت';
    else if (decision.actionType === 'skip') newStatus = 'تم الحفظ والتخطي';

    const updated: InfractionMemo = {
      ...target,
      status: newStatus,
      adminDecision: {
        actionType: decision.actionType,
        decisionNotes: decision.decisionNotes || '',
        decisionDate: new Date().toISOString().split('T')[0],
        decidedBy: decision.decidedBy || 'إدارة المدرسة',
        summonsDate: decision.summonsDate,
        summonsTime: decision.summonsTime,
        suspensionStartDate: decision.startDate,
        suspensionEndDate: decision.endDate,
      },
      updatedAt: new Date().toISOString(),
    };

    setStorage(INFRACTIONS_STORAGE_KEY, existing.map((m) => (m.id === id ? updated : m)));
    notifyDataChanged('infraction_decided');
    return updated;
  }
}

export async function deleteInfractionMemo(schoolId: string, id: string): Promise<void> {
  try {
    await deleteInfractionMemoApi(schoolId, id);
  } catch (err) {
    // Continue local cleanup
  }
  const existing = getStorage<InfractionMemo[]>(INFRACTIONS_STORAGE_KEY, []);
  setStorage(INFRACTIONS_STORAGE_KEY, existing.filter((m) => m.id !== id));
  notifyDataChanged('infraction_deleted');
}
