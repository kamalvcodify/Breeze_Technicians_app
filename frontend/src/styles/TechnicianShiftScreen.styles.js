import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography, shadow } from '../theme/colors';

/**
 * styles/TechnicianShiftScreen.styles.js
 * ----------------------------------------------------------------
 * headerBar/headerBarInner/headerTextGroup/headerTitle/
 * headerSubtitle/headerIconBadge match Home's greetingBar and My
 * Assigned Work Orders' headerBar exactly (same light bar, same
 * font sizes, small icon badge on the right) — this used to be a
 * large dark navy hero with its own "Back to Assigned Work Orders"
 * link. That link is gone: TechnicianHeader already shows a back
 * chevron automatically whenever this screen is reached by pushing
 * (navigation.canGoBack()), so a second, screen-specific back link
 * underneath it was redundant.
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

  // --- Work Order summary card ------------------------------------
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.xs,
  },
  cardKicker: {
    color: colors.blue,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
  },
  infoIcon: {
    marginRight: spacing.sm,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: typography.size.body,
    lineHeight: typography.size.body * typography.lineHeight.normal,
  },
  techniciansWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
  },
  technicianChip: {
    backgroundColor: colors.blueLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  technicianChipText: {
    color: colors.blueDark,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },

  // --- Status / location card ---------------------------------------
  statusCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
    ...shadow.xs,
  },
  statusIconBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  statusIconBadgeIdle: {
    backgroundColor: colors.blueLight,
  },
  statusIconBadgeActive: {
    backgroundColor: colors.successBg,
  },
  statusIconBadgeBreak: {
    backgroundColor: colors.warningBg,
  },
  statusIconBadgeError: {
    backgroundColor: colors.errorBg,
  },
  statusTitle: {
    color: colors.text,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  statusSubtitle: {
    color: colors.textMuted,
    fontSize: typography.size.body,
    textAlign: 'center',
    lineHeight: typography.size.body * typography.lineHeight.normal,
    marginBottom: spacing.md,
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  distancePillText: {
    color: colors.text,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginLeft: spacing.xs,
  },

  errorBanner: {
    width: '100%',
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

  // --- Action buttons ------------------------------------------------
  actionsRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  actionButtonWrap: {
    flexGrow: 1,
    flexBasis: 160,
    paddingHorizontal: spacing.xs,
  },

  timelineWrap: {
    width: '100%',
    marginTop: spacing.sm,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  timelineLabel: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    marginLeft: spacing.xs,
  },
  timelineValue: {
    color: colors.text,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
});