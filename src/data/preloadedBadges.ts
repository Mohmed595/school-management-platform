import { Badge } from '../types/badge';

export interface PreloadedBadge extends Omit<Badge, 'id' | 'createdAt' | 'isActive'> {
  packId: string;
  packName: string;
  category: string;
}

const createSvgUrl = (svgContent: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;

// 1. Math & Science Genius Badge Vector Icon
const academicGeniusSvg = createSvgUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
    <linearGradient id="gold1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#818cf8"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#bg1)" stroke="#38bdf8" stroke-width="3"/>
  <circle cx="60" cy="60" r="46" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
  <ellipse cx="60" cy="60" rx="36" ry="14" fill="none" stroke="url(#cyanGlow)" stroke-width="2.5" transform="rotate(30 60 60)" opacity="0.85"/>
  <ellipse cx="60" cy="60" rx="36" ry="14" fill="none" stroke="url(#cyanGlow)" stroke-width="2.5" transform="rotate(-30 60 60)" opacity="0.85"/>
  <path d="M52 26 L72 26 L56 50 L68 50 L44 86 L52 58 L40 58 Z" fill="url(#gold1)"/>
  <path d="M60 28 L85 40 L60 52 L35 40 Z" fill="#ffffff" opacity="0.95"/>
  <path d="M45 46 L45 58 C45 63 75 63 75 58 L75 46" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.95"/>
  <path d="M90 35 L92 40 L97 40 L93 43 L95 48 L90 45 L85 48 L87 43 L83 40 L88 40 Z" fill="#fbbf24"/>
</svg>
`);

// 2. Knight of Ethics Badge Vector Icon
const ethicsKnightSvg = createSvgUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <linearGradient id="gold2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <linearGradient id="silver2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#bg2)" stroke="#34d399" stroke-width="3"/>
  <path d="M30 65 C25 45 40 30 50 26 M30 65 C25 75 40 88 52 92" fill="none" stroke="url(#gold2)" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M90 65 C95 45 80 30 70 26 M90 65 C95 75 80 88 68 92" fill="none" stroke="url(#gold2)" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M60 25 L82 34 C82 65 60 88 60 88 C60 88 38 65 38 34 Z" fill="url(#silver2)" stroke="url(#gold2)" stroke-width="3"/>
  <path d="M60 36 L60 74 M44 50 L76 50" fill="none" stroke="#059669" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M46 26 L49 18 L60 22 L71 18 L74 26 Z" fill="url(#gold2)"/>
</svg>
`);

// 3. Ambassador of Reading Badge Vector Icon
const readingAmbassadorSvg = createSvgUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#5b21b6"/>
    </linearGradient>
    <linearGradient id="gold3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#eab308"/>
    </linearGradient>
    <linearGradient id="pageGlow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#e0e7ff"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#bg3)" stroke="#a78bfa" stroke-width="3"/>
  <path d="M60 18 L60 28 M35 28 L42 34 M85 28 L78 34" stroke="#c084fc" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M60 78 C45 70 28 74 20 78 L20 48 C28 44 45 42 60 50 Z" fill="url(#pageGlow)" stroke="#a78bfa" stroke-width="1.5"/>
  <path d="M60 78 C75 70 92 74 100 78 L100 48 C92 44 75 42 60 50 Z" fill="url(#pageGlow)" stroke="#a78bfa" stroke-width="1.5"/>
  <path d="M60 50 L60 82" stroke="url(#gold3)" stroke-width="3.5"/>
  <path d="M65 30 Q75 25 85 18 C80 32 72 42 62 52 Z" fill="url(#gold3)"/>
  <line x1="28" y1="56" x2="52" y2="52" stroke="#818cf8" stroke-width="2" stroke-linecap="round"/>
  <line x1="28" y1="64" x2="52" y2="60" stroke="#818cf8" stroke-width="2" stroke-linecap="round"/>
  <line x1="68" y1="52" x2="92" y2="56" stroke="#818cf8" stroke-width="2" stroke-linecap="round"/>
  <line x1="68" y1="60" x2="92" y2="64" stroke="#818cf8" stroke-width="2" stroke-linecap="round"/>
  <circle cx="60" cy="22" r="3" fill="#fde047"/>
</svg>
`);

// 4. Young Leader & Innovator Badge Vector Icon
const youngLeaderSvg = createSvgUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ea580c"/>
      <stop offset="100%" stop-color="#c2410c"/>
    </linearGradient>
    <linearGradient id="rocketBody" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <linearGradient id="fireGlow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#facc15"/>
      <stop offset="50%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#ef4444"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#bg4)" stroke="#fb923c" stroke-width="3"/>
  <path d="M52 80 Q60 102 60 102 Q60 102 68 80 Q60 92 52 80 Z" fill="url(#fireGlow)"/>
  <path d="M55 80 Q60 94 60 94 Q60 94 65 80 Z" fill="#fef08a"/>
  <g transform="rotate(-25 60 55)">
    <path d="M42 62 L32 72 L44 70 Z" fill="#dc2626"/>
    <path d="M78 62 L88 72 L76 70 Z" fill="#dc2626"/>
    <path d="M60 20 C45 35 44 68 44 70 L76 70 C76 68 75 35 60 20 Z" fill="url(#rocketBody)" stroke="#cbd5e1" stroke-width="1"/>
    <path d="M60 20 C54 28 50 36 50 38 L70 38 C70 36 66 28 60 20 Z" fill="#dc2626"/>
    <circle cx="60" cy="48" r="8" fill="#38bdf8" stroke="#0284c7" stroke-width="2"/>
    <circle cx="58" cy="46" r="2.5" fill="#ffffff"/>
  </g>
  <path d="M25 35 L26.5 38 L30 38 L27 40.5 L28 44 L25 42 L22 44 L23 40.5 L20 38 L23.5 38 Z" fill="#fef08a"/>
</svg>
`);

