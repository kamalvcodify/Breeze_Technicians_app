const zohoRehabOrderService = require(
  "../services/zohoRehabOrderService"
);

const MAX_ENTRIES = 3;

function cleanText(value) {
  return String(value || "").trim();
}

/**
 * controllers/rehabOrderController.js
 * ----------------------------------------------------------------
 * Mirrors workOrderController.js's structure. One difference:
 * parseOrders() accepts EITHER a bare array in req.body OR an
 * object shaped { orders: [...] } - the frontend's api/rehabOrders.js
 * currently posts a bare array, but accepting both shapes here means
 * a future frontend change to wrap it doesn't require a backend
 * change too.
 *
 * Per instructions, attachments are accepted from the frontend (so
 * the request doesn't fail) but are NOT sent to Zoho yet - see
 * zohoRehabOrderService.js.
 * ----------------------------------------------------------------
 */
function parseOrders(req) {
  if (!req.body) {
    const error = new Error(
      "The request body is missing."
    );

    error.statusCode = 400;
    throw error;
  }

  if (Array.isArray(req.body)) {
    return req.body;
  }

  if (Array.isArray(req.body.orders)) {
    return req.body.orders;
  }

  const error = new Error(
    "The orders field is required and must be an array."
  );

  error.statusCode = 400;
  throw error;
}

function normalizeOrder(order) {
  return {
    property: cleanText(order.property),

    unit: cleanText(order.unit),

    technicianName: cleanText(
      order.technicianName
    ),

    status: cleanText(order.status),

    description: cleanText(
      order.description
    ),

    rentReady: cleanText(
      order.rentReady
    ),

    city: cleanText(order.city),

    clockIn: cleanText(order.clockIn),

    clockOut: cleanText(
      order.clockOut
    ),

    date: cleanText(order.date),

    jobType: cleanText(order.jobType),

    // Accepted but not sent to Zoho yet - see
    // zohoRehabOrderService.js.
    attachments: Array.isArray(
      order.attachments
    )
      ? order.attachments
      : [],
  };
}

function validateOrder(order, index) {
  const errors = [];

  if (!order.property) {
    errors.push(
      `Entry ${index + 1}: Property is required.`
    );
  }

  if (!order.unit) {
    errors.push(
      `Entry ${index + 1}: Unit is required.`
    );
  }

  if (!order.technicianName) {
    errors.push(
      `Entry ${index + 1}: Technician name is required.`
    );
  }

  if (!order.status) {
    errors.push(
      `Entry ${index + 1}: Status is required.`
    );
  }

  if (!order.description) {
    errors.push(
      `Entry ${index + 1}: Description is required.`
    );
  }

  if (!order.rentReady) {
    errors.push(
      `Entry ${index + 1}: Rent Ready selection is required.`
    );
  }

  if (!order.city) {
    errors.push(
      `Entry ${index + 1}: City is required.`
    );
  }

  if (!order.date) {
    errors.push(
      `Entry ${index + 1}: Date is required.`
    );
  }

  if (!order.jobType) {
    errors.push(
      `Entry ${index + 1}: Job type is required.`
    );
  }

  return errors;
}

async function submitRehabOrder(req, res) {
  const ordersInput = parseOrders(req);

  if (ordersInput.length === 0) {
    return res.status(400).json({
      detail: "At least one Rehab Order entry is required.",
    });
  }

  if (ordersInput.length > MAX_ENTRIES) {
    return res.status(400).json({
      detail: `A maximum of ${MAX_ENTRIES} Rehab Order entries can be submitted.`,
    });
  }

  const orders = ordersInput.map(normalizeOrder);

  const validationErrors = orders.flatMap(
    (order, index) => validateOrder(order, index)
  );

  if (validationErrors.length > 0) {
    return res.status(400).json({
      detail: "Please correct the Rehab Order information.",
      errors: validationErrors,
    });
  }

  const result = await zohoRehabOrderService.createRehabOrder({
    orders,
    technicianEmail: req.user.email,
  });

  return res.status(201).json({
    detail: "The Rehab Order was submitted successfully.",

    recordId: result.recordId,

    entryCount: orders.length,

    attachmentsReceived: orders.reduce(
      (total, order) => total + order.attachments.length,
      0
    ),

    attachmentUploadStatus: result.attachmentUploadStatus,

    zoho: result.zohoResponse,
  });
}

module.exports = {
  submitRehabOrder,
};