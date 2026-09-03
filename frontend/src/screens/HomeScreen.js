import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import TechnicianLayout from '../components/TechnicianLayout';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import styles from '../styles/HomeScreen.styles';

/**
 * screens/HomeScreen.js
 * ----------------------------------------------------------------
 * REWORKED - instead of two separate bars stacked one after another
 * (greeting, then a Services title bar - which looked cluttered),
 * this is now ONE single bar that shows the time-of-day greeting
 * first, then automatically crossfades into the Services title
 * after a few seconds, per instructions. Same bar styling either
 * way - only the icon and text content swap.
 *
 * Dashboard of the 4 technician forms, shown as 2 cards per row.
 * This is a fixed 2-column grid on every device (phone or desktop
 * browser) — it does not switch to 1 column on narrow screens or
 * more than 2 on wide ones, by design, so the layout is identical
 * everywhere.
 *
 * FIX (grid collapse at narrow widths): each card is now wrapped in
 * a `cardWrap` View that owns the 50% column width and the gutter
 * (via padding, not margin) - see HomeScreen.styles.js for why.
 * `card` itself no longer carries any width/margin, only visuals.
 *
 * Only "Submit Work Order" is wired up to a real screen right now;
 * the other three are shown as disabled "coming soon" cards until
 * their backend/Zoho fields exist (see the handover doc).
 * ----------------------------------------------------------------
 */
const GREETING_DISPLAY_MS = 3500; // how long the greeting shows before swapping
const CROSSFADE_MS = 300; // fade-out/fade-in duration for the swap itself
const SERVICES = [
  {
    key: 'submit-work-order',
    icon: 'clipboard-outline',
    title: 'Submit Work Order',
    description: 'Log a maintenance request.',
    screen: 'SubmitWorkOrder',
    enabled: true,
  },
  {
    key: 'check-in-out',
    icon: 'time-outline',
    title: 'Check In / Check Out Inventory',
    description: 'Manage inventory items.',
    screen:'CheckInCheckOut',
    enabled: true,
  },
  {
  key: 'rehab-order',
  icon: 'hammer-outline',
  title: 'Submit a Rehab Order',
  description: 'Work on a turnover job.', 
  screen: 'SubmitRehabOrder',
  enabled: true,
},
  {
    key: 'move-out',
    icon: 'exit-outline',
    title: 'Process a Move Out',
    description: 'Complete move-out checklist',
    screen: 'ProcessMoveOut',
    enabled: true,
  },
  {
  key: 'rent-ready-checklist',
  icon: 'checkmark-done-outline',
  title: 'Rent Ready Checklist',
  description: 'Confirm unit ready to rent.',
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

  const [showGreeting, setShowGreeting] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: CROSSFADE_MS,
        useNativeDriver: true,
      }).start(() => {
        setShowGreeting(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: CROSSFADE_MS,
          useNativeDriver: true,
        }).start();
      });
    }, GREETING_DISPLAY_MS);

    return () => clearTimeout(timer);
  }, [fadeAnim]);

  return (
    <TechnicianLayout navigation={navigation} activeRoute="Home">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.greetingBar, { opacity: fadeAnim }]}>
          <View style={styles.greetingInner}>
            {showGreeting ? (
              <>
                <View style={styles.greetingTextGroup}>
                  <Text style={styles.greetingText}>
                    {getTimeOfDayGreeting()}, {displayName}
                  </Text>
                  <Text style={styles.greetingDate}>{getTodayLabel()}</Text>
                </View>

                <View style={styles.greetingIconBadge}>
                  <Ionicons name="sunny-outline" size={20} color={colors.blue} />
                </View>
              </>
            ) : (
              <>
                <View style={styles.greetingTextGroup}>
                  <Text style={styles.greetingText}>Services</Text>
                  <Text style={styles.greetingDate}>
                    Choose a service below to get started.
                  </Text>
                </View>

                <View style={styles.greetingIconBadge}>
                  <Ionicons name="grid-outline" size={20} color={colors.blue} />
                </View>
              </>
            )}
          </View>
        </Animated.View>

        <View style={styles.content}>
          {/* Fixed 2-up grid — see SERVICES above. */}
          <View style={styles.grid}>
            {SERVICES.map((item) => (
              <View key={item.key} style={styles.cardWrap}>
                <TouchableOpacity
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
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </TechnicianLayout>
  );
}