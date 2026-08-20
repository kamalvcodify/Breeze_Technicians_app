import React, { useState } from 'react';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import TechnicianLayout from '../components/TechnicianLayout';
import AppPopup from '../components/AppPopup';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import styles from '../styles/PrivacyPolicyScreen.styles';

const POLICY_URL = 'https://www.breezepropertygroup.com/privacy-policy';
const CONTACT_EMAIL = 'leasing@breezepropertygroup.com';
const CONTACT_PHONE = '917-426-6188';

/**
 * screens/PrivacyPolicyScreen.js
 * ----------------------------------------------------------------
 * Content is transcribed directly from the official policy at
 * breezepropertygroup.com/privacy-policy (same numbering, same
 * order, same wording) — this is NOT placeholder or generated copy.
 *
 * "Contact Us" (09) is now just another row in the SAME accordion
 * as sections 01-08 (same white background, same header row, same
 * expand/collapse) — it used to be its own separately-styled dark
 * card above/below the list, which looked inconsistent. The
 * standalone intro card with its own "View official policy" button
 * is gone entirely; that link now lives inside the Contact Us (09)
 * row instead, and tapping it shows a "you're leaving the app"
 * confirmation (via AppPopup) before opening the browser.
 *
 * FIX: isAdmin now read from useAuth() and passed to
 * TechnicianLayout - previously this was omitted entirely, so the
 * header always defaulted to the technician nav (Home/My Assigned
 * Work Orders/Start Shift) regardless of who was actually logged
 * in, even for an admin. Same fix already applied to
 * ReportsScreen.js/ReportListScreen.js/ReportDetailScreen.js.
 * ----------------------------------------------------------------
 */
const SECTIONS = [
  {
    title: 'Information We May Collect',
    intro: 'We may collect information about you through other means, such as:',
    bullets: [
      {
        label: 'Offline Interactions:',
        text: 'Information provided in person, over the phone, or at events, including your name, phone number, email address, or mailing address.',
      },
      {
        label: 'Third-Party Sources:',
        text: 'Information obtained through partnerships or referrals, provided you have consented to such sharing.',
      },
      {
        label: 'Transactional Data:',
        text: 'Information collected when you engage in a business transaction with us, such as purchases or service inquiries.',
      },
      {
        label: 'Website Usage Data:',
        text: 'Non-personal data, such as IP addresses, browser types, and pages viewed, collected automatically to enhance user experience.',
      },
    ],
  },
  {
    title: 'How We Use Your Information',
    intro: 'The information we collect may be used for the following purposes:',
    bullets: [
      { text: 'To respond to your inquiries and provide customer support.' },
      { text: 'To deliver services or products you have requested.' },
      { text: 'To send communications, including SMS or emails, if you have explicitly consented.' },
      { text: 'To improve our services, website functionality, and customer interactions.' },
      { text: 'To comply with legal obligations or protect against fraudulent activity.' },
    ],
  },
  {
    title: 'SMS and Email Communications',
    intro: 'If we have collected your contact information through offline means or other interactions:',
    bullets: [
      {
        label: 'Consent Requirement:',
        text: 'We will only send promotional or transactional SMS or emails if you have explicitly opted in.',
      },
      {
        label: 'Message Frequency and Rates:',
        text: 'Message frequency varies. Message and data rates may apply.',
      },
      {
        label: 'Opt-Out Option:',
        text: 'You can opt out of receiving communications at any time by replying "STOP" to SMS messages or using the unsubscribe link in emails.',
      },
    ],
  },
  {
    title: 'How We Share Your Information',
    paragraphs: [
      'We will not share your opt-in to an SMS campaign with any third party for purposes unrelated to providing you with the services of that campaign. We may share your Personal Data, including your SMS opt-in or consent status, with third parties that help us provide our messaging services, including but not limited to platform providers, phone companies, and any other vendors who assist us in the delivery of text messages.',
      'All the above categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.',
    ],
  },
  {
    title: 'Security of Your Information',
    paragraphs: [
      'We use reasonable administrative, technical, and physical safeguards to protect your personal information. However, no data transmission or storage system can be guaranteed to be 100% secure.',
    ],
  },
  {
    title: 'Your Rights',
    intro: 'Depending on your location, you may have the following rights:',
    bullets: [
      { text: 'The right to access the personal information we hold about you.' },
      { text: 'The right to request correction, deletion, or restriction of your information.' },
      { text: 'The right to withdraw consent for communications at any time.' },
    ],
    footer: 'To exercise these rights, contact us at leasing@breezepropertygroup.com or 419-718-2743.',
  },
  {
    title: 'Cookies and Tracking Technologies',
    paragraphs: [
      'Our website may use cookies and similar technologies to collect non-personal data for analytics and site functionality. You can manage cookie preferences through your browser settings.',
    ],
  },
  {
    title: 'Updates to This Policy',
    paragraphs: [
      'We may update this Privacy Policy periodically. Changes will be posted on this page with an updated "Effective Date."',
    ],
  },
];

