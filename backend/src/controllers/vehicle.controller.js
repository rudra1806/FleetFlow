const Vehicle = require("../models/vehicle.model");
const { VEHICLE_STATUS } = require("../utils/constants");

// POST /api/vehicles — Create a new vehicle
async function createVehicle(req, res) {
    try {
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
            createdBy: req.user._id,
        });

        await vehicle.save();

        res.status(201).json({
            message: "Vehicle created successfully",
            status: true,
            vehicle,
        });
    } catch (error) {
        console.error("Create vehicle error:", error);

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

// GET /api/vehicles — List vehicles with pagination, filters, search, sort
async function getAllVehicles(req, res) {
    try {
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

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));

        // Build filter object
        const filter = {};
        if (type) filter.type = type;
        if (status) filter.status = status;
        if (region) filter.region = { $regex: region, $options: "i" };
        if (fuelType) filter.fuelType = fuelType;

        // Search by name or license plate
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { licensePlate: { $regex: search, $options: "i" } },
                { model: { $regex: search, $options: "i" } },
            ];
        }

        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = order === "asc" ? 1 : -1;

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
            count: vehicles.length,
            total,
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

// GET /api/vehicles/stats — Vehicle statistics for dashboard
async function getVehicleStats(req, res) {
    try {
        const [total, available, on_trip, in_shop, retired] = await Promise.all([
            Vehicle.countDocuments(),
            Vehicle.countDocuments({ status: VEHICLE_STATUS.AVAILABLE }),
            Vehicle.countDocuments({ status: VEHICLE_STATUS.ON_TRIP }),
            Vehicle.countDocuments({ status: VEHICLE_STATUS.IN_SHOP }),
            Vehicle.countDocuments({ status: VEHICLE_STATUS.RETIRED }),
        ]);

        const activeFleet = total - retired;
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

// GET /api/vehicles/:id — Get single vehicle by ID
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

// PUT /api/vehicles/:id — Update vehicle details
async function updateVehicle(req, res) {
    try {
        const updates = { ...req.body };

        // Prevent changing these fields via this endpoint
        delete updates.status; // Use PATCH /:id/status instead
        delete updates.createdBy;
        delete updates._id;

        const vehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
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

// DELETE /api/vehicles/:id — Delete a vehicle
async function deleteVehicle(req, res) {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({
                message: "Vehicle not found",
                status: false,
            });
        }

        if (vehicle.status === VEHICLE_STATUS.ON_TRIP) {
            return res.status(400).json({
                message:
                    "Cannot delete a vehicle that is currently on a trip. Complete or cancel the trip first.",
                status: false,
            });
        }

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

// PATCH /api/vehicles/:id/status — Update vehicle status with rules
async function updateVehicleStatus(req, res) {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                message: "Status is required",
                status: false,
            });
        }

        // Block manual setting of auto-managed statuses
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

        // Prevent status change if vehicle is on a trip
        if (vehicle.status === VEHICLE_STATUS.ON_TRIP) {
            return res.status(400).json({
                message:
                    "Cannot change status of a vehicle currently on a trip. Complete or cancel the trip first.",
                status: false,
            });
        }

        // Prevent status change if vehicle is in maintenance
        if (vehicle.status === VEHICLE_STATUS.IN_SHOP) {
            return res.status(400).json({
                message:
                    "Cannot change status of a vehicle currently in maintenance. Complete maintenance first.",
                status: false,
            });
        }

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
