const mongoose = require("mongoose");
const { DRIVER_STATUS_ARRAY } = require("../utils/constants");

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

    phone: {
      type: String,
      trim: true,
    },

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
      enum: {
        values: DRIVER_STATUS_ARRAY,
        message: "{VALUE} is not a valid driver status",
      },
      default: "on_duty",
      index: true,
    },

    assignedVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },

    totalTrips: {
      type: Number,
      default: 0,
    },

    completedTrips: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent manual setting of on_trip without assignment
driverSchema.pre("save", function (next) {
  if (this.status === "on_trip" && !this.assignedVehicle) {
    return next(
      new Error("Driver cannot be 'on_trip' without assigned vehicle")
    );
  }
  next();
});

// Virtual: License Validity
driverSchema.virtual("isLicenseValid").get(function () {
  return this.licenseExpiry > new Date();
});

// Virtual: Completion Rate
driverSchema.virtual("completionRate").get(function () {
  if (this.totalTrips === 0) return 0;
  return ((this.completedTrips / this.totalTrips) * 100).toFixed(2);
});

driverSchema.set("toJSON", { virtuals: true });
driverSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Driver", driverSchema);