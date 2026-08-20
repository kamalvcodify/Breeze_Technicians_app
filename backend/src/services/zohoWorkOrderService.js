const FormData = require("form-data");

const config = require("../config/env");

const { creatorRequest, creatorUploadFile } = require("./zohoCreatorService");

function setField(data, fieldName, value) {
  if (!fieldName || value === undefined || value === null || value === "") {
    return;
  }

  data[fieldName] = value;
}

function isTemporaryUnitValue(value) {
  return String(value || "").startsWith("TEMP_");
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

function formatCreatorTime(value) {
  if (!value) {
    return "";
  }

  const cleanValue = String(value).trim();

  if (/am|pm/i.test(cleanValue)) {
    return cleanValue.toLowerCase();
  }

  const match = cleanValue.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return cleanValue;
  }

  let hour = Number(match[1]);

  const minute = match[2];

  const meridiem = hour >= 12 ? "pm" : "am";

  hour %= 12;

  if (hour === 0) {
    hour = 12;
  }

  return `${hour}:${minute} ${meridiem}`;
}

function addTicketFields(data, ticket, fieldConfig, enabled) {
  if (enabled && fieldConfig.enabled) {
    setField(data, fieldConfig.enabled, true);
  }

  setField(data, fieldConfig.ticketId, ticket.ticketId);

  setField(data, fieldConfig.city, ticket.city);

  setField(data, fieldConfig.technicianName, ticket.technicianName);

  setField(data, fieldConfig.property, ticket.property);

  if (!isTemporaryUnitValue(ticket.unit)) {
    setField(data, fieldConfig.unit, ticket.unitName);
  }

  setField(data, fieldConfig.status, ticket.status);

  setField(data, fieldConfig.clockIn, formatCreatorTime(ticket.clockIn));

  setField(data, fieldConfig.clockOut, formatCreatorTime(ticket.clockOut));

  setField(data, fieldConfig.jobType, ticket.jobType);

  setField(data, fieldConfig.date, formatCreatorDate(ticket.date));

  setField(data, fieldConfig.workDetails, ticket.workDetails);

  if (
    Array.isArray(ticket.attachments) &&
    ticket.attachments.length > 0 &&
    fieldConfig.attachmentsSubform &&
    fieldConfig.attachmentSequenceField
  ) {
    data[fieldConfig.attachmentsSubform] = ticket.attachments.map(
      (_, index) => ({
        [fieldConfig.attachmentSequenceField]: String(index + 1),
      }),
    );
  }
}

function buildCreatorPayload(tickets, technicianEmail) {
  const workOrderConfig = config.zoho.workOrder;

  const data = {};

  setField(data, workOrderConfig.emailField, technicianEmail);

  if (tickets[0]) {
    addTicketFields(data, tickets[0], workOrderConfig.tickets.ticket1, false);
  }

  if (tickets[1]) {
    addTicketFields(data, tickets[1], workOrderConfig.tickets.ticket2, true);
  }

  if (tickets[2]) {
    addTicketFields(data, tickets[2], workOrderConfig.tickets.ticket3, true);
  }

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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchRecordWithRetry({
  reportLinkName,
  recordId,
  attachmentsSubformKeys,
}) {
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

    const subformSnapshot = {};
    attachmentsSubformKeys.forEach((key) => {
      subformSnapshot[key] = fetchedRecord?.[key];
    });

    console.log(
      `[Work Order] Re-fetch attempt ${attempt + 1}/${delaysMs.length} for record ${recordId} - subform data:`,
      JSON.stringify(subformSnapshot, null, 2),
    );

    const hasAnyPopulatedSequence = attachmentsSubformKeys.some((key) => {
      const rows = fetchedRecord?.[key];
      return (
        Array.isArray(rows) &&
        rows.some(
          (row) =>
            row &&
            Object.values(row).some(
              (value) =>
                value !== "" &&
                value !== undefined &&
                typeof value !== "object",
            ),
        )
      );
    });

    if (hasAnyPopulatedSequence || attempt === delaysMs.length - 1) {
      return fetchedRecord;
    }
  }

  return null;
}

/**
 * uploadTicketAttachments
 * ----------------------------------------------------------------
 * NEW: now also tracks failedFileNames (the actual original
 * filename of each attachment that failed to upload, or match to a
 * subform row) - used to build a specific "failed to upload: X.jpg,
 * Y.jpg" message instead of just a count. errors[] is kept as-is
 * for detailed backend-console diagnostics.
 * ----------------------------------------------------------------
 */
