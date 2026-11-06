import React, { useState } from 'react';
import { CommunityGroup } from '../../types/community';
import { Search, MessageSquare, ShieldCheck, Lock, Sparkles, ArrowRight, RotateCcw } from 'lucide-react';
import { clearCommunityStorage } from '../../lib/communityStorage';

interface CommunityListProps {
  groups: CommunityGroup[];
  activeGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  userRole: 'student' | 'teacher' | 'admin' | 'owner' | 'parent';
  onBack?: () => void;
  className?: string;
}

export function CommunityList({
  groups,
  activeGroupId,
  onSelectGroup,
  userRole,
  onBack,
  className = '',
}: CommunityListProps) {
  const [filterTab, setFilterTab] = useState<'all' | 'class' | 'grade'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterTab === 'class') return matchesSearch && g.type === 'class';
    if (filterTab === 'grade') return matchesSearch && g.type === 'grade';
    return matchesSearch;
  });

  return (
    <div
      className={`bg-white border-l border-slate-200/80 flex flex-col h-full dir-rtl select-none ${className}`}
    >
      {/* List Header */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200/80 transition-all cursor-pointer flex items-center justify-center shrink-0"
                title="رجوع للرئيسية"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-2xs shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-slate-900 tracking-tight">
                المجتمع المدرسي
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                تواصل آمن ومراقب تحت إشراف المدرسة
              </p>
            </div>
          </div>

          <button
            onClick={() => clearCommunityStorage()}
            className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 border border-slate-200/80 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="تنظيف وتحديث البيانات القديمة"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تنظيف البيانات</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في المجتمعات المتاحة..."
            className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pr-9 pl-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl text-xs font-bold text-slate-600">
          <button
            onClick={() => setFilterTab('all')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                : 'hover:text-slate-900'
            }`}
          >
            الكل ({groups.length})
          </button>
          <button
            onClick={() => setFilterTab('class')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterTab === 'class'
                ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                : 'hover:text-slate-900'
            }`}
          >
            الفصول
          </button>
          <button
            onClick={() => setFilterTab('grade')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterTab === 'grade'
                ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                : 'hover:text-slate-900'
            }`}
          >
            الصفوف
          </button>
        </div>
      </div>

      {/* Groups Scrollable List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
        {filteredGroups.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto stroke-1 text-slate-300" />
            <p className="text-xs font-bold">لا توجد مجتمعات مطابقة للبحث</p>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isSelected = activeGroupId === group.id;

            return (
              <button
                key={group.id}
                onClick={() => onSelectGroup(group.id)}
                className={`w-full text-right p-3 rounded-2xl transition-all cursor-pointer flex items-start gap-3 relative ${
                  isSelected
                    ? 'bg-blue-50/90 border border-blue-200/90 text-blue-900 shadow-2xs'
                    : 'hover:bg-slate-50 border border-transparent text-slate-800'
                }`}
              >
                {/* Group Avatar / Icon */}
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200/80'
                  }`}
                >
                  {group.icon}
                </div>

                {/* Group Meta Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-extrabold text-xs sm:text-sm truncate text-slate-900">
                        {group.name}
                      </span>
                      {group.isLocked && (
                        <span title="مغلق بواسطة الإدارة">
                          <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        </span>
                      )}
                    </div>
                    {group.lastMessageTime && (
                      <span
                        className={`text-[10px] font-mono font-bold shrink-0 ${
                          isSelected ? 'text-blue-700' : 'text-slate-400'
                        }`}
                      >
                        {group.lastMessageTime}
                      </span>
                    )}
                  </div>

                  {/* Last Message Preview */}
                  <p
                    className={`text-xs truncate font-medium ${
                      isSelected ? 'text-blue-800 font-semibold' : 'text-slate-500'
                    }`}
                  >
                    {group.lastMessage || 'لا توجد رسائل بعد'}
                  </p>

                  {/* Footer Stats Badges */}
                  <div className="flex items-center justify-end mt-2 pt-1 border-t border-slate-100/60 text-[10px] font-bold">
                    {group.type === 'grade' ? (
                      <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200/60 font-extrabold">
                        مجتمع صف
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200/60 font-extrabold">
                        مجتمع فصل
                      </span>
                    )}
                  </div>
                </div>

                {/* Active Indicator Bar */}
                {isSelected && (
                  <span className="absolute right-0 top-3 bottom-3 w-1 rounded-l-md bg-blue-600" />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Safety Compliance Footer Badge */}
      <div className="p-3 bg-slate-50 border-t border-slate-200/80 text-[11px] text-slate-600 flex items-center gap-2 font-bold">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>جميع المحادثات خاضعة لرقابة وإشراف إدارة المدرسة</span>
      </div>
    </div>
  );
}
