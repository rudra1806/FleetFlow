const Driver = require("../models/driver.model");

// CREATE
exports.createDriver = async (req, res) => {
  try {
    const driver = await Driver.create(req.body);
    res.status(201).json(driver);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET ALL (with filters + pagination)
exports.getDrivers = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;

    const drivers = await Driver.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Driver.countDocuments(query);

    res.json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      drivers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET SINGLE
exports.getDriverById = async (req, res) => {
  const driver = await Driver.findById(req.params.id);
  if (!driver) return res.status(404).json({ message: "Driver not found" });
  res.json(driver);
};

// UPDATE
exports.updateDriver = async (req, res) => {
  const driver = await Driver.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(driver);
};

// DELETE
exports.deleteDriver = async (req, res) => {
  await Driver.findByIdAndDelete(req.params.id);
  res.json({ message: "Driver removed" });
};

// PERFORMANCE PROFILE
exports.getDriverPerformance = async (req, res) => {
  const driver = await Driver.findById(req.params.id);
  if (!driver) return res.status(404).json({ message: "Driver not found" });

  res.json({
    name: driver.name,
    totalTrips: driver.totalTrips,
    completedTrips: driver.completedTrips,
    completionRate: driver.completionRate,
    safetyScore: driver.safetyScore,
    licenseValid: driver.isLicenseValid,
  });
};