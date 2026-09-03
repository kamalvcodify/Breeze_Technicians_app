const axios = require("axios");
const FormData = require("form-data");
const config = require("../config/env");
const { getAccessToken } = require("./zohoAuthService");

/**
 * services/zohoMoveOutService.js
 * ----------------------------------------------------------------
 * REWRITTEN - Process a Move Out now syncs to Zoho CRM's
 * "Process_a_Move_Out" module instead of Zoho Creator. Single-entry
 * form (no ticket loop) - one submission creates exactly one CRM
 * record, matching Rent Ready Checklist and Check In/Out's shape.
 *
 * Field mapping confirmed against a real sample CRM record:
 *   - Property/Unit are genuine Lookup fields - the real CRM record
 *     IDs already carried on the entry are used directly.
 *   - There is NO dedicated Technician Name field on this module -
 *     per instructions, the technician's name is mapped onto the
 *     record's own Name field instead (same approach already used
 *     for Check In/Out's mandatory Name field).
 *   - Date_of_inspection (note: lowercase "of") is a plain Date
 *     field, format "yyyy-MM-dd" (confirmed from sample data,
 *     "2026-08-20").
 *   - Status holds values like "Pass" - the CRM equivalent of the
 *     old Creator form's "Final Status".
 *   - Details is Notes, matching the same naming convention already
 *     used on Check_In_log.
 *
 * ATTACHMENTS: uses Zoho CRM's standard per-record Attachments API,
 * same mechanism as zohoCrmInvoiceService.js (POST
 * /crm/v2/{module}/{recordId}/Attachments) - duplicated here in a
 * small, self-contained form rather than importing that file
 * directly, since it's hardcoded to the Invoice1 module. If a 3rd
 * form needs this same upload logic, that would be the moment to
 * factor it out into a shared, module-agnostic helper.
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

const MODULE = () => config.zoho.crmMoveOut.module;
const FIELDS = () => config.zoho.crmMoveOut.fields;

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

function buildCrmPayload(entry) {
  const fields = FIELDS();

  const data = {
    // Per instructions: no dedicated Technician Name field exists
    // on this module - mapped onto Name instead.
    Name: entry.technicianName,
    [fields.email]: entry.email,
    [fields.status]: entry.finalStatus,
    [fields.notes]: entry.notes,
  };

  if (entry.dateOfInspection) {
    data[fields.dateOfInspection] = formatCrmDate(entry.dateOfInspection);
  }

  if (entry.property) {
    data[fields.property] = { id: entry.property };
  }

  if (entry.unit) {
    data[fields.unit] = { id: entry.unit };
  }

  return data;
}

async function createRecord(data) {
  const result = await crmRequest("post", `/${MODULE()}`, {
    data: { data: [data] },
  });

  const entry = result?.data?.[0];
  const success = entry?.code === "SUCCESS";

  if (!success) {
    console.error(
      "[Process a Move Out] Zoho CRM rejected the record - full response:",
      JSON.stringify(entry, null, 2)
    );
  }

  return {
    success,
    recordId: entry?.details?.id || null,
    rejectionReason: success ? null : entry?.message || "Unknown Zoho error",
  };
}

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

async function createMoveOutEntry({ entry }) {
  const payload = buildCrmPayload(entry);

  console.log(
    "[Process a Move Out] Syncing to Zoho CRM Process_a_Move_Out:",
    JSON.stringify(payload, null, 2)
  );

  const created = await createRecord(payload);

  if (!created.success) {
    const error = new Error(created.rejectionReason || "Zoho CRM rejected the record.");
    error.statusCode = 502;
    throw error;
  }

  const attachments = entry.attachments || [];
  let uploaded = 0;
  const failedFileNames = [];

  for (const attachment of attachments) {
    const fileName = attachment.originalName || "photo.jpg";

    try {
      // eslint-disable-next-line no-await-in-loop
      await uploadAttachmentToRecord(created.recordId, attachment);
      uploaded += 1;
    } catch (error) {
      console.error(
        `[Process a Move Out] Failed to upload ${fileName} to record ${created.recordId}:`,
        error?.response?.data || error.message
      );
      failedFileNames.push(fileName);
    }
  }

  let attachmentUploadStatus = "No attachments supplied.";

  if (attachments.length > 0) {
    attachmentUploadStatus =
      failedFileNames.length === 0
        ? `${uploaded} of ${attachments.length} image(s) uploaded successfully.`
        : `${uploaded} of ${attachments.length} image(s) uploaded. Failed to upload: ${failedFileNames.join(", ")}.`;
  }

  return {
    recordId: created.recordId,
    detail: "The move-out checklist was submitted successfully.",
    attachmentUploadStatus,
  };
}

module.exports = {
  createMoveOutEntry,
};