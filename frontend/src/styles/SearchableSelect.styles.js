import { StyleSheet } from "react-native";

import { colors, radius, spacing } from "../theme/colors";

export default StyleSheet.create({
  wrapper: {
    width: "100%",
    marginBottom: spacing.md,
  },

  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },

  control: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },

  errorControl: {
    borderColor: colors.error,
  },

  disabledControl: {
    opacity: 0.55,
    backgroundColor: colors.surfaceMuted,
  },

  selectedText: {
    flex: 1,
    paddingVertical: spacing.sm,
  },

  value: {
    color: colors.text,
    fontSize: 15,
  },

  placeholder: {
    color: colors.textMuted,
  },

  selectedSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },

  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs,
  },

  modalRoot: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },

  modalCard: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "78%",
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    overflow: "hidden",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  modalTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },

  searchInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 14,
    marginBottom: spacing.md,
  },

  hintText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },

  loadingText: {
    color: colors.textMuted,
    fontSize: 12,
    marginLeft: spacing.sm,
  },

  optionsList: {
    flexGrow: 0,
    flexShrink: 1,
  },
  optionsListContent: {
    flexGrow: 1,
  },

  option: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },

  optionContent: {
    flex: 1,
  },

  optionLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },

  optionSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 3,
  },

  separator: {
    height: 1,
    backgroundColor: colors.border,
  },

  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: spacing.xl,
  },

  /*
   * Manual entry fallback - new, see the comment block at the top
   * of SearchableSelect.js.
   */
  manualEntrySection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  manualEntryToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  manualEntryToggleText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: "700",
    marginLeft: spacing.xs,
  },
  manualEntryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  manualEntryInput: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 14,
    marginRight: spacing.sm,
  },
  manualEntryConfirm: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  manualEntryConfirmText: {
    color: colors.textOnDark,
    fontSize: 13,
    fontWeight: "700",
  },
});
