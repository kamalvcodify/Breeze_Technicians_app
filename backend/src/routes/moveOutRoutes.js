const express = require("express");

const asyncHandler = require("../utils/asyncHandler");

const {
  requireAuth,
} = require("../middleware/authMiddleware");

const moveOutController = require(
  "../controllers/moveOutController"
);

const router = express.Router();

/*
 * --------------------------------------------------
 * Process a Move Out submission
 * --------------------------------------------------
 * Property/Unit lookups reuse the existing Work Order lookup
 * routes (/api/work-orders/lookups/...), same as Rehab Order and
 * Check In/Check Out do.
 */

router.post(
  "/",
  requireAuth,
  asyncHandler(
    moveOutController.submitMoveOut
  )
);

module.exports = router;