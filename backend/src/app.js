const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/error.middleware");

const app = express();

// Middleware
app.use(
    cors({
        origin: ["http://localhost:5173", "http://localhost:5174"],
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());

// Health check
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to FleetFlow API 🚛",
        version: "1.0.0",
        status: true,
    });
});

// Routes
const authRoutes = require("./routes/auth.routes");
const vehicleRoutes = require("./routes/vehicle.routes");
const maintenanceRoutes = require("./routes/maintenance.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const analyticsRoutes = require("./routes/analytics.routes");

app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);

// P2 & P3 routes
const driverRoutes = require("./routes/driver.routes");
const tripRoutes = require("./routes/trip.routes");
const expenseRoutes = require("./routes/expense.routes");
app.use("/api/drivers", driverRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/expenses", expenseRoutes);

// Global error handler (must be after routes)
app.use(errorHandler);

module.exports = app;