/**
 * Restora design tokens — forest + lime system (UI redesign v1).
 * Keep `colors.primary` as teal alias for gradual migration.
 */
export const colors = {
  // Brand
  forest: '#0B3D2E',
  forestMid: '#0F5C45',
  teal: '#0F766E',
  tealDark: '#0D5F59',
  tealLight: '#CCFBF1',
  lime: '#C8E86A',
  limeDark: '#9CBB3A',
  limeSoft: '#E8F5C8',
  mist: '#F3F7F0',

  // Semantic aliases (compat)
  primary: '#0F766E',
  primaryDark: '#0D5F59',
  primaryLight: '#CCFBF1',

  // Neutrals
  background: '#F3F7F0',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  textOnDark: '#FFFFFF',
  textOnLime: '#0B3D2E',
  border: '#D8E3D6',
  borderStrong: '#B7C9B3',

  // Status
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  amber: '#D97706',
  red: '#DC2626',
  green: '#16A34A',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
  fab: 28,
  tabBar: 32,
} as const;

export const elevation = {
  e1: {
    shadowColor: '#0B3D2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  e2: {
    shadowColor: '#0B3D2E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const typography = {
  hero: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.6 },
  title: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.4 },
  section: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 16, fontWeight: '500' as const },
  label: { fontSize: 13, fontWeight: '600' as const },
  caption: { fontSize: 12, fontWeight: '600' as const },
  metric: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.3 },
} as const;

/** Floating tab bar clearance so scroll content isn't obscured. */
export const TAB_BAR_CLEARANCE = 96;
