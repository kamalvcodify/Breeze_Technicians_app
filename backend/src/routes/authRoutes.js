const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/check-email", asyncHandler(authController.checkEmail));
router.post("/login", asyncHandler(authController.login));
router.post("/signup", asyncHandler(authController.signup));
router.post("/forgot-password", asyncHandler(authController.forgotPassword));
router.post("/accept-terms", asyncHandler(authController.acceptTerms));
module.exports = router;
