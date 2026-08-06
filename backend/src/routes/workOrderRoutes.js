const express = require(
  "express"
);

const multer = require(
  "multer"
);

const asyncHandler = require(
  "../utils/asyncHandler"
);

const {
  requireAuth,
} = require(
  "../middleware/authMiddleware"
);

const workOrderController =
  require(
    "../controllers/workOrderController"
  );

const workOrderLookupController =
  require(
    "../controllers/workOrderLookupController"
  );

const router =
  express.Router();

const upload = multer({
  storage:
    multer.memoryStorage(),

  limits: {
    fileSize:
      25 * 1024 * 1024,

    files: 15,
  },
});

/*
 * --------------------------------------------------
 * Property lookup routes
 * --------------------------------------------------
 *
 * Important:
 * Keep /search before /:propertyId routes
 * so Express does not treat "search" as a record ID.
 */

router.get(
  "/lookups/properties/search",
  requireAuth,
  asyncHandler(
    workOrderLookupController
      .searchProperties
  )
);

router.get(
  "/lookups/properties",
  requireAuth,
  asyncHandler(
    workOrderLookupController
      .listProperties
  )
);

/*
 * --------------------------------------------------
 * Unit lookup routes
 * --------------------------------------------------
 */

router.get(
  "/lookups/properties/:propertyId/units/search",
  requireAuth,
  asyncHandler(
    workOrderLookupController
      .searchUnitsByProperty
  )
);

router.get(
  "/lookups/properties/:propertyId/units",
  requireAuth,
  asyncHandler(
    workOrderLookupController
      .listUnitsByProperty
  )
);

/*
 * --------------------------------------------------
 * Work Order submission
 * --------------------------------------------------
 */

router.post(
  "/",
  requireAuth,
  upload.any(),
  asyncHandler(
    workOrderController
      .submitWorkOrder
  )
);

module.exports = router;