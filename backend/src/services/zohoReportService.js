const axios = require("axios");

const config = require("../config/env");

const { creatorRequest } = require("./zohoCreatorService");
const { getAccessToken } = require("./zohoAuthService");

/**
 * services/zohoReportService.js
 * ----------------------------------------------------------------
 * ONE generic report-fetching engine for all 5 reports.
 *
 * IMAGE HANDLING (FIX): earlier version tried to fetch the raw
 * string in each subform row's Image field directly - that string
 * turned out NOT to be a working download path (404s). Zoho's
 * actual documented Download File from Subform API instead
 * CONSTRUCTS the download URL from pieces we already have:
 *   /creator/v2.1/data/<owner>/<app>/report/<reportLinkName>/
 *     <recordId>/<subformName>.<fieldName>/<subformRecordId>/download
 * This is the exact same URL SHAPE already confirmed working for
 * the Upload File API (just swap "upload" for "download", GET
 * instead of POST) - see zohoCreatorService.js's creatorUploadFile.
 *
 * So extractAttachmentImageRefs() below no longer returns raw
 * strings - it returns structured {reportLinkName, recordId,
 * subformName, fieldName, subformRecordId} objects, one per
 * subform row that actually has a non-empty image value. The
 * frontend sends these exact fields to GET /api/reports/image,
 * which reconstructs the same download URL server-side and
 * fetches the bytes with the OAuth token (see fetchImageAsDataUri
 * below), returning a base64 data URI - no client ever needs a
 * Zoho token or touches Zoho directly.
 * ----------------------------------------------------------------
 */

const FIELD_LABELS = {
  ticketId: "Ticket ID",
  city: "City",
  technicianName: "Technician Name",
  property: "Property",
  unit: "Unit",
  status: "Status",
  clockIn: "Clock In",
  clockOut: "Clock Out",
  jobType: "Job Type",
  date: "Date",
  workDetails: "Work Details",
  rentReady: "Rent Ready",
  description: "Description",
  email: "Email",
  finalStatus: "Final Status",
  dateOfInspection: "Date of Inspection",
  notes: "Notes",
  action: "Action",
  quantityDesired: "Quantity Desired",
  quantityReturned: "Quantity Returned",
  partCode: "Part Code",
  partsInventory: "Parts Inventory",
  workOrder: "Work Order",
  dateTime: "Date/Time",
};

const NON_DISPLAY_KEYS = [
  "enabled",
  "attachmentField",
  "attachmentsSubform",
  "topLevelAttachmentField",
  "attachmentSequenceField",
  "qrScan",
];

function labelFor(internalKey) {
  return FIELD_LABELS[internalKey] || internalKey;
}

function extractDisplayValue(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (Array.isArray(value)) {
    return "";
  }

  if (typeof value === "object") {
    if (value.zc_display_value) {
      return String(value.zc_display_value);
    }

    return "";
  }

  return String(value);
}

/**
 * extractAttachmentImageRefs
 * ----------------------------------------------------------------
 * NEW SHAPE: returns structured references, NOT raw path strings -
 * see the file-level comment above for why. Only subform rows with
 * a genuinely non-empty image value are included.
 * ----------------------------------------------------------------
 */
function extractAttachmentImageRefs(record, fieldConfig, reportLinkName) {
  if (!fieldConfig.attachmentsSubform || !fieldConfig.attachmentField) {
    return [];
  }

  const subformRows = record[fieldConfig.attachmentsSubform];

  if (!Array.isArray(subformRows)) {
    return [];
  }

  const recordId = record.ID || record.id;

  return subformRows
    .filter((row) => !!row[fieldConfig.attachmentField])
    .map((row) => ({
      reportLinkName,
      recordId,
      subformName: fieldConfig.attachmentsSubform,
      fieldName: fieldConfig.attachmentField,
      subformRecordId: row.ID,
    }));
}

function extractGroupFields(record, fieldMap) {
  const fields = [];

  Object.keys(fieldMap).forEach((internalKey) => {
    if (NON_DISPLAY_KEYS.includes(internalKey)) {
      return;
    }

    const zohoFieldName = fieldMap[internalKey];

    if (!zohoFieldName) {
      return;
    }

    const value = extractDisplayValue(record[zohoFieldName]);

    if (!value) {
      return;
    }

    fields.push({
      label: labelFor(internalKey),
      value,
    });
  });

  return fields;
}

function isGroupPresent(record, fieldMap) {
  if (fieldMap.enabled) {
    const enabledValue = record[fieldMap.enabled];
    return enabledValue === true || enabledValue === "true";
  }

  return true;
}

