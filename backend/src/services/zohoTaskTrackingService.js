const axios = require("axios");
const config = require("../config/env");
const { getAccessToken } = require("./zohoAuthService");

/**
 * services/zohoTaskTrackingService.js
 * ----------------------------------------------------------------
 * REWRITTEN to match the client's provided implementation spec
 * exactly: Location Logs is an EVENT LOG, not an aggregated
 * per-Work-Order record. Every Login, Logout, Break Started, Break
 * Ended, and Interval Ping is its own independent new row - never a
 * search-then-update. This also incidentally eliminates the entire
 * class of bug spent hours debugging earlier (Zoho search-index
 * propagation lag causing "record not found" / duplicate records) -
 * since nothing here ever searches for an existing record anymore,
 * only creates fresh ones, which Zoho already proved reliable via a
 * direct curl test.
 *
 * Two write paths, by design (per efficiency plan, v1):
 *   - logEvent(): ONE immediate insert - used for Login, Logout,
 *     Break Started, Break Ended (low frequency, dispatchers likely
 *     want to know about these promptly).
 *   - logPingBatch(): ONE bulk insert covering MANY Interval Pings
 *     at once (high frequency) - the mobile app buffers pings
 *     locally and flushes them together (every 15 min, or
 *     immediately before any status change) rather than making one
 *     API call per single ping. Zoho's insert endpoint accepts up
 *     to 100 records per call; larger batches are automatically
 *     chunked.
 *
 * FIELD FORMAT: Device_Timestamp is a Zoho DateTime field - same
 * "no milliseconds" requirement already confirmed via a real
 * INVALID_DATA rejection earlier tonight (see toZohoDateTime below).
 *
 * Per instructions: Technician stays as a plain email/text value for
 * now (not resolved to a CRM Lookup/Contact record) - a v2 item.
 * ----------------------------------------------------------------
 */

const CRM_BASE_URL = "https://www.zohoapis.com/crm/v2";
const MAX_RECORDS_PER_INSERT = 100;

async function crmRequest(method, path, { params, data } = {}) {
  const accessToken = await getAccessToken();

  const response = await axios({
    method,
    url: `${CRM_BASE_URL}${path}`,
    params,
    data,
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json",
    },
    validateStatus: (status) =>
      status === 204 || (status >= 200 && status < 300),
  });

  return response.status === 204 ? { data: [] } : response.data;
}

/**
 * Zoho CRM DateTime fields reject the fractional-seconds portion
 * that JavaScript's Date.prototype.toISOString() always includes
 * (e.g. "2026-08-24T18:12:34.567Z") - confirmed via a real
 * INVALID_DATA rejection ("expected_data_type": "datetime") earlier
 * tonight. Zoho expects a clean "yyyy-MM-ddTHH:mm:ssZ".
 */
function toZohoDateTime(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

const MODULE = () => config.zoho.taskTracking.module;
const FIELDS = () => config.zoho.taskTracking.fields;

/**
 * Builds one Location Logs row. deviceTimestamp is expected as
 * either a Date object or an ISO string already captured on the
 * device at the moment the event/ping actually happened - NOT the
 * time of the eventual sync, per the client's explicit requirement
 * to preserve the original capture time even when queued offline.
 */
function buildLogRow({
  technicianEmail,
  technicianName,
  workOrderReference,
  logType,
  deviceTimestamp,
  latitude,
  longitude,
}) {
  const fields = FIELDS();

  const timestampDate =
    deviceTimestamp instanceof Date
      ? deviceTimestamp
      : new Date(deviceTimestamp);

  const row = {
    [fields.name]: technicianName || technicianEmail,
    [fields.email]: technicianEmail,
    [fields.jobType]: "Work Order",
    [fields.reference]: workOrderReference,
    [fields.technician]: technicianEmail,
    // NOTE: Related_Work_Order deliberately NOT sent - confirmed via
    // a real Zoho rejection that this field expects a "bigint"
    // (a numeric Lookup record ID), not the plain ticket-number text
    // we have available (e.g. "10242-1"). Re-enable this once either
    // (a) the field is changed to a plain text field in Zoho, or
    // (b) a real numeric CRM record ID is resolved/looked up to send
    // here instead. To re-enable: uncomment the line below AND
    // confirm workOrderReference (or a new param) actually holds a
    // valid value for whatever type this field ends up being.
    // [fields.relatedWorkOrder]: workOrderReference,
    [fields.logType]: logType,
    [fields.deviceTimestamp]: toZohoDateTime(timestampDate),
  };

  // Latitude/Longitude fields have a real length limit in Zoho
  // (confirmed via a real rejection: "maximum_length": 16) - raw GPS
  // readings often have 15+ decimal places, which overflows that
  // limit once converted to a string. Rounding to 6 decimal places
  // (~11cm precision - far more than needed for a 150m geofence)
  // keeps every value well under the limit regardless of how
  // precise the device's own GPS reading was.
  if (Number.isFinite(latitude)) {
    row[fields.latitude] = Number(latitude.toFixed(6));
  }

  if (Number.isFinite(longitude)) {
    row[fields.longitude] = Number(longitude.toFixed(6));
  }

  return row;
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function insertRows(rows) {
  const chunks = chunkArray(rows, MAX_RECORDS_PER_INSERT);

  const results = [];

  for (const chunk of chunks) {
    // eslint-disable-next-line no-await-in-loop
    const result = await crmRequest("post", `/${MODULE()}`, {
      data: { data: chunk },
    });

    const entries = Array.isArray(result?.data) ? result.data : [];
    const failures = entries.filter((entry) => entry?.code !== "SUCCESS");

    if (failures.length > 0) {
      console.error(
        "[Task Tracking] Zoho CRM rejected one or more rows in a batch insert:",
        JSON.stringify(failures, null, 2),
      );
    }

    results.push(...entries);
  }

  const successCount = results.filter(
    (entry) => entry?.code === "SUCCESS",
  ).length;

  return {
    synced: successCount === rows.length,
    successCount,
    totalCount: rows.length,
  };
}

/**
 * logEvent
 * ----------------------------------------------------------------
 * ONE immediate insert - Login, Logout, Break Started, Break Ended.
 * ----------------------------------------------------------------
 */
async function logEvent({
  technicianEmail,
  technicianName,
  workOrderReference,
  logType,
  latitude,
  longitude,
  deviceTimestamp,
}) {
  const row = buildLogRow({
    technicianEmail,
    technicianName,
    workOrderReference,
    logType,
    deviceTimestamp: deviceTimestamp || new Date(),
    latitude,
    longitude,
  });

  return insertRows([row]);
}

/**
 * logPingBatch
 * ----------------------------------------------------------------
 * ONE bulk insert covering many Interval Pings at once. Each ping
 * in `pings` must carry ITS OWN original deviceTimestamp/latitude/
 * longitude - these are NOT re-stamped with the current sync time.
 * ----------------------------------------------------------------
 */
async function logPingBatch({
  technicianEmail,
  technicianName,
  workOrderReference,
  pings,
}) {
  if (!Array.isArray(pings) || pings.length === 0) {
    return { synced: true, successCount: 0, totalCount: 0 };
  }

  const rows = pings.map((ping) =>
    buildLogRow({
      technicianEmail,
      technicianName,
      workOrderReference,
      logType: "Interval Ping",
      deviceTimestamp: ping.deviceTimestamp,
      latitude: ping.latitude,
      longitude: ping.longitude,
    }),
  );

  return insertRows(rows);
}

module.exports = {
  logEvent,
  logPingBatch,
};
