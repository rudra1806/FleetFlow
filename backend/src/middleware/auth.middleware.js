const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

// Authenticate user via JWT token (cookie or Authorization header)
const authMiddleware = async (req, res, next) => {
    try {
        const token =
            req.cookies.token || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Access denied. No token provided.",
                status: false,
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: "User not found. Token invalid.",
                status: false,
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                message: "Account is deactivated. Contact admin.",
                status: false,
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Invalid or expired token",
                status: false,
            });
        }
        console.error("Error in auth middleware:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
};

// Role-based authorization: authorize("manager", "dispatcher")
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
                status: false,
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Required role: ${roles.join(" or ")}`,
                status: false,
            });
        }

        next();
    };
};

module.exports = {
    authMiddleware,
    authorize,
};