import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import TechnicianLayout from '../components/TechnicianLayout';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import styles from '../styles/HomeScreen.styles';

/**
 * screens/HomeScreen.js
 * ----------------------------------------------------------------
 * Dashboard of the 4 technician forms, shown as 2 cards per row.
 * This is a fixed 2-column grid on every device (phone or desktop
 * browser) — it does not switch to 1 column on narrow screens or
 * more than 2 on wide ones, by design, so the layout is identical
 * everywhere.
 *
 * Only "Submit Work Order" is wired up to a real screen right now;
 * the other three are shown as disabled "coming soon" cards until
 * their backend/Zoho fields exist (see the handover doc).
 * ----------------------------------------------------------------
 */
const SERVICES = [
  {
    key: 'submit-work-order',
    icon: 'clipboard-outline',
    title: 'Submit Work Order',
    description: 'Create and submit one or more work-order tickets.',
    screen: 'SubmitWorkOrder',
    enabled: true,
  },
  {
    key: 'check-in-out',
    icon: 'time-outline',
    title: 'Check In / Check Out',
    description: 'Attendance and job-site activity.',
    screen:'CheckInCheckOut',
    enabled: true,
  },
  {
  key: 'rehab-order',
  icon: 'hammer-outline',
  title: 'Submit a Rehab Order',
  description: 'Property rehabilitation work details.',
  screen: 'SubmitRehabOrder',
  enabled: true,
},
  {
    key: 'move-out',
    icon: 'exit-outline',
    title: 'Process a Move Out',
    description: 'Property move-out information.',
    screen: 'ProcessMoveOut',
    enabled: true,
  },
  {
  key: 'rent-ready-checklist',
  icon: 'checkmark-done-outline',
  title: 'Rent Ready Checklist',
  description: 'Confirm the unit is ready to rent.',
  screen: 'RentReadyChecklist',
  enabled: true,
}
];

function getDisplayNameFromEmail(email) {
  if (!email) return 'there';
  const localPart = email.split('@')[0] || '';
  const firstSegment = localPart.split(/[._-]/)[0] || localPart;
  if (!firstSegment) return 'there';
  return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
}

function getTimeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getTodayLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function HomeScreen({ navigation }) {
  const { email } = useAuth();
  const displayName = getDisplayNameFromEmail(email);

  return (
    <TechnicianLayout navigation={navigation} activeRoute="Home">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.greetingBar}>
          <View style={styles.greetingInner}>
            <View style={styles.greetingTextGroup}>
              <Text style={styles.greetingText}>
                {getTimeOfDayGreeting()}, {displayName}
              </Text>
              <Text style={styles.greetingDate}>{getTodayLabel()}</Text>
            </View>

            <View style={styles.greetingIconBadge}>
              <Ionicons name="sunny-outline" size={20} color={colors.blue} />
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Services</Text>
          <Text style={styles.sectionSubtitle}>Choose a service below to get started.</Text>

          {/* Fixed 2-up grid — see SERVICES above. */}
          <View style={styles.grid}>
            {SERVICES.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.card, !item.enabled && styles.cardDisabled]}
                disabled={!item.enabled}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.82}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.cardIconBadge, !item.enabled && styles.cardIconBadgeDisabled]}>
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={item.enabled ? colors.blue : colors.textFaint}
                    />
                  </View>

                  {!item.enabled && <Text style={styles.status}>SOON</Text>}
                </View>

                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription} numberOfLines={3}>
                  {item.description}
                </Text>

                {item.enabled && (
                  <View style={styles.openRow}>
                    <Text style={styles.openText}>Open</Text>
                    <Ionicons name="arrow-forward" size={13} color={colors.blue} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </TechnicianLayout>
  );
}
