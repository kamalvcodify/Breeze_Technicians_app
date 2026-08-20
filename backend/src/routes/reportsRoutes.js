const express = require("express");

const asyncHandler = require("../utils/asyncHandler");

const {
  requireAuth,
} = require("../middleware/authMiddleware");

const reportsController = require(
  "../controllers/reportsController"
);

const router = express.Router();

/*
 * --------------------------------------------------
 * Attachment image proxy - MUST be registered before /:reportKey
 * below, otherwise Express would treat "image" as a reportKey
 * value instead of matching this route.
 * --------------------------------------------------
 */

router.get(
  "/image",
  requireAuth,
  asyncHandler(reportsController.getReportImage)
);

/*
 * --------------------------------------------------
 * Report fetching - one route handles all 5 report keys:
 * workOrder, rehabOrder, checkInOut, moveOut, rentReadyChecklist
 * --------------------------------------------------
 */

router.get(
  "/:reportKey",
  requireAuth,
  asyncHandler(reportsController.getReport)
);

module.exports = router;