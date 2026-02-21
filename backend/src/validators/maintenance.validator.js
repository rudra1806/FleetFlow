const { body, param } = require("express-validator");
const {
    SERVICE_TYPES_ARRAY,
    MAINTENANCE_STATUS_ARRAY,
} = require("../utils/constants");

const createMaintenanceValidator = [
    body("vehicle")
        .notEmpty()
        .withMessage("Vehicle ID is required")
        .isMongoId()
        .withMessage("Invalid vehicle ID"),

    body("serviceType")
        .notEmpty()
        .withMessage("Service type is required")
        .isIn(SERVICE_TYPES_ARRAY)
        .withMessage(`Service type must be one of: ${SERVICE_TYPES_ARRAY.join(", ")}`),

    body("description")
        .trim()
        .notEmpty()
        .withMessage("Description is required"),

    body("cost")
        .notEmpty()
        .withMessage("Cost is required")
        .isFloat({ min: 0 })
        .withMessage("Cost must be a positive number"),

    body("serviceDate")
        .optional()
        .isISO8601()
        .withMessage("Service date must be a valid date"),

    body("mechanic")
        .optional()
        .trim(),

    body("notes")
        .optional()
        .trim(),
];

const updateMaintenanceValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid maintenance ID"),

    body("serviceType")
        .optional()
        .isIn(SERVICE_TYPES_ARRAY)
        .withMessage(`Service type must be one of: ${SERVICE_TYPES_ARRAY.join(", ")}`),

    body("description")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Description cannot be empty"),

    body("cost")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Cost must be a positive number"),

    body("serviceDate")
        .optional()
        .isISO8601()
        .withMessage("Service date must be a valid date"),

    body("status")
        .optional()
        .isIn(MAINTENANCE_STATUS_ARRAY)
        .withMessage(`Status must be one of: ${MAINTENANCE_STATUS_ARRAY.join(", ")}`),

    body("mechanic")
        .optional()
        .trim(),

    body("notes")
        .optional()
        .trim(),
];

module.exports = {
    createMaintenanceValidator,
    updateMaintenanceValidator,
};
