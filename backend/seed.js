require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
const User = require("./src/models/user.model");
const Vehicle = require("./src/models/vehicle.model");
const Driver = require("./src/models/driver.model");
const Expense = require("./src/models/expense.model");

async function seed() {
    try {
        await connectDB();
        console.log("🌱 Starting seed...\n");

        // 1. Create a manager user (or find existing)
        let manager = await User.findOne({ email: "manager@fleetflow.com" });
        if (!manager) {
            manager = await User.create({
                name: "Fleet Manager",
                email: "manager@fleetflow.com",
                password: "123456",
                role: "manager",
                phone: "9876543210",
            });
            console.log("✅ Manager user created:", manager.email);
        } else {
            console.log("⏩ Manager already exists:", manager.email);
        }

        // 2. Create vehicles
        const vehiclesData = [
            {
                name: "Truck Alpha",
                model: "Tata LPT 3521",
                licensePlate: "GJ01AB1234",
                type: "truck",
                maxCapacity: 5000,
                currentOdometer: 45000,
                fuelType: "diesel",
                acquisitionCost: 1500000,
                year: 2022,
                color: "White",
                region: "Gujarat",
                createdBy: manager._id,
            },
            {
                name: "Van Beta",
                model: "Mahindra Supro",
                licensePlate: "GJ05CD5678",
                type: "van",
                maxCapacity: 1500,
                currentOdometer: 28000,
                fuelType: "diesel",
                acquisitionCost: 800000,
                year: 2023,
                color: "Blue",
                region: "Rajasthan",
                createdBy: manager._id,
            },
            {
                name: "Bike Gamma",
                model: "TVS XL100",
                licensePlate: "GJ03EF9012",
                type: "bike",
                maxCapacity: 150,
                currentOdometer: 12000,
                fuelType: "petrol",
                acquisitionCost: 55000,
                year: 2024,
                color: "Red",
                region: "Gujarat",
                createdBy: manager._id,
            },
        ];

        const vehicles = [];
        for (const vData of vehiclesData) {
            let vehicle = await Vehicle.findOne({ licensePlate: vData.licensePlate });
            if (!vehicle) {
                vehicle = await Vehicle.create(vData);
                console.log("✅ Vehicle created:", vehicle.name, `(${vehicle.licensePlate})`);
            } else {
                console.log("⏩ Vehicle already exists:", vehicle.name);
            }
            vehicles.push(vehicle);
        }

        // 3. Create drivers
        const driversData = [
            {
                name: "Rajesh Kumar",
                email: "rajesh@fleetflow.com",
                phone: "9876543211",
                licenseNumber: "DL-1420230012345",
                licenseExpiry: new Date("2030-12-31"),
                createdBy: manager._id,
                status: "on_duty",
            },
            {
                name: "Amit Singh",
                email: "amit@fleetflow.com",
                phone: "9876543212",
                licenseNumber: "DL-1420230012346",
                licenseExpiry: new Date("2028-06-15"),
                createdBy: manager._id,
                status: "on_duty",
            },
            {
                name: "Suresh Pal",
                email: "suresh@fleetflow.com",
                phone: "9876543213",
                licenseNumber: "DL-1420230012347",
                licenseExpiry: new Date("2025-01-20"),
                createdBy: manager._id,
                status: "on_duty",
            },
        ];

        const drivers = [];
        for (const dData of driversData) {
            let driver = await Driver.findOne({ licenseNumber: dData.licenseNumber });
            if (!driver) {
                driver = await Driver.create(dData);
                console.log("✅ Driver created:", driver.name, `(${driver.licenseNumber})`);
            } else {
                console.log("⏩ Driver already exists:", driver.name);
            }
            drivers.push(driver);
        }

        // 4. Create expenses (3-4 general + 2 fuel logs)
        const existingExpenses = await Expense.countDocuments();
        if (existingExpenses > 0) {
            console.log(`⏩ ${existingExpenses} expenses already exist, skipping...`);
        } else {
            const expensesData = [
                // Fuel logs
                {
                    vehicle: vehicles[0]._id,
                    type: "fuel",
                    amount: 5500,
                    liters: 60,
                    date: new Date("2026-02-10"),
                    notes: "Diesel refill at HP pump, Ahmedabad highway",
                    createdBy: manager._id,
                },
                {
                    vehicle: vehicles[1]._id,
                    type: "fuel",
                    amount: 3200,
                    liters: 35,
                    date: new Date("2026-02-15"),
                    notes: "Diesel refill at Indian Oil, Jaipur",
                    createdBy: manager._id,
                },
                // Insurance
                {
                    vehicle: vehicles[0]._id,
                    type: "insurance",
                    amount: 28000,
                    date: new Date("2026-01-05"),
                    notes: "Annual comprehensive insurance renewal",
                    createdBy: manager._id,
                },
                // Maintenance expense
                {
                    vehicle: vehicles[1]._id,
                    type: "maintenance",
                    amount: 4500,
                    date: new Date("2026-02-01"),
                    notes: "Brake pad replacement",
                    createdBy: manager._id,
                },
                // Other (toll)
                {
                    vehicle: vehicles[0]._id,
                    type: "other",
                    amount: 1200,
                    date: new Date("2026-02-12"),
                    notes: "Toll charges — Ahmedabad to Mumbai expressway",
                    createdBy: manager._id,
                },
                // Another fuel log
                {
                    vehicle: vehicles[2]._id,
                    type: "fuel",
                    amount: 450,
                    liters: 4.5,
                    date: new Date("2026-02-18"),
                    notes: "Petrol refill, local delivery run",
                    createdBy: manager._id,
                },
            ];

            await Expense.insertMany(expensesData);
            console.log(`✅ ${expensesData.length} expenses created`);
        }

        console.log("\n🎉 Seed complete!");
        console.log("\n📋 Summary:");
        console.log(`   Users:    ${await User.countDocuments()}`);
        console.log(`   Vehicles: ${await Vehicle.countDocuments()}`);
        console.log(`   Drivers:  ${await Driver.countDocuments()}`);
        console.log(`   Expenses: ${await Expense.countDocuments()}`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Seed error:", error);
        process.exit(1);
    }
}

seed();
