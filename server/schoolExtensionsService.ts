import { db, createPool } from '../src/db/index.ts';
import { systemExtensionsTable, schoolExtensionsTable, schoolInfoTable } from '../src/db/schema.ts';
import { eq, and, sql } from 'drizzle-orm';
import type { SystemExtension, SchoolExtension, FeatureLockStatus } from '../src/types/extensions.ts';

// Bounded in-memory server cache
interface CacheEntry {
  extensions: SchoolExtension[];
  expiresAt: number;
}

const schoolExtensionsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

export function invalidateSchoolExtensionsCache(schoolId: string): void {
  schoolExtensionsCache.delete(schoolId);
}

// Initial System Extension Catalog
export const REGISTERED_EXTENSIONS: Array<Omit<SystemExtension, 'createdAt' | 'updatedAt'>> = [
  {
    id: 'student_features_control',
    name: 'التحكم في ميزات الطلاب',
    nameEn: 'Student Features Control',
    description: 'التحكم في تفعيل أو إيقاف الميزات التفاعلية المتاحة للطلاب مثل المجتمع المدرسي',
    icon: 'SlidersHorizontal',
    category: 'student',
    defaultEnabled: true,
    isSystemLocked: false,
    defaultSettings: {
      community_enabled: true,
    },
  },
];

/**
 * Initializes tables and seeds the global extensions catalog idempotently.
 */
export async function initializeExtensionsDatabase(): Promise<void> {
  try {
    // Seed Registered Catalog using Drizzle ORM
    for (const ext of REGISTERED_EXTENSIONS) {
      const record = {
        id: ext.id,
        name: ext.name,
        nameEn: ext.nameEn || null,
        description: ext.description,
        icon: ext.icon,
        category: ext.category,
        defaultEnabled: ext.defaultEnabled,
        isSystemLocked: ext.isSystemLocked,
        defaultSettings: ext.defaultSettings || {},
      };

      await db
        .insert(systemExtensionsTable)
        .values(record)
        .onConflictDoUpdate({
          target: systemExtensionsTable.id,
          set: {
            name: record.name,
            nameEn: record.nameEn,
            description: record.description,
            icon: record.icon,
            category: record.category,
            defaultEnabled: record.defaultEnabled,
            defaultSettings: record.defaultSettings,
            updatedAt: new Date(),
          },
        });
    }
  } catch (error) {
    console.warn('[DB Extensions Catalog Seed Info]:', (error as any)?.message || error);
  }
}

/**
 * Get all registered system extensions catalog
 */
export async function getRegisteredSystemExtensions(): Promise<SystemExtension[]> {
  try {
    const rows = await db.select().from(systemExtensionsTable);
    if (rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        nameEn: r.nameEn || undefined,
        description: r.description,
        icon: r.icon,
        category: r.category,
        defaultEnabled: r.defaultEnabled,
        isSystemLocked: r.isSystemLocked,
        defaultSettings: (r.defaultSettings as Record<string, any>) || {},
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : undefined,
      }));
    }
  } catch (error) {
    console.warn('[getRegisteredSystemExtensions fallback to static catalog]:', error);
  }

  return REGISTERED_EXTENSIONS.map((e) => ({
    ...e,
    defaultSettings: e.defaultSettings || {},
  }));
}

/**
 * Get extensions state for a school.
 * Merges system extension definitions with school-specific overrides.
 * Fallback to defaults ensures existing and newly registered schools have community & extensions active.
 */
