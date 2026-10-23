# ReceptionAI — AI Receptionist & Appointment Booking SaaS

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-2D3748.svg)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-Passing%20(10%2F10)-brightgreen.svg)]()

> **"Your AI Receptionist. Always Ready."**  
> Answer more inquiries, book more appointments, and give every patient a better first impression.

---

## 🌟 About ReceptionAI & Live Service Directory

**ReceptionAI** is a production-oriented, multi-tenant SaaS platform that empowers appointment-based healthcare businesses—beginning with dental practices across the United States, United Kingdom, Canada, and Australia—to deploy autonomous, 24/7 AI receptionists. 

Unlike generic chatbots, ReceptionAI combines deterministic tool-calling, real calendar availability engines, in-browser voice recording studios, omnichannel Call-to-Chat SMS workflows, multi-click request deduplication, and deep customer interaction telemetry into a HIPAA-aware clinical booking infrastructure.

### 🔗 Live Interactive Service Directory

Click any link below to explore the live services created in this platform:

| Live Service | Production Cloud URL | Local Route | Audience & Purpose | Access |
| :--- | :--- | :--- | :--- | :--- |
| **🌐 Interactive About Page** | [**Live on Render**](https://reception-ai-frontend.onrender.com/about) | [**/about**](http://localhost:5180/about) | Full architectural overview, enterprise healthcare design patterns, and platform directory. | Public |
| **📱 Call-to-Chat Visual Slot Picker** | [**Live on Render**](https://reception-ai-frontend.onrender.com/book-chat/apex-dental-spa) | [**/book-chat/apex-dental-spa**](http://localhost:5180/book-chat/apex-dental-spa) | Mobile visual booking link texted to telephone callers. Patients select chairs, treatments, and complete structured clinical intake with multi-click protection. | Public |
| **🎙️ AI Phone Receptionist & Voice Studio** | [**Live on Render**](https://reception-ai-frontend.onrender.com/dashboard/phone) | [**/dashboard/phone**](http://localhost:5180/dashboard/phone) | Autonomous telephone attendance engine with AI voices (*Nova*, *Alloy*, *Echo*) and an in-browser microphone audio studio for clinic owners to record custom greetings. | Clinic Vendor |
| **📊 Patient Journey Telemetry & Metadata** | [**Live on Render**](https://reception-ai-frontend.onrender.com/dashboard/telemetry) | [**/dashboard/telemetry**](http://localhost:5180/dashboard/telemetry) | Medical vendor analytics to study customer touchpoints, funnel drop-offs, device/browser metadata, and live counts of duplicate clicks prevented. | Clinic Vendor |
| **💬 Embeddable Website Widget** | [**Live on Render**](https://reception-ai-frontend.onrender.com/embed/apex-dental-spa) | [**/embed/apex-dental-spa**](http://localhost:5180/embed/apex-dental-spa) | Standalone iframe and drop-in snippet (`<script src="/widget.js">`) rendering an AI booking receptionist directly on existing clinic websites. | Public |
| **🧪 Zero-Hallucination Booking Sandbox** | [**Live on Render**](https://reception-ai-frontend.onrender.com/demo) | [**/demo**](http://localhost:5180/demo) | Interactive clinical sandbox testing deterministic tool calling, real calendar calculations, price quoting, and dental triage guardrails. | Public |
| **🛡️ Multi-Tenant Super-Admin Control Plane** | [**Live on Render**](https://reception-ai-frontend.onrender.com/admin) | [**/admin**](http://localhost:5180/admin) | Platform owner command center to monitor cross-tenant appointments, MRR subscriptions, system health, and global click deduplication telemetry. | Super-Admin |
| **🏠 SaaS Landing Page & Live Demo** | [**Live on Render**](https://reception-ai-frontend.onrender.com/) | [**/**](http://localhost:5180/) | Premium B2B marketing website with interactive live receptionist chat demo, 3-step setup, pricing cards, and FAQ. | Public |

> 🚀 **Live Production Endpoints:**  
> - **Web Client:** [https://reception-ai-frontend.onrender.com](https://reception-ai-frontend.onrender.com)  
> - **Backend API:** [https://reception-ai-backend-djdq.onrender.com](https://reception-ai-backend-djdq.onrender.com) (`/health`, `/api/*`)

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
*Executes all 10 integration test suites:*
1. Authentication & Tenant Resolution
2. Multi-Tenant Data Isolation & Access Controls
3. Slot Availability & Double-Booking Concurrency Control
4. AI Agent Engine & Dental Safety Guardrails
5. Public Website Widget Endpoint
6. Super-Admin Platform Security
7. AI Phone Receptionist, Call-to-Chat Revert & Dual Confirmations
8. Multi-Click Deduplication, Server Idempotency & Customer Telemetry
9. Password Reset Security & Single-Use Token Invalidation
10. Cross-Tenant IDOR Attack Verification & Security Headers

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

## 4. Evaluation Credentials & Sandbox Demo

For safe client demonstrations and portfolio evaluation, prospective clients can evaluate ReceptionAI via two paths:

1. **Zero-Risk Interactive Sandbox:** Visit [`/demo`](https://reception-ai-frontend.onrender.com/demo) to test simulated conversational booking and triage guardrails without authentication.
2. **Dedicated Practice Test Accounts (Seeded Demo):**

| Role | Email | Password | Access Details |
|---|---|---|---|
| **Platform Super-Admin** | `admin@receptionai.com` | `AdminPassword123!` | Multi-tenant MRR metrics, tenant suspension, global telemetry |
| **US Dental Clinic Owner** | `dr.lin@apexdentalspa.com` | `DentalOwner123!` | Apex Dental Spa (Austin, TX) calendar, voice studio, services |
| **UK Dental Clinic Owner** | `dr.smith@smilecraft.co.uk` | `LondonDental123!` | SmileCraft London (GBP, UK timezone) for tenant isolation testing |

> 🔒 **Security Notice:** Public one-click login bypasses have been removed from the login screen in accordance with enterprise security best practices. Authentication is strictly validated by server-side JWT signatures, bcrypt verification, and IP-scoped rate limiters.

---

## 5. Website Widget Embedding

Add the AI receptionist to any dental practice website by pasting this single snippet before `</body>`:

```html
<script 
  src="https://reception-ai-backend-djdq.onrender.com/widget.js" 
  data-tenant="apex-dental-spa" 
  async>
</script>
```

---

## 6. Implementation Status & Feature Matrix

| Feature Module | Implementation Status | Production Behavior |
| :--- | :--- | :--- |
| **Multi-Tenant Database Engine** | ✅ **Live / Production** | 18 relational Prisma models with strict tenant scoping in all queries. |
| **Authentication & RBAC** | ✅ **Live / Production** | Bcrypt (10 rounds), signed JWT tokens, single-use password reset tokens, rate limiting. |
| **Double-Booking Prevention** | ✅ **Live / Production** | Database transaction locks and real chair conflict detection. |
| **Multi-Click Deduplication** | ✅ **Live / Production** | Synchronous in-memory locking + Prisma `IdempotencyRecord` table. |
| **Customer Journey Telemetry** | ✅ **Live / Production** | Session tracking, drop-off funnels, and saved click counters for clinics and admins. |
| **Deterministic AI Agent** | ✅ **Live / Production** | Server tool-calling pipeline (`search_services`, `check_availability`, `create_appointment`). |
| **Dental Safety Guardrails** | ✅ **Live / Production** | Built-in triage for swelling, trauma, airway restrictions; refuses drug prescriptions. |
| **In-Browser Audio Recording** | ✅ **Live / Production** | HTML5 MediaRecorder captures microphone audio for custom practice greetings. |
| **Call-to-Chat SMS Revert** | 🟡 **Simulated / Sandbox** | Dispatches interactive mobile chair slot link (`/book-chat/:slug`) via mock SMS queue. Connect `TWILIO_ACCOUNT_SID` for live telephony carrier routing. |
| **Stripe Subscription Billing** | 🟡 **Sandbox / Mock Mode** | Simulated checkout and webhook entitlements enabled by default (`STRIPE_MOCK_MODE=true`). Set `STRIPE_SECRET_KEY` for live card payments. |
| **External Google Calendar Sync** | 🟡 **Architecture Ready** | Provider interface built; requires Google OAuth Cloud client credentials. |

---

## 7. Healthcare Compliance & Production Launch Checklist

- [x] **Strict Tenant Isolation:** Cross-tenant reads and writes verified blocked via 10 automated test suites.
- [x] **No Real Patient Data:** Public demonstrations, seeded databases, and test suites utilize strictly synthetic data.
- [x] **Production Security Headers:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` (framing permitted only on `/embed` and `/widget.js`), `Referrer-Policy: strict-origin`.
- [x] **Administrative Scheduling Scope:** Disclaimer active across all marketing and legal terms stating ReceptionAI is an administrative communication and scheduling tool, not a clinical diagnostic system.
- [ ] **HIPAA BAA Agreement:** For US dental practices processing ePHI, a signed Business Associate Agreement must be executed prior to production onboarding.
