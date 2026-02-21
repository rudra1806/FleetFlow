const { body, param } = require("express-validator");
const {
    VEHICLE_TYPES_ARRAY,
    VEHICLE_STATUS_ARRAY,
    FUEL_TYPES_ARRAY,
} = require("../utils/constants");

const createVehicleValidator = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Vehicle name is required"),

    body("model")
        .trim()
        .notEmpty()
        .withMessage("Vehicle model is required"),

    body("licensePlate")
        .trim()
        .notEmpty()
        .withMessage("License plate is required")
        .isLength({ min: 2, max: 20 })
        .withMessage("License plate must be between 2 and 20 characters"),

    body("type")
        .notEmpty()
        .withMessage("Vehicle type is required")
        .isIn(VEHICLE_TYPES_ARRAY)
        .withMessage(`Vehicle type must be one of: ${VEHICLE_TYPES_ARRAY.join(", ")}`),

    body("maxCapacity")
        .notEmpty()
        .withMessage("Max capacity is required")
        .isFloat({ min: 1 })
        .withMessage("Max capacity must be at least 1"),

    body("currentOdometer")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Odometer must be a positive number"),

    body("fuelType")
        .notEmpty()
        .withMessage("Fuel type is required")
        .isIn(FUEL_TYPES_ARRAY)
        .withMessage(`Fuel type must be one of: ${FUEL_TYPES_ARRAY.join(", ")}`),

    body("acquisitionCost")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Acquisition cost must be a positive number"),

    body("acquisitionDate")
        .optional()
        .isISO8601()
        .withMessage("Acquisition date must be a valid date"),

    body("year")
        .optional()
        .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
        .withMessage("Year must be between 1900 and next year"),

    body("color")
        .optional()
        .trim(),

    body("region")
        .optional()
        .trim(),

    body("notes")
        .optional()
        .trim(),
];

const updateVehicleValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid vehicle ID"),

    body("name")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Vehicle name cannot be empty"),

    body("model")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Model cannot be empty"),

    body("licensePlate")
        .optional()
        .trim()
        .isLength({ min: 2, max: 20 })
        .withMessage("License plate must be between 2 and 20 characters"),

    body("type")
        .optional()
        .isIn(VEHICLE_TYPES_ARRAY)
        .withMessage(`Vehicle type must be one of: ${VEHICLE_TYPES_ARRAY.join(", ")}`),

    body("maxCapacity")
        .optional()
        .isFloat({ min: 1 })
        .withMessage("Max capacity must be at least 1"),

    body("currentOdometer")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Odometer must be a positive number"),

    body("fuelType")
        .optional()
        .isIn(FUEL_TYPES_ARRAY)
        .withMessage(`Fuel type must be one of: ${FUEL_TYPES_ARRAY.join(", ")}`),

    body("acquisitionCost")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Acquisition cost must be a positive number"),

    body("year")
        .optional()
        .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
        .withMessage("Year must be between 1900 and next year"),

    body("color")
        .optional()
        .trim(),

    body("region")
        .optional()
        .trim(),

    body("notes")
        .optional()
        .trim(),
];

const updateVehicleStatusValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid vehicle ID"),

    body("status")
        .notEmpty()
        .withMessage("Status is required")
        .isIn(VEHICLE_STATUS_ARRAY)
        .withMessage(`Status must be one of: ${VEHICLE_STATUS_ARRAY.join(", ")}`),
];

module.exports = {
    createVehicleValidator,
    updateVehicleValidator,
    updateVehicleStatusValidator,
};
