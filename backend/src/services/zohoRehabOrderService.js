const config = require(
  '../config/env'
);

const {
  creatorRequest,
} = require(
  './zohoCreatorService'
);

/**
 * services/zohoRehabOrderService.js
 * ----------------------------------------------------------------
 * Mirrors zohoWorkOrderService.js's structure exactly - same
 * setField/date/time formatting helpers, same enable-flag pattern
 * for entries 2/3, same validate/extract-record-id logic. The only
 * structural difference: Work Order has ONE shared top-level email
 * field for the whole submission, but Rehab Order has a SEPARATE
 * email field API name per entry (Email / Email1 / Email2), so the
 * technician's email is written into whichever entry-specific field
 * is present for each entry actually submitted.
 *
 * Per instructions: Zoho attachment/Image upload is intentionally
 * NOT wired up yet - attachments are accepted from the frontend but
 * not sent to Zoho at all right now.
 * ----------------------------------------------------------------
 */

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

function addEntryFields(
  data,
  order,
  fieldConfig,
  enabled,
  technicianEmail
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
    fieldConfig.property,
    order.property
  );

  /*
   * Temporary Unit values are UI-only and must not be sent to Zoho.
   */
  if (
    !isTemporaryUnitValue(
      order.unit
    )
  ) {
    setField(
      data,
      fieldConfig.unit,
      order.unit
    );
  }

  setField(
    data,
    fieldConfig.city,
    order.city
  );

  setField(
    data,
    fieldConfig.rentReady,
    order.rentReady
  );

  setField(
    data,
    fieldConfig.technicianName,
    order.technicianName
  );

  setField(
    data,
    fieldConfig.clockIn,
    formatCreatorTime(
      order.clockIn
    )
  );

  setField(
    data,
    fieldConfig.clockOut,
    formatCreatorTime(
      order.clockOut
    )
  );

  setField(
    data,
    fieldConfig.status,
    order.status
  );

  setField(
    data,
    fieldConfig.description,
    order.description
  );

  /*
   * Rehab Order has a SEPARATE email field per entry (Email /
   * Email1 / Email2), unlike Work Order's single shared field.
   */
  setField(
    data,
    fieldConfig.email,
    technicianEmail
  );

  setField(
    data,
    fieldConfig.date,
    formatCreatorDate(
      order.date
    )
  );

  setField(
    data,
    fieldConfig.jobType,
    order.jobType
  );
}

function buildCreatorPayload(
  orders,
  technicianEmail
) {
  const rehabConfig =
    config.zoho.rehabOrder;

  const data = {};

  if (orders[0]) {
    addEntryFields(
      data,
      orders[0],
      rehabConfig
        .entries
        .entry1,
      false,
      technicianEmail
    );
  }

  if (orders[1]) {
    addEntryFields(
      data,
      orders[1],
      rehabConfig
        .entries
        .entry2,
      true,
      technicianEmail
    );
  }

  if (orders[2]) {
    addEntryFields(
      data,
      orders[2],
      rehabConfig
        .entries
        .entry3,
      true,
      technicianEmail
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

async function createRehabOrder({
  orders,
  technicianEmail,
}) {
  const rehabConfig =
    config.zoho.rehabOrder;

  if (
    !rehabConfig
      .formLinkName
  ) {
    const error =
      new Error(
        'Zoho Rehab Order form link name is not configured.'
      );

    error.statusCode = 500;

    throw error;
  }

  const payload =
    buildCreatorPayload(
      orders,
      technicianEmail
    );

  console.log(
    '[Rehab Order] Payload sent to Zoho:',
    JSON.stringify(
      payload,
      null,
      2
    )
  );

  const zohoResponse =
    await creatorRequest(
      'post',
      `/form/${rehabConfig.formLinkName}`,
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
    orders.reduce(
      (total, order) =>
        total +
        (
          order.attachments ||
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
        : 'Attachments were received by the backend, but Zoho attachment upload is not yet implemented for Rehab Order.',
  };
}

module.exports = {
  createRehabOrder,
};