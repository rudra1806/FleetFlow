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
    getExpensesByVehicle,
    getTotalCostPerVehicle,
};
