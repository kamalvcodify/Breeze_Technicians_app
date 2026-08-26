import apiClient from './client';

/**
 * Fetches Work Orders assigned to the currently logged-in technician.
 *
 * The backend will:
 * 1. Read the technician email from the JWT.
 * 2. Fetch My_Assigned_Work_Orders_Report from Zoho Creator.
 * 3. Filter Email, Assignee2_Email and Assignee3_Email.
 * 4. Return only the technician's assigned Work Orders.
 */
export const getMyAssignedWorkOrders = async () => {
  try {
    const response = await apiClient.get('/tracking/work-orders');

    return {
      success: true,
      data: Array.isArray(response.data?.data)
        ? response.data.data
        : [],
      message:
        response.data?.message ||
        'Assigned Work Orders loaded successfully.',
    };
  } catch (error) {
    console.error(
      '[Tracking API] Failed to load assigned Work Orders:',
      error?.response?.data || error?.message
    );

    return {
      success: false,
      data: [],
      message:
        error?.response?.data?.message ||
        'Unable to load your assigned Work Orders. Please try again.',
    };
  }
};

/**
 * Returns one assigned Work Order by Creator record ID.
 *
 * This currently uses the already-loaded Work Order array.
 * It avoids making an unnecessary second API request.
 */
export const findAssignedWorkOrderById = (
  workOrders,
  workOrderId
) => {
  if (!Array.isArray(workOrders) || !workOrderId) {
    return null;
  }

  return (
    workOrders.find(
      (workOrder) =>
        String(workOrder.id) === String(workOrderId)
    ) || null
  );
};

/**
 * Checks whether a Work Order contains usable coordinates.
 */
export const hasValidWorkOrderLocation = (workOrder) => {
  if (!workOrder) {
    return false;
  }

  const latitude = Number(workOrder.latitude);
  const longitude = Number(workOrder.longitude);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

/**
 * Returns the text used when searching assigned Work Orders.
 */
export const getWorkOrderSearchText = (workOrder) => {
  if (!workOrder) {
    return '';
  }

  return [
    workOrder.workOrder,
    workOrder.residentName,
    workOrder.issueType,
    workOrder.address,
    workOrder.jobDescription,
    workOrder.description,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

/* ------------------------------------------------------------------
 * Tracking session endpoints (Technician Shift screen)
 * ------------------------------------------------------------------
 * NOTE: Per the handover doc (Section 22, "Future Backend Tracking
 * APIs"), these five endpoints are listed under "Pending" - the
 * backend does not implement them yet. These functions are written
 * now so the Technician Shift screen's frontend logic (state
 * machine, UI, distance validation) can be built and tested against
 * a mock/stub today, and will work unmodified the moment the real
 * backend routes land, since the request/response shape follows the
 * doc's Section 9/10/23 field naming exactly.
 *
 * Each function follows the same { success, data/message } shape as
 * the rest of this file so the calling hook doesn't need special
 * casing for these vs. getMyAssignedWorkOrders above.
 * ------------------------------------------------------------------ */

function buildTrackingErrorResult(error, fallbackMessage) {
  console.error('[Tracking API]', fallbackMessage, error?.response?.data || error?.message);

  return {
    success: false,
    data: null,
    message: error?.response?.data?.message || fallbackMessage,
  };
}

/**
 * Starts a tracking session for the given Work Order.
 * Backend is expected to validate the technician's assignment and
 * distance server-side as well - the frontend check is a first line
 * of defense / instant feedback, not the source of truth.
 *
 * NEW: technicianName is now sent explicitly - the JWT only ever
 * carries email/isAdmin, never the technician's real name, so this
 * is pulled from useAuth() on the frontend and sent with the
 * request (same pattern already used by ShiftToggleButton.js for
 * the header bar's Login/Logout shift toggle).
 */
export const startTrackingSession = async ({
  workOrderId,
  workOrderReference,
  technicianName,
  latitude,
  longitude,
}) => {
  try {
    const response = await apiClient.post('/tracking/start', {
      workOrderId,
      workOrderReference,
      technicianName,
      latitude,
      longitude,
    });

    return {
      success: true,
      data: response.data?.data || null,
      message: response.data?.message || 'Shift started.',
    };
  } catch (error) {
    return buildTrackingErrorResult(error, 'Could not start the shift. Please try again.');
  }
};

/**
 * Sends a single location point - kept for backward compatibility,
 * but Interval Pings should now go through sendTrackingLocationBatch
 * below instead (buffered, flushed periodically as one bulk call).
 */
export const sendTrackingLocation = async ({ sessionId, latitude, longitude, accuracy }) => {
  try {
    const response = await apiClient.post('/tracking/location', {
      sessionId,
      latitude,
      longitude,
      accuracy,
    });

    return {
      success: true,
      data: response.data?.data || null,
      message: response.data?.message || '',
    };
  } catch (error) {
    return buildTrackingErrorResult(error, 'Could not sync your location.');
  }
};

/**
 * NEW - uploads a BATCH of buffered Interval Pings in one call.
 * See utils/pingBuffer.js for how pings accumulate locally before
 * being flushed here (every 15 minutes, or immediately before any
 * status change).
 */
export const sendTrackingLocationBatch = async ({ sessionId, pings }) => {
  try {
    const response = await apiClient.post('/tracking/location-batch', {
      sessionId,
      pings,
    });

    return {
      success: true,
      data: response.data?.data || null,
      message: response.data?.message || '',
    };
  } catch (error) {
    return buildTrackingErrorResult(error, 'Could not sync your buffered location points.');
  }
};

/**
 * Puts the active session on Break. Per the handover doc, no
 * coordinates should be recorded during a break.
 */
export const startTrackingBreak = async ({ sessionId }) => {
  try {
    const response = await apiClient.post('/tracking/break', { sessionId });

    return {
      success: true,
      data: response.data?.data || null,
      message: response.data?.message || 'Break started.',
    };
  } catch (error) {
    return buildTrackingErrorResult(error, 'Could not start the break. Please try again.');
  }
};

/**
 * Resumes an active session after a Break, following a fresh
 * distance validation on the frontend before calling this.
 */
export const continueTrackingSession = async ({ sessionId, latitude, longitude }) => {
  try {
    const response = await apiClient.post('/tracking/continue', {
      sessionId,
      latitude,
      longitude,
    });

    return {
      success: true,
      data: response.data?.data || null,
      message: response.data?.message || 'Shift resumed.',
    };
  } catch (error) {
    return buildTrackingErrorResult(error, 'Could not resume the shift. Please try again.');
  }
};

/**
 * Ends the session (End Shift).
 */
export const stopTrackingSession = async ({ sessionId, latitude, longitude }) => {
  try {
    const response = await apiClient.post('/tracking/stop', {
      sessionId,
      latitude,
      longitude,
    });

    return {
      success: true,
      data: response.data?.data || null,
      message: response.data?.message || 'Shift ended.',
    };
  } catch (error) {
    return buildTrackingErrorResult(error, 'Could not end the shift. Please try again.');
  }
};

/**
 * Reads the current session status - useful for restoring state if
 * the app was closed/reopened mid-shift.
 */
export const getTrackingSessionStatus = async ({ workOrderId }) => {
  try {
    const response = await apiClient.get('/tracking/session', {
      params: { workOrderId },
    });

    return {
      success: true,
      data: response.data?.data || null,
      message: response.data?.message || '',
    };
  } catch (error) {
    return buildTrackingErrorResult(error, 'Could not load the current shift status.');
  }
};