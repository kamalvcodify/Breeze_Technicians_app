import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

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
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorControl: {
    borderColor: colors.error,
  },
  value: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  doneButton: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  doneText: {
    color: colors.blue,
    fontWeight: '700',
  },
});