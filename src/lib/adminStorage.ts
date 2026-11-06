import {
  Student,
  Teacher,
  ClassRoom,
  Subject,
  AttendanceRecord,
  GradeRecord,
  BehaviorRecord,
  Parent,
  Announcement,
  SchoolAdminInfo,
  SchoolAdminData,
} from '../types/admin';
import { School } from '../types';
import { getStoredSchools, saveStoredSchools, getStoredSession, saveStoredSession } from './storage';
import { mapEgyptianSheetName } from './egyptianSchoolUtils';
import { checkLoginRateLimit, recordFailedLoginAttempt, resetLoginRateLimit } from './authCrypto';
import { syncClassCommunityGroup, syncDeletedClassCommunity } from './communityStorage';
import {
  fetchSchoolFullDataApi,
  saveTeacherApi,
  deleteTeacherApi,
  saveStudentApi,
  batchAssignStudentsApi,
  deleteStudentApi,
  saveClassApi,
  deleteClassApi,
  saveSubjectApi,
  deleteSubjectApi,
  fetchAttendanceApi,
  fetchStudentAttendanceApi,
  saveAttendanceRecordsApi,
  saveGradeRecordsApi,
  saveBehaviorRecordApi,
  deleteBehaviorRecordApi,
  updateSchoolApi,
  saveAnnouncementApi,
  deleteAnnouncementApi,
  saveParentApi,
  deleteParentApi,
  saveCalendarTaskApi,
  deleteCalendarTaskApi,
  syncSchoolDataApi,
  saveSetupWizardApi,
} from './schoolApi';
import { getGradeLevelFromClassName } from './egyptianSchoolUtils';

// Resilient In-Memory RAM Fallback to withstand Browser LocalStorage 5MB quota limits
const inMemoryStorageFallback = new Map<string, any>();

// Helper to load/save localStorage state
const STORAGE_KEY_PREFIX = 'eg_school_admin_v2_';

export function getStorage<T>(key: string, defaultValue: T): T {
  try {
    if (inMemoryStorageFallback.has(key)) {
      return inMemoryStorageFallback.get(key) as T;
    }
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (item) {
      const parsed = JSON.parse(item) as T;
      inMemoryStorageFallback.set(key, parsed);
      return parsed;
    }
    return defaultValue;
  } catch (e) {
    return inMemoryStorageFallback.has(key) ? (inMemoryStorageFallback.get(key) as T) : defaultValue;
  }
}

export function setStorage<T>(key: string, value: T): void {
  // Always update in-memory RAM cache first so current session has 100% data fidelity
  inMemoryStorageFallback.set(key, value);

  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e: any) {
    // Check if error is QuotaExceededError across all browser engines
    const isQuotaExceeded =
      e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014);

    if (isQuotaExceeded) {
      try {
        // Prune non-critical / heavy ephemeral history keys to free space for core school data
        const keysToPrune = [
          'attendance',
          'grades',
          'behavior',
          'announcements',
          'parents',
        ];
        for (const k of keysToPrune) {
          if (k !== key) {
            localStorage.removeItem(STORAGE_KEY_PREFIX + k);
          }
        }
        // Retry storing after pruning
        localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
      } catch (retryErr) {
        // Safe graceful degradation: Data remains safely active in inMemoryStorageFallback
        console.warn(`[StorageManager] LocalStorage quota reached. Key "${key}" preserved in high-speed RAM fallback.`);
      }
    }
  }
}

// Utility to deduplicate array by item id
export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

export function notifyDataChanged(type?: string) {
  try {
    window.dispatchEvent(new CustomEvent('school_data_changed', { detail: { type, timestamp: Date.now() } }));
    if (type) {
      window.dispatchEvent(new CustomEvent(type, { detail: { timestamp: Date.now() } }));
    }
    if (type === 'behavior' || type === 'badges_updated' || type === 'attendance' || type === 'badge_awarded') {
      window.dispatchEvent(new CustomEvent('student_points_updated', { detail: { type, timestamp: Date.now() } }));
    }
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    // Ignore non-browser environments
  }
}

const PRESET_DEMO_SCHOOL_IDS = ['sch-1'];

// Caches or updates school details safely in local storage
export function cacheSchoolDetails(info: Partial<SchoolAdminInfo> & { schoolId: string; name: string; code?: string }) {
  if (!info.schoolId) return;
  const allInfo = getStorage<Record<string, SchoolAdminInfo>>('school_info', {});
  const existing: Partial<SchoolAdminInfo> = allInfo[info.schoolId] || {};
  allInfo[info.schoolId] = {
    schoolId: info.schoolId,
    name: info.name || existing.name || 'المدرسة',
    code: info.code || existing.code || info.schoolId,
    licenseKey: info.licenseKey || existing.licenseKey || '',
    governorate: info.governorate || existing.governorate || 'القاهرة',
    educationalDistrict: info.educationalDistrict || existing.educationalDistrict || 'الإدارة التعليمية',
    address: info.address || existing.address || 'جمهورية مصر العربية',
    phone: info.phone || existing.phone || '',
    email: info.email || existing.email || '',
    principalName: info.principalName || existing.principalName || 'مدير المدرسة',
    academicYear: info.academicYear || existing.academicYear || '2025/2026',
    themeColor: info.themeColor || existing.themeColor,
  };
  setStorage('school_info', allInfo);
  notifyDataChanged('school_info');
}

