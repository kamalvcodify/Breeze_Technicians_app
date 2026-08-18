const zohoCheckInOutService = require(
  "../services/zohoCheckInOutService"
);

function cleanText(value) {
  return String(value || "").trim();
}

/**
 * controllers/checkInOutController.js
 * ----------------------------------------------------------------
 * FIX: rehabUnitName was never read here at all - added alongside
 * rehabUnit (the ID, kept for reference/future use). rehabUnitName
 * is the display NAME that actually gets sent to Zoho - see
 * zohoCheckInOutService.js.
 * ----------------------------------------------------------------
 */
function normalizeEntry(entry) {
  return {
    qrScanValue: cleanText(entry.qrScanValue),
    partCode: cleanText(entry.partCode),
    partsInventory: cleanText(entry.partsInventory),
    action: cleanText(entry.action),
    quantityDesired: cleanText(entry.quantityDesired),
    quantityReturned: cleanText(entry.quantityReturned),
    city: cleanText(entry.city),
    jobType: cleanText(entry.jobType),
    technicianName: cleanText(entry.technicianName),
    property: cleanText(entry.property),
    rehabUnit: cleanText(entry.rehabUnit),
    rehabUnitName: cleanText(entry.rehabUnitName),
    workOrder: cleanText(entry.workOrder),
    dateTime: cleanText(entry.dateTime),
    notes: cleanText(entry.notes),
    email: cleanText(entry.email),
  };
}

function validateEntry(entry) {
  const errors = [];

  if (!entry.action) errors.push("Action is required.");

  if (entry.action === "Check-out" && !entry.quantityDesired) {
    errors.push("Quantity Desired is required for Check-out.");
  }

  if (entry.action === "Check-in" && !entry.quantityReturned) {
    errors.push("Quantity Returned is required for Check-in.");
  }

  if (!entry.city) errors.push("City is required.");
  if (!entry.jobType) errors.push("Job type is required.");
  if (!entry.technicianName) errors.push("Technician name is required.");
  if (!entry.property) errors.push("Property is required.");
  if (!entry.dateTime) errors.push("Date/Time is required.");
  if (!entry.email) errors.push("Email is required.");

  return errors;
}

async function submitCheckInOut(req, res) {
  if (!req.body) {
    return res.status(400).json({
      detail: "The request body is missing.",
    });
  }

  const entry = normalizeEntry(req.body);

  const validationErrors = validateEntry(entry);

  if (validationErrors.length > 0) {
    return res.status(400).json({
      detail: "Please correct the Check In/Check Out information.",
      errors: validationErrors,
    });
  }

  const result = await zohoCheckInOutService.createCheckInOutEntry({
    entry,
  });

  return res.status(201).json({
    detail: "The entry was submitted successfully.",
    recordId: result.recordId,
    zoho: result.zohoResponse,
  });
}

module.exports = {
  submitCheckInOut,
};