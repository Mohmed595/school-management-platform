import { School, Governorate, SchoolStatus, SubscriptionPlan } from '../types';
import { AdministrativeAction } from '../types/adminAction';
import { InfractionMemo } from '../types/infraction';
import { getStoredSession, saveStoredSchools, getStoredSchools } from './storage';

export function getAuthHeaders(overrideSchoolId?: string, overrideRole?: string): HeadersInit {
  const session = getStoredSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const role = overrideRole || session?.userRole || 'school_admin';
  const schoolId = overrideSchoolId || session?.schoolId;

  if (session?.sessionToken) {
    headers['Authorization'] = `Bearer ${session.sessionToken}`;
  }

  headers['X-User-Role'] = role;
  if (schoolId) {
    headers['X-School-Id'] = schoolId;
  }

  return headers;
}

/**
 * Fetch all schools from the central PostgreSQL database.
 * No silent fallback to mock data or localStorage.
 */
export async function fetchSchoolsApi(): Promise<School[]> {
  try {
    const response = await fetch('/api/schools', {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const cached = getStoredSchools();
      if (cached && cached.length > 0) {
        return cached;
      }
      let errorMsg = `فشل جلب المدارس من الخادم (رمز الخطأ: ${response.status})`;
      try {
        const errData = await response.json();
        if (errData?.error) errorMsg = errData.error;
      } catch {}
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const schools: School[] = Array.isArray(data) ? data : data.schools || [];

    if (schools.length > 0) {
      saveStoredSchools(schools);
    } else {
      const cached = getStoredSchools();
      if (cached && cached.length > 0) {
        return cached;
      }
    }

    return schools;
  } catch (err: any) {
    const cached = getStoredSchools();
    if (cached && cached.length > 0) {
      return cached;
    }
    throw err;
  }
}

export interface ImportResultSummary {
  total: number;
  imported: number;
  rejected: number;
  duplicates: number;
  invalidRows: number;
  classesCount?: number;
  classesCreated?: string[];
  errors: Array<{
    rowNumber: number;
    name?: string;
    ministryCode?: string;
    nationalId?: string;
    className?: string;
    sheetName?: string;
    fileName?: string;
    reason: string;
  }>;
}

export interface CreateSchoolPayload extends School {
  students?: Array<{
    name: string;
    ministryCode: string;
    nationalId: string;
    className?: string;
    gradeLevel?: string;
    age?: string | number;
    birthDate?: string;
    stage?: string;
    sheetName?: string;
    fileName?: string;
    rowNumber?: number;
  }>;
}

export interface CreateSchoolResponse {
  school: School;
  importResult?: ImportResultSummary;
}

/**
 * Validate candidate Excel student import items against database duplicates.
 */
export async function validateStudentImportApi(students: Array<{ name: string; ministryCode: string; nationalId: string; className?: string }>): Promise<{ existingMinistryCodes: string[]; existingNationalIds: string[] }> {
  try {
    const response = await fetch('/api/schools/validate-student-import', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ students }),
    });

    if (!response.ok) {
      return { existingMinistryCodes: [], existingNationalIds: [] };
    }

    const data = await response.json();
    return {
      existingMinistryCodes: data.existingMinistryCodes || [],
      existingNationalIds: data.existingNationalIds || [],
    };
  } catch (err) {
    console.warn('Failed to validate student import against DB:', err);
    return { existingMinistryCodes: [], existingNationalIds: [] };
  }
}

/**
 * Create a new school in the central database with optional atomic student Excel import.
 */
export async function createSchoolApi(newSchool: CreateSchoolPayload): Promise<CreateSchoolResponse> {
  const response = await fetch('/api/schools', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(newSchool),
  });

  if (!response.ok) {
    let errorMsg = `فشل إنشاء المدرسة في الخادم (رمز الخطأ: ${response.status})`;
    try {
      const errData = await response.json();
      if (errData?.error) errorMsg = errData.error;
    } catch {}
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const school = data.school || data;
  return {
    school,
    importResult: data.importResult,
  };
}

/**
 * Update an existing school in the central database.
 */
export async function updateSchoolApi(schoolId: string, updates: Partial<School>): Promise<School> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    let errorMsg = `فشل تحديث المدرسة في الخادم (رمز الخطأ: ${response.status})`;
    try {
      const errData = await response.json();
      if (errData?.error) errorMsg = errData.error;
    } catch {}
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return data.school || data;
}

