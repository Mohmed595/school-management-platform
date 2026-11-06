export type InfractionUrgency = 'عادي' | 'عاجل' | 'طارئ';

export type InfractionRequestedAction = 'استدعاء ولي أمر' | 'طرد مؤقت' | 'اتخاذ اللازم';

export type InfractionStatus =
  | 'قيد المراجعة'
  | 'تم استدعاء ولي أمر'
  | 'تم الفصل المؤقت'
  | 'تم الحفظ والتخطي';

export interface InfractionStudent {
  studentId: string;
  studentName: string;
  classId?: string;
  className?: string;
  nationalId?: string;
  studentCode?: string;
}

export interface InfractionDecision {
  actionType: 'parent_summons' | 'temporary_suspension' | 'skip';
  decisionNotes?: string;
  decisionDate: string;
  decidedBy: string;
  actionIds?: string[];
  summonsDate?: string;
  summonsTime?: string;
  suspensionStartDate?: string;
  suspensionEndDate?: string;
}

export interface InfractionMemo {
  id: string;
  schoolId: string;
  teacherId: string;
  teacherName: string;
  subjectName?: string;
  date: string;
  time?: string;
  students: InfractionStudent[];
  reason: string;
  location?: string;
  urgency: InfractionUrgency;
  requestedAction: InfractionRequestedAction;
  status: InfractionStatus;
  adminDecision?: InfractionDecision;
  createdAt?: string;
  updatedAt?: string;
}
