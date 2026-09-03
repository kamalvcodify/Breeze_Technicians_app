const axios = require("axios");

const config = require("../config/env");

const { getAccessToken } = require("./zohoAuthService");
const zohoUserService = require("./zohoUserService");
const assignedWorkOrderStore = require("./assignedWorkOrderStore");

/**
 * services/zohoReportService.js
 * ----------------------------------------------------------------
 * All 5 reports now read from their Zoho CRM modules - Work Order,
 * Rehab Order, Check In/Out, and Rent Ready Checklist migrated
 * earlier tonight; Process a Move Out (this file's last Creator
 * holdout) migrated in this same pass, once its CRM module
 * (Process_a_Move_Out) was created. Nothing in this file reads from
 * Zoho Creator anymore.
 *
 * ARCHITECTURE NOTES:
 *   - Work Order and Rehab Order now create ONE CRM RECORD PER
 *     TICKET (not up to 3 tickets embedded in one record, like
 *     Creator did) - so the old "Ticket 1/2/3" grouping logic is
 *     gone entirely for these two; each row IS one ticket.
 *   - Work Order and Rehab Order SHARE one CRM module (Invoice1),
 *     distinguished only by the Rehab_Form field ("Yes"/"No") -
 *     every query for either report must filter on this field, even
 *     for Admin's "see everyone" view, since otherwise the two
 *     reports would show each other's records.
 *   - Invoice1 has NO EMAIL FIELD AT ALL (confirmed from real
 *     sample data) - non-admin filtering for Work Order/Rehab Order
 *     uses Tech_Name instead, resolved from the technician's email
 *     via a quick Users-form lookup (same pattern already used at
 *     login) since the JWT itself only carries email, not name.
 *   - Check In/Out (Check_In_log) and Rent Ready Checklist
 *     (Rent_Ready_Checklist) DO have a real Email field - filtered
 *     directly, same as before.
 *   - Zoho CRM's search API requires a non-empty criteria string -
 *     unlike Creator, criteria can't just be omitted for "everyone".
 *     Admin's unfiltered fetch for Check In/Out and Rent Ready
 *     Checklist uses CRM's plain list endpoint (GET /{module}, no
 *     criteria) instead. Work Order/Rehab Order always use /search,
 *     even for Admin, because of the shared-module filter above.
 *   - CRM images use a GENUINELY DIFFERENT mechanism than Creator's
 *     subform-download-URL trick: Zoho CRM's standard per-record
 *     Attachments API (list attachments for a record, then download
 *     by attachment ID) - see fetchCrmAttachmentRefs/
 *     fetchImageAsDataUri's CRM branch below. Attachment lists are
 *     fetched per-record during the list view (matches the existing
 *     "images ready before the user opens Detail" architecture) -
 *     acceptable given report sizes are small; if that ever changes,
 *     switching to lazy per-record fetch on Detail open would be the
 *     fix.
 * ----------------------------------------------------------------
 */

const CRM_BASE_URL = "https://www.zohoapis.com/crm/v2";

async function crmRequest(method, path, { params, data } = {}) {
  const accessToken = await getAccessToken();

  const response = await axios({
    method,
    url: `${CRM_BASE_URL}${path}`,
    params,
    data,
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json",
    },
    validateStatus: (status) => status === 204 || (status >= 200 && status < 300),
  });

  return response.status === 204 ? { data: [] } : response.data;
}

