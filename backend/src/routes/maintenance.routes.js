const express = require("express");
const router = express.Router();
const maintenanceController = require("../controllers/maintenance.controller");
const { authMiddleware, authorize } = require("../middleware/auth.middleware");

const allRoles = ["manager", "dispatcher", "safety_officer", "financial_analyst"];

// GET /api/maintenance — list all maintenance records
router.get(
    "/",
    authMiddleware,
    authorize(...allRoles),
    maintenanceController.getAllMaintenance
);

// POST /api/maintenance — manager only (creates log & auto sets vehicle in_shop)
router.post(
    "/",
    authMiddleware,
    authorize("manager"),
    maintenanceController.createMaintenance
);

// GET /api/maintenance/vehicle/:vehicleId — service history for a vehicle
// Must come before /:id
router.get(
    "/vehicle/:vehicleId",
    authMiddleware,
    authorize(...allRoles),
    maintenanceController.getMaintenanceByVehicle
);

// GET /api/maintenance/:id — single maintenance record
router.get(
    "/:id",
    authMiddleware,
    authorize(...allRoles),
    maintenanceController.getMaintenanceById
);

// PUT /api/maintenance/:id — update/complete maintenance (manager only)
router.put(
    "/:id",
    authMiddleware,
    authorize("manager"),
    maintenanceController.updateMaintenance
);

module.exports = router;