// 5. Innovative Educator Badge Vector Icon
const innovativeTeacherSvg = createSvgUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg5" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1d4ed8"/>
      <stop offset="100%" stop-color="#1e40af"/>
    </linearGradient>
    <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="50%" stop-color="#93c5fd"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
    <linearGradient id="lightGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#bg5)" stroke="#60a5fa" stroke-width="3"/>
  <path d="M60 18 L60 26 M60 94 L60 102 M18 60 L26 60 M94 60 L102 60 M30 30 L36 36 M84 84 L90 90 M90 30 L84 36 M30 90 L36 84" stroke="#93c5fd" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
  <path d="M35 48 L60 24 L85 48 L60 92 Z" fill="url(#diamondGrad)" stroke="#ffffff" stroke-width="1.5"/>
  <path d="M35 48 L85 48 M60 24 L60 92 M48 48 L60 92 M72 48 L60 92" stroke="#ffffff" stroke-width="1" opacity="0.8"/>
  <path d="M35 48 L50 36 L60 48 L70 36 L85 48" stroke="#ffffff" stroke-width="1" fill="none" opacity="0.8"/>
  <circle cx="60" cy="48" r="7" fill="url(#lightGlow)"/>
  <path d="M82 26 L84 31 L89 31 L85 34 L87 39 L82 36 L77 39 L79 34 L75 31 L80 31 Z" fill="#fef08a"/>
</svg>
`);

// 6. Perfect Attendance Star Badge Vector Icon
const perfectAttendanceSvg = createSvgUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg6" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <linearGradient id="gold6" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#bg6)" stroke="#6ee7b7" stroke-width="3"/>
  <circle cx="60" cy="60" r="42" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.4"/>
  <circle cx="60" cy="60" r="30" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.6"/>
  <circle cx="60" cy="60" r="22" fill="url(#gold6)"/>
  <path d="M60 42 L64.5 51 L74.5 52.5 L67.2 59.6 L68.9 69.5 L60 64.8 L51.1 69.5 L52.8 59.6 L45.5 52.5 L55.5 51 Z" fill="#ffffff"/>
  <path d="M42 82 L60 76 L78 82 L72 98 L60 92 L48 98 Z" fill="#047857" stroke="#6ee7b7" stroke-width="1.5"/>
  <path d="M53 60 L58 65 L68 54" fill="none" stroke="#10b981" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`);

// 7. Academic Top Student Badge (Trophy & Laurel)
const academicTopSvg = createSvgUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="goldBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff7ed"/>
      <stop offset="100%" stop-color="#ffedd5"/>
    </linearGradient>
    <linearGradient id="trophyGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <linearGradient id="laurelLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#goldBg)" stroke="#f59e0b" stroke-width="2.5"/>
  <circle cx="60" cy="60" r="48" fill="none" stroke="#fcd34d" stroke-width="1.5" stroke-dasharray="3 3"/>
  <path d="M32 55 C25 40 38 25 45 22 M30 65 C25 80 40 90 48 92" fill="none" stroke="url(#laurelLeaf)" stroke-width="3" stroke-linecap="round"/>
  <path d="M88 55 C95 40 82 25 75 22 M90 65 C95 80 80 90 72 92" fill="none" stroke="url(#laurelLeaf)" stroke-width="3" stroke-linecap="round"/>
  <path d="M42 36 L78 36 C78 54 68 64 60 64 C52 64 42 54 42 36 Z" fill="url(#trophyGold)" stroke="#b45309" stroke-width="1.5"/>
  <path d="M42 40 C34 40 32 52 42 54" fill="none" stroke="url(#trophyGold)" stroke-width="3" stroke-linecap="round"/>
  <path d="M78 40 C86 40 88 52 78 54" fill="none" stroke="url(#trophyGold)" stroke-width="3" stroke-linecap="round"/>
  <path d="M56 64 L64 64 L64 76 L56 76 Z" fill="url(#trophyGold)"/>
  <path d="M46 76 L74 76 L70 84 L50 84 Z" fill="#b45309"/>
  <path d="M60 22 L63 29 L70 30 L65 35 L66 42 L60 38 L54 42 L55 35 L50 30 L57 29 Z" fill="#fef08a"/>
