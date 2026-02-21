// ==========================================
// FleetFlow - Database Seed Script
// ==========================================
// Populates the database with realistic test data for demo & development.
//
// Usage:
//   npm run seed          — Seed data (keeps existing)
//   npm run seed:fresh    — Clear ALL data first, then seed
//
// What gets created:
//   - 4 Users (1 per role: manager, dispatcher, safety_officer, financial_analyst)
//   - 12 Vehicles (mix of types, statuses, regions, fuel types)
//   - 8 Maintenance records (various service types & statuses)
//
// Notes:
//   - Vehicles match the spec example: "Van-05 (500kg capacity) → Available"
//   - Maintenance includes an active record to demonstrate auto "In Shop" logic
//   - All passwords are hashed using bcryptjs (default: "password123")
// ==========================================

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

const User = require("../models/user.model");
const Vehicle = require("../models/vehicle.model");
const Maintenance = require("../models/maintenance.model");

// ── Config ──────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/fleetflow";
const FRESH_SEED = process.argv.includes("--fresh");
const DEFAULT_PASSWORD = "password123";

// ── Seed Data ───────────────────────────────────────────────

const usersData = [
    {
        name: "Rudra Sanandiya",
        email: "rudra@fleetflow.com",
        password: DEFAULT_PASSWORD,
        role: "manager",
    },
    {
        name: "Het Patel",
        email: "het@fleetflow.com",
        password: DEFAULT_PASSWORD,
        role: "dispatcher",
    },
    {
        name: "Arjun Mehta",
        email: "arjun@fleetflow.com",
        password: DEFAULT_PASSWORD,
        role: "safety_officer",
    },
    {
        name: "Priya Shah",
        email: "priya@fleetflow.com",
        password: DEFAULT_PASSWORD,
        role: "financial_analyst",
    },
];

