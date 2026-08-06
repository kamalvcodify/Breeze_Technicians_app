/**
 * services/shiftContextStore.js
 * ----------------------------------------------------------------
 * Two SEPARATE pieces of persisted state live here, on purpose:
 *
 * 1. ACTIVE SHIFT CONTEXT (setActiveShiftContext/getActiveShiftContext/
 *    clearActiveShiftContext) - tells the background task
 *    (tasks/backgroundLocationTask.js) whether it should be posting
 *    location points RIGHT NOW. This is intentionally cleared during
 *    a Break, per the handover doc: "Do not record coordinates"
 *    while paused. The background task reads only this.
 *
 * 2. SHIFT SESSION RECORD (setShiftSessionRecord/getShiftSessionRecord/
 *    clearShiftSessionRecord) - a separate, longer-lived snapshot of
 *    "is there a shift in progress for this Work Order, and is it
 *    Active or On Break". This is NOT cleared on Break - only on End
 *    Shift. useShiftTracking.js reads this on mount to correctly
 *    restore the screen to "Shift active" or "On break" instead of
 *    resetting to "Ready to check in" every time the technician
 *    navigates away and back (or the screen remounts for any other
 *    reason). Before this existed, the UI had no way to tell "paused"
 *    apart from "no shift at all", because both looked identical once
 *    the active shift context above was cleared.
 * ----------------------------------------------------------------
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_CONTEXT_KEY = 'breeze:activeShiftContext';
const SESSION_RECORD_KEY = 'breeze:shiftSessionRecord';

/* ------------------------------------------------------------------
 * 1. Active shift context - read by the background task only.
 * ------------------------------------------------------------------ */

/**
 * Called when a shift starts (or resumes after a break) so the
 * background task knows which session to report location points
 * against.
 */
export async function setActiveShiftContext({ sessionId, workOrderId }) {
  try {
    await AsyncStorage.setItem(
      ACTIVE_CONTEXT_KEY,
      JSON.stringify({ sessionId, workOrderId })
    );
  } catch (error) {
    console.error('[shiftContextStore] Failed to save active shift context:', error?.message);
  }
}

/**
 * Reads the currently active shift context, or null if none is set.
 */
export async function getActiveShiftContext() {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_CONTEXT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('[shiftContextStore] Failed to read active shift context:', error?.message);
    return null;
  }
}

/**
 * Clears the active shift context - called on Break (per the
 * handover doc: no coordinates should be recorded during a break)
 * and on Stop/End Shift.
 */
export async function clearActiveShiftContext() {
  try {
    await AsyncStorage.removeItem(ACTIVE_CONTEXT_KEY);
  } catch (error) {
    console.error('[shiftContextStore] Failed to clear active shift context:', error?.message);
  }
}

/* ------------------------------------------------------------------
 * 2. Shift session record - read by useShiftTracking.js on mount to
 *    rehydrate the UI. Survives Break; only cleared on End Shift.
 * ------------------------------------------------------------------ */

/**
 * Saves/updates the durable session snapshot. Called on Start
 * (phase: 'active'), Break (phase: 'on_break'), and Continue (phase:
 * 'active' again) - each call fully replaces the record with the
 * current, correct snapshot.
 */
export async function setShiftSessionRecord({
  sessionId,
  workOrderId,
  phase,
  shiftStartedAt,
  breakStartedAt,
}) {
  try {
    await AsyncStorage.setItem(
      SESSION_RECORD_KEY,
      JSON.stringify({ sessionId, workOrderId, phase, shiftStartedAt, breakStartedAt })
    );
  } catch (error) {
    console.error('[shiftContextStore] Failed to save shift session record:', error?.message);
  }
}

/**
 * Reads the durable session snapshot, or null if no shift is
 * currently in progress (Active or On Break) for any Work Order.
 */
export async function getShiftSessionRecord() {
  try {
    const raw = await AsyncStorage.getItem(SESSION_RECORD_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('[shiftContextStore] Failed to read shift session record:', error?.message);
    return null;
  }
}

/**
 * Clears the durable session snapshot - called ONLY on End Shift.
 * Deliberately NOT called on Break, unlike clearActiveShiftContext
 * above.
 */
export async function clearShiftSessionRecord() {
  try {
    await AsyncStorage.removeItem(SESSION_RECORD_KEY);
  } catch (error) {
    console.error('[shiftContextStore] Failed to clear shift session record:', error?.message);
  }
}