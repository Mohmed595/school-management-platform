export interface SmsBatchLog {
  id: string;
  sendDate: string;
  schoolId: string;
  schoolName: string;
  recipientsCount: number;
  deliveredCount: number;
  failedCount: number;
  status: 'مكتمل' | 'جاري الإرسال' | 'فشل جزئي';
  duration: string;
  sender: string;
}

export interface ParentSmsRecord {
  id: string;
  batchId: string;
  schoolId: string;
  schoolName: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  parentName: string;
  parentPhone: string;
  status: 'تم التسليم' | 'فشل' | 'قيد المعالجة';
  sentAt: string;
  failureReason?: string;
  smsMessage: string;
}

export interface SmsStats {
  totalParents: number;
  smsSent: number;
  smsDelivered: number;
  smsFailed: number;
  remainingBalance: number;
  lastBulkSend: string;
}
