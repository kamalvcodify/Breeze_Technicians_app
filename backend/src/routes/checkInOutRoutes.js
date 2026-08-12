const express = require("express");

const asyncHandler = require("../utils/asyncHandler");

const {
  requireAuth,
} = require("../middleware/authMiddleware");

const checkInOutController = require(
  "../controllers/checkInOutController"
);

const router = express.Router();

/*
 * --------------------------------------------------
 * Check In / Check Out submission
 * --------------------------------------------------
 * No Zoho sync yet - see checkInOutController.js. Property lookups
 * reuse the existing Work Order lookup routes
 * (/api/work-orders/lookups/...), same as Rehab Order does.
 */

router.post(
  "/",
  requireAuth,
  asyncHandler(
    checkInOutController.submitCheckInOut
  )
);

module.exports = router;