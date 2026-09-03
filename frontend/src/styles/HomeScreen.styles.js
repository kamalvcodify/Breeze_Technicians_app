import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography, shadow } from '../theme/colors';

/**
 * styles/HomeScreen.styles.js
 * ----------------------------------------------------------------
 * The Services grid is a FIXED 2-column layout at every screen
 * size, on purpose — this does not use a wide-screen breakpoint to
 * switch to more columns, so phone and desktop browser both always
 * show exactly 2 cards per row.
 *
 * REAL ROOT CAUSE OF THE 1-PER-ROW COLLAPSE (found after checking
 * the client's actual screenshots at narrow widths):
 * `card` previously had BOTH `width: '48%'` AND
 * `marginHorizontal: spacing.xs`. In React Native, marginHorizontal
 * is ADDITIVE — it sits outside the box, it is NOT subtracted from
 * width like padding would be. So the real width of each row was
 * `2 × (48% + 2×spacing.xs)` = `96% + a FIXED pixel amount`. That
 * fixed pixel amount stays constant as the screen narrows while the
 * 4% of slack shrinks with it, so past a certain narrow width the
 * row's total exceeds 100% and flexbox is forced to wrap the 2nd
 * card onto its own line. This is why the earlier flexShrink/
 * minWidth fix (a reasonable but different theory - "content forces
 * a min width") did not resolve it: the width math itself was wrong
 * regardless of content length.
 *
 * FIX: split each grid item into two layers -
 *   - `cardWrap` owns the 50% column width and creates the gutter
 *     using PADDING (which IS subtracted from a percentage width in
 *     RN's box model, so 50% - padding can never overflow 100%
 *     no matter how narrow the screen gets).
 *   - `card` no longer has any width/margin/flex sizing at all -
 *     it's just the visual card (background/border/radius/padding)
 *     at width: '100%' of its wrapper.
 * This is structurally overflow-proof, so it can't collapse to
 * 1-column the way the old margin-based math could.
 * ----------------------------------------------------------------
 */
export default StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },

  greetingBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  greetingInner: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingTextGroup: {
    flexShrink: 1,
  },
  greetingText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  greetingDate: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  greetingIconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },

  // FIX: was `padding: spacing.lg` (uniform on all sides), which
  // made the gap between the nav/title bar and the card grid bigger
  // on Home than on Reports - Reports uses `paddingTop: spacing.md`
  // specifically, not spacing.lg. Split into individual sides so
  // only the TOP gap is reduced to match Reports; paddingHorizontal
  // and paddingBottom are unchanged from before. Nothing below this
  // (grid/cardWrap/card) is touched by this change.
  content: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },

  // Grid no longer needs a negative-margin bleed - cardWrap's
  // padding handles the gutter now, so the row's own edges line up
  // cleanly with `content`'s padding on both sides.
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // NEW - owns the column width + gutter. width: 50% here is safe
  // because paddingHorizontal is subtracted from it (border-box),
  // unlike the old approach where marginHorizontal sat outside a
  // 48% width and could push the row over 100%.
  cardWrap: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    // FIX: matched to ReportsScreen's row gap (spacing.sm) - was
    // spacing.md, which made Home's grid visibly looser than
    // Reports' grid for no intentional reason.
    marginBottom: spacing.sm,
  },

  card: {
    // Sizing/margin removed from here - cardWrap handles all of
    // that now. This is purely the card's visual appearance.
    // flexGrow/flexShrink no longer needed either: cardWrap is a
    // block-level View, not a flex sibling competing for row space,
    // so the earlier stretch-on-odd-count bug can't recur here.
    //
    // FIX (native Android bug): height: '100%' was REMOVED. It
    // worked fine on web but caused cards to stretch to fill the
    // ENTIRE screen height on a real Android build. Root cause:
    // `scrollContent` uses flexGrow: 1 (correct, lets the
    // background fill a short screen) - but that makes the
    // ScrollView's content container's computed height ambiguous
    // on native when content is short. React Native's layout engine
    // (Yoga) resolves percentage heights against that ambiguous
    // tall ancestor chain differently than a browser's CSS engine
    // does, so height: '100%' on `card` blew up to fill the whole
    // scroll area instead of just its row. minHeight: 150 alone is
    // the safe, cross-platform way to size the card - it sizes to
    // its own content on every platform, with no percentage-height
    // ambiguity. Trade-off: cards in the same row with different
    // description lengths may not perfectly match height anymore -
    // a minor cosmetic point next to a card literally filling the
    // screen.
    // FIX (round 2): restoring row-height matching WITHOUT
    // reintroducing the Android bug above. height: '100%' asks Yoga
    // to resolve a PERCENTAGE against the parent's height - that
    // resolution is exactly what broke on native, since cardWrap's
    // own height is itself derived (via align-items: stretch), not
    // a fixed style value, and percentage-of-a-derived-height is
    // where Yoga's native resolution diverged from web. flex: 1 is
    // different: it doesn't resolve a percentage at all, it
    // participates directly in the flexbox algorithm and fills
    // whatever space cardWrap actually ends up with after grid's
    // per-row stretch (which is itself based on real measured
    // content heights in that row, not on any ambiguous ancestor
    // size). This is the standard safe RN pattern for "make this
    // child fill its flex parent." Still worth confirming on a real
    // Android build before treating as final, given the last
    // surprise.
    width: '100%',
    flex: 1,
    minHeight: 150,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    // FIX: matched to ReportsScreen's card corner radius (radius.md)
    // - was radius.lg, so cards looked more rounded on Home than
    // on Reports.
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadow.xs,
  },
  cardDisabled: {
    backgroundColor: colors.surfaceMuted,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  // FIX: matched to ReportsScreen's icon badge (36x36, radius.pill
  // / circular) - was 34x34 with radius.sm (rounded square), so the
  // two grids' badges looked like two different components even
  // though they're meant to be the same design language. Stays
  // inside `cardTop` here (Home has a status "SOON" label next to
  // it that Reports doesn't), so no marginBottom is added on the
  // badge itself - cardTop's own marginBottom already provides
  // that same gap Reports gets from the badge's marginBottom.
  cardIconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconBadgeDisabled: {
    backgroundColor: colors.surfaceSunken,
  },
  status: {
    fontSize: 9,
    fontWeight: typography.weight.bold,
    color: colors.textFaint,
    letterSpacing: 0.6,
  },
  cardTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    lineHeight: typography.size.sm * typography.lineHeight.normal,
  },
  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  openText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.blue,
    marginRight: 4,
  },
});