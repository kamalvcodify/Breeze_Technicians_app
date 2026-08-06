const zohoWorkOrderService = require(
  "../services/zohoWorkOrderService"
);

const MAX_TICKETS = 3;

function cleanText(value) {
  return String(value || "").trim();
}

function parseTickets(req) {
  if (!req.body) {
    const error = new Error(
      "The request body is missing."
    );

    error.statusCode = 400;
    throw error;
  }

  const rawTickets = req.body.tickets;

  if (!rawTickets) {
    const error = new Error(
      "The tickets field is required."
    );

    error.statusCode = 400;
    throw error;
  }

  if (Array.isArray(rawTickets)) {
    return rawTickets;
  }

  try {
    const parsed = JSON.parse(rawTickets);

    if (!Array.isArray(parsed)) {
      throw new Error(
        "Tickets must be an array."
      );
    }

    return parsed;
  } catch (error) {
    const parseError = new Error(
      "The tickets field contains invalid JSON."
    );

    parseError.statusCode = 400;
    throw parseError;
  }
}

function getTicketAttachments(
  files,
  ticketIndex
) {
  if (!Array.isArray(files)) {
    return [];
  }

  const prefix =
    `ticket_${ticketIndex}_attachment_`;

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

function normalizeTicket(
  ticket,
  attachments
) {
  return {
    ticketId: cleanText(
      ticket.ticketId
    ),

    city: cleanText(
      ticket.city
    ),

    technicianName: cleanText(
      ticket.technicianName
    ),

    /*
     * Property and Unit should contain Zoho lookup IDs,
     * not display labels.
     */
    property: cleanText(
      ticket.property
    ),

    unit: cleanText(
      ticket.unit
    ),

    status: cleanText(
      ticket.status
    ),

    clockIn: cleanText(
      ticket.clockIn
    ),

    clockOut: cleanText(
      ticket.clockOut
    ),

    jobType: cleanText(
      ticket.jobType
    ),

    date: cleanText(
      ticket.date
    ),

    workDetails: cleanText(
      ticket.workDetails
    ),

    attachments,
  };
}

function validateTicket(
  ticket,
  index
) {
  const errors = [];

  if (!ticket.ticketId) {
    errors.push(
      `Ticket ${index + 1}: Ticket ID is required.`
    );
  }

  if (!ticket.city) {
    errors.push(
      `Ticket ${index + 1}: City is required.`
    );
  }

  if (!ticket.technicianName) {
    errors.push(
      `Ticket ${index + 1}: Technician name is required.`
    );
  }

  if (!ticket.property) {
    errors.push(
      `Ticket ${index + 1}: Property is required.`
    );
  }

  if (!ticket.unit) {
    errors.push(
      `Ticket ${index + 1}: Unit is required.`
    );
  }

  if (!ticket.status) {
    errors.push(
      `Ticket ${index + 1}: Status is required.`
    );
  }

  if (!ticket.jobType) {
    errors.push(
      `Ticket ${index + 1}: Job type is required.`
    );
  }

  if (!ticket.date) {
    errors.push(
      `Ticket ${index + 1}: Date is required.`
    );
  }

  if (!ticket.workDetails) {
    errors.push(
      `Ticket ${index + 1}: Work details are required.`
    );
  }

  return errors;
}

async function submitWorkOrder(
  req,
  res
) {
  const ticketsInput =
    parseTickets(req);

  if (ticketsInput.length === 0) {
    return res.status(400).json({
      detail:
        "At least one ticket is required.",
    });
  }

  if (
    ticketsInput.length >
    MAX_TICKETS
  ) {
    return res.status(400).json({
      detail:
        `A maximum of ${MAX_TICKETS} tickets can be submitted.`,
    });
  }

  const tickets =
    ticketsInput.map(
      (ticket, index) =>
        normalizeTicket(
          ticket,
          getTicketAttachments(
            req.files,
            index
          )
        )
    );

  const validationErrors =
    tickets.flatMap(
      (ticket, index) =>
        validateTicket(
          ticket,
          index
        )
    );

  if (
    validationErrors.length > 0
  ) {
    return res.status(400).json({
      detail:
        "Please correct the Work Order information.",

      errors:
        validationErrors,
    });
  }

  const duplicateTicketIds =
    tickets
      .map(
        (ticket) =>
          ticket.ticketId
      )
      .filter(
        (
          ticketId,
          index,
          allTicketIds
        ) =>
          allTicketIds.indexOf(
            ticketId
          ) !== index
      );

  if (
    duplicateTicketIds.length > 0
  ) {
    return res.status(400).json({
      detail:
        "The same Ticket ID cannot be submitted more than once.",

      duplicateTicketIds:
        [
          ...new Set(
            duplicateTicketIds
          ),
        ],
    });
  }

  const result =
    await zohoWorkOrderService
      .createWorkOrder({
        tickets,
        technicianEmail:
          req.user.email,
      });

  return res.status(201).json({
    detail:
      "The Work Order was submitted successfully.",

    recordId:
      result.recordId,

    ticketCount:
      tickets.length,

    attachmentsReceived:
      tickets.reduce(
        (total, ticket) =>
          total +
          ticket.attachments.length,
        0
      ),

    attachmentUploadStatus:
      result.attachmentUploadStatus,

    zoho:
      result.zohoResponse,
  });
}

module.exports = {
  submitWorkOrder,
};