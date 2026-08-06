import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography, shadow } from '../theme/colors';

/**
 * styles/AuthCard.styles.js
 * ----------------------------------------------------------------
 * Single source of styling for every auth screen (Login, Signup,
 * Forgot Password). Previously each screen had its own style file
 * that was a near byte-for-byte copy of this one — this file is now
 * the only place that layout is defined. Screen-specific bits that
 * genuinely differ (e.g. the "hint" text under Signup's password
 * field, or Forgot Password's success message) live here too, since
 * they're small and still shared visual language, not separate
 * per-screen concerns.
 * ----------------------------------------------------------------
 */
export default StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },

  // Single outer panel. Overflow hidden so the navy `cardTop` and
  // white `cardBody` never spill past the rounded corners.
  card: {
    width: '100%',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadow.md,
  },

  // Dark brand section — top portion of the single card.
  cardTop: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryDark,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  logoText: {
    color: colors.textOnDark,
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.extrabold,
    letterSpacing: 4,
  },
  logoSubText: {
    color: colors.blueLight,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    letterSpacing: 3,
    marginTop: spacing.xs,
  },

  // White form section — bottom portion of the same single card.
  cardBody: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },

  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.body,
    lineHeight: typography.size.body * typography.lineHeight.normal,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorBg,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: typography.size.body,
    marginLeft: spacing.sm,
  },

  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },

  hintText: {
    fontSize: typography.size.sm,
    color: colors.textFaint,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },

  successText: {
    fontSize: typography.size.body,
    color: colors.success,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
