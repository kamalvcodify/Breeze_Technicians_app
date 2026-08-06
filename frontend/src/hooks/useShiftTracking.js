import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getForegroundPermissionStatus,
  requestForegroundPermission,
  getCurrentPosition,
  isLocationServicesEnabled,
  requestBackgroundPermission,
  getBackgroundPermissionStatus,
  startBackgroundLocationUpdates,
  stopBackgroundLocationUpdates,
  PERMISSION_STATUS,
} from '../services/locationService';

import {
  setActiveShiftContext,
  clearActiveShiftContext,
  setShiftSessionRecord,
  getShiftSessionRecord,
  clearShiftSessionRecord,
} from '../services/shiftContextStore';

import { getDistanceInMeters, isWithinRadius } from '../utils/distance';

import {
  startTrackingSession,
  startTrackingBreak,
  continueTrackingSession,
  stopTrackingSession,
  sendTrackingLocation,
} from '../api/trackingApi';

// Per the handover doc, Section 18: "Suggested initial radius: 150 metres."
export const SHIFT_RADIUS_METERS = 150;

// How often to send a location ping WHILE THE APP IS IN THE
// FOREGROUND and a shift is Active. This matches the background
// task's own 1-minute interval (see services/locationService.js)
// so testing behaves consistently whether the app is foregrounded
// or not. This foreground interval exists IN ADDITION to the
// background task because expo-task-manager's background updates
// only fire in a development/production build, NOT in Expo Go - so
// without this, testing in Expo Go would look like tracking "isn't
// working" even though Start/Break/Continue/Stop calls succeed fine.
export const FOREGROUND_PING_INTERVAL_MS = 60 * 1000; // 1 minute

/**
 * Shift phase constants. These map directly onto the "Suggested
 * tracking statuses" in the handover doc, Section 20:
 * Started, Active, Break, Continued, Stopped, Logged Out.
 */
export const SHIFT_PHASE = {
  IDLE: 'idle', // Nothing started yet, distance not yet checked.
  CHECKING_LOCATION: 'checking_location', // Reading GPS + validating distance.
  OUT_OF_RANGE: 'out_of_range', // Too far from the Work Order location.
  READY: 'ready', // Within range, technician can press Start.
  STARTING: 'starting', // Start request in flight.
  ACTIVE: 'active', // Shift running.
  PAUSING: 'pausing', // Break request in flight.
  ON_BREAK: 'on_break', // Shift paused, no location recorded.
  RESUMING: 'resuming', // Continue request in flight (re-validating distance).
  STOPPING: 'stopping', // Stop/End Shift request in flight.
  ENDED: 'ended', // Shift complete.
};

/**
 * Encapsulates the entire Technician Shift state machine described
 * in the handover doc, Sections 17-18:
 *
 *   Start -> (distance check) -> Active -> Break -> Continue
 *   (distance check again) -> Active -> End Shift
 *
 * IMPORTANT - state persistence across navigation: this hook's
 * React state (phase, sessionId, timestamps) only lives as long as
 * the component using it stays mounted. If the technician navigates
 * to another screen (Home, My Assigned Work Orders) and back, this
 * hook is torn down and re-created from scratch. The actual GPS
 * tracking (background task, see tasks/backgroundLocationTask.js)
 * keeps running fine regardless - it's registered independently of
 * any screen - but without rehydration, the UI would forget a shift
 * was Active or On Break and incorrectly show "Ready to check in"
 * again. The mount effect below fixes that by reading the durable
 * session record (services/shiftContextStore.js) BEFORE deciding
 * whether to auto-run the initial distance check.
 *
 * The screen component only needs to read `phase` and call the
 * handful of action functions this hook returns - all location
 * permission handling, GPS reads, distance math and API calls live
 * here, not in the screen.
 */