function escapeForCriteria(value) {
  return String(value || "").replace(/"/g, '\\"');
}

/**
 * fetchCrmRecords
 * ----------------------------------------------------------------
 * criteriaParts: array of "(Field:equals:Value)" strings, ANDed
 * together. An EMPTY array means "everyone, no filter at all" -
 * uses CRM's plain list endpoint (search requires non-empty
 * criteria and would error otherwise).
 * ----------------------------------------------------------------
 */
async function fetchCrmRecords({ module, criteriaParts }) {
  if (!criteriaParts || criteriaParts.length === 0) {
    const result = await crmRequest("get", `/${module}`);
    return Array.isArray(result?.data) ? result.data : [];
  }

  try {
    const result = await crmRequest("get", `/${module}/search`, {
      params: { criteria: criteriaParts.join("and") },
    });
    return Array.isArray(result?.data) ? result.data : [];
  } catch (error) {
    if (error?.response?.status === 204) {
      return [];
    }
    throw error;
  }
}

/**
 * resolveTechnicianName
 * ----------------------------------------------------------------
 * Invoice1 (Work Order/Rehab Order) has no Email field - non-admin
 * filtering needs the technician's real NAME instead. The JWT only
 * carries email, so this resolves it via the same Users-form lookup
 * already used at login (authController.js's readName()).
 * ----------------------------------------------------------------
 */
async function resolveTechnicianName(technicianEmail) {
  const userRecord = await zohoUserService.findUserByEmail(technicianEmail);
  return userRecord?.[config.zoho.fields.name] || "";
}

/**
 * formatReadableDateTime
 * ----------------------------------------------------------------
 * AppFolio's timestamps come back as raw ISO strings (e.g.
 * "2026-08-31T16:09:57Z") - not readable for a technician/admin
 * glancing at a report. Formats into a plain, locale-aware date +
 * time string instead.
 * ----------------------------------------------------------------
 */
function formatReadableDateTime(isoValue) {
  if (!isoValue) {
    return "";
  }

  const date = new Date(isoValue);

  if (Number.isNaN(date.getTime())) {
    return isoValue;
  }

  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function extractDisplayValue(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (Array.isArray(value)) {
    return "";
  }

  if (typeof value === "object") {
    // Zoho Creator Lookup shape: { zc_display_value, ... }
    if (value.zc_display_value) {
      return String(value.zc_display_value);
    }

    // Zoho CRM Lookup shape: { name, id }
    if (value.name) {
      return String(value.name);
    }

    return "";
  }

  return String(value);
}

/* ------------------------------------------------------------------
 * CRM attachment handling (Work Order, Rehab Order, Check In/Out,
 * Rent Ready Checklist) - genuinely different mechanism from
 * Creator's, see file-level comment.
 * ------------------------------------------------------------------ */

async function fetchCrmAttachmentRefs(module, recordId) {
  try {
    const result = await crmRequest("get", `/${module}/${recordId}/Attachments`);
    const attachments = Array.isArray(result?.data) ? result.data : [];

    return attachments.map((attachment) => ({
      source: "crm",
      module,
      recordId,
      attachmentId: attachment.id,
    }));
  } catch (error) {
    if (error?.response?.status === 204) {
      return [];
    }
    console.error(
      `[Reports] Could not list CRM attachments for ${module}/${recordId}:`,
      error?.response?.data || error.message
    );
    return [];
  }
}

/* ------------------------------------------------------------------
 * Work Order / Rehab Order - shared Invoice1 module, one row per
 * ticket (no more Ticket 1/2/3 grouping).
 * ------------------------------------------------------------------ */

const INVOICE_DISPLAY_LABELS = {
  ticketId: "Ticket ID",
  jobType: "Job Type",
  unitName: "Unit",
  city: "City",
  clockIn: "Clock In",
  clockOut: "Clock Out",
  status: "Status",
  techName: "Technician Name",
  workDetails: "Work Details",
  date: "Date",
};

async function buildInvoiceRow(record, module) {
  const fields = config.zoho.crmInvoice.fields;
  const recordId = record.id || record.ID;
  const isRehab = record[fields.rehabForm] === "Yes";

  const displayFields = [];
  Object.keys(INVOICE_DISPLAY_LABELS).forEach((internalKey) => {
    const zohoFieldName = fields[internalKey];
    const value = extractDisplayValue(record[zohoFieldName]);
    if (value) {
      displayFields.push({ label: INVOICE_DISPLAY_LABELS[internalKey], value });
    }
  });

  const propertyName = extractDisplayValue(record[fields.property]);
  if (propertyName) {
    displayFields.unshift({ label: "Property", value: propertyName });
  }

  const images = await fetchCrmAttachmentRefs(module, recordId);

  return {
    id: recordId,
    summary: {
      col1: extractDisplayValue(record.Name),
      col2: extractDisplayValue(record[fields.status]),
      col3: extractDisplayValue(record[fields.date]),
    },
    groups: [
      {
        title: isRehab ? "Rehab Order" : "Work Order",
        fields: displayFields,
        images,
      },
    ],
  };
}

async function fetchInvoiceReport({ isRehab, technicianEmail, isAdmin }) {
  const fields = config.zoho.crmInvoice.fields;
  const module = config.zoho.crmInvoice.module;

  const criteriaParts = [
    `(${fields.rehabForm}:equals:${isRehab ? "Yes" : "No"})`,
  ];

  if (!isAdmin) {
    const technicianName = await resolveTechnicianName(technicianEmail);

    if (!technicianName) {
      // No matching Users record / no name on file - nothing to show
      // rather than risk showing everyone's records.
      return [];
    }

    criteriaParts.push(`(${fields.techName}:equals:${escapeForCriteria(technicianName)})`);
  }

  const records = await fetchCrmRecords({ module, criteriaParts });

  return Promise.all(records.map((record) => buildInvoiceRow(record, module)));
}

/* ------------------------------------------------------------------
 * Check In / Check Out - Check_In_log module.
 * ------------------------------------------------------------------ */

const CHECK_IN_OUT_DISPLAY_LABELS = {
  technician: "Technician",
  city: "City",
  rehabUnit: "Rehab Unit",
  workOrder: "Work Order",
  partCode: "Part Code",
  quantityDesired: "Quantity Desired",
  quantityReturned: "Quantity Returned",
  notes: "Notes",
  action: "Action",
  checkinFor: "Job Type",
};

async function buildCheckInOutRow(record) {
  const fields = config.zoho.crmCheckInOut.fields;
  const module = config.zoho.crmCheckInOut.module;
  const recordId = record.id || record.ID;

  const displayFields = [];
  Object.keys(CHECK_IN_OUT_DISPLAY_LABELS).forEach((internalKey) => {
    const zohoFieldName = fields[internalKey];
    const value = extractDisplayValue(record[zohoFieldName]);
    if (value) {
      displayFields.push({ label: CHECK_IN_OUT_DISPLAY_LABELS[internalKey], value });
    }
  });

  const propertyName = extractDisplayValue(record[fields.property]);
  if (propertyName) {
    displayFields.unshift({ label: "Property", value: propertyName });
  }

  if (record[fields.dateTime]) {
    displayFields.push({ label: "Date/Time", value: extractDisplayValue(record[fields.dateTime]) });
  }

  const images = await fetchCrmAttachmentRefs(module, recordId);

  return {
    id: recordId,
    summary: {
      col1: extractDisplayValue(record[fields.partCode]),
      col2: extractDisplayValue(record[fields.action]),
      col3: extractDisplayValue(record[fields.dateTime]),
    },
    groups: [{ title: "Entry", fields: displayFields, images }],
  };
}

async function fetchCheckInOutReport({ technicianEmail, isAdmin }) {
  const fields = config.zoho.crmCheckInOut.fields;
  const module = config.zoho.crmCheckInOut.module;

  const criteriaParts = isAdmin
    ? []
    : [`(${fields.email}:equals:${escapeForCriteria(technicianEmail)})`];

  const records = await fetchCrmRecords({ module, criteriaParts });

  return Promise.all(records.map((record) => buildCheckInOutRow(record)));
}

/* ------------------------------------------------------------------
 * Rent Ready Checklist - Rent_Ready_Checklist module.
 * ------------------------------------------------------------------ */

const RENT_READY_DISPLAY_LABELS = {
  techName: "Technician Name",
  readyRent: "Rent Ready",
};

async function buildRentReadyChecklistRow(record) {
  const fields = config.zoho.crmRentReadyChecklist.fields;
  const checklistFieldConfig = config.zoho.crmRentReadyChecklist.checklist;
  const module = config.zoho.crmRentReadyChecklist.module;
  const recordId = record.id || record.ID;

  const displayFields = [];
  Object.keys(RENT_READY_DISPLAY_LABELS).forEach((internalKey) => {
    const zohoFieldName = fields[internalKey];
    const value = extractDisplayValue(record[zohoFieldName]);
    if (value) {
      displayFields.push({ label: RENT_READY_DISPLAY_LABELS[internalKey], value });
    }
  });

  const propertyName = extractDisplayValue(record[fields.property]);
  const unitName = extractDisplayValue(record[fields.unit]);
  const propertyUnit = [propertyName, unitName].filter(Boolean).join(" / ");

  if (record[fields.dateTime]) {
    displayFields.push({ label: "Date/Time", value: extractDisplayValue(record[fields.dateTime]) });
  }

  const checklist = {};
  Object.keys(checklistFieldConfig).forEach((shortKey) => {
    const zohoFieldName = checklistFieldConfig[shortKey];
    const value = record[zohoFieldName];
    checklist[shortKey] = value === true || value === "true";
  });

  const images = await fetchCrmAttachmentRefs(module, recordId);

  return {
    id: recordId,
    summary: {
      col1: propertyUnit,
      col2: extractDisplayValue(record[fields.readyRent]),
      col3: extractDisplayValue(record[fields.dateTime]),
    },
    groups: [{ title: "Checklist Info", fields: displayFields, images }],
    checklist,
  };
}

async function fetchRentReadyChecklistReport({ technicianEmail, isAdmin }) {
  const fields = config.zoho.crmRentReadyChecklist.fields;
  const module = config.zoho.crmRentReadyChecklist.module;

  const criteriaParts = isAdmin
    ? []
    : [`(${fields.email}:equals:${escapeForCriteria(technicianEmail)})`];

  const records = await fetchCrmRecords({ module, criteriaParts });

  return Promise.all(records.map((record) => buildRentReadyChecklistRow(record)));
}

/* ------------------------------------------------------------------
 * Process a Move Out - Process_a_Move_Out module. All 5 reports are
 * now on Zoho CRM - the Creator-based machinery this section used
 * to need (NON_DISPLAY_KEYS, extractCreatorGroupFields,
 * extractCreatorAttachmentImageRefs, subform-download-URL image
 * refs) has been removed as dead code now that nothing reads from
 * Creator anymore.
 * ------------------------------------------------------------------ */

const MOVE_OUT_DISPLAY_LABELS = {
  status: "Status",
  notes: "Notes",
};

async function buildMoveOutRow(record) {
  const fields = config.zoho.crmMoveOut.fields;
  const module = config.zoho.crmMoveOut.module;
  const recordId = record.id || record.ID;

  const displayFields = [{ label: "Technician Name", value: extractDisplayValue(record.Name) }];

  const propertyName = extractDisplayValue(record[fields.property]);
  const unitName = extractDisplayValue(record[fields.unit]);

  if (propertyName) {
    displayFields.unshift({ label: "Property", value: propertyName });
  }

  if (unitName) {
    displayFields.push({ label: "Unit", value: unitName });
  }

  Object.keys(MOVE_OUT_DISPLAY_LABELS).forEach((internalKey) => {
    const zohoFieldName = fields[internalKey];
    const value = extractDisplayValue(record[zohoFieldName]);
    if (value) {
      displayFields.push({ label: MOVE_OUT_DISPLAY_LABELS[internalKey], value });
    }
  });

  if (record[fields.dateOfInspection]) {
    displayFields.push({
      label: "Date of Inspection",
      value: extractDisplayValue(record[fields.dateOfInspection]),
    });
  }

  const propertyUnit = [propertyName, unitName].filter(Boolean).join(" / ");

  const images = await fetchCrmAttachmentRefs(module, recordId);

  return {
    id: recordId,
    summary: {
      col1: propertyUnit,
      col2: extractDisplayValue(record[fields.status]),
      col3: extractDisplayValue(record[fields.dateOfInspection]),
    },
    groups: [{ title: "Move Out", fields: displayFields, images }],
  };
}

async function fetchMoveOutReport({ technicianEmail, isAdmin }) {
  const fields = config.zoho.crmMoveOut.fields;
  const module = config.zoho.crmMoveOut.module;

  const criteriaParts = isAdmin
    ? []
    : [`(${fields.email}:equals:${escapeForCriteria(technicianEmail)})`];

  const records = await fetchCrmRecords({ module, criteriaParts });

  return Promise.all(records.map((record) => buildMoveOutRow(record)));
}

/* ------------------------------------------------------------------
 * AppFolio Work Orders (Admin-only) - sourced from the local
 * AppFolio-synced store (assignedWorkOrderStore.js), NOT Zoho at
 * all. Shows EVERY work order regardless of status - unlike the
 * technician's "My Assigned Work Orders" (trackingService.js),
 * which filters to incomplete-only. Admin applies their own status
 * filter client-side in ReportListScreen.js.
 * ------------------------------------------------------------------ */

function buildAppFolioWorkOrderRow(workOrder) {
  const assignedNames = (workOrder.assignedTechnicians || [])
    .map((technician) => technician.name)
    .filter(Boolean)
    .join(", ");

  // FIX: dates now formatted (formatReadableDateTime), not raw ISO
  // strings. EXPANDED per instructions ("display all possible info
  // the work order has") - Created Date and a direct AppFolio Link
  // added, alongside everything already shown.
  const fields = [
    { label: "Ticket Number", value: workOrder.workOrder },
    { label: "Status", value: workOrder.status },
    { label: "Priority", value: workOrder.priority },
    { label: "Address", value: workOrder.address },
    { label: "Unit", value: workOrder.unitName },
    { label: "Description", value: workOrder.description },
    { label: "Job Description", value: workOrder.jobDescription },
    { label: "Assigned To", value: assignedNames },
    { label: "Created", value: formatReadableDateTime(workOrder.createdAt) },
    { label: "Last Updated", value: formatReadableDateTime(workOrder.lastUpdatedAt) },
    { label: "AppFolio Link", value: workOrder.link },
  ].filter((field) => !!field.value);

  return {
    id: workOrder.id,
    status: workOrder.status,
    summary: {
      col1: workOrder.workOrder,
      col2: workOrder.status,
      col3: workOrder.address,
    },
    groups: [
      {
        title: "Work Order",
        fields,
        images: [],
      },
    ],
  };
}

/**
 * fetchAppFolioWorkOrdersReport
 * ----------------------------------------------------------------
 * ADMIN-ONLY - enforced HERE, not just hidden in the UI.
 *
 * NEW: sorted by lastUpdatedAt, most recent first - previously
 * unsorted (whatever order the local store happened to return),
 * per instructions ("recently updated data at the top of the
 * list").
 * ----------------------------------------------------------------
 */
async function fetchAppFolioWorkOrdersReport({ isAdmin }) {
  if (!isAdmin) {
    const error = new Error("Admin access is required for this report.");
    error.statusCode = 403;
    throw error;
  }

  const allWorkOrders = assignedWorkOrderStore.getAllWorkOrders();

  const sorted = [...allWorkOrders].sort((a, b) => {
    const aTime = new Date(a.lastUpdatedAt || 0).getTime();
    const bTime = new Date(b.lastUpdatedAt || 0).getTime();
    return bTime - aTime;
  });

  return sorted.map(buildAppFolioWorkOrderRow);
}

/* ------------------------------------------------------------------
 * Report registry
 * ------------------------------------------------------------------ */

const REPORT_DEFINITIONS = {
  workOrder: {
    columns: ["Name", "Status", "Date"],
    fetchRows: (args) => fetchInvoiceReport({ ...args, isRehab: false }),
  },
  rehabOrder: {
    columns: ["Name", "Status", "Date"],
    fetchRows: (args) => fetchInvoiceReport({ ...args, isRehab: true }),
  },
  checkInOut: {
    columns: ["Part Code", "Action", "Date"],
    fetchRows: fetchCheckInOutReport,
  },
  moveOut: {
    columns: ["Property/Unit", "Status", "Date"],
    fetchRows: fetchMoveOutReport,
  },
  rentReadyChecklist: {
    columns: ["Property/Unit", "Rent Ready", "Date"],
    fetchRows: fetchRentReadyChecklistReport,
  },
  appFolioWorkOrders: {
    columns: ["Work Order", "Status", "Address"],
    fetchRows: fetchAppFolioWorkOrdersReport,
  },
};

async function fetchReport(reportKey, technicianEmail, isAdmin = false) {
  const reportDef = REPORT_DEFINITIONS[reportKey];

  if (!reportDef) {
    const error = new Error(`Unknown report: ${reportKey}`);
    error.statusCode = 404;
    throw error;
  }

  const rows = await reportDef.fetchRows({ technicianEmail, isAdmin });

  return {
    columns: reportDef.columns,
    rows,
  };
}

/**
 * fetchImageAsDataUri
 * ----------------------------------------------------------------
 * All 5 reports now use the "crm" branch (Zoho CRM's standard
 * per-record Attachments download API). The "creator" branch below
 * is kept only as a safety net / for reference - nothing in this
 * file currently produces a Creator-shaped ref anymore, since Move
 * Out's migration removed the last caller.
 * ----------------------------------------------------------------
 */
async function fetchImageAsDataUri(ref) {
  const accessToken = await getAccessToken();

  let url;

  if (ref.source === "crm") {
    if (!ref.module || !ref.recordId || !ref.attachmentId) {
      const error = new Error("Missing required CRM image reference parameters.");
      error.statusCode = 400;
      throw error;
    }

    url = `${CRM_BASE_URL}/${ref.module}/${ref.recordId}/Attachments/${ref.attachmentId}`;
  } else {
    const { reportLinkName, recordId, subformName, fieldName, subformRecordId } = ref;

    if (!reportLinkName || !recordId || !subformName || !fieldName || !subformRecordId) {
      const error = new Error("Missing required image reference parameters.");
      error.statusCode = 400;
      throw error;
    }

    url =
      `${config.zoho.apiDomain}/creator/v2.1/data/${config.zoho.ownerName}/` +
      `${config.zoho.appLinkName}/report/${reportLinkName}/${recordId}/` +
      `${subformName}.${fieldName}/${subformRecordId}/download`;
  }

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