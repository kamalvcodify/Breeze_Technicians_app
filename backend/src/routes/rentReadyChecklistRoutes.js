const express = require("express");

const asyncHandler = require("../utils/asyncHandler");

const { requireAuth } = require("../middleware/authMiddleware");

const rentReadyChecklistController = require("../controllers/rentReadyChecklistController");

const router = express.Router();

/*
 * --------------------------------------------------
 * Rent Ready Checklist submission
 * --------------------------------------------------
 * Property/Unit lookups reuse the existing Work Order lookup
 * routes (/api/work-orders/lookups/...), same as the other forms.
 */

router.post(
  "/",
  requireAuth,
  asyncHandler(rentReadyChecklistController.submitRentReadyChecklist),
);

module.exports = router;
