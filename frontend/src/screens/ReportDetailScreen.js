import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import TechnicianLayout from '../components/TechnicianLayout';
import { CHECKLIST_SECTIONS } from '../components/RentReadyChecklistFormSection';
import { colors } from '../theme/colors';
import styles from '../styles/ReportDetailScreen.styles';

/**
 * screens/ReportDetailScreen.js
 * ----------------------------------------------------------------
 * ONE generic detail screen for all 5 reports. `row` (passed via
 * navigation params from ReportListScreen) already contains
 * everything needed - no fetch here.
 *
 * row.groups: array of { title, fields: [{label, value}] } -
 * rendered as stacked sections (Ticket 1, Ticket 2, Ticket 3 for
 * Work Order; Rehab Order/Rehab2/Rehab3 for Rehab Order; a single
 * section for the single-entry forms).
 *
 * row.checklist (Rent Ready Checklist only): {shortKey: boolean} -
 * rendered using the SAME labels already defined in
 * RentReadyChecklistFormSection.js's CHECKLIST_SECTIONS, so the 29
 * item labels aren't duplicated anywhere.
 * ----------------------------------------------------------------
 */
function FieldRow({ label, value }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function DetailGroup({ title, fields }) {
  if (!fields || fields.length === 0) {
    return null;
  }

  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>

      <View style={styles.groupCard}>
        {fields.map((field) => (
          <FieldRow key={field.label} label={field.label} value={field.value} />
        ))}
      </View>
    </View>
  );
}

function ChecklistGroup({ checklist }) {
  if (!checklist) {
    return null;
  }

  return (
    <>
      {CHECKLIST_SECTIONS.map((section) => (
        <View key={section.title} style={styles.group}>
          <Text style={styles.groupTitle}>{section.title}</Text>

          <View style={styles.groupCard}>
            {section.items.map((item) => (
              <View key={item.key} style={styles.checklistRow}>
                <Ionicons
                  name={checklist[item.key] ? 'checkmark-circle' : 'close-circle-outline'}
                  size={18}
                  color={checklist[item.key] ? colors.success : colors.textFaint}
                  style={styles.checklistIcon}
                />
                <Text style={styles.checklistLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </>
  );
}

export default function ReportDetailScreen({ navigation, route }) {
  const { title, row } = route.params || {};

  return (
    <TechnicianLayout navigation={navigation} activeRoute="Reports">
      <View style={styles.headerBar}>
        <View style={styles.headerBarInner}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>{title || 'Record'}</Text>
            <Text style={styles.headerSubtitle}>Record details</Text>
          </View>

          <View style={styles.headerIconBadge}>
            <Ionicons name="document-text-outline" size={18} color={colors.blue} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {(row?.groups || []).map((group) => (
            <DetailGroup key={group.title} title={group.title} fields={group.fields} />
          ))}

          <ChecklistGroup checklist={row?.checklist} />
        </View>
      </ScrollView>
    </TechnicianLayout>
  );
}