import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import styles from '../styles/AppButton.styles';

export default function AppButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}) {
  const isOutline = variant === 'outline';
  const isText = variant === 'text';
  const isDanger = variant === 'danger';

  return (
    <TouchableOpacity
      style={[
        styles.base,
        isOutline && styles.outline,
        isText && styles.textOnly,
        isDanger && styles.danger,
        (disabled || loading) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator color={isOutline || isText ? colors.blue : colors.textOnDark} />
      ) : (
        <Text
          style={[
            styles.label,
            isOutline && styles.outlineLabel,
            isText && styles.textOnlyLabel,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}