// 12 vehicles — mix of types, statuses, regions (matches spec: Truck, Van, Bike)
const vehiclesData = [
    // ── Trucks ──
    {
        name: "Truck-01",
        model: "Tata LPT 1613",
        licensePlate: "GJ01AB1234",
        type: "truck",
        maxCapacity: 8000,
        currentOdometer: 45200,
        status: "available",
        fuelType: "diesel",
        acquisitionCost: 1500000,
        acquisitionDate: new Date("2023-03-15"),
        year: 2023,
        color: "White",
        region: "West Gujarat",
        notes: "Long-haul delivery truck",
    },
    {
        name: "Truck-02",
        model: "Ashok Leyland 1616",
        licensePlate: "GJ05CD5678",
        type: "truck",
        maxCapacity: 10000,
        currentOdometer: 78400,
        status: "on_trip",
        fuelType: "diesel",
        acquisitionCost: 1800000,
        acquisitionDate: new Date("2022-08-20"),
        year: 2022,
        color: "Blue",
        region: "North Gujarat",
        notes: "Heavy-duty freight carrier",
    },
    {
        name: "Truck-03",
        model: "BharatBenz 1217",
        licensePlate: "MH04EF9012",
        type: "truck",
        maxCapacity: 7500,
        currentOdometer: 32100,
        status: "available",
        fuelType: "diesel",
        acquisitionCost: 1650000,
        acquisitionDate: new Date("2024-01-10"),
        year: 2024,
        color: "Red",
        region: "Mumbai Hub",
        notes: "Medium-duty regional delivery",
    },
    {
        name: "Truck-04",
        model: "Eicher Pro 3019",
        licensePlate: "RJ14GH3456",
        type: "truck",
        maxCapacity: 12000,
        currentOdometer: 91000,
        status: "retired",
        fuelType: "diesel",
        acquisitionCost: 2100000,
        acquisitionDate: new Date("2019-05-25"),
        year: 2019,
        color: "Green",
        region: "Rajasthan",
        notes: "Decommissioned — engine issues",
    },
    // ── Vans ──
    {
        name: "Van-05",
        model: "Tata Ace Gold",
        licensePlate: "GJ01JK7890",
        type: "van",
        maxCapacity: 500,
        currentOdometer: 15800,
        status: "available",
        fuelType: "petrol",
        acquisitionCost: 450000,
        acquisitionDate: new Date("2024-06-01"),
        year: 2024,
        color: "White",
        region: "West Gujarat",
        notes: "Spec example: Van-05 with 500kg capacity",
    },
    {
        name: "Van-06",
        model: "Mahindra Supro",
        licensePlate: "GJ03LM2345",
        type: "van",
        maxCapacity: 750,
        currentOdometer: 22400,
        status: "in_shop",
        fuelType: "diesel",
        acquisitionCost: 550000,
        acquisitionDate: new Date("2023-11-15"),
        year: 2023,
        color: "Silver",
        region: "South Gujarat",
        notes: "Currently in maintenance — brake service",
    },
    {
        name: "Van-07",
        model: "Maruti Eeco Cargo",
        licensePlate: "MH02NP6789",
        type: "van",
        maxCapacity: 400,
        currentOdometer: 8900,
        status: "available",
        fuelType: "cng",
        acquisitionCost: 380000,
        acquisitionDate: new Date("2025-01-20"),
        year: 2025,
        color: "Blue",
        region: "Mumbai Hub",
        notes: "CNG — low operational cost city deliveries",
    },
    {
        name: "Van-08",
        model: "Tata Winger",
        licensePlate: "GJ06QR0123",
        type: "van",
        maxCapacity: 1000,
        currentOdometer: 34500,
        status: "on_trip",
        fuelType: "diesel",
        acquisitionCost: 720000,
        acquisitionDate: new Date("2023-04-12"),
        year: 2023,
        color: "White",
        region: "North Gujarat",
        notes: "Large van for bulk city deliveries",
    },
    // ── Bikes ──
    {
        name: "Bike-09",
        model: "Bajaj Maxima C",
        licensePlate: "GJ01ST4567",
        type: "bike",
        maxCapacity: 50,
        currentOdometer: 5200,
        status: "available",
        fuelType: "petrol",
        acquisitionCost: 85000,
        acquisitionDate: new Date("2025-02-01"),
        year: 2025,
        color: "Red",
        region: "West Gujarat",
        notes: "Last-mile delivery — documents & small parcels",
    },
    {
        name: "Bike-10",
        model: "TVS XL 100",
        licensePlate: "GJ03UV8901",
        type: "bike",
        maxCapacity: 30,
        currentOdometer: 12300,
        status: "available",
        fuelType: "petrol",
        acquisitionCost: 55000,
        acquisitionDate: new Date("2024-09-10"),
        year: 2024,
        color: "Black",
        region: "South Gujarat",
        notes: "Lightweight courier bike",
    },
    {
        name: "Bike-11",
        model: "Hero Electric Nyx",
        licensePlate: "GJ05WX2345",
        type: "bike",
        maxCapacity: 25,
        currentOdometer: 3100,
        status: "available",
        fuelType: "electric",
        acquisitionCost: 95000,
        acquisitionDate: new Date("2025-06-15"),
        year: 2025,
        color: "White",
        region: "Mumbai Hub",
        notes: "Electric — zero emission city deliveries",
    },
    {
        name: "Bike-12",
        model: "Ather Rizta",
        licensePlate: "MH04YZ6789",
        type: "bike",
        maxCapacity: 20,
        currentOdometer: 1500,
        status: "on_trip",
        fuelType: "electric",
        acquisitionCost: 120000,
        acquisitionDate: new Date("2025-08-01"),
        year: 2025,
        color: "Grey",
        region: "Mumbai Hub",
        notes: "Premium electric — fast urban deliveries",
    },
];

