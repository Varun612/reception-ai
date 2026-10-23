import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authenticateUser, requireTenant, requireRole } from '../middleware/auth.js';

const router = Router();

const StaffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  title: z.string().optional(),
  assignedServiceIds: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/tenants/:tenantId/staff
 */
router.get('/:tenantId/staff', authenticateUser, requireTenant, async (req: Request, res: Response) => {
  const staff = await prisma.staffMember.findMany({
    where: { tenantId: req.tenant!.id },
    include: {
      assignedServices: {
        include: { service: true },
      },
    },
  });
  return res.json({ staff });
});

/**
 * POST /api/tenants/:tenantId/staff
 */
router.post('/:tenantId/staff', authenticateUser, requireTenant, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const data = StaffSchema.parse(req.body);
    const tenantId = req.tenant!.id;

    // Check staff count vs subscription limit
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (subscription) {
      const currentStaffCount = await prisma.staffMember.count({
        where: { tenantId, isActive: true },
      });
      if (currentStaffCount >= subscription.plan.staffLimit) {
        return res.status(403).json({
          error: `Your current plan (${subscription.plan.name}) allows up to ${subscription.plan.staffLimit} staff members. Please upgrade to Pro for higher limits.`,
        });
      }
    }

    const staffMember = await prisma.staffMember.create({
      data: {
        tenantId,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        title: data.title || null,
        isActive: data.isActive,
      },
    });

    if (data.assignedServiceIds && data.assignedServiceIds.length > 0) {
      for (const serviceId of data.assignedServiceIds) {
        await prisma.staffMemberService.create({
          data: {
            staffMemberId: staffMember.id,
            serviceId,
          },
        });
      }
    }

    return res.status(201).json({ staffMember });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Validation failed' });
  }
});

/**
 * DELETE /api/tenants/:tenantId/staff/:id
 */
router.delete('/:tenantId/staff/:id', authenticateUser, requireTenant, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.staffMember.findFirst({
    where: { id, tenantId: req.tenant!.id },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Staff member not found.' });
  }

  await prisma.staffMember.update({
    where: { id },
    data: { isActive: false },
  });

  return res.json({ success: true, message: 'Staff member deactivated.' });
});

export default router;
