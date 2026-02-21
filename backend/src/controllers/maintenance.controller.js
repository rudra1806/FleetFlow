const Maintenance = require("../models/maintenance.model");
const Vehicle = require("../models/vehicle.model");
const { VEHICLE_STATUS, MAINTENANCE_STATUS } = require("../utils/constants");

// POST /api/maintenance — Create maintenance log & auto-set vehicle "in_shop"
async function createMaintenance(req, res) {
    try {
        const { vehicle, serviceType, description, cost, serviceDate, mechanic, notes } =
            req.body;

        // Verify vehicle exists
        const vehicleDoc = await Vehicle.findById(vehicle);
        if (!vehicleDoc) {
            return res.status(404).json({
                message: "Vehicle not found",
                status: false,
            });
        }

        // Block if vehicle is on a trip
        if (vehicleDoc.status === VEHICLE_STATUS.ON_TRIP) {
            return res.status(400).json({
                message:
                    "Cannot create maintenance for a vehicle currently on a trip. Complete/cancel the trip first.",
                status: false,
            });
        }

        const maintenance = new Maintenance({
            vehicle,
            serviceType,
            description,
            cost,
            serviceDate,
            mechanic,
            notes,
            createdBy: req.user._id,
        });

        await maintenance.save();

        // AUTO-LOGIC: Set vehicle status to "in_shop"
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

// GET /api/maintenance — List all maintenance with pagination & filters
async function getAllMaintenance(req, res) {
    try {
        const {
            page = 1,
            limit = 10,
            vehicle,
            serviceType,
            status,
            sortBy = "serviceDate",
            order = "desc",
        } = req.query;

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));

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

// GET /api/maintenance/:id — Single maintenance record
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

// PUT /api/maintenance/:id — Update maintenance (auto vehicle-status on completion)
async function updateMaintenance(req, res) {
    try {
        const maintenance = await Maintenance.findById(req.params.id);

        if (!maintenance) {
            return res.status(404).json({
                message: "Maintenance record not found",
                status: false,
            });
        }

        // If already completed, block further edits
        if (maintenance.status === MAINTENANCE_STATUS.COMPLETED) {
            return res.status(400).json({
                message: "Cannot edit a completed maintenance record",
                status: false,
            });
        }

        const updates = { ...req.body };
        delete updates.vehicle; // Can't change vehicle after creation
        delete updates.createdBy;
        delete updates._id;

        // If marking as completed, auto-set completionDate & free the vehicle
        if (updates.status === MAINTENANCE_STATUS.COMPLETED) {
            updates.completionDate = new Date();

            // AUTO-LOGIC: Set vehicle status back to "available"
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

// GET /api/maintenance/vehicle/:vehicleId — Maintenance history for a vehicle
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
};
