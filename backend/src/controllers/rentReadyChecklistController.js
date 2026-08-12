const zohoRentReadyChecklistService = require("../services/zohoRentReadyChecklistService");

function cleanText(value) {
  return String(value || "").trim();
}

/**
 * controllers/rentReadyChecklistController.js
 * ----------------------------------------------------------------
 * The checklist object is passed through as-is (each key is
 * already a real Zoho field API name) - only its values get
 * coerced to plain booleans here for safety, not renamed.
 * ----------------------------------------------------------------
 */
function normalizeChecklist(checklist) {
  if (!checklist || typeof checklist !== "object") {
    return {};
  }

  const normalized = {};

  Object.keys(checklist).forEach((key) => {
    normalized[key] = Boolean(checklist[key]);
  });

  return normalized;
}

function normalizeEntry(entry) {
  return {
    property: cleanText(entry.property),
    unit: cleanText(entry.unit),
    technicianName: cleanText(entry.technicianName),
    rentReady: cleanText(entry.rentReady),
    dateTime: cleanText(entry.dateTime),
    notes: cleanText(entry.notes),
    email: cleanText(entry.email),
    checklist: normalizeChecklist(entry.checklist),
  };
}

function validateEntry(entry) {
  const errors = [];

  if (!entry.property) errors.push("Property is required.");
  if (!entry.unit) errors.push("Unit is required.");
  if (!entry.technicianName) errors.push("Technician name is required.");
  if (!entry.rentReady) errors.push("Rent Ready selection is required.");
  if (!entry.dateTime) errors.push("Date/Time is required.");
  if (!entry.email) errors.push("Email is required.");

  return errors;
}

async function submitRentReadyChecklist(req, res) {
  if (!req.body) {
    return res.status(400).json({
      detail: "The request body is missing.",
    });
  }

  const entry = normalizeEntry(req.body);

  const validationErrors = validateEntry(entry);

  if (validationErrors.length > 0) {
    return res.status(400).json({
      detail: "Please correct the Rent Ready Checklist information.",
      errors: validationErrors,
    });
  }

  const result =
    await zohoRentReadyChecklistService.createRentReadyChecklistEntry({
      entry,
    });

  return res.status(201).json({
    detail: "The Rent Ready Checklist was submitted successfully.",
    recordId: result.recordId,
    zoho: result.zohoResponse,
  });
}

module.exports = {
  submitRentReadyChecklist,
};
