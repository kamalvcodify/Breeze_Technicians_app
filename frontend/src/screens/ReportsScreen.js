import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import TechnicianLayout from '../components/TechnicianLayout';
import { colors } from '../theme/colors';
import styles from '../styles/ReportsScreen.styles';

/**
 * screens/ReportsScreen.js
 * ----------------------------------------------------------------
 * Landing grid for the Reports section - same fixed 2-up card
 * pattern as Home's Services grid. Each card opens
 * ReportListScreen with a different reportKey.
 * ----------------------------------------------------------------
 */
const REPORTS = [
  {
    key: 'workOrder',
    icon: 'clipboard-outline',
    title: 'Work Order Reports',
    description: 'Submitted work order tickets.',
  },
  {
    key: 'rehabOrder',
    icon: 'hammer-outline',
    title: 'Rehab Order Reports',
    description: 'Submitted rehab order entries.',
  },
  {
    key: 'checkInOut',
    icon: 'time-outline',
    title: 'Check In / Check Out Reports',
    description: 'Inventory check-in/check-out activity.',
  },
  {
    key: 'moveOut',
    icon: 'exit-outline',
    title: 'Move Out Reports',
    description: 'Submitted move-out checklists.',
  },
  {
    key: 'rentReadyChecklist',
    icon: 'checkmark-done-outline',
    title: 'Rent Ready Checklist Reports',
    description: 'Submitted rent ready checklists.',
  },
];

export default function ReportsScreen({ navigation }) {
  return (
    <TechnicianLayout navigation={navigation} activeRoute="Reports">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerBar}>
          <View style={styles.headerBarInner}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerTitle}>Reports</Text>
              <Text style={styles.headerSubtitle}>View your submitted records.</Text>
            </View>

            <View style={styles.headerIconBadge}>
              <Ionicons name="bar-chart-outline" size={18} color={colors.blue} />
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.grid}>
            {REPORTS.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.card}
                onPress={() => navigation.navigate('ReportList', { reportKey: item.key, title: item.title })}
                activeOpacity={0.82}
              >
                <View style={styles.cardIconBadge}>
                  <Ionicons name={item.icon} size={18} color={colors.blue} />
                </View>

                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {item.description}
                </Text>

                <View style={styles.openRow}>
                  <Text style={styles.openText}>Open</Text>
                  <Ionicons name="arrow-forward" size={13} color={colors.blue} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </TechnicianLayout>
  );
}