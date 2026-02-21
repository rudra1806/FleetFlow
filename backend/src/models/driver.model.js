const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    phone: String,

    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    licenseExpiry: {
      type: Date,
      required: true,
      index: true,
    },

    safetyScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },

    status: {
      type: String,
      enum: ["available", "on_trip", "off_duty", "suspended"],
      default: "available",
      index: true,
    },

    totalTrips: {
      type: Number,
      default: 0,
    },

    completedTrips: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// 🔹 Virtual: License Validity
driverSchema.virtual("isLicenseValid").get(function () {
  return this.licenseExpiry > new Date();
});

// 🔹 Virtual: Completion Rate
driverSchema.virtual("completionRate").get(function () {
  if (this.totalTrips === 0) return 0;
  return ((this.completedTrips / this.totalTrips) * 100).toFixed(2);
});

driverSchema.set("toJSON", { virtuals: true });
driverSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Driver", driverSchema);