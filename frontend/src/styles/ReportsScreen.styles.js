import { StyleSheet } from "react-native";
import { colors, radius, spacing, typography, shadow } from "../theme/colors";

/**
 * styles/ReportsScreen.styles.js
 * ----------------------------------------------------------------
 * headerBar matches Home's greetingBar; card/grid matches Home's
 * Services grid exactly (fixed 2-up, same padding/radius/shadow).
 * ----------------------------------------------------------------
 */
export default StyleSheet.create({
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

  content: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    padding: spacing.lg,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    minHeight: 130,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.xs,
  },
  cardIconBadge: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.iconBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    lineHeight: typography.size.sm * typography.lineHeight.normal,
  },
  openRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  openText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.blue,
    marginRight: 4,
  },
});
