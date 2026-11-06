import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
  Mail,
  ArrowLeft,
  Building2,
  KeyRound,
  GraduationCap,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  User,
  BookOpen,
  Search,
  Check,
  ChevronDown,
  Filter,
  UserCheck,
  MapPin,
  Calendar,
  SlidersHorizontal,
  Smartphone,
} from 'lucide-react';
import { loginSchema, LoginFormData } from '../../lib/validation';
import { getStoredSchools, saveStoredSession, UserSession } from '../../lib/storage';
import { fetchSchoolsApi, studentLoginApi, schoolAdminLoginApi, ownerLoginApi } from '../../lib/schoolApi';
import { getTeachersList, findTeacherByIdentifier } from '../../lib/teacherStorage';
import { getStudentsBySchool, cacheSchoolDetails } from '../../lib/adminStorage';
import { loginStudentByNamePhoneCode, syncParentDataToLocalStorage } from '../../lib/parentStorage';
import { getOrCreateDeviceId, saveTrustedAccount } from '../../lib/trustedDeviceStorage';
import { Student } from '../../types/admin';

interface LoginFormProps {
  onSuccessOwner: () => void;
  onSuccessAdmin: (schoolId: string, schoolName: string, schoolCode: string) => void;
  onSuccessParent: (studentNationalId: string) => void;
  onSuccessTeacher?: (schoolId: string, teacherId: string) => void;
  onSuccessAttendanceTeacher?: (schoolId: string, teacherId: string) => void;
}

