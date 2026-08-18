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
 * UPDATED for multipart/form-data (previously plain JSON, or a
 * bare JSON array). Now that the frontend sends a real multipart
 * request, req.body.orders arrives as a JSON STRING (form fields
 * are always strings), not a real array - parseOrders() now
 * JSON.parse()s it, same pattern as workOrderController.js's
 * parseTickets().
 *
 * NEW: getOrderAttachments() extracts real uploaded files from
 * req.files (populated by multer, see rehabOrderRoutes.js),
 * matching field names `order_{orderIndex}_attachment_{fileIndex}`
 * - mirrors workOrderController.js's getTicketAttachments()
 * exactly.
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

  const rawOrders = req.body.orders;

  if (Array.isArray(req.body)) {
    return req.body;
  }

  if (Array.isArray(rawOrders)) {
    return rawOrders;
  }

  if (typeof rawOrders === "string") {
    try {
      const parsed = JSON.parse(rawOrders);

      if (!Array.isArray(parsed)) {
        throw new Error(
          "Orders must be an array."
        );
      }

      return parsed;
    } catch (error) {
      const parseError = new Error(
        "The orders field contains invalid JSON."
      );

      parseError.statusCode = 400;
      throw parseError;
    }
  }

  const error = new Error(
    "The orders field is required and must be an array."
  );

  error.statusCode = 400;
  throw error;
}

function getOrderAttachments(
  files,
  orderIndex
) {
  if (!Array.isArray(files)) {
    return [];
  }

  const prefix =
    `order_${orderIndex}_attachment_`;

  return files
    .filter((file) =>
      file.fieldname.startsWith(prefix)
    )
    .map((file) => ({
      fieldName: file.fieldname,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    }));
}

function normalizeOrder(order, attachments) {
  return {
    property: cleanText(order.property),

    unit: cleanText(order.unit),

    unitName: cleanText(order.unitName),

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

    attachments,
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

  const orders = ordersInput.map(
    (order, index) =>
      normalizeOrder(
        order,
        getOrderAttachments(
          req.files,
          index
        )
      )
  );

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