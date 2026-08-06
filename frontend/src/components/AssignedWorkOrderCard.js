import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { hasValidWorkOrderLocation } from '../api/trackingApi';
import { colors } from '../theme/colors';

import styles from '../styles/assignedWorkOrderCardStyles';

const getPrimaryDescription = (workOrder) => {
  return (
    workOrder?.jobDescription ||
    workOrder?.description ||
    workOrder?.issueDetails ||
    'No job description is available.'
  );
};

/**
 * components/AssignedWorkOrderCard.js
 * ----------------------------------------------------------------
 * Sized and typeset to match the Home dashboard's cards exactly
 * (same font sizes, padding, and button treatment) — this used to
 * be its own much larger card style (big stacked LABEL/value blocks,
 * an expand/collapse "Read more" toggle) which is why this screen
 * looked visually disconnected from Home. Resident/address are now
 * compact single-line rows with a small icon, and the job
 * description just truncates at 2 lines like Home's card
 * descriptions do — no separate expand state needed.
 *
 * ONE action button: "Open Work Order" → TechnicianShiftScreen,
 * which shows both the Work Order's full details AND the
 * Start/Break/Continue/End Shift tracking controls together.
 * ----------------------------------------------------------------
 */
const AssignedWorkOrderCard = ({ workOrder, isSelected = false, onSelect }) => {
  const hasLocation = useMemo(() => hasValidWorkOrderLocation(workOrder), [workOrder]);
  const description = useMemo(() => getPrimaryDescription(workOrder), [workOrder]);

  const handleOpen = () => {
    if (typeof onSelect === 'function') {
      onSelect(workOrder);
    }
  };

  if (!workOrder) {
    return null;
  }

  return (
    <View style={[styles.card, isSelected && styles.selectedCard]}>
      <View style={styles.headerRow}>
        <View style={styles.headerContent}>
          <Text style={styles.workOrderNumber} numberOfLines={1}>
            {workOrder.workOrder || 'Work Order'}
          </Text>
          {!!workOrder.issueType && (
            <Text style={styles.issueType} numberOfLines={1}>
              {workOrder.issueType}
            </Text>
          )}
        </View>

        {isSelected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>Selected</Text>
          </View>
        )}
      </View>

      {!!workOrder.residentName && (
        <View style={styles.metaRow}>
          <Ionicons name="person-outline" size={13} color={colors.textFaint} style={styles.metaIcon} />
          <Text style={styles.metaText} numberOfLines={1}>
            {workOrder.residentName}
          </Text>
        </View>
      )}

      <View style={styles.metaRow}>
        <Ionicons name="location-outline" size={13} color={colors.textFaint} style={styles.metaIcon} />
        <Text style={styles.metaText} numberOfLines={1}>
          {workOrder.address || 'Address not available'}
        </Text>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {description}
      </Text>

      <View style={styles.footerRow}>
        <View style={styles.locationRow}>
          <View
            style={[
              styles.locationIndicator,
              hasLocation ? styles.locationAvailableIndicator : styles.locationUnavailableIndicator,
            ]}
          />
          <Text
            style={[
              styles.locationText,
              hasLocation ? styles.locationAvailableText : styles.locationUnavailableText,
            ]}
          >
            {hasLocation ? 'Location available' : 'Location unavailable'}
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleOpen} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>Open</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.textOnDark} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AssignedWorkOrderCard;