import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../components/AppButton';
import TechnicianLayout from '../components/TechnicianLayout';

import useShiftTracking, { SHIFT_PHASE } from '../hooks/useShiftTracking';
import { hasValidWorkOrderLocation } from '../api/trackingApi';
import { formatDistance } from '../utils/distance';
import { colors } from '../theme/colors';

import styles from '../styles/TechnicianShiftScreen.styles';

/**
 * Small lookup describing how each shift phase should present
 * itself - icon, badge color, title and subtitle. Keeping this as
 * a plain lookup (rather than a long if/else chain in the render)
 * makes it easy to scan every possible state at a glance and keeps
 * the JSX below focused on structure, not phase-by-phase text.
 */
function getStatusPresentation(phase, { radiusMeters, distanceMeters } = {}) {
  switch (phase) {
    case SHIFT_PHASE.CHECKING_LOCATION:
      return {
        icon: 'locate-outline',
        badgeStyle: 'idle',
        title: 'Checking your location…',
        subtitle: 'Reading your current GPS position and comparing it to the property.',
      };
    case SHIFT_PHASE.OUT_OF_RANGE:
      return {
        icon: 'alert-circle-outline',
        badgeStyle: 'error',
        title: "You're out of range",
        subtitle: `Move within ${radiusMeters}m of the property to start this shift.`,
      };
    case SHIFT_PHASE.READY:
      return {
        icon: 'checkmark-circle-outline',
        badgeStyle: 'idle',
        title: "You're in range",
        subtitle:
          distanceMeters != null
            ? `You are ${formatDistance(distanceMeters)} from this property. Ready to start.`
            : 'Ready to start your shift.',
      };
    case SHIFT_PHASE.STARTING:
      return {
        icon: 'hourglass-outline',
        badgeStyle: 'idle',
        title: 'Starting shift…',
        subtitle: 'Please wait while we create your tracking session.',
      };
    case SHIFT_PHASE.ACTIVE:
      return {
        icon: 'play-circle-outline',
        badgeStyle: 'active',
        title: 'Shift active',
        subtitle: 'Your shift is running. Take a break or end the shift when you finish.',
      };
    case SHIFT_PHASE.PAUSING:
      return {
        icon: 'hourglass-outline',
        badgeStyle: 'idle',
        title: 'Starting break…',
        subtitle: 'Please wait.',
      };
    case SHIFT_PHASE.ON_BREAK:
      return {
        icon: 'pause-circle-outline',
        badgeStyle: 'break',
        title: 'On break',
        subtitle: 'Location tracking is paused. Press Continue when you resume work.',
      };
    case SHIFT_PHASE.RESUMING:
      return {
        icon: 'locate-outline',
        badgeStyle: 'idle',
        title: 'Checking your location…',
        subtitle: 'Confirming you are still near the property before resuming.',
      };
    case SHIFT_PHASE.STOPPING:
      return {
        icon: 'hourglass-outline',
        badgeStyle: 'idle',
        title: 'Ending shift…',
        subtitle: 'Please wait while we save your final location.',
      };
    case SHIFT_PHASE.ENDED:
      return {
        icon: 'checkmark-done-circle-outline',
        badgeStyle: 'active',
        title: 'Shift ended',
        subtitle: 'This shift has been closed out. Thank you.',
      };
    case SHIFT_PHASE.IDLE:
    default:
      return {
        icon: 'location-outline',
        badgeStyle: 'idle',
        title: 'Ready to check in',
        subtitle: 'Press "Check my location" to see if you can start this shift.',
      };
  }
}

const BADGE_STYLE_MAP = {
  idle: 'statusIconBadgeIdle',
  active: 'statusIconBadgeActive',
  break: 'statusIconBadgeBreak',
  error: 'statusIconBadgeError',
};

const BADGE_ICON_COLOR_MAP = {
  idle: colors.blue,
  active: colors.success,
  break: colors.warning,
  error: colors.error,
};

