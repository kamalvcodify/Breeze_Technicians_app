/**
 * services/locationService.js
 * ----------------------------------------------------------------
 * Thin wrapper around expo-location. Every call the app makes to
 * the device's GPS goes through here — nothing else in the app
 * should `import * as Location from 'expo-location'` directly.
 *
 * Why this matters for later: if this project ever needs to swap
 * out expo-location (a different location library, a native
 * module, etc.), only this one file changes. Screens and hooks
 * only ever see the plain return shapes documented below, never
 * the underlying library's own types.
 *
 * Foreground functions (permission checks, single GPS reads) work
 * in Expo Go. The background functions further down require a
 * development/native build - see the handover doc, Section 19.
 * ----------------------------------------------------------------
 */
import * as Location from 'expo-location';
import { BACKGROUND_LOCATION_TASK } from '../tasks/backgroundLocationTask';

// Per handover doc Section 20/22 and today's testing requirement:
// one location point per minute.
const BACKGROUND_UPDATE_INTERVAL_MS = 60 * 1000;
const BACKGROUND_UPDATE_DISTANCE_METERS = 0; // time-based, not distance-based

export const PERMISSION_STATUS = {
  GRANTED: 'granted',
  DENIED: 'denied',
  UNDETERMINED: 'undetermined',
};

/**
 * Requests foreground location permission.
 *
 * Returns: { status: 'granted' | 'denied' | 'undetermined', canAskAgain: boolean }
 */
export async function requestForegroundPermission() {
  try {
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    return { status, canAskAgain };
  } catch (error) {
    console.error('[locationService] Permission request failed:', error?.message || error);
    return { status: PERMISSION_STATUS.DENIED, canAskAgain: false };
  }
}

/**
 * Reads the current foreground permission status without prompting.
 */
export async function getForegroundPermissionStatus() {
  try {
    const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
    return { status, canAskAgain };
  } catch (error) {
    console.error('[locationService] Permission status check failed:', error?.message || error);
    return { status: PERMISSION_STATUS.UNDETERMINED, canAskAgain: true };
  }
}

/**
 * Gets a single current GPS reading.
 *
 * Returns on success:
 *   { success: true, latitude, longitude, accuracy, timestamp }
 * Returns on failure:
 *   { success: false, message }
 */
export async function getCurrentPosition() {
  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      success: true,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };
  } catch (error) {
    console.error('[locationService] getCurrentPosition failed:', error?.message || error);

    return {
      success: false,
      message:
        'Could not read your current location. Make sure location services are turned on and try again.',
    };
  }
}

/**
 * Checks whether device location services (GPS) are enabled at the
 * OS level - distinct from whether the app has permission.
 */
export async function isLocationServicesEnabled() {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch (error) {
    return false;
  }
}

/* ------------------------------------------------------------------
 * Background location (Phase 4)
 * ------------------------------------------------------------------
 * These functions require a development/production build - they
 * will fail silently or throw in Expo Go, since Expo Go cannot
 * register the native background task. See handover doc Section 19.
 * ------------------------------------------------------------------ */

/**
 * Requests background location permission. On both Android and iOS
 * this must be requested AFTER foreground permission is already
 * granted - requesting it cold, without foreground permission
 * first, will fail on most OS versions.
 */
export async function requestBackgroundPermission() {
  try {
    const { status, canAskAgain } = await Location.requestBackgroundPermissionsAsync();
    return { status, canAskAgain };
  } catch (error) {
    console.error(
      '[locationService] Background permission request failed:',
      error?.message || error
    );
    return { status: PERMISSION_STATUS.DENIED, canAskAgain: false };
  }
}

/**
 * Reads the current background permission status without prompting.
 */
export async function getBackgroundPermissionStatus() {
  try {
    const { status, canAskAgain } = await Location.getBackgroundPermissionsAsync();
    return { status, canAskAgain };
  } catch (error) {
    console.error(
      '[locationService] Background permission status check failed:',
      error?.message || error
    );
    return { status: PERMISSION_STATUS.UNDETERMINED, canAskAgain: true };
  }
}

/**
 * Starts continuous background location updates at a fixed
 * 1-minute interval (see BACKGROUND_UPDATE_INTERVAL_MS above). Once
 * started, expo-task-manager keeps invoking
 * tasks/backgroundLocationTask.js even if the app is backgrounded
 * or the screen is off, until stopBackgroundLocationUpdates() is
 * called.
 *
 * On Android this shows a persistent notification while running -
 * this is a hard OS requirement for background location, not
 * something this app can hide (see handover doc Section 19).
 */
export async function startBackgroundLocationUpdates() {
  try {
    const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK
    );

    if (alreadyRunning) {
      return { success: true };
    }

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: BACKGROUND_UPDATE_INTERVAL_MS,
      distanceInterval: BACKGROUND_UPDATE_DISTANCE_METERS,
      showsBackgroundLocationIndicator: true, // iOS: shows the blue status-bar indicator
      foregroundService: {
        notificationTitle: 'Breeze shift tracking is active',
        notificationBody: 'Your location is being tracked while your shift is active.',
        notificationColor: '#0876C9',
      },
    });

    return { success: true };
  } catch (error) {
    console.error(
      '[locationService] Failed to start background location updates:',
      error?.message || error
    );
    return {
      success: false,
      message: 'Could not start background location tracking. Please try again.',
    };
  }
}

/**
 * Stops background location updates. Called on Break (per the
 * handover doc: no coordinates recorded during a break) and on
 * Stop/End Shift.
 */
export async function stopBackgroundLocationUpdates() {
  try {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);

    if (isRunning) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }

    return { success: true };
  } catch (error) {
    console.error(
      '[locationService] Failed to stop background location updates:',
      error?.message || error
    );
    return { success: false };
  }
}