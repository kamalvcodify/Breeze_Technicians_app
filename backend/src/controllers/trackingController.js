const trackingService = require('../services/trackingService');

/**
 * Returns Work Orders assigned to the currently
 * authenticated technician.
 *
 * Expected authentication middleware output:
 *
 * req.user = {
 *   id,
 *   email,
 *   isAdmin
 * }
 */
const getMyAssignedWorkOrders = async (req, res) => {
  try {
    const technicianEmail =
      req.user?.email;

    if (!technicianEmail) {
      return res.status(401).json({
        success: false,
        message:
          'The logged-in technician email could not be identified.',
        data: [],
      });
    }

    const workOrders =
      await trackingService
        .getAssignedWorkOrdersForTechnician(
          technicianEmail
        );

    return res.status(200).json({
      success: true,
      message:
        'Assigned Work Orders loaded successfully.',
      count: workOrders.length,
      data: workOrders,
    });
  } catch (error) {
    console.error(
      '[Tracking Controller] Failed to load assigned Work Orders:',
      error?.message
    );

    const statusCode =
      Number(error?.statusCode) || 500;

    return res.status(statusCode).json({
      success: false,
      message:
        error?.message ||
        'Unable to load assigned Work Orders.',
      data: [],
    });
  }
};

/**
 * Start Shift.
 *
 * POST /api/tracking/start
 * Body: { workOrderId, latitude, longitude }
 */
const startSession = async (req, res) => {
  try {
    const technicianEmail = req.user?.email;

    if (!technicianEmail) {
      return res.status(401).json({
        success: false,
        message: 'The logged-in technician email could not be identified.',
        data: null,
      });
    }

    const { workOrderId, latitude, longitude } = req.body || {};

    const session = await trackingService.startTrackingSession({
      technicianEmail,
      workOrderId,
      latitude,
      longitude,
    });

    return res.status(201).json({
      success: true,
      message: 'Shift started.',
      data: session,
    });
  } catch (error) {
    console.error('[Tracking Controller] Failed to start shift:', error?.message);

    const statusCode = Number(error?.statusCode) || 500;

    return res.status(statusCode).json({
      success: false,
      message: error?.message || 'Could not start the shift.',
      data: null,
    });
  }
};

/**
 * Records a single location point while a session is Active.
 *
 * POST /api/tracking/location
 * Body: { sessionId, latitude, longitude, accuracy }
 */
const recordLocation = async (req, res) => {
  try {
    const { sessionId, latitude, longitude, accuracy } = req.body || {};

    const session = await trackingService.recordTrackingLocation({
      sessionId,
      latitude,
      longitude,
      accuracy,
      devicePlatform: req.headers['x-device-platform'] || null,
    });

    return res.status(200).json({
      success: true,
      message: 'Location recorded.',
      data: session,
    });
  } catch (error) {
    console.error('[Tracking Controller] Failed to record location:', error?.message);

    const statusCode = Number(error?.statusCode) || 500;

    return res.status(statusCode).json({
      success: false,
      message: error?.message || 'Could not sync your location.',
      data: null,
    });
  }
};

/**
 * Break.
 *
 * POST /api/tracking/break
 * Body: { sessionId }
 */
const startBreak = async (req, res) => {
  try {
    const { sessionId } = req.body || {};

    const session = await trackingService.startTrackingBreak({ sessionId });

    return res.status(200).json({
      success: true,
      message: 'Break started.',
      data: session,
    });
  } catch (error) {
    console.error('[Tracking Controller] Failed to start break:', error?.message);

    const statusCode = Number(error?.statusCode) || 500;

    return res.status(statusCode).json({
      success: false,
      message: error?.message || 'Could not start the break.',
      data: null,
    });
  }
};

/**
 * Continue.
 *
 * POST /api/tracking/continue
 * Body: { sessionId, latitude, longitude }
 */
const continueSession = async (req, res) => {
  try {
    const { sessionId, latitude, longitude } = req.body || {};

    const session = await trackingService.continueTrackingSession({
      sessionId,
      latitude,
      longitude,
    });

    return res.status(200).json({
      success: true,
      message: 'Shift resumed.',
      data: session,
    });
  } catch (error) {
    console.error('[Tracking Controller] Failed to continue shift:', error?.message);

    const statusCode = Number(error?.statusCode) || 500;

    return res.status(statusCode).json({
      success: false,
      message: error?.message || 'Could not resume the shift.',
      data: null,
    });
  }
};

/**
 * Stop / End Shift.
 *
 * POST /api/tracking/stop
 * Body: { sessionId, latitude, longitude }
 */
const stopSession = async (req, res) => {
  try {
    const { sessionId, latitude, longitude } = req.body || {};

    const session = await trackingService.stopTrackingSession({
      sessionId,
      latitude,
      longitude,
    });

    return res.status(200).json({
      success: true,
      message: 'Shift ended.',
      data: session,
    });
  } catch (error) {
    console.error('[Tracking Controller] Failed to stop shift:', error?.message);

    const statusCode = Number(error?.statusCode) || 500;

    return res.status(statusCode).json({
      success: false,
      message: error?.message || 'Could not end the shift.',
      data: null,
    });
  }
};

/**
 * Reads the current session status - used to restore state if the
 * app was closed/reopened mid-shift.
 *
 * GET /api/tracking/session?workOrderId=...
 */
const getSessionStatus = async (req, res) => {
  try {
    const technicianEmail = req.user?.email;
    const { workOrderId } = req.query || {};

    if (!technicianEmail) {
      return res.status(401).json({
        success: false,
        message: 'The logged-in technician email could not be identified.',
        data: null,
      });
    }

    const session = await trackingService.getTrackingSessionStatus({
      technicianEmail,
      workOrderId,
    });

    return res.status(200).json({
      success: true,
      message: session ? 'Active session found.' : 'No active session for this Work Order.',
      data: session,
    });
  } catch (error) {
    console.error('[Tracking Controller] Failed to read session status:', error?.message);

    const statusCode = Number(error?.statusCode) || 500;

    return res.status(statusCode).json({
      success: false,
      message: error?.message || 'Could not load the current shift status.',
      data: null,
    });
  }
};

module.exports = {
  getMyAssignedWorkOrders,
  startSession,
  recordLocation,
  startBreak,
  continueSession,
  stopSession,
  getSessionStatus,
};