function buildGroups(record, groupDefs, reportLinkName) {
  const groups = [];

  groupDefs.forEach((groupDef) => {
    if (!isGroupPresent(record, groupDef.fields)) {
      return;
    }

    groups.push({
      title: groupDef.title,
      fields: extractGroupFields(record, groupDef.fields),
      images: extractAttachmentImageRefs(record, groupDef.fields, reportLinkName),
    });
  });

  return groups;
}

/* ------------------------------------------------------------------
 * Per-report row builders - all now take reportLinkName as a second
 * argument, needed to build correct image download references.
 * ------------------------------------------------------------------ */

function buildWorkOrderRow(record, reportLinkName) {
  const workOrderConfig = config.zoho.workOrder;
  const ticket1 = workOrderConfig.tickets.ticket1;

  const groups = buildGroups(
    record,
    [
      { title: "Ticket 1", fields: ticket1 },
      { title: "Ticket 2", fields: workOrderConfig.tickets.ticket2 },
      { title: "Ticket 3", fields: workOrderConfig.tickets.ticket3 },
    ],
    reportLinkName
  );

  return {
    id: record.ID || record.id,
    summary: {
      col1: extractDisplayValue(record[ticket1.ticketId]),
      col2: extractDisplayValue(record[ticket1.city]),
      col3: extractDisplayValue(record[ticket1.date]),
    },
    groups,
  };
}

function buildRehabOrderRow(record, reportLinkName) {
  const rehabConfig = config.zoho.rehabOrder;
  const entry1 = rehabConfig.entries.entry1;

  const groups = buildGroups(
    record,
    [
      { title: "Rehab Order", fields: entry1 },
      { title: "Rehab2", fields: rehabConfig.entries.entry2 },
      { title: "Rehab3", fields: rehabConfig.entries.entry3 },
    ],
    reportLinkName
  );

  const propertyUnit = [
    extractDisplayValue(record[entry1.property]),
    extractDisplayValue(record[entry1.unit]),
  ]
    .filter(Boolean)
    .join(" / ");

  return {
    id: record.ID || record.id,
    summary: {
      col1: propertyUnit,
      col2: extractDisplayValue(record[entry1.status]),
      col3: extractDisplayValue(record[entry1.date]),
    },
    groups,
  };
}

function buildCheckInOutRow(record, reportLinkName) {
  const fields = config.zoho.checkInOut.fields;

  const groups = [
    {
      title: "Entry",
      fields: extractGroupFields(record, fields),
      images: extractAttachmentImageRefs(record, fields, reportLinkName),
    },
  ];

  return {
    id: record.ID || record.id,
    summary: {
      col1: extractDisplayValue(record[fields.partCode]),
      col2: extractDisplayValue(record[fields.action]),
      col3: extractDisplayValue(record[fields.dateTime]),
    },
    groups,
  };
}

function buildMoveOutRow(record, reportLinkName) {
  const fields = config.zoho.moveOut.fields;

  const groups = [
    {
      title: "Move Out",
      fields: extractGroupFields(record, fields),
      images: extractAttachmentImageRefs(record, fields, reportLinkName),
    },
  ];

  const propertyUnit = [
    extractDisplayValue(record[fields.property]),
    extractDisplayValue(record[fields.unit]),
  ]
    .filter(Boolean)
    .join(" / ");

  return {
    id: record.ID || record.id,
    summary: {
      col1: propertyUnit,
      col2: extractDisplayValue(record[fields.finalStatus]),
      col3: extractDisplayValue(record[fields.dateOfInspection]),
    },
    groups,
  };
}

function buildRentReadyChecklistRow(record, reportLinkName) {
  const rentReadyConfig = config.zoho.rentReadyChecklist;
  const fields = rentReadyConfig.fields;

  const groups = [
    {
      title: "Checklist Info",
      fields: extractGroupFields(record, fields),
      images: extractAttachmentImageRefs(record, fields, reportLinkName),
    },
  ];

  const checklist = {};

  Object.keys(rentReadyConfig.checklist).forEach((shortKey) => {
    const zohoFieldName = rentReadyConfig.checklist[shortKey];
    const value = record[zohoFieldName];
    checklist[shortKey] = value === true || value === "true";
  });

  const propertyUnit = [
    extractDisplayValue(record[fields.property]),
    extractDisplayValue(record[fields.unit]),
  ]
    .filter(Boolean)
    .join(" / ");

  return {
    id: record.ID || record.id,
    summary: {
      col1: propertyUnit,
      col2: extractDisplayValue(record[fields.rentReady]),
      col3: extractDisplayValue(record[fields.dateTime]),
    },
    groups,
    checklist,
  };
}

