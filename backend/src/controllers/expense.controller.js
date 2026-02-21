const Expense = require("../models/expense.model");
const Vehicle = require("../models/vehicle.model");

// POST /api/expenses — Create a new expense
async function createExpense(req, res) {
    try {
        const { vehicle, trip, type, amount, liters, date, notes } = req.body;

        // Verify vehicle exists
        const vehicleDoc = await Vehicle.findById(vehicle);
        if (!vehicleDoc) {
            return res.status(404).json({
                message: "Vehicle not found",
                status: false,
            });
        }

        const expense = new Expense({
            vehicle,
            trip: trip || null,
            type,
            amount,
            liters: type === "fuel" ? liters : null,
            date,
            notes,
            createdBy: req.user._id,
        });

        await expense.save();

        const populated = await Expense.findById(expense._id)
            .populate("vehicle", "name licensePlate type")
            .populate("createdBy", "name email");

        res.status(201).json({
            message: "Expense created successfully",
            status: true,
            expense: populated,
        });
    } catch (error) {
        console.error("Create expense error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

// GET /api/expenses — Get all expenses with pagination, filters, search
async function getAllExpenses(req, res) {
    try {
        const {
            page = 1,
            limit = 10,
            type,
            vehicle,
            search,
            sortBy = "date",
            order = "desc",
        } = req.query;

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));

        const filter = {};
        if (type) filter.type = type;
        if (vehicle) filter.vehicle = vehicle;

        const sortObj = {};
        sortObj[sortBy] = order === "asc" ? 1 : -1;

        const [expenses, total] = await Promise.all([
            Expense.find(filter)
                .sort(sortObj)
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .populate("vehicle", "name licensePlate type")
                .populate("trip", "origin destination")
                .populate("createdBy", "name email"),
            Expense.countDocuments(filter),
        ]);

        res.status(200).json({
            status: true,
            count: expenses.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            expenses,
        });
    } catch (error) {
        console.error("Get all expenses error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

// GET /api/expenses/vehicle/:vehicleId — Get all expenses for a vehicle
async function getExpensesByVehicle(req, res) {
    try {
        const {
            page = 1,
            limit = 10,
            type,
            sortBy = "date",
            order = "desc",
        } = req.query;

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));

        const filter = { vehicle: req.params.vehicleId };
        if (type) filter.type = type;

        const sortObj = {};
        sortObj[sortBy] = order === "asc" ? 1 : -1;

        const [expenses, total] = await Promise.all([
            Expense.find(filter)
                .sort(sortObj)
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .populate("vehicle", "name licensePlate type")
                .populate("createdBy", "name email"),
            Expense.countDocuments(filter),
        ]);

        res.status(200).json({
            status: true,
            count: expenses.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            expenses,
        });
    } catch (error) {
        console.error("Get expenses by vehicle error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

// GET /api/expenses/vehicle/:vehicleId/total — Aggregated cost breakdown per vehicle
async function getTotalCostPerVehicle(req, res) {
    try {
        const vehicleId = req.params.vehicleId;

        // Verify vehicle exists
        const vehicle = await Vehicle.findById(vehicleId).select("name licensePlate type");
        if (!vehicle) {
            return res.status(404).json({
                message: "Vehicle not found",
                status: false,
            });
        }

        const aggregation = await Expense.aggregate([
            { $match: { vehicle: vehicle._id } },
            {
                $group: {
                    _id: "$type",
                    totalAmount: { $sum: "$amount" },
                    totalLiters: { $sum: { $ifNull: ["$liters", 0] } },
                    count: { $sum: 1 },
                },
            },
        ]);

        // Build a clean breakdown object
        const breakdown = {};
        let grandTotal = 0;

        aggregation.forEach((item) => {
            breakdown[item._id] = {
                totalAmount: item.totalAmount,
                totalLiters: item.totalLiters,
                count: item.count,
            };
            grandTotal += item.totalAmount;
        });

        res.status(200).json({
            status: true,
            vehicle: {
                _id: vehicle._id,
                name: vehicle.name,
                licensePlate: vehicle.licensePlate,
                type: vehicle.type,
            },
            grandTotal,
            breakdown,
        });
    } catch (error) {
        console.error("Get total cost per vehicle error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

module.exports = {
    createExpense,
    getAllExpenses,
    getExpensesByVehicle,
    getTotalCostPerVehicle,
    updateExpense,
    deleteExpense,
};

// PUT /api/expenses/:id — Update an expense
async function updateExpense(req, res) {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ message: "Expense not found", status: false });
        }

        const allowedFields = ["type", "amount", "liters", "date", "notes"];
        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        // If type is changed away from fuel, clear liters
        if (updates.type && updates.type !== "fuel") {
            updates.liters = null;
        }

        const updated = await Expense.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        })
            .populate("vehicle", "name licensePlate type")
            .populate("createdBy", "name email");

        res.status(200).json({
            message: "Expense updated successfully",
            status: true,
            expense: updated,
        });
    } catch (error) {
        console.error("Update expense error:", error);
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

// DELETE /api/expenses/:id — Delete an expense
async function deleteExpense(req, res) {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ message: "Expense not found", status: false });
        }

        await Expense.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Expense deleted successfully",
            status: true,
        });
    } catch (error) {
        console.error("Delete expense error:", error);
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

// GET /api/expenses — Get all expenses with optional filters
async function getAllExpenses(req, res) {
    try {
        const {
            page = 1,
            limit = 20,
            type,
            vehicle,
            sortBy = "date",
            order = "desc",
        } = req.query;

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const filter = {};

        if (type) filter.type = type;
        if (vehicle) filter.vehicle = vehicle;

        const total = await Expense.countDocuments(filter);
        const expenses = await Expense.find(filter)
            .populate("vehicle", "name licensePlate type")
            .sort({ [sortBy]: order === "asc" ? 1 : -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);

        res.status(200).json({
            status: true,
            expenses,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error("Get all expenses error:", error);
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

module.exports = {
    createExpense,
    getExpensesByVehicle,
    getTotalCostPerVehicle,
    updateExpense,
    deleteExpense,
    getAllExpenses,
};
