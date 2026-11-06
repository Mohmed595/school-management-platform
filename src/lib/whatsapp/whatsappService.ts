/**
 * Real WhatsApp Integration Service & Templates
 * Provides direct WhatsApp Web/App deep linking (wa.me) and Meta Cloud API sending.
 */

export interface WhatsAppAutoSettings {
  autoAbsenceAlert: boolean;
  autoBehaviorAlert: boolean;
  autoGradeAlert: boolean;
  senderPhone: string;
}

export interface WhatsAppLogItem {
  id: string;
  studentName: string;
  recipientPhone: string;
  category: 'absence' | 'honor' | 'login_credentials' | 'report_card' | 'announcement';
  message: string;
  sentAt: string;
  method: 'direct_whatsapp_link' | 'meta_cloud_api';
  status: 'sent' | 'opened';
}

const SETTINGS_KEY = 'whatsapp_auto_alert_settings';
const LOGS_KEY = 'whatsapp_alerts_logs_v1';

/**
 * Normalizes Egyptian phone numbers into WhatsApp international format (e.g., 201012345678)
 */
export function formatEgyptianWhatsAppPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Egyptian 01x numbers -> 201x
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '20' + cleaned.substring(1);
  } else if (cleaned.startsWith('1') && cleaned.length === 10) {
    cleaned = '20' + cleaned;
  }

  return cleaned;
}

/**
 * Generates direct wa.me link that opens real WhatsApp desktop or mobile app
 */
export function generateWhatsAppWebUrl(phone: string, message: string): string {
  const formattedPhone = formatEgyptianWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(message);
  if (formattedPhone) {
    return `https://wa.me/${formattedPhone}?text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

/**
 * Pre-built Real Arabic Message Templates
 */

export function buildAbsenceAlertTemplate(
  studentName: string,
  className: string,
  date: string,
  schoolName: string,
  notes?: string
): string {
  return `🚨 *تنبيه غياب رسمي - ${schoolName}* 🏫

المكرم ولي أمر الطالب/ة: *${studentName}*
فصل: *${className || 'غير محدد'}*

نود إفادتكم بتسجيل غياب الطالب/ة عن الحضور اليوم (*${date}*).
${notes ? `📝 *ملاحظة إدارة المدرسة*: ${notes}\n` : ''}
يرجى التكرم بالاتصال بإدارة المدرسة أو تقديم عذر طبي معتمد لضمان استقرار التحصيل العلمي.

دمتم بخير،
*إدارة ${schoolName}* 🌸`;
}

export function buildHonorCertificateTemplate(
  studentName: string,
  badgeTitle: string,
  schoolName: string,
  reason?: string
): string {
  return `🎖️ *إشعار تكريم وتميز طالب - ${schoolName}* 🌟

المكرم ولي أمر الطالب/ة المتميز/ة: *${studentName}*

تتقدم إدارة المدرسة بخالص التهاني والتبريكات بمناسبة حصول الطالب/ة على وسام:
🏆 *[ ${badgeTitle} ]*
${reason ? `📌 *سبب التكريم*: ${reason}\n` : ''}
نفخر بتفوق وإيجابية أبنائنا وبناتنا ونتمنى لهم دوام التميز والارتقاء.

مع تحيات،
*إدارة ${schoolName}* 👏`;
}

export function buildStudentLoginTemplate(
  studentName: string,
  studentCode: string,
  parentPhone: string,
  schoolName: string,
  loginUrl?: string
): string {
  const appUrl = loginUrl || window.location.origin;
  return `🔑 *بطاقة بيانات الدخول للمنصة التعليمية - ${schoolName}* 🏫

عزيزي ولي أمر الطالب/ة: *${studentName}*

إليكم بيانات الدخول الرسمية الخاصة بطفلكم على المنصة التعليمية:
• *اسم الطالب*: ${studentName}
• *كود الطالب الخاص*: \`${studentCode}\`
• *رقم الهاتف المسجل*: \`${parentPhone}\`
• *رابط المنصة*: ${appUrl}

يرجى الاحتفاظ بهذه البيانات لسهولة متابعة الحضور والدرجات والجداول الدراسية.

*إدارة ${schoolName}* 💙`;
}

export function buildReportCardTemplate(
  studentName: string,
  examName: string,
  score: string | number,
  maxScore: string | number,
  schoolName: string
): string {
  return `📝 *إشعار النتيجة والتحصيل الأكاديمي - ${schoolName}* 🎓

ولي أمر الطالب/ة: *${studentName}*

تم رصد نتيجة (*${examName}*):
🎯 *الدرجة الحاصل عليها*: *${score} من ${maxScore}*

تمنياتنا لجميع طلابنا بالتوفيق والنجاح الدائم.

*إدارة ${schoolName}* 📚`;
}

export function buildGeneralAnnouncementTemplate(
  title: string,
  content: string,
  schoolName: string
): string {
  return `📢 *إعلان مدرسي هام - ${schoolName}* 🏫

*${title}*

${content}

شاكرين حسن تعاونكم واهتمامكم المباشر.
*إدارة ${schoolName}* 💬`;
}

/**
 * Send WhatsApp via Server Meta Cloud API Proxy
 */
export async function sendWhatsAppViaCloudApi(
  recipientPhone: string,
  message: string,
  studentName: string,
  category: WhatsAppLogItem['category']
): Promise<{ success: boolean; message: string }> {
  try {
    const formattedPhone = formatEgyptianWhatsAppPhone(recipientPhone);
    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientPhone: formattedPhone,
        message,
        studentName,
      }),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      logWhatsAppAlert({
        id: `wa-log-${Date.now()}`,
        studentName,
        recipientPhone: formattedPhone,
        category,
        message,
        sentAt: new Date().toLocaleString('ar-EG'),
        method: 'meta_cloud_api',
        status: 'sent',
      });
      return { success: true, message: 'تم إرسال إشعار الواتساب بنجاح عبر البوابة الرسمية' };
    } else {
      return { success: false, message: data.error || 'فشل الإرسال عبر خادم الواتساب Cloud API' };
    }
  } catch (error: any) {
    return { success: false, message: error.message || 'تعذر الاتصال بخادم الواتساب' };
  }
}

/**
 * Helper to record WhatsApp dispatch log
 */
export function logWhatsAppAlert(log: WhatsAppLogItem): void {
  try {
    const existing = getWhatsAppLogs();
    const updated = [log, ...existing].slice(0, 100);
    localStorage.setItem(LOGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to log WhatsApp alert', e);
  }
}

export function getWhatsAppLogs(): WhatsAppLogItem[] {
  try {
    const saved = localStorage.getItem(LOGS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

export function getWhatsAppAutoSettings(): WhatsAppAutoSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }
  return {
    autoAbsenceAlert: true,
    autoBehaviorAlert: true,
    autoGradeAlert: false,
    senderPhone: '',
  };
}

export function saveWhatsAppAutoSettings(settings: WhatsAppAutoSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error(e);
  }
}
