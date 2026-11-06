import React from 'react';
import { Badge, StudentBadge, BadgeRarity } from '../../types/badge';
import { Award, Sparkles, Calendar, ShieldCheck, Trash2 } from 'lucide-react';

interface BadgeCardProps {
  key?: string | number;
  badge: Badge;
  assignment?: any;
  count?: number; // Multiple awards multiplier e.g. 2 -> X2
  onRemove?: () => void;
  showRemoveButton?: boolean;
  onDeleteBadge?: () => void;
  showDeleteButton?: boolean;
  onAward?: () => void;
  showAwardButton?: boolean;
}


export function BadgeCard({
  badge,
  assignment,
  count,
  onRemove,
  showRemoveButton = false,
  onDeleteBadge,
  showDeleteButton = false,
  onAward,
  showAwardButton = false,
}: BadgeCardProps) {
  const isMythical = badge.rarity === 'Mythical';

  // Rarity Container Specific Styles (borders & box-shadow pulses)
  const getCardRarityClasses = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'Mythical':
        return 'border-2 border-amber-400 animate-pulse-mythical';
      case 'Legendary':
        return 'border-2 border-amber-500/80 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30';
      case 'Epic':
        return 'border-2 border-purple-500/80 animate-pulse-epic';
      case 'Rare':
        return 'border-2 border-blue-400/80 animate-pulse-rare';
      default:
        return 'border border-slate-200 shadow-md hover:shadow-lg';
    }
  };

  // Icon Background Specific Styles
  const getIconRarityClasses = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'Mythical':
        return 'bg-gradient-to-br from-amber-100 via-purple-100 to-amber-200 border-2 border-amber-400/80';
      case 'Legendary':
        return 'bg-gradient-to-br from-amber-100 to-yellow-100 border-2 border-amber-400/80';
      case 'Epic':
        return 'bg-gradient-to-br from-purple-100 to-indigo-100 border-2 border-purple-400/80';
      case 'Rare':
        return 'bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-400/80';
      default:
        return 'bg-slate-100 border border-slate-200';
    }
  };

  // Rarity Styling Configs
  const getRarityBadge = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'Mythical':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 via-purple-600 to-amber-500 text-white shadow-md animate-pulse">
            <Sparkles className="w-3 h-3 text-yellow-300" />
            Mythical
          </span>
        );
      case 'Legendary':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black px-3 py-0.5 rounded-full bg-amber-500 text-white shadow-sm">
            <Sparkles className="w-3 h-3" />
            Legendary
          </span>
        );
      case 'Epic':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-0.5 rounded-full bg-purple-600 text-white">
            Epic
          </span>
        );
      case 'Rare':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-0.5 rounded-full bg-blue-600 text-white">
            Rare
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-3 py-0.5 rounded-full bg-slate-200 text-slate-700">
            Common
          </span>
        );
    }
  };

  return (
    <div
      className={`relative group rounded-3xl p-5 text-center transition-all duration-300 flex flex-col items-center justify-between min-h-[260px] bg-white ${getCardRarityClasses(
        badge.rarity
      )}`}
    >
      {/* Animated Border Container for Mythical Badges */}
      {isMythical && (
        <div className="absolute -inset-[2px] rounded-[26px] bg-gradient-to-r from-amber-400 via-purple-600 to-amber-400 animate-border-glow -z-10 opacity-90 blur-[1px] group-hover:opacity-100 transition-opacity" />
      )}

      {/* Multiple Awards Stacking Badge (X2, X3, etc.) on Top Right */}
      {count && count > 1 && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 via-purple-600 to-amber-500 text-white font-black text-xs shadow-lg border border-white/40 dir-ltr animate-bounce">
          <Sparkles className="w-3 h-3 text-amber-200 shrink-0" />
          <span>X{count}</span>
        </div>
      )}

      {/* Action Remove Button */}
      {showRemoveButton && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title="سحب الوسام"
          className="absolute top-3 left-3 text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded-xl font-bold transition-colors cursor-pointer border border-red-200 z-10"
        >
          إلغاء الوسام
        </button>
      )}

      {/* Action Delete System Badge Button */}
      {showDeleteButton && onDeleteBadge && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteBadge();
          }}
          title="حذف الوسام نهائياً من النظام"
          className="absolute top-3 left-3 px-2 py-1 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl font-bold text-[11px] transition-all cursor-pointer border border-red-200 z-10 flex items-center gap-1 shadow-2xs group/del hover:scale-105 active:scale-95"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-600 group-hover/del:text-white transition-colors" />
          <span>حذف</span>
        </button>
      )}

      {/* Top Badge Icon */}
      <div className="pt-2 flex flex-col items-center">
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-3 shadow-md relative transition-transform duration-300 group-hover:scale-110 ${getIconRarityClasses(
            badge.rarity
          )}`}
        >
          {badge.icon && (badge.icon.startsWith('data:') || badge.icon.startsWith('http') || badge.icon.startsWith('/')) ? (
            <img src={badge.icon} alt={badge.name} className="w-16 h-16 object-contain p-1 rounded-2xl drop-shadow-xs" />
          ) : (
            <span>{badge.icon}</span>
          )}
          {isMythical && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-extrabold text-lg text-slate-900 leading-tight mb-1.5 flex items-center gap-1.5">
          {badge.name}
        </h3>

        {/* Rarity & Limited Type Badge */}
        <div className="mb-3 flex flex-wrap items-center justify-center gap-1.5">
          {getRarityBadge(badge.rarity)}
          {badge.limitType === 'monthly' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
              📅 محدود شهرياً ({badge.maxQuantity} طلاب/شهر)
            </span>
          )}
          {badge.limitType === 'forever' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              🔒 محدود للأبد (أقصى {badge.maxQuantity})
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-600 font-medium px-2 leading-relaxed max-w-[220px]">
        {badge.description}
      </p>

      {/* Direct Award Button */}
      {(showAwardButton || onAward) && onAward && (
        <div className="w-full mt-3 pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAward();
            }}
            className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-102 active:scale-98"
          >
            <Award className="w-4 h-4 text-slate-950" />
            <span>منح هذا الوسام</span>
          </button>
        </div>
      )}

      {/* Footer / Awarded Date */}
      <div className="w-full mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-center gap-1">
        <Calendar className="w-3.5 h-3.5 text-amber-500" />
        <span>
          {assignment?.awardedAt
            ? `حصل عليه: ${assignment.awardedAt}`
            : `تاريخ الإنشاء: ${badge.createdAt}`}
        </span>
      </div>
    </div>
  );
}

export function BadgesEmptyState() {
  return (
    <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center space-y-3 my-2">
      <div className="w-14 h-14 bg-amber-100/80 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-inner">
        🏅
      </div>
      <div className="space-y-1">
        <h4 className="font-bold text-slate-800 text-base">لا تملك اي وسام بعد</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          ستظهر الأوسمة والتكريمات الممنوحة لك هنا فور اعتمادها رسمياً من إدارة المدرسة.
        </p>
      </div>
    </div>
  );
}
