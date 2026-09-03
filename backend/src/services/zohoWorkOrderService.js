const config = require("../config/env");
const zohoCrmInvoiceService = require("./zohoCrmInvoiceService");

/**
 * services/zohoWorkOrderService.js
 * ----------------------------------------------------------------
 * REWRITTEN - Work Order now syncs to Zoho CRM's "Invoice1" module
 * instead of Zoho Creator. Per the confirmed architecture: EACH
 * TICKET becomes its OWN CRM record (previously, Creator combined
 * up to 3 tickets into ONE record). Attachments upload directly to
 * each ticket's own record via zohoCrmInvoiceService.js - no more
 * two-phase subform dance (no create-with-sequence-rows, no
 * 8-second settling delays, no re-fetch-and-match-by-sequence, no
 * separate Attachment_Sync marking step). All of that Creator-
 * specific complexity is gone - CRM attachments are just "create
 * the record, then attach files to it."
 *
 * createWorkOrder({tickets, technicianEmail}) keeps the EXACT SAME
 * function signature the controller already calls - no changes
 * needed anywhere upstream (workOrderController.js, routes,
 * frontend) at all.
 * ----------------------------------------------------------------
 */

function isTemporaryUnitValue(value) {
  return String(value || "").startsWith("TEMP_");
}

async function createWorkOrder({ tickets, technicianEmail }) {
  if (!Array.isArray(tickets) || tickets.length === 0) {
    const error = new Error("At least one ticket is required.");
    error.statusCode = 400;
    throw error;
  }

  const results = [];

  for (const ticket of tickets) {
    const fields = zohoCrmInvoiceService.buildInvoiceFields({
      name: ticket.ticketId,
      ticketId: ticket.ticketId,
      jobType: ticket.jobType,
      unitId: isTemporaryUnitValue(ticket.unit) ? null : ticket.unit,
      unitName: ticket.unitName,
      propertyId: ticket.property,
      city: ticket.city,
      clockIn: ticket.clockIn,
      clockOut: ticket.clockOut,
      status: ticket.status,
      techName: ticket.technicianName,
      workDetails: ticket.workDetails,
      date: ticket.date,
      rehabForm: "No",
    });

    console.log(
      `[Work Order] Syncing ticket "${ticket.ticketId}" to Zoho CRM Invoice1:`,
      JSON.stringify(fields, null, 2)
    );

    // eslint-disable-next-line no-await-in-loop
    const result = await zohoCrmInvoiceService.syncTicketToCrm({
      fields,
      attachments: ticket.attachments || [],
    });

    if (!result.success) {
      console.error(
        `[Work Order] Ticket "${ticket.ticketId}" failed to sync to Zoho CRM:`,
        result.rejectionReason
      );
    }

    results.push({ ticketId: ticket.ticketId, ...result });
  }

  const failedTickets = results.filter((result) => !result.success);

  if (failedTickets.length === results.length) {
    const error = new Error(
      `Could not submit any tickets: ${failedTickets
        .map((result) => `${result.ticketId} (${result.rejectionReason})`)
        .join("; ")}`
    );
    error.statusCode = 502;
    throw error;
  }

  const totalAttachments = tickets.reduce(
    (total, ticket) => total + (ticket.attachments || []).length,
    0
  );

  const totalUploaded = results.reduce((total, result) => total + result.uploaded, 0);
  const allFailedFileNames = results.flatMap((result) => result.failedFileNames);

  let attachmentUploadStatus = "No attachments supplied.";

  if (totalAttachments > 0) {
    attachmentUploadStatus =
      allFailedFileNames.length === 0
        ? `${totalUploaded} of ${totalAttachments} image(s) uploaded successfully.`
        : `${totalUploaded} of ${totalAttachments} image(s) uploaded. Failed to upload: ${allFailedFileNames.join(", ")}.`;
  }

  const ticketDetailMessage =
    failedTickets.length > 0
      ? ` ${failedTickets.length} of ${results.length} ticket(s) could not be synced: ${failedTickets
          .map((result) => result.ticketId)
          .join(", ")}.`
      : "";

  return {
    recordIds: results.filter((result) => result.success).map((result) => result.recordId),
    ticketResults: results,
    attachmentUploadStatus,
    detail: `The work order was submitted successfully.${ticketDetailMessage}`,
  };
}

module.exports = {
  createWorkOrder,
};