// 8 maintenance records — covers various service types and statuses
const maintenanceData = [
    {
        vehicleIndex: 5, // Van-06 (in_shop)
        serviceType: "brake_service",
        description: "Complete brake pad replacement — front and rear",
        cost: 8500,
        serviceDate: new Date("2026-02-18"),
        status: "in_progress",
        mechanic: "Ravi Kumar",
        notes: "Vehicle pulled from service pool",
    },
    {
        vehicleIndex: 0, // Truck-01
        serviceType: "oil_change",
        description: "Routine oil change — 45,000 km service interval",
        cost: 3200,
        serviceDate: new Date("2026-02-10"),
        completionDate: new Date("2026-02-10"),
        status: "completed",
        mechanic: "Suresh Patel",
        notes: "Used synthetic oil — Castrol EDGE 5W-30",
    },
    {
        vehicleIndex: 1, // Truck-02
        serviceType: "tire_rotation",
        description: "Full tire rotation and balancing — all 6 wheels",
        cost: 4500,
        serviceDate: new Date("2026-01-25"),
        completionDate: new Date("2026-01-26"),
        status: "completed",
        mechanic: "Amit Shah",
        notes: "Rear tires at 40% tread — schedule replacement next month",
    },
    {
        vehicleIndex: 2, // Truck-03
        serviceType: "engine_repair",
        description: "Turbocharger rebuild and coolant system flush",
        cost: 28000,
        serviceDate: new Date("2026-02-05"),
        completionDate: new Date("2026-02-12"),
        status: "completed",
        mechanic: "Vikram Joshi",
        notes: "Major repair — warranty claim filed",
    },
    {
        vehicleIndex: 3, // Truck-04 (retired)
        serviceType: "inspection",
        description: "Final decommission inspection before retirement",
        cost: 1500,
        serviceDate: new Date("2025-12-15"),
        completionDate: new Date("2025-12-15"),
        status: "completed",
        mechanic: "Ravi Kumar",
        notes: "Engine beyond economical repair — recommended retirement",
    },
    {
        vehicleIndex: 4, // Van-05
        serviceType: "general",
        description: "15,000 km general service — filters, fluids, belt inspection",
        cost: 2800,
        serviceDate: new Date("2026-02-01"),
        completionDate: new Date("2026-02-02"),
        status: "completed",
        mechanic: "Suresh Patel",
        notes: "All clear — next service at 30,000 km",
    },
    {
        vehicleIndex: 6, // Van-07
        serviceType: "electrical",
        description: "CNG sensor replacement and wiring harness check",
        cost: 5200,
        serviceDate: new Date("2026-02-20"),
        status: "scheduled",
        mechanic: "Dinesh Rao",
        notes: "Scheduled for next week",
    },
    {
        vehicleIndex: 8, // Bike-09
        serviceType: "oil_change",
        description: "5,000 km engine oil change",
        cost: 600,
        serviceDate: new Date("2026-02-15"),
        completionDate: new Date("2026-02-15"),
        status: "completed",
        mechanic: "Amit Shah",
        notes: "Quick service — 30 minutes",
    },
];

// ── Seed Functions ──────────────────────────────────────────

async function seedUsers() {
    const existingCount = await User.countDocuments();
    if (existingCount > 0 && !FRESH_SEED) {
        console.log(`  ⏭  Users: ${existingCount} already exist (skipping)`);
        // Return existing manager for vehicle createdBy
        const manager = await User.findOne({ role: "manager" });
        return manager;
    }

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const users = usersData.map((u) => ({
        ...u,
        password: hashedPassword,
    }));

    const created = await User.insertMany(users);
    console.log(`  ✅ Users: ${created.length} created`);
    created.forEach((u) => console.log(`     → ${u.name} (${u.role}) — ${u.email}`));

    return created.find((u) => u.role === "manager");
}

