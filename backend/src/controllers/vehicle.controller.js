// ==========================================
// FleetFlow - Vehicle Controller
// ==========================================
// Handles all CRUD operations and business logic for the Vehicle module.
//
// Functions:
//   createVehicle      — POST   /api/vehicles
//   getAllVehicles      — GET    /api/vehicles          (pagination, filters, search, sort)
//   getVehicleStats    — GET    /api/vehicles/stats     (KPIs for dashboard)
//   getVehicleById     — GET    /api/vehicles/:id
//   updateVehicle      — PUT    /api/vehicles/:id       (blocks status/createdBy edits)
//   deleteVehicle      — DELETE /api/vehicles/:id       (blocks if on_trip or in_shop)
//   updateVehicleStatus— PATCH  /api/vehicles/:id/status (only available ↔ retired manual)
//
// Business Rules:
//   - "on_trip" and "in_shop" statuses are set ONLY by Trip and Maintenance modules.
//   - Vehicles on a trip or in maintenance cannot be deleted or have status changed.
//   - Duplicate license plates return 409 Conflict.
// ==========================================

const Vehicle = require("../models/vehicle.model");
const { VEHICLE_STATUS } = require("../utils/constants");

/**
 * POST /api/vehicles — Create a new vehicle
 *
 * @access  Manager only
 * @body    {name, model, licensePlate, type, maxCapacity, fuelType, ...optional fields}
 * @returns 201 + created vehicle | 409 if duplicate plate | 500 on error
 *
 * Notes:
 *   - Status defaults to "available" (set by schema default).
 *   - `createdBy` is auto-set from the authenticated user's JWT.
 *   - Duplicate licensePlate triggers a MongoDB 11000 unique index error.
 */
