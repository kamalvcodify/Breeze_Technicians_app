const config = require("../config/env");

const { creatorRequest } = require("./zohoCreatorService");

/**
 * services/zohoReportService.js
 * ----------------------------------------------------------------
 * ONE generic report-fetching engine for all 5 reports, instead of
 * 5 separate service files. Reuses the exact field-name mappings
 * already built for each form's SUBMISSION (ticketFields,
 * rehabTicketFields, checkInOut.fields, moveOut.fields,
 * rentReadyChecklist.fields/.checklist in env.js) - nothing is
 * re-typed here.
 *
 * Attachments are intentionally NOT read/returned anywhere in this
 * file, per instructions to skip that for now.
 *
 * Filtering: each report is filtered to the requesting
 * technician's own records via a Zoho Creator "criteria" query on
 * one email field. For Work Order this is the shared top-level
 * Email field; for Rehab Order (which has 3 separate email fields,
 * one per entry) this uses Entry 1's Email field only, since all
 * three are populated with the same value at submission time.
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

// Keys that exist in a field-mapping object but should never be
// shown as a display row (internal bookkeeping / attachments).
const NON_DISPLAY_KEYS = [
  "enabled",
  "attachmentField",
  "attachmentsSubform",
  "topLevelAttachmentField",
  "qrScan",
];

function labelFor(internalKey) {
  return FIELD_LABELS[internalKey] || internalKey;
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

    const value = record[zohoFieldName];

    if (value === undefined || value === null || value === "") {
      return;
    }

    fields.push({
      label: labelFor(internalKey),
      value: String(value),
    });
  });

  return fields;
}

function isGroupPresent(record, fieldMap) {
  if (fieldMap.enabled) {
    const enabledValue = record[fieldMap.enabled];
    return enabledValue === true || enabledValue === "true";
  }

  // Entries with no "enabled" flag (Ticket 1 / Rehab entry 1, or
  // any single-entry form) are always considered present.
  return true;
}

function buildGroups(record, groupDefs) {
  const groups = [];

  groupDefs.forEach((groupDef) => {
    if (!isGroupPresent(record, groupDef.fields)) {
      return;
    }

    groups.push({
      title: groupDef.title,
      fields: extractGroupFields(record, groupDef.fields),
    });
  });

  return groups;
}

/* ------------------------------------------------------------------
 * Per-report row builders
 * ------------------------------------------------------------------ */

function buildWorkOrderRow(record) {
  const workOrderConfig = config.zoho.workOrder;
  const ticket1 = workOrderConfig.tickets.ticket1;

  const groups = buildGroups(record, [
    { title: "Ticket 1", fields: ticket1 },
    { title: "Ticket 2", fields: workOrderConfig.tickets.ticket2 },
    { title: "Ticket 3", fields: workOrderConfig.tickets.ticket3 },
  ]);

  return {
    id: record.ID || record.id,
    summary: {
      col1: record[ticket1.ticketId] || "",
      col2: record[ticket1.city] || "",
      col3: record[ticket1.date] || "",
    },
    groups,
  };
}

function buildRehabOrderRow(record) {
  const rehabConfig = config.zoho.rehabOrder;
  const entry1 = rehabConfig.entries.entry1;

  const groups = buildGroups(record, [
    { title: "Rehab Order", fields: entry1 },
    { title: "Rehab2", fields: rehabConfig.entries.entry2 },
    { title: "Rehab3", fields: rehabConfig.entries.entry3 },
  ]);

  const propertyUnit = [record[entry1.property], record[entry1.unit]]
    .filter(Boolean)
    .join(" / ");

  return {
    id: record.ID || record.id,
    summary: {
      col1: propertyUnit,
      col2: record[entry1.status] || "",
      col3: record[entry1.date] || "",
    },
    groups,
  };
}

