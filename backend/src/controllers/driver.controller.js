const Driver = require("../models/driver.model");

// CREATE
exports.createDriver = async (req, res) => {
  try {
    const driver = new Driver({
      ...req.body,
      createdBy: req.user._id
    });
    await driver.save();
    res.status(201).json({
      status: true,
      message: "Driver created successfully",
      driver
    });
  } catch (err) {
    console.error("Create driver error:", err);
    res.status(400).json({ status: false, message: err.message });
  }
};

// GET ALL (with filters + pagination)
exports.getDrivers = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));

    const [drivers, total] = await Promise.all([
      Driver.find(query)
        .populate("assignedVehicle", "name licensePlate")
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      Driver.countDocuments(query),
    ]);

    res.json({
      status: true,
      count: drivers.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      drivers,
    });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

// GET SINGLE
exports.getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id).populate("assignedVehicle", "name licensePlate type");
    if (!driver) return res.status(404).json({ status: false, message: "Driver not found" });
    res.json({ status: true, driver });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

// UPDATE
exports.updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!driver) return res.status(404).json({ status: false, message: "Driver not found" });
    res.json({
      status: true,
      message: "Driver updated successfully",
      driver
    });
  } catch (err) {
    res.status(400).json({ status: false, message: err.message });
  }
};

// DELETE
exports.deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ status: false, message: "Driver not found" });

    if (driver.status === "on_trip") {
      return res.status(400).json({ status: false, message: "Cannot delete a driver currently on a trip" });
    }

    await Driver.findByIdAndDelete(req.params.id);
    res.json({ status: true, message: "Driver deleted successfully" });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

// PERFORMANCE PROFILE
exports.getDriverPerformance = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ status: false, message: "Driver not found" });

    res.json({
      status: true,
      performance: {
        name: driver.name,
        totalTrips: driver.totalTrips,
        completedTrips: driver.completedTrips,
        completionRate: driver.completionRate,
        safetyScore: driver.safetyScore,
        licenseValid: driver.isLicenseValid,
      },
    });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};