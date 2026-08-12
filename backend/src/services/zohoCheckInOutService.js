const config = require(
  '../config/env'
);

const {
  creatorRequest,
} = require(
  './zohoCreatorService'
);

/**
 * services/zohoCheckInOutService.js
 * ----------------------------------------------------------------
 * Mirrors zohoWorkOrderService.js / zohoRehabOrderService.js's
 * structure and helpers, but single-entry (no T1/T2/T3 repeat
 * pattern) since this form only ever submits one record at a time.
 *
 * Rehab Unit is DELIBERATELY EXCLUDED from the payload for now
 * (per instructions) - the field name is captured in env.js for
 * when it's ready, but addCheckInOutFields() never references it.
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

/**
 * The frontend sends a single combined ISO datetime string (from
 * DateTimeCombinedField.js) - split it into a date part and a time
 * part, then format each with the same helpers used elsewhere, and
 * join them the way Zoho Creator expects a DateTime field's value
 * ("MM/DD/YYYY hh:mm am/pm").
 */
function formatCreatorDateTime(
  isoValue
) {
  if (!isoValue) {
    return '';
  }

  const dateObject =
    new Date(isoValue);

  if (
    Number.isNaN(
      dateObject.getTime()
    )
  ) {
    return '';
  }

  const datePart =
    formatCreatorDate(
      `${dateObject.getFullYear()}-` +
      `${String(
        dateObject.getMonth() + 1
      ).padStart(2, '0')}-` +
      `${String(
        dateObject.getDate()
      ).padStart(2, '0')}`
    );

  const timePart =
    formatCreatorTime(
      `${String(
        dateObject.getHours()
      ).padStart(2, '0')}:` +
      `${String(
        dateObject.getMinutes()
      ).padStart(2, '0')}`
    );

  return `${datePart} ${timePart}`;
}

function addCheckInOutFields(
  data,
  entry,
  fieldConfig
) {
//   setField(
//     data,
//     fieldConfig.qrScan,
//     entry.qrScanValue
//   );

  setField(
    data,
    fieldConfig.technicianName,
    entry.technicianName
  );

  setField(
    data,
    fieldConfig.property,
    entry.property
  );

  /*
   * Rehab Unit is intentionally NOT sent yet - see the comment
   * block at the top of this file.
   */

  setField(
    data,
    fieldConfig.workOrder,
    entry.workOrder
  );

  setField(
    data,
    fieldConfig.dateTime,
    formatCreatorDateTime(
      entry.dateTime
    )
  );

  setField(
    data,
    fieldConfig.notes,
    entry.notes
  );

  setField(
    data,
    fieldConfig.email,
    entry.email
  );

  setField(
    data,
    fieldConfig.jobType,
    entry.jobType
  );

  setField(
    data,
    fieldConfig.city,
    entry.city
  );

  setField(
    data,
    fieldConfig.action,
    entry.action
  );

  setField(
    data,
    fieldConfig.quantityDesired,
    entry.quantityDesired
  );

  setField(
    data,
    fieldConfig.quantityReturned,
    entry.quantityReturned
  );

  setField(
    data,
    fieldConfig.partCode,
    entry.partCode
  );

  setField(
    data,
    fieldConfig.partsInventory,
    entry.partsInventory
  );
}

function buildCreatorPayload(
  entry
) {
  const checkInOutConfig =
    config.zoho.checkInOut;

  const data = {};

  addCheckInOutFields(
    data,
    entry,
    checkInOutConfig.fields
  );

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

async function createCheckInOutEntry({
  entry,
}) {
  const checkInOutConfig =
    config.zoho.checkInOut;

  if (
    !checkInOutConfig
      .formLinkName
  ) {
    const error =
      new Error(
        'Zoho Check In/Check Out form link name is not configured.'
      );

    error.statusCode = 500;

    throw error;
  }

  const payload =
    buildCreatorPayload(entry);

  console.log(
    '[Check In/Check Out] Payload sent to Zoho:',
    JSON.stringify(
      payload,
      null,
      2
    )
  );

  const zohoResponse =
    await creatorRequest(
      'post',
      `/form/${checkInOutConfig.formLinkName}`,
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

  return {
    recordId,
    zohoResponse,
  };
}

module.exports = {
  createCheckInOutEntry,
};