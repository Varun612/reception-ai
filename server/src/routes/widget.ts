import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { chatRateLimiter } from '../middleware/rateLimiter.js';
import { AgentEngine } from '../services/agentEngine.js';
import { BookingEngine, BookingConflictError } from '../services/bookingEngine.js';
import { BillingService } from '../services/billingService.js';

const router = Router();

/**
 * GET /api/widget/:tenantSlug/config
 * Public configuration endpoint for website chat widget.
 */
router.get('/:tenantSlug/config', async (req: Request, res: Response) => {
  const { tenantSlug } = req.params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    include: {
      agentConfiguration: true,
      businessProfile: true,
      services: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          durationMinutes: true,
          price: true,
          displayPrice: true,
          category: true,
        },
      },
    },
  });

  if (!tenant || tenant.status !== 'ACTIVE') {
    return res.status(404).json({ error: 'Receptionist widget not found or inactive for this business.' });
  }

  const agentConfig = tenant.agentConfiguration || {
    agentName: 'Sarah',
    greetingMessage: `Hello! Welcome to ${tenant.name}. How can I help you today?`,
    tone: 'PROFESSIONAL',
    isEnabled: true,
  };

  return res.json({
    businessName: tenant.name,
    slug: tenant.slug,
    timeZone: tenant.timeZone,
    agentName: agentConfig.agentName,
    greetingMessage: agentConfig.greetingMessage,
    tone: agentConfig.tone,
    isEnabled: agentConfig.isEnabled,
    phone: tenant.businessProfile?.phone,
    address: tenant.businessProfile?.address,
    services: tenant.services,
  });
});

/**
 * POST /api/widget/:tenantSlug/chat
 * Public widget chat message endpoint (rate-limited, usage-metered).
 */
router.post('/:tenantSlug/chat', chatRateLimiter, async (req: Request, res: Response) => {
  try {
    const { tenantSlug } = req.params;
    const { message, conversationId, customerEmail, customerName } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant || tenant.status !== 'ACTIVE') {
      return res.status(404).json({ error: 'Business receptionist is currently offline.' });
    }

    // Check plan conversation quota
    const quotaCheck = await BillingService.checkConversationQuota(tenant.id);
    if (!quotaCheck.allowed) {
      return res.status(403).json({
        error: 'This business has temporarily reached its monthly conversation limit. Please call the front desk directly.',
      });
    }

    // Increment usage
    await BillingService.recordConversationUsage(tenant.id);

    // Process message through AI Agent Engine
    const response = await AgentEngine.processMessage({
      tenantId: tenant.id,
      conversationId,
      message,
      customerEmail,
      customerName,
      channel: 'WEB_WIDGET',
    });

    return res.json(response);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error processing chat message' });
  }
});

/**
 * GET /api/widget/:tenantSlug/availability
 * Public slot lookup for widget.
 */
router.get('/:tenantSlug/availability', async (req: Request, res: Response) => {
  try {
    const { tenantSlug } = req.params;
    const { serviceId, date } = req.query;

    if (!serviceId || !date) {
      return res.status(400).json({ error: 'serviceId and date (YYYY-MM-DD) are required.' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }

    const result = await BookingEngine.getAvailableSlots(tenant.id, serviceId as string, date as string);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/widget/:tenantSlug/book
 * Direct booking from widget booking form modal.
 */
router.post('/:tenantSlug/book', async (req: Request, res: Response) => {
  try {
    const { tenantSlug } = req.params;
    const {
      serviceId,
      startTime,
      customerName,
      customerEmail,
      customerPhone,
      notes,
      chiefComplaint,
      patientType,
      insuranceProvider,
      specialAccommodations,
      dateOfBirth,
      sessionMetadata,
      sessionId,
    } = req.body;

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }

    const appointment = await BookingEngine.bookAppointment({
      tenantId: tenant.id,
      serviceId,
      startTime,
      customerName,
      customerEmail,
      customerPhone,
      notes,
      chiefComplaint,
      patientType,
      insuranceProvider,
      specialAccommodations,
      dateOfBirth,
      sessionMetadata: typeof sessionMetadata === 'object' ? JSON.stringify(sessionMetadata) : sessionMetadata,
      bookedVia: 'AI_WIDGET',
    });

    // Record telemetry event for customer journey tracking
    if (sessionId) {
      prisma.interactionTelemetry
        .create({
          data: {
            tenantId: tenant.id,
            sessionId,
            eventType: 'BOOKING_CONFIRMED',
            channel: 'WEB_WIDGET',
            customerEmail,
            customerPhone,
            appointmentId: appointment.id,
            metadata: JSON.stringify({
              serviceId,
              chiefComplaint,
              patientType,
              insuranceProvider,
            }),
          },
        })
        .catch(() => {});
    }

    return res.status(201).json({ success: true, appointment });
  } catch (err: any) {
    if (err instanceof BookingConflictError) {
      return res.status(409).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message || 'Failed to complete booking' });
  }
});

export default router;