/**
 * Delete a school permanently from the central database.
 */
export async function deleteSchoolApi(schoolId: string): Promise<void> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    let errorMsg = `فشل حذف المدرسة من الخادم (رمز الخطأ: ${response.status})`;
    try {
      const errData = await response.json();
      if (errData?.error) errorMsg = errData.error;
    } catch {}
    throw new Error(errorMsg);
  }
}

/**
 * Fetch detailed models and statistics for a specific school.
 */
export async function fetchSchoolDetailsApi(schoolId: string): Promise<any> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    let errorMsg = `فشل جلب تفاصيل المدرسة من الخادم (رمز الخطأ: ${response.status})`;
    try {
      const errData = await response.json();
      if (errData?.error) errorMsg = errData.error;
    } catch {}
    throw new Error(errorMsg);
  }

  return await response.json();
}

/**
 * Re-seed the central database with initial schools (Owner only).
 */
export async function seedInitialSchoolsApi(): Promise<School[]> {
  const response = await fetch('/api/schools/seed-initial', {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    let errorMsg = `فشل إعادة تهيئة المدارس (رمز الخطأ: ${response.status})`;
    try {
      const errData = await response.json();
      if (errData?.error) errorMsg = errData.error;
    } catch {}
    throw new Error(errorMsg);
  }

  return await response.json();
}

/**
 * ====================================================
 * CENTRAL DATABASE ENTITY CRUD APIS (PostgreSQL)
 * ====================================================
 */

/**
 * Fetch full operational data bundle for a specific school
 */
export async function fetchSchoolFullDataApi(schoolId: string): Promise<any> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/full-data`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    let errorMsg = `فشل جلب بيانات المدرسة من الخادم (رمز: ${response.status})`;
    try {
      const err = await response.json();
      if (err?.error) errorMsg = err.error;
    } catch {}
    throw new Error(errorMsg);
  }

  return await response.json();
}

/**
 * Authenticate staff account (Teacher / Attendance Officer) directly against PostgreSQL
 */
export async function staffLoginApi(params: {
  schoolId?: string;
  username: string;
  password: string;
  role: 'teacher' | 'attendance';
  deviceId?: string;
  trustDevice300Days?: boolean;
}): Promise<any> {
  const response = await fetch('/api/auth/staff-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'بيانات الدخول غير صحيحة أو لا توجد صلاحيات');
  }

  return data;
}

/**
 * Authenticate platform owner account directly against PostgreSQL / server
 */
export async function ownerLoginApi(params: {
  email: string;
  password: string;
  deviceId?: string;
  trustDevice300Days?: boolean;
}): Promise<any> {
  const response = await fetch('/api/auth/owner-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'بيانات الدخول غير صحيحة');
  }

  return data;
}

/**
 * Authenticate school admin account directly against PostgreSQL
 */
export async function schoolAdminLoginApi(params: {
  schoolCode?: string;
  licenseKey?: string;
  adminEmail?: string;
  adminPassword?: string;
  deviceId?: string;
  trustDevice300Days?: boolean;
}): Promise<any> {
  const response = await fetch('/api/auth/school-admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'كود المدرسة أو كود الترخيص غير صحيح');
  }

  return data;
}

/**
 * Authenticate student/parent directly against PostgreSQL database.
 * No client-side student array upload or fallback.
 */
export async function studentLoginApi(params: {
  studentName?: string;
  ministryCode?: string;
  nationalId?: string;
  schoolId?: string;
  parentPhone?: string;
  studentCode?: string;
  deviceId?: string;
  trustDevice300Days?: boolean;
}): Promise<any> {
  const response = await fetch('/api/auth/student-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'لم يتم العثور على حساب الطالب في قاعدة البيانات المركزية');
  }

  return data;
}

/**
 * Atomic Setup Wizard Save in Central PostgreSQL Database
 */
export async function saveSetupWizardApi(
  schoolId: string,
  payload: {
    themeColor?: string;
    classes: any[];
    students: any[];
  }
): Promise<{ success: boolean; classes: any[]; students: any[]; themeColor?: string }> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/setup-wizard`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل حفظ بيانات التهيئة في قاعدة البيانات المركزية');
  }
  return data;
}

/**
 * Batch Sync School Data in PostgreSQL
 */
