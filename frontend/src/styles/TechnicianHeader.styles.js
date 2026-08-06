import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography, shadow } from '../theme/colors';

export default StyleSheet.create({
  header: {
    minHeight: 52,
    backgroundColor: colors.navy,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
    paddingHorizontal: spacing.md,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  leftArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  backButton: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoMark: {
    width: 34,
    height: 30,
    marginRight: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  building: {
    borderWidth: 1,
    borderColor: colors.textOnDarkMuted,
    backgroundColor: colors.borderDark,
    marginRight: 2,
    borderRadius: 1,
  },
  buildingLeft: {
    width: 7,
    height: 17,
  },
  buildingCentre: {
    width: 10,
    height: 28,
  },
  buildingRight: {
    width: 8,
    height: 22,
  },
  brandName: {
    color: colors.blue,
    fontSize: typography.size.md,
    fontWeight: typography.weight.extrabold,
    letterSpacing: 3,
  },
  brandSubtext: {
    color: colors.blueLight,
    fontSize: 6,
    fontWeight: typography.weight.bold,
    letterSpacing: 2,
    marginTop: 1,
  },

  // --- Desktop navigation ------------------------------------------------
  desktopArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  desktopNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.xl,
  },
  navLink: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeNavLink: {
    borderBottomColor: colors.blue,
  },
  navLinkText: {
    color: colors.textOnDark,
    fontSize: typography.size.body,
    fontWeight: typography.weight.medium,
  },
  activeNavLinkText: {
    fontWeight: typography.weight.semibold,
  },
  navChevronWrap: {
    marginLeft: spacing.xs,
  },

  desktopDropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    width: 264,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    ...shadow.lg,
    zIndex: 200,
  },
  dropdownItem: {
    minHeight: 46,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownIcon: {
    marginRight: spacing.sm,
  },
  dropdownText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.size.body,
  },
  disabledText: {
    color: colors.textFaint,
  },
  soonBadge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  soonText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: typography.weight.semibold,
  },

  // --- Admin mode (no nav links, just a label) ------------------
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.borderDark,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.xl,
  },
  adminBadgeText: {
    color: colors.textOnDark,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginLeft: spacing.xs,
  },
  mobileAdminBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mobileAdminBadgeText: {
    color: colors.textMuted,
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
    marginLeft: spacing.sm,
  },

  // --- Account area (desktop) ---------------------------------------
  accountArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountEmail: {
    maxWidth: 190,
    color: colors.textOnDarkMuted,
    fontSize: typography.size.sm,
    marginRight: spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  logoutButtonText: {
    color: colors.textOnDark,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginLeft: spacing.xs,
  },

  // --- Mobile hamburger trigger ---------------------------------------
  menuButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- Mobile drawer ------------------------------------------------
  mobileModal: {
    flex: 1,
    flexDirection: 'row',
  },
  mobileBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  mobileDrawer: {
    width: '84%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    ...shadow.lg,
  },
  mobileHeader: {
    minHeight: 76,
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mobileTitle: {
    color: colors.textOnDark,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  mobileEmail: {
    maxWidth: 220,
    color: colors.textOnDarkMuted,
    fontSize: typography.size.sm,
    marginTop: spacing.xs,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Fixed `height` (not minHeight) on purpose: this guarantees
  // "Home", "My Assigned Work Orders" and "Privacy Policy" are all
  // exactly the same row height no matter what's inside them. Home
  // has an extra trailing +/- icon the other two don't have — with
  // only a minHeight, that icon was letting the Home row grow
  // taller than the other two (visible unevenness in the drawer).
  mobileParentLink: {
    height: 54,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mobileParentTextTouch: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  // Wraps the Home row's +/- icon so it's vertically centered
  // within the fixed 54px row instead of influencing its height.
  mobileRowTrailing: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: spacing.sm,
  },
  mobileParentText: {
    color: colors.text,
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },
  mobileSubmenu: {
    backgroundColor: colors.surfaceMuted,
  },
  mobileSubmenuItem: {
    minHeight: 48,
    paddingLeft: spacing.xl,
    paddingRight: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileSubmenuText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.size.body,
  },
  mobileFooter: {
    marginTop: 'auto',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mobileLogoutButton: {
    minHeight: 46,
    flexDirection: 'row',
    backgroundColor: colors.navy,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileLogoutText: {
    color: colors.textOnDark,
    fontWeight: typography.weight.semibold,
    marginLeft: spacing.sm,
  },
});