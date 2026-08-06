import {
  StyleSheet,
} from 'react-native';

import {
  colors,
  radius,
  spacing,
} from '../theme/colors';

export default StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: spacing.md,
  },

  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },

  control: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor:
      colors.surface,
    paddingHorizontal:
      spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },

  errorControl: {
    borderColor: colors.error,
  },

  disabledControl: {
    opacity: 0.55,
    backgroundColor:
      colors.surfaceMuted,
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

  chevron: {
    color: colors.textMuted,
    fontSize: 16,
    marginLeft: spacing.sm,
  },

  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs,
  },

  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      colors.overlay,
  },

  modalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '78%',
    alignSelf: 'center',
    backgroundColor:
      colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  modalTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },

  closeText: {
    color: colors.textMuted,
    fontSize: 28,
    lineHeight: 30,
  },

  searchInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal:
      spacing.md,
    color: colors.text,
    fontSize: 14,
    marginBottom: spacing.md,
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  loadingText: {
    color: colors.textMuted,
    fontSize: 12,
    marginLeft: spacing.sm,
  },

  option: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },

  optionContent: {
    flex: 1,
  },

  optionLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },

  optionSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 3,
  },

  selectedMark: {
    color: colors.blue,
    fontSize: 17,
    fontWeight: '700',
    marginLeft: spacing.md,
  },

  separator: {
    height: 1,
    backgroundColor:
      colors.border,
  },

  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});