import { StyleSheet } from 'react-native';

import {
  colors,
  radius,
  spacing,
} from '../theme/colors';

export default StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.xs,
  },

  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },

  helpText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },

  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },

  actionButton: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: colors.blue,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '700',
  },

  fileRow: {
    minHeight: 54,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },

  fileInfo: {
    flex: 1,
    marginRight: spacing.md,
  },

  fileName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },

  fileMeta: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },

  removeText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
});