import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography, shadow } from '../theme/colors';

export default StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 24,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    ...shadow.md,
    zIndex: 999,
  },
  wrapperPending: {
    backgroundColor: colors.navy,
  },
  wrapperSuccess: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.success,
  },
  text: {
    flex: 1,
    color: colors.textOnDark,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginLeft: spacing.sm,
  },
  textSuccess: {
    color: colors.success,
  },
});