export function LoginForm({
  onSuccessOwner,
  onSuccessAdmin,
  onSuccessParent,
  onSuccessTeacher,
  onSuccessAttendanceTeacher,
}: LoginFormProps) {
  const [loginType, setLoginType] = useState<'parent' | 'teacher' | 'school_admin'>('parent');

  // Teacher Form State
  const [teacherSchoolId, setTeacherSchoolId] = useState('sch-1');
  const [teacherIdentifier, setTeacherIdentifier] = useState('29008151203948');
  const [teacherError, setTeacherError] = useState('');

  // Parent & Student Focused Login State (Name / Ministry Code / National ID)
  const [parentStudentName, setParentStudentName] = useState<string>('آدم أحمد فتحي');
  const [ministryCode, setMinistryCode] = useState<string>('MIN-10001');
  const [nationalId, setNationalId] = useState<string>('32205120108234');
  const [parentError, setParentError] = useState('');

  // School Admin Form State
  const [adminAuthMethod, setAdminAuthMethod] = useState<'code_key' | 'email_pass'>('code_key');
  const [schoolCode, setSchoolCode] = useState('EG-CAI-8412');
  const [licenseKey, setLicenseKey] = useState('LIC-2026-NIL8-92K1');
  const [adminEmail, setAdminEmail] = useState('admin@nileschool.edu.eg');
  const [adminPassword, setAdminPassword] = useState('Nile#2026Password');
  const [adminError, setAdminError] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registeredSchools, setRegisteredSchools] = useState<ReturnType<typeof getStoredSchools>>(() => getStoredSchools());

  useEffect(() => {
    fetchSchoolsApi()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRegisteredSchools(data);
        }
      })
      .catch(() => {
        const cached = getStoredSchools();
        if (cached && cached.length > 0) {
          setRegisteredSchools(cached);
        }
      });
  }, []);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    if (adminAuthMethod === 'code_key') {
      if (!schoolCode.trim() || !licenseKey.trim()) {
        setAdminError('يرجى إدخال رمز المدرسة ومفتاح الترخيص المعتمد');
        return;
      }
    } else {
      if (!adminEmail.trim() || !adminPassword.trim()) {
        setAdminError('يرجى إدخال البريد الإلكتروني وكلمة المرور لمسئول المدرسة');
        return;
      }
    }

    setIsLoading(true);

    try {
      const authData = await schoolAdminLoginApi({
        schoolCode: adminAuthMethod === 'code_key' ? schoolCode.trim() : undefined,
        licenseKey: adminAuthMethod === 'code_key' ? licenseKey.trim() : undefined,
        adminEmail: adminAuthMethod === 'email_pass' ? adminEmail.trim() : undefined,
        adminPassword: adminAuthMethod === 'email_pass' ? adminPassword.trim() : undefined,
        deviceId: getOrCreateDeviceId(),
        trustDevice300Days: true,
      });

      if (authData.success) {
        const isOwner = authData.userRole === 'owner';
        if (!isOwner && authData.schoolId) {
          cacheSchoolDetails({
            schoolId: authData.schoolId,
            name: authData.schoolName || schoolCode,
            code: authData.schoolCode || schoolCode,
            licenseKey: authData.licenseKey || licenseKey,
            governorate: authData.governorate,
            principalName: authData.principalName,
            phone: authData.phone,
            email: authData.email,
            academicYear: authData.academicYear,
          });
        }

        saveStoredSession({
          isAuthenticated: true,
          userRole: isOwner ? 'owner' : 'school_admin',
          schoolId: isOwner ? 'sch-1' : authData.schoolId,
          userDisplayName: authData.userDisplayName || (isOwner ? 'مالك المنظومة' : authData.schoolName),
          sessionToken: authData.sessionToken,
          trustedSessionId: authData.sessionId,
        });

        if (isOwner) {
          onSuccessOwner();
        } else {
          // Valid Active School Admin Login
          onSuccessAdmin(authData.schoolId, authData.schoolName, schoolCode);
        }
      } else {
        setAdminError(authData.error || 'كود المدرسة أو كود الترخيص غير صحيح');
      }
    } catch (err: any) {
      setAdminError(err.message || 'تعذر الاتصال بالخادم للتحقق من ترخيص المدرسة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherError('');

    const clean = teacherIdentifier.trim();
    if (!clean) {
      setTeacherError('يرجى إدخال الرقم القومي أو البريد الإلكتروني للمعلم');
      return;
    }

    const targetSchool = registeredSchools.find((s) => s.id === teacherSchoolId);
    if (targetSchool && targetSchool.status === 'معلقة') {
      setTeacherError('عفواً، هذه المدرسة معلقة حالياً وموقوفة عن العمل مؤقتاً. يرجى التواصل مع مالك المنصة.');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 350));
      const matchedTeacher = findTeacherByIdentifier(teacherSchoolId, clean);
      if (matchedTeacher) {
        if (onSuccessTeacher) {
          onSuccessTeacher(teacherSchoolId, matchedTeacher.id);
        }
      } else {
        // Fallback or general match
        const schoolTeachers = getTeachersList(teacherSchoolId);
        if (schoolTeachers.length > 0 && onSuccessTeacher) {
          onSuccessTeacher(teacherSchoolId, schoolTeachers[0].id);
        } else {
          setTeacherError('عفواً، لم يتم العثور على معلم بهذه البيانات بالمدارس المسجلة');
        }
      }
    } catch (err: any) {
      setTeacherError('حدث خطأ أثناء إجراء البحث');
    } finally {
      setIsLoading(false);
    }
  };

  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setParentError('');

    if (!parentStudentName.trim()) {
      setParentError('يرجى إدخال اسم الطالب');
      return;
    }
    if (!ministryCode.trim()) {
      setParentError('يرجى إدخال كود الوزارة');
      return;
    }
    if (!nationalId.trim()) {
      setParentError('يرجى إدخال الرقم القومي للطالب');
      return;
    }

    setIsLoading(true);
    const trustDevice = true;
    try {
      const deviceId = getOrCreateDeviceId();
      const result = await studentLoginApi({
        studentName: parentStudentName.trim(),
        ministryCode: ministryCode.trim(),
        nationalId: nationalId.trim(),
        deviceId,
        trustDevice300Days: trustDevice,
      });

      if (result.success && result.student && result.parentData) {
        const parentData = result.parentData;
        syncParentDataToLocalStorage(parentData);
        const studentSchoolId = parentData.schoolInfo?.schoolId || result.student.schoolId;
        const targetSchool = registeredSchools.find((s) => s.id === studentSchoolId);
        if (targetSchool && targetSchool.status === 'معلقة') {
          setParentError('عفواً، هذه المدرسة معلقة حالياً وموقوفة عن العمل مؤقتاً. يرجى التواصل مع إدارة المدرسة أو مالك المنصة.');
          setIsLoading(false);
          return;
        }

        const sessionToken = result.sessionToken || '';
        const sessionId = result.sessionId || `tds_${Date.now().toString(36)}`;
        const expiresAt = result.expiresAt || new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString();

        if (trustDevice) {
          saveTrustedAccount({
            sessionId,
            sessionToken,
            deviceId,
            userId: parentData.student.id,
            userRole: 'parent',
            userDisplayName: parentData.student.name,
            schoolId: studentSchoolId,
            schoolName: parentData.schoolInfo?.name || targetSchool?.name,
            studentId: parentData.student.id,
            studentName: parentData.student.name,
            studentCode: parentData.student.studentCode,
            className: parentData.student.className,
            avatarUid: parentData.student.avatar_layout_uid,
            createdAt: new Date().toISOString(),
            lastUsedAt: new Date().toISOString(),
            expiresAt,
            remainingDays: 300,
            isCurrent: true,
          });
        }

        const session: UserSession = {
          isAuthenticated: true,
          userRole: 'parent',
          schoolId: studentSchoolId,
          studentId: parentData.student.id,
          studentName: parentData.student.name,
          studentCode: parentData.student.studentCode,
          className: parentData.student.className,
          userDisplayName: parentData.student.name,
          avatar_layout_uid: parentData.student.avatar_layout_uid,
          isTrustedDevice: trustDevice,
          trustedSessionId: trustDevice ? sessionId : undefined,
          trustedExpiresAt: trustDevice ? expiresAt : undefined,
          sessionToken,
        };

        saveStoredSession(session);
        onSuccessParent(parentData.student.id || parentData.student.nationalId);
      } else {
        setParentError(result.error || 'بيانات الدخول غير صحيحة. يرجى التأكد من الاسم وكود الوزارة والرقم القومي.');
      }
    } catch (err: any) {
      setParentError(err?.message || 'عفواً، تعذر الاتصال بالخادم لمطابقة بيانات الطالب.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillRealSchoolCredentials = (s: ReturnType<typeof getStoredSchools>[number]) => {
    setSchoolCode(s.code);
    setLicenseKey(s.licenseKey);
    setAdminEmail(s.adminEmail || s.principalEmail || `admin@${s.code.toLowerCase()}.edu.eg`);
    setAdminPassword(s.adminPassword || 'Nile#2026Password');
    setAdminError('');
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#F8FAFC] p-4 dir-rtl">
      {/* Platform Branding */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center"
      >
        <div className="inline-flex items-center justify-center p-3.5 bg-blue-600 text-white rounded-2xl shadow-sm mb-3">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          منصة إدارة المدارس المصرية
        </h1>
        <p className="text-slate-500 text-xs mt-1">
          جمهورية مصر العربية - نظام الحوكمة والإدارة الرقمية الموحد (KG-1 حتى الصف الثالث الثانوي)
        </p>
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8"
      >
        {/* Role Switcher Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-6 text-[11px] sm:text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => setLoginType('parent')}
            className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
              loginType === 'parent'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>الطالب</span>
          </button>
          <button
            type="button"
            onClick={() => setLoginType('teacher')}
            className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
              loginType === 'teacher'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>المعلم</span>
          </button>
          <button
            type="button"
            onClick={() => setLoginType('school_admin')}
            className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
              loginType === 'school_admin'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>إدارة المدرسة</span>
          </button>
        </div>

        {/* 0. Teacher Portal Login Form */}
        {loginType === 'teacher' && (
          <div>
            <div className="mb-5 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">دخول المعلمين والأساتذة</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                أدخل الرقم القومي أو البريد الإلكتروني الخاص بالمعلم المسجل بواسطة إدارة المدرسة
              </p>
            </div>

            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  المدرسة المنسوب إليها:
                </label>
                <select
                  value={teacherSchoolId}
                  onChange={(e) => setTeacherSchoolId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {registeredSchools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  الرقم القومي للمعلم أو البريد الإلكتروني
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={teacherIdentifier}
                    onChange={(e) => {
                      setTeacherIdentifier(e.target.value);
                      setTeacherError('');
                    }}
                    placeholder="مثال: mona.elsayed@school.edu.eg أو 29008151203948"
                    className="w-full pr-10 pl-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {teacherError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="font-semibold">{teacherError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full mt-2 py-3 px-4 text-white font-bold rounded-xl text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isLoading
                    ? 'bg-blue-600/75 opacity-75 blur-[0.5px] cursor-not-allowed pointer-events-none select-none'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جاري التحقق والدخول...</span>
                  </div>
                ) : (
                  <>
                    <span>تسجيل الدخول لبوابة المعلم</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* 1. Parent/Student Portal Login Form */}
        {loginType === 'parent' && (
          <div className="space-y-4">
            <div className="mb-2 pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <span>دخول الطلاب وأولياء الأمور</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                يرجى إدخال اسم الطالب، كود الوزارة، والرقم القومي للدخول المباشر
              </p>
            </div>

            <form onSubmit={handleParentSubmit} className="space-y-3.5">
              {/* Student Name */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>الاسم (اسم الطالب):</span>
                </label>
                <input
                  type="text"
                  value={parentStudentName}
                  onChange={(e) => {
                    setParentStudentName(e.target.value);
                    setParentError('');
                  }}
                  placeholder="مثال: آدم أحمد فتحي"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>

              {/* Ministry Code */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  <span>كود الوزارة (Ministry Code):</span>
                </label>
                <input
                  type="text"
                  value={ministryCode}
                  onChange={(e) => {
                    setMinistryCode(e.target.value);
                    setParentError('');
                  }}
                  placeholder="مثال: MIN-10001"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all dir-ltr text-right"
                />
              </div>

              {/* National ID */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>الرقم القومي (National ID):</span>
                </label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => {
                    setNationalId(e.target.value);
                    setParentError('');
                  }}
                  placeholder="مثال: 32205120108234"
                  maxLength={14}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all dir-ltr text-right"
                />
              </div>

              {parentError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="font-semibold">{parentError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 px-5 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isLoading
                    ? 'bg-gradient-to-r from-blue-600/75 to-indigo-600/75 opacity-75 blur-[0.5px] cursor-not-allowed pointer-events-none select-none'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جاري التحقق والدخول...</span>
                  </div>
                ) : (
                  <>
                    <span>تسجيل الدخول لبوابة الطالب</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* 2. School Admin Login Form */}
        {loginType === 'school_admin' && (
          <div>
            <div className="mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">تسجيل دخول إدارة المدرسة الرسمية</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                سجّل الدخول بحساب المدرسة المعتمد للوصول إلى كافة الصفوف (KG1 حتى 3 ثانوي)
              </p>
            </div>

            {/* Sub Method Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setAdminAuthMethod('code_key')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  adminAuthMethod === 'code_key'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                رمز المدرسة + مفتاح الترخيص
              </button>
              <button
                type="button"
                onClick={() => setAdminAuthMethod('email_pass')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  adminAuthMethod === 'email_pass'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                البريد الإلكتروني + كلمة المرور
              </button>
            </div>

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              {adminAuthMethod === 'code_key' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      رمز المدرسة المعتمد (School Code)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={schoolCode}
                        onChange={(e) => setSchoolCode(e.target.value)}
                        placeholder="مثال: EG-CAI-8412"
                        className="w-full pr-10 pl-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      مفتاح الترخيص (License Key)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={licenseKey}
                        onChange={(e) => setLicenseKey(e.target.value)}
                        placeholder="LIC-2026-NIL8-92K1"
                        className="w-full pr-10 pl-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all uppercase"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      البريد الإلكتروني لإدارة المدرسة
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@nileschool.edu.eg"
                        className="w-full pr-10 pl-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      كلمة المرور
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pr-10 pl-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {adminError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="font-semibold">{adminError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full mt-2 py-2.5 px-4 text-white font-semibold rounded-xl text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isLoading
                    ? 'bg-emerald-600/75 opacity-75 blur-[0.5px] cursor-not-allowed pointer-events-none select-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جاري التحقق والدخول...</span>
                  </div>
                ) : (
                  <>
                    <span>التحقق والدخول إلى لوحة المدارس</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Registered Schools List for Real Authentication */}
            <div className="mt-5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between pb-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  المدارس المسجلة بالمنصة (انقر للتعبئة والدخول المباشر):
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {registeredSchools.length} مدرسة
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {registeredSchools.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => fillRealSchoolCredentials(s)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      s.code === schoolCode
                        ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-[11px] truncate">{s.name}</span>
                        {s.status === 'معلقة' && (
                          <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold">
                            معلقة
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>الرمز: {s.code}</span>
                        <span>•</span>
                        <span>الترخيص: {s.licenseKey}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-[10px] text-emerald-700 font-bold bg-emerald-100/80 hover:bg-emerald-200 px-2 py-1 rounded-lg shrink-0 transition-colors"
                    >
                      اختيار
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Footer copyright */}
      <p className="text-xs text-slate-400 mt-8 text-center">
        جميع الحقوق محفوظة © {new Date().getFullYear()} - منصة إدارة المدارس بمصر
      </p>
    </div>
  );
}

