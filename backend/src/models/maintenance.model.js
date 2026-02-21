// ==========================================
// FleetFlow - Maintenance Model
// ==========================================
// Defines the Mongoose schema for the Maintenance (service log) collection.
// Each record represents one service event linked to a specific vehicle.
//
// Auto-sync with Vehicle status:
//   - When a maintenance record is CREATED → vehicle status → "in_shop"
//   - When a maintenance record is COMPLETED → vehicle status → "available"
//   (This logic lives in maintenance.controller.js, not here)
//
// Status lifecycle:
//   "scheduled" → "in_progress" → "completed"
// ==========================================

const mongoose = require("mongoose");
const {
    MAINTENANCE_STATUS_ARRAY,  // ["scheduled", "in_progress", "completed"]
    SERVICE_TYPES_ARRAY,       // ["oil_change", "tire_rotation", "brake_service", "engine_repair", "transmission", "electrical", "body_work", "inspection", "general"]
} = require("../utils/constants");

const maintenanceSchema = new mongoose.Schema(
    {
        // ── Vehicle Reference ───────────────────────────────
        vehicle: {
            // The vehicle this service record belongs to
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            required: [true, "Vehicle is required"],
        },

        // ── Service Details ─────────────────────────────────
        serviceType: {
            // Category of service — validated against constants
            type: String,
            enum: {
                values: SERVICE_TYPES_ARRAY,
                message: "{VALUE} is not a valid service type",
            },
            required: [true, "Service type is required"],
        },
        description: {
            // Detailed description of the service performed
            type: String,
            required: [true, "Description is required"],
            trim: true,
        },
        cost: {
            // Service cost in ₹ — feeds into analytics & ROI calculations
            type: Number,
            required: [true, "Cost is required"],
            min: [0, "Cost cannot be negative"],
        },

        // ── Dates ───────────────────────────────────────────
        serviceDate: {
            // When the service is scheduled / started
            type: Date,
            default: Date.now,
        },
        completionDate: {
            // Auto-set when status changes to "completed" (controller logic)
            type: Date,
            default: null,
        },

        // ── Status ──────────────────────────────────────────
        status: {
            // Current state of this maintenance record
            type: String,
            enum: {
                values: MAINTENANCE_STATUS_ARRAY,
                message: "{VALUE} is not a valid maintenance status",
            },
            default: "scheduled",
        },

        // ── Additional Info ─────────────────────────────────
        mechanic: {
            // Name of the mechanic / technician handling this service
            type: String,
            trim: true,
        },
        notes: {
            type: String,
            trim: true,
        },

        // ── Audit ───────────────────────────────────────────
        createdBy: {
            // Reference to the User (manager) who logged this maintenance
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
// Compound: quickly find active maintenance for a specific vehicle
maintenanceSchema.index({ vehicle: 1, status: 1 });
// Descending sort on serviceDate for "most recent first" queries
maintenanceSchema.index({ serviceDate: -1 });

const Maintenance = mongoose.model("Maintenance", maintenanceSchema);

module.exports = Maintenance;
