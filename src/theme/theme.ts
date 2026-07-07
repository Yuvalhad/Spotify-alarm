/**
 * WakeTune design tokens.
 * Dark, energetic, music-first: dark background, Spotify green accents,
 * dark cards, big obvious buttons.
 */
export const colors = {
  background: '#0D0F12',
  surface: '#16191F',
  surfaceElevated: '#1E2229',
  border: '#2A2F38',

  primary: '#1DB954', // Spotify green
  primaryPressed: '#17A047',
  onPrimary: '#04270F',

  danger: '#FF5252',
  warning: '#FFB020',

  textPrimary: '#FFFFFF',
  textSecondary: '#A7B0BC',
  textMuted: '#6B7280',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
};

export const typography = {
  title: {fontSize: 28, fontWeight: '700' as const, color: colors.textPrimary},
  subtitle: {fontSize: 18, fontWeight: '600' as const, color: colors.textSecondary},
  body: {fontSize: 16, color: colors.textPrimary},
  caption: {fontSize: 13, color: colors.textMuted},
  huge: {fontSize: 56, fontWeight: '800' as const, color: colors.textPrimary},
};
