const mongoose = require("mongoose");
const { EXPENSE_TYPES_ARRAY } = require("../utils/constants");

const expenseSchema = new mongoose.Schema(
    {
        vehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            required: [true, "Vehicle is required"],
        },
        trip: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Trip",
            default: null,
        },
        type: {
            type: String,
            enum: {
                values: EXPENSE_TYPES_ARRAY,
                message: "{VALUE} is not a valid expense type",
            },
            required: [true, "Expense type is required"],
        },
        amount: {
            type: Number,
            required: [true, "Amount is required"],
            min: [0, "Amount cannot be negative"],
        },
        liters: {
            type: Number,
            min: [0, "Liters cannot be negative"],
            default: null,
        },
        date: {
            type: Date,
            default: Date.now,
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
expenseSchema.index({ vehicle: 1, type: 1 });
expenseSchema.index({ trip: 1 });
expenseSchema.index({ date: -1 });

const Expense = mongoose.model("Expense", expenseSchema);

module.exports = Expense;
