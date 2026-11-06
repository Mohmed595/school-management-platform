import type { Request, Response, NextFunction } from 'express';

// Configuration tuned for school environments (handling full computer labs & cellular gateways)
const IP_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const IP_MAX_ATTEMPTS = 300; // Allow full classroom / school lab behind single NAT IP
const ACCOUNT_MAX_FAILED = 5; // 5 failed attempts per specific account triggers temporary cooldown
const ACCOUNT_LOCKOUT_MS = 15 * 60 * 1000; // 15-minute temporary lockout for targeted account

const VERIFY_SESSION_WINDOW_MS = 60 * 1000; // 1 minute
const VERIFY_SESSION_MAX_REQUESTS = 300; // Max 300 session verifications per minute per IP (safe for school labs)

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  lockoutUntil: number | null;
}

const ipAttempts = new Map<string, AttemptRecord>();
const identifierAttempts = new Map<string, AttemptRecord>();
const verifySessionIpCounts = new Map<string, { count: number; windowStart: number }>();

/**
 * Extracts client IP safely across proxies and load balancers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

/**
 * Normalizes an account/credential identifier key for rate tracking
 */
export function buildIdentifierKey(scope: 'admin' | 'staff' | 'student' | 'session' | 'owner', rawKey: string): string {
  return `${scope}:${rawKey.trim().toLowerCase()}`;
}

/**
 * Checks whether an incoming authentication request is allowed
 */
export function checkAuthRateLimit(
  req: Request,
  identifierKey?: string
): { allowed: boolean; status?: number; error?: string; retryAfterSeconds?: number } {
  const now = Date.now();
  const ip = getClientIp(req);

  // 1. Check IP-based rate limit
  const ipRecord = ipAttempts.get(ip);
  if (ipRecord) {
    if (now - ipRecord.firstAttemptAt > IP_WINDOW_MS) {
      // Window expired, reset
      ipAttempts.delete(ip);
    } else if (ipRecord.lockoutUntil && now < ipRecord.lockoutUntil) {
      const retryAfterSeconds = Math.max(1, Math.ceil((ipRecord.lockoutUntil - now) / 1000));
      return {
        allowed: false,
        status: 429,
        error: 'تم تجاوز الحد المسموح من محاولات تسجيل الدخول لهذا العنوان. يرجى الانتظار 15 دقيقة قبل إعادة المحاولة.',
        retryAfterSeconds,
      };
    } else if (ipRecord.count >= IP_MAX_ATTEMPTS) {
      // Apply IP lockout
      ipRecord.lockoutUntil = now + IP_WINDOW_MS;
      return {
        allowed: false,
        status: 429,
        error: 'تم تجاوز الحد المسموح من محاولات تسجيل الدخول لهذا العنوان. يرجى الانتظار 15 دقيقة قبل إعادة المحاولة.',
        retryAfterSeconds: Math.ceil(IP_WINDOW_MS / 1000),
      };
    }
  }

  // 2. Check Identifier-based lockout (Account/Code specific)
  if (identifierKey) {
    const idRecord = identifierAttempts.get(identifierKey);
    if (idRecord) {
      if (idRecord.lockoutUntil && now < idRecord.lockoutUntil) {
        const retryAfterSeconds = Math.max(1, Math.ceil((idRecord.lockoutUntil - now) / 1000));
        return {
          allowed: false,
          status: 429,
          error: 'تم إيقاف المحاولات مؤقتاً لهذا الحساب لكثرة المحاولات غير الصحيحة. يرجى الانتظار 15 دقيقة قبل إعادة المحاولة.',
          retryAfterSeconds,
        };
      } else if (idRecord.lockoutUntil && now >= idRecord.lockoutUntil) {
        // Lockout expired, reset attempt record
        identifierAttempts.delete(identifierKey);
      }
    }
  }

  return { allowed: true };
}

/**
 * Records a failed authentication attempt for both IP and Identifier
 */
export function recordAuthFailure(req: Request, identifierKey?: string): void {
  const now = Date.now();
  const ip = getClientIp(req);

  // Update IP tracking
  const ipRecord = ipAttempts.get(ip);
  if (!ipRecord || now - ipRecord.firstAttemptAt > IP_WINDOW_MS) {
    ipAttempts.set(ip, {
      count: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
      lockoutUntil: null,
    });
  } else {
    ipRecord.count += 1;
    ipRecord.lastAttemptAt = now;
  }

  // Update Identifier tracking
  if (identifierKey) {
    const idRecord = identifierAttempts.get(identifierKey);
    if (!idRecord || now - idRecord.firstAttemptAt > IP_WINDOW_MS) {
      identifierAttempts.set(identifierKey, {
        count: 1,
        firstAttemptAt: now,
        lastAttemptAt: now,
        lockoutUntil: null,
      });
    } else {
      idRecord.count += 1;
      idRecord.lastAttemptAt = now;
      if (idRecord.count >= ACCOUNT_MAX_FAILED) {
        idRecord.lockoutUntil = now + ACCOUNT_LOCKOUT_MS;
      }
    }
  }
}

/**
 * Records a successful authentication, clearing account-level lockout & failed counts
 */
export function recordAuthSuccess(req: Request, identifierKey?: string): void {
  if (identifierKey) {
    identifierAttempts.delete(identifierKey);
  }

  // Soften IP count on success
  const ip = getClientIp(req);
  const ipRecord = ipAttempts.get(ip);
  if (ipRecord && ipRecord.count > 0) {
    ipRecord.count = Math.max(0, ipRecord.count - 2);
  }
}

/**
 * Rate limit checker for Session Verification (`/api/auth/verify-session`)
 */
export function checkVerifySessionRateLimit(req: Request): { allowed: boolean; status?: number; error?: string } {
  const now = Date.now();
  const ip = getClientIp(req);
  const entry = verifySessionIpCounts.get(ip);

  if (!entry || now - entry.windowStart > VERIFY_SESSION_WINDOW_MS) {
    verifySessionIpCounts.set(ip, { count: 1, windowStart: now });
    return { allowed: true };
  }

  entry.count += 1;
  if (entry.count > VERIFY_SESSION_MAX_REQUESTS) {
    return {
      allowed: false,
      status: 429,
      error: 'تم تجاوز معدل التحقق من الجلسات المسموح به. يرجى الانتظار قليلاً.',
    };
  }

  return { allowed: true };
}

// Periodic cleanup of expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();

  for (const [ip, rec] of ipAttempts.entries()) {
    if (now - rec.firstAttemptAt > IP_WINDOW_MS && (!rec.lockoutUntil || now >= rec.lockoutUntil)) {
      ipAttempts.delete(ip);
    }
  }

  for (const [key, rec] of identifierAttempts.entries()) {
    if (now - rec.firstAttemptAt > IP_WINDOW_MS && (!rec.lockoutUntil || now >= rec.lockoutUntil)) {
      identifierAttempts.delete(key);
    }
  }

  for (const [ip, entry] of verifySessionIpCounts.entries()) {
    if (now - entry.windowStart > VERIFY_SESSION_WINDOW_MS) {
      verifySessionIpCounts.delete(ip);
    }
  }
}, 5 * 60 * 1000);
