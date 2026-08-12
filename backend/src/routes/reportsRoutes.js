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