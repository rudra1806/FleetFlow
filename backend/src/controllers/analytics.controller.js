const Vehicle = require("../models/vehicle.model");
const Maintenance = require("../models/maintenance.model");
const exportService = require("../services/export.service");

// Safely import Trip & Expense models (may not exist yet in early phases)
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

// Helper: build a date range filter object from ?from= and ?to= query params
function buildDateRange(req, dateField) {
    const filter = {};
    if (req.query.from) {
        const from = new Date(req.query.from);
        if (!isNaN(from)) filter[dateField] = { ...filter[dateField], $gte: from };
    }
    if (req.query.to) {
        const to = new Date(req.query.to);
        if (!isNaN(to)) filter[dateField] = { ...filter[dateField], $lte: to };
    }
    return filter;
}

// GET /api/analytics/fuel-efficiency — km/L per vehicle
// Optional query: ?from=YYYY-MM-DD&to=YYYY-MM-DD
async function getFuelEfficiency(req, res) {
    try {
        const results = [];
        const dateFilterTrip = buildDateRange(req, "startDate");
        const dateFilterExpense = buildDateRange(req, "date");

        const vehicles = await Vehicle.find({ status: { $ne: "retired" } }).select(
            "name licensePlate type currentOdometer"
        );

        for (const vehicle of vehicles) {
            let totalKm = 0;
            let totalLiters = 0;

            if (Trip) {
                const tripAgg = await Trip.aggregate([
                    {
                        $match: {
                            vehicle: vehicle._id,
                            status: "completed",
                            endOdometer: { $exists: true, $gt: 0 },
                            startOdometer: { $exists: true },
                            ...dateFilterTrip,
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

            if (Expense) {
                const fuelAgg = await Expense.aggregate([
                    {
                        $match: {
                            vehicle: vehicle._id,
                            type: "fuel",
                            liters: { $exists: true, $gt: 0 },
                            ...dateFilterExpense,
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

            const efficiency =
                totalLiters > 0
                    ? parseFloat((totalKm / totalLiters).toFixed(2))
                    : 0;

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

// GET /api/analytics/vehicle-roi — ROI per vehicle
// Optional query: ?from=YYYY-MM-DD&to=YYYY-MM-DD
async function getVehicleROI(req, res) {
    try {
        const dateFilterMaint = buildDateRange(req, "serviceDate");
        const dateFilterExpense = buildDateRange(req, "date");

        const vehicles = await Vehicle.find().select(
            "name licensePlate type acquisitionCost"
        );

        const results = [];

        for (const vehicle of vehicles) {
            const maintAgg = await Maintenance.aggregate([
                { $match: { vehicle: vehicle._id, ...dateFilterMaint } },
                { $group: { _id: null, total: { $sum: "$cost" } } },
            ]);
            const maintenanceCost = maintAgg.length > 0 ? maintAgg[0].total : 0;

            let fuelCost = 0;
            let otherExpenses = 0;
            if (Expense) {
                const expAgg = await Expense.aggregate([
                    { $match: { vehicle: vehicle._id, ...dateFilterExpense } },
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

            const totalOperationalCost = maintenanceCost + fuelCost + otherExpenses;
            const acquisitionCost = vehicle.acquisitionCost || 0;
            const revenue = 0; // No revenue model yet — placeholder for future trip billing
            const roi =
                acquisitionCost > 0
                    ? parseFloat(
                        ((-(totalOperationalCost) / acquisitionCost) * 100).toFixed(2)
                    )
                    : 0;

            results.push({
                vehicleId: vehicle._id,
                name: vehicle.name,
                licensePlate: vehicle.licensePlate,
                type: vehicle.type,
                acquisitionCost,
                maintenanceCost,
                fuelCost,
                otherExpenses,
                totalOperationalCost,
                roi,
                roiUnit: "%",
            });
        }

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

// GET /api/analytics/cost-per-km — operational cost per km per vehicle
// Optional query: ?from=YYYY-MM-DD&to=YYYY-MM-DD
async function getCostPerKm(req, res) {
    try {
        const dateFilterTrip = buildDateRange(req, "startDate");
        const dateFilterMaint = buildDateRange(req, "serviceDate");
        const dateFilterExpense = buildDateRange(req, "date");

        const vehicles = await Vehicle.find({ status: { $ne: "retired" } }).select(
            "name licensePlate type"
        );

        const results = [];

        for (const vehicle of vehicles) {
            let totalKm = 0;
            if (Trip) {
                const tripAgg = await Trip.aggregate([
                    {
                        $match: {
                            vehicle: vehicle._id,
                            status: "completed",
                            endOdometer: { $exists: true, $gt: 0 },
                            startOdometer: { $exists: true },
                            ...dateFilterTrip,
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

            const maintAgg = await Maintenance.aggregate([
                { $match: { vehicle: vehicle._id, ...dateFilterMaint } },
                { $group: { _id: null, total: { $sum: "$cost" } } },
            ]);
            const maintenanceCost = maintAgg.length > 0 ? maintAgg[0].total : 0;

            let fuelCost = 0;
            if (Expense) {
                const fuelAgg = await Expense.aggregate([
                    { $match: { vehicle: vehicle._id, type: "fuel", ...dateFilterExpense } },
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

// GET /api/analytics/export/:type — Export data as CSV
async function exportReport(req, res) {
    try {
        const { type } = req.params;

        switch (type) {
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

            case "maintenance": {
                const records = await Maintenance.find()
                    .populate("vehicle", "name licensePlate")
                    .lean();
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

            case "trips": {
                if (!Trip) {
                    return res.status(400).json({
                        message: "Trip module is not available yet",
                        status: false,
                    });
                }
                try {
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
                    return res.status(500).json({
                        message: "Internal server error during trip export",
                        status: false,
                    });
                }
            }

            case "expenses": {
                if (!Expense) {
                    return res.status(400).json({
                        message: "Expense module is not available yet",
                        status: false,
                    });
                }
                try {
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
                    return res.status(500).json({
                        message: "Internal server error during expense export",
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
