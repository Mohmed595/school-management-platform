import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  MoreVertical,
  ChevronLeft,
  LogOut,
  GraduationCap,
  Building2,
  Sparkles,
} from 'lucide-react';
import { SavedAccountItem } from '../../types/auth';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { getUserAvatarLayoutUid } from '../../lib/avatarLayouts';

interface AccountSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: SavedAccountItem[];
  currentSessionId?: string;
  onSelectAccount: (account: SavedAccountItem) => void;
  onAddNewAccount: () => void;
  onRemoveAccount: (sessionId: string) => void;
  onOpenDeviceManagement: () => void;
  onLogoutAll: () => void;
  isSwitching?: boolean;
}

export function AccountSwitcherModal({
  isOpen,
  onClose,
  accounts,
  currentSessionId,
  onSelectAccount,
  onAddNewAccount,
  onRemoveAccount,
  onOpenDeviceManagement,
  onLogoutAll,
  isSwitching = false,
}: AccountSwitcherModalProps) {
  const [accountMenuOpen, setAccountMenuOpen] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  if (!isOpen) return null;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'parent':
        return 'طالب / ولي أمر';
      case 'teacher':
        return 'معلم';
      case 'attendance_teacher':
        return 'مسؤول حضور';
      case 'school_admin':
        return 'إدارة مدرسة';
      case 'owner':
        return 'مالك المنظومة';
      default:
        return 'مستخدم';
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'parent':
        return 'bg-blue-50 text-blue-700 border-blue-200/80';
      case 'teacher':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'attendance_teacher':
        return 'bg-amber-50 text-amber-800 border-amber-200/80';
      case 'school_admin':
        return 'bg-purple-50 text-purple-700 border-purple-200/80';
      case 'owner':
        return 'bg-amber-50 text-amber-900 border-amber-300/80';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-slate-950/70 backdrop-blur-xs dir-rtl">
      {/* Backdrop click */}
      <div
        className="fixed inset-0 -z-10"
        onClick={() => !isSwitching && onClose()}
      />

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200/90 z-10 overflow-hidden flex flex-col my-auto max-h-[92vh] sm:max-h-[85vh] transition-all">
        
        {/* Switching Overlay */}
        {isSwitching && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xs z-40 flex flex-col items-center justify-center space-y-3 p-6 text-center">
            <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <h4 className="font-black text-base text-slate-900">جاري تبديل الحساب وتفعيل الصلاحيات</h4>
            <p className="font-bold text-xs text-slate-500">يرجى الانتظار لحظات...</p>
          </div>
        )}

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          {/* Right side in RTL: Blue Icon Box */}
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Users className="w-5 h-5" />
          </div>

          {/* Center: Title & Subtitle */}
          <div className="text-center flex-1 px-2 sm:px-3">
            <h3 className="font-black text-base sm:text-lg text-slate-900 leading-tight">تبديل الحسابات</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 font-bold mt-0.5 truncate">
              الحسابات المتوفرة على هذا الجهاز ( {accounts.length} )
            </p>
          </div>

          {/* Left side in RTL: Close Button */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="إغلاق"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Saved Accounts List */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-2.5 max-h-[58vh]">
          {accounts.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-3">
              <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-black text-slate-700">لا توجد حسابات محفوظة أخرى</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                سجل الدخول وفعل خيار "الوثوق بهذا الجهاز" لإضافة الحساب إلى قائمة التبديل السريع.
              </p>
            </div>
          ) : (
            accounts.map((acc) => {
              const isCurrent = currentSessionId ? acc.sessionId === currentSessionId : Boolean(acc.isCurrent);
              const isMenuOpen = accountMenuOpen === acc.sessionId;
              const isConfirming = confirmRemoveId === acc.sessionId;

              return (
                <div
                  key={acc.sessionId}
                  className={`relative p-3 sm:p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-blue-50/70 border-blue-400 shadow-2xs ring-1 ring-blue-400/30'
                      : 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-blue-300'
                  }`}
                >
                  {isConfirming ? (
                    <div className="space-y-2.5 p-1 text-center animate-in fade-in duration-150">
                      <p className="text-xs font-extrabold text-slate-900 leading-relaxed">
                        هل تريد إزالة حساب <span className="text-red-600 font-black">"{acc.userDisplayName}"</span> من هذا الجهاز؟
                      </p>
                      <p className="text-[11px] text-slate-500">
                        (لن يتأثر الحساب الأصلي، فقط ستتم إزالة التوثيق التلقائي من هذا المتصفح)
                      </p>
                      <div className="flex items-center gap-2 pt-1 max-w-xs mx-auto">
                        <button
                          onClick={() => {
                            onRemoveAccount(acc.sessionId);
                            setConfirmRemoveId(null);
                          }}
                          className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs"
                        >
                          نعم، إزالة
                        </button>
                        <button
                          onClick={() => setConfirmRemoveId(null)}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      {/* Right side in RTL: 3 Dots Menu */}
                      <div className="relative shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAccountMenuOpen(isMenuOpen ? null : acc.sessionId);
                          }}
                          className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                          title="خيارات الحساب"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                            <button
                              onClick={() => {
                                setAccountMenuOpen(null);
                                setConfirmRemoveId(acc.sessionId);
                              }}
                              className="w-full px-3 py-2 text-right text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>إزالة من هذا الجهاز</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Center-Right info block (Clickable to switch) */}
                      <button
                        onClick={() => {
                          if (!isCurrent) {
                            onSelectAccount(acc);
                          }
                        }}
                        disabled={isCurrent}
                        className={`flex-1 flex items-center gap-2.5 sm:gap-3 text-right cursor-pointer select-none min-w-0 ${
                          isCurrent ? 'cursor-default' : 'hover:opacity-95'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <AvatarDisplay
                            layoutUid={acc.avatarUid || getUserAvatarLayoutUid(acc.userRole)}
                            size="md"
                            alt={acc.userDisplayName}
                            className="rounded-2xl border-2 border-white shadow-xs"
                          />
                        </div>

                        {/* Name & Role Badge */}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-sm sm:text-base text-slate-900 truncate leading-snug">
                            {acc.userDisplayName}
                          </h4>

                          <div className="flex items-center gap-1.5 mt-1 flex-nowrap overflow-x-auto no-scrollbar">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] sm:text-[11px] border shadow-2xs whitespace-nowrap shrink-0 ${getRoleBadgeStyle(acc.userRole)}`}>
                              {getRoleLabel(acc.userRole)}
                            </span>
                            {acc.className && (
                              <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap shrink-0">
                                {acc.className}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Far Left in RTL: Active Badge */}
                      {isCurrent && (
                        <div className="shrink-0 mr-1">
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300/90 text-[10px] sm:text-xs font-black px-2.5 sm:px-3 py-1 rounded-full inline-flex items-center gap-1 shadow-2xs whitespace-nowrap">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                            <span>الحساب الحالي</span>
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-5 border-t border-slate-100 bg-slate-50/50 space-y-2.5 shrink-0">
          {/* Add Account Button */}
          <button
            onClick={() => {
              onClose();
              onAddNewAccount();
            }}
            className="w-full py-3 px-4 bg-white hover:bg-blue-50/60 text-blue-600 border border-blue-400 font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
          >
            <UserPlus className="w-4 h-4 text-blue-600" />
            <span>＋ إضافة حساب طالب أو معلم جديد</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Device Management (Right in RTL - 1st DOM element) */}
            <button
              onClick={() => {
                onClose();
                onOpenDeviceManagement();
              }}
              className="flex-1 py-2.5 sm:py-3 px-2.5 sm:px-4 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>إدارة الأجهزة الموثوقة</span>
            </button>

            {/* Logout from all (Left in RTL - 2nd DOM element) */}
            <button
              onClick={() => {
                onClose();
                onLogoutAll();
              }}
              className="flex-1 py-2.5 sm:py-3 px-2.5 sm:px-4 text-red-600 hover:text-red-700 bg-white hover:bg-red-50/60 border border-red-200 font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
              title="تسجيل الخروج من جميع الحسابات"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span>تسجيل الخروج من الكل</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
