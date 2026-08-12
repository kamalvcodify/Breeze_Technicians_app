import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import styles from '../styles/AppSelect.styles';

/**
 * components/AppSelect.js
 * ----------------------------------------------------------------
 * Chevron switched from a plain text glyph ("⌄") to Ionicons, for
 * consistency with every other icon in the app and more reliable
 * rendering across Android devices/fonts. The options FlatList
 * inside the modal now has an explicit flexGrow/style so it
 * scrolls properly instead of being unconstrained inside the
 * modal card - previously it had no sizing of its own at all.
 * ----------------------------------------------------------------
 */
export default function AppSelect({
  label,
  value,
  placeholder = 'Select',
  options = [],
  onChange,
  error,
  disabled = false,
}) {
  const [visible, setVisible] = useState(false);
  const selected = options.find((item) => item.value === value);

  const selectOption = (item) => {
    onChange(item.value);
    setVisible(false);
  };

  return (
    <View style={styles.wrapper}>
      {!!label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.control, error && styles.errorControl, disabled && styles.disabled]}
        onPress={() => !disabled && setVisible(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.value, !selected && styles.placeholder]} numberOfLines={1}>
          {selected?.label || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{label || 'Select an option'}</Text>

            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              style={styles.optionsList}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => selectOption(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                  {item.value === value && (
                    <Ionicons name="checkmark" size={18} color={colors.blue} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}