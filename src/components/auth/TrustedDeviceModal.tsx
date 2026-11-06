import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ShieldCheck,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Clock,
  KeyRound,
  Trash2,
  Lock,
  Calendar,
  Users,
} from 'lucide-react';
import { TrustedDeviceInfo, SavedAccountItem } from '../../types/auth';
import { getTrustedDeviceInfo, getSavedAccounts, removeAllSavedAccounts } from '../../lib/trustedDeviceStorage';

interface TrustedDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRevokeDevice?: () => void;
}

export function TrustedDeviceModal({ isOpen, onClose, onRevokeDevice }: TrustedDeviceModalProps) {
  const [deviceInfo, setDeviceInfo] = useState<TrustedDeviceInfo | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccountItem[]>([]);
  const [isRevoking, setIsRevoking] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDeviceInfo(getTrustedDeviceInfo());
      setSavedAccounts(getSavedAccounts());
      setConfirmRevoke(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRevoke = async () => {
    setIsRevoking(true);
    try {
      await removeAllSavedAccounts();
      if (onRevokeDevice) {
        onRevokeDevice();
      } else {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRevoking(false);
    }
  };

  const remainingDays = deviceInfo?.remainingDays ?? 300;
  const progressPercent = Math.min(100, Math.max(0, (remainingDays / 300) * 100));

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-slate-950/70 backdrop-blur-xs dir-rtl">
      {/* Backdrop click */}
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200/90 z-10 overflow-hidden flex flex-col my-auto max-h-[90vh] sm:max-h-[85vh] transition-all">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-l from-emerald-50/80 via-blue-50/40 to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 leading-tight">إدارة الأجهزة الموثوقة</h3>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                نظام الدخول الآمن والموثوق لمدة 300 يوم
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Current Device Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm text-slate-900">هذا الجهاز الحالي</h4>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      موثوق
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    معرف الجهاز: {deviceInfo?.deviceId?.slice(0, 16)}...
                  </p>
                </div>
              </div>
            </div>

            {/* 300-Day Validity Progress */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  صلاحية الجلسة الموثوقة:
                </span>
                <span className="text-emerald-700 font-black">
                  متبقي {remainingDays} يوم من 300 يوم
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Security Notes */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/70 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>تشفير جلسات HMAC-256</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>لا يتم حفظ كلمات المرور محلياً</span>
              </div>
            </div>
          </div>

          {/* Accounts on this device */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                الحسابات المصرح بها على هذا الجهاز ({savedAccounts.length})
              </h5>
            </div>

            <div className="space-y-1.5">
              {savedAccounts.map((acc) => (
                <div
                  key={acc.sessionId}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-slate-900">{acc.userDisplayName}</span>
                    {acc.className && (
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {acc.className}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {acc.remainingDays || 300} يوم متبقية
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Revoke confirmation box */}
          {confirmRevoke ? (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h6 className="font-bold text-xs text-red-900">هل أنت متأكد من إلغاء توثيق هذا الجهاز؟</h6>
                  <p className="text-[11px] text-red-700 leading-relaxed mt-0.5">
                    سيتم تسجيل الخروج من كافة الحسابات المحفوظة ولن يتم الدخول تلقائياً مرة أخرى إلا بعد إدخال بيانات الحساب مجدداً.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleRevoke}
                  disabled={isRevoking}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {isRevoking ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>تأكيد إلغاء التوثيق والخروج</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setConfirmRevoke(false)}
                  className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmRevoke(true)}
              className="w-full py-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 font-bold text-xs rounded-2xl border border-red-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>إلغاء الثقة بهذا الجهاز وتسجيل الخروج من كل الحسابات</span>
            </button>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
