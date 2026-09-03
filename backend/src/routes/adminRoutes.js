const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const adminController = require("../controllers/adminController");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.post("/users", asyncHandler(adminController.addUser));
router.get("/users", asyncHandler(adminController.listUsers));
router.delete("/users/:id", asyncHandler(adminController.deleteUser));

module.exports = router;