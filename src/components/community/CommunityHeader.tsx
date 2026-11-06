import React, { useState } from 'react';
import { CommunityGroup, CommunityMessage } from '../../types/community';
import {
  Users,
  Search,
  Shield,
  Pin,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  X,
  PlusCircle,
  BarChart2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

interface CommunityHeaderProps {
  group: CommunityGroup;
  pinnedMessage?: CommunityMessage | null;
  userRole: 'student' | 'teacher' | 'admin' | 'owner' | 'parent';
  onSearchToggle: () => void;
  isSearching: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenModerationModal: () => void;
  onOpenCreatePoll?: () => void;
  onOpenCreateEvent?: () => void;
  onToggleLockGroup?: () => void;
}

export function CommunityHeader({
  group,
  pinnedMessage,
  userRole,
  onSearchToggle,
  isSearching,
  searchQuery,
  onSearchChange,
  onOpenModerationModal,
  onOpenCreatePoll,
  onOpenCreateEvent,
  onToggleLockGroup,
}: CommunityHeaderProps) {
  const canModerate = userRole === 'admin' || userRole === 'owner' || userRole === 'teacher';

  return (
    <div className="bg-white border-b border-slate-200/80 shadow-2xs dir-rtl select-none sticky top-0 z-20">
      {/* Main Header Bar */}
      <div className="p-3 sm:p-4 flex items-center justify-between gap-3">
        {/* Left Info Group (RTL Right side) */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl shrink-0 shadow-2xs">
            {group.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                {group.name}
              </h2>
              {group.isLocked && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-700" />
                  مغلق
                </span>
              )}
            </div>

          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Create Poll / Event buttons for teachers and admin */}
          {canModerate && (
            <>
              {onOpenCreatePoll && (
                <button
                  onClick={onOpenCreatePoll}
                  title="إنشاء استطلاع رأي"
                  className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200/80 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                >
                  <BarChart2 className="w-4 h-4 text-blue-600" />
                  <span className="hidden md:inline">استطلاع</span>
                </button>
              )}
              {onOpenCreateEvent && (
                <button
                  onClick={onOpenCreateEvent}
                  title="إضافة مناسبة أو فعالية"
                  className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200/80 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span className="hidden md:inline">مناسبة</span>
                </button>
              )}
            </>
          )}

          {/* Search inside Chat */}
          <button
            onClick={onSearchToggle}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isSearching
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'text-slate-600 hover:bg-slate-100 border-slate-200/80'
            }`}
            title="بحث في الرسائل"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Moderation / Group Details - Only accessible by School Admin and Owner */}
          {(userRole === 'admin' || userRole === 'owner') && (
            <button
              onClick={onOpenModerationModal}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="تفاصيل المجتمع والإدارة"
            >
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">تفاصيل المجتمع</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Search Input Bar */}
      {isSearching && (
        <div className="px-4 pb-3 flex items-center gap-2 animate-fade-in">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث عن كلمة أو اسم مرسل..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-9 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
              autoFocus
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>
          <button
            onClick={() => {
              onSearchChange('');
              onSearchToggle();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}


    </div>
  );
}
