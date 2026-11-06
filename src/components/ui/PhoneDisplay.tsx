import React from 'react';
import { AlertTriangle, Phone } from 'lucide-react';

interface PhoneDisplayProps {
  phone?: string | null;
  showIcon?: boolean;
  className?: string;
}

/**
 * Helper function to check if a phone number is missing, empty, or a dummy simulation default
 */
export function isInvalidOrDummyPhone(phone?: string | null): boolean {
  if (!phone) return true;
  const trimmed = phone.trim();
  if (!trimmed) return true;
  // Common dummy/simulation placeholders that should trigger the warning
  if (
    trimmed === '01012345678' ||
    trimmed === '01000000000' ||
    trimmed === '0200000000' ||
    trimmed === '01098765432' ||
    trimmed === '010'
  ) {
    return true;
  }
  return false;
}

export function PhoneDisplay({ phone, showIcon = false, className = '' }: PhoneDisplayProps) {
  if (isInvalidOrDummyPhone(phone)) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80 text-[11px] font-bold ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>(لا يوجد رقم هاتف مسجل)</span>
      </span>
    );
  }

  return (
    <span className={`font-mono dir-ltr inline-flex items-center gap-1.5 ${className}`}>
      {showIcon && <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
      <span>{phone}</span>
    </span>
  );
}
