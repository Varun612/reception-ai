# ReceptionAI — REST API Documentation

ReceptionAI provides a multi-tenant REST API with Bearer token authentication, tenant authorization guards, and strict input validation.

Base URL: `/api`

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Provisions a new user account and an isolated tenant workspace with starter services and operating hours.

**Request Body:**
```json
{
  "email": "doctor@clinic.com",
  "password": "SecurePassword123!",
  "fullName": "Dr. Sarah Lin, DDS",
  "businessName": "Apex Dental Spa",
  "industry": "dental"
}
```

**Response (201 Created):**
```json
{
  "message": "Account and workspace provisioned successfully.",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "cmv...",
    "email": "doctor@clinic.com",
    "fullName": "Dr. Sarah Lin, DDS",
    "isPlatformAdmin": false
  },
  "tenant": {
    "id": "cmv...",
    "slug": "apex-dental-spa-x1y2",
    "name": "Apex Dental Spa",
    "status": "ONBOARDING"
  }
}
```

---

### `POST /api/auth/login`
Validates user credentials and returns a signed JWT token along with all accessible tenant workspaces.

**Request Body:**
```json
{
  "email": "dr.lin@apexdentalspa.com",
  "password": "DentalOwner123!"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "cmv...",
    "email": "dr.lin@apexdentalspa.com",
    "fullName": "Dr. Sarah Lin, DDS",
    "isPlatformAdmin": false
  },
  "tenants": [
    {
      "id": "cmv...",
      "slug": "apex-dental-spa",
      "name": "Apex Dental Spa",
      "role": "OWNER",
      "status": "ACTIVE"
    }
  ]
}
```

---

### `GET /api/auth/me`
Retrieves the currently authenticated user's profile and active memberships.

**Headers:** `Authorization: Bearer <token>`

---

## 2. Tenant Management & Onboarding

### `GET /api/tenants/:tenantId`
Fetches tenant details, profile, business hours, and subscription status.

### `GET /api/tenants/:tenantId/overview`
Returns real-time KPI metrics (total appointments, upcoming appointments, conversion rate, conversations handled, human escalations).

### `PUT /api/tenants/:tenantId/onboarding`
Saves configuration from the 6-step business onboarding wizard (profile, services catalog, booking policies, AI receptionist personality).

**Request Body:**
```json
{
  "profile": {
    "name": "Apex Dental Spa",
    "industry": "dental",
    "address": "3400 N Lamar Blvd, Suite 210",
    "city": "Austin",
    "state": "TX",
    "phone": "(512) 555-0188",
    "timeZone": "America/Chicago",
    "emergencyContactProtocol": "For acute facial swelling call (512) 555-0188 or 911."
  },
  "services": [ ... ],
  "policies": {
    "minNoticeHours": 2,
    "maxAdvanceDays": 60,
    "cancellationNoticeHours": 24,
    "bufferBetweenSlotsMinutes": 10
  },
  "agent": {
    "agentName": "Sarah",
    "tone": "PROFESSIONAL",
    "greetingMessage": "Hello! Welcome to Apex Dental Spa...",
    "allowPriceQuoting": true
  }
}
```

---

## 3. Appointments Management

### `GET /api/tenants/:tenantId/appointments`
Filters appointments by `status`, `startDate`, `endDate`, `staffMemberId`, and search query.

### `POST /api/tenants/:tenantId/appointments`
Manually schedules an appointment with transaction-locked conflict prevention.

**Request Body:**
```json
{
  "serviceId": "cmv_service_id",
  "staffMemberId": "cmv_staff_id",
  "startTime": "2026-10-27T15:00:00.000Z",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "512-555-0123",
  "notes": "Patient requested consultation"
}
```

### `PATCH /api/tenants/:tenantId/appointments/:id/status`
Updates status to `CONFIRMED`, `COMPLETED`, `CANCELLED`, or `NO_SHOW`.

---

## 4. Public Embed Widget Endpoints

### `GET /api/widget/:tenantSlug/config`
Public endpoint returning the business name, agent name, greeting message, and active services catalog.

### `POST /api/widget/:tenantSlug/chat`
Receives customer chat messages, applies rate-limiting and conversation quotas, executes backend tools, and returns the natural language response.

**Request Body:**
```json
{
  "message": "Do you have any open slots for routine cleaning tomorrow?",
  "conversationId": "cmv_conv_id"
}
```

**Response (200 OK):**
```json
{
  "conversationId": "cmv_conv_id",
  "reply": "Here are available times for Routine Cleaning tomorrow:\n• 9:00 AM\n• 11:30 AM\n• 2:00 PM\n\nWould you like to reserve one?",
  "toolCallsExecuted": [
    {
      "tool": "check_availability",
      "params": { "serviceId": "cmv_service_id", "date": "2026-10-24" },
      "result": { "slots": [ ... ] }
    }
  ],
  "escalated": false
}
```

### `GET /api/widget/:tenantSlug/availability`
Public endpoint returning candidate booking slots for a given `serviceId` and `date`.

### `POST /api/widget/:tenantSlug/book`
Submits a direct booking reservation from the website chat widget.

---

## 5. Billing & Subscriptions

### `GET /api/tenants/:tenantId/billing`
Returns the active subscription plan, period dates, conversation usage meter, and available upgrade tiers.

### `POST /api/tenants/:tenantId/billing/checkout`
Creates a Stripe checkout session (live or simulated mock).

### `POST /api/billing/webhook`
Stripe webhook receiver verifying signatures and updating tenant subscription entitlements.

---

## 6. Super-Admin Control Plane

### `GET /api/admin/metrics`
Platform-wide health and revenue metrics (total tenants, active subscriptions, calculated MRR, system status).

### `GET /api/admin/tenants`
Returns a comprehensive list of all businesses, subscription plans, and status.

### `POST /api/admin/tenants/:tenantId/toggle-status`
Suspends or reactivates a business tenant workspace with an immutable audit log entry.
