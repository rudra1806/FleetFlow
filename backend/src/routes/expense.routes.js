const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expense.controller");
const { authMiddleware, authorize } = require("../middleware/auth.middleware");
const { createExpenseValidator } = require("../validators/expense.validator");
const validate = require("../validators/validate");

const expenseRoles = ["manager", "financial_analyst", "dispatcher"];

// POST /api/expenses
router.post(
    "/",
    authMiddleware,
    authorize(...expenseRoles),
    createExpenseValidator,
    validate,
    expenseController.createExpense
);

// GET /api/expenses/vehicle/:vehicleId
router.get(
    "/vehicle/:vehicleId",
    authMiddleware,
    authorize(...expenseRoles),
    expenseController.getExpensesByVehicle
);

// GET /api/expenses/vehicle/:vehicleId/total
router.get(
    "/vehicle/:vehicleId/total",
    authMiddleware,
    authorize(...expenseRoles),
    expenseController.getTotalCostPerVehicle
);

module.exports = router;
