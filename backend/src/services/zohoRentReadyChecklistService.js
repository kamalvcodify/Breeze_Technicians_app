const config = require("../config/env");

const { creatorRequest } = require("./zohoCreatorService");

/**
 * services/zohoRentReadyChecklistService.js
 * ----------------------------------------------------------------
 * Single-entry, same helper pattern as the other services.
 *
 * IMPORTANT: unlike Property/Unit/Email/etc (which go through
 * env.js-configured field names), the ~29 checklist boolean fields
 * are sent using their KEYS DIRECTLY as Zoho field API names - no
 * name-mapping layer for those, since the frontend's checklist
 * object keys already ARE the exact Zoho field names given. Only
 * checked (true) items are included in the payload; unchecked items
 * are omitted entirely rather than sent as false, consistent with
 * setField()'s existing "skip empty/falsy values" behavior used
 * everywhere else in these services.
 * ----------------------------------------------------------------
 */

function setField(data, fieldName, value) {
  if (!fieldName || value === undefined || value === null || value === "") {
    return;
  }

  data[fieldName] = value;
}

function formatCreatorDateTime(isoValue) {
  if (!isoValue) {
    return "";
  }

  const dateObject = new Date(isoValue);

  if (Number.isNaN(dateObject.getTime())) {
    return "";
  }

  const month = String(dateObject.getMonth() + 1).padStart(2, "0");

  const day = String(dateObject.getDate()).padStart(2, "0");

  const year = dateObject.getFullYear();

  let hour = dateObject.getHours();

  const minute = String(dateObject.getMinutes()).padStart(2, "0");

  const meridiem = hour >= 12 ? "pm" : "am";

  hour %= 12;

  if (hour === 0) {
    hour = 12;
  }

  return `${month}/${day}/${year} ` + `${hour}:${minute} ${meridiem}`;
}

/**
 * Maps each short logical key (EXTERIOR_DEBRIS, LANDSCAPING, etc)
 * to its real Zoho field name via config.zoho.rentReadyChecklist
 * .fields.checklist, then writes `true` for whichever items were
 * checked. Unchecked items are omitted entirely, matching
 * setField()'s existing "skip falsy values" behavior used
 * everywhere else in this file.
 */
function addChecklistFields(data, checklist, checklistFieldConfig) {
  if (!checklist || !checklistFieldConfig) {
    return;
  }

  Object.keys(checklist).forEach((shortKey) => {
    const zohoFieldName = checklistFieldConfig[shortKey];

    if (checklist[shortKey] && zohoFieldName) {
      data[zohoFieldName] = true;
    }
  });
}

function buildCreatorPayload(entry) {
  const rentReadyConfig = config.zoho.rentReadyChecklist;

  const data = {};

  setField(data, rentReadyConfig.fields.property, entry.property);

  // setField(data, rentReadyConfig.fields.unit, entry.unit);

  setField(data, rentReadyConfig.fields.email, entry.email);

  setField(data, rentReadyConfig.fields.technicianName, entry.technicianName);

  setField(data, rentReadyConfig.fields.rentReady, entry.rentReady);

  setField(
    data,
    rentReadyConfig.fields.dateTime,
    formatCreatorDateTime(entry.dateTime),
  );

  setField(data, rentReadyConfig.fields.notes, entry.notes);

  addChecklistFields(data, entry.checklist, rentReadyConfig.checklist);

  return {
    data,
  };
}

function validateZohoResponse(zohoResponse) {
  if (!zohoResponse) {
    const error = new Error("Zoho Creator returned an empty response.");

    error.statusCode = 502;

    throw error;
  }

  if (Number(zohoResponse.code) !== 3000) {
    const messages = Array.isArray(zohoResponse.error)
      ? zohoResponse.error
      : [zohoResponse.message || "Unknown Zoho Creator error."];

    const error = new Error(messages.join(", "));

    error.statusCode = 400;
    error.zohoResponse = zohoResponse;

    throw error;
  }
}

function extractRecordId(zohoResponse) {
  if (Array.isArray(zohoResponse?.data)) {
    return (
      zohoResponse.data[0]?.ID ||
      zohoResponse.data[0]?.id ||
      zohoResponse.data[0]?.details?.id ||
      null
    );
  }

  return (
    zohoResponse?.data?.ID ||
    zohoResponse?.data?.id ||
    zohoResponse?.data?.details?.id ||
    zohoResponse?.details?.id ||
    null
  );
}

async function createRentReadyChecklistEntry({ entry }) {
  const rentReadyConfig = config.zoho.rentReadyChecklist;

  if (!rentReadyConfig.formLinkName) {
    const error = new Error(
      "Zoho Rent Ready Checklist form link name is not configured.",
    );

    error.statusCode = 500;

    throw error;
  }

  const payload = buildCreatorPayload(entry);

  console.log(
    "[Rent Ready Checklist] Payload sent to Zoho:",
    JSON.stringify(payload, null, 2),
  );

  const zohoResponse = await creatorRequest(
    "post",
    `/form/${rentReadyConfig.formLinkName}`,
    {
      data: payload,
    },
  );

  validateZohoResponse(zohoResponse);

  const recordId = extractRecordId(zohoResponse);

  return {
    recordId,
    zohoResponse,
  };
}

module.exports = {
  createRentReadyChecklistEntry,
};
