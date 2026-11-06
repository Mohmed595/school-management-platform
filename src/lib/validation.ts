import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'البريد الإلكتروني غير صحيح' }),
  password: z.string().min(6, { message: 'كلمة المرور يجب أن لا تقل عن 6 أحرف' }),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const schoolSchema = z.object({
  name: z.string().min(3, { message: 'اسم المدرسة يجب أن يتكون من 3 أحرف على الأقل' }),
  governorate: z.string().min(1, { message: 'يرجى اختيار المحافظة' }),
  principalName: z.string().min(3, { message: 'اسم مدير المدرسة مطلوب' }),
  principalPhone: z.string().regex(/^01[0125][0-9]{8}$/, {
    message: 'يرجى إدخال رقم هاتف مصري صحيح مكون من 11 رقم (مثال: 01012345678)',
  }),
  principalEmail: z.string().email({ message: 'البريد الإلكتروني الخاص بالمدير غير صحيح' }),
  subscription: z.enum(['أساسي', 'احترافي', 'بريميوم'], {
    message: 'يرجى اختيار خطة الاشتراك',
  }),
  studentsCount: z.number().optional().default(0),
  teachersCount: z.number().optional().default(0),
});

export type SchoolFormData = z.infer<typeof schoolSchema>;

export const licenseSchema = z.object({
  schoolId: z.string().min(1, { message: 'يرجى اختيار المدرسة' }),
  plan: z.enum(['أساسي', 'احترافي', 'بريميوم']),
  durationMonths: z.number().min(1, { message: 'مدة الترخيص شهراً واحداً على الأقل' }),
});

export type LicenseFormData = z.infer<typeof licenseSchema>;
