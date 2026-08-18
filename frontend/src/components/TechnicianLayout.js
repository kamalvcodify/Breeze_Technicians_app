import React from 'react';
import { View } from 'react-native';
import TechnicianHeader from './TechnicianHeader';
import styles from '../styles/TechnicianLayout.styles';

/**
 * components/TechnicianLayout.js
 * ----------------------------------------------------------------
 * FIX: <OfflineSyncBanner /> removed from here (again - it was
 * never actually removed the first time this was fixed). This
 * component wraps EVERY screen, so mounting the banner here means a
 * fresh useOfflineSync() instance spins up on every single screen
 * navigation, running its own independent flush loop - exactly
 * what causes duplicate records from one offline submission.
 *
 * The banner is mounted ONCE, globally, in
 * navigation/TechnicianNavigator.js instead - as a sibling of
 * Stack.Navigator, so it survives every navigation instead of being
 * torn down and recreated. Do NOT add it back here.
 * ----------------------------------------------------------------
 */
export default function TechnicianLayout({ navigation, activeRoute, isAdmin = false, children }) {
  return (
    <View style={styles.container}>
      <TechnicianHeader navigation={navigation} activeRoute={activeRoute} isAdmin={isAdmin} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}