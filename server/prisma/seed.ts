import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Starting database seed...');

  // 1. Create or Update Subscription Plans
  const starterPlan = await prisma.subscriptionPlan.upsert({
    where: { code: 'starter' },
    update: {},
    create: {
      code: 'starter',
      name: 'Starter',
      description: 'Single-location clinics needing automated website reception and booking.',
      monthlyPrice: 49.0,
      conversationLimit: 250,
      staffLimit: 3,
      features: JSON.stringify([
        'AI Web Chat Receptionist',
        'Direct Database Slot Booking',
        '250 Monthly Conversations',
        'Up to 3 Staff Members',
        'Automated Email Confirmations',
        'Standard Dental Safety Guardrails',
      ]),
      isActive: true,
    },
  });

  const growthPlan = await prisma.subscriptionPlan.upsert({
    where: { code: 'growth' },
    update: {},
    create: {
      code: 'growth',
      name: 'Growth',
      description: 'Growing dental practices wanting calendar sync, advanced analytics, and custom agent tones.',
      monthlyPrice: 99.0,
      conversationLimit: 1000,
      staffLimit: 10,
      features: JSON.stringify([
        'Everything in Starter',
        '1,000 Monthly Conversations',
        'Up to 10 Staff Members',
        'Google Calendar Integration',
        'SMS Reminder Infrastructure',
        'Custom Agent Personality & Voice',
        'Dedicated Knowledge Base Uploads',
      ]),
      isActive: true,
    },
  });

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { code: 'pro' },
    update: {},
    create: {
      code: 'pro',
      name: 'Pro Enterprise',
      description: 'Multi-doctor practices and high-volume clinics with priority routing.',
      monthlyPrice: 199.0,
      conversationLimit: 3500,
      staffLimit: 30,
      features: JSON.stringify([
        'Everything in Growth',
        '3,500 Monthly Conversations',
        'Up to 30 Staff Members',
        'Phone Receptionist Telephony Module',
        'Priority SLA Support',
        'Multi-location Routing',
        'HIPAA Compliance Security Package',
      ]),
      isActive: true,
    },
  });

  // 2. Create Platform Super Admin
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
  const platformAdmin = await prisma.user.upsert({
    where: { email: 'admin@receptionai.com' },
    update: {},
    create: {
      email: 'admin@receptionai.com',
      passwordHash: adminPasswordHash,
      fullName: 'ReceptionAI System Admin',
      isPlatformAdmin: true,
      emailVerified: true,
    },
  });

  // 3. Create Tenant 1: Apex Dental Spa (Austin, TX)
  const ownerPasswordHash = await bcrypt.hash('DentalOwner123!', 10);
  const drLinUser = await prisma.user.upsert({
    where: { email: 'dr.lin@apexdentalspa.com' },
    update: {},
    create: {
      email: 'dr.lin@apexdentalspa.com',
      passwordHash: ownerPasswordHash,
      fullName: 'Dr. Sarah Lin, DDS',
      isPlatformAdmin: false,
      emailVerified: true,
    },
  });

  const apexTenant = await prisma.tenant.upsert({
    where: { slug: 'apex-dental-spa' },
    update: {},
    create: {
      slug: 'apex-dental-spa',
      name: 'Apex Dental Spa',
      status: 'ACTIVE',
      timeZone: 'America/Chicago',
      currency: 'USD',
      country: 'US',
    },
  });

  await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId: apexTenant.id,
        userId: drLinUser.id,
      },
    },
    update: {},
    create: {
      tenantId: apexTenant.id,
      userId: drLinUser.id,
      role: 'OWNER',
    },
  });

  await prisma.businessProfile.upsert({
    where: { tenantId: apexTenant.id },
    update: {},
    create: {
      tenantId: apexTenant.id,
      industry: 'dental',
      legalName: 'Apex Dental Spa PLLC',
      address: '3400 N Lamar Blvd, Suite 210',
      city: 'Austin',
      state: 'TX',
      postalCode: '78705',
      phone: '(512) 555-0188',
      website: 'https://apexdentalspa.com',
      emergencyContactProtocol: 'For acute emergencies call (512) 555-0188 or visit Dell Seton ER.',
      description: 'Modern, boutique dental clinic specializing in preventive, cosmetic, and restorative dentistry.',
      onboardingCompleted: true,
    },
  });

  // Operating Hours for Apex
  const apexHours = [
    { dayOfWeek: 0, openTime: '00:00', closeTime: '00:00', isClosed: true },  // Sun
    { dayOfWeek: 1, openTime: '08:00', closeTime: '17:00', isClosed: false }, // Mon
    { dayOfWeek: 2, openTime: '08:00', closeTime: '17:00', isClosed: false }, // Tue
    { dayOfWeek: 3, openTime: '08:00', closeTime: '17:00', isClosed: false }, // Wed
    { dayOfWeek: 4, openTime: '08:00', closeTime: '17:00', isClosed: false }, // Thu
    { dayOfWeek: 5, openTime: '08:00', closeTime: '16:00', isClosed: false }, // Fri
    { dayOfWeek: 6, openTime: '09:00', closeTime: '13:00', isClosed: false }, // Sat
  ];

  for (const h of apexHours) {
    await prisma.businessHour.upsert({
      where: {
        tenantId_dayOfWeek: {
          tenantId: apexTenant.id,
          dayOfWeek: h.dayOfWeek,
        },
      },
      update: {},
      create: {
        tenantId: apexTenant.id,
        ...h,
      },
    });
  }

  // Booking Policy for Apex
  await prisma.bookingPolicy.upsert({
    where: { tenantId: apexTenant.id },
    update: {},
    create: {
      tenantId: apexTenant.id,
      minNoticeHours: 2,
      maxAdvanceDays: 60,
      cancellationNoticeHours: 24,
      bufferBetweenSlotsMinutes: 10,
      requirePhone: true,
      requireEmail: true,
      requireReason: true,
    },
  });

  // Agent Configuration for Apex
  await prisma.agentConfiguration.upsert({
    where: { tenantId: apexTenant.id },
    update: {},
    create: {
      tenantId: apexTenant.id,
      agentName: 'Sarah',
      tone: 'PROFESSIONAL',
      greetingMessage: `Hello! Welcome to Apex Dental Spa in Austin. I'm Sarah, your virtual assistant. How can I assist you with your smile today?`,
      customInstructions: 'Provide friendly, reassuring dental guidance. Guide patients into routine checkups, cleanings, and whitening consultations. Strictly follow dental safety rules.',
      emergencyEscalationNumber: '(512) 555-0188',
      humanHandoffEmail: 'care@apexdentalspa.com',
      allowPriceQuoting: true,
      isEnabled: true,
    },
  });

  // Knowledge Documents for Apex
  await prisma.knowledgeDocument.createMany({
    data: [
      {
        tenantId: apexTenant.id,
        title: 'Dental Insurances & Payment Plans',
        category: 'INSURANCE',
        content: 'We are in-network with Delta Dental Premier, Cigna Total DPPO, MetLife PDP Plus, and Guardian. We also accept HSA/FSA cards and offer 0% interest financing through CareCredit.',
      },
      {
        tenantId: apexTenant.id,
        title: 'Location & Parking Directions',
        category: 'LOCATION',
        content: 'We are located on the second floor of the Lamar Medical Center (Suite 210). Patients receive 2 hours of complimentary garage parking with ticket validation at reception.',
      },
      {
        tenantId: apexTenant.id,
        title: 'Cancellation and Rescheduling Policy',
        category: 'POLICY',
        content: 'We kindly request at least 24 hours advance notice for appointment changes or cancellations. Same-day cancellations may incur a $50 fee.',
      },
    ],
  });

  // Staff Members for Apex
  const drLin = await prisma.staffMember.create({
    data: {
      tenantId: apexTenant.id,
      name: 'Dr. Sarah Lin, DDS',
      email: 'dr.lin@apexdentalspa.com',
      phone: '(512) 555-0188',
      title: 'Principal Cosmetic Dentist',
      isActive: true,
    },
  });

  const drVance = await prisma.staffMember.create({
    data: {
      tenantId: apexTenant.id,
      name: 'Dr. Marcus Vance, DMD',
      email: 'dr.vance@apexdentalspa.com',
      phone: '(512) 555-0189',
      title: 'Restorative & Implant Specialist',
      isActive: true,
    },
  });

  const elena = await prisma.staffMember.create({
    data: {
      tenantId: apexTenant.id,
      name: 'Elena Rostova, RDH',
      email: 'elena@apexdentalspa.com',
      phone: '(512) 555-0190',
      title: 'Lead Dental Hygienist',
      isActive: true,
    },
  });

  // Services for Apex
  const examService = await prisma.service.create({
    data: {
      tenantId: apexTenant.id,
      name: 'Comprehensive Dental Exam & 3D Imaging',
      description: 'Thorough examination by Dr. Lin or Dr. Vance, digital panoramic imaging, and personalized treatment plan.',
      durationMinutes: 45,
      bufferMinutes: 15,
      price: 120.0,
      category: 'preventative',
    },
  });

  const cleaningService = await prisma.service.create({
    data: {
      tenantId: apexTenant.id,
      name: 'Routine Ultrasonic Dental Cleaning',
      description: 'Gentle ultrasonic plaque removal, thorough prophylaxis polishing, and protective enamel treatment.',
      durationMinutes: 45,
      bufferMinutes: 15,
      price: 140.0,
      category: 'preventative',
    },
  });

  const whiteningService = await prisma.service.create({
    data: {
      tenantId: apexTenant.id,
      name: 'Philips Zoom! In-Office Whitening',
      description: 'Advanced blue LED light-accelerated professional whitening treatment. Up to 8 shades lighter in 60 minutes.',
      durationMinutes: 60,
      bufferMinutes: 15,
      price: 350.0,
      category: 'cosmetic',
    },
  });

  const compositeService = await prisma.service.create({
    data: {
      tenantId: apexTenant.id,
      name: 'Tooth-Colored Composite Restoration',
      description: 'Natural aesthetic resin filling restoring tooth structure, function, and appearance.',
      durationMinutes: 45,
      bufferMinutes: 15,
      price: 180.0,
      category: 'restorative',
    },
  });

  // Assign staff to services
  await prisma.staffMemberService.createMany({
    data: [
      { staffMemberId: drLin.id, serviceId: examService.id },
      { staffMemberId: drLin.id, serviceId: whiteningService.id },
      { staffMemberId: drVance.id, serviceId: examService.id },
      { staffMemberId: drVance.id, serviceId: compositeService.id },
      { staffMemberId: elena.id, serviceId: cleaningService.id },
    ],
  });

  // Subscription for Apex: Growth Plan
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  await prisma.subscription.upsert({
    where: { tenantId: apexTenant.id },
    update: {},
    create: {
      tenantId: apexTenant.id,
      planId: growthPlan.id,
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      stripeCustomerId: 'cus_apex_sample',
      stripeSubscriptionId: 'sub_apex_sample',
    },
  });

  // Sample Customers
  const customerAlice = await prisma.customer.create({
    data: {
      tenantId: apexTenant.id,
      name: 'Alice Walker',
      email: 'alice.walker@example.com',
      phone: '(512) 555-1011',
      isExistingPatient: true,
      totalAppointments: 2,
    },
  });

  const customerMichael = await prisma.customer.create({
    data: {
      tenantId: apexTenant.id,
      name: 'Michael Chang',
      email: 'michael.chang@example.com',
      phone: '(512) 555-1022',
      isExistingPatient: false,
      totalAppointments: 1,
    },
  });

  // Upcoming Appointments
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setUTCHours(14, 0, 0, 0); // 9:00 AM Central

  const tomorrowEnd = new Date(tomorrow.getTime() + 45 * 60 * 1000);

  await prisma.appointment.create({
    data: {
      tenantId: apexTenant.id,
      customerId: customerAlice.id,
      serviceId: cleaningService.id,
      staffMemberId: elena.id,
      startTime: tomorrow,
      endTime: tomorrowEnd,
      status: 'CONFIRMED',
      notes: 'Patient prefers warm water rinse for sensitive gums.',
      bookedVia: 'AI_WIDGET',
    },
  });

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setUTCHours(16, 0, 0, 0); // 11:00 AM Central
  const dayAfterEnd = new Date(dayAfter.getTime() + 60 * 60 * 1000);

  await prisma.appointment.create({
    data: {
      tenantId: apexTenant.id,
      customerId: customerMichael.id,
      serviceId: whiteningService.id,
      staffMemberId: drLin.id,
      startTime: dayAfter,
      endTime: dayAfterEnd,
      status: 'CONFIRMED',
      notes: 'First time teeth whitening. Booked through virtual assistant.',
      bookedVia: 'AI_WIDGET',
    },
  });

  // Usage Record
  const currentPeriod = new Date().toISOString().substring(0, 7);
  await prisma.usageRecord.create({
    data: {
      tenantId: apexTenant.id,
      period: currentPeriod,
      conversationCount: 142,
      appointmentCount: 28,
    },
  });

  // 4. Create Tenant 2: SmileCraft Dentistry (London, UK) for Multi-Tenant Isolation Testing
  const ukOwnerPasswordHash = await bcrypt.hash('LondonDental123!', 10);
  const drSmithUser = await prisma.user.upsert({
    where: { email: 'dr.smith@smilecraft.co.uk' },
    update: {},
    create: {
      email: 'dr.smith@smilecraft.co.uk',
      passwordHash: ukOwnerPasswordHash,
      fullName: 'Dr. Arthur Smith, BDS',
      isPlatformAdmin: false,
      emailVerified: true,
    },
  });

  const ukTenant = await prisma.tenant.upsert({
    where: { slug: 'smilecraft-london' },
    update: {},
    create: {
      slug: 'smilecraft-london',
      name: 'SmileCraft Dentistry London',
      status: 'ACTIVE',
      timeZone: 'Europe/London',
      currency: 'GBP',
      country: 'GB',
    },
  });

  await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId: ukTenant.id,
        userId: drSmithUser.id,
      },
    },
    update: {},
    create: {
      tenantId: ukTenant.id,
      userId: drSmithUser.id,
      role: 'OWNER',
    },
  });

  await prisma.businessProfile.upsert({
    where: { tenantId: ukTenant.id },
    update: {},
    create: {
      tenantId: ukTenant.id,
      industry: 'dental',
      legalName: 'SmileCraft Dental Care Ltd',
      address: '45 Harley Street',
      city: 'London',
      state: 'Greater London',
      postalCode: 'W1G 8QT',
      phone: '+44 20 7946 0912',
      website: 'https://smilecraft.co.uk',
      onboardingCompleted: true,
    },
  });

  await prisma.subscription.upsert({
    where: { tenantId: ukTenant.id },
    update: {},
    create: {
      tenantId: ukTenant.id,
      planId: starterPlan.id,
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });

  console.log('[SEED] Database seeded successfully!');
  console.log('--- DEMO CREDENTIALS ---');
  console.log('Super-Admin: admin@receptionai.com / AdminPassword123!');
  console.log('Dental Owner (US): dr.lin@apexdentalspa.com / DentalOwner123! (Tenant: apex-dental-spa)');
  console.log('Dental Owner (UK): dr.smith@smilecraft.co.uk / LondonDental123! (Tenant: smilecraft-london)');
  console.log('------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
