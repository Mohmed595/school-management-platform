import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animate?: 'shimmer' | 'pulse' | 'none';
}

/**
 * Base Advanced Skeleton Component
 * Supports custom shapes, shimmer gradients, pulse effects, and explicit dimensions.
 */
export function Skeleton({
  className = '',
  variant = 'rounded',
  width,
  height,
  animate = 'shimmer',
}: SkeletonProps) {
  // Shape Variant classes
  const variantClasses = {
    text: 'rounded-md h-4 w-full',
    circular: 'rounded-full shrink-0',
    rectangular: 'rounded-none',
    rounded: 'rounded-2xl',
  }[variant];

  // Animation classes
  const animationClasses = {
    shimmer: 'animate-skeleton-shimmer',
    pulse: 'animate-pulse bg-slate-200',
    none: 'bg-slate-200',
  }[animate];

  const style: React.CSSProperties = {};
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`inline-block ${variantClasses} ${animationClasses} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * Card Skeleton - Perfect for Stat Cards, Metrics, and KPI Badges
 */
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-1/3 h-3.5" />
        <Skeleton variant="circular" className="w-10 h-10" />
      </div>
      <div className="flex items-baseline gap-3">
        <Skeleton variant="text" className="w-1/2 h-8" />
        <Skeleton variant="text" className="w-1/4 h-4 rounded-full" />
      </div>
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <Skeleton variant="text" className="w-1/3 h-3" />
        <Skeleton variant="text" className="w-1/5 h-3" />
      </div>
    </div>
  );
}

/**
 * Grid Skeleton - Grid layout of card skeletons
 */
export function GridSkeleton({ count = 4, columns = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' }: { count?: number; columns?: string }) {
  return (
    <div className={`grid gap-4 ${columns}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx}>
          <CardSkeleton />
        </div>
      ))}
    </div>
  );
}

/**
 * Header / Banner View Skeleton
 */
export function HeaderSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-2 flex-1">
        <Skeleton variant="text" className="w-1/3 h-6" />
        <Skeleton variant="text" className="w-2/3 h-4" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton variant="rounded" className="w-28 h-10 rounded-xl" />
        <Skeleton variant="rounded" className="w-32 h-10 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Table Skeleton - Advanced Skeleton for Data Tables
 */
export function TableSkeleton({
  rows = 5,
  cols = 4,
  showHeader = true,
}: {
  rows?: number;
  cols?: number;
  showHeader?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Table Action Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <Skeleton variant="text" className="w-48 h-9 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton variant="rounded" className="w-24 h-8 rounded-lg" />
          <Skeleton variant="rounded" className="w-20 h-8 rounded-lg" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          {showHeader && (
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {Array.from({ length: cols }).map((_, cIdx) => (
                  <th key={cIdx} className="p-4">
                    <Skeleton variant="text" className="w-3/4 h-3.5" />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: rows }).map((_, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50/50">
                {Array.from({ length: cols }).map((_, cIdx) => (
                  <td key={cIdx} className="p-4">
                    {cIdx === 0 ? (
                      <div className="flex items-center gap-3">
                        <Skeleton variant="circular" className="w-9 h-9" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton variant="text" className="w-3/4 h-3.5" />
                          <Skeleton variant="text" className="w-1/2 h-2.5" />
                        </div>
                      </div>
                    ) : (
                      <Skeleton variant="text" className="w-2/3 h-3.5" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * List Skeleton - For Activity Feed, Announcements, Behavior Logs
 */
export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <Skeleton variant="text" className="w-40 h-4" />
        <Skeleton variant="text" className="w-16 h-3" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton variant="circular" className="w-10 h-10" />
              <div className="space-y-1.5 flex-1">
                <Skeleton variant="text" className="w-2/5 h-3.5" />
                <Skeleton variant="text" className="w-4/5 h-3" />
              </div>
            </div>
            <Skeleton variant="rounded" className="w-20 h-7 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Form Skeleton - For Edit forms, Modals, Filters
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
      <Skeleton variant="text" className="w-1/3 h-5 mb-2" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: fields }).map((_, idx) => (
          <div key={idx} className="space-y-2">
            <Skeleton variant="text" className="w-1/3 h-3" />
            <Skeleton variant="rounded" className="w-full h-10 rounded-xl" />
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
        <Skeleton variant="rounded" className="w-24 h-10 rounded-xl" />
        <Skeleton variant="rounded" className="w-32 h-10 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Complete Full View Skeleton
 */
export function ViewSkeleton() {
  return (
    <div className="space-y-6 dir-rtl animate-fadeIn">
      <HeaderSkeleton />
      <GridSkeleton count={3} columns="grid-cols-1 sm:grid-cols-3" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TableSkeleton rows={4} cols={4} />
        </div>
        <div className="lg:col-span-1">
          <ListSkeleton count={4} />
        </div>
      </div>
    </div>
  );
}

/**
 * SkeletonWrapper - Wraps content and displays skeleton while `isLoading` is true
 */
export function SkeletonWrapper({
  isLoading,
  skeleton,
  children,
}: {
  isLoading: boolean;
  skeleton?: React.ReactNode;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return <>{skeleton || <ViewSkeleton />}</>;
  }
  return <>{children}</>;
}
