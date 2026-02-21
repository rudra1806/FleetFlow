// ==========================================
// FleetFlow - Analytics Routes
// ==========================================
// Defines all REST API endpoints for the Analytics module.
// Mounted at "/api/analytics" in app.js.
//
// Access Control:
//   - Restricted to "manager" and "financial_analyst" roles.
//   - Other roles (dispatcher, safety_officer) cannot access analytics.
//
// Endpoints:
//   GET /fuel-efficiency  — km/L per vehicle
//   GET /vehicle-roi      — ROI % per vehicle
//   GET /cost-per-km      — ₹/km per vehicle
//   GET /export/:type     — CSV download (vehicles|maintenance|trips|expenses)
// ==========================================

const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");
const { authMiddleware, authorize } = require("../middleware/auth.middleware");

// Only managers and financial analysts can view analytics data
const analyticsRoles = ["manager", "financial_analyst"];

// GET /api/analytics/fuel-efficiency — Fuel efficiency report
router.get(
    "/fuel-efficiency",
    authMiddleware,
    authorize(...analyticsRoles),
    analyticsController.getFuelEfficiency
);

// GET /api/analytics/vehicle-roi — Return on Investment report
router.get(
    "/vehicle-roi",
    authMiddleware,
    authorize(...analyticsRoles),
    analyticsController.getVehicleROI
);

// GET /api/analytics/cost-per-km — Operational cost per kilometer
router.get(
    "/cost-per-km",
    authMiddleware,
    authorize(...analyticsRoles),
    analyticsController.getCostPerKm
);

// GET /api/analytics/export/:type — Download CSV report
// :type can be "vehicles", "maintenance", "trips", or "expenses"
router.get(
    "/export/:type",
    authMiddleware,
    authorize(...analyticsRoles),
    analyticsController.exportReport
);

module.exports = router;
