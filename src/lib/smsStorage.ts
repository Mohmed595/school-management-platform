import { SmsBatchLog, ParentSmsRecord, SmsStats } from '../types/sms';
import { Student } from '../types/admin';
import { getStorage, setStorage, notifyDataChanged } from './adminStorage';
import { getStoredSchools } from './storage';
import { getStudentsBySchool } from './adminStorage';
import { isInvalidOrDummyPhone } from '../components/ui/PhoneDisplay';

const BATCH_LOGS_KEY = 'sms_batch_logs_v1';
const PARENT_RECORDS_KEY = 'sms_parent_records_v1';
const SMS_BALANCE_KEY = 'sms_balance_v1';

export const DEFAULT_PLATFORM_URL = 'https://madrasety.ai.studio';

export function formatSmsMessage(
  schoolName: string,
  studentName: string,
  parentPhone: string,
  studentCode: string,
  platformUrl: string = DEFAULT_PLATFORM_URL
): string {
  return `🏫 ${schoolName}

مرحباً بك في منصة المدرسة.

بيانات تسجيل الدخول

👦 الطالب:
${studentName}

📱 الهاتف:
${parentPhone || 'غير مسجل'}

🔑 رمز الطالب:
${studentCode}

🌐 المنصة
${platformUrl}

نتمنى لكم عاماً دراسياً موفقاً.`;
}

const INITIAL_BATCH_LOGS: SmsBatchLog[] = [
  {
    id: 'batch-2026-101',
    sendDate: '2026-07-28 10:30 م',
    schoolId: 'sch-1',
    schoolName: 'مدرسة النيل الدولية بالقاهرة',
    recipientsCount: 1420,
    deliveredCount: 1402,
    failedCount: 18,
    status: 'مكتمل',
    duration: '2.4 ثانية',
    sender: 'لوحة المالك (Owner)',
  },
  {
    id: 'batch-2026-102',
    sendDate: '2026-07-25 04:15 م',
    schoolId: 'sch-2',
    schoolName: 'مدرسة الأورمان النموذجية الحديثة',
    recipientsCount: 980,
    deliveredCount: 975,
    failedCount: 5,
    status: 'مكتمل',
    duration: '1.8 ثانية',
    sender: 'لوحة المالك (Owner)',
  },
  {
    id: 'batch-2026-103',
    sendDate: '2026-07-20 01:00 م',
    schoolId: 'sch-3',
    schoolName: 'مدرسة الإسكندرية للغات والتكنولوجيا',
    recipientsCount: 1150,
    deliveredCount: 1138,
    failedCount: 12,
    status: 'مكتمل',
    duration: '2.1 ثانية',
    sender: 'لوحة المالك (Owner)',
  },
];

const INITIAL_PARENT_RECORDS: ParentSmsRecord[] = [
  {
    id: 'rec-1',
    batchId: 'batch-2026-101',
    schoolId: 'sch-1',
    schoolName: 'مدرسة النيل الدولية بالقاهرة',
    studentId: 'std-sch-1-1',
    studentName: 'أحمد محمد علي المغازي',
    studentCode: 'STD-2026-10001',
    parentName: 'محمد علي المغازي',
    parentPhone: '01012345678',
    status: 'تم التسليم',
    sentAt: '2026-07-28 10:30 م',
    smsMessage: formatSmsMessage('مدرسة النيل الدولية بالقاهرة', 'أحمد محمد علي المغازي', '01012345678', 'STD-2026-10001'),
  },
  {
    id: 'rec-2',
    batchId: 'batch-2026-101',
    schoolId: 'sch-1',
    schoolName: 'مدرسة النيل الدولية بالقاهرة',
    studentId: 'std-sch-1-2',
    studentName: 'مريم محمود إبراهيم',
    studentCode: 'STD-2026-10002',
    parentName: 'محمود إبراهيم',
    parentPhone: '',
    status: 'فشل',
    sentAt: '2026-07-28 10:30 م',
    failureReason: 'رقم هاتف غير مسجل (لا يوجد رقم هاتف)',
    smsMessage: formatSmsMessage('مدرسة النيل الدولية بالقاهرة', 'مريم محمود إبراهيم', 'غير مسجل', 'STD-2026-10002'),
  },
  {
    id: 'rec-3',
    batchId: 'batch-2026-102',
    schoolId: 'sch-2',
    schoolName: 'مدرسة الأورمان النموذجية الحديثة',
    studentId: 'std-sch-2-1',
    studentName: 'عمر خالد يوسف',
    studentCode: 'STD-2026-20001',
    parentName: 'خالد يوسف',
    parentPhone: '01123456789',
    status: 'تم التسليم',
    sentAt: '2026-07-25 04:15 م',
    smsMessage: formatSmsMessage('مدرسة الأورمان النموذجية الحديثة', 'عمر خالد يوسف', '01123456789', 'STD-2026-20001'),
  },
];

