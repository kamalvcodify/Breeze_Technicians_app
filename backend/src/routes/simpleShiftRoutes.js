const express = require("express");

const asyncHandler = require("../utils/asyncHandler");

const { requireAuth } = require("../middleware/authMiddleware");

const simpleShiftController = require("../controllers/simpleShiftController");

const router = express.Router();

/**
 * routes/simpleShiftRoutes.js
 * ----------------------------------------------------------------
 * New, separate route for the header bar's Start Shift/End Shift
 * toggle button. Completely independent from trackingRoutes.js
 * (the existing GPS-based shift tracking system), which is
 * untouched.
 * ----------------------------------------------------------------
 */
router.post(
  "/start",
  requireAuth,
  asyncHandler(simpleShiftController.startShift)
);

router.post(
  "/end",
  requireAuth,
  asyncHandler(simpleShiftController.endShift)
);

module.exports = router;