const axios = require("axios");
const config = require("../config/env");
const { getAccessToken } = require("./zohoAuthService");

/**
 * services/zohoRentReadyChecklistService.js
 * ----------------------------------------------------------------
 * REWRITTEN - Rent Ready Checklist now syncs to Zoho CRM's
 * "Rent_Ready_Checklist" module instead of Zoho Creator. Single-
 * entry form (no ticket loop, unlike Work Order/Rehab Order) - one
 * submission creates exactly one CRM record.
 *
 * TEMPORARY FIX: the frontend's propertyName (computed from the
 * already-loaded properties list) was still arriving unreliably,
 * so Name composition now fetches the property's real name DIRECTLY
 * from Zoho CRM instead of trusting whatever the frontend sends -
 * a straight GET on the Property record (config.zoho.crm
 * .propertyModule, the same module/field already used elsewhere in
 * this project for Property/Unit lookups), using the ID we already
 * confirmed is correct (it's what makes the Property Lookup field
 * itself resolve correctly on the record). entry.propertyName is
 * still tried FIRST if present (no wasted API call when the
 * frontend already sent a good value), with this fetch only as a
 * fallback - not a full replacement of the original design.
 *
 * Field mapping confirmed against 2 real sample CRM records:
 *   - Property/Unit are genuine Lookup fields - the real CRM record
 *     IDs already carried on the entry (entry.property/entry.unit,
 *     the same IDs already populating the Property/Unit
 *     search-select dropdowns) are used directly.
 *   - Ready_Rent (note: reversed word order from Creator's
 *     Rent_Ready) is "Yes"/"No".
 *   - The 29 checklist fields keep the SAME meaning/order as the
 *     Creator version but WITHOUT the trailing "1" Creator's field
 *     names had, and with slightly different truncation (Zoho's
 *     field-name length limit) - see config.zoho
 *     .crmRentReadyChecklist.checklist for the exact mapping, only
 *     checked (true) items are sent, matching the existing pattern.
 *   - Name is composed as "{Property} - {Unit, if present} -
 *     {D/M/YYYY}" (no leading zeros - confirmed from real sample
 *     data, e.g. "44 Greenwood Ave - 21/8/2026").
 *
 * This form has no image upload today, so no attachment step here -
 * if that's ever added, it would follow the exact same pattern as
 * zohoCrmInvoiceService.js's uploadAttachmentToRecord (Zoho CRM's
 * standard per-record Attachments API).
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
    validateStatus: (status) =>
      status === 204 || (status >= 200 && status < 300),
  });

  return response.status === 204 ? { data: [] } : response.data;
}

const MODULE = () => config.zoho.crmRentReadyChecklist.module;
const FIELDS = () => config.zoho.crmRentReadyChecklist.fields;
const CHECKLIST_FIELDS = () => config.zoho.crmRentReadyChecklist.checklist;

/**
 * fetchPropertyNameFromCrm
 * ----------------------------------------------------------------
 * TEMPORARY FIX - fetches the real Property display name directly
 * from Zoho CRM by ID, using the SAME Property module/name-field
 * config already established elsewhere in this project
 * (config.zoho.crm.propertyModule / propertyFields.name - see
 * zohoCrmService.js). Returns "" (not throwing) on any failure, so
 * a lookup hiccup never blocks the actual submission - Name just
 * falls back to the raw ID in that rare case, same as before.
 * ----------------------------------------------------------------
 */
async function fetchPropertyNameFromCrm(propertyId) {
  if (!propertyId) {
    return "";
  }

  try {
    const crmConfig = config.zoho.crm;
    const result = await crmRequest(
      "get",
      `/${crmConfig.propertyModule}/${propertyId}`,
    );

    const record = Array.isArray(result?.data) ? result.data[0] : null;
    return record?.[crmConfig.propertyFields.name] || "";
  } catch (error) {
    console.error(
      `[Rent Ready Checklist] Could not fetch Property name for ID ${propertyId}:`,
      error?.response?.data || error.message,
    );
    return "";
  }
}

/**
 * Formats "D/M/YYYY" with NO leading zeros - confirmed from real
 * sample data (e.g. "21/8/2026", "12/8/2026"), NOT the "MM/DD/YYYY"
 * padded format Creator used.
 */
function formatRecordDate(isoValue) {
  if (!isoValue) {
    return "";
  }

  const date = new Date(isoValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

/**
 * Zoho CRM DateTime fields need a clean ISO string with no
 * milliseconds - same fix already confirmed necessary for the
 * Task_Tracking/Location_Logs module earlier tonight
 * (toZohoDateTime in zohoTaskTrackingService.js).
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

function buildRecordName({ propertyName, unitName, dateTime }) {
  const parts = [propertyName, unitName].filter(Boolean);
  const dateStr = formatRecordDate(dateTime);

  if (dateStr) {
    parts.push(dateStr);
  }

  return parts.join(" - ") || "Rent Ready Checklist";
}

function buildChecklistFields(data, checklist) {
  if (!checklist) {
    return;
  }

  const checklistFieldConfig = CHECKLIST_FIELDS();

  Object.keys(checklist).forEach((shortKey) => {
    const zohoFieldName = checklistFieldConfig[shortKey];

    if (checklist[shortKey] && zohoFieldName) {
      data[zohoFieldName] = true;
    }
  });
}

async function buildCrmPayload(entry) {
  const fields = FIELDS();

  // TEMPORARY FIX: prefer whatever the frontend sent (no wasted API
  // call if it's already correct), but if it's missing, fetch the
  // real name directly from Zoho CRM using the property ID instead
  // of falling back to the raw ID.
  const resolvedPropertyName =
    entry.propertyName || (await fetchPropertyNameFromCrm(entry.property));

  const data = {
    Name: buildRecordName({
      propertyName: resolvedPropertyName || entry.property,
      unitName: entry.unitName,
      dateTime: entry.dateTime,
    }),
    [fields.email]: entry.email,
    [fields.techName]: entry.technicianName,
    [fields.readyRent]: entry.rentReady,
  };

  if (entry.dateTime) {
    data[fields.dateTime] = toZohoDateTime(entry.dateTime);
  }

  if (entry.property) {
    data[fields.property] = { id: entry.property };
  }

  if (entry.unit) {
    data[fields.unit] = { id: entry.unit };
  }

  buildChecklistFields(data, entry.checklist);

  return data;
}

async function createRentReadyChecklistEntry({ entry }) {
  const payload = await buildCrmPayload(entry);

  console.log(
    "[Rent Ready Checklist] Syncing to Zoho CRM Rent_Ready_Checklist:",
    JSON.stringify(payload, null, 2),
  );

  const result = await crmRequest("post", `/${MODULE()}`, {
    data: { data: [payload] },
  });

  const responseEntry = result?.data?.[0];
  const success = responseEntry?.code === "SUCCESS";

  if (!success) {
    console.error(
      "[Rent Ready Checklist] Zoho CRM rejected the record - full response:",
      JSON.stringify(responseEntry, null, 2),
    );

    const error = new Error(
      responseEntry?.message || "Zoho CRM rejected the record.",
    );
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
  createRentReadyChecklistEntry,
};
