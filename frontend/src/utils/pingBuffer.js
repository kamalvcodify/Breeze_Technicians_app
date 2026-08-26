import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * utils/pingBuffer.js
 * ----------------------------------------------------------------
 * Local, AsyncStorage-backed buffer for Interval Ping location
 * points - part of the efficiency redesign confirmed with the
 * client: rather than one API call per single GPS ping, pings
 * accumulate here and get uploaded together as ONE bulk insert to
 * Zoho CRM's Location Logs module, flushed every 15 minutes (or
 * immediately before any status change - Break/Continue/Stop).
 *
 * AsyncStorage-backed (not React state) for the same reason
 * shiftContextStore.js is: this needs to be readable/writable from
 * BOTH useShiftTracking.js (a React hook, foreground pings) AND
 * tasks/backgroundLocationTask.js (a module-scope task with no
 * React context at all, background pings) - both need to push into
 * the SAME buffer regardless of which one is currently firing.
 *
 * Each buffered ping keeps its OWN original deviceTimestamp - this
 * is preserved all the way through to the eventual Zoho write,
 * never re-stamped with the sync/flush time, per the client's
 * explicit requirement.
 * ----------------------------------------------------------------
 */
const BUFFER_KEY = 'breeze:locationPingBuffer';

async function readBuffer() {
  try {
    const raw = await AsyncStorage.getItem(BUFFER_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('[pingBuffer] Failed to read buffer:', error?.message || error);
    return [];
  }
}

async function writeBuffer(buffer) {
  try {
    await AsyncStorage.setItem(BUFFER_KEY, JSON.stringify(buffer));
  } catch (error) {
    console.warn('[pingBuffer] Failed to write buffer:', error?.message || error);
  }
}

/**
 * Adds one ping to the buffer. Returns the new buffer length, so
 * callers can optionally flush early once a size threshold is hit
 * (not currently used - v1 is purely time-based, every 15 minutes).
 */
export async function addPing({ latitude, longitude, deviceTimestamp }) {
  const buffer = await readBuffer();

  buffer.push({
    latitude,
    longitude,
    deviceTimestamp: deviceTimestamp || new Date().toISOString(),
  });

  await writeBuffer(buffer);
  return buffer.length;
}

/**
 * Returns every currently buffered ping without clearing it -
 * callers should only clear (via clearBuffer) after a confirmed
 * successful upload.
 */
export async function getBufferedPings() {
  return readBuffer();
}

export async function clearBuffer() {
  await writeBuffer([]);
}

export async function getBufferedPingCount() {
  const buffer = await readBuffer();
  return buffer.length;
}