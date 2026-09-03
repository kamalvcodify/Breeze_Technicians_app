const config = require("../config/env");
const zohoCrmInvoiceService = require("./zohoCrmInvoiceService");

/**
 * services/zohoRehabOrderService.js
 * ----------------------------------------------------------------
 * REWRITTEN - Rehab Order now syncs to the SAME Zoho CRM "Invoice1"
 * module as Work Order (via the shared zohoCrmInvoiceService.js
 * engine) instead of Zoho Creator. Each entry becomes its own CRM
 * record. "Rehab_Form" is set to "Yes" (Work Order sets "No") -
 * this is the ONLY thing that distinguishes a Rehab-originated
 * record from a Work-Order-originated one, since both now live in
 * the same module.
 *
 * Per instructions: the record's Name field uses the fixed "Rehab -
 * " prefix + the unit name (e.g. "Rehab - Unit 124"), NOT the plain
 * unit name alone. Rehab Order has no ticket-number equivalent on
 * its form, so Ticket_Id is simply never set for these records
 * (buildInvoiceFields already omits it when ticketId is falsy).
 *
 * createRehabOrder({orders, technicianEmail}) keeps the EXACT SAME
 * function signature the controller already calls - no changes
 * needed upstream at all.
 * ----------------------------------------------------------------
 */

function isTemporaryUnitValue(value) {
  return String(value || "").startsWith("TEMP_");
}

function buildRehabRecordName(order) {
  const unitName = String(order.unitName || "").trim();
  return unitName ? `Rehab - ${unitName}` : "Rehab";
}

async function createRehabOrder({ orders, technicianEmail }) {
  if (!Array.isArray(orders) || orders.length === 0) {
    const error = new Error("At least one Rehab Order entry is required.");
    error.statusCode = 400;
    throw error;
  }

  const results = [];

  for (const order of orders) {
    const recordName = buildRehabRecordName(order);

    const fields = zohoCrmInvoiceService.buildInvoiceFields({
      name: recordName,
      ticketId: null,
      jobType: order.jobType,
      unitId: isTemporaryUnitValue(order.unit) ? null : order.unit,
      unitName: order.unitName,
      propertyId: order.property,
      city: order.city,
      clockIn: order.clockIn,
      clockOut: order.clockOut,
      status: order.status,
      techName: order.technicianName,
      workDetails: order.description,
      date: order.date,
      rehabForm: "Yes",
    });

    console.log(
      `[Rehab Order] Syncing entry "${recordName}" to Zoho CRM Invoice1:`,
      JSON.stringify(fields, null, 2)
    );

    // eslint-disable-next-line no-await-in-loop
    const result = await zohoCrmInvoiceService.syncTicketToCrm({
      fields,
      attachments: order.attachments || [],
    });

    if (!result.success) {
      console.error(
        `[Rehab Order] Entry "${recordName}" failed to sync to Zoho CRM:`,
        result.rejectionReason
      );
    }

    results.push({ recordName, ...result });
  }

  const failedEntries = results.filter((result) => !result.success);

  if (failedEntries.length === results.length) {
    const error = new Error(
      `Could not submit any Rehab Order entries: ${failedEntries
        .map((result) => `${result.recordName} (${result.rejectionReason})`)
        .join("; ")}`
    );
    error.statusCode = 502;
    throw error;
  }

  const totalAttachments = orders.reduce(
    (total, order) => total + (order.attachments || []).length,
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

  const entryDetailMessage =
    failedEntries.length > 0
      ? ` ${failedEntries.length} of ${results.length} entry(ies) could not be synced: ${failedEntries
          .map((result) => result.recordName)
          .join(", ")}.`
      : "";

  return {
    recordIds: results.filter((result) => result.success).map((result) => result.recordId),
    entryResults: results,
    attachmentUploadStatus,
    detail: `The rehab order was submitted successfully.${entryDetailMessage}`,
  };
}

module.exports = {
  createRehabOrder,
};