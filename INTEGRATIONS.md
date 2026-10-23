# ReceptionAI — External Integrations & Compliance Guide

This document lists all third-party integrations, credential requirements, pricing models, and compliance obligations for the ReceptionAI platform.

---

## 1. Google Gemini API (LLM & Agent Reasoning)

- **Provider:** Google AI Studio / Google Cloud Vertex AI
- **Role:** Powers natural language customer understanding, semantic slot-filling, and tool-calling execution.
- **SDK:** `@google/genai` (Node.js SDK)
- **Model:** `gemini-3.8-flash` (or `gemini-flash-latest`)
- **Required Credentials:**
  - `GEMINI_API_KEY`: Generated from [Google AI Studio](https://aistudio.google.com/).
- **Offline / Local Fallback:**
  - When `GEMINI_API_KEY` is not provided, ReceptionAI automatically activates its built-in deterministic autonomous agent tool-calling engine, allowing 100% full testing and local development with zero external dependencies.

---

## 2. Stripe Billing & Subscriptions

- **Provider:** Stripe, Inc.
- **Role:** Handles SaaS recurring monthly/annual billing, trial management, invoice issuance, and payment webhooks.
- **Required Credentials:**
  - `STRIPE_SECRET_KEY`: Secret API key (`sk_live_...` or `sk_test_...`)
  - `STRIPE_WEBHOOK_SECRET`: Webhook signing secret (`whsec_...`)
  - `STRIPE_MOCK_MODE`: Set to `true` for simulated local checkout testing without live Stripe credentials.
- **Required Webhook Events:**
  - `checkout.session.completed`
  - `invoice.paid`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- **Security Notice:**
  - Never trust client-side redirect statuses. All subscription entitlements are unlocked strictly through cryptographic webhook verification.

---

## 3. Google Calendar Integration (Two-Way Sync)

- **Provider:** Google Cloud Console / Google Workspace
- **Role:** Synchronizes clinic appointments into the practice's Google Calendar and detects calendar blockouts.
- **Required Setup:**
  - Google Cloud Project with the **Google Calendar API** enabled.
  - OAuth 2.0 Client ID and Client Secret configured with redirect URI: `https://app.receptionai.com/api/integrations/google/callback`.
  - Scopes: `https://www.googleapis.com/auth/calendar.events`
- **Verification Requirement:**
  - Production deployments require Google OAuth App Verification for sensitive calendar scopes before publishing to public dental practices.

---

## 4. Twilio Telephony & SMS Module

- **Provider:** Twilio, Inc.
- **Role:** Inbound AI voice phone receptionist and automated SMS confirmation reminders.
- **Required Credentials:**
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER` (Dedicated clinic E.164 phone number)
- **Voice Pipeline Architecture:**
  - Twilio Voice Webhook -> WebSocket media streaming -> Speech-To-Text -> ReceptionAI Tool Engine -> Text-To-Speech -> Audio Stream.
- **Compliance Obligations:**
  - **A2P 10DLC Registration:** Mandatory in the United States for business SMS messaging to prevent carrier filtering.
  - **Call Recording Consent:** Automated disclosure ("This call is answered by an AI assistant and may be recorded for quality purposes") must play at the start of voice calls in two-party consent jurisdictions.

---

## 5. Transactional Email (SMTP / Mailgun / SendGrid)

- **Provider:** Mailgun, SendGrid, Amazon SES, or standard SMTP
- **Role:** Immediate booking confirmation receipts, cancellation notices, and password resets.
- **Required Credentials:**
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- **Domain Authentication:**
  - SPF, DKIM, and DMARC records must be configured on your sending domain to prevent email delivery failure.

---

## 6. Healthcare Compliance & HIPAA Framework

For customers in the United States healthcare market:

1. **Business Associate Agreement (BAA):**
   - If a covered entity (dental clinic or doctor) uses ReceptionAI to process Protected Health Information (PHI), a signed BAA must be in place between the practice and ReceptionAI.
2. **Sub-processor Compliance:**
   - All third-party providers handling data (Cloud hosting, LLM providers, database hosts) must also have signed BAAs:
     - Google Cloud Vertex AI (supports HIPAA BAA)
     - AWS / GCP Database & Compute (supports HIPAA BAA)
3. **Data Minimization:**
   - ReceptionAI enforces data minimization: the AI virtual receptionist collects only administrative scheduling information (name, email, phone number, and service type) and actively refuses clinical diagnostic questionnaires.
4. **Audit Logging:**
   - All patient appointment creations, status modifications, and cancellations are written to immutable audit logs with user attribution and UTC timestamps.
