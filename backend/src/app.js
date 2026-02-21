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

app.use("/api/auth", authRoutes);

// Global error handler (must be after routes)
app.use(errorHandler);

module.exports = app;