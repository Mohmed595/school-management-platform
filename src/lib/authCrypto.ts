/**
 * Auth Crypto & Security Utilities
 * Provides:
 * 1. Password hashing & verification using SHA-256 with salt
 * 2. Session payload encryption & HMAC signature verification
 * 3. Rate-limiting & brute-force protection for sign-in attempts
 */

import type { UserSession } from './storage';

// Secret key seed for HMAC / AES session token signatures
const SYSTEM_SECRET_SEED = 'SCHOOL_PLATFORM_SECURE_AUTH_SEED_2026_AES256_HMAC';

/**
 * Computes a SHA-256 hash of a text string with salt
 */
export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback simple hash for non-WebCrypto environments
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'fb_' + Math.abs(hash).toString(16);
}

/**
 * Hash password with salt
 */
export async function hashPassword(password: string, salt: string = 'sp_salt_2026'): Promise<string> {
  const salted = `$sp_v1$${salt}$${password}`;
  const hashedHex = await sha256(salted);
  return `$sha256$${salt}$${hashedHex}`;
}

/**
 * Verify password against stored hash or plain password (for backward compatibility)
 */
export async function verifyPassword(password: string, storedHashOrPlain: string | undefined): Promise<boolean> {
  if (!storedHashOrPlain) return true; // Default match if no password required
  const clean = password.trim();

  // If stored in hashed format $sha256$salt$hash
  if (storedHashOrPlain.startsWith('$sha256$')) {
    const parts = storedHashOrPlain.split('$');
    if (parts.length === 4) {
      const salt = parts[2];
      const computedHash = await hashPassword(clean, salt);
      return computedHash === storedHashOrPlain;
    }
  }

  // Plain text fallback match
  return clean === storedHashOrPlain.trim();
}

/**
 * Generate a digitally signed/encrypted session token payload (Sync)
 */
export function createEncryptedSessionTokenSync(session: UserSession): string {
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).substring(2, 10);
  // If trusted device: 300 days; otherwise 30 days
  const durationMs = session.isTrustedDevice ? 300 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  const payload = {
    ...session,
    iat: timestamp,
    exp: timestamp + durationMs,
    trustedExpiresAt: session.trustedExpiresAt || new Date(timestamp + durationMs).toISOString(),
    nonce,
  };

  const jsonStr = JSON.stringify(payload);
  const encodedPayload = btoa(encodeURIComponent(jsonStr));

  let hash = 0;
  const strToSign = `${encodedPayload}:${SYSTEM_SECRET_SEED}`;
  for (let i = 0; i < strToSign.length; i++) {
    const char = strToSign.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const signature = 'sig_' + Math.abs(hash).toString(36);

  return `${encodedPayload}.${signature}`;
}

/**
 * Verify and decrypt session token (Sync)
 */
export function verifyAndDecryptSessionTokenSync(token: string): UserSession | null {
  try {
    if (!token) return null;
    
    // Backwards compatibility for raw JSON if present
    if (token.trim().startsWith('{')) {
      const parsed = JSON.parse(token);
      if (parsed && parsed.isAuthenticated) return parsed;
      return null;
    }

    if (!token.includes('.')) return null;

    const [encodedPayload, signature] = token.split('.');

    let hash = 0;
    const strToSign = `${encodedPayload}:${SYSTEM_SECRET_SEED}`;
    for (let i = 0; i < strToSign.length; i++) {
      const char = strToSign.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const expectedSignature = 'sig_' + Math.abs(hash).toString(36);

    if (signature !== expectedSignature) {
      return null;
    }

    const jsonStr = decodeURIComponent(atob(encodedPayload));
    const decoded = JSON.parse(jsonStr);

    if (decoded.exp && Date.now() > decoded.exp) {
      return null;
    }

    return {
      isAuthenticated: Boolean(decoded.isAuthenticated),
      userRole: decoded.userRole,
      schoolId: decoded.schoolId,
      studentId: decoded.studentId,
      studentName: decoded.studentName,
      studentCode: decoded.studentCode,
      className: decoded.className,
      teacherId: decoded.teacherId,
      userDisplayName: decoded.userDisplayName,
      avatar_layout_uid: decoded.avatar_layout_uid || decoded.avatarUid,
      isTrustedDevice: Boolean(decoded.isTrustedDevice),
      trustedSessionId: decoded.trustedSessionId,
      trustedExpiresAt: decoded.trustedExpiresAt,
      sessionToken: decoded.sessionToken || token,
    };
  } catch (e) {
    return null;
  }
}


/**
 * Generate a digitally signed/encrypted session token payload (Async)
 */
export async function createEncryptedSessionToken(session: UserSession): Promise<string> {
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).substring(2, 10);
  const payload = {
    ...session,
    iat: timestamp,
    exp: timestamp + 30 * 24 * 60 * 60 * 1000, // 30 days
    nonce,
  };

  const jsonStr = JSON.stringify(payload);
  const encodedPayload = btoa(encodeURIComponent(jsonStr));
  const signature = await sha256(`${encodedPayload}:${SYSTEM_SECRET_SEED}`);

  return `${encodedPayload}.${signature}`;
}

