// ==========================================
// FleetFlow - Constants & Enums
// Single source of truth for all enums
// ==========================================

const USER_ROLES = {
    MANAGER: "manager",
    DISPATCHER: "dispatcher",
    SAFETY_OFFICER: "safety_officer",
    FINANCIAL_ANALYST: "financial_analyst",
};

const USER_ROLES_ARRAY = Object.values(USER_ROLES);

const VEHICLE_TYPES = {
    TRUCK: "truck",
    VAN: "van",
    BIKE: "bike",
};

const VEHICLE_TYPES_ARRAY = Object.values(VEHICLE_TYPES);

const VEHICLE_STATUS = {
    AVAILABLE: "available",
    ON_TRIP: "on_trip",
    IN_SHOP: "in_shop",
    RETIRED: "retired",
};

const VEHICLE_STATUS_ARRAY = Object.values(VEHICLE_STATUS);

const DRIVER_STATUS = {
    ON_DUTY: "on_duty",
    OFF_DUTY: "off_duty",
    SUSPENDED: "suspended",
};

const DRIVER_STATUS_ARRAY = Object.values(DRIVER_STATUS);

const TRIP_STATUS = {
    DRAFT: "draft",
    DISPATCHED: "dispatched",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
};

const TRIP_STATUS_ARRAY = Object.values(TRIP_STATUS);

const MAINTENANCE_STATUS = {
    SCHEDULED: "scheduled",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed",
};

const MAINTENANCE_STATUS_ARRAY = Object.values(MAINTENANCE_STATUS);

const SERVICE_TYPES = {
    OIL_CHANGE: "oil_change",
    TIRE: "tire",
    BRAKE: "brake",
    ENGINE: "engine",
    GENERAL: "general",
};

const SERVICE_TYPES_ARRAY = Object.values(SERVICE_TYPES);

const EXPENSE_TYPES = {
    FUEL: "fuel",
    MAINTENANCE: "maintenance",
    INSURANCE: "insurance",
    OTHER: "other",
};

const EXPENSE_TYPES_ARRAY = Object.values(EXPENSE_TYPES);

const FUEL_TYPES = {
    PETROL: "petrol",
    DIESEL: "diesel",
    ELECTRIC: "electric",
    CNG: "cng",
};

const FUEL_TYPES_ARRAY = Object.values(FUEL_TYPES);

module.exports = {
    USER_ROLES,
    USER_ROLES_ARRAY,
    VEHICLE_TYPES,
    VEHICLE_TYPES_ARRAY,
    VEHICLE_STATUS,
    VEHICLE_STATUS_ARRAY,
    DRIVER_STATUS,
    DRIVER_STATUS_ARRAY,
    TRIP_STATUS,
    TRIP_STATUS_ARRAY,
    MAINTENANCE_STATUS,
    MAINTENANCE_STATUS_ARRAY,
    SERVICE_TYPES,
    SERVICE_TYPES_ARRAY,
    EXPENSE_TYPES,
    EXPENSE_TYPES_ARRAY,
    FUEL_TYPES,
    FUEL_TYPES_ARRAY,
};
