import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { spacing } from '../theme/colors';
import styles from '../styles/AuthCard.styles';

const MAX_CARD_WIDTH = 440;

/**
 * components/AuthCard.js
 * ----------------------------------------------------------------
 * Shared chrome for every auth screen (Login, Signup, Forgot
 * Password): the scrollable/keyboard-safe wrapper, the single
 * rounded card, the dark "BREEZE" logo header on top, and the white
 * form body below it.
 *
 * Login, Signup and Forgot Password all render as separate screens
 * in the navigator (their flows are different enough to stay as
 * separate routes), but they used to each re-implement this exact
 * card/logo layout in their own copy-pasted style file. This
 * component is the one place that layout now lives — screens only
 * bring their own form fields via `children`.
 * ----------------------------------------------------------------
 */
export default function AuthCard({ title, subtitle, children }) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - spacing.lg * 2, MAX_CARD_WIDTH);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/*
          Single merged panel: `card` is the one rounded + shadowed
          container. `cardTop` (dark, logo) and `cardBody` (white,
          form) are its direct children so there is no seam between
          them — only the outer corners of `card` are rounded.
        */}
        <View style={[styles.card, { width: cardWidth }]}>
          <View style={styles.cardTop}>
            <Text style={styles.logoText}>BREEZE</Text>
            <Text style={styles.logoSubText}>PROPERTY GROUP</Text>
          </View>

          <View style={styles.cardBody}>
            {!!title && <Text style={styles.title}>{title}</Text>}
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

            {children}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
