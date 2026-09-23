# ⚡ GridPulse — Power Outage & Load Shedding Management System
> **Apollo Level 2 Web Development — Batch 7 Assignment 6 (B7A6)**  
> **Assigned Serial Number:** **3** (Load Shedding & Power Outage Management System)  
> **Category:** Utility / Public Service  

---

## 📌 Project Overview
**GridPulse** is an enterprise-grade RESTful power grid management and outage response platform engineered for public power authorities, distribution companies, field engineers, and residential/commercial energy consumers. 

The system bridges electrical distribution grid telemetry (Distribution Zones → Substations → 33kV/11kV Feeders → Areas) with live citizen outage reporting, automated deficit-driven load shedding dispatch, technician repair work-orders, Redis OTP caching, and Stripe payment processing.

---

## 👥 3 Distinct Roles & Strict Role-Based Access Control (RBAC)

| Role | Access Level | Description & Core Permissions |
|:---:|:---:|:---|
| **`ADMIN`** | **Full Grid Control** | Grid operations director. Manages distribution zones, substations, and feeders; monitors real-time telemetry (MW capacity vs demand); runs automated load shedding algorithms; assigns field technicians; inspects system audit logs; manages user roles. |
| **`TECHNICIAN`** | **Field Service Crew** | Dispatched repair engineer. Views assigned outage emergency tickets; transitions repair lifecycle (`EN_ROUTE` → `REPAIR_IN_PROGRESS` → `RESTORED`); logs technical resolution notes and equipment replacement details. |
| **`CUSTOMER`** | **Citizen / Consumer** | Energy consumer. Reports unexpected power outages with photo evidence; tracks live restoration progress; views planned load-shedding schedules for their local feeder; pays electricity bills & priority emergency reconnection fees via Stripe. |

---

## 🔐 Working Demo Credentials (For Evaluation)

| Role | Email | Password | Access Scope |
|:---|:---|:---|:---|
| **ADMIN** | `admin@gridpulse.gov` | `Admin@123456` | Full system control, grid dispatch, audit logs, auto-shedding |
| **TECHNICIAN** | `tech.rahim@gridpulse.gov` | `Tech@123456` | Work-order ticket queue, repair updates, diagnostic notes |
| **CUSTOMER** | `customer.hasan@gmail.com` | `Customer@123456` | Outage reporting, local schedule, Stripe bill payment |

---

## 🛠️ Complete Tech Stack

- **Runtime & Framework:** Node.js, TypeScript, Express.js
- **Database & ORM:** PostgreSQL, Prisma ORM (relational models, indexes, transactions, and soft-delete support)
- **Validation:** Zod (strict schema-level input validation with field-level error mapping)
- **Authentication & Security:** JWT (Access Token + Secure HTTP-only Refresh Cookie), Bcrypt password hashing, GCP Social Login, Helmet security headers, CORS, Rate-limiting
- **Caching & OTP:** Redis (`ioredis` client with 5-minute TTL key expiration for OTPs and grid load caching)
- **File Storage:** Multer (memory buffer) + Cloudinary integration for incident photos
- **Email Testing:** Nodemailer with Ethereal SMTP support for transactional OTPs & dispatch notifications
- **Payment Processing:** Stripe (Checkout session creation, webhook processing, status verification)
- **Code Quality:** Biome (`biome.json`)
- **API Documentation:** Postman Collection (`/public/postman_collection.json`) & built-in interactive API Explorer

---

## 🏗️ Architecture & Modular Folder Hierarchy

The codebase strictly follows a **modular, clean architecture**:

```text
src/
├── app/
│   ├── config/             # Dotenv & typed runtime environment configuration
│   ├── middlewares/        # auth, validateRequest, globalErrorHandler, notFound, upload
│   ├── utils/              # sendResponse, catchAsync, jwt, redis, mailer, cloudinary, stripe, prisma
│   ├── routes/             # Centralized versioned API index (/api/v1)
│   └── modules/
│       ├── auth/           # routes, controller, service, interface, validation
│       ├── user/           # routes, controller, service, interface, validation
│       ├── zone/           # routes, controller, service, interface, validation
│       ├── schedule/       # routes, controller, service, interface, validation
│       ├── outage/         # routes, controller, service, interface, validation
│       ├── payment/        # routes, controller, service, interface, validation
│       └── admin/          # routes, controller, service, interface, validation
├── server.ts               # Express application entry point with Vite middleware
├── prisma/
│   └── schema.prisma       # Full PostgreSQL database schema definition
└── biome.json              # Biome formatter & linter configuration
```

---

## 🔌 26+ Meaningful RESTful API Endpoints

### 1. Authentication (`/api/v1/auth`)
- `POST /register`: Register user & cache 6-digit OTP in Redis (Nodemailer email dispatch)
- `POST /verify-otp`: Verify Redis OTP, activate user, return JWT, set HTTP-only cookie
- `POST /login`: Email & password login, returns JWT and sets HTTP-only refresh cookie
- `POST /google-login`: GCP Social Login (Google OAuth verification)
- `POST /refresh-token`: Issue new access token using secure refresh cookie
- `POST /logout`: Invalidate session and clear HTTP-only cookies

### 2. User & Profile Management (`/api/v1/users`)
- `GET /me`: Get authenticated user profile & connected area/feeder details *(All roles)*
- `PATCH /me`: Update profile details (phone, area, name) *(All roles)*
- `GET /technicians`: List field technicians with live active repair workload *(Admin)*
- `GET /`: List all users with pagination, role filtering, and search *(Admin)*

