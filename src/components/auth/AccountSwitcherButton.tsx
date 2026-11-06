import React, { useState, useEffect } from 'react';
import { Users, ChevronDown, ShieldCheck } from 'lucide-react';
import { SavedAccountItem } from '../../types/auth';
import {
  getSavedAccounts,
  removeSavedAccount,
  removeAllSavedAccounts,
  saveTrustedAccount,
  getOrCreateDeviceId,
} from '../../lib/trustedDeviceStorage';
import { AccountSwitcherModal } from './AccountSwitcherModal';
import { TrustedDeviceModal } from './TrustedDeviceModal';
import { saveStoredSession, setStoredAuth, clearStoredSession, getStoredSession } from '../../lib/storage';

interface AccountSwitcherButtonProps {
  currentSessionId?: string;
  onAccountSwitched?: (account: SavedAccountItem) => void;
  className?: string;
  variant?: 'compact' | 'pill' | 'header';
}

export function AccountSwitcherButton({
  currentSessionId,
  onAccountSwitched,
  className = '',
  variant = 'header',
}: AccountSwitcherButtonProps) {
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [accounts, setAccounts] = useState<SavedAccountItem[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);

  const refreshAccounts = () => {
    setAccounts(getSavedAccounts());
  };

  useEffect(() => {
    refreshAccounts();

    const handleUpdate = () => {
      refreshAccounts();
    };

    window.addEventListener('saved_accounts_changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('saved_accounts_changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleSelectAccount = async (target: SavedAccountItem) => {
    setIsSwitching(true);
    try {
      // Call server switch-account endpoint with account metadata
      const response = await fetch('/api/auth/switch-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetSessionId: target.sessionId,
          sessionToken: target.sessionToken,
          deviceId: getOrCreateDeviceId(),
          accountMeta: {
            userId: target.userId,
            userRole: target.userRole,
            schoolId: target.schoolId,
            schoolName: target.schoolName,
            studentId: target.studentId,
            studentName: target.studentName,
            studentCode: target.studentCode,
            className: target.className,
            userDisplayName: target.userDisplayName,
            avatarUid: target.avatarUid,
          },
        }),
      });

      const data = await response.json();
      const effectiveRole = (data.success && data.session?.userRole) ? data.session.userRole : target.userRole;
      const effectiveSchoolId = (data.success && data.session?.schoolId) ? data.session.schoolId : target.schoolId;
      const isTeacher = effectiveRole === 'teacher' || effectiveRole === 'attendance_teacher';
      const isParent = effectiveRole === 'parent';

      const newSession = {
        isAuthenticated: true,
        userRole: effectiveRole,
        schoolId: effectiveSchoolId,
        studentId: isParent ? (data.session?.studentId || target.studentId || target.userId) : undefined,
        studentName: (data.session?.studentName || target.studentName),
        studentCode: (data.session?.studentCode || target.studentCode),
        className: (data.session?.className || target.className),
        teacherId: isTeacher ? (data.session?.userId || target.userId) : undefined,
        userDisplayName: (data.session?.userDisplayName || target.userDisplayName),
        avatar_layout_uid: (data.session?.avatarUid || target.avatarUid),
        isTrustedDevice: true,
        trustedSessionId: data.session?.sessionId || target.sessionId,
        trustedExpiresAt: data.session?.expiresAt || target.expiresAt,
        sessionToken: data.sessionToken || target.sessionToken,
      };

      saveStoredSession(newSession);
      setStoredAuth(true);

      // Update local active state in saved accounts
      saveTrustedAccount({
        ...target,
        sessionToken: data.sessionToken || target.sessionToken,
        lastUsedAt: new Date().toISOString(),
        isCurrent: true,
      });

      setIsSwitcherOpen(false);

      if (onAccountSwitched) {
        onAccountSwitched(target);
      } else {
        // Reload to render target real account screen immediately
        window.location.reload();
      }
    } catch (e) {
      console.error('Failed to switch account:', e);
      // Fallback local switch
      const effectiveRole = target.userRole;
      const isTeacher = effectiveRole === 'teacher' || effectiveRole === 'attendance_teacher';
      const isParent = effectiveRole === 'parent';

      const newSession = {
        isAuthenticated: true,
        userRole: effectiveRole,
        schoolId: target.schoolId,
        studentId: isParent ? (target.studentId || target.userId) : undefined,
        studentName: target.studentName,
        studentCode: target.studentCode,
        className: target.className,
        teacherId: isTeacher ? target.userId : undefined,
        userDisplayName: target.userDisplayName,
        avatar_layout_uid: target.avatarUid,
        isTrustedDevice: true,
        trustedSessionId: target.sessionId,
        trustedExpiresAt: target.expiresAt,
        sessionToken: target.sessionToken,
      };

      saveStoredSession(newSession);
      setStoredAuth(true);
      setIsSwitcherOpen(false);
      window.location.reload();
    } finally {
      setIsSwitching(false);
    }
  };

  const handleRemoveAccount = async (sessionId: string) => {
    await removeSavedAccount(sessionId);
    refreshAccounts();
  };

  const handleLogoutAll = async () => {
    await removeAllSavedAccounts();
    clearStoredSession();
    window.location.reload();
  };

  const handleAddNewAccount = () => {
    // Navigate to login while retaining saved accounts
    clearStoredSession();
    window.location.reload();
  };

  const effectiveSessionId = currentSessionId || (getStoredSession()?.trustedSessionId) || undefined;

  if (accounts.length === 0) {
    return null;
  }

  if (variant === 'pill') {
    return (
      <>
        <button
          onClick={() => setIsSwitcherOpen(true)}
          className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-2xl bg-blue-50/90 hover:bg-blue-100/90 border border-blue-200/90 text-blue-800 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-xs ${className}`}
          title="تبديل الحسابات المحفوظة على هذا الجهاز"
        >
          <div className="relative flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-700" />
            {accounts.length > 1 && (
              <span className="sm:hidden absolute -top-2 -right-2 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-black">
                {accounts.length}
              </span>
            )}
          </div>
          <span className="hidden sm:inline">تبديل الحسابات</span>
          {accounts.length > 1 && (
            <span className="hidden sm:flex h-5 px-1.5 rounded-full bg-blue-600 text-white text-[10px] items-center justify-center font-black">
              {accounts.length}
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 opacity-70 hidden sm:inline" />
        </button>

        <AccountSwitcherModal
          isOpen={isSwitcherOpen}
          onClose={() => setIsSwitcherOpen(false)}
          accounts={accounts}
          currentSessionId={effectiveSessionId}
          onSelectAccount={handleSelectAccount}
          onAddNewAccount={handleAddNewAccount}
          onRemoveAccount={handleRemoveAccount}
          onOpenDeviceManagement={() => setIsDeviceModalOpen(true)}
          onLogoutAll={handleLogoutAll}
          isSwitching={isSwitching}
        />

        <TrustedDeviceModal
          isOpen={isDeviceModalOpen}
          onClose={() => setIsDeviceModalOpen(false)}
          onRevokeDevice={handleLogoutAll}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsSwitcherOpen(true)}
        className={`flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200/90 border border-slate-200 text-slate-800 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-xs ${className}`}
        title="تبديل الحسابات المحفوظة على هذا الجهاز"
      >
        <div className="relative flex items-center justify-center">
          <Users className="w-4 h-4 text-blue-600" />
          {accounts.length > 1 && (
            <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-blue-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
              {accounts.length}
            </span>
          )}
        </div>
        <span className="hidden sm:inline">تبديل الحساب</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
      </button>

      <AccountSwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        accounts={accounts}
        currentSessionId={effectiveSessionId}
        onSelectAccount={handleSelectAccount}
        onAddNewAccount={handleAddNewAccount}
        onRemoveAccount={handleRemoveAccount}
        onOpenDeviceManagement={() => setIsDeviceModalOpen(true)}
        onLogoutAll={handleLogoutAll}
        isSwitching={isSwitching}
      />

      <TrustedDeviceModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        onRevokeDevice={handleLogoutAll}
      />
    </>
  );
}
