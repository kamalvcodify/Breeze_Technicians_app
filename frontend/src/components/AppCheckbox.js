import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import styles from '../styles/AppCheckbox.styles';

/**
 * components/AppCheckbox.js
 * ----------------------------------------------------------------
 * labelStyle added (optional) - lets a caller override the label's
 * text styling without duplicating the checkbox-drawing logic.
 * Used by RentReadyChecklistFormSection.js's new section "select
 * all" master checkbox, which needs to look like the existing bold
 * section heading, not a regular small item label. Existing usages
 * (no labelStyle passed) are unaffected.
 * ----------------------------------------------------------------
 */
export default function AppCheckbox({ label, checked, onChange, disabled = false, labelStyle }) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => !disabled && onChange(!checked)}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={[styles.box, checked && styles.boxChecked, disabled && styles.boxDisabled]}>
        {checked && <Ionicons name="checkmark" size={14} color={colors.textOnDark} />}
      </View>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}