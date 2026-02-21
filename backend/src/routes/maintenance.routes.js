// ==========================================
// FleetFlow - Maintenance Routes
// ==========================================
// Defines all REST API endpoints for the Maintenance module.
// Mounted at "/api/maintenance" in app.js.
//
// Route Order Matters:
//   /vehicle/:vehicleId MUST come before /:id, otherwise Express
//   treats "vehicle" as the :id parameter.
//
// Access Control:
//   - Read operations (GET)        → all authenticated roles
//   - Write operations (POST/PUT)  → manager only
// ==========================================

const express = require("express");
const router = express.Router();
const maintenanceController = require("../controllers/maintenance.controller");
const { authMiddleware, authorize } = require("../middleware/auth.middleware");

// All four RBAC roles — used for read-only routes
const allRoles = ["manager", "dispatcher", "safety_officer", "financial_analyst"];

// ── Read Routes (all roles) ─────────────────────────────────

// GET /api/maintenance — Paginated list with filters
router.get(
    "/",
    authMiddleware,
    authorize(...allRoles),
    maintenanceController.getAllMaintenance
);

// GET /api/maintenance/vehicle/:vehicleId — Service history for one vehicle
// (must come before /:id to avoid "vehicle" being parsed as an ObjectId)
router.get(
    "/vehicle/:vehicleId",
    authMiddleware,
    authorize(...allRoles),
    maintenanceController.getMaintenanceByVehicle
);

// GET /api/maintenance/:id — Single maintenance record
router.get(
    "/:id",
    authMiddleware,
    authorize(...allRoles),
    maintenanceController.getMaintenanceById
);

// ── Write Routes (manager only) ────────────────────────────

// POST /api/maintenance — Create service log (auto-sets vehicle to "in_shop")
router.post(
    "/",
    authMiddleware,
    authorize("manager"),
    maintenanceController.createMaintenance
);

// PUT /api/maintenance/:id — Update/complete maintenance (auto-frees vehicle on completion)
router.put(
    "/:id",
    authMiddleware,
    authorize("manager"),
    maintenanceController.updateMaintenance
);

module.exports = router;
