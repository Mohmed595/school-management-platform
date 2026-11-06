import React from 'react';
import { getAvatarLayoutByUid, ROLE_AVATARS } from '../../lib/avatarLayouts';
import {
  getStudentAvatarTheme,
  getStudentInitial,
  isStudentAvatarThemeId,
} from '../../lib/studentAvatarThemes';

interface AvatarDisplayProps {
  layoutUid?: string | null;
  name?: string | null;
  studentName?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  showGlow?: boolean;
  alt?: string;
  onClick?: () => void;
  isStudent?: boolean;
}

const SIZE_MAP = {
  xs: { box: 'w-6 h-6 rounded-lg', text: 'text-[10px]' },
  sm: { box: 'w-8 h-8 rounded-xl', text: 'text-xs' },
  md: { box: 'w-10 h-10 rounded-2xl', text: 'text-sm' },
  lg: { box: 'w-12 h-12 rounded-2xl', text: 'text-base' },
  xl: { box: 'w-16 h-16 rounded-2xl', text: 'text-2xl' },
  '2xl': { box: 'w-24 h-24 rounded-3xl', text: 'text-4xl' },
  '3xl': { box: 'w-32 h-32 rounded-3xl', text: 'text-5xl' },
};

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  layoutUid,
  name,
  studentName,
  size = 'md',
  className = '',
  showGlow = false,
  alt,
  onClick,
  isStudent,
}) => {
  const effectiveName = studentName || name;
  const isExplicitTheme = isStudentAvatarThemeId(layoutUid);
  
  // Check if this is a staff role avatar (Admin, Attendance Teacher, Normal Teacher)
  const isStaffRoleAvatar =
    layoutUid === ROLE_AVATARS.ADMIN ||
    layoutUid === ROLE_AVATARS.ATTENDANCE_TEACHER ||
    layoutUid === ROLE_AVATARS.NORMAL_TEACHER;

  // Determine whether to render a student letter avatar:
  // 1. Explicit theme ID ('theme_*')
  // 2. Explicitly flagged as student (isStudent === true)
  // 3. Name was passed AND it's not an explicit staff role avatar
  const renderStudentAvatar =
    isExplicitTheme ||
    isStudent === true ||
    (Boolean(effectiveName) && !isStaffRoleAvatar);

  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  if (renderStudentAvatar) {
    const theme = getStudentAvatarTheme(layoutUid);
    const initial = getStudentInitial(effectiveName || alt);

    return (
      <div
        onClick={onClick}
        title={alt || effectiveName || theme.name}
        style={{
          backgroundColor: theme.solidFallbackColor,
          boxShadow: showGlow ? `0 0 20px ${theme.solidFallbackColor}80` : undefined,
        }}
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden select-none transition-transform duration-200 ${
          theme.gradientClass
        } ${theme.borderClass} ${showGlow ? theme.glowClass : 'shadow-xs'} ${
          sizeConfig.box
        } ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''} ${className}`}
      >
        <span
          className={`font-black text-white leading-none flex items-center justify-center drop-shadow-xs pointer-events-none font-['Cairo',sans-serif] ${sizeConfig.text}`}
        >
          {initial}
        </span>
      </div>
    );
  }

  // Fallback / Staff Role Avatar Rendering (Admin, Teacher, Attendance Teacher)
  const layout = getAvatarLayoutByUid(layoutUid || undefined);

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl bg-black border border-slate-800 overflow-hidden shadow-md select-none transition-transform duration-200 ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${sizeConfig.box} ${className}`}
      style={{
        boxShadow: showGlow ? `0 0 16px ${layout.glowColor}` : undefined,
      }}
      title={`${layout.layout_name} (${layout.title_ar})`}
    >
      <img
        src={layout.image_url}
        alt={alt || layout.layout_name}
        className="w-full h-full object-cover rounded-2xl"
        loading="lazy"
      />
    </div>
  );
};
