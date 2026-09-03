import { StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "../theme/colors";

export default StyleSheet.create({
  headerBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerBarInner: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.md,
  },

  // NEW - wraps the status filter row + FlatList/pagination together
  // as ONE flex child, rather than two separate siblings. This is
  // what fixes the inconsistent gap between the filter and the
  // table: without this, whatever ancestor layout wraps this screen
  // was free to distribute leftover vertical space BETWEEN the two
  // separate elements whenever there wasn't enough content to fill
  // the screen (few rows) - merging them into one container removes
  // that ambiguity entirely, since everything inside stacks tightly
  // from the top by default (column flex-direction, flex-start).
  bodyWrapper: {
    flex: 1,
  },

  listContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    paddingHorizontal: spacing.sm,
  },
  headerRow: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
  },
  cell: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.text,
    paddingRight: spacing.sm,
  },
  headerCell: {
    fontWeight: typography.weight.bold,
    color: colors.textMuted,
    fontSize: typography.size.xs,
    textTransform: "uppercase",
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.size.body,
    marginTop: spacing.md,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  errorTitle: {
    color: colors.error,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  emptyMessage: {
    color: colors.textSecondary,
    fontSize: typography.size.body,
    textAlign: "center",
  },
  retryButton: {
    minWidth: 130,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
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

  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.blue,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textOnDark,
    marginRight: 4,
  },
  viewButtonSpacer: {
    width: 70,
  },

  paginationBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  pageButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  pageButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.blue,
    marginHorizontal: 4,
  },
  pageButtonTextDisabled: {
    color: colors.textFaint,
  },
  pageIndicator: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // FIX: previously a horizontal ScrollView's contentContainerStyle,
  // which is why the pill row appeared cut off / starting mid-screen
  // in testing (scrolled to an arbitrary position) rather than
  // showing every option at once. Now a plain WRAPPING row - all 14
  // status pills are always visible, wrapping onto as many lines as
  // needed (roughly 5 per line on a normal desktop width, fewer on
  // narrower/mobile screens - this adapts naturally rather than
  // forcing an exact count), centered as a block within the same
  // bounded width as the table below it.
  statusFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  statusPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  statusPillActive: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  statusPillTextActive: {
    color: colors.textOnDark,
  },
});