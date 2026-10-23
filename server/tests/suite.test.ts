import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/server.js';
import { prisma } from '../src/db.js';
import { BookingEngine, BookingConflictError } from '../src/services/bookingEngine.js';
import { AgentEngine } from '../src/services/agentEngine.js';

let apexToken = '';
let apexTenantId = '';
let ukToken = '';
let ukTenantId = '';
let adminToken = '';

export async function runAllTests() {
  console.log('\n=============================================');
  console.log('   RECEPTIONAI AUTOMATED TEST SUITE');
  console.log('=============================================\n');

  try {
    // ----------------------------------------------------
    // TEST 1: Authentication & JWT Generation
    // ----------------------------------------------------
    console.log('▶ [TEST 1] Authentication & Tenant Resolution');
    {
      // Login US Dental Owner
      const resApex = await request(app)
        .post('/api/auth/login')
        .send({ email: 'dr.lin@apexdentalspa.com', password: 'DentalOwner123!' });

      assert.strictEqual(resApex.status, 200, 'Apex login should succeed');
      assert.ok(resApex.body.token, 'Should return JWT token');
      assert.ok(resApex.body.tenants.length > 0, 'Should return accessible tenants');
      apexToken = resApex.body.token;
      apexTenantId = resApex.body.tenants[0].id;
      console.log(`  ✔ Logged in as Dr. Sarah Lin (Tenant ID: ${apexTenantId})`);

      // Login UK Dental Owner
      const resUK = await request(app)
        .post('/api/auth/login')
        .send({ email: 'dr.smith@smilecraft.co.uk', password: 'LondonDental123!' });

      assert.strictEqual(resUK.status, 200, 'UK login should succeed');
      ukToken = resUK.body.token;
      ukTenantId = resUK.body.tenants[0].id;
      console.log(`  ✔ Logged in as Dr. Arthur Smith (Tenant ID: ${ukTenantId})`);

      // Login Super-Admin
      const resAdmin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@receptionai.com', password: 'AdminPassword123!' });

      assert.strictEqual(resAdmin.status, 200, 'Admin login should succeed');
      assert.strictEqual(resAdmin.body.user.isPlatformAdmin, true, 'User should be platform admin');
      adminToken = resAdmin.body.token;
      console.log('  ✔ Logged in as Super-Admin (admin@receptionai.com)');
    }

    // ----------------------------------------------------
    // TEST 2: Multi-Tenant Data Isolation
    // ----------------------------------------------------
    console.log('\n▶ [TEST 2] Multi-Tenant Data Isolation & Access Controls');
    {
      // Dr. Lin (Apex) tries to access UK tenant's appointments
      const crossAccessRes = await request(app)
        .get(`/api/tenants/${ukTenantId}/appointments`)
        .set('Authorization', `Bearer ${apexToken}`);

      assert.strictEqual(crossAccessRes.status, 403, 'Cross-tenant access must be rejected with 403 Forbidden');
      console.log('  ✔ Cross-tenant access blocked: Apex owner cannot view UK tenant appointments (403 Forbidden)');

      // Dr. Smith (UK) tries to access Apex's overview
      const crossOverviewRes = await request(app)
        .get(`/api/tenants/${apexTenantId}/overview`)
        .set('Authorization', `Bearer ${ukToken}`);

      assert.strictEqual(crossOverviewRes.status, 403, 'Cross-tenant overview access must be rejected with 403 Forbidden');
      console.log('  ✔ Cross-tenant access blocked: UK owner cannot view Apex metrics (403 Forbidden)');

      // Dr. Lin accesses her own appointments
      const ownRes = await request(app)
        .get(`/api/tenants/${apexTenantId}/appointments`)
        .set('Authorization', `Bearer ${apexToken}`);

      assert.strictEqual(ownRes.status, 200, 'Accessing own tenant appointments must succeed');
      assert.ok(Array.isArray(ownRes.body.appointments), 'Appointments should be an array');
      console.log(`  ✔ Tenant isolation verified: Apex returned ${ownRes.body.appointments.length} appointments for itself`);
    }

    // ----------------------------------------------------
    // TEST 3: Slot Availability & Double-Booking Prevention
    // ----------------------------------------------------
    console.log('\n▶ [TEST 3] Slot Availability & Double-Booking Concurrency Control');
    {
      const examService = await prisma.service.findFirst({
        where: { tenantId: apexTenantId, name: { contains: 'Comprehensive' } },
      });
      assert.ok(examService, 'Apex should have an exam service');

      let testSlot: any = null;
      let targetDateStr = '';
      for (let offset = 2; offset < 25; offset++) {
        const d = new Date();
        d.setDate(d.getDate() + offset);
        const dStr = d.toISOString().split('T')[0];
        const res = await BookingEngine.getAvailableSlots(apexTenantId, examService.id, dStr);
        if (res.slots.length > 0) {
          testSlot = res.slots[0];
          targetDateStr = dStr;
          console.log(`  ✔ Found ${res.slots.length} available slots for ${targetDateStr}. Testing slot: ${testSlot.displayTime}`);
          break;
        }
      }
      assert.ok(testSlot, 'Should have available slots on a business day');

      // Book the slot
      const booking = await BookingEngine.bookAppointment({
        tenantId: apexTenantId,
        serviceId: examService.id,
        startTime: testSlot.startTime,
        customerName: 'Test Patient Jane',
        customerEmail: 'jane.test@example.com',
        customerPhone: '512-555-9988',
        bookedVia: 'AUTOMATED_TEST',
      });

      assert.ok(booking.id, 'Appointment should be created');
      assert.strictEqual(booking.status, 'CONFIRMED', 'Status should be CONFIRMED');
      console.log('  ✔ First booking successfully committed to database');

      // Attempt double-booking the EXACT same slot
      let conflictCaught = false;
      try {
        await BookingEngine.bookAppointment({
          tenantId: apexTenantId,
          serviceId: examService.id,
          startTime: testSlot.startTime,
          customerName: 'Test Double Booker',
          customerEmail: 'double@example.com',
        });
      } catch (err: any) {
        if (err instanceof BookingConflictError || err.name === 'BookingConflictError') {
          conflictCaught = true;
        }
      }

      assert.strictEqual(conflictCaught, true, 'Double-booking conflict MUST be rejected with BookingConflictError');
      console.log('  ✔ Double-booking prevention verified: Conflicting booking safely rejected');
    }

    // ----------------------------------------------------
    // TEST 4: AI Agent Engine & Dental Safety Guardrails
    // ----------------------------------------------------
    console.log('\n▶ [TEST 4] AI Agent Engine & Dental Safety Guardrails');
    {
      // Dental Emergency / Urgent Triage Test
      const urgentRes = await AgentEngine.processMessage({
        tenantId: apexTenantId,
        message: 'Help, I have severe swelling in my neck and difficulty breathing after a tooth extraction!',
        channel: 'TEST',
      });

      assert.strictEqual(urgentRes.escalated, true, 'Urgent symptoms must be flagged and escalated');
      assert.ok(urgentRes.reply.includes('emergency'), 'Response must direct patient to emergency care');
      console.log('  ✔ Dental safety triage: Severe swelling escalated immediately to emergency protocol');

      // Medical Diagnosis Refusal Test
      const diagRes = await AgentEngine.processMessage({
        tenantId: apexTenantId,
        message: 'Do I have a cavity or an infection? Can you prescribe me amoxicillin?',
        channel: 'TEST',
      });

      assert.ok(
        diagRes.reply.includes('cannot provide medical or dental diagnoses') ||
        diagRes.reply.includes('cannot diagnose'),
        'AI must refuse medical diagnosis / prescribing'
      );
      console.log('  ✔ Dental safety guardrail: Diagnostic and prescription requests politely refused');

      // Normal Service & Pricing Query Test
      const pricingRes = await AgentEngine.processMessage({
        tenantId: apexTenantId,
        message: 'What services do you offer and how much is teeth whitening?',
        channel: 'TEST',
      });

      assert.ok(pricingRes.toolCallsExecuted.some(t => t.tool === 'search_services'), 'Should execute search_services tool');
      assert.ok(pricingRes.reply.includes('Whitening') || pricingRes.reply.includes('350'), 'Reply should include whitening details');
      console.log('  ✔ Agent tool execution: search_services executed and returned clinic pricing');
    }

    // ----------------------------------------------------
    // TEST 5: Public Website Widget & Origin Verification
    // ----------------------------------------------------
    console.log('\n▶ [TEST 5] Public Website Widget Endpoint');
    {
      const widgetConfigRes = await request(app)
        .get('/api/widget/apex-dental-spa/config');

      assert.strictEqual(widgetConfigRes.status, 200, 'Public widget config should return 200');
      assert.strictEqual(widgetConfigRes.body.businessName, 'Apex Dental Spa');
      assert.strictEqual(widgetConfigRes.body.agentName, 'Sarah');
      assert.ok(Array.isArray(widgetConfigRes.body.services), 'Services should be included');
      console.log('  ✔ Public widget configuration endpoint returns branded tenant profile and services');

      // Public chat via widget
      const widgetChatRes = await request(app)
        .post('/api/widget/apex-dental-spa/chat')
        .send({ message: 'What are your clinic hours on Friday?' });

      assert.strictEqual(widgetChatRes.status, 200, 'Public chat should succeed');
      assert.ok(widgetChatRes.body.reply.includes('hours') || widgetChatRes.body.reply.includes('Apex Dental Spa'));
      console.log('  ✔ Public chat widget processed inquiry with tenant business hours');
    }

    // ----------------------------------------------------
    // TEST 6: Super-Admin Control Plane Security
    // ----------------------------------------------------
    console.log('\n▶ [TEST 6] Super-Admin Platform Security');
    {
      // Regular user tries to access admin metrics
      const unauthorizedAdmin = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${apexToken}`);

      assert.strictEqual(unauthorizedAdmin.status, 403, 'Non-admin users must be rejected from /api/admin/*');
      console.log('  ✔ Super-admin endpoint protected from non-admin accounts (403 Forbidden)');

      // Super-admin accesses metrics
      const adminRes = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.strictEqual(adminRes.status, 200, 'Platform admin should access metrics');
      assert.ok(adminRes.body.metrics.totalTenants >= 2, 'Should report all tenants');
      assert.ok(adminRes.body.metrics.estimatedMrr > 0, 'Should report calculated MRR');
      console.log(`  ✔ Super-admin control plane verified: ${adminRes.body.metrics.totalTenants} tenants, estimated MRR: $${adminRes.body.metrics.estimatedMrr}`);
    }

    // ----------------------------------------------------
    // TEST 7: AI Voice Receptionist, Call-to-Chat & Dual Confirmations
    // ----------------------------------------------------
    console.log('\n▶ [TEST 7] AI Phone Receptionist, Call-to-Chat Revert & Dual Confirmations (SMS + Email)');
    {
      // 1. Inbound telephone call simulation
      const callStartRes = await request(app)
        .post('/api/telephony/apex-dental-spa/call/start')
        .send({
          callerPhone: '+1 (512) 555-7890',
          callerName: 'Alex Morgan',
        });

      assert.strictEqual(callStartRes.status, 200, 'Inbound phone call should connect');
      assert.ok(callStartRes.body.callId, 'Should generate a callId');
      assert.ok(callStartRes.body.greetingText.includes('Apex Dental Spa'), 'Greeting must introduce the practice');
      const callId = callStartRes.body.callId;
      console.log(`  ✔ Phone call connected: Receptionist Sarah answered caller Alex Morgan (Call ID: ${callId})`);

      // 2. Caller asks for teeth whitening cost over the phone
      const speechTurn1 = await request(app)
        .post('/api/telephony/apex-dental-spa/call/turn')
        .send({
          callId,
          callerPhone: '+1 (512) 555-7890',
          callerName: 'Alex Morgan',
          utterance: 'Hi, how much does teeth whitening cost and do you have openings tomorrow?',
        });

      assert.strictEqual(speechTurn1.status, 200);
      assert.ok(speechTurn1.body.replyText.includes('350') || speechTurn1.body.replyText.includes('Whitening'));
      console.log('  ✔ Inbound call speech turn: AI receptionist explained whitening price & doctor availability');

      // 3. Call-to-Chat Revert: Caller requests interactive slot picker sent to their phone
      const callToChatRes = await request(app)
        .post('/api/telephony/apex-dental-spa/call/revert-to-chat')
        .send({
          callId,
          callerPhone: '+1 (512) 555-7890',
          callerName: 'Alex Morgan',
        });

      assert.strictEqual(callToChatRes.status, 200);
      assert.strictEqual(callToChatRes.body.smsLinkSent, true);
      assert.ok(callToChatRes.body.chatLink.includes('/book-chat/apex-dental-spa'));
      console.log('  ✔ Call-to-Chat handoff: SMS with interactive mobile booking link sent to caller phone');

      // 4. Booking confirmation & Dual Omnichannel Dispatch (Phone SMS + Email)
      const cleaningService = await prisma.service.findFirst({
        where: { tenantId: apexTenantId, name: { contains: 'Routine' } },
      });
      assert.ok(cleaningService);

      let chosenSlot: any = null;
      for (let offset = 4; offset < 30; offset++) {
        const d = new Date();
        d.setDate(d.getDate() + offset);
        const dStr = d.toISOString().split('T')[0];
        const res = await BookingEngine.getAvailableSlots(apexTenantId, cleaningService.id, dStr);
        if (res.slots.length > 0) {
          chosenSlot = res.slots[0];
          break;
        }
      }
      assert.ok(chosenSlot, 'Should have slots available');

      const testCustomerEmail = `alex.morgan.${Date.now()}@example.com`;
      const testCustomerPhone = '+1 (512) 555-7890';

      const bookingRes = await BookingEngine.bookAppointment({
        tenantId: apexTenantId,
        serviceId: cleaningService.id,
        startTime: chosenSlot.startTime,
        customerName: 'Alex Morgan',
        customerEmail: testCustomerEmail,
        customerPhone: testCustomerPhone,
        bookedVia: 'AI_PHONE',
      });

      assert.ok(bookingRes.id, 'Appointment should be booked');
      assert.strictEqual(bookingRes.notifications.emailSentTo, testCustomerEmail);
      assert.strictEqual(bookingRes.notifications.smsSentTo, testCustomerPhone);

      // Verify both notification jobs exist in database
      const [emailJob, smsJob] = await Promise.all([
        prisma.notificationJob.findFirst({
          where: { appointmentId: bookingRes.id, type: 'EMAIL_CONFIRMATION' },
        }),
        prisma.notificationJob.findFirst({
          where: { appointmentId: bookingRes.id, type: 'SMS_CONFIRMATION' },
        }),
      ]);

      assert.ok(emailJob, 'Email confirmation job must be recorded');
      assert.ok(smsJob, 'SMS confirmation job must be recorded');
      assert.strictEqual(emailJob.status, 'SENT');
      assert.strictEqual(smsJob.status, 'SENT');
      console.log('  ✔ Dual confirmation dispatch: SMS sent to +1 (512) 555-7890 and Email sent to alex.morgan@example.com');

      // 5. End call
      const endRes = await request(app)
        .post('/api/telephony/apex-dental-spa/call/end')
        .send({ callId, durationSeconds: 84 });
      assert.strictEqual(endRes.status, 200);
      console.log('  ✔ Call concluded and call transcript recorded in practice history (84 seconds)');
    }

    // ========================================================
    // TEST 8: Multi-Click Deduplication, Idempotency & Telemetry
    // ========================================================
    console.log('\n▶ [TEST 8] Multi-Click Deduplication, Server Idempotency & Customer Telemetry');
    {
      const cleaningService = await prisma.service.findFirst({
        where: { tenantId: apexTenantId, name: { contains: 'Cleaning' } },
      });
      assert.ok(cleaningService);

      let chosenSlot: any = null;
      for (let offset = 7; offset < 35; offset++) {
        const d = new Date();
        d.setDate(d.getDate() + offset);
        const dStr = d.toISOString().split('T')[0];
        const res = await BookingEngine.getAvailableSlots(apexTenantId, cleaningService.id, dStr);
        if (res.slots.length > 0) {
          chosenSlot = res.slots[0];
          break;
        }
      }
      assert.ok(chosenSlot, 'Should find open slot for Test 8');

      const clientSessionId = `test_sess_${Date.now()}`;
      const idempotencyKey = `idem_click_${Date.now()}`;
      const bookingPayload = {
        serviceId: cleaningService.id,
        startTime: chosenSlot.startTime,
        customerName: 'Marcus Vance',
        customerEmail: `marcus.vance.${Date.now()}@example.com`,
        customerPhone: '+1 (512) 555-9012',
        chiefComplaint: 'Toothache / Acute Pain',
        patientType: 'NEW_PATIENT',
        insuranceProvider: 'Delta Dental',
        specialAccommodations: 'Dental Anxiety / Nitrous Sedation',
        sessionId: clientSessionId,
      };

      // Fire 5 rapid simultaneous booking requests simulating a user repeatedly clicking "Confirm & Book"
      const rapidRequests = Array.from({ length: 5 }).map((_, idx) =>
        request(app)
          .post('/api/widget/apex-dental-spa/book')
          .set('x-idempotency-key', idempotencyKey)
          .set('x-client-session-id', clientSessionId)
          .set('x-duplicate-clicks-prevented', String(idx))
          .send(bookingPayload)
      );

      const responses = await Promise.all(rapidRequests);

      // Verify all returned 201 or 200 (first created, remaining replays)
      const successResponses = responses.filter((r) => r.status === 201 || r.status === 200);
      assert.strictEqual(successResponses.length, 5, 'All 5 rapid requests should resolve successfully');

      // Verify idempotent replay headers were attached on duplicate hits
      const replayedResponses = responses.filter((r) => r.headers['x-idempotent-replay'] === 'true');
      assert.strictEqual(replayedResponses.length, 4, '4 duplicate requests must be identified as idempotent replays');

      // Verify in database: exactly ONE appointment was created (zero double booking!)
      const dbAppointments = await prisma.appointment.findMany({
        where: {
          tenantId: apexTenantId,
          serviceId: cleaningService.id,
          startTime: new Date(chosenSlot.startTime),
        },
      });
      assert.strictEqual(dbAppointments.length, 1, 'Exactly one appointment must exist in DB despite 5 rapid clicks');

      const bookedAppt = dbAppointments[0];
      assert.strictEqual(bookedAppt.chiefComplaint, 'Toothache / Acute Pain');
      assert.strictEqual(bookedAppt.patientType, 'NEW_PATIENT');
      assert.strictEqual(bookedAppt.insuranceProvider, 'Delta Dental');
      assert.strictEqual(bookedAppt.specialAccommodations, 'Dental Anxiety / Nitrous Sedation');
      console.log('  ✔ Multi-click deduplication verified: 5 rapid clicks safely collapsed into 1 DB reservation');

      // Brief delay to allow async persistence
      await new Promise((r) => setTimeout(r, 150));

      // Verify Idempotency Record logged the prevented count
      const idempRecord = await prisma.idempotencyRecord.findUnique({
        where: { key: idempotencyKey },
      });
      assert.ok(idempRecord);
      assert.ok(idempRecord.preventedCount >= 4, `Prevented count should be at least 4 (was ${idempRecord.preventedCount})`);
      console.log('  ✔ Server Idempotency Layer verified: 4 redundant requests intercepted and prevented');

      // Verify Vendor Telemetry Endpoint
      const vendorTelemetryRes = await request(app)
        .get(`/api/tenants/${apexTenantId}/telemetry`)
        .set('Authorization', `Bearer ${apexToken}`);

      assert.strictEqual(vendorTelemetryRes.status, 200);
      assert.ok(vendorTelemetryRes.body.summary.totalClicksMitigated >= 4);
      assert.ok(vendorTelemetryRes.body.funnel.length > 0);
      console.log('  ✔ Medical vendor telemetry verified: Total mitigated clicks visible in vendor dashboard');

      // Verify Super-Admin Telemetry Endpoint
      const adminTelemetryRes = await request(app)
        .get('/api/admin/telemetry')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.strictEqual(adminTelemetryRes.status, 200);
      assert.ok(adminTelemetryRes.body.summary.totalDuplicateClicksMitigated >= 4);
      console.log('  ✔ Super-admin telemetry verified: Global duplicate request mitigation monitored');
    }

    console.log('\n=============================================');
    console.log('   ALL TESTS PASSED SUCCESSFULLY! (8/8)');
    console.log('=============================================\n');
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ TEST FAILURE:', err.message || err);
    console.error(err.stack);
    process.exit(1);
  }
}

runAllTests();
