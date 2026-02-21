const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

// Public routes
router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/forgot-password", authController.forgotPassword);

// Protected routes (require authentication)
router.get("/me", authMiddleware, authController.getProfile);
router.put("/profile", authMiddleware, authController.updateProfile);
router.post("/logout", authMiddleware, authController.logoutUser);

module.exports = router;