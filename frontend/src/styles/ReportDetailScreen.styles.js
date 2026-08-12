import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/colors';

export default StyleSheet.create({
  headerBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerBarInner: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextGroup: {
    flexShrink: 1,
  },
  headerTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },

  scrollContent: {
    flexGrow: 1,
  },
  content: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    padding: spacing.lg,
  },

  group: {
    marginBottom: spacing.lg,
  },
  groupTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },

  fieldRow: {
    flexDirection: 'row',
    minHeight: 44,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fieldLabel: {
    width: '38%',
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textMuted,
  },
  fieldValue: {
    flex: 1,
    fontSize: typography.size.body,
    color: colors.text,
  },

  checklistRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 42,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checklistIcon: {
    marginRight: spacing.sm,
    marginTop: 1,
  },
  checklistLabel: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.text,
    lineHeight: 18,
  },
});