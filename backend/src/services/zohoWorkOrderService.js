const FormData = require('form-data');

const config = require(
  '../config/env'
);

const {
  creatorRequest,
  creatorUploadFile,
} = require(
  './zohoCreatorService'
);

function setField(
  data,
  fieldName,
  value
) {
  if (
    !fieldName ||
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return;
  }

  data[fieldName] = value;
}

function isTemporaryUnitValue(
  value
) {
  return String(value || '')
    .startsWith('TEMP_');
}

function formatCreatorDate(
  value
) {
  if (!value) {
    return '';
  }

  const match =
    String(value).match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (!match) {
    return value;
  }

  const [, year, month, day] =
    match;

  return `${month}/${day}/${year}`;
}

function formatCreatorTime(
  value
) {
  if (!value) {
    return '';
  }

  const cleanValue =
    String(value).trim();

  if (
    /am|pm/i.test(cleanValue)
  ) {
    return cleanValue.toLowerCase();
  }

  const match =
    cleanValue.match(
      /^(\d{1,2}):(\d{2})$/
    );

  if (!match) {
    return cleanValue;
  }

  let hour =
    Number(match[1]);

  const minute =
    match[2];

  const meridiem =
    hour >= 12
      ? 'pm'
      : 'am';

  hour %= 12;

  if (hour === 0) {
    hour = 12;
  }

  return `${hour}:${minute} ${meridiem}`;
}

function addTicketFields(
  data,
  ticket,
  fieldConfig,
  enabled
) {
  if (
    enabled &&
    fieldConfig.enabled
  ) {
    setField(
      data,
      fieldConfig.enabled,
      true
    );
  }

  setField(
    data,
    fieldConfig.ticketId,
    ticket.ticketId
  );

  setField(
    data,
    fieldConfig.city,
    ticket.city
  );

  setField(
    data,
    fieldConfig.technicianName,
    ticket.technicianName
  );

  setField(
    data,
    fieldConfig.property,
    ticket.property
  );

  if (
    !isTemporaryUnitValue(
      ticket.unit
    )
  ) {
    setField(
      data,
      fieldConfig.unit,
      ticket.unitName
    );
  }

  setField(
    data,
    fieldConfig.status,
    ticket.status
  );

  setField(
    data,
    fieldConfig.clockIn,
    formatCreatorTime(
      ticket.clockIn
    )
  );

  setField(
    data,
    fieldConfig.clockOut,
    formatCreatorTime(
      ticket.clockOut
    )
  );

  setField(
    data,
    fieldConfig.jobType,
    ticket.jobType
  );

  setField(
    data,
    fieldConfig.date,
    formatCreatorDate(
      ticket.date
    )
  );

  setField(
    data,
    fieldConfig.workDetails,
    ticket.workDetails
  );

  if (
    Array.isArray(ticket.attachments) &&
    ticket.attachments.length > 0 &&
    fieldConfig.attachmentsSubform &&
    fieldConfig.attachmentSequenceField
  ) {
    data[fieldConfig.attachmentsSubform] =
      ticket.attachments.map((_, index) => ({
        [fieldConfig.attachmentSequenceField]:
          String(index + 1),
      }));
  }
}

function buildCreatorPayload(
  tickets,
  technicianEmail
) {
  const workOrderConfig =
    config.zoho.workOrder;

  const data = {};

  setField(
    data,
    workOrderConfig.emailField,
    technicianEmail
  );

  if (tickets[0]) {
    addTicketFields(
      data,
      tickets[0],
      workOrderConfig
        .tickets
        .ticket1,
      false
    );
  }

  if (tickets[1]) {
    addTicketFields(
      data,
      tickets[1],
      workOrderConfig
        .tickets
        .ticket2,
      true
    );
  }

  if (tickets[2]) {
    addTicketFields(
      data,
      tickets[2],
      workOrderConfig
        .tickets
        .ticket3,
      true
    );
  }

  return {
    data,
  };
}

function validateZohoResponse(
  zohoResponse
) {
  if (!zohoResponse) {
    const error =
      new Error(
        'Zoho Creator returned an empty response.'
      );

    error.statusCode = 502;

    throw error;
  }

  if (
    Number(zohoResponse.code) !==
    3000
  ) {
    const messages =
      Array.isArray(
        zohoResponse.error
      )
        ? zohoResponse.error
        : [
            zohoResponse.message ||
            'Unknown Zoho Creator error.',
          ];

    const error =
      new Error(
        messages.join(', ')
      );

    error.statusCode = 400;
    error.zohoResponse =
      zohoResponse;

    throw error;
  }
}

