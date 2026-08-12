const zohoMoveOutService = require(
  "../services/zohoMoveOutService"
);

function cleanText(value) {
  return String(value || "").trim();
}

/**
 * controllers/moveOutController.js
 * ----------------------------------------------------------------
 * Mirrors checkInOutController.js's structure. Attachments (if the
 * frontend ever sends them) are accepted without error but are not
 * forwarded to Zoho - see zohoMoveOutService.js.
 * ----------------------------------------------------------------
 */
function normalizeEntry(entry) {
  return {
    technicianName: cleanText(entry.technicianName),
    property: cleanText(entry.property),
    email: cleanText(entry.email),
    unit: cleanText(entry.unit),
    finalStatus: cleanText(entry.finalStatus),
    dateOfInspection: cleanText(entry.dateOfInspection),
    notes: cleanText(entry.notes),
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
  if (!req.body) {
    return res.status(400).json({
      detail: "The request body is missing.",
    });
  }

  const entry = normalizeEntry(req.body);

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
    zoho: result.zohoResponse,
  });
}

module.exports = {
  submitMoveOut,
};