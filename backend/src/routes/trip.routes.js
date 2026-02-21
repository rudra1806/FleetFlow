const express = require("express");
const router = express.Router();
const tripController = require("../controllers/trip.controller");
const { authMiddleware, authorize } = require("../middleware/auth.middleware");
const { createTripValidator, updateTripValidator, updateTripStatusValidator } = require("../validators/trip.validator");
const validate = require("../validators/validate");

const opsRoles = ["manager", "dispatcher"];
const viewRoles = [...opsRoles, "safety_officer", "financial_analyst"];

// GET /api/trips
router.get(
    "/",
    authMiddleware,
    authorize(...viewRoles),
    tripController.getAllTrips
);

// POST /api/trips (Draft)
router.post(
    "/",
    authMiddleware,
    authorize(...opsRoles),
    createTripValidator,
    validate,
    tripController.createTrip
);

// GET /api/trips/:id
router.get(
    "/:id",
    authMiddleware,
    authorize(...viewRoles),
    tripController.getTripById
);

// PUT /api/trips/:id (Edit draft trip)
router.put(
    "/:id",
    authMiddleware,
    authorize(...opsRoles),
    updateTripValidator,
    validate,
    tripController.updateTrip
);

// PATCH /api/trips/:id/status
router.patch(
    "/:id/status",
    authMiddleware,
    authorize(...opsRoles),
    updateTripStatusValidator,
    validate,
    tripController.updateTripStatus
);

module.exports = router;
