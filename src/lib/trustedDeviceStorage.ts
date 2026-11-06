import { UserRole, TrustedDeviceSession, SavedAccountItem, TrustedDeviceInfo } from '../types/auth';
import { getStoredSession, getStoredAuth, UserSession } from './storage';

const DEVICE_ID_KEY = 'eg_trusted_device_id_v1';
const SAVED_ACCOUNTS_KEY = 'eg_trusted_accounts_v1';
const ACTIVE_SAVED_SESSION_ID_KEY = 'eg_active_saved_session_id_v1';

/**
 * Check if a saved account matches the currently authenticated active session
 */
export function isAccountCurrentSession(acc: SavedAccountItem, currentSession?: UserSession | null): boolean {
  const isAuth = getStoredAuth();
  if (!isAuth) return false;

  const session = currentSession !== undefined ? currentSession : getStoredSession();
  if (!session || !session.isAuthenticated) return false;

  // 1. Direct trustedSessionId match
  if (session.trustedSessionId && acc.sessionId === session.trustedSessionId) {
    return true;
  }

  // 2. Token exact match
  if (session.sessionToken && acc.sessionToken && session.sessionToken === acc.sessionToken) {
    return true;
  }

  // 3. Match by User Role & School ID & Specific Identifiers
  if (session.userRole === acc.userRole) {
    // For Parent / Student
    if (session.userRole === 'parent') {
      if (session.studentId && (acc.studentId === session.studentId || acc.userId === session.studentId)) {
        return true;
      }
      if (session.studentCode && acc.studentCode && session.studentCode === acc.studentCode) {
        return true;
      }
      if (session.studentName && acc.studentName && session.studentName === acc.studentName) {
        return true;
      }
      if (session.userDisplayName && acc.userDisplayName && session.userDisplayName === acc.userDisplayName) {
        return true;
      }
    }
    // For Teachers / Attendance Teachers
    else if (session.userRole === 'teacher' || session.userRole === 'attendance_teacher') {
      if (session.schoolId === acc.schoolId) {
        if (session.teacherId && (acc.userId === session.teacherId || acc.sessionId === session.teacherId)) {
          return true;
        }
        if (session.userDisplayName && acc.userDisplayName && session.userDisplayName === acc.userDisplayName) {
          return true;
        }
      }
    }
    // For School Admins
    else if (session.userRole === 'school_admin') {
      if (session.schoolId === acc.schoolId) {
        return true;
      }
    }
    // For Owners
    else if (session.userRole === 'owner') {
      return true;
    }
  }

  return false;
}

/**
 * Generate or retrieve a persistent cryptographically random device ID.
 * Does NOT rely on invasive fingerprinting.
 */
export function getOrCreateDeviceId(): string {
  try {
    let devId = localStorage.getItem(DEVICE_ID_KEY);
    if (!devId || devId.trim().length < 10) {
      const randomBytes = new Uint8Array(16);
      if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(randomBytes);
      } else {
        for (let i = 0; i < 16; i++) {
          randomBytes[i] = Math.floor(Math.random() * 256);
        }
      }
      const hex = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
      devId = `dev_${Date.now().toString(36)}_${hex.slice(0, 16)}`;
      localStorage.setItem(DEVICE_ID_KEY, devId);
    }
    return devId;
  } catch (e) {
    return 'dev_fallback_' + Math.random().toString(36).substring(2, 12);
  }
}

/**
 * Helper to calculate remaining days out of 300 days
 */
export function calculateRemainingDays(expiresAt: string): number {
  try {
    const exp = new Date(expiresAt).getTime();
    const now = Date.now();
    const diffMs = exp - now;
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  } catch (e) {
    return 300;
  }
}

/**
 * Retrieve saved accounts on this device from local storage.
 * Filters out accounts where the 300 days have expired.
 */
