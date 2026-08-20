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
 * NEW: now also tracks failedFileNames - used to build a specific
 * "failed to upload: X.jpg, Y.jpg" message instead of just a
 * count.
 * ----------------------------------------------------------------
 */
async function uploadMoveOutAttachments({ recordId, entry }) {
  const moveOutConfig = config.zoho.moveOut;
  const fieldConfig = moveOutConfig.fields;

  if (!Array.isArray(entry.attachments) || entry.attachments.length === 0) {
    return { uploaded: 0, failed: 0, errors: [], failedFileNames: [] };
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
    const failedFileNames = entry.attachments.map(
      (attachment, index) =>
        attachment.originalName || `photo-${index + 1}.jpg`,
    );

    return {
      uploaded: 0,
      failed: failedFileNames.length,
      errors: [
        `Could not re-fetch the created record to upload images: ${error.message}`,
      ],
      failedFileNames,
    };
  }

  const subformRows = fetchedRecord?.[fieldConfig.attachmentsSubform];

  if (!Array.isArray(subformRows)) {
    const failedFileNames = entry.attachments.map(
      (attachment, index) =>
        attachment.originalName || `photo-${index + 1}.jpg`,
    );

    return {
      uploaded: 0,
      failed: failedFileNames.length,
      errors: [
        `No subform rows found for ${fieldConfig.attachmentsSubform} on record ${recordId}.`,
      ],
      failedFileNames,
    };
  }

  let uploaded = 0;
  const errors = [];
  const failedFileNames = [];

  for (let index = 0; index < entry.attachments.length; index += 1) {
    const attachment = entry.attachments[index];
    const expectedSequence = String(index + 1);
    const fileName = attachment.originalName || `photo-${expectedSequence}.jpg`;

    const matchingRow = subformRows.find(
      (row) =>
        String(row[fieldConfig.attachmentSequenceField]) === expectedSequence,
    );

    if (!matchingRow) {
      failedFileNames.push(fileName);

      errors.push(
        `Could not find a matching subform row for sequence ${expectedSequence} (${fileName}) in ${fieldConfig.attachmentsSubform}.`,
      );
      continue;
    }

    try {
      const formData = new FormData();

      formData.append("file", attachment.buffer, {
        filename: fileName,
        contentType: attachment.mimeType || "image/jpeg",
      });

      await creatorUploadFile(
        `/report/${attachmentReportLinkName}/${recordId}/${fieldConfig.attachmentsSubform}.${fieldConfig.attachmentField}/${matchingRow.ID}/upload`,
        formData,
      );

      uploaded += 1;
    } catch (error) {
      failedFileNames.push(fileName);

      errors.push(
        `Failed to upload ${fileName}: ${error?.response?.data?.message || error.message}`,
      );
    }
  }

  return { uploaded, failed: failedFileNames.length, errors, failedFileNames };
}

/**
 * markAttachmentSyncComplete
 * ----------------------------------------------------------------
 * Same rules as the other two forms. Move Out is single-entry, so
 * there's no "aggregate across tickets" nuance - it's just this
 * record had attachments or it didn't.
 * ----------------------------------------------------------------
 */
async function markAttachmentSyncComplete({ recordId, reportLinkName }) {
  try {
    await creatorRequest("patch", `/report/${reportLinkName}/${recordId}`, {
      data: {
        data: {
          [config.zoho.attachmentSyncField]: true,
        },
      },
    });

    return true;
  } catch (error) {
    console.error(
      "[Process Move Out] Failed to set Attachment_Sync:",
      error?.response?.data || error.message,
    );

    return false;
  }
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
  let attachmentUploadResult = {
    uploaded: 0,
    failed: 0,
    errors: [],
    failedFileNames: [],
  };
  let attachmentSyncUpdated = false;

  if (attachmentCount > 0) {
    attachmentUploadResult = await uploadMoveOutAttachments({
      recordId,
      entry,
    });

    attachmentUploadStatus =
      attachmentUploadResult.failed === 0
        ? `${attachmentUploadResult.uploaded} of ${attachmentCount} image(s) uploaded successfully.`
        : `${attachmentUploadResult.uploaded} of ${attachmentCount} image(s) uploaded. Failed to upload: ${attachmentUploadResult.failedFileNames.join(", ")}.`;

    if (attachmentUploadResult.errors.length > 0) {
      console.error(
        "[Process Move Out] Attachment upload errors:",
        attachmentUploadResult.errors,
      );
    }

    // Same 8-second delay as Work Order/Rehab Order - gives Zoho
    // time to settle the just-uploaded image before the
    // Attachment_Sync update fires, which the attached workflow
    // needs to see reliably.
    await wait(2000);

    attachmentSyncUpdated = await markAttachmentSyncComplete({
      recordId,
      reportLinkName: config.zoho.reports.moveOut,
    });
  }

  return {
    recordId,
    zohoResponse,
    attachmentUploadStatus,
    attachmentUploadResult,
    attachmentSyncUpdated,
  };
}

module.exports = {
  createMoveOutEntry,
};
