const zohoReportService = require(
  "../services/zohoReportService"
);

/**
 * controllers/reportsController.js
 * ----------------------------------------------------------------
 * ONE controller action handles all 5 reports - reportKey comes
 * from the route param and is validated inside
 * zohoReportService.fetchReport() (throws a 404-flagged error for
 * an unknown key).
 * ----------------------------------------------------------------
 */
async function getReport(req, res) {
  const { reportKey } = req.params;

  const result = await zohoReportService.fetchReport(
    reportKey,
    req.user.email
  );

  return res.status(200).json(result);
}

module.exports = {
  getReport,
};