// Initial Seeding Generator for a specific schoolId
export function seedSchoolData(schoolId: string, schoolName?: string, schoolCode?: string) {
  const allClasses = getStorage<ClassRoom[]>('classes', []);
  const allStudents = getStorage<Student[]>('students', []);
  const allInfo = getStorage<Record<string, SchoolAdminInfo>>('school_info', {});
  const storedSchools = getStoredSchools();
  const knownSchool = storedSchools.find((s) => s.id === schoolId);

  const sName = schoolName || (knownSchool ? knownSchool.name : undefined);
  const sCode = schoolCode || (knownSchool ? knownSchool.code : undefined);

  // If school already exists in allInfo, update any placeholder data if real data is available
  if (allInfo[schoolId]) {
    const isPlaceholder = !allInfo[schoolId].name || allInfo[schoolId].name === 'مدرسة جديدة' || allInfo[schoolId].name === 'مدرسة نموذجية مصرية' || allInfo[schoolId].name === 'مدرسة';
    if (isPlaceholder && sName) {
      allInfo[schoolId].name = sName;
      if (sCode) allInfo[schoolId].code = sCode;
      if (knownSchool?.licenseKey) allInfo[schoolId].licenseKey = knownSchool.licenseKey;
      if (knownSchool?.principalName) allInfo[schoolId].principalName = knownSchool.principalName;
      setStorage('school_info', allInfo);
      notifyDataChanged('school_info');
    }
    return;
  }

  const initialInfo: SchoolAdminInfo = {
    schoolId,
    name: sName || (knownSchool ? knownSchool.name : 'مدرسة'),
    code: sCode || (knownSchool ? knownSchool.code : schoolId),
    licenseKey: knownSchool?.licenseKey || `LIC-2026-${schoolId.substring(0, 4).toUpperCase()}`,
    governorate: knownSchool?.governorate || 'القاهرة',
    educationalDistrict: 'الإدارة التعليمية',
    address: 'جمهورية مصر العربية',
    phone: knownSchool?.principalPhone || '0200000000',
    email: knownSchool?.adminEmail || 'admin@school.edu.eg',
    principalName: knownSchool?.principalName || 'مدير المدرسة',
    academicYear: '2025/2026',
  };

  // If this is NOT a preset demo school (e.g. newly created real school), start BLANK!
  if (schoolId !== 'sch-1') {
    allInfo[schoolId] = initialInfo;
    setStorage('school_info', allInfo);
    notifyDataChanged('school_init');
    return;
  }

  // 1. Initial Classes covering KG-1 up to 3rd Secondary
  const initialClasses: ClassRoom[] = [
    {
      id: `cls-${schoolId}-kg1`,
      schoolId,
      name: 'روضة أولى (KG-1) - أ',
      gradeLevel: 'KG1 - روضة أولى',
      roomNumber: 'K01',
      capacity: 25,
      studentCount: 22,
      headTeacherName: 'أ. هبة الله محمود',
    },
    {
      id: `cls-${schoolId}-kg2`,
      schoolId,
      name: 'روضة ثانية (KG-2) - أ',
      gradeLevel: 'KG2 - روضة ثانية',
      roomNumber: 'K02',
      capacity: 25,
      studentCount: 24,
      headTeacherName: 'أ. نورهان طارق',
    },
    {
      id: `cls-${schoolId}-p1`,
      schoolId,
      name: 'الصف الأول الابتدائي - أ',
      gradeLevel: 'الصف الأول الابتدائي',
      roomNumber: '101',
      capacity: 35,
      studentCount: 30,
      headTeacherName: 'أ. منى السيد',
    },
    {
      id: `cls-${schoolId}-p3`,
      schoolId,
      name: 'الصف الثالث الابتدائي - أ',
      gradeLevel: 'الصف الثالث الابتدائي',
      roomNumber: '103',
      capacity: 35,
      studentCount: 32,
      headTeacherName: 'أ. أحمد علي',
    },
    {
      id: `cls-${schoolId}-p6`,
      schoolId,
      name: 'الصف السادس الابتدائي - أ',
      gradeLevel: 'الصف السادس الابتدائي',
      roomNumber: '106',
      capacity: 35,
      studentCount: 34,
      headTeacherName: 'أ. عصام عبد الرحمن',
    },
    {
      id: `cls-${schoolId}-m1`,
      schoolId,
      name: 'الصف الأول الإعدادي - أ',
      gradeLevel: 'الصف الأول الإعدادي',
      roomNumber: '201',
      capacity: 35,
      studentCount: 30,
      headTeacherName: 'أ. محمد عبد السلام',
    },
    {
      id: `cls-${schoolId}-m3`,
      schoolId,
      name: 'الصف الثالث الإعدادي - أ',
      gradeLevel: 'الصف الثالث الإعدادي',
      roomNumber: '203',
      capacity: 35,
      studentCount: 31,
      headTeacherName: 'د. محمود حسن',
    },
    {
      id: `cls-${schoolId}-s1`,
      schoolId,
      name: 'الصف الأول الثانوي - أ',
      gradeLevel: 'الصف الأول الثانوي',
      roomNumber: '301',
      capacity: 30,
      studentCount: 28,
      headTeacherName: 'أ. داليا مصطفى',
    },
    {
      id: `cls-${schoolId}-s3`,
      schoolId,
      name: 'الصف الثالث الثانوي - أ',
      gradeLevel: 'الصف الثالث الثانوي',
      roomNumber: '303',
      capacity: 30,
      studentCount: 29,
      headTeacherName: 'د. خالد توفيق',
    },
  ];

  // 2. Initial Subjects across stages
  const initialSubjects: Subject[] = [
    {
      id: `sbj-${schoolId}-1`,
      schoolId,
      name: 'اكتشف والأنشطة (Discovery)',
      code: 'KG-DISC',
      gradeLevel: 'KG1 - روضة أولى',
      maxScore: 50,
      passScore: 25,
      teacherNames: ['أ. هبة الله محمود', 'أ. نورهان طارق'],
    },
    {
      id: `sbj-${schoolId}-2`,
      schoolId,
      name: 'اللغة العربية والخط',
      code: 'AR-101',
      gradeLevel: 'الصف الأول الابتدائي',
      maxScore: 100,
      passScore: 50,
      teacherNames: ['أ. منى السيد'],
    },
    {
      id: `sbj-${schoolId}-3`,
      schoolId,
      name: 'الرياضيات',
      code: 'MATH-101',
      gradeLevel: 'الصف الأول الإعدادي',
      maxScore: 100,
      passScore: 50,
      teacherNames: ['أ. سارة فتحي'],
    },
    {
      id: `sbj-${schoolId}-4`,
      schoolId,
      name: 'العلوم والتكنولوجيا',
      code: 'SCI-101',
      gradeLevel: 'الصف الثالث الإعدادي',
      maxScore: 100,
      passScore: 50,
      teacherNames: ['د. محمود حسن'],
    },
    {
      id: `sbj-${schoolId}-5`,
      schoolId,
      name: 'اللغة الإنجليزية Mined',
      code: 'ENG-301',
      gradeLevel: 'الصف الأول الثانوي',
      maxScore: 100,
      passScore: 50,
      teacherNames: ['أ. داليا مصطفى'],
    },
    {
      id: `sbj-${schoolId}-6`,
      schoolId,
      name: 'الكيمياء والفيزياء المتقدمة',
      code: 'SEC-PHY',
      gradeLevel: 'الصف الثالث الثانوي',
      maxScore: 100,
      passScore: 50,
      teacherNames: ['د. خالد توفيق'],
    },
  ];

  // 3. Initial Teachers across stages
  const initialTeachers: Teacher[] = [
    {
      id: `tch-${schoolId}-att`,
      schoolId,
      name: 'أ. أسامة محمود (محضر الغياب)',
      nationalId: '29201010101999',
      phone: '01098765432',
      email: 'osama.attendance@school.edu.eg',
      username: 'att_officer',
      password: 'Password123',
      isAttendanceOfficer: true,
      specialization: 'مسؤول ومحضر الحضور والغياب اليومي للمدرسة',
      status: 'نشط',
      assignedClasses: [],
      assignedSubjects: [],
      joinDate: '2023-01-01',
    },
    {
      id: `tch-${schoolId}-1`,
      schoolId,
      name: 'أ. هبة الله محمود',
      nationalId: '29305120102934',
      phone: '01011223344',
      email: 'heba.m@school.edu.eg',
      username: 'أ. هبة الله محمود',
      password: '10001',
      isAttendanceOfficer: false,
      specialization: 'رياض أطفال وتربية مبكرة (KG)',
      status: 'نشط',
      assignedClasses: ['روضة أولى (KG-1) - أ', 'روضة ثانية (KG-2) - أ'],
      assignedSubjects: ['اكتشف والأنشطة (Discovery)'],
      joinDate: '2023-09-01',
    },
    {
      id: `tch-${schoolId}-2`,
      schoolId,
      name: 'أ. منى السيد',
      nationalId: '29008151203948',
      phone: '01122334455',
      email: 'mona.elsayed@school.edu.eg',
      username: 'أ. منى السيد',
      password: '10002',
      isAttendanceOfficer: false,
      specialization: 'اللغة العربية - المرحلة الابتدائية',
      status: 'نشط',
      assignedClasses: ['الصف الأول الابتدائي - أ'],
      assignedSubjects: ['اللغة العربية والخط'],
      joinDate: '2022-01-15',
    },
    {
      id: `tch-${schoolId}-3`,
      schoolId,
      name: 'أ. محمد عبد السلام',
      nationalId: '28805120102934',
      phone: '01011223344',
      email: 'm.abdelsalam@school.edu.eg',
      username: 'أ. محمد عبد السلام',
      password: '10003',
      isAttendanceOfficer: false,
      specialization: 'اللغة العربية والتربية الدينية',
      status: 'نشط',
      assignedClasses: ['الصف الأول الإعدادي - أ'],
      assignedSubjects: ['اللغة العربية'],
      joinDate: '2022-09-01',
    },
    {
      id: `tch-${schoolId}-4`,
      schoolId,
      name: 'د. محمود حسن',
      nationalId: '28511020104829',
      phone: '01233445566',
      email: 'm.hassan@school.edu.eg',
      username: 'د. محمود حسن',
      password: '10004',
      isAttendanceOfficer: false,
      specialization: 'العلوم والفيزياء',
      status: 'نشط',
      assignedClasses: ['الصف الثالث الإعدادي - أ', 'الصف الأول الثانوي - أ'],
      assignedSubjects: ['العلوم والتكنولوجيا'],
      joinDate: '2021-08-20',
    },
    {
      id: `tch-${schoolId}-5`,
      schoolId,
      name: 'د. خالد توفيق',
      nationalId: '28203200109283',
      phone: '01544556677',
      email: 'k.tawfik@school.edu.eg',
      username: 'د. خالد توفيق',
      password: '10005',
      isAttendanceOfficer: false,
      specialization: 'الكيمياء والفيزياء - الثانوية العامة',
      status: 'نشط',
      assignedClasses: ['الصف الثالث الثانوي - أ'],
      assignedSubjects: ['الكيمياء والفيزياء المتقدمة'],
      joinDate: '2020-02-01',
    },
  ];

  // 4. Initial Students (from KG1 to 3rd Secondary)
  const initialStudents: Student[] = [
    {
      id: `std-${schoolId}-kg1-1`,
      schoolId,
      name: 'آدم أحمد فتحي',
      studentCode: 'STD-2026-10001',
      nationalId: '32205120108234',
      classId: `cls-${schoolId}-kg1`,
      className: 'روضة أولى (KG-1) - أ',
      birthDate: '2022-04-10',
      gender: 'ذكر',
      status: 'منتظم',
      parentName: 'أحمد فتحي المغازي',
      parentPhone: '01012345678',
      parentEmail: 'parent.ahmed@gmail.com',
      address: 'القاهرة - المعادي - شارع 9',
      joinDate: '2025-09-01',
    },
    {
      id: `std-${schoolId}-kg2-1`,
      schoolId,
      name: 'ليان محمود صلاح',
      studentCode: 'STD-2026-10002',
      nationalId: '32108200109382',
      classId: `cls-${schoolId}-kg2`,
      className: 'روضة ثانية (KG-2) - أ',
      birthDate: '2021-06-15',
      gender: 'أنثى',
      status: 'منتظم',
      parentName: 'محمود صلاح الدين',
      parentPhone: '01123456789',
      parentEmail: 'm.salah@gmail.com',
      address: 'القاهرة - التجمع الخامس',
      joinDate: '2024-09-01',
    },
    {
      id: `std-${schoolId}-p1-1`,
      schoolId,
      name: 'حمزة محمد عصام',
      studentCode: 'STD-2026-10003',
      nationalId: '32003220104921',
      classId: `cls-${schoolId}-p1`,
      className: 'الصف الأول الابتدائي - أ',
      birthDate: '2020-03-22',
      gender: 'ذكر',
      status: 'منتظم',
      parentName: 'محمد عصام الدين',
      parentPhone: '01234567890',
      address: 'القاهرة - مدينة نصر',
      joinDate: '2024-09-01',
    },
    {
      id: `std-${schoolId}-p6-1`,
      schoolId,
      name: 'ياسين طارق العوضي',
      studentCode: 'STD-2026-10004',
      nationalId: '31502140108372',
      classId: `cls-${schoolId}-p6`,
      className: 'الصف السادس الابتدائي - أ',
      birthDate: '2015-02-14',
      gender: 'ذكر',
      status: 'منتظم',
      parentName: 'طارق مصطفى العوضي',
      parentPhone: '01512345678',
      address: 'القاهرة - الشروق',
      joinDate: '2020-09-01',
    },
    {
      id: `std-${schoolId}-m1-1`,
      schoolId,
      name: 'عمر أحمد فتحي',
      studentCode: 'STD-2026-10005',
      nationalId: '31205120108234',
      classId: `cls-${schoolId}-m1`,
      className: 'الصف الأول الإعدادي - أ',
      birthDate: '2012-05-12',
      gender: 'ذكر',
      status: 'منتظم',
      parentName: 'أحمد فتحي المغازي',
      parentPhone: '01012345678',
      parentEmail: 'parent.ahmed@gmail.com',
      address: 'القاهرة - المعادي - شارع 9',
      joinDate: '2023-09-01',
    },
    {
      id: `std-${schoolId}-s1-1`,
      schoolId,
      name: 'جنى جمال الدين',
      studentCode: 'STD-2026-10006',
      nationalId: '30912090107261',
      classId: `cls-${schoolId}-s1`,
      className: 'الصف الأول الثانوي - أ',
      birthDate: '2009-12-09',
      gender: 'أنثى',
      status: 'منتظم',
      parentName: 'جمال الدين الرشيدي',
      parentPhone: '01033445566',
      address: 'القاهرة - الشيخ زايد',
      joinDate: '2024-09-01',
    },
    {
      id: `std-${schoolId}-s3-1`,
      schoolId,
      name: 'سيف الدين أيمن',
      studentCode: 'STD-2026-10007',
      nationalId: '30707180109928',
      classId: `cls-${schoolId}-s3`,
      className: 'الصف الثالث الثانوي - أ',
      birthDate: '2007-07-18',
      gender: 'ذكر',
      status: 'منتظم',
      parentName: 'أيمن عبد المنعم',
      parentPhone: '01198765432',
      address: 'القاهرة - الدقي',
      joinDate: '2022-09-01',
    },
  ];

  // 5. Initial Parents
  const initialParents: Parent[] = [
    {
      id: `prn-${schoolId}-1`,
      schoolId,
      name: 'أحمد فتحي المغازي',
      nationalId: '27501010102938',
      phone: '01012345678',
      email: 'parent.ahmed@gmail.com',
      occupation: 'مهندس استشاري',
      address: 'القاهرة - المعادي - شارع 9',
      childrenIds: [`std-${schoolId}-1`],
      childrenNames: ['عمر أحمد فتحي'],
    },
    {
      id: `prn-${schoolId}-2`,
      schoolId,
      name: 'محمود صلاح الدين',
      nationalId: '27804120108372',
      phone: '01123456789',
      email: 'm.salah@gmail.com',
      occupation: 'طبيب طبيب جراحة',
      address: 'القاهرة - التجمع الخامس',
      childrenIds: [`std-${schoolId}-2`],
      childrenNames: ['مريم محمود صلاح'],
    },
    {
      id: `prn-${schoolId}-3`,
      schoolId,
      name: 'طارق مصطفى العوضي',
      nationalId: '28009100103948',
      phone: '01512345678',
      email: 't.awadi@yahoo.com',
      occupation: 'محاسب قانوني',
      address: 'القاهرة - مدينة نصر',
      childrenIds: [`std-${schoolId}-3`],
      childrenNames: ['يوسف طارق العوضي'],
    },
  ];

  // 6. Today's Attendance
  const today = new Date().toISOString().split('T')[0];
  const initialAttendance: AttendanceRecord[] = [
    {
      id: `att-${schoolId}-1`,
      schoolId,
      studentId: `std-${schoolId}-1`,
      studentName: 'عمر أحمد فتحي',
      classId: `cls-${schoolId}-1`,
      className: 'الصف الأول الإعدادي - أ',
      date: today,
      status: 'حاضر',
    },
    {
      id: `att-${schoolId}-2`,
      schoolId,
      studentId: `std-${schoolId}-2`,
      studentName: 'مريم محمود صلاح',
      classId: `cls-${schoolId}-1`,
      className: 'الصف الأول الإعدادي - أ',
      date: today,
      status: 'حاضر',
    },
    {
      id: `att-${schoolId}-3`,
      schoolId,
      studentId: `std-${schoolId}-3`,
      studentName: 'يوسف طارق العوضي',
      classId: `cls-${schoolId}-1`,
      className: 'الصف الأول الإعدادي - أ',
      date: today,
      status: 'متأخر',
      notes: 'تأخر 15 دقيقة طابور الصباح',
    },
    {
      id: `att-${schoolId}-4`,
      schoolId,
      studentId: `std-${schoolId}-4`,
      studentName: 'فاطمة إبراهيم حسن',
      classId: `cls-${schoolId}-2`,
      className: 'الصف الأول الإعدادي - ب',
      date: today,
      status: 'غائب',
      notes: 'بعذر طبي',
    },
  ];

  // 7. Initial Grades
  const initialGrades: GradeRecord[] = [
    {
      id: `grd-${schoolId}-1`,
      schoolId,
      studentId: `std-${schoolId}-1`,
      studentName: 'عمر أحمد فتحي',
      classId: `cls-${schoolId}-1`,
      className: 'الصف الأول الإعدادي - أ',
      subjectId: `sbj-${schoolId}-1`,
      subjectName: 'اللغة العربية',
      examName: 'اختبار شهر أكتوبر',
      score: 95,
      maxScore: 100,
      date: '2025-10-25',
      notes: 'ممتاز جودة الإملاء والتعبير',
    },
    {
      id: `grd-${schoolId}-2`,
      schoolId,
      studentId: `std-${schoolId}-2`,
      studentName: 'مريم محمود صلاح',
      classId: `cls-${schoolId}-1`,
      className: 'الصف الأول الإعدادي - أ',
      subjectId: `sbj-${schoolId}-2`,
      subjectName: 'الرياضيات',
      examName: 'اختبار شهر أكتوبر',
      score: 98,
      maxScore: 100,
      date: '2025-10-28',
      notes: 'تفكير منطقي ممتاز',
    },
    {
      id: `grd-${schoolId}-3`,
      schoolId,
      studentId: `std-${schoolId}-3`,
      studentName: 'يوسف طارق العوضي',
      classId: `cls-${schoolId}-1`,
      className: 'الصف الأول الإعدادي - أ',
      subjectId: `sbj-${schoolId}-3`,
      subjectName: 'العلوم والتكنولوجيا',
      examName: 'منتصف الفصل الدراسي الأول',
      score: 82,
      maxScore: 100,
      date: '2025-11-15',
    },
  ];

  // 8. Initial Behavior Records
  const initialBehavior: BehaviorRecord[] = [
    {
      id: `bhv-${schoolId}-1`,
      schoolId,
      studentId: `std-${schoolId}-1`,
      studentName: 'عمر أحمد فتحي',
      classId: `cls-${schoolId}-1`,
      type: 'إيجابي',
      title: 'مشاركة ممتازة بالمجلس المالي المدرسي',
      points: 5,
      date: today,
      notes: 'تطوع لتنظيم فعاليات مسابقة الموهوبين بالفصل',
      reportedBy: 'أ. محمد عبد السلام',
    },
    {
      id: `bhv-${schoolId}-2`,
      schoolId,
      studentId: `std-${schoolId}-3`,
      studentName: 'يوسف طارق العوضي',
      classId: `cls-${schoolId}-1`,
      type: 'سلبي',
      title: 'تأخر متكرر عن طابور الصباح',
      points: -2,
      date: today,
      notes: 'تم التنبيه والتوجيه المباشر للطالب',
      reportedBy: 'أ. سارة فتحي',
    },
  ];

  // 9. Initial Announcements
  const initialAnnouncements: Announcement[] = [
    {
      id: `anc-${schoolId}-1`,
      schoolId,
      title: 'جدول اختبارات شهر مارس لجميع المراحل الإعدادية والثانوية',
      content: 'نود إحاطة علم جميع الطلاب بأن اختبارات شهر مارس ستبدأ من يوم الأحد القادم وفقاً للجدول المرفق بموقع المدرسة الرسمي.',
      targetAudience: 'جميع المدارس',
      priority: 'عاجل جداً',
      publishDate: today,
      isScheduled: false,
      author: 'إدارة المدرسة',
    },
    {
      id: `anc-${schoolId}-2`,
      schoolId,
      title: 'لقاء التوجيه والإرشاد الأكاديمي للطلاب والمعلمين',
      content: 'يسر إدارة المدرسة دعوتكم لحضور اللقاء الدوري لمناقشة نتائج الفصل الدراسي والخطط التطويرية وذلك يوم الخميس الساعة 5 مساءً.',
      targetAudience: 'الطلاب',
      priority: 'هام',
      publishDate: '2026-03-20',
      isScheduled: false,
      author: 'مدير المدرسة',
    },
    {
      id: `anc-${schoolId}-3`,
      schoolId,
      title: 'ورشة عمل تطوير المناهج والتحول الرقمي للمعلمين',
      content: 'ورشة تدريبية لكادر المعلمين حول استخدام شاشات التفاعل والمنصة التعليمية الحديثة.',
      targetAudience: 'المعلمين',
      priority: 'عادي',
      publishDate: '2026-03-22',
      isScheduled: true,
      author: 'وحدة التطوير والتدريب',
    },
  ];

  // Save to persistent storage
  setStorage('classes', dedupeById([...getStorage<ClassRoom[]>('classes', []), ...initialClasses]));
  setStorage('subjects', dedupeById([...getStorage<Subject[]>('subjects', []), ...initialSubjects]));
  setStorage('teachers', dedupeById([...getStorage<Teacher[]>('teachers', []), ...initialTeachers]));
  setStorage('students', dedupeById([...getStorage<Student[]>('students', []), ...initialStudents]));
  setStorage('parents', dedupeById([...getStorage<Parent[]>('parents', []), ...initialParents]));
  setStorage('attendance', dedupeById([...getStorage<AttendanceRecord[]>('attendance', []), ...initialAttendance]));
  setStorage('grades', dedupeById([...getStorage<GradeRecord[]>('grades', []), ...initialGrades]));
  setStorage('behavior', dedupeById([...getStorage<BehaviorRecord[]>('behavior', []), ...initialBehavior]));
  setStorage('announcements', dedupeById([...getStorage<Announcement[]>('announcements', []), ...initialAnnouncements]));

  allInfo[schoolId] = initialInfo;
  setStorage('school_info', allInfo);
}

