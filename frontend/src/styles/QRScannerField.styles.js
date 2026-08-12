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

  scannerContainer: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: colors.textOnDark,
    borderRadius: radius.lg,
    backgroundColor: 'transparent',
  },
  scannerHint: {
    marginTop: spacing.lg,
    color: colors.textOnDark,
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});