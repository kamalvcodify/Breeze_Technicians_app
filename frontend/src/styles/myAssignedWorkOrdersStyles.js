import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/colors';

/**
 * styles/myAssignedWorkOrdersStyles.js
 * ----------------------------------------------------------------
 * headerBar/headerBarInner/headerTextGroup/headerTitle/
 * headerSubtitle/headerIconBadge below are intentionally the exact
 * same shape and sizing as Home's greetingBar/greetingInner/
 * greetingTextGroup/greetingText/greetingDate/greetingIconBadge
 * (see styles/HomeScreen.styles.js) — one small bold title line,
 * one small muted line under it, small icon badge on the right, all
 * inside a light bordered bar. This used to be an xl-size title with
 * a separate two-line subtitle and a separate count line, which is
 * why it looked oversized next to Home.
 * ----------------------------------------------------------------
 */
const styles = StyleSheet.create({
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

  listContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.size.body,
    marginTop: spacing.md,
    textAlign: 'center',
  },

  emptyContainer: {
    flex: 1,
    width: '100%',
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },

  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },

  errorTitle: {
    color: colors.error,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },

  emptyMessage: {
    maxWidth: 420,
    color: colors.textSecondary,
    fontSize: typography.size.body,
    lineHeight: typography.size.body * typography.lineHeight.normal,
    textAlign: 'center',
  },

  retryButton: {
    minWidth: 130,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blue,
    borderRadius: radius.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },

  retryButtonText: {
    color: colors.textOnDark,
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
  },
});

export default styles;