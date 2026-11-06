import React from 'react';
import { SchoolStatus, SubscriptionPlan } from '../../types';

interface StatusBadgeProps {
  status: SchoolStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'نشطة') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        نشطة
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      معلقة
    </span>
  );
}

interface PlanBadgeProps {
  plan: SubscriptionPlan;
}

export function PlanBadge({ plan }: PlanBadgeProps) {
  switch (plan) {
    case 'بريميوم':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/80">
          بريميوم
        </span>
      );
    case 'احترافي':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/80">
          احترافي
        </span>
      );
    case 'أساسي':
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          أساسي
        </span>
      );
  }
}
