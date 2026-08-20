const zohoReportService = require(
  "../services/zohoReportService"
);

/**
 * controllers/reportsController.js
 * ----------------------------------------------------------------
 * getReport handles all 5 reports.
 *
 * FIX: getReportImage now accepts 5 structured query params
 * (reportLinkName, recordId, subformName, fieldName,
 * subformRecordId) instead of a single raw "path" string - the raw
 * string from Zoho's Image field turned out not to be a working
 * download path. These 5 pieces are exactly what
 * zohoReportService.js already includes per-image in each report
 * response (row.groups[].images[]), and match Zoho's documented
 * Download File from Subform API shape.
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
  const { reportLinkName, recordId, subformName, fieldName, subformRecordId } = req.query;

  if (!reportLinkName || !recordId || !subformName || !fieldName || !subformRecordId) {
    return res.status(400).json({
      detail:
        "reportLinkName, recordId, subformName, fieldName, and subformRecordId are all required.",
    });
  }

  const dataUri = await zohoReportService.fetchImageAsDataUri({
    reportLinkName,
    recordId,
    subformName,
    fieldName,
    subformRecordId,
  });

  return res.status(200).json({ dataUri });
}

module.exports = {
  getReport,
  getReportImage,
};