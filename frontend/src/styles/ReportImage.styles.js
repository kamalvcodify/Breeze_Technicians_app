import { StyleSheet, Dimensions } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default StyleSheet.create({
  image: {
    width: 96,
    height: 96,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  placeholder: {
    width: 96,
    height: 96,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.size.xs,
    color: colors.textFaint,
    marginTop: 4,
  },

  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.85,
  },
  viewerCloseButton: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});