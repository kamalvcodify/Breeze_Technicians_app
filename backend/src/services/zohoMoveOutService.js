const FormData = require("form-data");

const config = require("../config/env");

const { creatorRequest, creatorUploadFile } = require("./zohoCreatorService");

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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * addMoveOutFields
 * ----------------------------------------------------------------
 * NEW: pre-creates one subform row PER attachment (sequence number
 * only, image_sequence field, subform "Photo") - same pattern
 * proven working on Work Order/Rehab Order. Single-entry form, so
 * no per-ticket looping needed.
 * ----------------------------------------------------------------
 */
function addMoveOutFields(data, entry, fieldConfig) {
  setField(data, fieldConfig.technicianName, entry.technicianName);

  setField(data, fieldConfig.property, entry.property);

  setField(data, fieldConfig.email, entry.email);

  setField(data, fieldConfig.unit, entry.unitName);

  setField(data, fieldConfig.finalStatus, entry.finalStatus);

  setField(
    data,
    fieldConfig.dateOfInspection,
    formatCreatorDate(entry.dateOfInspection),
  );

  setField(data, fieldConfig.notes, entry.notes);

  if (
    Array.isArray(entry.attachments) &&
    entry.attachments.length > 0 &&
    fieldConfig.attachmentsSubform &&
    fieldConfig.attachmentSequenceField
  ) {
    data[fieldConfig.attachmentsSubform] = entry.attachments.map(
      (_, index) => ({
        [fieldConfig.attachmentSequenceField]: String(index + 1),
      }),
    );
  }
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

/**
 * fetchRecordWithRetry
 * ----------------------------------------------------------------
 * Same retry-with-delay pattern proven necessary on Work Order.
 * ----------------------------------------------------------------
 */
async function fetchRecordWithRetry({ reportLinkName, recordId, subformKey }) {
  const delaysMs = [800, 1500, 2500];

  for (let attempt = 0; attempt < delaysMs.length; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    await wait(delaysMs[attempt]);

    // eslint-disable-next-line no-await-in-loop
    const recordResponse = await creatorRequest(
      "get",
      `/report/${reportLinkName}/${recordId}`,
    );

    const fetchedRecord = recordResponse?.data;

    console.log(
      `[Process Move Out] Re-fetch attempt ${attempt + 1}/${delaysMs.length} for record ${recordId} - subform data:`,
      JSON.stringify({ [subformKey]: fetchedRecord?.[subformKey] }, null, 2),
    );

    const rows = fetchedRecord?.[subformKey];

    const hasPopulatedSequence =
      Array.isArray(rows) &&
      rows.some(
        (row) =>
          row &&
          Object.values(row).some(
            (value) =>
              value !== "" && value !== undefined && typeof value !== "object",
          ),
      );

    if (hasPopulatedSequence || attempt === delaysMs.length - 1) {
      return fetchedRecord;
    }
  }

  return null;
}

/**
 * uploadMoveOutAttachments
 * ----------------------------------------------------------------
 * Mirrors Work Order's uploadTicketAttachments()/Rehab Order's
 * uploadEntryAttachments() exactly, single-entry version. Uses
 * config.zoho.reports.moveOut ("All_Move_out_Checklist_Report") for
 * BOTH the re-fetch and the upload call, as confirmed for this
 * form specifically.
 * ----------------------------------------------------------------
 */
async function uploadMoveOutAttachments({ recordId, entry }) {
  const moveOutConfig = config.zoho.moveOut;
  const fieldConfig = moveOutConfig.fields;

  if (!Array.isArray(entry.attachments) || entry.attachments.length === 0) {
    return { uploaded: 0, failed: 0, errors: [] };
  }

  const attachmentReportLinkName = config.zoho.reports.moveOut;

  let fetchedRecord;

  try {
    fetchedRecord = await fetchRecordWithRetry({
      reportLinkName: attachmentReportLinkName,
      recordId,
      subformKey: fieldConfig.attachmentsSubform,
    });
  } catch (error) {
    return {
      uploaded: 0,
      failed: entry.attachments.length,
      errors: [
        `Could not re-fetch the created record to upload images: ${error.message}`,
      ],
    };
  }

  const subformRows = fetchedRecord?.[fieldConfig.attachmentsSubform];

  if (!Array.isArray(subformRows)) {
    return {
      uploaded: 0,
      failed: entry.attachments.length,
      errors: [
        `No subform rows found for ${fieldConfig.attachmentsSubform} on record ${recordId}.`,
      ],
    };
  }

  let uploaded = 0;
  const errors = [];

  for (let index = 0; index < entry.attachments.length; index += 1) {
    const attachment = entry.attachments[index];
    const expectedSequence = String(index + 1);

    const matchingRow = subformRows.find(
      (row) =>
        String(row[fieldConfig.attachmentSequenceField]) === expectedSequence,
    );

    if (!matchingRow) {
      errors.push(
        `Could not find a matching subform row for sequence ${expectedSequence} in ${fieldConfig.attachmentsSubform}.`,
      );
      continue;
    }

    try {
      const formData = new FormData();

      formData.append("file", attachment.buffer, {
        filename: attachment.originalName || `photo-${expectedSequence}.jpg`,
        contentType: attachment.mimeType || "image/jpeg",
      });

      await creatorUploadFile(
        `/report/${attachmentReportLinkName}/${recordId}/${fieldConfig.attachmentsSubform}.${fieldConfig.attachmentField}/${matchingRow.ID}/upload`,
        formData,
      );

      uploaded += 1;
    } catch (error) {
      errors.push(
        `Failed to upload image ${index + 1}: ${error?.response?.data?.message || error.message}`,
      );
    }
  }

  return { uploaded, failed: errors.length, errors };
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

  const attachmentCount = (entry.attachments || []).length;

  let attachmentUploadStatus = "No attachments supplied.";
  let attachmentUploadResult = { uploaded: 0, failed: 0, errors: [] };

  if (attachmentCount > 0) {
    attachmentUploadResult = await uploadMoveOutAttachments({
      recordId,
      entry,
    });

    attachmentUploadStatus =
      attachmentUploadResult.failed === 0
        ? `${attachmentUploadResult.uploaded} of ${attachmentCount} image(s) uploaded successfully.`
        : `${attachmentUploadResult.uploaded} of ${attachmentCount} image(s) uploaded; ${attachmentUploadResult.failed} failed. The Move Out checklist itself was still submitted successfully.`;

    if (attachmentUploadResult.errors.length > 0) {
      console.error(
        "[Process Move Out] Attachment upload errors:",
        attachmentUploadResult.errors,
      );
    }
  }

  return {
    recordId,
    zohoResponse,
    attachmentUploadStatus,
    attachmentUploadResult,
  };
}

module.exports = {
  createMoveOutEntry,
};
