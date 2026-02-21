const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },

    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    origin: {
      type: String,
      required: true,
    },

    destination: {
      type: String,
      required: true,
    },

    cargoWeight: {
      type: Number,
      required: true,
      min: 0,
    },

    startOdometer: Number,
    endOdometer: Number,
    distance: Number,

    status: {
      type: String,
      enum: ["ongoing", "completed"],
      default: "ongoing",
      index: true,
    },

    startTime: {
      type: Date,
      default: Date.now,
    },

    endTime: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trip", tripSchema);