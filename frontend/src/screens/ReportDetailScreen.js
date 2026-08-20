import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import TechnicianLayout from '../components/TechnicianLayout';
import ReportImage from '../components/ReportImage';
import { CHECKLIST_SECTIONS } from '../components/RentReadyChecklistFormSection';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import styles from '../styles/ReportDetailScreen.styles';

/**
 * screens/ReportDetailScreen.js
 * ----------------------------------------------------------------
 * ONE generic detail screen for all 5 reports. `row` (passed via
 * navigation params from ReportListScreen) already contains
 * everything needed - no fetch here, EXCEPT for images, which each
 * load independently via ReportImage.
 *
 * row.groups: array of { title, fields: [{label, value}], images:
 * [imageRef, imageRef, ...] } - each imageRef is a structured
 * object ({reportLinkName, recordId, subformName, fieldName,
 * subformRecordId}), NOT a plain path string (fix from earlier -
 * the raw Image field string wasn't a working download path on its
 * own; the backend reconstructs the real URL from these 5 pieces).
 *
 * row.checklist (Rent Ready Checklist only): unchanged.
 *
 * isAdmin read from useAuth() and passed to TechnicianLayout.
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

function DetailGroup({ title, fields, images }) {
  const hasFields = fields && fields.length > 0;
  const hasImages = images && images.length > 0;

  if (!hasFields && !hasImages) {
    return null;
  }

  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>

      {hasFields && (
        <View style={styles.groupCard}>
          {fields.map((field) => (
            <FieldRow key={field.label} label={field.label} value={field.value} />
          ))}
        </View>
      )}

      {hasImages && (
        <View style={styles.imagesRow}>
          {images.map((imageRef) => (
            <ReportImage key={imageRef.subformRecordId} imageRef={imageRef} />
          ))}
        </View>
      )}
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
  const { isAdmin } = useAuth();

  return (
    <TechnicianLayout navigation={navigation} activeRoute="Reports" isAdmin={isAdmin}>
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
            <DetailGroup
              key={group.title}
              title={group.title}
              fields={group.fields}
              images={group.images}
            />
          ))}

          <ChecklistGroup checklist={row?.checklist} />
        </View>
      </ScrollView>
    </TechnicianLayout>
  );
}