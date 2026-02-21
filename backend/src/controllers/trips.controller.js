const Trip = require("../models/trip.model");
const Driver = require("../models/driver.model");
const Vehicle = require("../models/vehicle.model");


// 🔥 AUTO CREATE + AUTO ASSIGN
exports.createTrip = async (req, res) => {
  try {
    const { cargoWeight, origin, destination } = req.body;

    // 1️⃣ Find first valid driver
    const driver = await Driver.findOne({
      status: "available",
      licenseExpiry: { $gt: new Date() }
    }).sort({ createdAt: 1 });

    if (!driver)
      return res.status(400).json({ message: "No available valid driver" });

    // 2️⃣ Find smallest viable vehicle
    const vehicle = await Vehicle.findOne({
      status: "available",
      capacity: { $gte: cargoWeight }
    }).sort({ capacity: 1 });

    if (!vehicle)
      return res.status(400).json({ message: "No suitable vehicle available" });

    // 3️⃣ Lock resources
    driver.status = "on_trip";
    driver.totalTrips += 1;
    await driver.save();

    vehicle.status = "on_trip";
    await vehicle.save();

    // 4️⃣ Create trip
    const trip = await Trip.create({
      driver: driver._id,
      vehicle: vehicle._id,
      origin,
      destination,
      cargoWeight,
      startOdometer: vehicle.odometer,
    });

    res.status(201).json({
      message: "Trip auto-assigned successfully",
      trip,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// 🔥 COMPLETE TRIP
exports.completeTrip = async (req, res) => {
  try {
    const { endOdometer } = req.body;

    const trip = await Trip.findById(req.params.id);
    if (!trip)
      return res.status(404).json({ message: "Trip not found" });

    if (trip.status === "completed")
      return res.status(400).json({ message: "Trip already completed" });

    const driver = await Driver.findById(trip.driver);
    const vehicle = await Vehicle.findById(trip.vehicle);

    // Update trip
    trip.status = "completed";
    trip.endTime = new Date();
    trip.endOdometer = endOdometer;
    trip.distance = endOdometer - trip.startOdometer;
    await trip.save();

    // Free driver
    driver.status = "available";
    driver.completedTrips += 1;
    await driver.save();

    // Free vehicle
    vehicle.status = "available";
    vehicle.odometer = endOdometer;
    await vehicle.save();

    res.json({ message: "Trip completed successfully", trip });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// 🔥 GET TRIPS (filters + pagination)
exports.getTrips = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;

    const trips = await Trip.find(query)
      .populate("driver")
      .populate("vehicle")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Trip.countDocuments(query);

    res.json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      trips,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};