</svg>
`);

// 8. Monthly Star Badge Vector Icon
const monthlyStarSvg = createSvgUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="starGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fffbe3"/>
      <stop offset="100%" stop-color="#fef3c7"/>
    </linearGradient>
    <linearGradient id="starSun" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="40%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#starGlow)" stroke="#f59e0b" stroke-width="2"/>
  <g transform="translate(60,60)">
    ${Array.from({ length: 12 })
      .map(
        (_, i) => `<path d="M0 -42 L6 -22 L0 -18 L-6 -22 Z" fill="url(#starSun)" transform="rotate(${i * 30})" />`
      )
      .join('')}
  </g>
  <circle cx="60" cy="60" r="26" fill="url(#starSun)" stroke="#ffffff" stroke-width="2"/>
  <path d="M60 42 L64.5 52 L75 53.5 L67.5 61 L69.3 71.5 L60 66.5 L50.7 71.5 L52.5 61 L45 53.5 L55.5 52 Z" fill="#ffffff" stroke="#f59e0b" stroke-width="1"/>
</svg>
`);

// 9. Owner Crown Badge Vector Icon
const ownerCrownSvg = createSvgUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="crownGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fdf4ff"/>
      <stop offset="100%" stop-color="#fae8ff"/>
    </linearGradient>
    <linearGradient id="crownGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#crownGlow)" stroke="#c084fc" stroke-width="2.5"/>
  <path d="M30 75 L35 45 L48 60 L60 36 L72 60 L85 45 L90 75 Z" fill="url(#crownGold)" stroke="#854d0e" stroke-width="2"/>
  <rect x="30" y="75" width="60" height="10" rx="3" fill="#854d0e"/>
  <circle cx="35" cy="45" r="4" fill="#ef4444"/>
  <circle cx="60" cy="36" r="5" fill="#3b82f6"/>
  <circle cx="85" cy="45" r="4" fill="#ef4444"/>
  <circle cx="45" cy="80" r="2.5" fill="#3b82f6"/>
  <circle cx="60" cy="80" r="2.5" fill="#ef4444"/>
  <circle cx="75" cy="80" r="2.5" fill="#3b82f6"/>
</svg>
`);

// 10. Regular Attendance Shield Clock Vector Icon
const regularAttendanceClockSvg = createSvgUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="silverShieldBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#475569"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#silverShieldBg)" stroke="#94a3b8" stroke-width="2.5"/>
  <path d="M30 60 C24 45 36 30 45 28 M30 70 C24 82 38 90 48 92" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M90 60 C96 45 84 30 75 28 M90 70 C96 82 82 90 72 92" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M60 26 L82 36 C82 68 60 88 60 88 C60 88 38 68 38 36 Z" fill="url(#silverGrad)" stroke="#334155" stroke-width="2"/>
  <circle cx="60" cy="56" r="18" fill="#ffffff" stroke="#475569" stroke-width="2.5"/>
  <polyline points="60,44 60,56 68,56" fill="none" stroke="#1e293b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`);

