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
  fields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm,
    marginBottom: spacing.md,
  },
  column: {
    flexGrow: 1,
    flexBasis: 300,
    minWidth: 260,
    maxWidth: 520,
    paddingHorizontal: spacing.sm,
  },

  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  checklistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm,
  },
  checklistItem: {
    width: '50%',
    minWidth: 260,
    paddingHorizontal: spacing.sm,
  },
});