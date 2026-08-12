import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/colors';

/**
 * styles/SubmitRehabOrderScreen.styles.js
 * ----------------------------------------------------------------
 * Identical structure to SubmitWorkOrderScreen.styles.js - same
 * headerBar pattern, same content/errorBanner/actions treatment.
 * ----------------------------------------------------------------
 */
export default StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    paddingVertical: spacing.xl,
  },

  errorBanner: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.sm,
    backgroundColor: colors.errorBg,
  },
  errorBannerText: {
    color: colors.error,
    fontSize: typography.size.sm,
    marginBottom: spacing.sm,
  },
  errorBannerRetry: {
    color: colors.blue,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },

  addButton: {
    minHeight: 50,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.blue,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  addButtonText: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: '700',
  },

  actions: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
});