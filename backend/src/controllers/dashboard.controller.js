// ==========================================
// FleetFlow - Dashboard Controller
// ==========================================
// Aggregates KPI data from ALL modules into a single API response.
// This powers the main dashboard view in the frontend.
//
// Design Notes:
//   - Each module (Trip, Driver, Expense) is imported inside a try/catch
//     so the dashboard doesn't crash if P2/P3 haven't deployed their models yet.
//   - If a module isn't available, its stats default to 0 / empty arrays.
//   - All DB queries use Promise.all for parallel execution (faster response).
// ==========================================

const Vehicle = require("../models/vehicle.model");
const Maintenance = require("../models/maintenance.model");
const { VEHICLE_STATUS, MAINTENANCE_STATUS } = require("../utils/constants");

/**
 * GET /api/dashboard — Main dashboard KPIs
 *
 * @access  All authenticated roles
 * @query   type   — filter vehicles by type (e.g. ?type=truck)
 * @query   status — filter vehicles by status (e.g. ?status=available)
 * @query   region — filter vehicles by region (case-insensitive partial match)
 * @returns {Object} Aggregated stats:
 *   - vehicles: { total, available, active, inShop, retired }
 *   - utilizationRate: % of operational fleet on trips
 *   - trips: { pending, active, completed }
 *   - drivers: { total, onDuty, offDuty }
 *   - maintenance: { active (non-completed) }
 *   - expenses: { total (sum of all expense amounts) }
 *   - recentTrips: last 5 trips
 *   - recentMaintenance: last 5 maintenance records
 *
 * Spec Requirement (Page 2 — Command Center):
 *   "Filters: By Vehicle Type (Truck, Van, Bike), Status, or Region."
 */
async function getDashboardStats(req, res) {
    try {
        // ── Build vehicle filter from query params (spec: Command Center filters) ──
        const { type, status, region } = req.query;
        const vehicleFilter = {};
        if (type) vehicleFilter.type = type;
        if (status) vehicleFilter.status = status;
        if (region) vehicleFilter.region = { $regex: region, $options: "i" };

        // ── Vehicle Stats ──────────────────────────────────
        // When filters are applied, stats reflect only matching vehicles.
        // When no filters, shows fleet-wide overview.
        const [totalVehicles, availableVehicles, activeFleet, inShopVehicles, retiredVehicles] =
            await Promise.all([
                Vehicle.countDocuments(vehicleFilter),
                Vehicle.countDocuments({ ...vehicleFilter, status: VEHICLE_STATUS.AVAILABLE }),
                Vehicle.countDocuments({ ...vehicleFilter, status: VEHICLE_STATUS.ON_TRIP }),
                Vehicle.countDocuments({ ...vehicleFilter, status: VEHICLE_STATUS.IN_SHOP }),
                Vehicle.countDocuments({ ...vehicleFilter, status: VEHICLE_STATUS.RETIRED }),
            ]);

        // Operational fleet = total minus decommissioned vehicles
        const operationalFleet = totalVehicles - retiredVehicles;
        // Utilization: what % of operational vehicles are currently on trips
        const utilizationRate =
            operationalFleet > 0
                ? parseFloat(((activeFleet / operationalFleet) * 100).toFixed(2))
                : 0;

        // ── Maintenance Stats ──────────────────────────────
        // If vehicle filter is active, only count maintenance for matching vehicles
        const maintenanceFilter = { status: { $ne: MAINTENANCE_STATUS.COMPLETED } };
        const maintenanceHistoryFilter = {};
        if (type || region) {
            // Get IDs of filtered vehicles to scope maintenance queries
            const filteredVehicleIds = await Vehicle.find(vehicleFilter).select("_id").lean();
            const vehicleIds = filteredVehicleIds.map((v) => v._id);
            maintenanceFilter.vehicle = { $in: vehicleIds };
            maintenanceHistoryFilter.vehicle = { $in: vehicleIds };
        }

        const activeMaintenance = await Maintenance.countDocuments(maintenanceFilter);

        // Last 5 maintenance entries for the "Recent Activity" widget
        const recentMaintenance = await Maintenance.find(maintenanceHistoryFilter)
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("vehicle", "name licensePlate")
            .populate("createdBy", "name");

        // ── Trip Stats (safe import — P2 may not have pushed yet) ──
        // Wrapped in try/catch so dashboard works even without Trip model
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

        // ── Driver Stats (safe import — P2 may not have pushed yet) ──
        // Same defensive try/catch pattern as Trip stats
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

        // ── Expense Stats (safe import — P3 may not have pushed yet) ──
        // Uses MongoDB aggregation to sum all expense amounts
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
            // Include applied filters in response for frontend awareness
            appliedFilters: {
                type: type || null,
                status: status || null,
                region: region || null,
            },
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
