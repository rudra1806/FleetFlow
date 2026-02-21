const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expense.controller");
const { authMiddleware, authorize } = require("../middleware/auth.middleware");
const { createExpenseValidator, updateExpenseValidator } = require("../validators/expense.validator");
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

// PUT /api/expenses/:id
router.put(
    "/:id",
    authMiddleware,
    authorize(...expenseRoles),
    updateExpenseValidator,
    validate,
    expenseController.updateExpense
);

// DELETE /api/expenses/:id
router.delete(
    "/:id",
    authMiddleware,
    authorize("manager"),
    expenseController.deleteExpense
);

module.exports = router;
