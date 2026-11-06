import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ALL_STUDENT_AVATAR_THEMES,
  StudentAvatarThemeId,
  isThemeUnlocked,
  isStudentAvatarThemeId,
  DEFAULT_STUDENT_AVATAR_THEME_ID,
  getStudentAvatarTheme,
} from '../../lib/studentAvatarThemes';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import {
  Check,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trophy,
  Award,
  Crown,
  Star,
  RefreshCw,
} from 'lucide-react';
import { getStoredSession, saveStoredSession } from '../../lib/storage';
import { getStorage, setStorage } from '../../lib/adminStorage';
import { updateSavedAccountAvatar } from '../../lib/trustedDeviceStorage';
import { getAuthHeaders, fetchStudentBadgesApi } from '../../lib/schoolApi';
import { getGroupedStudentBadges, getStudentBadges } from '../../lib/badgeStorage';

export interface AvatarSettingsSectionProps {
  userId?: string;
  userName?: string;
  userRole?: string;
  schoolId?: string;
  currentThemeId?: string;
  badges?: any[];
  rank?: number | null;
  onSaveSuccess?: (newThemeId: string) => void;
}

export const AvatarSettingsSection: React.FC<AvatarSettingsSectionProps> = ({
  userId,
  userName = 'الطالب',
  userRole = 'طالب',
  schoolId,
  currentThemeId,
  badges = [],
  rank: initialRank,
  onSaveSuccess,
}) => {
  // Infer user identity and school context from stored session
  const session = useMemo(() => getStoredSession(), []);

  const effectiveUserId = useMemo(() => {
    return userId || session?.studentId || (session as any)?.userId || '';
  }, [userId, session]);

  const effectiveSchoolId = useMemo(() => {
    return schoolId || session?.schoolId || 'sch-1';
  }, [schoolId, session]);

  // Initial theme determination with safe default fallback
  const initialTheme: StudentAvatarThemeId = useMemo(() => {
    if (isStudentAvatarThemeId(currentThemeId)) {
      return currentThemeId;
    }
    return DEFAULT_STUDENT_AVATAR_THEME_ID;
  }, [currentThemeId]);

  const [selectedThemeId, setSelectedThemeId] = useState<StudentAvatarThemeId>(initialTheme);
  const [savedThemeId, setSavedThemeId] = useState<StudentAvatarThemeId>(initialTheme);
  const [currentRank, setCurrentRank] = useState<number | null | undefined>(initialRank);
  const [currentPoints, setCurrentPoints] = useState<number>(0);
  const [revocationNotice, setRevocationNotice] = useState<string | null>(null);
  const [loadedBadges, setLoadedBadges] = useState<any[]>(badges || []);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSavedToast, setIsSavedToast] = useState<boolean>(false);

  // Sync state if currentThemeId prop changes externally
  useEffect(() => {
    if (isStudentAvatarThemeId(currentThemeId) && currentThemeId !== savedThemeId) {
      setSelectedThemeId(currentThemeId);
      setSavedThemeId(currentThemeId);
    }
  }, [currentThemeId, savedThemeId]);

  // Comprehensive data retrieval: Load student badges & authoritative rank from PostgreSQL & local cache
  const loadStudentEligibilityData = useCallback(async () => {
    if (!effectiveSchoolId || !effectiveUserId) return;

    setIsLoadingData(true);
    try {
      // 1. Synchronous local badge checks
      const localGrouped = getGroupedStudentBadges(effectiveUserId, effectiveSchoolId);
      const localRaw = getStudentBadges(effectiveUserId, effectiveSchoolId);

      // Build badge map for fast lookups
      const badgeMap = new Map<string, any>();
      (badges || []).forEach((b: any) => {
        if (b.id) badgeMap.set(b.id, b);
        if (b.badge?.id) badgeMap.set(b.badge.id, b.badge);
      });
      localGrouped.forEach((g: any) => {
        if (g.badge?.id) badgeMap.set(g.badge.id, g.badge);
      });

      // 2. Authoritative server fetch for badges
      let serverBadges: any[] = [];
      let serverAssignments: any[] = [];
      try {
        const result = await fetchStudentBadgesApi(effectiveSchoolId, effectiveUserId);
        serverBadges = result.badges || [];
        serverAssignments = result.assignments || [];
        serverBadges.forEach((b: any) => {
          if (b.id) badgeMap.set(b.id, b);
        });
      } catch (err) {
        // Fallback to local storage if offline
      }

      // Combine and normalize all assignments
      const combinedBadges: any[] = [];
      const seenAssignmentIds = new Set<string>();

      // Prioritize server assignments
      serverAssignments.forEach((a: any) => {
        if (a.id && !seenAssignmentIds.has(a.id)) {
          seenAssignmentIds.add(a.id);
          const bDef = badgeMap.get(a.badgeId);
          combinedBadges.push({
            ...a,
            badge: bDef,
            rarity: bDef?.rarity || a.rarity || 'Common',
          });
        }
      });

      // Supplement with local assignments
      localGrouped.forEach((g: any) => {
        if (Array.isArray(g.assignments)) {
          g.assignments.forEach((a: any) => {
            if (a.id && !seenAssignmentIds.has(a.id)) {
              seenAssignmentIds.add(a.id);
              combinedBadges.push({
                ...a,
                badge: g.badge,
                rarity: g.badge?.rarity || a.rarity || 'Common',
              });
            }
          });
        } else if (g.badge && !seenAssignmentIds.has(g.badge.id)) {
          seenAssignmentIds.add(g.badge.id);
          combinedBadges.push({
            badgeId: g.badge.id,
            badge: g.badge,
            rarity: g.badge?.rarity || 'Common',
          });
        }
      });

      // If props had badges, include them as well
      (badges || []).forEach((b: any) => {
        const id = b.id || b.badgeId || b.badge?.id;
        if (id && !seenAssignmentIds.has(id)) {
          seenAssignmentIds.add(id);
          combinedBadges.push(b);
        }
      });

      setLoadedBadges(combinedBadges);

      // 3. Authoritative server fetch for student rank and points from leaderboard
      try {
        const lbRes = await fetch(
          `/api/schools/${encodeURIComponent(effectiveSchoolId)}/leaderboard?studentId=${encodeURIComponent(effectiveUserId)}`,
          {
            headers: getAuthHeaders(effectiveSchoolId),
            credentials: 'include',
          }
        );

        if (lbRes.ok) {
          const lbData = await lbRes.json();
          let fetchedRank: number | null = null;
          let fetchedPoints: number = 0;

          if (typeof lbData?.currentStudent?.rank === 'number' && lbData.currentStudent.rank > 0) {
            fetchedRank = Number(lbData.currentStudent.rank);
            fetchedPoints = Number(lbData.currentStudent.points || 0);
          } else if (Array.isArray(lbData?.leaderboard)) {
            const found = lbData.leaderboard.find(
              (s: any) => s.studentId === effectiveUserId || s.id === effectiveUserId
            );
            if (found && typeof found.rank === 'number' && found.rank > 0) {
              fetchedRank = Number(found.rank);
              fetchedPoints = Number(found.points || 0);
            }
          }

          setCurrentRank(fetchedRank);
          setCurrentPoints(fetchedPoints);
        }
      } catch (err) {
        // Retain initialRank if available
      }
    } finally {
      setIsLoadingData(false);
    }
  }, [effectiveSchoolId, effectiveUserId, badges]);

  // Initial load
  useEffect(() => {
    loadStudentEligibilityData();
  }, [loadStudentEligibilityData]);

  // Badges & Rarity evaluation
  const { totalBadges, hasLegendaryBadge } = useMemo(() => {
    const list = Array.isArray(loadedBadges) && loadedBadges.length > 0 ? loadedBadges : (badges || []);
    const count = list.length;
    const hasLegendary = list.some((item) => {
      const rarity = (item.rarity || item.badge?.rarity || '').toString().toLowerCase().trim();
      return (
        rarity === 'legendary' ||
        rarity.includes('legend') ||
        rarity.includes('أسطور') ||
        rarity.includes('اسطور')
      );
    });
    return { totalBadges: count, hasLegendaryBadge: hasLegendary };
  }, [loadedBadges, badges]);

  // Auto-revocation check (Dynamic un-gain if student no longer satisfies conditions)
  useEffect(() => {
    if (isLoadingData) return;
    if (!savedThemeId || savedThemeId === DEFAULT_STUDENT_AVATAR_THEME_ID) return;

    const isEligible = isThemeUnlocked(savedThemeId, {
      totalBadges,
      hasLegendaryBadge,
      rank: currentRank,
      points: currentPoints,
    });

    if (!isEligible) {
      const revokedTheme = getStudentAvatarTheme(savedThemeId);
      setSelectedThemeId(DEFAULT_STUDENT_AVATAR_THEME_ID);
      setSavedThemeId(DEFAULT_STUDENT_AVATAR_THEME_ID);

      const notice = `تم إلغاء تفعيل سمة «${revokedTheme.name}» واسترجاع السمة الافتراضية تلقائياً؛ لعدم توفر الشروط حالياً (مثل التراجع في الترتيب أو عدم توفر نقاط إيجابية).`;
      setRevocationNotice(notice);

      // Auto-persist default theme to server and local session
      if (effectiveSchoolId && effectiveUserId) {
        fetch(
          `/api/schools/${encodeURIComponent(effectiveSchoolId)}/students/${encodeURIComponent(effectiveUserId)}/avatar-theme`,
          {
            method: 'PATCH',
            headers: {
              ...getAuthHeaders(effectiveSchoolId),
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ themeId: DEFAULT_STUDENT_AVATAR_THEME_ID }),
          }
        ).catch(() => {});

        const session = getStoredSession();
        if (session) {
          session.avatar_layout_uid = DEFAULT_STUDENT_AVATAR_THEME_ID;
          saveStoredSession(session);
        }

        window.dispatchEvent(
          new CustomEvent('student_avatar_updated', {
            detail: { themeId: DEFAULT_STUDENT_AVATAR_THEME_ID, studentId: effectiveUserId },
          })
        );
        window.dispatchEvent(new CustomEvent('school_data_changed'));
      }
    }
  }, [isLoadingData, savedThemeId, totalBadges, hasLegendaryBadge, currentRank, currentPoints, effectiveSchoolId, effectiveUserId]);

  // Selected Theme Details
  const selectedTheme = getStudentAvatarTheme(selectedThemeId);

  // Save selected theme to server
  const handleSave = async (themeToSave?: StudentAvatarThemeId | unknown) => {
    const targetTheme: StudentAvatarThemeId =
      typeof themeToSave === 'string' && isStudentAvatarThemeId(themeToSave)
        ? themeToSave
        : selectedThemeId;
    if (targetTheme === savedThemeId && !isSavedToast) return;
    if (!effectiveSchoolId || !effectiveUserId) {
      setSaveError('تعذر تحديد المدرسة أو حساب الطالب');
      return;
    }

    setSelectedThemeId(targetTheme);
    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(
        `/api/schools/${encodeURIComponent(effectiveSchoolId)}/students/${encodeURIComponent(effectiveUserId)}/avatar-theme`,
        {
          method: 'PATCH',
          headers: {
            ...getAuthHeaders(effectiveSchoolId),
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ themeId: targetTheme }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'فشل حفظ السمة المختارة');
      }

      const confirmedTheme: StudentAvatarThemeId = result.selectedTheme || targetTheme;

      // Update local states
      setSavedThemeId(confirmedTheme);
      setSelectedThemeId(confirmedTheme);
      setIsSavedToast(true);

      // 1. Synchronize active session in memory
      const session = getStoredSession();
      if (session) {
        session.avatar_layout_uid = confirmedTheme;
        saveStoredSession(session);
      }

      // Inform parent component
      if (onSaveSuccess) {
        onSaveSuccess(confirmedTheme);
      }

      // Broadcast globally for any active listeners (top navigation, community, profile cards)
      window.dispatchEvent(
        new CustomEvent('student_avatar_updated', {
          detail: { themeId: confirmedTheme, studentId: effectiveUserId },
        })
      );
      window.dispatchEvent(new CustomEvent('school_data_changed'));

      setTimeout(() => {
        setIsSavedToast(false);
      }, 3500);
    } catch (err: any) {
      setSaveError(err?.message || 'حدث خطأ أثناء حفظ السمة');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5 dir-rtl select-none">
      {/* Header Banner with Live Preview - Clean & Modern */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 border border-slate-800 rounded-2xl p-5 text-white shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            {/* Live Preview */}
            <div className="relative group shrink-0">
              <AvatarDisplay
                layoutUid={selectedTheme.id}
                name={userName}
                size="2xl"
                showGlow={true}
                className="border-2 border-white/20 transition-all duration-300 shadow-lg"
              />
            </div>

            <div className="space-y-1 text-right">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {selectedTheme.name}
                </h2>
                {savedThemeId === selectedTheme.id ? (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                    <span>السمة الحالية</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full">
                    معاينة
                  </span>
                )}
              </div>
              {selectedTheme.description && (
                <p className="text-xs text-slate-300 max-w-md line-clamp-1">
                  {selectedTheme.description}
                </p>
              )}
            </div>
          </div>

          {/* Action Button */}
          {selectedThemeId !== savedThemeId && (
            <div className="shrink-0 w-full sm:w-auto">
              <button
                onClick={() => handleSave(selectedThemeId)}
                disabled={isSaving}
                className={`w-full sm:w-auto py-2.5 px-5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md bg-blue-600 hover:bg-blue-500 text-white ${
                  isSaving ? 'opacity-75 cursor-wait' : ''
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <span>اعتماد السمة</span>
                )}
              </button>
            </div>
          )}

          {isSavedToast && selectedThemeId === savedThemeId && (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>تم الحفظ بنجاح</span>
            </div>
          )}
        </div>

        {saveError && (
          <div className="mt-3 flex items-center gap-1.5 text-rose-300 text-xs font-medium bg-rose-950/60 border border-rose-800/80 rounded-lg px-3 py-1.5 max-w-sm">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            <span>{saveError}</span>
          </div>
        )}
      </div>

      {/* Revocation Alert Banner (Shown when a student dropped rank/points and lost an honor theme) */}
      {revocationNotice && (
        <div className="bg-amber-50 border border-amber-200/90 text-amber-900 rounded-xl p-3 text-xs flex items-center justify-between gap-2.5 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-medium leading-relaxed">{revocationNotice}</span>
          </div>
          <button
            onClick={() => setRevocationNotice(null)}
            className="text-amber-700 hover:text-amber-900 font-bold text-base px-1.5 py-0.5 rounded cursor-pointer transition-colors"
            title="إغلاق التنبيه"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats Bar (Rank, Points & Badges) - Clean & Minimal */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-slate-700 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 font-medium">
          {/* Points counter pill */}
          <span className="px-2.5 py-1 bg-white border border-slate-200 text-emerald-700 rounded-lg flex items-center gap-1.5 shadow-2xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>النقاط: {currentPoints}</span>
          </span>

          {/* Badges counter pill */}
          <span className="px-2.5 py-1 bg-white border border-slate-200 text-purple-700 rounded-lg flex items-center gap-1.5 shadow-2xs">
            <Award className="w-3.5 h-3.5 text-purple-600" />
            <span>الأوسمة: {totalBadges}</span>
            {hasLegendaryBadge && (
              <span className="px-1 py-0.2 bg-amber-100 text-amber-800 text-[10px] rounded font-bold flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                <span>أسطوري</span>
              </span>
            )}
          </span>

          {/* School leaderboard rank pill */}
          {typeof currentRank === 'number' && currentRank > 0 && (
            <span
              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shadow-2xs ${
                currentRank === 1 && currentPoints > 0
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : currentRank <= 10 && currentPoints > 0
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : currentRank <= 100 && currentPoints > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              {currentRank === 1 && currentPoints > 0 ? (
                <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              ) : (
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>الترتيب: #{currentRank}</span>
            </span>
          )}
        </div>

        <button
          onClick={() => loadStudentEligibilityData()}
          disabled={isLoadingData}
          title="تحديث البيانات"
          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 rounded-md transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* The 5 Avatar Theme Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>سمات الهوية</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {ALL_STUDENT_AVATAR_THEMES.map((theme) => {
            const isUnlocked = isThemeUnlocked(theme.id, {
              totalBadges,
              hasLegendaryBadge,
              rank: currentRank,
              points: currentPoints,
            });
            const isSelected = selectedThemeId === theme.id;
            const isCurrentSaved = savedThemeId === theme.id;

            return (
              <div
                key={theme.id}
                onClick={() => {
                  if (isUnlocked) {
                    setSelectedThemeId(theme.id);
                    setSaveError(null);
                  }
                }}
                className={`relative rounded-xl p-3 border transition-all duration-150 flex flex-col items-center justify-between space-y-2.5 ${
                  isUnlocked ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-not-allowed opacity-75'
                } ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500/30'
                    : isUnlocked
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                {/* Top Status (Only when locked or active) */}
                <div className="w-full flex items-center justify-between min-h-[18px]">
                  {isCurrentSaved ? (
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-medium flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                      <span>الحالية</span>
                    </span>
                  ) : !isUnlocked ? (
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-medium flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" />
                      <span>مقفلة</span>
                    </span>
                  ) : (
                    <span />
                  )}
                </div>

                {/* Avatar Preview */}
                <div className="relative py-1">
                  <AvatarDisplay
                    layoutUid={theme.id}
                    name={userName}
                    size="lg"
                    showGlow={isSelected}
                    className="shadow-2xs"
                  />

                  {isSelected && (
                    <div className="absolute -top-1 -right-1 bg-blue-600 text-white p-0.5 rounded-full shadow border border-white">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-slate-900/40 rounded-xl backdrop-blur-2xs flex items-center justify-center">
                      <div className="bg-slate-900/80 p-1.5 rounded-lg text-white">
                        <Lock className="w-4 h-4 text-amber-400" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Theme Name & Lock Requirement (Only if locked) */}
                <div className="text-center w-full space-y-0.5">
                  <h4 className="font-bold text-xs text-slate-800 truncate">{theme.name}</h4>
                  <div className="min-h-[16px] flex items-center justify-center">
                    {!isUnlocked && (
                      <span className="text-[10px] text-amber-700 font-medium leading-tight line-clamp-1">
                        {theme.requirementText}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action button inside card */}
                <button
                  type="button"
                  disabled={!isUnlocked || isSaving}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isUnlocked) {
                      setSelectedThemeId(theme.id);
                      setSaveError(null);
                      if (theme.id !== savedThemeId) {
                        handleSave(theme.id);
                      }
                    }
                  }}
                  className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isCurrentSaved
                      ? 'bg-emerald-50 text-emerald-700 cursor-default'
                      : isSelected
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                      : isUnlocked
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isCurrentSaved
                    ? 'معتمدة'
                    : isSaving && selectedThemeId === theme.id
                    ? '...'
                    : isSelected
                    ? 'اعتماد'
                    : isUnlocked
                    ? 'اختيار'
                    : 'مقفلة'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
