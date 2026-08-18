import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import AppButton from './AppButton';
import styles from '../styles/TermsAcceptanceCard.styles';

const SECTIONS = [
  {
    heading: '1. When We Track Your Location',
    intro:
      'Your location is only tracked when you are actively working. Specifically, the App will collect GPS location data under the following conditions:',
    bullets: [
      'At Login and Logout: To verify the start and end of your workday.',
      'While En Route to a Job: To provide dispatchers with accurate ETAs.',
      'While On-Site: The App will record your location periodically (approximately every 10 minutes) while you are actively checked into a work order.',
      'Job Site Arrival and Departure: The App uses geofencing to automatically detect when you arrive at or leave an assigned job site.',
    ],
  },
  {
    heading: '2. When We DO NOT Track Your Location',
    intro:
      'We respect your off-duty privacy. The App will completely stop tracking your location when:',
    bullets: [
      'You are Logged Out: Once you tap "Logout," the background tracking service is immediately terminated. No location data is collected outside of your logged-in work hours.',
      'You are on a Break: If you use the "Pause Tracking" or "Break" feature in the App, location polling is suspended until you resume work.',
    ],
  },
  {
    heading: '3. How We Use Your Data',
    intro:
      'The location data collected is used strictly for legitimate business purposes, including:',
    bullets: [
      'Dispatching: Assigning new work orders based on your proximity to the job site.',
      'Payroll and Invoicing Verification: Verifying your time on-site to ensure accurate and prompt payment for both W-2 employees and 1099 independent contractors.',
      'Customer Updates: Providing accurate arrival times for scheduled work orders.',
    ],
  },
  {
    heading: '4. Data Retention',
    intro:
      'Your historical location data will be securely stored in our systems for a period of one (1) year to support auditing, payroll verification, and dispute resolution. After one year, the data is automatically deleted.',
    bullets: [],
  },
  {
    heading: '5. Your Device and Permissions',
    intro:
      'Whether you are using a company-provided device or your own personal device, you must grant the App "Always Allow" or "Allow all the time" location permissions in your device settings. This permission is required for the App to detect job site arrivals while the phone is in your pocket or the screen is locked.',
    bullets: [],
  },
  {
    heading: '6. Acknowledgment and Consent',
    intro:
      'By tapping "I Accept" below, you acknowledge that you have read and understand these Terms and Conditions in full. You explicitly consent to the collection, use, and storage of your geolocation data as described above during your active working hours. You understand that this consent is a requirement for receiving and completing work orders through the App.',
    bullets: [],
  },
];

export default function TermsAcceptanceCard({ onAccept, onDecline, accepting }) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Breeze Property Group — Mobile Application</Text>
      <Text style={styles.subtitle}>Terms and Conditions of Use</Text>
      <Text style={styles.meta}>Last Updated: June 2026</Text>

      <View style={styles.scrollWrapper}>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled
          showsVerticalScrollIndicator
        >
          <Text style={styles.disclaimer}>
            This summary is provided only for convenience. Please review the Terms of Service
            below in their entirety for important information and legal conditions that apply to
            your use of the Platform.
          </Text>

          <Text style={styles.paragraph}>
            By downloading, accessing, or using the Breeze Property Group mobile application
            ("the App"), you agree to be bound by these Terms and Conditions. These terms govern
            your use of the App and all services, features, and functionality made available
            through it. The App is provided by Breeze Property Group for use by authorized field
            technicians and personnel in connection with work assignments, scheduling, and job
            management. Use of the App is limited to authorized users and is subject to the
            policies and procedures of Breeze Property Group. Breeze Property Group reserves the
            right to update these terms at any time, and continued use of the App following any
            such update constitutes acceptance of the revised terms.
          </Text>

          <Text style={styles.sectionHeading}>Location Tracking Consent and Policy</Text>

          <Text style={styles.paragraph}>
            To improve dispatching, ensure accurate payroll and invoicing, and enhance safety, the
            App utilizes location tracking technology. Because we value your privacy and
            transparency, please read and accept the following terms regarding how and when your
            location is tracked.
          </Text>

          {SECTIONS.map((section) => (
            <View key={section.heading} style={styles.section}>
              <Text style={styles.heading}>{section.heading}</Text>
              <Text style={styles.paragraph}>{section.intro}</Text>

              {section.bullets.map((bullet) => (
                <View key={bullet} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>{'\u2022'}</Text>
                  <Text style={styles.bulletText}>{bullet}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>

      <AppButton title="I Accept" onPress={onAccept} loading={accepting} />

      <AppButton
        title="Use a different email"
        variant="text"
        onPress={onDecline}
        disabled={accepting}
      />
    </View>
  );
}