export default function TechnicianShiftScreen({ navigation, route }) {
  const workOrder = route?.params?.workOrder || null;

  const {
    phase,
    errorMessage,
    distanceMeters,
    breakStartedAt,
    shiftStartedAt,
    radiusMeters,
    checkLocationAndDistance,
    startShift,
    startBreak,
    continueShift,
    endShift,
  } = useShiftTracking({ workOrder });

  // Rehydration + the automatic first distance check both now live
  // inside useShiftTracking itself (it needs to check for an
  // already-in-progress session BEFORE deciding whether to
  // auto-check distance) - see the mount effect in that hook.

  const locationIsValid = hasValidWorkOrderLocation(workOrder);
  const presentation = getStatusPresentation(phase, { radiusMeters, distanceMeters });
  const badgeStyleKey = BADGE_STYLE_MAP[presentation.badgeStyle];
  const badgeIconColor = BADGE_ICON_COLOR_MAP[presentation.badgeStyle];

  const assignedTechnicians = Array.isArray(workOrder?.assignedTechnicians)
    ? workOrder.assignedTechnicians
    : [];

  const canRetryCheck =
    phase === SHIFT_PHASE.OUT_OF_RANGE || phase === SHIFT_PHASE.IDLE;

  return (
    <TechnicianLayout navigation={navigation} activeRoute="MyAssignedWorkOrders">
      <View style={styles.headerBar}>
        <View style={styles.headerBarInner}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Technician Shift</Text>
            <Text style={styles.headerSubtitle}>
              Check in, take breaks, and end your shift for this Work Order.
            </Text>
          </View>

          <View style={styles.headerIconBadge}>
            <Ionicons name="time-outline" size={18} color={colors.blue} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* --- Work Order summary -------------------------------- */}
          <View style={styles.card}>
            <Text style={styles.cardKicker}>WORK ORDER</Text>
            <Text style={styles.cardTitle}>{workOrder?.workOrder || 'Work Order'}</Text>

            {!!workOrder?.address && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={colors.textMuted}
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText}>{workOrder.address}</Text>
              </View>
            )}

            {!!workOrder?.issueType && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="build-outline"
                  size={16}
                  color={colors.textMuted}
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText}>{workOrder.issueType}</Text>
              </View>
            )}

            {!!workOrder?.residentName && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={colors.textMuted}
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText}>{workOrder.residentName}</Text>
              </View>
            )}

            {assignedTechnicians.length > 0 && (
              <View style={styles.techniciansWrap}>
                {assignedTechnicians.map((tech, index) => (
                  <View key={`${tech.email || tech.name || index}`} style={styles.technicianChip}>
                    <Text style={styles.technicianChipText}>{tech.name || tech.email}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* --- Status / location check ----------------------------- */}
          <View style={styles.statusCard}>
            <View style={[styles.statusIconBadge, styles[badgeStyleKey]]}>
              <Ionicons name={presentation.icon} size={30} color={badgeIconColor} />
            </View>

            <Text style={styles.statusTitle}>{presentation.title}</Text>
            <Text style={styles.statusSubtitle}>{presentation.subtitle}</Text>

            {distanceMeters != null && phase !== SHIFT_PHASE.IDLE && (
              <View style={styles.distancePill}>
                <Ionicons name="navigate-outline" size={14} color={colors.text} />
                <Text style={styles.distancePillText}>
                  {formatDistance(distanceMeters)} from property
                </Text>
              </View>
            )}

            {!!errorMessage && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {!locationIsValid && (
              <AppButton title="This Work Order has no location" disabled onPress={() => {}} />
            )}

            {locationIsValid && (
              <View style={styles.actionsRow}>
                {(phase === SHIFT_PHASE.IDLE || canRetryCheck) && (
                  <View style={styles.actionButtonWrap}>
                    <AppButton
                      title="Check my location"
                      onPress={checkLocationAndDistance}
                      loading={phase === SHIFT_PHASE.CHECKING_LOCATION}
                    />
                  </View>
                )}

                {phase === SHIFT_PHASE.READY && (
                  <View style={styles.actionButtonWrap}>
                    <AppButton
                      title="Start Shift"
                      onPress={startShift}
                      loading={phase === SHIFT_PHASE.STARTING}
                    />
                  </View>
                )}

                {phase === SHIFT_PHASE.ACTIVE && (
                  <>
                    <View style={styles.actionButtonWrap}>
                      <AppButton title="Break" variant="outline" onPress={startBreak} />
                    </View>
                    <View style={styles.actionButtonWrap}>
                      <AppButton title="End Shift" variant="danger" onPress={endShift} />
                    </View>
                  </>
                )}

                {phase === SHIFT_PHASE.ON_BREAK && (
                  <View style={styles.actionButtonWrap}>
                    <AppButton
                      title="Continue"
                      onPress={continueShift}
                      loading={phase === SHIFT_PHASE.RESUMING}
                    />
                  </View>
                )}

                {phase === SHIFT_PHASE.ENDED && (
                  <View style={styles.actionButtonWrap}>
                    <AppButton
                      title="Back to Assigned Work Orders"
                      onPress={() => navigation.navigate('MyAssignedWorkOrders')}
                    />
                  </View>
                )}
              </View>
            )}

            {(shiftStartedAt || breakStartedAt) && (
              <View style={styles.timelineWrap}>
                {!!shiftStartedAt && (
                  <View style={styles.timelineRow}>
                    <Ionicons name="play-outline" size={13} color={colors.textMuted} />
                    <Text style={styles.timelineLabel}>Started: </Text>
                    <Text style={styles.timelineValue}>
                      {new Date(shiftStartedAt).toLocaleTimeString()}
                    </Text>
                  </View>
                )}
                {!!breakStartedAt && (
                  <View style={styles.timelineRow}>
                    <Ionicons name="pause-outline" size={13} color={colors.textMuted} />
                    <Text style={styles.timelineLabel}>Break started: </Text>
                    <Text style={styles.timelineValue}>
                      {new Date(breakStartedAt).toLocaleTimeString()}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </TechnicianLayout>
  );
}