export default function useShiftTracking({ workOrder }) {
  const [phase, setPhase] = useState(SHIFT_PHASE.IDLE);
  const [errorMessage, setErrorMessage] = useState('');
  const [distanceMeters, setDistanceMeters] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [breakStartedAt, setBreakStartedAt] = useState(null);
  const [shiftStartedAt, setShiftStartedAt] = useState(null);

  // Holds the backend session id once a shift has actually started,
  // so Break/Continue/Stop calls know which session to act on.
  const sessionIdRef = useRef(null);

  const workOrderLatitude = Number(workOrder?.latitude);
  const workOrderLongitude = Number(workOrder?.longitude);
  const hasWorkOrderLocation =
    Number.isFinite(workOrderLatitude) && Number.isFinite(workOrderLongitude);

  /**
   * Requests permission (if needed), reads the current GPS position,
   * and compares it against the Work Order's coordinates. Used both
   * for the initial Start check and again on Continue, per the doc:
   * "Location is validated again" after a Break.
   */
  const checkLocationAndDistance = useCallback(async () => {
    setErrorMessage('');

    if (!hasWorkOrderLocation) {
      setPhase(SHIFT_PHASE.OUT_OF_RANGE);
      setErrorMessage(
        'This Work Order does not have a valid location. Ask an admin to update it before starting a shift.'
      );
      return { ok: false };
    }

    setPhase(SHIFT_PHASE.CHECKING_LOCATION);

    const servicesEnabled = await isLocationServicesEnabled();
    if (!servicesEnabled) {
      setPhase(SHIFT_PHASE.OUT_OF_RANGE);
      setErrorMessage('Location services are turned off. Please enable them and try again.');
      return { ok: false };
    }

    const existingPermission = await getForegroundPermissionStatus();
    let permissionStatus = existingPermission.status;

    if (permissionStatus !== PERMISSION_STATUS.GRANTED) {
      const requested = await requestForegroundPermission();
      permissionStatus = requested.status;
    }

    if (permissionStatus !== PERMISSION_STATUS.GRANTED) {
      setPhase(SHIFT_PHASE.OUT_OF_RANGE);
      setErrorMessage(
        'Location permission is required to start a shift. Please allow location access in your device settings.'
      );
      return { ok: false };
    }

    const position = await getCurrentPosition();

    if (!position.success) {
      setPhase(SHIFT_PHASE.OUT_OF_RANGE);
      setErrorMessage(position.message);
      return { ok: false };
    }

    setCurrentPosition(position);

    const distance = getDistanceInMeters(
      { latitude: position.latitude, longitude: position.longitude },
      { latitude: workOrderLatitude, longitude: workOrderLongitude }
    );

    setDistanceMeters(distance);

    const withinRange = isWithinRadius(distance, SHIFT_RADIUS_METERS);

    if (!withinRange) {
      setPhase(SHIFT_PHASE.OUT_OF_RANGE);
      setErrorMessage(
        `You're too far from this property to start a shift. Move within ${SHIFT_RADIUS_METERS}m and try again.`
      );
      return { ok: false, position, distance };
    }

    setPhase(SHIFT_PHASE.READY);
    return { ok: true, position, distance };
  }, [hasWorkOrderLocation, workOrderLatitude, workOrderLongitude]);

  /**
   * Start Shift - only callable once phase is READY (i.e. the
   * distance check above already passed).
   */
  const startShift = useCallback(async () => {
    if (!currentPosition) {
      return;
    }

    setPhase(SHIFT_PHASE.STARTING);
    setErrorMessage('');

    const result = await startTrackingSession({
      workOrderId: workOrder?.id,
      latitude: currentPosition.latitude,
      longitude: currentPosition.longitude,
    });

    if (!result.success) {
      setPhase(SHIFT_PHASE.READY);
      setErrorMessage(result.message);
      return;
    }

    sessionIdRef.current = result.data?.sessionId || result.data?.id || null;
    const startedAt = new Date().toISOString();
    setShiftStartedAt(startedAt);
    setPhase(SHIFT_PHASE.ACTIVE);

    // Persist which session is active so the background task
    // (which runs independently of this hook/screen) knows what to
    // attribute location points to.
    await setActiveShiftContext({
      sessionId: sessionIdRef.current,
      workOrderId: workOrder?.id,
    });

    // Separate, longer-lived record used purely to rehydrate this
    // hook's UI state if the technician navigates away and back -
    // see the mount effect below and the comment block on
    // services/shiftContextStore.js.
    await setShiftSessionRecord({
      sessionId: sessionIdRef.current,
      workOrderId: workOrder?.id,
      phase: SHIFT_PHASE.ACTIVE,
      shiftStartedAt: startedAt,
      breakStartedAt: null,
    });

    // Background permission must be requested after foreground
    // permission is already granted (checkLocationAndDistance above
    // already secured that). This is best-effort: if the technician
    // declines background permission, the shift still runs with
    // foreground-only tracking rather than blocking Start entirely.
    const existingBackgroundPermission = await getBackgroundPermissionStatus();
    let backgroundPermissionStatus = existingBackgroundPermission.status;

    if (backgroundPermissionStatus !== PERMISSION_STATUS.GRANTED) {
      const requested = await requestBackgroundPermission();
      backgroundPermissionStatus = requested.status;
    }

    if (backgroundPermissionStatus === PERMISSION_STATUS.GRANTED) {
      await startBackgroundLocationUpdates();
    } else {
      console.warn(
        '[useShiftTracking] Background location permission was not granted - tracking will only work while the app is in the foreground.'
      );
    }
  }, [currentPosition, workOrder?.id]);

  /**
   * Break - per the doc: "Stop foreground location updates. Stop
   * background location updates. Do not record coordinates."
   *
   * Note this clears the ACTIVE SHIFT CONTEXT (so the background
   * task stops posting) but keeps the SHIFT SESSION RECORD (so the
   * UI can still be rehydrated as "On break" later) - see
   * services/shiftContextStore.js.
   */
  const startBreak = useCallback(async () => {
    setPhase(SHIFT_PHASE.PAUSING);
    setErrorMessage('');

    const result = await startTrackingBreak({ sessionId: sessionIdRef.current });

    if (!result.success) {
      setPhase(SHIFT_PHASE.ACTIVE);
      setErrorMessage(result.message);
      return;
    }

    const pausedAt = new Date().toISOString();
    setBreakStartedAt(pausedAt);
    setPhase(SHIFT_PHASE.ON_BREAK);

    // Per the handover doc: "Stop foreground location updates. Stop
    // background location updates. Do not record coordinates."
    await stopBackgroundLocationUpdates();
    await clearActiveShiftContext();

    // The session itself is still "in progress", just paused - keep
    // the durable record so a remount restores "On break", not
    // "Ready to check in".
    await setShiftSessionRecord({
      sessionId: sessionIdRef.current,
      workOrderId: workOrder?.id,
      phase: SHIFT_PHASE.ON_BREAK,
      shiftStartedAt,
      breakStartedAt: pausedAt,
    });
  }, [shiftStartedAt, workOrder?.id]);

  /**
   * Continue - per the doc: "Request the current location. Validate
   * distance again. Restart background tracking." Re-uses the same
   * distance check as Start.
   */
  const continueShift = useCallback(async () => {
    setPhase(SHIFT_PHASE.RESUMING);
    setErrorMessage('');

    const check = await checkLocationAndDistance();

    if (!check.ok) {
      // checkLocationAndDistance already set phase to OUT_OF_RANGE
      // with a message - the technician stays on Break until they
      // move back into range and can retry Continue.
      setPhase(SHIFT_PHASE.ON_BREAK);
      return;
    }

    const result = await continueTrackingSession({
      sessionId: sessionIdRef.current,
      latitude: check.position.latitude,
      longitude: check.position.longitude,
    });

    if (!result.success) {
      setPhase(SHIFT_PHASE.ON_BREAK);
      setErrorMessage(result.message);
      return;
    }

    setBreakStartedAt(null);
    setPhase(SHIFT_PHASE.ACTIVE);

    // Per the handover doc: "Restart background tracking" after a
    // successful Continue.
    await setActiveShiftContext({
      sessionId: sessionIdRef.current,
      workOrderId: workOrder?.id,
    });

    await setShiftSessionRecord({
      sessionId: sessionIdRef.current,
      workOrderId: workOrder?.id,
      phase: SHIFT_PHASE.ACTIVE,
      shiftStartedAt,
      breakStartedAt: null,
    });

    const backgroundPermission = await getBackgroundPermissionStatus();
    if (backgroundPermission.status === PERMISSION_STATUS.GRANTED) {
      await startBackgroundLocationUpdates();
    }
  }, [checkLocationAndDistance, shiftStartedAt, workOrder?.id]);

  /**
   * End Shift - per the doc: "Stop background tracking. Remove
   * active location watchers. Clear the active Work Order tracking
   * state. Send the final location if available."
   */
  const endShift = useCallback(async () => {
    setPhase(SHIFT_PHASE.STOPPING);
    setErrorMessage('');

    const finalPosition = await getCurrentPosition();

    const result = await stopTrackingSession({
      sessionId: sessionIdRef.current,
      latitude: finalPosition.success ? finalPosition.latitude : null,
      longitude: finalPosition.success ? finalPosition.longitude : null,
    });

    if (!result.success) {
      // Even if the backend call fails, we still let the technician
      // leave the shift locally rather than trap them on this screen -
      // the failure is surfaced so they know to report it.
      setErrorMessage(result.message);
    }

    sessionIdRef.current = null;
    setPhase(SHIFT_PHASE.ENDED);

    // Per the handover doc: "Stop background tracking. Remove
    // active location watchers. Clear the active Work Order
    // tracking state." This is the only point where the durable
    // session record is cleared too - a shift that's Active or On
    // Break should always be recoverable on remount; only actually
    // ending it should make it disappear.
    await stopBackgroundLocationUpdates();
    await clearActiveShiftContext();
    await clearShiftSessionRecord();
  }, []);

  /**
   * Mount-time rehydration. Runs once per Work Order. Checks
   * whether a shift is already in progress (Active or On Break) for
   * THIS Work Order before deciding what to do:
   *
   *   - Matching record found -> restore phase/session/timestamps,
   *     skip the automatic distance check entirely (we already know
   *     the shift is running).
   *   - No record, or it belongs to a different Work Order -> fall
   *     back to the original behavior: automatically run the first
   *     distance check so the technician isn't staring at a blank
   *     "idle" state needing an extra tap.
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const record = await getShiftSessionRecord();

      if (cancelled) return;

      const belongsToThisWorkOrder =
        record && workOrder?.id != null && String(record.workOrderId) === String(workOrder.id);

      if (belongsToThisWorkOrder) {
        sessionIdRef.current = record.sessionId;
        setShiftStartedAt(record.shiftStartedAt || null);
        setBreakStartedAt(record.breakStartedAt || null);
        setPhase(record.phase === SHIFT_PHASE.ON_BREAK ? SHIFT_PHASE.ON_BREAK : SHIFT_PHASE.ACTIVE);
        return;
      }

      if (hasWorkOrderLocation) {
        checkLocationAndDistance();
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workOrder?.id]);

  /**
   * Foreground interval ping — see FOREGROUND_PING_INTERVAL_MS above
   * for why this exists alongside the background task. Starts when
   * phase becomes ACTIVE, stops on Break/Stop/unmount. (On unmount,
   * only THIS foreground interval stops - the actual background
   * task, if permission was granted, keeps running independently;
   * see tasks/backgroundLocationTask.js.)
   */
  useEffect(() => {
    if (phase !== SHIFT_PHASE.ACTIVE) {
      return undefined;
    }

    const intervalId = setInterval(async () => {
      const position = await getCurrentPosition();

      if (!position.success) {
        console.warn('[useShiftTracking] Foreground ping: could not read GPS position.');
        return;
      }

      console.log(
        `[useShiftTracking] Foreground ping (every ${FOREGROUND_PING_INTERVAL_MS / 1000}s):`,
        { sessionId: sessionIdRef.current, latitude: position.latitude, longitude: position.longitude }
      );

      const result = await sendTrackingLocation({
        sessionId: sessionIdRef.current,
        latitude: position.latitude,
        longitude: position.longitude,
      });

      if (!result.success) {
        console.error('[useShiftTracking] Foreground ping failed to sync to backend:', result.message);
      }
    }, FOREGROUND_PING_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [phase]);

  /**
   * Resets the hook back to its initial state - used if the
   * technician navigates back to this screen for a different Work
   * Order, or wants to retry after ending a shift.
   */
  const reset = useCallback(() => {
    sessionIdRef.current = null;
    setPhase(SHIFT_PHASE.IDLE);
    setErrorMessage('');
    setDistanceMeters(null);
    setCurrentPosition(null);
    setBreakStartedAt(null);
    setShiftStartedAt(null);
  }, []);

  return {
    phase,
    errorMessage,
    distanceMeters,
    currentPosition,
    breakStartedAt,
    shiftStartedAt,
    hasWorkOrderLocation,
    radiusMeters: SHIFT_RADIUS_METERS,

    checkLocationAndDistance,
    startShift,
    startBreak,
    continueShift,
    endShift,
    reset,
  };
}