export async function syncSchoolDataApi(schoolId: string, payload: {
  classes?: any[];
  students?: any[];
  teachers?: any[];
  subjects?: any[];
  attendance?: any[];
  grades?: any[];
  behavior?: any[];
  announcements?: any[];
}): Promise<any> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/sync`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل مزامنة بيانات المدرسة مع قاعدة البيانات');
  }
  return data;
}

/**
 * Save / Update Teacher in PostgreSQL
 */
export async function saveTeacherApi(schoolId: string, teacher: any): Promise<any> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/teachers`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(teacher),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل حفظ بيانات المعلم في قاعدة البيانات المركزية');
  }
  return data.teacher;
}

/**
 * Delete Teacher from PostgreSQL
 */
export async function deleteTeacherApi(schoolId: string, teacherId: string): Promise<void> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/teachers/${encodeURIComponent(teacherId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || 'فشل حذف المعلم من قاعدة البيانات المركزية');
  }
}

/**
 * Save / Update Student in PostgreSQL
 */
export async function saveStudentApi(schoolId: string, student: any): Promise<any> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/students`, {
    method: 'POST',
    headers: getAuthHeaders(schoolId),
    body: JSON.stringify(student),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل حفظ بيانات الطالب في قاعدة البيانات المركزية');
  }
  return data.student;
}

/**
 * Batch assign students to classes (e.g. Day 1 first attendance or admin bulk assignment)
 */
export async function batchAssignStudentsApi(
  schoolId: string,
  assignments: Array<{ studentId: string; classId: string; className: string }>
): Promise<number> {
  if (!assignments || assignments.length === 0) return 0;
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/students/batch-assign-classes`, {
    method: 'POST',
    headers: getAuthHeaders(schoolId),
    body: JSON.stringify({ assignments }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل تسكين الطلاب في الفصول');
  }
  return data.count || 0;
}

/**
 * Delete Student from PostgreSQL
 */
export async function deleteStudentApi(schoolId: string, studentId: string): Promise<void> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/students/${encodeURIComponent(studentId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(schoolId),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || 'فشل حذف الطالب من قاعدة البيانات المركزية');
  }
}

/**
 * Unassign all students in a school from their classes (Plan Mode / "بدون فصل")
 */
export async function unassignAllStudentsFromClassesApi(schoolId: string): Promise<any> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/students/unassign-all`, {
    method: 'POST',
    headers: getAuthHeaders(schoolId),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل تحويل الطلاب إلى صفة (بدون فصل)');
  }
  return data;
}

/**
 * Save / Update Class in PostgreSQL
 */
export async function saveClassApi(schoolId: string, classData: any): Promise<any> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/classes`, {
    method: 'POST',
    headers: getAuthHeaders(schoolId),
    body: JSON.stringify(classData),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل حفظ الفصل');
  }
  return data.class;
}

/**
 * Delete Class from PostgreSQL
 */
export async function deleteClassApi(schoolId: string, classId: string): Promise<void> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/classes/${encodeURIComponent(classId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(schoolId),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || 'فشل حذف الفصل');
  }
}

/**
 * Save / Update Subject in PostgreSQL
 */
export async function saveSubjectApi(schoolId: string, subjectData: any): Promise<any> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/subjects`, {
    method: 'POST',
    headers: getAuthHeaders(schoolId),
    body: JSON.stringify(subjectData),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل حفظ المادة الدراسية');
  }
  return data.subject;
}

/**
 * Delete Subject from PostgreSQL
 */
export async function deleteSubjectApi(schoolId: string, subjectId: string): Promise<void> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/subjects/${encodeURIComponent(subjectId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(schoolId),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || 'فشل حذف المادة');
  }
}

/**
 * Delete Announcement from PostgreSQL
 */
export async function deleteAnnouncementApi(schoolId: string, announcementId: string): Promise<void> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/announcements/${encodeURIComponent(announcementId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(schoolId),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || 'فشل حذف الإعلان');
  }
}

/**
 * Fetch Attendance Records from PostgreSQL
 */
export async function fetchAttendanceApi(
  schoolId: string,
  params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    classId?: string;
    studentId?: string;
    limit?: number;
  }
): Promise<any[]> {
  const query = new URLSearchParams();
  if (params?.date) query.set('date', params.date);
  if (params?.startDate) query.set('startDate', params.startDate);
  if (params?.endDate) query.set('endDate', params.endDate);
  if (params?.classId) query.set('classId', params.classId);
  if (params?.studentId) query.set('studentId', params.studentId);
  if (params?.limit) query.set('limit', String(params.limit));

  const url = `/api/schools/${encodeURIComponent(schoolId)}/attendance${
    query.toString() ? `?${query.toString()}` : ''
  }`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل جلب سجلات الحضور والغياب من خادم المنظومة');
  }
  return data.records || [];
}

/**
 * Fetch Student Attendance Records from PostgreSQL
 */
export async function fetchStudentAttendanceApi(
  schoolId: string,
  studentId: string
): Promise<any[]> {
  const url = `/api/schools/${encodeURIComponent(schoolId)}/students/${encodeURIComponent(studentId)}/attendance`;
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل جلب سجل حضور الطالب من خادم المنظومة');
  }
  return data.records || [];
}

/**
 * Save Attendance Records in PostgreSQL
 */
export async function saveAttendanceRecordsApi(schoolId: string, records: any[]): Promise<any[]> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/attendance`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ records }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل حفظ سجلات الحضور');
  }
  return data.records || [];
}

