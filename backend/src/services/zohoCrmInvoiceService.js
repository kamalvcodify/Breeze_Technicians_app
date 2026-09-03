const axios = require("axios");
const FormData = require("form-data");
const config = require("../config/env");
const { getAccessToken } = require("./zohoAuthService");

/**
 * services/zohoCrmInvoiceService.js
 * ----------------------------------------------------------------
 * SHARED Zoho CRM sync engine for Work Order and Rehab Order -
 * both forms write to the SAME CRM module ("Invoice1"), one record
 * per TICKET (not one record holding up to 3 tickets, like Zoho
 * Creator did). A "Rehab_Form" field ("Yes"/"No") distinguishes
 * which form a given record came from, since they share a module.
 *
 * This is the "one reusable engine, not one file per form" design
 * confirmed with the client - zohoWorkOrderService.js and
 * zohoRehabOrderService.js each build a small, form-specific field
 * map per ticket and call syncTicketToCrm() here; all the actual
 * Zoho CRM plumbing (record create, attachment upload, error
 * handling) lives in exactly one place. Adding a 3rd/4th form to
 * this same CRM flow later means adding a small buildXFields()
 * function in that form's own service, not touching this file.
 *
 * ATTACHMENTS: genuinely simpler than the Zoho Creator flow this
 * replaces - no subform, no sequence-number matching, no waiting
 * for Zoho to "settle" before re-fetching. Zoho CRM's standard
 * Attachments API attaches a file directly to an existing record:
 *   POST /crm/v2/{module}/{recordId}/Attachments
 * Since each ticket now gets its OWN record, each ticket's photos
 * upload straight to that specific record - no cross-ticket
 * sequence bookkeeping needed at all.
 * ----------------------------------------------------------------
 */

const CRM_BASE_URL = "https://www.zohoapis.com/crm/v2";

async function crmRequest(method, path, { params, data, headers } = {}) {
  const accessToken = await getAccessToken();

  const response = await axios({
    method,
    url: `${CRM_BASE_URL}${path}`,
    params,
    data,
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      ...(headers || { "Content-Type": "application/json" }),
    },
    validateStatus: (status) => status === 204 || (status >= 200 && status < 300),
  });

  return response.status === 204 ? { data: [] } : response.data;
}

const MODULE = () => config.zoho.crmInvoice.module;
const FIELDS = () => config.zoho.crmInvoice.fields;

/**
 * Formats a plain calendar date for Zoho CRM's Date field (NOT
 * DateTime - confirmed from real sample data, "2026-08-26" with no
 * time component). Accepts either an already-correct "yyyy-MM-dd"
 * string or a Date object.
 */
function formatCrmDate(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * buildInvoiceFields
 * ----------------------------------------------------------------
 * Builds one CRM record payload for ONE ticket, using the exact
 * field mapping confirmed against real Invoice1 sample data.
 * unitId/propertyId are the REAL CRM record IDs already carried on
 * every ticket (the same IDs that already populate the Property/
 * Unit search-select dropdowns on the form) - Unit/Property are
 * genuine Zoho CRM Lookup fields, which require an {id: "..."}
 * reference, not a plain name string.
 * ----------------------------------------------------------------
 */
function buildInvoiceFields({
  name,
  ticketId,
  jobType,
  unitId,
  unitName,
  propertyId,
  city,
  clockIn,
  clockOut,
  status,
  techName,
  workDetails,
  date,
  rehabForm,
}) {
  const fields = FIELDS();

  const data = {
    [fields.name]: name,
    [fields.jobType]: jobType,
    [fields.unitName]: unitName,
    [fields.city]: city,
    [fields.clockIn]: clockIn,
    [fields.clockOut]: clockOut,
    [fields.status]: status,
    [fields.techName]: techName,
    [fields.workDetails]: workDetails,
    [fields.date]: formatCrmDate(date),
    [fields.rehabForm]: rehabForm,
  };

  // Per instructions: Ticket_Id is only set when a real ticket
  // number exists (Work Order) - Rehab Order has no equivalent
  // field on its form, so this is simply omitted for Rehab.
  if (ticketId) {
    data[fields.ticketId] = ticketId;
  }

  // Lookup fields need a real CRM record ID - omitted entirely if
  // we don't have one, rather than sending a name string a Lookup
  // field would reject.
  if (unitId) {
    data[fields.unit] = { id: unitId };
  }

  if (propertyId) {
    data[fields.property] = { id: propertyId };
  }

  return data;
}

async function createInvoiceRecord(fields) {
  const result = await crmRequest("post", `/${MODULE()}`, {
    data: { data: [fields] },
  });

  const entry = result?.data?.[0];
  const success = entry?.code === "SUCCESS";

  if (!success) {
    console.error(
      "[CRM Invoice] Zoho rejected the record create - full response:",
      JSON.stringify(entry, null, 2)
    );
  }

  return {
    success,
    recordId: entry?.details?.id || null,
    rejectionReason: success ? null : entry?.message || "Unknown Zoho error",
  };
}

/**
 * uploadAttachmentToRecord
 * ----------------------------------------------------------------
 * Zoho CRM's standard Attachments API - multipart upload directly
 * to an existing record, no subform/sequence matching needed.
 * ----------------------------------------------------------------
 */
async function uploadAttachmentToRecord(recordId, attachment) {
  const formData = new FormData();

  formData.append("file", attachment.buffer, {
    filename: attachment.originalName || "photo.jpg",
    contentType: attachment.mimeType || "image/jpeg",
  });

  await crmRequest("post", `/${MODULE()}/${recordId}/Attachments`, {
    data: formData,
    headers: formData.getHeaders(),
  });
}

/**
 * syncTicketToCrm
 * ----------------------------------------------------------------
 * ONE ticket -> ONE CRM record, then that ticket's own attachments
 * (if any) upload straight to that record. Called once per ticket
 * by both zohoWorkOrderService.js and zohoRehabOrderService.js.
 * ----------------------------------------------------------------
 */
async function syncTicketToCrm({ fields, attachments }) {
  const created = await createInvoiceRecord(fields);

  if (!created.success) {
    return {
      success: false,
      recordId: null,
      rejectionReason: created.rejectionReason,
      uploaded: 0,
      failed: (attachments || []).length,
      failedFileNames: (attachments || []).map(
        (attachment) => attachment.originalName || "photo.jpg"
      ),
    };
  }

  let uploaded = 0;
  const failedFileNames = [];

  for (const attachment of attachments || []) {
    const fileName = attachment.originalName || "photo.jpg";

    try {
      // eslint-disable-next-line no-await-in-loop
      await uploadAttachmentToRecord(created.recordId, attachment);
      uploaded += 1;
    } catch (error) {
      console.error(
        `[CRM Invoice] Failed to upload ${fileName} to record ${created.recordId}:`,
        error?.response?.data || error.message
      );
      failedFileNames.push(fileName);
    }
  }

  return {
    success: true,
    recordId: created.recordId,
    rejectionReason: null,
    uploaded,
    failed: failedFileNames.length,
    failedFileNames,
  };
}

module.exports = {
  buildInvoiceFields,
  syncTicketToCrm,
};