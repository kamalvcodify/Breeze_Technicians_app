const zohoReportService = require(
  "../services/zohoReportService"
);

/**
 * controllers/reportsController.js
 * ----------------------------------------------------------------
 * getReport handles all 5 reports - reportKey comes from the route
 * param, isAdmin from the JWT (req.user.isAdmin).
 *
 * FIX: getReportImage now validates by ref.source ("crm" or
 * "creator") instead of hard-requiring the old 5-field
 * Creator-only shape - Work Order, Rehab Order, Check In/Out, and
 * Rent Ready Checklist now send CRM-shaped refs (source, module,
 * recordId, attachmentId), while Move Out (unchanged) still sends
 * the original Creator-shaped ref (reportLinkName, recordId,
 * subformName, fieldName, subformRecordId). The whole query object
 * is passed straight through to fetchImageAsDataUri(), which
 * branches on source itself - no need to duplicate that validation
 * here.
 * ----------------------------------------------------------------
 */
async function getReport(req, res) {
  const { reportKey } = req.params;

  const result = await zohoReportService.fetchReport(
    reportKey,
    req.user.email,
    req.user.isAdmin
  );

  return res.status(200).json(result);
}

async function getReportImage(req, res) {
  const ref = req.query || {};

  if (!ref.source) {
    return res.status(400).json({
      detail: "The 'source' query parameter ('crm' or 'creator') is required.",
    });
  }

  const dataUri = await zohoReportService.fetchImageAsDataUri(ref);

  return res.status(200).json({ dataUri });
}

module.exports = {
  getReport,
  getReportImage,
};