function extractRecordId(
  zohoResponse
) {
  if (
    Array.isArray(
      zohoResponse?.data
    )
  ) {
    return (
      zohoResponse.data[0]?.ID ||
      zohoResponse.data[0]?.id ||
      zohoResponse.data[0]
        ?.details?.id ||
      null
    );
  }

  return (
    zohoResponse?.data?.ID ||
    zohoResponse?.data?.id ||
    zohoResponse?.data
      ?.details?.id ||
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
 * NEW - re-fetching the just-created record immediately (0ms
 * delay) may hit Zoho before its subform data is fully queryable
 * yet (a brief server-side indexing delay after Add Record
 * succeeds, before a Get Record call reflects the subform rows
 * with all field values populated). This retries a few times with
 * a short growing delay, and logs exactly what it sees each
 * attempt - so if this ISN'T the actual cause, that will be
 * directly visible in the backend terminal without needing another
 * manual curl round-trip.
 * ----------------------------------------------------------------
 */
async function fetchRecordWithRetry({
  reportLinkName,
  recordId,
  attachmentsSubformKeys,
}) {
  const delaysMs = [800, 1500, 2500];

  for (
    let attempt = 0;
    attempt < delaysMs.length;
    attempt += 1
  ) {
    // eslint-disable-next-line no-await-in-loop
    await wait(delaysMs[attempt]);

    // eslint-disable-next-line no-await-in-loop
    const recordResponse =
      await creatorRequest(
        'get',
        `/report/${reportLinkName}/${recordId}`
      );

    const fetchedRecord =
      recordResponse?.data;

    const subformSnapshot = {};
    attachmentsSubformKeys.forEach(
      (key) => {
        subformSnapshot[key] =
          fetchedRecord?.[key];
      }
    );

    console.log(
      `[Work Order] Re-fetch attempt ${attempt + 1}/${delaysMs.length} for record ${recordId} - subform data:`,
      JSON.stringify(subformSnapshot, null, 2)
    );

    const hasAnyPopulatedSequence =
      attachmentsSubformKeys.some(
        (key) => {
          const rows =
            fetchedRecord?.[key];
          return (
            Array.isArray(rows) &&
            rows.some(
              (row) =>
                row &&
                Object.values(row).some(
                  (value) =>
                    value !== '' &&
                    value !== undefined &&
                    typeof value !==
                      'object'
                )
            )
          );
        }
      );

    if (
      hasAnyPopulatedSequence ||
      attempt === delaysMs.length - 1
    ) {
      return fetchedRecord;
    }
  }

  return null;
}

/**
 * uploadTicketAttachments
 * ----------------------------------------------------------------
 * Now retries the record re-fetch with short delays (see
 * fetchRecordWithRetry above) instead of a single immediate
 * attempt, and logs the subform snapshot on every attempt directly
 * to the backend terminal for diagnosis.
 * ----------------------------------------------------------------
 */
async function uploadTicketAttachments({
  recordId,
  tickets,
}) {
  const workOrderConfig =
    config.zoho.workOrder;

  const ticketConfigs = [
    workOrderConfig.tickets.ticket1,
    workOrderConfig.tickets.ticket2,
    workOrderConfig.tickets.ticket3,
  ];

  const ticketsWithAttachments =
    tickets
      .map((ticket, index) => ({
        ticket,
        fieldConfig:
          ticketConfigs[index],
      }))
      .filter(
        ({ ticket }) =>
          Array.isArray(
            ticket.attachments
          ) &&
          ticket.attachments.length >
            0
      );

  if (
    ticketsWithAttachments.length ===
    0
  ) {
    return {
      uploaded: 0,
      failed: 0,
      errors: [],
    };
  }

  const attachmentsSubformKeys =
    ticketsWithAttachments.map(
      ({ fieldConfig }) =>
        fieldConfig.attachmentsSubform
    );

  /*
   * FIX: use config.zoho.reports.workOrder ("Admin_All_Work_Orders")
   * for BOTH the re-fetch and the upload call below, NOT
   * workOrderConfig.reportLinkName ("All_Work_Orders"). Confirmed
   * via a manual curl test that Admin_All_Work_Orders correctly
   * returns the Attachments subform's image_sequence field, while
   * All_Work_Orders silently omits it entirely - the same class of
   * bug already found once during the Reports feature work: Zoho's
   * Get Records API only returns fields configured as VISIBLE
   * COLUMNS in that specific report, not automatically everything
   * on the form/subform.
   */
  const attachmentReportLinkName =
    config.zoho.reports.workOrder;

  let fetchedRecord;

  try {
    fetchedRecord =
      await fetchRecordWithRetry({
        reportLinkName:
          attachmentReportLinkName,
        recordId,
        attachmentsSubformKeys,
      });
  } catch (error) {
    const totalAttachments =
      ticketsWithAttachments.reduce(
        (total, { ticket }) =>
          total +
          ticket.attachments
            .length,
        0
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

  for (const {
    ticket,
    fieldConfig,
  } of ticketsWithAttachments) {
    const subformRows =
      fetchedRecord?.[
        fieldConfig
          .attachmentsSubform
      ];

    if (!Array.isArray(subformRows)) {
      errors.push(
        `No subform rows found for ${fieldConfig.attachmentsSubform} on record ${recordId}.`
      );
      continue;
    }

    for (
      let index = 0;
      index <
      ticket.attachments.length;
      index += 1
    ) {
      const attachment =
        ticket.attachments[index];

      const expectedSequence =
        String(index + 1);

      const matchingRow =
        subformRows.find(
          (row) =>
            String(
              row[
                fieldConfig
                  .attachmentSequenceField
              ]
            ) === expectedSequence
        );

      if (!matchingRow) {
        errors.push(
          `Could not find a matching subform row for sequence ${expectedSequence} in ${fieldConfig.attachmentsSubform}.`
        );
        continue;
      }

      try {
        const formData =
          new FormData();

        formData.append(
          'file',
          attachment.buffer,
          {
            filename:
              attachment.originalName ||
              `photo-${expectedSequence}.jpg`,
            contentType:
              attachment.mimeType ||
              'image/jpeg',
          }
        );

        await creatorUploadFile(
          `/report/${attachmentReportLinkName}/${recordId}/${fieldConfig.attachmentsSubform}.${fieldConfig.attachmentField}/${matchingRow.ID}/upload`,
          formData
        );

        uploaded += 1;
      } catch (error) {
        errors.push(
          `Failed to upload image ${index + 1} for ${fieldConfig.attachmentsSubform}: ${error?.response?.data?.message || error.message}`
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

async function createWorkOrder({
  tickets,
  technicianEmail,
}) {
  const workOrderConfig =
    config.zoho.workOrder;

  if (
    !workOrderConfig
      .formLinkName
  ) {
    const error =
      new Error(
        'Zoho Work Order form link name is not configured.'
      );

    error.statusCode = 500;

    throw error;
  }

  const payload =
    buildCreatorPayload(
      tickets,
      technicianEmail
    );

  console.log(
    '[Work Order] Payload sent to Zoho:',
    JSON.stringify(
      payload,
      null,
      2
    )
  );

    const zohoResponse =
    await creatorRequest(
      'post',
      `/form/${workOrderConfig.formLinkName}`,
      {
        data: payload,
      }
    );

  validateZohoResponse(
    zohoResponse
  );

  const recordId =
    extractRecordId(
      zohoResponse
    );

  const attachmentCount =
    tickets.reduce(
      (total, ticket) =>
        total +
        (
          ticket.attachments ||
          []
        ).length,
      0
    );

  let attachmentUploadStatus =
    'No attachments supplied.';
  let attachmentUploadResult = {
    uploaded: 0,
    failed: 0,
    errors: [],
  };

  if (attachmentCount > 0) {
    attachmentUploadResult =
      await uploadTicketAttachments(
        {
          recordId,
          tickets,
        }
      );

    attachmentUploadStatus =
      attachmentUploadResult.failed ===
      0
        ? `${attachmentUploadResult.uploaded} of ${attachmentCount} image(s) uploaded successfully.`
        : `${attachmentUploadResult.uploaded} of ${attachmentCount} image(s) uploaded; ${attachmentUploadResult.failed} failed. The Work Order itself was still submitted successfully.`;

    if (
      attachmentUploadResult.errors
        .length > 0
    ) {
      console.error(
        '[Work Order] Attachment upload errors:',
        attachmentUploadResult.errors
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
  createWorkOrder,
};