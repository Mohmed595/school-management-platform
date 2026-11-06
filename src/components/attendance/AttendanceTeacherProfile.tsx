import React from 'react';
import {
  User,
  Building2,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  CalendarCheck,
  Award,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { PhoneDisplay } from '../ui/PhoneDisplay';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { ROLE_AVATARS } from '../../lib/avatarLayouts';

interface AttendanceTeacherProfileProps {
  schoolId: string;
  schoolName: string;
  teacherName: string;
  onLogout: () => void;
}

export function AttendanceTeacherProfile({
  schoolId,
  schoolName,
  teacherName,
  onLogout,
}: AttendanceTeacherProfileProps) {
  return (
    <div className="space-y-6 font-['Cairo',sans-serif] dir-rtl max-w-4xl mx-auto">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-right">
          <AvatarDisplay
            layoutUid={ROLE_AVATARS.ATTENDANCE_TEACHER}
            size="2xl"
            showGlow={true}
          />

          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl font-black text-slate-900">{teacherName}</h1>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200">
                حساب موثق
              </span>
            </div>
            <p className="text-xs font-extrabold text-blue-700 flex items-center justify-center sm:justify-start gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>المسمى الوظيفي: مسؤول الحضور والغياب اليومي المعتمد</span>
            </p>
            <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>المدرسة المنسوب إليها: {schoolName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Account Info & Security Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>البيانات الشخصية والمهنية</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-400">الاسم الكامل:</span>
              <span className="font-bold text-slate-900">{teacherName}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-400">الرقم القومي:</span>
              <span className="font-mono font-bold text-slate-900">29501010101999</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-400">البريد الإلكتروني:</span>
              <span className="font-mono font-bold text-slate-900">attendance@school.edu.eg</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">رقم الهاتف:</span>
              <PhoneDisplay phone={null} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>نطاق الصلاحيات والمسؤوليات</span>
          </h3>

          <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="font-bold text-slate-900 block">✔️ المسؤولية الحصرية:</span>
              <span>تسجيل كشوف الحضور والغياب اليومي بالفصول التعليمية.</span>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-900 space-y-1">
              <span className="font-bold block">🔒 القيود والأمان:</span>
              <span>
                لا تملك هذه اللوحة صلاحية تعديل درجات، سلوك، بيانات الطلاب، المعلمين، أو إعدادات المدرسة.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Action */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-900">تسجيل الخروج من الحساب</h4>
          <p className="text-[11px] text-slate-400">إنهاء الجلسة الحالية والعودة لصفحة تسجيل الدخول</p>
        </div>

        <button
          onClick={onLogout}
          className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}