export async function getSchoolExtensions(schoolId: string, bypassCache = false): Promise<SchoolExtension[]> {
  if (!bypassCache) {
    const cached = schoolExtensionsCache.get(schoolId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.extensions;
    }
  }

  const systemCatalog = await getRegisteredSystemExtensions();
  let schoolRows: any[] = [];

  try {
    schoolRows = await db
      .select()
      .from(schoolExtensionsTable)
      .where(eq(schoolExtensionsTable.schoolId, schoolId));
  } catch (err) {
    console.warn(`[getSchoolExtensions query warning for school ${schoolId}]:`, err);
  }

  const schoolOverridesMap = new Map<string, any>();
  for (const row of schoolRows) {
    schoolOverridesMap.set(row.extensionId, row);
  }

  const result: SchoolExtension[] = systemCatalog.map((sysExt) => {
    const override = schoolOverridesMap.get(sysExt.id);
    if (override) {
      return {
        id: override.id,
        schoolId,
        extensionId: sysExt.id,
        isEnabled: Boolean(override.isEnabled),
        settings: {
          ...sysExt.defaultSettings,
          ...(override.settings || {}),
        },
        activatedAt: override.activatedAt ? new Date(override.activatedAt).toISOString() : undefined,
        updatedAt: override.updatedAt ? new Date(override.updatedAt).toISOString() : undefined,
        updatedBy: override.updatedBy || undefined,
        name: sysExt.name,
        nameEn: sysExt.nameEn,
        description: sysExt.description,
        icon: sysExt.icon,
        category: sysExt.category,
        isSystemLocked: sysExt.isSystemLocked,
      };
    }

    // Default state for schools without custom row (active with default settings)
    return {
      id: `${schoolId}_${sysExt.id}`,
      schoolId,
      extensionId: sysExt.id,
      isEnabled: sysExt.defaultEnabled,
      settings: { ...sysExt.defaultSettings },
      name: sysExt.name,
      nameEn: sysExt.nameEn,
      description: sysExt.description,
      icon: sysExt.icon,
      category: sysExt.category,
      isSystemLocked: sysExt.isSystemLocked,
    };
  });

  schoolExtensionsCache.set(schoolId, {
    extensions: result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return result;
}

/**
 * Get a single extension by ID for a school
 */
export async function getSchoolExtension(schoolId: string, extensionId: string): Promise<SchoolExtension | null> {
  const all = await getSchoolExtensions(schoolId);
  return all.find((e) => e.extensionId === extensionId) || null;
}

/**
 * Validate settings payload according to extension rules
 */
export function validateExtensionSettings(extensionId: string, settings: Record<string, any>): { valid: boolean; error?: string } {
  if (typeof settings !== 'object' || settings === null || Array.isArray(settings)) {
    return { valid: false, error: 'يجب أن تكون الإعدادات كائناً برمجياً صالحاً' };
  }

  if (extensionId === 'student_features_control') {
    if (settings.community_enabled !== undefined && typeof settings.community_enabled !== 'boolean') {
      return { valid: false, error: 'خاصية community_enabled يجب أن تكون قيمة منطقية (صواب/خطأ)' };
    }
  }

  return { valid: true };
}

/**
 * Update school extension state & settings atomically in PostgreSQL
 */
export async function updateSchoolExtension(
  schoolId: string,
  extensionId: string,
  updates: {
    isEnabled?: boolean;
    settings?: Record<string, any>;
    updatedBy?: string;
  }
): Promise<SchoolExtension> {
  // 1. Verify extension exists in system catalog
  const systemCatalog = await getRegisteredSystemExtensions();
  const systemDef = systemCatalog.find((e) => e.id === extensionId);
  if (!systemDef) {
    throw new Error(`الامتداد المطلوب غير مسجل بالنظام: ${extensionId}`);
  }

  // 2. Fetch current state
  const currentExt = await getSchoolExtension(schoolId, extensionId);
  const currentEnabled = currentExt ? currentExt.isEnabled : systemDef.defaultEnabled;
  const targetEnabled = updates.isEnabled !== undefined ? updates.isEnabled : currentEnabled;

  // 3. Rule: If settings provided, extension must be enabled
  if (updates.settings !== undefined) {
    if (!targetEnabled) {
      throw new Error('لا يمكن تعديل إعدادات الامتداد عندما يكون الامتداد معطلاً. يرجى تفعيل الامتداد أولاً.');
    }
    const validation = validateExtensionSettings(extensionId, updates.settings);
    if (!validation.valid) {
      throw new Error(validation.error || 'إعدادات غير صالحة');
    }
  }

  const mergedSettings = {
    ...systemDef.defaultSettings,
    ...(currentExt?.settings || {}),
    ...(updates.settings || {}),
  };

  const rowId = `${schoolId}_${extensionId}`;
  const now = new Date();

  // 4. Atomic PostgreSQL Upsert
  await db
    .insert(schoolExtensionsTable)
    .values({
      id: rowId,
      schoolId,
      extensionId,
      isEnabled: targetEnabled,
      settings: mergedSettings,
      updatedAt: now,
      updatedBy: updates.updatedBy || 'admin',
    })
    .onConflictDoUpdate({
      target: [schoolExtensionsTable.schoolId, schoolExtensionsTable.extensionId],
      set: {
        isEnabled: targetEnabled,
        settings: mergedSettings,
        updatedAt: now,
        updatedBy: updates.updatedBy || 'admin',
      },
    });

  // 5. Invalidate server cache
  invalidateSchoolExtensionsCache(schoolId);

  // 6. Return confirmed state from database
  const confirmed = await getSchoolExtension(schoolId, extensionId);
  if (!confirmed) {
    throw new Error('تعذر قراءة حالة الامتداد بعد التحديث');
  }

  return confirmed;
}

/**
 * Check authoritative access for a specific school feature
 */
export async function checkSchoolFeatureState(
  schoolId: string,
  featureKey: string,
  userRole?: string
): Promise<{ isAllowed: boolean; lockReason?: string; extensionActive: boolean }> {
  // Staff (owner, school_admin, admin, teacher, attendance_teacher) are never locked out of Student Features
  if (
    userRole === 'owner' ||
    userRole === 'school_admin' ||
    userRole === 'admin' ||
    userRole === 'teacher' ||
    userRole === 'attendance_teacher'
  ) {
    return { isAllowed: true, extensionActive: true };
  }

  if (featureKey === 'student_community') {
    const ext = await getSchoolExtension(schoolId, 'student_features_control');
    if (!ext) {
      return { isAllowed: true, extensionActive: true };
    }

    if (!ext.isEnabled) {
      return {
        isAllowed: false,
        lockReason: 'تم قفل هذه الميزة مؤقتًا',
        extensionActive: false,
      };
    }

    const isCommunityEnabled = ext.settings?.community_enabled !== false;
    if (!isCommunityEnabled) {
      return {
        isAllowed: false,
        lockReason: 'تم قفل هذه الميزة مؤقتًا',
        extensionActive: true,
      };
    }

    return { isAllowed: true, extensionActive: true };
  }

  return { isAllowed: true, extensionActive: true };
}

/**
 * Get comprehensive feature status summary for frontend consumption
 */
export async function getSchoolFeaturesSummary(
  schoolId: string,
  userRole?: string
): Promise<Record<string, FeatureLockStatus>> {
  const ext = await getSchoolExtension(schoolId, 'student_features_control');
  const extensionActive = ext ? ext.isEnabled : true;
  const isCommunityEnabled = extensionActive && (ext ? ext.settings?.community_enabled !== false : true);

  return {
    student_community: {
      enabled: isCommunityEnabled,
      lockReason: isCommunityEnabled ? undefined : 'تم قفل هذه الميزة مؤقتًا',
      extensionActive,
      extensionId: 'student_features_control',
    },
  };
}
