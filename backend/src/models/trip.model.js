const mongoose = require("mongoose");
const { TRIP_STATUS_ARRAY } = require("../utils/constants");

const tripSchema = new mongoose.Schema(
    {
        vehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            required: [true, "Vehicle is required"],
        },
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: [true, "Driver is required"],
        },
        cargoWeight: {
            type: Number,
            required: [true, "Cargo weight is required"],
            min: [0, "Cargo weight cannot be negative"],
        },
        origin: {
            type: String,
            required: [true, "Origin is required"],
            trim: true,
        },
        destination: {
            type: String,
            required: [true, "Destination is required"],
            trim: true,
        },
        distance: {
            type: Number,
            default: 0,
            min: [0, "Distance cannot be negative"],
        },
        status: {
            type: String,
            enum: {
                values: TRIP_STATUS_ARRAY,
                message: "{VALUE} is not a valid trip status",
            },
            default: "draft",
        },
        startOdometer: {
            type: Number,
            min: [0, "Start odometer cannot be negative"],
        },
        endOdometer: {
            type: Number,
            min: [0, "End odometer cannot be negative"],
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
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

// Indexes
tripSchema.index({ vehicle: 1, status: 1 });
tripSchema.index({ driver: 1, status: 1 });
tripSchema.index({ startDate: -1 });

const Trip = mongoose.model("Trip", tripSchema);

module.exports = Trip;
