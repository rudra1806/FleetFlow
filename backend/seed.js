require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
const User = require("./src/models/user.model");
const Vehicle = require("./src/models/vehicle.model");
const Driver = require("./src/models/driver.model");
const Expense = require("./src/models/expense.model");
const Trip = require("./src/models/trip.model");
const Maintenance = require("./src/models/maintenance.model");

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

        // 4. Create expenses
        const existingExpenses = await Expense.countDocuments();
        if (existingExpenses > 0) {
            console.log(`⏩ ${existingExpenses} expenses already exist, skipping...`);
        } else {
            const expensesData = [
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
                {
                    vehicle: vehicles[0]._id,
                    type: "insurance",
                    amount: 28000,
                    date: new Date("2026-01-05"),
                    notes: "Annual comprehensive insurance renewal",
                    createdBy: manager._id,
                },
                {
                    vehicle: vehicles[1]._id,
                    type: "maintenance",
                    amount: 4500,
                    date: new Date("2026-02-01"),
                    notes: "Brake pad replacement",
                    createdBy: manager._id,
                },
                {
                    vehicle: vehicles[0]._id,
                    type: "other",
                    amount: 1200,
                    date: new Date("2026-02-12"),
                    notes: "Toll charges — Ahmedabad to Mumbai expressway",
                    createdBy: manager._id,
                },
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

        // 5. Create trips (3 completed + 1 draft)
        const existingTrips = await Trip.countDocuments();
        if (existingTrips > 0) {
            console.log(`⏩ ${existingTrips} trips already exist, skipping...`);
        } else {
            const tripsData = [
                {
                    vehicle: vehicles[0]._id,
                    driver: drivers[0]._id,
                    cargoWeight: 3500,
                    origin: "Ahmedabad",
                    destination: "Mumbai",
                    distance: 530,
                    status: "completed",
                    startOdometer: 40000,
                    endOdometer: 40530,
                    startDate: new Date("2026-01-15T06:00:00"),
                    endDate: new Date("2026-01-15T16:00:00"),
                    notes: "Regular goods delivery to Mumbai warehouse",
                    createdBy: manager._id,
                },
                {
                    vehicle: vehicles[1]._id,
                    driver: drivers[1]._id,
                    cargoWeight: 1200,
                    origin: "Jaipur",
                    destination: "Udaipur",
                    distance: 395,
                    status: "completed",
                    startOdometer: 25000,
                    endOdometer: 25395,
                    startDate: new Date("2026-02-01T07:00:00"),
                    endDate: new Date("2026-02-01T15:30:00"),
                    notes: "Urgent medical supplies delivery",
                    createdBy: manager._id,
                },
                {
                    vehicle: vehicles[0]._id,
                    driver: drivers[0]._id,
                    cargoWeight: 4200,
                    origin: "Mumbai",
                    destination: "Pune",
                    distance: 150,
                    status: "completed",
                    startOdometer: 42000,
                    endOdometer: 42150,
                    startDate: new Date("2026-02-10T08:00:00"),
                    endDate: new Date("2026-02-10T12:00:00"),
                    notes: "Return load from Mumbai to Pune depot",
                    createdBy: manager._id,
                },
                {
                    vehicle: vehicles[2]._id,
                    driver: drivers[2]._id,
                    cargoWeight: 80,
                    origin: "Ahmedabad",
                    destination: "Gandhinagar",
                    distance: 30,
                    status: "draft",
                    notes: "Local document delivery — awaiting dispatch",
                    createdBy: manager._id,
                },
            ];

            await Trip.insertMany(tripsData);
            console.log(`✅ ${tripsData.length} trips created`);
        }

        // 6. Create maintenance records (1 completed, 1 in_progress, 1 scheduled)
        const existingMaintenance = await Maintenance.countDocuments();
        if (existingMaintenance > 0) {
            console.log(`⏩ ${existingMaintenance} maintenance records already exist, skipping...`);
        } else {
            const maintenanceData = [
                {
                    vehicle: vehicles[0]._id,
                    serviceType: "oil_change",
                    description: "Full synthetic oil change + oil filter replacement at 45,000 km",
                    cost: 3500,
                    serviceDate: new Date("2026-01-20"),
                    completionDate: new Date("2026-01-20"),
                    status: "completed",
                    mechanic: "Prakash Auto Garage",
                    notes: "Next oil change due at 55,000 km",
                    createdBy: manager._id,
                },
                {
                    vehicle: vehicles[1]._id,
                    serviceType: "brake_service",
                    description: "Front brake pad replacement and disc inspection",
                    cost: 4500,
                    serviceDate: new Date("2026-02-15"),
                    status: "in_progress",
                    mechanic: "Sharma Motors",
                    notes: "Rear discs show 40% wear — schedule replacement next month",
                    createdBy: manager._id,
                },
                {
                    vehicle: vehicles[2]._id,
                    serviceType: "general",
                    description: "Annual fitness inspection and chain lubrication",
                    cost: 1200,
                    serviceDate: new Date("2026-03-01"),
                    status: "scheduled",
                    mechanic: "Two-Wheeler Service Centre",
                    createdBy: manager._id,
                },
            ];

            await Maintenance.insertMany(maintenanceData);
            console.log(`✅ ${maintenanceData.length} maintenance records created`);
        }

        console.log("\n🎉 Seed complete!");
        console.log("\n📋 Summary:");
        console.log(`   Users:       ${await User.countDocuments()}`);
        console.log(`   Vehicles:    ${await Vehicle.countDocuments()}`);
        console.log(`   Drivers:     ${await Driver.countDocuments()}`);
        console.log(`   Expenses:    ${await Expense.countDocuments()}`);
        console.log(`   Trips:       ${await Trip.countDocuments()}`);
        console.log(`   Maintenance: ${await Maintenance.countDocuments()}`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Seed error:", error);
        process.exit(1);
    }
}

seed();
