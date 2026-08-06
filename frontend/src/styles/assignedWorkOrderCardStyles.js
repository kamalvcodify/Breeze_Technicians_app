import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography, shadow } from '../theme/colors';

/**
 * styles/assignedWorkOrderCardStyles.js
 * ----------------------------------------------------------------
 * Sizing matched to Home's dashboard cards exactly: same padding
 * (spacing.md), same corner radius (radius.lg), same shadow
 * (shadow.xs), and the same font-size scale (base for the title,
 * sm for supporting text). Previously each text block here used
 * much larger sizes with big vertical gaps between LABEL/value
 * pairs — that's what made this screen's cards look oversized next
 * to Home's.
 * ----------------------------------------------------------------
 */
const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.xs,
  },

  selectedCard: {
    borderColor: colors.blue,
    borderWidth: 2,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },

  headerContent: {
    flex: 1,
    paddingRight: spacing.sm,
  },

  workOrderNumber: {
    color: colors.textPrimary,
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },

  issueType: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    marginTop: 1,
  },

  selectedBadge: {
    backgroundColor: colors.iconBg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },

  selectedBadgeText: {
    color: colors.blueDark,
    fontSize: 10,
    fontWeight: typography.weight.bold,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  metaIcon: {
    marginRight: 5,
  },

  metaText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.size.sm,
  },

  description: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * typography.lineHeight.normal,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },

  locationIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  locationAvailableIndicator: {
    backgroundColor: colors.success,
  },

  locationUnavailableIndicator: {
    backgroundColor: colors.error,
  },

  locationText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },

  locationAvailableText: {
    color: colors.success,
  },

  locationUnavailableText: {
    color: colors.error,
  },

  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    backgroundColor: colors.blue,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },

  primaryButtonText: {
    color: colors.textOnDark,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    marginRight: 5,
  },
});

export default styles;