// Strictly School-Filtered Query API Helpers

export function getSchoolAdminInfo(schoolId: string): SchoolAdminInfo {
  const allInfo = getStorage<Record<string, SchoolAdminInfo>>('school_info', {});
  const storedSchools = getStoredSchools();
  const knownSchool = storedSchools.find((s) => s.id === schoolId);

  // If already in allInfo and not a placeholder, return it
  if (
    allInfo[schoolId] &&
    allInfo[schoolId].name &&
    allInfo[schoolId].name !== 'مدرسة جديدة' &&
    allInfo[schoolId].name !== 'مدرسة نموذجية مصرية' &&
    allInfo[schoolId].name !== 'مدرسة'
  ) {
    return allInfo[schoolId];
  }

  // If knownSchool exists, use its authoritative data
  if (knownSchool) {
    const updated: SchoolAdminInfo = {
      schoolId,
      name: knownSchool.name,
      code: knownSchool.code,
      licenseKey: knownSchool.licenseKey,
      governorate: knownSchool.governorate,
      educationalDistrict: allInfo[schoolId]?.educationalDistrict || 'الإدارة التعليمية',
      address: allInfo[schoolId]?.address || 'جمهورية مصر العربية',
      phone: knownSchool.principalPhone || allInfo[schoolId]?.phone || '',
      email: knownSchool.adminEmail || allInfo[schoolId]?.email || '',
      principalName: knownSchool.principalName || allInfo[schoolId]?.principalName || 'مدير المدرسة',
      academicYear: allInfo[schoolId]?.academicYear || '2025/2026',
    };
    allInfo[schoolId] = updated;
    setStorage('school_info', allInfo);
    return updated;
  }

  seedSchoolData(schoolId);
  if (allInfo[schoolId]) return allInfo[schoolId];
  return {
    schoolId,
    name: 'المدرسة',
    code: schoolId,
    licenseKey: '',
    governorate: 'القاهرة',
    educationalDistrict: 'الإدارة التعليمية',
    address: 'جمهورية مصر العربية',
    phone: '',
    email: '',
    principalName: 'مدير المدرسة',
    academicYear: '2025/2026',
  };
}