export function getSavedAccounts(currentSessionOverride?: UserSession | null): SavedAccountItem[] {
  try {
    const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
    if (!raw) return [];
    const accounts: SavedAccountItem[] = JSON.parse(raw);
    const now = Date.now();

    // Filter out expired items (300 days expired)
    const valid = accounts.filter((acc) => {
      const exp = new Date(acc.expiresAt).getTime();
      return exp > now;
    });

    if (valid.length !== accounts.length) {
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(valid));
    }

    const isAuth = getStoredAuth();
    const currentSession = isAuth ? (currentSessionOverride !== undefined ? currentSessionOverride : getStoredSession()) : null;

    return valid.map((acc) => ({
      ...acc,
      remainingDays: calculateRemainingDays(acc.expiresAt),
      isCurrent: isAuth && !!currentSession && isAccountCurrentSession(acc, currentSession),
    }));
  } catch (e) {
    return [];
  }
}

/**
 * Save or update a trusted account on this device.
 */
export function saveTrustedAccount(account: SavedAccountItem): void {
  try {
    const existing = getSavedAccounts();
    const idx = existing.findIndex(
      (a) => a.sessionId === account.sessionId || (a.userId === account.userId && a.userRole === account.userRole)
    );

    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...account };
    } else {
      existing.unshift(account);
    }

    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(existing));
    localStorage.setItem(ACTIVE_SAVED_SESSION_ID_KEY, account.sessionId);
    notifyAccountsChanged();
  } catch (e) {}
}

/**
 * Synchronize updated avatar theme across all saved accounts for a user.
 */
export function updateSavedAccountAvatar(userId: string, avatarUid: string): void {
  try {
    const existing = getSavedAccounts();
    let changed = false;
    existing.forEach((acc) => {
      if (acc.userId === userId || acc.studentId === userId) {
        acc.avatarUid = avatarUid;
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(existing));
      notifyAccountsChanged();
    }
  } catch (e) {}
}

/**
 * Remove a specific saved account from this device and notify server.
 */
export async function removeSavedAccount(sessionId: string): Promise<boolean> {
  try {
    const existing = getSavedAccounts();
    const target = existing.find((a) => a.sessionId === sessionId);
    const updated = existing.filter((a) => a.sessionId !== sessionId);
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));

    const activeSessionId = localStorage.getItem(ACTIVE_SAVED_SESSION_ID_KEY);
    if (activeSessionId === sessionId) {
      localStorage.removeItem(ACTIVE_SAVED_SESSION_ID_KEY);
    }

    // Call server to revoke session in backend database
    try {
      await fetch('/api/auth/revoke-device-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          deviceId: getOrCreateDeviceId(),
          sessionToken: target?.sessionToken,
        }),
      });
    } catch (apiErr) {}

    notifyAccountsChanged();
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Revoke all saved accounts on this device.
 */
export async function removeAllSavedAccounts(): Promise<boolean> {
  try {
    const deviceId = getOrCreateDeviceId();
    localStorage.removeItem(SAVED_ACCOUNTS_KEY);
    localStorage.removeItem(ACTIVE_SAVED_SESSION_ID_KEY);

    try {
      await fetch('/api/auth/revoke-all-device-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
    } catch (apiErr) {}

    notifyAccountsChanged();
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Retrieve information about this trusted device.
 */
export function getTrustedDeviceInfo(): TrustedDeviceInfo {
  const deviceId = getOrCreateDeviceId();
  const accounts = getSavedAccounts();
  const currentAccount = accounts.find((a) => a.isCurrent) || accounts[0];

  return {
    deviceId,
    deviceName: 'متصفح هذا الجهاز',
    isTrusted: accounts.length > 0,
    totalSavedAccounts: accounts.length,
    activeSessionId: currentAccount?.sessionId,
    createdAt: currentAccount?.createdAt,
    lastUsedAt: currentAccount?.lastUsedAt || new Date().toISOString(),
    expiresAt: currentAccount?.expiresAt,
    remainingDays: currentAccount ? calculateRemainingDays(currentAccount.expiresAt) : 300,
  };
}

/**
 * Dispatch custom event when accounts or active session changes
 */
export function notifyAccountsChanged() {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('saved_accounts_changed', { detail: { timestamp: Date.now() } }));
    }
  } catch (e) {
    // Ignore
  }
}
