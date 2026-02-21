// ==========================================
// FleetFlow - Maintenance Controller
// ==========================================
// Handles all CRUD operations for the Maintenance (service log) module.
// This controller contains critical AUTO-SYNC logic that keeps the
// Vehicle status in sync with maintenance events:
//
//   CREATE maintenance → vehicle.status = "in_shop"
//   COMPLETE maintenance → vehicle.status = "available"
//
// Functions:
//   createMaintenance       — POST /api/maintenance
//   getAllMaintenance        — GET  /api/maintenance          (pagination, filters)
//   getMaintenanceById      — GET  /api/maintenance/:id
//   updateMaintenance       — PUT  /api/maintenance/:id      (auto-sync on completion)
//   getMaintenanceByVehicle — GET  /api/maintenance/vehicle/:vehicleId
// ==========================================

const Maintenance = require("../models/maintenance.model");
const Vehicle = require("../models/vehicle.model");
const { VEHICLE_STATUS, MAINTENANCE_STATUS } = require("../utils/constants");

/**
 * POST /api/maintenance — Create a maintenance log for a vehicle
 *
 * @access  Manager only
 * @body    { vehicle (ObjectId), serviceType, description, cost, serviceDate?, mechanic?, notes? }
 * @returns 201 + created maintenance | 404 if vehicle not found | 400 if vehicle on trip
 *
 * AUTO-SYNC LOGIC:
 *   After saving the maintenance record, this function automatically
 *   sets the referenced vehicle's status to "in_shop". This ensures the
 *   vehicle cannot be assigned to trips while being serviced.
 */