export function updateSchoolAdminInfo(info: SchoolAdminInfo): void {
  const allInfo = getStorage<Record<string, SchoolAdminInfo>>('school_info', {});
  allInfo[info.schoolId] = info;
  setStorage('school_info', allInfo);
  notifyDataChanged('school_info');
}

// In-flight synchronization promise tracker to prevent duplicate concurrent network requests
const inFlightSyncPromises = new Map<string, Promise<void>>();

// Central PostgreSQL Synchronizer (Strict One-Way Server Hydration)
export async function syncSchoolDataFromCentralDb(schoolId: string): Promise<void> {
  if (!schoolId) return;

  const existingPromise = inFlightSyncPromises.get(schoolId);
  if (existingPromise) {
    return existingPromise;
  }

  const syncPromise = (async () => {
    try {
      const data = await fetchSchoolFullDataApi(schoolId);
      if (!data || !data.success) return;

      // 1. Authoritatively update School Info and Stored Schools
      if (data.schoolInfo) {
        const allInfo = getStorage<Record<string, SchoolAdminInfo>>('school_info', {});
        allInfo[schoolId] = {
          schoolId: data.schoolInfo.schoolId || schoolId,
          name: data.schoolInfo.name,
          code: data.schoolInfo.code,
          licenseKey: data.schoolInfo.licenseKey || '',
          governorate: data.schoolInfo.governorate || 'القاهرة',
          educationalDistrict: data.schoolInfo.educationalDistrict || 'الإدارة التعليمية',
          address: data.schoolInfo.address || 'جمهورية مصر العربية',
          phone: data.schoolInfo.phone || '',
          email: data.schoolInfo.email || '',
          principalName: data.schoolInfo.principalName || 'مدير المدرسة',
          academicYear: data.schoolInfo.academicYear || '2025/2026',
          themeColor: data.schoolInfo.themeColor,
        };
        setStorage('school_info', allInfo);

        // Ensure school is cached in storedSchools list for all views and auth recovery
        const storedSchools = getStoredSchools();
        const existingIdx = storedSchools.findIndex((s) => s.id === schoolId);
        const schoolObj: School = {
          id: data.schoolInfo.schoolId || schoolId,
          name: data.schoolInfo.name,
          code: data.schoolInfo.code,
          licenseKey: data.schoolInfo.licenseKey,
          adminEmail: data.schoolInfo.email,
          governorate: data.schoolInfo.governorate || 'القاهرة',
          studentsCount: Array.isArray(data.students) ? data.students.length : (data.schoolInfo.studentsCount || 0),
          teachersCount: Array.isArray(data.teachers) ? data.teachers.length : (data.schoolInfo.teachersCount || 0),
          subscription: data.schoolInfo.subscription || 'بريميوم',
          status: data.schoolInfo.status || 'نشطة',
          createdAt: data.schoolInfo.createdAt || new Date().toISOString(),
          principalName: data.schoolInfo.principalName,
          principalPhone: data.schoolInfo.principalPhone,
          principalEmail: data.schoolInfo.principalEmail,
          licenseExpiry: data.schoolInfo.licenseExpiry,
          stage: data.schoolInfo.stage,
        };
        if (existingIdx >= 0) {
          storedSchools[existingIdx] = { ...storedSchools[existingIdx], ...schoolObj };
        } else {
          storedSchools.push(schoolObj);
        }
        saveStoredSchools(storedSchools);
      }

      if (Array.isArray(data.classes)) {
        const otherSchools = getStorage<ClassRoom[]>('classes', []).filter((c) => c.schoolId !== schoolId);
        setStorage('classes', dedupeById([...otherSchools, ...data.classes]));
      }
      if (Array.isArray(data.students)) {
        const otherSchools = getStorage<Student[]>('students', []).filter((s) => s.schoolId !== schoolId);
        setStorage('students', dedupeById([...otherSchools, ...data.students]));
      }
      if (Array.isArray(data.teachers)) {
        const otherSchools = getStorage<Teacher[]>('teachers', []).filter((t) => t.schoolId !== schoolId);
        setStorage('teachers', dedupeById([...otherSchools, ...data.teachers]));
      }
      if (Array.isArray(data.subjects)) {
        const otherSchools = getStorage<Subject[]>('subjects', []).filter((s) => s.schoolId !== schoolId);
        setStorage('subjects', dedupeById([...otherSchools, ...data.subjects]));
      }
      if (Array.isArray(data.attendance)) {
        const otherSchools = getStorage<AttendanceRecord[]>('attendance', []).filter((a) => a.schoolId !== schoolId);
        setStorage('attendance', dedupeById([...otherSchools, ...data.attendance]));
      }
      if (Array.isArray(data.grades)) {
        const otherSchools = getStorage<GradeRecord[]>('grades', []).filter((g) => g.schoolId !== schoolId);
        setStorage('grades', dedupeById([...otherSchools, ...data.grades]));
      }
      if (Array.isArray(data.behavior)) {
        const otherSchools = getStorage<BehaviorRecord[]>('behavior', []).filter((b) => b.schoolId !== schoolId);
        setStorage('behavior', dedupeById([...otherSchools, ...data.behavior]));
      }
      if (Array.isArray(data.announcements)) {
        const otherSchools = getStorage<Announcement[]>('announcements', []).filter((a) => a.schoolId !== schoolId);
        setStorage('announcements', dedupeById([...otherSchools, ...data.announcements]));
      }
      if (Array.isArray(data.parents)) {
        const otherSchools = getStorage<Parent[]>('parents', []).filter((p) => p.schoolId !== schoolId);
        setStorage('parents', dedupeById([...otherSchools, ...data.parents]));
      }
      if (Array.isArray(data.badges)) {
        const otherBadges = getStorage<any[]>('system_badges_v1', []).filter((b) => b.schoolId && b.schoolId !== schoolId);
        setStorage('system_badges_v1', dedupeById([...otherBadges, ...data.badges]));
      }
      if (Array.isArray(data.studentBadges)) {
        const otherStudentBadges = getStorage<any[]>('student_badges_v1', []).filter((b) => b.schoolId && b.schoolId !== schoolId);
        setStorage('student_badges_v1', dedupeById([...otherStudentBadges, ...data.studentBadges]));
      }
      if (Array.isArray(data.teacherBadges)) {
        const otherTeacherBadges = getStorage<any[]>('teacher_badges_v1', []).filter((b) => b.schoolId && b.schoolId !== schoolId);
        setStorage('teacher_badges_v1', dedupeById([...otherTeacherBadges, ...data.teacherBadges]));
      }
      if (Array.isArray(data.calendarTasks)) {
        const raw = localStorage.getItem('school_calendar_tasks_v1');
        const allTasks = raw ? JSON.parse(raw) : [];
        const otherTasks = allTasks.filter((t: any) => t.school_id !== schoolId && t.schoolId !== schoolId);
        localStorage.setItem('school_calendar_tasks_v1', JSON.stringify(dedupeById([...otherTasks, ...data.calendarTasks])));
      }
      if (Array.isArray(data.homework)) {
        const otherHomework = getStorage<any[]>('eg_school_parent_homework_v2', []).filter((h) => h.schoolId !== schoolId);
        setStorage('eg_school_parent_homework_v2', dedupeById([...otherHomework, ...data.homework]));
      }

      notifyDataChanged('central_sync_complete');
    } catch (err) {
      // Silent sync guard
    } finally {
      inFlightSyncPromises.delete(schoolId);
    }
  })();

  inFlightSyncPromises.set(schoolId, syncPromise);
  return syncPromise;
}

