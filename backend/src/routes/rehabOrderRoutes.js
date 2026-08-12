const express = require(
  "express"
);

const asyncHandler = require(
  "../utils/asyncHandler"
);

const {
  requireAuth,
} = require(
  "../middleware/authMiddleware"
);

const rehabOrderController =
  require(
    "../controllers/rehabOrderController"
  );

const router =
  express.Router();

/*
 * --------------------------------------------------
 * Rehab Order submission
 * --------------------------------------------------
 *
 * No multer/file-upload middleware here (unlike
 * workOrderRoutes.js) - per instructions, Zoho attachment upload
 * is intentionally not wired up yet, so this route only needs
 * plain JSON body parsing (already applied globally in app.js).
 *
 * Property/Unit lookups are NOT duplicated here - Rehab Order
 * reuses the existing Work Order lookup routes
 * (/api/work-orders/lookups/...), since both pull from the same
 * Zoho CRM Products/Units modules.
 */

router.post(
  "/",
  requireAuth,
  asyncHandler(
    rehabOrderController
      .submitRehabOrder
  )
);

module.exports = router;