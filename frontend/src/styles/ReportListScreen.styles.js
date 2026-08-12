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

  listContent: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
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
});