/**
 * Deprecated: Auto-syncing all local schools to DB is disabled to preserve PostgreSQL as Single Source of Truth.
 */
export async function syncAllLocalSchoolsToCentralDb(): Promise<void> {
  // No-op to prevent unauthenticated local data injection into central PostgreSQL database.
}

// Students
export function getStudentsBySchool(schoolId: string): Student[] {
  seedSchoolData(schoolId);
  const all = getStorage<Student[]>('students', []);
  let filtered = dedupeById(all.filter((s) => s.schoolId === schoolId));
  if (filtered.length === 0) {
    const specific = getStorage<Student[]>(`school_${schoolId}_students`, []);
    if (specific.length > 0) {
      filtered = dedupeById(specific);
      setStorage('students', dedupeById([...all, ...specific]));
    }
  }
  let modified = false;
  const list = filtered.map((s, idx) => {
    if (!s.studentCode) {
      s.studentCode = `STD-2026-${10000 + idx + 1}`;
      modified = true;
    }
    return s;
  });
  if (modified) {
    setStorage('students', dedupeById(all));
  }
  return list;
}

export async function saveStudent(student: Student): Promise<Student> {
  // 1. Persist to central PostgreSQL database first (Authoritative Source of Truth)
  const savedStudent = await saveStudentApi(student.schoolId, student);
  const finalStudent = savedStudent || student;

  // 2. Update local cache only after central database write succeeds
  const all = getStorage<Student[]>('students', []);
  const index = all.findIndex((s) => s.id === finalStudent.id);
  if (index >= 0) {
    all[index] = finalStudent;
  } else {
    all.unshift(finalStudent);
  }
  setStorage('students', dedupeById(all));

  // Also update specific school students cache if present
  const schoolKey = `school_${finalStudent.schoolId}_students`;
  const schoolStudents = getStorage<Student[]>(schoolKey, []);
  if (schoolStudents.length > 0) {
    const sIdx = schoolStudents.findIndex((s) => s.id === finalStudent.id);
    if (sIdx >= 0) schoolStudents[sIdx] = finalStudent;
    else schoolStudents.unshift(finalStudent);
    setStorage(schoolKey, dedupeById(schoolStudents));
  }

  // Synchronize current session if active user is this student
  try {
    const currentSession = getStoredSession();
    if (currentSession && (currentSession.studentId === finalStudent.id || currentSession.userId === finalStudent.id)) {
      let sessChanged = false;
      if (currentSession.className !== finalStudent.className) {
        currentSession.className = finalStudent.className;
        sessChanged = true;
      }
      if (currentSession.gradeLevel !== finalStudent.gradeLevel) {
        currentSession.gradeLevel = finalStudent.gradeLevel;
        sessChanged = true;
      }
      if (sessChanged) {
        saveStoredSession(currentSession);
      }
    }
  } catch {}

  notifyDataChanged('students');

  return finalStudent;
}

export async function batchAssignStudentClasses(
  schoolId: string,
  assignments: Array<{ studentId: string; classId: string; className: string; gradeLevel?: string }>
): Promise<number> {
  if (!assignments || assignments.length === 0) return 0;

  try {
    await batchAssignStudentsApi(
      schoolId,
      assignments.map((a) => ({ studentId: a.studentId, classId: a.classId, className: a.className }))
    );
  } catch (err) {
    console.warn('Batch assign API failed, updating local state:', err);
  }

  const all = getStorage<Student[]>('students', []);
  const assignmentMap = new Map(assignments.map((a) => [a.studentId, a]));

  const updatedList = all.map((st) => {
    if (st.schoolId === schoolId && assignmentMap.has(st.id)) {
      const match = assignmentMap.get(st.id)!;
      return {
        ...st,
        classId: match.classId,
        className: match.className,
        isClassAssigned: true,
      };
    }
    return st;
  });

  setStorage('students', dedupeById(updatedList));
  notifyDataChanged('students');
  return assignments.length;
}

export async function deleteStudent(studentId: string, schoolId?: string): Promise<void> {
  const all = getStorage<Student[]>('students', []);
  const target = all.find((s) => s.id === studentId);
  const sId = schoolId || target?.schoolId || 'sch-1';

  // 1. Delete from central PostgreSQL database first
  await deleteStudentApi(sId, studentId);

  // 2. Update local cache only after central database operation succeeds
  setStorage(
    'students',
    all.filter((s) => s.id !== studentId)
  );
  notifyDataChanged('students');
}

export function generateStudentCode(): string {
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `STD-2026-${randomDigits}`;
}

export function canSetAttendanceOfficer(schoolId: string, currentTeacherId?: string): boolean {
  const teachers = getTeachersBySchool(schoolId);
  const existingOfficer = teachers.find(
    (t) => t.isAttendanceOfficer && t.id !== currentTeacherId
  );
  return !existingOfficer;
}

export function authenticateStaffAccount(
  schoolId: string | undefined,
  username: string,
  pass: string,
  role: 'teacher' | 'attendance'
): Teacher | null {
  const cleanUser = (username || '').trim().toLowerCase();
  const cleanPass = (pass || '').trim();

  // Rate limiting protection
  const rateLimitKey = `${schoolId || 'any'}_${role}_${cleanUser}`;
  const rateStatus = checkLoginRateLimit(rateLimitKey);
  if (rateStatus.isLocked) {
    console.warn(`🔒 Account locked due to brute force protection: ${cleanUser}`);
    return null;
  }

  const teachers = schoolId ? getTeachersBySchool(schoolId) : getStorage<Teacher[]>('teachers', []);

  const found = teachers.find((t) => {
    const matchUser =
      (t.username && t.username.toLowerCase() === cleanUser) ||
      (t.email && t.email.toLowerCase() === cleanUser) ||
      (t.nationalId && t.nationalId.trim() === cleanUser);

    const matchPass = t.password ? t.password === cleanPass : true;

    if (role === 'attendance') {
      return matchUser && matchPass && Boolean(t.isAttendanceOfficer);
    } else {
      return matchUser && matchPass && !t.isAttendanceOfficer;
    }
  });

  if (found) {
    resetLoginRateLimit(rateLimitKey);
    return found;
  } else {
    recordFailedLoginAttempt(rateLimitKey);
    return null;
  }
}

// Teachers
export function getTeachersBySchool(schoolId: string): Teacher[] {
  seedSchoolData(schoolId);
  const all = getStorage<Teacher[]>('teachers', []);
  return dedupeById(all.filter((t) => t.schoolId === schoolId));
}

export async function saveTeacher(teacher: Teacher): Promise<Teacher> {
  // 1. Persist to central PostgreSQL database first (Authoritative Source of Truth)
  const savedTeacher = await saveTeacherApi(teacher.schoolId, teacher);
  const finalTeacher = { ...teacher, ...(savedTeacher || {}) };
  if (!finalTeacher.password && teacher.password) {
    finalTeacher.password = teacher.password;
  }

  // 2. Update local cache only after central database operation succeeds
  const all = getStorage<Teacher[]>('teachers', []);
  if (finalTeacher.isAttendanceOfficer) {
    const existingIndex = all.findIndex(
      (t) => t.schoolId === finalTeacher.schoolId && t.isAttendanceOfficer && t.id !== finalTeacher.id
    );
    if (existingIndex >= 0) {
      all[existingIndex].isAttendanceOfficer = false;
    }
  }

  const index = all.findIndex((t) => t.id === finalTeacher.id);
  if (index >= 0) {
    all[index] = finalTeacher;
  } else {
    all.unshift(finalTeacher);
  }
  setStorage('teachers', dedupeById(all));
  notifyDataChanged('teachers');

  return finalTeacher;
}

export async function deleteTeacher(teacherId: string, schoolId?: string): Promise<void> {
  const all = getStorage<Teacher[]>('teachers', []);
  const target = all.find((t) => t.id === teacherId);
  const sId = schoolId || target?.schoolId || 'sch-1';

  // 1. Delete from central PostgreSQL database first
  await deleteTeacherApi(sId, teacherId);

  // 2. Update local cache only after central database operation succeeds
  setStorage(
    'teachers',
    all.filter((t) => t.id !== teacherId)
  );
  notifyDataChanged('teachers');
}

// Classes
export function getClassesBySchool(schoolId: string): ClassRoom[] {
  seedSchoolData(schoolId);
  const all = getStorage<ClassRoom[]>('classes', []);
  const filtered = dedupeById(all.filter((c) => c.schoolId === schoolId));
  if (filtered.length > 0) return filtered;

  // Fallback 1: specific school classes key
  const specific = getStorage<ClassRoom[]>(`school_${schoolId}_classes`, []);
  if (specific.length > 0) {
    const combined = dedupeById([...all, ...specific]);
    setStorage('classes', combined);
    return dedupeById(specific);
  }

  // Fallback 2: dynamically derive from students ONLY if classes is truly empty
  const students = getStorage<Student[]>('students', []).filter((s) => s.schoolId === schoolId);
  if (students.length > 0) {
    const derived: ClassRoom[] = [];
    const usedNames = new Set<string>();
    students.forEach((s) => {
      const c = (s.className || '').trim();
      if (c && c !== 'بدون فصل' && c !== 'غير محدد') {
        const mapped = mapEgyptianSheetName(c);
        usedNames.add(mapped.className || c);
      }
    });

    if (usedNames.size > 0) {
      let idx = 1;
      usedNames.forEach((name) => {
        const mapped = mapEgyptianSheetName(name);
        derived.push({
          id: `cls-${schoolId}-${idx++}`,
          schoolId,
          name,
          gradeLevel: mapped.gradeLevel || 'المرحلة الدراسية',
          capacity: 40,
        });
      });
    }

    if (derived.length > 0) {
      setStorage('classes', dedupeById([...all, ...derived]));
      setStorage(`school_${schoolId}_classes`, derived);
      return derived;
    }
  }

  return [];
}

