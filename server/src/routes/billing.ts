import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateUser, requireTenant, requireRole } from '../middleware/auth.js';
import { BillingService } from '../services/billingService.js';
import { config } from '../config.js';

const router = Router();

/**
 * GET /api/tenants/:tenantId/billing
 * Current plan, trial status, usage meters, and available upgrade tiers.
 */
router.get('/:tenantId/billing', authenticateUser, requireTenant, async (req: Request, res: Response) => {
  const tenantId = req.tenant!.id;
  const currentPeriod = new Date().toISOString().substring(0, 7);

  const [subscription, usage, plans, staffCount] = await Promise.all([
    prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    }),
    prisma.usageRecord.findUnique({
      where: {
        tenantId_period: {
          tenantId,
          period: currentPeriod,
        },
      },
    }),
    prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: 'asc' },
    }),
    prisma.staffMember.count({
      where: { tenantId, isActive: true },
    }),
  ]);

  return res.json({
    subscription,
    usage: {
      period: currentPeriod,
      conversations: usage?.conversationCount || 0,
      conversationLimit: subscription?.plan.conversationLimit || 250,
      appointments: usage?.appointmentCount || 0,
      staffCount,
      staffLimit: subscription?.plan.staffLimit || 3,
    },
    availablePlans: plans.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      monthlyPrice: p.monthlyPrice,
      conversationLimit: p.conversationLimit,
      staffLimit: p.staffLimit,
      features: JSON.parse(p.features || '[]'),
    })),
  });
});

/**
 * POST /api/tenants/:tenantId/billing/checkout
 * Initiate checkout for plan upgrade.
 */
router.post('/:tenantId/billing/checkout', authenticateUser, requireTenant, requireRole(['OWNER']), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant!.id;
    const { planCode } = req.body;

    if (!planCode) {
      return res.status(400).json({ error: 'planCode is required (starter, growth, or pro).' });
    }

    const session = await BillingService.createCheckoutSession({
      tenantId,
      planCode,
      successUrl: `${config.clientUrl}/dashboard/billing`,
      cancelUrl: `${config.clientUrl}/dashboard/billing`,
    });

    return res.json(session);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Checkout failed' });
  }
});

/**
 * POST /api/billing/webhook
 * Public Stripe webhook endpoint.
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const result = await BillingService.handleWebhookEvent(req.body, signature);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Webhook error' });
  }
});

export default router;
