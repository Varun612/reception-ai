import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateUser, requireTenant, requireRole } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/tenants/:tenantId
 * Retrieve tenant profile, business hours, and agent status.
 */
router.get('/:tenantId', authenticateUser, requireTenant, async (req: Request, res: Response) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.tenant!.id },
    include: {
      businessProfile: true,
      agentConfiguration: true,
      bookingPolicy: true,
      businessHours: { orderBy: { dayOfWeek: 'asc' } },
      subscription: { include: { plan: true } },
    },
  });

  return res.json({ tenant });
});

/**
 * GET /api/tenants/:tenantId/overview
 * Real-time dashboard KPI metrics and health.
 */
router.get('/:tenantId/overview', authenticateUser, requireTenant, async (req: Request, res: Response) => {
  const tenantId = req.tenant!.id;
  const now = new Date();

  const [
    totalAppointments,
    upcomingAppointments,
    completedAppointments,
    cancelledAppointments,
    totalConversations,
    escalatedConversations,
    servicesCount,
    staffCount,
    recentAppointments,
  ] = await Promise.all([
    prisma.appointment.count({ where: { tenantId } }),
    prisma.appointment.count({
      where: {
        tenantId,
        startTime: { gte: now },
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
    }),
    prisma.appointment.count({ where: { tenantId, status: 'COMPLETED' } }),
    prisma.appointment.count({ where: { tenantId, status: 'CANCELLED' } }),
    prisma.conversation.count({ where: { tenantId } }),
    prisma.conversation.count({ where: { tenantId, status: 'ESCALATED' } }),
    prisma.service.count({ where: { tenantId, isActive: true } }),
    prisma.staffMember.count({ where: { tenantId, isActive: true } }),
    prisma.appointment.findMany({
      where: { tenantId },
      orderBy: { startTime: 'desc' },
      take: 5,
      include: {
        service: true,
        customer: true,
        staffMember: true,
      },
    }),
  ]);

  const conversionRate = totalConversations > 0
    ? Math.round((totalAppointments / totalConversations) * 100)
    : 0;

  return res.json({
    metrics: {
      totalAppointments,
      upcomingAppointments,
      completedAppointments,
      cancelledAppointments,
      totalConversations,
      escalatedConversations,
      conversionRate,
      activeServices: servicesCount,
      activeStaff: staffCount,
    },
    recentAppointments,
  });
});

/**
 * PUT /api/tenants/:tenantId/onboarding
 * Completes the 6-step intelligent onboarding wizard.
 */
router.put('/:tenantId/onboarding', authenticateUser, requireTenant, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  const tenantId = req.tenant!.id;
  const { profile, services, policies, agent, hours } = req.body;

  await prisma.$transaction(async (tx) => {
    // 1. Update Profile
    if (profile) {
      await tx.businessProfile.upsert({
        where: { tenantId },
        update: {
          industry: profile.industry || 'dental',
          legalName: profile.legalName,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          postalCode: profile.postalCode,
          phone: profile.phone,
          website: profile.website,
          emergencyContactProtocol: profile.emergencyContactProtocol,
          description: profile.description,
          onboardingCompleted: true,
        },
        create: {
          tenantId,
          industry: profile.industry || 'dental',
          legalName: profile.legalName,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          postalCode: profile.postalCode,
          phone: profile.phone,
          website: profile.website,
          emergencyContactProtocol: profile.emergencyContactProtocol,
          description: profile.description,
          onboardingCompleted: true,
        },
      });

      if (profile.name) {
        await tx.tenant.update({
          where: { id: tenantId },
          data: {
            name: profile.name,
            timeZone: profile.timeZone || 'America/Chicago',
            status: 'ACTIVE',
          },
        });
      }
    }

    // 2. Update Operating Hours
    if (Array.isArray(hours) && hours.length > 0) {
      for (const h of hours) {
        await tx.businessHour.upsert({
          where: {
            tenantId_dayOfWeek: {
              tenantId,
              dayOfWeek: h.dayOfWeek,
            },
          },
          update: {
            openTime: h.openTime,
            closeTime: h.closeTime,
            isClosed: h.isClosed,
          },
          create: {
            tenantId,
            dayOfWeek: h.dayOfWeek,
            openTime: h.openTime,
            closeTime: h.closeTime,
            isClosed: h.isClosed,
          },
        });
      }
    }

    // 3. Update Booking Policies
    if (policies) {
      await tx.bookingPolicy.upsert({
        where: { tenantId },
        update: {
          minNoticeHours: policies.minNoticeHours || 2,
          maxAdvanceDays: policies.maxAdvanceDays || 60,
          cancellationNoticeHours: policies.cancellationNoticeHours || 24,
          bufferBetweenSlotsMinutes: policies.bufferBetweenSlotsMinutes || 10,
        },
        create: {
          tenantId,
          minNoticeHours: policies.minNoticeHours || 2,
          maxAdvanceDays: policies.maxAdvanceDays || 60,
          cancellationNoticeHours: policies.cancellationNoticeHours || 24,
          bufferBetweenSlotsMinutes: policies.bufferBetweenSlotsMinutes || 10,
        },
      });
    }

    // 4. Update Agent Configuration
    if (agent) {
      await tx.agentConfiguration.upsert({
        where: { tenantId },
        update: {
          agentName: agent.agentName || 'Sarah',
          tone: agent.tone || 'PROFESSIONAL',
          greetingMessage: agent.greetingMessage,
          customInstructions: agent.customInstructions,
          emergencyEscalationNumber: agent.emergencyEscalationNumber,
          humanHandoffEmail: agent.humanHandoffEmail,
          allowPriceQuoting: agent.allowPriceQuoting !== false,
          isEnabled: true,
        },
        create: {
          tenantId,
          agentName: agent.agentName || 'Sarah',
          tone: agent.tone || 'PROFESSIONAL',
          greetingMessage: agent.greetingMessage,
          customInstructions: agent.customInstructions,
          emergencyEscalationNumber: agent.emergencyEscalationNumber,
          humanHandoffEmail: agent.humanHandoffEmail,
          allowPriceQuoting: agent.allowPriceQuoting !== false,
          isEnabled: true,
        },
      });
    }
  });

  return res.json({ success: true, message: 'Onboarding completed and agent activated!' });
});

/**
 * PUT /api/tenants/:tenantId/settings
 * General settings update.
 */
router.put('/:tenantId/settings', authenticateUser, requireTenant, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  const tenantId = req.tenant!.id;
  const { name, timeZone, profile } = req.body;

  if (name || timeZone) {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(name ? { name } : {}),
        ...(timeZone ? { timeZone } : {}),
      },
    });
  }

  if (profile) {
    await prisma.businessProfile.update({
      where: { tenantId },
      data: profile,
    });
  }

  return res.json({ success: true, message: 'Settings updated successfully' });
});

export default router;