async function seedVehicles(managerId) {
    const existingCount = await Vehicle.countDocuments();
    if (existingCount > 0 && !FRESH_SEED) {
        console.log(`  ⏭  Vehicles: ${existingCount} already exist (skipping)`);
        return await Vehicle.find().lean();
    }

    const vehicles = vehiclesData.map((v) => ({
        ...v,
        createdBy: managerId,
    }));

    const created = await Vehicle.insertMany(vehicles);
    console.log(`  ✅ Vehicles: ${created.length} created`);

    // Summary by type
    const types = {};
    created.forEach((v) => {
        types[v.type] = (types[v.type] || 0) + 1;
    });
    Object.entries(types).forEach(([t, count]) =>
        console.log(`     → ${t}: ${count}`)
    );

    // Summary by status
    const statuses = {};
    created.forEach((v) => {
        statuses[v.status] = (statuses[v.status] || 0) + 1;
    });
    Object.entries(statuses).forEach(([s, count]) =>
        console.log(`     → ${s}: ${count}`)
    );

    return created;
}

async function seedMaintenance(managerId, vehicles) {
    const existingCount = await Maintenance.countDocuments();
    if (existingCount > 0 && !FRESH_SEED) {
        console.log(`  ⏭  Maintenance: ${existingCount} records already exist (skipping)`);
        return;
    }

    const records = maintenanceData.map((m) => ({
        vehicle: vehicles[m.vehicleIndex]._id,
        serviceType: m.serviceType,
        description: m.description,
        cost: m.cost,
        serviceDate: m.serviceDate,
        completionDate: m.completionDate || null,
        status: m.status,
        mechanic: m.mechanic,
        notes: m.notes,
        createdBy: managerId,
    }));

    const created = await Maintenance.insertMany(records);
    console.log(`  ✅ Maintenance: ${created.length} records created`);

    // Summary by status
    const statuses = {};
    created.forEach((m) => {
        statuses[m.status] = (statuses[m.status] || 0) + 1;
    });
    Object.entries(statuses).forEach(([s, count]) =>
        console.log(`     → ${s}: ${count}`)
    );
}

// ── Main ────────────────────────────────────────────────────

async function main() {
    console.log("\n🚛 FleetFlow — Database Seeder");
    console.log("═".repeat(50));

    if (FRESH_SEED) {
        console.log("⚠️  FRESH SEED MODE — clearing all existing data...\n");
    }

    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log(`📦 Connected to: ${MONGODB_URI}\n`);

        // Clear data if --fresh flag
        if (FRESH_SEED) {
            await Promise.all([
                User.deleteMany({}),
                Vehicle.deleteMany({}),
                Maintenance.deleteMany({}),
            ]);
            console.log("  🗑  Cleared: users, vehicles, maintenance\n");
        }

        // Seed in order (users → vehicles → maintenance)
        console.log("Seeding data...\n");
        const manager = await seedUsers();

        if (!manager) {
            throw new Error("No manager user found. Cannot seed vehicles without createdBy.");
        }

        const vehicles = await seedVehicles(manager._id);
        await seedMaintenance(manager._id, vehicles);

        // Print summary
        console.log("\n" + "═".repeat(50));
        console.log("✅ Seed complete!\n");
        console.log("📊 Database Summary:");
        console.log(`   Users:        ${await User.countDocuments()}`);
        console.log(`   Vehicles:     ${await Vehicle.countDocuments()}`);
        console.log(`   Maintenance:  ${await Maintenance.countDocuments()}`);
        console.log(`\n🔑 Login Credentials (all accounts):`);
        console.log(`   Password: ${DEFAULT_PASSWORD}`);
        console.log(`   Manager:  rudra@fleetflow.com`);
        console.log(`   Dispatch: het@fleetflow.com`);
        console.log(`   Safety:   arjun@fleetflow.com`);
        console.log(`   Finance:  priya@fleetflow.com`);
        console.log();
    } catch (error) {
        console.error("\n❌ Seed failed:", error.message);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        console.log("📦 Database connection closed.\n");
        process.exit(0);
    }
}

main();
