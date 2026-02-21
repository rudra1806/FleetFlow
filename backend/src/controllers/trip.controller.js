const Trip = require("../models/trip.model");
const Vehicle = require("../models/vehicle.model");
const Driver = require("../models/driver.model");
const { VEHICLE_STATUS, DRIVER_STATUS, TRIP_STATUS } = require("../utils/constants");

// POST /api/trips — Create a new trip (status defaults to "draft")
async function createTrip(req, res) {
    try {
        const { vehicle, driver, cargoWeight, origin, destination, distance, notes } = req.body;

        // Verify vehicle exists
        const vehicleDoc = await Vehicle.findById(vehicle);
        if (!vehicleDoc) {
            return res.status(404).json({ message: "Vehicle not found", status: false });
        }

        // Check vehicle is available
        if (vehicleDoc.status !== VEHICLE_STATUS.AVAILABLE) {
            return res.status(400).json({
                message: `Vehicle is currently '${vehicleDoc.status}' and cannot be assigned`,
                status: false,
            });
        }
        // Check cargo weight does not exceed vehicle capacity
        if (cargoWeight > vehicleDoc.maxCapacity) {
            return res.status(400).json({
                message: `Cargo weight (${cargoWeight} kg) exceeds vehicle max capacity (${vehicleDoc.maxCapacity} kg)`,
                status: false,
            });
        }

        // Verify driver exists
        const driverDoc = await Driver.findById(driver);
        if (!driverDoc) {
            return res.status(404).json({ message: "Driver not found", status: false });
        }

        // Check driver is on duty
        if (driverDoc.status !== DRIVER_STATUS.ON_DUTY) {
            return res.status(400).json({
                message: `Driver is currently '${driverDoc.status}' and cannot be assigned`,
                status: false,
            });
        }

        // Check driver license is not expired
        if (driverDoc.licenseExpiry && driverDoc.licenseExpiry <= new Date()) {
            return res.status(400).json({
                message: "Driver's license has expired. Cannot assign to trip.",
                status: false,
            });
        }

        const trip = new Trip({
            vehicle,
            driver,
            cargoWeight,
            origin,
            destination,
            distance,
            notes,
            createdBy: req.user._id,
        });

        await trip.save();

        const populated = await Trip.findById(trip._id)
            .populate("vehicle", "name licensePlate type maxCapacity")
            .populate("driver", "name phone licenseNumber licenseExpiry")
            .populate("createdBy", "name email");

        res.status(201).json({
            message: "Trip created successfully in draft status.",
            status: true,
            trip: populated,
        });
    } catch (error) {
        console.error("Create trip error:", error);
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

// PUT /api/trips/:id — Update a draft trip's details
async function updateTrip(req, res) {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) {
            return res.status(404).json({ message: "Trip not found", status: false });
        }

        if (trip.status !== TRIP_STATUS.DRAFT) {
            return res.status(400).json({
                message: "Only draft trips can be edited",
                status: false,
            });
        }

        const allowedFields = ["cargoWeight", "origin", "destination", "distance", "notes", "vehicle", "driver"];
        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        // If changing vehicle, validate capacity
        if (updates.vehicle || updates.cargoWeight) {
            const vehicleId = updates.vehicle || trip.vehicle;
            const cargo = updates.cargoWeight || trip.cargoWeight;
            const vehicleDoc = await Vehicle.findById(vehicleId);
            if (!vehicleDoc) {
                return res.status(404).json({ message: "Vehicle not found", status: false });
            }
            if (vehicleDoc.status !== VEHICLE_STATUS.AVAILABLE) {
                return res.status(400).json({
                    message: `Vehicle is currently '${vehicleDoc.status}' and cannot be assigned`,
                    status: false,
                });
            }
            if (cargo > vehicleDoc.maxCapacity) {
                return res.status(400).json({
                    message: `Cargo weight (${cargo} kg) exceeds vehicle max capacity (${vehicleDoc.maxCapacity} kg)`,
                    status: false,
                });
            }
        }

        // If changing driver, validate license and status
        if (updates.driver) {
            const driverDoc = await Driver.findById(updates.driver);
            if (!driverDoc) {
                return res.status(404).json({ message: "Driver not found", status: false });
            }
            if (driverDoc.status !== DRIVER_STATUS.ON_DUTY) {
                return res.status(400).json({
                    message: `Driver is currently '${driverDoc.status}' and cannot be assigned`,
                    status: false,
                });
            }
            if (driverDoc.licenseExpiry && driverDoc.licenseExpiry <= new Date()) {
                return res.status(400).json({
                    message: "Driver's license has expired. Cannot assign to trip.",
                    status: false,
                });
            }
        }

        const updated = await Trip.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        })
            .populate("vehicle", "name licensePlate type maxCapacity")
            .populate("driver", "name phone licenseNumber")
            .populate("createdBy", "name email");

        res.status(200).json({
            message: "Trip updated successfully",
            status: true,
            trip: updated,
        });
    } catch (error) {
        console.error("Update trip error:", error);
        res.status(500).json({ message: "Internal server error", status: false });
    }
}


