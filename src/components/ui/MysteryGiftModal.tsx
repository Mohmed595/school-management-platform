import React from 'react';
import { Badge, StudentBadge, BadgeRarity } from '../../types/badge';
import { Award, CheckCircle2, ShieldCheck, Calendar, UserCheck, Quote, Sparkles } from 'lucide-react';
import { markBadgeAsUnboxed } from '../../lib/badgeStorage';
import { playSoftClickSound } from '../../lib/sound';

interface MysteryGiftModalProps {
  badge: Badge;
  assignment: StudentBadge;
  onClaim: () => void;
}

export function MysteryGiftModal({ badge, assignment, onClaim }: MysteryGiftModalProps) {
  // Rarity Theme Configurations for Prestigious Academic Presentation
  const getRarityConfig = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'Mythical':
        return {
          label: 'وسام استثنائي (Mythical)',
          accentBorder: 'border-amber-400',
          badgeGradient: 'from-amber-500 via-amber-600 to-yellow-600',
          badgeText: 'text-amber-700',
          badgeBg: 'bg-amber-50',
          ringColor: 'ring-amber-400/40',
          tagBg: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-black',
          headerBg: 'bg-gradient-to-r from-amber-900 via-slate-900 to-amber-950 text-amber-100',
        };
      case 'Legendary':
        return {
          label: 'وسام أسطوري (Legendary)',
          accentBorder: 'border-amber-400',
          badgeGradient: 'from-amber-400 to-orange-500',
          badgeText: 'text-amber-700',
          badgeBg: 'bg-amber-50',
          ringColor: 'ring-amber-400/30',
          tagBg: 'bg-amber-500 text-slate-950 font-black',
          headerBg: 'bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-amber-100',
        };
      case 'Epic':
        return {
          label: 'وسام بطولي (Epic)',
          accentBorder: 'border-purple-300',
          badgeGradient: 'from-purple-500 to-indigo-600',
          badgeText: 'text-purple-700',
          badgeBg: 'bg-purple-50',
          ringColor: 'ring-purple-400/30',
          tagBg: 'bg-purple-600 text-white font-bold',
          headerBg: 'bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-purple-100',
        };
      case 'Rare':
        return {
          label: 'وسام نادر (Rare)',
          accentBorder: 'border-blue-300',
          badgeGradient: 'from-blue-500 to-cyan-600',
          badgeText: 'text-blue-700',
          badgeBg: 'bg-blue-50',
          ringColor: 'ring-blue-400/30',
          tagBg: 'bg-blue-600 text-white font-bold',
          headerBg: 'bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-blue-100',
        };
      default:
        return {
          label: 'وسام تقديري (Honor Badge)',
          accentBorder: 'border-slate-300',
          badgeGradient: 'from-slate-600 to-slate-700',
          badgeText: 'text-slate-700',
          badgeBg: 'bg-slate-50',
          ringColor: 'ring-slate-300',
          tagBg: 'bg-slate-700 text-white font-bold',
          headerBg: 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-slate-100',
        };
    }
  };

  const config = getRarityConfig(badge.rarity);

  const handleClaimSubmit = () => {
    playSoftClickSound();
    markBadgeAsUnboxed(assignment.id);
    onClaim();
  };

  const formattedDate = (() => {
    try {
      const d = new Date(assignment.awardedAt);
      if (isNaN(d.getTime())) return assignment.awardedAt;
      return d.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return assignment.awardedAt;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 dir-rtl animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Certificate / Honor Header Banner */}
        <div className={`p-4 sm:p-5 ${config.headerBg} relative border-b border-white/10 text-center shrink-0`}>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-[11px] mb-1.5 text-amber-200">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="font-bold tracking-wide">تكريم وتقدير رسمي</span>
          </div>

          <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
            <span>منح وسام استحقاق للطالب</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 max-w-xs mx-auto font-medium leading-normal">
            تقديراً للجهود المتميزة والالتزام والانضباط الدراسي المشرف
          </p>
        </div>

        {/* Modal Body: Prestigious Badge Presentation (Scrollable on small mobile heights) */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Badge Visual Medal Frame */}
          <div className="text-center space-y-2.5">
            <div className="relative inline-flex items-center justify-center">
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl ${config.badgeBg} border-2 ${config.accentBorder} shadow-md ring-4 sm:ring-6 ${config.ringColor} flex items-center justify-center transition-transform`}
              >
                {badge.icon &&
                (badge.icon.startsWith('data:') ||
                  badge.icon.startsWith('http') ||
                  badge.icon.startsWith('/')) ? (
                  <img
                    src={badge.icon}
                    alt={badge.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                  />
                ) : (
                  <span className="text-4xl sm:text-5xl">{badge.icon || '🏅'}</span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-block">
                <span className={`text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full ${config.tagBg} shadow-2xs`}>
                  {config.label}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">{badge.name}</h3>
              {badge.nameEn && (
                <div className="text-[11px] sm:text-xs font-semibold text-slate-500 tracking-wide">
                  {badge.nameEn}
                </div>
              )}
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed pt-0.5 font-medium">
                {badge.description}
              </p>
            </div>
          </div>

          {/* Commendation Note / Reason for Honor */}
          {assignment.note && (
            <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1 relative">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px] sm:text-xs">
                <Quote className="w-3 h-3 rotate-180 text-amber-700 shrink-0" />
                <span>ملاحظة وسبب التكريم من الإدارة:</span>
              </div>
              <p className="text-xs text-slate-800 font-medium leading-relaxed pr-1">
                "{assignment.note}"
              </p>
            </div>
          )}

          {/* Official Sign-off Info */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-1 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-50 text-slate-700">
              <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div className="truncate min-w-0">
                <div className="text-[10px] text-slate-400">جهة المنح:</div>
                <div className="font-bold text-slate-800 text-[11px] sm:text-xs truncate">{assignment.awardedBy || 'إدارة المدرسة'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-50 text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div className="truncate min-w-0">
                <div className="text-[10px] text-slate-400">تاريخ الاستحقاق:</div>
                <div className="font-bold text-slate-800 text-[11px] sm:text-xs truncate">{formattedDate}</div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-1">
            <button
              onClick={handleClaimSubmit}
              className="w-full min-h-[46px] py-3 px-4 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 touch-manipulation"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>استلام الوسام وتوثيقه في سجل الإنجازات</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

