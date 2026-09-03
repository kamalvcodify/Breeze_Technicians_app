const axios = require("axios");
const config = require("../config/env");
const { getAccessToken } = require("./zohoAuthService");

/**
 * services/zohoCheckInOutService.js
 * ----------------------------------------------------------------
 * REWRITTEN - Check In / Check Out Inventory now syncs to Zoho
 * CRM's "Check_In_log" module instead of Zoho Creator. Single-entry
 * form (no ticket loop) - one submission creates exactly one CRM
 * record.
 *
 * Field mapping confirmed against real sample CRM records:
 *   - Property is a genuine Lookup field - the real CRM record ID
 *     already carried on the entry (entry.property, the same ID
 *     already populating the Property search-select dropdown) is
 *     used directly.
 *   - Rehab_Unit is confirmed PLAIN TEXT (not a Lookup, unlike
 *     Property) - entry.rehabUnitName (the form's "Rehab Unit"
 *     display name) is sent here; entry.rehabUnit (the real CRM ID)
 *     goes to the separate Unit Lookup field instead.
 *   - Parts_Inventory IS a genuine Lookup field - entry
 *     .partsInventory is expected to already be a real CRM record
 *     ID, same pattern as Property.
 *   - Checkin_For ("Rehab"/"Work Order") doubles as both the form's
 *     "Job Type" selector value AND the discriminator distinguishing
 *     which context this check-in relates to - confirmed to be a
 *     single field, not two separate ones.
 *   - Name IS a mandatory field on this module (confirmed via a
 *     real MANDATORY_NOT_FOUND rejection) - set to the technician's
 *     name. This corrects an earlier assumption based on sample
 *     data alone (which happened to show auto-numbers in those
 *     particular records) - the field itself still requires input.
 * ----------------------------------------------------------------
 */

const CRM_BASE_URL = "https://www.zohoapis.com/crm/v2";

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
    validateStatus: (status) => status === 204 || (status >= 200 && status < 300),
  });

  return response.status === 204 ? { data: [] } : response.data;
}

const MODULE = () => config.zoho.crmCheckInOut.module;
const FIELDS = () => config.zoho.crmCheckInOut.fields;

/**
 * Zoho CRM DateTime fields need a clean ISO string with no
 * milliseconds - same fix already confirmed necessary for
 * Task_Tracking/Location_Logs and Rent_Ready_Checklist earlier
 * tonight.
 */
function toZohoDateTime(isoValue) {
  if (!isoValue) {
    return "";
  }

  const date = new Date(isoValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function buildCrmPayload(entry) {
  const fields = FIELDS();

  const data = {
    // FIX: Name is a MANDATORY field on this module, confirmed via
    // a real MANDATORY_NOT_FOUND rejection - set to the technician's
    // name, per instructions.
    Name: entry.technicianName,
    [fields.technician]: entry.technicianName,
    [fields.city]: entry.city,
    // FIX: this form's controller normalizes to rehabUnit/
    // rehabUnitName (NOT unit/unitName like every other form) -
    // confirmed directly against checkInOutController.js and
    // CheckInCheckOutScreen.js. Rehab_Unit is a plain TEXT field -
    // needs the display NAME (entry.rehabUnitName). entry.rehabUnit
    // (the ID) is a genuine Lookup reference and belongs on the
    // separate Unit field instead - see below.
    [fields.rehabUnit]: entry.rehabUnitName,
    [fields.workOrder]: entry.workOrder,
    [fields.email]: entry.email,
    [fields.partCode]: entry.partCode,
    [fields.notes]: entry.notes,
    [fields.action]: entry.action,
    [fields.checkinFor]: entry.jobType,
  };

  if (entry.dateTime) {
    data[fields.dateTime] = toZohoDateTime(entry.dateTime);
  }

  if (entry.property) {
    data[fields.property] = { id: entry.property };
  }

  // NEW: Unit is a genuine Lookup field, separate from Rehab_Unit -
  // uses the real CRM Unit ID (entry.rehabUnit), same pattern as
  // Property.
  if (entry.rehabUnit) {
    data[fields.unit] = { id: entry.rehabUnit };
  }

  if (entry.partsInventory) {
    data[fields.partsInventory] = { id: entry.partsInventory };
  }

  if (entry.quantityDesired !== undefined && entry.quantityDesired !== "") {
    data[fields.quantityDesired] = Number(entry.quantityDesired);
  }

  if (entry.quantityReturned !== undefined && entry.quantityReturned !== "") {
    data[fields.quantityReturned] = Number(entry.quantityReturned);
  }

  return data;
}

async function createCheckInOutEntry({ entry }) {
  const payload = buildCrmPayload(entry);

  console.log(
    "[Check In/Out] Syncing to Zoho CRM Check_In_log:",
    JSON.stringify(payload, null, 2)
  );

  const result = await crmRequest("post", `/${MODULE()}`, {
    data: { data: [payload] },
  });

  const responseEntry = result?.data?.[0];
  const success = responseEntry?.code === "SUCCESS";

  if (!success) {
    console.error(
      "[Check In/Out] Zoho CRM rejected the record - full response:",
      JSON.stringify(responseEntry, null, 2)
    );

    const error = new Error(responseEntry?.message || "Zoho CRM rejected the record.");
    error.statusCode = 502;
    error.zohoResponse = result;
    throw error;
  }

  return {
    recordId: responseEntry?.details?.id || null,
    zohoResponse: result,
  };
}

module.exports = {
  createCheckInOutEntry,
};