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

const trackingController = require(
  "../controllers/trackingController"
);

const router = express.Router();

/*
 * --------------------------------------------------
 * Assigned Work Orders
 * --------------------------------------------------
 *
 * GET /api/tracking/work-orders
 *
 * The authentication middleware reads the JWT and
 * adds the logged-in user's information to req.user.
 *
 * The controller then uses req.user.email to return
 * only the Work Orders assigned to that technician.
 */

router.get(
  "/work-orders",
  requireAuth,
  asyncHandler(
    trackingController
      .getMyAssignedWorkOrders
  )
);

/*
 * --------------------------------------------------
 * Technician Shift tracking session
 * --------------------------------------------------
 *
 * POST /api/tracking/start     - Start Shift
 * POST /api/tracking/location  - Record a single location point
 * POST /api/tracking/break     - Break
 * POST /api/tracking/continue  - Continue
 * POST /api/tracking/stop      - Stop / End Shift
 * GET  /api/tracking/session   - Read current session status
 *
 * All routes require an authenticated technician. As with
 * /work-orders above, the technician's email always comes from
 * req.user (the verified JWT), never from the request body/query -
 * see handover doc Section 30.
 */

router.post(
  "/start",
  requireAuth,
  asyncHandler(
    trackingController.startSession
  )
);

router.post(
  "/location",
  requireAuth,
  asyncHandler(
    trackingController.recordLocation
  )
);

router.post(
  "/break",
  requireAuth,
  asyncHandler(
    trackingController.startBreak
  )
);

router.post(
  "/continue",
  requireAuth,
  asyncHandler(
    trackingController.continueSession
  )
);

router.post(
  "/stop",
  requireAuth,
  asyncHandler(
    trackingController.stopSession
  )
);

router.get(
  "/session",
  requireAuth,
  asyncHandler(
    trackingController.getSessionStatus
  )
);

module.exports = router;