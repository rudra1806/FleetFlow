const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");
const { authMiddleware, authorize } = require("../middleware/auth.middleware");

// Analytics routes — managers & financial analysts
const analyticsRoles = ["manager", "financial_analyst"];

// GET /api/analytics/fuel-efficiency
router.get(
    "/fuel-efficiency",
    authMiddleware,
    authorize(...analyticsRoles),
    analyticsController.getFuelEfficiency
);

// GET /api/analytics/vehicle-roi
router.get(
    "/vehicle-roi",
    authMiddleware,
    authorize(...analyticsRoles),
    analyticsController.getVehicleROI
);

// GET /api/analytics/cost-per-km
router.get(
    "/cost-per-km",
    authMiddleware,
    authorize(...analyticsRoles),
    analyticsController.getCostPerKm
);

// GET /api/analytics/export/:type — CSV export
router.get(
    "/export/:type",
    authMiddleware,
    authorize(...analyticsRoles),
    analyticsController.exportReport
);

module.exports = router;
