// ==========================================
// FleetFlow - Global Error Handler
// ==========================================

const errorHandler = (err, req, res, next) => {
    console.error("Error:", err.message);

    // Mongoose validation error
    if (err.name === "ValidationError") {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({
            message: messages.join(", "),
            status: false,
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            message: `${field} already exists`,
            status: false,
        });
    }

    // Mongoose bad ObjectId
    if (err.name === "CastError") {
        return res.status(400).json({
            message: "Invalid ID format",
            status: false,
        });
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
            message: "Invalid token",
            status: false,
        });
    }

    if (err.name === "TokenExpiredError") {
        return res.status(401).json({
            message: "Token expired",
            status: false,
        });
    }

    // Default server error
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        message: err.message || "Internal server error",
        status: false,
    });
};

module.exports = errorHandler;
