const zohoTaskTrackingService = require("./zohoTaskTrackingService");

const config = require("../config/env");
const sessionStore = require("./trackingSessionStore");
const assignedWorkOrderStore = require("./assignedWorkOrderStore");

/**
 * Converts any value into trimmed text.
 */
function cleanText(value) {
  return String(value || "").trim();
}

/**
 * Normalises email addresses before comparison.
 */
function normalizeEmail(value) {
  return cleanText(value).toLowerCase();
}

/**
 * Checks whether latitude and longitude are valid.
 */
function hasValidCoordinates(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Loads and returns Work Orders assigned to the currently logged-in
 * technician.
 * ----------------------------------------------------------------
 * REPLACED - previously read from a Zoho Creator report fed by
 * Desk/AppFolio's own sync (fetchReportPage/fetchAllAssignedWork
 * Orders/CREATOR_FIELDS/normalizeWorkOrderRecord/
 * isAssignedToTechnician/buildAssignedTechnicians - all removed,
 * ~330 lines of now-dead Creator machinery). Per instructions
 * ("rip it out, pull it from AppFolio directly"), this now reads
 * from assignedWorkOrderStore.js instead - the local, already-
 * resolved cache that services/appFolioSyncJob.js keeps updated in
 * the background every few minutes (see jobs/appFolioSyncJob.js).
 * This function is now just a filter + shape-adapter, no live
 * AppFolio call happens here at all - "My Assigned Work Orders"
 * stays fast regardless of AppFolio's own response time.
 *
 * Shape adapter notes: AppFolio's resolved work order
 * (appFolioService.js's resolveWorkOrder()) doesn't carry a
 * distinct "resident name" or "issue type" the way the old Creator
 * report did - AppFolio doesn't expose those as separate fields, so
 * they're left as empty strings rather than invented. unitName
 * (new, not in the old Creator shape) is appended onto the address
 * string for a complete, useful display value.
 */
async function getAssignedWorkOrdersForTechnician(technicianEmail) {
  const normalizedTechnicianEmail = normalizeEmail(technicianEmail);

  if (!normalizedTechnicianEmail) {
    const error = new Error("Technician email is required.");

    error.statusCode = 400;
    throw error;
  }

  const resolvedWorkOrders = assignedWorkOrderStore.getWorkOrdersForTechnician(
    normalizedTechnicianEmail,
  );

  // FIX: "My Assigned Work Orders" should only show INCOMPLETE work
  // - anything in config.appFolio.completedStatuses (Work Done,
  // Ready to Bill, Completed, Completed No Need to Bill, Canceled)
  // drops off this list automatically once the next sync picks up
  // that status change - no separate "is this deleted" handling
  // needed here, since a completed/cancelled work order is filtered
  // the same way whether it's freshly updated or has been sitting
  // that way for a while.
  const completedStatuses = config.appFolio.completedStatuses.map((status) =>
    status.toLowerCase(),
  );

  const incompleteWorkOrders = resolvedWorkOrders.filter(
    (workOrder) => !completedStatuses.includes(cleanText(workOrder.status).toLowerCase()),
  );

  // NEW - sorted by lastUpdatedAt, most recent first. Per
  // instructions ("recently updated data at the top of the list"),
  // matching the same sort applied to Admin's AppFolio Work Orders
  // report.
  const sortedWorkOrders = [...incompleteWorkOrders].sort((a, b) => {
    const aTime = new Date(a.lastUpdatedAt || 0).getTime();
    const bTime = new Date(b.lastUpdatedAt || 0).getTime();
    return bTime - aTime;
  });

  return sortedWorkOrders.map((workOrder) => {
    const locationIsValid = hasValidCoordinates(
      workOrder.latitude,
      workOrder.longitude,
    );

    const addressWithUnit = workOrder.unitName
      ? `${workOrder.address}${workOrder.address ? " - " : ""}${workOrder.unitName}`
      : workOrder.address;

    return {
      id: cleanText(workOrder.id),
      workOrder: cleanText(workOrder.workOrder),
      residentName: "",
      issueType: "",
      issueDetails: cleanText(workOrder.description),
      jobDescription: cleanText(workOrder.jobDescription),
      description: cleanText(workOrder.description),
      address: cleanText(addressWithUnit),
      latitude: locationIsValid ? workOrder.latitude : null,
      longitude: locationIsValid ? workOrder.longitude : null,
      hasValidLocation: locationIsValid,
      // FIX: status was already being resolved and stored, just
      // never surfaced in this adapted shape - added per
      // instructions.
      status: cleanText(workOrder.status),
      priority: cleanText(workOrder.priority),
      // NEW - per instructions ("display all possible info the work
      // order has"), added alongside what was already returned.
      createdAt: workOrder.createdAt || null,
      lastUpdatedAt: workOrder.lastUpdatedAt || null,
      link: cleanText(workOrder.link),
      assignedTechnicians: (workOrder.assignedTechnicians || []).map(
        (technician, index) => ({
          name: cleanText(technician.name),
          email: normalizeEmail(technician.email),
          assignmentLevel: index + 1,
        }),
      ),
    };
  });
}

/* ------------------------------------------------------------------
 * Tracking Session functions (Technician Shift screen)
 * ------------------------------------------------------------------
 * These implement Sections 17-22 of the handover doc: Start, a
 * single Location update, Break, Continue and Stop for a technician
 * shift, plus a Session status read.
 *
 * IMPORTANT: Per instruction, these functions build the exact Zoho
 * Creator payload for each event (matching the placeholder field
 * names in config.zoho.tracking - see config/env.js) and log it to
 * the backend console, but do NOT actually call creatorRequest() to
 * write to Zoho yet. The real call is written and left commented
 * out immediately below each payload, ready to enable once the
 * "Technician Shift Sessions" / "Technician Location Logs" Creator
 * forms exist and the field names in .env are updated to match.
 *
 * Session state itself (so Start -> Break -> Continue -> Stop works
 * as a connected flow right now, without Zoho) is kept in the local
 * JSON file via trackingSessionStore.js.
 * ------------------------------------------------------------------ */

const SESSION_STATUS = {
  STARTED: "Started",
  ACTIVE: "Active",
  BREAK: "Break",
  STOPPED: "Stopped",
};

function assertValidCoordinatePair(latitude, longitude, fieldLabel) {
  if (!hasValidCoordinates(Number(latitude), Number(longitude))) {
    const error = new Error(
      `${fieldLabel} latitude/longitude are required and must be valid.`,
    );
    error.statusCode = 400;
    throw error;
  }
}

function getSessionOrThrow(sessionId) {
  const session = sessionStore.getSessionById(sessionId);

  if (!session) {
    const error = new Error(
      "Tracking session not found. It may have already ended.",
    );
    error.statusCode = 404;
    throw error;
  }

  return session;
}

/**
 * Builds the Zoho Creator payload for the "Technician Shift Sessions"
 * form (Section 23 - "Technician Login/Logout Activity"). Field
 * names come from config.zoho.tracking.sessionFields so updating
 * .env is enough once the real Creator form exists - no code
 * changes needed here.
 */
function buildSessionCreatorPayload(session) {
  const fields = config.zoho.tracking.sessionFields;
  const data = {};

  data[fields.technicianEmail] = session.technicianEmail;
  data[fields.workOrder] = session.workOrderId;
  data[fields.status] = session.status;

  if (session.loginTime) data[fields.loginTime] = session.loginTime;
  if (session.breakStartedAt) data[fields.breakStart] = session.breakStartedAt;
  if (session.breakEndedAt) data[fields.breakEnd] = session.breakEndedAt;
  if (session.logoutTime) data[fields.logoutTime] = session.logoutTime;
  if (session.startLatitude != null)
    data[fields.startLatitude] = session.startLatitude;
  if (session.startLongitude != null)
    data[fields.startLongitude] = session.startLongitude;
  if (session.endLatitude != null)
    data[fields.endLatitude] = session.endLatitude;
  if (session.endLongitude != null)
    data[fields.endLongitude] = session.endLongitude;

  return { data };
}

/**
 * Builds the Zoho Creator payload for a single "Technician Location
 * Logs" record (Section 20 - "Location Data Handling").
 */
function buildLocationLogCreatorPayload({
  session,
  latitude,
  longitude,
  accuracy,
  devicePlatform,
}) {
  const fields = config.zoho.tracking.locationLogFields;
  const data = {};

  data[fields.technicianEmail] = session.technicianEmail;
  data[fields.session] = session.sessionId;
  data[fields.workOrder] = session.workOrderId;
  data[fields.latitude] = latitude;
  data[fields.longitude] = longitude;
  data[fields.trackingStatus] = session.status;

  if (accuracy != null) data[fields.accuracy] = accuracy;
  if (devicePlatform) data[fields.devicePlatform] = devicePlatform;

  return { data };
}

/**
 * Start Shift.
 *
 * Per handover doc Section 22 ("Start"): validate Work Order,
 * validate technician assignment, validate distance, create
 * tracking session.
 *
 * NOTE: Work Order + assignment + distance validation is expected
 * to happen against the same assigned-work-orders data this service
 * already loads (getAssignedWorkOrdersForTechnician). That cross-
 * check is left as a follow-up once the controller wiring for this
 * is finalized - for now this function focuses on creating the
 * session record and preparing (but not sending) the Zoho payload,
 * matching the current scope of this change.
 */
async function startTrackingSession({
  technicianEmail,
  technicianName,
  workOrderId,
  workOrderReference,
  latitude,
  longitude,
}) {
  const normalizedEmail = normalizeEmail(technicianEmail);

  if (!normalizedEmail) {
    const error = new Error("Technician email is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!cleanText(workOrderId)) {
    const error = new Error("Work Order id is required.");
    error.statusCode = 400;
    throw error;
  }

  assertValidCoordinatePair(latitude, longitude, "Start location");

  const loginTime = new Date().toISOString();

  const session = sessionStore.createSession({
    technicianEmail: normalizedEmail,
    technicianName: cleanText(technicianName) || normalizedEmail,
    workOrderId: cleanText(workOrderId),
    workOrderReference: cleanText(workOrderReference) || cleanText(workOrderId),
    status: SESSION_STATUS.ACTIVE,
    loginTime,
    startLatitude: Number(latitude),
    startLongitude: Number(longitude),
  });

  try {
    const syncResult = await zohoTaskTrackingService.logEvent({
      technicianEmail: normalizedEmail,
      technicianName: session.technicianName,
      workOrderReference: session.workOrderReference,
      logType: "Login",
      latitude: Number(latitude),
      longitude: Number(longitude),
      deviceTimestamp: loginTime,
    });
    console.log(
      "[Tracking] Start Shift (Login) - synced to Zoho CRM Location_Logs:",
      JSON.stringify(syncResult),
    );
  } catch (error) {
    console.error(
      "[Tracking] Start Shift (Login) - failed to sync to Zoho CRM Location_Logs:",
      error?.response?.data || error.message,
    );
  }

  return session;
}

/**
 * Records a single location point while a session is Active.
 * Per handover doc Section 22 ("Location"): receive technician
 * coordinates, validate active session, save location log.
 */
async function recordTrackingLocation({
  sessionId,
  latitude,
  longitude,
  accuracy,
  devicePlatform,
}) {
  const session = getSessionOrThrow(sessionId);

  if (session.status !== SESSION_STATUS.ACTIVE) {
    const error = new Error(
      "Location can only be recorded while the shift is Active.",
    );
    error.statusCode = 400;
    throw error;
  }

  assertValidCoordinatePair(latitude, longitude, "Location");

  const updatedSession = sessionStore.appendLocationPoint(sessionId, {
    latitude: Number(latitude),
    longitude: Number(longitude),
    accuracy: accuracy != null ? Number(accuracy) : null,
    devicePlatform: devicePlatform || null,
  });

  const payload = buildLocationLogCreatorPayload({
    session: updatedSession,
    latitude: Number(latitude),
    longitude: Number(longitude),
    accuracy,
    devicePlatform,
  });

  console.log(
    "[Tracking] Location point - payload prepared for Zoho Creator (sync disabled):",
    JSON.stringify(payload, null, 2),
  );

  // TODO: uncomment when ready to sync to CRM - the "Technician
  // Location Logs" Creator form must exist first (see
  // config.zoho.tracking.locationLogFormLinkName in config/env.js).
  //
  // await creatorRequest(
  //   "post",
  //   `/form/${config.zoho.tracking.locationLogFormLinkName}`,
  //   { data: payload }
  // );

  return updatedSession;
}

/**
 * recordTrackingLocationBatch
 * ----------------------------------------------------------------
 * NEW - replaces the per-ping single-record flow above for Interval
 * Pings specifically. The frontend buffers pings locally (see
 * utils/pingBuffer.js) and flushes them here as one array, every 15
 * minutes or immediately before any status change. This becomes ONE
 * bulk insert to Zoho CRM's Location_Logs module (via
 * zohoTaskTrackingService.logPingBatch), rather than one API call
 * per single ping - directly addressing the volume concern raised
 * for this feature (dozens of pings/technician/day).
 *
 * Each ping keeps its OWN original deviceTimestamp, exactly as
 * captured on the device - never re-stamped with the flush/sync
 * time, per the client's explicit requirement (this also covers
 * the offline-recovery case from the spec: queued pings preserve
 * their real capture time once connectivity returns).
 * ----------------------------------------------------------------
 */
async function recordTrackingLocationBatch({ sessionId, pings }) {
  const session = getSessionOrThrow(sessionId);

  if (!Array.isArray(pings) || pings.length === 0) {
    return { synced: true, successCount: 0, totalCount: 0 };
  }

  try {
    const syncResult = await zohoTaskTrackingService.logPingBatch({
      technicianEmail: session.technicianEmail,
      technicianName: session.technicianName || session.technicianEmail,
      workOrderReference: session.workOrderReference || session.workOrderId,
      pings,
    });

    console.log(
      `[Tracking] Batch of ${pings.length} Interval Ping(s) - synced to Zoho CRM Location_Logs:`,
      JSON.stringify(syncResult),
    );

    return syncResult;
  } catch (error) {
    console.error(
      "[Tracking] Interval Ping batch - failed to sync to Zoho CRM Location_Logs:",
      error?.response?.data || error.message,
    );

    return { synced: false, successCount: 0, totalCount: pings.length };
  }
}

/**
 * Break.
 * Per handover doc Section 18/22: set session to Break, save break
 * time. No coordinates are recorded during a break.
 */
async function startTrackingBreak({ sessionId }) {
  const session = getSessionOrThrow(sessionId);

  if (session.status !== SESSION_STATUS.ACTIVE) {
    const error = new Error("Only an Active shift can be put on Break.");
    error.statusCode = 400;
    throw error;
  }

  const breakStartedAt = new Date().toISOString();

  const updatedSession = sessionStore.updateSession(sessionId, {
    status: SESSION_STATUS.BREAK,
    breakStartedAt,
  });

  try {
    const syncResult = await zohoTaskTrackingService.logEvent({
      technicianEmail: updatedSession.technicianEmail,
      technicianName:
        updatedSession.technicianName || updatedSession.technicianEmail,
      workOrderReference:
        updatedSession.workOrderReference || updatedSession.workOrderId,
      logType: "Break Started",
      deviceTimestamp: breakStartedAt,
    });
    console.log(
      "[Tracking] Break Started - synced to Zoho CRM Location_Logs:",
      JSON.stringify(syncResult),
    );
  } catch (error) {
    console.error(
      "[Tracking] Break Started - failed to sync to Zoho CRM Location_Logs:",
      error?.response?.data || error.message,
    );
  }

  return updatedSession;
}

/**
 * Continue.
 * Per handover doc Section 18/22: validate technician location
 * again (done on the frontend/controller before calling this),
 * resume active tracking, save break end time.
 */
async function continueTrackingSession({ sessionId, latitude, longitude }) {
  const session = getSessionOrThrow(sessionId);

  if (session.status !== SESSION_STATUS.BREAK) {
    const error = new Error(
      "Only a shift currently on Break can be continued.",
    );
    error.statusCode = 400;
    throw error;
  }

  assertValidCoordinatePair(latitude, longitude, "Continue location");

  const breakEndedAt = new Date().toISOString();

  const updatedSession = sessionStore.updateSession(sessionId, {
    status: SESSION_STATUS.ACTIVE,
    breakEndedAt,
  });

  try {
    const syncResult = await zohoTaskTrackingService.logEvent({
      technicianEmail: updatedSession.technicianEmail,
      technicianName:
        updatedSession.technicianName || updatedSession.technicianEmail,
      workOrderReference:
        updatedSession.workOrderReference || updatedSession.workOrderId,
      logType: "Break Ended",
      latitude: Number(latitude),
      longitude: Number(longitude),
      deviceTimestamp: breakEndedAt,
    });
    console.log(
      "[Tracking] Break Ended - synced to Zoho CRM Location_Logs:",
      JSON.stringify(syncResult),
    );
  } catch (error) {
    console.error(
      "[Tracking] Break Ended - failed to sync to Zoho CRM Location_Logs:",
      error?.response?.data || error.message,
    );
  }

  return updatedSession;
}

/**
 * Stop / End Shift.
 * Per handover doc Section 18/22: end tracking session, save
 * logout time, stop additional location submissions.
 */
async function stopTrackingSession({ sessionId, latitude, longitude }) {
  const session = getSessionOrThrow(sessionId);

  if (session.status === SESSION_STATUS.STOPPED) {
    const error = new Error("This shift has already been ended.");
    error.statusCode = 400;
    throw error;
  }

  const hasFinalLocation = hasValidCoordinates(
    Number(latitude),
    Number(longitude),
  );

  const logoutTime = new Date().toISOString();

  const updatedSession = sessionStore.updateSession(sessionId, {
    status: SESSION_STATUS.STOPPED,
    logoutTime,
    endLatitude: hasFinalLocation ? Number(latitude) : null,
    endLongitude: hasFinalLocation ? Number(longitude) : null,
  });

  try {
    const syncResult = await zohoTaskTrackingService.logEvent({
      technicianEmail: updatedSession.technicianEmail,
      technicianName:
        updatedSession.technicianName || updatedSession.technicianEmail,
      workOrderReference:
        updatedSession.workOrderReference || updatedSession.workOrderId,
      logType: "Logout",
      latitude: hasFinalLocation ? Number(latitude) : null,
      longitude: hasFinalLocation ? Number(longitude) : null,
      deviceTimestamp: logoutTime,
    });
    console.log(
      "[Tracking] Logout - synced to Zoho CRM Location_Logs:",
      JSON.stringify(syncResult),
    );
  } catch (error) {
    console.error(
      "[Tracking] Logout - failed to sync to Zoho CRM Location_Logs:",
      error?.response?.data || error.message,
    );
  }

  return updatedSession;
}

/**
 * Reads the current session status for a technician + Work Order,
 * used to restore state if the app was closed/reopened mid-shift.
 * Returns null if there is no active (non-Stopped) session.
 */
async function getTrackingSessionStatus({ technicianEmail, workOrderId }) {
  const normalizedEmail = normalizeEmail(technicianEmail);

  if (!normalizedEmail || !cleanText(workOrderId)) {
    const error = new Error("Technician email and Work Order id are required.");
    error.statusCode = 400;
    throw error;
  }

  return sessionStore.findActiveSessionForWorkOrder({
    technicianEmail: normalizedEmail,
    workOrderId: cleanText(workOrderId),
  });
}

module.exports = {
  getAssignedWorkOrdersForTechnician,
  startTrackingSession,
  recordTrackingLocation,
  recordTrackingLocationBatch,
  startTrackingBreak,
  continueTrackingSession,
  stopTrackingSession,
  getTrackingSessionStatus,
};