/* ------------------------------------------------------------------
 * Report registry
 * ------------------------------------------------------------------ */

const REPORT_DEFINITIONS = {
  workOrder: {
    reportLinkName: () => config.zoho.reports.workOrder,
    emailField: () => config.zoho.workOrder.emailField,
    buildRow: buildWorkOrderRow,
    columns: ["Ticket ID", "City", "Date"],
  },
  rehabOrder: {
    reportLinkName: () => config.zoho.reports.rehabOrder,
    emailField: () => config.zoho.rehabOrder.entries.entry1.email,
    buildRow: buildRehabOrderRow,
    columns: ["Property/Unit", "Status", "Date"],
  },
  checkInOut: {
    reportLinkName: () => config.zoho.reports.checkInOut,
    emailField: () => config.zoho.checkInOut.fields.email,
    buildRow: buildCheckInOutRow,
    columns: ["Part Code", "Action", "Date"],
  },
  moveOut: {
    reportLinkName: () => config.zoho.reports.moveOut,
    emailField: () => config.zoho.moveOut.fields.email,
    buildRow: buildMoveOutRow,
    columns: ["Property/Unit", "Final Status", "Date"],
  },
  rentReadyChecklist: {
    reportLinkName: () => config.zoho.reports.rentReadyChecklist,
    emailField: () => config.zoho.rentReadyChecklist.fields.email,
    buildRow: buildRentReadyChecklistRow,
    columns: ["Property/Unit", "Rent Ready", "Date"],
  },
};

async function fetchReport(reportKey, technicianEmail, isAdmin = false) {
  const reportDef = REPORT_DEFINITIONS[reportKey];

  if (!reportDef) {
    const error = new Error(`Unknown report: ${reportKey}`);
    error.statusCode = 404;
    throw error;
  }

  const reportLinkName = reportDef.reportLinkName();

  if (!reportLinkName) {
    const error = new Error(
      `Report "${reportKey}" is missing its report link name configuration.`,
    );
    error.statusCode = 500;
    throw error;
  }

  const params = {};

  if (!isAdmin) {
    const emailField = reportDef.emailField();

    if (!emailField) {
      const error = new Error(
        `Report "${reportKey}" is missing its email field configuration.`,
      );
      error.statusCode = 500;
      throw error;
    }

    params.criteria = `(${emailField} == "${technicianEmail}")`;
  }

  let records = [];

  try {
    const response = await creatorRequest("get", `/report/${reportLinkName}`, {
      params,
    });

    records = Array.isArray(response?.data) ? response.data : [];
  } catch (error) {
    const zohoErrorCode = error?.response?.data?.code;

    if (zohoErrorCode === 9280) {
      records = [];
    } else {
      throw error;
    }
  }

  return {
    columns: reportDef.columns,
    rows: records.map((record) => reportDef.buildRow(record, reportLinkName)),
  };
}

/**
 * fetchImageAsDataUri
 * ----------------------------------------------------------------
 * FIX: now CONSTRUCTS the download URL from the structured
 * reference (reportLinkName/recordId/subformName/fieldName/
 * subformRecordId) using Zoho's documented Download File from
 * Subform API shape - exactly the same shape already confirmed
 * working for the Upload File API, just GET + "/download" instead
 * of POST + "/upload":
 *   /creator/v2.1/data/<owner>/<app>/report/<reportLinkName>/
 *     <recordId>/<subformName>.<fieldName>/<subformRecordId>/download
 * ----------------------------------------------------------------
 */
async function fetchImageAsDataUri({
  reportLinkName,
  recordId,
  subformName,
  fieldName,
  subformRecordId,
}) {
  if (!reportLinkName || !recordId || !subformName || !fieldName || !subformRecordId) {
    const error = new Error("Missing required image reference parameters.");
    error.statusCode = 400;
    throw error;
  }

  const accessToken = await getAccessToken();

  const url =
    `${config.zoho.apiDomain}/creator/v2.1/data/${config.zoho.ownerName}/` +
    `${config.zoho.appLinkName}/report/${reportLinkName}/${recordId}/` +
    `${subformName}.${fieldName}/${subformRecordId}/download`;

  const response = await axios.get(url, {
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
    },
    responseType: "arraybuffer",
  });

  const contentType = response.headers["content-type"] || "image/jpeg";
  const base64 = Buffer.from(response.data).toString("base64");

  return `data:${contentType};base64,${base64}`;
}

module.exports = {
  fetchReport,
  fetchImageAsDataUri,
  REPORT_DEFINITIONS,
};