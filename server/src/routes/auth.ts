import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { authenticateUser } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2),
  businessName: z.string().min(2),
  industry: z.string().default('dental'),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * POST /api/auth/register
 * Creates User, provisions isolated Tenant, assigns OWNER role, sets up default dental clinic profile & hours.
 */
router.post('/register', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const data = RegisterSchema.parse(req.body);
    const normalizedEmail = data.email.trim().toLowerCase();

    // Check existing user
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const slug = data.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .concat('-', Math.random().toString(36).substring(2, 6));

    // Ensure Starter plan exists
    let starterPlan = await prisma.subscriptionPlan.findUnique({
      where: { code: 'starter' },
    });

    if (!starterPlan) {
      starterPlan = await prisma.subscriptionPlan.create({
        data: {
          code: 'starter',
          name: 'Starter Tier',
          description: 'Perfect for single-location clinics getting started with AI reception.',
          monthlyPrice: 49,
          conversationLimit: 250,
          staffLimit: 3,
          features: JSON.stringify(['AI Web Chat Receptionist', 'Automated Slot Booking', '250 Conversations/mo', '1 Location']),
        },
      });
    }

    // Provision User & Tenant in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          fullName: data.fullName,
          isPlatformAdmin: false,
          emailVerified: true,
        },
      });

      // 2. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: data.businessName,
          slug,
          timeZone: 'America/Chicago',
          currency: 'USD',
          country: 'US',
          status: 'ONBOARDING',
        },
      });

      // 3. Assign Membership as OWNER
      await tx.tenantMembership.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: 'OWNER',
        },
      });

      // 4. Create Business Profile
      await tx.businessProfile.create({
        data: {
          tenantId: tenant.id,
          industry: data.industry,
          address: '100 Medical Parkway, Suite 200',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          phone: '(512) 555-0199',
          website: 'https://example.com',
          emergencyContactProtocol: 'For acute emergencies call 911 or visit St. David’s ER.',
          description: `Premier ${data.industry} clinic providing compassionate, modern care.`,
          onboardingCompleted: false,
        },
      });

      // 5. Create Default Operating Hours (Mon-Fri 8am-5pm, Sat 9am-1pm, Sun closed)
      const hoursConfig = [
        { dayOfWeek: 0, openTime: '00:00', closeTime: '00:00', isClosed: true }, // Sun
        { dayOfWeek: 1, openTime: '08:00', closeTime: '17:00', isClosed: false }, // Mon
        { dayOfWeek: 2, openTime: '08:00', closeTime: '17:00', isClosed: false }, // Tue
        { dayOfWeek: 3, openTime: '08:00', closeTime: '17:00', isClosed: false }, // Wed
        { dayOfWeek: 4, openTime: '08:00', closeTime: '17:00', isClosed: false }, // Thu
        { dayOfWeek: 5, openTime: '08:00', closeTime: '16:00', isClosed: false }, // Fri
        { dayOfWeek: 6, openTime: '09:00', closeTime: '13:00', isClosed: false }, // Sat
      ];

      for (const h of hoursConfig) {
        await tx.businessHour.create({
          data: {
            tenantId: tenant.id,
            ...h,
          },
        });
      }

      // 6. Create Booking Policy
      await tx.bookingPolicy.create({
        data: {
          tenantId: tenant.id,
          minNoticeHours: 2,
          maxAdvanceDays: 60,
          cancellationNoticeHours: 24,
          bufferBetweenSlotsMinutes: 10,
          requirePhone: true,
          requireEmail: true,
          requireReason: true,
        },
      });

      // 7. Create AI Receptionist Config
      await tx.agentConfiguration.create({
        data: {
          tenantId: tenant.id,
          agentName: 'Sarah',
          tone: 'PROFESSIONAL',
          greetingMessage: `Hello! Welcome to ${data.businessName}. I'm Sarah, your virtual assistant. How can I assist you with your dental care today?`,
          customInstructions: 'Always be courteous, answer clinic questions, check availability, and help patients book appointments.',
          emergencyEscalationNumber: '(512) 555-0199 / 911',
          humanHandoffEmail: normalizedEmail,
          allowPriceQuoting: true,
          isEnabled: true,
        },
      });

      // 8. Create Starter Dental Services
      const servicesToCreate = [
        {
          name: 'Comprehensive Dental Exam & Consult',
          description: 'Full-mouth oral examination, digital low-radiation X-rays, and customized treatment plan.',
          durationMinutes: 45,
          bufferMinutes: 15,
          price: 99.0,
          category: 'preventative',
        },
        {
          name: 'Routine Hygiene & Teeth Cleaning',
          description: 'Thorough plaque and tartar removal, polishing, and preventive fluoride treatment.',
          durationMinutes: 45,
          bufferMinutes: 15,
          price: 120.0,
          category: 'preventative',
        },
        {
          name: 'Professional Teeth Whitening',
          description: 'In-office professional LED whitening treatment delivering 6-8 shades brighter smile.',
          durationMinutes: 60,
          bufferMinutes: 15,
          price: 299.0,
          category: 'cosmetic',
        },
      ];

      for (const s of servicesToCreate) {
        await tx.service.create({
          data: {
            tenantId: tenant.id,
            ...s,
          },
        });
      }

      // 9. Assign 14-day Free Trial on Starter plan
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: starterPlan.id,
          status: 'TRIALING',
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
        },
      });

      return { user, tenant };
    });

    const token = jwt.sign({ userId: result.user.id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    return res.status(201).json({
      message: 'Account and workspace provisioned successfully.',
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        isPlatformAdmin: result.user.isPlatformAdmin,
      },
      tenant: {
        id: result.tenant.id,
        slug: result.tenant.slug,
        name: result.tenant.name,
        status: result.tenant.status,
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0]?.message || 'Validation failed' });
    }
    return res.status(500).json({ error: err.message || 'Failed to register account' });
  }
});

/**
 * POST /api/auth/login
 * Validates credentials and returns JWT with accessible tenants.
 */
router.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const data = LoginSchema.parse(req.body);
    const normalizedEmail = data.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        memberships: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    const tenants = user.memberships.map((m) => ({
      id: m.tenant.id,
      slug: m.tenant.slug,
      name: m.tenant.name,
      role: m.role,
      status: m.tenant.status,
    }));

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isPlatformAdmin: user.isPlatformAdmin,
      },
      tenants,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0]?.message || 'Validation failed' });
    }
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

/**
 * GET /api/auth/me
 * Retrieves active user session and tenants.
 */
router.get('/me', authenticateUser, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      isPlatformAdmin: true,
      memberships: {
        include: {
          tenant: true,
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const tenants = user.memberships.map((m) => ({
    id: m.tenant.id,
    slug: m.tenant.slug,
    name: m.tenant.name,
    role: m.role,
    status: m.tenant.status,
  }));

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isPlatformAdmin: user.isPlatformAdmin,
    },
    tenants,
  });
});

export default router;
