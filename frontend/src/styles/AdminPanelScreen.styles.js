import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography, shadow } from '../theme/colors';

/**
 * styles/AdminPanelScreen.styles.js
 * ----------------------------------------------------------------
 * Header replaced: was its own bespoke "ADMINISTRATOR eyebrow +
 * big title" pattern, now uses the exact same headerBar/
 * headerBarInner/headerTextGroup/headerIconBadge structure as
 * every other screen (Home, Reports, all 5 forms) - same
 * typography.size.md bold title, typography.size.sm subtitle, and
 * 36x36 icon badge on the right. No other structural change - same
 * two cards, same fields, same behavior.
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

  headerBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerBarInner: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextGroup: {
    flexShrink: 1,
  },
  headerTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
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
  userInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  userName: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
  },
  userMeta: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
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