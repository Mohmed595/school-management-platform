import { Teacher, Student, GradeRecord, BehaviorRecord, ClassRoom, Subject } from '../types/admin';
import { TeacherPortalData, TeacherActivityLog } from '../types/teacher';
import {
  getStorage,
  setStorage,
  seedSchoolData,
  getTeachersBySchool,
  getStudentsBySchool,
  getClassesBySchool,
  getSubjectsBySchool,
  getGradesBySchool,
  getBehaviorBySchool,
  getSchoolAdminInfo,
  saveGradeRecords,
  saveBehaviorRecord as saveBehaviorRecordAdmin,
} from './adminStorage';

const TEACHER_ACTIVITY_KEY = 'eg_teacher_activities_v1';

export function getTeachersList(schoolId: string): Teacher[] {
  seedSchoolData(schoolId);
  return getTeachersBySchool(schoolId);
}

export function findTeacherByIdentifier(schoolId: string, identifier: string): Teacher | null {
  seedSchoolData(schoolId);
  const teachers = getTeachersBySchool(schoolId);
  const clean = identifier.trim().toLowerCase();

  return (
    teachers.find(
      (t) =>
        t.nationalId.trim() === clean ||
        t.email.trim().toLowerCase() === clean ||
        t.id === clean ||
        t.phone.trim() === clean
    ) || null
  );
}

export function getTeacherPortalData(schoolId: string, teacherId: string): TeacherPortalData {
  seedSchoolData(schoolId);
  const schoolInfo = getSchoolAdminInfo(schoolId);
  const allTeachers = getTeachersBySchool(schoolId);

  // Match teacher by exact ID or fallback to first teacher in school if exists
  let teacher = allTeachers.find((t) => t.id === teacherId);
  if (!teacher && allTeachers.length > 0) {
    teacher = allTeachers[0];
  }

  if (!teacher) {
    // Blank teacher structure if no teacher account was found
    teacher = {
      id: teacherId || `tch-${schoolId}-new`,
      schoolId,
      name: 'معلم جديد',
      nationalId: '',
      phone: '',
      email: 'teacher@school.edu.eg',
      specialization: 'لم تحدد المادة بعد',
      status: 'نشط',
      assignedClasses: [],
      assignedSubjects: [],
      joinDate: new Date().toISOString().split('T')[0],
    };
  }

  const allClasses = getClassesBySchool(schoolId);
  const allSubjects = getSubjectsBySchool(schoolId);
  const allStudents = getStudentsBySchool(schoolId);
  const allGrades = getGradesBySchool(schoolId);
  const allBehavior = getBehaviorBySchool(schoolId);

  // 1. Filter Assigned Classes (Classes where name or ID is in assignedClasses array)
  let assignedClasses = allClasses.filter((c) =>
    teacher!.assignedClasses.includes(c.name) || teacher!.assignedClasses.includes(c.id)
  );

  // If teacher has no assigned classes explicitly set but allClasses exist and teacher has generic assignments, match by subject name if needed
  if (assignedClasses.length === 0 && teacher.assignedClasses && teacher.assignedClasses.length > 0) {
    assignedClasses = allClasses.filter((c) =>
      teacher!.assignedClasses.some((ac) => c.name.includes(ac) || ac.includes(c.name))
    );
  }

  const assignedClassNames = new Set(assignedClasses.map((c) => c.name));

  // 2. Filter Assigned Subjects
  const assignedSubjects = allSubjects.filter((s) =>
    teacher!.assignedSubjects.includes(s.name) ||
    teacher!.assignedSubjects.includes(s.id) ||
    s.teacherNames.includes(teacher!.name)
  );

  // 3. Filter Assigned Students (ONLY students belonging to the teacher's assigned classes)
  const assignedStudents = assignedClasses.length > 0
    ? allStudents.filter(
        (st) => assignedClassNames.has(st.className) || assignedClasses.some((ac) => ac.id === st.classId)
      )
    : [];

  // 4. Recent Grades entered for these assigned students & subjects
  const assignedStudentIds = new Set(assignedStudents.map((st) => st.id));
  const recentGrades = allGrades.filter((g) => assignedStudentIds.has(g.studentId));

  // 5. Recent Behavior entered for these assigned students
  const recentBehavior = allBehavior.filter((b) => assignedStudentIds.has(b.studentId));

  return {
    teacher,
    schoolId,
    schoolName: schoolInfo.name || 'مدرسة جديدة',
    assignedClasses,
    assignedSubjects,
    assignedStudents,
    recentGrades,
    recentBehavior,
  };
}

export async function saveTeacherGradesList(grades: GradeRecord[], teacherName: string): Promise<void> {
  await saveGradeRecords(grades);

  // Log activity
  if (grades.length > 0) {
    const sample = grades[0];
    addTeacherActivity({
      id: `act-${Date.now()}`,
      title: 'إدخال / تحديث درجات اختبار',
      description: `تم حفظ درجات ${grades.length} طالب لمادة (${sample.subjectName}) - ${sample.className} (${sample.examName})`,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      type: 'grade',
    });
  }
}

export async function saveTeacherBehaviorNote(record: BehaviorRecord): Promise<void> {
  await saveBehaviorRecordAdmin(record);

  addTeacherActivity({
    id: `act-${Date.now()}`,
    title: `إضافة ملاحظة سلوك (${record.type})`,
    description: `تم تسجيل ملاحظة سلوكية للطالب: ${record.studentName} - ${record.title}`,
    timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    type: 'behavior',
  });
}

export function getTeacherActivities(): TeacherActivityLog[] {
  return getStorage<TeacherActivityLog[]>(TEACHER_ACTIVITY_KEY, []);
}

function addTeacherActivity(activity: TeacherActivityLog): void {
  const current = getTeacherActivities();
  const updated = [activity, ...current].slice(0, 20); // keep last 20
  setStorage(TEACHER_ACTIVITY_KEY, updated);
}