async function uploadTicketAttachments({ recordId, tickets }) {
  const workOrderConfig = config.zoho.workOrder;

  const ticketConfigs = [
    workOrderConfig.tickets.ticket1,
    workOrderConfig.tickets.ticket2,
    workOrderConfig.tickets.ticket3,
  ];

  const ticketsWithAttachments = tickets
    .map((ticket, index) => ({
      ticket,
      fieldConfig: ticketConfigs[index],
    }))
    .filter(
      ({ ticket }) =>
        Array.isArray(ticket.attachments) && ticket.attachments.length > 0,
    );

  if (ticketsWithAttachments.length === 0) {
    return {
      uploaded: 0,
      failed: 0,
      errors: [],
      failedFileNames: [],
    };
  }

  const attachmentsSubformKeys = ticketsWithAttachments.map(
    ({ fieldConfig }) => fieldConfig.attachmentsSubform,
  );

  const attachmentReportLinkName = config.zoho.reports.workOrder;

  let fetchedRecord;

  try {
    fetchedRecord = await fetchRecordWithRetry({
      reportLinkName: attachmentReportLinkName,
      recordId,
      attachmentsSubformKeys,
    });
  } catch (error) {
    const failedFileNames = ticketsWithAttachments.flatMap(({ ticket }) =>
      ticket.attachments.map(
        (attachment, index) =>
          attachment.originalName || `photo-${index + 1}.jpg`,
      ),
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

  let uploaded = 0;
  const errors = [];
  const failedFileNames = [];

  for (const { ticket, fieldConfig } of ticketsWithAttachments) {
    const subformRows = fetchedRecord?.[fieldConfig.attachmentsSubform];

    if (!Array.isArray(subformRows)) {
      ticket.attachments.forEach((attachment, index) => {
        failedFileNames.push(
          attachment.originalName || `photo-${index + 1}.jpg`,
        );
      });

      errors.push(
        `No subform rows found for ${fieldConfig.attachmentsSubform} on record ${recordId}.`,
      );
      continue;
    }

    for (let index = 0; index < ticket.attachments.length; index += 1) {
      const attachment = ticket.attachments[index];

      const expectedSequence = String(index + 1);

      const fileName =
        attachment.originalName || `photo-${expectedSequence}.jpg`;

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
          `Failed to upload ${fileName} for ${fieldConfig.attachmentsSubform}: ${error?.response?.data?.message || error.message}`,
        );
      }
    }
  }

  return {
    uploaded,
    failed: failedFileNames.length,
    errors,
    failedFileNames,
  };
}

/**
 * markAttachmentSyncComplete
 * ----------------------------------------------------------------
 * NEW - sets the shared Attachment_Sync checkbox field on the
 * parent record, once per whole record (not per ticket), after the
 * upload phase finishes. Per instructions:
 *   - ALWAYS set true if the record had at least one attachment
 *     anywhere (across any of its up-to-3 tickets), REGARDLESS of
 *     whether every individual image upload actually succeeded -
 *     partial failures are surfaced to the user as a UI message
 *     naming the specific failed file(s), not reflected in this
 *     field.
 *   - NEVER sent at all (not even false) when the record had zero
 *     attachments anywhere - Zoho has a workflow tied to this
 *     field, and a record that never had images should not trigger
 *     it.
 * Uses the same Admin_ report link already required for the upload
 * step itself.
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
      "[Work Order] Failed to set Attachment_Sync:",
      error?.response?.data || error.message,
    );

    return false;
  }
}

async function createWorkOrder({ tickets, technicianEmail }) {
  const workOrderConfig = config.zoho.workOrder;

  if (!workOrderConfig.formLinkName) {
    const error = new Error(
      "Zoho Work Order form link name is not configured.",
    );

    error.statusCode = 500;

    throw error;
  }

  const payload = buildCreatorPayload(tickets, technicianEmail);

  console.log(
    "[Work Order] Payload sent to Zoho:",
    JSON.stringify(payload, null, 2),
  );

  const zohoResponse = await creatorRequest(
    "post",
    `/form/${workOrderConfig.formLinkName}`,
    {
      data: payload,
    },
  );

  validateZohoResponse(zohoResponse);

  const recordId = extractRecordId(zohoResponse);

  const attachmentCount = tickets.reduce(
    (total, ticket) => total + (ticket.attachments || []).length,
    0,
  );

  let attachmentUploadStatus = "No attachments supplied.";
  let attachmentUploadResult = {
    uploaded: 0,
    failed: 0,
    errors: [],
    failedFileNames: [],
  };
  let attachmentSyncUpdated = false;

  if (attachmentCount > 0) {
    attachmentUploadResult = await uploadTicketAttachments({
      recordId,
      tickets,
    });

    attachmentUploadStatus =
      attachmentUploadResult.failed === 0
        ? `${attachmentUploadResult.uploaded} of ${attachmentCount} image(s) uploaded successfully.`
        : `${attachmentUploadResult.uploaded} of ${attachmentCount} image(s) uploaded. Failed to upload: ${attachmentUploadResult.failedFileNames.join(", ")}.`;

    if (attachmentUploadResult.errors.length > 0) {
      console.error(
        "[Work Order] Attachment upload errors:",
        attachmentUploadResult.errors,
      );
    }

    // Per instructions: always mark synced once attempted, even if
    // some individual images failed - failures are UI-only. A
    // short delay is added before this specific call, giving Zoho
    // time to fully settle/index the just-uploaded images before
    // the Attachment_Sync update fires - the workflow attached to
    // this field wasn't firing reliably without it.
    await wait(2000);

    attachmentSyncUpdated = await markAttachmentSyncComplete({
      recordId,
      reportLinkName: config.zoho.reports.workOrder,
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
  createWorkOrder,
};
