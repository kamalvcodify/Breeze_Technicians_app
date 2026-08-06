const config = require(
  '../config/env'
);

const {
  creatorRequest,
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

  /*
   * Temporary Unit values are UI-only and must not be sent to Zoho.
   */
  if (
    !isTemporaryUnitValue(
      ticket.unit
    )
  ) {
    setField(
      data,
      fieldConfig.unit,
      ticket.unit
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

  return {
    recordId,

    zohoResponse,

    attachmentUploadStatus:
      attachmentCount === 0
        ? 'No attachments supplied.'
        : 'Files were received by the backend, but Zoho attachment upload is pending.',
  };
}

module.exports = {
  createWorkOrder,
};