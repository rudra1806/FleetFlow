const Driver = require("../models/driver.model");

// Create Driver
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

// Get All Drivers
exports.getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().populate("assignedVehicle", "name licensePlate");
    res.json({
      status: true,
      count: drivers.length,
      drivers
    });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

// Get Single Driver
exports.getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id).populate("assignedVehicle", "name licensePlate type");
    if (!driver) return res.status(404).json({ status: false, message: "Driver not found" });
    res.json({ status: true, driver });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

// Update Driver
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

// Delete Driver
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