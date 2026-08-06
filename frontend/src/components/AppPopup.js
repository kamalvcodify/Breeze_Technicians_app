import React from 'react';
import { Modal, View, Text } from 'react-native';
import AppButton from './AppButton';
import styles from '../styles/AppPopup.styles';

export default function AppPopup({
  visible,
  title,
  message,
  primaryLabel,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
  onClose,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {!!title && <Text style={styles.title}>{title}</Text>}
          {!!message && <Text style={styles.message}>{message}</Text>}

          {!!primaryLabel && <AppButton title={primaryLabel} onPress={onPrimaryPress} />}
          {!!secondaryLabel && (
            <AppButton title={secondaryLabel} variant="text" onPress={onSecondaryPress} />
          )}
        </View>
      </View>
    </Modal>
  );
}