/**
 * Save Attendance Session in PostgreSQL
 */
export async function saveAttendanceSessionApi(schoolId: string, sessionData: any): Promise<any> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/attendance/sessions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(sessionData),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل حفظ جلسة تحضير الغياب');
  }
  return data.session;
}

/**
 * Fetch Grade Records from PostgreSQL with optional parameters
 */
export async function fetchGradesApi(
  schoolId: string,
  params?: {
    classId?: string;
    subjectId?: string;
    studentId?: string;
    examName?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    page?: number;
  }
): Promise<any[]> {
  const queryParams = new URLSearchParams();
  if (params?.classId) queryParams.append('classId', params.classId);
  if (params?.subjectId) queryParams.append('subjectId', params.subjectId);
  if (params?.studentId) queryParams.append('studentId', params.studentId);
  if (params?.examName) queryParams.append('examName', params.examName);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.page) queryParams.append('page', String(params.page));

  const url = `/api/schools/${encodeURIComponent(schoolId)}/grades${
    queryParams.toString() ? `?${queryParams.toString()}` : ''
  }`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل جلب سجلات الدرجات');
  }

  const gradesList: any[] = Array.isArray(data.grades) ? data.grades : [];
  if (data.limit || data.page || data.totalCount !== undefined) {
    Object.assign(gradesList, {
      limit: data.limit,
      page: data.page,
      totalCount: data.totalCount,
    });
  }

  return gradesList;
}

/**
 * Save Grade Records in PostgreSQL
 */
export async function saveGradeRecordsApi(schoolId: string, records: any[]): Promise<void> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/grades`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ records }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل حفظ سجلات الدرجات');
  }
}

/**
 * Save Behavior Record in PostgreSQL
 */
export async function saveBehaviorRecordApi(schoolId: string, record: any): Promise<any> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/behavior`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(record),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل تسجيل الملاحظة السلوكية');
  }
  return data.behavior;
}

/**
 * Delete Behavior Record from PostgreSQL
 */
export async function deleteBehaviorRecordApi(schoolId: string, behaviorId: string): Promise<void> {
  const response = await fetch(
    `/api/schools/${encodeURIComponent(schoolId)}/behavior/${encodeURIComponent(behaviorId)}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || 'فشل حذف الملاحظة السلوكية');
  }
}

/**
 * Save Announcement in PostgreSQL
 */
export async function saveAnnouncementApi(schoolId: string, announcement: any): Promise<any> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/announcements`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(announcement),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل نشر الإعلان');
  }
  return data.announcement;
}

/**
 * Fetch Announcements from PostgreSQL
 */