export function getSmsBatchLogs(): SmsBatchLog[] {
  const stored = getStorage<SmsBatchLog[]>(BATCH_LOGS_KEY, []);
  if (!stored || stored.length === 0) {
    setStorage(BATCH_LOGS_KEY, INITIAL_BATCH_LOGS);
    return INITIAL_BATCH_LOGS;
  }
  return stored;
}

export function getParentSmsRecords(batchId?: string): ParentSmsRecord[] {
  const stored = getStorage<ParentSmsRecord[]>(PARENT_RECORDS_KEY, []);
  if (!stored || stored.length === 0) {
    setStorage(PARENT_RECORDS_KEY, INITIAL_PARENT_RECORDS);
    return batchId
      ? INITIAL_PARENT_RECORDS.filter((r) => r.batchId === batchId)
      : INITIAL_PARENT_RECORDS;
  }
  if (batchId) {
    return stored.filter((r) => r.batchId === batchId);
  }
  return stored;
}

export function getSmsRemainingBalance(): number {
  return getStorage<number>(SMS_BALANCE_KEY, 24850);
}

export function getSmsStats(): SmsStats {
  const schools = getStoredSchools();
  let totalParents = 0;

  for (const s of schools) {
    const students = getStudentsBySchool(s.id);
    totalParents += students.length;
  }

  // Fallback if no students loaded yet
  if (totalParents === 0) {
    totalParents = schools.reduce((acc, curr) => acc + (curr.studentsCount || 0), 0);
  }

  const logs = getSmsBatchLogs();
  let smsSent = 0;
  let smsDelivered = 0;
  let smsFailed = 0;

  for (const log of logs) {
    smsSent += log.recipientsCount;
    smsDelivered += log.deliveredCount;
    smsFailed += log.failedCount;
  }

  const remainingBalance = getSmsRemainingBalance();
  const lastBulkSend = logs.length > 0 ? logs[0].sendDate : 'لم يتم الإرسال بعد';

  return {
    totalParents,
    smsSent,
    smsDelivered,
    smsFailed,
    remainingBalance,
    lastBulkSend,
  };
}

export interface SendSmsResult {
  batchLog: SmsBatchLog;
  records: ParentSmsRecord[];
}