### 3. Power Grid Hierarchy (`/api/v1/zones`)
- `GET /`: Get all distribution zones, substations, and feeders *(Public / All)*
- `POST /`: Create new distribution zone *(Admin)*
- `POST /substations`: Add substation to distribution zone *(Admin)*
- `POST /feeders`: Add feeder line to substation *(Admin)*
- `GET /feeders/:id`: Get feeder details with connected areas & live demand *(Public / All)*
- `PATCH /feeders/:id/status`: Update feeder status (`ACTIVE`, `LOAD_SHEDDING`, `TRIPPED`) *(Admin)*

### 4. Load Shedding Schedules (`/api/v1/schedules`)
- `GET /`: List schedules with status filter, feeder filter, and pagination *(All)*
- `GET /my-area`: Get today's load shedding schedule for logged-in consumer *(Customer)*
- `POST /`: Create scheduled load shedding time slot *(Admin)*
- `POST /generate-automated`: **Automated algorithm** shedding load based on requested grid deficit MW, prioritizing non-critical feeders and protecting hospital lines *(Admin)*
- `PATCH /:id/status`: Update schedule status (`SCHEDULED`, `ACTIVE`, `COMPLETED`, `CANCELLED`) *(Admin)*

### 5. Outage Reports & Technician Dispatch (`/api/v1/outages`)
- `POST /`: Report unexpected outage with Multer photo upload & Cloudinary *(Customer/Admin)*
- `GET /`: List outages with filtering (status, severity, feeder), search, pagination *(All)*
- `GET /:id`: Outage report details with full chronological audit timeline *(All)*
- `GET /my-assigned`: Get tickets assigned to logged-in technician *(Technician)*
- `POST /:id/assign`: Assign technician with estimated restoration and email dispatch *(Admin)*
- `PATCH /:id/status`: Transition outage status (`EN_ROUTE`, `REPAIR_IN_PROGRESS`, `RESTORED`) with resolution notes *(Technician/Admin)*
- `DELETE /:id`: Soft delete outage report (`isDeleted: true`) *(Admin)*

### 6. Stripe Payment Processing (`/api/v1/payments`)
- `POST /create-checkout-session`: Create Stripe checkout session for bill or priority reconnection *(Customer/Admin)*
- `POST /verify`: Verify Stripe session ID and update payment status to `COMPLETED` *(Customer/Admin)*
- `POST /webhook`: Stripe webhook handler for `checkout.session.completed`
- `GET /my-payments`: View user payment history *(Customer/Technician/Admin)*
- `GET /`: List all system payments with pagination *(Admin)*

### 7. Admin Analytics & Audit Logs (`/api/v1/admin`)
- `GET /dashboard-stats`: Real-time telemetry (Grid capacity MW, demand MW, deficit MW, active outages, technicians) *(Admin)*
- `GET /audit-logs`: System audit trail logging all actions with user, entity, and timestamp *(Admin)*
- `PATCH /users/:id/role`: Update user role (`CUSTOMER`, `TECHNICIAN`, `ADMIN`) *(Admin)*

---

## ⚡ Core Business Workflows

### 1. Priority-Based Automated Load Shedding Algorithm
When regional electricity generation falls behind consumer demand, the grid operator inputs the current deficit in Megawatts (MW). The backend algorithm:
1. Gathers all operational feeders and queries connected area priority tags.
2. **Excludes `CRITICAL_HOSPITAL` lines** from shedding.
3. Prioritizes feeders serving `NORMAL` residential areas before `HIGH` commercial districts.
4. Executes a PostgreSQL database transaction updating feeder statuses to `LOAD_SHEDDING`, creating schedule records, caching active load reduction in Redis, and logging an audit event.

### 2. Outage Lifecycle State Machine
```text
[REPORTED] 
    │ (Citizen submits ticket with photo & GPS area)
    ▼
[VERIFIED] 
    │ (Grid operator confirms breaker/feeder trip)
    ▼
[TECHNICIAN_ASSIGNED] 
    │ (Admin dispatches field crew; email dispatched via Nodemailer)
    ▼
[EN_ROUTE] 
    │ (Technician acknowledges dispatch and travels to pole/substation)
    ▼
[REPAIR_IN_PROGRESS] 
    │ (Technician begins transformer replacement / cable joint repair)
    ▼
[RESTORED]
    │ (Grid re-energized; restoredAt timestamp recorded with resolution notes)
```

### 3. Redis OTP Security Flow
1. Citizen registers with email and password.
2. System generates a 6-digit numeric OTP and stores it in Redis with key `otp:<email>` with a 300-second (5 min) TTL.
3. Nodemailer sends an email with the OTP code.
4. User submits OTP to `/api/v1/auth/verify-otp`.
5. Redis validates the OTP; on success, the key is evicted from Redis, the account is marked `isVerified: true`, and JWT access & refresh tokens are returned.

---

## 📦 How to Test & Evaluate

1. **Frontend Portal**: Open the application in your browser to access the full interactive console:
   - **Quick Demo Login Switcher**: Instantly log in as `Admin`, `Technician`, or `Customer` with 1 click.
   - **Live Power Grid Telemetry**: Real-time view of substation loads and deficit meters.
   - **Interactive API Explorer**: Test all 26+ endpoints directly with live request & response JSON.
   - **Outage Reporter & Dispatch Board**: Submit reports and dispatch technicians.
   - **Stripe Checkout Test**: Test checkout session creation and instant verification.
2. **Postman**: Import `/postman_collection.json` directly into Postman or Thunder Client to test every endpoint with pre-configured request bodies and environment variables!
