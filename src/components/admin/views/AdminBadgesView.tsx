import React, { useState, useEffect } from 'react';
import {
  Award,
  Sparkles,
  Plus,
  Search,
  Trash2,
  UserCheck,
  CheckCircle2,
  ShieldCheck,
  X,
  Filter,
  Info,
  AlertTriangle,
  User,
  Users,
  CheckSquare,
  Square,
  UserPlus,
  PackageCheck,
  Boxes,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Student, Teacher } from '../../../types/admin';
import { Badge, StudentBadge, TeacherBadge, BadgeLimitType } from '../../../types/badge';
import {
  getAllBadges,
  getAllStudentBadges,
  getAllTeacherBadges,
  awardBadgeToStudent,
  awardBadgeToTeacher,
  removeBadgeFromStudent,
  removeBadgeFromTeacher,
  createBadge,
  deleteBadge,
  getBadgeLimitInfo,
  BADGES_STORAGE_KEY,
} from '../../../lib/badgeStorage';
import {
  fetchSchoolBadgesApi,
  fetchAllStudentBadgesApi,
  fetchAllTeacherBadgesApi,
} from '../../../lib/schoolApi';
import { getTeachersBySchool, getStorage, setStorage } from '../../../lib/adminStorage';
import { BadgeCard, BadgesEmptyState } from '../../ui/BadgeCard';
import { playSoftClickSound } from '../../../lib/sound';
import { PRELOADED_BADGES, PreloadedBadge } from '../../../data/preloadedBadges';

interface AdminBadgesViewProps {
  schoolId: string;
  students: Student[];
  onToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export function AdminBadgesView({ schoolId, students, onToast }: AdminBadgesViewProps) {
  const [systemBadges, setSystemBadges] = useState<Badge[]>([]);
  const [showAllSystemBadges, setShowAllSystemBadges] = useState(false);
  const [showAllAwardedRecords, setShowAllAwardedRecords] = useState(false);
  const [studentBadges, setStudentBadges] = useState<StudentBadge[]>([]);
  const [teacherBadges, setTeacherBadges] = useState<TeacherBadge[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [activeRecordTab, setActiveRecordTab] = useState<'students' | 'teachers'>('students');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBadgeFilter, setSelectedBadgeFilter] = useState<string>('all');

  // Modal State for Awarding Choice (Single vs Multi)
  const [isAwardStudentChoiceModalOpen, setIsAwardStudentChoiceModalOpen] = useState(false);

  // Modal State for Multi-Student Award
  const [isMultiAwardModalOpen, setIsMultiAwardModalOpen] = useState(false);
  const [selectedMultiBadgeId, setSelectedMultiBadgeId] = useState<string>('');
  const [multiAwardNote, setMultiAwardNote] = useState<string>('');
  const [multiStudentSearchTerm, setMultiStudentSearchTerm] = useState<string>('');
  const [multiGradeFilter, setMultiGradeFilter] = useState<string>('الكل');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Modal State for Awarding Badge to Student
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>('');
  const [awardNote, setAwardNote] = useState<string>('');
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');

  // Modal State for Awarding Badge to Teacher / Attendance Officer
  const [isTeacherAwardModalOpen, setIsTeacherAwardModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedTeacherBadgeId, setSelectedTeacherBadgeId] = useState<string>('');
  const [teacherAwardNote, setTeacherAwardNote] = useState<string>('');
  const [teacherSearchTerm, setTeacherSearchTerm] = useState<string>('');
  const [teacherTypeFilter, setTeacherTypeFilter] = useState<'all' | 'teacher' | 'attendance_officer'>('all');

  // Modal State for Creating New Badge Choice Frame
  const [isAddChoiceModalOpen, setIsAddChoiceModalOpen] = useState(false);
  const [isPacksModalOpen, setIsPacksModalOpen] = useState(false);
  const [packCategoryFilter, setPackCategoryFilter] = useState<string>('الكل');
  const [packSearchTerm, setPackSearchTerm] = useState<string>('');

  // Modal State for Creating New Badge
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBadgeData, setNewBadgeData] = useState({
    name: '',
    nameEn: '',
    description: '',
    icon: '🏆',
    color: '#D4AF37',
    rarity: 'Mythical' as Badge['rarity'],
    targetType: 'student' as Badge['targetType'],
    hasAnimatedBorder: true,
    limitType: 'none' as BadgeLimitType,
    maxQuantity: 5,
  });
  const [customRarity, setCustomRarity] = useState('');
  const [customTargetType, setCustomTargetType] = useState('');
  const [customLimitDescription, setCustomLimitDescription] = useState('');

