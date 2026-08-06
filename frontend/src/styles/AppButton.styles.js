import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

export default StyleSheet.create({
  base: {
    width: '100%',
    minHeight: 46,
    backgroundColor: colors.blue,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.blue,
  },
  danger: {
    backgroundColor: colors.error,
  },
  textOnly: {
    minHeight: 36,
    backgroundColor: 'transparent',
    marginTop: 0,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    color: colors.textOnDark,
    fontSize: 15,
    fontWeight: '600',
  },
  outlineLabel: {
    color: colors.blue,
  },
  textOnlyLabel: {
    color: colors.blue,
    fontSize: 14,
  },
});