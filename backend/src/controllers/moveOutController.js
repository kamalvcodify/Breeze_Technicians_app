const zohoMoveOutService = require("../services/zohoMoveOutService");

function cleanText(value) {
  return String(value || "").trim();
}

/**
 * controllers/moveOutController.js
 * ----------------------------------------------------------------
 * UPDATED for multipart/form-data. Previously read fields directly
 * off req.body (a flat JSON body). Now that the frontend sends a
 * real multipart request, the entry's fields arrive as a single
 * JSON STRING under req.body.entry - parseEntry() below JSON.parses
 * it, same pattern as workOrderController.js's parseTickets().
 *
 * NEW: getAttachments() extracts real uploaded files from req.files
 * (populated by multer - see moveOutRoutes.js), matching field
 * names `attachment_{fileIndex}` (no per-ticket prefix, since this
 * form is single-entry).
 * ----------------------------------------------------------------
 */
function parseEntry(req) {
  if (!req.body) {
    const error = new Error("The request body is missing.");

    error.statusCode = 400;
    throw error;
  }

  const rawEntry = req.body.entry;

  if (rawEntry && typeof rawEntry === "object") {
    return rawEntry;
  }

  if (typeof rawEntry === "string") {
    try {
      return JSON.parse(rawEntry);
    } catch (error) {
      const parseError = new Error("The entry field contains invalid JSON.");

      parseError.statusCode = 400;
      throw parseError;
    }
  }

  // Fallback: plain JSON body (older clients / direct API testing).
  return req.body;
}

function getAttachments(files) {
  if (!Array.isArray(files)) {
    return [];
  }

  const prefix = "attachment_";

  return files
    .filter((file) => file.fieldname.startsWith(prefix))
    .map((file) => ({
      fieldName: file.fieldname,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    }));
}

function normalizeEntry(entry, attachments) {
  return {
    technicianName: cleanText(entry.technicianName),
    property: cleanText(entry.property),
    email: cleanText(entry.email),
    unit: cleanText(entry.unit),
    unitName: cleanText(entry.unitName),
    finalStatus: cleanText(entry.finalStatus),
    dateOfInspection: cleanText(entry.dateOfInspection),
    notes: cleanText(entry.notes),
    attachments,
  };
}

function validateEntry(entry) {
  const errors = [];

  if (!entry.technicianName) errors.push("Technician name is required.");
  if (!entry.property) errors.push("Property is required.");
  if (!entry.email) errors.push("Email is required.");
  if (!entry.unit) errors.push("Unit is required.");
  if (!entry.finalStatus) errors.push("Final Status is required.");
  if (!entry.dateOfInspection) errors.push("Date of Inspection is required.");

  return errors;
}

async function submitMoveOut(req, res) {
  const rawEntry = parseEntry(req);

  const entry = normalizeEntry(rawEntry, getAttachments(req.files));

  const validationErrors = validateEntry(entry);

  if (validationErrors.length > 0) {
    return res.status(400).json({
      detail: "Please correct the Move Out information.",
      errors: validationErrors,
    });
  }

  const result = await zohoMoveOutService.createMoveOutEntry({
    entry,
  });

  return res.status(201).json({
    detail: "The move-out checklist was submitted successfully.",
    recordId: result.recordId,
    attachmentUploadStatus: result.attachmentUploadStatus,
    zoho: result.zohoResponse,
  });
}

module.exports = {
  submitMoveOut,
};
