<p align="center">
  <h1 align="center">🚛 FleetFlow</h1>
  <p align="center">
    <strong>Modular Fleet & Logistics Management System</strong>
  </p>
  <p align="center">
    A centralized, rule-based digital hub that optimizes the lifecycle of a delivery fleet,<br/>monitors driver safety, and tracks financial performance.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19"/>
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 7"/>
  <img src="https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express 4"/>
  <img src="https://img.shields.io/badge/MongoDB-8-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT"/>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Role-Based Access Control](#-role-based-access-control)
- [Business Logic & Workflows](#-business-logic--workflows)
- [Database Schema](#-database-schema)
- [Screenshots](#-screenshots)
- [Team](#-team)
- [License](#-license)

---

## 🎯 Overview

FleetFlow replaces inefficient, manual logbooks with a **smart digital management system** for delivery fleets. It provides:

- **Real-time fleet oversight** with KPI dashboards and status tracking
- **Automated state management** — vehicles and drivers change status automatically as trips are dispatched and maintenance is scheduled
- **Rule-based validation** — cargo weight checks, license expiry compliance, and status guardrails prevent human error
- **Financial analytics** — fuel efficiency (km/L), vehicle ROI, and cost-per-km calculations with CSV/PDF export

### Target Users

| Role | Responsibilities |
|------|-----------------|
| **Fleet Manager** | Full system access — vehicles, maintenance, analytics, user management |
| **Dispatcher** | Create trips, assign drivers, validate cargo loads |
| **Safety Officer** | Monitor driver compliance, license expirations, maintenance logs |
| **Financial Analyst** | Audit fuel spend, maintenance ROI, operational costs |

---

## ✨ Key Features

### 🔐 Authentication & Security
- JWT-based authentication with HTTP-only cookies + localStorage fallback
- Password hashing with bcrypt (10 salt rounds)
- Role-Based Access Control (RBAC) enforced at both API and UI layers
- Account deactivation support

### 🚛 Vehicle Registry
- Full CRUD with pagination, multi-field search, and filtering
- Status lifecycle: `Available → On Trip → In Shop → Retired`
- Automated status transitions (manual only for `Available ↔ Retired`)
- Duplicate license plate detection (409 Conflict)
- Safe deletion guards (can't delete vehicles on active trips or in maintenance)

### 🗺️ Trip Dispatcher
- **Cargo weight validation** — rejects trips where `cargoWeight > vehicle.maxCapacity`
- **License compliance** — blocks expired-license drivers from assignment
- Smart dropdowns showing only `available` vehicles and `on_duty` drivers
- Trip lifecycle: `Draft → Dispatched → Completed / Cancelled`
- Automatic vehicle/driver status updates on dispatch and completion
- Odometer tracking with distance calculation

### 🔧 Maintenance & Service Logs
- **Auto-sync**: Creating maintenance → vehicle status becomes `In Shop`
- **Auto-sync**: Completing maintenance → vehicle status restores to `Available`
- Service types: Oil Change, Tire Rotation, Brake Service, Engine Repair, and more
- Immutable completed records (audit trail preservation)
- Full service history per vehicle

### 💰 Expense & Fuel Logging
- Per-vehicle expense tracking tied to Vehicle IDs
- Fuel logging with liters for efficiency calculations
- Expense categories: Fuel, Maintenance, Insurance, Other
- Optional trip linkage for per-trip cost analysis

### 📊 Analytics & Reports
- **Fuel Efficiency**: km/L per vehicle using trip odometer data and fuel expense liters
- **Vehicle ROI**: `(Revenue - Operational Cost) / Acquisition Cost × 100`
- **Cost per KM**: `(Maintenance + Fuel) / Total KM` in ₹/km
- Date range filtering (last month, quarter, year, all time, custom)
- One-click **CSV export** for vehicles, trips, maintenance, and expenses
- Client-side **PDF export** for analytics reports

### 👤 Driver Management
- License expiry tracking with automatic validity computation
- Safety scores (0–100) and trip completion rates
- Status management: On Duty, Off Duty, On Trip, Suspended
- Pre-save integrity checks at the database level

### 📱 Dashboard (Command Center)
- 4 KPI stat cards with real-time counts
- Bar chart: Monthly fleet activity (Trips vs Expenses)
- Donut chart: Fleet status breakdown
- Quick action shortcuts
- Filterable by vehicle type, status, and region

---

## 🏗 Architecture

```
┌────────────────────────────────────────────────────────┐
│                    Frontend (React 19 + Vite)          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Pages   │  │Components│  │ Context  │  │Services │ │
│  │(19 files)│  │(12 files)│  │(AuthCtx) │  │(Axios)  │ │
│  └────┬─────┘  └──────────┘  └──────────┘  └────┬────┘ │
│       │              HTTP + JWT (Bearer Token)  │      │
└───────┼─────────────────────────────────────────┼──────┘
        │                                         │
┌───────▼─────────────────────────────────────────▼─────┐
│                    Backend (Express.js)               │
│  ┌──────┐  ┌──────────┐  ┌───────────┐  ┌───────────┐ │
│  │Routes│→ │Middleware│→ │Validators │→ │Controllers│ │
│  │(8)   │  │(Auth+Err)│  │(7 files)  │  │(8 files)  │ │
│  └──────┘  └──────────┘  └───────────┘  └─────┬─────┘ │
│                                               │       │
│  ┌──────────┐  ┌──────────┐                   │       │
│  │ Services │  │  Utils   │                   │       │
│  │(Email,   │  │(Constants│                   │       │
│  │ Export)  │  │ 9 enums) │                   │       │
│  └──────────┘  └──────────┘                   │       │
└───────────────────────────────────────────────┼───────┘
                                                │
┌───────────────────────────────────────────────▼────────┐
│                    MongoDB (Mongoose ODM)              │
│  ┌──────┐ ┌───────┐ ┌──────┐ ┌────┐ ┌───────┐ ┌──────┐ │
│  │User  │ │Vehicle│ │Driver│ │Trip│ │Expense│ │Maint.│ │
│  └──────┘ └───────┘ └──────┘ └────┘ └───────┘ └──────┘ │
└────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 19 | UI framework |
| Vite 7 | Build tool & dev server |
| React Router 7 | Client-side routing |
| Recharts 3 | Charts & data visualization (Bar, Pie, Area, Line) |
| Framer Motion | Animations & transitions |
| Lucide React | Icon library |
| Axios | HTTP client with interceptors |
| date-fns | Date formatting utilities |

### Backend
| Technology | Purpose |
|-----------|---------|
| Express 4 | HTTP server & REST API |
| Mongoose 8 | MongoDB ODM with schemas, indexes, virtuals |
| JWT (jsonwebtoken) | Stateless authentication |
| bcryptjs | Password hashing |
| express-validator | Request validation middleware |
| Nodemailer | Email notifications (registration, login, password reset) |
| cookie-parser | HTTP-only cookie support |
| CORS | Cross-origin requests |

---

## 📁 Project Structure

```
FleetFlow/
├── backend/
│   ├── server.js                    # Entry point
│   ├── seed.js                      # Database seeder (demo data)
│   ├── package.json
│   └── src/
│       ├── app.js                   # Express app setup & route wiring
│       ├── config/
│       │   └── db.js                # MongoDB connection
│       ├── models/
│       │   ├── user.model.js        # User schema (RBAC, bcrypt hooks)
│       │   ├── vehicle.model.js     # Vehicle schema (status lifecycle, indexes)
│       │   ├── driver.model.js      # Driver schema (virtuals: isLicenseValid, completionRate)
│       │   ├── trip.model.js        # Trip schema (vehicle/driver refs, cargo weight)
│       │   ├── expense.model.js     # Expense schema (fuel liters, type categories)
│       │   └── maintenance.model.js # Maintenance schema (service types, auto-sync docs)
│       ├── controllers/
│       │   ├── auth.controller.js       # Register, login, profile, logout, forgot-password
│       │   ├── vehicle.controller.js    # Full CRUD + stats + status management (478 lines)
│       │   ├── driver.controller.js     # Driver CRUD + status management
│       │   ├── trip.controller.js       # Trip CRUD + dispatch/complete/cancel workflow
│       │   ├── maintenance.controller.js# CRUD + auto-sync logic (377 lines)
│       │   ├── expense.controller.js    # Expense CRUD
│       │   ├── dashboard.controller.js  # Aggregated KPIs from all modules
│       │   └── analytics.controller.js  # Fuel efficiency, ROI, cost/km, CSV export (456 lines)
│       ├── routes/                  # 8 route files with auth + RBAC middleware
│       ├── middleware/
│       │   ├── auth.middleware.js    # JWT verification + authorize() role checker
│       │   └── error.middleware.js   # Global error handler
│       ├── validators/              # 7 express-validator files
│       ├── services/
│       │   ├── email.service.js     # Nodemailer templates
│       │   └── export.service.js    # CSV generation with character escaping
│       └── utils/
│           └── constants.js         # Single source of truth (9 enum groups)
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx                  # Route definitions with RBAC
│       ├── main.jsx                 # React entry point
│       ├── index.css                # Global styles
│       ├── context/
│       │   └── AuthContext.jsx      # Auth state, login/logout, role helpers
│       ├── services/
│       │   └── api.js               # Axios instance with JWT interceptor
│       ├── components/
│       │   ├── common/              # Button, Input, Table (reusable)
│       │   └── layout/              # Sidebar, Navbar, ProtectedRoute, Layout
│       └── pages/
│           ├── Login.jsx            # Email/password auth
│           ├── Register.jsx         # Registration with role selection
│           ├── ForgotPassword.jsx   # Password reset flow
│           ├── Dashboard.jsx        # KPI cards, bar/pie charts, quick actions
│           ├── Vehicles.jsx         # Full CRUD table with modals, search, filters
│           ├── Drivers.jsx          # Driver management with license tracking
│           ├── Trips.jsx            # Trip creation, dispatch, complete workflow
│           ├── Maintenance.jsx      # Service logs with auto-sync demo
│           ├── Expenses.jsx         # Expense logging with type icons
│           ├── Analytics.jsx        # Charts, date ranges, CSV/PDF export
│           └── Profile.jsx          # User profile view/edit
│
└── FleetFlow.postman_collection.json  # Pre-built API test collection
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ 
- **MongoDB** running locally or a MongoDB Atlas URI
- **npm** or **yarn**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/rudra1806/FleetFlow.git
cd FleetFlow

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install
```

### Configuration

Create a `.env` file in the `backend/` directory:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/fleetflow
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development

# Email (Nodemailer) — optional
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Running the App

```bash
# Terminal 1 — Start the backend
cd backend
npm run dev          # Runs on http://localhost:3000

# Terminal 2 — Start the frontend
cd frontend
npm run dev          # Runs on http://localhost:5173

# (Optional) Seed with demo data
cd backend
npm run seed
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Manager | `manager@fleetflow.com` | `123456` |

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Backend server port (default: 3000) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for JWT token signing |
| `NODE_ENV` | No | `development` or `production` |
| `EMAIL_HOST` | No | SMTP host for Nodemailer |
| `EMAIL_PORT` | No | SMTP port (587 for TLS) |
| `EMAIL_USER` | No | SMTP email address |
| `EMAIL_PASS` | No | SMTP password / app password |

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/api/auth/register` | Create new account | Public |
| `POST` | `/api/auth/login` | Login & receive JWT | Public |
| `GET` | `/api/auth/me` | Get current user profile | All roles |
| `PUT` | `/api/auth/profile` | Update name/phone | All roles |
| `POST` | `/api/auth/logout` | Clear JWT cookie | All roles |
| `POST` | `/api/auth/forgot-password` | Send reset email | Public |

### Vehicles
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/api/vehicles` | Register new vehicle | Manager |
| `GET` | `/api/vehicles` | List (paginated, filterable, searchable) | All roles |
| `GET` | `/api/vehicles/stats` | KPI statistics | All roles |
| `GET` | `/api/vehicles/:id` | Get single vehicle | All roles |
| `PUT` | `/api/vehicles/:id` | Update vehicle details | Manager |
| `DELETE` | `/api/vehicles/:id` | Delete vehicle | Manager |
| `PATCH` | `/api/vehicles/:id/status` | Toggle available ↔ retired | Manager |

### Drivers
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/api/drivers` | Add new driver | Manager, Dispatcher |
| `GET` | `/api/drivers` | List all drivers | Manager, Dispatcher |
| `GET` | `/api/drivers/:id` | Get single driver | Manager, Dispatcher |
| `PUT` | `/api/drivers/:id` | Update driver | Manager, Dispatcher |
| `DELETE` | `/api/drivers/:id` | Delete driver | Manager |
| `PATCH` | `/api/drivers/:id/status` | Change driver status | Manager, Dispatcher |

### Trips
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/api/trips` | Create trip (draft) | Manager, Dispatcher |
| `GET` | `/api/trips` | List with filters | Manager, Dispatcher |
| `GET` | `/api/trips/:id` | Get single trip | Manager, Dispatcher |
| `PUT` | `/api/trips/:id` | Update draft trip | Manager, Dispatcher |
| `PATCH` | `/api/trips/:id/status` | Dispatch / Complete / Cancel | Manager, Dispatcher |

### Maintenance
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/api/maintenance` | Create service log (→ vehicle In Shop) | Manager |
| `GET` | `/api/maintenance` | List with filters | All roles |
| `GET` | `/api/maintenance/:id` | Get single record | All roles |
| `PUT` | `/api/maintenance/:id` | Update / Complete (→ vehicle Available) | Manager |
| `DELETE` | `/api/maintenance/:id` | Delete (scheduled only) | Manager |
| `GET` | `/api/maintenance/vehicle/:vehicleId` | Service history per vehicle | All roles |

### Expenses
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/api/expenses` | Log new expense | Manager, Financial Analyst |
| `GET` | `/api/expenses` | List with filters | Manager, Financial Analyst |
| `GET` | `/api/expenses/:id` | Get single expense | Manager, Financial Analyst |
| `PUT` | `/api/expenses/:id` | Update expense | Manager, Financial Analyst |
| `DELETE` | `/api/expenses/:id` | Delete expense | Manager |

### Dashboard & Analytics
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/api/dashboard` | Aggregated KPIs | All roles |
| `GET` | `/api/analytics/fuel-efficiency` | km/L per vehicle | Manager, Financial Analyst |
| `GET` | `/api/analytics/vehicle-roi` | ROI % per vehicle | Manager, Financial Analyst |
| `GET` | `/api/analytics/cost-per-km` | ₹/km per vehicle | Manager, Financial Analyst |
| `GET` | `/api/analytics/export/:type` | CSV download | Manager, Financial Analyst |

---

## 🔒 Role-Based Access Control

Access is enforced at **two layers** — backend `authorize()` middleware and frontend `ProtectedRoute` component.

| Page | Manager | Dispatcher | Safety Officer | Financial Analyst |
|:-----|:-------:|:----------:|:--------------:|:-----------------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Vehicles (view) | ✅ | ✅ | ✅ | ✅ |
| Vehicles (CRUD) | ✅ | ❌ | ❌ | ❌ |
| Drivers | ✅ | ✅ | ❌ | ❌ |
| Trips | ✅ | ✅ | ❌ | ❌ |
| Maintenance | ✅ | ❌ | ✅ | ❌ |
| Expenses | ✅ | ❌ | ❌ | ✅ |
| Analytics | ✅ | ❌ | ❌ | ✅ |
| Profile | ✅ | ✅ | ✅ | ✅ |

---

## ⚙️ Business Logic & Workflows

### Trip Dispatching Lifecycle

```
1. CREATE trip (cargo: 450kg, vehicle max: 500kg)
   → Validation: 450 < 500 ✅ Pass
   → Status: Draft

2. DISPATCH trip
   → Vehicle status: Available → On Trip
   → Driver status: On Duty → On Trip
   → Driver.assignedVehicle = vehicle._id

3. COMPLETE trip (enter final odometer)
   → Vehicle status: On Trip → Available
   → Vehicle.currentOdometer = endOdometer
   → Driver status: On Trip → On Duty
   → Driver.assignedVehicle = null
   → Driver.totalTrips++, Driver.completedTrips++
```

### Maintenance Auto-Sync

```
1. CREATE maintenance for Vehicle-X
   → Vehicle-X.status = "in_shop" (automatic)
   → Vehicle-X disappears from trip dispatcher dropdown

2. COMPLETE maintenance
   → Vehicle-X.status = "available" (automatic)
   → Vehicle-X reappears in dispatcher dropdown
```

### Vehicle Status State Machine

```
                    ┌─── Trip Dispatched ───┐
                    │                       ▼
   [Created] → Available ◄──────────── On Trip
                    │                       
                    │── Maintenance Created ─► In Shop
                    │                           │
                    │◄── Maintenance Completed ──┘
                    │
                    └── Manual Toggle ──► Retired
                                            │
                    ◄── Manual Toggle ───────┘
```

---

## 🗄️ Database Schema

### Entity Relationship

```
User (createdBy) ──────┬──► Vehicle ◄──── Trip
                       │       ▲              │
                       │       │              │
                       ├──► Driver ◄──────────┘
                       │       
                       ├──► Maintenance ──► Vehicle
                       │
                       └──► Expense ──────► Vehicle
                                    └─────► Trip (optional)
```

### Collections Overview

| Collection | Key Fields | Indexes |
|-----------|-----------|---------|
| **Users** | name, email (unique), password (hashed), role, isActive | email |
| **Vehicles** | name, licensePlate (unique), type, maxCapacity, status, fuelType, acquisitionCost, region | {status, type}, {region} |
| **Drivers** | name, licenseNumber (unique), licenseExpiry, safetyScore, status, assignedVehicle | {status}, {licenseExpiry} |
| **Trips** | vehicle, driver, cargoWeight, origin, destination, status, startOdometer, endOdometer | {vehicle, status}, {driver, status}, {startDate} |
| **Expenses** | vehicle, trip?, type, amount, liters?, date | {vehicle, type}, {trip}, {date} |
| **Maintenance** | vehicle, serviceType, cost, status, completionDate, mechanic | {vehicle, status}, {serviceDate} |

---

## 📄 License

This project is licensed under the ISC License.

---

<p align="center">
  Built with ❤️ by Team FleetFlow
</p>
