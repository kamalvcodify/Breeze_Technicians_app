import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

/**
 * styles/MoveOutFormSection.styles.js
 * ----------------------------------------------------------------
 * Same card/fields/column sizing as CheckInCheckOutFormSection.styles.js
 * - single-entry form, no headingRow/kicker needed.
 * ----------------------------------------------------------------
 */
export default StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  fields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm,
  },
  column: {
    flexGrow: 1,
    flexBasis: 300,
    minWidth: 260,
    maxWidth: 520,
    paddingHorizontal: spacing.sm,
  },
});