async function createVehicle(req, res) {
    try {
        // Destructure all accepted fields from request body
        const {
            name,
            model,
            licensePlate,
            type,
            maxCapacity,
            currentOdometer,
            fuelType,
            acquisitionCost,
            acquisitionDate,
            year,
            color,
            region,
            notes,
        } = req.body;

        // Build a new Vehicle document, attaching the logged-in user as creator
        const vehicle = new Vehicle({
            name,
            model,
            licensePlate,
            type,
            maxCapacity,
            currentOdometer,
            fuelType,
            acquisitionCost,
            acquisitionDate,
            year,
            color,
            region,
            notes,
            createdBy: req.user._id, // from auth middleware
        });

        await vehicle.save();

        res.status(201).json({
            message: "Vehicle created successfully",
            status: true,
            vehicle,
        });
    } catch (error) {
        console.error("Create vehicle error:", error);

        // Handle duplicate license plate (MongoDB unique index violation)
        if (error.code === 11000) {
            return res.status(409).json({
                message: "A vehicle with this license plate already exists",
                status: false,
            });
        }

        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

/**
 * GET /api/vehicles — List vehicles with pagination, filters, search, sort
 *
 * @access  All authenticated roles
 * @query   page (default 1), limit (default 10, max 100)
 * @query   type, status, fuelType — exact-match filters
 * @query   region — case-insensitive partial match
 * @query   search — searches across name, licensePlate, and model fields
 * @query   sortBy (default "createdAt"), order ("asc" | "desc")
 * @returns Paginated list: { vehicles[], count, total, totalPages, currentPage }
 */
async function getAllVehicles(req, res) {
    try {
        // Extract query params with sensible defaults
        const {
            page = 1,
            limit = 10,
            type,
            status,
            region,
            fuelType,
            search,
            sortBy = "createdAt",
            order = "desc",
        } = req.query;

        // Clamp page & limit to safe ranges
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));

        // ── Build dynamic filter object ──
        const filter = {};
        if (type) filter.type = type;          // e.g. ?type=truck
        if (status) filter.status = status;    // e.g. ?status=available
        if (region) filter.region = { $regex: region, $options: "i" }; // partial match
        if (fuelType) filter.fuelType = fuelType;

        // Full-text-like search across multiple text fields
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { licensePlate: { $regex: search, $options: "i" } },
                { model: { $regex: search, $options: "i" } },
            ];
        }

        // ── Build sort object ──
        const sortObj = {};
        sortObj[sortBy] = order === "asc" ? 1 : -1;

        // Run query and count in parallel for performance
        const [vehicles, total] = await Promise.all([
            Vehicle.find(filter)
                .sort(sortObj)
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .populate("createdBy", "name email"),
            Vehicle.countDocuments(filter),
        ]);

        res.status(200).json({
            status: true,
            count: vehicles.length,   // items in this page
            total,                    // total matching documents
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            vehicles,
        });
    } catch (error) {
        console.error("Get all vehicles error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

/**
 * GET /api/vehicles/stats — Vehicle KPI statistics for dashboard cards
 *
 * @access  All authenticated roles
 * @returns { total, available, on_trip, in_shop, retired, utilizationRate }
 *
 * Utilization formula:
 *   utilizationRate = (on_trip / (total - retired)) × 100
 *   i.e., what % of the operational fleet is currently active
 */
async function getVehicleStats(req, res) {
    try {
        // Count each status category in parallel (5 lightweight queries)
        const [total, available, on_trip, in_shop, retired] = await Promise.all([
            Vehicle.countDocuments(),
            Vehicle.countDocuments({ status: VEHICLE_STATUS.AVAILABLE }),
            Vehicle.countDocuments({ status: VEHICLE_STATUS.ON_TRIP }),
            Vehicle.countDocuments({ status: VEHICLE_STATUS.IN_SHOP }),
            Vehicle.countDocuments({ status: VEHICLE_STATUS.RETIRED }),
        ]);

        // Active fleet = total minus retired vehicles
        const activeFleet = total - retired;

        // Utilization: % of operational fleet currently on a trip
        const utilizationRate =
            activeFleet > 0
                ? parseFloat(((on_trip / activeFleet) * 100).toFixed(2))
                : 0;

        res.status(200).json({
            status: true,
            stats: {
                total,
                available,
                on_trip,
                in_shop,
                retired,
                utilizationRate,
            },
        });
    } catch (error) {
        console.error("Get vehicle stats error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

/**
 * GET /api/vehicles/:id — Get a single vehicle by its MongoDB _id
 *
 * @access  All authenticated roles
 * @param   id — MongoDB ObjectId from URL params
 * @returns 200 + vehicle | 404 if not found | 400 if invalid ObjectId format
 */
async function getVehicleById(req, res) {
    try {
        const vehicle = await Vehicle.findById(req.params.id).populate(
            "createdBy",
            "name email"
        );

        if (!vehicle) {
            return res.status(404).json({
                message: "Vehicle not found",
                status: false,
            });
        }

        res.status(200).json({
            status: true,
            vehicle,
        });
    } catch (error) {
        console.error("Get vehicle by ID error:", error);
        // CastError = malformed ObjectId (e.g. "abc" instead of 24-char hex)
        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid vehicle ID format",
                status: false,
            });
        }
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

/**
 * PUT /api/vehicles/:id — Update vehicle details (general fields only)
 *
 * @access  Manager only
 * @body    Any vehicle field EXCEPT status, createdBy, _id
 * @returns 200 + updated vehicle | 404 | 409 if duplicate plate
 *
 * Notes:
 *   - Status changes go through PATCH /:id/status (separate endpoint)
 *   - createdBy is immutable after creation
 *   - `runValidators: true` ensures enum/min/max checks run on updates
 */
async function updateVehicle(req, res) {
    try {
        const updates = { ...req.body };

        // Strip protected fields — these cannot be changed via PUT
        delete updates.status;    // Use PATCH /:id/status instead
        delete updates.createdBy; // Immutable audit field
        delete updates._id;       // Never allow _id changes

        const vehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true } // return updated doc + validate
        ).populate("createdBy", "name email");

        if (!vehicle) {
            return res.status(404).json({
                message: "Vehicle not found",
                status: false,
            });
        }

        res.status(200).json({
            message: "Vehicle updated successfully",
            status: true,
            vehicle,
        });
    } catch (error) {
        console.error("Update vehicle error:", error);
        // Handle duplicate license plate on update
        if (error.code === 11000) {
            return res.status(409).json({
                message: "A vehicle with this license plate already exists",
                status: false,
            });
        }
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

/**
 * DELETE /api/vehicles/:id — Permanently delete a vehicle
 *
 * @access  Manager only
 * @param   id — MongoDB ObjectId from URL params
 * @returns 200 on success | 404 | 400 if vehicle is on_trip or in_shop
 *
 * Safety checks:
 *   - Cannot delete if status is "on_trip" (active trip in progress)
 *   - Cannot delete if status is "in_shop" (maintenance in progress)
 *   - Only "available" or "retired" vehicles can be deleted.
 */
async function deleteVehicle(req, res) {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({
                message: "Vehicle not found",
                status: false,
            });
        }

        // Block deletion of vehicles with active trips
        if (vehicle.status === VEHICLE_STATUS.ON_TRIP) {
            return res.status(400).json({
                message:
                    "Cannot delete a vehicle that is currently on a trip. Complete or cancel the trip first.",
                status: false,
            });
        }

        // Block deletion of vehicles currently in maintenance
        if (vehicle.status === VEHICLE_STATUS.IN_SHOP) {
            return res.status(400).json({
                message:
                    "Cannot delete a vehicle that is currently in maintenance. Complete maintenance first.",
                status: false,
            });
        }

        await Vehicle.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Vehicle deleted successfully",
            status: true,
        });
    } catch (error) {
        console.error("Delete vehicle error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

/**
 * PATCH /api/vehicles/:id/status — Manually change vehicle status
 *
 * @access  Manager only
 * @body    { status: "available" | "retired" }
 * @returns 200 + updated vehicle | 400 if blocked transition | 404 if not found
 *
 * Allowed manual transitions:
 *   available → retired   (decommission)
 *   retired   → available (recommission)
 *
 * Blocked transitions (auto-managed by other modules):
 *   → "on_trip"  — only the Trip module sets this when dispatching
 *   → "in_shop"  — only the Maintenance module sets this on creation
 *   from "on_trip"  — must complete/cancel the trip first
 *   from "in_shop"  — must complete the maintenance first
 */
async function updateVehicleStatus(req, res) {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                message: "Status is required",
                status: false,
            });
        }

        // ── Block auto-managed statuses from being set manually ──
        if (status === VEHICLE_STATUS.ON_TRIP) {
            return res.status(400).json({
                message:
                    "Cannot manually set status to 'on_trip'. This is set automatically when a trip is dispatched.",
                status: false,
            });
        }

        if (status === VEHICLE_STATUS.IN_SHOP) {
            return res.status(400).json({
                message:
                    "Cannot manually set status to 'in_shop'. This is set automatically when maintenance is created.",
                status: false,
            });
        }

        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({
                message: "Vehicle not found",
                status: false,
            });
        }

        // Prevent status change if vehicle is currently on a trip
        // (Trip module must complete/cancel first, which resets status)
        if (vehicle.status === VEHICLE_STATUS.ON_TRIP) {
            return res.status(400).json({
                message:
                    "Cannot change status of a vehicle currently on a trip. Complete or cancel the trip first.",
                status: false,
            });
        }

        // Prevent status change if vehicle is in maintenance
        // (Maintenance module must mark as completed first)
        if (vehicle.status === VEHICLE_STATUS.IN_SHOP) {
            return res.status(400).json({
                message:
                    "Cannot change status of a vehicle currently in maintenance. Complete maintenance first.",
                status: false,
            });
        }

        // Apply the status change and persist
        vehicle.status = status;
        await vehicle.save();

        res.status(200).json({
            message: `Vehicle status updated to '${status}'`,
            status: true,
            vehicle,
        });
    } catch (error) {
        console.error("Update vehicle status error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

module.exports = {
    createVehicle,
    getAllVehicles,
    getVehicleStats,
    getVehicleById,
    updateVehicle,
    deleteVehicle,
    updateVehicleStatus,
};
