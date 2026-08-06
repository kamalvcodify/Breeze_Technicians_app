import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

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
    flexBasis: 330,
    minWidth: 280,
    paddingHorizontal: spacing.sm,
  },
  attachmentNote: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  attachmentTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  attachmentText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  lookupNote: {
  color: colors.textMuted,
  fontSize: 11,
  lineHeight: 17,
  marginTop: -spacing.sm,
  marginBottom: spacing.md,
},
});

