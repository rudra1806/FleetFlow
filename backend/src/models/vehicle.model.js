// ==========================================
// FleetFlow - Vehicle Model
// ==========================================
// Defines the Mongoose schema for the Vehicle collection.
// Vehicles are the core asset of the fleet — every other module
// (trips, maintenance, expenses, analytics) references this model.
//
// Status lifecycle:
//   "available" → "on_trip"  (auto-set when Trip is dispatched — P2)
//   "available" → "in_shop"  (auto-set when Maintenance is created)
//   "in_shop"   → "available" (auto-set when Maintenance is completed)
//   "available" ↔ "retired"  (manual via PATCH /vehicles/:id/status)
// ==========================================

const mongoose = require("mongoose");
const {
    VEHICLE_TYPES_ARRAY,   // ["truck", "van", "car", "bus", "motorcycle"]
    VEHICLE_STATUS_ARRAY,  // ["available", "on_trip", "in_shop", "retired"]
    FUEL_TYPES_ARRAY,      // ["petrol", "diesel", "electric", "hybrid", "cng"]
} = require("../utils/constants");

const vehicleSchema = new mongoose.Schema(
    {
        // ── Basic Info ──────────────────────────────────────
        name: {
            type: String,
            required: [true, "Vehicle name is required"],
            trim: true,
        },
        model: {
            // Make / model string, e.g. "Tata Ace", "Ashok Leyland 1616"
            type: String,
            required: [true, "Vehicle model is required"],
            trim: true,
        },
        licensePlate: {
            // Unique identifier, auto-uppercased (e.g. "GJ01AB1234")
            type: String,
            required: [true, "License plate is required"],
            unique: true,
            trim: true,
            uppercase: true,
        },
        type: {
            // Vehicle category — validated against constants
            type: String,
            enum: {
                values: VEHICLE_TYPES_ARRAY,
                message: "{VALUE} is not a valid vehicle type",
            },
            required: [true, "Vehicle type is required"],
        },

        // ── Operational Data ────────────────────────────────
        maxCapacity: {
            // Maximum payload in kg — used by trip planner
            type: Number,
            required: [true, "Max load capacity is required"],
            min: [1, "Max capacity must be at least 1 kg"],
        },
        currentOdometer: {
            // Rolling odometer reading in km — updated after each trip
            type: Number,
            default: 0,
            min: [0, "Odometer cannot be negative"],
        },
        status: {
            // Current operational status — mostly managed automatically
            // Only "available" ↔ "retired" transitions are manual
            type: String,
            enum: {
                values: VEHICLE_STATUS_ARRAY,
                message: "{VALUE} is not a valid vehicle status",
            },
            default: "available",
        },
        fuelType: {
            // Fuel category — affects analytics & expense tracking
            type: String,
            enum: {
                values: FUEL_TYPES_ARRAY,
                message: "{VALUE} is not a valid fuel type",
            },
            required: [true, "Fuel type is required"],
        },

        // ── Financial Data ──────────────────────────────────
        acquisitionCost: {
            // Purchase price in ₹ — used by ROI analytics
            type: Number,
            default: 0,
            min: [0, "Acquisition cost cannot be negative"],
        },
        acquisitionDate: {
            type: Date,
            default: Date.now,
        },

        // ── Metadata ────────────────────────────────────────
        year: {
            // Manufacturing year
            type: Number,
            min: [1900, "Year must be after 1900"],
            max: [new Date().getFullYear() + 1, "Year cannot be in the future"],
        },
        color: {
            type: String,
            trim: true,
        },
        region: {
            // Operating region / depot, e.g. "West Gujarat", "Mumbai Hub"
            type: String,
            trim: true,
        },
        notes: {
            type: String,
            trim: true,
        },

        // ── Audit ───────────────────────────────────────────
        createdBy: {
            // Reference to the User (manager) who registered this vehicle
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true, // Adds createdAt & updatedAt automatically
    }
);

// ── Indexes ─────────────────────────────────────────────────
// Compound index: speeds up dashboard queries like "all available trucks"
vehicleSchema.index({ status: 1, type: 1 });
// Unique lookup by plate (already unique, index for fast searches)
vehicleSchema.index({ licensePlate: 1 });
// Region-based filtering on list page
vehicleSchema.index({ region: 1 });

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

module.exports = Vehicle;