export function sendBulkLoginSms(
  targetSchoolId: string | 'all',
  customUrl: string = DEFAULT_PLATFORM_URL
): SendSmsResult {
  const schools = getStoredSchools();
  const targetSchools =
    targetSchoolId === 'all'
      ? schools
      : schools.filter((s) => s.id === targetSchoolId);

  const newBatchId = `batch-${Date.now().toString().slice(-6)}`;
  const nowStr = new Date().toLocaleString('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const createdRecords: ParentSmsRecord[] = [];
  let deliveredCount = 0;
  let failedCount = 0;

  for (const school of targetSchools) {
    const students = getStudentsBySchool(school.id);
    for (const std of students) {
      const code = std.studentCode || `STD-2026-${std.id}`;
      const phone = std.parentPhone?.trim() || '';
      const isInvalid = isInvalidOrDummyPhone(phone);

      const status: 'تم التسليم' | 'فشل' = isInvalid ? 'فشل' : 'تم التسليم';
      if (status === 'تم التسليم') {
        deliveredCount += 1;
      } else {
        failedCount += 1;
      }

      const msg = formatSmsMessage(
        school.name,
        std.name,
        phone || 'غير مسجل',
        code,
        customUrl
      );

      const record: ParentSmsRecord = {
        id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        batchId: newBatchId,
        schoolId: school.id,
        schoolName: school.name,
        studentId: std.id,
        studentName: std.name,
        studentCode: code,
        parentName: std.parentName || `ولي أمر ${std.name}`,
        parentPhone: phone,
        status,
        sentAt: nowStr,
        failureReason: isInvalid
          ? 'رقم هاتف ولي الأمر غير مسجل أو غير صحيح'
          : undefined,
        smsMessage: msg,
      };

      createdRecords.push(record);
    }
  }

  const schoolNameLabel =
    targetSchoolId === 'all'
      ? 'جميع المدارس المسجلة'
      : targetSchools[0]?.name || 'مدرسة مخصصة';

  const durationSec = (1.2 + createdRecords.length * 0.002).toFixed(1);

  const batchLog: SmsBatchLog = {
    id: newBatchId,
    sendDate: nowStr,
    schoolId: targetSchoolId,
    schoolName: schoolNameLabel,
    recipientsCount: createdRecords.length,
    deliveredCount,
    failedCount,
    status: failedCount > 0 ? 'فشل جزئي' : 'مكتمل',
    duration: `${durationSec} ثانية`,
    sender: 'لوحة المالك (Owner)',
  };

  // Save to storage
  const existingBatches = getSmsBatchLogs();
  setStorage(BATCH_LOGS_KEY, [batchLog, ...existingBatches]);

  const existingRecords = getParentSmsRecords();
  setStorage(PARENT_RECORDS_KEY, [...createdRecords, ...existingRecords]);

  // Update balance
  const currentBalance = getSmsRemainingBalance();
  const updatedBalance = Math.max(0, currentBalance - createdRecords.length);
  setStorage(SMS_BALANCE_KEY, updatedBalance);

  notifyDataChanged('sms_logs');
  window.dispatchEvent(new Event('sms_data_changed'));

  return { batchLog, records: createdRecords };
}

export function sendWelcomeSmsToStudentList(
  students: Student[],
  schoolName: string = 'المدرسة',
  senderName: string = 'إدارة المدرسة'
): SendSmsResult {
  const newBatchId = `batch-welcome-${Date.now().toString().slice(-6)}`;
  const nowStr = new Date().toLocaleString('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const createdRecords: ParentSmsRecord[] = [];
  let deliveredCount = 0;
  let failedCount = 0;

  for (const std of students) {
    const code = std.studentCode || `STD-2026-${std.id}`;
    const phone = std.parentPhone?.trim() || '';
    const isInvalid = isInvalidOrDummyPhone(phone);

    const status: 'تم التسليم' | 'فشل' = isInvalid ? 'فشل' : 'تم التسليم';
    if (status === 'تم التسليم') {
      deliveredCount += 1;
    } else {
      failedCount += 1;
    }

    const msg = `أهلاً بك عزيزي ولي الأمر / ${std.parentName || std.name} 🌟
يسر إدارة ${schoolName} الترحيب بكم في المنصة التعليمية للعام الدراسي.

بيانات دخول الطالب:
الاسم: ${std.name}
كود الطالب: ${code}
رابط المنصة: ${DEFAULT_PLATFORM_URL}

نتمنى لطالبنا العزيز عاماً حافلاً بالتفوق والنجاح!`;

    const record: ParentSmsRecord = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      batchId: newBatchId,
      schoolId: std.schoolId || 'sch-1',
      schoolName: schoolName,
      studentId: std.id,
      studentName: std.name,
      studentCode: code,
      parentName: std.parentName || `ولي أمر ${std.name}`,
      parentPhone: phone,
      status,
      sentAt: nowStr,
      failureReason: isInvalid
        ? 'رقم هاتف غير مسجل أو غير صحيح'
        : undefined,
      smsMessage: msg,
    };

    createdRecords.push(record);
  }

  const batchLog: SmsBatchLog = {
    id: newBatchId,
    sendDate: nowStr,
    schoolId: students[0]?.schoolId || 'sch-1',
    schoolName: `${schoolName} - رسائل الترحيب`,
    recipientsCount: createdRecords.length,
    deliveredCount,
    failedCount,
    status: failedCount > 0 ? 'فشل جزئي' : 'مكتمل',
    duration: `${(0.8 + createdRecords.length * 0.002).toFixed(1)} ثانية`,
    sender: senderName,
  };

  const existingBatches = getSmsBatchLogs();
  setStorage(BATCH_LOGS_KEY, [batchLog, ...existingBatches]);

  const existingRecords = getParentSmsRecords();
  setStorage(PARENT_RECORDS_KEY, [...createdRecords, ...existingRecords]);

  const currentBalance = getSmsRemainingBalance();
  const updatedBalance = Math.max(0, currentBalance - deliveredCount);
  setStorage(SMS_BALANCE_KEY, updatedBalance);

  notifyDataChanged('sms_logs');
  window.dispatchEvent(new Event('sms_data_changed'));

  return { batchLog, records: createdRecords };
}

export function resendFailedSmsForBatch(batchId: string): number {
  const allRecords = getParentSmsRecords();
  const allBatches = getSmsBatchLogs();

  let fixedCount = 0;
  const updatedRecords = allRecords.map((rec) => {
    if (rec.batchId === batchId && rec.status === 'فشل') {
      fixedCount += 1;
      return {
        ...rec,
        status: 'تم التسليم' as const,
        failureReason: undefined,
        sentAt: new Date().toLocaleString('ar-EG', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
    }
    return rec;
  });

  const updatedBatches = allBatches.map((b) => {
    if (b.id === batchId) {
      return {
        ...b,
        deliveredCount: b.deliveredCount + fixedCount,
        failedCount: Math.max(0, b.failedCount - fixedCount),
        status: 'مكتمل' as const,
      };
    }
    return b;
  });

  setStorage(PARENT_RECORDS_KEY, updatedRecords);
  setStorage(BATCH_LOGS_KEY, updatedBatches);

  notifyDataChanged('sms_logs');
  window.dispatchEvent(new Event('sms_data_changed'));

  return fixedCount;
}

export function resendSingleParentSms(recordId: string): boolean {
  const allRecords = getParentSmsRecords();
  const target = allRecords.find((r) => r.id === recordId);
  if (!target) return false;

  const updatedRecords = allRecords.map((rec) => {
    if (rec.id === recordId) {
      return {
        ...rec,
        status: 'تم التسليم' as const,
        failureReason: undefined,
        sentAt: new Date().toLocaleString('ar-EG', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
    }
    return rec;
  });

  setStorage(PARENT_RECORDS_KEY, updatedRecords);

  // If was failed, update batch counts
  if (target.status === 'فشل') {
    const allBatches = getSmsBatchLogs();
    const updatedBatches = allBatches.map((b) => {
      if (b.id === target.batchId) {
        return {
          ...b,
          deliveredCount: b.deliveredCount + 1,
          failedCount: Math.max(0, b.failedCount - 1),
        };
      }
      return b;
    });
    setStorage(BATCH_LOGS_KEY, updatedBatches);
  }

  notifyDataChanged('sms_logs');
  window.dispatchEvent(new Event('sms_data_changed'));

  return true;
}
