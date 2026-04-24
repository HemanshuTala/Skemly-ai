export const zincWhiteTheme = {
  name: 'Zinc + White',
  id: 'zinc-white',
  colors: {
    canvasBg: '#09090b',
    appBg: '#18181b',
    surfaceBg: '#27272a',
    raisedBg: '#3f3f46',
    borderDefault: '#27272a',
    borderSubtle: '#3f3f46',
    borderStrong: '#52525b',
    textPrimary: '#ffffff',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    textDisabled: '#52525b',
    accent: '#ffffff',
    accentFg: '#18181b',
    success: '#4ade80',
    successBg: '#14532d',
    warning: '#fbbf24',
    warningBg: '#78350f',
    danger: '#f87171',
    dangerBg: '#7f1d1d',
    info: '#60a5fa',
    infoBg: '#1e3a5f',
  },
  radius: {
    sm: '5px',
    md: '7px',
    lg: '9px',
    xl: '12px',
    full: '9999px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
    monoFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
} as const;

export const theme = zincWhiteTheme;
export type ZincWhiteTheme = typeof zincWhiteTheme;
export type Theme = typeof theme;
export default zincWhiteTheme;
