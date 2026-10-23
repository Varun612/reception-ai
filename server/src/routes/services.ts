import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authenticateUser, requireTenant, requireRole } from '../middleware/auth.js';

const router = Router();

const ServiceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  durationMinutes: z.number().int().min(10).max(480),
  bufferMinutes: z.number().int().min(0).max(120).default(10),
  price: z.number().min(0).default(0),
  displayPrice: z.boolean().default(true),
  requiresDeposit: z.boolean().default(false),
  depositAmount: z.number().min(0).default(0),
  category: z.string().default('general'),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/tenants/:tenantId/services
 */
router.get('/:tenantId/services', authenticateUser, requireTenant, async (req: Request, res: Response) => {
  const services = await prisma.service.findMany({
    where: { tenantId: req.tenant!.id },
    orderBy: { createdAt: 'asc' },
    include: {
      staffAssignments: {
        include: { staffMember: true },
      },
    },
  });
  return res.json({ services });
});

/**
 * POST /api/tenants/:tenantId/services
 */
router.post('/:tenantId/services', authenticateUser, requireTenant, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const data = ServiceSchema.parse(req.body);
    const service = await prisma.service.create({
      data: {
        tenantId: req.tenant!.id,
        ...data,
      },
    });
    return res.status(201).json({ service });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Validation failed' });
  }
});

/**
 * PUT /api/tenants/:tenantId/services/:id
 */
router.put('/:tenantId/services/:id', authenticateUser, requireTenant, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = ServiceSchema.partial().parse(req.body);

    const existing = await prisma.service.findFirst({
      where: { id, tenantId: req.tenant!.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    const updated = await prisma.service.update({
      where: { id },
      data,
    });

    return res.json({ service: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Update failed' });
  }
});

/**
 * DELETE /api/tenants/:tenantId/services/:id
 */
router.delete('/:tenantId/services/:id', authenticateUser, requireTenant, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.service.findFirst({
    where: { id, tenantId: req.tenant!.id },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Service not found.' });
  }

  // Soft delete by marking inactive
  await prisma.service.update({
    where: { id },
    data: { isActive: false },
  });

  return res.json({ success: true, message: 'Service deactivated successfully' });
});

export default router;
