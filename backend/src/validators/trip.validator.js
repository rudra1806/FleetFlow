const { body, param } = require("express-validator");
const { TRIP_STATUS_ARRAY } = require("../utils/constants");

const createTripValidator = [
    body("vehicle")
        .notEmpty()
        .withMessage("Vehicle ID is required")
        .isMongoId()
        .withMessage("Invalid vehicle ID"),

    body("driver")
        .notEmpty()
        .withMessage("Driver ID is required")
        .isMongoId()
        .withMessage("Invalid driver ID"),

    body("cargoWeight")
        .notEmpty()
        .withMessage("Cargo weight is required")
        .isFloat({ min: 0.01 })
        .withMessage("Cargo weight must be a positive number"),

    body("origin")
        .trim()
        .notEmpty()
        .withMessage("Origin is required"),

    body("destination")
        .trim()
        .notEmpty()
        .withMessage("Destination is required"),

    body("distance")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Distance must be a positive number"),

    body("notes")
        .optional()
        .trim(),
];

const updateTripValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid trip ID"),

    body("cargoWeight")
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage("Cargo weight must be a positive number"),

    body("origin")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Origin cannot be empty"),

    body("destination")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Destination cannot be empty"),

    body("distance")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Distance must be a positive number"),

    body("notes")
        .optional()
        .trim(),
];

const updateTripStatusValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid trip ID"),

    body("status")
        .notEmpty()
        .withMessage("Status is required")
        .isIn(TRIP_STATUS_ARRAY)
        .withMessage(`Status must be one of: ${TRIP_STATUS_ARRAY.join(", ")}`),
];

module.exports = {
    createTripValidator,
    updateTripValidator,
    updateTripStatusValidator,
};
