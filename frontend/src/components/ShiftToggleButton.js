import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { startSimpleShift, endSimpleShift } from '../api/simpleShift';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import styles from '../styles/ShiftToggleButton.styles';

const STORAGE_KEY = 'simple_shift_active';

/**
 * components/ShiftToggleButton.js
 * ----------------------------------------------------------------
 * Standalone toggle button for the header bar - "Start Shift" when
 * inactive, "End Shift" (different color) when active. Completely
 * separate from the existing GPS-based TechnicianShiftScreen.js.
 *
 * Now pulls `name` from useAuth() and sends it with every start/end
 * request - the backend's Zoho CRM lookup needs the technician's
 * Name (matching the reference Deluge logic's "techName"), which
 * the JWT itself doesn't carry.
 * ----------------------------------------------------------------
 */
export default function ShiftToggleButton({ mobile = false }) {
  const { name } = useAuth();

  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        setIsActive(stored === 'true');
      } finally {
        setRestored(true);
      }
    })();
  }, []);

  const handlePress = async () => {
    if (loading || !restored) {
      return;
    }

    if (!name) {
      console.warn('[ShiftToggleButton] No technician name available from useAuth() - cannot start/end shift.');
      return;
    }

    setLoading(true);

    try {
      if (isActive) {
        await endSimpleShift(name);
        setIsActive(false);
        await AsyncStorage.setItem(STORAGE_KEY, 'false');
      } else {
        await startSimpleShift(name);
        setIsActive(true);
        await AsyncStorage.setItem(STORAGE_KEY, 'true');
      }
    } catch (error) {
      console.warn('[ShiftToggleButton] Request failed:', error?.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!restored) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        mobile ? styles.mobileButton : styles.button,
        isActive ? styles.buttonActive : styles.buttonInactive,
      ]}
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.textOnDark} />
      ) : (
        <Text style={mobile ? styles.mobileButtonText : styles.buttonText}>
          {isActive ? 'End Shift' : 'Start Shift'}
        </Text>
      )}
    </TouchableOpacity>
  );
}