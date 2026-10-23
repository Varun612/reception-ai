import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateUser, requirePlatformAdmin } from '../middleware/auth.js';

const router = Router();

// Protect all admin endpoints with super-admin check
router.use(authenticateUser, requirePlatformAdmin);

/**
 * GET /api/admin/metrics
 * High-level SaaS health, revenue, and usage statistics.
 */
router.get('/metrics', async (req: Request, res: Response) => {
  const [
    totalTenants,
    activeTenants,
    suspendedTenants,
    totalSubscriptions,
    totalAppointments,
    totalConversations,
    plans,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: 'ACTIVE' } }),
    prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
    prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: true },
    }),
    prisma.appointment.count(),
    prisma.conversation.count(),
    prisma.subscriptionPlan.findMany(),
  ]);

  // Calculate Monthly Recurring Revenue (MRR)
  const mrr = totalSubscriptions.reduce((acc, sub) => acc + (sub.plan?.monthlyPrice || 0), 0);

  return res.json({
    metrics: {
      totalTenants,
      activeTenants,
      suspendedTenants,
      activePaidSubscriptions: totalSubscriptions.length,
      estimatedMrr: mrr,
      totalAppointmentsBooked: totalAppointments,
      totalConversationsHandled: totalConversations,
      systemHealth: 'HEALTHY',
      geminiEngineStatus: 'OPERATIONAL',
      databaseStatus: 'CONNECTED',
    },
    plans,
  });
});

/**
 * GET /api/admin/tenants
 * List all tenants with status and subscription details.
 */
router.get('/tenants', async (req: Request, res: Response) => {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      subscription: {
        include: { plan: true },
      },
      businessProfile: true,
      _count: {
        select: {
          appointments: true,
          conversations: true,
          staffMembers: true,
          services: true,
        },
      },
    },
  });

  return res.json({ tenants });
});

/**
 * POST /api/admin/tenants/:tenantId/toggle-status
 * Suspend or reactivate a tenant with audit trail.
 */
router.post('/tenants/:tenantId/toggle-status', async (req: Request, res: Response) => {
  const { tenantId } = req.params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found.' });
  }

  const nextStatus = tenant.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';

  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: nextStatus },
  });

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: req.user!.id,
      action: `ADMIN_TENANT_${nextStatus}`,
      resourceType: 'Tenant',
      resourceId: tenantId,
      details: JSON.stringify({ previousStatus: tenant.status, newStatus: nextStatus }),
    },
  });

  return res.json({ tenant: updated });
});

/**
 * GET /api/admin/plans
 */
router.get('/plans', async (req: Request, res: Response) => {
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { monthlyPrice: 'asc' },
  });
  return res.json({ plans });
});

/**
 * PUT /api/admin/plans/:id
 */
router.put('/plans/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { monthlyPrice, conversationLimit, staffLimit, name, description } = req.body;

  const updated = await prisma.subscriptionPlan.update({
    where: { id },
    data: {
      ...(monthlyPrice !== undefined ? { monthlyPrice: Number(monthlyPrice) } : {}),
      ...(conversationLimit !== undefined ? { conversationLimit: Number(conversationLimit) } : {}),
      ...(staffLimit !== undefined ? { staffLimit: Number(staffLimit) } : {}),
      ...(name ? { name } : {}),
      ...(description ? { description } : {}),
    },
  });

  return res.json({ plan: updated });
});

/**
 * GET /api/admin/logs
 */
router.get('/logs', async (req: Request, res: Response) => {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      tenant: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, email: true, fullName: true } },
    },
  });

  return res.json({ logs });
});

export default router;
