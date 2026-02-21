const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const { registerValidator, loginValidator, forgotPasswordValidator, updateProfileValidator } = require("../validators/auth.validator");
const validate = require("../validators/validate");

// Public routes
router.post("/register", registerValidator, validate, authController.registerUser);
router.post("/login", loginValidator, validate, authController.loginUser);
router.post("/forgot-password", forgotPasswordValidator, validate, authController.forgotPassword);

// Protected routes (require authentication)
router.get("/me", authMiddleware, authController.getProfile);
router.put("/profile", authMiddleware, updateProfileValidator, validate, authController.updateProfile);
router.post("/logout", authMiddleware, authController.logoutUser);

module.exports = router;