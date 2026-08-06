const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 8;

export function isValidEmail(value) {
  return EMAIL_PATTERN.test(value || '');
}

export function normalizeEmail(value) {
  return (value || '').trim().toLowerCase();
}

/**
 * Turns a caught axios/network error into a message a technician can
 * actually act on, instead of always showing "incorrect email or
 * password" — which is misleading when the real problem is that the
 * phone can't reach the backend at all (wrong Wi-Fi network, backend
 * not running, wrong API_BASE_URL in .env, etc). This is the single
 * biggest cause of "I can't log in on my phone" reports that are
 * actually connectivity issues, not bad credentials.
 */
export function getAuthErrorMessage(error, fallback) {
  if (error?.response) {
    // Server responded — this is a real auth/validation error.
    return error.response.data?.detail || fallback;
  }

  if (error?.request) {
    // Request went out but no response came back — almost always a
    // network/reachability problem on mobile.
    return 'Could not reach the server. Check that your phone is on the same network as the backend, and that the API address in the app is correct.';
  }

  return error?.message || fallback;
}
