import { CalendarTask, CalendarPriority, CalendarStatus } from '../types/admin';
import {
  fetchCalendarTasksApi,
  saveCalendarTaskApi,
  toggleCalendarTaskStatusApi,
  deleteCalendarTaskApi,
} from './schoolApi';

const STORAGE_KEY = 'school_calendar_tasks_v1';

export function getCalendarTasksBySchool(schoolId: string): CalendarTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let allTasks: CalendarTask[] = raw ? JSON.parse(raw) : [];

    // Filter out any previously seeded tasks if present
    const cleanTasks = allTasks.filter((t) => !t.id.startsWith('task-seed-'));
    if (cleanTasks.length !== allTasks.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanTasks));
      allTasks = cleanTasks;
    }

    return allTasks
      .filter((t) => (t.school_id === schoolId || t.schoolId === schoolId))
      .map((t) => ({
        ...t,
        school_id: t.school_id || t.schoolId || schoolId,
        task_date: t.task_date || t.date || '',
        date: t.date || t.task_date || '',
      }));
  } catch (err) {
    return [];
  }
}

export async function fetchAndSyncCalendarTasks(schoolId: string): Promise<CalendarTask[]> {
  try {
    const serverTasks = await fetchCalendarTasksApi(schoolId);
    const normalized: CalendarTask[] = serverTasks.map((t: any) => ({
      ...t,
      school_id: t.school_id || t.schoolId || schoolId,
      task_date: t.task_date || t.date || '',
      date: t.date || t.task_date || '',
    }));

    // Update local cache strictly with server data
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: CalendarTask[] = raw ? JSON.parse(raw) : [];
    const otherSchoolTasks = existing.filter((t) => (t.school_id !== schoolId && t.schoolId !== schoolId));
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...otherSchoolTasks, ...normalized]));
    window.dispatchEvent(new Event('calendar_tasks_changed'));
    return normalized;
  } catch (err) {
    throw err;
  }
}

export async function saveCalendarTask(task: CalendarTask): Promise<CalendarTask> {
  const normalizedTask: CalendarTask = {
    ...task,
    school_id: task.school_id || task.schoolId,
    task_date: task.task_date || task.date,
    date: task.date || task.task_date,
    updated_at: new Date().toISOString(),
  };

  const schoolId = normalizedTask.school_id || normalizedTask.schoolId;
  if (!schoolId) {
    throw new Error('معرف المدرسة غير موجود');
  }

  // 1. Authoritative Backend Request First
  const payload = {
    id: normalizedTask.id,
    schoolId,
    title: normalizedTask.title,
    description: normalizedTask.description || '',
    date: normalizedTask.task_date || normalizedTask.date,
    task_date: normalizedTask.task_date || normalizedTask.date,
    priority: normalizedTask.priority || 'medium',
    status: normalizedTask.status || 'pending',
    assignedTo: normalizedTask.assignedTo || null,
  };

  const savedFromServer = await saveCalendarTaskApi(schoolId, payload);
  const finalTask: CalendarTask = {
    ...normalizedTask,
    ...(savedFromServer || {}),
    school_id: schoolId,
    task_date: normalizedTask.task_date,
    date: normalizedTask.date,
  };

  // 2. Update local cache ONLY upon backend success
  const raw = localStorage.getItem(STORAGE_KEY);
  const allTasks: CalendarTask[] = raw ? JSON.parse(raw) : [];
  const existingIndex = allTasks.findIndex((t) => t.id === finalTask.id);
  if (existingIndex >= 0) {
    allTasks[existingIndex] = finalTask;
  } else {
    allTasks.push(finalTask);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allTasks));
  window.dispatchEvent(new Event('calendar_tasks_changed'));

  return finalTask;
}

export async function deleteCalendarTask(taskId: string, schoolId?: string): Promise<void> {
  const raw = localStorage.getItem(STORAGE_KEY);
  let allTasks: CalendarTask[] = raw ? JSON.parse(raw) : [];
  const target = allTasks.find((t) => t.id === taskId);
  const targetSchoolId = schoolId || target?.school_id || target?.schoolId;

  if (targetSchoolId) {
    await deleteCalendarTaskApi(targetSchoolId, taskId);
  }

  // Remove from cache only on backend success
  allTasks = allTasks.filter((t) => t.id !== taskId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allTasks));
  window.dispatchEvent(new Event('calendar_tasks_changed'));
}

export async function toggleCalendarTaskStatus(taskId: string, schoolId?: string): Promise<void> {
  const raw = localStorage.getItem(STORAGE_KEY);
  const allTasks: CalendarTask[] = raw ? JSON.parse(raw) : [];
  const task = allTasks.find((t) => t.id === taskId);
  if (!task) return;

  const targetSchoolId = schoolId || task.school_id || task.schoolId;
  const newStatus = task.status === 'completed' ? 'pending' : 'completed';

  if (targetSchoolId) {
    await toggleCalendarTaskStatusApi(targetSchoolId, taskId, newStatus);
  }

  task.status = newStatus;
  task.updated_at = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allTasks));
  window.dispatchEvent(new Event('calendar_tasks_changed'));
}
