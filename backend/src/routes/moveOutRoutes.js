const express = require("express");

const multer = require("multer");

const asyncHandler = require("../utils/asyncHandler");

const { requireAuth } = require("../middleware/authMiddleware");

const moveOutController = require("../controllers/moveOutController");

const router = express.Router();

/**
 * NEW: multer middleware added - Move Out never had real file
 * upload support before. Single-entry form, so fewer max files
 * needed than Work Order/Rehab Order's multi-ticket limits.
 */
const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 10,
  },
});

router.post(
  "/",
  requireAuth,
  upload.any(),
  asyncHandler(moveOutController.submitMoveOut),
);

module.exports = router;
