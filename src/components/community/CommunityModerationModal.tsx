import React, { useState } from 'react';
import { CommunityGroup, CommunityMute } from '../../types/community';
import { Student } from '../../types/admin';
import { getStudentsBySchool } from '../../lib/adminStorage';
import {
  X,
  Shield,
  Lock,
  Unlock,
  Mic,
  MicOff,
  Users,
  UserCheck,
  AlertTriangle,
  BarChart2,
  Calendar,
  Pin,
} from 'lucide-react';

interface CommunityModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: CommunityGroup;
  userRole: 'student' | 'teacher' | 'admin' | 'owner' | 'parent';
  mutedUsers: CommunityMute[];
  onToggleLockGroup: () => void;
  onToggleMuteUser: (userId: string, userName: string) => void;
  onOpenCreatePoll?: () => void;
  onOpenCreateEvent?: () => void;
}

export function CommunityModerationModal({
  isOpen,
  onClose,
  group,
  userRole,
  mutedUsers,
  onToggleLockGroup,
  onToggleMuteUser,
  onOpenCreatePoll,
  onOpenCreateEvent,
}: CommunityModerationModalProps) {
  const [searchMember, setSearchMember] = useState('');

  if (!isOpen) return null;

  const canModerate = userRole === 'admin' || userRole === 'owner' || userRole === 'teacher';

  const students = getStudentsBySchool(group.schoolId);
  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchMember.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 dir-rtl select-none animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 space-y-0">
        {/* Top Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl">
              {group.icon}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">{group.name}</h3>
              <p className="text-xs text-blue-200 mt-0.5">تفاصيل المجتمع وإعدادات الإشراف</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500">إجمالي الأعضاء</span>
              <p className="text-lg font-black text-slate-900 font-mono mt-0.5">{group.membersCount}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80">
              <span className="text-[11px] font-bold text-emerald-700">متواجدون الآن</span>
              <p className="text-lg font-black text-emerald-800 font-mono mt-0.5">{group.onlineCount}</p>
            </div>
          </div>

          {/* Group Description */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs font-medium text-slate-700 space-y-1">
            <span className="font-bold text-slate-900 block">الوصف والتوجيهات:</span>
            <p>{group.description}</p>
          </div>

          {/* Admin / Moderation Controls */}
          {canModerate && (
            <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-blue-900">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>إدوات التحكم والإشراف والملاحظات</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Lock / Unlock Toggle */}
                <button
                  onClick={onToggleLockGroup}
                  className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    group.isLocked
                      ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700'
                      : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {group.isLocked ? (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>فتح المحادثات</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-amber-600" />
                      <span>إغلاق المحادثة (للإدارة فقط)</span>
                    </>
                  )}
                </button>

                {/* Create Quick Poll */}
                {onOpenCreatePoll && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCreatePoll();
                    }}
                    className="p-2.5 bg-white border border-slate-300 hover:bg-blue-50 hover:border-blue-300 text-slate-800 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <BarChart2 className="w-4 h-4 text-blue-600" />
                    <span>نشر استطلاع رأي</span>
                  </button>
                )}

                {/* Create Event */}
                {onOpenCreateEvent && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCreateEvent();
                    }}
                    className="p-2.5 bg-white border border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 text-slate-800 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>إضافة مناسبة مدرسية</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Members & Mute Management Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-600" />
                <span>أعضاء الفصل والمجتمع ({filteredStudents.length})</span>
              </h4>
              <input
                type="text"
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                placeholder="تصفية الأعضاء..."
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto border border-slate-200 rounded-2xl p-1">
              {filteredStudents.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 font-bold">
                  لا يوجد طلاب مطابقون
                </div>
              ) : (
                filteredStudents.map((std) => {
                  const isMuted = mutedUsers.some(
                    (m) => m.userId === std.id && m.communityId === group.id
                  );

                  return (
                    <div
                      key={std.id}
                      className="p-2.5 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50 rounded-xl"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                          {std.name[0]}
                        </div>
                        <div>
                          <span>{std.name}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {std.className}
                          </span>
                        </div>
                      </div>

                      {canModerate && (
                        <button
                          onClick={() => onToggleMuteUser(std.id, std.name)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                            isMuted
                              ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700'
                              : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {isMuted ? (
                            <>
                              <MicOff className="w-3 h-3" />
                              <span>مكتوم (إلغاء)</span>
                            </>
                          ) : (
                            <>
                              <Mic className="w-3 h-3 text-slate-500" />
                              <span>كتم</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-left">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
