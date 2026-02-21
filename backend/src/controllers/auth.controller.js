const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");
const { USER_ROLES_ARRAY } = require("../utils/constants");

// Helper: generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
};

// POST /api/auth/register
async function registerUser(req, res) {
    try {
        const { name, email, password, role, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email, and password are required",
                status: false,
            });
        }

        console.log("1");

        // Validate role if provided
        if (role && !USER_ROLES_ARRAY.includes(role)) {
            return res.status(400).json({
                message: `Invalid role. Allowed: ${USER_ROLES_ARRAY.join(", ")}`,
                status: false,
            });
        }

        console.log("2");


        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                message: "User already exists with this email",
                status: false,
            });
        }
        console.log("3");

        const user = new User({
            name,
            email,
            password,
            role: role || "dispatcher",
            phone: phone || null,
        });

        console.log("4");

        await user.save();

        const token = generateToken(user._id);

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(201).json({
            message: "User registered successfully",
            status: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
            },
            token,
        });

        // Send email in background (don't block response)
        emailService.sendRegistrationEmail(email, name).catch(console.error);
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({
            message: "Internal server error 1",
            status: false,
        });
    }
}

// POST /api/auth/login
async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
                status: false,
            });
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                message: "Account is deactivated. Contact admin.",
                status: false,
            });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid password",
                status: false,
            });
        }

        const token = generateToken(user._id);

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            message: "Login successful",
            status: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
            },
            token,
        });

        // Send email in background
        emailService.sendLoginEmail(email, user.name).catch(console.error);
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: "Internal server error 1",
            status: false,
        });
    }
}

// GET /api/auth/me
async function getProfile(req, res) {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
            });
        }

        res.status(200).json({
            status: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                isActive: user.isActive,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

// PUT /api/auth/profile
async function updateProfile(req, res) {
    try {
        const { name, phone } = req.body;
        const updates = {};

        if (name) updates.name = name;
        if (phone !== undefined) updates.phone = phone;

        const user = await User.findByIdAndUpdate(req.user._id, updates, {
            new: true,
            runValidators: true,
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
            });
        }

        res.status(200).json({
            message: "Profile updated successfully",
            status: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
            },
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

// POST /api/auth/logout
async function logoutUser(req, res) {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        res.status(200).json({
            message: "Logged out successfully",
            status: true,
        });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
                status: false,
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            // Don't reveal if user exists or not (security best practice)
            return res.status(200).json({
                message: "If a user with that email exists, a reset email has been sent",
                status: true,
            });
        }

        // In a real app, generate a reset token & save it
        // For now, just send notification
        emailService
            .sendForgotPasswordEmail(email, user.name)
            .catch(console.error);

        res.status(200).json({
            message: "If a user with that email exists, a reset email has been sent",
            status: true,
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

module.exports = {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    logoutUser,
    forgotPassword,
};
