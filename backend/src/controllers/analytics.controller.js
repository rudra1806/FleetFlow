// ==========================================
// FleetFlow - Analytics Controller
// ==========================================
// Provides financial & operational analytics endpoints.
// These endpoints power charts, tables, and CSV exports in the frontend.
//
// Functions:
//   getFuelEfficiency — km/L per vehicle (Trip + Expense data)
//   getVehicleROI     — ROI % per vehicle (acquisition vs operational cost)
//   getCostPerKm      — ₹/km per vehicle (maintenance + fuel ÷ total km)
//   exportReport      — CSV download for vehicles, maintenance, trips, expenses
//
// Design Notes:
//   - Trip and Expense models are imported inside try/catch blocks
//     because P2 (Trips) and P3 (Expenses) may not have deployed yet.
//   - If a model isn't available, those metrics show 0 gracefully.
//   - All aggregations use MongoDB aggregate pipelines for performance.
// ==========================================

const Vehicle = require("../models/vehicle.model");
const Maintenance = require("../models/maintenance.model");
const exportService = require("../services/export.service");

/**
 * GET /api/analytics/fuel-efficiency — Calculate km/L for each vehicle
 *
 * @access  Manager, Financial Analyst
 * @returns Array of vehicles with { totalKm, totalLiters, fuelEfficiency, unit: "km/L" }
 *
 * How it works:
 *   1. Gets all non-retired vehicles
 *   2. For each vehicle, aggregates total km from completed trips (P2)
 *   3. Aggregates total fuel liters from fuel expense records (P3)
 *   4. Calculates efficiency = totalKm / totalLiters
 *   5. Returns results sorted by efficiency (best first)
 *
 * If Trip or Expense models are unavailable, those values default to 0.
 */
