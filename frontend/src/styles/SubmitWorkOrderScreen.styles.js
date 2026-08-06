import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

export default StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  pageHeader: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  pageHeaderInner: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
  },
  title: {
    color: colors.textOnDark,
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textOnDarkMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  content: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    padding: spacing.lg,
    paddingVertical: spacing.xl,
  },
  addButton: {
    minHeight: 50,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.blue,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  addButtonText: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: '700',
  },
  actions: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
});