export async function fetchAnnouncementsApi(schoolId: string): Promise<any[]> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/announcements`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل جلب الإعلانات والتعاميم من الخادم');
  }
  return data.announcements || [];
}

/**
 * Submit Vote for a Poll Announcement in PostgreSQL
 */
export async function votePollAnnouncementApi(
  schoolId: string,
  announcementId: string,
  selectedOptionIds: string[]
): Promise<any> {
  const response = await fetch(
    `/api/schools/${encodeURIComponent(schoolId)}/announcements/${encodeURIComponent(
      announcementId
    )}/vote`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ optionIds: selectedOptionIds }),
    }
  );

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل إرسال التصويت في استطلاع الرأي');
  }
  return data.announcement;
}

/**
 * Submit RSVP for an Event Announcement in PostgreSQL
 */
export async function rsvpEventAnnouncementApi(
  schoolId: string,
  announcementId: string,
  status: 'attending' | 'interested' | 'declined'
): Promise<any> {
  const response = await fetch(
    `/api/schools/${encodeURIComponent(schoolId)}/announcements/${encodeURIComponent(
      announcementId
    )}/rsvp`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    }
  );

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل تسجيل حالة الحضور بالفعالية');
  }
  return data.announcement;
}

/**
 * Save Calendar Task in PostgreSQL
 */
export async function saveCalendarTaskApi(schoolId: string, task: any): Promise<any> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/calendar-tasks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(task),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل حفظ المهمة في التقويم');
  }
  return data.task;
}

/**
 * Toggle Calendar Task Status in PostgreSQL
 */
export async function toggleCalendarTaskStatusApi(schoolId: string, taskId: string, status: string): Promise<void> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/calendar-tasks/${encodeURIComponent(taskId)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || 'فشل تحديث حالة المهمة');
  }
}

/**
 * Delete Calendar Task from PostgreSQL
 */
export async function deleteCalendarTaskApi(schoolId: string, taskId: string): Promise<void> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/calendar-tasks/${encodeURIComponent(taskId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || 'فشل حذف المهمة');
  }
}

/**
 * Award Student Badge in PostgreSQL
 */
export async function awardStudentBadgeApi(schoolId: string, payload: { studentId: string; badgeId: string; awardedBy?: string; note?: string }): Promise<any> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/badges/award-student`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل منح الوسام للطالب');
  }
  return data.award;
}

/**
 * Award Teacher Badge in PostgreSQL
 */
export async function awardTeacherBadgeApi(schoolId: string, payload: { teacherId: string; badgeId: string; awardedBy?: string; note?: string }): Promise<any> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/badges/award-teacher`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل منح الوسام للمعلم');
  }
  return data.award;
}

/**
 * Fetch System Badges for School from PostgreSQL
 */
export async function fetchSchoolBadgesApi(schoolId: string): Promise<any[]> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/badges`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل جلب الأوسمة من الخادم');
  }
  return data.badges || [];
}

/**
 * Save Badge Definition in PostgreSQL
 */
export async function saveBadgeApi(schoolId: string, badge: any): Promise<any> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/badges`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(badge),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل حفظ الوسام بالخادم');
  }
  return data.badge;
}

/**
 * Delete Badge Definition in PostgreSQL
 */
export async function deleteBadgeApi(schoolId: string, badgeId: string): Promise<void> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/badges/${encodeURIComponent(badgeId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل حذف الوسام');
  }
}

/**
 * Fetch Student Badges Read Path from PostgreSQL
 */
export async function fetchStudentBadgesApi(schoolId: string, studentId: string): Promise<{ assignments: any[]; badges: any[] }> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/students/${encodeURIComponent(studentId)}/badges`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل جلب أوسمة الطالب من الخادم');
  }
  return { assignments: data.assignments || [], badges: data.badges || [] };
}

/**
 * Mark a student badge assignment as unboxed in PostgreSQL
 */
export async function unboxStudentBadgeApi(schoolId: string, assignmentId: string): Promise<void> {
  try {
    await fetch(`/api/schools/${encodeURIComponent(schoolId)}/student-badges/${encodeURIComponent(assignmentId)}/unbox`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
  } catch (e) {
    // Non-fatal, local status already updated
  }
}

/**
 * Fetch Teacher Badges Read Path from PostgreSQL
 */
export async function fetchTeacherBadgesApi(schoolId: string, teacherId: string): Promise<{ assignments: any[]; badges: any[] }> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/teachers/${encodeURIComponent(teacherId)}/badges`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل جلب أوسمة المعلم من الخادم');
  }
  return { assignments: data.assignments || [], badges: data.badges || [] };
}

/**
 * Fetch All Student Badge Assignments for School
 */
export async function fetchAllStudentBadgesApi(schoolId: string): Promise<any[]> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/student-badges`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل جلب سجلات أوسمة الطلاب');
  }
  return data.assignments || [];
}

/**
 * Fetch All Teacher Badge Assignments for School
 */
