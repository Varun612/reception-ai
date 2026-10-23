import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateUser, requireTenant, requireRole, requirePlatformAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/telemetry/event
 * Public ingestion endpoint for customer interaction touchpoints and click mitigation events.
 */
router.post('/event', async (req: Request, res: Response) => {
  try {
    const {
      tenantSlug,
      tenantId: directTenantId,
      sessionId,
      eventType,
      channel = 'WEB_WIDGET',
      customerEmail,
      customerPhone,
      deviceType,
      browser,
      os,
      screenResolution,
      referrer,
      timeSpentSeconds = 0,
      duplicateClicksMitigated = 0,
      metadata,
      appointmentId,
    } = req.body;

    if (!sessionId || !eventType) {
      return res.status(400).json({ error: 'sessionId and eventType are required' });
    }

    // Resolve tenantId
    let resolvedTenantId = directTenantId;
    if (!resolvedTenantId && tenantSlug) {
      const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
      if (tenant) resolvedTenantId = tenant.id;
    }

    if (!resolvedTenantId) {
      // Fallback: assign to first active tenant if demo
      const firstTenant = await prisma.tenant.findFirst({ where: { status: 'ACTIVE' } });
      resolvedTenantId = firstTenant?.id;
    }

    if (!resolvedTenantId) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const record = await prisma.interactionTelemetry.create({
      data: {
        tenantId: resolvedTenantId,
        sessionId,
        eventType,
        channel,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        deviceType: deviceType || 'Desktop',
        browser: browser || 'Unknown',
        os: os || 'Unknown',
        screenResolution: screenResolution || null,
        referrer: referrer || null,
        timeSpentSeconds: Number(timeSpentSeconds) || 0,
        duplicateClicksMitigated: Number(duplicateClicksMitigated) || 0,
        metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : metadata || null,
        appointmentId: appointmentId || null,
      },
    });

    return res.status(201).json({ success: true, telemetryId: record.id });
  } catch (err: any) {
    console.error('[Telemetry] Error recording event:', err);
    return res.status(500).json({ error: 'Failed to record telemetry' });
  }
});

/**
 * GET /api/tenants/:tenantId/telemetry
 * Vendor endpoint: Study end-to-end customer interaction metadata, funnel drop-offs,
 * and duplicate clicks prevented from hitting server.
 */
router.get(
  '/tenants/:tenantId/telemetry',
  authenticateUser,
  requireTenant,
  requireRole(['OWNER', 'ADMIN', 'RECEPTIONIST']),
  async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;

      const records = await prisma.interactionTelemetry.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
          appointment: {
            select: {
              id: true,
              startTime: true,
              status: true,
              service: { select: { name: true } },
            },
          },
        },
      });

      // Aggregate Metrics
      const totalSessions = new Set(records.map((r) => r.sessionId)).size;
      const idempSum = await prisma.idempotencyRecord.aggregate({
        where: { tenantId },
        _sum: { preventedCount: true },
      });
      const totalClicksMitigated =
        records.reduce((acc, r) => acc + r.duplicateClicksMitigated, 0) +
        (idempSum._sum.preventedCount || 0);
      const totalTime = records.reduce((acc, r) => acc + r.timeSpentSeconds, 0);
      const avgTimeSpentSeconds = records.length > 0 ? Math.round(totalTime / records.length) : 0;

      // Funnel Analysis
      const funnelCounts: Record<string, number> = {
        WIDGET_OPEN: 0,
        SERVICE_SELECT: 0,
        SLOT_SELECT: 0,
        DETAILS_INPUT: 0,
        BOOKING_CONFIRMED: 0,
      };

      records.forEach((r) => {
        if (funnelCounts[r.eventType] !== undefined) {
          funnelCounts[r.eventType]++;
        }
      });

      const confirmedBookings = funnelCounts.BOOKING_CONFIRMED || 0;
      const opens = funnelCounts.WIDGET_OPEN || (totalSessions > 0 ? totalSessions : 1);
      const conversionRate = Math.round((confirmedBookings / opens) * 100);

      // Device Breakdown
      const deviceBreakdown: Record<string, number> = { Desktop: 0, Mobile: 0, Tablet: 0 };
      records.forEach((r) => {
        const dev = r.deviceType || 'Desktop';
        deviceBreakdown[dev] = (deviceBreakdown[dev] || 0) + 1;
      });

      // Channel Breakdown
      const channelBreakdown: Record<string, number> = {};
      records.forEach((r) => {
        channelBreakdown[r.channel] = (channelBreakdown[r.channel] || 0) + 1;
      });

      return res.json({
        summary: {
          totalSessions,
          totalInteractions: records.length,
          totalClicksMitigated,
          avgTimeSpentSeconds,
          conversionRate,
          confirmedBookings,
          estimatedServerHitsSaved: totalClicksMitigated,
        },
        funnel: [
          { step: 'Widget Open / Interaction Started', count: Math.max(funnelCounts.WIDGET_OPEN, totalSessions) },
          { step: 'Service & Treatment Selected', count: funnelCounts.SERVICE_SELECT },
          { step: 'Calendar Slot Picked', count: funnelCounts.SLOT_SELECT },
          { step: 'Patient Details Completed', count: funnelCounts.DETAILS_INPUT },
          { step: 'Appointment Confirmed & Dispatched', count: funnelCounts.BOOKING_CONFIRMED },
        ],
        deviceBreakdown,
        channelBreakdown,
        recentSessions: records.slice(0, 50).map((r) => ({
          id: r.id,
          sessionId: r.sessionId,
          eventType: r.eventType,
          channel: r.channel,
          customerEmail: r.customerEmail,
          customerPhone: r.customerPhone,
          deviceType: r.deviceType,
          browser: r.browser,
          os: r.os,
          timeSpentSeconds: r.timeSpentSeconds,
          duplicateClicksMitigated: r.duplicateClicksMitigated,
          metadata: r.metadata ? JSON.parse(r.metadata) : null,
          appointment: r.appointment,
          createdAt: r.createdAt,
        })),
      });
    } catch (err: any) {
      console.error('[Telemetry] Failed to fetch vendor telemetry:', err);
      return res.status(500).json({ error: 'Failed to retrieve telemetry' });
    }
  }
);

