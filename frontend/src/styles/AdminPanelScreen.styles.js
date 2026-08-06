import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography, shadow } from '../theme/colors';

/**
 * styles/AdminPanelScreen.styles.js
 * ----------------------------------------------------------------
 * Restyled to match the same structure/visual language as the
 * technician screens: a light page header (colors.surface,
 * border-bottom) instead of a dark navy hero, radius.lg cards with
 * shadow.xs (matching Home's dashboard cards and the re-themed
 * Work Order cards), and the same maxWidth: 1100 centered content
 * wrapper used on Home / My Assigned Work Orders / Privacy Policy.
 * No functional change — same two cards, same fields, same
 * behavior, just brought in line with the rest of the app visually.
 * ----------------------------------------------------------------
 */
export default StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },

  pageHeader: {
    width: '100%',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  pageHeaderInner: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
  },
  headerEyebrow: {
    color: colors.blue,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.extrabold,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.size.body,
    marginTop: spacing.xs,
  },

  content: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    padding: spacing.lg,
  },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.xs,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardIconBadge: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: typography.size.body,
    color: colors.textSecondary,
    lineHeight: typography.size.body * typography.lineHeight.normal,
    marginBottom: spacing.md,
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  switchLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
    maxWidth: 220,
  },
  switchHint: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    maxWidth: 220,
    marginTop: 2,
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successBg,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  successText: {
    flex: 1,
    color: colors.success,
    fontSize: typography.size.body,
    marginLeft: spacing.sm,
  },

  emptyStateText: {
    fontSize: typography.size.body,
    color: colors.textSecondary,
    paddingVertical: spacing.md,
  },

  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  userEmail: {
    fontSize: typography.size.body,
    color: colors.textPrimary,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeAdmin: {
    backgroundColor: colors.iconBg,
  },
  badgeTech: {
    backgroundColor: colors.surfaceMuted,
  },
  badgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginLeft: 4,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});