// Shared row chrome for every accordion item, including Contact Us,
// so the number/title/chevron header always looks identical.
function AccordionRow({ number, title, isExpanded, onToggle, children }) {
  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onToggle} activeOpacity={0.7}>
        <Text style={styles.sectionNumber}>{number}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textFaint}
        />
      </TouchableOpacity>

      {isExpanded && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

function SectionBody({ section }) {
  return (
    <>
      {!!section.intro && <Text style={styles.sectionText}>{section.intro}</Text>}

      {!!section.paragraphs &&
        section.paragraphs.map((paragraph) => (
          <Text key={paragraph.slice(0, 24)} style={[styles.sectionText, styles.sectionParagraph]}>
            {paragraph}
          </Text>
        ))}

      {!!section.bullets &&
        section.bullets.map((bullet) => (
          <View key={bullet.text.slice(0, 24)} style={styles.bulletRow}>
            <Text style={styles.bulletDot}>{'\u2022'}</Text>
            <Text style={styles.bulletText}>
              {!!bullet.label && <Text style={styles.bulletLabel}>{bullet.label} </Text>}
              {bullet.text}
            </Text>
          </View>
        ))}

      {!!section.footer && <Text style={styles.sectionFooter}>{section.footer}</Text>}
    </>
  );
}

export default function PrivacyPolicyScreen({ navigation }) {
  const { isAdmin } = useAuth();
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [leavingAppVisible, setLeavingAppVisible] = useState(false);

  // Sections 01-08 plus Contact Us as 09 - one continuous list so
  // there's only one "currently expanded" index to track.
  const contactIndex = SECTIONS.length;

  const toggleSection = (index) => {
    setExpandedIndex((current) => (current === index ? -1 : index));
  };

  const confirmOpenOfficialPolicy = () => {
    setLeavingAppVisible(false);
    Linking.openURL(POLICY_URL);
  };

  return (
    <TechnicianLayout navigation={navigation} activeRoute="Privacy" isAdmin={isAdmin}>
      <View style={styles.headerBar}>
        <View style={styles.headerBarInner}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Privacy Policy</Text>
            <Text style={styles.headerSubtitle}>Effective date: 30 June 2026</Text>
          </View>

          <View style={styles.headerIconBadge}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.blue} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.accordionCard}>
            {SECTIONS.map((section, index) => (
              <AccordionRow
                key={section.title}
                number={String(index + 1).padStart(2, '0')}
                title={section.title}
                isExpanded={expandedIndex === index}
                onToggle={() => toggleSection(index)}
              >
                <SectionBody section={section} />
              </AccordionRow>
            ))}

            <AccordionRow
              number={String(contactIndex + 1).padStart(2, '0')}
              title="Contact Us"
              isExpanded={expandedIndex === contactIndex}
              onToggle={() => toggleSection(contactIndex)}
            >
              <Text style={styles.sectionText}>
                If you have any questions or concerns about this Privacy Policy, please contact
                us at:
              </Text>

              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
                activeOpacity={0.7}
              >
                <Ionicons name="mail-outline" size={16} color={colors.blue} />
                <Text style={styles.contactLinkText}>{CONTACT_EMAIL}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`tel:${CONTACT_PHONE}`)}
                activeOpacity={0.7}
              >
                <Ionicons name="call-outline" size={16} color={colors.blue} />
                <Text style={styles.contactLinkText}>{CONTACT_PHONE}</Text>
              </TouchableOpacity>

              <View style={styles.contactRow}>
                <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                <Text style={styles.sectionText}>500 Westover Dr. #33333, Sanford, NC 27330</Text>
              </View>

              <Text style={styles.sectionFooter}>
                By interacting with us or using our website, you agree to the terms of this
                Privacy Policy.
              </Text>

              <TouchableOpacity
                style={styles.officialLinkRow}
                onPress={() => setLeavingAppVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="open-outline" size={15} color={colors.blue} />
                <Text style={styles.officialLinkText}>View the full official policy</Text>
              </TouchableOpacity>
            </AccordionRow>
          </View>
        </View>
      </ScrollView>

      <AppPopup
        visible={leavingAppVisible}
        title="You're leaving the app"
        message="This link opens the official Privacy Policy on breezepropertygroup.com in your browser, outside the Breeze app."
        primaryLabel="Continue"
        onPrimaryPress={confirmOpenOfficialPolicy}
        secondaryLabel="Cancel"
        onSecondaryPress={() => setLeavingAppVisible(false)}
        onClose={() => setLeavingAppVisible(false)}
      />
    </TechnicianLayout>
  );
}