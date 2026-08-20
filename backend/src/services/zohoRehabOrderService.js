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

function addEntryFields(data, order, fieldConfig, enabled, technicianEmail) {
  if (enabled && fieldConfig.enabled) {
    setField(data, fieldConfig.enabled, true);
  }

  setField(data, fieldConfig.property, order.property);

  if (!isTemporaryUnitValue(order.unit)) {
    setField(data, fieldConfig.unit, order.unitName);
  }

  setField(data, fieldConfig.city, order.city);

  setField(data, fieldConfig.rentReady, order.rentReady);

  setField(data, fieldConfig.technicianName, order.technicianName);

  setField(data, fieldConfig.clockIn, formatCreatorTime(order.clockIn));

  setField(data, fieldConfig.clockOut, formatCreatorTime(order.clockOut));

  setField(data, fieldConfig.status, order.status);

  setField(data, fieldConfig.description, order.description);

  /*
   * Rehab Order has a SEPARATE email field per entry (Email /
   * Email1 / Email2), unlike Work Order's single shared field.
   */
  setField(data, fieldConfig.email, technicianEmail);

  setField(data, fieldConfig.date, formatCreatorDate(order.date));

  setField(data, fieldConfig.jobType, order.jobType);

  if (
    Array.isArray(order.attachments) &&
    order.attachments.length > 0 &&
    fieldConfig.attachmentsSubform &&
    fieldConfig.attachmentSequenceField
  ) {
    data[fieldConfig.attachmentsSubform] = order.attachments.map(
      (_, index) => ({
        [fieldConfig.attachmentSequenceField]: String(index + 1),
      }),
    );
  }
}

function buildCreatorPayload(orders, technicianEmail) {
  const rehabConfig = config.zoho.rehabOrder;

  const data = {};

  if (orders[0]) {
    addEntryFields(
      data,
      orders[0],
      rehabConfig.entries.entry1,
      false,
      technicianEmail,
    );
  }

  if (orders[1]) {
    addEntryFields(
      data,
      orders[1],
      rehabConfig.entries.entry2,
      true,
      technicianEmail,
    );
  }

  if (orders[2]) {
    addEntryFields(
      data,
      orders[2],
      rehabConfig.entries.entry3,
      true,
      technicianEmail,
    );
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
      `[Rehab Order] Re-fetch attempt ${attempt + 1}/${delaysMs.length} for record ${recordId} - subform data:`,
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
 * uploadEntryAttachments
 * ----------------------------------------------------------------
 * NEW: now also tracks failedFileNames - used to build a specific
 * "failed to upload: X.jpg, Y.jpg" message instead of just a
 * count.
 * ----------------------------------------------------------------
 */
async function uploadEntryAttachments({ recordId, orders }) {
  const rehabConfig = config.zoho.rehabOrder;

  const entryConfigs = [
    rehabConfig.entries.entry1,
    rehabConfig.entries.entry2,
    rehabConfig.entries.entry3,
  ];

  const entriesWithAttachments = orders
    .map((order, index) => ({
      order,
      fieldConfig: entryConfigs[index],
    }))
    .filter(
      ({ order }) =>
        Array.isArray(order.attachments) && order.attachments.length > 0,
    );

  if (entriesWithAttachments.length === 0) {
    return {
      uploaded: 0,
      failed: 0,
      errors: [],
      failedFileNames: [],
    };
  }

  const attachmentsSubformKeys = entriesWithAttachments.map(
    ({ fieldConfig }) => fieldConfig.attachmentsSubform,
  );

  const attachmentReportLinkName = config.zoho.reports.rehabOrder;

  let fetchedRecord;

  try {
    fetchedRecord = await fetchRecordWithRetry({
      reportLinkName: attachmentReportLinkName,
      recordId,
      attachmentsSubformKeys,
    });
  } catch (error) {
    const failedFileNames = entriesWithAttachments.flatMap(({ order }) =>
      order.attachments.map(
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

  for (const { order, fieldConfig } of entriesWithAttachments) {
    const subformRows = fetchedRecord?.[fieldConfig.attachmentsSubform];

    if (!Array.isArray(subformRows)) {
      order.attachments.forEach((attachment, index) => {
        failedFileNames.push(
          attachment.originalName || `photo-${index + 1}.jpg`,
        );
      });

      errors.push(
        `No subform rows found for ${fieldConfig.attachmentsSubform} on record ${recordId}.`,
      );
      continue;
    }

    for (let index = 0; index < order.attachments.length; index += 1) {
      const attachment = order.attachments[index];

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
 * Same rules as zohoWorkOrderService.js's version - one field per
 * whole record (not per entry). Always set true once ANY entry had
 * attachments, regardless of individual upload success/failure.
 * Never sent when the record has zero attachments anywhere.
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
      "[Rehab Order] Failed to set Attachment_Sync:",
      error?.response?.data || error.message,
    );

    return false;
  }
}

async function createRehabOrder({ orders, technicianEmail }) {
  const rehabConfig = config.zoho.rehabOrder;

  if (!rehabConfig.formLinkName) {
    const error = new Error(
      "Zoho Rehab Order form link name is not configured.",
    );

    error.statusCode = 500;

    throw error;
  }

  const payload = buildCreatorPayload(orders, technicianEmail);

  console.log(
    "[Rehab Order] Payload sent to Zoho:",
    JSON.stringify(payload, null, 2),
  );

  const zohoResponse = await creatorRequest(
    "post",
    `/form/${rehabConfig.formLinkName}`,
    {
      data: payload,
    },
  );

  validateZohoResponse(zohoResponse);

  const recordId = extractRecordId(zohoResponse);

  const attachmentCount = orders.reduce(
    (total, order) => total + (order.attachments || []).length,
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
    attachmentUploadResult = await uploadEntryAttachments({
      recordId,
      orders,
    });

    attachmentUploadStatus =
      attachmentUploadResult.failed === 0
        ? `${attachmentUploadResult.uploaded} of ${attachmentCount} image(s) uploaded successfully.`
        : `${attachmentUploadResult.uploaded} of ${attachmentCount} image(s) uploaded. Failed to upload: ${attachmentUploadResult.failedFileNames.join(", ")}.`;

    if (attachmentUploadResult.errors.length > 0) {
      console.error(
        "[Rehab Order] Attachment upload errors:",
        attachmentUploadResult.errors,
      );
    }

    // Same 8-second delay as Work Order/Move Out - gives Zoho time
    // to settle the just-uploaded images before the Attachment_Sync
    // update fires, which the attached workflow needs to see
    // reliably.
    await wait(2000);

    attachmentSyncUpdated = await markAttachmentSyncComplete({
      recordId,
      reportLinkName: config.zoho.reports.rehabOrder,
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
  createRehabOrder,
};