  // Modal State for Delete Student Confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    assignmentId: string;
    studentName: string;
    badgeName: string;
  } | null>(null);

  // Modal State for Delete Teacher Confirmation
  const [deleteTeacherConfirmation, setDeleteTeacherConfirmation] = useState<{
    assignmentId: string;
    teacherName: string;
    badgeName: string;
  } | null>(null);

  // Modal State for Delete System Badge Confirmation
  const [deleteSystemBadgeConfirmation, setDeleteSystemBadgeConfirmation] = useState<{
    badgeId: string;
    badgeName: string;
  } | null>(null);

  // Load badges, teachers, and assignments from PostgreSQL & local cache
  const refreshData = async () => {
    try {
      let serverBadgesList: Badge[] = [];
      let sAssignments: StudentBadge[] = [];
      let tAssignments: TeacherBadge[] = [];

      try {
        serverBadgesList = await fetchSchoolBadgesApi(schoolId);
      } catch (e) {
        serverBadgesList = [];
      }

      // Update local storage to match authoritative server badges
      if (Array.isArray(serverBadgesList)) {
        const allLocal = getStorage<Badge[]>(BADGES_STORAGE_KEY, []);
        const otherSchoolsBadges = allLocal.filter((b) => b.schoolId && b.schoolId !== schoolId);
        setStorage(BADGES_STORAGE_KEY, [...otherSchoolsBadges, ...serverBadgesList]);
      }
      const mergedBadges = serverBadgesList;

      try {
        sAssignments = await fetchAllStudentBadgesApi(schoolId);
      } catch (e) {
        sAssignments = [];
      }

      // Merge local student assignments with server assignments
      const localStudentAssignments = getAllStudentBadges();
      const sMap = new Map<string, StudentBadge>();
      localStudentAssignments.forEach((a) => sMap.set(a.id, a));
      sAssignments.forEach((a) => sMap.set(a.id, { ...sMap.get(a.id), ...a }));
      const mergedStudentAssignments = Array.from(sMap.values());

      try {
        tAssignments = await fetchAllTeacherBadgesApi(schoolId);
      } catch (e) {
        tAssignments = [];
      }

      // Merge local teacher assignments with server assignments
      const localTeacherAssignments = getAllTeacherBadges();
      const tMap = new Map<string, TeacherBadge>();
      localTeacherAssignments.forEach((a) => tMap.set(a.id, a));
      tAssignments.forEach((a) => tMap.set(a.id, { ...tMap.get(a.id), ...a }));
      const mergedTeacherAssignments = Array.from(tMap.values());

      const schoolTeachers = getTeachersBySchool(schoolId);

      setSystemBadges(mergedBadges);
      setStudentBadges(mergedStudentAssignments);
      setTeacherBadges(mergedTeacherAssignments);
      setTeachers(schoolTeachers);

      const studentBadgesList = mergedBadges.filter((b) => b.targetType === 'student' || !b.targetType);
      const defaultStudentBadge = studentBadgesList.find((b) => !b.id.includes('owner') && !b.name.includes('المالك')) || studentBadgesList[0] || mergedBadges[0];
      const teacherBadgesList = mergedBadges.filter((b) => b.targetType === 'teacher' || b.targetType === 'attendance_teacher');
      const defaultTeacherBadge = teacherBadgesList[0] || mergedBadges[0];

      if (mergedBadges.length > 0 && (!selectedBadgeId || selectedBadgeId.includes('owner') || selectedBadgeId === 'badge-owner-mythical')) {
        setSelectedBadgeId(defaultStudentBadge ? defaultStudentBadge.id : '');
      }
      if (mergedBadges.length > 0 && (!selectedMultiBadgeId || selectedMultiBadgeId.includes('owner'))) {
        setSelectedMultiBadgeId(defaultStudentBadge ? defaultStudentBadge.id : '');
      }
      if (mergedBadges.length > 0 && (!selectedTeacherBadgeId || selectedTeacherBadgeId.includes('owner'))) {
        setSelectedTeacherBadgeId(defaultTeacherBadge ? defaultTeacherBadge.id : '');
      }
      if (students.length > 0 && !selectedStudentId) {
        setSelectedStudentId(students[0].id);
      }
      if (schoolTeachers.length > 0 && !selectedTeacherId) {
        setSelectedTeacherId(schoolTeachers[0].id);
      }
    } catch (err) {}
  };

  // Direct award trigger when clicking "Award this badge" from badge cards
  const handleDirectAwardBadge = (badge: Badge) => {
    if (badge.targetType === 'teacher' || badge.targetType === 'attendance_teacher') {
      setSelectedTeacherBadgeId(badge.id);
      setIsTeacherAwardModalOpen(true);
    } else {
      setSelectedBadgeId(badge.id);
      setIsAwardModalOpen(true);
    }
  };

  useEffect(() => {
    refreshData();

    const handleStorage = () => refreshData();
    window.addEventListener('school_data_changed', handleStorage);
    window.addEventListener('badges_updated', handleStorage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('school_data_changed', handleStorage);
      window.removeEventListener('badges_updated', handleStorage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [students, schoolId]);

  // Handle Awarding Badge to Student
  const handleAwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      onToast('تنبيه', 'يرجى اختيار الطالب', 'error');
      return;
    }
    if (!selectedBadgeId) {
      onToast('تنبيه', 'يرجى اختيار الوسام', 'error');
      return;
    }

    const targetStudent = students.find((s) => s.id === selectedStudentId);
    const targetBadge = systemBadges.find((b) => b.id === selectedBadgeId);

    playSoftClickSound();

    try {
      await awardBadgeToStudent(selectedStudentId, selectedBadgeId, 'إدارة المدرسة', awardNote, schoolId);
      onToast(
        'تم منح الوسام بنجاح! 🏅',
        `تم منح وسام "${targetBadge?.name || ''}" للطالب ${targetStudent?.name || ''}`,
        'success'
      );

      setIsAwardModalOpen(false);
      setAwardNote('');
      await refreshData();
    } catch (err: any) {
      onToast('تعذر منح الوسام ⚠️', err.message || 'حدث خطأ أثناء منح الوسام', 'error');
    }
  };

  // Handle Awarding Badge to Multiple Students
  const handleMultiAwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) {
      onToast('تنبيه ⚠️', 'يرجى اختيار طالب واحد على الأقل للمنح الجماعي', 'error');
      return;
    }
    if (!selectedMultiBadgeId) {
      onToast('تنبيه ⚠️', 'يرجى اختيار الوسام المراد منحه', 'error');
      return;
    }

    const targetBadge = systemBadges.find((b) => b.id === selectedMultiBadgeId);
    if (!targetBadge) {
      onToast('خطأ ⚠️', 'الوسام المحدد غير موجود بالنظام', 'error');
      return;
    }

    let successCount = 0;
    let limitStoppedCount = 0;
    let lastErrorMessage = '';

    for (const studentId of selectedStudentIds) {
      try {
        await awardBadgeToStudent(studentId, selectedMultiBadgeId, 'إدارة المدرسة', multiAwardNote, schoolId);
        successCount++;
      } catch (err: any) {
        limitStoppedCount++;
        lastErrorMessage = err?.message || 'تم نفاد الكمية المتاحة للوسام';
      }
    }

    if (successCount > 0) {
      if (limitStoppedCount > 0) {
        onToast(
          'تم التكريم الجماعي الجزئي! 🌟',
          `تم منح وسام "${targetBadge.name}" بنجاح لـ ${successCount} طالب، وتوقف المنح لـ ${limitStoppedCount} طلاب بسبب نفاد الكمية المتاحة للوسام.`,
          'info'
        );
      } else {
        onToast(
          'تم التكريم الجماعي بنجاح! 🏅',
          `تم منح وسام "${targetBadge.name}" لـ ${successCount} طالب دفعة واحدة وتوثيقه بالكامل.`,
          'success'
        );
      }
      setIsMultiAwardModalOpen(false);
      setSelectedStudentIds([]);
      setMultiAwardNote('');
      await refreshData();
    } else {
      onToast('تعذر منح الوسام ⚠️', lastErrorMessage || 'لم يتم منح الوسام لأي طالب', 'error');
    }
  };

  // Handle Awarding Badge to Teacher / Attendance Officer
  const handleTeacherAwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) {
      onToast('تنبيه', 'يرجى اختيار المعلم أو محضر الحضور', 'error');
      return;
    }
    if (!selectedTeacherBadgeId) {
      onToast('تنبيه', 'يرجى اختيار الوسام', 'error');
      return;
    }

    const targetTeacher = teachers.find((t) => t.id === selectedTeacherId);
    const targetBadge = systemBadges.find((b) => b.id === selectedTeacherBadgeId);

    try {
      await awardBadgeToTeacher(selectedTeacherId, selectedTeacherBadgeId, 'إدارة المدرسة', teacherAwardNote, schoolId);
      onToast(
        'تم منح الوسام بنجاح! 🏅',
        `تم منح وسام "${targetBadge?.name || ''}" لـ ${targetTeacher?.name || ''}`,
        'success'
      );

      setIsTeacherAwardModalOpen(false);
      setTeacherAwardNote('');
      await refreshData();
    } catch (err: any) {
      onToast('تعذر منح الوسام ⚠️', err.message || 'حدث خطأ أثناء منح الوسام', 'error');
    }
  };

  // Handle Removing Student Badge
  const handleRemoveAssignment = (assignmentId: string, studentName: string, badgeName: string) => {
    setDeleteConfirmation({ assignmentId, studentName, badgeName });
  };

  const confirmDeleteAssignment = async () => {
    if (!deleteConfirmation) return;
    try {
      await removeBadgeFromStudent(deleteConfirmation.assignmentId, schoolId);
      onToast(
        'تم سحب الوسام',
        `تم إلغاء وسام "${deleteConfirmation.badgeName}" من الطالب ${deleteConfirmation.studentName}`,
        'info'
      );
    } catch (err: any) {
      onToast('خطأ ⚠️', err?.message || 'فشل سحب الوسام', 'error');
    }
    setDeleteConfirmation(null);
    await refreshData();
  };

  // Handle Removing Teacher Badge
  const handleRemoveTeacherAssignment = (assignmentId: string, teacherName: string, badgeName: string) => {
    setDeleteTeacherConfirmation({ assignmentId, teacherName, badgeName });
  };

  const confirmDeleteTeacherAssignment = async () => {
    if (!deleteTeacherConfirmation) return;
    try {
      await removeBadgeFromTeacher(deleteTeacherConfirmation.assignmentId, schoolId);
      onToast(
        'تم سحب الوسام',
        `تم إلغاء وسام "${deleteTeacherConfirmation.badgeName}" من ${deleteTeacherConfirmation.teacherName}`,
        'info'
      );
    } catch (err: any) {
      onToast('خطأ ⚠️', err?.message || 'فشل سحب الوسام', 'error');
    }
    setDeleteTeacherConfirmation(null);
    await refreshData();
  };

  // Handle Deleting System Badge
  const handleDeleteSystemBadge = (badge: Badge) => {
    setDeleteSystemBadgeConfirmation({ badgeId: badge.id, badgeName: badge.name });
  };

  const confirmDeleteSystemBadge = async () => {
    if (!deleteSystemBadgeConfirmation) return;
    const badgeToDelete = deleteSystemBadgeConfirmation;
    try {
      await deleteBadge(badgeToDelete.badgeId, schoolId);
      setSystemBadges((prev) => prev.filter((b) => b.id !== badgeToDelete.badgeId));
      onToast(
        'تم حذف الوسام',
        `تم حذف وسام "${badgeToDelete.badgeName}" نهائياً من النظام`,
        'info'
      );
    } catch (err: any) {
      onToast('خطأ ⚠️', err?.message || 'فشل حذف الوسام', 'error');
    }
    setDeleteSystemBadgeConfirmation(null);
    await refreshData();
  };

  // Handle Installing a Single Preloaded Badge
  const handleInstallPreloadedBadge = async (preloaded: PreloadedBadge) => {
    const exists = systemBadges.some(
      (b) => b.name.trim() === preloaded.name.trim()
    );
    if (exists) {
      onToast('تنبيه ⚠️', `الوسام "${preloaded.name}" مُثبت بالفعل في النظام`, 'info');
      return;
    }

    try {
      await createBadge({
        schoolId,
        name: preloaded.name,
        nameEn: preloaded.nameEn,
        description: preloaded.description,
        icon: preloaded.icon,
        color: preloaded.color,
        rarity: preloaded.rarity,
        targetType: preloaded.targetType,
        isActive: true,
        hasAnimatedBorder: preloaded.hasAnimatedBorder,
        limitType: preloaded.limitType,
        maxQuantity: preloaded.maxQuantity,
      }, schoolId);

      onToast('تم بنجاح! 🏅', `تم تثبيت وتفعيل وسام "${preloaded.name}" بنجاح`, 'success');
      await refreshData();
    } catch (err: any) {
      onToast('خطأ ⚠️', err?.message || 'فشل تثبيت الوسام', 'error');
    }
  };

  // Handle Installing All Preloaded Badges
  const handleInstallAllPreloadedBadges = async () => {
    let installedCount = 0;
    for (const preloaded of PRELOADED_BADGES) {
      const exists = systemBadges.some(
        (b) => b.name.trim() === preloaded.name.trim()
      );
      if (!exists) {
        try {
          await createBadge({
            schoolId,
            name: preloaded.name,
            nameEn: preloaded.nameEn,
            description: preloaded.description,
            icon: preloaded.icon,
            color: preloaded.color,
            rarity: preloaded.rarity,
            targetType: preloaded.targetType,
            isActive: true,
            hasAnimatedBorder: preloaded.hasAnimatedBorder,
            limitType: preloaded.limitType,
            maxQuantity: preloaded.maxQuantity,
          }, schoolId);
          installedCount++;
        } catch (e) {
          console.error('[BADGES] install badge error:', e);
        }
      }
    }

    if (installedCount > 0) {
      onToast('تم تثبيت الحزمة! 🌟', `تم إضافة ${installedCount} أوسمة جديدة جاهزة بنجاح إلى النظام`, 'success');
      await refreshData();
    } else {
      onToast('تنبيه ⚠️', 'جميع الأوسمة الجاهزة مُثبتة بالفعل بالكامل في النظام', 'info');
    }
  };

  const filteredPreloadedBadges = PRELOADED_BADGES.filter((b) => {
    const matchesCategory = packCategoryFilter === 'الكل' || b.category === packCategoryFilter;
    const q = packSearchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      b.name.toLowerCase().includes(q) ||
      (b.nameEn && b.nameEn.toLowerCase().includes(q)) ||
      b.description.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  // Handle Create Badge Submit
  const handleCreateBadgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBadgeData.name.trim()) {
      onToast('تنبيه', 'يرجى إدخال اسم الوسام', 'error');
      return;
    }

    const resolvedRarity =
      (newBadgeData.rarity as string) === 'other'
        ? customRarity.trim() || 'مخصص'
        : newBadgeData.rarity;

    const resolvedTargetType =
      (newBadgeData.targetType as string) === 'other'
        ? customTargetType.trim() || 'student'
        : newBadgeData.targetType;

    const resolvedDescription =
      newBadgeData.description.trim() ||
      (customLimitDescription.trim() ? `وصف إضافي: ${customLimitDescription.trim()}` : 'وسام تقديري للمتميزين');

    try {
      await createBadge({
        schoolId,
        name: newBadgeData.name.trim(),
        nameEn: newBadgeData.nameEn.trim(),
        description: resolvedDescription,
        icon: newBadgeData.icon || '🏅',
        color: newBadgeData.color || '#D4AF37',
        rarity: resolvedRarity as any,
        targetType: resolvedTargetType as any,
        isActive: true,
        hasAnimatedBorder: newBadgeData.hasAnimatedBorder,
        isHidden: false,
        limitType: (newBadgeData.limitType as string) === 'other' ? 'none' : newBadgeData.limitType,
        maxQuantity: newBadgeData.limitType !== 'none' ? newBadgeData.maxQuantity : undefined,
      }, schoolId);

      onToast('تم إنشاء الوسام بنجاح', `تم إضافة وسام "${newBadgeData.name}" إلى النظام`, 'success');
      setIsCreateModalOpen(false);
      setNewBadgeData({
        name: '',
        nameEn: '',
        description: '',
        icon: '🏆',
        color: '#D4AF37',
        rarity: 'Mythical',
        targetType: 'student',
        hasAnimatedBorder: true,
        limitType: 'none',
        maxQuantity: 5,
      });
      setCustomRarity('');
      setCustomTargetType('');
      setCustomLimitDescription('');
      await refreshData();
    } catch (err: any) {
      onToast('خطأ ⚠️', err?.message || 'فشل إنشاء الوسام', 'error');
    }
  };

  // Combine student badges with resilient student & badge lookup
  const enrichedAssignments = studentBadges
    .map((assignment) => {
      let student = students.find(
        (s) =>
          s.id === assignment.studentId ||
          s.nationalId === assignment.studentId ||
          s.studentCode === assignment.studentId
      );
      if (!student) {
        const allLocalStudents = getStorage<Student[]>('students', []);
        student = allLocalStudents.find(
          (s) =>
            s.id === assignment.studentId ||
            s.nationalId === assignment.studentId ||
            s.studentCode === assignment.studentId
        );
      }
      if (!student) {
        student = {
          id: assignment.studentId,
          schoolId: schoolId,
          name: 'طالب مسجل',
          className: 'فصل دراسي',
          gradeName: 'المرحلة الدراسية',
          status: 'منتظم',
        } as unknown as Student;
      }

      let badge = systemBadges.find((b) => b.id === assignment.badgeId);
      if (!badge) {
        badge = systemBadges.find((b) => b.id.includes(assignment.badgeId) || assignment.badgeId.includes(b.id));
      }
      if (!badge) {
        const allLocalBadges = getAllBadges(schoolId);
        badge = allLocalBadges.find((b) => b.id === assignment.badgeId || b.id.includes(assignment.badgeId));
      }
      if (!badge) {
        const isOwner = assignment.badgeId.includes('owner');
        const isStar = assignment.badgeId.includes('star');
        badge = {
          id: assignment.badgeId,
          schoolId: schoolId,
          name: isOwner ? '👑 وسام الإدارة العليا' : isStar ? '🌟 نجم الشهر المتميز' : '🏆 وسام التفوق والاجتهاد',
          nameEn: isOwner ? 'Leadership Badge' : isStar ? 'Monthly Star' : 'Achievement Badge',
          description: 'وسام تقديري للتميز والاجتهاد',
          icon: isOwner ? '👑' : isStar ? '🌟' : '🏆',
          color: isOwner ? '#D4AF37' : isStar ? '#8B5CF6' : '#F59E0B',
          rarity: isOwner ? 'Mythical' : isStar ? 'Legendary' : 'Epic',
          targetType: isOwner ? 'admin' : 'student',
          isActive: true,
          hasAnimatedBorder: true,
          limitType: 'none',
          maxQuantity: 0,
          createdAt: assignment.awardedAt || '2026-07-28',
        };
      }

      return {
        assignment,
        student,
        badge,
      };
    })
    .filter(
      (item): item is { assignment: StudentBadge; student: Student; badge: Badge } => item !== null
    );

  const filteredAssignments = enrichedAssignments.filter((item) => {
    const q = (searchTerm || '').trim().toLowerCase();
    const matchesSearch =
      !q ||
      (Boolean(item.student?.name) && item.student.name.toLowerCase().includes(q)) ||
      (Boolean(item.student?.studentCode) && item.student.studentCode.toLowerCase().includes(q)) ||
      (Boolean(item.badge?.name) && item.badge.name.toLowerCase().includes(q));
    const matchesBadge = selectedBadgeFilter === 'all' || item.badge.id === selectedBadgeFilter;
    return matchesSearch && matchesBadge;
  });

  // Combine teacher badges with resilient teacher & badge lookup
  const enrichedTeacherAssignments = teacherBadges
    .map((assignment) => {
      let teacher = teachers.find((t) => t.id === assignment.teacherId);
      if (!teacher) {
        const allLocalTeachers = getStorage<Teacher[]>('teachers', []);
        teacher = allLocalTeachers.find((t) => t.id === assignment.teacherId);
      }
      if (!teacher) {
        teacher = {
          id: assignment.teacherId,
          schoolId: schoolId,
          name: 'معلم مسجل',
          specialization: 'معلم مادة',
          status: 'نشط',
        } as unknown as Teacher;
      }

      let badge = systemBadges.find((b) => b.id === assignment.badgeId);
      if (!badge) {
        badge = systemBadges.find((b) => b.id.includes(assignment.badgeId) || assignment.badgeId.includes(b.id));
      }
      if (!badge) {
        const allLocalBadges = getAllBadges(schoolId);
        badge = allLocalBadges.find((b) => b.id === assignment.badgeId || b.id.includes(assignment.badgeId));
      }
      if (!badge) {
        badge = {
          id: assignment.badgeId,
          schoolId: schoolId,
          name: '🏅 المعلم المبدع والقدوة',
          nameEn: 'Exemplary Teacher',
          description: 'وسام التميز والتفاني',
          icon: '🏅',
          color: '#2563EB',
          rarity: 'Legendary',
          targetType: 'teacher',
          isActive: true,
          hasAnimatedBorder: true,
          limitType: 'none',
          maxQuantity: 0,
          createdAt: assignment.awardedAt || '2026-07-28',
        };
      }

      return {
        assignment,
        teacher,
        badge,
      };
    })
    .filter(
      (item): item is { assignment: TeacherBadge; teacher: Teacher; badge: Badge } => item !== null
    );

  const filteredTeacherAssignments = enrichedTeacherAssignments.filter((item) => {
    const q = (searchTerm || '').trim().toLowerCase();
    const matchesSearch =
      !q ||
      (Boolean(item.teacher?.name) && item.teacher.name.toLowerCase().includes(q)) ||
      (Boolean(item.teacher?.specialization) && item.teacher.specialization.toLowerCase().includes(q)) ||
      (Boolean(item.badge?.name) && item.badge.name.toLowerCase().includes(q));
    const matchesBadge = selectedBadgeFilter === 'all' || item.badge.id === selectedBadgeFilter;
    return matchesSearch && matchesBadge;
  });

  // Filtered teachers list inside modal
  const filteredTeachersForModal = teachers.filter((t) => {
    const matchesRole =
      teacherTypeFilter === 'all'
        ? true
        : teacherTypeFilter === 'attendance_officer'
        ? t.isAttendanceOfficer === true
        : !t.isAttendanceOfficer;

    const tq = (teacherSearchTerm || '').trim().toLowerCase();
    const matchesSearch =
      !tq ||
      (Boolean(t.name) && t.name.toLowerCase().includes(tq)) ||
      (Boolean(t.specialization) && t.specialization.toLowerCase().includes(tq)) ||
      (Boolean(t.username) && t.username.toLowerCase().includes(tq));

    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6 dir-rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-purple-700 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-amber-200 text-xs font-bold backdrop-blur-md border border-white/10">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>نظام الأوسمة المحدودة والتكريمات الرقمية</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">إدارة الأوسمة (Badges Management)</h1>
            <p className="text-xs sm:text-sm text-white/80 max-w-xl leading-relaxed">
              قم بمنح وسحب الأوسمة العادية والمحدودة (شهرياً أو للأبد) للطلاب والمعلمين وتوثيق إنجازاتهم الرسمية داخل المنظومة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setIsTeacherAwardModalOpen(true)}
              className="px-5 py-3 bg-blue-500 hover:bg-blue-400 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 border border-blue-400/30"
            >
              <UserCheck className="w-5 h-5" />
              <span>منح وسام لمعلم</span>
            </button>
            <button
              onClick={() => setIsAwardStudentChoiceModalOpen(true)}
              className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
            >
              <Award className="w-5 h-5" />
              <span>منح وسام لطالب</span>
            </button>
            <button
              onClick={() => setIsAddChoiceModalOpen(true)}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-2xl backdrop-blur-md transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>وسام جديد</span>
            </button>
          </div>
        </div>
      </div>

      {/* Available System Badges Showcase */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-base text-slate-900">الأوسمة المتاحة في النظام</h2>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            إجمالي الأوسمة: {systemBadges.length}
          </span>
        </div>

        {systemBadges.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
            <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">لا توجد أوسمة مضافة في هذه المدرسة بعد</p>
            <p className="text-xs text-slate-400 mt-1">يمكنك تصميم وإضافة أوسمتك المخصصة من قسم "إضافة وسام جديد" أدناه</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
            {(showAllSystemBadges ? systemBadges : systemBadges.slice(0, 4)).map((badge) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                showDeleteButton={true}
                onDeleteBadge={() => handleDeleteSystemBadge(badge)}
                showAwardButton={badge.targetType !== 'admin'}
                onAward={() => handleDirectAwardBadge(badge)}
              />
            ))}
          </div>
        )}

        {systemBadges.length > 4 && (
          <div className="pt-2 flex justify-center border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAllSystemBadges((prev) => !prev)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
            >
              <span>
                {showAllSystemBadges
                  ? 'عرض أقل'
                  : `عرض جميع الأوسمة (${systemBadges.length})`}
              </span>
              {showAllSystemBadges ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Awarded Badges Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-base text-slate-900">سجل الأوسمة الممنوحة</h2>
            </div>
            {/* Record Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs w-fit">
              <button
                onClick={() => setActiveRecordTab('students')}
                className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeRecordTab === 'students'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🎓 الطلاب ({enrichedAssignments.length})
              </button>
              <button
                onClick={() => setActiveRecordTab('teachers')}
                className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeRecordTab === 'teachers'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👨‍🏫 المعلمين والمحضرين ({enrichedTeacherAssignments.length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={activeRecordTab === 'students' ? 'بحث باسم الطالب أو الوسام...' : 'بحث باسم المعلم أو الوسام...'}
                className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Filter Badge Dropdown */}
            <select
              value={selectedBadgeFilter}
              onChange={(e) => setSelectedBadgeFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="all">جميع الأوسمة</option>
              {systemBadges.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Awarded Badges List */}
        {activeRecordTab === 'students' ? (
          filteredAssignments.length === 0 ? (
            <BadgesEmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(showAllAwardedRecords ? filteredAssignments : filteredAssignments.slice(0, 3)).map(({ assignment, student, badge }) => {
                const count = studentBadges.filter(
                  (a) => a.studentId === student.id && a.badgeId === badge.id
                ).length;

                return (
                  <div key={assignment.id} className="relative">
                    <BadgeCard
                      badge={badge}
                      assignment={assignment}
                      count={count}
                      showRemoveButton={true}
                      onRemove={() =>
                        handleRemoveAssignment(assignment.id, student.name, badge.name)
                      }
                    />
                    <div className="mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">الممنوح له:</span>
                        <span className="font-bold text-slate-900">{student.name}</span>
                        <span className="text-[10px] text-blue-600 block">{student.className}</span>
                      </div>
                      {assignment.note && (
                        <div className="text-left text-[11px] text-slate-600 italic bg-white px-2 py-1 rounded-lg border border-slate-100 max-w-[140px] truncate">
                          "{assignment.note}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : filteredTeacherAssignments.length === 0 ? (
          <BadgesEmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(showAllAwardedRecords ? filteredTeacherAssignments : filteredTeacherAssignments.slice(0, 3)).map(({ assignment, teacher, badge }) => {
              const count = teacherBadges.filter(
                (a) => a.teacherId === teacher.id && a.badgeId === badge.id
              ).length;

              return (
                <div key={assignment.id} className="relative">
                  <BadgeCard
                    badge={badge}
                    assignment={assignment}
                    count={count}
                    showRemoveButton={true}
                    onRemove={() =>
                      handleRemoveTeacherAssignment(assignment.id, teacher.name, badge.name)
                    }
                  />
                  <div className="mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">المكرم:</span>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{teacher.name}</span>
                        {teacher.isAttendanceOfficer ? (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                            محضر حضور
                          </span>
                        ) : (
                          <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                            معلم
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        {teacher.specialization ? `تخصص: ${teacher.specialization}` : `مستخدم: ${teacher.username || ''}`}
                      </span>
                    </div>
                    {assignment.note && (
                      <div className="text-left text-[11px] text-slate-600 italic bg-white px-2 py-1 rounded-lg border border-slate-100 max-w-[140px] truncate">
                        "{assignment.note}"
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {((activeRecordTab === 'students' && filteredAssignments.length > 3) ||
          (activeRecordTab === 'teachers' && filteredTeacherAssignments.length > 3)) && (
          <div className="pt-2 flex justify-center border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAllAwardedRecords((prev) => !prev)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
            >
              <span>
                {showAllAwardedRecords
                  ? 'عرض أقل'
                  : `عرض جميع السجلات (${activeRecordTab === 'students' ? filteredAssignments.length : filteredTeacherAssignments.length})`}
              </span>
              {showAllAwardedRecords ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Choice Modal: Award Single Student vs Multi Students */}
      {isAwardStudentChoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-6 shadow-2xl border border-slate-200 dir-rtl relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-amber-400 via-purple-500 to-indigo-600" />
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">طريقة منح الوسام للطلاب</h3>
                  <p className="text-xs text-slate-500 font-medium">حدد ما إذا كنت تريد تكريم طالب فردي أو مجموعة طلاب دفعة واحدة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAwardStudentChoiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Card 1: Single Student */}
              <button
                type="button"
                onClick={() => {
                  const studentBadgesList = systemBadges.filter((b) => b.targetType === 'student' || !b.targetType);
                  const validBadge = studentBadgesList.find((b) => !b.id.includes('owner') && !b.name.includes('المالك')) || studentBadgesList[0];
                  if (!selectedBadgeId || selectedBadgeId.includes('owner') || selectedBadgeId === 'badge-owner-mythical') {
                    setSelectedBadgeId(validBadge ? validBadge.id : '');
                  }
                  setIsAwardStudentChoiceModalOpen(false);
                  setIsAwardModalOpen(true);
                }}
                className="p-5 rounded-2xl border-2 border-slate-200/80 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/30 transition-all text-right flex flex-col justify-between space-y-4 group cursor-pointer hover:shadow-md hover:scale-102 active:scale-98"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-amber-800 transition-colors">
                      تكريم طالب واحد
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed font-normal">
                      اختيار طالب فردي واحد من القائمة وتحديد الوسام الخاص به مع كتابة سبب التكريم.
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-transform">
                  <span>الانتقال للتكريم الفردي</span>
                  <span>←</span>
                </div>
              </button>

              {/* Card 2: Multi Student */}
              <button
                type="button"
                onClick={() => {
                  setIsAwardStudentChoiceModalOpen(false);
                  setIsMultiAwardModalOpen(true);
                }}
                className="p-5 rounded-2xl border-2 border-slate-200/80 hover:border-purple-500 bg-slate-50/50 hover:bg-purple-50/30 transition-all text-right flex flex-col justify-between space-y-4 group cursor-pointer hover:shadow-md hover:scale-102 active:scale-98"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-purple-800 transition-colors">
                      تكريم مجموعة طلاب (تكريم جماعي)
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed font-normal">
                      اختيار قائمة متعددة من الطلاب ومنحهم نفس الوسام المختار وسبب التكريم بضغطة زر.
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform">
                  <span>الانتقال للتكريم الجماعي</span>
                  <span>←</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Student Award Modal */}
      {isMultiAwardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 space-y-6 shadow-2xl border border-slate-200 dir-rtl my-auto relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">منح وسام جماعي لمجموعة طلاب</h3>
                  <p className="text-xs text-slate-500 font-medium">تحديد عدة طلاب دفعة واحدة وإرسال التكريم الموحد لهم</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMultiAwardModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMultiAwardSubmit} className="space-y-6 text-xs">
              {/* Section 1: Select Badge & Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-800">اختر الوسام المراد منحه *</label>
                  <select
                    value={selectedMultiBadgeId}
                    onChange={(e) => setSelectedMultiBadgeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-xs text-slate-800 cursor-pointer shadow-2xs"
                  >
                    {systemBadges
                      .filter((b) => b.targetType === 'student')
                      .map((b) => {
                        const limitInfo = getBadgeLimitInfo(b.id);
                        let limitText = '';
                        if (limitInfo.limitType === 'monthly') {
                          limitText = ` (شهري: متبقي ${limitInfo.remaining}/${limitInfo.maxQuantity})`;
                        } else if (limitInfo.limitType === 'forever') {
                          limitText = ` (للأبد: متبقي ${limitInfo.remaining}/${limitInfo.maxQuantity})`;
                        }
                        return (
                          <option key={b.id} value={b.id}>
                            {b.icon && (b.icon.startsWith('data:') || b.icon.startsWith('http') || b.icon.startsWith('/')) ? '🏅' : b.icon} {b.name} [{b.rarity}]{limitText}
                          </option>
                        );
                      })}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-800">سبب التكريم / المناسبة (اختياري)</label>
                  <input
                    type="text"
                    value={multiAwardNote}
                    onChange={(e) => setMultiAwardNote(e.target.value)}
                    placeholder="مثال: التفوق في الاختبار الشهري، المشاركة المتميزة..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-xs text-slate-800 shadow-2xs"
                  />
                </div>
              </div>

              {/* Section 2: Student Selection & Filters */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label className="font-extrabold text-slate-800 text-sm">قائمة الطلاب المستحقين</label>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                      تم تحديد {selectedStudentIds.length} طالب
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const currentFiltered = students.filter((s) => {
                          if (multiGradeFilter !== 'الكل' && s.className !== multiGradeFilter) return false;
                          if (!multiStudentSearchTerm.trim()) return true;
                          const q = multiStudentSearchTerm.trim().toLowerCase();
                          return (
                            s.name.toLowerCase().includes(q) ||
                            (s.className && s.className.toLowerCase().includes(q)) ||
                            (s.studentCode && s.studentCode.toLowerCase().includes(q)) ||
                            s.id.toLowerCase().includes(q)
                          );
                        });
                        const filteredIds = currentFiltered.map((s) => s.id);
                        const isAllSelected = filteredIds.every((id) => selectedStudentIds.includes(id));

                        if (isAllSelected) {
                          setSelectedStudentIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
                        } else {
                          setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                      <span>تحديد/إلغاء تحديد المعروضين</span>
                    </button>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={multiStudentSearchTerm}
                      onChange={(e) => setMultiStudentSearchTerm(e.target.value)}
                      placeholder="ابحث باسم الطالب، الفصل، أو كود الطالب..."
                      className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>

                  <div>
                    <select
                      value={multiGradeFilter}
                      onChange={(e) => setMultiGradeFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium cursor-pointer"
                    >
                      <option value="الكل">كل الصفوف والفصول</option>
                      {Array.from(new Set(students.map((s) => s.className).filter(Boolean))).map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Students List Container */}
                <div className="max-h-64 sm:max-h-72 overflow-y-auto border border-slate-200 rounded-2xl p-2.5 space-y-1.5 bg-slate-50/50">
                  {students
                    .filter((s) => {
                      if (multiGradeFilter !== 'الكل' && s.className !== multiGradeFilter) return false;
                      if (!multiStudentSearchTerm.trim()) return true;
                      const q = multiStudentSearchTerm.trim().toLowerCase();
                      return (
                        s.name.toLowerCase().includes(q) ||
                        (s.className && s.className.toLowerCase().includes(q)) ||
                        (s.studentCode && s.studentCode.toLowerCase().includes(q)) ||
                        s.id.toLowerCase().includes(q)
                      );
                    })
                    .length === 0 ? (
                    <div className="text-center py-8 text-slate-400 space-y-2">
                      <User className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-bold text-xs">لا يوجد طلاب يطابقون خيارات البحث أو التصفية الحالية</p>
                    </div>
                  ) : (
                    students
                      .filter((s) => {
                        if (multiGradeFilter !== 'الكل' && s.className !== multiGradeFilter) return false;
                        if (!multiStudentSearchTerm.trim()) return true;
                        const q = multiStudentSearchTerm.trim().toLowerCase();
                        return (
                          s.name.toLowerCase().includes(q) ||
                          (s.className && s.className.toLowerCase().includes(q)) ||
                          (s.studentCode && s.studentCode.toLowerCase().includes(q)) ||
                          s.id.toLowerCase().includes(q)
                        );
                      })
                      .map((s) => {
                        const isSelected = selectedStudentIds.includes(s.id);
                        return (
                          <div
                            key={s.id}
                            onClick={() => {
                              setSelectedStudentIds((prev) =>
                                prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                              );
                            }}
                            className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer select-none ${
                              isSelected
                                ? 'bg-amber-50/90 border-amber-400 text-slate-900 shadow-2xs font-bold'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/80 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                  isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {s.name.trim().charAt(0)}
                              </div>
                              <div>
                                <span className="text-xs block">{s.name}</span>
                                <span className="text-[10px] text-slate-400 block font-normal">
                                  الفصل: {s.className || 'غير محدد'} {s.studentCode ? `• الكود: ${s.studentCode}` : ''}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {isSelected ? (
                                <span className="flex items-center gap-1 text-amber-700 font-extrabold text-xs bg-amber-100 px-2.5 py-1 rounded-lg">
                                  <CheckSquare className="w-4 h-4 text-amber-600" />
                                  <span>محدد</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-slate-400 font-bold text-xs bg-slate-100 px-2.5 py-1 rounded-lg">
                                  <Square className="w-4 h-4" />
                                  <span>تحديد</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Submit / Action Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMultiAwardModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={selectedStudentIds.length === 0}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-102 active:scale-98"
                >
                  <Award className="w-4 h-4" />
                  <span>تأكيد ومنح الوسام لـ ({selectedStudentIds.length}) طالب</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Award Badge to Student Modal */}
      {isAwardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col dir-rtl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg shadow-xs">
                  🏅
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">منح وسام تقديري لطالب</h3>
                  <p className="text-xs text-slate-500 font-medium">ابحث واختر الطالب من القائمة ثم حدد الوسام المراد منحه</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAwardModalOpen(false);
                  setStudentSearchTerm('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAwardSubmit} className="space-y-4 text-xs flex-1 overflow-y-auto pr-1">
              {/* Selected Student Active Banner */}
              {(() => {
                const currentChosenStudent = students.find((s) => s.id === selectedStudentId);
                if (!currentChosenStudent) return null;
                return (
                  <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-2xl flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-sm shadow-2xs">
                        👤
                      </div>
                      <div>
                        <div className="text-[10px] text-amber-800 font-bold">الطالب المحدد للتكريم:</div>
                        <div className="font-extrabold text-slate-900 text-sm">{currentChosenStudent.name}</div>
                        <div className="text-[11px] text-slate-600 font-medium">
                          {currentChosenStudent.className ? `فصل: ${currentChosenStudent.className}` : ''}
                          {currentChosenStudent.studentCode ? ` • كود: ${currentChosenStudent.studentCode}` : ''}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold bg-amber-200/90 text-amber-950 px-2.5 py-1 rounded-full border border-amber-300">
                      محدد للتكريم ✅
                    </span>
                  </div>
                );
              })()}

              {/* Student Search & Selection List */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-800">
                  <span>اختر الطالب من القائمة</span>
                  <span className="text-rose-500 mr-1">*</span>
                </label>
                
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    placeholder="ابحث باسم الطالب، الفصل، كود الطالب، أو الهوية..."
                    className="w-full pr-9 pl-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                  {studentSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setStudentSearchTerm('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filtered Students List */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
                  {students.filter((s) => {
                    if (!studentSearchTerm.trim()) return true;
                    const q = studentSearchTerm.trim().toLowerCase();
                    return (
                      (Boolean(s.name) && s.name.toLowerCase().includes(q)) ||
                      (Boolean(s.className) && s.className.toLowerCase().includes(q)) ||
                      (Boolean((s as any).gradeName) && String((s as any).gradeName).toLowerCase().includes(q)) ||
                      (Boolean(s.studentCode) && s.studentCode.toLowerCase().includes(q)) ||
                      (Boolean(s.nationalId) && s.nationalId.toLowerCase().includes(q)) ||
                      s.id.toLowerCase().includes(q)
                    );
                  }).length === 0 ? (
                    <div className="p-4 text-center text-slate-500 font-medium">
                      لا يوجد طالب يطابق البحث الحالي "{studentSearchTerm}"
                    </div>
                  ) : (
                    students
                      .filter((s) => {
                        if (!studentSearchTerm.trim()) return true;
                        const q = studentSearchTerm.trim().toLowerCase();
                        return (
                          (Boolean(s.name) && s.name.toLowerCase().includes(q)) ||
                          (Boolean(s.className) && s.className.toLowerCase().includes(q)) ||
                          (Boolean((s as any).gradeName) && String((s as any).gradeName).toLowerCase().includes(q)) ||
                          (Boolean(s.studentCode) && s.studentCode.toLowerCase().includes(q)) ||
                          (Boolean(s.nationalId) && s.nationalId.toLowerCase().includes(q)) ||
                          s.id.toLowerCase().includes(q)
                        );
                      })
                      .map((s) => {
                        const isSelected = selectedStudentId === s.id;
                        return (
                          <div
                            key={s.id}
                            onClick={() => setSelectedStudentId(s.id)}
                            className={`p-2.5 rounded-xl cursor-pointer transition-all border flex items-center justify-between ${
                              isSelected
                                ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                                  isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {s.name.charAt(0) || 'ط'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                  <span>{s.name}</span>
                                  {s.className && (
                                    <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                                      {s.className}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-normal">
                                  {s.studentCode ? `كود: ${s.studentCode}` : s.nationalId ? `هوية: ${s.nationalId}` : `ID: ${s.id}`}
                                </div>
                              </div>
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />}
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Select Badge */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">
                  <span>اختر الوسام المراد منحه للطالب</span>
                  <span className="text-rose-500 mr-1">*</span>
                </label>
                <select
                  value={selectedBadgeId}
                  onChange={(e) => setSelectedBadgeId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 font-bold text-xs text-slate-800 cursor-pointer"
                  required
                >
                  <option value="">-- اضغط لاختيار الوسام المراد منحه --</option>
                  {systemBadges
                    .filter((b) => b.targetType === 'student' || b.targetType === 'other' || !b.targetType)
                    .map((b) => {
                      const limitInfo = getBadgeLimitInfo(b.id);
                      let limitText = '';
                      if (limitInfo.limitType === 'monthly') {
                        limitText = limitInfo.isAvailable
                          ? ` [📅 متاح: ${limitInfo.remaining}/${limitInfo.maxQuantity} هذا الشهر]`
                          : ` [⚠️ نفذت الكمية لهذا الشهر]`;
                      } else if (limitInfo.limitType === 'forever') {
                        limitText = limitInfo.isAvailable
                          ? ` [🔒 متاح: ${limitInfo.remaining}/${limitInfo.maxQuantity} للأبد]`
                          : ` [⚠️ نفذت الكمية للأبد]`;
                      }
                      return (
                        <option key={b.id} value={b.id}>
                          {b.icon && (b.icon.startsWith('data:') || b.icon.startsWith('http') || b.icon.startsWith('/')) ? '🏅' : b.icon} {b.name} [{b.rarity}]{limitText}
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Badge Limit Info Display Banner */}
              {(() => {
                if (!selectedBadgeId) return null;
                const limitInfo = getBadgeLimitInfo(selectedBadgeId);
                const selectedBadgeObj = systemBadges.find((b) => b.id === selectedBadgeId);
                
                return (
                  <div className="space-y-2">
                    {selectedBadgeObj && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                        <div className="text-2xl">{selectedBadgeObj.icon || '🏅'}</div>
                        <div className="flex-1">
                          <div className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                            <span>{selectedBadgeObj.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                              {selectedBadgeObj.rarity}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{selectedBadgeObj.description}</div>
                        </div>
                      </div>
                    )}
                    {limitInfo.limitType !== 'none' && (
                      <div
                        className={`p-3 rounded-2xl text-xs flex items-center justify-between font-semibold border ${
                          limitInfo.isAvailable
                            ? 'bg-purple-50 text-purple-900 border-purple-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Info className="w-4 h-4 shrink-0" />
                          <span>
                            {limitInfo.limitType === 'monthly'
                              ? '📅 وسام محدود شهرياً:'
                              : '🔒 وسام محدود للأبد:'}{' '}
                            {limitInfo.isAvailable
                              ? `متبقي ${limitInfo.remaining} من ${limitInfo.maxQuantity}`
                              : 'تم استنفاذ السعة!'}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/80 border border-slate-200">
                          الممنوح: {limitInfo.usedCount}/{limitInfo.maxQuantity}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <label className="block font-bold text-slate-700 mb-1">سبب التكريم / ملاحظة إضافية</label>
                <textarea
                  rows={2}
                  value={awardNote}
                  onChange={(e) => setAwardNote(e.target.value)}
                  placeholder="مثال: التميز في الأنشطة الطلابية والمشاركة الفعالة..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl transition-all shadow-md cursor-pointer text-xs flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <Award className="w-4 h-4" />
                  <span>تأكيد منح الوسام للطالب</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAwardModalOpen(false);
                    setStudentSearchTerm('');
                  }}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all cursor-pointer text-xs"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Award Badge to Teacher / Attendance Officer Modal */}
      {isTeacherAwardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  🏅
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">منح وسام لمعلم / محضر حضور</h3>
                  <p className="text-xs text-slate-500">ابحث واختر المعلم أو محضر الحضور، ثم حدد الوسام التقديري</p>
                </div>
              </div>
              <button
                onClick={() => setIsTeacherAwardModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleTeacherAwardSubmit} className="space-y-4 text-xs flex-1 overflow-y-auto pr-1">
              {/* Role Filter Tabs */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">تصنيف الكادر التعليمي</label>
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setTeacherTypeFilter('all')}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer ${
                      teacherTypeFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    جميع الكادر ({teachers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeacherTypeFilter('teacher')}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer ${
                      teacherTypeFilter === 'teacher'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    المعلمين ({teachers.filter((t) => !t.isAttendanceOfficer).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeacherTypeFilter('attendance_officer')}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer ${
                      teacherTypeFilter === 'attendance_officer'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    محضرو الحضور ({teachers.filter((t) => t.isAttendanceOfficer).length})
                  </button>
                </div>
              </div>

              {/* Live Search Bar */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">شريط البحث السريع *</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={teacherSearchTerm}
                    onChange={(e) => setTeacherSearchTerm(e.target.value)}
                    placeholder="ابحث باسم المعلم، التخصص، أو اسم المستخدم..."
                    className="w-full pr-9 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Selection List */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">اختر المكرم من القائمة *</label>
                {filteredTeachersForModal.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-2xl text-center text-slate-500 border border-slate-200">
                    لم يتم العثور على معلم أو محضر حضور مطابق للبحث
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
                    {filteredTeachersForModal.map((t) => {
                      const isSelected = selectedTeacherId === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTeacherId(t.id)}
                          className={`p-3 rounded-xl cursor-pointer transition-all border flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              t.isAttendanceOfficer ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {t.isAttendanceOfficer ? '🎯' : '👨‍🏫'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                <span>{t.name}</span>
                                {t.isAttendanceOfficer ? (
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                                    محضر حضور وغياب
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                                    معلم
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {t.specialization ? `التخصص: ${t.specialization}` : `اسم المستخدم: ${t.username || 'غير محدد'}`}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Select Badge */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">اختر الوسام التقديري *</label>
                <select
                  value={selectedTeacherBadgeId}
                  onChange={(e) => setSelectedTeacherBadgeId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                  required
                >
                  <option value="">-- اضغط لاختيار وسام المعلم / المحضر --</option>
                  {systemBadges
                    .filter((b) => b.targetType === 'teacher' || b.targetType === 'attendance_teacher' || b.targetType === 'other' || !b.targetType)
                    .map((b) => {
                      const limitInfo = getBadgeLimitInfo(b.id);
                      let limitText = '';
                      if (limitInfo.limitType === 'monthly') {
                        limitText = limitInfo.isAvailable
                          ? ` [📅 متاح: ${limitInfo.remaining}/${limitInfo.maxQuantity} هذا الشهر]`
                          : ` [⚠️ نفذت الكمية لهذا الشهر]`;
                      } else if (limitInfo.limitType === 'forever') {
                        limitText = limitInfo.isAvailable
                          ? ` [🔒 متاح: ${limitInfo.remaining}/${limitInfo.maxQuantity} للأبد]`
                          : ` [⚠️ نفذت الكمية للأبد]`;
                      }
                      return (
                        <option key={b.id} value={b.id}>
                          {b.icon && (b.icon.startsWith('data:') || b.icon.startsWith('http') || b.icon.startsWith('/')) ? '🏅' : b.icon} {b.name} [{b.rarity}]{limitText}
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Badge Limit Info Display Banner */}
              {(() => {
                if (!selectedTeacherBadgeId) return null;
                const limitInfo = getBadgeLimitInfo(selectedTeacherBadgeId);
                if (limitInfo.limitType === 'none') return null;

                return (
                  <div
                    className={`p-3 rounded-2xl text-xs flex items-center justify-between font-semibold border ${
                      limitInfo.isAvailable
                        ? 'bg-purple-50 text-purple-900 border-purple-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Info className="w-4 h-4 shrink-0" />
                      <span>
                        {limitInfo.limitType === 'monthly'
                          ? '📅 وسام محدود شهرياً:'
                          : '🔒 وسام محدود للأبد:'}{' '}
                        {limitInfo.isAvailable
                          ? `متبقي ${limitInfo.remaining} من ${limitInfo.maxQuantity}`
                          : 'تم استنفاذ السعة!'}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/80 border border-slate-200">
                      الممنوح: {limitInfo.usedCount}/{limitInfo.maxQuantity}
                    </span>
                  </div>
                );
              })()}

              {/* Reason / Note */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">سبب التكريم / ملاحظة الإدارة</label>
                <textarea
                  rows={2}
                  value={teacherAwardNote}
                  onChange={(e) => setTeacherAwardNote(e.target.value)}
                  placeholder="مثال: التميز والانضباط العالي في توثيق الحضور والغياب الميداني..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-md cursor-pointer text-xs"
                >
                  تأكيد منح الوسام للمعلم / المحضر 🏅
                </button>
                <button
                  type="button"
                  onClick={() => setIsTeacherAwardModalOpen(false)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all cursor-pointer text-xs"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Badge Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  ✨
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">إنشاء وسام جديد</h3>
                  <p className="text-xs text-slate-500">إضافة وسام تقديري جديد إلى قائمة أوسمة المدرسة</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBadgeSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم الوسام بالعربية *</label>
                  <input
                    type="text"
                    required
                    value={newBadgeData.name}
                    onChange={(e) => setNewBadgeData({ ...newBadgeData, name: e.target.value })}
                    placeholder="مثال: 🌟 الطالب المثالي"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رمز الأيقونة (Emoji) *</label>
                  <input
                    type="text"
                    required
                    value={newBadgeData.icon}
                    onChange={(e) => setNewBadgeData({ ...newBadgeData, icon: e.target.value })}
                    placeholder="🏆"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg focus:bg-white focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الوصف التقديري للوسام</label>
                <textarea
                  rows={2}
                  value={newBadgeData.description}
                  onChange={(e) => setNewBadgeData({ ...newBadgeData, description: e.target.value })}
                  placeholder="وصف الإنجاز الذي يستحق بناءً عليه هذا الوسام..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">مستوى الندرة (Rarity)</label>
                  <select
                    value={newBadgeData.rarity}
                    onChange={(e) =>
                      setNewBadgeData({
                        ...newBadgeData,
                        rarity: e.target.value as Badge['rarity'],
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                  >
                    <option value="Mythical">Mythical (خرافي)</option>
                    <option value="Legendary">Legendary (أسطوري)</option>
                    <option value="Epic">Epic (بطولي)</option>
                    <option value="Rare">Rare (نادر)</option>
                    <option value="Common">Common (عادي)</option>
                    <option value="other">⚙️ شيء آخر (مخصص)</option>
                  </select>
                  {(newBadgeData.rarity as string) === 'other' && (
                    <div className="mt-2 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600">اكتب الوصف أو المستوى المخصص:</label>
                      <input
                        type="text"
                        required
                        value={customRarity}
                        onChange={(e) => setCustomRarity(e.target.value)}
                        placeholder="أدخل وصفاً أو اسم مستوى الندرة المخصص..."
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-600 font-medium"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الفئة المستهدفة</label>
                  <select
                    value={newBadgeData.targetType}
                    onChange={(e) =>
                      setNewBadgeData({
                        ...newBadgeData,
                        targetType: e.target.value as Badge['targetType'],
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                  >
                    <option value="student">الطلاب (Student)</option>
                    <option value="teacher">المعلمين (Teacher)</option>
                    <option value="admin">الإدارة (Admin)</option>
                    <option value="other">⚙️ شيء آخر (مخصص)</option>
                  </select>
                  {(newBadgeData.targetType as string) === 'other' && (
                    <div className="mt-2 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600">اكتب وصف الفئة المستهدفة المخصصة:</label>
                      <input
                        type="text"
                        required
                        value={customTargetType}
                        onChange={(e) => setCustomTargetType(e.target.value)}
                        placeholder="أدخل الفئة المستهدفة التفصيلية..."
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-600 font-medium"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Limited Badges Setup Options */}
              <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-200/80 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-slate-900">إعدادات الكمية والتوفر (Limited Badges)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">نوع توفر الوسام</label>
                    <select
                      value={newBadgeData.limitType}
                      onChange={(e) =>
                        setNewBadgeData({
                          ...newBadgeData,
                          limitType: e.target.value as BadgeLimitType,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl cursor-pointer font-medium"
                    >
                      <option value="none">♾️ غير محدود (Unlimited)</option>
                      <option value="monthly">📅 محدود شهرياً (Monthly Reset)</option>
                      <option value="forever">🔒 محدود للأبد (Fixed Limit)</option>
                      <option value="other">⚙️ شيء آخر (مخصص)</option>
                    </select>
                    {(newBadgeData.limitType as string) === 'other' && (
                      <div className="mt-2 space-y-1 col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600">اكتب وصف آلية التوفر المخصصة:</label>
                        <input
                          type="text"
                          required
                          value={customLimitDescription}
                          onChange={(e) => setCustomLimitDescription(e.target.value)}
                          placeholder="اكتب وصفاً تفصيلياً لتوفر هذا الوسام..."
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-600 font-medium"
                        />
                      </div>
                    )}
                  </div>

                  {newBadgeData.limitType !== 'none' && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">العدد الأقصى للطلاب *</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={newBadgeData.maxQuantity}
                        onChange={(e) =>
                          setNewBadgeData({
                            ...newBadgeData,
                            maxQuantity: parseInt(e.target.value) || 1,
                          })
                        }
                        placeholder="مثال: 5"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                  )}
                </div>

                {newBadgeData.limitType === 'monthly' && (
                  <p className="text-[11px] text-purple-900 bg-white/80 p-2.5 rounded-xl border border-purple-200 leading-relaxed">
                    📅 <strong>وسام محدود شهرياً:</strong> يتاح لـ {newBadgeData.maxQuantity} طلاب فقط شهرياً. تتجدد السعة في بداية كل شهر، وتظل الأوسمة السابقة محفوظة في ملف الطالب!
                  </p>
                )}

                {newBadgeData.limitType === 'forever' && (
                  <p className="text-[11px] text-amber-900 bg-white/80 p-2.5 rounded-xl border border-amber-200 leading-relaxed">
                    🔒 <strong>وسام محدود للأبد:</strong> يُمنح لـ {newBadgeData.maxQuantity} طلاب فقط إجمالاً، وعند استنفاذ الكمية يغلق المنح.
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  حفظ الوسام
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-right animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600 bg-red-50 p-3.5 rounded-2xl border border-red-100">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold text-sm">تأكيد سحب/إلغاء الوسام</h3>
                <p className="text-xs text-red-700/80 mt-0.5">سيتم إلغاء هذا الوسام وحذفه من ملف الطالب الرسمى.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              هل أنت تأكيد من رغبتك في إلغاء وسام <strong className="text-slate-900">"{deleteConfirmation.badgeName}"</strong> الممنوح للطالب <strong className="text-slate-900">{deleteConfirmation.studentName}</strong>؟
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={confirmDeleteAssignment}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer shadow-md shadow-red-200"
              >
                تأكيد سحب الوسام
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Teacher Confirmation Modal */}
      {deleteTeacherConfirmation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-right animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600 bg-red-50 p-3.5 rounded-2xl border border-red-100">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold text-sm">تأكيد سحب/إلغاء الوسام</h3>
                <p className="text-xs text-red-700/80 mt-0.5">سيتم إلغاء هذا الوسام وحذفه من ملف المعلم/المحضر الرسمي.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              هل أنت تأكيد من رغبتك في إلغاء وسام <strong className="text-slate-900">"{deleteTeacherConfirmation.badgeName}"</strong> الممنوح لـ <strong className="text-slate-900">{deleteTeacherConfirmation.teacherName}</strong>؟
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTeacherConfirmation(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={confirmDeleteTeacherAssignment}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer shadow-md shadow-red-200"
              >
                تأكيد سحب الوسام
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete System Badge Confirmation Modal */}
      {deleteSystemBadgeConfirmation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-right animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600 bg-red-50 p-3.5 rounded-2xl border border-red-100">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold text-sm">تأكيد حذف الوسام نهائياً</h3>
                <p className="text-xs text-red-700/80 mt-0.5">سيتم إزالة هذا الوسام بالكامل من قائمة الأوسمة المتاحة بالنظام.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              هل أنت تأكيد من رغبتك في حذف وسام <strong className="text-slate-900">"{deleteSystemBadgeConfirmation.badgeName}"</strong> نهائياً من قائمة أوسمة المدرسة؟
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteSystemBadgeConfirmation(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={confirmDeleteSystemBadge}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer shadow-md shadow-red-200"
              >
                تأكيد الحذف النهائيات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHOICE MODAL: Create Blank vs Preloaded Packs */}
      {isAddChoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-right animate-in fade-in zoom-in-95 duration-200 space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-200">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">إضافة وسام جديد إلى المنظومة</h3>
                  <p className="text-xs text-slate-500 font-medium">اختر طريقة إضافة الوسام المناسبة لمدرستك</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddChoiceModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cards Grid: 2 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Card 1: Create Blank Badge */}
              <button
                type="button"
                onClick={() => {
                  setIsAddChoiceModalOpen(false);
                  setIsCreateModalOpen(true);
                }}
                className="group relative flex flex-col justify-between p-6 rounded-3xl border-2 border-slate-200 hover:border-indigo-600 bg-white hover:bg-indigo-50/20 text-right transition-all duration-300 hover:shadow-xl cursor-pointer overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <Plus className="w-6 h-6" />
                  </div>

                  <div className="space-y-1.5">
                    <span className="inline-block px-2.5 py-0.5 bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-full">
                      تصميم حُر مخصص
                    </span>
                    <h4 className="font-extrabold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                      إنشاء وسام فارغ جديد
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      تصميم وسام مخصص بالكامل من البداية وتحديد الاسم والأيقونة ونوع الندرة والخصائص بنفسك.
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                  <span>بدء التصميم</span>
                  <span className="text-base group-hover:-translate-x-1 transition-transform">⬅️</span>
                </div>
              </button>

              {/* Card 2: Choose from Preloaded Assets/Packs */}
              <button
                type="button"
                onClick={() => {
                  setIsAddChoiceModalOpen(false);
                  setIsPacksModalOpen(true);
                }}
                className="group relative flex flex-col justify-between p-6 rounded-3xl border-2 border-amber-300 hover:border-amber-500 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/40 text-right transition-all duration-300 hover:shadow-xl cursor-pointer overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300">
                    <PackageCheck className="w-6 h-6" />
                  </div>

                  <div className="space-y-1.5">
                    <span className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-full">
                      🌟 6 أوسمة مجهزة مسبقاً
                    </span>
                    <h4 className="font-extrabold text-base text-slate-900 group-hover:text-amber-700 transition-colors">
                      حزمة الأوسمة الجاهزة
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      تصفح مكتبة تتضمن أوسمة احترافية للأكاديميا، السلوك، الأخلاق، الإبداع والقيادة وتفعيلها بضغطة زر.
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-amber-200/60 flex items-center justify-between text-xs font-extrabold text-amber-800">
                  <span>استعراض المكتبة</span>
                  <span className="text-base group-hover:-translate-x-1 transition-transform">⬅️</span>
                </div>
              </button>

            </div>

          </div>
        </div>
      )}

      {/* PRELOADED PACKS MODAL */}
      {isPacksModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-right animate-in fade-in zoom-in-95 duration-200 space-y-6 my-8 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-200">
                  <Boxes className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-slate-900 flex items-center gap-2">
                    <span>حزمة الأوسمة الجاهزة والاحترافية</span>
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full font-bold">
                      {PRELOADED_BADGES.length} أوسمة
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    اختر الأوسمة المناسبة وقم بتشغيلها وتفعيلها في نظام المدرسة بضغطة زر واحدة.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleInstallAllPreloadedBadges}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>تثبيت كافة الأوسمة الجاهزة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPacksModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter and Search Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl overflow-x-auto w-full sm:w-auto text-xs">
                {['الكل', 'أكاديمي', 'سلوكي', 'قيادة', 'إبداعي', 'معلمين', 'انضباط'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPackCategoryFilter(cat)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                      packCategoryFilter === cat
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={packSearchTerm}
                  onChange={(e) => setPackSearchTerm(e.target.value)}
                  placeholder="ابحث باسم الوسام أو الوصف..."
                  className="w-full pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>
            </div>

            {/* Grid of Preloaded Badges */}
            <div className="overflow-y-auto pr-1 space-y-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPreloadedBadges.map((badge) => {
                  const isInstalled = systemBadges.some(
                    (b) => b.name.trim() === badge.name.trim()
                  );

                  return (
                    <div
                      key={badge.packId}
                      className={`group relative rounded-3xl p-5 border text-right transition-all duration-300 flex flex-col justify-between space-y-4 ${
                        isInstalled
                          ? 'bg-emerald-50/40 border-emerald-200 shadow-xs'
                          : 'bg-white border-slate-200/90 hover:border-amber-400 hover:shadow-lg'
                      }`}
                    >
                      {/* Top Badge Card Meta */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          {/* Badge Icon Box */}
                          <div
                            className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-md border ${
                              badge.hasAnimatedBorder ? 'animate-pulse' : ''
                            }`}
                            style={{
                              backgroundColor: `${badge.color}15`,
                              borderColor: badge.color,
                              color: badge.color,
                            }}
                          >
                            {badge.icon && (badge.icon.startsWith('data:') || badge.icon.startsWith('http') || badge.icon.startsWith('/')) ? (
                              <img src={badge.icon} alt={badge.name} className="w-12 h-12 object-contain rounded-xl" />
                            ) : (
                              badge.icon
                            )}
                          </div>

                          {/* Tags */}
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className="px-2.5 py-0.5 rounded-full font-bold text-[10px] text-white shadow-xs"
                              style={{ backgroundColor: badge.color }}
                            >
                              {badge.rarity}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-md">
                              {badge.targetType === 'teacher' ? '👨‍🏫 المعلمين' : '🎓 الطلاب'}
                            </span>
                          </div>
                        </div>

                        {/* Title & Category */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {badge.category}
                            </span>
                            {badge.limitType && badge.limitType !== 'none' && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                {badge.limitType === 'monthly' ? `شهري (أقصى ${badge.maxQuantity})` : `محدد للأبد (${badge.maxQuantity})`}
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-900">{badge.name}</h4>
                          {badge.nameEn && <p className="text-[10px] font-mono text-slate-400">{badge.nameEn}</p>}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                          {badge.description}
                        </p>
                      </div>

                      {/* Footer Action */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        {isInstalled ? (
                          <div className="w-full py-2 bg-emerald-100/80 text-emerald-800 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>مُثبت في أوسمة المدرسة</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleInstallPreloadedBadge(badge)}
                            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95"
                          >
                            <Plus className="w-4 h-4" />
                            <span>تثبيت وتفعيل الوسام</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

