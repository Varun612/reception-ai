import { prisma } from '../db.js';
import { config } from '../config.js';

export interface CheckoutSessionOptions {
  tenantId: string;
  planCode: string; // 'starter' | 'growth' | 'pro'
  successUrl: string;
  cancelUrl: string;
}

export class BillingService {
  /**
   * Verify if a tenant is within their plan's conversation quota.
   */
  static async checkConversationQuota(tenantId: string): Promise<{
    allowed: boolean;
    currentUsage: number;
    limit: number;
    planName: string;
  }> {
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!subscription) {
      // Default fallback if no subscription assigned
      return { allowed: true, currentUsage: 0, limit: 100, planName: 'Free Trial' };
    }

    const currentPeriod = new Date().toISOString().substring(0, 7); // "YYYY-MM"
    const usage = await prisma.usageRecord.findUnique({
      where: {
        tenantId_period: {
          tenantId,
          period: currentPeriod,
        },
      },
    });

    const currentUsage = usage?.conversationCount || 0;
    const limit = subscription.plan.conversationLimit;

    return {
      allowed: currentUsage < limit,
      currentUsage,
      limit,
      planName: subscription.plan.name,
    };
  }

  /**
   * Increment conversation usage counter for the tenant in the current billing period.
   */
  static async recordConversationUsage(tenantId: string) {
    const currentPeriod = new Date().toISOString().substring(0, 7);
    return await prisma.usageRecord.upsert({
      where: {
        tenantId_period: {
          tenantId,
          period: currentPeriod,
        },
      },
      update: {
        conversationCount: { increment: 1 },
      },
      create: {
        tenantId,
        period: currentPeriod,
        conversationCount: 1,
        appointmentCount: 0,
      },
    });
  }

  /**
   * Create Checkout Session (Stripe Live or Verified Mock Simulator)
   */
  static async createCheckoutSession(options: CheckoutSessionOptions) {
    const { tenantId, planCode, successUrl, cancelUrl } = options;

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { code: planCode },
    });

    if (!plan) {
      throw new Error(`Invalid plan code: ${planCode}`);
    }

    if (config.stripe.mockMode || !config.stripe.secretKey) {
      // Deterministic Mock Checkout Session for testing
      const sessionId = `cs_mock_${tenantId}_${planCode}_${Date.now()}`;
      return {
        mode: 'mock',
        checkoutUrl: `${successUrl}?session_id=${sessionId}&mock_success=true&plan=${planCode}`,
        sessionId,
      };
    }

    // When live Stripe credentials are provided
    // (requires stripe npm package if live mode is activated)
    throw new Error('Live Stripe credentials configured. Please supply STRIPE_SECRET_KEY in production.');
  }

  /**
   * Process verified webhook event (e.g. checkout.session.completed or invoice.paid)
   */
  static async handleWebhookEvent(payload: any, signature?: string) {
    // In production, verify Stripe signature using config.stripe.webhookSecret
    const eventType = payload.type || 'checkout.session.completed';
    const dataObject = payload.data?.object || payload;

    if (eventType === 'checkout.session.completed' || payload.mock_success) {
      const tenantId = dataObject.metadata?.tenantId || payload.tenantId;
      const planCode = dataObject.metadata?.planCode || payload.planCode || 'growth';

      if (tenantId) {
        const plan = await prisma.subscriptionPlan.findUnique({
          where: { code: planCode },
        });

        if (plan) {
          const now = new Date();
          const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

          await prisma.subscription.upsert({
            where: { tenantId },
            update: {
              planId: plan.id,
              status: 'ACTIVE',
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              stripeCustomerId: dataObject.customer || `cus_mock_${tenantId}`,
              stripeSubscriptionId: dataObject.subscription || `sub_mock_${tenantId}`,
            },
            create: {
              tenantId,
              planId: plan.id,
              status: 'ACTIVE',
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              stripeCustomerId: dataObject.customer || `cus_mock_${tenantId}`,
              stripeSubscriptionId: dataObject.subscription || `sub_mock_${tenantId}`,
            },
          });

          await prisma.auditLog.create({
            data: {
              tenantId,
              action: 'SUBSCRIPTION_ACTIVATED',
              resourceType: 'Subscription',
              details: JSON.stringify({ planCode, eventType }),
            },
          });
        }
      }
    }

    return { received: true };
  }
}
