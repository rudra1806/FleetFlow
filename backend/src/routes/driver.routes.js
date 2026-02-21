const express = require("express");
const router = express.Router();
const driverController = require("../controllers/driver.controller");

router.post("/", driverController.createDriver);
router.get("/", driverController.getDrivers);
router.get("/:id", driverController.getDriverById);
router.put("/:id", driverController.updateDriver);
router.delete("/:id", driverController.deleteDriver);

module.exports = router;