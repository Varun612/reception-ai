# ReceptionAI — AI Receptionist & Appointment Booking SaaS

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-2D3748.svg)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-Passing%20(8%2F8)-brightgreen.svg)]()

> **"Your AI Receptionist. Always Ready."**  
> Answer more inquiries, book more appointments, and give every patient a better first impression.

---

## 1. Product Overview

**ReceptionAI** is a multi-tenant, subscription-based B2B SaaS platform that enables appointment-based businesses—starting with dental clinics in the US, UK, Canada, and Australia—to deploy autonomous, 24/7 AI receptionists that handle patient inquiries and book appointments directly into their calendar.

### Key Differentiators:
- **Multi-Click Deduplication & Server Idempotency Guard:** Client-side in-flight locking, debounce cooldown, and server-side synchronous idempotency middleware intercept rapid duplicate clicks, preventing multiple requests from reaching or straining the server. Both the clinic vendor and platform super-admin can inspect live counts of redundant hits saved.
- **End-to-End Customer Interaction Telemetry & Metadata Study:** In-depth tracking of customer touchpoints from initial visit to confirmed booking. Medical vendors can study drop-off rates across the booking funnel, inspect individual session metadata (device, browser, referrer, time-to-book, click telemetry), and examine patient chart tags (New vs Returning, Chief Complaint, Dental Insurance, Accommodations).
- **Comprehensive Patient Details Booking:** The booking workflow captures complete clinical and administrative patient details (Full Name, Phone, Email, DOB, Patient Type, Dental Complaint / Reason for visit, Insurance Provider, and Accommodations/Allergies) before committing the appointment.
- **AI Phone Receptionist & Voice Studio:** An intelligent voice agent that answers inbound telephone calls on behalf of the clinic front desk, responds with realistic audio synthesis, and allows practice owners to record custom audio greetings via their microphone directly in the browser.
- **Omnichannel Call-to-Chat Revert:** Callers can be sent an immediate SMS with a direct interactive link (`/book-chat/:tenantSlug`) so they can visually browse and choose available dental chair slots on their phone screen.
- **Dual Confirmation Dispatch (SMS + Email):** Every committed booking automatically dispatches both an instant SMS confirmation to the patient's phone and a detailed calendar confirmation email to their inbox.
- **Zero Hallucination Tool-Calling Engine:** The AI language model does not fabricate availability or booking confirmations. Every slot calculation, conflict check, and reservation is executed and committed via server-validated backend tools with transaction locks.
- **Clinical Dental Safety Guardrails:** Strict built-in guardrails refuse requests for medical/dental diagnoses or prescription drugs, and immediately route acute dental emergencies (severe swelling, trauma, airway restriction) to emergency protocols.
- **Strict Multi-Tenant Isolation:** Database constraints and server authorization layers guarantee that one practice can never access another clinic's appointments, patients, knowledge documents, or billing.
- **Turnkey Embeddable Widget:** Practices receive a single `<script>` snippet that renders an interactive, branded booking receptionist on their website.
- **Super-Admin Control Plane:** Platform owners can monitor system health, inspect clinic accounts, track calculated MRR, and suspend or reactivate tenants with an immutable audit log.

---

## 2. Monorepo Architecture

```
reception-ai/
├── client/                     # Vite + React 19 + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── api/                # Typed API client with JWT interceptor
│   │   ├── context/            # Multi-tenant AuthContext
│   │   ├── components/         # Navbar, Footer, DashboardLayout, AdminLayout
│   │   └── pages/
│   │       ├── public/         # Landing, Features, Industries, Pricing, Demo, Docs
│   │       ├── auth/           # Login, Register
│   │       ├── onboarding/     # 6-Step Intelligent Onboarding Wizard
│   │       ├── dashboard/      # Overview, Appointments, Agent, Services, Settings, Widget, Billing, Team
│   │       ├── admin/          # Super-Admin Metrics, Tenants, Plans, Logs
│   │       └── embed/          # Standalone Widget iframe view
├── server/                     # Node.js + Express + TypeScript + Prisma ORM
│   ├── prisma/
│   │   ├── schema.prisma       # 18 Relational Models (SQLite / PostgreSQL)
│   │   └── seed.ts             # Realistic seed with Apex Dental Spa & UK clinic
│   ├── src/
│   │   ├── services/           # BookingEngine, AgentEngine, BillingService
│   │   ├── middleware/         # Auth, TenantGuard, RateLimiter, ErrorHandler
│   │   └── routes/             # Auth, Tenants, Appointments, Services, Staff, Agent, Widget, Billing, Admin
│   └── tests/                  # Automated integration test suite
├── API.md                      # REST API endpoints & payloads
├── DEPLOYMENT.md               # Production Docker, PostgreSQL, and cloud setup
└── INTEGRATIONS.md             # External API keys, compliance & HIPAA roadmap
```

---

## 3. Quick Start (Local Development)

### Prerequisites:
- **Node.js** >= 20.x
- **npm** >= 10.x

### Step 1: Install Dependencies
```bash
# In the server directory:
cd server
npm install

# In the client directory:
cd ../client
npm install
```

### Step 2: Initialize Database & Seed Demo Data
```bash
cd ../server

# Push schema to SQLite database (dev.db)
npx prisma db push

# Seed realistic clinic data & super-admin
npm run db:seed
```

### Step 3: Run Automated Test Suite
```bash
npm test
```
*Executes all 7 integration test suites: Authentication, Multi-Tenant Data Isolation, Concurrency Double-Booking Prevention, Dental Safety Triage, Public Chat Widget, Super-Admin Control Plane, and AI Phone Receptionist with Call-to-Chat & Dual Confirmations.*

### Step 4: Start Applications
```bash
# Terminal 1: Start API Server (Port 5050)
cd server
npm run dev

# Terminal 2: Start React Client (Port 5180)
cd client
npm run dev
```

Visit **`http://localhost:5180`** in your browser.

---

## 4. Pre-configured Demo Accounts

| Role | Email | Password | Details |
|---|---|---|---|
| **Platform Super-Admin** | `admin@receptionai.com` | `AdminPassword123!` | Full control plane, platform metrics, and tenant management |
| **US Dental Clinic Owner** | `dr.lin@apexdentalspa.com` | `DentalOwner123!` | Apex Dental Spa (Austin, TX) with real services, providers & slots |
| **UK Dental Clinic Owner** | `dr.smith@smilecraft.co.uk` | `LondonDental123!` | SmileCraft London (GBP, UK timezone) for tenant isolation testing |

*Tip: The login page includes quick 1-click test buttons to populate these credentials instantly.*

---

## 5. Website Widget Embedding

Add the AI receptionist to any website by pasting this snippet before `</body>`:

```html
<script 
  src="http://localhost:5050/widget.js" 
  data-tenant="apex-dental-spa" 
  async>
</script>
```

You can customize colors, position, greeting messages, and active services directly inside the **Website Widget** dashboard menu.

---

## 6. License & Compliance
Proprietary software architected for HIPAA-compliant administrative scheduling. See [INTEGRATIONS.md](./INTEGRATIONS.md) for legal agreements and BAA guidance.
