const { body, param } = require("express-validator");

const DRIVER_STATUS = ["on_duty", "on_trip", "off_duty", "suspended"];

const createDriverValidator = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Driver name is required")
        .isLength({ min: 2, max: 50 })
        .withMessage("Name must be between 2 and 50 characters"),

    body("email")
        .optional()
        .trim()
        .isEmail()
        .withMessage("Invalid email format"),

    body("phone")
        .optional()
        .trim()
        .isMobilePhone()
        .withMessage("Invalid phone number"),

    body("licenseNumber")
        .trim()
        .notEmpty()
        .withMessage("License number is required"),

    body("licenseExpiry")
        .notEmpty()
        .withMessage("License expiry date is required")
        .isISO8601()
        .withMessage("License expiry must be a valid date (YYYY-MM-DD)"),

    body("status")
        .optional()
        .isIn(DRIVER_STATUS)
        .withMessage(`Status must be one of: ${DRIVER_STATUS.join(", ")}`),
];

const updateDriverValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid driver ID"),

    body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage("Name must be between 2 and 50 characters"),

    body("email")
        .optional()
        .trim()
        .isEmail()
        .withMessage("Invalid email format"),

    body("phone")
        .optional()
        .trim()
        .isMobilePhone()
        .withMessage("Invalid phone number"),

    body("licenseNumber")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("License number cannot be empty"),

    body("licenseExpiry")
        .optional()
        .isISO8601()
        .withMessage("License expiry must be a valid date (YYYY-MM-DD)"),

    body("status")
        .optional()
        .isIn(DRIVER_STATUS)
        .withMessage(`Status must be one of: ${DRIVER_STATUS.join(", ")}`),
];

module.exports = {
    createDriverValidator,
    updateDriverValidator,
};