async function createMaintenance(req, res) {
    try {
        const { vehicle, serviceType, description, cost, serviceDate, mechanic, notes } =
            req.body;

        // Step 1: Verify the vehicle exists in the database
        const vehicleDoc = await Vehicle.findById(vehicle);
        if (!vehicleDoc) {
            return res.status(404).json({
                message: "Vehicle not found",
                status: false,
            });
        }

        // Step 2: Block maintenance creation for vehicles on active trips
        // (the trip must be completed/cancelled before servicing)
        if (vehicleDoc.status === VEHICLE_STATUS.ON_TRIP) {
            return res.status(400).json({
                message:
                    "Cannot create maintenance for a vehicle currently on a trip. Complete/cancel the trip first.",
                status: false,
            });
        }
        vehicleDoc.status = VEHICLE_STATUS.IN_SHOP; // Preemptively set to in_shop
        // Step 3: Create the maintenance record
        const maintenance = new Maintenance({
    ...req.body,
    createdBy: req.user._id,
});

        await maintenance.save();

        // Step 4: AUTO-SYNC — mark the vehicle as "in_shop"
        vehicleDoc.status = VEHICLE_STATUS.IN_SHOP;
        await vehicleDoc.save();

        const populated = await Maintenance.findById(maintenance._id)
            .populate("vehicle", "name licensePlate type status")
            .populate("createdBy", "name email");

        res.status(201).json({
            message: "Maintenance log created. Vehicle status set to 'in_shop'.",
            status: true,
            maintenance: populated,
        });
    } catch (error) {
        console.error("Create maintenance error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

/**
 * GET /api/maintenance — List all maintenance records with pagination & filters
 *
 * @access  All authenticated roles
 * @query   page (default 1), limit (default 10, max 100)
 * @query   vehicle — filter by vehicle ObjectId
 * @query   serviceType — filter by service category (e.g. "oil_change")
 * @query   status — filter by maintenance status ("scheduled", "in_progress", "completed")
 * @query   sortBy (default "serviceDate"), order ("asc" | "desc")
 * @returns Paginated list: { maintenance[], count, total, totalPages, currentPage }
 */
async function getAllMaintenance(req, res) {
    try {
        // Extract query params with defaults
        const {
            page = 1,
            limit = 10,
            vehicle,
            serviceType,
            status,
            sortBy = "serviceDate",
            order = "desc",
        } = req.query;

        // Clamp pagination values to safe ranges
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));

        // Build dynamic filter — only add keys that are provided
        const filter = {};
        if (vehicle) filter.vehicle = vehicle;
        if (serviceType) filter.serviceType = serviceType;
        if (status) filter.status = status;

        const sortObj = {};
        sortObj[sortBy] = order === "asc" ? 1 : -1;

        const [records, total] = await Promise.all([
            Maintenance.find(filter)
                .sort(sortObj)
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .populate("vehicle", "name licensePlate type status")
                .populate("createdBy", "name email"),
            Maintenance.countDocuments(filter),
        ]);

        res.status(200).json({
            status: true,
            count: records.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            maintenance: records,
        });
    } catch (error) {
        console.error("Get all maintenance error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

/**
 * GET /api/maintenance/:id — Get a single maintenance record by its MongoDB _id
 *
 * @access  All authenticated roles
 * @param   id — MongoDB ObjectId from URL params
 * @returns 200 + maintenance | 404 if not found | 400 if invalid ObjectId
 */
async function getMaintenanceById(req, res) {
    try {
        const maintenance = await Maintenance.findById(req.params.id)
            .populate("vehicle", "name licensePlate type status model")
            .populate("createdBy", "name email");

        if (!maintenance) {
            return res.status(404).json({
                message: "Maintenance record not found",
                status: false,
            });
        }

        res.status(200).json({
            status: true,
            maintenance,
        });
    } catch (error) {
        console.error("Get maintenance by ID error:", error);
        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid maintenance ID format",
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
 * PUT /api/maintenance/:id — Update a maintenance record
 *
 * @access  Manager only
 * @body    Any maintenance field EXCEPT vehicle, createdBy, _id
 * @returns 200 + updated record | 404 | 400 if already completed
 *
 * AUTO-SYNC LOGIC (on completion):
 *   When status is changed to "completed":
 *   1. completionDate is auto-set to current timestamp
 *   2. The linked vehicle's status is restored to "available"
 *   This frees the vehicle for new trip assignments.
 *
 * Notes:
 *   - Once a record is completed, it becomes immutable (no further edits).
 *   - The vehicle reference cannot be changed after creation.
 */
async function updateMaintenance(req, res) {
    try {
        const maintenance = await Maintenance.findById(req.params.id);

        if (!maintenance) {
            return res.status(404).json({
                message: "Maintenance record not found",
                status: false,
            });
        }

        // Completed records are immutable — no edits allowed
        if (maintenance.status === MAINTENANCE_STATUS.COMPLETED) {
            return res.status(400).json({
                message: "Cannot edit a completed maintenance record",
                status: false,
            });
        }

        const updates = { ...req.body };
        // Strip protected fields that cannot be changed via update
        delete updates.vehicle;   // Immutable after creation
        delete updates.createdBy; // Audit field
        delete updates._id;

        // AUTO-SYNC: If marking as completed, release the vehicle
        if (updates.status === MAINTENANCE_STATUS.COMPLETED) {
            // Auto-set the completion timestamp
            updates.completionDate = new Date();

            // Restore vehicle status to "available" so it can be used again
            await Vehicle.findByIdAndUpdate(maintenance.vehicle, {
                status: VEHICLE_STATUS.AVAILABLE,
            });
        }

        const updated = await Maintenance.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        )
            .populate("vehicle", "name licensePlate type status")
            .populate("createdBy", "name email");

        const message =
            updates.status === MAINTENANCE_STATUS.COMPLETED
                ? "Maintenance completed. Vehicle status set back to 'available'."
                : "Maintenance record updated successfully";

        res.status(200).json({
            message,
            status: true,
            maintenance: updated,
        });
    } catch (error) {
        console.error("Update maintenance error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

/**
 * GET /api/maintenance/vehicle/:vehicleId — Full service history for one vehicle
 *
 * @access  All authenticated roles
 * @param   vehicleId — MongoDB ObjectId of the vehicle
 * @query   page (default 1), limit (default 10, max 100)
 * @returns Paginated list of maintenance records sorted by serviceDate (newest first)
 */
async function getMaintenanceByVehicle(req, res) {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));

        const filter = { vehicle: req.params.vehicleId };

        const [records, total] = await Promise.all([
            Maintenance.find(filter)
                .sort({ serviceDate: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .populate("vehicle", "name licensePlate type")
                .populate("createdBy", "name email"),
            Maintenance.countDocuments(filter),
        ]);

        res.status(200).json({
            status: true,
            count: records.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            maintenance: records,
        });
    } catch (error) {
        console.error("Get maintenance by vehicle error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

module.exports = {
    createMaintenance,
    getAllMaintenance,
    getMaintenanceById,
    updateMaintenance,
    getMaintenanceByVehicle,
    deleteMaintenance,
};

/**
 * DELETE /api/maintenance/:id — Delete a maintenance record
 *
 * @access  Manager only
 * @returns 200 + success | 404 | 400 if not in "scheduled" status
 *
 * Only scheduled maintenance can be deleted. In-progress or completed
 * records have already affected vehicle status and should not be removed.
 */
async function deleteMaintenance(req, res) {
    try {
        const maintenance = await Maintenance.findById(req.params.id);
        if (!maintenance) {
            return res.status(404).json({
                message: "Maintenance record not found",
                status: false,
            });
        }

        if (maintenance.status !== MAINTENANCE_STATUS.SCHEDULED) {
            return res.status(400).json({
                message: `Cannot delete maintenance with status '${maintenance.status}'. Only scheduled records can be deleted.`,
                status: false,
            });
        }

        // If vehicle was set to in_shop when this was created, restore to available
        const vehicle = await Vehicle.findById(maintenance.vehicle);
        if (vehicle && vehicle.status === VEHICLE_STATUS.IN_SHOP) {
            vehicle.status = VEHICLE_STATUS.AVAILABLE;
            await vehicle.save();
        }

        await Maintenance.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Maintenance record deleted successfully",
            status: true,
        });
    } catch (error) {
        console.error("Delete maintenance error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}
