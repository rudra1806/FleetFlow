const express = require("express");
const router = express.Router();
const driverController = require("../controllers/driver.controller");
const { authMiddleware, authorize } = require("../middleware/auth.middleware");
const { createDriverValidator, updateDriverValidator } = require("../validators/driver.validator");
const validate = require("../validators/validate");

const allRoles = ["manager", "dispatcher", "safety_officer"];

// GET /api/drivers — list all drivers
router.get(
    "/",
    authMiddleware,
    authorize(...allRoles, "financial_analyst"),
    driverController.getDrivers
);

// POST /api/drivers — manager or dispatcher
router.post(
    "/",
    authMiddleware,
    authorize("manager", "dispatcher"),
    createDriverValidator,
    validate,
    driverController.createDriver
);

// GET /api/drivers/:id — single driver
router.get(
    "/:id",
    authMiddleware,
    authorize(...allRoles, "financial_analyst"),
    driverController.getDriverById
);

// PUT /api/drivers/:id — update driver
router.put(
    "/:id",
    authMiddleware,
    authorize("manager", "dispatcher"),
    updateDriverValidator,
    validate,
    driverController.updateDriver
);

// DELETE /api/drivers/:id — manager only
router.delete(
    "/:id",
    authMiddleware,
    authorize("manager"),
    driverController.deleteDriver
);

module.exports = router;
