const config = require("../config/env");

const { creatorRequest } = require("./zohoCreatorService");

/**
 * services/zohoMoveOutService.js
 * ----------------------------------------------------------------
 * Mirrors zohoCheckInOutService.js's structure - single-entry, no
 * T1/T2/T3 repeat pattern.
 *
 * Photo/attachments are NOT sent to Zoho yet - same treatment as
 * the other forms' not-yet-wired file fields.
 * ----------------------------------------------------------------
 */

function setField(data, fieldName, value) {
  if (!fieldName || value === undefined || value === null || value === "") {
    return;
  }

  data[fieldName] = value;
}

function formatCreatorDate(value) {
  if (!value) {
    return "";
  }

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return value;
  }

  const [, year, month, day] = match;

  return `${month}/${day}/${year}`;
}

function addMoveOutFields(data, entry, fieldConfig) {
  setField(data, fieldConfig.technicianName, entry.technicianName);

  setField(data, fieldConfig.property, entry.property);

  setField(data, fieldConfig.email, entry.email);

//   setField(data, fieldConfig.unit, entry.unit);

  setField(data, fieldConfig.finalStatus, entry.finalStatus);

  setField(
    data,
    fieldConfig.dateOfInspection,
    formatCreatorDate(entry.dateOfInspection),
  );

  setField(data, fieldConfig.notes, entry.notes);
}

function buildCreatorPayload(entry) {
  const moveOutConfig = config.zoho.moveOut;

  const data = {};

  addMoveOutFields(data, entry, moveOutConfig.fields);

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

async function createMoveOutEntry({ entry }) {
  const moveOutConfig = config.zoho.moveOut;

  if (!moveOutConfig.formLinkName) {
    const error = new Error("Zoho Move Out form link name is not configured.");

    error.statusCode = 500;

    throw error;
  }

  const payload = buildCreatorPayload(entry);

  console.log(
    "[Process Move Out] Payload sent to Zoho:",
    JSON.stringify(payload, null, 2),
  );

  const zohoResponse = await creatorRequest(
    "post",
    `/form/${moveOutConfig.formLinkName}`,
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
  createMoveOutEntry,
};