export async function saveClass(classRoom: ClassRoom): Promise<ClassRoom> {
  const all = getStorage<ClassRoom[]>('classes', []);
  const oldClass = all.find((c) => c.id === classRoom.id);
  const oldName = oldClass?.name;

  // 1. Persist to central PostgreSQL database first (Authoritative Source of Truth)
  const savedClass = await saveClassApi(classRoom.schoolId, classRoom);
  const finalClass = savedClass || classRoom;

  // 2. Update local cache only after central database operation succeeds
  const index = all.findIndex((c) => c.id === finalClass.id);
  if (index >= 0) {
    all[index] = finalClass;
  } else {
    all.unshift(finalClass);
  }
  setStorage('classes', dedupeById(all));

  // Also update specific school cache if present
  const specific = getStorage<ClassRoom[]>(`school_${finalClass.schoolId}_classes`, []);
  if (specific.length > 0) {
    const sIdx = specific.findIndex((c) => c.id === finalClass.id);
    if (sIdx >= 0) specific[sIdx] = finalClass;
    else specific.unshift(finalClass);
    setStorage(`school_${finalClass.schoolId}_classes`, dedupeById(specific));
  }

  // Update students whose classId or old className matches
  const students = getStorage<Student[]>('students', []);
  let studentsUpdated = false;
  const updatedStudents = students.map((s) => {
    if (s.schoolId === finalClass.schoolId && (s.classId === finalClass.id || (oldName && s.className === oldName))) {
      studentsUpdated = true;
      return {
        ...s,
        classId: finalClass.id,
        className: finalClass.name,
        gradeLevel: finalClass.gradeLevel || s.gradeLevel,
        isClassAssigned: true,
      };
    }
    return s;
  });
  if (studentsUpdated) {
    setStorage('students', updatedStudents);
    setStorage(`school_${finalClass.schoolId}_students`, updatedStudents.filter((s) => s.schoolId === finalClass.schoolId));
  }

  // Update active student session if matching
  try {
    const currentSession = getStoredSession();
    if (currentSession && currentSession.schoolId === finalClass.schoolId) {
      if (
        currentSession.className === oldName ||
        (currentSession.studentId && updatedStudents.some((s) => s.id === currentSession.studentId))
      ) {
        currentSession.className = finalClass.name;
        currentSession.gradeLevel = finalClass.gradeLevel;
        saveStoredSession(currentSession);
      }
    }
  } catch {}

  // Update saved trusted device accounts if matching
  try {
    const rawSaved = localStorage.getItem('eg_saved_trusted_device_accounts_v1');
    if (rawSaved) {
      let accounts: any[] = JSON.parse(rawSaved);
      let accChanged = false;
      accounts = accounts.map((acc) => {
        if (acc.schoolId === finalClass.schoolId && (acc.className === oldName || acc.className === finalClass.id)) {
          accChanged = true;
          return { ...acc, className: finalClass.name };
        }
        return acc;
      });
      if (accChanged) {
        localStorage.setItem('eg_saved_trusted_device_accounts_v1', JSON.stringify(accounts));
      }
    }
  } catch {}

  // Synchronize local homework cache with renamed class
  try {
    const homework = getStorage<any[]>('school_homework_v1', []);
    let hwUpdated = false;
    const updatedHw = homework.map((h) => {
      if (h.schoolId === finalClass.schoolId && (h.classId === finalClass.id || (oldName && h.className === oldName))) {
        hwUpdated = true;
        return { ...h, classId: finalClass.id, className: finalClass.name };
      }
      return h;
    });
    if (hwUpdated) setStorage('school_homework_v1', updatedHw);
  } catch {}

  // 3. Immediately synchronize Community Groups for this class & school
  try {
    syncClassCommunityGroup(finalClass);
  } catch (err) {
    console.warn('Failed to sync community group for class:', err);
  }

  notifyDataChanged('classes');
  notifyDataChanged('students');

  return finalClass;
}

export async function deleteClass(classId: string, schoolId?: string): Promise<void> {
  const all = getStorage<ClassRoom[]>('classes', []);
  const target = all.find((c) => c.id === classId);
  const sId = schoolId || target?.schoolId || 'sch-1';
  const targetName = target?.name;

  // 1. Delete from central PostgreSQL database first
  await deleteClassApi(sId, classId);

  // 2. Update local cache only after central database operation succeeds
  setStorage(
    'classes',
    all.filter((c) => c.id !== classId)
  );

  const specific = getStorage<ClassRoom[]>(`school_${sId}_classes`, []);
  if (specific.length > 0) {
    setStorage(`school_${sId}_classes`, specific.filter((c) => c.id !== classId));
  }

  // Unassign students from deleted class so they don't resurrect it
  const students = getStorage<Student[]>('students', []);
  let stdChanged = false;
  const updatedStudents = students.map((s) => {
    if (s.schoolId === sId && (s.classId === classId || (targetName && s.className === targetName))) {
      stdChanged = true;
      return {
        ...s,
        classId: undefined,
        className: 'بدون فصل',
        isClassAssigned: false,
      };
    }
    return s;
  });
  if (stdChanged) {
    setStorage('students', updatedStudents);
    setStorage(`school_${sId}_students`, updatedStudents.filter((s) => s.schoolId === sId));
  }

  // 3. Synchronize community group removal
  try {
    syncDeletedClassCommunity(classId, sId);
  } catch (err) {
    console.warn('Failed to sync deleted community group:', err);
  }

  notifyDataChanged('classes');
}

// Subjects
export function getSubjectsBySchool(schoolId: string): Subject[] {
  seedSchoolData(schoolId);
  const all = getStorage<Subject[]>('subjects', []);
  return dedupeById(all.filter((s) => s.schoolId === schoolId));
}

export async function saveSubject(subject: Subject): Promise<Subject> {
  // 1. Persist to central PostgreSQL database first (Authoritative Source of Truth)
  const savedSubject = await saveSubjectApi(subject.schoolId, subject);
  const finalSubject = savedSubject || subject;

  // 2. Update local cache only after central database operation succeeds
  const all = getStorage<Subject[]>('subjects', []);
  const index = all.findIndex((s) => s.id === finalSubject.id);
  if (index >= 0) {
    all[index] = finalSubject;
  } else {
    all.unshift(finalSubject);
  }
  setStorage('subjects', dedupeById(all));
  notifyDataChanged('subjects');

  return finalSubject;
}

export async function deleteSubject(subjectId: string, schoolId?: string): Promise<void> {
  const all = getStorage<Subject[]>('subjects', []);
  const target = all.find((s) => s.id === subjectId);
  const sId = schoolId || target?.schoolId || 'sch-1';

  // 1. Delete from central PostgreSQL database first
  await deleteSubjectApi(sId, subjectId);

  // 2. Update local cache only after central database operation succeeds
  setStorage(
    'subjects',
    all.filter((s) => s.id !== subjectId)
  );
  notifyDataChanged('subjects');
}

// Attendance
export function getAttendanceBySchool(schoolId: string, date?: string, classId?: string): AttendanceRecord[] {
  seedSchoolData(schoolId);
  let all = getStorage<AttendanceRecord[]>('attendance', []).filter((a) => a.schoolId === schoolId);
  if (date) {
    all = all.filter((a) => a.date === date);
  }
  if (classId) {
    all = all.filter((a) => a.classId === classId);
  }
  return dedupeById(all);
}

export async function fetchAndSyncAttendance(
  schoolId: string,
  date?: string,
  classId?: string
): Promise<AttendanceRecord[]> {
  try {
    const fetched = await fetchAttendanceApi(schoolId, { date, classId });
    const existing = getStorage<AttendanceRecord[]>('attendance', []);
    const otherRecords = existing.filter((a) => a.schoolId !== schoolId);
    const updated = [...fetched, ...otherRecords];
    setStorage('attendance', dedupeById(updated));
    notifyDataChanged('attendance_synced');
    return fetched;
  } catch (err) {
    throw err;
  }
}

export async function fetchAndSyncStudentAttendance(
  schoolId: string,
  studentId: string
): Promise<AttendanceRecord[]> {
  try {
    const fetched = await fetchStudentAttendanceApi(schoolId, studentId);
    const existing = getStorage<AttendanceRecord[]>('attendance', []);
    const otherRecords = existing.filter((a) => !(a.schoolId === schoolId && a.studentId === studentId));
    const updated = [...fetched, ...otherRecords];
    setStorage('attendance', dedupeById(updated));
    notifyDataChanged('attendance_synced');
    return fetched;
  } catch (err) {
    throw err;
  }
}

import { evaluateAttendanceForSuspensionRule } from './smartSuspensionRule';
import { ensureSchoolAttendanceStartDate } from './reportsStorage';
import { enqueuePendingAttendanceBatch, removePendingAttendanceByDate } from './attendanceOfflineSync';

