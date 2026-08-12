import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import styles from '../styles/AppCheckbox.styles';

/**
 * components/AppCheckbox.js
 * ----------------------------------------------------------------
 * A real single checkbox with a label. This existed briefly during
 * Rehab Order work and was removed because that form's "Rehab2/
 * Rehab3" turned out to be an add-entry pattern, not real
 * checkboxes. Rent Ready Checklist's ~29 items ARE genuine
 * booleans, so this is back for real this time.
 * ----------------------------------------------------------------
 */
export default function AppCheckbox({ label, checked, onChange, disabled = false }) {
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
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}