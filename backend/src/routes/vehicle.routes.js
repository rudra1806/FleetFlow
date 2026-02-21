// ==========================================
// FleetFlow - Vehicle Routes
// ==========================================
// Defines all REST API endpoints for the Vehicle module.
// Mounted at "/api/vehicles" in app.js.
//
// Route Order Matters:
//   /stats MUST be defined before /:id, otherwise Express
//   treats "stats" as an :id parameter and tries to look it up.
//
// Access Control:
//   - Read operations (GET)   → all authenticated roles
//   - Write operations (POST/PUT/DELETE/PATCH) → manager only
// ==========================================

const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicle.controller");
const { authMiddleware, authorize } = require("../middleware/auth.middleware");

// All four RBAC roles — used for read-only routes
const allRoles = ["manager", "dispatcher", "safety_officer", "financial_analyst"];

// ── Read Routes (all roles) ─────────────────────────────────

// GET /api/vehicles/stats — Dashboard KPI cards (must come before /:id)
router.get(
    "/stats",
    authMiddleware,
    authorize(...allRoles),
    vehicleController.getVehicleStats
);

// GET /api/vehicles — Paginated list with filters & search
router.get(
    "/",
    authMiddleware,
    authorize(...allRoles),
    vehicleController.getAllVehicles
);

// GET /api/vehicles/:id — Single vehicle details
router.get(
    "/:id",
    authMiddleware,
    authorize(...allRoles),
    vehicleController.getVehicleById
);

// ── Write Routes (manager only) ────────────────────────────

// POST /api/vehicles — Register a new vehicle
router.post(
    "/",
    authMiddleware,
    authorize("manager"),
    vehicleController.createVehicle
);

// PUT /api/vehicles/:id — Update general vehicle fields
router.put(
    "/:id",
    authMiddleware,
    authorize("manager"),
    vehicleController.updateVehicle
);

// DELETE /api/vehicles/:id — Remove vehicle from fleet
router.delete(
    "/:id",
    authMiddleware,
    authorize("manager"),
    vehicleController.deleteVehicle
);

// PATCH /api/vehicles/:id/status — Manual status transition (available ↔ retired)
router.patch(
    "/:id/status",
    authMiddleware,
    authorize("manager"),
    vehicleController.updateVehicleStatus
);

module.exports = router;