export async function saveAttendanceRecords(records: AttendanceRecord[]): Promise<AttendanceRecord[]> {
  if (!records || records.length === 0) return [];
  const schoolId = records[0].schoolId;
  const recordDate = records[0].date;

  // 1. OFFLINE-FIRST: Immediately write to client local cache so data is NEVER lost
  const all = getStorage<AttendanceRecord[]>('attendance', []);
  records.forEach((rec) => {
    const idx = all.findIndex((a) => a.id === rec.id || (a.schoolId === rec.schoolId && a.studentId === rec.studentId && a.date === rec.date));
    if (idx >= 0) {
      all[idx] = rec;
    } else {
      all.unshift(rec);
    }
  });
  setStorage('attendance', dedupeById(all));

  // 🛡️ Smart suspension rule evaluation & start date tracking
  try {
    await evaluateAttendanceForSuspensionRule(schoolId, records);
    ensureSchoolAttendanceStartDate(schoolId, recordDate);
  } catch (ruleErr) {
    console.warn('[Attendance Rule]: Local evaluation warning:', ruleErr);
  }

  notifyDataChanged('attendance');

  // 2. ATTEMPT CENTRAL POSTGRESQL SYNC
  try {
    const serverSavedRecords = await saveAttendanceRecordsApi(schoolId, records);
    if (serverSavedRecords && serverSavedRecords.length > 0) {
      // Reconcile with authoritative server records (e.g. 3-late consecutive conversions)
      const freshAll = getStorage<AttendanceRecord[]>('attendance', []);
      serverSavedRecords.forEach((rec) => {
        const idx = freshAll.findIndex((a) => a.id === rec.id || (a.schoolId === rec.schoolId && a.studentId === rec.studentId && a.date === rec.date));
        if (idx >= 0) freshAll[idx] = rec;
        else freshAll.unshift(rec);
      });
      setStorage('attendance', dedupeById(freshAll));
      notifyDataChanged('attendance');

      // Clear any pending offline queue for this date
      removePendingAttendanceByDate(schoolId, recordDate);
      return serverSavedRecords;
    }
    removePendingAttendanceByDate(schoolId, recordDate);
    return records;
  } catch (networkErr: any) {
    console.warn('[Offline Mode]: Network failure saving attendance to server. Enqueueing for auto-sync:', networkErr);
    // Queue batch in local offline queue
    enqueuePendingAttendanceBatch(schoolId, records, undefined, networkErr?.message || 'انقطاع الاتصال بالإنترنت');
    // Return the locally saved records so the UI continues smoothly
    return records;
  }
}

// Grades
export function getGradesBySchool(schoolId: string, classId?: string, subjectId?: string): GradeRecord[] {
  seedSchoolData(schoolId);
  let all = getStorage<GradeRecord[]>('grades', []).filter((g) => g.schoolId === schoolId);
  if (classId) {
    all = all.filter((g) => g.classId === classId);
  }
  if (subjectId) {
    all = all.filter((g) => g.subjectId === subjectId);
  }
  return dedupeById(all);
}

export async function saveGradeRecords(records: GradeRecord[]): Promise<void> {
  if (!records || records.length === 0) return;
  const schoolId = records[0].schoolId;

  // 1. Persist to central PostgreSQL database first (Authoritative Source of Truth)
  await saveGradeRecordsApi(schoolId, records);

  // 2. Update local cache only after central database operation succeeds
  const all = getStorage<GradeRecord[]>('grades', []);
  records.forEach((rec) => {
    const idx = all.findIndex(
      (g) =>
        g.id === rec.id ||
        (g.studentId === rec.studentId && g.subjectId === rec.subjectId && g.examName === rec.examName)
    );
    if (idx >= 0) {
      all[idx] = rec;
    } else {
      all.unshift(rec);
    }
  });
  setStorage('grades', dedupeById(all));
  notifyDataChanged('grades');
}

// Behavior
export function getBehaviorBySchool(schoolId: string, studentId?: string): BehaviorRecord[] {
  seedSchoolData(schoolId);
  let all = getStorage<BehaviorRecord[]>('behavior', []).filter((b) => b.schoolId === schoolId);
  if (studentId) {
    all = all.filter((b) => b.studentId === studentId);
  }
  return dedupeById(all);
}

export async function saveBehaviorRecord(record: BehaviorRecord): Promise<BehaviorRecord> {
  // 1. Persist to central PostgreSQL database first (Authoritative Source of Truth)
  const saved = await saveBehaviorRecordApi(record.schoolId, record);
  const finalRecord = saved || record;

  // 2. Update local cache only after central database operation succeeds
  const all = getStorage<BehaviorRecord[]>('behavior', []);
  const idx = all.findIndex((b) => b.id === finalRecord.id);
  if (idx >= 0) {
    all[idx] = finalRecord;
  } else {
    all.unshift(finalRecord);
  }
  setStorage('behavior', dedupeById(all));
  notifyDataChanged('behavior');

  return finalRecord;
}

export async function deleteBehaviorRecord(recordId: string, schoolId?: string): Promise<void> {
  const all = getStorage<BehaviorRecord[]>('behavior', []);
  const target = all.find((b) => b.id === recordId);
  const sId = schoolId || target?.schoolId || 'sch-1';

  // 1. Delete from central PostgreSQL database first
  await deleteBehaviorRecordApi(sId, recordId);

  // 2. Update local cache only after central database operation succeeds
  setStorage(
    'behavior',
    all.filter((b) => b.id !== recordId)
  );
  notifyDataChanged('behavior');
}

// Parents
export function getParentsBySchool(schoolId: string): Parent[] {
  seedSchoolData(schoolId);
  const all = getStorage<Parent[]>('parents', []);
  return dedupeById(all.filter((p) => p.schoolId === schoolId));
}

export function saveParent(parent: Parent): void {
  const all = getStorage<Parent[]>('parents', []);
  const idx = all.findIndex((p) => p.id === parent.id);
  if (idx >= 0) {
    all[idx] = parent;
  } else {
    all.unshift(parent);
  }
  setStorage('parents', dedupeById(all));
  notifyDataChanged('parents');

  if (parent.schoolId) {
    saveParentApi(parent.schoolId, parent).catch(() => {});
  }
}

export function deleteParent(parentId: string, schoolId?: string): void {
  const all = getStorage<Parent[]>('parents', []);
  const target = all.find((p) => p.id === parentId);
  const sId = schoolId || target?.schoolId || 'sch-1';

  setStorage(
    'parents',
    all.filter((p) => p.id !== parentId)
  );
  notifyDataChanged('parents');

  deleteParentApi(sId, parentId).catch(() => {});
}

// Announcements
export function getAnnouncementsBySchool(schoolId: string): Announcement[] {
  seedSchoolData(schoolId);
  const all = getStorage<Announcement[]>('announcements', []);
  const list = dedupeById(all.filter((a) => a.schoolId === schoolId));
  return list.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA && timeB && timeA !== timeB) return timeB - timeA;

    const matchA = a.id?.match(/(\d{10,14})$/);
    const matchB = b.id?.match(/(\d{10,14})$/);
    if (matchA && matchB) {
      const numA = parseInt(matchA[1], 10);
      const numB = parseInt(matchB[1], 10);
      if (numA !== numB) return numB - numA;
    }

    const dateA = a.publishDate || a.date || '';
    const dateB = b.publishDate || b.date || '';
    if (dateA !== dateB) return dateB.localeCompare(dateA);

    return (b.id || '').localeCompare(a.id || '');
  });
}

export function saveAnnouncement(announcement: Announcement): void {
  const all = getStorage<Announcement[]>('announcements', []);
  const idx = all.findIndex((a) => a.id === announcement.id);
  if (idx >= 0) {
    all[idx] = announcement;
  } else {
    all.unshift(announcement);
  }
  setStorage('announcements', all);
  notifyDataChanged('announcements');

  if (announcement.schoolId) {
    saveAnnouncementApi(announcement.schoolId, announcement).catch(() => {});
  }
}

export function deleteAnnouncement(announcementId: string, schoolId?: string): void {
  const all = getStorage<Announcement[]>('announcements', []);
  const target = all.find((a) => a.id === announcementId);
  const sId = schoolId || target?.schoolId || 'sch-1';

  setStorage(
    'announcements',
    all.filter((a) => a.id !== announcementId)
  );
  notifyDataChanged('announcements');

  deleteAnnouncementApi(sId, announcementId).catch(() => {});
}

export function getSchoolAdminData(schoolId: string): SchoolAdminData {
  const info = getSchoolAdminInfo(schoolId);
  const themeColor = getStorage<string>(`theme_color_${schoolId}`, '#2563EB');
  return {
    schoolId,
    schoolName: info.name,
    schoolCode: info.code,
    licenseKey: info.licenseKey,
    licenseExpiry: '2026-12-31',
    principalName: info.principalName,
    phone: info.phone,
    email: info.email,
    address: info.address,
    academicYear: info.academicYear,
    themeColor,
    students: getStudentsBySchool(schoolId),
    teachers: getTeachersBySchool(schoolId),
    classes: getClassesBySchool(schoolId),
    subjects: getSubjectsBySchool(schoolId),
    attendance: getAttendanceBySchool(schoolId),
    grades: getGradesBySchool(schoolId),
    behavior: getBehaviorBySchool(schoolId),
    parents: getParentsBySchool(schoolId),
    announcements: getAnnouncementsBySchool(schoolId),
  };
}