async function getFuelEfficiency(req, res) {
    try {
        const results = [];

        // Safely import Trip & Expense models (may not exist yet)
        let Trip, Expense;
        try {
            Trip = require("../models/trip.model");
        } catch (e) {
            Trip = null; // P2 hasn't deployed Trip model yet
        }
        try {
            Expense = require("../models/expense.model");
        } catch (e) {
            Expense = null; // P3 hasn't deployed Expense model yet
        }

        // Fetch all operational (non-retired) vehicles
        const vehicles = await Vehicle.find({ status: { $ne: "retired" } }).select(
            "name licensePlate type currentOdometer"
        );

        for (const vehicle of vehicles) {
            let totalKm = 0;
            let totalLiters = 0;

            // Aggregate total km driven from completed trips
            // Uses endOdometer - startOdometer for accurate distance
            if (Trip) {
                const tripAgg = await Trip.aggregate([
                    {
                        $match: {
                            vehicle: vehicle._id,
                            status: "completed",
                            endOdometer: { $exists: true, $gt: 0 },
                            startOdometer: { $exists: true },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalKm: {
                                $sum: { $subtract: ["$endOdometer", "$startOdometer"] },
                            },
                        },
                    },
                ]);
                totalKm = tripAgg.length > 0 ? tripAgg[0].totalKm : 0;
            }

            // Aggregate total fuel liters consumed from expense records
            // Only counts records with type "fuel" and valid liters field
            if (Expense) {
                const fuelAgg = await Expense.aggregate([
                    {
                        $match: {
                            vehicle: vehicle._id,
                            type: "fuel",
                            liters: { $exists: true, $gt: 0 },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalLiters: { $sum: "$liters" },
                        },
                    },
                ]);
                totalLiters = fuelAgg.length > 0 ? fuelAgg[0].totalLiters : 0;
            }

            // Calculate fuel efficiency (km per liter)
            const efficiency =
                totalLiters > 0
                    ? parseFloat((totalKm / totalLiters).toFixed(2))
                    : 0; // 0 if no fuel data available

            results.push({
                vehicleId: vehicle._id,
                name: vehicle.name,
                licensePlate: vehicle.licensePlate,
                type: vehicle.type,
                totalKm,
                totalLiters,
                fuelEfficiency: efficiency,
                unit: "km/L",
            });
        }

        // Sort by efficiency descending
        results.sort((a, b) => b.fuelEfficiency - a.fuelEfficiency);

        res.status(200).json({
            status: true,
            count: results.length,
            data: results,
        });
    } catch (error) {
        console.error("Fuel efficiency error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

/**
 * GET /api/analytics/vehicle-roi — Calculate ROI for each vehicle
 *
 * @access  Manager, Financial Analyst
 * @returns Array of vehicles with { acquisitionCost, revenue, maintenanceCost, fuelCost, otherExpenses, totalOperationalCost, roi (%) }
 *
 * Spec Formula (Page 8):
 *   ROI = ((Revenue - (Maintenance + Fuel)) / Acquisition Cost) × 100
 *
 * Revenue source:
 *   - Sum of `fare` or `revenue` fields from completed trips (P2's Trip model)
 *   - If Trip model unavailable or has no fare field, revenue defaults to 0.
 *
 * Cost components:
 *   - Maintenance cost: sum of all maintenance.cost for this vehicle
 *   - Fuel cost: sum of expenses where type = "fuel"
 *   - Other expenses: sum of all other expense types (insurance, tolls, etc.)
 */
async function getVehicleROI(req, res) {
    try {
        let Expense, Trip;
        try {
            Expense = require("../models/expense.model");
        } catch (e) {
            Expense = null;
        }
        try {
            Trip = require("../models/trip.model");
        } catch (e) {
            Trip = null;
        }

        const vehicles = await Vehicle.find().select(
            "name licensePlate type acquisitionCost"
        );

        const results = [];

        for (const vehicle of vehicles) {
            // ── Revenue: sum from completed trips ──
            let revenue = 0;
            if (Trip) {
                try {
                    const revenueAgg = await Trip.aggregate([
                        {
                            $match: {
                                vehicle: vehicle._id,
                                status: "completed",
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                total: {
                                    $sum: {
                                        $ifNull: [
                                            "$fare",
                                            { $ifNull: ["$revenue", 0] },
                                        ],
                                    },
                                },
                            },
                        },
                    ]);
                    revenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;
                } catch (e) {
                    revenue = 0; // Trip model doesn't have fare/revenue field
                }
            }

            // ── Maintenance cost: aggregate from all service records ──
            const maintAgg = await Maintenance.aggregate([
                { $match: { vehicle: vehicle._id } },
                { $group: { _id: null, total: { $sum: "$cost" } } },
            ]);
            const maintenanceCost = maintAgg.length > 0 ? maintAgg[0].total : 0;

            // ── Expense costs: fuel + other categories ──
            let fuelCost = 0;
            let otherExpenses = 0;
            if (Expense) {
                const expAgg = await Expense.aggregate([
                    { $match: { vehicle: vehicle._id } },
                    {
                        $group: {
                            _id: "$type",
                            total: { $sum: "$amount" },
                        },
                    },
                ]);
                expAgg.forEach((e) => {
                    if (e._id === "fuel") fuelCost = e.total;
                    else otherExpenses += e.total;
                });
            }

            // ── ROI Calculation (per spec formula) ──
            // ROI = ((Revenue - (Maintenance + Fuel + Other)) / Acquisition Cost) × 100
            const totalOperationalCost = maintenanceCost + fuelCost + otherExpenses;
            const acquisitionCost = vehicle.acquisitionCost || 0;
            const roi =
                acquisitionCost > 0
                    ? parseFloat(
                          (((revenue - totalOperationalCost) / acquisitionCost) * 100).toFixed(2)
                      )
                    : 0;

            results.push({
                vehicleId: vehicle._id,
                name: vehicle.name,
                licensePlate: vehicle.licensePlate,
                type: vehicle.type,
                acquisitionCost,
                revenue,
                maintenanceCost,
                fuelCost,
                otherExpenses,
                totalOperationalCost,
                roi,
                roiUnit: "%",
            });
        }

        // Sort by ROI descending — best performing vehicles first
        results.sort((a, b) => b.roi - a.roi);

        res.status(200).json({
            status: true,
            count: results.length,
            data: results,
        });
    } catch (error) {
        console.error("Vehicle ROI error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

/**
 * GET /api/analytics/cost-per-km — Calculate operational cost per kilometer
 *
 * @access  Manager, Financial Analyst
 * @returns Array of vehicles with { totalKm, maintenanceCost, fuelCost, totalCost, costPerKm, unit: "₹/km" }
 *
 * Formula:
 *   costPerKm = (maintenanceCost + fuelCost) / totalKm
 *   Sorted ascending — lowest cost per km first (most efficient).
 *
 * Useful for:
 *   - Identifying high-cost vehicles that need replacement
 *   - Comparing operational efficiency across vehicle types
 */
async function getCostPerKm(req, res) {
    try {
        let Trip, Expense;
        try {
            Trip = require("../models/trip.model");
        } catch (e) {
            Trip = null;
        }
        try {
            Expense = require("../models/expense.model");
        } catch (e) {
            Expense = null;
        }

        const vehicles = await Vehicle.find({ status: { $ne: "retired" } }).select(
            "name licensePlate type"
        );

        const results = [];

        for (const vehicle of vehicles) {
            // Total km driven
            let totalKm = 0;
            if (Trip) {
                const tripAgg = await Trip.aggregate([
                    {
                        $match: {
                            vehicle: vehicle._id,
                            status: "completed",
                            endOdometer: { $exists: true, $gt: 0 },
                            startOdometer: { $exists: true },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalKm: {
                                $sum: { $subtract: ["$endOdometer", "$startOdometer"] },
                            },
                        },
                    },
                ]);
                totalKm = tripAgg.length > 0 ? tripAgg[0].totalKm : 0;
            }

            // Total fuel + maintenance cost
            const maintAgg = await Maintenance.aggregate([
                { $match: { vehicle: vehicle._id } },
                { $group: { _id: null, total: { $sum: "$cost" } } },
            ]);
            const maintenanceCost = maintAgg.length > 0 ? maintAgg[0].total : 0;

            let fuelCost = 0;
            if (Expense) {
                const fuelAgg = await Expense.aggregate([
                    { $match: { vehicle: vehicle._id, type: "fuel" } },
                    { $group: { _id: null, total: { $sum: "$amount" } } },
                ]);
                fuelCost = fuelAgg.length > 0 ? fuelAgg[0].total : 0;
            }

            const totalCost = maintenanceCost + fuelCost;
            const costPerKm =
                totalKm > 0
                    ? parseFloat((totalCost / totalKm).toFixed(2))
                    : 0;

            results.push({
                vehicleId: vehicle._id,
                name: vehicle.name,
                licensePlate: vehicle.licensePlate,
                type: vehicle.type,
                totalKm,
                maintenanceCost,
                fuelCost,
                totalCost,
                costPerKm,
                unit: "₹/km",
            });
        }

        results.sort((a, b) => a.costPerKm - b.costPerKm);

        res.status(200).json({
            status: true,
            count: results.length,
            data: results,
        });
    } catch (error) {
        console.error("Cost per km error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

/**
 * GET /api/analytics/export/:type — Export data as downloadable CSV file
 *
 * @access  Manager, Financial Analyst
 * @param   type — "vehicles" | "maintenance" | "trips" | "expenses"
 * @returns CSV file download with Content-Disposition header
 *
 * Each export type:
 *   - vehicles: name, model, plate, type, status, capacity, odometer, fuel, region, cost
 *   - maintenance: vehicle, plate, service type, description, cost, status, dates, mechanic
 *   - trips: vehicle, plate, driver, origin, destination, cargo, status, dates (requires P2)
 *   - expenses: vehicle, plate, type, amount, liters, date, notes (requires P3)
 *
 * Notes:
 *   - Trips and Expenses exports return 400 if their modules aren't deployed yet.
 *   - Uses export.service.js for CSV generation (no external dependencies).
 */
async function exportReport(req, res) {
    try {
        const { type } = req.params;

        switch (type) {
            // ── Vehicles Export ──────────────────────────────
            case "vehicles": {
                const vehicles = await Vehicle.find()
                    .populate("createdBy", "name")
                    .lean();
                const fields = [
                    { label: "Name", value: "name" },
                    { label: "Model", value: "model" },
                    { label: "License Plate", value: "licensePlate" },
                    { label: "Type", value: "type" },
                    { label: "Status", value: "status" },
                    { label: "Max Capacity (kg)", value: "maxCapacity" },
                    { label: "Odometer", value: "currentOdometer" },
                    { label: "Fuel Type", value: "fuelType" },
                    { label: "Region", value: "region" },
                    { label: "Acquisition Cost", value: "acquisitionCost" },
                ];
                return exportService.sendCSVResponse(
                    res,
                    vehicles,
                    fields,
                    "vehicles_report.csv"
                );
            }

            // ── Maintenance Export ───────────────────────────
            case "maintenance": {
                const records = await Maintenance.find()
                    .populate("vehicle", "name licensePlate")
                    .lean();
                // Flatten nested vehicle ref into top-level fields for CSV
                const flat = records.map((r) => ({
                    ...r,
                    vehicleName: r.vehicle?.name || "",
                    vehiclePlate: r.vehicle?.licensePlate || "",
                }));
                const fields = [
                    { label: "Vehicle", value: "vehicleName" },
                    { label: "License Plate", value: "vehiclePlate" },
                    { label: "Service Type", value: "serviceType" },
                    { label: "Description", value: "description" },
                    { label: "Cost", value: "cost" },
                    { label: "Status", value: "status" },
                    { label: "Service Date", value: "serviceDate" },
                    { label: "Completion Date", value: "completionDate" },
                    { label: "Mechanic", value: "mechanic" },
                ];
                return exportService.sendCSVResponse(
                    res,
                    flat,
                    fields,
                    "maintenance_report.csv"
                );
            }

            // ── Trips Export (requires P2's Trip model) ─────
            case "trips": {
                try {
                    const Trip = require("../models/trip.model");
                    const trips = await Trip.find()
                        .populate("vehicle", "name licensePlate")
                        .populate("driver", "name")
                        .lean();
                    const flat = trips.map((t) => ({
                        ...t,
                        vehicleName: t.vehicle?.name || "",
                        vehiclePlate: t.vehicle?.licensePlate || "",
                        driverName: t.driver?.name || "",
                    }));
                    const fields = [
                        { label: "Vehicle", value: "vehicleName" },
                        { label: "License Plate", value: "vehiclePlate" },
                        { label: "Driver", value: "driverName" },
                        { label: "Origin", value: "origin" },
                        { label: "Destination", value: "destination" },
                        { label: "Cargo Weight", value: "cargoWeight" },
                        { label: "Status", value: "status" },
                        { label: "Start Date", value: "startDate" },
                        { label: "End Date", value: "endDate" },
                    ];
                    return exportService.sendCSVResponse(
                        res,
                        flat,
                        fields,
                        "trips_report.csv"
                    );
                } catch (e) {
                    return res.status(400).json({
                        message: "Trip module not available yet",
                        status: false,
                    });
                }
            }

            // ── Expenses Export (requires P3's Expense model) ─
            case "expenses": {
                try {
                    const Expense = require("../models/expense.model");
                    const expenses = await Expense.find()
                        .populate("vehicle", "name licensePlate")
                        .lean();
                    const flat = expenses.map((e) => ({
                        ...e,
                        vehicleName: e.vehicle?.name || "",
                        vehiclePlate: e.vehicle?.licensePlate || "",
                    }));
                    const fields = [
                        { label: "Vehicle", value: "vehicleName" },
                        { label: "License Plate", value: "vehiclePlate" },
                        { label: "Type", value: "type" },
                        { label: "Amount", value: "amount" },
                        { label: "Liters", value: "liters" },
                        { label: "Date", value: "date" },
                        { label: "Notes", value: "notes" },
                    ];
                    return exportService.sendCSVResponse(
                        res,
                        flat,
                        fields,
                        "expenses_report.csv"
                    );
                } catch (e) {
                    return res.status(400).json({
                        message: "Expense module not available yet",
                        status: false,
                    });
                }
            }

            default:
                return res.status(400).json({
                    message: `Invalid export type '${type}'. Allowed: vehicles, maintenance, trips, expenses`,
                    status: false,
                });
        }
    } catch (error) {
        console.error("Export report error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

module.exports = {
    getFuelEfficiency,
    getVehicleROI,
    getCostPerKm,
    exportReport,
};
