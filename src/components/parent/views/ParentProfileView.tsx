import React, { useState, useEffect } from 'react';
import { ParentPortalData } from '../../../types/parent';
import {
  User,
  GraduationCap,
  Building2,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Award,
  ShieldAlert,
  PhoneCall,
  UserX,
  FileText,
  Clock,
  CheckCircle2,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { formatArabicNumber } from '../../../lib/utils';
import { getGroupedStudentBadges } from '../../../lib/badgeStorage';
import {
  getStudentAdminActions,
  fetchAndSyncStudentAdminActions,
} from '../../../lib/adminActionStorage';
import { AdministrativeAction } from '../../../types/adminAction';
import { BadgeCard, BadgesEmptyState } from '../../ui/BadgeCard';
import { PhoneDisplay } from '../../ui/PhoneDisplay';
import { GroupedStudentBadge } from '../../../types/badge';
import { normalizeClassName, parseEgyptianClassDetails } from '../../../lib/egyptianSchoolUtils';
import { AvatarDisplay } from '../../ui/AvatarDisplay';
import { getUserAvatarLayoutUid } from '../../../lib/avatarLayouts';
import { AvatarSettingsSection } from '../../settings/AvatarSettingsSection';
import { getStoredSession, getStoredSessionToken, saveStoredSession } from '../../../lib/storage';
import { getStorage, setStorage } from '../../../lib/adminStorage';
import { updateSavedAccountAvatar } from '../../../lib/trustedDeviceStorage';

interface ParentProfileViewProps {
  data: ParentPortalData;
}

export function ParentProfileView({ data }: ParentProfileViewProps) {
  const { student, schoolInfo } = data;
  const [studentBadgeItems, setStudentBadgeItems] = useState<GroupedStudentBadge[]>([]);
  const [adminActions, setAdminActions] = useState<AdministrativeAction[]>([]);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [currentAvatarUid, setCurrentAvatarUid] = useState<string>(
    student.avatar_layout_uid || getUserAvatarLayoutUid(student.id)
  );

  useEffect(() => {
    if (student?.avatar_layout_uid) {
      setCurrentAvatarUid(student.avatar_layout_uid);
    }
  }, [student?.avatar_layout_uid]);

  useEffect(() => {
    const handleAvatarUpdated = (e: any) => {
      if (e.detail?.themeId) {
        setCurrentAvatarUid(e.detail.themeId);
      }
    };
    window.addEventListener('student_avatar_updated', handleAvatarUpdated);
    return () => window.removeEventListener('student_avatar_updated', handleAvatarUpdated);
  }, []);

  const loadProfileData = async () => {
    if (student?.id) {
      const schoolId = (schoolInfo as any)?.id || (schoolInfo as any)?.schoolId || student?.schoolId || 'sch-1';
      const items = getGroupedStudentBadges(student.id, schoolId);
      setStudentBadgeItems(items);

      // Authoritative PostgreSQL fetch for student profile & avatar
      try {
        const token = getStoredSessionToken();
        const stdRes = await fetch(`/api/schools/${schoolId}/students/${student.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (stdRes.ok) {
          const stdJson = await stdRes.json();
          if (stdJson.success && stdJson.student?.avatar_layout_uid) {
            setCurrentAvatarUid(stdJson.student.avatar_layout_uid);
            if (student) {
              student.avatar_layout_uid = stdJson.student.avatar_layout_uid;
            }
          }
        }
      } catch (err) {}

      try {
        const actions = await fetchAndSyncStudentAdminActions(schoolId, student.id);
        setAdminActions(actions);
      } catch (err) {
        setAdminActions(getStudentAdminActions(student.id));
      }
    }
  };

  useEffect(() => {
    loadProfileData();

    const handleStorage = () => loadProfileData();
    window.addEventListener('school_data_changed', handleStorage);
    window.addEventListener('badges_updated', handleStorage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('school_data_changed', handleStorage);
      window.removeEventListener('badges_updated', handleStorage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [student?.id, (schoolInfo as any)?.schoolId]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto dir-rtl">
      {/* Hero Student Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div
            className="relative cursor-pointer group shrink-0"
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
          >
            <AvatarDisplay
              layoutUid={currentAvatarUid}
              name={student.name}
              size="3xl"
              showGlow={true}
              className="border-4 border-slate-900 group-hover:scale-105 transition-transform"
            />
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-950 text-cyan-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              تغيير الهوية
            </span>
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-right">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full">
                طالب مقيد بنظام الوزارة - {student.status}
              </span>
              <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-mono">
                العام الدراسي {schoolInfo.academicYear}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{student.name}</h1>

            <div className="pt-2">
              <button
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className={`px-4 py-2 font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 shadow-xs ${
                  showAvatarPicker
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{showAvatarPicker ? 'إخفاء السمات' : 'تخصيص السمة'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Picker Section - Harmonized with Website Layout */}
      {showAvatarPicker && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4 transition-all">
          <AvatarSettingsSection
            userId={student.id}
            userName={student.name}
            userRole="طالب"
            schoolId={(schoolInfo as any)?.id || (schoolInfo as any)?.schoolId || student?.schoolId || 'sch-1'}
            currentThemeId={currentAvatarUid}
            badges={studentBadgeItems}
            onSaveSuccess={(newUid) => {
              setCurrentAvatarUid(newUid);
              if (student) {
                student.avatar_layout_uid = newUid;
              }
              const session = getStoredSession();
              if (session) {
                session.avatar_layout_uid = newUid;
                saveStoredSession(session);
              }
            }}
          />
        </div>
      )}

      {/* Badges & Honors Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="font-extrabold text-base text-slate-900">🏅 الأوسمة والتكريمات الممنوحة</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-full">
              إجمالي الأوسمة: {studentBadgeItems.reduce((acc, item) => acc + item.count, 0)}
            </span>
            {data.points && (
              <span className="text-xs font-black text-amber-950 bg-gradient-to-r from-amber-100 via-amber-200 to-orange-100 border border-amber-300 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>نقاط الطالب: {formatArabicNumber(data.points.totalPoints)}</span>
              </span>
            )}
          </div>
        </div>

        {studentBadgeItems.length === 0 ? (
          <BadgesEmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {studentBadgeItems.map(({ badge, count, latestAssignment }) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                assignment={latestAssignment}
                count={count}
              />
            ))}
          </div>
        )}
      </div>

      {/* Administrative History Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h2 className="font-extrabold text-base text-slate-900">📋 السجل الإداري والقرارات الصادرة</h2>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
            عدد الإجراءات: {adminActions.length}
          </span>
        </div>

        {adminActions.length === 0 ? (
          <div className="p-6 bg-slate-50/70 rounded-2xl border border-slate-100 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs text-slate-800">السجل الإداري ناصع ونظيف</h4>
            <p className="text-[11px] text-slate-500">لا توجد أية قرارات إيقاف أو استدعاءات أولياء أمور صادرة بحق الطالب.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {adminActions.map((act) => {
              const isSummons = act.actionType === 'parent_summons';
              return (
                <div
                  key={act.id}
                  className={`p-4 rounded-2xl border text-xs space-y-2.5 transition-all ${
                    isSummons
                      ? 'bg-red-50/50 border-red-200/90'
                      : 'bg-amber-50/50 border-amber-200/90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full font-bold text-[11px] ${
                        isSummons
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}
                    >
                      {isSummons ? (
                        <>
                          <PhoneCall className="w-3.5 h-3.5 text-red-600" />
                          <span>استدعاء ولي الأمر</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-3.5 h-3.5 text-amber-700" />
                          <span>إيقاف مؤقت عن الدراسة</span>
                        </>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      التاريخ: {new Date(act.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>

                  <div className="bg-white/80 p-3 rounded-xl border border-slate-100/80 space-y-1.5">
                    {isSummons ? (
                      <div className="flex flex-wrap items-center gap-4 text-slate-700">
                        <span>
                          <strong className="text-slate-900">تاريخ الحضور:</strong> {act.summonsDate}
                        </span>
                        <span>
                          <strong className="text-slate-900">الوقت:</strong> {act.summonsTime}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-4 text-slate-700">
                        <span>
                          <strong className="text-slate-900">الفترة:</strong> من {act.startDate} إلى {act.endDate}
                        </span>
                      </div>
                    )}

                    <p className="text-slate-800 font-medium pt-1">
                      <strong className="text-slate-900">السبب:</strong> "{act.reason}"
                    </p>

                    {act.notes && (
                      <p className="text-[11px] text-slate-500 italic">
                        <strong>ملاحظات:</strong> {act.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Academic Details Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-sm text-slate-900">البيانات الدراسية والأكاديمية</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">اسم المدرسة المقيد بها:</span>
              <span className="font-bold text-slate-900">{schoolInfo.name}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">كود الطالب (ID):</span>
              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md dir-ltr">
                {student.studentCode || student.id}
              </span>
            </div>

            {(() => {
              const details = parseEgyptianClassDetails(student.gradeLevel, student.className);
              return (
                <>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-500 font-bold">الصف الدراسي:</span>
                    <span className="font-extrabold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {student.gradeLevel || details.gradeName}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-500 font-bold">الفصل:</span>
                    <span className="font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md font-mono">
                      {student.className || details.formattedClassName}
                    </span>
                  </div>
                </>
              );
            })()}

            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">تاريخ الميلاد الرسمي:</span>
              <span className="font-mono font-bold text-slate-900">{student.birthDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
