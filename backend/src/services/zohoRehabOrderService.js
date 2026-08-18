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

/**
 * addEntryFields
 * ----------------------------------------------------------------
 * NEW: pre-creates one subform row PER attachment (sequence number
 * only, image_sequence field) - same pattern proven working on
 * Work Order. The actual image bytes get uploaded separately AFTER
 * the record exists - see uploadEntryAttachments() below.
 * ----------------------------------------------------------------
 */
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

/**
 * fetchRecordWithRetry
 * ----------------------------------------------------------------
 * Same retry-with-delay pattern proven necessary on Work Order -
 * Zoho's subform data isn't always immediately queryable right
 * after Add Record succeeds.
 * ----------------------------------------------------------------
 */
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
 * Mirrors Work Order's uploadTicketAttachments() exactly. Uses
 * config.zoho.reports.rehabOrder ("Admin_All_Rehab_Orders1") for
 * BOTH the re-fetch and the upload call - confirmed via the Work
 * Order fix that the "Admin_" report is the one with full column
 * visibility (subform sequence fields included), unlike the
 * non-admin report used elsewhere.
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
    const totalAttachments = entriesWithAttachments.reduce(
      (total, { order }) => total + order.attachments.length,
      0,
    );

    return {
      uploaded: 0,
      failed: totalAttachments,
      errors: [
        `Could not re-fetch the created record to upload images: ${error.message}`,
      ],
    };
  }

  let uploaded = 0;
  const errors = [];

  for (const { order, fieldConfig } of entriesWithAttachments) {
    const subformRows = fetchedRecord?.[fieldConfig.attachmentsSubform];

    if (!Array.isArray(subformRows)) {
      errors.push(
        `No subform rows found for ${fieldConfig.attachmentsSubform} on record ${recordId}.`,
      );
      continue;
    }

    for (let index = 0; index < order.attachments.length; index += 1) {
      const attachment = order.attachments[index];

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
          `Failed to upload image ${index + 1} for ${fieldConfig.attachmentsSubform}: ${error?.response?.data?.message || error.message}`,
        );
      }
    }
  }

  return {
    uploaded,
    failed: errors.length,
    errors,
  };
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
  };

  if (attachmentCount > 0) {
    attachmentUploadResult = await uploadEntryAttachments({
      recordId,
      orders,
    });

    attachmentUploadStatus =
      attachmentUploadResult.failed === 0
        ? `${attachmentUploadResult.uploaded} of ${attachmentCount} image(s) uploaded successfully.`
        : `${attachmentUploadResult.uploaded} of ${attachmentCount} image(s) uploaded; ${attachmentUploadResult.failed} failed. The Rehab Order itself was still submitted successfully.`;

    if (attachmentUploadResult.errors.length > 0) {
      console.error(
        "[Rehab Order] Attachment upload errors:",
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
  createRehabOrder,
};
