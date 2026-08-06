import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/colors';

/**
 * styles/PrivacyPolicyScreen.styles.js
 * ----------------------------------------------------------------
 * headerBar/headerBarInner/headerTextGroup/headerTitle/
 * headerSubtitle/headerIconBadge match Home / My Assigned Work
 * Orders / Technician Shift exactly.
 *
 * There is only ONE card style now (accordionCard) — Contact Us
 * (09) is a row inside it just like every other section, not a
 * separately-styled dark card. contactRow/contactLinkText are only
 * a slight variant of the bullet/text styles below (tappable, blue)
 * for the Contact Us row's email/phone links.
 * ----------------------------------------------------------------
 */
export default StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },

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

  content: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },

  // --- The one accordion card, sections 01-09 -------------------------
  accordionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sectionNumber: {
    width: 30,
    color: colors.blue,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.extrabold,
  },
  sectionTitle: {
    flex: 1,
    color: colors.text,
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    paddingRight: spacing.sm,
  },
  sectionBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  sectionText: {
    color: colors.textMuted,
    fontSize: typography.size.body,
    lineHeight: typography.size.body * typography.lineHeight.normal,
  },
  sectionParagraph: {
    marginTop: spacing.sm,
  },
  sectionFooter: {
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: typography.size.sm,
    fontStyle: 'italic',
  },

  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
  },
  bulletDot: {
    color: colors.blue,
    fontSize: typography.size.body,
    marginRight: spacing.sm,
    lineHeight: typography.size.body * typography.lineHeight.normal,
  },
  bulletText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: typography.size.body,
    lineHeight: typography.size.body * typography.lineHeight.normal,
  },
  bulletLabel: {
    color: colors.text,
    fontWeight: typography.weight.semibold,
  },

  // --- Contact Us (09) row content -------------------------------------
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  contactLinkText: {
    color: colors.blue,
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
    marginLeft: spacing.sm,
    textDecorationLine: 'underline',
  },
  officialLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  officialLinkText: {
    color: colors.blue,
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
    marginLeft: spacing.sm,
  },
});