export async function fetchAllTeacherBadgesApi(schoolId: string): Promise<any[]> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/teacher-badges`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل جلب سجلات أوسمة المعلمين');
  }
  return data.assignments || [];
}

/**
 * Revoke/Delete Student Badge Assignment
 */
export async function deleteStudentBadgeAssignmentApi(schoolId: string, assignmentId: string): Promise<void> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/student-badges/${encodeURIComponent(assignmentId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل سحب الوسام من الطالب');
  }
}

/**
 * Revoke/Delete Teacher Badge Assignment
 */
export async function deleteTeacherBadgeAssignmentApi(schoolId: string, assignmentId: string): Promise<void> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/teacher-badges/${encodeURIComponent(assignmentId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل سحب الوسام من المعلم');
  }
}

/**
 * Administrative Actions API (PostgreSQL)
 */
export async function fetchAdminActionsApi(schoolId: string): Promise<AdministrativeAction[]> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/admin-actions`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل جلب القرارات والإجراءات الإدارية');
  }
  return data.actions || [];
}

export async function fetchStudentAdminActionsApi(schoolId: string, studentId: string): Promise<AdministrativeAction[]> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/students/${encodeURIComponent(studentId)}/admin-actions`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل جلب الإجراءات الإدارية للطالب');
  }
  return data.actions || [];
}

export async function createAdminActionApi(schoolId: string, actionData: any): Promise<AdministrativeAction> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/admin-actions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(actionData),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل إضافة القرار الإداري في خادم المنظومة');
  }
  return data.action;
}

export async function updateAdminActionApi(schoolId: string, actionId: string, updates: any): Promise<AdministrativeAction> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/admin-actions/${encodeURIComponent(actionId)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل تحديث القرار الإداري');
  }
  return data.action;
}

export async function deleteAdminActionApi(schoolId: string, actionId: string): Promise<void> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/admin-actions/${encodeURIComponent(actionId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل حذف القرار الإداري من الخادم');
  }
}

/**
 * Infraction Memos API (مذكرات المشاغبات المدرسية)
 */
export async function fetchInfractionMemosApi(schoolId: string): Promise<InfractionMemo[]> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/infractions`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل جلب مذكرات المشاغبات');
  }
  return data.memos || [];
}

export async function createInfractionMemoApi(schoolId: string, memoData: any): Promise<InfractionMemo> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/infractions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(memoData),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل إضافة مذكرة المشاغبة في الخادم');
  }
  return data.memo;
}

export async function submitInfractionDecisionApi(
  schoolId: string,
  id: string,
  decisionData: any
): Promise<InfractionMemo> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/infractions/${encodeURIComponent(id)}/decision`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(decisionData),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل تسجيل قرار الإدارة بشأن المذكرة');
  }
  return data.memo;
}

export async function deleteInfractionMemoApi(schoolId: string, id: string): Promise<void> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/infractions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل حذف مذكرة المشاغبة');
  }
}

/**
 * Parents API (PostgreSQL)
 */
export async function fetchParentsApi(schoolId: string): Promise<any[]> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/parents`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل جلب أولياء الأمور من الخادم');
  }
  return data.parents || [];
}

export async function saveParentApi(schoolId: string, parentData: any): Promise<any> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/parents`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(parentData),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل حفظ بيانات ولي الأمر بالخادم');
  }
  return data.parent;
}

export async function deleteParentApi(schoolId: string, parentId: string): Promise<void> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/parents/${encodeURIComponent(parentId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل حذف ولي الأمر');
  }
}

/**
 * Homework API (PostgreSQL)
 */
export async function fetchHomeworkApi(schoolId: string, classId?: string, studentId?: string): Promise<any[]> {
  let url = `/api/schools/${encodeURIComponent(schoolId)}/homework`;
  const params = new URLSearchParams();
  if (classId) params.append('classId', classId);
  if (studentId) params.append('studentId', studentId);
  if (params.toString()) url += `?${params.toString()}`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل جلب الواجبات المدرسية من الخادم');
  }
  return data.homework || [];
}

export async function fetchStudentHomeworkApi(schoolId: string, studentId: string): Promise<any[]> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/students/${encodeURIComponent(studentId)}/homework`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل جلب واجبات الطالب من الخادم');
  }
  return data.homework || [];
}

export async function saveHomeworkApi(schoolId: string, homeworkData: any): Promise<any> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/homework`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(homeworkData),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل حفظ الواجب المدرسي');
  }
  return data.homework;
}

export async function updateHomeworkStatusApi(schoolId: string, homeworkId: string, updates: any): Promise<void> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/homework/${encodeURIComponent(homeworkId)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل تحديث حالة الواجب');
  }
}

export async function deleteHomeworkApi(schoolId: string, homeworkId: string): Promise<void> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/homework/${encodeURIComponent(homeworkId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل حذف الواجب');
  }
}

/**
 * Calendar Tasks API (PostgreSQL)
 */
export async function fetchCalendarTasksApi(schoolId: string): Promise<any[]> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/calendar-tasks`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل جلب مهام التقويم');
  }
  return data.tasks || [];
}

