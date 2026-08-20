import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/colors';

export default StyleSheet.create({
  button: {
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  buttonText: {
    color: colors.textOnDark,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },

  mobileButton: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  mobileButtonText: {
    color: colors.textOnDark,
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },

  buttonInactive: {
    backgroundColor: colors.success || '#16a34a',
  },
  buttonActive: {
    backgroundColor: colors.error || '#dc2626',
  },
});