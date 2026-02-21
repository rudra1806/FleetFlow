const mongoose = require("mongoose");
const {
    VEHICLE_TYPES_ARRAY,
    VEHICLE_STATUS_ARRAY,
    FUEL_TYPES_ARRAY,
} = require("../utils/constants");

const vehicleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Vehicle name is required"],
            trim: true,
        },
        model: {
            type: String,
            required: [true, "Vehicle model is required"],
            trim: true,
        },
        licensePlate: {
            type: String,
            required: [true, "License plate is required"],
            unique: true,
            trim: true,
            uppercase: true,
        },
        type: {
            type: String,
            enum: {
                values: VEHICLE_TYPES_ARRAY,
                message: "{VALUE} is not a valid vehicle type",
            },
            required: [true, "Vehicle type is required"],
        },
        maxCapacity: {
            type: Number,
            required: [true, "Max load capacity is required"],
            min: [1, "Max capacity must be at least 1 kg"],
        },
        currentOdometer: {
            type: Number,
            default: 0,
            min: [0, "Odometer cannot be negative"],
        },
        status: {
            type: String,
            enum: {
                values: VEHICLE_STATUS_ARRAY,
                message: "{VALUE} is not a valid vehicle status",
            },
            default: "available",
        },
        fuelType: {
            type: String,
            enum: {
                values: FUEL_TYPES_ARRAY,
                message: "{VALUE} is not a valid fuel type",
            },
            required: [true, "Fuel type is required"],
        },
        acquisitionCost: {
            type: Number,
            default: 0,
            min: [0, "Acquisition cost cannot be negative"],
        },
        acquisitionDate: {
            type: Date,
            default: Date.now,
        },
        year: {
            type: Number,
            min: [1900, "Year must be after 1900"],
            max: [new Date().getFullYear() + 1, "Year cannot be in the future"],
        },
        color: {
            type: String,
            trim: true,
        },
        region: {
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

// Compound index for fast dashboard & filter queries
vehicleSchema.index({ status: 1, type: 1 });
vehicleSchema.index({ licensePlate: 1 });
vehicleSchema.index({ region: 1 });

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

module.exports = Vehicle;
