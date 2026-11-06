import type express from 'express';
import { checkSchoolFeatureState } from './schoolExtensionsService.ts';
import type { AuthenticatedUserSession } from './serverAuth.ts';

/**
 * Middleware factory that enforces feature lock state server-side.
 * Runs AFTER session authentication and tenant verification.
 * 
 * Strict Security Rules:
 * - Uses solely the authenticated server session for user identity and role.
 * - Enforces school boundary: session.schoolId must match route param schoolId (unless owner).
 * - Blocks forbidden/locked features with HTTP 403 and code FEATURE_LOCKED.
 */
export function requireSchoolFeature(featureKey: string) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const session = (req as any).user as AuthenticatedUserSession | undefined;

    // 1. Session must be present and authenticated
    if (!session || !session.isAuthenticated) {
      return res.status(401).json({
        success: false,
        error: 'غير مصرح: يرجى تسجيل الدخول أولاً للوصول إلى هذه الميزة',
      });
    }

    // 2. Strict Tenant Authorization: Determine and verify target school
    const routeSchoolId = req.params.schoolId;
    if (!routeSchoolId) {
      return res.status(400).json({
        success: false,
        error: 'معرف المدرسة مفقود في الطلب',
      });
    }

    if (session.userRole !== 'owner' && session.schoolId && session.schoolId !== routeSchoolId) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح: لا تملك صلاحية الوصول لهذه المدرسة',
      });
    }

    const schoolId = routeSchoolId;
    const userRole = session.userRole;

    try {
      const status = await checkSchoolFeatureState(schoolId, featureKey, userRole);
      if (!status.isAllowed) {
        return res.status(403).json({
          success: false,
          code: 'FEATURE_LOCKED',
          error: status.lockReason || 'تم قفل هذه الميزة مؤقتًا',
          feature: featureKey,
        });
      }

      next();
    } catch (error: any) {
      console.error(`[requireSchoolFeature Error for ${featureKey}]:`, error);
      // In case of internal check failure, fall back to safe error response
      return res.status(500).json({
        success: false,
        error: 'تعذر التحقق من حالة تفعيل الميزة',
      });
    }
  };
}