function buildCheckInOutRow(record) {
  const fields = config.zoho.checkInOut.fields;

  const groups = [
    { title: "Entry", fields: extractGroupFields(record, fields) },
  ];

  return {
    id: record.ID || record.id,
    summary: {
      col1: record[fields.partCode] || "",
      col2: record[fields.action] || "",
      col3: record[fields.dateTime] || "",
    },
    groups,
  };
}

function buildMoveOutRow(record) {
  const fields = config.zoho.moveOut.fields;

  const groups = [
    { title: "Move Out", fields: extractGroupFields(record, fields) },
  ];

  const propertyUnit = [record[fields.property], record[fields.unit]]
    .filter(Boolean)
    .join(" / ");

  return {
    id: record.ID || record.id,
    summary: {
      col1: propertyUnit,
      col2: record[fields.finalStatus] || "",
      col3: record[fields.dateOfInspection] || "",
    },
    groups,
  };
}

function buildRentReadyChecklistRow(record) {
  const rentReadyConfig = config.zoho.rentReadyChecklist;
  const fields = rentReadyConfig.fields;

  const groups = [
    { title: "Checklist Info", fields: extractGroupFields(record, fields) },
  ];

  // Checklist items are returned as {shortKey: boolean} - the
  // frontend already has display labels for these short keys (see
  // RentReadyChecklistFormSection.js's CHECKLIST_SECTIONS), so
  // labels are not duplicated here.
  const checklist = {};

  Object.keys(rentReadyConfig.checklist).forEach((shortKey) => {
    const zohoFieldName = rentReadyConfig.checklist[shortKey];
    const value = record[zohoFieldName];
    checklist[shortKey] = value === true || value === "true";
  });

  const propertyUnit = [record[fields.property], record[fields.unit]]
    .filter(Boolean)
    .join(" / ");

  return {
    id: record.ID || record.id,
    summary: {
      col1: propertyUnit,
      col2: record[fields.rentReady] || "",
      col3: record[fields.dateTime] || "",
    },
    groups,
    checklist,
  };
}

/* ------------------------------------------------------------------
 * Report registry - one entry per report key
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
    // Rehab Order has 3 separate email fields (one per entry), all
    // populated with the same value at submission time - filtering
    // on entry 1's is sufficient.
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

/**
 * Fetches and normalizes one report's records for the given
 * technician's email.
 *
 * ADMIN MODE (future): once "show everyone's records" is needed,
 * this is the one place to change - skip building the `criteria`
 * param (or build a different one) based on a flag passed in from
 * the controller, rather than always filtering by email.
 */
async function fetchReport(reportKey, technicianEmail) {
  const reportDef = REPORT_DEFINITIONS[reportKey];

  if (!reportDef) {
    const error = new Error(`Unknown report: ${reportKey}`);
    error.statusCode = 404;
    throw error;
  }

  const reportLinkName = reportDef.reportLinkName();
  const emailField = reportDef.emailField();

  if (!reportLinkName || !emailField) {
    const error = new Error(
      `Report "${reportKey}" is missing its report link name or email field configuration.`,
    );
    error.statusCode = 500;
    throw error;
  }

  const criteria = `(${emailField} == "${technicianEmail}")`;

  let records = [];

  try {
    const response = await creatorRequest("get", `/report/${reportLinkName}`, {
      params: { criteria },
    });

    records = Array.isArray(response?.data) ? response.data : [];
  } catch (error) {
    /*
     * Zoho Creator's report API has a well-known quirk: when a
     * criteria query matches ZERO records, it responds with HTTP
     * 400 and code 9280 ("No records found matching the given
     * criteria") instead of a normal 200 with an empty array. That
     * is a legitimate empty result, not a real error - without this
     * check, every technician with zero records for a given report
     * would see a crash instead of an empty list.
     */
    const zohoErrorCode = error?.response?.data?.code;

    if (zohoErrorCode === 9280) {
      records = [];
    } else {
      throw error;
    }
  }

  return {
    columns: reportDef.columns,
    rows: records.map(reportDef.buildRow),
  };
}

module.exports = {
  fetchReport,
  REPORT_DEFINITIONS,
};