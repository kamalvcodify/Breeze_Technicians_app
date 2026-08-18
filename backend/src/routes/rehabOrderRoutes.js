const express = require("express");

const multer = require("multer");

const asyncHandler = require("../utils/asyncHandler");

const {
  requireAuth,
} = require("../middleware/authMiddleware");

const rehabOrderController = require(
  "../controllers/rehabOrderController"
);

const router = express.Router();

/**
 * NEW: multer middleware added - Rehab Order never had real file
 * upload support before (attachments were intentionally excluded
 * until now). Mirrors workOrderRoutes.js's config exactly.
 */
const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 30,
  },
});

/*
 * --------------------------------------------------
 * Rehab Order submission
 * --------------------------------------------------
 * Property/Unit lookups reuse the existing Work Order lookup
 * routes (/api/work-orders/lookups/...), since both pull from the
 * same Zoho CRM Products/Units modules.
 */

router.post(
  "/",
  requireAuth,
  upload.any(),
  asyncHandler(
    rehabOrderController.submitRehabOrder
  )
);

module.exports = router;