export async function saveSetupWizardData(
  schoolId: string,
  setupData: {
    themeColor?: string;
    classes: ClassRoom[];
    students: Student[];
  }
): Promise<void> {
  // Ensure all students have a valid student code and schoolId
  const preparedStudents = setupData.students.map((s, idx) => ({
    ...s,
    schoolId,
    studentCode: s.studentCode || `STD-2026-${10000 + idx + 1}`,
  }));

  // Compute studentCount for each class
  const updatedClasses = setupData.classes.map((cls) => {
    const count = preparedStudents.filter(
      (s) => s.classId === cls.id || s.className === cls.name
    ).length;
    return { ...cls, schoolId, studentCount: count };
  });

  // 1. Authoritative Save to Central PostgreSQL Database FIRST
  const result = await saveSetupWizardApi(schoolId, {
    themeColor: setupData.themeColor,
    classes: updatedClasses,
    students: preparedStudents,
  });

  // 2. Update local cache ONLY upon confirmed server persistence
  if (setupData.themeColor) {
    setStorage(`theme_color_${schoolId}`, setupData.themeColor);
  }

  const finalClasses = result.classes || updatedClasses;
  const finalStudents = result.students || preparedStudents;

  const allClasses = getStorage<ClassRoom[]>('classes', []).filter((c) => c.schoolId !== schoolId);
  setStorage('classes', [...allClasses, ...finalClasses]);

  const allStudents = getStorage<Student[]>('students', []).filter((s) => s.schoolId !== schoolId);
  setStorage('students', [...allStudents, ...finalStudents]);

  // Immediately synchronize community groups for newly created/updated classes in wizard
  try {
    finalClasses.forEach((cls) => syncClassCommunityGroup(cls));
  } catch (err) {
    console.warn('Failed to sync community groups in wizard:', err);
  }

  notifyDataChanged('classes');
  notifyDataChanged('students');
}

export async function saveSchoolAdminData(schoolId: string, updates: Partial<SchoolAdminData>): Promise<void> {
  // 1. Persist to central PostgreSQL database first (Authoritative Source of Truth)
  await updateSchoolApi(schoolId, {
    name: updates.schoolName,
    principalName: updates.principalName,
    principalPhone: updates.phone,
    principalEmail: updates.email,
  });

  // 2. Update local cache only after central database operation succeeds
  const currentInfo = getSchoolAdminInfo(schoolId);
  const updatedInfo: SchoolAdminInfo = {
    ...currentInfo,
    name: updates.schoolName || currentInfo.name,
    principalName: updates.principalName || currentInfo.principalName,
    phone: updates.phone || currentInfo.phone,
    email: updates.email || currentInfo.email,
    address: updates.address || currentInfo.address,
    academicYear: updates.academicYear || currentInfo.academicYear,
  };
  updateSchoolAdminInfo(updatedInfo);

  // Sync back to schools in storage.ts
  try {
    const raw = localStorage.getItem('eg_school_platform_schools_v3');
    if (raw) {
      const schools = JSON.parse(raw);
      const idx = schools.findIndex((s: any) => s.id === schoolId);
      if (idx >= 0) {
        schools[idx] = {
          ...schools[idx],
          name: updatedInfo.name,
          principalName: updatedInfo.principalName,
          principalPhone: updatedInfo.phone,
          principalEmail: updatedInfo.email,
        };
        localStorage.setItem('eg_school_platform_schools_v3', JSON.stringify(schools));
      }
    }
  } catch (e) {
    console.error('Failed to sync school update to platform storage', e);
  }
  notifyDataChanged('school_info');
}

/**
 * Returns all registered schools with real, live counts of students and teachers
 * calculated dynamically from actual registered data in storage.
 */
export function getStoredSchoolsWithRealStats(): School[] {
  const schools = getStoredSchools();
  return schools.map((s) => {
    const students = getStudentsBySchool(s.id);
    const teachers = getTeachersBySchool(s.id);
    return {
      ...s,
      studentsCount: students.length,
      teachersCount: teachers.length,
    };
  });
}

/**
 * Purges all cached and locally stored data belonging strictly to the specified schoolId.
 * This ensures that when a school is deleted by the owner, no residual data (students, classes,
 * announcements, homework, attendance, grades, badges, tasks, messages, etc.) remains.
 */
export function purgeSchoolLocalData(schoolId: string): void {
  if (!schoolId) return;

  try {
    // 1. Classes
    const otherClasses = getStorage<ClassRoom[]>('classes', []).filter((c) => c.schoolId !== schoolId);
    setStorage('classes', otherClasses);

    // 2. Students
    const otherStudents = getStorage<Student[]>('students', []).filter((s) => s.schoolId !== schoolId);
    setStorage('students', otherStudents);

    // 3. Teachers
    const otherTeachers = getStorage<Teacher[]>('teachers', []).filter((t) => t.schoolId !== schoolId);
    setStorage('teachers', otherTeachers);

    // 4. Subjects
    const otherSubjects = getStorage<Subject[]>('subjects', []).filter((s) => s.schoolId !== schoolId);
    setStorage('subjects', otherSubjects);

    // 5. Attendance records
    const otherAttendance = getStorage<AttendanceRecord[]>('attendance', []).filter((a) => a.schoolId !== schoolId);
    setStorage('attendance', otherAttendance);

    // 6. Grades
    const otherGrades = getStorage<GradeRecord[]>('grades', []).filter((g) => g.schoolId !== schoolId);
    setStorage('grades', otherGrades);

    // 7. Behavior
    const otherBehavior = getStorage<BehaviorRecord[]>('behavior', []).filter((b) => b.schoolId !== schoolId);
    setStorage('behavior', otherBehavior);

    // 8. Announcements
    const otherAnnouncements = getStorage<Announcement[]>('announcements', []).filter((a) => a.schoolId !== schoolId);
    setStorage('announcements', otherAnnouncements);

    // 9. Parents
    const otherParents = getStorage<Parent[]>('parents', []).filter((p) => p.schoolId !== schoolId);
    setStorage('parents', otherParents);

    // 10. School Admin Info
    const allInfo = getStorage<Record<string, SchoolAdminInfo>>('school_info', {});
    if (allInfo[schoolId]) {
      delete allInfo[schoolId];
      setStorage('school_info', allInfo);
    }

    // 11. Homework
    const otherHomework = getStorage<any[]>('eg_school_parent_homework_v2', []).filter((h) => h.schoolId !== schoolId);
    setStorage('eg_school_parent_homework_v2', otherHomework);

    // 12. Calendar Tasks
    const rawCalendar = localStorage.getItem('school_calendar_tasks_v1');
    if (rawCalendar) {
      try {
        const tasks = JSON.parse(rawCalendar);
        if (Array.isArray(tasks)) {
          const filtered = tasks.filter((t: any) => t.school_id !== schoolId && t.schoolId !== schoolId);
          localStorage.setItem('school_calendar_tasks_v1', JSON.stringify(filtered));
        }
      } catch (e) {}
    }

    // 13. Attendance sessions
    const rawAttSessions = localStorage.getItem('eg_attendance_sessions_v1');
    if (rawAttSessions) {
      try {
        const sessions = JSON.parse(rawAttSessions);
        if (Array.isArray(sessions)) {
          const filtered = sessions.filter((s: any) => s.schoolId !== schoolId);
          localStorage.setItem('eg_attendance_sessions_v1', JSON.stringify(filtered));
        }
      } catch (e) {}
    }

    // 14. Badges (custom badges and student/teacher assignments)
    const badgeKeys = [
      STORAGE_KEY_PREFIX + 'system_badges_v1',
      STORAGE_KEY_PREFIX + 'student_badges_v1',
      STORAGE_KEY_PREFIX + 'teacher_badges_v1',
      'system_badges_v1',
      'student_badges_v1',
      'teacher_badges_v1',
    ];
    for (const bKey of badgeKeys) {
      const raw = localStorage.getItem(bKey);
      if (raw) {
        try {
          const items = JSON.parse(raw);
          if (Array.isArray(items)) {
            const filtered = items.filter((item: any) => item.schoolId !== schoolId);
            localStorage.setItem(bKey, JSON.stringify(filtered));
          }
        } catch (e) {}
      }
    }

    // 15. Student reports
    const rawReports = localStorage.getItem('eg_student_reports_v1');
    if (rawReports) {
      try {
        const reports = JSON.parse(rawReports);
        if (Array.isArray(reports)) {
          const filtered = reports.filter((r: any) => r.school_id !== schoolId && r.schoolId !== schoolId);
          localStorage.setItem('eg_student_reports_v1', JSON.stringify(filtered));
        }
      } catch (e) {}
    }

    // 16. Community messages, groups, locks, mutes
    const commKeys = [
      'school_communities_groups_v1',
      'school_communities_messages_v1',
      'school_communities_mutes_v1',
      'school_communities_locks_v1',
    ];
    for (const cKey of commKeys) {
      const rawComm = localStorage.getItem(cKey);
      if (rawComm) {
        try {
          const items = JSON.parse(rawComm);
          if (Array.isArray(items)) {
            const filtered = items.filter((item: any) => item.schoolId !== schoolId && item.school_id !== schoolId);
            localStorage.setItem(cKey, JSON.stringify(filtered));
          }
        } catch (e) {}
      }
    }

    // 17. Saved trusted device accounts for this school
    const rawAccounts = localStorage.getItem('eg_trusted_saved_accounts_v1');
    if (rawAccounts) {
      try {
        const accs = JSON.parse(rawAccounts);
        if (Array.isArray(accs)) {
          const filtered = accs.filter((a: any) => a.schoolId !== schoolId);
          localStorage.setItem('eg_trusted_saved_accounts_v1', JSON.stringify(filtered));
        }
      } catch (e) {}
    }

    // 18. Specific theme settings
    localStorage.removeItem(`theme_color_${schoolId}`);
    localStorage.removeItem(STORAGE_KEY_PREFIX + `theme_color_${schoolId}`);

    // 19. Update stored schools list in local storage
    const storedSchools = getStoredSchools();
    const updatedSchools = storedSchools.filter((s) => s.id !== schoolId);
    saveStoredSchools(updatedSchools);

    // 20. Notify all UI components of data change
    notifyDataChanged('school_deleted');
  } catch (err) {
    console.error('Error during local school data purge:', err);
  }
}