// GET /api/trips — List all trips with pagination & filters
async function getAllTrips(req, res) {
    try {
        const { page = 1, limit = 10, status, vehicle, driver } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));

        const filter = {};
        if (status) filter.status = status;
        if (vehicle) filter.vehicle = vehicle;
        if (driver) filter.driver = driver;

        const [trips, total] = await Promise.all([
            Trip.find(filter)
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .populate("vehicle", "name licensePlate")
                .populate("driver", "name")
                .populate("createdBy", "name"),
            Trip.countDocuments(filter),
        ]);

        res.status(200).json({
            status: true,
            count: trips.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            trips,
        });
    } catch (error) {
        console.error("Get trips error:", error);
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

// GET /api/trips/:id — Single trip details
async function getTripById(req, res) {
    try {
        const trip = await Trip.findById(req.params.id)
            .populate("vehicle", "name licensePlate type model currentOdometer")
            .populate("driver", "name phone licenseNumber safetyScore")
            .populate("createdBy", "name email");

        if (!trip) {
            return res.status(404).json({ message: "Trip not found", status: false });
        }

        res.status(200).json({ status: true, trip });
    } catch (error) {
        console.error("Get trip by ID error:", error);
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

// PATCH /api/trips/:id/status — Dispatch/Complete/Cancel trip
// This contains the core business logic for updating vehicle/driver states
async function updateTripStatus(req, res) {
    try {
        const { status, endOdometer, rating } = req.body;
        const trip = await Trip.findById(req.params.id);

        if (!trip) {
            return res.status(404).json({ message: "Trip not found", status: false });
        }

        // 1. DISPATCH: Draft -> Dispatched
        if (status === TRIP_STATUS.DISPATCHED) {
            if (trip.status !== TRIP_STATUS.DRAFT) {
                return res.status(400).json({ message: "Only draft trips can be dispatched", status: false });
            }

            const vehicle = await Vehicle.findById(trip.vehicle);
            const driver = await Driver.findById(trip.driver);

            if (vehicle.status !== VEHICLE_STATUS.AVAILABLE) {
                return res.status(400).json({ message: `Vehicle is ${vehicle.status}, not available`, status: false });
            }
            if (driver.status !== DRIVER_STATUS.ON_DUTY) {
                return res.status(400).json({ message: `Driver is ${driver.status}, not on duty`, status: false });
            }

            // Update trip
            trip.status = TRIP_STATUS.DISPATCHED;
            trip.startDate = new Date();
            trip.startOdometer = vehicle.currentOdometer;

            // Update vehicle & driver
            vehicle.status = VEHICLE_STATUS.ON_TRIP;
            driver.status = DRIVER_STATUS.ON_TRIP;
            driver.assignedVehicle = vehicle._id;
            driver.totalTrips += 1;

            await Promise.all([trip.save(), vehicle.save(), driver.save()]);
        }

        // 2. COMPLETE: Dispatched -> Completed
        else if (status === TRIP_STATUS.COMPLETED) {
            if (trip.status !== TRIP_STATUS.DISPATCHED) {
                return res.status(400).json({ message: "Only dispatched trips can be completed", status: false });
            }
            if (!endOdometer || endOdometer < trip.startOdometer) {
                return res.status(400).json({ message: "Valid end odometer reading is required", status: false });
            }

            const vehicle = await Vehicle.findById(trip.vehicle);
            const driver = await Driver.findById(trip.driver);

            // Update trip
            trip.status = TRIP_STATUS.COMPLETED;
            trip.endDate = new Date();
            trip.endOdometer = endOdometer;

            // Update vehicle & driver
            vehicle.status = VEHICLE_STATUS.AVAILABLE;
            vehicle.currentOdometer = endOdometer;

            driver.status = DRIVER_STATUS.ON_DUTY;
            driver.assignedVehicle = null;
            driver.completedTrips += 1;

            if (rating && rating >= 1 && rating <= 5) {
                trip.rating = rating;
                const currentTotalScore = (driver.rating || 0) * (driver.ratingCount || 0);
                driver.ratingCount += 1;
                driver.rating = (currentTotalScore + rating) / driver.ratingCount;
            }

            await Promise.all([trip.save(), vehicle.save(), driver.save()]);
        }

        // 3. CANCEL: Draft/Dispatched -> Cancelled
        else if (status === TRIP_STATUS.CANCELLED) {
            if (trip.status === TRIP_STATUS.COMPLETED) {
                return res.status(400).json({ message: "Completed trips cannot be cancelled", status: false });
            }

            if (trip.status === TRIP_STATUS.DISPATCHED) {
                const vehicle = await Vehicle.findById(trip.vehicle);
                const driver = await Driver.findById(trip.driver);

                vehicle.status = VEHICLE_STATUS.AVAILABLE;
                driver.status = DRIVER_STATUS.ON_DUTY;
                driver.assignedVehicle = null;
                driver.totalTrips = Math.max(0, driver.totalTrips - 1);

                await Promise.all([vehicle.save(), driver.save()]);
            }

            trip.status = TRIP_STATUS.CANCELLED;
            await trip.save();
        }

        res.status(200).json({
            message: `Trip status updated to ${status}`,
            status: true,
            trip,
        });
    } catch (error) {
        console.error("Update trip status error:", error);
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

module.exports = {
    createTrip,
    updateTrip,
    getAllTrips,
    getTripById,
    updateTripStatus,
};
