import { useState, useEffect, useCallback, useRef } from 'react';
import type { SchoolExtension, FeatureLockStatus } from '../types/extensions.ts';
import { getStoredSession } from '../lib/storage.ts';

const DEFAULT_EXTENSIONS: SchoolExtension[] = [
  {
    id: 'student_features_control',
    schoolId: '',
    extensionId: 'student_features_control',
    isEnabled: true,
    name: 'التحكم في ميزات الطلاب',
    nameEn: 'Student Features Control',
    description: 'التحكم في تفعيل أو إيقاف الميزات التفاعلية المتاحة للطلاب مثل المجتمع المدرسي',
    icon: 'SlidersHorizontal',
    category: 'student',
    isSystemLocked: false,
    settings: {
      community_enabled: true,
    },
  },
];

export function useSchoolExtensions(schoolId?: string) {
  const [extensions, setExtensions] = useState<SchoolExtension[]>(() =>
    schoolId ? DEFAULT_EXTENSIONS.map((e) => ({ ...e, schoolId, id: `${schoolId}_${e.extensionId}` })) : []
  );
  const [features, setFeatures] = useState<Record<string, FeatureLockStatus>>({
    student_community: {
      enabled: true,
      extensionActive: true,
      extensionId: 'student_features_control',
    },
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const getAuthHeader = useCallback((): HeadersInit => {
    const session = getStoredSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (session?.sessionToken) {
      headers['Authorization'] = `Bearer ${session.sessionToken}`;
    }

    const role = session?.userRole || 'school_admin';
    headers['X-User-Role'] = role;

    const effSchoolId = schoolId || session?.schoolId;
    if (effSchoolId) {
      headers['X-School-Id'] = effSchoolId;
    }

    return headers;
  }, [schoolId]);

  const loadExtensions = useCallback(async () => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/extensions`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!isMountedRef.current) return;

      if (data.success && Array.isArray(data.extensions) && data.extensions.length > 0) {
        setExtensions(data.extensions);
      } else {
        // Fallback ensuring catalog is never empty
        setExtensions(DEFAULT_EXTENSIONS.map((e) => ({ ...e, schoolId, id: `${schoolId}_${e.extensionId}` })));
      }
    } catch (err: any) {
      console.warn('[useSchoolExtensions] Load error, using safe fallback:', err);
      if (!isMountedRef.current) return;
      // Provide default fallback on error so the dashboard never locks out the user
      setExtensions((prev) =>
        prev.length > 0
          ? prev
          : DEFAULT_EXTENSIONS.map((e) => ({ ...e, schoolId, id: `${schoolId}_${e.extensionId}` }))
      );
      setError('تعذر تحديث البيانات من الخادم، يتم استخدام الإعدادات الافتراضية.');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [schoolId, getAuthHeader]);

  const loadFeatureStatus = useCallback(async () => {
    if (!schoolId) return;
    try {
      const res = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/features/status`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (isMountedRef.current && data.success && data.features) {
        setFeatures(data.features);
      }
    } catch (err) {
      console.warn('[useSchoolExtensions] Feature status error:', err);
    }
  }, [schoolId, getAuthHeader]);

  const toggleExtension = async (extensionId: string, enabled: boolean): Promise<boolean> => {
    if (!schoolId) return false;

    // Optimistic UI update
    setExtensions((prev) =>
      prev.map((ext) => (ext.extensionId === extensionId ? { ...ext, isEnabled: enabled } : ext))
    );

    try {
      const res = await fetch(
        `/api/schools/${encodeURIComponent(schoolId)}/extensions/${encodeURIComponent(extensionId)}`,
        {
          method: 'PATCH',
          headers: getAuthHeader(),
          body: JSON.stringify({ isEnabled: enabled }),
        }
      );
      const data = await res.json();
      if (data.success && data.extension) {
        setExtensions((prev) =>
          prev.map((ext) => (ext.extensionId === extensionId ? { ...ext, ...data.extension } : ext))
        );
        loadFeatureStatus();
        return true;
      } else {
        // Revert on failure
        loadExtensions();
        setError(data.error || 'فشل تحديث حالة الإضافة');
        return false;
      }
    } catch (err) {
      loadExtensions();
      setError('فشل الاتصال بالخادم لتحديث الإضافة');
      return false;
    }
  };

  const updateExtensionSettings = async (
    extensionId: string,
    settings: Record<string, any>
  ): Promise<boolean> => {
    if (!schoolId) return false;

    // Optimistic UI update
    setExtensions((prev) =>
      prev.map((ext) =>
        ext.extensionId === extensionId
          ? { ...ext, settings: { ...(ext.settings || {}), ...settings } }
          : ext
      )
    );

    try {
      const res = await fetch(
        `/api/schools/${encodeURIComponent(schoolId)}/extensions/${encodeURIComponent(extensionId)}`,
        {
          method: 'PATCH',
          headers: getAuthHeader(),
          body: JSON.stringify({ settings }),
        }
      );
      const data = await res.json();
      if (data.success && data.extension) {
        setExtensions((prev) =>
          prev.map((ext) => (ext.extensionId === extensionId ? { ...ext, ...data.extension } : ext))
        );
        loadFeatureStatus();
        return true;
      } else {
        loadExtensions();
        setError(data.error || 'فشل حفظ إعدادات الإضافة');
        return false;
      }
    } catch (err) {
      loadExtensions();
      setError('فشل الاتصال بالخادم لحفظ الإعدادات');
      return false;
    }
  };

  useEffect(() => {
    if (schoolId) {
      loadExtensions();
      loadFeatureStatus();
    }
  }, [schoolId, loadExtensions, loadFeatureStatus]);

  const isFeatureEnabled = useCallback(
    (featureKey: string): boolean => {
      if (features[featureKey]) {
        return features[featureKey].enabled;
      }
      // Fallback check from extensions state
      if (featureKey === 'student_community') {
        const studentExt = extensions.find((e) => e.extensionId === 'student_features_control');
        if (!studentExt) return true; // Default enabled
        return studentExt.isEnabled && (studentExt.settings?.community_enabled !== false);
      }
      return true;
    },
    [features, extensions]
  );

  return {
    extensions,
    features,
    isLoading,
    error,
    refresh: loadExtensions,
    toggleExtension,
    updateExtensionSettings,
    isFeatureEnabled,
  };
}