export const PRELOADED_BADGES: PreloadedBadge[] = [
  {
    packId: 'pack-top-student',
    packName: 'حزمة المتفوقين',
    name: 'الأول على المدرسة',
    nameEn: 'School Champion',
    description: 'يُمنح للطالب الحاصل على المركز الأول في التحصيل الأكاديمي الشامل على مستوى المدرسة.',
    icon: academicTopSvg,
    color: '#D97706',
    rarity: 'Legendary',
    targetType: 'student',
    hasAnimatedBorder: true,
    limitType: 'forever',
    maxQuantity: 1,
    category: 'أكاديمي',
  },
  {
    packId: 'pack-monthly-star',
    packName: 'حزمة المتفوقين',
    name: 'نجم الشهر المتميز',
    nameEn: 'Monthly Star',
    description: 'وسام تقديري يتجدد شهرياً لأفضل الطلاب المتفوقين والنشطين خلال الشهر الدراسي.',
    icon: monthlyStarSvg,
    color: '#F59E0B',
    rarity: 'Legendary',
    targetType: 'student',
    hasAnimatedBorder: true,
    limitType: 'monthly',
    maxQuantity: 5,
    category: 'تميز',
  },
  {
    packId: 'pack-owner-mythical',
    packName: 'حزمة الإدارة والريادة',
    name: 'المالك 👑',
    nameEn: 'System Owner',
    description: 'وسام شرفي استثنائي يُمنح لقادة المدرسة والمسؤولين الأوائل عن منظومة التميز.',
    icon: ownerCrownSvg,
    color: '#C084FC',
    rarity: 'Mythical',
    targetType: 'student',
    hasAnimatedBorder: true,
    limitType: 'forever',
    maxQuantity: 3,
    category: 'ريادة',
  },
  {
    packId: 'pack-regular-attendance',
    packName: 'حزمة الحضور والالتزام',
    name: 'حضور منتظم',
    nameEn: 'Regular Attendance',
    description: 'تقدير للطالب المواظب على الحضور اليومي والمحافظ على المواقيت المدرسية بدقة.',
    icon: regularAttendanceClockSvg,
    color: '#3B82F6',
    rarity: 'Rare',
    targetType: 'student',
    hasAnimatedBorder: false,
    limitType: 'none',
    category: 'انضباط',
  },
  {
    packId: 'pack-academic-genius',
    packName: 'حزمة التميز الأكاديمي',
    name: 'عبقري الرياضيات والعلوم',
    nameEn: 'Math & Science Genius',
    description: 'يُمنح للطلاب المتميزين في حل المسائل المعقدة والابتكار العلمي والتفوق الأكاديمي.',
    icon: academicGeniusSvg,
    color: '#0284C7',
    rarity: 'Legendary',
    targetType: 'student',
    hasAnimatedBorder: true,
    limitType: 'none',
    category: 'أكاديمي',
  },
  {
    packId: 'pack-ethics-knight',
    packName: 'حزمة السلوك والانضباط',
    name: 'فارس الأخلاق والسلوك القويم',
    nameEn: 'Knight of Ethics',
    description: 'تقدير رفيع للطلاب الذين يظهرون انضباطاً راقياً وأخلاقاً حميدة واحتراماً للمدرسة.',
    icon: ethicsKnightSvg,
    color: '#059669',
    rarity: 'Epic',
    targetType: 'student',
    hasAnimatedBorder: true,
    limitType: 'none',
    category: 'سلوكي',
  },
  {
    packId: 'pack-reading-creative',
    packName: 'حزمة الإبداع والثقافة',
    name: 'سفير القراءة والإبداع',
    nameEn: 'Ambassador of Reading',
    description: 'يُمنح للشغوفين بالقراءة والاطلاع والتحصيل المعرفي وصُنّاع الفكر والابتكار.',
    icon: readingAmbassadorSvg,
    color: '#7C3AED',
    rarity: 'Rare',
    targetType: 'student',
    hasAnimatedBorder: false,
    limitType: 'none',
    category: 'إبداعي',
  },
  {
    packId: 'pack-young-leader',
    packName: 'حزمة القيادة والعمل الجماعي',
    name: 'القائد الصغير والمبادر',
    nameEn: 'Young Leader & Innovator',
    description: 'للطلاب أصحاب المبادرات القيادية والقدرة الممتازة على تنظيم الأنشطة ومساعدة زملائهم.',
    icon: youngLeaderSvg,
    color: '#EA580C',
    rarity: 'Mythical',
    targetType: 'student',
    hasAnimatedBorder: true,
    limitType: 'monthly',
    maxQuantity: 3,
    category: 'قيادة',
  },
  {
    packId: 'pack-innovative-teacher',
    packName: 'حزمة المعلمين المبدعين',
    name: 'المعلم المبتكر الملهِم',
    nameEn: 'Innovative Educator',
    description: 'وسام شرفي للمعلمين المبدعين في توظيف الوسائل الرقمية الحديثة وصنع حصص دراسية تفاعلية.',
    icon: innovativeTeacherSvg,
    color: '#2563EB',
    rarity: 'Mythical',
    targetType: 'teacher',
    hasAnimatedBorder: true,
    limitType: 'forever',
    maxQuantity: 2,
    category: 'معلمين',
  },
  {
    packId: 'pack-perfect-attendance',
    packName: 'حزمة الحضور والالتزام',
    name: 'وسام الالتزام والحضور المثالي',
    nameEn: 'Perfect Attendance Star',
    description: 'يُمنح للطلاب أصحاب السجل الخالي تماماً من التأخير والغياب طوال الفصل الدراسي.',
    icon: perfectAttendanceSvg,
    color: '#10B981',
    rarity: 'Legendary',
    targetType: 'student',
    hasAnimatedBorder: true,
    limitType: 'monthly',
    maxQuantity: 10,
    category: 'انضباط',
  },
];