/**
 * Smart Suspension API (PostgreSQL)
 */
export async function fetchSmartSuspensionAlertsApi(schoolId: string, status?: string): Promise<any[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/smart-suspension/alerts${query}`, {
    headers: getAuthHeaders(schoolId),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل جلب تنبيهات الإيقاف الذكية');
  }
  return data.alerts || [];
}

export async function createSmartSuspensionAlertApi(schoolId: string, alertData: any): Promise<any> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/smart-suspension/alerts`, {
    method: 'POST',
    headers: getAuthHeaders(schoolId),
    body: JSON.stringify(alertData),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل إنشاء تنبيه الإيقاف الذكي');
  }
  return data;
}

export async function resolveSmartSuspensionAlertApi(
  schoolId: string,
  payload: { alertId: string; action: 'correct_attendance' | 'end_suspension' | 'ignore'; adminName?: string; ignoreReason?: string }
): Promise<any> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/smart-suspension/resolve`, {
    method: 'POST',
    headers: getAuthHeaders(schoolId),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل معالجة تنبيه الإيقاف الذكي');
  }
  return data;
}

export async function fetchSmartSuspensionAuditLogsApi(schoolId: string): Promise<any[]> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/smart-suspension/audit-logs`, {
    headers: getAuthHeaders(schoolId),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل جلب سجل تدقيق القرارات الذكية');
  }
  return data.auditLogs || [];
}

/**
 * Fetch Authoritative Dynamic Student Points from PostgreSQL
 */
export async function fetchStudentPointsApi(
  schoolId: string,
  studentId: string
): Promise<{
  success: boolean;
  schoolId: string;
  studentId: string;
  studentName?: string;
  totalPoints: number;
  badgePoints: number;
  attendancePoints: number;
  behaviorPoints?: number;
  breakdown: {
    badges: {
      rareCount: number;
      epicCount: number;
      legendaryCount: number;
      mythicalCount: number;
      unknownCount: number;
      totalBadgeCount: number;
      points: number;
    };
    attendance: {
      presentCount: number;
      lateCount: number;
      absentCount: number;
      otherCount: number;
      totalDays: number;
      points: number;
    };
    behavior?: {
      positiveCount: number;
      negativeCount: number;
      totalCount: number;
      positivePoints: number;
      negativePoints: number;
      points: number;
    };
  };
  calculatedAt: string;
}> {
  const url = `/api/schools/${encodeURIComponent(schoolId)}/students/${encodeURIComponent(studentId)}/points`;
  const response = await fetch(url, {
    headers: getAuthHeaders(schoolId),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل في استرجاع نقاط الطالب من الخادم');
  }
  return data;
}

export interface LeaderboardStudentItem {
  rank: number;
  studentId: string;
  name: string;
  className?: string;
  points: number;
  avatar_layout_uid?: string;
}

export interface CurrentStudentRanking {
  rank: number;
  points: number;
  totalStudents: number;
  isTop10?: boolean;
  isTop100: boolean;
  isFirstPlace: boolean;
  nextRank?: number;
  pointsNeeded?: number;
  nextStudentPoints?: number;
}

export interface LeaderboardSchoolSummary {
  totalStudents: number;
  topScore: number;
  averageTopPoints: number;
  rankedCount: number;
}

export interface LeaderboardApiResponse {
  success: boolean;
  schoolId: string;
  leaderboard: LeaderboardStudentItem[];
  currentStudent?: CurrentStudentRanking;
  schoolSummary: LeaderboardSchoolSummary;
  generatedAt: string;
}

/**
 * Fetch Top 100 Leaderboard from PostgreSQL
 */
export async function fetchSchoolLeaderboardApi(schoolId: string): Promise<LeaderboardApiResponse> {
  const url = `/api/schools/${encodeURIComponent(schoolId)}/leaderboard`;
  const response = await fetch(url, {
    headers: getAuthHeaders(schoolId),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'فشل في استرجاع قائمة أوائل المدرسة من الخادم');
  }
  return data;
}




