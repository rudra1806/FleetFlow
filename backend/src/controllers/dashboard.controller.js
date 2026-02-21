const Vehicle = require("../models/vehicle.model");
const Maintenance = require("../models/maintenance.model");
const { VEHICLE_STATUS, MAINTENANCE_STATUS } = require("../utils/constants");

// GET /api/dashboard — Main dashboard KPIs
async function getDashboardStats(req, res) {
    try {
        // ── Vehicle Stats ──
        const [totalVehicles, availableVehicles, activeFleet, inShopVehicles, retiredVehicles] =
            await Promise.all([
                Vehicle.countDocuments(),
                Vehicle.countDocuments({ status: VEHICLE_STATUS.AVAILABLE }),
                Vehicle.countDocuments({ status: VEHICLE_STATUS.ON_TRIP }),
                Vehicle.countDocuments({ status: VEHICLE_STATUS.IN_SHOP }),
                Vehicle.countDocuments({ status: VEHICLE_STATUS.RETIRED }),
            ]);

        const operationalFleet = totalVehicles - retiredVehicles;
        const utilizationRate =
            operationalFleet > 0
                ? parseFloat(((activeFleet / operationalFleet) * 100).toFixed(2))
                : 0;

        // ── Maintenance Stats ──
        const activeMaintenance = await Maintenance.countDocuments({
            status: { $ne: MAINTENANCE_STATUS.COMPLETED },
        });

        const recentMaintenance = await Maintenance.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("vehicle", "name licensePlate")
            .populate("createdBy", "name");

        // ── Trip Stats (safe — P2 may not have pushed yet) ──
        let pendingCargo = 0;
        let activeTrips = 0;
        let completedTrips = 0;
        let recentTrips = [];
        try {
            const Trip = require("../models/trip.model");
            [pendingCargo, activeTrips, completedTrips] = await Promise.all([
                Trip.countDocuments({ status: "draft" }),
                Trip.countDocuments({ status: "dispatched" }),
                Trip.countDocuments({ status: "completed" }),
            ]);
            recentTrips = await Trip.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate("vehicle", "name licensePlate")
                .populate("driver", "name");
        } catch (e) {
            // Trip model not available yet
        }

        // ── Driver Stats (safe — P2 may not have pushed yet) ──
        let totalDrivers = 0;
        let onDutyDrivers = 0;
        let offDutyDrivers = 0;
        try {
            const Driver = require("../models/driver.model");
            [totalDrivers, onDutyDrivers, offDutyDrivers] = await Promise.all([
                Driver.countDocuments(),
                Driver.countDocuments({ status: "on_duty" }),
                Driver.countDocuments({ status: "off_duty" }),
            ]);
        } catch (e) {
            // Driver model not available yet
        }

        // ── Expense Stats (safe — P3 may not have pushed yet) ──
        let totalExpenses = 0;
        try {
            const Expense = require("../models/expense.model");
            const expenseAgg = await Expense.aggregate([
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]);
            totalExpenses = expenseAgg.length > 0 ? expenseAgg[0].total : 0;
        } catch (e) {
            // Expense model not available yet
        }

        res.status(200).json({
            status: true,
            dashboard: {
                vehicles: {
                    total: totalVehicles,
                    available: availableVehicles,
                    active: activeFleet,
                    inShop: inShopVehicles,
                    retired: retiredVehicles,
                },
                utilizationRate,
                trips: {
                    pending: pendingCargo,
                    active: activeTrips,
                    completed: completedTrips,
                },
                drivers: {
                    total: totalDrivers,
                    onDuty: onDutyDrivers,
                    offDuty: offDutyDrivers,
                },
                maintenance: {
                    active: activeMaintenance,
                },
                expenses: {
                    total: totalExpenses,
                },
                recentTrips,
                recentMaintenance,
            },
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

module.exports = {
    getDashboardStats,
};
