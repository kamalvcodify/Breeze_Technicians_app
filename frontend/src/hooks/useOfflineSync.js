import { useCallback, useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

import {
  getQueue,
  removeFromQueue,
  getQueueCount,
  acquireFlushLock,
  releaseFlushLock,
} from '../utils/offlineQueue';
import { getSubmitFunctionForFormType } from '../api/offlineFormRegistry';

/**
 * hooks/useOfflineSync.js
 * ----------------------------------------------------------------
 * FIX: flushQueue() now actually calls acquireFlushLock()/
 * releaseFlushLock() from offlineQueue.js. Previously this only
 * checked isFlushingRef (a plain local variable, useRef) - that
 * only prevents ONE component instance from flushing twice
 * concurrently, but does NOTHING to stop a completely SEPARATE
 * mounted instance (e.g. if OfflineSyncBanner ever ends up mounted
 * in more than one place at once, as was happening via
 * TechnicianLayout.js) from flushing the exact same queued item at
 * the same time. The AsyncStorage-backed lock is what actually
 * protects across instances - it was built already but never
 * wired into this function's actual flush logic until now.
 *
 * Requires @react-native-community/netinfo - NOT currently
 * installed. Run `npx expo install @react-native-community/netinfo`
 * and rebuild (native module, same category as expo-camera/
 * expo-ignore-battery-optimizations - a Metro reload alone will not
 * pick this up).
 *
 * Mounted ONCE, globally (see navigation/TechnicianNavigator.js,
 * as a sibling of Stack.Navigator) - NOT inside
 * components/TechnicianLayout.js, which wraps every screen and
 * would re-mount a fresh instance on every navigation.
 *
 * Behavior:
 *   - Polls the queue every OFFLINE_CHECK_INTERVAL_MS (10s default -
 *     easy to change to minutes/hours later, per instructions).
 *   - Also flushes immediately whenever NetInfo reports the device
 *     just came back online (not just on the poll timer), so
 *     reconnecting doesn't wait up to 10s to notice.
 *   - On a successful flush, each item is removed from the queue
 *     individually (not cleared all-at-once) - so if item 3 of 5
 *     fails, items 1-2 already synced stay gone and only 3-5 remain
 *     queued for the next attempt.
 *   - Exposes `pendingCount` and `justSynced` (briefly true right
 *     after a successful flush) - OfflineSyncBanner.js uses these
 *     two values ONLY to decide what to show/when to hide.
 * ----------------------------------------------------------------
 */
export const OFFLINE_CHECK_INTERVAL_MS = 10 * 1000; // 10 seconds - see note above
export const OFFLINE_BANNER_VISIBLE_MS = 3 * 1000; // 3 seconds - see note above

export default function useOfflineSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [justSynced, setJustSynced] = useState(false);

  const isFlushingRef = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    const count = await getQueueCount();
    setPendingCount(count);
  }, []);

  const flushQueue = useCallback(async () => {
    // Fast, same-instance guard first (cheap, avoids even trying
    // the cross-instance lock if this instance is already busy).
    if (isFlushingRef.current) {
      return;
    }

    const gotLock = await acquireFlushLock();
    if (!gotLock) {
      // Another instance (this one or a different mounted copy) is
      // already flushing right now - skip entirely rather than
      // risk a duplicate submission.
      return;
    }

    isFlushingRef.current = true;

    try {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        return;
      }

      const queue = await getQueue();
      if (queue.length === 0) {
        return;
      }

      let syncedAny = false;

      for (const item of queue) {
        const submitFn = getSubmitFunctionForFormType(item.formType);

        if (!submitFn) {
          console.warn(
            `[useOfflineSync] No submit function registered for formType "${item.formType}" - skipping.`
          );
          continue;
        }

        try {
          await submitFn(item.payload);
          await removeFromQueue(item.id);
          syncedAny = true;
        } catch (error) {
          // Still offline, or the server rejected it - leave it
          // queued and try again on the next flush.
          console.warn(
            `[useOfflineSync] Failed to sync queued ${item.formType} submission:`,
            error?.message || error
          );
        }
      }

      await refreshPendingCount();

      if (syncedAny) {
        const remaining = await getQueueCount();
        if (remaining === 0) {
          setJustSynced(true);
          setTimeout(() => setJustSynced(false), OFFLINE_BANNER_VISIBLE_MS);
        }
      }
    } finally {
      isFlushingRef.current = false;
      await releaseFlushLock();
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();

    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        flushQueue();
      }
    });

    const intervalId = setInterval(() => {
      flushQueue();
    }, OFFLINE_CHECK_INTERVAL_MS);

    return () => {
      unsubscribeNetInfo();
      clearInterval(intervalId);
    };
  }, [flushQueue, refreshPendingCount]);

  return {
    pendingCount,
    justSynced,
    refreshPendingCount,
  };
}