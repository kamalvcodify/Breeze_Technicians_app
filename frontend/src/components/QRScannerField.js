import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import styles from '../styles/QRScannerField.styles';

/**
 * components/QRScannerField.js
 * ----------------------------------------------------------------
 * New component - nothing like this existed in the app before.
 * Requires the expo-camera package (not currently installed) and a
 * camera permission entry in app.json - see the install/app.json
 * instructions that come with this file. Like the battery-
 * optimization fix earlier, this needs a fresh EAS build to
 * actually test on-device; it will not work by just reloading
 * Metro, since it's native camera code.
 *
 * Tapping the field requests camera permission (if not already
 * granted) and opens a full-screen scanner. On a successful QR
 * scan, the raw scanned string is passed to onScan() - parsing it
 * into Part Code / Parts Inventory happens in the screen via
 * utils/qrPayload.js, not in here, so this component stays a
 * generic "scan and return the raw value" building block.
 * ----------------------------------------------------------------
 */
export default function QRScannerField({
  label = 'Scan QR Code',
  value,
  onScan,
  error,
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [hasScannedOnce, setHasScannedOnce] = useState(false);

  const openScanner = async () => {
    let currentPermission = permission;

    if (!currentPermission?.granted) {
      currentPermission = await requestPermission();
    }

    if (!currentPermission?.granted) {
      return;
    }

    setHasScannedOnce(false);
    setScannerVisible(true);
  };

  const handleBarcodeScanned = ({ data }) => {
    if (hasScannedOnce) {
      return;
    }

    setHasScannedOnce(true);
    setScannerVisible(false);
    onScan(data);
  };

  return (
    <View style={styles.wrapper}>
      {!!label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.control, error && styles.errorControl]}
        onPress={openScanner}
        activeOpacity={0.7}
      >
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {value || 'https://'}
        </Text>
        <Ionicons name="qr-code-outline" size={18} color={colors.blue} />
      </TouchableOpacity>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={scannerVisible}
        animationType="slide"
        onRequestClose={() => setScannerVisible(false)}
      >
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={hasScannedOnce ? undefined : handleBarcodeScanned}
          />

          <View style={styles.scannerOverlay} pointerEvents="none">
            <View style={styles.scannerFrame} />
            <Text style={styles.scannerHint}>Align the QR code within the frame</Text>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setScannerVisible(false)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={26} color={colors.textOnDark} />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}