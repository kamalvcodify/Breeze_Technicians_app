import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/colors';

export default StyleSheet.create({
  wrapper: {
    width: '100%',
  },

  title: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 2,
  },
  meta: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: spacing.md,
  },

  scrollWrapper: {
    height: 340,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    marginBottom: spacing.md,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },

  disclaimer: {
    fontSize: typography.size.sm,
    fontStyle: 'italic',
    color: colors.textSecondary,
    lineHeight: typography.size.sm * typography.lineHeight.normal,
    marginBottom: spacing.md,
  },

  paragraph: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    lineHeight: typography.size.sm * typography.lineHeight.normal,
    marginBottom: spacing.md,
  },

  sectionHeading: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  section: {
    marginBottom: spacing.md,
  },
  heading: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  bulletRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    paddingLeft: spacing.xs,
  },
  bulletDot: {
    fontSize: typography.size.sm,
    color: colors.blue,
    marginRight: spacing.sm,
  },
  bulletText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    lineHeight: typography.size.sm * typography.lineHeight.normal,
  },
});