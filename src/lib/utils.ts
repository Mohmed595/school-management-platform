// Utility functions for Egyptian Arabic School Platform

export function formatArabicNumber(num: number | string): string {
  if (num === null || num === undefined) return '';
  const str = num.toString();
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[0-9]/g, (w) => arabicDigits[parseInt(w, 10)]);
}

export function formatEgyptianCurrency(amount: number): string {
  return `${formatArabicNumber(amount.toLocaleString('ar-EG'))} ج.م`;
}

/**
 * Filter announcements based on role and target audience.
 * Controls audience dispatching (توجيه الإعلانات) between Teachers, Students, and Admins.
 */
export function isAnnouncementVisibleToRole(
  targetAudience: string | undefined | null,
  role: 'student' | 'parent' | 'teacher' | 'attendance_teacher' | 'school_admin' | 'owner' | string
): boolean {
  if (!targetAudience) return true;
  const target = targetAudience.trim();

  // Admin and Owner see all announcements
  if (role === 'school_admin' || role === 'owner' || role === 'admin') {
    return true;
  }

  // Everyone / General announcements are visible to all roles
  if (
    target === 'الجميع' ||
    target === 'الجميع (المعلمين والطلاب)' ||
    target === 'جميع المدارس' ||
    target === 'كافة المستخدمين' ||
    target === 'all' ||
    target === 'everyone'
  ) {
    return true;
  }

  // For Student / Parent
  if (role === 'student' || role === 'parent') {
    // If targeted strictly to teachers or staff, student/parent must NOT see it
    if (
      target === 'المعلمين فقط' ||
      target === 'المعلمين' ||
      target === 'المعلمات' ||
      target === 'كادر المدرسة' ||
      target === 'الكادر التعليمي' ||
      target === 'teachers' ||
      target === 'staff'
    ) {
      return false;
    }
    // If targeted to students / parents
    if (
      target === 'الطلاب فقط' ||
      target === 'الطلاب' ||
      target === 'أولياء الأمور' ||
      target === 'اولياء الامور' ||
      target.includes('طلاب') ||
      target.includes('طالب') ||
      target.includes('أولياء') ||
      target.includes('اولياء')
    ) {
      return true;
    }
    return false;
  }

  // For Teacher / Attendance Teacher
  if (role === 'teacher' || role === 'attendance_teacher') {
    // If targeted strictly to students or parents, teachers must NOT see it
    if (
      target === 'الطلاب فقط' ||
      target === 'الطلاب' ||
      target === 'أولياء الأمور' ||
      target === 'اولياء الامور' ||
      target === 'students' ||
      target === 'parents'
    ) {
      return false;
    }
    // If targeted to teachers / staff
    if (
      target === 'المعلمين فقط' ||
      target === 'المعلمين' ||
      target === 'المعلمات' ||
      target === 'كادر المدرسة' ||
      target === 'الكادر التعليمي' ||
      target.includes('معلم') ||
      target.includes('معلمات') ||
      target.includes('كادر') ||
      target.includes('موظف')
    ) {
      return true;
    }
    return false;
  }

  return true;
}
