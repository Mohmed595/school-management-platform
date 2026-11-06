import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  User,
  BookOpen,
  Users,
  School,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Award,
  Sparkles,
} from 'lucide-react';
import { TeacherPortalData } from '../../../types/teacher';
import { getGroupedTeacherBadges } from '../../../lib/badgeStorage';
import { PhoneDisplay } from '../../ui/PhoneDisplay';
import { AvatarDisplay } from '../../ui/AvatarDisplay';
import { getUserAvatarLayoutUid } from '../../../lib/avatarLayouts';
import { AvatarSettingsSection } from '../../settings/AvatarSettingsSection';

interface TeacherProfileViewProps {
  data: TeacherPortalData;
}

export function TeacherProfileView({ data }: TeacherProfileViewProps) {
  const { teacher, schoolName, assignedClasses, assignedSubjects, assignedStudents } = data;
  const teacherBadges = getGroupedTeacherBadges(teacher.id);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [currentAvatarUid, setCurrentAvatarUid] = useState<string>(
    teacher.avatar_layout_uid || getUserAvatarLayoutUid(teacher.id)
  );

  return (
    <div className="space-y-6 dir-rtl">
      {/* Profile Main Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6"
      >
        {/* Teacher Avatar Display */}
        <div className="relative group cursor-pointer" onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
          <AvatarDisplay
            layoutUid={currentAvatarUid}
            size="3xl"
            showGlow={true}
            className="border-4 border-slate-900 group-hover:scale-105 transition-transform"
          />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-slate-950/90 text-cyan-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
            تعديل الهوية
          </span>
        </div>

        <div className="text-center sm:text-right space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {teacher.name}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              معلم أساسي
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-600">{teacher.specialization}</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <School className="w-4 h-4 text-blue-600" />
              {schoolName}
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              الرقم القومي: <span className="font-mono text-slate-700">{teacher.nationalId}</span>
            </span>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className={`px-4 py-2 font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 shadow-xs ${
                showAvatarPicker
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{showAvatarPicker ? 'إخفاء معرض سمات الهوية' : 'تخصيص السمة والصورة الشخصية'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Avatar Picker Section - Harmonized with Website Layout */}
      {showAvatarPicker && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
        >
          <AvatarSettingsSection
            userId={teacher.id}
            userName={teacher.name}
            userRole="معلم"
            onSaveSuccess={(newUid) => {
              setCurrentAvatarUid(newUid);
            }}
          />
        </motion.div>
      )}

      {/* Grid: Assigned Specs & Contact Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Assigned Subjects & Classes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-900 text-sm">التكليف الأكاديمي والتدريسي</h2>
          </div>

          {/* Assigned Subjects */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
              <span>المواد الدراسية المسندة:</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {assignedSubjects.map((sbj) => (
                <div
                  key={sbj.id}
                  className="px-3.5 py-2 bg-blue-50 text-blue-900 rounded-xl border border-blue-200/80 font-bold text-xs flex items-center gap-2"
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>{sbj.name}</span>
                  <span className="text-[10px] text-blue-600 bg-white px-2 py-0.5 rounded-md font-mono">
                    {sbj.code}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned Classes */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
              <span>الصفوف الدراسية المسندة:</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {assignedClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-bold text-xs text-slate-900">{cls.name}</div>
                      <div className="text-[10px] text-slate-500">{cls.gradeLevel}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-200">
                    قاعة {cls.roomNumber}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Students Summary */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-900">إجمالي الطلاب تحت إشرافك التدريسي:</span>
            <span className="font-extrabold text-emerald-800 text-sm">{assignedStudents.length} طالب</span>
          </div>
        </div>

        {/* Card 2: Contact & Personal Administrative Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-900 text-sm">البيانات الإدارية والاتصال</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                البريد الإلكتروني المعتمد:
              </span>
              <span className="font-bold text-slate-900 dir-ltr font-mono">{teacher.email}</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                رقم الهاتف المسجل:
              </span>
              <PhoneDisplay phone={teacher.phone} />
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                تاريخ التعيين بالمنظومة:
              </span>
              <span className="font-bold text-slate-900">{teacher.joinDate || '2023-09-01'}</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                حالة الحساب:
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {teacher.status || 'نشط'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 leading-relaxed">
            💡 لتحديث البريد الإلكتروني أو تعديل التكليف بالصفوف، يُرجى التواصل مباشرة مع إدارة المدرسة المعتمدة.
          </div>
        </div>
      </div>

      {/* Card 3: Badges & Honors */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-slate-900 text-sm">الأوسمة والتقديرات الرسمية</h2>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            إجمالي الأوسمة: {teacherBadges.reduce((sum, b) => sum + b.count, 0)}
          </span>
        </div>

        {teacherBadges.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
            لم يتم منح أوسمة تقديرية لهذا الحساب بعد. تظهر الأوسمة المعتمدة فور صدورها من إدارة المدرسة.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {teacherBadges.map((item) => (
              <div
                key={item.badge.id}
                className="p-3 bg-gradient-to-br from-amber-50/60 to-orange-50/60 rounded-2xl border border-amber-200/80 text-center flex flex-col items-center justify-center space-y-1 relative"
              >
                {item.count > 1 && (
                  <span className="absolute top-1.5 left-1.5 bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                    ×{item.count}
                  </span>
                )}
                <div className="text-2xl flex items-center justify-center h-8">
                  {item.badge.icon && (item.badge.icon.startsWith('data:') || item.badge.icon.startsWith('http') || item.badge.icon.startsWith('/')) ? (
                    <img src={item.badge.icon} alt={item.badge.name} className="w-8 h-8 object-contain" />
                  ) : (
                    item.badge.icon || '🏅'
                  )}
                </div>
                <div className="font-extrabold text-xs text-slate-900 truncate w-full">
                  {item.badge.name}
                </div>
                <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  {item.badge.rarity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
