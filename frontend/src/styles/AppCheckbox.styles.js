import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

export default StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm + 2,
    paddingRight: spacing.sm,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 1,
  },
  boxChecked: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  boxDisabled: {
    opacity: 0.5,
  },
  label: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
});