/**
 * GET /api/admin/telemetry
 * Super-Admin endpoint: Study platform-wide duplicate click mitigations and session traffic.
 */
router.get('/admin/telemetry', authenticateUser, requirePlatformAdmin, async (req: Request, res: Response) => {
  try {
    const [allRecords, totalMitigatedRecords] = await Promise.all([
      prisma.interactionTelemetry.findMany({
        take: 500,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.idempotencyRecord.aggregate({
        _sum: { preventedCount: true },
        _count: { id: true },
      }),
    ]);

    const totalMitigatedFromIdempotency = totalMitigatedRecords._sum.preventedCount || 0;
    const totalMitigatedFromTelemetry = allRecords.reduce((acc, r) => acc + r.duplicateClicksMitigated, 0);
    const totalDuplicateClicksMitigated = totalMitigatedFromIdempotency + totalMitigatedFromTelemetry;

    const totalSessions = new Set(allRecords.map((r) => r.sessionId)).size;
    const estimatedBandwidthSavedKB = Math.round(totalDuplicateClicksMitigated * 2.8); // avg 2.8 KB per HTTP request roundtrip

    // Breakdown per tenant
    const tenantMap: Record<string, { name: string; slug: string; mitigated: number; sessions: number }> = {};
    allRecords.forEach((r) => {
      const tid = r.tenantId;
      if (!tenantMap[tid]) {
        tenantMap[tid] = {
          name: r.tenant?.name || 'Clinic',
          slug: r.tenant?.slug || '',
          mitigated: 0,
          sessions: 0,
        };
      }
      tenantMap[tid].mitigated += r.duplicateClicksMitigated;
      tenantMap[tid].sessions++;
    });

    return res.json({
      summary: {
        totalDuplicateClicksMitigated,
        estimatedBandwidthSavedKB,
        totalPlatformSessions: totalSessions,
        totalTelemetryRecords: allRecords.length,
        totalIdempotentMutations: totalMitigatedRecords._count.id,
      },
      tenants: Object.values(tenantMap),
      recentEvents: allRecords.slice(0, 30).map((r) => ({
        id: r.id,
        tenantName: r.tenant?.name,
        eventType: r.eventType,
        channel: r.channel,
        duplicateClicksMitigated: r.duplicateClicksMitigated,
        deviceType: r.deviceType,
        browser: r.browser,
        timeSpentSeconds: r.timeSpentSeconds,
        metadata: r.metadata ? JSON.parse(r.metadata) : null,
        createdAt: r.createdAt,
      })),
    });
  } catch (err: any) {
    console.error('[Telemetry] Failed to fetch admin telemetry:', err);
    return res.status(500).json({ error: 'Failed to retrieve admin telemetry' });
  }
});

export default router;
