/**
 * tasks/backgroundLocationTask.js
 * ----------------------------------------------------------------
 * Defines the background location task using expo-task-manager.
 *
 * CRITICAL: TaskManager.defineTask() MUST be called at module scope
 * (top-level, outside any React component/hook) and this file must
 * be imported exactly once, as early as possible - see App.js. The
 * OS can wake the app and invoke this task even when no screen is
 * mounted and no component has rendered, so this task cannot depend
 * on React state, navigation, or anything else that only exists
 * while a screen is open.
 *
 * This only takes effect in a development/production build (not
 * Expo Go) - see the handover doc, Section 19, "Important: Expo Go
 * should not be used for final background tracking testing."
 * ----------------------------------------------------------------
 */
import * as TaskManager from 'expo-task-manager';

import { sendTrackingLocation } from '../api/trackingApi';
import { getActiveShiftContext } from '../services/shiftContextStore';

export const BACKGROUND_LOCATION_TASK = 'breeze-background-location-task';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[BackgroundLocationTask] Task error:', error.message);
    return;
  }

  const { locations } = data || {};
  const latestLocation = Array.isArray(locations) ? locations[locations.length - 1] : null;

  if (!latestLocation) {
    return;
  }

  const { latitude, longitude, accuracy } = latestLocation.coords;
  const recordedAt = new Date(latestLocation.timestamp).toISOString();

  // TESTING VISIBILITY: confirms the task actually fired while the
  // screen was off / app backgrounded. Safe to remove once
  // background tracking is confirmed reliable.
  console.log(
    '[BackgroundLocationTask]',
    JSON.stringify(
      { latitude, longitude, accuracy, recordedAt },
      null,
      2
    )
  );

  // The task runs independently of any mounted screen/hook, so it
  // reads which shift is currently active from a small persisted
  // store (see shiftContextStore.js) rather than from React state.
  const activeShift = await getActiveShiftContext();

  if (!activeShift?.sessionId) {
    // No shift is active - nothing to report. This can happen
    // briefly around Start/Stop, or if the OS fires a stray update.
    return;
  }

  const result = await sendTrackingLocation({
    sessionId: activeShift.sessionId,
    latitude,
    longitude,
    accuracy,
  });

  if (!result.success) {
    console.error('[BackgroundLocationTask] Failed to sync location to backend:', result.message);
  }
});