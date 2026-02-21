const { body, param } = require("express-validator");
const { EXPENSE_TYPES_ARRAY } = require("../utils/constants");

const createExpenseValidator = [
    body("vehicle")
        .notEmpty()
        .withMessage("Vehicle ID is required")
        .isMongoId()
        .withMessage("Invalid vehicle ID"),

    body("trip")
        .optional()
        .isMongoId()
        .withMessage("Invalid trip ID"),

    body("type")
        .notEmpty()
        .withMessage("Expense type is required")
        .isIn(EXPENSE_TYPES_ARRAY)
        .withMessage(`Expense type must be one of: ${EXPENSE_TYPES_ARRAY.join(", ")}`),

    body("amount")
        .notEmpty()
        .withMessage("Amount is required")
        .isFloat({ min: 0.01 })
        .withMessage("Amount must be a positive number"),

    body("liters")
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage("Liters must be a positive number"),

    body("date")
        .optional()
        .isISO8601()
        .withMessage("Date must be a valid date"),

    body("notes")
        .optional()
        .trim(),

    // Custom: if type is "fuel", liters is required
    body("liters").custom((value, { req }) => {
        if (req.body.type === "fuel" && (!value || value <= 0)) {
            throw new Error("Liters is required for fuel expenses");
        }
        return true;
    }),
];

const updateExpenseValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid expense ID"),

    body("type")
        .optional()
        .isIn(EXPENSE_TYPES_ARRAY)
        .withMessage(`Expense type must be one of: ${EXPENSE_TYPES_ARRAY.join(", ")}`),

    body("amount")
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage("Amount must be a positive number"),

    body("liters")
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage("Liters must be a positive number"),

    body("date")
        .optional()
        .isISO8601()
        .withMessage("Date must be a valid date"),

    body("notes")
        .optional()
        .trim(),
];

module.exports = {
    createExpenseValidator,
    updateExpenseValidator,
};
