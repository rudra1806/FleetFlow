// ==========================================
// FleetFlow - Dashboard Routes
// ==========================================
// Defines the dashboard API endpoint.
// Mounted at "/api/dashboard" in app.js.
//
// Access Control:
//   - All authenticated roles can view the dashboard.
//   - The controller aggregates data from all modules safely
//     (won't crash if some modules aren't deployed yet).
// ==========================================

const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");
const { authMiddleware, authorize } = require("../middleware/auth.middleware");

// All four RBAC roles can view the dashboard
const allRoles = ["manager", "dispatcher", "safety_officer", "financial_analyst"];

// GET /api/dashboard — Aggregated KPIs from all modules
router.get(
    "/",
    authMiddleware,
    authorize(...allRoles),
    dashboardController.getDashboardStats
);

module.exports = router;
