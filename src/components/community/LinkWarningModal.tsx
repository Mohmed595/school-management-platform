import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Globe } from 'lucide-react';

interface LinkWarningModalProps {
  url: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LinkWarningModal({ url, onConfirm, onCancel }: LinkWarningModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(3);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  // Prevent underlying page scrolling while modal is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const displayUrl = url || 'http://downloadgameexample.com/very-long-link-example-page-with-many-parts-and-params-id=12345&ref=chat&source=community';

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] bg-slate-950/80 flex items-center justify-center p-4 sm:p-6 dir-rtl select-none overflow-y-auto"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-[28px] p-6 sm:p-8 w-[90vw] max-w-sm sm:max-w-md my-auto max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 text-center space-y-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon Badge */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-amber-50/90 border border-amber-100 flex items-center justify-center mx-auto mb-2 shadow-2xs">
          <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 stroke-[2.2]" />
        </div>

        {/* Title & Warning Subtitles */}
        <div className="space-y-1">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">تحذير</h2>
          <p className="text-base sm:text-lg font-bold text-orange-600">رابط غير مشفر (HTTP)</p>
        </div>

        <div className="space-y-0.5 pt-1 text-slate-600">
          <p className="text-sm sm:text-base font-medium">هذا الرابط قد يكون غير آمن.</p>
          <p className="text-base sm:text-lg font-extrabold text-slate-900">هل تريد المتابعة؟</p>
        </div>

        {/* URL Box */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 text-center my-3 max-h-48 overflow-y-auto">
          <span className="text-orange-600 font-semibold text-xs sm:text-sm font-mono break-all leading-relaxed dir-ltr block">
            {displayUrl}
          </span>
        </div>

        {/* Countdown Timer Text */}
        <div className="text-slate-600 text-xs sm:text-sm font-semibold text-center pt-1 pb-1">
          {secondsLeft > 0 ? (
            <span>
              يمكنك المتابعة خلال{' '}
              <span className="text-orange-600 font-extrabold font-mono">
                {String(secondsLeft).padStart(2, '0')}
              </span>{' '}
              ثوانٍ...
            </span>
          ) : (
            <span className="text-emerald-600 font-bold">يمكنك المتابعة الآن</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            disabled={secondsLeft > 0}
            onClick={onConfirm}
            className="w-full py-3.5 sm:py-4 px-5 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:bg-orange-500/60 disabled:cursor-not-allowed text-white font-extrabold text-base sm:text-lg rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer min-h-[52px]"
          >
            <Globe className="w-5 h-5 stroke-[2.2] shrink-0" />
            <span>متابعة إلى الموقع</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3 sm:py-3.5 px-5 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-extrabold text-base sm:text-lg rounded-2xl border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer min-h-[48px]"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

