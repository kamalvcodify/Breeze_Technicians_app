/**
 * theme/colors.js
 * ----------------------------------------------------------------
 * Single source of truth for color, spacing, radius, typography and
 * elevation across the entire app (web, iOS, Android).
 *
 * Rule for the rest of the codebase: NEVER hardcode a hex value in
 * a screen or component style file. Import from here instead. This
 * is what keeps the app looking consistent as new screens are added.
 * ----------------------------------------------------------------
 */

export const colors = {
  // --- Brand / primary ---------------------------------------------------
  navy: '#202934',
  navyDark: '#171F28',
  blue: '#0876C9',
  blueDark: '#065A9E',
  blueLight: '#E8F3FB',

  // --- Aliases kept for screens written against a "primary" naming
  // convention. These intentionally point at the same brand tones
  // above so there is only ever one blue / one dark navy in the app.
  primary: '#0876C9',
  primaryDark: '#202934',
  white: '#FFFFFF',

  // --- Surfaces ------------------------------------------------------
  background: '#F4F6F8',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  surfaceSunken: '#EEF1F4',
  card: '#FFFFFF',

  // --- Text ------------------------------------------------------
  text: '#182230',
  textMuted: '#667085',
  textFaint: '#98A2B3',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: '#C5CED8',

  // Aliases for the primary/secondary text naming used on some screens.
  textPrimary: '#182230',
  textSecondary: '#667085',

  // --- Borders & separators ---------------------------------------
  border: '#DDE3E9',
  borderDark: '#35414D',
  divider: '#E7EBEF',

  // --- Status ------------------------------------------------------
  success: '#23855A',
  successBg: '#E6F4ED',
  error: '#C43D3D',
  errorBg: '#FCEDED',
  warning: '#B7791F',
  warningBg: '#FBF3E4',
  info: '#0876C9',
  infoBg: '#E8F3FB',

  // Small tinted background used behind badges/icons (e.g. Admin badge).
  iconBg: '#E8F3FB',

  overlay: 'rgba(9, 15, 22, 0.58)',
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
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
};

/**
 * Typography scale. Keeping every screen's font sizes/weights pulled
 * from here (rather than picking a one-off number) is what makes the
 * app feel deliberately designed instead of ad-hoc.
 */
export const typography = {
  family: {
    // Falls back to each platform's system font automatically.
    regular: undefined,
    medium: undefined,
    bold: undefined,
  },
  size: {
    xs: 11,
    sm: 12,
    body: 14,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    display: 30,
    hero: 36,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.45,
    relaxed: 1.6,
  },
};

/**
 * Soft, restrained elevation presets — used sparingly (cards, popups,
 * dropdowns) instead of default platform shadows so the UI reads as
 * considered rather than templated.
 */
export const shadow = {
  none: {},
  xs: {
    shadowColor: '#0B1220',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sm: {
    shadowColor: '#0B1220',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#0B1220',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  lg: {
    shadowColor: '#0B1220',
    shadowOpacity: 0.14,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
};