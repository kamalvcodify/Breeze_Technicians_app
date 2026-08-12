import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

/**
 * styles/RehabFormSection.styles.js
 * ----------------------------------------------------------------
 * Matches TicketFormSection.styles.js exactly (card, headingRow,
 * kicker, heading, removeText, fields, column) so Submit Rehab
 * Order looks structurally identical to Submit Work Order,
 * including the same "additional entry" heading pattern.
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
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
    marginBottom: spacing.lg,
  },
  kicker: {
    color: colors.blue,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  heading: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '700',
  },
  removeText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
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