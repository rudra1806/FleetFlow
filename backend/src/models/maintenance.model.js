const mongoose = require("mongoose");
const {
    MAINTENANCE_STATUS_ARRAY,
    SERVICE_TYPES_ARRAY,
} = require("../utils/constants");

const maintenanceSchema = new mongoose.Schema(
    {
        vehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            required: [true, "Vehicle is required"],
        },
        serviceType: {
            type: String,
            enum: {
                values: SERVICE_TYPES_ARRAY,
                message: "{VALUE} is not a valid service type",
            },
            required: [true, "Service type is required"],
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
        },
        cost: {
            type: Number,
            required: [true, "Cost is required"],
            min: [0, "Cost cannot be negative"],
        },
        serviceDate: {
            type: Date,
            default: Date.now,
        },
        completionDate: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: {
                values: MAINTENANCE_STATUS_ARRAY,
                message: "{VALUE} is not a valid maintenance status",
            },
            default: "scheduled",
        },
        mechanic: {
            type: String,
            trim: true,
        },
        notes: {
            type: String,
            trim: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for common queries
maintenanceSchema.index({ vehicle: 1, status: 1 });
maintenanceSchema.index({ serviceDate: -1 });

const Maintenance = mongoose.model("Maintenance", maintenanceSchema);

module.exports = Maintenance;
