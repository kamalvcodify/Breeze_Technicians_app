import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

export default StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  control: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorControl: {
    borderColor: colors.error,
  },
  disabled: {
    opacity: 0.55,
    backgroundColor: colors.surfaceMuted,
  },
  value: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
  placeholder: {
    color: colors.textMuted,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '70%',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  // Explicit sizing so the list actually scrolls within modalCard's
  // maxHeight instead of relying on implicit/undefined sizing.
  optionsList: {
    flexGrow: 0,
  },
  option: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});