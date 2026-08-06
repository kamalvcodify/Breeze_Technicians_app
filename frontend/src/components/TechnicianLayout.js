import React from 'react';
import { View } from 'react-native';
import TechnicianHeader from './TechnicianHeader';
import styles from '../styles/TechnicianLayout.styles';

export default function TechnicianLayout({ navigation, activeRoute, isAdmin = false, children }) {
  return (
    <View style={styles.container}>
      <TechnicianHeader navigation={navigation} activeRoute={activeRoute} isAdmin={isAdmin} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}