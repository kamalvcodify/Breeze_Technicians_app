import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import useOfflineSync, { OFFLINE_BANNER_VISIBLE_MS } from '../hooks/useOfflineSync';
import { colors } from '../theme/colors';
import styles from '../styles/OfflineSyncBanner.styles';

/**
 * components/OfflineSyncBanner.js
 * ----------------------------------------------------------------
 * Mounted ONCE in TechnicianLayout.js so it floats over every
 * screen, not per-form. Shows one of two states, each auto-hiding
 * after OFFLINE_BANNER_VISIBLE_MS (3s default, see
 * useOfflineSync.js for how to change the timing later):
 *
 *   - Pending: "X submission(s) pending - will sync automatically"
 *     re-appears every OFFLINE_CHECK_INTERVAL_MS poll while items
 *     remain queued.
 *   - Success: "All offline submissions synced successfully" -
 *     shown once, right after the queue empties out.
 * ----------------------------------------------------------------
 */
export default function OfflineSyncBanner() {
  const { pendingCount, justSynced } = useOfflineSync();

  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef(null);

  const showBanner = () => {
    setVisible(true);

    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    hideTimerRef.current = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }, OFFLINE_BANNER_VISIBLE_MS);
  };

  useEffect(() => {
    if (pendingCount > 0) {
      showBanner();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCount]);

  useEffect(() => {
    if (justSynced) {
      showBanner();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justSynced]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  if (!visible) {
    return null;
  }

  const isSuccess = justSynced;

  return (
    <Animated.View
      style={[styles.wrapper, isSuccess ? styles.wrapperSuccess : styles.wrapperPending, { opacity }]}
      pointerEvents="none"
    >
      <Ionicons
        name={isSuccess ? 'checkmark-circle' : 'cloud-offline-outline'}
        size={18}
        color={isSuccess ? colors.success : colors.textOnDark}
      />
      <Text style={[styles.text, isSuccess && styles.textSuccess]}>
        {isSuccess
          ? 'All offline submissions synced successfully'
          : `${pendingCount} submission${pendingCount === 1 ? '' : 's'} pending \u2014 will sync automatically`}
      </Text>
    </Animated.View>
  );
}