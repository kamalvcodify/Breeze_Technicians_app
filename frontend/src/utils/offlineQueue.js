import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * utils/offlineQueue.js
 * ----------------------------------------------------------------
 * Generic, form-agnostic offline queue backed by AsyncStorage.
 *
 * ADDED: a flush lock (acquireFlushLock/releaseFlushLock), backed
 * by AsyncStorage itself so it works even ACROSS separate mounted
 * instances of useOfflineSync - not just within one component's
 * lifetime. This is the real fix for "multiple records created
 * from one offline submission": if OfflineSyncBanner/useOfflineSync
 * ever ends up mounted more than once at the same time (which is
 * exactly what was happening when it lived inside TechnicianLayout,
 * re-mounted fresh on every screen navigation), only ONE of those
 * instances can hold the lock at a time - every other instance's
 * flush attempt is a no-op until the lock is released.
 *
 * The lock has a 30-second expiry as a safety net, so a crash or
 * force-close mid-flush can never leave the queue permanently
 * stuck (a stale lock older than 30s is treated as not held).
 * ----------------------------------------------------------------
 */
const STORAGE_KEY = 'offline_submission_queue';
const FLUSH_LOCK_KEY = 'offline_submission_queue_flush_lock';
const FLUSH_LOCK_EXPIRY_MS = 30 * 1000;

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function getQueue() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('[offlineQueue] Failed to read queue:', error?.message || error);
    return [];
  }
}

async function saveQueue(queue) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.warn('[offlineQueue] Failed to save queue:', error?.message || error);
  }
}

export async function enqueue({ formType, payload }) {
  const queue = await getQueue();

  const item = {
    id: generateId(),
    formType,
    payload,
    createdAt: new Date().toISOString(),
  };

  queue.push(item);
  await saveQueue(queue);

  return item;
}

export async function removeFromQueue(id) {
  const queue = await getQueue();
  const updated = queue.filter((item) => item.id !== id);
  await saveQueue(updated);
  return updated;
}

export async function clearQueue() {
  await saveQueue([]);
}

export async function getQueueCount() {
  const queue = await getQueue();
  return queue.length;
}

/**
 * Attempts to acquire the cross-instance flush lock. Returns true
 * if this caller now holds it (safe to proceed with flushing),
 * false if someone else already holds a still-valid lock (caller
 * should skip this flush attempt entirely).
 */
export async function acquireFlushLock() {
  try {
    const raw = await AsyncStorage.getItem(FLUSH_LOCK_KEY);

    if (raw) {
      const lockedAt = Number(raw);
      const isStillValid = Number.isFinite(lockedAt) && Date.now() - lockedAt < FLUSH_LOCK_EXPIRY_MS;

      if (isStillValid) {
        return false;
      }
    }

    await AsyncStorage.setItem(FLUSH_LOCK_KEY, String(Date.now()));
    return true;
  } catch (error) {
    console.warn('[offlineQueue] Failed to acquire flush lock:', error?.message || error);
    // If the lock mechanism itself fails, fail safe by NOT flushing
    // rather than risking an unlocked duplicate-submission race.
    return false;
  }
}

export async function releaseFlushLock() {
  try {
    await AsyncStorage.removeItem(FLUSH_LOCK_KEY);
  } catch (error) {
    console.warn('[offlineQueue] Failed to release flush lock:', error?.message || error);
  }
}