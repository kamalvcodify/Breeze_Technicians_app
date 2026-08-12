import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

/**
 * styles/CheckInCheckOutFormSection.styles.js
 * ----------------------------------------------------------------
 * Same card/fields/column sizing as TicketFormSection.styles.js and
 * RehabFormSection.styles.js - no headingRow/kicker needed here
 * since this is a single-entry form, not a repeatable one.
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