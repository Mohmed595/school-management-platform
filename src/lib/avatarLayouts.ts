export interface AvatarLayout {
  id: string;
  layout_uid: string; // e.g. AVL-000001
  layout_name: string; // e.g. 🛡️ Guardian
  title_ar: string;
  description_ar: string;
  category: 'legendary' | 'epic' | 'rare' | 'mythic';
  themeColor: string;
  glowColor: string;
  svgContent: string;
  image_url: string; // Base64 or Data URI SVG
  created_at: string;
}

// Storage keys
const AVATAR_SELECTIONS_KEY = 'user_avatar_selections_v1';

// Helper to encode SVG string into crisp Data URL
function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Generate the 25 Sol's RNG / Sci-Fi Dark Luxury 480x480 SVGs
export const AVATAR_LAYOUTS: AvatarLayout[] = [
  {
    id: '1',
    layout_uid: 'AVL-000001',
    layout_name: '🏛️ School Administration',
    title_ar: 'القيادة والإدارة المدرسية الموحدة',
    description_ar: 'الشعار الرسمي الموحد والمعتمد لجميع حسابات وأفراد إدارة المدرسة والمنصة.',
    category: 'legendary',
    themeColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.35"/>
          <stop offset="60%" stop-color="#b45309" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffe082"/>
          <stop offset="50%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#78350f"/>
        </linearGradient>
      </defs>
      <circle cx="240" cy="240" r="210" fill="url(#g1)"/>
      <circle cx="240" cy="240" r="200" fill="none" stroke="#d97706" stroke-width="2" stroke-dasharray="12, 6" opacity="0.6"/>
      <circle cx="240" cy="240" r="180" fill="none" stroke="#fbbf24" stroke-width="1.5" opacity="0.4"/>
      <!-- Outer Hexagon -->
      <polygon points="240,60 380,140 380,340 240,420 100,340 100,140" fill="none" stroke="url(#goldGrad)" stroke-width="4"/>
      <!-- Inner Glowing Hexagon -->
      <polygon points="240,90 350,155 350,325 240,390 130,325 130,155" fill="#0f0901" stroke="#fbbf24" stroke-width="2"/>
      <!-- Center Emblem Crystal -->
      <polygon points="240,140 310,240 240,340 170,240" fill="none" stroke="url(#goldGrad)" stroke-width="3"/>
      <polygon points="240,170 285,240 240,310 195,240" fill="#f59e0b" opacity="0.25" stroke="#ffe082" stroke-width="1.5"/>
      <!-- Decorative Lines and Chevrons -->
      <line x1="240" y1="60" x2="240" y2="140" stroke="#f59e0b" stroke-width="2"/>
      <line x1="240" y1="340" x2="240" y2="420" stroke="#f59e0b" stroke-width="2"/>
      <line x1="100" y1="240" x2="170" y2="240" stroke="#f59e0b" stroke-width="2"/>
      <line x1="310" y1="240" x2="380" y2="240" stroke="#f59e0b" stroke-width="2"/>
      <!-- Corner Triangles -->
      <polygon points="100,140 130,155 100,170" fill="#fbbf24"/>
      <polygon points="380,140 350,155 380,170" fill="#fbbf24"/>
      <polygon points="100,340 130,325 100,310" fill="#fbbf24"/>
      <polygon points="380,340 350,325 380,310" fill="#fbbf24"/>
      <!-- Floating Particles -->
      <circle cx="240" cy="240" r="6" fill="#ffe082"/>
      <circle cx="200" cy="180" r="3" fill="#fbbf24"/>
      <circle cx="280" cy="180" r="3" fill="#fbbf24"/>
      <circle cx="200" cy="300" r="3" fill="#fbbf24"/>
      <circle cx="280" cy="300" r="3" fill="#fbbf24"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '2',
    layout_uid: 'AVL-000002',
    layout_name: '⭐ Nova',
    title_ar: 'النجم الساطع',
    description_ar: 'حلقات مدارية سيانية تحيط بنواة هندسية ثلاثية الأبعاد.',
    category: 'mythic',
    themeColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.4"/>
          <stop offset="70%" stop-color="#0891b2" stop-opacity="0.05"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#a5f3fc"/>
          <stop offset="50%" stop-color="#06b6d4"/>
          <stop offset="100%" stop-color="#164e63"/>
        </linearGradient>
      </defs>
      <circle cx="240" cy="240" r="220" fill="url(#g2)"/>
      <!-- Orbits -->
      <ellipse cx="240" cy="240" rx="190" ry="80" fill="none" stroke="url(#cyanGrad)" stroke-width="2.5" transform="rotate(-25 240 240)"/>
      <ellipse cx="240" cy="240" rx="190" ry="80" fill="none" stroke="#22d3ee" stroke-width="1.5" stroke-dasharray="8 6" transform="rotate(35 240 240)"/>
      <!-- Central Double Hexagon -->
      <polygon points="240,80 370,160 370,320 240,400 110,320 110,160" fill="none" stroke="#0891b2" stroke-width="2"/>
      <polygon points="240,120 330,175 330,305 240,360 150,305 150,175" fill="#042f2e" stroke="url(#cyanGrad)" stroke-width="3"/>
      <!-- Star Burst Lines -->
      <path d="M240 100 L240 380 M100 240 L380 240 M140 140 L340 340 M140 340 L340 140" stroke="#a5f3fc" stroke-width="1" opacity="0.3"/>
      <!-- Center Diamond -->
      <polygon points="240,170 290,240 240,310 190,240" fill="#06b6d4" opacity="0.3" stroke="#22d3ee" stroke-width="2"/>
      <circle cx="240" cy="240" r="12" fill="#a5f3fc"/>
      <!-- Orbit Dots -->
      <circle cx="370" cy="210" r="6" fill="#22d3ee"/>
      <circle cx="110" cy="270" r="5" fill="#a5f3fc"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '3',
    layout_uid: 'AVL-000003',
    layout_name: '💎 Prism',
    title_ar: 'المنشور البلوري',
    description_ar: 'بلورة زمردية مقطوعة بعناية مع أربطة خطوط ليزرية حادة.',
    category: 'epic',
    themeColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g3" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#34d399" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="emGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#a7f3d0"/>
          <stop offset="50%" stop-color="#10b981"/>
          <stop offset="100%" stop-color="#064e3b"/>
        </linearGradient>
      </defs>
      <circle cx="240" cy="240" r="200" fill="url(#g3)"/>
      <polygon points="240,50 400,160 400,320 240,430 80,320 80,160" fill="none" stroke="#047857" stroke-width="2" stroke-dasharray="10 5"/>
      <polygon points="240,90 360,180 300,370 180,370 120,180" fill="#022c22" stroke="url(#emGrad)" stroke-width="3"/>
      <!-- Inner Crystal Facets -->
      <line x1="240" y1="90" x2="240" y2="370" stroke="#34d399" stroke-width="2"/>
      <line x1="240" y1="90" x2="180" y2="370" stroke="#34d399" stroke-width="1.5" opacity="0.6"/>
      <line x1="240" y1="90" x2="300" y2="370" stroke="#34d399" stroke-width="1.5" opacity="0.6"/>
      <line x1="120" y1="180" x2="360" y2="180" stroke="#a7f3d0" stroke-width="2"/>
      <line x1="120" y1="180" x2="240" y2="260" stroke="#34d399" stroke-width="1.5"/>
      <line x1="360" y1="180" x2="240" y2="260" stroke="#34d399" stroke-width="1.5"/>
      <!-- Outer Framing Corners -->
      <path d="M60 100 L100 60 L140 60" fill="none" stroke="#10b981" stroke-width="3"/>
      <path d="M420 100 L380 60 L340 60" fill="none" stroke="#10b981" stroke-width="3"/>
      <path d="M60 380 L100 420 L140 420" fill="none" stroke="#10b981" stroke-width="3"/>
      <path d="M420 380 L380 420 L340 420" fill="none" stroke="#10b981" stroke-width="3"/>
      <circle cx="240" cy="260" r="8" fill="#a7f3d0"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '4',
    layout_uid: 'AVL-000004',
    layout_name: '🌌 Eclipse',
    title_ar: 'الكسوف الكوني',
    description_ar: 'حلقة هالاوية زرقاء داكنة تحيط بنواة مظلمة مهيبة.',
    category: 'mythic',
    themeColor: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g4" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.5"/>
          <stop offset="50%" stop-color="#1d4ed8" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="210" fill="url(#g4)"/>
      <circle cx="240" cy="240" r="170" fill="none" stroke="#3b82f6" stroke-width="3" stroke-dasharray="4 8 12 8"/>
      <circle cx="240" cy="240" r="140" fill="#030712" stroke="#60a5fa" stroke-width="4"/>
      <!-- Sunburst Rays -->
      <g stroke="#93c5fd" stroke-width="1.5" opacity="0.6">
        <line x1="240" y1="20" x2="240" y2="70"/>
        <line x1="240" y1="410" x2="240" y2="460"/>
        <line x1="20" y1="240" x2="70" y2="240"/>
        <line x1="410" y1="240" x2="460" y2="240"/>
        <line x1="84" y1="84" x2="120" y2="120"/>
        <line x1="360" y1="360" x2="396" y2="396"/>
        <line x1="396" y1="84" x2="360" y2="120"/>
        <line x1="120" y1="360" x2="84" y2="396"/>
      </g>
      <!-- Crescent Corona Accent -->
      <path d="M240 100 A140 140 0 0 1 380 240 A140 140 0 0 0 240 100 Z" fill="#60a5fa" opacity="0.4"/>
      <circle cx="240" cy="240" r="90" fill="#000000" stroke="#1e40af" stroke-width="2"/>
      <polygon points="240,180 255,225 300,240 255,255 240,300 225,255 180,240 225,225" fill="#93c5fd"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '5',
    layout_uid: 'AVL-000005',
    layout_name: '⚡ Vector',
    title_ar: 'المتجه الفائق',
    description_ar: 'أجنحة حادة وموجات طاقة هندسية مائلة مفعمة بالسرعة.',
    category: 'rare',
    themeColor: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g5" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fde047" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="200" fill="url(#g5)"/>
      <!-- Diagonal Chevrons -->
      <path d="M80 120 L240 60 L400 120 L240 180 Z" fill="#1c1917" stroke="#eab308" stroke-width="3"/>
      <path d="M80 240 L240 180 L400 240 L240 300 Z" fill="#292524" stroke="#fde047" stroke-width="3"/>
      <path d="M80 360 L240 300 L400 360 L240 420 Z" fill="#1c1917" stroke="#ca8a04" stroke-width="3"/>
      <!-- Side Spikes -->
      <polygon points="40,240 80,200 80,280" fill="#fde047"/>
      <polygon points="440,240 400,200 400,280" fill="#fde047"/>
      <line x1="240" y1="40" x2="240" y2="440" stroke="#fde047" stroke-width="1.5" stroke-dasharray="6 4"/>
      <circle cx="240" cy="240" r="10" fill="#ffffff" stroke="#eab308" stroke-width="3"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '6',
    layout_uid: 'AVL-000006',
    layout_name: '🔷 Zenith',
    title_ar: 'الذروة الأفقية',
    description_ar: 'شبكة معينات متداخلة باللون الأزرق النيون المتدرج.',
    category: 'epic',
    themeColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g6" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="210" fill="url(#g6)"/>
      <!-- Rhombus Grid -->
      <polygon points="240,40 440,240 240,440 40,240" fill="none" stroke="#0284c7" stroke-width="3"/>
      <polygon points="240,80 400,240 240,400 80,240" fill="#0c4a6e" stroke="#38bdf8" stroke-width="2.5" opacity="0.6"/>
      <polygon points="240,130 350,240 240,350 130,240" fill="none" stroke="#bae6fd" stroke-width="2"/>
      <polygon points="240,180 300,240 240,300 180,240" fill="#38bdf8" opacity="0.3" stroke="#ffffff" stroke-width="2"/>
      <!-- Crosshairs -->
      <line x1="240" y1="20" x2="240" y2="460" stroke="#7dd3fc" stroke-width="1.5" stroke-dasharray="8 6"/>
      <line x1="20" y1="240" x2="460" y2="240" stroke="#7dd3fc" stroke-width="1.5" stroke-dasharray="8 6"/>
      <circle cx="240" cy="240" r="14" fill="#0284c7" stroke="#bae6fd" stroke-width="3"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '7',
    layout_uid: 'AVL-000007',
    layout_name: '🌠 Orbit',
    title_ar: 'المدار الفلكي',
    description_ar: 'ثلاث حلقات كوكبية متداخلة بدقة مع نجوم متلألئة.',
    category: 'rare',
    themeColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g7" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#c084fc" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="210" fill="url(#g7)"/>
      <ellipse cx="240" cy="240" rx="190" ry="60" fill="none" stroke="#a855f7" stroke-width="3" transform="rotate(0 240 240)"/>
      <ellipse cx="240" cy="240" rx="190" ry="60" fill="none" stroke="#e879f9" stroke-width="2.5" transform="rotate(60 240 240)"/>
      <ellipse cx="240" cy="240" rx="190" ry="60" fill="none" stroke="#818cf8" stroke-width="2.5" transform="rotate(120 240 240)"/>
      <circle cx="240" cy="240" r="60" fill="#3b0764" stroke="#f0abfc" stroke-width="3"/>
      <circle cx="240" cy="240" r="25" fill="#e879f9"/>
      <circle cx="380" cy="240" r="7" fill="#ffffff"/>
      <circle cx="170" cy="120" r="6" fill="#f0abfc"/>
      <circle cx="310" cy="360" r="8" fill="#818cf8"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '8',
    layout_uid: 'AVL-000008',
    layout_name: '🔶 Apex',
    title_ar: 'القمة الماسية',
    description_ar: 'تاج برتقالي ماسي تحيط به شرائح هندسية حادة.',
    category: 'legendary',
    themeColor: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g8" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fdba74" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="200" fill="url(#g8)"/>
      <polygon points="240,40 420,400 60,400" fill="none" stroke="#ea580c" stroke-width="4"/>
      <polygon points="240,90 380,380 100,380" fill="#431407" stroke="#f97316" stroke-width="2.5"/>
      <polygon points="240,150 330,350 150,350" fill="#f97316" opacity="0.25" stroke="#ffedd5" stroke-width="2"/>
      <line x1="240" y1="40" x2="240" y2="400" stroke="#ffedd5" stroke-width="2"/>
      <circle cx="240" cy="220" r="12" fill="#fdba74"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '9',
    layout_uid: 'AVL-000009',
    layout_name: '🔱 Titan',
    title_ar: 'العملاق الجبار',
    description_ar: 'درع رمح ثلاثي أحمر ياقوتي يعكس قوة الهيمنة.',
    category: 'mythic',
    themeColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g9" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fca5a5" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="210" fill="url(#g9)"/>
      <polygon points="240,50 380,110 380,310 240,430 100,310 100,110" fill="#450a0a" stroke="#ef4444" stroke-width="3"/>
      <!-- Trident Spear Core -->
      <path d="M240 80 L240 380 M180 140 L180 240 L240 280 L300 240 L300 140" fill="none" stroke="#fca5a5" stroke-width="3"/>
      <polygon points="240,80 220,130 260,130" fill="#ef4444"/>
      <polygon points="180,140 165,180 195,180" fill="#ef4444"/>
      <polygon points="300,140 285,180 315,180" fill="#ef4444"/>
      <circle cx="240" cy="280" r="10" fill="#ffffff" stroke="#b91c1c" stroke-width="3"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '10',
    layout_uid: 'AVL-000010',
    layout_name: '🎓 Academic Teacher',
    title_ar: 'المعلم الأكاديمي والتعليم',
    description_ar: 'الصورة الرسمية الخاصة بكادر المعلمين والمعلمات الأكاديميين.',
    category: 'legendary',
    themeColor: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g10" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fef08a" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="210" fill="url(#g10)"/>
      <circle cx="240" cy="240" r="180" fill="none" stroke="#ca8a04" stroke-width="2"/>
      <polygon points="240,70 390,240 240,410 90,240" fill="#292524" stroke="#eab308" stroke-width="3"/>
      <!-- Inner Crown Grid -->
      <path d="M140 190 L240 110 L340 190 L300 290 L180 290 Z" fill="#78350f" stroke="#fde047" stroke-width="2"/>
      <circle cx="240" cy="110" r="8" fill="#ffffff"/>
      <circle cx="140" cy="190" r="6" fill="#fde047"/>
      <circle cx="340" cy="190" r="6" fill="#fde047"/>
      <circle cx="240" cy="240" r="16" fill="#eab308" stroke="#ffffff" stroke-width="2"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '11',
    layout_uid: 'AVL-000011',
    layout_name: '🪐 Cosmos',
    title_ar: 'الكون اللانهائي',
    description_ar: 'نظام كوكبي ذو حلقات زحلية متلألئة في عمق الفضاء.',
    category: 'mythic',
    themeColor: '#818cf8',
    glowColor: 'rgba(129, 140, 248, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g11" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#c7d2fe" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="210" fill="url(#g11)"/>
      <ellipse cx="240" cy="240" rx="210" ry="50" fill="none" stroke="#818cf8" stroke-width="4" transform="rotate(-20 240 240)"/>
      <ellipse cx="240" cy="240" rx="180" ry="35" fill="none" stroke="#a5b4fc" stroke-width="2" transform="rotate(-20 240 240)"/>
      <circle cx="240" cy="240" r="85" fill="#1e1b4b" stroke="#6366f1" stroke-width="3"/>
      <circle cx="210" cy="210" r="18" fill="#a5b4fc" opacity="0.4"/>
      <circle cx="390" cy="180" r="6" fill="#ffffff"/>
      <circle cx="90" cy="300" r="8" fill="#818cf8"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '12',
    layout_uid: 'AVL-000012',
    layout_name: '🔮 Nexus',
    title_ar: 'الربط العصبي',
    description_ar: 'شبكة جيوديسية أرجوانية ترتبط بنواة طاقة مركزية.',
    category: 'epic',
    themeColor: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g12" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#e9d5ff" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="210" fill="url(#g12)"/>
      <polygon points="240,60 380,140 380,340 240,420 100,340 100,140" fill="none" stroke="#a855f7" stroke-width="2"/>
      <polygon points="240,110 330,170 330,310 240,370 150,310 150,170" fill="#3b0764" stroke="#c084fc" stroke-width="2.5"/>
      <line x1="240" y1="60" x2="240" y2="420" stroke="#e9d5ff" stroke-width="1.5"/>
      <line x1="100" y1="140" x2="380" y2="340" stroke="#e9d5ff" stroke-width="1.5"/>
      <line x1="100" y1="340" x2="380" y2="140" stroke="#e9d5ff" stroke-width="1.5"/>
      <circle cx="240" cy="240" r="30" fill="#a855f7" stroke="#ffffff" stroke-width="3"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '13',
    layout_uid: 'AVL-000013',
    layout_name: '💥 Vanguard',
    title_ar: 'الطليعة الشجاعة',
    description_ar: 'رأس حربة متقدم ينبض بطاقة قرمزية هجومية.',
    category: 'rare',
    themeColor: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g13" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fecdd3" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="200" fill="url(#g13)"/>
      <polygon points="240,40 400,200 320,420 160,420 80,200" fill="#4c0519" stroke="#f43f5e" stroke-width="3"/>
      <polygon points="240,90 350,210 290,380 190,380 130,210" fill="none" stroke="#fb7185" stroke-width="2"/>
      <polygon points="240,140 300,220 240,340 180,220" fill="#f43f5e" opacity="0.3" stroke="#ffffff" stroke-width="2"/>
      <circle cx="240" cy="220" r="12" fill="#ffe4e6"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '14',
    layout_uid: 'AVL-000014',
    layout_name: '🌀 Vortex',
    title_ar: 'الدوامة الأثيرية',
    description_ar: 'دوامة سداسية تدور بحركات لولبية متوهجة.',
    category: 'epic',
    themeColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g14" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#67e8f9" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="210" fill="url(#g14)"/>
      <g stroke="#22d3ee" fill="none" stroke-width="2.5">
        <polygon points="240,50 390,130 390,350 240,430 90,350 90,130" transform="rotate(0 240 240)"/>
        <polygon points="240,50 390,130 390,350 240,430 90,350 90,130" transform="rotate(15 240 240)" opacity="0.8"/>
        <polygon points="240,50 390,130 390,350 240,430 90,350 90,130" transform="rotate(30 240 240)" opacity="0.6"/>
        <polygon points="240,50 390,130 390,350 240,430 90,350 90,130" transform="rotate(45 240 240)" opacity="0.4"/>
      </g>
      <circle cx="240" cy="240" r="20" fill="#a5f3fc"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '15',
    layout_uid: 'AVL-000015',
    layout_name: '⚔️ Sentinel',
    title_ar: 'الحارس الشاهق',
    description_ar: 'شفرات متقاطعة بإطارات بلاتينية حادة الفخامة.',
    category: 'legendary',
    themeColor: '#94a3b8',
    glowColor: 'rgba(148, 163, 184, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g15" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#f1f5f9" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="200" fill="url(#g15)"/>
      <!-- Cross Blades -->
      <path d="M80 80 L400 400 M400 80 L80 400" stroke="#cbd5e1" stroke-width="8"/>
      <polygon points="240,70 370,240 240,410 110,240" fill="#0f172a" stroke="#38bdf8" stroke-width="3"/>
      <polygon points="240,120 320,240 240,360 160,240" fill="none" stroke="#ffffff" stroke-width="2"/>
      <circle cx="240" cy="240" r="14" fill="#38bdf8" stroke="#ffffff" stroke-width="2"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '16',
    layout_uid: 'AVL-000016',
    layout_name: '⚡ Pulsar',
    title_ar: 'النابض المشع',
    description_ar: 'موجات ترددية خضراء تشع من نواة الكوارتز.',
    category: 'rare',
    themeColor: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g16" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#86efac" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="210" fill="url(#g16)"/>
      <circle cx="240" cy="240" r="180" fill="none" stroke="#15803d" stroke-width="2"/>
      <circle cx="240" cy="240" r="140" fill="none" stroke="#22c55e" stroke-width="3" stroke-dasharray="16 8"/>
      <circle cx="240" cy="240" r="90" fill="none" stroke="#86efac" stroke-width="2"/>
      <polygon points="240,170 290,240 240,310 190,240" fill="#14532d" stroke="#4ade80" stroke-width="3"/>
      <circle cx="240" cy="240" r="10" fill="#ffffff"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '17',
    layout_uid: 'AVL-000017',
    layout_name: '💎 Diamond',
    title_ar: 'الماسة الزرقاء',
    description_ar: 'مجسم ثماني الأوجه ينعكس بإشعاعات ليزرية باهرة.',
    category: 'mythic',
    themeColor: '#60a5fa',
    glowColor: 'rgba(96, 165, 250, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g17" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#bfdbfe" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="210" fill="url(#g17)"/>
      <polygon points="240,50 390,180 240,430 90,180" fill="#1e3a8a" stroke="#60a5fa" stroke-width="3"/>
      <line x1="90" y1="180" x2="390" y2="180" stroke="#93c5fd" stroke-width="3"/>
      <line x1="240" y1="50" x2="240" y2="430" stroke="#93c5fd" stroke-width="2"/>
      <line x1="160" y1="180" x2="240" y2="430" stroke="#bfdbfe" stroke-width="1.5"/>
      <line x1="320" y1="180" x2="240" y2="430" stroke="#bfdbfe" stroke-width="1.5"/>
      <circle cx="240" cy="180" r="8" fill="#ffffff"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '18',
    layout_uid: 'AVL-000018',
    layout_name: '🌅 Horizon',
    title_ar: 'الأفق الساطع',
    description_ar: 'قوس شمس ذهبي يرتفع فوق قاعدة هندسية معاصرة.',
    category: 'legendary',
    themeColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g18" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fef08a" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="200" fill="url(#g18)"/>
      <path d="M60 280 A180 180 0 0 1 420 280 Z" fill="#78350f" stroke="#f59e0b" stroke-width="3"/>
      <line x1="40" y1="280" x2="440" y2="280" stroke="#fbbf24" stroke-width="4"/>
      <polygon points="240,120 300,280 180,280" fill="#fbbf24" opacity="0.5"/>
      <circle cx="240" cy="220" r="30" fill="#ffffff" stroke="#f59e0b" stroke-width="3"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '19',
    layout_uid: 'AVL-000019',
    layout_name: '🧬 Helix',
    title_ar: 'الرمز الحياتي',
    description_ar: 'حلزون ثلاثي الأبعاد سياني يعبر عن الجين المتطور.',
    category: 'epic',
    themeColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g19" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="200" fill="url(#g19)"/>
      <path d="M160 80 Q240 160 320 80 M160 160 Q240 240 320 160 M160 240 Q240 320 320 240 M160 320 Q240 400 320 320" fill="none" stroke="#06b6d4" stroke-width="3"/>
      <path d="M320 80 Q240 160 160 80 M320 160 Q240 240 160 160 M320 240 Q240 320 160 240 M320 320 Q240 400 160 320" fill="none" stroke="#22d3ee" stroke-width="3"/>
      <circle cx="240" cy="240" r="16" fill="#a5f3fc" stroke="#0891b2" stroke-width="3"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '20',
    layout_uid: 'AVL-000020',
    layout_name: '🏮 Ronin',
    title_ar: 'المحارب الغريب',
    description_ar: 'شعار الساموراي المظلم المزين بأسلوب نيون القرمز.',
    category: 'mythic',
    themeColor: '#e11d48',
    glowColor: 'rgba(225, 29, 72, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g20" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fda4af" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="210" fill="url(#g20)"/>
      <polygon points="240,60 380,240 240,420 100,240" fill="#4c0519" stroke="#f43f5e" stroke-width="3"/>
      <polygon points="240,100 340,240 240,380 140,240" fill="none" stroke="#fda4af" stroke-width="2"/>
      <line x1="140" y1="140" x2="340" y2="340" stroke="#ffffff" stroke-width="3"/>
      <line x1="340" y1="140" x2="140" y2="340" stroke="#ffffff" stroke-width="3"/>
      <circle cx="240" cy="240" r="18" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '21',
    layout_uid: 'AVL-000021',
    layout_name: '📋 Attendance Officer',
    title_ar: 'مسؤول انضباط وتتبع الحضور الرقمي',
    description_ar: 'الصورة الرسمية الخاصة بكادر المعلمين مسؤولي الحضور والغياب اليومي.',
    category: 'legendary',
    themeColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g21" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fde047" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="210" fill="url(#g21)"/>
      <path d="M240 20 L260 220 L460 240 L260 260 L240 460 L220 260 L20 240 L220 220 Z" fill="#f59e0b" stroke="#ffffff" stroke-width="2"/>
      <path d="M240 80 L250 230 L400 240 L250 250 L240 400 L230 250 L80 240 L230 230 Z" fill="#fde047" opacity="0.6"/>
      <circle cx="240" cy="240" r="20" fill="#ffffff"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '22',
    layout_uid: 'AVL-000022',
    layout_name: '🛡️ Aegis',
    title_ar: 'الدرع المنيع',
    description_ar: 'درع فولاذي سداسي ثقيل مصفح بزوايا بلاتينية.',
    category: 'epic',
    themeColor: '#64748b',
    glowColor: 'rgba(100, 116, 139, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g22" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#cbd5e1" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="200" fill="url(#g22)"/>
      <polygon points="240,60 380,120 380,320 240,420 100,320 100,120" fill="#1e293b" stroke="#94a3b8" stroke-width="4"/>
      <polygon points="240,100 350,150 350,300 240,380 130,300 130,150" fill="#334155" stroke="#cbd5e1" stroke-width="2"/>
      <line x1="240" y1="60" x2="240" y2="420" stroke="#38bdf8" stroke-width="3"/>
      <circle cx="240" cy="240" r="14" fill="#38bdf8" stroke="#ffffff" stroke-width="2"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '23',
    layout_uid: 'AVL-000023',
    layout_name: '🏛️ Pantheon',
    title_ar: 'الصرح العظيم',
    description_ar: 'أعمدة كلاسيكية مستقبلية تعكس الشموخ والأصالة.',
    category: 'legendary',
    themeColor: '#d97706',
    glowColor: 'rgba(217, 119, 6, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g23" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fef08a" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="200" fill="url(#g23)"/>
      <polygon points="240,80 400,160 80,160" fill="#78350f" stroke="#f59e0b" stroke-width="3"/>
      <rect x="100" y="180" width="30" height="180" fill="#d97706" stroke="#fef08a" stroke-width="2"/>
      <rect x="180" y="180" width="30" height="180" fill="#d97706" stroke="#fef08a" stroke-width="2"/>
      <rect x="270" y="180" width="30" height="180" fill="#d97706" stroke="#fef08a" stroke-width="2"/>
      <rect x="350" y="180" width="30" height="180" fill="#d97706" stroke="#fef08a" stroke-width="2"/>
      <rect x="70" y="370" width="340" height="30" fill="#451a03" stroke="#f59e0b" stroke-width="3"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '24',
    layout_uid: 'AVL-000024',
    layout_name: '🌌 Singularity',
    title_ar: 'المفردة الكونية',
    description_ar: 'حقل ثقب أسود ذو عدسة جاذبية داكنة فائقة العمق.',
    category: 'mythic',
    themeColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g24" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#000000" stop-opacity="1"/>
          <stop offset="70%" stop-color="#581c87" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#c084fc" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="220" stroke="#a855f7" stroke-width="2" stroke-dasharray="8 8" fill="none"/>
      <ellipse cx="240" cy="240" rx="200" ry="70" fill="none" stroke="#e879f9" stroke-width="4" transform="rotate(-30 240 240)"/>
      <circle cx="240" cy="240" r="120" fill="url(#g24)"/>
      <circle cx="240" cy="240" r="70" fill="#000000" stroke="#f0abfc" stroke-width="3"/>
      <circle cx="240" cy="240" r="10" fill="#ffffff"/>
    </svg>`,
    image_url: '',
  },
  {
    id: '25',
    layout_uid: 'AVL-000025',
    layout_name: '👑 Sovereign',
    title_ar: 'السلطان الأسمى',
    description_ar: 'تاج إمبراطوري يجمع ألوان الذهب والياقوت الأرستقراطي.',
    category: 'mythic',
    themeColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    created_at: '2026-01-01T00:00:00.000Z',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480">
      <rect width="480" height="480" fill="#000000"/>
      <defs>
        <radialGradient id="g25" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fef08a" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="210" fill="url(#g25)"/>
      <!-- Quad Gold Diamonds -->
      <polygon points="240,40 330,240 240,440 150,240" fill="#451a03" stroke="#fbbf24" stroke-width="4"/>
      <polygon points="240,80 300,240 240,400 180,240" fill="#78350f" stroke="#f59e0b" stroke-width="2"/>
      <polygon points="40,240 240,150 440,240 240,330" fill="none" stroke="#fef08a" stroke-width="2.5"/>
      <circle cx="240" cy="240" r="25" fill="#f59e0b" stroke="#ffffff" stroke-width="3"/>
      <circle cx="240" cy="240" r="10" fill="#ffffff"/>
    </svg>`,
    image_url: '',
  },
];

// Populate Data URLs dynamically
AVATAR_LAYOUTS.forEach((item) => {
  if (!item.image_url) {
    item.image_url = svgToDataUrl(item.svgContent);
  }
});

// Layout getter functions
export function getAllAvatarLayouts(): AvatarLayout[] {
  return AVATAR_LAYOUTS;
}

export function getAvatarLayoutByUid(uid?: string): AvatarLayout {
  if (!uid) return AVATAR_LAYOUTS[0];
  const found = AVATAR_LAYOUTS.find((l) => l.layout_uid === uid);
  return found || AVATAR_LAYOUTS[0];
}

// Role Avatar Constants
export const ROLE_AVATARS = {
  ADMIN: 'AVL-000001',              // القيادة والإدارة المدرسية الموحدة (جميع أفراد الإدارة)
  ATTENDANCE_TEACHER: 'AVL-000021', // مسئول انضباط وتتبع الحضور الرقمي
  NORMAL_TEACHER: 'AVL-000010',     // المعلم الأكاديمي والتعليم
};

// User-Avatar selection storage
export function getUserAvatarLayoutUid(userId: string): string {
  if (!userId) return ROLE_AVATARS.ADMIN;

  const id = String(userId).toLowerCase();

  // 1. All Administration Accounts share the exact same picture and cannot change it
  if (
    id === 'platform_owner' ||
    id === 'school_admin' ||
    id === 'admin' ||
    id === 'admin_school' ||
    id === 'school_administration' ||
    id.includes('admin') ||
    id.includes('principal') ||
    id.includes('owner')
  ) {
    return ROLE_AVATARS.ADMIN;
  }

  // 2. Attendance Teachers
  if (id.includes('attendance') || id === 'attendance_officer') {
    return ROLE_AVATARS.ATTENDANCE_TEACHER;
  }

  // 3. Normal Teachers
  if (id.includes('teacher') || id.includes('tch_')) {
    return ROLE_AVATARS.NORMAL_TEACHER;
  }

  // 4. Default for students
  // PostgreSQL is the single authoritative source of truth.
  // Fallback defaults safely to theme_default_blue
  return 'theme_default_blue';
}

export function setUserAvatarLayoutUid(_userId: string, layoutUid: string): void {
  try {
    window.dispatchEvent(new CustomEvent('student_avatar_updated', { detail: { themeId: layoutUid } }));
    window.dispatchEvent(new Event('avatar_selection_changed'));
  } catch (e) {
    console.error('Error dispatching avatar layout selection:', e);
  }
}
