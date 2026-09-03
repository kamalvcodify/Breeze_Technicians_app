import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import TechnicianLayout from '../components/TechnicianLayout';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import styles from '../styles/ReportsScreen.styles';

/**
 * screens/ReportsScreen.js
 * ----------------------------------------------------------------
 * Landing grid for the Reports section - same fixed 2-up card
 * pattern as Home's Services grid. Each card opens
 * ReportListScreen with a different reportKey.
 *
 * FIX (grid collapse at narrow widths): each card is now wrapped in
 * a `cardWrap` View that owns the 50% column width and the gutter
 * (via padding, not margin) - see ReportsScreen.styles.js for why.
 * `card` itself no longer carries any width/margin, only visuals.
 *
 * isAdmin read from useAuth() and passed to TechnicianLayout -
 * previously this was omitted entirely, so the header always
 * defaulted to the technician nav (Home/My Assigned Work Orders/
 * Start Shift) regardless of who was actually logged in, even for
 * an admin.
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
    description: 'Submitted rehab order tickets.',
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

// NEW - Admin-only. Sourced from the local AppFolio-synced store,
// not Zoho. Shows EVERY work order regardless of status - Admin
// applies their own status filter on the list screen itself.
const ADMIN_ONLY_REPORTS = [
  {
    key: 'appFolioWorkOrders',
    icon: 'construct-outline',
    title: 'AppFolio Work Orders',
    description: 'All work orders synced from AppFolio, with status filtering.',
  },
];

export default function ReportsScreen({ navigation }) {
  const { isAdmin } = useAuth();

  const visibleReports = isAdmin ? [...REPORTS, ...ADMIN_ONLY_REPORTS] : REPORTS;

  return (
    <TechnicianLayout navigation={navigation} activeRoute="Reports" isAdmin={isAdmin}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerBar}>
          <View style={styles.headerBarInner}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerTitle}>Reports</Text>
              <Text style={styles.headerSubtitle}>
                {isAdmin ? "View everyone's submitted records." : 'View your submitted records.'}
              </Text>
            </View>

            <View style={styles.headerIconBadge}>
              <Ionicons name="bar-chart-outline" size={18} color={colors.blue} />
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.grid}>
            {visibleReports.map((item) => (
              <View key={item.key} style={styles.cardWrap}>
                <TouchableOpacity
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
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </TechnicianLayout>
  );
}