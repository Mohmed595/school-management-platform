export type ThemeId = 'blue' | 'emerald' | 'indigo' | 'teal' | 'violet' | 'amber' | 'rose';

export interface ThemePalette {
  id: ThemeId;
  name: string;
  description: string;
  primaryHex: string;
  primaryHoverHex: string;
  lightBgHex: string;
  borderHex: string;
  badgeClass: string;
  previewBg: string;
}

export const THEMES: ThemePalette[] = [
  {
    id: 'blue',
    name: 'الأزرق الملكي (الافتراضي)',
    description: 'الهوية الرسمية التقليدية لوزارة التعليم والمنصات الحكومية',
    primaryHex: '#2563eb',
    primaryHoverHex: '#1d4ed8',
    lightBgHex: '#eff6ff',
    borderHex: '#dbeafe',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    previewBg: 'bg-blue-600',
  },
  {
    id: 'emerald',
    name: 'الزمردي النيلي (Egyptian Emerald)',
    description: 'طابع راقٍ مستوحى من ضفاف النيل والنمو الأكاديمي المستدام',
    primaryHex: '#059669',
    primaryHoverHex: '#047857',
    lightBgHex: '#ecfdf5',
    borderHex: '#a7f3d0',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    previewBg: 'bg-emerald-600',
  },
  {
    id: 'indigo',
    name: 'البنفسجي الفرعوني (Royal Indigo)',
    description: 'لون فخم يعكس الهيبة الرقمية والابتكار التعليمي الحديث',
    primaryHex: '#4f46e5',
    primaryHoverHex: '#4338ca',
    lightBgHex: '#eef2ff',
    borderHex: '#c7d2fe',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    previewBg: 'bg-indigo-600',
  },
  {
    id: 'teal',
    name: 'التيل البحري (Nile Teal)',
    description: 'مظهر عصري متزن، مثالي لمؤسسات التكنولوجيا واللغات',
    primaryHex: '#0d9488',
    primaryHoverHex: '#0f766e',
    lightBgHex: '#f0fdfa',
    borderHex: '#99f6e4',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
    previewBg: 'bg-teal-600',
  },
  {
    id: 'violet',
    name: 'الفايوليت الأكاديمي (Academic Purple)',
    description: 'ثيم تكنولوجي مبتكر وجريء للجامعات والمدارس الدولية',
    primaryHex: '#7c3aed',
    primaryHoverHex: '#6d28d9',
    lightBgHex: '#f5f3ff',
    borderHex: '#ddd6fe',
    badgeClass: 'bg-violet-100 text-violet-800 border-violet-200',
    previewBg: 'bg-violet-600',
  },
  {
    id: 'amber',
    name: 'الذهبي البرونزي (Luxury Amber)',
    description: 'طابع دافئ وفاخر مناسب للمدارس والجامعات الخاصة المتميزة',
    primaryHex: '#d97706',
    primaryHoverHex: '#b45309',
    lightBgHex: '#fffbeb',
    borderHex: '#fde68a',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    previewBg: 'bg-amber-600',
  },
  {
    id: 'rose',
    name: 'العنابي الياقوتي (Ruby Red)',
    description: 'هوية بصرية حيوية ومتميزة للأنشطة والمدارس النموذجية',
    primaryHex: '#e11d48',
    primaryHoverHex: '#be123c',
    lightBgHex: '#fff1f2',
    borderHex: '#fecdd3',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    previewBg: 'bg-rose-600',
  },
];

const STORAGE_KEY_THEME = 'eg_school_platform_theme_v1';

export function getStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_THEME);
    if (stored && THEMES.some((t) => t.id === stored)) {
      return stored as ThemeId;
    }
  } catch (e) {
    console.error('Failed to read theme from localStorage', e);
  }
  return 'blue';
}

export function setStoredTheme(themeId: ThemeId): void {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, themeId);
  } catch (e) {
    console.error('Failed to save theme to localStorage', e);
  }
  applyThemeToDocument(themeId);
}

export function applyThemeToDocument(themeId: ThemeId): void {
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  const root = document.documentElement;

  root.setAttribute('data-theme', theme.id);
  root.style.setProperty('--primary-color', theme.primaryHex);
  root.style.setProperty('--primary-hover', theme.primaryHoverHex);
  root.style.setProperty('--primary-light', theme.lightBgHex);
  root.style.setProperty('--primary-border', theme.borderHex);
}
