const { body } = require("express-validator");
const { USER_ROLES_ARRAY } = require("../utils/constants");

const registerValidator = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ min: 2, max: 50 })
        .withMessage("Name must be between 2 and 50 characters"),

    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),

    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),

    body("role")
        .optional()
        .isIn(USER_ROLES_ARRAY)
        .withMessage(`Invalid role. Allowed: ${USER_ROLES_ARRAY.join(", ")}`),

    body("phone")
        .optional()
        .trim()
        .isMobilePhone()
        .withMessage("Invalid phone number"),
];

const loginValidator = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),

    body("password")
        .notEmpty()
        .withMessage("Password is required"),
];

const forgotPasswordValidator = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),
];

const updateProfileValidator = [
    body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage("Name must be between 2 and 50 characters"),

    body("phone")
        .optional()
        .trim()
        .isMobilePhone()
        .withMessage("Invalid phone number"),
];

module.exports = {
    registerValidator,
    loginValidator,
    forgotPasswordValidator,
    updateProfileValidator,
};
