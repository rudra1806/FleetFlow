const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicle.controller");
const { authMiddleware, authorize } = require("../middleware/auth.middleware");

const allRoles = ["manager", "dispatcher", "safety_officer", "financial_analyst"];

// GET /api/vehicles/stats — must come before /:id
router.get(
    "/stats",
    authMiddleware,
    authorize(...allRoles),
    vehicleController.getVehicleStats
);

// GET /api/vehicles — list with pagination, filters, search
router.get(
    "/",
    authMiddleware,
    authorize(...allRoles),
    vehicleController.getAllVehicles
);

// POST /api/vehicles — manager only
router.post(
    "/",
    authMiddleware,
    authorize("manager"),
    vehicleController.createVehicle
);

// GET /api/vehicles/:id — single vehicle
router.get(
    "/:id",
    authMiddleware,
    authorize(...allRoles),
    vehicleController.getVehicleById
);

// PUT /api/vehicles/:id — manager only
router.put(
    "/:id",
    authMiddleware,
    authorize("manager"),
    vehicleController.updateVehicle
);

// DELETE /api/vehicles/:id — manager only
router.delete(
    "/:id",
    authMiddleware,
    authorize("manager"),
    vehicleController.deleteVehicle
);

// PATCH /api/vehicles/:id/status — manager only
router.patch(
    "/:id/status",
    authMiddleware,
    authorize("manager"),
    vehicleController.updateVehicleStatus
);

module.exports = router;
