const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");
const { authMiddleware, authorize } = require("../middleware/auth.middleware");

const allRoles = ["manager", "dispatcher", "safety_officer", "financial_analyst"];

// GET /api/dashboard — All authenticated users can view dashboard
router.get(
    "/",
    authMiddleware,
    authorize(...allRoles),
    dashboardController.getDashboardStats
);

module.exports = router;
