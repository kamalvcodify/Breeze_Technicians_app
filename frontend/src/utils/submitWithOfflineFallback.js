import { enqueue } from './offlineQueue';

/**
 * utils/submitWithOfflineFallback.js
 * ----------------------------------------------------------------
 * Every form screen's handleSubmit() calls this INSTEAD OF calling
 * its API function directly. Behavior:
 *
 *   - Real network failure (no connectivity, request never reached
 *     the server, timeout) -> queue it locally, return
 *     { success: true, offline: true }. The screen shows an
 *     "offline" message instead of its normal success popup.
 *
 *   - A real error FROM the server (validation, Zoho rejected a
 *     field, auth expired, etc) -> re-thrown as-is. These are NOT
 *     network problems - queuing them would just mean re-attempting
 *     the same failing request forever, so the screen's existing
 *     error-handling path still runs normally.
 *
 * isNetworkError() below is intentionally conservative: axios sets
 * `error.request` with NO `error.response` specifically when the
 * request never got a response at all (DNS failure, no signal,
 * connection refused, timeout) - that is the actual signature of
 * "we're offline", as opposed to a request that reached the server
 * and got a 400/401/500 back.
 * ----------------------------------------------------------------
 */
function isNetworkError(error) {
  return !!error?.request && !error?.response;
}

export async function submitWithOfflineFallback({ formType, payload, submitFn }) {
  try {
    const response = await submitFn(payload);
    return { success: true, offline: false, response };
  } catch (error) {
    if (isNetworkError(error)) {
      await enqueue({ formType, payload });
      return { success: true, offline: true };
    }

    throw error;
  }
}