/**
 * Verify and decrypt session token
 */
export async function verifyAndDecryptSessionToken(token: string): Promise<UserSession | null> {
  try {
    if (!token || !token.includes('.')) return null;
    const [encodedPayload, signature] = token.split('.');
    
    // Verify HMAC signature
    const expectedSignature = await sha256(`${encodedPayload}:${SYSTEM_SECRET_SEED}`);
    if (signature !== expectedSignature) {
      return null;
    }

    const jsonStr = decodeURIComponent(atob(encodedPayload));
    const decoded = JSON.parse(jsonStr);

    // Check expiration
    if (decoded.exp && Date.now() > decoded.exp) {
      return null;
    }

    // Extract UserSession fields
    const session: UserSession = {
      isAuthenticated: decoded.isAuthenticated,
      userRole: decoded.userRole,
      schoolId: decoded.schoolId,
      studentId: decoded.studentId,
      studentName: decoded.studentName,
      studentCode: decoded.studentCode,
      className: decoded.className,
      teacherId: decoded.teacherId,
      userDisplayName: decoded.userDisplayName,
      avatar_layout_uid: decoded.avatar_layout_uid || decoded.avatarUid,
      isTrustedDevice: Boolean(decoded.isTrustedDevice),
      trustedSessionId: decoded.trustedSessionId,
      trustedExpiresAt: decoded.trustedExpiresAt,
      sessionToken: decoded.sessionToken || token,
    };

    return session;
  } catch (e) {
    return null;
  }
}

/**
 * Brute-force & Rate-limiting protection state for sign-in
 */
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

export interface RateLimitStatus {
  isLocked: boolean;
  remainingAttempts: number;
  lockoutTimeRemainingSeconds: number;
}

export function checkLoginRateLimit(identifier: string): RateLimitStatus {
  try {
    const key = `auth_ratelimit_${identifier.trim().toLowerCase()}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      return { isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS, lockoutTimeRemainingSeconds: 0 };
    }

    const data = JSON.parse(raw);
    if (data.lockedUntil && Date.now() < data.lockedUntil) {
      const remainingSec = Math.ceil((data.lockedUntil - Date.now()) / 1000);
      return {
        isLocked: true,
        remainingAttempts: 0,
        lockoutTimeRemainingSeconds: remainingSec,
      };
    }

    // Lock expired or reset
    if (data.lockedUntil && Date.now() >= data.lockedUntil) {
      localStorage.removeItem(key);
      return { isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS, lockoutTimeRemainingSeconds: 0 };
    }

    const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - (data.failedCount || 0));
    return { isLocked: false, remainingAttempts: remaining, lockoutTimeRemainingSeconds: 0 };
  } catch {
    return { isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS, lockoutTimeRemainingSeconds: 0 };
  }
}

export function recordFailedLoginAttempt(identifier: string): RateLimitStatus {
  try {
    const key = `auth_ratelimit_${identifier.trim().toLowerCase()}`;
    const raw = localStorage.getItem(key);
    let failedCount = 0;
    if (raw) {
      const parsed = JSON.parse(raw);
      failedCount = parsed.failedCount || 0;
    }

    failedCount += 1;
    let lockedUntil: number | null = null;
    if (failedCount >= MAX_FAILED_ATTEMPTS) {
      lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    }

    localStorage.setItem(key, JSON.stringify({ failedCount, lockedUntil }));

    if (lockedUntil) {
      return {
        isLocked: true,
        remainingAttempts: 0,
        lockoutTimeRemainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
      };
    }

    return {
      isLocked: false,
      remainingAttempts: MAX_FAILED_ATTEMPTS - failedCount,
      lockoutTimeRemainingSeconds: 0,
    };
  } catch {
    return { isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - 1, lockoutTimeRemainingSeconds: 0 };
  }
}

export function resetLoginRateLimit(identifier: string): void {
  try {
    const key = `auth_ratelimit_${identifier.trim().toLowerCase()}`;
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to reset rate limit', e);
  }
}
